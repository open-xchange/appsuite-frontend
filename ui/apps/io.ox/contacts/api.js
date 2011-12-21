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

    api.create = function (formdata) {
        return http.PUT({
            module: 'contacts',
            params: {action: 'new'},
            data: formdata,
            datatype: 'text'
        })
        .done(function (data) {
            api.caches.all.clear(); //TODO considere proper folder
            api.trigger('refresh.all');
            api.trigger('created', { // TODO needs a switch for created by hand or by test
                folder: formdata.folder_id,
                id: data.id
            });
        })
        .fail(function () {
            console.log('connection lost');//what to do if fails?
        });
    };

    api.createNewImage = function (formdata, file) {
        var formData = new FormData();
        formData.append('file', file);
        formData.append('json', formdata);

        return http.UPLOAD({
            module: 'contacts',
            params: {action: 'new'},
            data: formData,
            dataType: 'text'
        })
        .done(function () {
            api.caches.all.clear(); //TODO considere proper folder
            api.trigger('refresh.all');
        })
        .fail(function () {
            console.debug('connection lost');//what to do if fails?
        });
    };

    api.edit =  function (formdata) {
        return http.PUT({
            module: 'contacts',
            params: {action: 'update', id: formdata.id, folder: formdata.folderId, timestamp: formdata.timestamp},
            data: formdata,
            datatype: 'text'
        })
        .done(function () {
            api.caches.get.clear();
            api.caches.list.clear();
            api.trigger('refresh.list');
            api.trigger('edit', { // TODO needs a switch for created by hand or by test
                id: formdata.id,
                folder: formdata.folderId
            });
        })
        .fail(function () {
            console.log('connection lost');//what to do if fails?
        });
    };

    api.editNewImage = function (formdata, file) {

        var formData = new FormData(),
        formdataObj = $.parseJSON(formdata);
        formData.append('file', file);
        formData.append('json', formdata);

        return http.UPLOAD({
            module: 'contacts',
            params: {action: 'update', id: formdataObj.id, folder: formdataObj.folderId, timestamp: formdataObj.timestamp},
            data: formData,
            dataType: 'text'
        })
        .done(function () {
            api.caches.get.clear();
            api.caches.list.clear();
            api.trigger('refresh.list');
        })
        .fail(function () {
            console.log('connection lost');//what to do if fails?
        });
    };

    api.remove =  function (formdata) {
        return http.PUT({
            module: 'contacts',
            params: {action: 'delete', timestamp: formdata.last_modified},
            data: {folder: formdata.folder_id, id: formdata.id},
            datatype: 'text'
        })
       .done(function () {
            api.caches.all.clear();
            api.caches.list.clear();
            api.trigger('refresh.all');
        })
       .fail(function () {
            console.log('connection lost');//what to do if fails?
        });
    };

    var autocompleteCache = new cache.SimpleCache('contacts-autocomplete', true);

    api.bind('refresh.all', function () {
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

        if (!autocompleteCache.contains(query)) {
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
            return $.Deferred().resolve(autocompleteCache.get(query));
        }
    };

    // simple contact picture cache
    var contactPictures = {};

    // get contact picture by email address
    api.getPictureByMailAddress = function (address) {

        // lower case!
        address = String(address).toLowerCase();

        if (contactPictures[address] === undefined) {
            // search for contact
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
                        data[0].image1_url = data[0].image1_url.replace(/^https?\:\/\/[^\/]+/i, '');
                        // use first contact
                        return (contactPictures[address] = data[0].image1_url);
                    } else {
                        // no picture found
                        return (contactPictures[address] = '');
                    }
                });

        } else {
            // return cached picture
            return $.Deferred().resolve(contactPictures[address]);
        }
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
                        deferred.resolve(data.image1_url);
                    } else {
                        fail();
                    }
                })
                .fail(fail);
        }

        return deferred;
    };

    api.getPicture = function (obj) {
        var node = $('<div>'),
            clear = function () {
                _.defer(function () { // use defer! otherwise we return null on cache hit
                    node = clear = null; // don't leak
                });
            };
        api.getPictureURL(obj)
            .done(function (url) {
                if (Modernizr.backgroundsize) {
                    node.css('backgroundImage', 'url(' + url + ')');
                } else {
                    node.append(
                        $('<img>', { src: url, alt: '' }).css({ width: '100%', height: '100%' })
                    );
                }
            })
            .always(clear);
        return node;
    };

    return api;

});
