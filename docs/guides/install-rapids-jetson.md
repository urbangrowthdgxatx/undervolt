# Install RAPIDS on Jetson AGX Orin

**Current Status**: Pipeline using CPU fallbacks (pandas + scikit-learn)
**Target**: Enable GPU acceleration with cuDF + cuML

## Performance Impact

| Operation | CPU (Current) | GPU (After Install) | Speedup |
|-----------|---------------|---------------------|---------|
| Load 2.3M permits | 49s | ~3s | **16x faster** |
| Clustering | 54s | ~5s | **10x faster** |
| **Total pipeline** | **11.7 min** | **~3-4 min** | **3x faster** |

## Your System

- **Platform**: Jetson AGX Orin
- **JetPack**: 5.1.2 (R35.4.1)
- **CUDA**: 11.4 (JetPack 5.x)
- **Python**: 3.8

## Installation Steps

### Option 1: Pre-built RAPIDS (Recommended)

NVIDIA provides pre-built RAPIDS wheels for Jetson:

```bash
# Install cuDF and cuML for JetPack 5.x
pip3 install --extra-index-url=https://pypi.nvidia.com \
  cudf-cu11==23.10.* \
  cuml-cu11==23.10.*
```

If that fails, try:

```bash
# Alternative: Use conda-forge builds
pip3 install \
  https://developer.download.nvidia.com/compute/redist/jp/v511/cudf/cudf-23.10.0-py3-none-any.whl \
  https://developer.download.nvidia.com/compute/redist/jp/v511/cuml/cuml-23.10.0-py3-none-any.whl
```

### Option 2: Build from Source (If pre-built fails)

```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y \
  python3-dev \
  libcudf-dev \
  libcuml-dev \
  cmake \
  ninja-build

# Build cuDF
git clone --branch branch-23.10 https://github.com/rapidsai/cudf.git
cd cudf/python
python3 setup.py install

# Build cuML
cd ~/
git clone --branch branch-23.10 https://github.com/rapidsai/cuml.git
cd cuml/python
python3 setup.py install
```

### Option 3: Docker (Easiest, but uses more resources)

```bash
# Pull RAPIDS Jetson container
docker pull nvcr.io/nvidia/rapidsai/rapidsai:23.10-cuda11.8-runtime-ubuntu22.04-py3.10

# Run with your data mounted
docker run --gpus all -it \
  -v /home/red/Documents/github/undervolt:/workspace \
  nvcr.io/nvidia/rapidsai/rapidsai:23.10-cuda11.8-runtime-ubuntu22.04-py3.10
```

## Verification

After installation, verify GPU libraries work:

```bash
# Test cuDF
python3 -c "import cudf; print('cuDF version:', cudf.__version__)"

# Test cuML
python3 -c "import cuml; print('cuML version:', cuml.__version__)"

# Run quick benchmark
python3 << EOF
import cudf
import time

# Create test DataFrame
start = time.time()
df = cudf.DataFrame({'a': range(1000000), 'b': range(1000000)})
result = df.groupby('a').sum()
elapsed = time.time() - start
print(f"cuDF test: {elapsed:.3f}s (should be <0.1s)")
EOF
```

## Re-run Pipeline with GPU

Once installed, the pipeline will auto-detect GPU:

```bash
# Full pipeline (should now use GPU)
python run_pipeline.py

# You should see:
# ✅ Accelerator: cuDF (GPU)
# ✅ Running KMeans clustering with cuML (GPU)
```

Expected output:
```
🖥️  Platform detected: jetson (aarch64, Linux)
🎮 GPU acceleration: ENABLED (CUDA)
Accelerator: cuDF (GPU)  ← Should say GPU now
Running KMeans clustering with cuML (GPU)  ← Should say cuML
```

## Troubleshooting

### "No module named 'cudf'"

Try installing with specific version:
```bash
pip3 install cudf-cu11==23.10.0 --extra-index-url=https://pypi.nvidia.com
```

### "CUDA version mismatch"

Check your CUDA version:
```bash
nvcc --version  # Should show CUDA 11.4
```

Match the wheel version to your CUDA:
- JetPack 5.0-5.1: Use `cudf-cu11` (CUDA 11.4)
- JetPack 6.0+: Use `cudf-cu12` (CUDA 12.x)

### "ImportError: libcudart.so.11.0"

Add CUDA libraries to path:
```bash
export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH
echo 'export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
```

### Memory Issues

Jetson has limited RAM (32GB). If you get OOM errors:

1. Increase swap:
```bash
sudo fallocate -l 16G /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

2. Use batch processing:
```bash
python run_pipeline.py --sample 500000  # Process in chunks
```

## Expected Performance After Install

### Current (CPU only):
```
Load:       49s   (pandas)
Clean:      88s
NLP:        57s   (GPU ✓)
Cluster:    54s   (sklearn)
Extract:   216s
Save:      152s
Total:     700s  (11.7 minutes)
```

### After GPU install:
```
Load:        3s   (cuDF ✓)
Clean:      15s   (cuDF ✓)
NLP:        57s   (GPU ✓)
Cluster:     5s   (cuML ✓)
Extract:   216s
Save:      152s
Total:     ~4 min  (3x faster!)
```

## References

- [RAPIDS on Jetson Docs](https://docs.rapids.ai/deployment/stable/platforms/jetson/)
- [NVIDIA cuDF PyPI](https://pypi.nvidia.com)
- [Jetson RAPIDS Container](https://catalog.ngc.nvidia.com/orgs/nvidia/teams/rapidsai/containers/rapidsai)

---

**Note**: The pipeline currently works fine with CPU fallbacks - it's just 3x slower. Installing RAPIDS is optional but recommended for best performance.
