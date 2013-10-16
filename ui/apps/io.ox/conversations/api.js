/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/conversations/api',
    ['io.ox/core/http',
     'io.ox/core/api/factory'
    ], function (http, apiFactory) {

    'use strict';

    // generate basic API
    var api = apiFactory({
        module: 'conversation',
        keyGenerator: function (obj) {
            return String(obj.id);
        },
        requests: {
            all: {
                folder: 'default'
            },
            list: {
                folder: 'default'
            },
            get: {
                action: 'get'
            }
        }
    });

    api.addMembers = function (id, users) {
        return api.update(id, { newMembers: users || [] });
    };

    api.update = function (id, data) {
        return http.PUT({
                module: 'conversation',
                params: { action: 'update', id: id },
                data: data || {}
            })
            .done(function (data) {
                // returns updated full data, so we update all relevant caches
                api.caches.get.add(data);
                api.caches.list.add(data);
                // publish new state
                api.trigger('refresh.list');
            });
    };

    api.create = function (subject) {

        var def = $.Deferred(),
            display_names = [];

        function create(ids) {
            return http.PUT({
                    module: 'conversation',
                    params: { action: 'new' },
                    data: {
                        subject: subject || display_names.join(', '),
                        newMembers: ids
                    }
                });
        }

        // get all user IDs
        require(['io.ox/core/api/user'], function (userAPI) {
            userAPI.getAll()
                .pipe(function (data) {
                    return _(data)
                        .map(function (obj) {
                            display_names.push(obj.display_name);
                            return obj.id;
                        })
                        .sort();
                })
                .pipe(function (ids) {
                    // create new conversation
                    return create(ids)
                        .done(function () {
                            // trigger
                            api.caches.all.clear();
                            api.trigger('refresh.all');
                            def.resolve();
                        })
                        .fail(def.reject);
                })
                .fail(def.reject);
        });

        return def;
    };

    api.getMessages = function (id, since) {
        return http.GET({
            module: 'conversation',
            params: {
                action: 'allMessages',
                id: id,
                since: since || 0
            }
        });
    };

    api.sendMessage = function (id, text) {
        return http.PUT({
            module: 'conversation',
            params: {
                action: 'newMessage',
                id: id
            },
            data: {
                text: text
            }
        });
    };

    return api;
});
