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

    // generate basic API
    var api = apiFactory({
        module: "infostore",
        requests: {
            all: {
                action: "all",
                folder: config.get("folder.infostore"),
                columns: "20,1",
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
                columns: "20,1",
                sort: "700",
                order: "asc",
                getData: function (query) {
                    return { pattern: query };
                }
            }
        }
    });

    api.caches.versions = new cache.SimpleCache("infostore-versions", true);

    function fallbackForOX6BackendREMOVEME(htmlpage) {
        // Extract the JSON text
        if (typeof htmlpage === 'string') {
            var matches = /\((\{.*?\})\)/.exec(htmlpage);
            return matches && matches[1] ? JSON.parse(matches[1]) : JSON.parse(htmlpage);
        } else {
            return htmlpage;
        }
    }

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
        formData.append("file", options.file);

        if (options.json && ! $.isEmptyObject(options.json)) {
            if (!options.json.folder_id) {
                options.json.folder_id = options.folder;
            }
            formData.append("json", JSON.stringify(options.json));
        } else {
            formData.append("json", JSON.stringify({folder_id: options.folder}));
        }
        return http.UPLOAD({
                module: "infostore",
                params: { action: "new" },
                data: formData,
                dataType: "text"
            })
            .pipe(function (data) {
                // clear folder cache
                data = fallbackForOX6BackendREMOVEME(data);
                return api.caches.all.remove(options.folder)
                    .pipe(function () {
                        api.trigger("create.file");
                        return { folder_id: String(options.folder), id: parseInt(data.data, 10) };
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
        formData.append("file", options.file);

        if (options.json && ! $.isEmptyObject(options.json)) {
            if (!options.json.folder_id) {
                options.json.folder_id = options.folder;
            }
            formData.append("json", JSON.stringify(options.json));
        } else {
            formData.append("json", JSON.stringify({folder_id: options.folder}));
        }

        return http.UPLOAD({
                module: "infostore",
                params: { action: "update", timestamp: options.timestamp, id: options.id },
                data: formData,
                dataType: "text"
            })
            .pipe(function (data) {
                // clear folder cache
                return $.when(
                    api.caches.all.remove(options.folder),
                    api.caches.get.remove({id: options.id, folder: options.folder}),
                    api.caches.versions.remove(options.id)
                )
                .pipe(function () {
                    api.trigger("create.version update refresh.all", {id: options.id, folder: options.folder});
                    var tmp = fallbackForOX6BackendREMOVEME(data);
                    return { folder_id: String(options.folder), id: options.id, timestamp: tmp.timestamp};
                });
            });
    };

    api.update = function (file) {
        var obj = { id: file.id, folder: file.folder_id };
        return http.PUT({
                module: 'infostore',
                params: { action: 'update', id: file.id, timestamp: file.last_modified },
                data: file,
                appendColumns: false
            })
            .pipe(function () {
                // clear all cache since titles and thus the order might have changed
                return api.caches.all.remove(file.folder_id);
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
                data: options.json
            })
            .pipe(function (data) {
                // clear folder cache
                return api.caches.all.remove(options.folder)
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
        return api.caches.versions.contains(options.id).pipe(function (check) {
            if (check) {
                return api.caches.versions.get(options.id);
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
        var url = ox.apiRoot + "/infostore?action=document&id=" + file.id +
            "&folder=" + file.folder_id + "&version=" + file.version + "&session=" + ox.session;
        switch (mode) {
        case 'open':
            return url + '&content_disposition=inline';
        case 'download':
            return url + '&content_type=application/octet-stream&content_disposition=attachment';
        default:
            return url;
        }
    };

    api.detach = function (version) {
        return http.PUT({
            module: "infostore",
            params: { action: "detach", id: version.id, folder: version.folder, timestamp: version.last_modified },
            data: [version.version]
        })
        .pipe(function () {
            return $.when(
                api.caches.all.remove(version.folder),
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
