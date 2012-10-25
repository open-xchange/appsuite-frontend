/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define('io.ox/files/api',
    ['io.ox/core/http',
     'io.ox/core/api/factory',
     'io.ox/core/config',
     'io.ox/core/cache'
    ], function (http, apiFactory, config, cache) {

    'use strict';

    var mime_types = {
        'jpg' : 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png' : 'image/png',
        'gif' : 'image/gif',
        'tif' : 'image/tiff',
        'tiff': 'image/tiff',
        'mp3' : 'audio/mpeg',
        'ogg' : 'audio/ogg',
        'mp4' : 'video/mp4',
        'm4v' : 'video/mp4',
        'ogv' : 'video/ogg',
        'ogm' : 'video/ogg',
        'webm': 'video/webm'
    };

    var fixContentType = function (data) {
        if (data.file_mimetype === 'application/octet-stream') {
            var ext = _((data.filename || '').split('.')).last().toLowerCase();
            if (ext in mime_types) {
                data.file_mimetype = mime_types[ext];
            }
        } else if (data.file_mimetype === 'audio/mp3') {
            data.file_mimetype = 'audio/mpeg'; // might be superstition
        }
        return data;
    };

    // generate basic API
    var api = apiFactory({
        module: 'infostore',
        requests: {
            all: {
                action: 'all',
                folder: config.get('folder.infostore'),
                columns: '20,1,5,700,702,703',
                sort: '700',
                order: 'asc'
            },
            list: {
                action: 'list',
                columns: '20,1,700,701,702,703,704,705,706,707,709,711'
            },
            get: {
                action: 'get'
            },
            search: {
                action: 'search',
                columns: '20,1,702,703',
                sort: '700',
                order: 'asc',
                getData: function (query) {
                    return { pattern: query };
                }
            }
        },
        pipe: {
            all: function (data) {
                _(data).each(fixContentType);
                return data;
            },
            list: function (data) {
                _(data).each(fixContentType);
                return data;
            },
            get: function (data) {
                return fixContentType(data);
            },
            search: function (data) {
                _(data).each(fixContentType);
                return data;
            }
        }
    });


    api.getUpdates = function (options) {

        var params = {
            action: 'updates',
            columns: '20,1,700,702,703,706',
            folder: options.folder,
            timestamp: options.timestamp,
            ignore: 'deleted'
            /*sort: '700',
            order: 'asc'*/
        };

        return http.GET({
            module: 'infostore',
            params: params
        });
    };

    api.caches.versions = new cache.SimpleCache('infostore-versions', true);

    // Upload a file and store it
    // As options, we expect:
    // 'folder' - The folder ID to upload the file to. This is optional and defaults to the standard files folder
    // 'json' - The complete file object. This is optional and defaults to an empty object with just the folder_id set.
    // 'file' - the file object to upload
    // The method returns a deferred that is resolved once the file has been uploaded
    api.uploadFile = function (options) {
        // Alright, let's simulate a multipart formdata form
        options = $.extend({
            folder: config.get('folder.infostore')
        }, options || {});

        var formData = new FormData();
        if ('filename' in options) {
            formData.append('file', options.file, options.filename);
        } else {
            formData.append('file', options.file);
        }

        if (options.json && !$.isEmptyObject(options.json)) {
            if (!options.json.folder_id) {
                options.json.folder_id = options.folder;
            }
        } else {
            options.json = { folder_id: options.folder };
        }
        formData.append('json', JSON.stringify(options.json));

        return http.UPLOAD({
                module: 'infostore',
                params: { action: 'new' },
                data: formData,
                fixPost: true
            })
            .pipe(function (data) {
                // clear folder cache
                var fid = String(options.json.folder_id);
                return api.propagate('new', { folder_id: fid }).pipe(function () {
                    api.trigger('create.file');
                    return { folder_id: fid, id: parseInt(data.data, 10) };
                });
            });
    };

    // Upload a file and store it
    // As options, we expect:
    // 'folder' - The folder ID to upload the file to. This is optional and defaults to the standard files folder
    // 'json' - The complete file object. This is optional and defaults to an empty object with just the folder_id set.
    // 'file' - the file object to upload
    // The method returns a deferred that is resolved once the file has been uploaded
    api.uploadNewVersion = function (options) {
        // Alright, let's simulate a multipart formdata form
        options = $.extend({
            folder: config.get('folder.infostore')
        }, options || {});

        var formData = new FormData();
        if ('filename' in options) {
            formData.append('file', options.file, options.filename);
        } else {
            formData.append('file', options.file);
        }

        if (options.json && !$.isEmptyObject(options.json)) {
            if (!options.json.folder_id) {
                options.json.folder_id = options.folder;
            }
        } else {
            options.json = { folder_id: options.folder };
        }
        formData.append('json', JSON.stringify(options.json));

        return http.UPLOAD({
                module: 'infostore',
                params: { action: 'update', timestamp: _.now(), id: options.id },
                data: formData,
                fixPost: true // TODO: temp. backend fix
            })
            .pipe(function (data) {
                var id = options.json.id || options.id,
                    folder_id = String(options.json.folder_id),
                    obj = { folder_id: folder_id, id: id };
                return api.propagate('change', obj).pipe(function () {
                    api.trigger('update:' + _.cid(obj), obj);
                    api.trigger('create.version update', obj);
                    return { folder_id: folder_id, id: id, timestamp: data.timestamp};
                });
            });
    };

    api.update = function (file) {
        var obj = { id: file.id, folder: file.folder_id };
        return http.PUT({
                module: 'infostore',
                params: { action: 'update', id: file.id, timestamp: _.now() },
                data: file,
                appendColumns: false
            })
            .pipe(function () {
                return api.propagate('change', obj);
            })
            .pipe(function () {
                return api.get(obj, false);
            })
            .done(function () {
                api.trigger('update update:' + _.cid(obj), obj);
            });
    };

    api.create = function (options) {

        options = $.extend({
            folder: config.get('folder.infostore')
        }, options || {});

        if (!options.json.folder_id) {
            options.json.folder_id = options.folder;
        }

        return http.PUT({
                module: 'infostore',
                params: { action: 'new' },
                data: options.json,
                appendColumns: false
            })
            .pipe(function (data) {
                // clear folder cache
                return api.propagate('new', { folder_id: options.folder }).pipe(function () {
                    api.trigger('create.file', {id: data, folder: options.folder});
                    return { folder_id: String(options.folder), id: String(data ? data : 0) };
                });
            });
    };

    api.propagate = function (type, obj) {

        var id, fid, all, list, get, versions, caches = api.caches, ready = $.when();

        if (type && _.isObject(obj)) {

            fid = obj.folder_id || obj.folder;
            id = obj.id;

            if (/^(new|delete)$/.test(type) && fid) {
                // if we have a new file or an existing file was deleted, we have to clear the proper folder cache.
                all = caches.all.grepRemove(fid + '\t');
            } else {
                all = ready;
            }

            if (/^(change|delete)$/.test(type) && fid && id) {
                // just changing a file does not affect the file list.
                // However, in case of a change or delete, we have to remove the file from item caches
                list = caches.list.remove({ folder_id: fid, id: id });
                get = caches.get.remove({ folder_id: fid, id: id });
                versions = caches.versions.remove(String(id));
            } else {
                list = get = versions = ready;
            }

            return $.when(all, list, get, versions).done(function () {
                api.trigger(type === 'change' ? 'refresh.list' : 'refresh.all');
            });
        } else {
            return ready;
        }
    };

    api.versions = function (options) {
        var getOptions = {action: 'versions'};
        options = options || {};
        if (!options.id) {
            throw new Error('Please specify an id for which to fetch versions');
        }
        getOptions.id = options.id;
        return api.caches.versions.get(options.id).pipe(function (data) {
            if (data !== null) {
                return data;
            } else {
                return http.GET({
                    module: 'infostore',
                    params: getOptions,
                    appendColumns: true
                })
                .done(function (data) {
                    api.caches.versions.add(String(options.id), data);
                });
            }
        });
    };

    api.getUrl = function (file, mode) {
        var url = ox.apiRoot + '/infostore',
            query = '?action=document&id=' + file.id + '&folder=' + file.folder_id +
                (file.version !== undefined ? '&version=' + file.version : ''),
            name = (file.filename ? '/' + encodeURIComponent(file.filename) : '');
        switch (mode) {
        case 'open':
            return url + name + query + '&delivery=view';
        case 'download':
            return url + name + query + '&delivery=download';
        default:
            return url + query;
        }
    };

    api.detach = function (version) {
        return http.PUT({
            module: 'infostore',
            params: { action: 'detach', id: version.id, folder: version.folder_id, timestamp: _.now() },
            data: [version.version],
            appendColumns: false
        })
        .pipe(function () {
            console.log('propagate change', { folder_id: version.folder_id, id: version.id });
            return api.propagate('change', { folder_id: version.folder_id, id: version.id });
        })
        .done(function () {
            console.log('detach...', { folder_id: version.folder_id, id: version.id });
            api.trigger('update:' + _.cid(version), version);
            api.trigger('delete.version update', version);
        });
    };

    return api;

});
