#!/bin/sh

set -e

tar -czf public.tar.gz public/*.html public/bundle.js

exec npx now --name glow-baby-charts --token $ZEIT_TOKEN
