/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */
define(['fixture!browser_support/userAgents.json'], function (userAgents) {
    describe('_.device utilities:', function () {
        afterEach(function () {
            _.device.loadUA(window.navigator);
        });

        it('should detect the testrunner', function () {
            expect(_.browser.karma).toBe(true);
        });

        it('should be defined', function () {
            expect(_.device).toBeDefined();
        });

        it('should return an object if no param was given', function () {
            var isObject = _.isObject(_.device());
            expect(isObject).toBe(true);
        });

        it('should extend underscore with some helper functions and objects', function () {
            var device = _.isObject(_.device);
            var browser = _.isObject(_.browser);
            var support = _.isObject(_.browserSupport);
            expect(device).toBe(true);
            expect(browser).toBe(true);
            expect(support).toBe(true);
        });

         it('should add a global funciton "isBrowserSupported" which returns a bool', function () {

            var browser = _.isFunction(window.isBrowserSupported);
            expect(browser).toBe(true);
            var bool = _.isBoolean(window.isBrowserSupported());
            expect(bool).toBe(true);
        });

        _(userAgents.valid).each(function (a, browser) {
            _(userAgents[browser]).each(function (b, version) {
                it('should detect ' + browser + ' ' + version, function () {
                    _.device.loadUA(userAgents.browser[browser][version]);
                    expect(_.device(browser)).toBe(true);
                    expect(_.browser[browser]).toMatch(version);
                });
            });
        });

        _(userAgents.invalid).each(function (a, number) {
            it('should use the fallback "unknown" if an unknown or broken user agent occurs', function () {
                var spy = sinon.stub(console, 'warn', function () {});
                _.device.loadUA(userAgents.invalid[number]);
                expect(spy).toHaveBeenCalledWithMatch('Could not detect browser, using fallback');
                expect(_.browser.unknown).toBe(true);
                spy.restore();
            });
        });

    });
});

