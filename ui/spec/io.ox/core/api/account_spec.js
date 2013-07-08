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
define(['shared/examples/for/api',
        'io.ox/core/api/account'
       ], function (sharedExamplesFor, api) {

    describe('account API', function () {
        var options = {
            markedPending: {
                'account API a basic API class has some get methods should define a getAll method.': true,
                'account API a basic API class has some get methods should define a getList method.': true,
                'account API a basic API class has some get methods should return a deferred object for getAll.': true,
                'account API a basic API class has some get methods should return a deferred object for getList.': true
            }
        }
        sharedExamplesFor(api, options);
    });
});
