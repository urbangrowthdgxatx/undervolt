#!/usr/bin/env bash
#
# Cleanup Script - Remove Duplicate and Unused Code
#
# This script removes all the duplicate implementations that were
# consolidated into the unified architecture.
#
# Run with: bash scripts/shell/cleanup-codebase.sh
#

set -e

echo "════════════════════════════════════════════════════════════════"
echo " Undervolt Codebase Cleanup"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "This will remove duplicate code that was consolidated into:"
echo "  - run_unified.py (single entry point)"
echo "  - src/pipeline/platform.py (unified config)"
echo "  - src/pipeline/data_unified.py (unified data loading)"
echo "  - src/pipeline/clustering_unified.py (unified clustering)"
echo ""
echo "⚠️  WARNING: This will DELETE files. Make sure you've committed your work!"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Create archive directory for backup
mkdir -p .cleanup-archive
echo "✓ Created .cleanup-archive/ for backups"

# 1. Remove alternative implementations (6 files)
echo ""
echo "1/7 Removing alternative implementations..."
if [ -d "src/pipeline/alternative_implementations" ]; then
    mv src/pipeline/alternative_implementations .cleanup-archive/
    echo "  ✓ Archived src/pipeline/alternative_implementations/"
else
    echo "  ⊘ Already removed"
fi

# 2. Remove duplicate config files (3 files)
echo ""
echo "2/7 Removing duplicate config files..."
for config in src/pipeline/config_jetson.py src/pipeline/config_dgx.py src/pipeline/config_mac.py; do
    if [ -f "$config" ]; then
        mv "$config" .cleanup-archive/
        echo "  ✓ Archived $config"
    fi
done

# 3. Archive old pipeline runners (keep run_unified.py)
echo ""
echo "3/7 Archiving old pipeline runners..."
if [ -f "run_pipeline.py" ]; then
    mv run_pipeline.py .cleanup-archive/run_pipeline.py.old
    echo "  ✓ Archived run_pipeline.py → .cleanup-archive/run_pipeline.py.old"
fi

if [ -f "run.py" ]; then
    # Check if it's the old version (imports from pipeline.main)
    if grep -q "from pipeline.main import main" run.py 2>/dev/null; then
        mv run.py .cleanup-archive/run.py.old
        echo "  ✓ Archived old run.py → .cleanup-archive/run.py.old"
    else
        echo "  ⊘ run.py is custom, keeping it"
    fi
fi

# 4. Remove duplicate extraction scripts (keep track_energy_infrastructure.py)
echo ""
echo "4/7 Removing duplicate extraction scripts..."
for script in scripts/python/extract_parallel.py scripts/python/extract_vllm.py scripts/python/gpu_extract.py; do
    if [ -f "$script" ]; then
        mv "$script" .cleanup-archive/
        echo "  ✓ Archived $script"
    fi
done

# Note: Keep scripts/python/extract.py for now (may have useful logic)
if [ -f "scripts/python/extract.py" ]; then
    echo "  ℹ Keeping scripts/python/extract.py (has useful logic, archive manually if needed)"
fi

# 5. Clean up duplicate old data pipeline modules
echo ""
echo "5/7 Removing old data pipeline modules..."
if [ -d "src/pipeline/data" ]; then
    # Check if it's the old version (not unified)
    if [ ! -f "src/pipeline/data_unified.py" ]; then
        echo "  ⚠️  WARNING: Unified data module not found, keeping old modules"
    else
        mv src/pipeline/data .cleanup-archive/data_old
        echo "  ✓ Archived src/pipeline/data/ → .cleanup-archive/data_old/"
    fi
fi

# 6. Clean up old clustering module (if not unified)
echo ""
echo "6/7 Removing old clustering module..."
if [ -f "src/pipeline/clustering/kmeans.py" ]; then
    if [ -f "src/pipeline/clustering_unified.py" ]; then
        mv src/pipeline/clustering .cleanup-archive/clustering_old
        echo "  ✓ Archived src/pipeline/clustering/ → .cleanup-archive/clustering_old/"
    else
        echo "  ⊘ Unified clustering not found, keeping old module"
    fi
fi

# 7. Archive outdated documentation
echo ""
echo "7/7 Cleaning up documentation..."
# Already moved to docs/archive/ in previous step
if [ -d "docs/archive" ]; then
    echo "  ✓ Old docs already in docs/archive/"
else
    echo "  ⊘ No archive directory"
fi

# Summary
echo ""
echo "════════════════════════════════════════════════════════════════"
echo " Cleanup Complete!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Removed files are backed up in .cleanup-archive/"
echo ""
echo "If everything works, you can delete the archive:"
echo "  rm -rf .cleanup-archive/"
echo ""
echo "Current unified architecture:"
echo "  ✓ run_unified.py              # Single entry point"
echo "  ✓ src/pipeline/platform.py    # Platform detection"
echo "  ✓ src/pipeline/data_unified.py   # Unified data loading"
echo "  ✓ src/pipeline/clustering_unified.py  # Unified clustering"
echo ""
echo "Next steps:"
echo "  1. Test: python run_unified.py --sample 1000"
echo "  2. Commit: git add -A && git commit -m 'chore: remove duplicate code'"
echo "  3. Delete archive: rm -rf .cleanup-archive/"
echo ""
