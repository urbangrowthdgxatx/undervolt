"""
Pipeline backends - CPU and GPU implementations

Usage:
    from backends import get_backend
    backend = get_backend("cupy")  # or "cpu", "torch", "cuda"
"""

BACKENDS = {
    "cpu": "backends.cpu",
    "cupy": "backends.cupy_backend",
    "torch": "backends.torch_backend",
    "cuda": "backends.cuda_backend",
}


def get_backend(name="cpu"):
    """Load backend by name, fallback to CPU"""
    try:
        module = __import__(BACKENDS[name], fromlist=[""])
        return module
    except (ImportError, KeyError) as e:
        print(f"Backend \"{name}\" not available ({e}), using CPU")
        from backends import cpu
        return cpu


def list_available_backends():
    """List backends that can be successfully imported"""
    available = []
    for name in BACKENDS:
        try:
            module = __import__(BACKENDS[name], fromlist=[""])
            available.append(name)
        except ImportError:
            pass
    return available
