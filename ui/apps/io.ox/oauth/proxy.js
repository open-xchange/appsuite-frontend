/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/oauth/proxy', ['io.ox/core/http'], function (http) {

    'use strict';

    var that = {
        request: function (options) {
            var params = {};
            if (options.api) {
                params.api = options.api;
                delete options.api;
            }

            if (options.account) {
                params.account = options.account;
                delete options.account;
            }
            return http.PUT({
                module: 'oauth/proxy',
                params: params,
                data: options
            });
        }
    };


    return that;
});
