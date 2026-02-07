# Contributing to Undervolt

Thank you for your interest in contributing to Undervolt! This project transforms Austin's 2.3M construction permits into urban growth intelligence using NVIDIA hardware.

## Getting Started

### Prerequisites

- Node.js 20+ (via nvm recommended)
- Python 3.10+
- NVIDIA GPU (for ML pipeline)
- Supabase account (for database)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/undervolt.git
   cd undervolt
   ```

2. **Set up the frontend**
   ```bash
   cd frontend
   nvm use 20
   npm install
   cp .env.example .env.local
   # Edit .env.local with your credentials
   npm run dev
   ```

3. **Set up Python environment** (for ML pipeline)
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

## How to Contribute

### Reporting Issues

- Use GitHub Issues to report bugs or suggest features
- Include steps to reproduce for bugs
- Tag issues appropriately (bug, enhancement, question)

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

### Code Style

**Frontend (TypeScript/React)**
- Use TypeScript for all new files
- Follow existing component patterns
- Use Tailwind CSS for styling
- Keep components focused and small

**Python**
- Follow PEP 8
- Use type hints
- Document functions with docstrings

### Commit Messages

Use clear, descriptive commit messages:
- `feat: add battery trend visualization`
- `fix: correct solar count in ZIP 78744`
- `docs: update deployment guide`
- `refactor: simplify chat API route`

## Project Structure

```
undervolt/
├── frontend/          # Next.js application
│   ├── src/app/       # Pages and API routes
│   ├── src/components/# React components
│   └── src/lib/       # Utilities and clients
├── src/               # Python ML pipeline
├── scripts/           # Utility scripts
├── docs/              # Documentation
└── data/              # Data files (not in git)
```

## Areas for Contribution

### High Impact
- Performance optimizations for large datasets
- New visualization types
- Mobile responsiveness improvements
- Accessibility improvements

### Documentation
- Deployment guides for different hardware
- API documentation
- Tutorial content

### Testing
- Unit tests for API routes
- Integration tests for ML pipeline
- End-to-end tests for UI

## Questions?

- Open a GitHub Issue
- Contact the team at undervolt-team@aisoft.us

## Code of Conduct

Be respectful, inclusive, and constructive. We're building tools to help cities understand their growth - let's do it collaboratively.
