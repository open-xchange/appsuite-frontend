var fs = require('fs');
var _ = require('underscore');
var { util } = require('@open-xchange/codecept-helper');
var localConf = {};

if (fs.existsSync('grunt/local.conf.json')) {
    localConf = JSON.parse(fs.readFileSync('grunt/local.conf.json')) || {};
}
localConf.e2e = localConf.e2e || {};
localConf.e2e.helpers = localConf.e2e.helpers || {};

module.exports.config = {
    tests: './e2e/tests/**/*_test.js',
    timeout: 10000,
    output: './build/e2e/',
    helpers: {
        WebDriver: _.extend({}, {
            url: process.env.LAUNCH_URL || 'http://localhost:8337/appsuite/',
            host: process.env.SELENIUM_HOST || '10.50.0.94',
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
            }
        }, localConf.e2e.helpers.WebDriver || {}),
        OpenXchange: _.extend({}, {
            require: './e2e/helper',
            mxDomain: 'ox-e2e-backend.novalocal',
            serverURL: localConf.appserver && localConf.appserver.server || process.env.LAUNCH_URL
        }, localConf.e2e.helpers.OpenXchange || {})
    },
    include: {
        I: './e2e/actor',
        users: './e2e/users'
    },
    bootstrap: function (done) {
        // setup chai
        var chai = require('chai');
        chai.config.includeStack = true;
        // setup axe matchers
        require('./e2e/axe-matchers');

        var config = require('codeceptjs').config.get();
        if (config.helpers.WebDriver && /127\.0\.0\.1/.test(config.helpers.WebDriver.host)) {
            require('@open-xchange/codecept-helper').selenium
                .start(localConf.e2e.selenium)
                .then(done);
        } else {
            done();
        }
    },
    teardown: function () {
        //HACK: defer killing selenium, because it's still needed for a few ms
        setTimeout(function () {
            require('@open-xchange/codecept-helper').selenium.stop();
        }, 500);
    },
    plugins: {
        allure: { enabled: true },
        autoLogin2: {
            require: './e2e/lib/autologin',
            enabled: true,
            users: function (urlParams, options) {
                if (typeof urlParams === 'object') {
                    options = urlParams;
                    urlParams = [];
                }
                urlParams = [].concat(urlParams || []);
                options = Object.assign({ prefix: '' }, options);
                let user = options.user || require('codeceptjs').container.support('users')[0];
                const baseURL = util.getURLRoot(),
                    prefix = options.prefix ? `${options.prefix}/` : '',
                    url = `${baseURL}/${prefix}appsuite/ui`;

                if (user.toJSON) user = user.toJSON();

                return {
                    login(I) {
                        // this will be "I.login, with the next release of @ox/codecept-helper"
                        I.amOnPage(url + '#!!' + (urlParams.length === 0 ? '' : '&' + urlParams.join('&')));
                        I.executeAsyncScript(function ({ name, password }, done) {
                            require(['io.ox/core/extensions', 'io.ox/core/session', 'io.ox/core/extPatterns/stage']).then(function (ext, session, Stage) {
                                ext.point('io.ox/core/boot/login').extend({
                                    id: 'e2e_directLogin',
                                    before: 'autologin',
                                    login: function () {
                                        return session.login({ name, password, store: true }).then(function (data) {
                                            ox.trigger('login:success', data);
                                            done(data);
                                        }, function (result) {
                                            ox.trigger('login:fail', result);
                                            $('#io-ox-login-container').empty().append(
                                                $('<div class="alert alert-info">').text(result.error)
                                            );
                                            done({ msg: result.error });
                                        });
                                    }
                                });
                                if (!Stage.isRunning('io.ox/core/boot/login')) {
                                    require('io.ox/core/boot/main').start();
                                } else {
                                    Stage.abortAll('io.ox/core/boot/login');
                                    require('io.ox/core/boot/main').start();
                                }
                            });
                        }, {
                            name: `${user.name}${user.context ? '@' + user.context.id : ''}`,
                            password: user.password
                        });
                        I.waitForElement('#io-ox-launcher', 20);
                    },
                    check(I) {
                        I.seeElement('#io-ox-launcher');
                    },
                    fetch(I) {
                        return I.grabCookie();
                    },
                    restore(I, cookie) {
                        I.amOnPage(url + '#!!' + (urlParams.length === 0 ? '' : '&' + urlParams.join('&')));
                        I.setCookie(cookie);
                        I.waitToHide('.busy');
                    }
                };
            }
        }
    },
    name: 'App Suite Core UI'
};
