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
        return api.get(accountId || 0).then(addPersonalFallback).then(function (account) {
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
//    api.create = function (options) {
//        // options
//        var opt = $.extend({
//            data: {},
//            success: $.noop
//        }, options || {});
//        // go!
//        ox.api.http.PUT({
//            module: 'account',
//            appendColumns: false,
//            params: {
//                action: 'new'
//            },
//            data: opt.data,
//            success: function (data, timestamp) {
//                // process data
//                data = process(data.data);
//                // add to cache
//                ox.api.cache.account.add(data, timestamp);
//                // additionally, folder '1' has a new child
//                invalidateRoot();
//                // trigger folder event
//                ox.api.folder.dispatcher.trigger('modify');
//                // cont
//                ox.util.call(opt.success, data);
//            },
//            error: opt.error
//        });
//    };

    api.create = function (data) {
        return http.PUT({
            module: 'account',
            params: { action: 'new' },
            data: data,
            appendColumns: false
        })
        .done(function (d) {
            accountsAllCache.add(d, _.now()).done(function () {
                api.trigger('account_created', { id: d.id, email: d.primary_address, name: d.name });
            });
        });
    };

    /**
     * Remove mail account
     */
//    api.remove = function (options) {
//        // options
//        var opt = $.extend({
//            id: undefined,
//            success: $.noop
//        }, options || {});
//        // go!
//        ox.api.http.PUT({
//            module: 'account',
//            appendColumns: false,
//            params: {
//                action: 'delete'
//            },
//            data: [parseInt(opt.id, 10)], // must be an array containing a number (not a string)
//            success: function (data, timestamp) {
//                // remove from cache
//                ox.api.cache.account.remove(opt.id);
//                // invalidate root
//                invalidateRoot();
//                // invalidate folders
//                invalidateFolder('default' + opt.id);
//                // invalidate unified mail
//                invalidateUnifiedMail();
//                // trigger folder event
//                ox.api.folder.dispatcher.trigger('modify remove');
//                // cont
//                ox.util.call(opt.success, data);
//            }
//        });
//    };

    api.remove = function (data) {
        return http.PUT({
            module: 'account',
            params: {action: 'delete'},
            data: data
        }).done(function () {
            accountsAllCache.remove(data).done(function () {
                api.trigger('refresh.all');
                api.trigger('delete');
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
//    api.update = function (options) {
//        // options
//        var opt = $.extend({
//            data: {},
//            success: $.noop
//        }, options || {});
//        // update
//        ox.api.http.PUT({
//            module: 'account',
//            appendColumns: false,
//            params: {
//                action: 'update'
//            },
//            data: opt.data,
//            success: function (response) {
//                // invalidate unified mail folders
//                invalidateUnifiedMail();
//                invalidateRoot();
//                // process response
//                var data = process(response.data);
//                ox.api.cache.account.add(data);
//                // trigger folder event
//                ox.api.folder.dispatcher.trigger('modify');
//                // continue
//                ox.util.call(opt.success, data);
//            },
//            error: opt.error
//        });
//    };
    api.update = function (data) {
        // don't send computed data
        delete data.mail_url;
        delete data.transport_url;
        // update
        return http.PUT({
            module: 'account',
            params: {action: 'update'},
            data: data
        })
        .then(function () {
            // reload account
            return http.GET({
                module: 'account',
                params: { action: 'get', id: data.id },
                appendColumns: false
            })
            .done(function (data) {
                accountsAllCache.merge(data, _.now());
                api.trigger('refresh.all');
                api.trigger('update', data);
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
