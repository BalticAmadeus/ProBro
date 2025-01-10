# Change Log

## 1.9.0 (2025-01-10)

### Changed

- Extension startup issue.
- DB connections with "-".
- Minor UI/UX improvements.
- Fixed various small bugs.

### Added

- User defined views.

## 1.8.0 (2024-11-08)

### Changed

- Fixed create, edit and delete issue.
- Windows OS theme adaptabtability bug fix.
- Fixed logical fields disappearing in JSON format.
- Fixed issue where query errors prevented proceeding, subsequent valid queries can be executed to obtain results.
- Refresh button works both for workspace and global connections.
- Fixed various small bugs.

### Added

- Support for multiple OE versions.
- Data Administration, Data Dictionary or Procedure Editor tools open with connection to selected database.
- Interactive modals with improved UI.

## 1.7.0 (2024-04-08)

### Changed

- Reuse existing tabs when opening query grid windows.
- Fixed various small bugs.

### Added

- Favourite tables.

## 1.6.0 (2024-02-07)

### Changed

- Fixed updating issue when creating new fields.
- Fixed column width formatting.
- Fixed various small bugs.

### Added

- Show ROWID ( and RECID) in query data table.
- Query grid table size management.

## 1.5.2 (2023-12-21)

### Changed

- Fixed table size issues.
- Fixed issues with export.

### Added

- Can jump to query editor form abl code (feature preview).

## 1.5.1 (2023-12-08)

### Changed

- Query window adjustments.
- Fixed various small bugs.

### Added

- Read only connection support.

## 1.5.0 (2023-11-10)

### Changed

- Settings naming consistency.
- Fixed various small bugs.

### Added

- Connection multi select for databases.
- Read ony screen for databases imported from openedge-project.json.
- New setting to disable filtering as you type.
- Individual refresh for connections.

## 1.4.1 (2023-10-02)

### Changed

- Changed proBro logo.

### Added

- possibility to disable automatic database import.

## 1.4.0 (2023-08-03)

### Changed

- Fixed various small bugs

### Added

- Default DLC import from `settings.json`
- Default Databases import from `openedge-project.json`
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
