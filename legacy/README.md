# Legacy Code

Original monolithic pipeline script (deprecated).

## File

- `pipeline_cudf.py` - Original 370-line pipeline (still works)

## Usage

```bash
python legacy/pipeline_cudf.py
```

## Migration

The code has been refactored into a modular structure in `src/pipeline/`.

Use the new modular version instead:
```bash
python run_pipeline.py
```

See [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for details.
