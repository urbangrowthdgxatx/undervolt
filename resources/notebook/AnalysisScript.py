# %%
import requests
import pandas as pd

# %%
BASE = "https://data.austintexas.gov/resource/3syk-w9eu.json"
params = {
    "$select": "permit_number, issue_date, status_current",
    "$limit": 2000,
    "$offset": 0,
    "$$app_token": "PASTE_YOUR_APP_TOKEN_HERE",  # optional but recommended
}

df = pd.read_json(BASE, params=params)
df.head()

# %%
import duckdb

# %%
CSV = "C:/Users/siddh/Downloads/Issued_Construction_Permits_20251212.csv"  

# Peek at rows
duckdb.query(f"""
    SELECT *
    FROM read_csv_auto('{CSV}')
    LIMIT 20
""").df()

# %% [markdown]
# ## Get a mix across years/types/status to see the variety.

# %%
q = f"""
SELECT
  permit_number,
  issue_date,
  calendar_year_issued,
  permit_type_desc,
  work_class,
  permit_class,
  description,
  permit_location,
  original_zip,
  status_current,
  total_job_valuation
FROM read_csv_auto('{CSV}')
WHERE description IS NOT NULL
ORDER BY random()
LIMIT 50
"""
review = duckdb.query(q).df()
review


# %%
duckdb.query(f"""
DESCRIBE SELECT * FROM read_csv_auto('{CSV}')
""").df()

# %%
duckdb.query(f"""
CREATE OR REPLACE VIEW permits AS
SELECT
  "Permit Type Desc"           AS permit_type_desc,
  "Permit Num"                 AS permit_number,
  "Permit Class Mapped"        AS permit_class_mapped,
  "Permit Type"                AS permittype,
  "Permit Class"               AS permit_class,
  "Work Class"                 AS work_class,
  "Condominium"                AS condominium,
  "Permit Location"            AS permit_location,
  "Description"                AS description,
  "TCAD ID"                    AS tcad_id,
  "Legal Description"          AS legal_description,
  "AppliedDate"                AS applieddate,
  "Issue Date"                 AS issue_date,
  "Day Issued"                 AS day_issued,
  "Calendar Year Issued"       AS calendar_year_issued,
  "Fiscal Year Issued"         AS fiscal_year_issued,
  "Issued in Last 30 Days"     AS issued_in_last_30_days,
  "Issue Method"               AS issue_method,
  "Status Current"             AS status_current,
  "StatusDate"                 AS statusdate,
  "ExpiresDate"                AS expiresdate,
  "Completed Date"             AS completed_date,
  "Total Existing Bldg SQFT"   AS total_existing_bldg_sqft,
  "Remodel Repair SQFT"        AS remodel_repair_sqft,
  "Total New Add SQFT"         AS total_new_add_sqft,
  "Total Job Valuation"        AS total_job_valuation,
  "Original Address1"          AS original_address1,
  "Original City"              AS original_city,
  "Original State"             AS original_state,
  "Original Zip"               AS original_zip,
  "Council District"           AS council_district,
  "Jurisdiction"               AS jurisdiction,
  "Latitude"                   AS latitude,
  "Longitude"                  AS longitude
FROM read_csv_auto('{CSV}')
""")

# %%
duckdb.query(f"""
CREATE OR REPLACE VIEW permits AS
SELECT
  "Permit Num"        AS permit_number,
  "Permit Type Desc"  AS permit_type_desc,
  "Permit Type"       AS permittype,
  "Permit Class"      AS permit_class,
  "Work Class"        AS work_class,
  "Description"       AS description
FROM read_csv_auto('{CSV}')
""")

# %%
duckdb.query("""
SELECT *
FROM permits
WHERE description IS NOT NULL
USING SAMPLE 20
""").df()


# %%
desc = duckdb.query(f"DESCRIBE SELECT * FROM read_csv_auto('{CSV}')").df()
desc[desc["column_name"].str.contains("Permit", case=False, na=False)].head(30)


