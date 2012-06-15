@echo off

echo node.exe lib/jake/bin/cli.js %*

cd /D %~dp0

IF "%1"=="" goto DoCompile
IF "%1"=="--trace" goto DoCompile

node.exe lib/jake/bin/cli.js %*

goto Done

:DoCompile

SET _TMPFILE=%tmp%\oxwebbuild.log
rem Ignore --trace to avoid strange stack trace output, don't pass any params
node.exe lib/jake/bin/cli.js 2> %_TMPFILE%
type %_TMPFILE%
del /q %_TMPFILE%

:Done
