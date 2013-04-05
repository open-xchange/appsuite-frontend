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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define.async("io.ox/mail/accounts/keychain",
             ["io.ox/core/extensions",
             "io.ox/core/api/account",
             "io.ox/core/api/user",
             "io.ox/core/capabilities",
             "io.ox/core/event"], function (ext, accountAPI, userAPI, capabilities, Events) {

    "use strict";

    var moduleDeferred = $.Deferred(),
        extension;

    require(["io.ox/mail/accounts/model"], function (AccountModel) {
        ext.point("io.ox/keychain/model").extend({
            id: 'mail',
            index: 100,
            accountType: "mail",
            wrap: function (thing) {
                return new AccountModel(thing);
            }
        });
    });

    var accounts = {};

    function init(evt, data) {
        return accountAPI.all().done(function (allAccounts) {
            accounts = {};
            if (data) {
                accounts[data.id] = data;
                data.accountType = 'mail';
                data.displayName = data.name || data.primary_address;
                /* read display name from users vcard, if personal field is unset
                 * this is needed for internal accounts, at the moment
                 * FIXME: save one API call here, if data.personal can be assured
                */
                userAPI.getName(ox.user_id).pipe(function (name) {
                    data.personal = data.personal || name;
                });
            }
            _(allAccounts).each(function (account) {
                accounts[account.id] = account;
                account.accountType = 'mail';
                account.displayName = account.name || account.primary_address;
                /* read display name from users vcard, if personal field is unset
                 * this is needed for internal accounts, at the moment
                 * FIXME: save one API call here, if data.personal can be assured
                 */
                userAPI.getName(ox.user_id).pipe(function (name) {
                    account.personal = account.personal || name;
                });
            });
            if (evt) {
                evt = evt.namespace ? evt.type + "." + evt.namespace : evt.type;
                if (evt === 'account_created') {
                    extension.trigger('create');
                    extension.trigger('refresh.all');
                    return;
                }
                extension.trigger(evt);
            }
        });
    }


    init().done(function () {
        moduleDeferred.resolve({message: 'Loaded mail keychain'});
    });
    accountAPI.on("account_created refresh.all refresh.list", init);

    function trigger(evt) {
        return function () {
            extension.trigger(evt);
        };
    }

    accountAPI.on("deleted", trigger("deleted"));
    accountAPI.on("updated", trigger("updated"));


    extension = {
        id: "mail",
        displayName: "Mail Account",
        actionName: "mailaccount",
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

    Events.extend(extension);

    ext.point("io.ox/keychain/api").extend(extension);

    return moduleDeferred;
});
