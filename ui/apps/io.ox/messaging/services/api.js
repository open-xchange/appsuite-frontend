/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

//TODO: split into packages for services, accounts and messages
define('io.ox/messaging/services/api', ['io.ox/core/http'], function (http) {

    'use strict';

    var api = {
        all: function () {
            return http.GET({
                module: 'messaging/service',
                params: {
                    action: 'all'
                }
            });
        },
        get: $.noop
    };
    return api;
});
