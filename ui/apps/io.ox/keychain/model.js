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

define('io.ox/keychain/model', ['io.ox/core/extensions'], function (ext) {

    'use strict';

    var Account = Backbone.Model.extend({
        idAttribute: 'cid'
    });
    var Accounts = Backbone.Collection.extend({
        model: Account
    });

    function wrap(thing) {
        if (arguments.length > 1) {
            return _(arguments).map(wrap);
        }
        if (_.isArray(thing)) {
            var accounts = new Accounts();
            // avoid double ids (for example Oauth account and mail account can have the same id)
            _(thing).each(function (acc) {
                acc.cid = acc.accountType + acc.id;
            });
            accounts.add(thing);
            return accounts;
        }

        if (thing.accountType && thing.id) {
            thing.cid = thing.accountType + thing.id;
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
