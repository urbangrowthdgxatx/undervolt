# Platform-Specific Configuration Guide

Undervolt supports multiple platforms with optimized configurations for each.

## Supported Platforms

| Platform | GPU | Memory | Best For |
|----------|-----|--------|----------|
| **DGX** | A100/H100 | 80GB+ | Maximum performance, full dataset |
| **Jetson** | Tegra/Xavier | 8-32GB | Edge deployment, real-time processing |
| **Mac** | None (CPU) | 16GB+ | Development, testing, smaller datasets |

## Running on Different Platforms

### DGX (NVIDIA Data Center GPU)

**Optimized for:** Maximum GPU acceleration with RAPIDS

```bash
python run_unified.py --platform dgx
```

**Configuration:**
- GPU: Fully enabled with GDS (GPUDirect Storage)
- Clusters: 16 (more granular clustering)
- Batch Size: 10,000 (large batches)
- PCA Components: 20 (more dimensions)
- Max Iterations: 500

**Requirements:**
```bash
# Install RAPIDS
conda create -n rapids-env -c rapidsai -c conda-forge -c nvidia \
    rapids=24.08 python=3.10 cudatoolkit=12.0

# Or use Docker
docker pull rapidsai/rapidsai:latest
```

### Jetson (NVIDIA Edge GPU)

**Optimized for:** Limited memory, edge deployment

```bash
python run_unified.py --platform jetson
```

**Configuration:**
- GPU: Enabled, GDS disabled (not supported)
- Clusters: 6 (fewer for memory)
- Batch Size: 1,000 (small batches)
- PCA Components: 5 (reduced dimensions)
- Max Iterations: 200
- Keywords: Reduced set (7 instead of 16)

**Requirements:**
```bash
# Install JetPack with CUDA
# Then install cuDF for Jetson
pip3 install cudf-cu12 --extra-index-url=https://pypi.nvidia.com
```

### Mac (CPU-Only)

**Optimized for:** Development, testing, no GPU

```bash
python run_unified.py --platform mac
```

**Configuration:**
- GPU: Disabled
- Clusters: 8 (standard)
- Batch Size: 5,000 (moderate)
- PCA Components: 10 (standard)
- Max Iterations: 300
- CPU Cores: All available (multiprocessing)

**Requirements:**
```bash
pip3 install scikit-learn pandas numpy
```

## Platform Detection (Automatic)

You can also use the unified runner with automatic platform detection:

```bash
python run_unified.py  # Auto-detects and uses appropriate config
```

## Configuration Files

Unified pipeline configuration is centralized in `src/pipeline/platform.py`.

Legacy, config-based pipeline settings still live in `src/pipeline/`:

- `config.py` - Base configuration (default)
- `config_dgx.py` - DGX overrides
- `config_jetson.py` - Jetson overrides
- `config_mac.py` - Mac overrides

## Customizing for Your Platform

### Create Custom Config

```python
# src/pipeline/config_custom.py
from .config import *

# Override specific parameters
CLUSTERING_PARAMS = {
    "n_clusters": 12,
    "max_iter": 400,
    ...
}

PLATFORM = "MyCustom"
```

### Create Custom Runner (Legacy Pipeline)

```python
# run_pipeline_custom.py
import sys
import src.pipeline.config_custom as config
import src.pipeline.config
src.pipeline.config = config

from src.pipeline.main import main

if __name__ == "__main__":
    sys.exit(main())
```

## Performance Comparison

Tested on 2.3M Austin permits dataset:

| Platform | Load Time | Clean Time | NLP Time | Cluster Time | Total |
|----------|-----------|------------|----------|--------------|-------|
| **DGX A100** | 5s | 45s | 15s | 30s | **~2 min** |
| **Jetson AGX** | 25s | 180s | 90s | 120s | **~7 min** |
| **Mac M2** | 38s | 105s | 51s | 102s | **~5 min** |

*Times are approximate and vary based on specific hardware configuration.*

## Memory Requirements

| Platform | Minimum RAM | Recommended | For Full Dataset |
|----------|-------------|-------------|------------------|
| **DGX** | 32GB | 64GB+ | 80GB+ |
| **Jetson** | 8GB | 16GB | 32GB |
| **Mac** | 8GB | 16GB | 32GB+ |

## Troubleshooting

### DGX: "cuFile initialization failed"

If GDS causes issues:
```python
# In config_dgx.py
os.environ["CUDF_CUFILE_POLICY"] = "ALWAYS_OFF"
```

### Jetson: Out of Memory

Reduce batch size and clusters:
```python
BATCH_SIZE = 500
CLUSTERING_PARAMS["n_clusters"] = 4
```

### Mac: Too Slow

Process a subset:
```python
# In main.py, after loading
df = df.head(100000)  # Process first 100K records
```

## Cloud Deployments

### AWS (GPU)
Use DGX config with g4dn/p3/p4d instances

### Google Cloud (GPU)
Use DGX config with A100 or T4 instances

### Azure (GPU)
Use DGX config with NC-series VMs

### Lambda Labs / Paperspace
Use DGX config

## Docker Images

### DGX/GPU
```dockerfile
FROM rapidsai/rapidsai:latest
COPY . /app
WORKDIR /app
CMD ["python", "run_unified.py", "--platform", "dgx"]
```

### Jetson
```dockerfile
FROM nvcr.io/nvidia/l4t-pytorch:r35.2.1-pth2.0-py3
COPY . /app
WORKDIR /app
RUN pip3 install -r requirements.txt
CMD ["python", "run_unified.py", "--platform", "jetson"]
```

### CPU-Only (Mac/Linux)
```dockerfile
FROM python:3.10-slim
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
CMD ["python", "run_unified.py", "--platform", "mac"]
```

## Next Steps

1. Choose your platform configuration
2. Install requirements
3. Download data: `bash scripts/download_data.sh`
4. Run: `python run_unified.py --platform <platform>`

For questions or platform-specific issues, see [ARCHITECTURE.md](ARCHITECTURE.md).
