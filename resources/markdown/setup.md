# Install and setup guide

## Requirements
1. Windows OS or Linux OS
2. Progress OpenEdge installation with developer a license (tested with 11.7, and 12.2)
3. Visual Studio Code (1.67 and up)

## Installation

1. Launch VS Code Quick Open (```Ctrl+P```), paste the following command, and press enter.
```
$ ext install BalticAmadeus.pro-bro
```
- Or find and install ProBro using Extensions menu

2. ProBro Icon should appear in the Activity Bar


## Setup

Currently, to set up DLC and other variables and custom parameters you need to make changes inside ProBro scripts.

We'll definitely improve this process with future releases.

### For Linux
```
/home/<user directory>/.vscode/extensions/balticamadeus.pro-bro-<version>/resources/oe/scripts/oe.sh
```

Also, change ```oe.sh``` file permissions to make it executable.

### For Windows
```
C:\Users\<user folder>\.vscode\extensions\balticamadeus.pro-bro-<version>\resources\oe\scripts\oe.bat
```