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
     'io.ox/core/notifications',
     'io.ox/core/cache',
     'settings!io.ox/contacts'
     ], function (http, apiFactory, notifications, cache, settings) {

    'use strict';

    // generate basic API
    var api = apiFactory({
        module: 'contacts',
        requests: {
            all: {
                action: 'all',
                folder: '6',
                columns: '20,1,101,500,502',
                sort: '607', // 607 = magic field
                order: 'asc',
                admin: function () {
                    return settings.get('showAdmin');
                }
            },
            list: {
                action: 'list',
                columns: '20,1,101,500,501,502,505,520,524,555,556,557,569,592,602,606'
                    // 524 = internal_userid, 592 = distribution_list,
                    // 602 = mark_as_distributionlist, 606 = image1_url
            },
            get: {
                action: 'get'
            },
            search: {
                action: 'search',
                columns: '20,1,500,501,502,505,520,555,556,557,569,602,606,524,592',
                sort: '609', // magic sort field - ignores asc/desc
                getData: function (query, opt) {
                    return {
                        display_name: query + '*',
                        first_name: query + '*',
                        last_name: query + '*',
                        email1: query + '*',
                        email2: query + '*',
                        email3: query + '*',
                        orSearch: true,
                        emailAutoComplete: !!opt.emailAutoComplete
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

    function fixDistributionList(data) {
        // fix last_name for distribution lists (otherwise sorting sucks)
        if (data.distribution_list && data.distribution_list.length) {
            data.last_name = data.display_name || '';
        }
    }

    api.create = function (data, file) {

        // TODO: Ask backend for a fix, until that:
        wat(data, 'email1');
        wat(data, 'email2');
        wat(data, 'email3');

        var method, body;

        fixDistributionList(data);

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
                appendColumns: false,
                fixPost: true
            })
            .pipe(function (fresh) {
                // UPLOAD does not process response data, so ...
                fresh = fresh.data || fresh;
                // get brand new object
                return api.get({ id: fresh.id, folder: data.folder_id });
            })
            .pipe(function (d) {
                return $.when(
                    api.caches.all.grepRemove(d.folder_id + api.DELIM),
                    cacheByMail.clear()
                )
                .pipe(function () {
                    api.trigger('create', { id: d.id, folder: d.folder_id });
                    api.trigger('refresh.all');
                    return d;
                });
            });
    };

    api.update =  function (o) {

        if (_.isEmpty(o.data)) {
            return $.when();
        } else {
            fixDistributionList(o.data);
            // go!
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
                        .pipe(function (data) {
                            return $.when(
                                api.caches.get.add(data),
                                api.caches.all.grepRemove(o.folder + api.DELIM),
                                api.caches.list.remove({ id: o.id, folder: o.folder }),
                                cacheByMail.clear()
                            )
                            .done(function () {
                                api.trigger('update:' + encodeURIComponent(_.cid(data)), data);
                                api.trigger('update', data);
                                api.trigger('refresh.list');
                            });
                        });
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
                data: form,
                fixPost: true
            })
            .pipe(function (data) {
                $.when(
                    api.caches.get.clear(),
                    api.caches.list.clear(),
                    cacheByMail.clear()
                ).pipe(function () {
                    api.trigger('refresh.list');
                    api.trigger('edit', { // TODO needs a switch for created by hand or by test
                        id: o.id,
                        folder: o.folder_id
                    });
                });

                return data;
            });
    };

    api.remove =  function (list) {
        // get array
        list = _.isArray(list) ? list : [list];
        // remove
        return http.PUT({
                module: 'contacts',
                params: { action: 'delete', timestamp: _.now() },
                appendColumns: false,
                data: _(list).map(function (data) {
                    return { folder: data.folder_id, id: data.id };
                })
            })
            .pipe(function () {
                return $.when(
                    api.caches.all.clear(),
                    api.caches.list.remove(list),
                    cacheByMail.clear()
                );
            })
            .done(function () {
                api.trigger('refresh.all');
            });
    };

    var autocompleteCache = new cache.SimpleCache('contacts-autocomplete', true);

    api.on('refresh.all', function () {
        autocompleteCache.clear();
        api.caches.get.clear();
    });

    api.autocomplete = function (query) {

        function process(list, obj, field) {
            if (obj[field]) {
                var name, a = obj.last_name, b = obj.first_name, c = obj.display_name;
                if (a && b) {
                    // use last_name & first_name
                    name = a + ', ' + b;
                } else if (c) {
                    // use display name
                    name = c + '';
                } else {
                    // use last_name & first_name
                    name = [];
                    if (a) { name.push(a); }
                    if (b) { name.push(b); }
                    name = name.join(', ');
                }
                list.push({
                    display_name: name,
                    email: obj[field].toLowerCase(),
                    contact: obj
                });
            }
        }

        return autocompleteCache.get(query).pipe(function (data) {
            if (data !== null) {
                return data;
            } else {
                query = String(query || '').toLowerCase();
                return api.search(query, true)
                    .pipe(function (data) {
                        var tmp = [], hash = {};
                        // improve response
                        // 1/2: resolve email addresses
                        _(data).each(function (obj) {
                            if (obj.mark_as_distributionlist) {
                                // distribution list
                                tmp.push({
                                    display_name: obj.display_name || '',
                                    email: 'will not be resolved',
                                    contact: obj
                                });
                            } else {
                                // email
                                process(tmp, obj, 'email1');
                                process(tmp, obj, 'email2');
                                process(tmp, obj, 'email3');
                            }
                        });
                        // 2/2: filter distribution lists & remove email duplicates
                        tmp = _(tmp).filter(function (obj) {
                            var isDistributionList = obj.contact.mark_as_distributionlist === true,
                                isDuplicate = obj.email in hash;
                            if (isDistributionList) {
                                return String(obj.display_name || '').toLowerCase().indexOf(query) > -1;
                            } else {
                                return isDuplicate ? false : (hash[obj.email] = true);
                            }
                        });
                        hash = null;
                        return tmp;
                    })
                    .done(function (data) {
                        autocompleteCache.add(query, data);
                    });
            }
        });
    };

    /** @define {object} simple contact cache */
    var cacheByMail = new cache.SimpleCache('data-by-mail', true);

   /**
    * get contact data (image url, displayname) (server or cache); adds results to cache
    *
    * @private
    * @param {string} adress emailaddress
    * @return {object} object with 'image1_url', 'display_name'
    */
    var getByMail = function (address) {
        // lower case!
        address = $.trim(address).toLowerCase();

        return cacheByMail.get(address).pipe(function (data) {
            if (data !== null) {
                return data;
            } else if (address === '') {
                return {};
            } else {
                return api.getByEmailadress(address)
                .pipe(function (data) {
                    //TODO: use smarter server request instead
                    data = data.filter(function (item) {
                        return !item.mark_as_distributionlist;
                    });

                    if (data.length) {
                        // favor contacts with an image
                        data.sort(function (a, b) {
                            return !!b.image1_url ? +1 : -1;
                        });
                        // favor contacts in global address book
                        data.sort(function (a, b) {
                            return b.folder_id === '6' ? +1 : -1;
                        });
                        // remove host
                        if (data[0].image1_url) {
                            data[0].image1_url = data[0].image1_url
                                .replace(/^https?\:\/\/[^\/]+/i, '')
                                .replace(/^\/ajax/, ox.apiRoot);
                        }
                        // use first contact
                        return cacheByMail.add(address, {
                            image1_url: data[0].image1_url,
                            display_name: data[0].display_name
                        });
                    } else {
                        // no data found
                        return cacheByMail.add(address, {});
                    }
                });
            }
        });
    };

   /**
    * get contact data
    *
    * @param {string} address emailaddress
    * @return {deferred} returns jqXHR
    */
    api.getByEmailadress = function (address) {
        return http.PUT({
            module: 'contacts',
            params: {
                action: 'advancedSearch',
                columns: '20,1,500,501,502,505,520,555,556,557,569,602,606,524,592'
            },
            data: {
                filter: [
                    'or',
                    [
                        '=',
                        {'field': 'email1'},
                        address
                    ],
                    [
                        '=',
                        {'field': 'email2'},
                        address
                    ],
                    [
                        '=',
                        {'field': 'email3'},
                        address
                    ]
                ]
            }
        });
    };

   /**
    * gets deferred for fetching picture url
    *
    * @param {string|object} obj emailaddress or data object (id attr)
    * @param {object} options height, width, scaleType
    * @return {deferred}
    */
    api.getPictureURL = function (obj, options) {

        var deferred = $.Deferred(),
            defaultUrl = ox.base + '/apps/themes/default/dummypicture.png', //initially displayed
            id,
            fail = function () {
                api.trigger('fail');
                deferred.resolve(defaultUrl);
            };

        if (typeof obj === 'string' && obj === '') {
            return deferred.resolve(defaultUrl);
        }

        if (typeof obj === 'string') {
            // assume input is email address
            getByMail(obj)
                .done(function (data) {
                    data.image1_url = data.image1_url ? data.image1_url + '&' + $.param($.extend({}, options)) : defaultUrl;
                    deferred.resolve(data.image1_url);
                })
                .fail(fail);
        } else if (typeof obj === 'object' && obj !== null) {
            // duck checks
            if (api.looksLikeResource(obj)) {
                defaultUrl = ox.base + '/apps/themes/default/dummypicture_resource.xpng';
            } else if (api.looksLikeDistributionList(obj)) {
                defaultUrl = ox.base + '/apps/themes/default/dummypicture_group.xpng';
            }
            // also look for contact_id to support user objects directly
            id = obj.contact_id || obj.id;
            if (id) {
                api.get({ id: id, folder: obj.folder_id || obj.folder }).then(
                    function (data) {
                        var url;
                        if (data.image1_url) {
                            url = data.image1_url.replace(/^\/ajax/, ox.apiRoot) + '&' + $.param($.extend({}, options));
                            deferred.resolve(url);
                        } else {
                            fail();
                        }
                    },
                    fail
                );
            } else {
                fail();
            }
        } else {
            fail();
        }

        return deferred;
    };

   /**
    * get div node with callbacks managing fetching/updating
    *
    * @param {string|object} obj emailaddress
    * @param {object} options height, with, scaleType
    * @return {object} div node with callbacks
    */
    api.getPicture = function (obj, options) {
        var node, set, clear, cont;
        node = $('<div>');
        set = function (e) {
            node.css('backgroundImage', 'url(' + e.data.url + ')');
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
        if (obj && _.isString(obj.image1_url)) {
            cont(obj.image1_url.replace(/^\/ajax/, ox.apiRoot) + '&' + $.param($.extend({}, options)));
        } else {
            api.getPictureURL(obj, options).done(cont).fail(clear);
        }
        return node;
    };
   /**
    * get div node with callbacks managing fetching/updating
    *
    * @param {object} obj with 'display_name' and 'email'
    * @return {object} div node with callbacks
    */

    api.getDisplayName = function (data) {
        var set, clear, cont,
            node = $('<a href="#" class="halo-link">'),
            email = data.email || data.mail;
        //set node content
        set = function (name) {
            node.data({
                display_name: name,
                email1: data.email
            }).text(_.noI18n(name + '\u00A0'));
        };
        // clear vars after call stack has cleared
        clear = function () {
            _.defer(function () { // use defer! otherwise we return null on cache hit
                node = set = clear = cont = null; // don't leak
            });
        };
        // serverresponse vs. cache
        cont = function (data) {
            if (_.isArray(data) && data.length > 0)
                set(_.first(data).display_name);
            else if (data && data.display_name)
                set(data.display_name);
            else if (_.isString(data))
                set(data);
        };
        cont(data.display_name);
        if (data && data.contact_id && _.isString(data.display_name)) {
            clear();
        } else {
            getByMail(data.email).done(cont).always(clear);
        }
        return node;
    };

   /**
    * get contact data
    *
    * @private
    * @return {deferred} returns jqXHR
    */
    var copymove = function (list, action, targetFolderId) {
        // allow single object and arrays
        list = _.isArray(list) ? list : [list];
        // pause http layer
        http.pause();
        // process all updates
        _(list).map(function (o) {
            return http.PUT({
                module: 'contacts',
                params: {
                    action: action || 'update',
                    id: o.id,
                    folder: o.folder_id || o.folder,
                    timestamp: o.timestamp || _.now() // mandatory for 'update'
                },
                data: { folder_id: targetFolderId },
                appendColumns: false
            });
        });
        // resume & trigger refresh
        return http.resume()
            .pipe(function (result) {

                var def = $.Deferred();

                _(result).each(function (val) {
                    if (val.error) { notifications.yell(val.error); def.reject(val.error); }
                });

                if (def.state() === 'rejected') {
                    return def;
                }

                return $.when.apply($,
                    _(list).map(function (o) {
                        return $.when(
                            api.caches.all.grepRemove(targetFolderId + api.DELIM),
                            api.caches.all.grepRemove(o.folder_id + api.DELIM),
                            api.caches.list.remove({ id: o.id, folder: o.folder_id })
                        );
                    })
                );
            })
            .done(function (data) {
                api.trigger('refresh.all');
            });
    };

    api.move = function (list, targetFolderId) {
        return copymove(list, 'update', targetFolderId);
    };

    api.copy = function (list, targetFolderId) {
        return copymove(list, 'copy', targetFolderId);
    };

    api.birthdays = function (options) {
        var now = _.now(),
            params = _.extend({
            start: now,
            end: now + 604800000, // now + WEEK
            action: 'birthdays',
            columns: '1,20,500,501,502,503,504,505,511'
        }, options || {});

        return http.GET({
            module: 'contacts',
            params: params
        });
    };

    // duck checks
    api.looksLikeResource = function (obj) {
        return 'mailaddress' in obj && 'description' in obj;
    };

    api.looksLikeDistributionList = function (obj) {
        return !!obj.mark_as_distributionlist;
    };

    return api;

});
