/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/api/quota', ['io.ox/core/http', 'io.ox/core/capabilities'], function (http, capabilities) {

    'use strict';

    var QuotaModel = Backbone.Model.extend({

        defaults: { quota: -1, use: 0, countquota: -1, countuse: 0 },

        constructor: function (type) {
            this.type = type;
            this.fetched = false;
            Backbone.Model.apply(this, []);
        },

        fetch: function () {

            var useExistingData = this.fetched ||
                (this.type === 'mail' && !capabilities.has('webmail')) ||
                (this.type === 'filestore' && !capabilities.has('infostore'));

            if (useExistingData) return this.toJSON();

            return http.GET({
                module: 'quota',
                params: { action: this.type }
            })
            .then(function (data) {
                this.fetched = true;
                // for demo purposes
                // if (this.type === 'mail') {
                //     data.quota = 5.88 * 1024 * 1024; // 100mb limit
                //     data.use = 4.85 * 1024 * 1024; // 87mb in use
                //     data.countquota = 200; // 200 limit
                //     data.countuse = 191;  // 191 in use
                // } else {
                //     data.quota = 50 * 1024 * 1024; // 50mb limit
                //     data.use = 26 * 1024 * 1024; // 26mb in use
                // }
                return this.set(data).toJSON();
            }.bind(this));
        }
    });

    var mailQuota = new QuotaModel('mail'),
        fileQuota = new QuotaModel('filestore');

    var requestForFileQuoteUpdates = false;

    var api = {

        mailQuota: mailQuota,
        fileQuota: fileQuota,

        getModel: function (type) {
            if (type === 'mail') return mailQuota;
            return fileQuota;
        },

        /**
         * get mail and file quota
         * @return { deferred} returns quota object
         */
        load: function () {

            http.pause();
            this.mailQuota.fetch();
            this.fileQuota.fetch();
            return http.resume().then(function () {
                return {
                    mail: mailQuota.toJSON(),
                    file: fileQuota.toJSON()
                };
            });
        },

        reload: function () {
            mailQuota.fetched = false;
            if (requestForFileQuoteUpdates) fileQuota.fetched = false;
            this.load();
        }
    };

    // get fresh quota to trigger update events
    ox.on('refresh^', function () {
        api.reload();
    });

    api.requestFileQuotaUpdates = function () {
        requestForFileQuoteUpdates = true;
    };

    return api;
});
