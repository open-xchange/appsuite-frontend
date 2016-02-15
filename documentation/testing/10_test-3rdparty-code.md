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

# using karma-ox-ui

The [shared grunt configuration](http://oxpedia.org/wiki/index.php?title=AppSuite:GettingStarted_7.6.0) ships with most of the parts pre-configured. 
Still, a little setup is needed to enable automatic testing for an external app. 
Since we use many standard libraries, this approach can be extended as you wish.

__Setup__

Make sure, karma executable is installed:

```javascript
npm install -g karma-cli
```

Install a few more testing libraries locally:

```javascript
npm install --save-dev karma-mocha karma-chai karma-sinon karma-ox-ui karma-phantomjs-launcher
```

After that, in your plugin directory generate a new karma.conf.js:


```bash
 jb@wiggum ~/code/appsuite/ox_pgp_mail (git)-[ding] % karma init
 
 Which testing framework do you want to use ?
 Press tab to list possible options. Enter to move to the next question.
 > mocha
 
 Do you want to use Require.js ?
 This will add Require.js plugin.
 Press tab to list possible options. Enter to move to the next question.
 > no
 
 Do you want to capture any browsers automatically ?
 Press tab to list possible options. Enter empty string to move to the next question.
 > PhantomJS
 >

 What is the location of your source and test files ?
 You can use glob patterns, eg. "js/*.js" or "test/**/*Spec.js".
 Enter empty string to move to the next question.
 >   
 
 Should any of the files included by the previous patterns be excluded ?
 You can use glob patterns, eg. "**/*.swp".
 Enter empty string to move to the next question.
 > 
 
 Do you want Karma to watch all the files and run the tests on change ?
 Press tab to list possible options.
 > no                                                                              
 Config file generated at "/home/jb/code/appsuite/ox_pgp_mail/karma.conf.js".
```

Edit the generated file and adjust the following configuration variables:


```javascript
basePath: 'build/',
frameworks: ['ox-ui', 'sinon', 'mocha', 'chai'],
files: [
    'spec/test-main.js',
    {pattern: 'apps/**/*.js', included: false},
    {pattern: 'spec/**/*_spec.js', included: false}
]
```

Generate a main loader script to start the test after App Suite Core UI has been booted. The file should be put in `spec/test-main.js`:


```javascript
var allTestFiles = [];
var TEST_REGEXP = /_spec\.js$/i;

var pathToModule = function(path) {
  return path;
//   return path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

Object.keys(window.__karma__.files).forEach(function(file) {
  if (TEST_REGEXP.test(file)) {
    // Normalize paths to RequireJS module names.
    allTestFiles.push(pathToModule(file));
  }
});

require(['io.ox/core/extPatterns/stage'], function (Stage) {

    'use strict';

        ox.testUtils.stubAppsuiteBody();

        new Stage('io.ox/core/stages', {
            id: 'run_tests',
            index: 99999,
            run: function (baton) {
                requirejs.config({
                    // Karma serves files from '/base/apps'
                    baseUrl: '/base/apps',

                    // ask Require.js to load these files (all our tests)
                    deps: allTestFiles,

                    // start test run, once Require.js is done
                    callback: window.__karma__.start
                });
            }
        });
});
```

__Dealing with JSHINT__

JSHINT is notoriously picky. 
And rightly so. But we still need to teach it to ignore our test frameworks' peculiarities. Extend the global part of your ``.jshintrc`` by these switches:


```json
  "globals": {
       "assert": false,
       "describe": false,
       "it": false,
       "beforeEach": false,
       "afterEach": false,
       "expect": false,
       "waitsFor": false,
       "runs": false,
       "chai": false,
       "sinon": false,
       "spyOn": false,
       "xit": false,
       "xdescribe": false,
       "jasmine": false
   }
```

__Running the tests__

There are multiple targets provided in [shared grunt configuration](https://github.com/Open-Xchange-Frontend/shared-grunt-config).

The ``grunt/local.conf.json`` needs to be configured and point to an existing build of the core UI (coreDir setting). 
When testing on a machine with the core UI installed from distribution packages, also the German translations need to be installed to run the tests.
After that, coreDir can be set to _/opt/open-xchange/appsuite/_.

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
