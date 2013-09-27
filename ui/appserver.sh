#!/bin/sh
"$(dirname "$(readlink "$0" || echo "$0")")/bin/appserver" "$@"
