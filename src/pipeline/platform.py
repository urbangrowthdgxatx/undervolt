"""
Unified Platform Detection and Configuration

Single source of truth for platform-specific settings.
Auto-detects: Jetson AGX Orin, NVIDIA DGX, Mac, generic Linux
"""

import os
import platform
import subprocess
from dataclasses import dataclass
from typing import Optional, Literal

PlatformType = Literal['jetson', 'dgx', 'mac', 'linux']


@dataclass
class PlatformConfig:
    """Platform-specific configuration"""
    name: PlatformType
    has_gpu: bool
    use_cudf: bool
    use_cuml: bool
    batch_size: int
    num_workers: int
    memory_limit_gb: int

    # NLP settings
    llm_backend: Optional[str] = None
    llm_model: Optional[str] = None

    def __str__(self):
        gpu_status = "GPU (CUDA)" if self.has_gpu else "CPU"
        backend = f"cuDF/cuML" if self.use_cudf else "pandas/sklearn"
        return f"{self.name.upper()} - {gpu_status} - {backend}"


def detect_platform() -> PlatformType:
    """
    Auto-detect current platform.

    Returns:
        'jetson' - Jetson AGX Orin (aarch64 + tegrastats)
        'dgx' - NVIDIA DGX or GPU workstation (nvidia-smi + x86)
        'mac' - macOS (Darwin)
        'linux' - Generic Linux without GPU
    """
    system = platform.system()
    machine = platform.machine()

    # Check for Jetson (aarch64 + Tegra)
    if machine.startswith('aarch64') or machine == 'arm64':
        if system == 'Linux':
            # Check for tegrastats (Jetson-specific)
            try:
                subprocess.run(['which', 'tegrastats'],
                             check=True, capture_output=True)
                return 'jetson'
            except:
                pass
        elif system == 'Darwin':
            return 'mac'

    # Check for NVIDIA GPU (DGX or workstation)
    if system == 'Linux':
        try:
            subprocess.run(['nvidia-smi'],
                         check=True, capture_output=True)
            return 'dgx'
        except:
            return 'linux'

    return 'linux'


def has_cuda_libraries():
    """
    Check if cuDF and cuML are installed and working.

    Returns:
        (has_cudf, has_cuml) tuple
    """
    has_cudf = False
    has_cuml = False

    try:
        import cudf
        has_cudf = True
    except ImportError:
        pass

    try:
        import cuml
        has_cuml = True
    except ImportError:
        pass

    return has_cudf, has_cuml


def get_platform_config(override: Optional[PlatformType] = None) -> PlatformConfig:
    """
    Get platform-specific configuration with GPU detection.

    Args:
        override: Force specific platform (for testing)

    Returns:
        PlatformConfig with optimized settings for detected platform
    """
    platform_name = override or detect_platform()
    has_cudf, has_cuml = has_cuda_libraries()

    # Jetson AGX Orin - Moderate GPU, limited RAM (32GB)
    if platform_name == 'jetson':
        return PlatformConfig(
            name='jetson',
            has_gpu=True,
            use_cudf=has_cudf,  # Use if installed
            use_cuml=has_cuml,  # Use if installed
            batch_size=1000,    # Conservative for 32GB RAM
            num_workers=8,      # AGX Orin has 8 CPU cores
            memory_limit_gb=28, # Leave 4GB for system
            llm_backend='ollama',
            llm_model='neural-chat'
        )

    # NVIDIA DGX or GPU Workstation - High-end GPU, lots of RAM
    elif platform_name == 'dgx':
        return PlatformConfig(
            name='dgx',
            has_gpu=True,
            use_cudf=has_cudf,
            use_cuml=has_cuml,
            batch_size=10000,   # Large batches for speed
            num_workers=32,     # DGX has many cores
            memory_limit_gb=120, # Assume 128GB+ RAM
            llm_backend='vllm',
            llm_model='meta-llama/Llama-3-8B-Instruct'
        )

    # Mac (M1/M2) - CPU only, good RAM
    elif platform_name == 'mac':
        return PlatformConfig(
            name='mac',
            has_gpu=False,
            use_cudf=False,     # No CUDA on Mac
            use_cuml=False,
            batch_size=5000,    # Mac has good single-thread perf
            num_workers=8,      # M1/M2 typically 8 cores
            memory_limit_gb=24, # Assume 32GB Mac
            llm_backend='ollama',
            llm_model='neural-chat'
        )

    # Generic Linux - CPU fallback
    else:
        return PlatformConfig(
            name='linux',
            has_gpu=False,
            use_cudf=False,
            use_cuml=False,
            batch_size=5000,
            num_workers=os.cpu_count() or 4,
            memory_limit_gb=16,
            llm_backend=None,
            llm_model=None
        )


# Singleton instance
_platform_config: Optional[PlatformConfig] = None


def get_config() -> PlatformConfig:
    """Get or create singleton platform config"""
    global _platform_config
    if _platform_config is None:
        _platform_config = get_platform_config()
    return _platform_config


def print_platform_info():
    """Print platform detection results"""
    config = get_config()
    has_cudf, has_cuml = has_cuda_libraries()

    print("=" * 80)
    print(" PLATFORM DETECTION ".center(80, "="))
    print("=" * 80)
    print(f"Platform:        {config.name.upper()}")
    print(f"GPU Available:   {'Yes (CUDA)' if config.has_gpu else 'No (CPU only)'}")
    print(f"cuDF Installed:  {'✓' if has_cudf else '✗ (install for 16x faster loading)'}")
    print(f"cuML Installed:  {'✓' if has_cuml else '✗ (install for 10x faster clustering)'}")
    print(f"Data Backend:    {'cuDF (GPU)' if config.use_cudf else 'pandas (CPU)'}")
    print(f"ML Backend:      {'cuML (GPU)' if config.use_cuml else 'scikit-learn (CPU)'}")
    print(f"Batch Size:      {config.batch_size:,}")
    print(f"Workers:         {config.num_workers}")
    print(f"Memory Limit:    {config.memory_limit_gb}GB")
    if config.llm_backend:
        print(f"LLM Backend:     {config.llm_backend}")
        print(f"LLM Model:       {config.llm_model}")

    if config.has_gpu and not (has_cudf and has_cuml):
        print("\n⚠️  WARNING: GPU detected but RAPIDS not installed!")
        print("   Install cuDF/cuML for 3x faster pipeline:")
        print("   pip install cudf-cu11 cuml-cu11 --extra-index-url=https://pypi.nvidia.com")

    print("=" * 80)


if __name__ == "__main__":
    # Test platform detection
    print_platform_info()
