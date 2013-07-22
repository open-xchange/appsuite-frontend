// Karma configuration
// Generated on Mon Apr 22 2013 18:13:37 GMT+0200 (CEST)


// base path, that will be used to resolve files and exclude
basePath = '';


// frameworks to use
frameworks = ['jasmine', 'requirejs'];


// list of files / patterns to load in the browser
files = [
    'spec/main-test.js',
    'spec/disable_amd.js', // disable AMD test, to prevent jquery mobile from defining anonymous module
    'spec/pre_boot.js',
    process.env['builddir'] + '/boot.js',
    'spec/restore_amd.js',
    'lib/node_modules/sinon/pkg/sinon.js',
    {pattern: 'spec/**/*_spec.js', included: false},
    {pattern: 'spec/shared/**/*.js'},
    {pattern: 'apps/**/*.js', included: false}
];


// list of files to exclude
exclude = [
];


// test results reporter to use
// possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
reporters = ['dots'];


// web server port
port = 9876;


// cli runner port
runnerPort = 9100;


// enable / disable colors in the output (reporters and logs)
colors = true;


// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_WARN;


// enable / disable watching file and executing tests whenever any file changes
autoWatch = true;


// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
browsers = ['PhantomJS'];


// If browser does not capture in given timeout [ms], kill it
captureTimeout = 60000;


// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = false;

proxies =  {
    '/api/': 'http://localhost:8337/appsuite/api/',
    '/apps/': 'http://localhost:8337/appsuite/apps/'
}

// plugins to load
plugins = [
  'karma-jasmine',
  'karma-requirejs',
  'karma-phantomjs-launcher',
  'karma-chrome-launcher'
];
