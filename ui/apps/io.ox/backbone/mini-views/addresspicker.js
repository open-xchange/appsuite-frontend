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
    'io.ox/core/capabilities',
    'io.ox/mail/util',
    'gettext!io.ox/core',
    'less!io.ox/backbone/mini-views/addresspicker'
], function (AbstractView, pModel, api, capabilities, util, gt) {

    'use strict';

    var AddressPickerView = AbstractView.extend({

        tagName: 'span',

        events: {
            'click button': 'onClick'
        },

        initialize: function (opt) {
            this.opt = _.extend({
                process: $.noop // a function to process the pickeroutput
            }, opt);
        },

        onClick: function openAddressBookPicker(e) {
            e.preventDefault();

            var self = this;
            require(['io.ox/contacts/addressbook/popup'], function (popup) {
                var useGABOnly = self.opt.useGABOnly || (self.opt.isPermission && !capabilities.has('invite_guests'));
                popup.open(function (result) {
                    _.each(result, function (singleData) {
                        if (self.opt.processRaw) return self.opt.process(e, singleData);
                        var member;
                        if (singleData.folder_id) {
                            api.get(singleData).done(function (data) {
                                // specifiy address field (email1, email2, ...)
                                if (singleData.field) data.field = singleData.field;
                                member = new pModel.Participant(data);
                                self.opt.process(e, member, singleData);
                            });
                        } else {
                            member = new pModel.Participant({
                                display_name: util.parseRecipient(singleData.array[1])[0],
                                email1: singleData.array[1],
                                field: 'email1',
                                type: 5
                            });
                            self.opt.process(e, member, singleData);
                        }

                    });
                }, useGABOnly);
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
