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

        it('should be defined', function () {
            expect(_.device).toBeDefined();
        });

        it('should return an object if no param was given', function () {
            var isObject = _.isObject(_.device());
            expect(isObject).toBe(true);
        });

        _(userAgents).each(function (a, browser) {
            _(userAgents[browser]).each(function (b, version) {
                it('should detect ' + browser + ' ' + version, function () {
                    _.device.loadUA(userAgents[browser][version]);
                    expect(_.device(browser)).toBe(true);
                    expect(_.browser[browser]).toMatch(version);
                });
            })
        });
    });
});

