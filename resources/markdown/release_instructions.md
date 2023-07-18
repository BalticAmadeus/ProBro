# Release Instructions

- Create new task for release plan (if it is not created already)
- Update version in package.json (small update by 0.0.1 and big one by 0.1)
- Collect task list in release plan
- Add main information to CHANGELOG. Changed for main bug fixes and Added for main new enhancement.
- Add features to README
- create VSIX, with vsce package
- test on Windows (form vsix you created)
- test on linux (give same vsix to Paulius)
- upload to Marketplace
- Test from Marketplace (download updated ProBro form marketplace)
- Merge release to develop
- Merge develop to main
- Create Github tag and release (here: https://github.com/BalticAmadeus/ProBro/releases) (target main branch ).
