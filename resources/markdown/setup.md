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

By default DLC is taken from ```abl.configuration.runtimes``` parameter which is default setting for ABL extensions.
Alternatively, you can setup necessary environment variables in launch script.

### Launch script for Linux
```
/home/<user directory>/.vscode/extensions/balticamadeus.pro-bro-<version>/resources/oe/scripts/oe.sh
```

### Launch script for Windows
```
C:\Users\<user folder>\.vscode\extensions\balticamadeus.pro-bro-<version>\resources\oe\scripts\oe.bat
```