#!/bin/sh

set -e

npm i

npm run build

./tool/now.json.ts \
  | tee now.json

exec now --debug --token xxx dev
