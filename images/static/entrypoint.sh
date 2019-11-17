#!/bin/sh

[ -z "$TIMESTAMP" ] && exec "$@"

cd /usr/share/nginx/html/appsuite

NOW=$(echo "${TIMESTAMP}" | grep -s '[0-9]\{8\}\.[0-9]\{6\}' -)
if [ -z "${NOW}" ]; then
    echo "Timestamp invalid, make sure to generate it using 'date -u +%Y%m%d.%H%M%S'"
    exit 1
fi
if [ ! -f core ]; then
    echo "HTML files not found in $(pwd)" >&2
    exit 1
fi

VERSION=$(sed -n \
    's/^.*v=\([0-9A-Za-z._-]*\)\.[0-9]\{8\}\.[0-9]\{6\}.*$/\1/p' \
    ui | head -n1)

for f in ui core signin boot.js; do
    sed -i "s/${VERSION}"'\.[0-9]\{8\}\.[0-9]\{6\}/'"${VERSION}.${NOW}/g" "$f"
done

exec "$@"