# %%
desc = duckdb.query(f"DESCRIBE SELECT * FROM read_csv_auto('{CSV}')").df()
cols = desc["column_name"].tolist()

def find_cols(*needles):
    needles = [n.lower() for n in needles]
    return [c for c in cols if any(n in c.lower() for n in needles)]

find_cols("issue", "date", "status", "address", "city", "state", "zip", "lat", "lon", "location", "valuation", "work", "class", "description")


# %%
duckdb.query(f"""
CREATE OR REPLACE VIEW permits AS
SELECT
  "Permit Num"               AS permit_number,
  "Permit Type Desc"         AS permit_type_desc,
  "Permit Type"              AS permittype,
  "Permit Class"             AS permit_class,
  "Permit Class Mapped"      AS permit_class_mapped,
  "Work Class"               AS work_class,
  "Description"              AS description,

  "Applied Date"             AS applied_date,
  "Issued Date"              AS issued_date,
  "Day Issued"               AS day_issued,
  "Calendar Year Issued"     AS calendar_year_issued,
  "Fiscal Year Issued"       AS fiscal_year_issued,
  "Issued In Last 30 Days"   AS issued_in_last_30_days,

  "Status Current"           AS status_current,
  "Status Date"              AS status_date,
  "Expires Date"             AS expires_date,
  "Completed Date"           AS completed_date,

  TRY_CAST("Total Job Valuation" AS DOUBLE)      AS total_job_valuation,
  TRY_CAST("Total Valuation Remodel" AS DOUBLE)  AS total_valuation_remodel,
  TRY_CAST("Building Valuation" AS DOUBLE)       AS building_valuation,
  TRY_CAST("Electrical Valuation" AS DOUBLE)     AS electrical_valuation,
  TRY_CAST("Mechanical Valuation" AS DOUBLE)     AS mechanical_valuation,
  TRY_CAST("Plumbing Valuation" AS DOUBLE)       AS plumbing_valuation,

  "Original Address 1"       AS original_address1,
  "Original City"            AS original_city,
  "Original State"           AS original_state,
  "Original Zip"             AS original_zip,
  TRY_CAST("Latitude" AS DOUBLE)                 AS latitude,
  TRY_CAST("Longitude" AS DOUBLE)                AS longitude,
  "Location"                 AS location,

  "Contractor City"          AS contractor_city,
  "Contractor Zip"           AS contractor_zip,
  "Applicant City"           AS applicant_city,
  "Applicant Zip"            AS applicant_zip

FROM read_csv_auto('{CSV}')
""")


# %%
duckdb.query("""
SELECT
  permit_number, issued_date, status_current, original_zip, total_job_valuation, description
FROM permits
WHERE description IS NOT NULL
USING SAMPLE 20
""").df()


# %%
duckdb.query(f"""
CREATE OR REPLACE VIEW permits AS
SELECT
  "Permit Num"               AS permit_number,
  "Permit Type Desc"         AS permit_type_desc,
  "Permit Type"              AS permittype,
  "Permit Class"             AS permit_class,
  "Permit Class Mapped"      AS permit_class_mapped,
  "Work Class"               AS work_class,
  "Description"              AS description,

  "Applied Date"             AS applied_date,
  "Issued Date"              AS issued_date,

  "Status Current"           AS status_current,
  "Original Zip"             AS original_zip,

  TRY_CAST(regexp_replace(COALESCE("Total Job Valuation", ''), '[^0-9.]', '', 'g') AS DOUBLE)
    AS total_job_valuation

FROM read_csv_auto('{CSV}')
""")


# %%
duckdb.query("""
SELECT "Total Job Valuation", total_job_valuation
FROM permits
WHERE "Total Job Valuation" IS NOT NULL
USING SAMPLE 20
""").df()


# %%
duckdb.query(f"""
SELECT "Total Job Valuation"
FROM read_csv_auto('{CSV}')
WHERE "Total Job Valuation" IS NOT NULL
LIMIT 20
""").df()

