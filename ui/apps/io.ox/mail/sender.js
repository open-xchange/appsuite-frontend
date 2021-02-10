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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/sender', [
    'io.ox/mail/util',
    'io.ox/core/api/account',
    'io.ox/core/api/user',
    'settings!io.ox/mail'
], function (util, api, userAPI, settings) {

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
                that.getAddresses(options).then(function (addresses, primary) {
                    self.defaultAddress = that.getDefaultSendAddress() || primary[1];
                    self.reset(addresses);
                });
                return this;
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
