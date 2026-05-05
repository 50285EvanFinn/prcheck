# prcheck

> A GitHub Action and CLI utility that enforces PR description templates and reviewer assignment rules across repos.

---

## Installation

```bash
npm install -g prcheck
```

Or install as a dev dependency:

```bash
npm install --save-dev prcheck
```

---

## Usage

### CLI

```bash
prcheck --config .prcheck.yml --pr 42 --repo owner/repo
```

### GitHub Action

```yaml
name: PR Check
on: [pull_request]

jobs:
  prcheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: your-org/prcheck@v1
        with:
          config: .prcheck.yml
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Configuration (`.prcheck.yml`)

```yaml
template:
  required_sections:
    - "## Summary"
    - "## Testing"
reviewers:
  min_required: 1
  teams:
    - platform-team
```

---

## Features

- Validates PR descriptions against required template sections
- Enforces minimum reviewer counts and team assignments
- Works as a standalone CLI or drop-in GitHub Action
- Configurable per-repo via a simple YAML file

---

## License

MIT © your-org