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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/api/templating', ['io.ox/core/http'], function (http) {

    'use strict';

    var api = {
        /**
         * get names
         * @return { deferred} returns array of template names
         */
        getNames: function () {
            return http.GET({
                module: 'templating',
                params: {
                    action: 'names'
                }
            });
        }
    };

    return api;
});
