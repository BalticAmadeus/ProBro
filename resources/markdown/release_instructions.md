# Release Instructions

| Number | Task                                                                                                         | Role     |
| ------ | ------------------------------------------------------------------------------------------------------------ | -------- |
| 1      | Create new task in git for release plan (if it is not created already)                                       | Everyone |
| 2      | Write all done tasks to release plan like this: - [] #405                                                    | Everyone |
| 3      | Update version in package.json (small update by 0.0.1 and big one by 0.1)                                    | Everyone |
| 4      | Add main information to CHANGELOG. Changed for main bug fixes and Added for main new enhancement             | Everyone |
| 5      | Add features to README                                                                                       | Everyone |
| 6      | create VSIX, with vsce package                                                                               | Everyone |
| 7      | test every done task on Windows (form vsix you created)                                                      | Everyone |
| 8      | test every done task on linux (give same vsix to Paulius)                                                    | Paulius  |
| 9      | upload to Marketplace                                                                                        | Paulius  |
| 10     | Test from Marketplace (download updated ProBro form marketplace)                                             | Everyone |
| 11     | Merge release to develop                                                                                     | Everyone |
| 12     | Merge develop to main                                                                                        | Everyone |
| 13     | Create Github tag and release (here: https://github.com/BalticAmadeus/ProBro/releases) (target main branch). | Everyone |
