#!/bin/sh

cd "$(dirname "$0")/.."

rm -rf apps/themes/*/less

if [ -z $NODEJS ]
then
    if command -v nodejs > /dev/null; then
        NODEJS=nodejs
    elif command -v node > /dev/null; then
        NODEJS=node; fi
    else
        java -jar /opt/open-xchange/bundles/com.openexchange.scripting.rhino/lib/js.jar \
             share/update-themes.js
        exit
    fi
fi

$NODEJS share/lib/jake/bin/cli.js -f share/lib/build/themes.js update-themes \
    builddir=. noJakefile=1 --trace
