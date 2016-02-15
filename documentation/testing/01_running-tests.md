---
title: Running the ui tests
description: BDD testing infrastructure
source: http://oxpedia.org/wiki/index.php?title=AppSuite:RunTests
---

This article explains the test system of the frontend. 
It is aimed at developers that want to work with the frontend, be it creating new plugins or applications or modifying existing code using BDD. 
Bringing a BDD testing infrastructure to the frontend is still a work in progress and subject to (breaking) changes. 

# Libraries

- [Jasmine](http://pivotal.github.io/jasmine/) - JS BDD framework
- [Sinon.JS](http://sinonjs.org/) - Standalone test spies, stubs and mocks for JavaScript.
- [Karma Runner](http://karma-runner.github.io/) - test runner
- [Chai.js](http://chaijs.com/) - Assertion framework

# Setting up your system

__Before starting: Mac only__

```bash
  brew install phantomjs
```

...or link it in path and set executable bit on phantomjs binary yourself. After this follow the rest of the guide.

__All__

You need at least node version 0.8 to use the latest version of karma, which we need. 
Karma will be installed with all other development dependencies. So just make sure you ran

```bash
   npm install
```

within your ui directory in the appsuite repository.

# Running the tests

The recommended way to start testing is to run:

```bash
 grunt dev
```

This will start a connect server, the karma test server and a watcher for changes. Optionally, it is possible to connect multiple browsers to the host running the karma server (port 9876). 
Tests will run in those browsers, too. You can trigger a test run manually by running:

```bash
 grunt testrun
```

in another terminal. This will be done automatically by the grunt watch task, after any source file of your project has been changed.


