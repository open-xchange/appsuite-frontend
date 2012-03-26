/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/contacts/api',

    ['io.ox/core/http',
     'io.ox/core/api/factory',
     'io.ox/core/cache'
     ], function (http, apiFactory, cache) {

    'use strict';

    // generate basic API
    var api = apiFactory({
        module: 'contacts',
        requests: {
            all: {
                action: 'all',
                folder: '6',
                columns: '20,1,500,502',
                sort: '607', // magic field
                order: 'asc'
            },
            list: {
                action: 'list',
                columns: '20,1,500,501,502,505,520,555,556,557,569,602,606'
            },
            get: {
                action: 'get'
            },
            search: {
                action: 'search',
                columns: '20,1,500,501,502,505,520,555,556,557,569,602,606',
                sort: '607',
                order: 'asc',
                getData: function (query, autoComplete) {
                    return {
                        first_name: query,
                        last_name: query,
                        email1: query,
                        email2: query,
                        email3: query,
                        orSearch: true,
                        emailAutoComplete: !!autoComplete
                    };
                }
            }
        }
    });

    // fix backend WAT
    function wat(data, id) {
        if (data[id] === '' || data[id] === undefined) {
            delete data[id];
        }
    }

    api.create = function (data, file) {

        // TODO: Ask backend for a fix, until that:
        wat(data, 'email1');
        wat(data, 'email2');
        wat(data, 'email3');

        var method, body;

        if (file) {
            var body = new FormData();
            body.append('file', file);
            body.append('json', JSON.stringify(data));
            method = 'UPLOAD';
        } else {
            body = data;
            method = 'PUT';
        }

        // go!
        return http[method]({
                module: 'contacts',
                params: { action: 'new' },
                data: body,
                appendColumns: false
            })
            .pipe(function (fresh) {
                // UPLOAD does not process response data, so ...
                fresh = fresh.data || fresh;
                // get brand new object
                return api.get({ id: fresh.id, folder: data.folder_id });
            })
            .done(function (d) {
                api.caches.all.remove(d.folder_id);
                api.trigger('refresh.all');
                api.trigger('created', { id: d.id, folder: d.folder_id });
            });
    };

    api.edit =  function (o) {

        if (_.isEmpty(o.data)) {
            return $.when();
        } else {
            return http.PUT({
                    module: 'contacts',
                    params: {
                        action: 'update',
                        id: o.id,
                        folder: o.folder,
                        timestamp: o.timestamp
                    },
                    data: o.data,
                    appendColumns: false
                })
                .pipe(function () {
                    // get updated contact
                    return api.get({ id: o.id, folder: o.folder }, false)
                        .done(function () {
                            api.caches.all.remove(o.folder);
                            api.caches.list.remove({ id: o.id, folder: o.folder });
                            api.trigger('refresh.list');
                            api.trigger('edit', { // TODO needs a switch for created by hand or by test
                                id: o.id,
                                folder: o.folder
                            });
                        });
                })
                .fail(function () {
                    console.log('connection lost'); //what to do if fails?
                });
        }
    };

    api.editNewImage = function (o, changes, file) {

        var form = new FormData();
        form.append('file', file);
        form.append('json', JSON.stringify(changes));

        return http.UPLOAD({
                module: 'contacts',
                params: { action: 'update', id: o.id, folder: o.folder_id, timestamp: o.timestamp || _.now() },
                data: form
            })
            .done(function () {
                api.caches.get.clear();
                api.caches.list.clear();
                api.trigger('refresh.list');
            });
    };

    api.remove =  function (list) {
        // get array
        list = _.isArray(list) ? list : [list];
        // one request per object
        var defs = [];
        _(list).each(function (data) {
            defs.push(http.PUT({
                module: 'contacts',
                params: { action: 'delete', timestamp: data.last_modified || _.now() },
                data: { folder: data.folder_id, id: data.id }
            }));
        });
        // resume HTTP layer
        $.when.apply($, defs)
            .done(function () {
                api.caches.all.clear();
                api.caches.list.clear();
                api.trigger('refresh.all');
            })
           .fail(function () {
                console.log('connection lost'); //what to do if fails?
            });
    };

    var autocompleteCache = new cache.SimpleCache('contacts-autocomplete', true);

    api.on('refresh.all', function () {
        autocompleteCache.clear();
    });

    api.autocomplete = function (query) {

        function process(list, obj, field) {
            var name;
            if (obj[field]) {
                if (obj.display_name) {
                    // use display name
                    name = obj.display_name + '';
                } else {
                    // use last_name & first_name
                    name = [];
                    if (obj.last_name) {
                        name.push(obj.last_name);
                    }
                    if (obj.first_name) {
                        name.push(obj.first_name);
                    }
                    name = name.join(', ');
                }
                list.push({
                    display_name: name,
                    email: obj[field],
                    contact: obj
                });
            }
        }

        return autocompleteCache.contains(query).pipe(function (check) {
            if (!check) {
                return api.search(query, true)
                    .pipe(function (data) {
                        var tmp = [];
                        _(data).each(function (obj) {
                            process(tmp, obj, 'email1');
                            process(tmp, obj, 'email2');
                            process(tmp, obj, 'email3');
                        });
                        return tmp;
                    })
                    .done(function (data) {
                        autocompleteCache.add(query, data);
                    });
            } else {
                return autocompleteCache.get(query);
            }
        });
    };

    // simple contact picture cache
    var contactPictures = new cache.SimpleCache('picture-by-mail', true);

    // get contact picture by email address
    api.getPictureByMailAddress = function (address) {

        // lower case!
        address = String(address).toLowerCase();

        return contactPictures.contains(address).pipe(function (check) {
            if (!check) {
                return http.PUT({
                    module: 'contacts',
                    params: {
                        action: 'search',
                        columns: '20,1,500,606'
                    },
                    data: {
                        email1: address,
                        email2: address,
                        email3: address,
                        orSearch: true
                    }
                })
                .pipe(function (data) {
                    // focus on contact with an image
                    data = $.grep(data, function (obj) {
                        return !!obj.image1_url;
                    });
                    if (data.length) {
                        // favor contacts in global address book
                        data.sort(function (a, b) {
                            return b.folder_id === '6' ? +1 : -1;
                        });
                        // remove host
                        data[0].image1_url = data[0].image1_url
                            .replace(/^https?\:\/\/[^\/]+/i, '')
                            .replace(/^\/ajax/, ox.apiRoot);
                        // use first contact
                        return contactPictures.add(address, data[0].image1_url);
                    } else {
                        // no picture found
                        return contactPictures.add(address, '');
                    }
                });
            } else {
                return contactPictures.get(address);
            }
        });
    };

    api.getPictureURL = function (obj) {

        var deferred = $.Deferred(),
            defaultUrl = ox.base + '/apps/themes/default/dummypicture.png',
            fail = function () {
                deferred.resolve(defaultUrl);
            };

        if (typeof obj === 'string') {
            // assume input is email address
            api.getPictureByMailAddress(obj)
                .done(function (url) {
                    deferred.resolve(url || defaultUrl);
                })
                .fail(fail);
        } else {
            // also look for contact_id to support user objects directly
            api.get({ id: obj.contact_id || obj.id, folder: obj.folder_id || obj.folder })
                .done(function (data) {
                    if (data.image1_url) {
                        deferred.resolve(data.image1_url.replace(/^\/ajax/, ox.apiRoot));
                    } else {
                        fail();
                    }
                })
                .fail(fail);
        }

        return deferred;
    };

    api.getPicture = function (obj) {
        var node, set, clear, cont;
        node = $('<div>');
        set = function (e) {
            if (Modernizr.backgroundsize) {
                node.css('backgroundImage', 'url(' + e.data.url + ')');
            } else {
                node.append(
                    $('<img>', { src: e.data.url, alt: '' }).css({ width: '100%', height: '100%' })
                );
            }
            if (/dummypicture\.png$/.test(e.data.url)) {
                node.addClass('default-picture');
            }
            clear();
        };
        clear = function () {
            _.defer(function () { // use defer! otherwise we return null on cache hit
                node = set = clear = cont = null; // don't leak
            });
        };
        cont = function (url) {
            // use image instance to make sure that the image exists
            $(new Image())
                .on('load', { url: url }, set)
                .on('error', { url: ox.base + '/apps/themes/default/dummypicture.png' }, set)
                .prop('src', url);
        };
        if (obj && obj.image1_url) {
            cont(obj.image1_url.replace(/^\/ajax/, ox.apiRoot));
        } else {
            api.getPictureURL(obj).done(cont).fail(clear);
        }
        return node;
    };

    return api;

});
