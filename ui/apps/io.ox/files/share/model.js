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
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/files/share/model', [
    'io.ox/files/share/api',
    'io.ox/core/yell'
], function (api, yell) {

    'use strict';

    var WizardShare = Backbone.Model.extend({

        defaults: function () {
            return {
                files: [],
                recipients: [],
                message: '',
                edit: false,
                secured: false,
                password: '',
                temporary: false,
                expires: 2,
                url: ''
            };
        },

        idAttribute: 'entity',

        initialize: function () {
            this.setOriginal();
        },

        setOriginal: function (data) {
            this.originalAttributes = data || _.clone(this.attributes);
        },

        getChanges: function () {
            var original = this.originalAttributes, changes = {};
            _(this.attributes).each(function (val, id) {
                if (!_.isEqual(val, original[id])) changes[id] = val;
            });
            // limit to relevant attributes
            return _(changes).pick('expiry_date', 'password', 'temporary', 'secured');
        },

        hasChanges: function () {
            return !_.isEmpty(this.getChanges());
        },

        getExpiryDate: function () {
            var now = moment();
            switch (this.get('expires')) {
                case 0:
                    return now.add(1, 'day').valueOf();
                case 1:
                    return now.add(1, 'week').valueOf();
                case 2:
                    return now.add(1, 'month').valueOf();
                case 3:
                    return now.add(3, 'months').valueOf();
                case 4:
                    return now.add(6, 'months').valueOf();
                case 5:
                    return now.add(1, 'year').valueOf();
                default:
                    return now.add(1, 'month').valueOf();
            }
        },

        toJSON: function () {

            // default invite data
            var targets = [],
                data = {};

            // collect target data
            _(this.get('files')).each(function (item) {
                var target = {
                    // this model is used by folders from other applications as well
                    module: item.get('module') || 'infostore'
                };
                if (item.isFolder()) {
                    target.folder = item.get('id');
                }
                if (item.isFile()) {
                    target.folder = item.get('folder_id');
                    target.item = item.get('id');
                }
                targets.push(target);
            });

            // secial data for getlink request
            data = targets[0];

            if (this.get('secured') && this.get('password') !== '') {
                data.password = this.get('password');
            } else {
                data.password = null;
            }

            // collect recipients data
            data.recipients = [];
            _(this.get('recipients')).each(function (recipientModel) {
                // model values might be outdated (token edit) so we act like mail compose
                data.recipients.push([
                    recipientModel.get('token').label || recipientModel.getDisplayName(),
                    recipientModel.get('token').value || recipientModel.getTarget()
                ]);
            });
            if (data.recipients.length === 0) {
                delete data.recipients;
            }

            if (this.get('message') && this.get('message') !== '') {
                data.message = this.get('message');
            }

            // create or update ?
            if (!this.has('url')) return data;

            if (this.get('temporary')) {
                data.expiry_date = this.getExpiryDate();
            } else {
                data.expiry_date = null;
            }
            return data;

        },

        sync: function (action, model) {
            var self = this;
            switch (action) {
                case 'read':
                    return api.getLink(this.toJSON()).then(function (data, timestamp) {
                        self.set(_.extend(data, { lastModified: timestamp }), { '_inital': true });
                        self.setOriginal();
                        return data.url;
                    }).fail(yell);
                case 'update':
                case 'create':
                    var changes = self.getChanges(),
                        data = model.toJSON();
                    // set password to null if password protection was revoked
                    if (changes.secured === false) {
                        data.password = null;
                    } else if (!('password' in changes)) {
                        // remove password from data unless it has changed
                        delete data.password;
                    }
                    // update only if there are relevant changes
                    return (_.isEmpty(changes) ? $.when() : api.updateLink(data, model.get('lastModified')))
                        .done(this.send.bind(this))
                        .fail(yell);
                // no default
            }
        },

        send: function () {
            if (_.isEmpty(this.get('recipients'))) return;
            api.sendLink(this.toJSON()).fail(yell);
        },

        validate: function (attr) {
            if (attr.secured === true && _.isEmpty(attr.password)) {
                return 'Please set password';
            }
        }

    });

    return {
        WizardShare: WizardShare
    };
});
