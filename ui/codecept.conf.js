/* eslint-env node, es6  */
var defaultContext;

// please create .env file based on .evn-example
require('dotenv').config();

const codeceptDriver = process.env.CODECEPT_DRIVER || 'puppeteer';
const requiredEnvVars = ['LAUNCH_URL', 'PROVISIONING_URL', 'CONTEXT_ID'];
if (codeceptDriver === 'webdriver') requiredEnvVars.push('SELENIUM_HOST');

requiredEnvVars.forEach(function notdefined(key) {
    if (process.env[key]) return;
    console.error('\x1b[31m', `ERROR: Missing value for environment variable '${key}'. Please specify a '.env' file analog to '.env-example'.`);
    process.exit();
});

const helpers = {
    Puppeteer: {
        url: process.env.LAUNCH_URL,
        smartWait: 1000,
        waitForTimeout: 5000,
        browser: 'chrome',
        restart: true,
        windowSize: '1280x1024',
        uniqueScreenshotNames: true,
        timeouts: {
            script: 5000
        },
        chrome: {
            args: [
                `--unsafely-treat-insecure-origin-as-secure=${process.env.LAUNCH_URL}`,
                '--kiosk-printing',
                '--disable-web-security'
            ].concat((process.env.CHROME_ARGS || '').split(' '))
        },
        // set HEADLESS=false in your terminal to show chrome window
        show: process.env.HEADLESS ? process.env.HEADLESS === 'false' : false
    },
    WebDriver: {
        url: process.env.LAUNCH_URL,
        host: process.env.SELENIUM_HOST,
        smartWait: 1000,
        waitForTimeout: 30000,
        browser: 'chrome',
        restart: true,
        windowSize: 'maximize',
        uniqueScreenshotNames: true,
        desiredCapabilities: {
            browserName: 'chrome',
            chromeOptions: {
                args: ['no-sandbox']
            }
        },
        timeouts: {
            script: 5000
        }
    },
    OpenXchange: {
        require: './e2e/helper',
        mxDomain: process.env.MX_DOMAIN,
        serverURL: process.env.PROVISIONING_URL,
        contextId: process.env.CONTEXT_ID,
        filestoreId: process.env.FILESTORE_ID,
        smtpServer: process.env.SMTP_SERVER || 'localhost',
        imapServer: process.env.IMAP_SERVER || 'localhost'
    },
    FileSystem: {},
    MockRequestHelper: {
        require: '@codeceptjs/mock-request'
    }
};

if (codeceptDriver !== 'puppeteer') delete helpers.Puppeteer;
if (codeceptDriver !== 'webdriver') delete helpers.WebDriver;

