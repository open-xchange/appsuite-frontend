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
    'io.ox/core/http',
    'io.ox/contacts/api'
], function (http, contactsAPI) {

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
                var loaded = 0, total = 0, abortList = [];
                this.each(function (model) {
                    loaded += model.get('loaded');
                    total += model.get('total');
                    // only register abort function if upload is not yet done. Mail sending should not be canceled while the request is handled by the server
                    if (model.get('loaded') < model.get('total')) abortList.push({ abort: model.get('abort') });
                });
                this.trigger('progress', { count: this.length, loaded: loaded, pct: pct(loaded, total), total: total, abort: _.invoke.bind(_, abortList, 'abort') });
            }),

            add: function (model, abort) {
                if (this.collection.get(model.get('id'))) return;

                var csid = model.get('id'),
                    attachments = model.get('attachments'),
                    pending = attachments.filter(function (attachment) {
                        return attachment.get('uploaded') < 1;
                    }),
                    loaded = pending.reduce(function (memo, attachment) {
                        return memo + attachment.get('uploaded');
                    }, 0),
                    total = pending.length + 1,
                    uploadModel = new Backbone.Model({ id: csid, loaded: loaded, pct: pct(loaded, total), total: total, abort: abort });

                attachments.on('change:uploaded', function (model) {
                    var loaded = uploadModel.get('loaded');
                    loaded += (model.get('uploaded') - model.previous('uploaded'));
                    uploadModel.set({ loaded: loaded, pct: pct(loaded, total) });
                });

                this.collection.add(uploadModel);
            },

            remove: function (csid) {
                var model = this.collection.get(csid);
                this.collection.remove(model);
            },

            update: function (csid, loaded, total, abort) {
                var model = this.collection.get(csid);
                if (!model) return;
                var totalLoad = model.get('total') - 1 + loaded / total;
                abort = abort || model.get('abort');
                model.set({ loaded: totalLoad, pct: pct(totalLoad, model.get('total')), abort: abort });
            }
        };
    }());

    // composition space
    api.space = {

        all: function () {
            return http.GET({ url: 'api/mail/compose', params: { action: 'all', columns: 'subject,meta' } });
        },

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

        send: function (id, data, attachments) {
            data = _(data).clone();

            api.trigger('before:send', id, data);
            ox.trigger('mail:send:start', data);

            if (data.sharedAttachments && data.sharedAttachments.expiryDate) {
                // explicitedy clone share attachments before doing some computations
                data.sharedAttachments = _(data.sharedAttachments).clone();
                // expiry date should count from mail send
                data.sharedAttachments.expiryDate = _.now() + parseInt(data.sharedAttachments.expiryDate, 10);
            }

            var formData = new FormData();
            formData.append('JSON', JSON.stringify(data));

            (attachments || []).forEach(function (attachment, index) {
                if (attachment.name) formData.append('file_' + index, attachment, attachment.name);
                else formData.append('file_' + index, attachment);
            });

            var def = http.UPLOAD({
                url: 'api/mail/compose/' + id + '/send',
                data: formData,
                // this call always expects a json response. avoid errors in html format (user only sees json parsing error in this case)
                params: { force_json_response: true }
            });

            def.progress(function (e) {
                api.queue.update(id, e.loaded, e.total, def.abort);
            }).fail(function () {
                ox.trigger('mail:send:fail');
            }).always(function () {
                api.queue.remove(id);
            }).done(function (result) {
                contactsAPI.trigger('maybeNewContact');
                api.trigger('after:send', data, result);
                ox.trigger('mail:send:stop', data);
                if (data.sharedAttachments && data.sharedAttachments.enabled) ox.trigger('please:refresh refresh^');
            });

            return def;
        },

        save: function (id, data, attachments) {
            api.trigger('before:save', id, data);

            var formData = new FormData();
            formData.append('JSON', JSON.stringify(data));

            (attachments || []).forEach(function (attachment, index) {
                if (attachment.name) formData.append('file_' + index, attachment, attachment.name);
                else formData.append('file_' + index, attachment);
            });

            return http.UPLOAD({
                url: 'api/mail/compose/' + id + '/save',
                data: formData
            }).done(function (result) {
                api.trigger('after:save', data, result);
            });
        },

        update: function (id, data) {
            return http[_.browser.ie ? 'PUT' : 'PATCH']({
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
            return http.GET({
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
