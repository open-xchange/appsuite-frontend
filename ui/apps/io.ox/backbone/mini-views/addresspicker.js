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
* @author Christoph Kopp <christoph.kopp@open-xchange.com>
*/

define('io.ox/backbone/mini-views/addresspicker', [
    'io.ox/backbone/mini-views/abstract',
    'io.ox/participants/model',
    'io.ox/contacts/api',
    'io.ox/core/api/resource',
    'io.ox/core/capabilities',
    'io.ox/mail/util',
    'gettext!io.ox/core',
    'less!io.ox/backbone/mini-views/addresspicker'
], function (AbstractView, pModel, api, resourceAPI, capabilities, util, gt) {

    'use strict';

    var AddressPickerView = AbstractView.extend({

        tagName: 'span',

        events: {
            'click button': 'onClick'
        },

        initialize: function (opt) {
            this.opt = _.extend({
                process: $.noop, // a function to process the pickeroutput
                resources: false
            }, opt);
        },

        onClick: function openAddressBookPicker(e) {
            e.preventDefault();
            var options = this.opt;
            require(['io.ox/contacts/addressbook/popup'], function (popup) {
                var useGABOnly = options.useGABOnly || (options.isPermission && !capabilities.has('invite_guests'));
                popup.open(function (result) {
                    _(result).each(function (item) {
                        var member;
                        if (item.folder_id === 'virtual/resource') {
                            resourceAPI.get({ id: item.id }).done(function (data) {
                                data = _.extend(data, { type: 3, field: 'email1' });
                                member = new pModel.Participant(data);
                                options.process(e, member, item);
                            });
                        } else if (item.folder_id) {
                            api.get(item).done(function (data) {
                                // specifiy address field (email1, email2, ...)
                                if (item.field) data.field = item.field;
                                member = new pModel.Participant(data);
                                options.process(e, member, item);
                            });
                        } else {
                            member = new pModel.Participant({
                                display_name: util.parseRecipient(item.array[1])[0],
                                email1: item.array[1],
                                field: 'email1',
                                type: 5
                            });
                            options.process(e, member, item);
                        }
                    });
                }, { useGABOnly: useGABOnly, resources: options.resources });
            });
        },

        render: function () {
            this.$el.addClass('input-group-btn').append(
                $('<button type="button" class="btn btn-default">').attr('aria-label', gt('Select contacts')).append(
                    $('<i class="fa fa-address-book" aria-hidden="true">').attr('title', gt('Select contacts'))
                )
            );

            return this;
        }

    });

    return AddressPickerView;

});
