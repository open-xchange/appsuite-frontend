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
    'io.ox/contacts/api',
    'io.ox/core/capabilities',
    'settings!io.ox/mail'
], function (util, api, userAPI, contactsAPI, capabilities, settings) {

    'use strict';

    // helper: sort by mail address (across all accounts)
    function sorter(a, b) {
        a = a.value;
        b = b.value;
        return a < b ? -1 : +1;
    }

    /**
     * returns sender object
     * considers potential existing telephone numbers
     * @param  {array} data
     * @return { object} value, text, display_name, address
     */
    function getSender(data) {
        return {
            text: util.formatSender(data[0], data[1], false),
            value: util.formatSender(data[0], data[1])
        };
    }

    var that = {

        /**
         * user data
         * accessible for testing purposes
         * @return { deferred} resolves as user object
         */
        getUser: function () {
            return userAPI.get({ id: ox.user_id });
        },

        /**
         * default send adresse from settings
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

        getAddressesOptions: function (options) {
            // fallback address - if any other request fails we have the default send address
            var fallbackAddress = settings.get('defaultSendAddress', '').trim();

            // append options to select-box
            return that.getAddresses(options).then(function (addresses, primary) {
                var defaultAddress = fallbackAddress || primary[1],
                    list = [].concat(addresses);

                // process with mail addresses and phone numbers
                list = _(list).map(function (address) {
                    var sender = getSender(address);
                    return { value: sender.value, option: address };
                });

                return {
                    sortedAddresses: list.sort(sorter),
                    defaultAddress: defaultAddress
                };
            });
        }
    };

    return that;
});
