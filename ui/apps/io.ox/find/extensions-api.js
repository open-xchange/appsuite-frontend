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

define('io.ox/find/extensions-api',[
    'gettext!io.ox/core'
], function (gt) {

    'use strict';

    function isVirtualFolder (data) {
        return /^virtual/.test(data.id);
    }

    var extensions = {

        // add basic flags to facets (tokenfield/toolbar)
        flag: function (baton) {
            if (_.device('smartphone')) return;

            var whitelist = {
                    style: ['simple'],
                    id: ['contacts', 'contact', 'participant', 'task_participants']
                };

            // flag  facet
            _.each(baton.data, function (facet) {
                var style = _.contains(whitelist.style, facet.style),
                    id = _.contains(whitelist.id, facet.id),
                    advanced = !(style || id);

                // flag when not in whitelist
                if (advanced) {
                    facet.flags.push('toolbar');
                } else {
                    facet.flags.push('tokenfield');
                }
            });
        },

        folder: function (baton) {
            //TODO: move to backend!!!
            var def = $.Deferred(),
                SORT = {
                    current: 1,
                    'default': 2,
                    standard: 3
                };

            require(['io.ox/core/http', 'io.ox/core/folder/api', 'io.ox/core/api/account'], function (http, folderAPI, accountAPI) {
                var req = [],
                    module = baton.app.getModuleParam(),
                    id,
                    list,
                    current,
                    accountdata = {},
                    mapping = {};

                function compact (accounts, folders) {
                    // store account data
                    _.each(accounts, function (account) {
                        accountdata[account.id] = account;
                    });
                    // simplifiy object struxture
                    return _(folders)
                            .chain()
                            .compact()
                            .map(function (folder) {
                                return {
                                    id: folder.id,
                                    title: folder.title || folder.id,
                                    type: mapping[folder.id],
                                    data: folder
                                };
                            })
                            .value();
                }

                function unify (list) {
                    // cluster folders into account hash
                    var accounts = {}, id;
                    _.each(list, function (item) {
                        id = accountAPI.parseAccountId(item.id);
                        accounts[id] = accounts[id] || { list: [] };
                        accounts[id].list.push(item);
                        accounts[id].name = (accountdata[id] || {}).name;
                    });
                    return accounts;
                }

                function cleanup (accounts) {
                    // handle account folders inplace: reduce, sort, hide
                    _.each(accounts, function (account, key) {

                        // reduce list for non primary accounts
                        if (key !== '0') {
                            var length = account.length;
                            for (var i = length - 1; i > 1; i--) {
                                account.list[i].hidden = true;
                            }
                        }

                        // sort by type
                        account.list.sort(function (a, b) {
                            return SORT[a.type] - SORT[b.type];
                        });

                        // add option
                        _.each(account.list, function (folderdata) {
                            folderdata.accountname = account.name;
                            // hide any virtual folders
                            folderdata.hidden = isVirtualFolder(folderdata);
                        });
                    });
                    return accounts;
                }

                function create (accounts) {
                    // create facet/value/option structure
                    var options = folder.values[0].options;

                    _.each(accounts, function (item, account) {
                        var isPrimary = account === '0';
                        _.each(item.list, function (folder) {
                            options.push({
                                id: folder.type === 'current' ? 'dynamic' : folder.id,
                                value: folder.id,
                                item: {
                                    name: folder.title,
                                    detail: isPrimary ? undefined : folder.accountname
                                },
                                hidden: folder.hidden,
                                type: folder.type === 'current' ? 'dynamic' : folder.type,
                                account: account,
                                data: folder.data,
                                filter: null
                            });
                        });
                    });

                    options.push({
                        account: undefined,
                        value: undefined,
                        id: 'callback',
                        data: {},
                        item: {
                            name: gt('More') + '\u2026'
                        },
                        type: 'link',
                        callback: 'openFolderDialog',
                        filter: null
                    });
                    var dynamic = _.findWhere(options, { id: 'dynamic' });
                    if (!dynamic) {
                        options.push({
                            account: undefined,
                            value: undefined,
                            id: 'dynamic',
                            data: {},
                            item: {
                                name: ''
                            },
                            hidden: true,
                            type: 'current',
                            filter: null
                        });
                    }
                }

                function preselect () {
                    //preselect
                    var options = folder.values[0].options,
                        preselect, isMandatory, isDefault, isVirtual,
                        // possible preselected options
                        all = _.findWhere(options, { id: 'disabled' }),
                        selected = _.findWhere(options, { value: current }),
                        standard = _.findWhere(options, { type: 'default' });

                    // prefer selected before default folder
                    preselect = selected || standard;

                    // decision parameters
                    isMandatory = baton.app.isMandatory('folder');
                    isDefault = preselect.type === 'default';
                    isVirtual = module === 'mail' ? !folderAPI.can('read', preselect.data) : isVirtualFolder(preselect.data);

                    // conditions mapping
                    if (!isMandatory) {
                        if (isDefault || isVirtual) {
                            // convenience function bzw. fallback
                            preselect = all;
                        }
                    } else {
                        if (isVirtual) {
                            // fallback when folder is mandatory
                            preselect = standard;
                        }
                    }

                    // flag as preselected
                    preselect.active = true;

                    def.resolve();
                }

                var folder;
                baton.data.unshift(folder = {
                    id: 'folder',
                    name: gt('Folder'),
                    style: 'custom',
                    custom: true,
                    hidden: true,
                    flags: [
                        'toolbar',
                        'conflicts:folder_type'
                    ],
                    values: [{
                        facet: 'folder',
                        id: 'custom',
                        item: {
                            name: gt('Folder')
                        },
                        options: [{
                            account: undefined,
                            value: null,
                            id: 'disabled',
                            data: {},
                            item: {
                                name: gt('All Folders')
                            },
                            hidden: baton.app.isMandatory('folder'),
                            type: 'virtual',
                            filter: null
                        }]
                    }]
                });

                // infostore hack
                module = module === 'files' ? 'infostore' : module;

                http.pause();

                // standard folders for mail
                if (module === 'mail') {
                    _.each(folderAPI.getStandardMailFolders(), function (id) {
                        // use only primary here cause of the slow fetching folder data from externals accounts
                        var isPrimary = id.indexOf('default0') > -1,
                            isValid = ['inbox', 'sent', 'drafts', 'trash'].indexOf(accountAPI.getType(id)) > -1;
                        if (isPrimary && isValid)
                            mapping[id] = 'standard';
                    });
                    // add account data to multiple
                    req.push(accountAPI.all());
                } else {
                    // dummy accounts request
                    req.push($.Deferred().resolve([]));
                }

                // default folder
                id = folderAPI.getDefaultFolder(module);
                if (id) mapping[id] = 'default';

                // current folder
                current = id = baton.app.get('parent').folder.get() || undefined;
                // current selected folder not standard/default
                if (id && !mapping[id]) {
                    mapping[id] = 'current';
                }

                // add folder data to multiple
                list = _(mapping).chain().keys().uniq().value();
                req.push(folderAPI.multiple(list));

                http.resume();

                return $.when.apply($, req)
                    .then(compact)
                    .then(unify)
                    .then(cleanup)
                    .then(create)
                    .then(preselect);
            });
            baton.waitsFor.push(def);
        },

        addOptionDisabled: function (baton) {
            // add 'disabled' option for all toolbar dropdowns
            _.each(baton.data, function (facet) {
                if (_.contains(facet.flags, 'tokenfield') || !facet.options) return;

                facet.options.unshift({
                    id: 'disabled',
                    name: gt('All'),
                    type: 'all',
                    filter: null,
                    value: null
                });
            });
        }
    };

    return extensions;
});
