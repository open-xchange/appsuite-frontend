/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

/* eslint-env node, es2017 */
let testRunContext;

// please create .env file based on .evn-example
require('dotenv-defaults').config();

const codeceptDriver = process.env.CODECEPT_DRIVER;
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
                '--disable-web-security',
                '--disable-dev-shm-usage'
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
        require: './helper',
        mxDomain: process.env.MX_DOMAIN,
        serverURL: process.env.PROVISIONING_URL,
        contextId: process.env.CONTEXT_ID,
        filestoreId: process.env.FILESTORE_ID,
        smtpServer: process.env.SMTP_SERVER,
        imapServer: process.env.IMAP_SERVER,
        admin: {
            login: process.env.E2E_ADMIN_USER,
            password: process.env.E2E_ADMIN_PW
        }
    },
    FileSystem: {},
    MockRequestHelper: {
        require: '@codeceptjs/mock-request'
    }
};

if (codeceptDriver !== 'puppeteer') delete helpers.Puppeteer;
if (codeceptDriver !== 'webdriver') delete helpers.WebDriver;

module.exports.config = {
    tests: './tests/**/*_test.js',
    timeout: 120,
    output: './output',
    helpers,
    include: {
        I: './actor',
        users: './users',
        contexts: './contexts',
        // pageobjects
        contacts: './pageobjects/contacts',
        calendar: './pageobjects/calendar',
        mail: './pageobjects/mail',
        portal: './pageobjects/portal',
        drive: './pageobjects/drive',
        settings: './pageobjects/settings',
        tasks: './pageobjects/tasks',
        dialogs: './pageobjects/dialogs',
        // widgets
        autocomplete: './widgetobjects/contact-autocomplete',
        contactpicker: './widgetobjects/contact-picker',
        mailfilter: './widgetobjects/settings-mailfilter',
        search: './widgetobjects/search',
        toolbar: './widgetobjects/toolbar',
        topbar: './widgetobjects/topbar'
    },
    bootstrap: async () => {
        // setup chai
        var chai = require('chai');
        chai.config.includeStack = true;
        // setup axe matchers
        require('./axe-matchers');

        // set moment defaults
        // note: no need to require moment-timezone later on. requiring moment is enough
        var moment = require('moment');
        require('moment-timezone');
        moment.tz.setDefault('Europe/Berlin');

        var codecept = require('codeceptjs'),
            config = codecept.config.get(),
            helperConfig = config.helpers.OpenXchange,
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
        let ctxData;

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

        try {
            const defaultCtx = await getDefaultContext();
            if (typeof helperConfig.mxDomain === 'undefined') helperConfig.mxDomain = await guessMXDomain(defaultCtx);
            if (typeof helperConfig.filestoreId === 'undefined') helperConfig.filestoreId = defaultCtx.filestoreId;
            ctxData = {
                id: helperConfig.contextId,
                filestoreId: helperConfig.filestoreId
            };
            testRunContext = await contexts.create(ctxData);
        } catch (err) {
            console.error(`Could not create context ${JSON.stringify(ctxData, null, 4)}.\nError: ${err.faultstring}`);
            throw new Error(err.message);
        }

        if (typeof testRunContext.id !== 'undefined') helperConfig.contextId = testRunContext.id;
        await seleniumReady.catch(err => console.error(err));

        const deadline = +new Date() + 10 * 60 * 1000;
        while (deadline >= +new Date()) {
            try {
                const res = await fetch(process.env.LAUNCH_URL);
                if (res.ok) break;
            } catch (e) {
                console.warn(e.message);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            console.warn('Launch URL not reachable, trying again');
        }
        if (deadline < +new Date()) throw new Error('Launch URL not reachable within deadline');
    },
    teardown: async function () {

        var { contexts } = global.inject();
        // we need to run this sequentially, less stress on the MW
        for (let ctx of contexts.filter(ctx => ctx.id > 100)) {
            if (ctx.id !== 10) await ctx.remove().catch(e => console.error(e.message));
        }

        //HACK: defer killing selenium, because it's still needed for a few ms
        setTimeout(function () {
            require('@open-xchange/codecept-helper').selenium.stop();
        }, 500);
    },
    plugins: {
        allure: { enabled: true },
        testrail: {
            require: './plugins/testrail',
            host: process.env.TESTRAIL_HOST || 'https://testrail.local',
            user: process.env.TESTRAIL_USERNAME || 'testuser',
            password: process.env.TESTRAIL_API_KEY || 'testkey',
            project_id: process.env.TESTRAIL_PROJECTID || '1',
            runName: process.env.TESTRAIL_RUNNAME || 'test',
            enabled: process.env.TESTRAIL_ENABLED || false
        },
        browserLogReport: {
            require: './plugins/browserLogReport',
            enabled: true
        },
        filterSuite: {
            enabled: process.env.CI && (process.env.SUITE_SERVICE_URL || process.env.FILTER_SUITE),
            require: '@open-xchange/codecept-horizontal-scaler',
            suiteFilePath: process.env.FILTER_SUITE,
            filter: process.env.runOnly === 'true' ? () => false : undefined,
            report: process.env.FILTER_REPORT || 'filter_report.json'
        },
        // leave this empty, we only want this plugin to be enabled on demand by a developer
        pauseOnFail: {}
    },
    rerun: {
        minSuccess: process.env.MIN_SUCCESS,
        maxReruns: process.env.MAX_RERUNS
    },
    name: 'App Suite Core UI'
};
