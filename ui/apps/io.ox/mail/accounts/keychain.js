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
define("io.ox/mail/accounts/keychain", ["io.ox/core/extensions", "io.ox/core/api/account"], function (ext, accountAPI) {
    "use strict";
    
    var accounts = {};
    
    function init() {
        accountAPI.all(function (allAccounts) {
            _(allAccounts).each(function (account) {
                accounts[account.id] = account;
            });
        });
    }
    
    init();
    accountAPI.on("account_created refresh.all", init);
    
    ext.point("io.ox/keychain/api").extend({
        id: "mail",
        getAll: function () {
            _(accounts).map(function (account) { return account; });
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
            require(['io.ox/settings/accounts/email/settings'], function (mailSettings) {
                // FIXME: This is not very blackboxy
                mailSettings.mailAutoconfigDialog(e).done(def.resolve).fail(def.reject);
            });
            
            return def;
        },
        remove: function (account) {
            return accountAPI.remove(account);
        },
        update: function (account) {
            return accountAPI.update(account);
        }
    });
});