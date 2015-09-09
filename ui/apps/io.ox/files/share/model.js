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
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/files/share/model', [
    'io.ox/files/share/api',
    'io.ox/core/yell'
], function (api, yell) {

    'use strict';

    var WizardShare = Backbone.Model.extend({

        TYPES: {
            INVITE: 'invite',
            LINK: 'link'
        },

        defaults: function () {
            return {
                files: [],
                type: this.TYPES.INVITE,
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

        initialize: function (option) {
            this.set('files', option.files);
            this.set('type', option.type);
            if (option.type === this.TYPES.INVITE) {
                this.set('edit', true);
            }
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
            var self = this,
                targets = [],
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
                if (self.get('temporary')) {
                    target.expiry_date = self.getExpiryDate();
                }
                targets.push(target);
            });

            // secial data for invite request
            if (this.get('type') === this.TYPES.INVITE) {

                // set message data
                data.message = this.get('message', '');
                data.targets = targets;

                // collect recipients data
                data.recipients = [];
                _(this.get('recipients')).each(function (recipientModel) {
                    var recipientData = {
                        bits: 33026
                    };

                    if (self.get('secured')) {
                        recipientData.password = self.get('password');
                    }

                    switch (recipientModel.get('type')) {
                        // internal user
                        case 1:
                            recipientData.type = 'user';
                            recipientData.entity = recipientModel.get('id');
                            break;
                        // user group
                        case 2:
                            recipientData.type = 'group';
                            recipientData.entity = recipientModel.get('id');
                            break;
                        // external user
                        case 5:
                            recipientData.type = 'guest';
                            if (recipientModel.get('folder_id')) {
                                recipientData.contact_folder = recipientModel.get('folder_id');
                                recipientData.contact_id = recipientModel.get('id');
                            }
                            recipientData.email_address = recipientModel.get('token').value;
                            break;

                    }
                    data.recipients.push(recipientData);
                });
                return data;
            }

            // secial data for getlink request
            if (this.get('type') === this.TYPES.LINK) {
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
                if (!this.has('url')) {
                    return data;
                } else {
                    if (this.get('temporary')) {
                        data.expiry_date = this.get('expiry_date');
                    } else {
                        data.expiry_date = null;
                    }
                    return data;
                }
            }

        },

        sync: function (action, model) {
            var self = this;
            if (this.get('type') === this.TYPES.INVITE) {
                action = 'invite';
            }
            switch (action) {
                case 'invite':
                    return api.invite(model.toJSON()).fail(yell);
                case 'read':
                    return api.getLink(this.toJSON()).then(function (data, timestamp) {
                        if (data.is_new === true) {
                            // if existing link add unique ID to simulate existing Backbone model
                            delete data.is_new;
                            data.id = _.uniqueId();
                        }
                        self.set(_.extend(data, { lastModified: timestamp }));
                        return data.url;
                    }).fail(yell);
                case 'create':
                case 'update':
                    return api.updateLink(model.toJSON(), model.get('lastModified'))
                        .done(this.send.bind(this))
                        .fail(yell);
                case 'delete':
                    if (this.get('type') === this.TYPES.LINK) {
                        return api.deleteLink(model.toJSON(), model.get('lastModified')).fail(yell);
                    }
                    break;
            }
        },

        send: function () {
            if (this.get('type') !== this.TYPES.LINK) return;
            if (_.isEmpty(this.has('recipients'))) return;
            api.sendLink(this.toJSON()).fail(yell);
        },

        validate: function (attr) {
            if (attr.type === this.TYPES.INVITE && attr.recipients.length === 0) {
                return 'Empty receipient list';
            }
            if (attr.secured === true && _.isEmpty(attr.password)) {
                return 'Please set password';
            }
        }

    });

    return {
        WizardShare: WizardShare
    };
});
