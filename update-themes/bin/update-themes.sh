#!/bin/sh

umask 022

cd "$(dirname "$0")/.."

TESTFILE="apps/themes/.need_update"

for key in $@
do
    key="$1"
    shift

    case $key in
        --if-needed)
        [ ! -f $TESTFILE ] && echo "Themes up-to-date" && exit 0 || echo "Themes need update"
        shift
        ;;
        --later)
        touch $TESTFILE
        echo "Run update-themes with --if-needed option to update themes, later"
        exit 0
    esac
done

[ -f $TESTFILE ] && rm $TESTFILE

if [ -z $NODEJS ]
then
    if command -v nodejs > /dev/null; then
        NODEJS=nodejs
    elif command -v node > /dev/null; then
        NODEJS=node
    else
        echo 'Updating themes... (this may take a while)'
        echo 'WARNING: You are using Rhino (JS in a JVM) to compile the themes.'
        echo 'This is very slow and tested less extensive, because using nodejs to compile the themes is recommended.'
        echo 'To speed up this process, and use a better tested version please install the optional nodejs dependency.'
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
