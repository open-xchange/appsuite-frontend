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

define('io.ox/core/api/account',
    ['io.ox/core/config',
     'io.ox/core/http',
     'io.ox/core/cache',
     'io.ox/core/event'
    ], function (config, http, Cache, Events) {

    'use strict';

    // quick hash for sync checks
    var idHash = {},
        typeHash = {},
        // default separator
        separator = config.get('modules.mail.defaultseparator', '/');

    var process = function (data) {

        var isArray = _.isArray(data);
        data = isArray ? data : [data];

        var rPath = /^default\d+/,

            fix = function (account, id, title) {
                var prefix = 'default' + account.id + separator,
                    field = id + '_fullname';
                if (account.id === 0 && !account[field]) {
                    var folder = config.get('mail.folder.' + id);
                    // folder isn't available in config
                    if (!folder) {
                        // educated guess
                        folder = config.get('mail.folder.inbox') + separator +  (account[id] || title);
                    }
                    account[field] = folder;
                } else if (!account[field]) {
                    // educated guess
                    account[field] = prefix + (account[id] || title);
                } else if (!rPath.test(account[field])) {
                    // missing prefix
                    account[field] = prefix + account[field];
                }
            };

        _(data).each(function (account) {
            fix(account, 'trash', 'Trash');
            fix(account, 'sent', 'Sent');
            fix(account, 'drafts', 'Drafts');
            fix(account, 'spam', 'Spam');
            fix(account, 'confirmed_spam', 'Confirmed Spam');
            fix(account, 'confirmed_ham', 'Confirmed Ham');
        });

        return isArray ? data : data[0];
    };

    var invalidateRoot = function () {
        ox.api.cache.folder0.setComplete('1', false);
        ox.api.cache.folder1.setComplete('1', false);
    };

    var invalidateFolder = function (id) {
        ox.api.cache.folder0.removeChildren(id, true); // deep
        ox.api.cache.folder0.remove(id);
        ox.api.cache.folder1.removeChildren(id, true); // deep
        ox.api.cache.folder1.remove(id);
    };

    var regParseAccountId = new RegExp('^default\\d+' + separator + '[^' + separator + ']+' + separator);

    var api = {};

    Events.extend(api);

    api.isUnified = function (id) {
        var match = String(id).match(/^default(\d+)/);
        // is account? (unified inbox is not a usual account)
        return match ? !api.isAccount(match[1]) : false;
    };

    api.isAccount = function (id) {
        return id in idHash;
    };

    // is drafts, trash, spam etc.
    api.is = (function () {
        var unifiedFolders = {
            inbox:  /^default\d+\/INBOX(?:\/|$)/,
            sent:   /^default\d+\/Sent(?:\/|$)/,
            trash:  /^default\d+\/Trash(?:\/|$)/,
            drafts: /^default\d+\/Drafts(?:\/|$)/,
            spam:   /^default\d+\/Spam(?:\/|$)/
        };
        return function (type, id) {
            if (api.isUnified(id)) {
                var re = unifiedFolders[type];
                return Boolean(re && re.test(id));
            } else {
                return typeHash[id] === type;
            }
        };
    }());

    api.getFoldersByType = function (type) {
        return _(typeHash).chain().map(function (value, key) {
            return value === type ? key : null;
        }).compact().value();
    };

    api.parseAccountId = function (str, strict) {
        if (typeof str === 'number') {
            // return number
            return str;
        } else if (/^default(\d+)/.test(String(str))) {
            // is not unified mail?
            if (!api.isUnified(str)) {
                return parseInt(str.replace(/^default(\d+)(.*)$/, '$1'), 10);
            } else {
                // strip off unified prefix
                var tail = str.replace(regParseAccountId, '');
                if (tail !== str && /^default\d+/.test(tail)) {
                    return api.parseAccountId(tail, strict);
                } else {
                    if (!strict) {
                        return 0;
                    } else {
                        var m = str.match(/^default(\d+)/);
                        return m && m.length ? parseInt(m[1], 10) : 0;
                    }
                }
            }
        } else {
            // default account
            return 0;
        }
    };

    /**
     * Get the primary address for a given account.
     *
     * If no account id is given, the default account will be used.
     *
     * @param accountId - the account id for the account, might be null
     * @return an array containing the personal name (might be empty!) and the primary address
     */
    api.getPrimaryAddress = function (accountId) {
        return api.get(accountId || 0).then(function (account) {
            if (!account) { return $.Deferred().reject(account); }
            return account;
        })
        .then(addPersonalFallback).then(function (account) {
            return getAddressArray(account.personal || '', account.primary_address);
        });
    };

    function addPersonalFallback(account) {
        if (!account.personal) {
            return require(['io.ox/contacts/util', 'io.ox/core/api/user']).then(function (contactsUtil, userAPI) {
                return userAPI.getCurrentUser().then(function (user) {
                    account.personal = contactsUtil.getMailFullName(user.toJSON());
                    return account;
                });
            });
        }
        return account;
    }

    function getAddressArray(name, address) {
        name = $.trim(name || '');
        address = $.trim(address).toLowerCase();
        return [name !== address ? name : '', address];
    }

    function getSenderAddress(account) {
        // just for robustness
        if (!account) return [];
        // no addresses?
        if (!account.addresses && account.id === 0) {
            //FIXME: once the backend returns something in account.addresses,
            // it should be safe to remove this code
            return _(config.get('modules.mail.addresses')).map(function (address) {
                return getAddressArray(account.personal, address);
            });
        } else if (!account.addresses) { // null, undefined, empty
            return [getAddressArray(account.personal, account.primary_address)];
        }
        // looks like addresses continas primary address plus aliases
        var addresses = String(account.addresses || '').split(',');
        // build common array of [display_name, email]
        return _(addresses).map(function (address) {
            return getAddressArray(account.personal, address);
        });
    }

    /**
     * Get a list of addresses that can be used when sending mails.
     *
     * If no account id is given, the default account will be used.
     *
     * @param accountId - the account id of the account wanted
     * @return - the personal name and a list of (alias) addresses usable for sending
     */
    api.getSenderAddresses = function (accountId) {
        return this.get(accountId || 0).then(addPersonalFallback).then(getSenderAddress);
    };

    api.getAllSenderAddresses = function () {
        return api.all().then(function (list) {
            return $.when.apply($, _(list).map(addPersonalFallback)).then(function () {
                return _(arguments).flatten(true);
            }).then(function (list) {
                return $.when.apply($, _(list).map(getSenderAddress)).then(function () {
                    return _(arguments).flatten(true);
                });
            });
        });
    };

    /**
     * Get all mail accounts
     */

    var accountsAllCache = new Cache.ObjectCache('account', true, function (o) { return String(o.id); });

    api.all = function () {

        var getter = function () {
            return http.GET({
                module: 'account',
                params: { action: 'all' },
                appendColumns: true,
                processResponse: true
            });
        };

        return accountsAllCache.keys().pipe(function (keys) {
            if (keys.length > 0) {
                return accountsAllCache.values();
            } else if (ox.online) {
                return getter().pipe(function (data) {
                    data = process(data);
                    accountsAllCache.add(data);
                    return data;
                });
            } else {
                return [];
            }
        })
        .pipe(function (list) {
            _(list).each(function (account) {
                // remember account id
                idHash[account.id] = true;
                // remember types
                _('sent trash drafts spam'.split(' ')).each(function (type) {
                    typeHash[account[type + '_fullname']] = type;
                });
                // add inbox
                typeHash['default' + account.id + '/INBOX'] = 'inbox';
            });
            return list;
        });
    };


    /**
     * Get mail account
     */
    api.get = function (id) {

        var getter = function () {
            return api.all().pipe(function () {
                return accountsAllCache.get(id);
            });
        };

        return accountsAllCache.get(id, getter);
    };

    /**
     * Create mail account
     */
    api.create = function (data) {
        return http.PUT({
            module: 'account',
            params: { action: 'new' },
            data: data,
            appendColumns: false
        })
        .then(function (data) {
            // reload all accounts
            return accountsAllCache.clear()
            .then(function () {
                return api.all();
            })
            .then(function () {
                api.trigger('account_created', { id: data.id, email: data.primary_address, name: data.name });
                require(['io.ox/core/api/folder'], function (api) {
                    api.propagate('account:create');
                });
                return data;
            });
        });
    };

    /**
     * Remove mail account
     */
    api.remove = function (data) {
        return http.PUT({
            module: 'account',
            params: {action: 'delete'},
            data: data
        }).done(function () {
            accountsAllCache.remove(data).done(function () {
                api.trigger('refresh.all');
                api.trigger('delete');
                require(['io.ox/core/api/folder'], function (api) {
                    api.propagate('account:delete');
                });
            });
        });
    };

    /**
     * Validate account data
     */
    api.validate = function (data) {
        return http.PUT({
            module: 'account',
            appendColumns: false,
            params: { action: 'validate' },
            data: data
        })
        // always successful but either true or false
        .then(null, function () { $.Deferred().resolve(false); });
    };

    /**
     * Update account
     */
    api.update = function (data) {
        // don't send computed data
        delete data.mail_url;
        delete data.transport_url;
        // update
        return http.PUT({
            module: 'account',
            params: { action: 'update' },
            data: data
        })
        .then(function (result) {

            // detect changes
            accountsAllCache.get(result).done(function (obj) {
                var enabled = result.unified_inbox_enabled;
                if (obj !== null && obj.unified_inbox_enabled !== enabled) {
                    require(['io.ox/core/api/folder'], function (api) {
                        api.propagate(enabled ? 'account:unified-enable' : 'account:unified-disable');
                    });
                }
            });

            return accountsAllCache.remove(data).then(function () {
                if (!_.isObject(result)) {
                    // update call didn’t return the new account -> get the data ourselves
                    return api.get(data.id).then(function (data) {
                        api.trigger('refresh.all');
                        api.trigger('update', data);
                        return data;
                    });
                } else {
                    // update call returned the new account (this is the case for mail)
                    return accountsAllCache.add(result, _.now()).then(function () {
                        api.trigger('refresh.all');
                        api.trigger('update', result);
                        return result;
                    });
                }
            });
        });
    };

    api.autoconfig = function (data) {
        return http.GET({
            module: 'autoconfig',
            params: {
                action: 'get',
                email: data.email,
                password: data.password
            }
        });
    };

    // jslob testapi
    api.configtestAll = function () {
        return http.GET({
            module: 'jslob',
            params: {
                action: 'all'
            }
        });
    };

    api.configtestList = function (data) {
        return http.PUT({
            module: 'jslob',
            params: {
                action: 'list'
            },
            data: data
        });
    };

    api.configtestUpdate = function (data, id) {
        return http.PUT({
            module: 'jslob',
            params: {
                action: 'update',
                id: id
            },
            data: data
        });
    };

    api.configtestSet = function (data, id) {
        return http.PUT({
            module: 'jslob',
            params: {
                action: 'set',
                id: id
            },
            data: data
        });
    };

    return api;
});
