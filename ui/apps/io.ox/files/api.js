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

define("io.ox/files/api",
    ["io.ox/core/http",
     "io.ox/core/api/factory",
     "io.ox/core/config",
     "io.ox/core/cache"
    ], function (http, apiFactory, config, cache) {

    "use strict";

    var mime_types = {
        'jpg' : 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png' : 'image/png',
        'gif' : 'image/gif',
        'tif' : 'image/tiff',
        'tiff': 'image/tiff',
        'mp3' : 'audio/mpeg3',
        'ogg' : 'audio/ogg',
        'mp4' : 'video/mp4',
        'm4v' : 'video/mp4',
        'ogv' : 'video/ogg',
        'ogm' : 'video/ogg',
        'webm': 'video/webm'
    };

    var fixContentType = function (data) {
        if (data.file_mimetype === 'application/octet-stream')
        {
            var ext = _((data.filename || '').split('.'))
                .last().toLowerCase();
            if (ext in mime_types) {
                data.file_mimetype = mime_types[ext];
            }
        }
        return data;
    };

    // generate basic API
    var api = apiFactory({
        module: "infostore",
        requests: {
            all: {
                action: "all",
                folder: config.get("folder.infostore"),
                columns: "20,1,702,703",
                sort: "700",
                order: "asc"
            },
            list: {
                action: "list",
                columns: "20,1,700,701,702,703,704,705,706,707,709,711"
            },
            get: {
                action: "get"
            },
            search: {
                action: "search",
                columns: "20,1,702,703",
                sort: "700",
                order: "asc",
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
            }
        }
    });

    api.caches.versions = new cache.SimpleCache("infostore-versions", true);

    // Upload a file and store it
    // As options, we expect:
    // "folder" - The folder ID to upload the file to. This is optional and defaults to the standard files folder
    // "json" - The complete file object. This is optional and defaults to an empty object with just the folder_id set.
    // "file" - the file object to upload
    // The method returns a deferred that is resolved once the file has been uploaded
    api.uploadFile = function (options) {
        // Alright, let's simulate a multipart formdata form
        options = $.extend({
            folder: config.get("folder.infostore")
        }, options || {});

        var formData = new FormData();
        if ('filename' in options) {
            formData.append("file", options.file, options.filename);
        } else {
            formData.append("file", options.file);
        }

        if (options.json && !$.isEmptyObject(options.json)) {
            if (!options.json.folder_id) {
                options.json.folder_id = options.folder;
            }
        } else {
            options.json = { folder_id: options.folder };
        }
        formData.append("json", JSON.stringify(options.json));

        return http.UPLOAD({
                module: "infostore",
                params: { action: "new" },
                data: formData,
                fixPost: true
            })
            .pipe(function (data) {
                // clear folder cache
                return api.caches.all.grepRemove(options.json.folder_id + '\t')
                    .pipe(function () {
                        api.trigger("create.file refresh.all");
                        return { folder_id: String(options.json.folder_id), id: parseInt(data.data, 10) };
                    });
            });
    };

    // Upload a file and store it
    // As options, we expect:
    // "folder" - The folder ID to upload the file to. This is optional and defaults to the standard files folder
    // "json" - The complete file object. This is optional and defaults to an empty object with just the folder_id set.
    // "file" - the file object to upload
    // The method returns a deferred that is resolved once the file has been uploaded
    api.uploadNewVersion = function (options) {
        // Alright, let's simulate a multipart formdata form
        options = $.extend({
            folder: config.get("folder.infostore")
        }, options || {});

        var formData = new FormData();
        if ('filename' in options) {
            formData.append("file", options.file, options.filename);
        } else {
            formData.append("file", options.file);
        }

        if (options.json && !$.isEmptyObject(options.json)) {
            if (!options.json.folder_id) {
                options.json.folder_id = options.folder;
            }
        } else {
            options.json = { folder_id: options.folder };
        }
        formData.append("json", JSON.stringify(options.json));

        return http.UPLOAD({
                module: "infostore",
                params: { action: "update", timestamp: _.now(), id: options.id },
                data: formData,
                fixPost: true // TODO: temp. backend fix
            })
            .pipe(function (data) {
                var id = options.json.id || options.id;
                // clear folder cache
                return $.when(
                    api.caches.all.grepRemove(options.json.folder_id + '\t'),
                    api.caches.get.remove({ folder_id: options.json.folder_id, id: id }),
                    api.caches.versions.remove(id)
                )
                .pipe(function () {
                    api.trigger("create.version update refresh.all", { id: id, folder: options.json.folder_id });
                    return { folder_id: String(options.json.folder_id), id: id, timestamp: data.timestamp};
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
                // clear all cache since titles and thus the order might have changed
                return $.when(api.caches.all.grepRemove(file.folder_id + '\t'),  api.caches.get.remove({ folder_id: file.folder_id, id: file.id }));
            })
            .pipe(function () {
                return api.get(obj, false);
            })
            .done(function () {
                api.trigger('update refresh.all', obj);
            });
    };

    api.create = function (options) {

        options = $.extend({
            folder: config.get("folder.infostore")
        }, options || {});

        if (!options.json.folder_id) {
            options.json.folder_id = options.folder;
        }

        return http.PUT({
                module: "infostore",
                params: { action: "new" },
                data: options.json,
                appendColumns: false
            })
            .pipe(function (data) {
                // clear folder cache
                return api.caches.all.grepRemove(options.folder)
                    .pipe(function () {
                        api.trigger("create.file", {id: data, folder: options.folder});
                        return { folder_id: String(options.folder), id: String(data ? data : 0) };
                    });
            });
    };

    api.versions = function (options) {
        var getOptions = {action: "versions"};
        options = options || {};
        if (!options.id) {
            throw new Error("Please specify an id for which to fetch versions");
        }
        getOptions.id = options.id;
        return api.caches.versions.get(options.id).pipe(function (data) {
            if (data !== null) {
                return data;
            } else {
                return http.GET({
                    module: "infostore",
                    params: getOptions,
                    appendColumns: true
                })
                .pipe(function (data) {
                    api.caches.versions.add(options.id, data);
                    return data;
                });
            }
        });
    };

    api.getUrl = function (file, mode) {
        var url = ox.apiRoot + '/infostore',
            query = '?action=document&id=' + file.id + '&folder=' + file.folder_id +
                (file.version !== undefined ? '&version=' + file.version : '');
        switch (mode) {
        case 'open':
            return url + query + '&delivery=view';
        case 'download':
            return url + (file.filename ? '/' + encodeURIComponent(file.filename) : '') +
                query + '&delivery=download';
        default:
            return url + query;
        }
    };

    api.detach = function (version) {
        return http.PUT({
            module: "infostore",
            params: { action: "detach", id: version.id, folder: version.folder, timestamp: _.now() },
            data: [version.version],
            appendColumns: false
        })
        .pipe(function () {
            return $.when(
                api.caches.all.grepRemove(version.folder + '\t'),
                api.caches.list.remove({ id: version.id, folder: version.folder }),
                api.caches.get.remove({ id: version.id, folder: version.folder }),
                api.caches.versions.remove(version.id)
            );
        })
        .done(function () {
            api.trigger("delete.version update refresh.all", {id: version.id, folder: version.folder, version: version.version});
        });
    };

    return api;

});
