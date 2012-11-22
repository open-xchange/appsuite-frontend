@echo off

SET _NODECMD=%NODEJS%
IF "%_NODECMD%"=="" SET _NODECMD=node.exe

echo %_NODECMD% lib/jake/bin/cli.js -f Jakefile %*

cd /D %~dp0

IF "%1"=="" goto DoCompile
IF "%1"=="--trace" goto DoCompile

%_NODECMD% lib/jake/bin/cli.js -f Jakefile %*

goto Done

:DoCompile

SET _TMPFILE=%tmp%\oxwebbuild.log
rem Ignore --trace to avoid strange stack trace output, don't pass any params
%_NODECMD% lib/jake/bin/cli.js -f Jakefile 2> %_TMPFILE%
type %_TMPFILE%
del /q %_TMPFILE%

:Done
SET _NODECMD=