#!/bin/bash
# Frontend test runner

set -e

cd "$(dirname "$0")/../../.."

echo "🧪 Running frontend tests..."
cd frontend
npm test "$@"
