#!/bin/bash
if [ -f local.conf ]; then source ./local.conf; fi

ln -s /usr/share/zoneinfo ${builddir}/apps/io.ox/core/date/tz/zoneinfo 