# %%
duckdb.query(f"""
CREATE OR REPLACE VIEW permits AS
SELECT
  "Permit Num"               AS permit_number,
  "Permit Type Desc"         AS permit_type_desc,
  "Permit Type"              AS permittype,
  "Permit Class"             AS permit_class,
  "Permit Class Mapped"      AS permit_class_mapped,
  "Work Class"               AS work_class,
  "Description"              AS description,

  "Issued Date"              AS issued_date,
  "Status Current"           AS status_current,
  "Original Zip"             AS original_zip,

  TRY_CAST(
    NULLIF(regexp_replace("Total Job Valuation", '[^0-9.]', '', 'g'), '')
    AS DOUBLE
  ) AS total_job_valuation

FROM read_csv_auto('{CSV}')
""")


# %%
duckdb.query("""
CREATE OR REPLACE VIEW permits_clean AS
SELECT
  *,
  CASE
    WHEN total_job_valuation IN (0, 1) THEN NULL
    ELSE total_job_valuation
  END AS total_job_valuation_clean
FROM permits
""")


# %%
duckdb.query("""
SELECT
  COUNT(*) AS total_rows,
  SUM(CASE WHEN total_job_valuation_clean IS NULL THEN 1 ELSE 0 END) AS null_or_placeholder,
  SUM(CASE WHEN total_job_valuation_clean IS NOT NULL THEN 1 ELSE 0 END) AS usable
FROM permits_clean
""").df()


# %%
phrases = duckdb.query("""
WITH base AS (
  SELECT
    lower(regexp_replace(description, '[^a-z0-9 ]', ' ', 'g')) AS d
  FROM permits_clean
  WHERE description IS NOT NULL
  USING SAMPLE 300000
),
tok AS (
  SELECT string_split(d, ' ') AS w
  FROM base
),
bigrams AS (
  SELECT lower(w[i] || ' ' || w[i+1]) AS phrase
  FROM tok, range(1, array_length(w)-1) r(i)
),
filtered AS (
  SELECT phrase, COUNT(*) AS freq
  FROM bigrams
  WHERE length(phrase) >= 6
    AND phrase NOT LIKE '%permit%'
    AND phrase NOT LIKE '%review%'
    AND phrase NOT LIKE '%expedited%'
    AND phrase NOT LIKE '%eplan%'
    AND phrase NOT LIKE '%residential expedited%'
  GROUP BY 1
)
SELECT phrase, freq
FROM filtered
WHERE freq >= 300
ORDER BY freq DESC
LIMIT 200
""").df()

phrases.head(30)


# %%
phrases["head"] = phrases["phrase"].str.split().str[-1]
grouped = (phrases.groupby("head", as_index=False)
           .agg(phrase_count=("phrase","count"),
                total_freq=("freq","sum"),
                top_phrases=("phrase", lambda s: list(s.head(8)))))
grouped = grouped.sort_values(["phrase_count","total_freq"], ascending=False)
grouped.head(30)


# %%
phrases = duckdb.query("""
WITH base AS (
  SELECT
    lower(trim(regexp_replace(description, '[^a-z0-9 ]', ' ', 'g'))) AS d
  FROM permits_clean
  WHERE description IS NOT NULL
  USING SAMPLE 300000
),
norm AS (
  SELECT regexp_replace(d, '\\s+', ' ', 'g') AS d
  FROM base
),
tok AS (
  SELECT list_filter(string_split(d, ' '), x -> length(x) > 0) AS w
  FROM norm
),
bigrams AS (
  SELECT w[i] || ' ' || w[i+1] AS phrase
  FROM tok, range(1, array_length(w)) r(i)
  WHERE i < array_length(w)
),
filtered AS (
  SELECT phrase, COUNT(*) AS freq
  FROM bigrams
  WHERE length(phrase) >= 6
    AND phrase NOT LIKE '%permit%'
    AND phrase NOT LIKE '%review%'
    AND phrase NOT LIKE '%expedited%'
    AND phrase NOT LIKE '%eplan%'
  GROUP BY 1
)
SELECT phrase, freq
FROM filtered
WHERE freq >= 300
ORDER BY freq DESC
LIMIT 200
""").df()

