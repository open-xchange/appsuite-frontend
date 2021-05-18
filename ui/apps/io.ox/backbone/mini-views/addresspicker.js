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
            var self = this,
                picker = capabilities.has('enterprise_picker') ? 'io.ox/contacts/enterprisepicker/dialog' : 'io.ox/contacts/addressbook/popup';

            require([picker], function (popup) {
                self.opt.useGABOnly = self.opt.useGABOnly || (self.opt.isPermission && !capabilities.has('invite_guests'));
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
                }, self.opt);
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
