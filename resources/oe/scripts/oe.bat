@echo off

if not "%~7"==""       set DLC=%~7
if exist "%DLC%"\promsgs goto BIN
   echo DLC environment variable not set correctly - Please set DLC variable
   goto END

:BIN
if not "%PROEXE%"=="" goto START
   set PROEXE=%DLC%\bin\_progres

if "%ICU_DATA%"==""    set ICU_DATA="%DLC%\bin\icu\data\\"

cd %~dp0/..

"%PROEXE%" %1 %2 %3 %4 %5 %6 %8 %9 -cpinternal UTF-8 -cpstream UTF-8 -cpcoll Basic -cpcase Basic

:END
