# Change Log

## 1.4.0 (2023-08-03)
### Changed
- Fixed various small bugs

### Added
- Default DLC import from ```settings.json```
- Default Databases import from ```openedge-project.json```
- Shortcuts to OE tools (for Windows)
- Possibility to enable/disable triggers

## 1.3.2 HF (2023-06-30)

### Changed
- Fixed socket server crash on linux

## 1.3.1 (2023-06-29)

### Changed
- Fixed processor is busy bug
- Fixed filed and index table not visible when opening bug
- Fixed various other small bugs

### Added
- Development process improvements

## 1.3.0 (2023-06-20)
### Changed
- Fixed deleting connections
- Fixed various small bugs

### Added
- Field name suggestions
- Create a copy of record
- Possibility to have multiple vs code instances


## 1.2.2 (2023-03-03)
### Changed
- Fixed issue with writing socket data
- Fixed various small bugs

### Added
- Extension settings configuration for temporary files (-T)

## 1.2.1 (2023-02-17)
### Changed
- Fixed critical issue for Linux
- Fixed various small bugs

### Added
- Extension settings configuration for logging

## 1.2.0 (2023-01-30)
### Added
- D file export
- Extension settings configuration

## Changed
- Fixed Fields explorer bugs
- GUI improvements
- Fixed various small bugs

### Changed
- Fixed various small bugs
- Improved popup window design

## 1.1.0 (2022-12-23)
### Added
- Support for Linux OS
- Filtering to fields table
- Connection status indicator
- Launch Query on double click
- Install, setup documentation and user manual

### Changed
- Fixed various small bugs
- Improved popup window design

## 1.0.1 HF (2022-11-18)
### Changed
- Fixed critical WebViews issue which appeared after VS Code 1.73 release
- Removed MATCH logic for better performance when filtering data

## 1.0.0
### Added
- New options for data exporting
- Edit connection
- Read record on double-click

### Changed
- Fixed test connection bug
- Fixed array fields bug
- Other minor bug fixes and improvements

## 0.4.0
### Added
- Linux support
- Show only selected fields

### Changed
- Fixed issues with updating logical decimal and integer fields
- Fixed horizontal scroll flickering
- Fixed DictDB issue
- Export popup design improvements

## Initial releases [0.1.0 - 0.3.1]

### Added
- Connection to Progress DB:
  - Connect to Progress DB via ABL Socket server
  - Connect to multiple local Progress DBs
  - Custom connection groups
  - Deleting Connections
- Tables
  - Hidden tables
  - Launch query
- Indexes
- Fields
- Query data
  - Server-side multi-sorting
  - Server-side multi-filtering
  - Lazy loading
  - JSON/OE formatting
  - Custom queries
- Export
  - JSON
  - Excel
  - CSV
- CRUD operations
  - Delete multiple
  - Insert
  - Update