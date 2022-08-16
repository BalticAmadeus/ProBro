@echo off 

if "%DLC%"==""    set DLC=C:\Progress\OpenEdge
if exist "%DLC%"\promsgs goto BIN
   echo DLC environment variable not set correctly - Please set DLC variable
   goto END

:BIN
if not "%PROEXE%"=="" goto START
   set PROEXE=%DLC%\bin\_progres

if "%ICU_DATA%"==""    set ICU_DATA="%DLC%\bin\icu\data\\"

cd %~dp0

"%PROEXE%" %1 %2 %3 %4 %5 %6 %7 %8 %9

:END
