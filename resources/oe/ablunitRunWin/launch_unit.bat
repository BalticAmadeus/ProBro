@ECHO OFF
echo Starting tests...

if exist "%DLC%"\promsgs goto RUNTEST
   echo DLC environment variable not set correctly - Please set DLC variable
   goto END

:RUNTEST
%DLC%\bin\prowin.exe -zdlc "%DLC%" -basekey "INI" -ininame propath.ini -pf %1 -p ABLUnitCore.p -param  "CFG=./ablunit.json" 

findstr /m "</failure>" ..\results.xml > nul
if %errorlevel%==0 (
echo Seems there are failing tests...
)

echo Finished! Check 'results.xml'

pause

:END
