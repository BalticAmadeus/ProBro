# Development environment setup
Welcome to ProBro development team!

## Requirements
1. Preferably Windows OS (also tested and works with Ubuntu 20.04)
2. Progress OpenEdge installation with developer a license (tested with 11.7, and 12.2)
3. Visual Studio Code (1.67 and up)

## Installation

1. Clone repository
```
$ git clone https://github.com/BalticAmadeus/ProBro
```
2. Install necessary dependencies
```
$ npm install
```

## Launching extension

To start vscode extension, you need to run project:
- ```run -> start Debugging``` or run extension without debugging.
- another instance of vsCode IDE runs with ProBro extension. Now you can test your code.

## Testing

### vscode config

You can add DLC to your user or workspace `settings.json`, eliminating the need to specify DLC in each new terminal. 
```
    "terminal.integrated.env.windows": {
        "DLC": "path-to-progress"
    }
```

`.vscode/settings.json` is part of the repo adding it there makes settings.json appear as changed in git. 
Adding it to user settings may not be suitable if you work with multiple OpenEdge versions

### Create sp2k db

1. from vscode terminal in the workspace directory
2. execute 
```
$env:DLC="path-to-progress"
&$env:DLC\ant\bin\ant.bat create_db
```

### Launching OE tests (only for Windows)

To test OE part communication with database, tests were written.

Sports2020 (not modified) was selected as a testing database. 

To launch tests:
1. from vscode terminal get to ```resources/oe/ablunitRunWin``` directory
2. execute 
```
$env:DLC="path-to-progress"
./launch_unit.bat sports2020.pf
```
3. test result will be saved in ```oe/results.xml``` file.

### Launching Node tests
TODO

### Launching scenario tests
TODO 