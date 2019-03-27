#!/bin/sh

set -e

_name=glow-baby-charts

docker build tool -t $_name

exec docker run --rm -it --name $_name \
  --env-file .env \
  -p 3000:3000 \
  -p 5000:5000 \
  -v "${PWD}:/app" -w /app \
  -v "${PWD}/.data/root/.cache:/root/.cache" \
  -v "${PWD}/.data/root/.npm:/root/.npm" \
  $_name bash
