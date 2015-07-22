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
    'io.ox/core/folder/api',
    'io.ox/files/api',
    'io.ox/core/yell'
], function (api, folderAPI, filesAPI, yell) {

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
                    data.recipients.push([recipientModel.getDisplayName(), recipientModel.getTarget()]);
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
                        if (data.is_new && data.is_new === true) {
                            // if existing link add unique ID to simulate existing Backbone model
                            delete data.is_new;
                            data.id = _.uniqueId();
                        }
                        self.set(_.extend(data, { lastModified: timestamp }));
                        return data.url;
                    }).fail(yell);
                case 'create':
                case 'update':
                    var self = this;
                    return api.updateLink(model.toJSON(), model.get('lastModified')).then(function (res) {
                        if (self.get('type') === self.TYPES.LINK && model.has('recipients') && model.get('recipients').length > 0) {
                            api.sendLink(model.toJSON()).fail(yell);
                        }
                        return $.Deferred().resolve(res);
                    }, yell);
                case 'delete':
                    if (this.get('type') === this.TYPES.LINK) {
                        return api.deleteLink(model.toJSON(), model.get('lastModified')).fail(yell);
                    }
                    break;
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

    // wrapping model for infostore files and folders in sharing context
    var Share = Backbone.Model.extend({

        idAttribute: 'token',

        initialize: function () {

        },

        isFolder: function () {
            return !this.has('folder_id');
        },

        isAdmin: function () {
            if (this.isFolder()) {
                return folderAPI.Bitmask(this.get('own_rights')).get('admin') >= 1;
            } else {
                return true;
            }
        },

        isExtendedPermission: function () {
            return this.has('com.openexchange.share.extended' + (this.isFolder() ? 'Permissions' : 'ObjectPermissions'));
        },

        getOwner: function () {
            // mail folders show up with "null" so test if its inside our defaultfolders (prevent shared folders from showing wrong owner)
            // shared folder only have admins, no owner, because it's not possible to determine the right one
            return this.get('created_by') || (folderAPI.is('insideDefaultfolder', this.attributes) ? ox.user_id : null);
        },

        getDisplayName: function () {
            return this.get('title');
        },

        getFolderID: function () {
            return this.isFolder() ? this.get('id') : this.get('folder_id');
        },

        getPermissions: function () {
            if (this.isFolder()) {
                return this.get('com.openexchange.share.extendedPermissions') || this.get('permissions');
            } else {
                return this.get('com.openexchange.share.extendedObjectPermissions') || this.get('object_permissions');
            }
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
