#!/bin/sh

if command -v nodejs > /dev/null; then NODEJS=nodejs; else NODEJS=node; fi

os=`uname`
if [[ "$os" == 'Darwin' ]]; then
    $NODEJS lib/appsserver.js /Library/WebServer/Documents/appsuite/apps
else
    $NODEJS lib/appsserver.js
fi
