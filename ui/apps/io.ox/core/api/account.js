/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/api/account', [
    'settings!io.ox/mail',
    'io.ox/core/http',
    'io.ox/core/event'
], function (settings, http, Events) {

    'use strict';

    // quick hash for sync checks
    var idHash = {},
        hiddenHash = {},
        typeHash = {},
        // default separator
        separator = settings.get('defaultseparator', '/'),
        altnamespace = settings.get('namespace', 'INBOX/') === '';

    var process = function (data) {

        var isArray = _.isArray(data);
        data = isArray ? data : [data];

        var rPath = /^default\d+/,

            fix = function (type) {
                var prefix = 'default' + this.id + separator,
                    field = type + '_fullname',
                    folder;
                // check if folder path is not defined
                if (!this[field]) {
                    // only fix primary account (see US 91604548 / Bug 37439)
                    if (this.id !== 0) return;
                    folder = settings.get(['folder', type]);
                    if (!folder) {
                        // fix fullname only if we have a short name
                        if (this[type]) {
                            folder = altnamespace ? 'default0' : settings.get('folder/inbox');
                            folder += separator + this[type];
                        } else {
                            // empty string simply to avoid null value
                            folder = '';
                        }
                    }
                    this[field] = folder;
                } else if (!rPath.test(this[field])) {
                    // missing prefix
                    this[field] = prefix + this[field];
                }
            };

        _(data).each(function (account) {
            _(['trash', 'sent', 'drafts', 'spam', 'archive', 'confirmed_spam', 'confirmed_ham']).each(fix, account);
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
     * is unified root folder
     * @param  {string}  id (folder_id)
     * @return { boolean }
     */
    api.isUnifiedRoot = function (id) {
        return api.isUnified(id) && id.split(separator).length === 1;
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
     * is hidden secondary account
     * @param  {string}  id (account_id)
     * @return {boolean}
     */
    api.isHidden = function (data) {
        if (data.id) return api.isAccount(data.id) && !!hiddenHash[data.id];
        if (data.primary_address) return _.values(hiddenHash).indexOf(data.primary_address) >= 0;
        if (data.folder_id) return !!hiddenHash[data.folder_id.split(separator)[0]];
        return false;
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
            }
            // loop of all types to also check if a subfolder is of a type
            return _(typeHash).some(function (defaultType, defaultId) {
                var isSubfolder = (id).indexOf(defaultId + separator) === 0;
                return defaultType === type && (defaultId === id || isSubfolder);
            });
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

    api.isMalicious = function (id, blacklist) {
        if (!id) return;
        // includes simple subfolder checks
        if (api.is('spam', id)) return true;
        if (api.is('confirmed_spam', id)) return true;
        return _(blacklist).some(function (folder) {
            return folder === id || (id).indexOf(folder + separator) === 0;
        });
    };

    api.getType = function (id) {
        if (id === 'virtual/all-unseen') return 'unseen';
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
            }
            // strip off unified prefix
            var tail = str.replace(regParseAccountId, '');
            if (tail !== str && /^default\d+/.test(tail)) {
                return api.parseAccountId(tail, strict);
            }
            if (!strict) {
                return 0;
            }
            var m = str.match(/^default(\d+)/);
            return m && m.length ? parseInt(m[1], 10) : 0;
        }
        // default account
        return 0;
    };

    /**
     * get the primary address for a given account
     * @param  {string} account_id [optional: default account will be used instead]
     * @return { deferred} returns array (name, primary address)
     */
    api.getPrimaryAddress = function (account_id) {

        return api.get(account_id || 0)
        .then(ensureDisplayName)
        .then(function (account) {
            if (!account) return $.Deferred().reject(account);

            // use user-setting for primary account and unified folders
            if (account_id === 0 || !account.transport_url || api.isUnified(account_id)) {
                return api.getDefaultAddress();
            }

            return [account.personal, account.primary_address];
        })
        .then(function (address) {
            return getAddressArray(address[0], address[1]);
        });
    };

    api.getDefaultAddress = function () {
        return api.get(0).then(ensureDisplayName).then(function (account) {
            var defaultSendAddress = $.trim(settings.get('defaultSendAddress', ''));
            return [account.personal, defaultSendAddress || account.primary_address];
        });
    };

    /*
     * get valid address for account
     */
    api.getValidAddress = function (data) {
        return api.getAllSenderAddresses().then(function (a) {
            if (_.isEmpty(a)) return;
            // set correct display name
            if (!_.isEmpty(data.from)) {
                data.from = a.filter(function (from) {
                    return from[1] === data.from[0][1].toLowerCase();
                });
            }
            if (!_.isEmpty(data.from)) return data;
            // use primary account as fallback
            return api.getPrimaryAddress().then(function (defaultAddress) {
                return _.extend(data, { from: [defaultAddress] });
            });
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

    api.getAddressesFromFolder = function (folder_id) {
        // get account id (strict)
        var account_id = this.parseAccountId(folder_id, true),
            isUnified = api.isUnified(account_id);

        // get primary address and aliases
        return $.when(
            this.getPrimaryAddress(isUnified ? 0 : account_id),
            api.getSenderAddresses(isUnified ? 0 : account_id)
        ).then(function (primary, all) {
            return {
                primary: primary,
                aliases: _.reject(all, function (address) {
                    return primary[1] === address[1];
                })
            };
        });
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
     * get sender address
     * @param  {object} account
     * @return { deferred} returns array the personal name and a list of (alias) addresses
     */
    api.getSenderAddress = function (account) {

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
    };

    /**
     * get a list of addresses that can be used when sending mails
     * @param  {string} accountId [optional: default account will be used instead]
     * @return { deferred} returns array the personal name and a list of (alias) addresses
     */
    api.getSenderAddresses = function (accountId) {
        return this.get(accountId || 0)
            .then(ensureDisplayName)
            .then(api.getSenderAddress);
    };

    /**
     * get all sender addresses
     * @return { promise} returns array of arrays
     */
    api.getAllSenderAddresses = function (options) {
        return api.all(options)
            .then(function (list) {
                // only consider external accounts with a transport_url (see bug 48344)
                // primary account is assumed to always work even without a transport_url
                return _(list).filter(function (account) {
                    return account.id === 0 || !!account.transport_url;
                });
            })
            .then(function (list) {
                return $.when.apply($, _(list).map(ensureDisplayName));
            })
            .then(function () {
                return _(arguments).flatten(true);
            })
            .then(function (list) {
                return $.when.apply($, _(list).map(api.getSenderAddress));
            })
            .then(function () {
                return _(arguments).flatten(true);
            })
            .then(function (list) {
                // filter deactivated secondary accounts
                return [].concat(list).filter(function (address) {
                    return !api.isHidden({ primary_address: address[1] });
                });
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
    api.all = function (options) {
        var opt = _.extend({ useCache: true }, options);

        function load() {
            if (_(api.cache).size() > 0 && opt.useCache) {
                // cache hit
                return $.Deferred().resolve(_(api.cache).values());
            }
            // cache miss, refill cache on success
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

        return load().done(function (list) {
            idHash = {};
            hiddenHash = {};
            typeHash = {};
            // add check here
            _(list).each(function (account) {
                // hidden secondary account
                if (account.secondary) hiddenHash['default' + account.id] = account.deactivated ? account.primary_address : false;
                // remember account id
                idHash[account.id] = true;
                // add inbox first
                typeHash['default' + account.id + '/INBOX'] = 'inbox';
                // remember types (explicit order!)
                _('drafts sent spam trash archive'.split(' ')).each(function (type) {
                    // fullname is favored over short name
                    var short_name = account[type], full_name = account[type + '_fullname'], name = full_name || short_name;
                    // check to avoid unwanted overrides
                    if (!typeHash[name]) typeHash[name] = type;
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
            return api.reload().then(function () {
                ox.trigger('account:create');
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
            var accountId = (api.cache[data] || {}).root_folder;
            // remove from local cache
            delete api.cache[data];
            ox.trigger('account:delete', accountId);
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
                return $.Deferred().resolve(response.data, response.category === 13 ? response : undefined);
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
                // add folder type full names
                result = process(result);
                // update call returned the new account (this is the case for mail)
                api.cache[id] = result;
            })
            .done(function (result) {
                api.trigger('refresh.all');
                api.trigger('update', result);
                ox.trigger('account:update', id);
                if (!('deactivated' in data)) return;
                ox.trigger('account:status', { deactivated: data.deactivated, root_folder: result.root_folder });
            });
        });
    };

    /**
     * get autoconfig for given emailaddress
     * @param  {object} data (email, password)
     * @return { deferred} returns best available mail server settings (may be incomplete or empty)
     */
    api.autoconfig = function (data) {
        return http.POST({
            module: 'autoconfig',
            data: _.extend({
                action: 'get'
            }, data)
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
     * gets the status for one or all accounts
     * @param  { string } id account id
     * @return { deferred }
     */
    api.getStatus = function (id) {
        var p = { action: 'status' };
        // id 0 is the default account, so use an exact check here
        if (id !== undefined) p.id = id;

        return http.GET({
            module: 'account',
            params: p
        });
    };

    api.getPrimaryName = function () {
        if (!api.cache[0]) return '';
        var name = api.cache[0].name;
        if (!/^(email|e-mail)$/i.test(name)) return name;
        return String(api.cache[0].primary_address).toLowerCase().split('@')[1] || '';
    };

    /**
     * bind to global refresh; clears caches and trigger refresh.all
     * @fires  api#refresh.all
     * @return { promise }
     */

    api.reload = function () {
        return api.all({ useCache: false });
    };

    api.refresh = function () {
        return this.reload().done(function () {
            api.trigger('refresh.all');
        });
    };

    ox.on('refresh^', function () {
        api.refresh();
    });

    return api;
});
