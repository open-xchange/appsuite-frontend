#!/bin/sh
cd "$(dirname "$(readlink "$0" || echo "$0")")"
bin/build-appsuite "$@"

# echo -e "\033[0;35m"
# echo "Copy this to your .vimrc for auto-build on save:"
# echo ":au BufWritePost $(pwd)/* !$(pwd)/build.sh"
# echo -e "\033[0m"
