/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/search/util', [
    'io.ox/core/http',
    'io.ox/core/folder/api',
    'io.ox/core/api/account'
], function (http, folderAPI, accountAPI) {

    'use strict';

    // when wrapper
    // rejects only in case all deferreds failed
    // otherwise resolves only with deferreds succeeded
    var whenResolved = function (list, def) {
        // remove failed deferreds until when resolves
        def = def || $.Deferred();
        $.when.apply($, list).then(
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
        addTooltip: function (node, title) {
            if (!_.device('touch')) {
                node.attr({
                    'data-toggle': 'tooltip',
                    'data-placement': 'bottom',
                    'data-animation': 'false',
                    'data-container': 'body',
                    'data-original-title': title
                }).tooltip().on('click', function () {
                    if (node.tooltip) node.tooltip('hide');
                });
            }
            return node;
        },
        getOptionLabel: function (options, id) {
            var current = _.find(options, function (item) {
                return item.id === id;
            });
            return (current || {}).name;
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

            // add folder id of active folder facet
            var folderFacet = model.get('pool').folder;
            if (folderFacet && folderFacet.values.custom.custom) {
                mapping[folderFacet.values.custom.custom] = 'current';
            }

            // standard folders for mail
            if (module === 'mail') {
                // TMP: show only folders of primary account
                _(accountAPI.getStandardFolders()).each(function (id) {
                    if (!/^default0/.test(id)) return;
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
                            // TMP: show only folders of primary account
                            if (!accountAPI.isPrimary(account.sent_fullname)) return;
                            accounts[account.id] = account;
                        });
                    }

                    // simplifiy
                    return _.map(args, function (folder) {
                        return {
                            id: folder.id,
                            title: folder.title || folder.id,
                            type: mapping[folder.id],
                            data: folder
                        };
                    });
                })
                .then(function (list) {
                    var qualified = {}, id;
                    _.each(list, function (item) {
                        id = accountAPI.parseAccountId(item.id);
                        qualified[id] = qualified[id] || { list: [] };
                        qualified[id].list.push(item);
                        qualified[id].name = (accounts[id] || {}).name;
                    });
                    return qualified;
                });
        },

        getFirstChoice: function (model) {
            var module = model.getModule(),
                id = model.getFolder(),
                def = $.Deferred(),
                isMandatory = model.isMandatory('folder') || model.isMandatory('account'),
                defaultfolder;

            // infostore hack
            module = module === 'files' ? 'infostore' : module;

            defaultfolder = (folderAPI.getDefaultFolder(module) || '').toString();

            function cont(type, data) {
                var types = {
                    'all': def.resolve.bind(this, {}),
                    'selected': def.resolve.bind(this, {
                        custom: data.id || id,
                        name: data.title || id
                    }),
                    'invalid': def.reject
                };
                types[type]();
            }

            // be robust (mobile)
            id = id || defaultfolder;

            folderAPI.get(id)
                .then(function (data) {
                    data = data || {};
                    // conditions
                    var isDefault = data.id === defaultfolder,
                        isVirtual = module === 'mail' && !folderAPI.can('read', data);
                    // conditions mapping
                    if (!isMandatory) {
                        if (isDefault || isVirtual) {
                            cont('all', data);
                        } else {
                            cont('selected', data);
                        }
                    } else if (isVirtual) {
                        cont('invalid', data);
                    } else {
                        cont('selected', data);
                    }
                });

            return def.promise();
        }

    };
});
