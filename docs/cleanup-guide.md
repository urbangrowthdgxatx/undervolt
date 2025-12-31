still# Cleanup Guide - Removing Unused Code

**Last Updated**: December 31, 2024

## Summary

After consolidating to a unified architecture, the following code is now **duplicate/unused** and can be safely removed.

---

## Files to Remove

### 1. Alternative Implementations Directory (DELETE)

**Location**: `src/pipeline/alternative_implementations/`

**Contains**:
- `run_pipeline.py` - Old generic runner
- `run_pipeline_jetson.py` - Jetson-specific runner
- `run_pipeline_dgx.py` - DGX-specific runner
- `run_pipeline_mac.py` - Mac-specific runner
- `pipeline_cudf.py` - Standalone cuDF pipeline
- `data_orchestration/pipeline.py` - Another standalone version

**Why remove**: All replaced by `run_unified.py` with automatic platform detection.

---

### 2. Duplicate Config Files (DELETE)

**Files**:
- `src/pipeline/config_jetson.py`
- `src/pipeline/config_dgx.py`
- `src/pipeline/config_mac.py`

**Why remove**: All replaced by `src/pipeline/platform.py` which auto-detects platform.

---

### 3. Old Pipeline Runner (ARCHIVE)

**File**: `run_pipeline.py` (root level)

**Why archive**: This was the previous "unified" pipeline. The new `run_unified.py` is cleaner and properly uses the platform-aware modules. Keep as backup for now.

---

### 4. Old Entry Point (ARCHIVE)

**File**: `run.py` (root level)

**Check first**: If it imports from `pipeline.main`, it's the old version and can be archived. The new unified entry is `run_unified.py`.

---

### 5. Duplicate Extraction Scripts (DELETE)

**Files**:
- `scripts/python/extract_parallel.py` - Async Ollama extraction
- `scripts/python/extract_vllm.py` - vLLM batch extraction
- `scripts/python/gpu_extract.py` - cuDF-based extraction

**Keep**:
- `scripts/python/track_energy_infrastructure.py` - Still used by run_unified.py
- `scripts/python/extract.py` - Keep for reference (has useful patterns)

**Why remove**: Different extraction approaches that were experimental. The unified pipeline uses `track_energy_infrastructure.py` directly.

---

### 6. Old Data Pipeline Modules (ARCHIVE)

**Directory**: `src/pipeline/data/`

**Contains**:
- `loader.py` - Old data loader
- `cleaner.py` - Old data cleaner

**Why archive**: Replaced by `src/pipeline/data_unified.py` which combines both with platform detection.

---

### 7. Old Clustering Module (ARCHIVE)

**Directory**: `src/pipeline/clustering/`

**Contains**:
- `kmeans.py` - Old clustering implementation

**Why archive**: Replaced by `src/pipeline/clustering_unified.py` with better platform detection.

---

## Quick Cleanup

### Automated Cleanup (Recommended)

```bash
# Removes duplicates and backs up to .cleanup-archive/
bash scripts/shell/cleanup-codebase.sh

# After testing, delete the archive:
rm -rf .cleanup-archive/
```

### Manual Cleanup

```bash
# 1. Remove alternative implementations
rm -rf src/pipeline/alternative_implementations/

# 2. Remove duplicate configs
rm src/pipeline/config_{jetson,dgx,mac}.py

# 3. Archive old runners
mkdir -p .archive
mv run_pipeline.py .archive/run_pipeline.py.old
mv run.py .archive/run.py.old  # if old version

# 4. Remove duplicate extraction scripts
rm scripts/python/extract_{parallel,vllm}.py
rm scripts/python/gpu_extract.py

# 5. Archive old modules
mv src/pipeline/data .archive/data_old
mv src/pipeline/clustering .archive/clustering_old
```

---

## What to Keep

### Core Pipeline (NEW - Keep These!)
- ✅ `run_unified.py` - Single entry point
- ✅ `src/pipeline/platform.py` - Platform detection
- ✅ `src/pipeline/data_unified.py` - Unified data loading
- ✅ `src/pipeline/clustering_unified.py` - Unified clustering
- ✅ `src/pipeline/nlp/enrichment.py` - NLP (already unified)

### Scripts (Keep)
- ✅ `scripts/python/track_energy_infrastructure.py` - Energy extraction (used by pipeline)
- ✅ `scripts/python/name_clusters.py` - Cluster naming
- ✅ `scripts/shell/update_pipeline.sh` - Auto-updates
- ✅ `scripts/shell/setup_cron.sh` - Cron setup

### Documentation
- ✅ `README.md` - Main readme
- ✅ `CLAUDE.md` - Project instructions
- ✅ `docs/guides/` - All guides
- ✅ `docs/architecture/` - Architecture docs
- ✅ `docs/performance/` - Performance docs

---

## Verification After Cleanup

```bash
# 1. Test unified pipeline still works
python run_unified.py --sample 1000 --skip-clustering

# 2. Check no import errors
python -c "from pipeline.platform import get_config; print('✓ Platform module OK')"
python -c "from pipeline.data_unified import load_data; print('✓ Data module OK')"
python -c "from pipeline.clustering_unified import cluster_data; print('✓ Clustering OK')"

# 3. Run full pipeline
python run_unified.py

# 4. Verify database
npm run db:reset
npm run db:studio
```

---

## Size Savings

| Category | Files | Lines of Code | Disk Space |
|----------|-------|---------------|------------|
| Alternative implementations | 6 files | ~1,500 lines | ~60KB |
| Duplicate configs | 3 files | ~150 lines | ~6KB |
| Old modules | 2 dirs | ~300 lines | ~15KB |
| Duplicate extraction | 3 files | ~800 lines | ~35KB |
| **Total** | **~14 files** | **~2,750 lines** | **~116KB** |

---

## Impact

### Before Cleanup
- 6 different ways to run the pipeline
- 4 config files (hard to maintain)
- 7 extraction implementations (confusing)
- Duplicate data loading code in 3 places

### After Cleanup
- 1 entry point (`run_unified.py`)
- 1 config system (auto-detects)
- 1 extraction approach (energy keywords)
- Single source of truth for each component

**Result**: Easier to maintain, clearer architecture, no confusion about which file to use.

---

## Rollback Plan

If something breaks after cleanup:

```bash
# Restore from archive
cp -r .cleanup-archive/* .

# Or from git
git checkout HEAD~1  # Go back one commit
```

---

## Next Steps

1. **Run cleanup**: `bash scripts/shell/cleanup-codebase.sh`
2. **Test everything**: `python run_unified.py --sample 1000`
3. **Commit changes**: `git add -A && git commit -m "chore: remove duplicate code"`
4. **Delete archive**: `rm -rf .cleanup-archive/`

---

**Status**: Cleanup script ready, safe to run
