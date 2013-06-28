/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/sender',
    ['io.ox/mail/util',
     'io.ox/core/api/account',
     'io.ox/core/api/user',
     'io.ox/contacts/api',
     'io.ox/core/capabilities'], function (util, api, userAPI, contactsAPI, capabilities) {

    'use strict';

    // helper: sort by mail address (across all accounts)
    function sorter(a, b) {
        a = a.value;
        b = b.value;
        return a < b ? -1 : +1;
    }

    function drawOption(value, text, display_name, address) {
        return $('<option>', { value: value }).text(_.noI18n(text))
            .attr({ 'data-display-name': display_name, 'data-address': address });
    }

    var that = {

        // get current sender
        get: function (select) {
            var option = select.children('option:selected'),
                display_name = option.attr('data-display-name'),
                address = option.attr('data-address');
            return [display_name, address];
        },

        // set sender. Use default as fallback
        set: function (select, from) {

            if (!select || !_.isArray(from)) return;

            var address = $.trim(from[1]).toLowerCase(),
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

        // accessible for testing purposes
        getNumbers: function () {
            return userAPI.get({ id: ox.user_id });
        },

        // accessible for testing purposes
        getMapping: function () {
            return capabilities.has('msisdn') ? contactsAPI.getMapping('msisdn', 'names') : [];
        },

        // add all senders to <select> box
        drawOptions: function (select) {

            if (!select) return;

            // get accounts
            var accounts = api.getAllSenderAddresses();

            // get MSISDN numbers
            var numbers = $.when(
                that.getNumbers(),
                api.getDefaultDisplayName()
            )
            .then(function (data, display_name) {

                display_name = display_name || data.display_name || '';

                return _(that.getMapping())
                    .chain()
                    .map(function (field) {
                        var number = $.trim(data[field]), address;
                        if (number) {
                            address = util.cleanupPhone(number) + util.getChannelSuffixes().msisdn;
                            return [
                                display_name,
                                address,
                                '"' + display_name + '" <' + address + '>',
                                display_name + ' <' + number + '>'
                            ];
                        }
                    })
                    .compact()
                    .value();
            });

            // append to select-box
            return $.when(
                accounts,
                numbers,
                api.getPrimaryAddress()
            )
            .then(function (addresses, numbers, primary) {

                var defaultAddress = select.attr('data-default') || primary[1],
                    defaultValue;

                // get all mail addresses
                addresses = _(addresses).map(function (address) {
                    var text = util.formatSender(address, false),
                        value = util.formatSender(address),
                        option = drawOption(value, text, address[0], address[1]);
                    if (address[1] === defaultAddress) {
                        option.attr('default', 'default');
                        defaultValue = value;
                    }
                    return { value: value, option: option };
                });

                // get all phone numbers
                numbers = _(numbers).map(function (number) {
                    var value = number[2],
                        option = drawOption(value, number[3], number[0], number[1]);
                    if (number[0] === defaultAddress) {
                        option.attr('default', 'default');
                        defaultValue = value;
                    }
                    return { value: value, option: option };
                });

                // concat, sort, then add to drop-down
                select.append(
                    _(addresses.concat(numbers).sort(sorter)).pluck('option')
                );

                select.attr('data-default', defaultAddress);

                if (defaultValue) select.val(defaultValue);
            });
        }
    };

    return that;
});
