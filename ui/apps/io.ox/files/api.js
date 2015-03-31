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
    'io.ox/core/capabilities',
    'settings!io.ox/core',
    'gettext!io.ox/files'
], function (http, Events, folderAPI, backbone, Pool, CollectionLoader, capabilities, settings, gt) {

    'use strict';

    var api = {};

    //
    // Backbone Model & Collection for Files
    //

    var regUnusableType = /^application\/(force-download|binary|x-download|octet-stream|vnd|vnd.ms-word.document.12|odt|x-pdf)$/i;

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

        isImage: function (type) {
            return /^image\//.test(type || this.getMimeType());
        },

        isAudio: function (type) {
            return /^audio\//.test(type || this.getMimeType());
        },

        isVideo: function (type) {
            return /^video\//.test(type || this.getMimeType());
        },

        isOffice: function (type) {
            return /^application\/(msword|vnd.ms-excel|vnd.ms-powerpoint|vnd.oasis|vnd.openxmlformats)/.test(type || this.getMimeType());
        },

        isPDF: function (type) {
            return /^application\/pdf$/.test(type || this.getMimeType());
        },

        isText: function (type) {
            return /^(text\/plain|application\/rtf)$/.test(type || this.getMimeType());
        },

        isEncrypted: function () {
            // check if file has "guard" file extension
            return /\.(grd|grd2|pgp)$/.test(this.get('filename'));
        },

        isLocked: function () {
            return this.get('locked_until') > _.now();
        },

        getDisplayName: function () {
            return this.get('filename') || this.get('title') || '';
        },

        getExtension: function () {
            var parts = String(this.get('filename') || '').split('.');
            return parts.length === 1 ? '' : parts.pop().toLowerCase();
        },

        getMimeType: function () {
            // split by ; because this field might contain further unwanted data
            var type = String(this.get('file_mimetype')).toLowerCase().split(';')[0];
            // unusable mime type?
            if (regUnusableType.test(type)) {
                // return mime type based on file extension
                return api.mimeTypes[this.getExtension()] || type;
            }
            // fix mime type?
            if (type === 'audio/mp3') return 'audio/mpeg';
            // otherwise
            return type;
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
            doc:   /^(docx|docm|dotx|dotm|odt|ott|doc|dot|rtf)$/,
            xls:   /^(csv|xlsx|xlsm|xltx|xltm|xlam|xls|xlt|xla|xlsb)$/,
            ppt:   /^(pptx|pptm|potx|potm|ppsx|ppsm|ppam|odp|otp|ppt|pot|pps|ppa)$/,
            pdf:   /^pdf$/,
            zip:   /^(zip|tar|gz|rar|7z|bz2)$/,
            txt:   /^(txt|md)$/,
            guard: /^(grd|grd2|pgp)$/
        },

        supportsPreview: function () {
            if (this.isEncrypted()) return false;
            var type = this.getMimeType();
            if (this.isImage(type)) return 'thumbnail';
            if (this.isAudio(type)) return 'cover';
            if (capabilities.has('document_preview') && (this.isPDF(type) || this.isOffice(type) || this.isText(type))) return 'preview';
            return false;
        },

        getUrl: function (type, options) {
            return api.getUrl(this.toJSON(), type, options);
        }
    });

    // collection using custom models
    api.Collection = backbone.Collection.extend({
        model: api.Model
    });

    //
    // Special Mime Types
    //

    api.mimeTypes = {
        // images
        'jpg':  'image/jpeg',
        'jpeg': 'image/jpeg',
        'png':  'image/png',
        'gif':  'image/gif',
        'tif':  'image/tiff',
        'tiff': 'image/tiff',
        'bmp':  'image/bmp',
        // audio
        'mp3':  'audio/mpeg',
        'ogg':  'audio/ogg',
        'opus': 'audio/ogg',
        'aac':  'audio/aac',
        'm4a':  'audio/mp4',
        'm4b':  'audio/mp4',
        'wav':  'audio/wav',
        // video
        'mp4':  'video/mp4',
        'm4v':  'video/mp4',
        'ogv':  'video/ogg',
        'ogm':  'video/ogg',
        'webm': 'video/webm',
        // CSV
        'csv':  'text/csv',
        // open office
        'odc':  'application/vnd.oasis.opendocument.chart',
        'odb':  'application/vnd.oasis.opendocument.database',
        'odf':  'application/vnd.oasis.opendocument.formula',
        'odg':  'application/vnd.oasis.opendocument.graphics',
        'otg':  'application/vnd.oasis.opendocument.graphics-template',
        'odi':  'application/vnd.oasis.opendocument.image',
        'odp':  'application/vnd.oasis.opendocument.presentation',
        'otp':  'application/vnd.oasis.opendocument.presentation-template',
        'ods':  'application/vnd.oasis.opendocument.spreadsheet',
        'ots':  'application/vnd.oasis.opendocument.spreadsheet-template',
        'odt':  'application/vnd.oasis.opendocument.text',
        'odm':  'application/vnd.oasis.opendocument.text-master',
        'ott':  'application/vnd.oasis.opendocument.text-template',
        'oth':  'application/vnd.oasis.opendocument.text-web',
        // pdf
        'pdf':  'application/pdf',
        // microsoft office
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xlsm': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xltx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
        'xltm': 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'pptm': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'ppsx': 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
        'potx': 'application/vnd.openxmlformats-officedocument.presentationml.template',
        'potm': 'application/vnd.openxmlformats-officedocument.presentationml.template',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'docm': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
        'dotm': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
        'doc':  'application/msword',
        'dot':  'application/msword',
        'xls':  'application/vnd.ms-excel',
        'xlb':  'application/vnd.ms-excel',
        'xlt':  'application/vnd.ms-excel',
        'ppt':  'application/vnd.ms-powerpoint',
        'pps':  'application/vnd.ms-powerpoint'
    };

    // get URL to open, download, or preview a file
    // options:
    // - scaletype: contain or cover or auto
    // - height: image height in pixels
    // - widht: image widht in pixels
    // - version: true/false. if false no version will be appended
    api.getUrl = function (file, type, options) {

        options = _.extend({ scaletype: 'contain' }, options);

        var url = ox.apiRoot + '/files',
            folder = encodeURIComponent(file.folder_id),
            id = encodeURIComponent(file.id),
            version = file.version !== undefined && options.version !== false ? '&version=' + file.version : '',
            // basic URL
            query = '?action=document&folder=' + folder + '&id=' + id + version,
            // file name
            name = file.filename ? '/' + encodeURIComponent(file.filename) : '',
            // scaling options
            scaling = options.width && options.height ? '&scaleType=' + options.scaletype + '&width=' + options.width + '&height=' + options.height : '',
            // avoid having identical URLs across contexts (rather edge case)
            // also inject last_modified if available; needed for "revisionless save"
            // the content might change without creating a new version (which would be part of the URL)
            buster = _([ox.user_id, ox.context_id, file.last_modified]).compact().join('.') || '';

        if (buster) query += '&' + buster;

        switch (type) {
            case 'download':
                return (file.meta && file.meta.downloadUrl) || url + name + query + '&delivery=download';
            case 'thumbnail':
                return (file.meta && file.meta.thumbnailUrl) || url + query + '&delivery=view' + scaling;
            case 'preview':
                return (file.meta && file.meta.previewUrl) || url + query + '&delivery=view' + scaling + '&format=preview_image&content_type=image/jpeg';
            case 'cover':
                return ox.apiRoot + '/image/file/mp3Cover?folder=' + folder + '&id=' + id + scaling + '&content_type=image/jpeg&' + buster;
            case 'play':
                return url + query + '&delivery=view';
            // open/view
            default:
                return url + name + query + '&delivery=view';
        }
    };

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

    // add event hub
    Events.extend(api);

    api.pool = pool;

    api.collectionLoader = new CollectionLoader({
        module: 'files',
        getQueryParams: function (params) {
            return {
                action: 'all',
                folder: params.folder || settings.get('folder/infostore'),
                columns: allColumns,
                sort: params.sort || '702',
                order: params.order || 'asc'
            };
        },
        httpGet: function (module, params) {
            return $.when(
                folderAPI.list(params.folder),
                // this one might fail due to lack of permissions; error are transformed to empty array
                http.GET({ module: module, params: params }).then(null, $.when)
            )
            .then(function (folders, files) {
                return [].concat(folders, files[0] || []);
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
            // return either folder or file models
            return /^folder\./.test(cid) ?
                folderAPI.pool.getModel(cid.substr(7)) :
                pool.get('detail').get(cid);
        }

        return function (list, json) {
            var models = _(list).chain().map(map).compact().value();
            return json === false ? models : _(models).invoke('toJSON');
        };

    }());

    //
    // GET a single file
    //

    api.get = function (file, options) {

        options = _.extend({ cache: true }, options);

        if (options.cache) {
            var model = pool.get('detail').get(_.cid(file));
            if (model) return $.when(model.toJSON());
        }

        return http.GET({
            module: 'files',
            params: {
                action: 'get',
                id: file.id,
                folder: file.folder_id || file.folder,
                timezone: 'UTC'
            }
        })
        .then(function (data) {
            pool.add('detail', data);
            return data;
        });
    };

    //
    // GET multiple files
    //

    api.list = (function () {

        function has(item) {
            return this.get(_.cid(item));
        }

        function getter(item) {
            return this.get(_.cid(item)).toJSON();
        }

        function add(item) {
            pool.add('detail', item);
        }

        return function (ids, options) {

            var uncached = ids, collection = pool.get('detail');
            options = _.extend({ cache: true }, options);

            // empty?
            if (ids.length === 0) return $.when([]);

            // get uncached items
            if (options.cache) uncached = _(ids).reject(has, collection);

            // all cached?
            if (uncached.length === 0) return $.when(_(ids).map(getter, collection));

            return http.fixList(uncached, http.PUT({
                module: 'files',
                params: { action: 'list', columns: allColumns, timezone: 'UTC' },
                data: http.simplify(uncached)
            }))
            .then(function (array) {
                // add new items to the pool
                _(array).each(add);
                // reconstruct results
                return _(ids).map(getter, collection);
            });
        };

    }());

    //
    // Lock/unlock files
    //

    var lockToggle = function (list, action) {
        // allow single object and arrays
        list = _.isArray(list) ? list : [list];
        // pause http layer
        http.pause();
        // process all updates
        _(list).each(function (item) {
            http.PUT({
                module: 'files',
                params: {
                    action: action,
                    id: item.id,
                    folder: item.folder_id || item.folder,
                    timezone: 'UTC'
                    // Use 10s diff for debugging purposes
                    // diff: 10000
                },
                appendColumns: false
            });
        });
        // resume & trigger refresh
        return http.resume();
    };

    /**
     * unlocks files
     * @param  {array} list
     * @return { deferred }
     */
    api.unlock = function (list) {
        return lockToggle(list, 'unlock').done(function () {
            var collection = pool.get('detail');
            _(list).each(function (item) {
                var model = collection.get(_.cid(item));
                if (model) model.set('locked_until', 0);
            });
        });
    };

    /**
     * locks files
     * @param  {array} list
     * @return { deferred }
     */
    api.lock = function (list) {
        return lockToggle(list, 'lock').then(function () {
            return api.list(list, { cache: false });
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

        prepareRemove(ids);

        return http.wait(
            http.PUT({
                module: 'files',
                params: { action: 'delete', timestamp: _.then() },
                data: http.simplify(ids),
                appendColumns: false
            })
            .done(function () {
                folderAPI.reload(ids);
                api.trigger('delete');
                _(ids).each(function (item) {
                    api.trigger('delete:' + _.ecid(item));
                });
            })
        );
    };

    //
    // Move / Copy
    //

    function move(list, targetFolderId) {
        http.pause();
        _(list).map(function (item) {
            return api.update(item, { folder_id: targetFolderId });
        });
        return http.resume();
    }

    function copy(list, targetFolderId) {
        http.pause();
        _(list).map(function (item) {
            return http.PUT({
                module: 'files',
                params: {
                    action: 'copy',
                    id: item.id,
                    folder: item.folder_id,
                    timestamp: item.timestamp || _.then()
                },
                data: { folder_id: targetFolderId },
                appendColumns: false
            });
        });
        return http.resume();
    }

    function transfer(type, list, targetFolderId) {

        // mark target folder as expired
        pool.resetFolder(targetFolderId);

        var fn = type === 'move' ? move : copy;

        return http.wait(fn(list, targetFolderId)).then(function (response) {
            var errorText, i = 0, $i = response.length;
            // look if anything went wrong
            for (; i < $i; i++) {
                if (response[i].error) {
                    errorText = response[i].error.error;
                    break;
                }
            }
            api.trigger(type, list, targetFolderId);
            folderAPI.reload(targetFolderId, list);
            if (errorText) return errorText;
        });
    }

    /**
     * Move files to another folder
     * @param  {array} list of objects { id, folder_id }
     * @param  {string} targetFolderId
     */
    api.move = function (list, targetFolderId) {
        prepareRemove(list);
        return transfer('move', list, targetFolderId);
    };

    /**
     * Copy files to another folder
     * @param  {array} list
     * @param  {string} targetFolderId
     */
    api.copy = function (list, targetFolderId) {
        return transfer('copy', list, targetFolderId);
    };

    //
    // Update file
    // @param {object} file { id, folder_id }
    // @param {object} changes The changes to apply; not sent to server if empty
    //

    api.update = function (file, changes) {

        if (!_.isObject(changes) || _.isEmpty(changes)) return;

        // update model
        var cid = _.cid(file), model = pool.get('detail').get(cid);
        if (model) model.set(changes);

        return http.PUT({
            module: 'files',
            params: {
                action: 'update',
                id: file.id,
                timestamp: _.then()
            },
            data: changes,
            appendColumns: false
        })
        .done(function () {
            api.trigger('update update:' + cid);
            if ('title' in changes || 'filename' in changes) api.trigger('rename', cid);
        });
    };

    function performUpload(options) {
        options = _.extend({
            folder: settings.get('folder/infostore'),
            // used by api.version.upload to be different from api.upload
            action: 'new',
            // allow API consumers to override the module (like OX Guard will certainly do)
            module: 'files'
        }, options);

        var formData = new FormData(), data;

        if ('filename' in options) {
            formData.append('file', options.file, options.filename);
        } else if ('file' in options) {
            formData.append('file', options.file);
        }

        // set meta data
        data.folder_id = options.folder;
        data.description = options.description || '';
        formData.append('json', JSON.stringify(data));

        return http.UPLOAD({
            // allow API consumers to override the module (like OX Guard will certainly do)
            module: options.module,
            params: { action: options.action, filename: options.filename },
            data: formData,
            fixPost: true
        }).fail(failedUpload);
    }

    /**
     * Upload a new file
     * @param {object} file options
     *     - options.file - a File object (as in Blob)
     *     - options.filename - an optional filename (overrides the name value of options.file)
     *     - options.folder - the id of the folder to upload the file into
     *     - options.module - override the module used to upload to (default: 'files')
     * @returns {object}
     *     - a promise resolving to the created file
     *     - promise can be aborted using promise.abort function
     */
    api.uploadFile = function (options) {
        options.action = 'new';
        return performUpload(options).done(function () {
            api.trigger('create:file');
        });
    };

    // File versions

    api.versions = {

        upload: function (options) {
            options.action = 'update';
            return performUpload(options).done(function () {
                api.trigger('create:version');
            });
        },

        load: function (file, options) {

            options = _.extend({ cache: true }, options);

            // skip if we don't have a model to add data
            var cid = _.cid(file), model = pool.get('detail').get(cid);
            if (!model) return $.when([]);

            // cache hit?
            if (options.cache && model.has('versions')) return $.when(model.get('versions'));

            return http.GET({
                module: 'files',
                params: {
                    action: 'versions',
                    folder: file.folder_id,
                    id: file.id,
                    timezone: 'utc'
                },
                appendColumns: true
            })
            .then(function (data) {
                model.set('versions', data);
                // make sure we always get the same result (just data; not timestamp)
                return data;
            });
        },

        remove: function (file) {

            // update model instantly
            var cid = _.cid(file), model = pool.get('detail').get(cid);
            if (model && _.isArray(model.get('versions'))) {
                model.set('versions', model.get('versions').filter(function (item) {
                    return item.version !== file.version;
                }));
            }

            return http.PUT({
                module: 'files',
                params: {
                    action: 'detach',
                    id: file.id,
                    folder: file.folder_id,
                    timestamp: _.now()
                },
                data: [file.version],
                appendColumns: false
            })
            .then(function () {
                // let's reload the file and the version list since we might
                // have removed the current version
                return api.get(file, { cache: false }).then(function () {
                    return api.versions.load(file, { cache: false });
                });
            });
        },

        setCurrent: function (file) {
            // update model
            var model = pool.get('detail').get(_.cid(file));
            if (model && _.isArray(model.get('versions'))) {
                model.set('versions', model.get('versions').map(function (item) {
                    item.current_version = (item.version === file.version);
                    return item;
                }));
            }
            // update server-side
            // if there is only version, the request works.
            // if the other fields are present, we get a backend error
            var changes = { version: file.version };
            return api.update(file, changes).then(function () {
                // reload model to get current filename, size, and last modified
                return api.get(file, { cache: false });
            });
        }
    };

    return api;

});
