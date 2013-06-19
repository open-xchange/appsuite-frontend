#!/bin/sh

cd "$(dirname "$0")/.."

VERSION=$(sed -n \
    '/v=/{s/^.*v=\([0-9A-Za-z._-]*\)\.[0-9]\{8\}\.[0-9]\{6\}.*$/\1/p;q}' \
    core.appcache)

NOW=$(date -u +%Y%m%d.%H%M%S)

for f in core signin core.appcache signin.appcache; do
    sed -i "s/${VERSION}"'\.[0-9]\{8\}\.[0-9]\{6\}/'"${VERSION}.${NOW}/g" "$f"
done
