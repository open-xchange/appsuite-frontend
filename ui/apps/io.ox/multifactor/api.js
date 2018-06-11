/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * @author Greg Hill <greg.hill@open-xchange.com>
 *
 * Copyright (C) 2016-2020 OX Software GmbH
 */
define('io.ox/multifactor/api', [
    'io.ox/core/http'
], function (http) {

    'use strict';

    var api = {
        getStatus: function () {
            var def = $.Deferred();
            // Do query to server for multifactor status
            http.GET({
                module: 'multifactor',
                params: { action: 'get' }
            }).then(function (data) {
                console.log(data);
                def.resolve(data);
            }, def.reject);
            return def;
        },
        deleteDevice: function (provider, id) {
            var def = $.Deferred();
            // Do query to server for multifactor status
            http.GET({
                module: 'multifactor',
                params: { action: 'delete', deviceId: id, providerName: provider }
            }).then(function (data) {
                console.log(data);
                def.resolve(data);
            }, def.reject);
            return def;
        }
    };

    return api;

});
