#!/bin/bash

# fail early
set -e 

# create dirty file with proper mode
umask 022

# package-wide compilation of ui packages must be allowed to fail or otherwise
# deinstallation via package manager fails, too. For this the script is called
# without any parameters.
#
# installation-wide compilation during server start should fail if any of the
# ui packages can't be compiled or otherwise the server starts in a broken
# state. For this the script is called with --if-needed.
STRICT=0

TESTFILE="apps/themes/.need_update"

bail () {
  if [ $STRICT -eq 1 ]
  then
    echo "failed!"
    exit 1
  else
    echo 'failed! If a subsequent theme update finishes without errors,' \
         'you can ignore the above error message.'
    exit 0
  fi
}

cd "$(dirname "$0")/.."

for key in "$@"
do
    case "$key" in
        --if-needed)
        if [ ! -f $TESTFILE ]
        then
          echo "Themes up-to-date"
          exit 0 
        else
          echo "Themes need update"
          STRICT=1;
        fi
        ;;
        --later)
        touch $TESTFILE
        echo "Run update-themes with --if-needed option to update themes later"
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
