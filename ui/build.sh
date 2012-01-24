#!/bin/bash

cd `dirname $0`
node lib/jake/bin/cli.js $*

# echo -e "\033[0;35m"
# echo "Copy this to your .vimrc for auto-build on save:"
# echo ":au BufWritePost $(pwd)/* !$(pwd)/build.sh"
# echo -e "\033[0m"