phrases.head(30)


# %%
duckdb.query("""
SELECT
  SUM(CASE WHEN strpos(description, chr(160)) > 0 THEN 1 ELSE 0 END) AS has_nbsp,
  SUM(CASE WHEN strpos(description, chr(8203)) > 0 THEN 1 ELSE 0 END) AS has_zwsp
FROM permits_clean
WHERE description IS NOT NULL
""").df()

# %%
phrases = duckdb.query("""
WITH base AS (
  SELECT
    lower(trim(
      regexp_replace(
        replace(replace(description, chr(160), ''), chr(8203), ''),
        '[^a-z0-9 ]', ' ', 'g'
      )
    )) AS d
  FROM permits_clean
  WHERE description IS NOT NULL
  USING SAMPLE 300000
),
norm AS (
  SELECT regexp_replace(d, '\\s+', ' ', 'g') AS d
  FROM base
),
tok AS (
  SELECT list_filter(string_split(d, ' '), x -> length(x) > 0) AS w
  FROM norm
),
bigrams AS (
  SELECT w[i] || ' ' || w[i+1] AS phrase
  FROM tok, range(1, array_length(w)) r(i)
  WHERE i < array_length(w)
),
filtered AS (
  SELECT phrase, COUNT(*) AS freq
  FROM bigrams
  WHERE length(phrase) >= 6
    AND phrase NOT LIKE '%permit%'
    AND phrase NOT LIKE '%review%'
    AND phrase NOT LIKE '%expedited%'
    AND phrase NOT LIKE '%eplan%'
  GROUP BY 1
)
SELECT phrase, freq
FROM filtered
WHERE freq >= 300
ORDER BY freq DESC
LIMIT 200
""").df()

phrases.head(30)


# %%
phrases = duckdb.query("""
WITH base AS (
  SELECT
    lower(trim(
      regexp_replace(
        replace(
          replace(
            replace(
              replace(description, chr(160), ''),   -- NBSP
            chr(8203), ''),                          -- ZWSP
          chr(65279), ''),                           -- BOM
        chr(8288), ''),                              -- word joiner
        '[^a-z0-9 ]', ' ', 'g'
      )
    )) AS d
  FROM permits_clean
  WHERE description IS NOT NULL
  USING SAMPLE 300000
),
norm AS (
  SELECT regexp_replace(d, '\\s+', ' ', 'g') AS d
  FROM base
),
tok AS (
  SELECT list_filter(string_split(d, ' '), x -> length(x) > 0) AS w
  FROM norm
),
bigrams AS (
  SELECT w[i] || ' ' || w[i+1] AS phrase
  FROM tok, range(1, array_length(w)) r(i)
  WHERE i < array_length(w)
),
filtered AS (
  SELECT phrase, COUNT(*) AS freq
  FROM bigrams
  WHERE length(phrase) >= 6
  GROUP BY 1
)
SELECT phrase, freq
FROM filtered
WHERE freq >= 300
ORDER BY freq DESC
LIMIT 200
""").df()

phrases.head(30)

