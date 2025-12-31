#!/usr/bin/env python3
"""
Unified entry point for Undervolt pipeline.
Auto-detects platform and runs appropriate configuration.

Usage:
    python run.py              # Auto-detect platform
    python run.py --platform jetson
    python run.py --platform dgx
    python run.py --platform mac
"""

import sys
import platform
import argparse

# Add src to path
sys.path.insert(0, 'src')

from pipeline.main import main as pipeline_main
from pipeline.config import get_config, detect_platform


def main():
    parser = argparse.ArgumentParser(description='Run Undervolt pipeline')
    parser.add_argument(
        '--platform',
        choices=['jetson', 'dgx', 'mac'],
        help='Platform to run on (auto-detected if not specified)'
    )
    parser.add_argument(
        '--config',
        help='Path to config file (optional)'
    )
    args = parser.parse_args()

    # Detect or use specified platform
    platform_name = args.platform if args.platform else detect_platform()
    
    print(f"🚀 Undervolt Pipeline")
    print(f"📍 Platform: {platform_name}")
    print(f"=" * 60)

    # Load configuration
    try:
        config = get_config(platform_name, args.config)
        print(f"✅ Configuration loaded successfully")
        print(f"   GPU Enabled: {config.get('GPU_ENABLED', False)}")
        print(f"   LLM Enabled: {config.get('LLM_ENABLED', False)}")
    except Exception as e:
        print(f"❌ Error loading configuration: {e}")
        sys.exit(1)

    # Run pipeline
    try:
        print(f"\n🔄 Starting pipeline...")
        result = pipeline_main()
        if result == 0 or result is None:
            print(f"\n✅ Pipeline completed successfully!")
        else:
            print(f"\n⚠️  Pipeline completed with warnings")
            sys.exit(result)
    except KeyboardInterrupt:
        print(f"\n⚠️  Pipeline interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
