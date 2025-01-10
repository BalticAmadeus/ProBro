# ProBro [![CircleCI](https://dl.circleci.com/status-badge/img/circleci/A3TQhXgouuMQZcaApCXuLs/5TzkrPCZ2G3KXMTaVZGcn3/tree/main.png?style=svg&circle-token=bdac1b7587849654dc77f4ce7d640313c3319e16)](https://dl.circleci.com/status-badge/redirect/circleci/A3TQhXgouuMQZcaApCXuLs/5TzkrPCZ2G3KXMTaVZGcn3/tree/main)

An extension for Progress DB browsing.

## Current status

This open source project is in active development. Our goal is to simplify the access to Progress DB wen using VS Code as a development environment.

## Features

- Connection to Progress DB:

  - Connect to Progress DB via ABL Socket server
  - Connect to multiple local Progress DBs
  - Custom connection groups
  - Deleting Connections
  - Edit Connections
  - Connection status indicator
  - Shortcuts to OE tools
  - Possibility to import from `openedge-project.json`
  - Data Administration, Data Dictionary or Procedure Editor tools open with connection to selected database
  - Support for multiple OE versions

- Tables
  - Hidden tables
  - Launch query
  - Launch query on double click
  - Select tables form multiple databases
  - Favourite tables
  - User defined views (_new_)
  - Interactive modals with improved UI
- Indexes
- Fields
  - Filtering
  - Show only selected fields
- Query data
  - Server-side multi-sorting
  - Server-side multi-filtering
  - Lazy loading
  - JSON/OE formatting
  - Custom queries
  - Suggest field names
  - View record on double-click
  - Enable/disable filtering as you type
  - Query grid table size management
- Export
  - Formats
    - .D file
    - JSON
    - Excel
    - CSV
  - Scope
    - All records
    - Selected records
    - Filtered records
- CRUD operations
  - Delete multiple
  - Insert/copy
  - Update
  - Disable/enable triggers
- Extension settings configuration
- Supported OS
  - Windows
  - Linux

## Guide

- [Install and setup guide](https://github.com/BalticAmadeus/ProBro/blob/main/resources/markdown/setup.md)
- [User manual](https://github.com/BalticAmadeus/ProBro/blob/main/resources/markdown/manual.md)
- [Development setup guide](https://github.com/BalticAmadeus/ProBro/blob/main/resources/markdown/dev_env_setup.md)

## Related work

- [DataDigger](https://datadigger.wordpress.com/) developed by Patrick Tingen. A great source of features and examples when working on this project.
- [vscode-abl](https://github.com/chriscamicas/vscode-abl) a VSCode plugin for ABL.

## Changelog

Full changelog is available [here](https://github.com/BalticAmadeus/ProBro/blob/main/CHANGELOG.md)

## Sponsored by [Baltic Amadeus](https://www.ba.lt/en).

[![BA](https://raw.githubusercontent.com/BalticAmadeus/ProBro/main/resources/images/Balticmadeus_RGB-01.jpg)](https://www.ba.lt/en)
