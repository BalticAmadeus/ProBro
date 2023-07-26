@echo off
set dbInfo=%2

set dbInfo=%dbInfo:"=%

%1\bin\prowin.exe %dbInfo%
