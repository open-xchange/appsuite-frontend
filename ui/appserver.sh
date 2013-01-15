#!/bin/sh

if command -v nodejs > /dev/null; then NODEJS=nodejs; else NODEJS=node; fi

if [ "$1" ]
then
    $NODEJS lib/appsserver.js "$@"
else
    if [ -f local.conf ]; then source ./local.conf; fi
    $NODEJS lib/appsserver.js $builddir
fi
