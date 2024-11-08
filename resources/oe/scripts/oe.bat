@echo off

if not "%~7"==""       set DLC=%~7
if exist %DLC%\bin\_progres.exe goto BIN
   echo Failed to initialize client: _progres executable is missing in %DLC%\bin.
   goto END

:BIN
if not "%PROEXE%"=="" goto START
   set PROEXE=%DLC%\bin\_progres

if "%ICU_DATA%"==""    set ICU_DATA="%DLC%\bin\icu\data\\"

set PROSTARTUP=%~dp0\oe.pf

cd %~dp0/..

"%PROEXE%" %1 %2 %3 %4 %5 %6 %8 %9 

:END
