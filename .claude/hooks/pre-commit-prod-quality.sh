#!/bin/bash
# Scans staged source files for anti-patterns that violate production code standards.
STAGED=$(git diff --cached --name-only --diff-filter=ACM)
SOURCE_FILES=$(echo "$STAGED" | grep -E '\.(ts|tsx|js|jsx)$' | grep -vE '(\.test\.|\.spec\.|__tests__|tests/|fixtures/|mock|\.d\.ts)')

if [ -z "$SOURCE_FILES" ]; then exit 0; fi

VIOLATIONS=0
WARNINGS=0

echo "🔍 Scanning for production code anti-patterns..."

for file in $SOURCE_FILES; do
  # Hardcoded localhost/IPs in non-config files
  if echo "$file" | grep -vqE '(config|settings|\.env)'; then
    if grep -nE '(localhost|127\.0\.0\.1|0\.0\.0\.0)' "$file" | grep -vE '(//|/\*)' > /tmp/violations 2>/dev/null; then
      if [ -s /tmp/violations ]; then
        echo "  ❌ $file — hardcoded URL/host (use config/env vars):"
        cat /tmp/violations | head -3
        VIOLATIONS=$((VIOLATIONS + 1))
      fi
    fi
  fi

  # Mock/fake/stub data in production code
  if grep -nEi '\b(mock_data|fake_data|dummy_data|stub_response|FIXME.*return|TODO.*hardcod)' "$file" > /tmp/violations 2>/dev/null; then
    if [ -s /tmp/violations ]; then
      echo "  ❌ $file — mock/stub/fake data in production code:"
      cat /tmp/violations | head -3
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  fi

  # God files (>300 lines)
  LINE_COUNT=$(wc -l < "$file")
  if [ "$LINE_COUNT" -gt 300 ]; then
    echo "  ⚠️  $file — $LINE_COUNT lines (max 300). Consider splitting."
    WARNINGS=$((WARNINGS + 1))
  fi

  # Bare Exception catches
  if grep -nE '(catch\s*\(e\)\s*\{|catch\s*\(\)\s*\{)' "$file" > /tmp/violations 2>/dev/null; then
    if [ -s /tmp/violations ]; then
      echo "  ⚠️  $file — bare exception catch (use specific error types):"
      cat /tmp/violations | head -3
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
done

rm -f /tmp/violations

if [ $VIOLATIONS -gt 0 ]; then
  echo "❌ $VIOLATIONS violation(s) found — commit blocked."
  exit 1
fi

if [ $WARNINGS -gt 0 ]; then
  echo "⚠️  $WARNINGS warning(s) found — commit allowed, but review these."
fi

echo "🔍 Production quality scan passed"
