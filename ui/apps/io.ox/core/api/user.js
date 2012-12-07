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

define("io.ox/core/api/user",
    ["io.ox/core/http", "io.ox/core/api/factory", "gettext!io.ox/core"], function (http, apiFactory, gt) {

    "use strict";

    // generate basic API
    var api = apiFactory({
        module: "user",
        keyGenerator: function (obj) {
            return String(obj.id);
        },
        requests: {
            all: {
                columns: "1,20,500",
                sort: "500", // display_name
                order: "asc"
            },
            list: {
                action: "list",
                columns: "1,20,500,524,555"
            },
            get: {
                action: "get"
            },
            search: {
                action: "search",
                columns: "1,20,500,524",
                sort: "500",
                order: "asc",
                getData: function (query) {
                    return { pattern: query };
                }
            }
        }
    });

    // Update
    api.update =  function (o) {

        if (_.isEmpty(o.data)) {
            return $.when();
        } else {
            return http.PUT({
                    module: 'user',
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
                    return api.get({ id: o.id }, false)
                        .pipe(function (data) {
                            return $.when(
                                api.caches.get.add(data),
                                api.caches.all.clear(),
                                api.caches.list.remove({ id: o.id })
                                // TODO: What about the contacts cache?
                            )
                            .done(function () {
                                api.trigger('update:' + _.cid(data), data);
                                api.trigger('update', data);
                                api.trigger('refresh.list');
                                // TODO: What about the corresponding contact events?
                            });
                        });
                });
        }
    };


    api.editNewImage = function (o, changes, file) {
        console.log("EDIT NEW IMAGE ENTERED");
        var form = new FormData();
        form.append('file', file);
        form.append('json', JSON.stringify(changes));

        return http.UPLOAD({
                module: 'user',
                params: { action: 'update', id: o.id, timestamp: o.timestamp || _.now() },
                data: form,
                fixPost: true
            })
            .pipe(function (data) {
                $.when(
                    api.caches.get.clear(),
                    api.caches.all.clear(),
                    api.caches.list.clear()
                ).pipe(function () {
                    api.trigger('refresh.list');
                    api.trigger('update', {
                        id: o.id
                    });
                });

                return data;
            });
    };

    api.getName = function (id) {
        return api.get({ id: id }).pipe(function (data) {
            return _.noI18n(data.display_name || data.email1 || '');
        });
    };

    api.getGreeting = function (id) {
        return api.get({ id: id }).pipe(function (data) {
            return _.noI18n(data.first_name || data.display_name || data.email1 || '');
        });
    };

    api.getTextNode = function (id) {
        var node = document.createTextNode(_.noI18n(''));
        api.get({ id: id })
            .done(function (data) {
                node.nodeValue = _.noI18n(data.display_name || data.email1);
            })
            .always(function () {
                _.defer(function () { // use defer! otherwise we return null on cache hit
                    node = null; // don't leak
                });
            });
        return node;
    };

    api.getLink = function (id, text) {
        text = text ? $.txt(_.noI18n(text)) : api.getTextNode(id);
        return $('<a href="#" class="halo-link">').append(text).data({ internal_userid: id });
    };

    api.getPictureURL = function (id, options) {
        return $.when(api.get({ id: id }), require(["io.ox/contacts/api"]))
            .pipe(
                function (data, contactsAPI) {
                    return contactsAPI.getPictureURL(data[0] || data, options);
                },
                function () {
                    return ox.base + "/apps/themes/default/dummypicture.png";
                }
            );
    };

    api.getPicture = function (id, options) {
        var node = $("<div>"),
            clear = function () {
                _.defer(function () { // use defer! otherwise we return null on cache hit
                    node = clear = null; // don't leak
                });
            };
        api.getPictureURL(id, options)
            .done(function (url) {
                node.css("backgroundImage", "url(" + url + ")");
            })
            .always(clear);
        return node;
    };

    return api;
});
