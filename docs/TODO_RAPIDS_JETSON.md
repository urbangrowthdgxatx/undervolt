# TODO: Enable RAPIDS (cuDF/cuML) on Jetson AGX Orin

## Goal
Run the full GPU-accelerated ML pipeline on Jetson, not just LLM inference.

## Current State
- ✅ Nemotron Mini 4B via Ollama (GPU inference working)
- ❌ cuDF not installed (data processing falls back to pandas/CPU)
- ❌ cuML not installed (ML would use scikit-learn/CPU)

## Why This Matters
- DGX Spark hackathon used RAPIDS for speed
- Jetson has 275 TOPS - should use it for data too
- Full edge story: "All ML runs on device, no cloud"

## Installation Steps

### 1. Check JetPack Version
```bash
cat /etc/nv_tegra_release
# Need JetPack 5.0+ for RAPIDS
```

### 2. Check CUDA Version
```bash
nvcc --version
# Need CUDA 11.4+
```

### 3. Install RAPIDS for Jetson

**Option A: pip (easier)**
```bash
pip install --extra-index-url=https://pypi.nvidia.com \
    cudf-cu11 \
    cuml-cu11 \
    cugraph-cu11
```

**Option B: conda (more reliable)**
```bash
conda create -n rapids -c rapidsai -c conda-forge -c nvidia \
    rapids=24.02 python=3.10 cudatoolkit=11.8
```

### 4. Verify Installation
```bash
python3 -c "import cudf; print('cuDF version:', cudf.__version__)"
python3 -c "import cuml; print('cuML version:', cuml.__version__)"
```

### 5. Test Pipeline
```bash
cd /home/red/Documents/github/undervolt
python3 -c "from src.pipeline.config import GPU_ENABLED; print('GPU_ENABLED:', GPU_ENABLED)"
```

## Expected Outcome
- `GPU_ENABLED = True` in pipeline config
- Data loading uses cuDF (GPU) instead of pandas (CPU)
- Clustering uses cuML KMeans (GPU) instead of scikit-learn (CPU)

## Performance Comparison (to measure)

| Operation | CPU (pandas) | GPU (cuDF) | Speedup |
|-----------|--------------|------------|---------|
| Load 2.3M CSV | TBD | TBD | TBD |
| Clean/normalize | TBD | TBD | TBD |
| TF-IDF | TBD | TBD | TBD |
| KMeans clustering | TBD | TBD | TBD |

## Blockers / Notes
- Jetson AGX Orin 64GB should have enough VRAM
- May need to manage memory between Ollama and RAPIDS
- JetPack version compatibility is critical

## References
- https://docs.rapids.ai/install
- https://developer.nvidia.com/embedded/jetpack
- https://github.com/rapidsai/cudf
