/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/api/account', [
    'settings!io.ox/mail',
    'io.ox/core/http',
    'io.ox/core/event'
], function (settings, http, Events) {

    'use strict';

    // quick hash for sync checks
    var idHash = {},
        typeHash = {},
        // default separator
        separator = settings.get('defaultseparator', '/');

    var process = function (data) {

        var isArray = _.isArray(data);
        data = isArray ? data : [data];

        var rPath = /^default\d+/,

            fix = function (account, id, title) {
                var prefix = 'default' + account.id + separator,
                    field = id + '_fullname';
                if (account.id === 0 && !account[field]) {
                    var folder = settings.get(['folder', id]);
                    // folder isn't available in config
                    if (!folder) {
                        // educated guess
                        folder = settings.get('folder/inbox') + separator +  (account[id] || title);
                    }
                    account[field] = folder;
                } else if (!account[field]) {
                    // US 91604548 / Bug 37439: remove legacy code
                    // educated guess
                    // account[field] = prefix + (account[id] || title);
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
            fix(account, 'archive', 'Archive');
            fix(account, 'confirmed_spam', 'Confirmed Spam');
            fix(account, 'confirmed_ham', 'Confirmed Ham');
        });

        return isArray ? data : data[0];
    };

    var regParseAccountId = new RegExp('^default\\d+' + separator + '[^' + separator + ']+' + separator),
        regUnified = new RegExp('^default\\d+' + separator + '[^' + separator + ']+$');

    var api = {};

    Events.extend(api);

    /**
     * is unified
     * @param  {string}  id (folder_id)
     * @return { boolean }
     */
    api.isUnified = function (id) {
        // extend if number
        if (/^\d+$/.test(id)) id = 'default' + id;
        // get identifier (might be null)
        var identifier = settings.get('unifiedInboxIdentifier');
        if (!identifier || identifier === 'null') return false;
        // compare against unifiedInboxIdentifier (having just a number would be smarter)
        var match = String(id).match(/^(default\d+)/);
        return !!match && identifier === (match[1] + separator + 'INBOX');
    };

    /**
     * is unified folder
     * @param  {string}  id (folder_id)
     * @return { boolean }
     */
    api.isUnifiedFolder = function (id) {
        return regUnified.test(id) && api.isUnified(id);
    };

    /**
     * is account folder
     * @param  {string}  id (folder_id)
     * @return { boolean }
     */
    api.isAccount = function (id) {
        if (_.isNumber(id)) return id in idHash;
        var match = String(id).match(/^default(\d+)/);
        return match && match[1] in idHash;
    };

    /**
     * is primary folder
     * @param  {string}  id (folder_id)
     * @return { boolean }
     */
    api.isPrimary = function (id) {
        return (/^default0/).test(id);
    };

    /**
     * is external folder
     * @param  {string}  id (folder_id)
     * @return { boolean }
     */
    api.isExternal = function (id) {
        return api.isAccount(id) && !api.isPrimary(id);
    };

    /**
     * get unified mailbox name
     * @return { deferred} returns array or null
     */
    api.getUnifiedMailboxName = function () {
        return this.getUnifiedInbox().then(function (inbox) {
            return inbox === null ? null : inbox.split(separator)[0];
        });
    };

    api.getUnifiedInbox = function () {
        var name = settings.get('unifiedInboxIdentifier', null);
        // name might be "null" (a string), should be null instead (see Bug 35439)
        return $.when(name === 'null' ? null : name);
    };

    api.getInbox = function () {
        return settings.get('folder/inbox');
    };

    /**
     * check folder type
     * @param  {string} type (foldertype, example is 'drafts')
     * @param  {type} id [optional]
     * @return { boolean }
     */
    api.is = (function () {

        var unifiedFolders = {
            inbox:  /^default\d+\DINBOX(?:\/|$)/,
            sent:   /^default\d+\DSent(?:\/|$)/,
            trash:  /^default\d+\DTrash(?:\/|$)/,
            drafts: /^default\d+\DDrafts(?:\/|$)/,
            spam:   /^default\d+\DSpam(?:\/|$)/
        };

        function is(type, id) {
            if (api.isUnified(id)) {
                var re = unifiedFolders[type];
                return Boolean(re && re.test(id));
            } else if (type === 'inbox') {
                return typeHash[id] === type;
            } else {
                // loop of all types to also check if a subfolder is of a type
                return _(typeHash).some(function (defaultType, defaultId) {
                    var isSubfolder = (id).indexOf(defaultId + separator) === 0;
                    return defaultType === type && (defaultId === id || isSubfolder);
                });
            }
        }

        // use memoize to speed things up (yep, no reset if someone changes default folders)
        return _.memoize(
            function (type, id) {
                type = String(type || '').split('|');
                id = String(id || '');
                return _(type).reduce(function (memo, type) {
                    return memo || is(type, id);
                }, false);
            },
            function hash(type, id) {
                return type + ':' + id;
            }
        );
    }());

    /**
     * return folders for accounts
     * @param {string} type ('inbox', 'send', 'drafts')
     * @param {integer} accountId [optional]
     * @return { array} folders
     */
    api.getFoldersByType = function (type, accountId) {
        return _(typeHash)
            .chain()
            .map(function (value, key) {
                if (accountId !== undefined && key.indexOf('default' + accountId) === -1) return false;
                return value === type ? key : false;
            })
            .compact()
            .value();
    };

    api.getStandardFolders = function () {
        return _(typeHash).keys();
    };

    api.isStandardFolder = function (id) {
        return typeHash[id] !== undefined;
    };

    api.getType = function (id) {
        return typeHash[id];
    };

    api.getTypes = function () {
        return typeHash;
    };

    api.inspect = function () {
        return { accounts: idHash, types: typeHash };
    };

    /**
     * get account id
     * @param  {string|number} str (folder_id|account_id)
     * @param  {boolean} strict
     * @return { integer} account id
     */
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
     * get the primary address for a given account
     * @param  {string} account_id [optional: default account will be used instead]
     * @return { deferred} returns array (name, primary adress)
     */
    api.getPrimaryAddress = function (account_id) {

        return api.get(account_id || 0)
        .then(ensureDisplayName)
        .then(function (account) {

            if (!account) return $.Deferred().reject(account);

            // use user-setting for primary account and unified folders
            if (account_id === 0 || api.isUnified(account_id)) {
                return require(['settings!io.ox/mail']).then(function (settings) {
                    var defaultSendAddress = $.trim(settings.get('defaultSendAddress', ''));
                    return [account.personal, defaultSendAddress || account.primary_address];
                });
            }

            return [account.personal, account.primary_address];
        })
        .then(function (address) {
            return getAddressArray(address[0], address[1]);
        });
    };

    /**
     * get primary address from folder
     * @param  {string} folder_id
     * @return { deferred} object with properties 'displayname' and 'primaryaddress'
     */
    api.getPrimaryAddressFromFolder = function (folder_id) {

        // get account id (strict)
        var account_id = this.parseAccountId(folder_id, true),
            isUnified = api.isUnified(account_id);

        // get primary address
        return this.getPrimaryAddress(isUnified ? 0 : account_id);
    };

    api.getDefaultDisplayName = function () {
        return require(['io.ox/contacts/util', 'io.ox/core/api/user']).then(function (util, api) {
            return api.get({ id: ox.user_id }).then(function (data) {
                return util.getMailFullName(data);
            });
        });
    };

    // make sure account's personal is set
    var ensureDisplayName = function (account) {

        // no account given or account already has "personal"
        // one space is a special marker not to use any default display name
        if (!account || (account.personal && (account.personal === ' ' || $.trim(account.personal) !== ''))) {
            return $.Deferred().resolve(account);
        }

        return api.getDefaultDisplayName().then(function (personal) {
            account.personal = personal;
            return account;
        });
    };

    api.trimAddress = function (address) {
        address = $.trim(address);
        // apply toLowerCase only for mail addresses, don't change phone numbers
        return address.indexOf('@') > -1 ? address.toLowerCase() : address;
    };

    function getAddressArray(name, address) {
        name = $.trim(name || '');
        address = api.trimAddress(address);
        return [name !== address ? name : '', address];
    }

    /**
     * get sender adress
     * @param  {object} account
     * @return { deferred} returns array the personal name and a list of (alias) addresses
     */
    function getSenderAddress(account) {

        // just for robustness
        if (!account) return [];

        if (!account.addresses) {
            return [getAddressArray(account.personal, account.primary_address)];
        }

        // looks like addresses contains primary address plus aliases
        var addresses = _(String(account.addresses || '').toLowerCase().split(',')).map($.trim).sort();

        // build common array of [display_name, email]
        return _(addresses).map(function (address) {
            var isAlias = address !== account.primary_address,
                anonymouse = isAlias && settings.get('features/anonymousAliases', false),
                display_name = anonymouse ? '' : account.personal;
            return getAddressArray(display_name, address);
        });
    }

    /**
     * get a list of addresses that can be used when sending mails
     * @param  {string} accountId [optional: default account will be used instead]
     * @return { deferred} returns array the personal name and a list of (alias) addresses
     */
    api.getSenderAddresses = function (accountId) {
        return this.get(accountId || 0)
            .then(ensureDisplayName)
            .then(getSenderAddress);
    };

    /**
     * get all sender addresses
     * @return { promise} returns array of arrays
     */
    api.getAllSenderAddresses = function () {

        return api.all()
        .then(function (list) {
            return $.when.apply($, _(list).map(ensureDisplayName));
        })
        .then(function () {
            return _(arguments).flatten(true);
        })
        .then(function (list) {
            return $.when.apply($, _(list).map(getSenderAddress));
        })
        .then(function () {
            return _(arguments).flatten(true);
        })
        .then(function (addresses) {
            // addresses.unshift(['Matthias Biggeleben', 'all@open-xchange.com']);
            // addresses.unshift(['Matthias Biggeleben', 'all@open-xchange.com']);
            // addresses.push(['Matthias Biggeleben', 'all@open-xchange.com']);
            return addresses;
        });
    };

    api.cache = {};

    if (ox.rampup && ox.rampup.accounts) {
        _(ox.rampup.accounts).each(function (data) {
            var account = process(http.makeObject(data, 'account'));
            api.cache[account.id] = account;
        });
    }

    /**
     * get all accounts
     * @return { deferred} returns array of account object
     */
    api.all = function () {

        function load() {
            if (_(api.cache).size() > 0) {
                // cache hit
                return $.Deferred().resolve(_(api.cache).values());
            } else {
                // cache miss
                return http.GET({
                    module: 'account',
                    params: { action: 'all' },
                    appendColumns: true,
                    processResponse: true
                })
                .then(function (data) {
                    // process and add to cache
                    data = process(data);
                    api.cache = {};
                    _(data).each(function (account) {
                        api.cache[account.id] = process(account);
                    });
                    return data;
                });
            }
        }

        return load().done(function (list) {

            idHash = {};
            typeHash = {};

            _(list).each(function (account) {
                // remember account id
                idHash[account.id] = true;
                // add inbox first
                typeHash['default' + account.id + '/INBOX'] = 'inbox';
                // remember types (explicit order!)
                _('sent drafts trash spam archive'.split(' ')).each(function (type) {
                    // fullname is favored over short name
                    var short_name = account[type], full_name = account[type + '_fullname'];
                    typeHash[full_name || short_name] = type;
                });
            });
        });
    };

    /**
     * get mail account
     * @param  {string} id
     * @return { deferred} returns account object
     */
    api.get = function (id) {

        var getter = function () {
            return api.all().then(function () {
                return api.cache[id];
            });
        };

        return api.cache[id] ? $.Deferred().resolve(api.cache[id]) : getter();
    };

    /**
     * create mail account
     * @param  {object} data (attributes)
     * @fires  api#create:account (data)
     * @return { deferred }
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
            api.cache = {};
            return api.all().then(function () {
                api.trigger('create:account', { id: data.id, email: data.primary_address, name: data.name });
                require(['io.ox/core/folder/api'], function (api) {
                    api.propagate('account:create');
                });
                return data;
            });
        });
    };

    /**
     * delete mail account
     * @param  {object} data (attributes)
     * @fires  api#refresh.all
     * @fires  api#delete
     * @return { deferred }
     */
    api.remove = function (data) {

        return http.PUT({
            module: 'account',
            params: { action: 'delete' },
            data: data,
            appendColumns: false
        })
        .done(function () {
            // remove from local cache
            delete api.cache[data];
            api.trigger('refresh.all');
            api.trigger('delete');
            require(['io.ox/core/folder/api'], function (api) {
                api.propagate('account:delete');
            });
        });
    };

    /**
     * validate account data
     * @param  {object} data (accont object)
     * @return { deferred} returns boolean
     */
    api.validate = function (data, params) {
        params = _.extend({
            action: 'validate'
        }, params);

        return http.PUT({
            module: 'account',
            appendColumns: false,
            params: params,
            data: data,
            //needed or http.js does not give the warnings back
            processData: false
        })
        //make it always successful but either true or false, if false we give the warnings back
        .then(
            function success(response) {
                return $.Deferred().resolve(response.data);
            },
            function fail(response) {
                return $.Deferred().resolve(response.data, response);
            }
        );
    };

    /**
     * update account
     * @param  {object} data (account)
     * @return { deferred} returns new account object
     */
    api.update = function (data) {
        // don't send computed data
        delete data.mail_url;
        delete data.transport_url;
        // update
        return http.PUT({
            module: 'account',
            params: { action: 'update' },
            data: data,
            appendColumns: false
        })
        .then(function (result) {

            var id = result.id;

            // detect changes
            if (api.cache[id]) {
                var enabled = result.unified_inbox_enabled;
                if (api.cache[id].unified_inbox_enabled !== enabled) {
                    require(['io.ox/core/folder/api'], function (api) {
                        api.propagate(enabled ? 'account:unified-enable' : 'account:unified-disable');
                    });
                }
            }

            function reload() {
                if (_.isObject(result)) {
                    // update call returned the new object, just return it
                    return $.Deferred().resolve(result);
                }
                // update call didn’t return the new account -> get the data ourselves
                return http.GET({
                    module: 'account',
                    params: { action: 'get', id: data.id },
                    appendColumns: false
                });
            }

            return reload().done(function (result) {
                // update call returned the new account (this is the case for mail)
                api.cache[id] = result;
            })
            .done(function (result) {
                api.trigger('refresh.all');
                api.trigger('update', result);
            });
        });
    };

    /**
     * get autoconfig for given emailadress
     * @param  {object} data (email, password)
     * @return { deferred} returns best available mail server settings (may be incomplete or empty)
     */
    api.autoconfig = function (data) {
        return http.POST({
            module: 'autoconfig',
            params: {
                action: 'get',
                email: data.email,
                password: data.password
            }
        });
    };

    /**
     * jslob testapi
     * @return { deferred }
     */
    api.configtestAll = function () {
        return http.GET({
            module: 'jslob',
            params: {
                action: 'all'
            }
        });
    };

    /**
     * jslob testapi
     * @return { deferred }
     */
    api.configtestList = function (data) {
        return http.PUT({
            module: 'jslob',
            params: {
                action: 'list'
            },
            data: data
        });
    };

    /**
     * jslob testapi
     * @return { deferred }
     */
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

    /**
     * jslob testapi
     * @return { deferred }
     */
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

    /**
     * bind to global refresh; clears caches and trigger refresh.all
     * @fires  api#refresh.all
     * @return { promise }
     */
    api.refresh = function () {
        api.cache = {};
        api.trigger('refresh.all');
    };

    ox.on('refresh^', function () {
        api.refresh();
    });

    return api;
});
