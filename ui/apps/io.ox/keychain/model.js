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
define("io.ox/keychain/model", function () {
    "use strict";
    
    var Account = Backbone.Model.extend();
    var Accounts = Backbone.Collection.extend({
        model: Account
    });
    
    
    function wrap(thing) {
        if (arguments.length > 1) {
            return _(arguments).map(wrap);
        }
        if (_.isArray(thing)) {
            var accounts = new Accounts();
            accounts.add(thing);
            return accounts;
        }
        
        return new Account(thing);
    }
    
    return {
        Account: Account,
        Accounts: Accounts,
        wrap: wrap
    };
    
});