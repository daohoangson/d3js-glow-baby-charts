#!/bin/sh

set -e

exec docker run --rm -it \
  -p 5000:5000 \
  -v "$PWD:/app" -w /app \
  -v "$PWD/.data/root/.npm:/root/.npm" \
  node:10.15.3-alpine sh