module.exports.config = {
    tests: './e2e/tests/**/*_test.js',
    timeout: 10000,
    output: './build/e2e/',
    helpers,
    include: {
        I: './e2e/actor',
        users: './e2e/users',
        contexts: './e2e/contexts',
        // pageobjects
        contacts: './e2e/pageobjects/contacts',
        calendar: './e2e/pageobjects/calendar',
        mail: './e2e/pageobjects/mail',
        portal: './e2e/pageobjects/portal',
        drive: './e2e/pageobjects/drive',
        settings: './e2e/pageobjects/settings',
        tasks: './e2e/pageobjects/tasks',
        dialogs: './e2e/pageobjects/dialogs',
        // widgets
        autocomplete: './e2e/widgetobjects/contact-autocomplete',
        contactpicker: './e2e/widgetobjects/contact-picker',
        mailfilter: './e2e/widgetobjects/settings-mailfilter',
        search: './e2e/widgetobjects/search',
        toolbar: './e2e/widgetobjects/toolbar',
        topbar: './e2e/widgetobjects/topbar'
    },
    bootstrap: function (done) {
        // setup chai
        var chai = require('chai');
        chai.config.includeStack = true;
        // setup axe matchers
        require('./e2e/axe-matchers');

        // set moment defaults
        // note: no need to require moment-timezone later on. requiring moment is enough
        var moment = require('moment');
        require('moment-timezone');
        moment.tz.setDefault('Europe/Berlin');

        var codecept = require('codeceptjs'),
            config = codecept.config.get(),
            seleniumReady;
        seleniumReady = new Promise(function (resolve, reject) {
            if (config.helpers.WebDriver && /127\.0\.0\.1/.test(config.helpers.WebDriver.host)) {
                require('@open-xchange/codecept-helper').selenium
                    .start()
                    .then(resolve, reject);
            } else {
                resolve();
            }
        });

        const contexts = codecept.container.support('contexts'),
            helper = new (require('@open-xchange/codecept-helper').helper)();

        function getDefaultContext() {
            return helper.executeSoapRequest('OXContextService', 'list', {
                search_pattern: 'defaultcontext',
                auth: { login: 'oxadminmaster', password: 'secret' }
            }).then(function (result) {
                return result[0].return[0];
            });
        }
        function guessMXDomain(ctx) {
            return helper.executeSoapRequest('OXUserService', 'getData', {
                ctx,
                user: { name: 'oxadmin' },
                auth: { login: 'oxadmin', password: 'secret' }
            }).then(function (result) {
                return result[0].return.primaryEmail.replace(/.*@/, '');
            });
        }
        const testContextReady = getDefaultContext().then(function (ctx) {
            if (typeof config.helpers.OpenXchange.mxDomain !== 'undefined') return ctx.filestoreId;
            return guessMXDomain(ctx).then(mxDomain => {
                config.helpers.OpenXchange.mxDomain = mxDomain;
                return mxDomain;
            }).then(() => ctx.filestoreId);
        }).then(function (filestoreId) {
            if (typeof config.helpers.OpenXchange.filestoreId !== 'undefined') filestoreId = config.helpers.OpenXchange.filestoreId;
            const ctxData = {
                id: config.helpers.OpenXchange.contextId,
                filestoreId
            };

            function createDefaultContext() {
                return contexts.create(ctxData).then(function (ctx) {
                    defaultContext = ctx;
                }, function (err) {
                    console.error(`Could not create context ${JSON.stringify(ctxData, null, 4)}.\nError: ${err.faultstring}`);
                    if (Number(ctxData.id) === 10) {
                        console.error('Won\'t delete default context, use a different one.');
                        process.exit(1);
                    }
                    throw err;
                });
            }
            return createDefaultContext().catch(function () {
                console.warn('##--## Waiting 5s until context is removed. Press Ctrl+C to abort. ##--##');
                return new Promise(function (resolve) {
                    global.setTimeout(resolve, 5000);
                }).then(function () {
                    return helper.executeSoapRequest('OXContextService', 'delete', {
                        ctx: { id: ctxData.id },
                        auth: { login: 'oxadminmaster', password: 'secret' }
                    }).then(createDefaultContext);
                });
            });
        });

        Promise.all([
            seleniumReady,
            testContextReady
        ]).then(() => done())
        .catch(function (err) {
            console.error(err);
            done(err);
        });
    },
    teardown: function () {
        if (defaultContext.id !== 10) defaultContext.remove();
        //HACK: defer killing selenium, because it's still needed for a few ms
        setTimeout(function () {
            require('@open-xchange/codecept-helper').selenium.stop();
        }, 500);
    },
    plugins: {
        allure: { enabled: true },
        testrail: {
            require: './e2e/plugins/testrail',
            host: process.env.TESTRAIL_HOST || 'https://testrail.local',
            user: process.env.TESTRAIL_USERNAME || 'testuser',
            password: process.env.TESTRAIL_API_KEY || 'testkey',
            project_id: process.env.TESTRAIL_PROJECTID || '1',
            runName: process.env.TESTRAIL_RUNNAME || 'test',
            enabled: process.env.TESTRAIL_ENABLED || false
        },
        browserLogReport: {
            require: './e2e/plugins/browserLogReport',
            enabled: true
        },
        filterSuite: {
            enabled: true,
            require: '@open-xchange/codecept-helper/src/plugins/filterSuite',
            suite: process.env.FILTER_SUITE || [],
            filter: process.env.runOnly === 'true' ? () => false : undefined,
            report: process.env.FILTER_REPORT || 'filter_report.json'
        },
        // leave this empty, we only want this plugin to be enabled on demand by a developer
        pauseOnFail: {}
    },
    rerun: {
        minSuccess: 10,
        maxReruns: 10
    },
    name: 'App Suite Core UI'
};
