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

define('io.ox/contacts/enterprisepicker/dialog', [
    'io.ox/backbone/views/modal',
    'io.ox/core/tk/dialogs',
    'io.ox/backbone/mini-views/common',
    'io.ox/backbone/views/disposable',
    'io.ox/contacts/api',
    'io.ox/core/folder/api',
    'io.ox/contacts/view-detail',
    'io.ox/core/extensions',
    'io.ox/contacts/util',
    'io.ox/core/yell',
    'io.ox/core/http',
    'settings!io.ox/contacts',
    'gettext!io.ox/contacts',
    'less!io.ox/contacts/enterprisepicker/style'
], function (ModalDialog, dialogs, Mini, DisposableView, api, folderApi, detailView, ext, util, yell, http, settings, gt) {

    'use strict';

    // for convenience, so we only have to change one line
    var columns = '20,1,101,500,501,502,505,519,520,521,522,524,542,543,547,548,549,551,552,553,555,556,557,569,592,602,606,607,616,617,5,2',
        // max shown results
        limit = settings.get('enterprisePicker/limit', 100);

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
                        $('<div class="name">').append(util.getFullName(contact.attributes, true)),
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
            'click li': 'updateSelection',
            'click .show-details': 'openDetailView'
        },

        initialize: function (options) {
            this.options = options;
            this.model.get('contacts').on('add reset remove', this.render.bind(this));
            this.model.get('selectedContacts').on('add reset remove', this.updateCheckboxes.bind(this));
        },

        dispose: function () {
            this.model.get('contacts').off('add reset remove');
            this.model.get('selectedContacts').off('add reset remove');
        },

        renderContact: function (contact) {
            var name = util.getFullName(contact.attributes, true),
                initials = util.getInitials(contact.attributes),
                initialsColor = util.getInitialsColor(initials),
                contactPicture;

            var node = $('<li>').attr('data-id', contact.get('id')).append(
                $('<div class="flex-container multi-item-container">').append(
                    this.options.selection ? $('<input type="checkbox">').attr({ 'data-id': contact.get('id'), checked: !!this.model.get('selectedContacts').get(contact.get('id')) }) : '',
                    (contact.get('image1_url') ? contactPicture = $('<i class="contact-picture" aria-hidden="true">')
                        .one('appear', { url: contact.get('image1_url') ? util.getImage(contact.attributes) : api.getFallbackImage() }, function (e) {
                            $(this).css('background-image', 'url(' + e.data.url + ')');
                        }) : $('<div class="contact-picture initials" aria-hidden="true">').text(initials).addClass(initialsColor)),
                    $('<div class="data-container">').append(
                        $('<div class="name" aria-hidden="true">').append(name),
                        $('<div class="department" aria-hidden="true">').text(contact.get('department'))
                    )
                ),
                $('<div class="flex-container data-container">').append(
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
                $('<div class="flex-container multi-item-container details-container">').append(
                    $('<div class="data-container">').append(
                        $('<div class="mail" aria-hidden="true">').text(util.getMail(contact.attributes)),
                        $('<div class="room" aria-hidden="true">').text(contact.get('room_number'))
                    ),
                    $('<button type="button" class="show-details btn btn-link">').attr('data-id', contact.get('id')).append($.icon('fa-info-circle', gt('Show contact details')))
                )
            );
            this.$el.append(node);
            if (!contactPicture) return;
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

            // todo we need some backend magic to see if a list is actually at or above the limit
            if (contacts.length && contacts.length >= limit) {
                this.$el.append($('<div class="alert alert-info list-label limit-warning">')
                    //#. %1$d is the limit of displayable contacts
                    .text(gt('You have reached the limit of %1$d contacts to display. Please enter a search term to narrow down your results.', limit)));
            }

            return this;
        },

        updateSelection: function (e) {
            if (!this.options.selection) return;

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

        openDetailView: function (e) {
            e.stopPropagation();
            var target = e.currentTarget,
                id = target.getAttribute('data-id'),
                model = (this.model.get('contacts').length === 0 ? this.model.get('lastContacts') : this.model.get('contacts')).get(id);
            new dialogs.SidePopup({ tabTrap: true, container: $('body'), arrow: false }).show(e, function (popup) {
                // picker has a z index of 1050
                popup.busy().closest('.io-ox-sidepopup').css('z-index', 2000);
                api.get({ id: model.get('id'), folder: model.get('folder_id') }).then(function (data) {
                    popup.idle().append(detailView.draw(new ext.Baton({ data: data })));
                }, this.close);
            });
        },

        updateCheckboxes: function () {
            var checkboxes = this.$el.find('input'),
                ids = this.model.get('selectedContacts').pluck('id');

            checkboxes.each(function (index, checkbox) {
                checkbox.checked = ids.indexOf(checkbox.getAttribute('data-id')) > -1;
            });
        }
    });

    var open = function (callback, options) {
        options = _.extend({ selection: true }, options);

        var model,
            dialog =  new ModalDialog({
                point: 'io.ox/contacts/enterprisepicker-dialog',
                help: 'ox.appsuite.user.sect.email.send.enterpriserpicker.html',
                title: gt('Global address list')
            })
                .build(function () {
                    this.$el.addClass('enterprise-picker');
                    this.$('.modal-content').busy();

                    var self = this,
                        defs = [],
                        lastSearchedContacts = settings.get('enterprisePicker/lastSearchedContacts', []);

                    defs.push(folderApi.flat({ module: 'contacts', all: true }));
                    _(lastSearchedContacts).each(function (contact) {
                        if (!contact || !contact.folder_id || !contact.id) return;
                        var def = $.Deferred();
                        // use get request so we can sort out broken or missing contacts better, always resolve. we don't want a missing contact to break the picker
                        api.get({ folder_id: contact.folder_id, id: contact.id }).always(def.resolve);
                        defs.push(def);
                    });

                    $.when.apply($, defs).then(function (folders) {

                        // flat request returns folders in sections, add them to a single array, leave out the hidden section
                        folders = _([].concat(folders.private, folders.shared, folders.public))
                            .compact()
                            // filter folders according to settings
                            .filter(function (folder) {
                                // only use folders that have the "used in picker" flag if not configured otherwise
                                if (!settings.get('enterprisePicker/useUsedInPickerFlag', true)) return true;

                                return folder['com.openexchange.contacts.extendedProperties'] &&
                                    folder['com.openexchange.contacts.extendedProperties'].usedInPicker &&
                                    folder['com.openexchange.contacts.extendedProperties'].usedInPicker.value === 'true';
                            });

                        var lists = _(folders).map(function (folder) {
                            return { label: folder.title, value: folder.id };
                        });
                        lists.unshift({ label: gt('Search all address lists'), value: 'all' });

                        var lastSearchedContacts = Array.prototype.slice.call(arguments, 1);

                        // filter broken stuff and save to settings
                        lastSearchedContacts = lastSearchedContacts.filter(function (contact) {
                            return !contact.error;
                        });
                        settings.set('enterprisePicker/lastSearchedContacts', _(lastSearchedContacts).map(function (contact) {
                            return { folder_id: contact.folder_id, id: contact.id };
                        })).save();
                        model = new Backbone.Model({
                            searchQuery: '',
                            filterQuery: '',
                            selectedList: 'all',
                            selectedContacts: new Backbone.Collection(),
                            contacts: new Backbone.Collection(),
                            lastContacts: new Backbone.Collection(lastSearchedContacts),
                            addressLists: lists
                        });

                        var updateContactsAfterSearch = function (contacts) {
                            self.$('.modal-content').idle();
                            model.get('contacts').reset(contacts);
                            // update the last searched contacts
                            var lastContacts = model.get('lastContacts');
                            // put at start of collection, since this search is newer
                            lastContacts.unshift(contacts);
                            // limit to 10 by default
                            lastContacts.reset(lastContacts.slice(0, settings.get('enterprisePicker/lastSearchedContactsLimit', 10)));
                            settings.set('enterprisePicker/lastSearchedContacts', _(lastContacts.models).map(function (contact) {
                                return { folder_id: contact.get('folder_id'), id: contact.get('id') };
                            })).save();
                        };

                        // show generic error message
                        var showError = function () {
                            // show error message
                            self.$('.modal-content').idle();
                            model.get('contacts').reset([]);
                            yell('error', gt('Could not load contacts'));
                        };

                        model.on('change:selectedList', function (model, selectedList) {
                            var isSearch = model.get('searchQuery') && model.get('searchQuery').length > 1;
                            if (selectedList === 'all' && !isSearch) return model.get('contacts').reset([]);
                            self.$('.modal-content').busy();

                            if (isSearch) {
                                var params = { right_hand_limit: limit, omitFolder: true, folders: selectedList, folderTypes: { includeUnsubscribed: true, pickerOnly: settings.get('enterprisePicker/useUsedInPickerFlag', true) }, columns: columns, names: 'on', phones: 'on', job: 'on' };
                                if (selectedList === 'all') delete params.folders;
                                api.advancedsearch(model.get('searchQuery'), params)
                                    .then(updateContactsAfterSearch, showError);
                                return;
                            }
                            // put the request together manually, api function has too much utility stuff
                            // use advanced search without query to get all contacts. (we don't use all request here because that has no limit parameter)
                            http.PUT({
                                module: 'addressbooks',
                                params: {
                                    action: 'advancedSearch',
                                    columns: columns,
                                    right_hand_limit: limit,
                                    sort: 607,
                                    order: 'desc'
                                },
                                data: {
                                    folders: [selectedList],
                                    folderTypes: { includeUnsubscribed: true, pickerOnly: settings.get('enterprisePicker/useUsedInPickerFlag', true) }
                                }
                            }).then(function (contacts) {
                                self.$('.modal-content').idle();
                                model.get('contacts').reset(contacts);
                            }, showError);
                        });

                        model.on('change:searchQuery', function (model, query) {
                            var selectedList = model.get('selectedList');
                            // no search query? show full selected list
                            if (query.length === 0) return model.trigger('change:selectedList', model, selectedList);
                            // less than minimal lentgh of characters? -> no change (MW request requires a minimum of io.ox/contacts//search/minimumQueryLength characters)
                            if (query.length < settings.get('search/minimumQueryLength', 2)) return;
                            self.$('.modal-content').busy();
                            var params = { right_hand_limit: limit, omitFolder: true, folders: selectedList, folderTypes: { includeUnsubscribed: true, pickerOnly: settings.get('enterprisePicker/useUsedInPickerFlag', true) }, columns: columns, names: 'on', phones: 'on', job: 'on' };
                            if (selectedList === 'all') delete params.folders;
                            api.advancedsearch(model.get('searchQuery'), params)
                                .then(updateContactsAfterSearch, showError);
                        });

                        self.$('.modal-content').idle();

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

                        self.$('.modal-header').append(
                            $('<div class="top-bar">').append(
                                $('<label>').text(gt('Search')).append(
                                    $('<div class="input-group">').append(
                                        new Mini.InputView({ name: 'searchQuery', model: model, autocomplete: false }).render().$el
                                            .attr('placeholder', gt('Search for name, department, position'))
                                            .on('keyup', _.debounce(function () {
                                                model.set('searchQuery', this.value);
                                            }, 300)),
                                        $('<span class="input-group-addon">').append($.icon('fa-search', gt('Search for name, department, position')))
                                    )
                                ),
                                $('<label>').text(gt('Filter')).append(
                                    $('<div class="input-group">').append(
                                        new Mini.InputView({ name: 'filterQuery', model: model, autocomplete: false }).render().$el
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
                        self.$('.modal-body').append(new ContactListView(_.extend({ model: model, modalBody: self.$('.modal-body') }, options)).render().$el)
                        .after(new SelectedContactsView({ model: model }).render().$el);

                        // triggers focus and fixes "compact" class
                        self.idle();
                    }, function (error) {
                        self.idle();
                        console.log(error);
                        self.$('.modal-body').append($('<div class="error">').text(gt('Could not load address book.')));
                        self.$('.modal-footer [data-action="select"]').attr('disabled', 'disabled');
                    });
                })
                .on({
                    // this function is called recursively if a distribution list is processed
                    'select':  function processContacts(distributionListMembers) {
                        if (!model) return [];

                        var list = _(distributionListMembers || model.get('selectedContacts').toJSON()).chain()
                            .filter(function (item) {
                                item.mail_full_name = util.getMailFullName(item);
                                item.email = $.trim(item.email1 || item.email2 || item.email3 || item.mail).toLowerCase();
                                item.mail_field = item.mail_field || ('email' + (util.calcMailField(item, item.email) || 1));
                                return item.email || item.mark_as_distributionlist;
                            })
                            .map(function (item) {
                                if (item.mark_as_distributionlist) return processContacts(item.distribution_list);
                                var name = item.mail_full_name, mail = item.mail || item.email,
                                    result = {
                                        array: [name || null, mail || null],
                                        display_name: name,
                                        id: item.id,
                                        folder_id: item.folder_id,
                                        email: mail,
                                        field: item.mail_field || 'email1',
                                        user_id: item.user_id || item.internal_userid
                                    };
                                return result;
                            }, this)
                            .flatten()
                            .uniq(function (item) { return item.email; })
                            .value();

                        if (distributionListMembers) return list;
                        if (_.isFunction(callback)) callback(list);
                    },
                    'close': function () {
                        model = null;
                    }
                });
        if (options.selection) {
            dialog.addCancelButton()
            //#. Context: Add selected contacts; German "Auswählen", for example
            .addButton({ label: gt('Select'), action: 'select' });
        } else {
            dialog.addButton({ label: gt('Close'), action: 'close' });
        }

        return dialog.open();
    };

    // use same names as default addressbook picker, to make it easier to switch between the two
    return {
        open: open
    };

});
