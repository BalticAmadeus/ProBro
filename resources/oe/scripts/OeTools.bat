@echo off
set connectInfo=%2 %3

set connectInfo=%connectInfo:"=%

%1\bin\prowin.exe %connectInfo%
