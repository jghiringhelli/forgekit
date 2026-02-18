# Forgekit

**MCP server that gives Claude Code production-grade engineering standards — automatically.**

One command to install. Tell Claude "set up this project" and it classifies your codebase, generates a tailored CLAUDE.md with SOLID principles, testing standards, architecture patterns, and quality-gate hooks. Your AI coding assistant stops guessing what "good code" means.

```bash
claude mcp add forgekit -- npx -y @forgekit/mcp-server
```

> **The problem**: Claude Code is powerful but has no opinion about your project's engineering standards. Without a CLAUDE.md, every session starts from zero — inconsistent patterns, no testing requirements, no architecture guidance.
>
> **The fix**: Forgekit gives Claude 14 tools that analyze your project, compose the right standards from 18 domain-specific templates, and maintain them as your project evolves.

---

## Quick Start

```bash
# 1. Install (one command, done)
claude mcp add forgekit -- npx -y @forgekit/mcp-server

# 2. Restart Claude Code, then say:
"Set up this project for production"
```

Claude will call `setup_project` which:
1. Scans your codebase (package.json, dependencies, structure)
2. Auto-detects relevant tags (`[API]`, `[WEB-REACT]`, etc.)
3. Creates `forgekit.yaml` — your project config
4. Generates a CLAUDE.md assembled from the right template blocks

That's it. Claude now has engineering standards, architecture guidance, and testing requirements tailored to your stack.

---

## What's in the Box

### 18 Tags, Composable

Tags are domain classifiers. Pick `[WEB-REACT]` + `[API]` + `[FINTECH]` and Forgekit merges the right CLAUDE.md blocks, folder structures, hooks, NFRs, and review checklists — no conflicts, no duplicates.

| Tag | What it adds |
|-----|-------------|
| `UNIVERSAL` | SOLID, testing pyramid, commit protocol, error handling (always on) |
| `API` | REST/GraphQL contracts, auth, rate limiting, API versioning |
| `WEB-REACT` | Component arch, state management, a11y, performance budgets |
| `WEB-STATIC` | Build optimization, SEO, CDN, static deployment |
| `CLI` | Arg parsing, output formatting, exit codes |
| `LIBRARY` | API design, semver, backwards compatibility |
| `INFRA` | Terraform/CDK, Kubernetes, secrets management |
| `DATA-PIPELINE` | ETL, idempotency, checkpointing, schema evolution |
| `ML` | Experiment tracking, model versioning, reproducibility |
| `FINTECH` | Double-entry accounting, decimal precision, compliance |
| `HEALTHCARE` | HIPAA, PHI handling, audit logs, encryption |
| `MOBILE` | React Native/Flutter, offline-first, native APIs |
| `REALTIME` | WebSockets, presence, conflict resolution |
| `GAME` | Game loop, ECS, physics, rendering pipeline |
| `SOCIAL` | Feeds, connections, messaging, moderation |
| `ANALYTICS` | Event tracking, dashboards, data warehousing |
| `STATE-MACHINE` | Transitions, guards, event-driven workflows |
| `WEB3` | Smart contracts, gas optimization, wallet security |

### Content Tiers — Don't Overwhelm

Not every project needs DDD and CQRS on day one. Forgekit uses a three-tier system:

| Tier | What's included | When to use |
|------|----------------|-------------|
| **core** | Code standards, testing, commit protocol, error handling | New/small projects |
| **recommended** | Core + architecture patterns, CI/CD, clean code, deployment | Most projects (default) |
| **optional** | Everything — DDD, CQRS, event sourcing, design patterns catalog | Mature teams, complex domains |

Set your tier in `forgekit.yaml` and Forgekit composes only what's appropriate.

### 14 Tools

| Tool | What it does |
|------|-------------|
| **`setup_project`** | Unified entry point — analyze, classify, configure, generate. New or existing projects. |
| **`refresh_project`** | Re-analyze after scope changes. Detects new tags, proposes config updates. |
| `classify_project` | Analyze codebase + description to suggest tags |
| `scaffold_project` | Generate full project structure (CLAUDE.md, hooks, folders, docs) |
| `generate_claude_md` | Generate or regenerate CLAUDE.md with merge support |
| `audit_project` | Score project compliance against standards (run in CI or weekly) |
| `review_project` | Structured review checklist: architecture, quality, tests, performance |
| `convert_existing` | Phased migration plan for existing codebases |
| `add_hook` | Add a quality-gate hook (pre-commit, pre-push) |
| `add_module` | Scaffold a feature module following established patterns |
| `configure_mcp` | Generate `.claude/settings.json` with recommended servers |
| `get_nfr_template` | Get NFR sections for Tech Spec generation |
| `list_tags` | List all available tags with descriptions |
| `list_hooks` | List hooks, filterable by tag |

