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

        getFolderModel: function () {
            var id = this.isFile() ? this.get('folder_id') : this.get('id');
            return folderAPI.pool.getModel(id);
        },

        isAdmin: function () {
            // for files we don't have the parent folder information
            // use shareable attribute instead
            if (this.isFile()) return !!this.get('shareable');
            // Check if ACLs enabled and only do that for mail component,
            // every other component will have ACL capabilities (stored in DB)
            if (this.get('module') === 'mail' && !(this.get('capabilities') & 1)) return false;
            // for infostore/drive we need to check 'supported_capabilities' first
            if (this.get('module') === 'infostore' && _(this.get('supported_capabilities')).indexOf('permissions') === -1) return false;
            // finally: check folder bits
            return folderAPI.Bitmask(this.get('own_rights')).get('admin') >= 1;
        },

        isExtendedPermission: function () {
            return this.has('com.openexchange.share.extended' + (this.isFolder() ? 'Permissions' : 'ObjectPermissions'));
        },

        getEntity: function () {
            // mail folders show up with "null" so test if its inside our defaultfolders (prevent shared folders from showing wrong owner)
            // shared folder only have admins, no owner, because it's not possible to determine the right one
            return this.get('created_by') || (folderAPI.is('insideDefaultfolder', this.attributes) ? ox.user_id : null);
        },

        getIdentifier: function () {
            return this.get('created_from') && this.get('created_from').identifier;
        },

        getDisplayName: function () {
            return this.get('com.openexchange.file.sanitizedFilename') || this.get('filename') || this.get('title') || '';
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
            }
            return this.get('com.openexchange.share.extendedObjectPermissions') || this.get('object_permissions');
        },

        setPermissions: function (value) {
            var
                attrs = this.attributes;

            if (this.isFolder()) {
                if ('com.openexchange.share.extendedPermissions' in attrs) {

                    this.attributes['com.openexchange.share.extendedPermissions'] = value;

                } else if ('permissions' in attrs) {

                    this.attributes.permissions = value;
                }
            } else if ('com.openexchange.share.extendedObjectPermissions' in attrs) {

                this.attributes['com.openexchange.share.extendedObjectPermissions'] = value;

            } else if ('object_permissions' in attrs) {

                this.attributes.object_permissions = value;
            }
            return this;
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
            }).then(function (data, timestamp) {
                api.trigger('new:link');
                ox.trigger('please:refresh');
                return { data: data, timestamp: timestamp };
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
                // see SoftwareChange Request SCR-97: [https://jira.open-xchange.com/browse/SCR-97]
                data: _(data).pick('module', 'folder', 'item', 'expiry_date', 'includeSubfolders', 'password')
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
                    timestamp: timestamp || _.now()
                },
                data: _(data).pick('module', 'folder', 'item')
            }).then(function (result) {
                api.trigger('remove:link', data);
                api.trigger('remove:link:' + data.module + ':' + data.folder + (data.item ? ':' + data.item : ''));
                ox.trigger('please:refresh');
                return result;
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
                    columns: '1,2,5,300,301,302,305,317,3060',
                    timezone: 'UTC'
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
                    columns: '1,2,5,20,109,700,7010,7040,703,702',
                    timezone: 'UTC'
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
                'created_from',
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

        revoke: function (collection, model) {

            var changes;

            if (model.isFolder()) {
                // TODO: Refactor this ugly workaround
                collection.reset(_(model.getPermissions()).where({ entity: ox.user_id }));
                changes = { permissions: collection.toJSON() };
                return folderAPI.update(model.get('id'), changes);
            }
            changes = { object_permissions: [], 'com.openexchange.share.extendedObjectPermissions': [] };
            return filesAPI.update(model.pick('folder_id', 'id'), changes);
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
        },

        /**
         * get a link to open a federated share as guest user
         * @return { object }   a file descriptor
         */
        getFederatedSharingRedirectUrl: function (item) {

            var baseUrl = window.ox.abs + window.ox.root;
            var apiUrl = '/api/files?action=backwardLink';
            var sessionParam = '&session=' + encodeURIComponent(ox.session);
            var redirectParam = '&redirect=true';
            var folderParam = '&folder=' + encodeURIComponent(item.folder_id);
            var itemParam =  '&item=' + encodeURIComponent(item.id);

            return baseUrl + apiUrl + sessionParam + redirectParam + folderParam + itemParam;
        }
    };

    Events.extend(api);

    return api;
});
