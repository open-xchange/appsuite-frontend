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

    api.getName = function (id) {
        return api.get({ id: id }).pipe(function (data) {
            return gt.noI18n(data.display_name || data.email1 || '');
        });
    };

    api.getGreeting = function (id) {
        return api.get({ id: id }).pipe(function (data) {
            return gt.noI18n(data.first_name || data.display_name || data.email1 || '');
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
