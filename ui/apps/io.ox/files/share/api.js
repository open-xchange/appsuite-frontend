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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define('io.ox/files/share/api', [
    'io.ox/core/http',
    'io.ox/core/event',
    'io.ox/files/api',
    'io.ox/core/folder/api'
], function (http, Events, filesAPI, folderAPI) {

    'use strict';

    // wrapping model for infostore files and folders in sharing context
    var Share = Backbone.Model.extend({

        initialize: function () {
            this.cid = this.isFolder() ? 'folder.' + this.get('id') : _.cid(this.attributes);
        },

        isFile: function () {
            return this.has('folder_id');
        },

        isFolder: function () {
            return !this.has('folder_id');
        },

        isAdmin: function () {
            // simplification: user is always admin for single files
            if (this.isFile()) return true;
            // otherwise check folder bits
            return folderAPI.Bitmask(this.get('own_rights')).get('admin') >= 1;
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
            return this.get('filename') || this.get('title') || '';
        },

        getFolderID: function () {
            return this.isFolder() ? this.get('id') : this.get('folder_id');
        },

        getFileType: filesAPI.Model.prototype.getFileType,

        types: filesAPI.Model.prototype.types,

        getExtension: function () {
            var parts = String(this.get('title') || '').split('.');
            return parts.length === 1 ? '' : parts.pop().toLowerCase();
        },

        getPermissions: function () {
            if (this.isFolder()) {
                return this.get('com.openexchange.share.extendedPermissions') || this.get('permissions');
            } else {
                return this.get('com.openexchange.share.extendedObjectPermissions') || this.get('object_permissions');
            }
        },

        loadExtendedPermissions: (function () {

            function fetchFile(model, options) {
                return api.getFileShare(model.pick('id', 'folder_id'), options).done(function (data) {
                    model.set(data);
                });
            }

            function fetchFolder(model, options) {

                if (options.cache && model.has('com.openexchange.share.extendedPermissions')) {
                    // use existing model
                    return $.when();
                }

                // bypass cache (once) to have all columns (incl. 3060)
                return folderAPI.get(model.id, { cache: false }).done(function (data) {
                    // omit "folder_id" otherwise a folder is regarded as file (might need some improvement)
                    data = _(data).omit('folder_id');
                    model.set(data);
                });
            }

            return function (options) {
                options = _.extend({ cache: true }, options);
                return this.isFolder() ? fetchFolder(this, options) : fetchFile(this, options);
            };

        }()),

        reload: function () {
            return this.loadExtendedPermissions({ cache: false });
        }

    });

    var SharesCollection = Backbone.Collection.extend({ model: Share });

    var api = {

        Model: Share,

        collection: new SharesCollection(),

        /**
         * invite ot share
         * @param  { object } o
         * @return { deferred } returns share
         */
        invite: function (o) {
            return http.PUT({
                module: 'share/management',
                params: {
                    action: 'invite',
                    timezone: 'UTC'
                },
                data: o
            });
        },

        /**
         * get a temporary link and related token
         * @param  { object } data
         * @return { deferred } returns related token
         */
        getLink: function (data) {
            return http.PUT({
                module: 'share/management',
                params: {
                    action: 'getLink',
                    timezone: 'UTC'
                },
                data: _(data).pick('module', 'folder', 'item')
            });
        },

        /**
         * update link
         * @param  { object } data
         * @return { deferred } empty data and timestamp
         */
        updateLink: function (data, timestamp) {
            return http.PUT({
                module: 'share/management',
                params: {
                    action: 'updateLink',
                    timezone: 'UTC',
                    timestamp: timestamp || _.now()
                },
                data: _(data).pick('module', 'folder', 'item', 'password', 'expiry_date')
            });
        },

        /**
         * send invitation related to a link target
         * @param  { object } data target data
         * @return { deferred } empty data and timestamp
         */
        sendLink: function (data) {
            return http.PUT({
                module: 'share/management',
                params: {
                    action: 'sendLink'
                },
                data: _(data).pick('module', 'folder', 'item', 'recipients', 'message')
            });
        },

        /**
         * delete a link
         * @param  { object } data target data
         * @return { deferred } empty data and timestamp
         */
        deleteLink: function (data, timestamp) {
            return http.PUT({
                module: 'share/management',
                params: {
                    action: 'deleteLink',
                    timezone: 'UTC',
                    timestamp: timestamp
                },
                data: _(data).pick('module', 'folder', 'item')
            });
        },

        /**
         * get all shares by share/management API
         * @return { deferred } an array with share data
         */
        allShares: function (module) {
            return http.GET({
                module: 'share/management',
                params: {
                    action: 'all',
                    timezone: 'UTC',
                    module: module
                }
            });
        },

        /**
         * get all shares by folder and files API
         * @return { deferred } an array with share data
         */
        all: function () {
            return $.when(
                this.allFolderShares(),
                this.allFileShares()
            ).then(function (folder, files) {
                return [].concat(folder[0], files[0]);
            });
        },

        /**
         * get all shares by folder API
         * @return { deferred } an array with share data
         */
        allFolderShares: function () {
            return http.GET({
                module: 'folders',
                params: {
                    action: 'shares',
                    'content_type': 'infostore',
                    tree: 0,
                    all: 0,
                    altNames: true,
                    columns: '1,2,5,300,301,302,305,3060'
                }
            });
        },

        /**
         * get all shares by files API
         * @return { deferred } an array with share data
         */
        allFileShares: function () {
            return http.GET({
                module: 'files',
                params: {
                    action: 'shares',
                    'content_type': 'infostore',
                    tree: 0,
                    all: 0,
                    altNames: true,
                    columns: '1,2,5,20,700,7010'
                }
            });
        },

        /**
         * get a single shared folder
         * @return { deferred } an object with share data
         */
        getFolderShare: function (id) {
            var columns = [
                'id',
                'created_by',
                'last_modified',
                'title',
                'module',
                'type',
                'own_rights',
                'com.openexchange.share.extendedPermissions'
            ];

            return http.GET({
                module: 'folders',
                params: {
                    action: 'get',
                    id: id,
                    tree: 0
                }
            }).then(function (data) {
                return _(data).pick(function (value, key) {
                    return columns.indexOf(key) >= 0;
                });
            });
        },

        /**
         * get a single shared file
         * @return { deferred } an object with share data
         */
        getFileShare: function (obj, options) {

            options = _.extend({ cache: true }, options);

            return filesAPI.get(obj).then(function (data) {

                if (options.cache && data['com.openexchange.share.extendedObjectPermissions']) return data;

                return http.PUT({
                    module: 'files',
                    params: { action: 'list', columns: '7010' },
                    data: [{ id: obj.id, folder: obj.folder_id }]
                })
                .then(function (array) {
                    var model = filesAPI.pool.get('detail').get(_.cid(obj));
                    model.set(array[0]);
                    return model.toJSON();
                });
            });
        },

        /**
         * get a share
         * @param  { string }   token
         * @return { deferred } a JSON object with share data
         */
        get: function (token) {
            return http.GET({
                module: 'share/management',
                params: {
                    action: 'get',
                    timezone: 'UTC',
                    token: token
                }
            });
        },

        /**
         * delete shares
         * @param  { array }   shares
         * @return { deferred } empty data and timestamp
         */
        remove: function (shares) {
            if (_.isString(shares)) {
                shares = [ shares ];
            }
            return http.PUT({
                module: 'share/management',
                params: {
                    action: 'delete'
                },
                data: shares
            });
        },

        revoke: function (collection, model) {

            var changes;

            if (model.isFolder()) {
                // TODO: Refactor this ugly workaround
                collection.reset(_(model.getPermissions()).where({ entity: ox.user_id }));
                changes = { permissions: collection.toJSON() };
                return folderAPI.update(model.get('id'), changes);
            } else {
                changes = { object_permissions: [], 'com.openexchange.share.extendedObjectPermissions': [] };
                return filesAPI.update(model.pick('folder_id', 'id'), changes);
            }
        },

        // resend invitation/notification
        // module is infostore oder folders
        // id is either folder_id or file id
        // entity is group/user/guest id
        resend: function (type, id, entity) {

            var module = type === 'file' ? 'infostore' : 'folders',
                params = { action: 'notify', id: id };

            if (module === 'folders') params.tree = 1;

            return http.PUT({
                module: module,
                params: params,
                data: { entities: [entity] },
                appendColumns: false
            });
        }
    };

    Events.extend(api);

    return api;
});
