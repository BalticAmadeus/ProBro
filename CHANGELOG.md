# Change Log

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