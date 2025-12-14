#!/usr/bin/env python3
"""
GPU-Accelerated Energy Feature Extraction with cuDF
Processes 2.3M permits on CUDA cores
"""
import cudf
import time
import psycopg2
from io import StringIO

CSV_PATH = "/home/asus/atx-hackathon/data/Issued_Construction_Permits_20251213.csv"
DB_URL = "postgresql://neondb_owner:npg_5M4WYbgyfJDa@ep-long-sky-ah0b88ws-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

print("=" * 60)
print("GPU EXTRACTION PIPELINE (cuDF/RAPIDS)")
print("=" * 60)

# Load to GPU
print("\nLoading CSV to GPU...")
start = time.time()
df = cudf.read_csv(CSV_PATH)
print(f"Loaded {len(df):,} rows in {time.time()-start:.1f}s")

# Clean column names
df.columns = [c.lower().replace(" ", "_").replace("-", "_") for c in df.columns]

# Drop rows without description or coordinates
print("\nCleaning data...")
df = df.dropna(subset=["description"])
if "latitude" in df.columns and "longitude" in df.columns:
    df = df.dropna(subset=["latitude", "longitude"])
print(f"After cleaning: {len(df):,} rows")

# GPU regex extraction - all run in parallel on CUDA cores
print("\nExtracting features on GPU...")
start = time.time()

# Convert to lowercase for case-insensitive matching (cuDF doesn't support (?i))
desc_lower = df["description"].str.lower()

# Solar installations
df["is_solar"] = desc_lower.str.contains(
    "solar|photovoltaic|pv system|pv array|pv panel", regex=True
)

# EV Charging
df["is_ev"] = desc_lower.str.contains(
    "ev charger|charging station|level 2|electric vehicle charg|wall connector|chargepoint", regex=True
)

# Battery Storage
df["has_battery"] = desc_lower.str.contains(
    "powerwall|battery storage|battery backup|energy storage|enphase battery", regex=True
)

# Generators
df["has_generator"] = desc_lower.str.contains(
    "generator|generac|kohler|standby power|backup power|cummins", regex=True
)

# Panel Upgrades
df["panel_upgrade"] = desc_lower.str.contains(
    "panel upgrade|service upgrade|200 amp|400 amp|electrical service upgrade|main panel", regex=True
)

# ADU (Accessory Dwelling Units)
df["is_adu"] = desc_lower.str.contains(
    "adu|accessory dwelling|guest house|granny flat|secondary dwelling", regex=True
)

print(f"Extraction done in {time.time()-start:.1f}s")

# Summary
print("\n" + "=" * 60)
print("RESULTS")
print("=" * 60)
print(f"Total permits: {len(df):,}")
print(f"Solar: {df['is_solar'].sum():,}")
print(f"EV Charging: {df['is_ev'].sum():,}")
print(f"Battery: {df['has_battery'].sum():,}")
print(f"Generator: {df['has_generator'].sum():,}")
print(f"Panel Upgrade: {df['panel_upgrade'].sum():,}")
print(f"ADU: {df['is_adu'].sum():,}")

# Filter to energy permits only
energy_mask = df["is_solar"] | df["is_ev"] | df["has_battery"] | df["has_generator"] | df["panel_upgrade"] | df["is_adu"]
energy_df = df[energy_mask]
print(f"\nTotal energy permits: {len(energy_df):,}")

# Save to parquet
print("\nSaving to parquet...")
start = time.time()
output_path = "/home/asus/atx-hackathon/output/energy_features_gpu.parquet"
energy_df.to_parquet(output_path)
print(f"Saved {len(energy_df):,} energy permits to {output_path} in {time.time()-start:.1f}s")

# Now push to Neon (only energy permits, not all 2.3M rows!)
print("\n" + "=" * 60)
print("PUSHING TO NEON DATABASE")
print("=" * 60)

# Convert FILTERED energy permits to pandas for psycopg2
print("Converting filtered energy permits to pandas...")
df_pandas = energy_df.to_pandas()

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

# Drop and recreate
print("Recreating table...")
cur.execute("DROP TABLE IF EXISTS construction_permits CASCADE")

# Get base columns (excluding energy features we added)
energy_cols = ["is_solar", "is_ev", "has_battery", "has_generator", "panel_upgrade", "is_adu"]
base_cols = [c for c in df_pandas.columns if c not in energy_cols]

# Create with all columns as TEXT + energy booleans
cols_parts = [f'"{c}" TEXT' for c in base_cols]
cols_parts.extend(["is_solar BOOLEAN", "is_ev BOOLEAN", "has_battery BOOLEAN",
                   "has_generator BOOLEAN", "panel_upgrade BOOLEAN", "is_adu BOOLEAN"])
cols_sql = ", ".join(cols_parts)
cur.execute(f"CREATE TABLE construction_permits ({cols_sql})")
conn.commit()

# COPY data
print("Loading via COPY...")
start = time.time()

buffer = StringIO()
df_pandas.to_csv(buffer, index=False, header=False)
buffer.seek(0)

all_cols = ", ".join([f'"{c}"' for c in df_pandas.columns])
cur.copy_expert(f"COPY construction_permits ({all_cols}) FROM STDIN WITH CSV", buffer)
conn.commit()

print(f"Loaded {len(df_pandas):,} rows to Neon in {time.time()-start:.1f}s")

# Final count
cur.execute("SELECT COUNT(*) FROM construction_permits WHERE is_solar OR is_ev OR has_battery OR has_generator OR panel_upgrade OR is_adu")
count = cur.fetchone()[0]
print(f"\nEnergy permits in Neon: {count:,}")

cur.close()
conn.close()

print("\n" + "=" * 60)
print("DONE!")
print("=" * 60)
