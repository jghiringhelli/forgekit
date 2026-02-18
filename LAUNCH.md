# ForgeCraft Launch Guide

## 1. Publish to npm

```bash
# Login (opens browser)
npm login

# Verify
npm whoami

# Publish (auto-runs clean + build via prepublishOnly)
npm publish
```

Verify at: https://www.npmjs.com/package/forgecraft-mcp

---

## 2. Publish to MCP Registry

**After** the npm package is live:

```powershell
# Install mcp-publisher CLI (Windows)
$arch = if ([System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture -eq "Arm64") { "arm64" } else { "amd64" }
Invoke-WebRequest -Uri "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_windows_$arch.tar.gz" -OutFile "mcp-publisher.tar.gz"
tar xf mcp-publisher.tar.gz mcp-publisher.exe
Remove-Item mcp-publisher.tar.gz
# Move mcp-publisher.exe somewhere in your PATH

# Login via GitHub
.\mcp-publisher.exe login github
# Opens browser → authorize → enter code → done

# Publish (run from project root where server.json lives)
.\mcp-publisher.exe publish
```

Verify at: https://registry.modelcontextprotocol.io/ (search for `io.github.jghiringhelli/forgecraft`)

---

## 3. Reddit Post

**Subreddit:** r/ClaudeAI (primary), r/ChatGPTPro, r/LocalLLaMA

**Title:** I built an MCP server that gives Claude Code real engineering standards automatically — ForgeCraft

**Body:**

`claude init` is great for getting started — it scans your project and creates a basic CLAUDE.md. But it gives you a generic starting point: no architecture patterns, no testing targets, no domain-specific rules, no quality gates.

I built **ForgeCraft** to pick up where `claude init` leaves off. It's an MCP server (14 tools) that analyzes your project, auto-detects your stack, and generates a production-grade CLAUDE.md from 112 curated template blocks:

- SOLID principles with concrete, enforceable rules
- Testing pyramid with coverage targets (80%+ enforced)
- Architecture patterns (hexagonal, clean code, DDD)
- CI/CD, deployment, and 12-Factor guidance
- Domain-specific standards (fintech, healthcare, gaming, etc.)
- Quality-gate hooks that enforce standards pre-commit

**Install in one line:**
```
claude mcp add forgecraft -- npx -y forgecraft-mcp
```
Then just tell Claude *"set up this project for production"*.

Think of it as `claude init` on steroids. `claude init` gives you a generic CLAUDE.md; ForgeCraft gives you 112 curated blocks covering SOLID, testing pyramids, architecture patterns, CI/CD, and domain-specific rules — all matched to your stack. It can even merge with an existing CLAUDE.md if you've already run `claude init`.

It has 18 domain tags you can combine (API + WEB-REACT + FINTECH = merged standards with no conflicts), 3 content tiers so you're not overwhelmed on day one, and an audit tool that scores your project 0-100 against the standards.

Everything is composable YAML templates, not hardcoded — so teams can add their own standards or override defaults.

**GitHub:** https://github.com/jghiringhelli/forgecraft-mcp
**npm:** `forgecraft-mcp`

Open source (MIT). Would love feedback — what engineering standards do you wish Claude enforced?

---

## 4. Hacker News (Show HN)

**Title:** Show HN: ForgeCraft – MCP server that gives Claude Code engineering standards automatically

**Comment (post as first reply):**

`claude init` gives you a blank CLAUDE.md with basic project info. That's fine for getting started, but it doesn't give Claude any real engineering opinions — no architecture, no testing targets, no code standards.

ForgeCraft picks up where `claude init` leaves off. It's an MCP server with 14 tools. You install it in one line, tell Claude "set up this project", and it:

1. Scans your codebase and detects your stack
2. Auto-classifies into domain tags (API, React, fintech, healthcare, etc.)
3. Generates a CLAUDE.md from 112 curated template blocks
4. Adds quality-gate hooks

The templates cover SOLID, hexagonal architecture, testing pyramids, CI/CD, 12-Factor, and domain-specific patterns. Everything is YAML — no code to write if you want to add your own standards.

18 composable tags, 3 content tiers (core → recommended → optional), and an audit tool that scores compliance 0-100.

Install: `claude mcp add forgecraft -- npx -y forgecraft-mcp`

GitHub: https://github.com/jghiringhelli/forgecraft-mcp

Tech: TypeScript, MCP SDK, 111 tests. MIT licensed.

**Tips:** Post on a weekday morning US Eastern time (9-11am). Keep it factual.

---

## 5. Twitter/X Thread

**Tweet 1:**
`claude init` creates a basic CLAUDE.md. Good start.

I built ForgeCraft to take it much further — an MCP server that generates production-grade CLAUDE.md from 112 curated template blocks matched to your stack.

One line to install:
```
claude mcp add forgecraft -- npx -y forgecraft-mcp
```

Then say "set up this project" and Claude gets SOLID, testing targets, architecture patterns, and CI/CD guidance. 🧵

**Tweet 2:**
The problem with `claude init`:
• Generic CLAUDE.md — no architecture
• No testing pyramid or coverage targets
• No domain-specific rules
• No quality-gate hooks

ForgeCraft adds all of that in 30 seconds.

**Tweet 3:**
How it works:
- 18 domain tags (API, React, fintech, healthcare, gaming...)
- 112 curated template blocks
- 3 content tiers (don't overwhelm on day one)
- Auto-detects your stack from code

Tags compose — pick [API] + [FINTECH] and blocks merge without conflicts.

**Tweet 4:**
14 tools Claude picks automatically:
- setup_project (start here)
- audit_project (score 0-100)
- refresh_project (scope changed?)
- add_hook, add_module, review_project...

All open source. Templates are YAML, not code — easy to contribute.

GitHub: https://github.com/jghiringhelli/forgecraft-mcp

**Tags:** @AnthropicAI @ClaudeAI #MCP #ClaudeCode #AI #DevTools

---

## 6. Other Channels

| Channel | Action | Link |
|---------|--------|------|
| **MCP Discord** | Post in #showcase | https://modelcontextprotocol.io/community/communication |
| **Smithery** | Submit server | https://smithery.ai/ |
| **Glama.ai** | Listed from awesome-list or submit directly | https://glama.ai/mcp/servers |
| **awesome-mcp-servers (wong2)** | Open PR to add entry | https://github.com/wong2/awesome-mcp-servers |
| **awesome-mcp-servers (punkpeye)** | Open PR to add entry | https://github.com/punkpeye/awesome-mcp-servers |
| **Dev.to** | Write "How I built ForgeCraft" article | https://dev.to/ |
| **Product Hunt** | Launch post with demo GIF | https://producthunt.com/ |
| **LinkedIn** | Personal post about the problem/solution | Reaches engineering managers |

### Priority order (highest ROI first):
1. npm publish
2. MCP Registry
3. r/ClaudeAI
4. Hacker News (Show HN)
5. MCP Discord #showcase
6. Smithery
7. Twitter/X thread
8. awesome-mcp-servers PRs
9. Dev.to article
10. Product Hunt / LinkedIn