# %%
phrases = duckdb.query("""
WITH base AS (
  SELECT
    lower(description) AS d
  FROM permits_clean
  WHERE description IS NOT NULL
  USING SAMPLE 300000
),
clean1 AS (
  SELECT
    -- remove common invisible chars + ASCII control chars
    regexp_replace(
      replace(replace(replace(replace(d, chr(160), ''), chr(8203), ''), chr(65279), ''), chr(8288), ''),
      '[\\x00-\\x1F\\x7F]', ' ', 'g'
    ) AS d
  FROM base
),
clean2 AS (
  SELECT
    -- keep only a-z/0-9/spaces; everything else -> space
    trim(regexp_replace(d, '[^a-z0-9 ]', ' ', 'g')) AS d
  FROM clean1
),
clean3 AS (
  SELECT
    -- collapse multi-spaces
    regexp_replace(d, '\\s+', ' ', 'g') AS d
  FROM clean2
),
stitched AS (
  SELECT
    -- stitch split words: "g arage" -> "garage", "i nterior" -> "interior"
    regexp_replace(d, '\\b([a-z])\\s+([a-z]{2,})\\b', '\\1\\2', 'g') AS d
  FROM clean3
),
tok AS (
  SELECT list_filter(string_split(d, ' '), x -> length(x) > 0) AS w
  FROM stitched
),
bigrams AS (
  SELECT w[i] || ' ' || w[i+1] AS phrase
  FROM tok, range(1, array_length(w)) r(i)
  WHERE i < array_length(w)
),
filtered AS (
  SELECT phrase, COUNT(*) AS freq
  FROM bigrams
  WHERE length(phrase) >= 6
    AND phrase NOT LIKE '%permit%'
    AND phrase NOT LIKE '%review%'
    AND phrase NOT LIKE '%expedited%'
    AND phrase NOT LIKE '%eplan%'
  GROUP BY 1
)
SELECT phrase, freq
FROM filtered
WHERE freq >= 300
ORDER BY freq DESC
LIMIT 200
""").df()

phrases.head(30)


# %%
duckdb.query("""
WITH base AS (
  SELECT lower(description) AS raw
  FROM permits_clean
  WHERE description IS NOT NULL
  USING SAMPLE 20
),
clean AS (
  SELECT
    raw,
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            replace(replace(replace(replace(raw, chr(160), ''), chr(8203), ''), chr(65279), ''), chr(8288), ''),
            '[\\x00-\\x1F\\x7F]', ' ', 'g'
          ),
          '[^a-z0-9 ]', ' ', 'g'
        ),
        '\\s+', ' ', 'g'
      ),
      '\\b([a-z])\\s+([a-z]{2,})\\b', '\\1\\2', 'g'
    ) AS cleaned
  FROM base
)
SELECT raw, cleaned
FROM clean
""").df()


# %%
import re

# Add head token
phrases["head"] = phrases["phrase"].str.split().str[-1]

# Basic junk filters
def is_junk(p):
    return bool(re.search(r'\b(res|sf|frm|stry|att|ven|watt)\b', p))  # common abbreviations/noise
def head_ok(h):
    return (len(h) >= 4) and (h not in {"existing","create","residence","family","story","single","covered","attached","porch","patio"})

phrases_f = phrases[~phrases["phrase"].apply(is_junk)].copy()

grouped = (phrases_f.groupby("head", as_index=False)
           .agg(phrase_count=("phrase","count"),
                total_freq=("freq","sum"),
                top_phrases=("phrase", lambda s: list(s.head(10)))))

grouped = grouped[grouped["head"].apply(head_ok)].sort_values(["phrase_count","total_freq"], ascending=False)

grouped.head(30)


# %%
TOP_N = 20  # tune: 15–30 is usually good

candidates = grouped.head(TOP_N).copy()

feature_rules = {
    row["head"]: row["top_phrases"][:6]   # patterns per feature
    for _, row in candidates.iterrows()
}

feature_rules


# %%
import pandas as pd

def mk_cond(patterns):
    # robust OR clause for LIKE
    pats = [p.replace("'", "''") for p in patterns]
    return " OR ".join([f"lower(description) LIKE '%{p}%'" for p in pats])

rows = []
examples = {}

