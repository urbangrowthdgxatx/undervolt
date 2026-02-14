# Alternative Pipeline Implementations

Historical implementations preserved for reference and comparison.

## Platform-Specific Runners

Before unified `run.py`, each platform had its own runner:

- `run_pipeline_dgx.py` - DGX-specific runner
- `run_pipeline_jetson.py` - Jetson-specific runner  
- `run_pipeline_mac.py` - Mac-specific runner
- `run_pipeline.py` - Simple wrapper

**Current approach**: Single `run.py` with auto-detection

## Monolithic Pipeline

- `pipeline_cudf.py` - Complete pipeline in single file

**Current approach**: Modular pipeline in `src/pipeline/` modules

## Data Orchestration

- `data_orchestration/` - Alternative orchestration approach

**Current approach**: Pipeline modules with unified config
