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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define([
    'shared/examples/for/api',
    'io.ox/mail/api',
    'io.ox/core/api/factory'
], function (sharedExamplesFor, api, factory) {
    'use strict';

    return describe('mail API', function () {
        var apiFactory = factory({}),
            options = {
                args: {
                    getAll: {
                        action: 'threadedAll'
                    }
                }
            };

        //use shared examples
        sharedExamplesFor(api, options);

        //guarantee same number of arguments for wrapper functions
        describe('has some wrapper methods', function () {
            it('should has same number of arguments for getList', function () {
                expect(api.getList.length).to.equal(apiFactory.getList.length);
            });
            it('should has same number of arguments for get', function () {
                expect(api.get.length).to.equal(apiFactory.get.length);
            });
        });

    });
});
