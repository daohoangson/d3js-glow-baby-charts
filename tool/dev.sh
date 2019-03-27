#!/bin/sh

set -e

./tool/now.json.ts \
  | tee now.json

exec now-linux --debug --token xxx dev
