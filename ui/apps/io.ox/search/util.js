/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/search/util',
    ['io.ox/core/http',
     'io.ox/core/folder/api',
     'io.ox/core/api/account',
    ], function (http, folderAPI, accountAPI) {

    'use strict';

    // when wrapper
    // rejects only in case all deferreds failed
    // otherwise resolves only with deferreds succeeded
    var whenResolved = function (list, def) {
        // remove failed deferreds until when resolves
        def = def || $.Deferred();
        $.when.apply($, list)
            .then(
                function () {
                    def.resolve.apply(this, arguments);
                },
                function () {
                    // kick rejected
                    var valid = _.filter(list, function (item) {
                        return item.state() !== 'rejected';
                    });
                    // when again
                    whenResolved(valid, def);
                }
            );
        return def;
    };

    return {
        getOptionLabel: function (options, id) {
            var current = _.find(options, function (item) {
                    return item.id === id;
                });
            return (current || {}).display_name;
        },
        getFolders: function (model) {

            var hash = {},
                req = [],
                mapping = {},
                module = model.getModule(),
                app,
                id,
                accounts = {};

            // infostore hack
            module = module === 'files' ? 'infostore' : module;

            http.pause();

            // standard folders for mail
            if (module === 'mail') {
                _.each(accountAPI.getStandardFolders(), function (id) {
                    mapping[id] = 'standard';
                });
                req.push(accountAPI.all());
            }

            // default folder
            id = folderAPI.getDefaultFolder(module);
            if (id) mapping[id] = 'default';

            // current folder
            app = model.getApp(true) + '/main';
            if (require.defined(app)) {
                id = require(app).getApp().folder.get() || undefined;
                if (id) mapping[id] = 'current';
            }

            // request
            _(mapping).chain().keys().each(function (id) {
                if (id && !hash[id]) {
                    hash[id] = true;
                    req.push(folderAPI.get(id));
                }
            });

            http.resume();

            return whenResolved(req)
                    .then(function () {
                        var args = Array.prototype.slice.apply(arguments);

                        // store account data
                        if (_.isArray(args[0])) {
                            var list = args.shift();
                            _.each(list, function (account) {
                                accounts[account.id] = account;
                            });
                        }

                        // simplifiy
                        return _.map(args, function (folder) {
                            return {
                                id: folder.id,
                                title: folder.title || folder.id, // folderAPI.getFolderTitle(folder.title, 15),
                                type: mapping[folder.id],
                                data: folder
                            };
                        });
                    })
                    .then(function (list) {
                        var qualified = {}, id;
                        _.each(list, function (item) {
                            id = accountAPI.parseAccountId(item.id);
                            qualified[id] = qualified[id] || {list: []};
                            qualified[id].list.push(item);
                            qualified[id].name = (accounts[id] || {}).name;
                        });
                        return qualified;
                    });
        },

        getFirstChoice: function (model) {
            var module = model.getModule(),
                id = model.getFolder() || folderAPI.getDefaultFolder(module),
                def = $.Deferred(),
                value = function (id, folder) {
                    folder = folder || {};
                    // use id as fallback
                    def.resolve({
                        custom: folder.id || id,
                        display_name: folder.title || id
                    });
                };

            // get folder title
            folderAPI.get(id).always(value.bind(this, id));

            return def.promise();
        }

    };
});
