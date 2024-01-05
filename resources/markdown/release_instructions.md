# Release Instructions

| Number | Task                                                                                                         | Role     |
| ------ | ------------------------------------------------------------------------------------------------------------ | -------- |
| 1      | Create a new task in git for release plan (if it is not created already)                                     | Everyone |
| 2      | Create release plan branch                                                                                   | Everyone |
| 3      | Write all completed tasks to release plan like this: - [ ] #405                                              | Everyone |
| 4      | Update version in package.json (small update by 0.0.1 and big one by 0.1)                                    | Everyone |
| 5      | Add main information to CHANGELOG. Changed for main bug fixes and Added for main new enhancement             | Everyone |
| 6      | Add features to README                                                                                       | Everyone |
| 7      | create VSIX, with vsce package                                                                               | Everyone |
| 8      | test every done task on Windows (form vsix you created)                                                      | Everyone |
| 9      | test every done task on linux (give same vsix to Paulius)                                                    | Paulius  |
| 10     | upload to marketplaces (marketplace.visualstudio.com, open-vsx.org)                                          | Paulius  |
| 11     | Test from Marketplaces (download updated ProBro form marketplace)                                            | Everyone |
| 12     | Merge release branch to develop.                                                                             | Everyone |
| 13     | Merge develop to main                                                                                        | Everyone |
| 14     | Create Github tag and release (here: https://github.com/BalticAmadeus/ProBro/releases) (target main branch). | Everyone |
