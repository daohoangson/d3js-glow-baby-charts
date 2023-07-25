#!/bin/sh

set -e

npm i

npm run build

npm run --silent tool:generate-now-json |
  tee now.json

exec now --debug --token xxx dev
