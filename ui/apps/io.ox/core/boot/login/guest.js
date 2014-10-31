/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/boot/login/guest', [
    'io.ox/core/boot/util',
    'io.ox/core/http'
], function (util, http) {

    'use strict';

    return {

        anonymous: function () {

            console.log('guest login');

            http.GET({
                module: 'login',
                params: {
                    action: 'anonymous_login',
                    share: _.url.hash('share'),
                    target: _.url.hash('target')
                }
            })
            .then(
                function success() {
                    console.log('SUCCESS', arguments);
                    ox.trigger('login:success');
                },
                function fail() {
                    console.log('FAIL', arguments);
                    ox.trigger('login:fail');
                }
            );
        },

        known: function () {

        }
    };
});
