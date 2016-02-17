// Karma configuration
// Generated on Fri Jun 28 2013 12:45:50 GMT+0200 (CEST)

var fs = require('fs');
var localConf;

if (fs.existsSync('grunt/local.conf.json')) {
    localConf = JSON.parse(fs.readFileSync('grunt/local.conf.json'));
}
module.exports = function (config) {

    config.set({

        // base path, that will be used to resolve files and exclude
        basePath: 'build/',
        builddir: 'build/',

        // frameworks to use
        frameworks: ['ox-ui', 'sinon', 'mocha', 'chai'],

        // list of files / patterns to load in the browser
        files: [
            'spec/main-test.js',
            {pattern: 'spec/**/*_spec.js', included: false },
            {pattern: 'spec/fixtures/**/*.*', included: false, served: true },
            {pattern: 'spec/shared/**/*.js' }
        ],

        // list of files to exclude
        exclude: [
        ],

        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters: ['dots'],

        // web server port
        port: 9876,

        // cli runner port
        runnerPort: 9100,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_ERROR,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: ['PhantomJS'],

        phantomjsLauncher: {
            options: {
                viewportSize: { width: 1024, height: 768 }
            },
            exitOnResourceError: true
        },

        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 60000,

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false,

        proxies:  {},

        junitReporter: {
            outputFile: 'reports/test-results.xml'
        },

        appserver: localConf.appserver
    });
};
