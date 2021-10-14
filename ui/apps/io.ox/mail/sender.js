/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/mail/sender', [
    'io.ox/mail/util',
    'io.ox/core/api/account',
    'io.ox/core/deputy/api',
    'io.ox/core/api/user',
    'io.ox/core/capabilities',
    'settings!io.ox/mail'
], function (util, api, deputyAPI, userAPI, capabilities, settings) {

    'use strict';

    var that,
        SenderModel = Backbone.Model.extend({
            initialize: function (data) {
                this.set('name', data[0]);
                this.set('email', data[1]);
            },
            quoted: function () {
                return util.formatSender(this.get(name), this.get('email'));
            },
            unquoted: function () {
                return util.formatSender(this.get(name), this.get('email'), false);
            },
            toArray: function () {
                return [this.get(0), this.get(1)];
            }
        }),
        SenderList = Backbone.Collection.extend({
            model: SenderModel,
            comparator: function (a1, a2) {
                if (a1.get('email') === this.defaultAddress) return -1;
                if (a2.get('email') === this.defaultAddress) return 1;
                return a1.toString().toLowerCase() < a2.toString().toLowerCase() ? -1 : 1;
            },
            update: function (options) {
                var self = this;
                that.getAddresses(options).then(function (addresses, deputyAddresses, primary) {
                    // save deputy addresses in an array, to look them up later
                    self.deputyAddresses = _(deputyAddresses).map(function (address) { return address[1]; });
                    // put addresses from accounts (own or external) and addresses from deputy permissions in one list
                    addresses = addresses.concat(deputyAddresses);
                    self.defaultAddress = that.getDefaultSendAddress() || primary[1];
                    self.reset(addresses);
                });
                return this;
            },
            getDeputyAddresses: function () {
                return this.deputyAddresses || [];
            },
            isDeputyAddress: function (address) {
                return _(this.getDeputyAddresses()).contains(address);
            }
        }),
        senders;

    that = {

        /**
         * user data
         * accessible for testing purposes
         * @return { deferred} resolves as user object
         */
        getUser: function () {
            return userAPI.get({ id: ox.user_id });
        },

        /**
         * default send address from settings
         * @return {string}
         */
        getDefaultSendAddress: function () {
            return $.trim(settings.get('defaultSendAddress', ''));
        },

        /**
         * internal and external accounts
         * accessible for testing purposes
         * @return { deferred} resolves as array of arrays
         */
        getAccounts: function (options) {
            return api.getAllSenderAddresses(options);
        },

        /**
         * display name
         * accessible for testing purposes
         * @return { deferred} resolves as string
         */
        getDisplayName: function () {
            return api.getDefaultDisplayName();
        },

        /**
         * primary address
         * accessible for testing purposes
         * @return { deferred} resolves as array
         */
        getPrimaryAddress: function () {
            return api.getPrimaryAddress();
        },

        /**
         * list of normalised arrays (display_name, value)
         * accessible for testing purposes
         * @return { deferred} resolves as array
         */
        getAddresses: function (options) {
            return $.when(
                that.getAccounts(options),
                capabilities.has('deputy') ? deputyAPI.getGranteeAddresses() : [],
                that.getPrimaryAddress()
            );
        },

        getAddressesCollection: function () {
            if (!senders) senders = new SenderList();
            return senders;
        }
    };

    return that;
});
