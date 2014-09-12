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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

 /**
 ext.point("io.ox/keychain/api").extend({
    id: ...,
    displayName: ...,
    getAll: function () {
        // synchronously load all accounts of the given type
    },
    get: function (id) {
        // synchronously load the given account
    },
    getStandardAccount: function () {
        // synchronously fetch the standard account or null if there is no standard account
    },
    hasStandardAccount: function () {
        // return true, if there is a standard account, false otherwise

    },
    createInteractively: function (e) { // e := a click event that triggered this dialog
        // Open a dialog or wizard to create an account of this type
        // returns a deferred object that is resolved if the account creation went through or rejected, if it failed or was aborted.
    },
    remove: function (account) {
        // Delete the account
        // Returns a deferred that is resolved once the account has been deleted
    },
    update: function (account) {
        // Updates the account
        // returns a deferred that is resolved once the account has been updated
        // After the update #get and #getAll are supposed to return the new state.
    }
 })

 **/

define('io.ox/keychain/api', [
    'io.ox/core/extensions',
    'io.ox/core/event',
    'io.ox/core/http',
    'gettext!io.ox/keychain'
], function (ext, Events, http, gt) {

    'use strict';

    var api = {}, data;

    Events.extend(api);

    function byIndex(a, b) {
        return a.index - b.index;
    }

    function initExtensions() {
        api.submodules = {};
        data = [];
        ext.point('io.ox/keychain/api').each(function (extension) {
            data.push(extension);
        });

        //stable sort order (race conditions of ext.point.extend)
        data.sort(byIndex);

        _.each(data, function (extension) {
            api.submodules[extension.id] = extension;
            extension.invoke('init');
            if (extension.on) {
                extension.on('triggered', function () {
                    var args = $.makeArray(arguments);
                    args.shift();
                    if (args.length > 1) {
                        args[1].accountType = extension.id;
                    }
                    api.trigger.apply(api, args);
                });
            }
        });
    }

    initExtensions();

    ext.point('io.ox/keychain/api').on('extended', initExtensions);

    function invokeExtension(accountType, method) {
        var extension = api.submodules[accountType];
        if (!extension) {
            throw new Error('I do not know keys of accountType ' + accountType + '! I suppose a needed plugin was not registered in the server configuration.');
        }
        return extension.invoke.apply(extension, [method, extension].concat($.makeArray(arguments).slice(2)));
    }

    api.getAll = function () {
        var result = [];
        _(api.submodules).each(function (extension) {
            result = result.concat(invokeExtension(extension.id, 'getAll'));
        });

        return result;
    };

    api.get = function (accountType, id) {
        return invokeExtension(accountType, 'get', id);
    };

    api.getStandardAccount = function (accountType) {
        return invokeExtension(accountType, 'getStandardAccount');
    };

    api.hasStandardAccount = function (accountType) {
        return invokeExtension(accountType, 'hasStandardAccount');
    };

    api.getOrCreateStandardAccountInteractively = function (accountType, e) {
        if (!api.hasStandardAccount(accountType)) {
            return api.createInteractively(accountType, e);
        }
    };

    api.createInteractively = function (accountType, win) {
        return invokeExtension(accountType, 'createInteractively', win);
    };

    api.remove = function (account) {
        if (account.attributes) {
            account = account.toJSON();
        }
        return invokeExtension(account.accountType, 'remove', account);
    };

    api.update = function (account) {
        if (account.attributes) {
            account = account.toJSON();
        }

        return invokeExtension(account.accountType, 'update', account);
    };
    api.isEnabled = function (accountType) {
        return !!api.submodules[accountType];
    };

    api.accountType = function (accountType) {
        return api.submodules[accountType];
    };

    api.checkSecrets = function () {
        return http.GET({
            module: 'recovery/secret',
            params: {
                action: 'check'
            }
        });
    };

    api.migrateFromOldSecret = function (oldPassword) {
        return http.POST({
            module: 'recovery/secret',
            params: {
                action: 'migrate',
                password: oldPassword
            }
        });
    };

    api.cleanUpIrrecoverableItems = function () {
        return http.GET({
            module: 'recovery/secret',
            params: {
                action: 'remove'
            }
        }).done(function () {
            ox.cache.clear();
            require(['io.ox/core/notifications'], function (n) {
                n.yell('success', gt('The unrecoverable items have been cleaned up successfully. Please refresh this page to see the changes.'));
            });
        });
    };

    return api;

});
