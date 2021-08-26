# Contributing to WestEgg

## VSCode Dev Environment Setup

Once you've been able to run westegg using the steps in the readme you'll want to setup VSCode to start making contributions. Your `.vscode/settings.xml` should look something like this:

```json
{
  "search.exclude": {
    "**/.yarn": true,
    "**/.pnp.*": true
  },
  "prettier.prettierPath": ".yarn/sdks/prettier/index.js",
  "typescript.tsdk": ".yarn/sdks/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

Restart VSCode after changing this file.

The prettier VSCode extension should also be installed. You can set this as your default formatter by doing `CONTROL+SHIFT+P` and searching for format.

## Branches, commits, and PRs

All branches, commits, and PRs made to westegg should follow the format below.

Branch name format:
`type/issue number/brief description`

Example branch name:
`bugfix/#82/fix-mongo-deprecated-connect`

Commit format:
`type: Brief description of the issue (issue number)`

Example commit name:
`bugfix: Fix connect retryWrite deprecated function param (#82)`

The types of issues can range between:
```
bugfix - Bug fixed
feature - New feature implemented
bump - Package version bump
```

or anything you think might be better suited for the issue.

Example PR:
Title should be the same as the commit message, the body should include further details if needed and a `Closes #82` in this case to update the issue to close when the PR is merged.
