/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define('shared/examples/for/api', [], function () {
    return function (api, options) {
        options = _.extend({
            markedPending: {}
        }, options);

        afterEach(function () {
            this.handleExpectedFail(options.markedPending);
        });

        describe('a basic API class', function () {
            describe('has some get methods', function () {
                it('should define a getAll method', function () {
                    expect(api.getAll).toBeDefined();
                });

                it('should define a getList method', function () {
                    expect(api.getList).toBeDefined();
                });

                it('should define a get method', function () {
                    expect(api.get).toBeDefined();
                });
            });

            describe('implements an event system', function () {
                it('should define a trigger method', function () {
                    expect(api.trigger).toBeDefined();
                });
            });
        });
    };
});
