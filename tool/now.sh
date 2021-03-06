#!/bin/sh

set -e

_name='glow-baby-charts'
if [ ! -z "${CIRCLE_BRANCH}" ]; then
  _name="${_name}-${CIRCLE_BRANCH}"
fi

exec now --local-config now-prod.json --name $_name --token $ZEIT_TOKEN "$@"
