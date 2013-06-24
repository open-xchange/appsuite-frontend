#!/bin/sh

if command -v nodejs > /dev/null; then NODEJS=nodejs; else NODEJS=node; fi

if [ -n "$1" ]
then
    $NODEJS lib/appserver.js "$@"
else
    if [ -f ./local.conf ]; then . ./local.conf; fi
    $NODEJS lib/appserver.js $builddir
fi
