#!/bin/bash

if [ ! -d apps ]
then
    echo No apps directory found. Are you in the correct directory? >2
    exit 1
fi

if command -v nodejs > /dev/null; then NODEJS=nodejs; else NODEJS=node; fi

export BASEDIR=$(dirname $(dirname $0))

if [ -f ./local.conf ]; then source ./local.conf; fi

$NODEJS $nodeopts "$BASEDIR/lib/jake/bin/cli.js" -f "$BASEDIR/Jakefile" "$@"
