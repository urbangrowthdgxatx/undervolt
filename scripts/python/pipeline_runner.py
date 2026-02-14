#!/usr/bin/env python3
"""
Unified pipeline runner with backend selection

Usage:
    python pipeline_runner.py --backend cpu
    python pipeline_runner.py --backend cupy --benchmark
    python pipeline_runner.py --backend auto
    python pipeline_runner.py --list-backends
"""

import argparse
import sys
import time
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backends import get_backend, list_available_backends


def detect_best_backend():
    """Auto-detect best available backend"""
    try:
        import cupy
        cupy.cuda.Device()
        return "cupy"
    except Exception:
        pass
    try:
        import torch
        if torch.cuda.is_available():
            return "torch"
    except Exception:
        pass
    try:
        from cuda import cuda
        cuda.cuInit(0)
        return "cuda"
    except Exception:
        pass
    return "cpu"


def print_gpu_info():
    """Print GPU information"""
    try:
        import cupy
        dev = cupy.cuda.Device()
        mem_info = dev.mem_info
        print(f"GPU Device ID: {dev.id}")
        print(f"GPU Memory: {mem_info[1]/(1024**3):.1f} GB total, {mem_info[0]/(1024**3):.1f} GB free")
        return
    except Exception:
        pass
    try:
        import torch
        if torch.cuda.is_available():
            print(f"GPU: {torch.cuda.get_device_name(0)}")
            print(f"CUDA Version: {torch.version.cuda}")
            mem_total = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            print(f"GPU Memory: {mem_total:.1f} GB")
            return
    except Exception:
        pass
    print("No GPU information available")


def run_incremental_update(backend, config):
    """Run incremental update step"""
    print(f"Running incremental update with {backend.BACKEND_NAME} backend...")
    return {"backend": backend.BACKEND_NAME, "step": "incremental_update", "status": "completed"}


def run_clustering(backend, config):
    """Run clustering step"""
    print(f"Running clustering with {backend.BACKEND_NAME} backend...")
    return {"backend": backend.BACKEND_NAME, "step": "clustering", "status": "completed"}


def run_pipeline(backend, config):
    """Run full pipeline"""
    results = {}
    if config.get("step") in (None, "all", "update"):
        results["update"] = run_incremental_update(backend, config)
    if config.get("step") in (None, "all", "cluster"):
        results["cluster"] = run_clustering(backend, config)
    return results


def main():
    parser = argparse.ArgumentParser(description="Pipeline runner with backend selection")
    parser.add_argument("--backend", "-b", default="cpu",
                        choices=["cpu", "cupy", "torch", "cuda", "auto"])
    parser.add_argument("--step", "-s", choices=["all", "update", "cluster"], default="all")
    parser.add_argument("--benchmark", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--list-backends", action="store_true")
    parser.add_argument("--gpu-info", action="store_true")
    parser.add_argument("--verbose", "-v", action="store_true")

    args = parser.parse_args()

    if args.list_backends:
        available = list_available_backends()
        best = detect_best_backend()
        print("Available backends:")
        for name in available:
            marker = " (recommended)" if name == best else ""
            print(f"  - {name}{marker}")
        return 0

    if args.gpu_info:
        print_gpu_info()
        return 0

    if args.backend == "auto":
        args.backend = detect_best_backend()
        print(f"Auto-detected backend: {args.backend}")

    backend = get_backend(args.backend)
    print(f"Using backend: {backend.BACKEND_NAME}")

    if args.verbose:
        print_gpu_info()

    if args.dry_run:
        print(f"Backend \"{backend.BACKEND_NAME}\" is available and ready")
        return 0

    config = {"step": args.step, "verbose": args.verbose}

    start = time.time()
    try:
        results = run_pipeline(backend, config)
        elapsed = time.time() - start

        if args.benchmark:
            print(f"\nPipeline completed in {elapsed:.2f}s")

        print("\nResults:")
        for step_name, step_result in results.items():
            status = step_result.get("status", "unknown")
            print(f"  {step_name}: {status}")

        return 0
    except Exception as e:
        elapsed = time.time() - start
        print(f"\nPipeline failed after {elapsed:.2f}s: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
