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

define('io.ox/chat/views/addMember', [
    'io.ox/backbone/views/disposable',
    'io.ox/core/tk/typeahead',
    'io.ox/participants/model',
    'io.ox/chat/data',
    'io.ox/chat/api',
    'io.ox/chat/util',
    'gettext!io.ox/chat',
    'settings!io.ox/core',
    'io.ox/participants/add'
], function (Disposable, Typeahead, pModel, data, api, util, gt, settings) {

    'use strict';

    return Disposable.extend({

        tagName: 'fieldset',

        className: 'add-members',

        render: function () {

            var self = this,
                typeahead = new Typeahead({
                    apiOptions: {
                        contacts: true,
                        users: true,
                        groups: false,
                        distributionlists: false,
                        resources: false
                    },
                    extPoint: 'io.ox/participants/add',
                    harmonize: function (result) {
                        result = _(result).map(function (m) {
                            return new pModel.Participant(m);
                        });
                        result = _(result).filter(function (model) {
                            var email = model.get(model.get('field') || 'email1');
                            if (api.isMyself(email)) return false;
                            if (self.collection.get(email)) return false;
                            return true;
                        });

                        // wait for participant models to be fully loaded (autocomplete suggestions might have missing values otherwise)
                        return $.when.apply($, _(result).pluck('loading')).then(function () { return result; });
                    },
                    click: function (e, model) {
                        self.addParticipant(model);
                    }
                });

            this.$el.empty().append(
                $('<legend>').text(gt('Add members')),
                $('<div>').append(
                    typeahead.$el,
                    $('<a href="#" role="button" class="open-addressbook-popup">')
                        .append(util.svg({ icon: 'fa-address-book' }).attr('title', gt('Select contacts')))
                        .attr('aria-label', gt('Select contacts'))
                        .on('click', this.openAddressBookPicker.bind(this))
                )
            );

            typeahead.render();

            return this;
        },

        openAddressBookPicker: function (e) {
            var self = this,
                picker = settings.get('features/enterprisePicker/enabled', false) ? 'io.ox/contacts/enterprisepicker/dialog' : 'io.ox/contacts/addressbook/popup';
            e.preventDefault();

            require([picker], function (popup) {
                popup.open(function (result) {
                    result.forEach(function (data) {
                        self.addParticipant(new Backbone.Model(data));
                    });
                });
            });
        },

        addParticipant: function (model) {
            var email = model.get(model.get('field')) || model.get('email');
            // exists?
            var user = data.users.get(email);
            if (!user) {
                user = data.users.addFromAddressbook(email, model.toJSON());
                data.users.add(user);
            }
            this.collection.add(user);
        }
    });
});
