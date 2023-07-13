# ProBro

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
- Tables
  - Hidden tables
  - Launch query
  - Launch query on double click
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
  - Suggest field names (*new*)
  - View record on double-click
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
  - Insert/copy (*new*)
  - Update
- Extension settings configuration
- Supported OS
  - Windows
  - Linux
## Guide
- [Install and setup guide](resources/markdown/setup.md)
- [User manual](resources/markdown/manual.md)
- [Development setup guide](resources/markdown/dev_env_setup.md)

## Related work
- [DataDigger](https://datadigger.wordpress.com/) developed by Patrick Tingen. A great source of features and examples when working on this project.
- [vscode-abl](https://github.com/chriscamicas/vscode-abl) a VSCode plugin for ABL.

## Changelog

Full changelog is available [here](CHANGELOG.md)

## Sponsored by [Baltic Amadeus](https://www.ba.lt/en).

[![BA](https://raw.githubusercontent.com/BalticAmadeus/ProBro/main/resources/images/Balticmadeus_RGB-01.jpg)](https://www.ba.lt/en)
