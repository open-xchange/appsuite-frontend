/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/api/quota', ['io.ox/core/http'], function (http) {

    'use strict';

    var api = {
        /**
         * get File quota and current use
         * @return {deferred} returns object with quota and use properties)
         */
        getFile: function () {
            return http.GET({
                module: 'quota',
                params: { action: 'filestore' }
            });
        },

        /**
         * get mail quota and current use
         * @return {deferred} returns object with quota and use properties)
         */
        getMail: function () {
            return http.GET({
                module: 'quota',
                params: { action: 'mail' }
            });
        },

        /**
         * get mail and file quota
         * @return {deferred} returns quota object
         */
        get: function () {
            http.pause();
            this.getMail();
            this.getFile();
            return http.resume()
                .pipe(function (req) {
                    return { mail: req[0].data, file: req[1].data };
                })
                // for demo purposes
                // TODO: comment out or remove later
                /*.pipe(function (quotas) {
                    // create fake values for testing
                    quotas.file.quota = 50 * 1024 * 1024; // 50mb limit
                    quotas.file.use = 26 * 1024 * 1024; // 26mb in use
                    quotas.mail.quota = 100 * 1024 * 1024; // 100mb limit
                    quotas.mail.use = 87 * 1024 * 1024; // 87mb in use
                    quotas.mail.countquota = 200; // 200 limit
                    quotas.mail.countuse = 191;  // 191 in use
                    return quotas;
                })*/;
        }
    };

    return api;
});