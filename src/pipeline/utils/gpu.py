"""GPU detection and management utilities"""
import logging
import subprocess
from ..config import GPU_ENABLED

log = logging.getLogger("permits")

try:
    import cudf
except ImportError:
    cudf = None


def print_gpu_info():
    """Print GPU environment information"""
    log.info("Checking GPU environment...")

    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=index,name,memory.total,driver_version",
                "--format=csv,noheader"
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        log.info("GPU Info:\n" + result.stdout)
    except Exception as e:
        log.warning(f"Could not run nvidia-smi: {e}")

    if GPU_ENABLED and cudf is not None:
        try:
            log.info(f"Detected GPUs: {cudf.cuda.runtime.getDeviceCount()}")
        except Exception:
            log.info("Detected GPUs (fallback: 1)")
        log.info("cuDF detected — GPU acceleration ON.")
    else:
        log.warning("cuDF NOT found — falling back to CPU pandas.")

    log.info("cuFile disabled to prevent GDS crashes.")
