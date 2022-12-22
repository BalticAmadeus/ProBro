# Developement environment setup
Welcome to ProBro development team!

## First things first - instalation

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









## Running OE part tests

To test OE part communication with database, tests were written.

Sports2020 (not modified) were selected as a testing database. 

To launch test:
 - from vscode terminal get to ```resources/oe/ablunitRunWin``` directory
 - run ```./launch_unit.bat FullPathToTestDb```.
 - test result will be saved in ```oe/results.xml``` file.