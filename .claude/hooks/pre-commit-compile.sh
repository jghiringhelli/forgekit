#!/bin/bash
echo "🔨 Running build check..."

# TypeScript — tsc compile check
if [ -f "tsconfig.json" ]; then
  npx tsc --noEmit 2>&1
  if [ $? -ne 0 ]; then
    echo "❌ TypeScript compilation failed. Fix type errors before committing."
    exit 1
  fi
  echo "  ✅ TypeScript compilation OK"
fi

echo "🔨 Build check passed"
