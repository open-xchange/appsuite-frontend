/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/publications/api',
    ['io.ox/core/http', 'io.ox/core/api/folder', 'io.ox/core/cache'], function (http, folderApi, cache) {

    'use strict';

    var caches = {
        all: {},
        get: {}
    };

    var api = {

        get: function (id) {
            if (!caches.get[id]) {
                return http.GET({
                        module: 'publications',
                        params: { action: 'get', id: id }
                    })
                    .pipe(function (data) {
                        return (caches.get[id] = data);
                    });
            } else {
                return $.Deferred().resolve(caches.get[id]);
            }
        },

        getAll: function (/* optional */ folderId) {
            return http.GET({
                    module: 'publications',
                    params: _.extend({ action: 'all' }, { folderId: folderId })
                })
                .pipe(function (data) {
                    return $.when.apply($,
                        _(data).map(function (pub) {
                            return api.get(pub[0]);
                        })
                    );
                })
                .pipe(function () {
                    return $.makeArray(arguments);
                });
        },

        publishFolder: function (folderId, opt) {
            // get folder first
            return folderApi.get({ folder: folderId })
                .pipe(function (folder) {
                    // we need options
                    opt = opt || {};
                    // create publication
                    var data;
                    if (folder.module === 'infostore') {
                        data = {
                            target: 'com.openexchange.publish.microformats.infostore.online',
                            entityModule: 'infostore',
                            entity: { folder: folder.id },
                            'com.openexchange.publish.microformats.infostore.online': {
                                siteName: opt.siteName || String(_.now()),
                                template: opt.template || 'album.tmpl',
                                'protected': true
                            }
                        };
                    } else {
                        console.error('No options defined for this folder type', folder.module, folder);
                    }
                    return http.PUT({
                            module: 'publications',
                            params: { action: 'new' },
                            data: data
                        })
                        .done(function () {
                            // trigger folder change event
                            folderApi.folderCache.remove(folder.id);
                            folderApi.trigger('change change:' + folder.id, folder.id, folder);
                        })
                        .pipe(function (id) {
                            return api.get(id);
                        });
                });
        }
    };

    return api;
});