for feat, pats in feature_rules.items():
    cond = mk_cond(pats)
    
    stats = duckdb.query(f"""
        SELECT
          '{feat}' AS feature,
          COUNT(*) AS matches,
          AVG(total_job_valuation_clean) AS avg_val,
          quantile_cont(total_job_valuation_clean, 0.5) AS median_val
        FROM permits_clean
        WHERE description IS NOT NULL
          AND ({cond})
    """).df().iloc[0].to_dict()
    rows.append(stats)
    
    ex = duckdb.query(f"""
        SELECT permit_number, issued_date, original_zip, total_job_valuation_clean, description
        FROM permits_clean
        WHERE description IS NOT NULL
          AND ({cond})
        ORDER BY issued_date DESC NULLS LAST
        LIMIT 8
    """).df()
    examples[feat] = ex

stats_df = pd.DataFrame(rows).sort_values("matches", ascending=False)
stats_df

# %% [markdown]
# ## Data cleansing

# %%
cols = duckdb.query(f"""
DESCRIBE SELECT * FROM read_csv_auto('{CSV}');
""").df()

cols


# %%
cols["column_name"].tolist()


# %%
duckdb.query(f"""
WITH base AS (
  SELECT
    TRY_CAST("Latitude" AS DOUBLE)  AS latitude,
    TRY_CAST("Longitude" AS DOUBLE) AS longitude,
    "Location"                     AS location
  FROM read_csv_auto('{CSV}')
)
SELECT
  COUNT(*) AS total_rows,

  -- Rows with valid lat/lon
  SUM(
    latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND latitude BETWEEN -90 AND 90
    AND longitude BETWEEN -180 AND 180
  )::BIGINT AS rows_with_latlon,

  -- Rows with no lat/lon but Location populated
  SUM(
    (latitude IS NULL OR longitude IS NULL)
    AND location IS NOT NULL
  )::BIGINT AS rows_location_only,

  -- Rows with no geo information at all
  SUM(
    latitude IS NULL
    AND longitude IS NULL
    AND location IS NULL
  )::BIGINT AS rows_no_geo

FROM base;
""").df()


# %%
duckdb.query(f"""
CREATE OR REPLACE VIEW permits_model_ready AS
SELECT
  -- IDs / classification
  "Permit Num"           AS permit_number,
  "Permit Type Desc"     AS permit_type_desc,
  "Permit Type"          AS permit_type,
  "Permit Class"         AS permit_class,
  "Permit Class Mapped"  AS permit_class_mapped,
  "Work Class"           AS work_class,
  "Condominium"          AS condominium,

  -- Text
  "Description"          AS description,

  -- Dates
  TRY_CAST("Issued Date" AS DATE)   AS issued_date,
  TRY_CAST("Applied Date" AS DATE)  AS applied_date,

  -- Status
  "Status Current"       AS status_current,

  -- Geography (Mapbox + modeling)
  TRY_CAST("Latitude" AS DOUBLE)    AS latitude,
  TRY_CAST("Longitude" AS DOUBLE)   AS longitude,
  "Original Zip"         AS original_zip,

  -- Valuation (cleaned)
  CASE
    WHEN TRY_CAST(NULLIF(regexp_replace("Total Job Valuation", '[^0-9.]', '', 'g'), '') AS DOUBLE) IN (0, 1)
      THEN NULL
    ELSE TRY_CAST(NULLIF(regexp_replace("Total Job Valuation", '[^0-9.]', '', 'g'), '') AS DOUBLE)
  END AS total_job_valuation,

  TRY_CAST(NULLIF(regexp_replace("Building Valuation", '[^0-9.]', '', 'g'), '') AS DOUBLE)
    AS building_valuation,
  TRY_CAST(NULLIF(regexp_replace("Electrical Valuation", '[^0-9.]', '', 'g'), '') AS DOUBLE)
    AS electrical_valuation,
  TRY_CAST(NULLIF(regexp_replace("Mechanical Valuation", '[^0-9.]', '', 'g'), '') AS DOUBLE)
    AS mechanical_valuation,
  TRY_CAST(NULLIF(regexp_replace("Plumbing Valuation", '[^0-9.]', '', 'g'), '') AS DOUBLE)
    AS plumbing_valuation,

  -- Physical size
  TRY_CAST(NULLIF(regexp_replace("Total Existing Bldg SQFT", '[^0-9.]', '', 'g'), '') AS DOUBLE)
    AS total_existing_bldg_sqft,
  TRY_CAST(NULLIF(regexp_replace("Total New Add SQFT", '[^0-9.]', '', 'g'), '') AS DOUBLE)
    AS total_new_add_sqft,
  TRY_CAST(NULLIF(regexp_replace("Housing Units", '[^0-9.]', '', 'g'), '') AS DOUBLE)
    AS housing_units,
  TRY_CAST(NULLIF(regexp_replace("Number Of Floors", '[^0-9.]', '', 'g'), '') AS DOUBLE)
    AS number_of_floors,

  -- Optional actor signal
  "Contractor Trade"     AS contractor_trade

FROM read_csv_auto('{CSV}')
WHERE
  TRY_CAST("Latitude" AS DOUBLE) BETWEEN -90 AND 90
  AND TRY_CAST("Longitude" AS DOUBLE) BETWEEN -180 AND 180
""")


