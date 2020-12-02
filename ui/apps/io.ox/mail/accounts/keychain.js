/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define.async('io.ox/mail/accounts/keychain', [
    'io.ox/core/extensions',
    'io.ox/core/api/account',
    'io.ox/core/api/user',
    'io.ox/core/capabilities',
    'io.ox/core/event',
    'io.ox/mail/accounts/model',
    'io.ox/core/api/filestorage',
    'gettext!io.ox/keychain',
    //pre fetch dependencies for io.ox/mail/accounts/model - saves 1 request
    'io.ox/backbone/validation',
    'io.ox/keychain/model'
], function (ext, accountAPI, userAPI, capabilities, Events, AccountModel, filestorageAPI, gt) {

    'use strict';

    var moduleDeferred = $.Deferred(),
        extension, extensionFileservice;

    ext.point('io.ox/keychain/model').extend({
        id: 'mail',
        index: 100,
        accountType: 'mail',
        wrap: function (thing) {
            return new AccountModel(thing);
        }
    });

    var accounts = {};
    var fileAccounts = {};

    function init(evt, data) {
        return $.when(accountAPI.all().then(function (allAccounts) {
            var accounts = {};
            _(allAccounts).each(function (account) {
                accounts[account.id] = account;
                account.accountType = 'mail';
                account.displayName = account.name || account.primary_address;
                /* read display name from users vcard, if personal field is unset
                 * this is needed for internal accounts, at the moment
                 * FIXME: save one API call here, if data.personal can be assured
                 */
            });
            return accounts;
        }, function () {
            return {};
        }), filestorageAPI.getAllAccounts().then(function (allFileAccounts) {
            var accounts = {};
            allFileAccounts = allFileAccounts.models;
            _(allFileAccounts).each(function (account) {
                if (/owncloud|nextcloud|webdav/.test(account.get('filestorageService'))) {
                    account = account.attributes;

                    var error = account.hasError ? { message: account.error } : account.status = 'ok';
                    fileAccounts[account.id] = account;
                    account.accountType = 'fileAccount';
                    account.status = error;
                }
            });
            return accounts;
        }, function () {
            return {};
        })).always(function (allAccounts, allFileAccounts) {
            accounts = allAccounts;
            fileAccounts = allFileAccounts;
            if (data) {
                accounts[data.id] = data;
                data.accountType = 'mail';
                data.displayName = data.name || data.primary_address;
                /* read display name from users vcard, if personal field is unset
                 * this is needed for internal accounts, at the moment
                 * FIXME: save one API call here, if data.personal can be assured
                */
                userAPI.getName(ox.user_id).then(function (name) {
                    data.personal = data.personal || name;
                });
            }

            if (evt) {
                evt = evt.namespace ? evt.type + '.' + evt.namespace : evt.type;
                if (evt === 'create:account') {
                    extension.trigger('create');
                    extension.trigger('refresh.all');
                    return;
                }
                extension.trigger(evt);
            }
        });
    }

    init().always(function () {
        moduleDeferred.resolve({ message: 'Loaded mail keychain' });
    });
    accountAPI.on('create:account refresh.all refresh.list', init);
    filestorageAPI.on('update', init);

    function trigger(evt) {
        return function () {
            extension.trigger(evt);
        };
    }

    accountAPI.on('deleted', trigger('deleted'));
    accountAPI.on('updated', trigger('updated'));

    extension = {
        id: 'mail',
        index: 100,
        // displayName appears in drop-down menu
        displayName: gt('Mail account'),
        actionName: 'mailaccount',
        canAdd: function () {
            return capabilities.has('multiple_mail_accounts');
        },
        getAll: function () {
            return _(accounts).map(function (account) { return account; });
        },
        get: function (id) {
            return accounts[id];
        },
        getStandardAccount: function () {
            return accounts[0];
        },
        hasStandardAccount: function () {
            return !!accounts[0];
        },
        createInteractively: function (e) {
            var def = $.Deferred();
            require(['io.ox/mail/accounts/settings'], function (mailSettings) {
                // FIXME: This is not very blackboxy
                mailSettings.mailAutoconfigDialog(e).done(function () {
                    def.resolve();
                }).fail(def.reject);
            });

            return def;
        },
        remove: function (account) {
            return accountAPI.remove([account.id]);
        },
        update: function (account) {
            return accountAPI.update(account);
        }
    };

    extensionFileservice = {
        id: 'fileservice',
        index: 200,
        actionName: 'fileservice',
        getAll: function () {
            return _(fileAccounts).map(function (account) { return account; });
        },
        get: function (id) {
            return fileAccounts[id];
        }
    };

    Events.extend(extension);
    Events.extend(extensionFileservice);

    ext.point('io.ox/keychain/api').extend(extension);
    ext.point('io.ox/keychain/api').extend(extensionFileservice);

    return moduleDeferred;
});
