#!/bin/bash

if command -v nodejs > /dev/null; then NODEJS=nodejs; else NODEJS=node; fi

export BASEDIR=$(dirname $0)

if [ -f local.conf ]; then source ./local.conf; fi
echo $BASEDIR

$NODEJS $nodeopts "$BASEDIR/lib/jake/bin/cli.js" -f "$BASEDIR/Jakefile" $*

# echo -e "\033[0;35m"
# echo "Copy this to your .vimrc for auto-build on save:"
# echo ":au BufWritePost $(pwd)/* !$(pwd)/build.sh"
# echo -e "\033[0m"

