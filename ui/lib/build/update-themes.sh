#!/bin/sh
cd "$(dirname "$0")/.."
rm -r apps/themes/*/less
java -jar /opt/open-xchange/bundles/com.openexchange.scripting.rhino/lib/js.jar \
     share/update-themes.js
