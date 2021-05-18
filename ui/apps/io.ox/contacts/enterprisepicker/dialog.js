/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2021 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/contacts/enterprisepicker/dialog', [
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views/common',
    'io.ox/backbone/views/disposable',
    'io.ox/contacts/api',
    'io.ox/contacts/util',
    'gettext!io.ox/contacts',
    'less!io.ox/contacts/enterprisepicker/style'
], function (ModalDialog, Mini, DisposableView, api, util, gt) {

    'use strict';

    var mockData = {};

    var SelectedContactsView = DisposableView.extend({

        tagName: 'ul',
        className: 'selected-contacts-view list-unstyled',

        events: {
            'click button': 'removeContact'
        },

        initialize: function () {
            this.model.get('selectedContacts').on('add reset remove', this.render.bind(this));
        },

        dispose: function () {
            this.model.get('selectedContacts').off('add reset remove');
        },

        render: function () {
            this.$el.empty();
            var self = this,
                length = this.model.get('selectedContacts').length;

            this.$el.toggleClass('empty', length === 0);
            if (length === 0) return this;

            //#. %1$d is number of selected contacts
            this.$el.append($('<div>').text(gt.ngettext('%1$d contact selected', '%1$d contacts selected', length, length)));
            this.model.get('selectedContacts').each(function (contact) {
                self.$el.append(
                    $('<li>').append(
                        $('<div class="name">').text(util.getFullName(contact.attributes, false)),
                        $('<button class="btn">').attr('data-id', contact.get('id')).append($.icon('fa-times', gt('Remove contact from selection')))
                    )
                );
            });

            return this;
        },

        removeContact: function (e) {
            e.stopPropagation();
            this.model.get('selectedContacts').remove(e.currentTarget.getAttribute('data-id'));
        }
    });

    var ContactListView = DisposableView.extend({

        tagName: 'ul',
        className: 'contact-list-view list-unstyled',

        events: {
            'click li': 'updateSelection'
        },

        initialize: function (options) {
            this.options = options;
            this.model.get('contacts').on('add reset remove', this.render.bind(this));
            this.model.get('selectedContacts').on('add reset remove', this.updateCheckboxes.bind(this));
            this.model.on('change:searchQuery', this.render.bind(this));
        },

        dispose: function () {
            this.model.get('contacts').off('add reset remove');
            this.model.get('selectedContacts').off('add reset remove');
            this.model.off('change:searchQuery');
        },

        renderContact: function (contact) {
            var name = util.getFullName(contact.attributes, false),
                query = this.model.get('searchQuery').trim().toLowerCase(),
                contactPicture;

            if (query !== '' && name.toLowerCase().indexOf(query) === -1) return;
            var node = $('<li>').attr('data-id', contact.get('id')).append(
                $('<input type="checkbox">').attr({ 'data-id': contact.get('id'), checked: !!this.model.get('selectedContacts').get(contact.get('id')) }),
                contactPicture = $('<i class="contact-picture" aria-hidden="true">')
                    .one('appear', { url: contact.get('image1_url') ? util.getImage(contact.attributes) : api.getFallbackImage() }, function (e) {
                        $(this).css('background-image', 'url(' + e.data.url + ')');
                    }),
                $('<div class="contact-container">').append(
                    $('<div class="name" aria-hidden="true">').text(name),
                    $('<div class="department" aria-hidden="true">').text(contact.get('department'))
                ),
                $('<div class="contact-container">').append(
                    $('<div class="telephone" aria-hidden="true">').text(
                        // try to find a phone number, there are still more phone number fields. Not sure if we need all
                        contact.get('telephone_business1') ||
                        contact.get('telephone_business2') ||
                        contact.get('telephone_company') ||
                        contact.get('cellular_telephone1') ||
                        contact.get('cellular_telephone2') ||
                        contact.get('telephone_home1') ||
                        contact.get('telephone_home2') ||
                        contact.get('telephone_other')),
                    $('<div class="position" aria-hidden="true">').text(contact.get('position'))
                ),
                $('<div class="contact-container">').append(
                    $('<div class="mail" aria-hidden="true">').text(util.getMail(contact.attributes)),
                    $('<div class="room" aria-hidden="true">').text(contact.get('room_number'))
                )
            );
            this.$el.append(node);
            contactPicture.lazyload({ container: this.options.modalBody });
        },

        render: function () {
            this.$el.empty();
            var query = this.model.get('searchQuery').trim(),
                isLastSearched = this.model.get('selectedList') === 'all' && query === '',
                contacts = isLastSearched ? this.model.get('lastContacts') : this.model.get('contacts');

            contacts.each(this.renderContact.bind(this));

            if (isLastSearched && this.$el.children().length > 0) {
                //#. This is followed by a list of contacts from the address book
                this.$el.prepend($('<div class="list-label">').text(gt('Last searched for')));
            }

            if (query !== '' && this.$el.children().length === 0) {
                this.$el.prepend($('<div class="list-label">').text(gt('No contacts found.')));
            }

            return this;
        },

        updateSelection: function (e) {
            e.stopPropagation();
            var target = e.currentTarget,
                id = target.getAttribute('data-id'),
                model = (this.model.get('contacts').length === 0 ? this.model.get('lastContacts') : this.model.get('contacts')).get(id),
                isSelected = !!this.model.get('selectedContacts').get(id);

            if (isSelected) {
                this.model.get('selectedContacts').remove(model);
            } else {
                this.model.get('selectedContacts').add(model);
            }
        },

        updateCheckboxes: function () {
            var checkboxes = this.$el.find('input'),
                ids = this.model.get('selectedContacts').pluck('id');

            checkboxes.each(function (index, checkbox) {
                checkbox.checked = ids.indexOf(checkbox.getAttribute('data-id')) > -1;
            });
        }
    });

    var open = function (callback) {
        // use our gab to generate mock data for now
        return api.getAll({ columns: '20,1,101,500,501,502,505,519,520,521,522,524,542,543,547,548,549,551,552,553,555,556,557,569,602,606,607,616,617,5,2' }, false).then(function (data) {
            mockData = _(data).groupBy('department');
            var lists = _(_(mockData).keys().sort()).map(function (department) {
                // later on this is folder name and id, but since this is mock data...
                return { label: department, value: department };
            });

            mockData.all = data;
            lists.unshift({ label: gt('Choose address list'), value: 'all' });

            var model = new Backbone.Model({
                searchQuery: '',
                filterQuery: '',
                selectedList: 'all',
                selectedContacts: new Backbone.Collection(),
                contacts: new Backbone.Collection(mockData.all),
                lastContacts: new Backbone.Collection(_(data).sample(3)),
                addressLists: lists
            });

            model.on('change:selectedList', function (model, selectedList) {
                model.get('contacts').reset(mockData[selectedList] || []);
            });

            return new ModalDialog({
                point: 'io.ox/contacts/enterprisepicker-dialog',
                help: 'ox.appsuite.user.sect.email.send.enterpriserpicker.html',
                title: gt('Global address list')
            })
            .build(function () {
                this.$el.addClass('enterprise-picker');
                var listSelectBox = new Mini.SelectView({ name: 'selectedList', model: model, list: model.get('addressLists') }).render().$el;

                model.on('change:filterQuery', function () {
                    var query = model.get('filterQuery').trim().toLowerCase(),
                        options = listSelectBox.find('option');
                    if (!query) return options.show();

                    _(listSelectBox.find('option')).each(function (option) {
                        // never hide the placeholder option
                        if ($(option).val() === 'all') return;
                        $(option).toggle(option.text.toLowerCase().indexOf(query) !== -1);
                    });
                });

                this.$('.modal-header').append(
                    $('<div class="top-bar">').append(
                        $('<label>').text(gt('Search')).append(
                            $('<div class="input-group">').append(
                                new Mini.InputView({ name: 'searchQuery', model: model }).render().$el
                                        .attr('placeholder', gt('Search for name, department, position'))
                                        .on('keyup', _.debounce(function () {
                                            model.set('searchQuery', this.value);
                                        }, 300)),
                                $('<span class="input-group-addon">').append($.icon('fa-search', gt('Search for name, department, position')))
                            )
                        ),
                        $('<label>').text(gt('Filter')).append(
                            $('<div class="input-group">').append(
                                new Mini.InputView({ name: 'filterQuery', model: model }).render().$el
                                        .attr('placeholder', gt('Filter address lists'))
                                        .on('keyup', _.debounce(function () {
                                            model.set('filterQuery', this.value);
                                        }, 300)),
                                $('<span class="input-group-addon">').append($.icon('fa-filter', gt('Filter address lists')))
                            )
                        ),
                        $('<label>').text(gt('Address list')).append(
                            listSelectBox
                        )
                    )
                );
                this.$('.modal-body').append(new ContactListView({ model: model, modalBody: this.$('.modal-body') }).render().$el)
                    .after(new SelectedContactsView({ model: model }).render().$el);
            })
            .on({
                'select': function () {

                    var list = _(model.get('selectedContacts').toJSON()).chain()
                        .filter(function (item) {
                            item.mail_full_name = util.getMailFullName(item);
                            item.email = $.trim(item.email1 || item.email2 || item.email3).toLowerCase();
                            return item.email;
                        })
                        .map(function (item) {
                            var name = item.mail_full_name, mail = item.mail || item.email;
                            return {
                                array: [name || null, mail || null],
                                display_name: name,
                                id: item.id,
                                folder_id: item.folder_id,
                                email: mail,
                                user_id: item.user_id
                            };
                        }, this)
                        .uniq(function (item) { return item.email; })
                        .value();
                    if (_.isFunction(callback)) callback(list);
                },
                'close': function () {
                    model = null;
                    mockData = null;
                }
            })
            .addCancelButton()
            //#. Context: Add selected contacts; German "Auswählen", for example
            .addButton({ label: gt('Select'), action: 'select' })
            .open();
        });
    };

    // use same names as default addressbook picker, to make it easier to switch between the two
    return {
        open: open
    };

});