---

## What Gets Generated

For a `[UNIVERSAL]` + `[API]` project at `recommended` tier:

```
your-project/
├── forgekit.yaml          # Project config (tags, tier, customization)
├── CLAUDE.md              # ~12 blocks: SOLID, architecture, testing, CI/CD, ...
├── Status.md              # Session continuity
├── .claude/
│   └── hooks/             # Quality gates
│       ├── pre-commit-branch-check.sh
│       ├── pre-commit-secrets.sh
│       └── ...
├── docs/
│   ├── PRD.md             # Requirements skeleton
│   └── TechSpec.md        # Architecture + NFR sections
├── src/shared/            # Config, errors, logger
├── .env.example
└── .gitignore
```

### The CLAUDE.md

This is the core value. Forgekit assembles a CLAUDE.md from curated blocks covering:

- **SOLID principles** — concrete rules, not vague advice
- **Hexagonal architecture** — ports, adapters, DTOs, layer rules
- **Testing pyramid** — coverage targets, test doubles taxonomy, property-based testing
- **Clean code** — CQS, guard clauses, immutability, pure functions
- **CI/CD & deployment** — pipeline stages, environments, preview deploys
- **Domain patterns** — DDD, CQRS, event sourcing (optional tier)
- **Design patterns** — when to use Factory, Strategy, Repository, Saga (optional tier)
- **12-Factor ops** — config, statelessness, disposability, logging

Every block is sourced from established literature (Martin, Evans, Wiggins) and adapted for AI-assisted development.

---

## Configuration — `forgekit.yaml`

After running `setup_project`, your project gets a `forgekit.yaml`:

```yaml
projectName: my-api
tags:
  - UNIVERSAL
  - API
tier: recommended
```

### Fine-tune what Claude sees

```yaml
# Exclude specific blocks
exclude:
  - cqrs-event-patterns
  - design-patterns-reference

# Or include only specific ones
include:
  - code-standards
  - testing-pyramid
  - layered-architecture

# Override template variables
variables:
  coverage_minimum: 90
  max_file_length: 400
```

### Community template packs

```yaml
# Load additional templates from npm packages or local dirs
templateDirs:
  - ./my-company-standards
  - node_modules/@forgekit-community/tag-flutter/templates
```

---

## Ongoing Maintenance

### Audit

Run `audit_project` regularly — in CI, at sprint start, or whenever:

```
Score: 72/100  Grade: C

Passing (8):
  ✅ CLAUDE.md exists
  ✅ Hooks installed (3/3)
  ✅ Test script configured

Failing (3):
  🔴 hardcoded_url: src/auth/service.ts — move to config
  🔴 status_md_current: not updated in 12 days
  🟡 lock_file: not committed

Recommendations:
  1. Move URLs to config module
  2. Update Status.md each session
  3. Commit package-lock.json
```

### Refresh

Project grew? Added a mobile app to your API? Run `refresh_project`:
- Re-scans codebase for new framework signals
- Suggests adding `[MOBILE]` tag
- Shows block count impact before/after
- Updates config and CLAUDE.md when you approve

---

## Contributing

**Templates are YAML, not code.** You can add a tag or improve patterns without writing TypeScript.

```
templates/your-tag/
├── claude-md.yaml      # CLAUDE.md blocks (with tier: core/recommended/optional)
├── structure.yaml      # Folder structure
├── nfr.yaml            # Non-functional requirements
├── hooks.yaml          # Quality gate scripts
└── review.yaml         # Code review checklists
```

Each block has an `id`, `tier`, `title`, and `content`:

```yaml
- id: my-pattern
  tier: recommended
  title: "My Pattern"
  content: |
    ## My Pattern
    Guidance goes here...
```

See [`templates/universal/`](templates/universal/) for examples. PRs welcome.

### Community Template Packs

Create an npm package with a `templates/` directory following the same structure:

```bash
npm init @forgekit-community/tag-flutter
```

Users add it to `forgekit.yaml`:
```yaml
templateDirs:
  - node_modules/@forgekit-community/tag-flutter/templates
```

---

## Development

```bash
git clone https://github.com/jghiringhelli/forgekit.git
cd forgekit
npm install
npm run build
npm test              # 111 tests
```

## License

MIT
