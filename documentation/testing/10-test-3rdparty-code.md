---
title: Testing 3rd-party code
description: How to add automatic testing to UI plugins
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Testing_3rd-party_code
---

# Libraries

- [Mocha](http://visionmedia.github.io/mocha/) - the fun, simple, flexible JS testing framework
- [Sinon.JS](http://sinonjs.org/) - Standalone test spies, stubs and mocks for JavaScript.
- [Karma Runner](http://karma-runner.github.io/) - test runner
- [Chai.js](http://chaijs.com/) - Assertion framework
- [karma-ox-ui](https://github.com/Open-Xchange-Frontend/karma-ox-ui) - Running unit tests in AppSuite context

The [shared grunt configuration](https://github.com/Open-Xchange-Frontend/shared-grunt-config) ships with most of the parts pre-configured.
Since we use many standard libraries, this approach can be extended as you wish.

# Running the tests

There are multiple targets provided in [shared grunt configuration](https://github.com/Open-Xchange-Frontend/shared-grunt-config).

The `grunt/local.conf.json` needs to be configured and point to an existing build of the core UI (coreDir setting).
When testing on a machine with the core UI installed from distribution packages, also the German translations need to be installed to run the tests.
After that, coreDir can be set to _/opt/open-xchange/appsuite/_.

## development environment

The recommended way to start testing is to run:

```javascript
grunt dev
```

This will start a connect server, the karma test server and a watcher for changes.
Optionally, it is possible to connect multiple browsers to the host running the karma server (port 9876).
Tests will run in those browsers, too. You can trigger a test run manually by running:

```javascript
grunt testrun
```

in another terminal. This will be done automatically by the grunt watch task, after any source file of your project has been changed.

## CI environment

In continuous integration (CI) environments, it is also possible to run `grunt build copy:specs karma:continuous`.
When using [yo ox-ui-module template](https://github.com/Open-Xchange-Frontend/generator-ox-ui-module), `npm test` defaults to this command, too.
