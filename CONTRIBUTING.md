Contributing
------------

# Bug reports

https://bugs.open-xchange.com/

# Features

- do *not commit* into develop branch directly
- please create a feature branch instead
- mind the naming conventions
- do *not merge* develop into your feature branch - please [rebase](https://www.atlassian.com/git/tutorials/merging-vs-rebasing) your changes instead
- rebase your branches from time to time, use the force when pushing
    - important branches are protected, so you can't force push to those
    - only force push with agreement of the person who first created the branch
    - don't worry to break anything, we got backups and protected branches
- after you finished your work please create a [new merge request](https://gitlab.open-xchange.com/frontend/core/merge_requests/new)

**Branch naming conventions**

```
feature/[jira-id]_[short-description]
bug/[bugzilla-id]_[short-description]
poc/[aha-id]_[short-description]
```

```
# example: git checkout -b feature/oxui-200_gitlab develop
git checkout -b <mybranch> develop 
```

