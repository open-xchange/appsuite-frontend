@echo off

cd /D %~dp0

set builddir=C:\Dev\Apache\htdocs\ox7
set debug=1

echo node.exe lib/jake/bin/cli.js %*
node.exe lib/jake/bin/cli.js %*

