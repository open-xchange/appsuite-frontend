/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/compose/api', [
    'io.ox/core/http'
], function (http) {

    'use strict';

    var api = {};

    _.extend(api, Backbone.Events);

    api.queue = (function () {

        function pct(loaded, total) {
            if (!total) return 0;
            return Math.max(0, Math.min(100, Math.round(loaded / total * 100))) / 100;
        }

        return {

            collection: new Backbone.Collection().on('add remove change:pct', function () {
                var loaded = 0, total = 0, abort;
                this.each(function (model) {
                    loaded += model.get('loaded');
                    total += model.get('total');
                    abort = model.get('abort');
                });
                this.trigger('progress', { count: this.length, loaded: loaded, pct: pct(loaded, total), total: total, abort: abort });
            }),

            add: function (csid, abort) {
                this.collection.add(new Backbone.Model({ id: csid, loaded: 0, pct: 0, total: 0, abort: abort }));
            },

            remove: function (csid) {
                var model = this.collection.get(csid);
                this.collection.remove(model);
            },

            update: function (csid, loaded, total) {
                var model = this.collection.get(csid);
                if (!model) return;
                model.set({ loaded: loaded, pct: pct(loaded, total), total: total });
            }
        };
    }());

    var refreshFolders = _.throttle(function () {
        require(['io.ox/core/api/account', 'io.ox/core/folder/api', 'io.ox/mail/api'], function (accountAPI, folderAPI, mailAPI) {
            // reset collections and folder (to update total count)
            var affectedFolders = _(['inbox', 'sent', 'drafts'])
                .chain()
                .map(function (type) {
                    var folders = accountAPI.getFoldersByType(type);
                    mailAPI.pool.resetFolder(folders);
                    return folders;
                })
                .flatten()
                .value();
            folderAPI.multiple(affectedFolders, { cache: false });
            api.trigger('refresh.all');
        });
    }, 5000, { leading: false });

    // composition space
    api.space = {

        // limit of 3 currently
        add: function (obj, opt) {
            // reply or forwarding of single/multiple mails
            var references = JSON.stringify([].concat(obj.original || []));
            return http.POST({
                module: 'mail/compose',
                data: references,
                params: {
                    type: obj.type,
                    vcard: !!opt.vcard,
                    originalAttachments: opt.attachments
                },
                contentType: 'application/json'
            });
        },

        get: function (id) {
            return http.GET({ url: 'api/mail/compose/' + id });
        },

        list: function () {
            return http.GET({ url: 'api/mail/compose' });
        },

        remove: function (id) {
            return http.DELETE({ url: 'api/mail/compose/' + id }).then(function (data) {
                if (data && data.success) return data;
                return $.Deferred().reject({ action: 'remove', error: 'unknown', id: id });
            });
        },

        reset: function () {
            return api.space.list().then(function (list) {
                // process all updates
                _(list).map(function (id) {
                    return api.space.remove(id);
                });
                return $.when.apply($, list);
            });
        },

        send: function (id, data) {
            api.trigger('before:send', id, data);

            var formData = new FormData();
            formData.append('JSON', JSON.stringify(data));

            return http.UPLOAD({
                url: 'api/mail/compose/' + id + '/send',
                data: formData
            }).done(function () {
                refreshFolders();
                api.trigger('after:send');
            });
        },

        save: function (id, data) {
            api.trigger('before:save', id, data);

            var formData = new FormData();
            formData.append('JSON', JSON.stringify(data));

            return http.UPLOAD({
                url: 'api/mail/compose/' + id + '/save',
                data: formData
            }).done(function () {
                refreshFolders();
                api.trigger('after:save');
            });
        },

        update: function (id, data) {
            return http.PATCH({
                url: 'api/mail/compose/' + id,
                data: $.extend({}, data)
            });
        }
    };

    function upload(url, data, type) {
        var formData = new FormData();
        formData.append('contentDisposition', (type || 'attachment').toUpperCase());

        if (data.file) {
            if (data.file.name) formData.append('file', data.file, data.file.name);
            else formData.append('file', data.file);
        } else {
            formData.append('JSON', JSON.stringify(data));
        }

        var upload = http.UPLOAD({
                url: url,
                data: formData
            }),
            process = upload.then(function (res) {
                return res.data;
            });

        // keep abort function as attribute of the returning promise
        process.abort = upload.abort;
        return process;
    }

    // composition space
    api.space.attachments = {

        original: function (space) {
            return http.POST({
                url: ox.apiRoot + '/mail/compose/' + space + '/attachments/original'
            });
        },
        vcard: function (space) {
            return http.POST({
                url: ox.apiRoot + '/mail/compose/' + space + '/attachments/vcard'
            });
        },
        add: function (space, data, type) {
            var url = ox.apiRoot + '/mail/compose/' + space + '/attachments';
            return upload(url, data, type);
        },
        update: function (space, data, type, attachmentId) {
            var url = ox.apiRoot + '/mail/compose/' + space + '/attachments/' + attachmentId;
            return upload(url, data, type);
        },
        get: function (space, attachment) {
            return http.POST({
                url: ox.apiRoot + '/mail/compose/' + space + '/attachments/' + attachment
            });
        },
        remove: function (space, attachment) {
            return http.DELETE({
                url: ox.apiRoot + '/mail/compose/' + space + '/attachments/' + attachment
            });
        }
    };

    return api;
});
