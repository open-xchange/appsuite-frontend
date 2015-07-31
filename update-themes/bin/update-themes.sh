#!/bin/bash

# fail early
set -e 

# create dirty file with proper mode
umask 022

TESTFILE="apps/themes/.need_update"

bail () {
  echo 'failed! If a subsequent theme update finishes without errors,' \
       'you can ignore the above error message.'
  exit 1
}

cd "$(dirname "$0")/.."

for key in "$@"
do
    case "$key" in
        --if-needed)
        [ ! -f $TESTFILE ] && echo "Themes up-to-date" && exit 0 || echo "Themes need update"
        ;;
        --later)
        touch $TESTFILE
        echo "Run update-themes with --if-needed option to update themes, later"
        exit 0
    esac
done

# check for nodejs
for candidate in nodejs node
do
  command -v $candidate > /dev/null && NODEJS=$candidate && break
done

if [ -z $NODEJS ]
then
    echo 'Updating themes... (this may take a while)'
    java -Xmx1g -jar /opt/open-xchange/bundles/com.openexchange.scripting.rhino/lib/js.jar \
         share/update-themes/lib/update-themes-rhino.js || bail
else
    echo 'Updating themes...'
    $NODEJS "share/update-themes/bin/update-themes" || bail
fi

# process other scripts if they exist
[ -d "share/update-themes.d" ] && find "share/update-themes.d" -type f -executable -exec {} \; 

# delete dirty file _after_ we are done and exit cleanly
[ -f $TESTFILE ] && rm $TESTFILE
exit 0