# %%
duckdb.query("""
SELECT COUNT(*) AS rows
FROM permits_model_ready
""").df()


# %%
duckdb.query("""
SELECT COUNT(*) AS cols
FROM (DESCRIBE SELECT * FROM permits_model_ready)
""").df()


# %%
duckdb.query("""
SELECT
  permit_number,
  issued_date,
  permit_type_desc,
  work_class,
  latitude,
  longitude,
  total_job_valuation,
  description
FROM permits_model_ready
USING SAMPLE 10
""").df()


# %%
duckdb.query("""
COPY (SELECT * FROM permits_model_ready)
TO 'permits_model_ready.csv' (HEADER, DELIMITER ',');
""")

# %%
gzip permits_model_ready.csv

# %%
!gzip permits_model_ready.csv

# %%
!gzip permits_model_ready.csv

# %%
duckdb.query("""
CREATE OR REPLACE VIEW permits_model_ultra_clean AS
SELECT
  permit_number,

  permit_type_desc,
  permit_class_mapped,
  work_class,
  condominium,

  description,

  issued_date,
  status_current,

  latitude,
  longitude,
  original_zip,

  total_job_valuation,
  building_valuation,
  electrical_valuation,
  mechanical_valuation,
  plumbing_valuation,

  total_existing_bldg_sqft,
  total_new_add_sqft,
  housing_units,
  number_of_floors,

  contractor_trade

FROM permits_model_ready
""")


# %%
duckdb.query("""
SELECT COUNT(*) AS rows
FROM permits_model_ultra_clean
""").df()

duckdb.query("""
DESCRIBE SELECT * FROM permits_model_ultra_clean
""").df()

duckdb.query("""
SELECT *
FROM permits_model_ultra_clean
USING SAMPLE 5
""").df()


# %%
description_clean


# %%
duckdb.query("""
CREATE OR REPLACE VIEW permits_base_for_modeling AS
SELECT *
FROM permits_model_ultra_clean
""")


# %%
duckdb.query("""
CREATE OR REPLACE VIEW permits_with_clean_text AS
SELECT
  *,
  regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(description),
        '[^a-z0-9 ]', ' ', 'g'
      ),
      '\\s+', ' ', 'g'
    ),
    '^ | $', '', 'g'
  ) AS description_clean
FROM permits_base_for_modeling
""")


# %%
duckdb.query("""
SELECT
  description,
  description_clean
FROM permits_with_clean_text
USING SAMPLE 10
""").df()


