/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/chat/views/addMember', [
    'io.ox/backbone/views/disposable',
    'io.ox/core/tk/typeahead',
    'io.ox/participants/model',
    'io.ox/chat/data',
    'gettext!io.ox/chat',
    'io.ox/participants/add'
], function (Disposable, Typeahead, pModel, data, gt) {

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
                        return _(result).filter(function (model) {
                            var email = model.get(model.get('field') || 'email1');
                            if (email === data.user.email) return false;
                            if (self.collection.get(email)) return false;
                            return true;
                        });
                    },
                    click: function (e, model) {
                        self.addParticipant(model);
                    }
                });

            this.$el.empty().append(
                $('<legend>').text(gt('Add members')),
                $('<div>').append(
                    typeahead.$el,
                    $('<a href="#" role="button" class="open-addressbook-popup">').append(
                        $('<i class="fa fa-address-book" aria-hidden="true">').attr('title', gt('Select contacts'))
                    ).attr('aria-label', gt('Select contacts'))
                    .on('click', this.openAddressBookPicker.bind(this))
                )
            );

            typeahead.render();

            return this;
        },

        openAddressBookPicker: function (e) {
            var self = this;
            e.preventDefault();
            require(['io.ox/contacts/addressbook/popup'], function (popup) {
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
