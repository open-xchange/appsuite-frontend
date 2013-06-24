@echo off

SET _NODECMD=%NODEJS%
IF "%_NODECMD%"=="" SET _NODECMD=node.exe

cd /D %~dp0
echo Building ui...

SET _TMPFILE=%tmp%\ui-build.log

%_NODECMD% lib\jake\bin\cli.js -f Jakefile %* 2> %_TMPFILE%
type %_TMPFILE%
del /q %_TMPFILE%
