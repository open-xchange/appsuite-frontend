/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 *
 */

define('io.ox/files/api', [
    'io.ox/core/http',
    'io.ox/core/event',
    'io.ox/core/folder/api',
    'io.ox/core/api/backbone',
    'io.ox/core/api/collection-pool',
    'io.ox/core/api/collection-loader',
    'settings!io.ox/core',
    'gettext!io.ox/files'
], function (http, Events, folderAPI, backbone, Pool, CollectionLoader, coreConfig, gt) {

    'use strict';

    var api = {};

    //
    // Backbone Model & Collection for Files
    //

    // basic model with custom cid
    api.Model = backbone.Model.extend({

        isFolder: function () {
            return this.has('standard_folder');
        },

        isFile: function () {
            // we cannot check for "filename", because there are files without a file; yep!
            // so we rather check if it's not a folder
            return !this.isFolder();
        },

        getDisplayName: function () {
            return this.get('filename') || this.get('title') || '';
        },

        getExtension: function () {
            var parts = String(this.get('filename') || '').split('.');
            return parts.length === 1 ? '' : parts.pop().toLowerCase();
        },

        getFileType: function () {
            if (!this.isFile()) return 'folder';
            var extension = this.getExtension();
            for (var type in this.types) {
                if (this.types[type].test(extension)) return type;
            }
        },

        types: {
            image: /^(gif|bmp|tiff|jpe?g|gmp|png)$/,
            audio: /^(aac|mp3|m4a|m4b|ogg|opus|wav)$/,
            video: /^(avi|m4v|mp4|ogv|ogm|mov|mpeg|webm)$/,
            doc: /^(docx|docm|dotx|dotm|odt|ott|doc|dot|rtf)$/,
            xls: /^(csv|xlsx|xlsm|xltx|xltm|xlam|xls|xlt|xla|xlsb)$/,
            ppt: /^(pptx|pptm|potx|potm|ppsx|ppsm|ppam|odp|otp|ppt|pot|pps|ppa)$/,
            pdf: /^pdf$/,
            zip: /^(zip|tar|gz|rar|7z|bz2)$/,
            txt: /^(txt|md)$/
        }
    });

    // collection using custom models
    api.Collection = backbone.Collection.extend({
        model: api.Model
    });

    //
    // Pool
    //

    var pool = Pool.create('files', { Collection: api.Collection, Model: api.Model });

    var allColumns = '20,23,1,5,700,702,703,704,705,707,3';

    /**
     * map error codes and text phrases for user feedback
     * @param  {event} e
     * @return { event }
     */
    var failedUpload = function (e) {
        e.data = e.data || {};
        //customized error messages
        if (e && e.code && (e.code === 'UPL-0005' || e.code === 'IFO-1700')) {
            e.data.custom = {
                type: 'error',
                text: /*#, dynamic*/gt(e.error, e.error_params[0], e.error_params[1])
            };
        } else if (e && e.code && e.code === 'IFO-0100' && e.problematic && e.problematic[0] && e.problematic[0].id === 700) {
            e.data.custom = {
                type: 'error',
                text: gt('The provided filename exceeds the allowed length.')
            };
        } else if (e && e.code && e.code === 'FLS-0024') {
            e.data.custom = {
                type: 'error',
                text: gt('The allowed quota is reached.')
            };
        } else {
            e.data.custom = {
                type: 'error',
                text: gt('This file could not be uploaded.') +
                    // add native error message unless generic "0 An unknown error occurred"
                    (!/^0 /.test(e.error) ? '\n' + e.error : '')
            };
        }
        return e;
    };

    /**
    * returns an error object in case arguments/properties are missing
    * @param  {object}           obj
    * @param  {string|array}     property keys
    * @param  {object}           options
    * @return { undefined|object }
    */
    var missing = function (obj, keys, options) {
        var opt, empty = [], undef = [], response, missing;
        //preparation
        obj = obj || {};
        keys = [].concat(keys.split(','));
        opt = $.extend({ type: 'undefined' }, options);
        //idenfity undefined/empty
        _.each(keys, function (key) {
            if (!(key in obj)) {
                undef.push(key);
            } else if (_.isEmpty(obj[key])) {
                empty.push(key);
            }
        });
        //consider option
        missing = opt.type === 'undefined' ? undef : undef.concat(empty);
        //set response
        if (missing.length) {
            response = failedUpload({
                categories: 'ERROR',
                error: opt.message || gt('Please specify these missing variables: ') + missing
            });
        }
        return response;
    };

    // add event hub
    Events.extend(api);

    api.pool = pool;

    api.collectionLoader = new CollectionLoader({
        module: 'files',
        getQueryParams: function (params) {
            return {
                action: 'all',
                folder: params.folder || coreConfig.get('folder/infostore'),
                columns: allColumns,
                sort: params.sort || '702',
                order: params.order || 'asc'
            };
        },
        httpGet: function (module, params) {
            return $.when(
                folderAPI.list(params.folder),
                http.GET({ module: module, params: params })
            )
            .then(function (folders, files) {
                return [].concat(folders, files[0]);
            });
        },
        // use client-side limit
        useSlice: true,
        // set higher limit; works much faster than mail
        // we pick a number than looks for typical columns, so 5 * 6 * 7 = 210
        LIMIT: 210
    });

    api.collectionLoader.each = function (data) {
        api.pool.add('detail', data);
    };

    // resolve a list of composite keys
    api.resolve = (function () {

        function map(cid) {
            return pool.get('detail').get(cid);
        }

        return function (list) {
            return _(list).chain().map(map).compact().invoke('toJSON').value();
        };

    }());

    api.get = function (options) {
        var model = pool.get('detail').get(_.cid(options));

        if (model) return $.when(model);

        return http.GET({
            module: 'files',
            params: {
                action: 'get',
                id: options.id,
                folder: options.folder_id || options.folder,
                timezone: 'UTC'
            }
        }).then(function (data) {
            return pool.add('detail', data).get(_.cid(data));
        });
    };

    // We should *NOT* LOAD versions by default!
    // pool.get('detail').on('add', function (model) {
    //     api.versions(model.attributes);
    // });

    var lockToggle = function (list, action) {
        // allow single object and arrays
        list = _.isArray(list) ? list : [list];
        // pause http layer
        http.pause();
        // process all updates
        _(list).map(function (o) {
            return http.PUT({
                module: 'files',
                params: {
                    action: action,
                    id: o.id,
                    folder: o.folder_id || o.folder,
                    timezone: 'UTC'
                    // Use 10s diff for debugging purposes
                    // diff: 10000
                },
                appendColumns: false
            });
        });

        // resume & trigger refresh
        return http.resume().done(function () {
            api.collectionLoader.reload(list[0]);
        });
    };

    /**
     * unlocks files
     * @param  {array} list
     * @return { deferred }
     */
    api.unlock = function (list) {
        list = _.isArray(list) ? list : [list];
        http.pause();
        list.forEach(function (o) {
            pool.propagate('change', _.extend({
                locked_until: 0
            }, o));
        });
        return http.resume();
    };

    /**
     * locks files
     * @param  {array} list
     * @return { deferred }
     */
    api.lock = function (list) {
        return lockToggle(list, 'lock');
    };

    /**
     * returns versions
     * @param  {object} options
     * @param  {string} options.id
     * @return { deferred }
     */
    api.versions = function (options) {
        var cid = _.cid(options),
            model = pool.get('detail').get(cid);

        if (model && model.get('versions')) return $.when(model.get('versions'));

        return http.GET({
            module: 'files',
            params: _.extend({ action: 'versions', timezone: 'utc' }, options),
            appendColumns: true
        })
        .done(function (data) {
            if (model) {
                model.set('versions', data);
            } else {
                pool.add('detail', _.extend({
                    versions: data
                }, options));
            }
        });
    };

    /**
     * deletes all files from a specific folder
     * @param  {string} folder_id
     * @return { deferred }
     */
    api.clear = function (folder_id) {

        pool.getByFolder(folder_id).forEach(function (collection) {
            collection.expired = true;
            collection.reset();
        });

        // new clear
        return http.PUT({
            module: 'folders',
            appendColumns: false,
            params: {
                action: 'clear',
                tree: '1'
            },
            data: [folder_id]
        }).done(function () {
            folderAPI.reload(folder_id);
        });
    };

    /**
     * removes version
     * @param  {object} version (file version object)
     * @return { deferred }
     */
    api.detach = function (version) {
        //missing arguments / argument properties
        var error = missing(version, 'id,folder_id,version');
        if (error) return $.Deferred().reject(error).promise();

        return $.when(this.get(version), http.PUT({
            module: 'files',
            params: {
                action: 'detach',
                id: version.id,
                folder: version.folder_id,
                timestamp: _.now()
            },
            data: [version.version],
            appendColumns: false
        }))
        .done(function (m) {
            m.set('versions', m.get('versions').filter(function (v) {
                return v.version !== version.version;
            }));
        });
    };

    //
    // Delete files
    //

    function prepareRemove(ids) {

        var collection = pool.get('detail');

        api.trigger('beforedelete', ids);

        _(ids).each(function (item) {
            var cid = _.cid(item), model = collection.get(cid);
            if (model) collection.remove(model);
        });
    }

    api.remove = function (ids) {

        console.log('remove', ids);

        prepareRemove(ids);

        return http.wait(
            http.PUT({
                module: 'files',
                params: { action: 'delete', timestamp: _.then() },
                data: http.simplify(ids),
                appendColumns: false
            })
            .done(function () {
                // update folder
                folderAPI.reload(ids);
                // trigger delete to update notification area
                api.trigger('delete');
            })
        );
    };

    return api;

});
