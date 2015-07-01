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
    'io.ox/files/share/api'
], function (api) {

    'use strict';

    var WizardShare = Backbone.Model.extend({

        idAttribute: 'token',

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
                link: ''
            };
        },

        initialize: function (option) {
            this.set('files', option.files);
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
                bitMask = this.get('edit') ? 33026 : 257,
                data = {
                    targets: []
                };

            // collect target data
            _(this.get('files')).each(function (item) {
                var target = {
                    module: 'infostore'
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
                data.targets.push(target);
            });

            // secial data for invite request
            if (this.get('type') === this.TYPES.INVITE) {

                // set message data
                data.message = this.get('message', '');

                // collect recipients data
                data.recipients = [];
                _(this.get('recipients')).each(function (recipientModel) {
                    var recipientData = {
                        bits: bitMask
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
                if (this.get('secured')) {
                    data.password = this.get('password');
                }

                data.bits = bitMask;

                // create or update ?
                if (!this.has('token')) {
                    return data;
                } else {
                    data.token = this.get('token');
                    if (this.get('temporary')) {
                        data.expiry_date = this.getExpiryDate();
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
                case 'create':
                    return api.create(this.toJSON()).then(function (data, timestamp) {
                        self.set('link', data.url);
                        self.set('token', data.token);
                        self.set({
                            link: data.url,
                            token: data.token,
                            lastModified: timestamp
                        });
                        return data.url;
                    });
                case 'invite':
                    return api.invite(model.toJSON());
                case 'update':
                    return api.update(model.toJSON(), model.get('lastModified'));
                case 'delete':
                    return api.destroy(model.get('token'));
            }
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

    var Share = Backbone.Model.extend({

        idAttribute: 'token',

        initialize: function (option) {
            this.set('files', option.files);
        },

        isFolder: function () {
            return !this.get('target').item;
        },

        sync: function (action, model) {
            switch (action) {
                case 'delete':
                    return api.remove(model.get('token'));
                default:
                    break;
            }
        }

    });

    var Shares = Backbone.Collection.extend({

        model: Share

    });

    return {
        WizardShare: WizardShare,
        Share: Share,
        Shares: Shares
    };
});
