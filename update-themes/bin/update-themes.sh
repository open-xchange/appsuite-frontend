#!/bin/sh

umask 022

cd "$(dirname "$0")/.."

if [ -z $NODEJS ]
then
    if command -v nodejs > /dev/null; then
        NODEJS=nodejs
    elif command -v node > /dev/null; then
        NODEJS=node
    else
        echo 'Updating themes... (this may take a while)'
        java -Xmx1g -jar /opt/open-xchange/bundles/com.openexchange.scripting.rhino/lib/js.jar \
             share/update-themes/lib/update-themes-rhino.js \
        || echo 'failed! If a subsequent theme update finishes without errors,' \
                'you can ignore the above error message.'
        exit 0
    fi
fi

echo 'Updating themes...'
$NODEJS "share/update-themes/bin/update-themes" \
|| echo 'failed! If a subsequent theme update finishes without errors,' \
        'you can ignore the above error message.'

[ -d "share/update-themes.d" ] && find "share/update-themes.d" -type f -executable -exec {} + || exit 0

