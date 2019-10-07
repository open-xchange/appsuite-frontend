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
    'io.ox/participants/add'
], function (Disposable, Typeahead, pModel, data) {

    'use strict';

    return Disposable.extend({

        tagName: 'fieldset',

        className: 'add-members',

        render: function () {

            var self = this,
                typeahead = new Typeahead({
                    apiOptions: {
                        contacts: false,
                        users: true,
                        groups: false,
                        distributionlists: false,
                        resources: false
                    },
                    extPoint: 'io.ox/participants/add',
                    harmonize: function (data) {
                        data = _(data).map(function (m) {
                            return new pModel.Participant(m);
                        });

                        return _(data).filter(function (model) {
                            if (model.get('id') === ox.user_id) return false;
                            if (self.collection.get(model.get('id'))) return false;
                            return true;
                        }).reverse();
                    },
                    click: function (e, model) {
                        self.addParticipant(model);
                    }
                });

            this.$el.empty().append(
                $('<legend>').text('Add participant'),
                $('<div>').append(
                    typeahead.$el,
                    $('<a href="#" role="button" class="open-addressbook-popup">').append(
                        $('<i class="fa fa-address-book" aria-hidden="true">').attr('title', 'Select contacts')
                    ).attr('aria-label', 'Select contacts')
                    .on('click', this.openAddressBookPicker)
                )
            );

            typeahead.render();
            typeahead.$el.data('ttTypeahead').dropdown.$menu.css({
                top: '',
                bottom: '100%'
            });

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
            var email = model.get(model.get('field'));
            this.collection.add(data.users.getByMail(email));
        }

    });
});
