var fs = require('fs');
var _ = require('underscore');
var localConf = {};
var seleniumProcess;

if (fs.existsSync('grunt/local.conf.json')) {
    localConf = JSON.parse(fs.readFileSync('grunt/local.conf.json')) || {};
}
localConf.e2e = localConf.e2e || {};
localConf.e2e.helpers = localConf.e2e.helpers || {};

module.exports.config = {
    'tests': './e2e/tests/**/*_test.js',
    'timeout': 10000,
    'output': './build/e2e/',
    'helpers': {
        'WebDriverIO': _.extend({}, {
            'url': process.env.LAUNCH_URL || 'http://localhost:8337/appsuite/',
            'host': process.env.SELENIUM_HOST || '10.50.0.94',
            'smartWait': 1000,
            'waitForTimeout': 30000,
            'browser': 'chrome',
            'restart': false,
            'windowSize': 'maximize',
            'desiredCapabilities': {
                'browserName': 'chrome',
                'chromeOptions': {
                    'args': ['no-sandbox', 'start-maximized']
                },
                'acceptSslCerts': true
            }
        }, localConf.e2e.helpers.WebDriverIO || {}),
        WebDriverIOExtension: {
            require: './e2e/helper/webdriverioextension_helper.js'
        },
        OpenXchange: {
            require: './e2e/helper/openxchange_helper.js'
        }
    },
    'include': {
        'I': './e2e/commands.js'
    },
    'bootstrap': function (done) {
        var users = localConf.e2e.users || [];
        if (process.env.CI) {
            users.push({
                username: 'tthamm',
                password: 'secret',
                mail: 'tthamm@ox-e2e-backend.novalocal'
            });
        }
        if (users.length === 0) throw Object({ message: 'Please define at least one user in e2e.users.' });
        global.users = users;

        var chai = require('chai');
        chai.config.includeStack = true;
        global.expect = chai.expect;
        global.AssertionError = chai.AssertionError;
        global.Assertion = chai.Assertion;
        global.assert = chai.assert;
        chai.Should();
        try {
            var config = require('codeceptjs').config.get();
            if (!/127\.0\.0\.1/.test(config.helpers.WebDriverIO.host)) {
                throw Object({ code: 'EUSEREMOTE', message: 'Not running selenium-standalone because remote is configured' });
            }
            var selenium = require('selenium-standalone'),
                seleniumOpts = _.extend({}, {
                    //selenium versions >3.4 don't seem to work on macos, currently
                    version: '3.4.0'
                }, localConf.e2e.selenium);
            selenium.start(seleniumOpts, function (err, child) {
                if (err) throw err;
                seleniumProcess = child;
                done();
            });
        } catch (e) {
            if (e.code === 'EUSEREMOTE') return done();
            //throw again, to make the error visible
            throw e;
        }
    },
    'teardown': function () {
        //HACK: defer killing selenium, because it's still needed for a few ms
        global.setTimeout(function () {
            try {
                seleniumProcess.kill();
            } catch (e) {
                //ignore me
            }
        }, 100);
    },
    'mocha': {},
    'name': 'App Suite Core UI'
};
