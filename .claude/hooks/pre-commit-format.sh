#!/bin/bash
# Auto-format staged files
STAGED=$(git diff --cached --name-only --diff-filter=ACM)

# TypeScript/JavaScript
echo "$STAGED" | grep '\.\(ts\|tsx\|js\|jsx\)$' | xargs -r npx prettier --write 2>/dev/null

# Re-stage formatted files
echo "$STAGED" | xargs -r git add
