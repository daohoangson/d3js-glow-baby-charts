#!/bin/sh

set -e

cat now-prod.json \
  | sed '/@glow-baby-charts/d' \
  | tee now.json

exec now-alpine --debug --token xxx dev
