import sys

# Enable GPU acceleration for pandas
import cudf.pandas
cudf.pandas.install()
import cupy as cp

print("Number of GPUs:", cp.cuda.runtime.getDeviceCount())

from numba import cuda
print("Detected GPUs:", len(cuda.gpus))
import pandas as pd

if len(sys.argv) != 2:
    print("Usage: python gpu_pandas.py <csv_file>")
    sys.exit(1)

csv_file = sys.argv[1]

print(f"Loading {csv_file} on the GPU...")
print("Pandas backend:", pd.get_option("mode.data_manager"))

df = pd.read_csv(csv_file)
print("Backend type:", type(df._data))
print(type(df))
print("Rows:", len(df))
print("Columns:", df.columns.tolist())
print("Memory usage (GB):",
      round(df.memory_usage(deep=True).sum() / (1024**3), 2))

print("Mean values:")
print(df.select_dtypes(include="number").mean())

