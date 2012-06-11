@echo off

cd /D %~dp0

echo node.exe lib/jake/bin/cli.js %*
node.exe lib/jake/bin/cli.js %*

