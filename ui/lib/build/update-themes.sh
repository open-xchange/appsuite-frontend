#!/bin/sh

umask 022

cd "$(dirname "$0")/.."

rm -rf apps/themes/*/less

if [ -z $NODEJS ]
then
    if command -v nodejs > /dev/null; then
        NODEJS=nodejs
    elif command -v node > /dev/null; then
        NODEJS=node
    else
        echo 'Updating themes... (this may take a while)'
        java -jar /opt/open-xchange/bundles/com.openexchange.scripting.rhino/lib/js.jar \
             share/update-themes.js \
        || echo 'If a subsequent theme update finishes without errors,' \
                'you can ignore the above error message.'
        exit 0
    fi
fi

echo 'Updating themes...'
$NODEJS share/lib/jake/bin/cli.js -f share/lib/build/themes.js update-themes \
    builddir=. --trace \
|| echo 'If a subsequent theme update finishes without errors,' \
        'you can ignore the above error message.'
