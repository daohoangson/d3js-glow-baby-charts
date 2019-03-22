#!/bin/sh

set -e

{ \
  echo 'import m from "./src/backend/s3-deploy";'
  echo 'export default m;'
} >index.ts

exec micro-ts-dev
