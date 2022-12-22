# Developement environment setup
Welcome to ProBro development team!

## Requirements
1. Preferably Windows OS (also tested and works with Ubuntu 20.04)
2. Progress Openedge DB
3. Visual Studo Code (1.67 and up)

## Instalation

1. Clone repository
```
$ git clone https://github.com/BalticAmadeus/ProBro
```
2. Install nessesary dependencies
```
$ npm install
```

<!-- 
I assume that we should mention here, that machine has to have openedge package? 
Also, I think should be stated working versions of OE.

How about structure of folders? It should be introduced? 
-->

## Launching extension

To start vscode extension, you need to run project:
- ```run -> start Debugging``` or run extension without debugging.
- another instance of vsCode IDE runs with ProBro extension. Now you can test your code.


## Launching OE tests (only for Windows)

To test OE part communication with database, tests were written.

Sports2020 (not modified) was selected as a testing database. 

To launch tests:
1. Set DLC parameter in ```resources/oe/propath.ini``` file
1. from vscode terminal get to ```resources/oe/ablunitRunWin``` directory
2. run ```./launch_unit.bat PathToPfFile```
3. test result will be saved in ```oe/results.xml``` file.

## Launching Node tests
TODO

## Launching scenario tests
TODO 