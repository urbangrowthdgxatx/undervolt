# Undervolt

Austin infrastructure mapper - extracting energy signals from 2.2M construction permits.

## Task Tracking

This project uses **beads** (`bd`) for persistent task tracking.

**Start of session:** Run `bd ready` to see unblocked work.

### Common Commands

```bash
bd ready                    # Show work ready to start
bd list                     # List all issues
bd create "Task"            # Create new issue
bd create "Task" --blocks bd-xxxx  # Create with dependency
bd close bd-xxxx            # Complete an issue
bd show bd-xxxx             # View issue details
```

### Workflow

1. `bd ready` - Find unblocked work
2. `bd create` - Track discovered tasks
3. `bd close` - Mark completed work

## Project Structure

```
undervolt/
├── frontend/          # Next.js visualization (bun run dev)
├── config/            # Pipeline YAML configs (TODO)
├── src/undervolt/     # Extraction pipeline (TODO)
├── resources/         # Background docs
└── README.md          # Pipeline design
```

## Key Files

- `Issued_Construction_Permits_20251212.csv` - 2.2M permits (source data)
- `frontend/src/app/page.tsx` - Main dashboard UI
- `frontend/src/components/PermitMap.tsx` - Map visualization
