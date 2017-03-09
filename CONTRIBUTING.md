Contributing
------------

# Bug reports

- [Guidelines](https://intranet.open-xchange.com/wiki/qa-team:guides:bugzilla.guide#required_information)
- [File new bug](https://bugs.open-xchange.com/enter_bug.cgi?product=OX%20App%20Suite)
- [List open bugs](https://bugs.open-xchange.com/buglist.cgi?component=Web%20Frontend&list_id=2162361&product=OX%20App%20Suite&resolution=---)


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

# Commmits

## Feature development

It is helpfull to provide the jira story id within the commit message. A commonly used template looks like as follows:

**Template**

```
<FEATURE-ID>: <FEATURE-SUMMARY>

<CHANGES>
```

**Example**

```
OXUI-287: As a user I can disable links in certain folders

add confirmed_spam to default folders when feature is activated
```

## Bugfix

Especially when you are fixing a level 3 bug it's quite handy to provide some more information than the usual 'fixed' statement. 
For this reason we are using the following template. 
Simply copy & paste or use it as [git commit message template](https://git-scm.com/book/tr/v2/Customizing-Git-Git-Configuration).

**Template**

```
Fixed: Bug <BUG-ID> - <BUG-SUMMARY> 

Root cause: 
Solution:
Resolved state: [Fix|Workaround]
Version: <VERSION>
Git repository: wd/frontend/web
Git branch: develop
Package name: open-xchange-appsuite
```

**Example**

```
Fixed: Bug 48361 - [L3] login not possible if folder limit is reached

Root cause: missing handling
Solution:
- use fresh new rampup.errors object provided by the middleware
- user gets notified about errors via ‘yell’
- in case of special error case ‘MSG-0113’ remove webmail capability for current session (client only)
- additional change: in case the requested after-login-appsuite-module isn’t available (f.e. missing capability) show a generic error.
Resolved state: Fix
Version: 7.8.4
Git repository: wd/frontend/web
Git branch: develop
Package name: open-xchange-appsuite
```
