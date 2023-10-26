# Release Instructions

- Everyone: Create new task in git for release plan (if it is not created already)
- Everyone: Write all done tasks to release plan like this:
  - [] #405
  - [] #394
  - [] #393
- Everyone: Update version in package.json (small update by 0.0.1 and big one by 0.1)
- Everyone: Add main information to CHANGELOG. Changed for main bug fixes and Added for main new enhancement.
- Everyone: Add features to README
- Everyone: create VSIX, with vsce package
- Everyone: test every done task on Windows (form vsix you created)
- Paulius: test every done task on linux (give same vsix to Paulius)
- Paulius: upload to Marketplace
- Everyone: Test from Marketplace (download updated ProBro form marketplace)
- Everyone: Merge release to develop
- Everyone: Merge develop to main
- Everyone: Create Github tag and release (here: https://github.com/BalticAmadeus/ProBro/releases) (target main branch).
