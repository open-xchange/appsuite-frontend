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
define('io.ox/keychain/model', ['io.ox/core/extensions'], function (ext) {

    'use strict';

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

        ext.point('io.ox/keychain/model').each(function (extension) {
            if (extension.accountType === thing.accountType) {
                return extension.invoke('wrap', extension, thing);
            }
        });

        return new Account(thing);
    }

    return {
        Account: Account,
        Accounts: Accounts,
        wrap: wrap
    };

});
