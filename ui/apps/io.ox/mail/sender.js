/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/sender',
    ['io.ox/mail/util',
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

    function drawOption(value, text, display_name, address) {
        return $('<option>', { value: value }).text(_.noI18n(text || value))
            .attr({ 'data-display-name': (display_name || ''), 'data-address': (address || value) });
    }

    /**
     * returns sender object
     * considers potential existing telephone numbers
     * @param  {array} data
     * @return {object} value, text, display_name, address
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

        getsender: function (data) {
            return getSender(data);
        },


        // get current sender
        get: function (select) {
            var option = select.children('option:selected'),
                display_name = option.attr('data-display-name'),
                address = option.attr('data-address');
            return option.length ? [display_name, address] : ['', select.attr('data-default-send-address')];
        },

        // set sender. Use default as fallback
        set: function (select, from) {

            if (!select || !_.isArray(from)) return;

            var address = api.trimAddress(from[1]),
                option = select.find('[data-address="' + address + '"]'),
                children = select.children(),
                index;

            // still empty?
            if (children.length === 0) {
                select.attr('data-default', address);
                return;
            }

            index = children.index(option);

            if (index === -1) {
                option = select.find('[default]');
                index = select.children().index(option);
            }

            select.prop('selectedIndex', index);
        },

        /**
         * user data
         * accessible for testing purposes
         * @return {deferred} resolves as user object
         */
        getUser: function () {
            return userAPI.get({ id: ox.user_id });
        },

        /**
         * get mapped fields
         * accessible for testing purposes
         * @return {array}
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
         * default send adresse from settings
         * @return {string}
         */
        getDefaultSendAddressWithDisplayname: function () {
            return that.getAddresses().then(function (addresses, numbers, primary) {
                return [primary];
            });
        },

        /**
         * primary address
         * accessible for testing purposes
         * @return {deferred} resolves as array
         */
        getPrimaryAddress: function () {
            return api.getPrimaryAddress();
        },

        /**
         * internal and external accounts
         * accessible for testing purposes
         * @return {deferred} resolves as array of arrays
         */
        getAccounts: function () {
            return api.getAllSenderAddresses();
        },

        /**
         * display name
         * accessible for testing purposes
         * @return {deferred} resolves as string
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
         * @return {deferred} resolves as array of arrays
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
         * list of normalised arrays (display_name, value)
         * accessible for testing purposes
         * @return {deferred} resolves as array
         */
        getAddresses: function () {
            return $.when(
                    that.getAccounts(),
                    that.getNumbers(),
                    that.getPrimaryAddress()
                );
        },

        /**
         * add all senders to <select> box
         * @param  {jquery} select node
         * @return {undefined}
         */
        drawOptions: function (select) {
            if (!select) return;

            // fallback address - if any other request fails we have the default send address
            var defaultAddress = this.getDefaultSendAddress();
            select.empty()
                .attr('data-default-send-address', defaultAddress)
                .append(drawOption(defaultAddress));

            // append options to select-box
            return that.getAddresses().then(function (addresses, numbers, primary) {
                var defaultAddress = select.attr('data-default') || primary[1],
                    defaultValue,
                    list = [].concat(addresses, numbers);

                // process with mail addresses and phone numbers
                list = _(list).map(function (address) {
                    var sender = getSender(address),
                        option = drawOption(sender.value, sender.text, sender.display_name, sender.address);
                    //support typed or typeless defaultAddress
                    if (address[1] === defaultAddress || sender.address === defaultAddress) {
                        option.attr('default', 'default');
                        defaultValue = sender.value;
                    }
                    return { value: sender.value, option: option };
                });

                // concat, sort, then add to drop-down
                select.empty().append(
                    _(list.sort(sorter)).pluck('option')
                );

                select.attr('data-default', defaultAddress);

                if (defaultValue) select.val(defaultValue);
            });
                },

        drawDropdown: function () {
            // fallback address - if any other request fails we have the default send address
            var fallbackAddress = this.getDefaultSendAddress();

            // append options to select-box
            return that.getAddresses().then(function (addresses, numbers, primary) {
                var defaultAddress = fallbackAddress || primary[1],
                    defaultValue,
                    list = [].concat(addresses, numbers);

                // process with mail addresses and phone numbers
                list = _(list).map(function (address) {
                    var sender = getSender(address);
                    //support typed or typeless defaultAddress
                    if (address[1] === defaultAddress || sender.address === defaultAddress) {
                        defaultValue = sender.value;
                    }

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
