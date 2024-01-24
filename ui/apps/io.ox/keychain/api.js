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
    'io.ox/core/http',
    'gettext!io.ox/keychain'
], function (ext, http, gt) {

    'use strict';

    var api = _.extend({}, Backbone.Events), data;

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
            if (extension.on && !extension.isInitialized) {
                extension.on('triggered', function () {
                    var args = $.makeArray(arguments);
                    args.shift();
                    if (args.length > 1) {
                        args[1].accountType = extension.id;
                    }
                    api.trigger.apply(api, args);
                });
                // we don't want to add the same listener multiple times
                extension.isInitialized = true;
            }
            // for extensions relying on the triggered listener to be present
            extension.trigger('initialized');
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

    api.createInteractively = function (accountType) {
        return invokeExtension.apply(this, [accountType, 'createInteractively'].concat($.makeArray(arguments).slice(1)));
    };

    api.remove = function (account) {
        if (account.attributes) {
            account = account.toJSON();
        }
        return invokeExtension(account.accountType, 'remove', account)
                .always(function () {
                    require(['io.ox/core/folder/api'], function (api) {
                        ox.trigger('account:delete');
                        api.propagate('account:delete');
                    });
                });
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
            data: {
                action: 'migrate',
                password: oldPassword
            }
        });
    };

    // clean up used to simulate an "ignore" in case
    // password was changed, see Bug #56412
    api.cleanUp = function () {
        return http.GET({
            module: 'recovery/secret',
            params: {
                action: 'clean_up'
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