# %%
duckdb.query("""
CREATE OR REPLACE VIEW permits_model_ready_v2 AS
SELECT
  permit_number,

  lower(trim(permit_type_desc))      AS permit_type_desc,
  lower(trim(permit_class_mapped))   AS permit_class_mapped,
  lower(trim(work_class))            AS work_class,
  lower(trim(status_current))        AS status_current,
  lower(trim(contractor_trade))      AS contractor_trade,

  condominium,
  original_zip,

  issued_date,

  latitude,
  longitude,

  total_job_valuation,
  building_valuation,
  electrical_valuation,
  mechanical_valuation,
  plumbing_valuation,

  total_existing_bldg_sqft,
  total_new_add_sqft,
  housing_units,
  number_of_floors,

  description_clean
FROM permits_with_clean_text
""")


# %%
duckdb.query("""
SELECT
  COUNT(*) FILTER (WHERE description_clean IS NULL) AS null_descriptions,
  COUNT(*) FILTER (WHERE total_job_valuation IS NULL) AS null_valuation,
  COUNT(*) FILTER (WHERE contractor_trade IS NULL) AS null_trade
FROM permits_model_ready_v2
""").df()


# %%
duckdb.query("""
SELECT COUNT(*) FROM permits_model_ready_v2
""").df()

# %%
duckdb.query("""
CREATE OR REPLACE VIEW permits_step6_executed AS
SELECT *
FROM permits_model_ready_v2
WHERE status_current NOT IN (
  'cancelled',
  'canceled',
  'withdrawn',
  'void',
  'voided'
);
""")



# %%
SELECT COUNT(*) FROM permits_step6_executed;

# %%
duckdb.query("SELECT COUNT(*) AS n FROM permits_step6_executed").df()

# %%
duckdb.query("""
CREATE OR REPLACE VIEW permits_step7_text AS
SELECT *
FROM permits_step6_executed
WHERE
  description_clean IS NOT NULL
  AND length(description_clean) >= 15
  AND description_clean NOT IN ('permit','service','inspection','test');
""")


# %%
duckdb.query("""
SELECT 'step7_text' AS stage, COUNT(*) AS n
FROM permits_step7_text
""").df()


# %%
duckdb.query("""
CREATE OR REPLACE VIEW permits_step8_recent AS
SELECT *
FROM permits_step7_text
WHERE issued_date >= DATE '2005-01-01';
""")


# %%
duckdb.query("""
SELECT 'step8_recent' AS stage, COUNT(*) AS n
FROM permits_step8_recent
""").df()

# %%
duckdb.query("""
CREATE OR REPLACE VIEW permits_with_text_norm AS
WITH base AS (
  SELECT
    *,
    description_clean AS t
  FROM permits_step8_recent
),
norm AS (
  SELECT
    *,
    -- remove common “process” boilerplate words (keep meaning words)
    regexp_replace(t, '\\b(eplan|expedited|review|express)\\b', ' ', 'g') AS t1
  FROM base
),
norm2 AS (
  SELECT
    *,
    -- standardize common abbreviations / tokens (keep these because they are signal)
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(t1,
                '\\bevse\\b', ' ev_charger ', 'g'),
              '\\bpv\\b', ' solar ', 'g'),
            '\\bphotovoltaic\\b', ' solar ', 'g'),
          '\\bsfr\\b', ' single_family ', 'g'),
        '\\badu\\b', ' accessory_dwelling ', 'g'),
      '\\betj\\b', ' extra_territorial_jurisdiction ', 'g'
    ) AS t2
  FROM norm
),
norm3 AS (
  SELECT
    *,
    -- standardize “two story” variants → “2_story”
    regexp_replace(
      regexp_replace(t2, '\\btwo\\s+story\\b', ' 2_story ', 'g'),
      '\\b2\\s+story\\b', ' 2_story ', 'g'
    ) AS t3
  FROM norm2
),
final AS (
  SELECT
    *,
    -- collapse whitespace again and trim
    trim(regexp_replace(t3, '\\s+', ' ', 'g')) AS text_norm
  FROM norm3
)
SELECT * EXCLUDE (t, t1, t2, t3)
FROM final;
""")


# %%
duckdb.query("""
SELECT
  description_clean,
  text_norm
FROM permits_with_text_norm
USING SAMPLE 15
""").df()



# %%



