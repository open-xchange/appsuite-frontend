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
        var sender = {
            display_name: data[0],
            address: util.getChannel(data[1]) === 'email' ? data[1] : util.cleanupPhone(data[1]) + util.getChannelSuffixes().msisdn
        };
        //hide may existing type suffix for text
        sender.text = util.formatSender(sender.display_name, data[1], false);
        sender.value = util.formatSender(sender.display_name, sender.address);
        return sender;
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
         * get mapped fields
         * accessible for testing purposes
         * @return { array }
         */
        getMapping: function () {
            return capabilities.has('msisdn') ? contactsAPI.getMapping('msisdn', 'names') : [];
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
        getAccounts: function () {
            return api.getAllSenderAddresses();
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
         * get normalized sender array(s) from mapped phone numbers
         * @example
         *     └─ 0
         *        ├─ 0: Pierce Hawthorne
         *        └─ 1: +4915656181546
         *     └─ 1
         *        ├─ 0: Pierce Hawthorne
         *        └─ 1: +49195841148248
         * @return { deferred} resolves as array of arrays
         */
        getNumbers: function () {
            return $.when(
                that.getUser(),
                that.getDisplayName()
            )
            .then(function (data, display_name) {
                display_name = display_name || data.display_name || '';
                return _(that.getMapping())
                            .chain()
                            .map(function (field) {
                                var number = $.trim(data[field]);
                                if (number) {
                                    return [
                                        display_name,
                                        number
                                    ];
                                }
                            })
                            .compact()
                            .value();
            });
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
        getAddresses: function () {
            return $.when(
                that.getAccounts(),
                that.getNumbers(),
                that.getPrimaryAddress()
            );
        },

        getAddressesOptions: function () {
            // fallback address - if any other request fails we have the default send address
            var fallbackAddress = settings.get('defaultSendAddress', '').trim();

            // append options to select-box
            return that.getAddresses().then(function (addresses, numbers, primary) {

                var defaultAddress = fallbackAddress || primary[1],
                    list = [].concat(addresses, numbers);

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
