#!/usr/bin/env bash
# Run the exposure-math unit tests in a throwaway Node container,
# so Node never has to be installed on the host.
set -euo pipefail
cd "$(dirname "$0")"

command -v docker >/dev/null || { echo "error: docker not found in PATH" >&2; exit 1; }

docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test
