/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/contacts/distrib/create-dist-view',
    ['io.ox/core/extensions',
     'gettext!io.ox/contacts/contacts',
     'io.ox/contacts/util',
     'io.ox/contacts/api',
     'io.ox/core/tk/view',
     'io.ox/core/tk/model',
     'io.ox/core/tk/autocomplete',
     'io.ox/core/config'
    ], function (ext, gt, util, api, View, Model, autocomplete, config) {

    'use strict';


    var saveButton = function (options) {
        var button = $('<a>').attr({
            'data-action': 'save',
            'href': '#'
        }).addClass('button default-action saveButton').text('Save').on('click', function () {
            options.saveForm();
        });

        return button;
    };

    function drawListetItemClear(node, name, selectedMail, options) {
        var frame = $('<div>').addClass('listet-item').attr({
                'data-mail': selectedMail
            }),
            img = $('<div>').addClass('contact-image'),
            button = $('<div>').addClass('delete-button').on('click', {
                options: options,
                mail: selectedMail,
                frame: frame
            }, removeContact);

        node.append(frame);
        frame.append(button);
        frame.append(img)
        .append(
            $('<div>').addClass('person-link ellipsis')
            .text(name + '\u00A0'),
            $('<div>').addClass('person-selected-mail')
            .text(selectedMail)
        );
    }

    function insertNewContact(options, name, mail) {
        drawListetItemClear(displayBox, name, mail, options);
        options.model._data.distribution_list.push({
            display_name: name,
            mail: mail
        });
    }

    var addButton = function (options) {
        var button = $('<a>').attr({
            'data-action': 'add',
            'href': '#'
        }).addClass('button  addButton').text(gt('Add new member')).on('click', function (e) {
            var data = $('[data-holder="data-holder"]').data(),
                mailValue = $('input#mail').val(),
                nameValue = $('input#name').val();
            if (data.contact) {
                copyContact(options, data.contact, data.email);
            } else {
                insertNewContact(options, nameValue, mailValue);
            }
            // reset the fields
            $('[data-holder="data-holder"]').removeData();
            $('input#mail').val('');
            $('input#name').val('');
        });

        return button;
    };

    var displayBox = $('<div>').addClass('item-list').append(
            $('<div>').addClass('item-list-header').append(
                $('<div>').addClass('name col').text('name'), $('<div>').addClass('mail col').text('mail')
            )
        );

    function drawAutoCompleteItem(node, data) {
        var img = $('<div>').addClass('contact-image'),
            url = util.getImage(data.contact);

        if (Modernizr.backgroundsize) {
            img.css('backgroundImage', 'url(' + url + ')');
        } else {
            img.append(
                $('<img>', { src: url, alt: '' }).css({ width: '100%', height: '100%' })
            );
        }

        node.addClass('io-ox-contact-create-dist')
        .append(img)
        .append(
            $('<div>').addClass('person-link ellipsis')
            .text(data.display_name + '\u00A0')
        )
        .append($('<div>').addClass('ellipsis').text(data.email));
    }

    function removeContact(e) {
        _.each(e.data.options.model._data.distribution_list, function (val, key) {
            if (val.mail === e.data.mail) {
                e.data.options.model._data.distribution_list.splice(key, 1);
            }
        });
        e.data.frame.remove();
    }

    function drawListetItem(node, data, selectedMail, options) {
        var frame = $('<div>').addClass('listet-item' + ' ' + _.uniqueId()).attr({
                'data-mail': selectedMail
            }),
            img = $('<div>').addClass('contact-image'),
            url = util.getImage(data),
            button = $('<div>').addClass('delete-button').on('click', {options: options, mail: selectedMail, frame: frame}, removeContact);

        if (Modernizr.backgroundsize) {
            img.css('backgroundImage', 'url(' + url + ')');
        } else {
            img.append(
                $('<img>', { src: url, alt: '' }).css({ width: '100%', height: '100%' })
            );
        }
        node.append(frame);
        frame.append(button);
        frame.append(img)
        .append(
            $('<div>').addClass('person-link ellipsis')
            .text(data.display_name + '\u00A0'),
            $('<div>').addClass('person-selected-mail')
            .text((selectedMail))
        );
    }

    function calcMailField(contact, selectedMail) { // TODO: needs ab better concept
        var field;

        if (selectedMail === contact.email1) {
            field = 1;
        }
        if (selectedMail === contact.email2) {
            field = 2;
        }
        if (selectedMail === contact.email3) {
            field = 3;
        }
        return field;
    }

    function copyContact(options, contact, selectedMail) {
        drawListetItem(displayBox, contact, selectedMail, options);
        var mailNr = (calcMailField(contact, selectedMail));
        if (!options.model._data.distribution_list) {
            options.model._data.distribution_list = [];
        }
        options.model._data.distribution_list.push({
            id: contact.id,
            display_name: contact.display_name,
            mail: selectedMail,
            mail_field: mailNr
        });
    }

    function createField(options, id, related) {

        return $('<div>')
        .addClass('fieldset ' + id)
        .append(
            $('<label>', { 'for' : 'input_field_' + id }).text(gt(id)),
            $('<input>', {
                type: 'text',
                tabindex: '2',
                autocapitalize: 'off',
                autocomplete: 'off',
                autocorrect: 'off',
                id: id
            })
                .attr('data-type', id) // not name=id!
                .addClass('discreet')
                .autocomplete({
                    source: function (query) {
                        return api.autocomplete(query);
                    },
                    stringify: function (data) {
                        if (related === 'input#mail') {
                            return data.display_name;
                        } else {
                            return data.email;
                        }

                    },

                    // for a second (related) Field
                    stringifyrelated: function (data) {
                        if (related === 'input#mail') {
                            return data.email;
                        } else {
                            return data.display_name;
                        }

                    },
                    draw: function (data) {
                        drawAutoCompleteItem.call(null, this, data);
                    },
                    // to specify the related Field
                    related: function () {
                        var field = $(related);
                        return field;
                    },
                    dataHolder: function () {
                        var holder = $('[data-holder="data-holder"]');
                        return holder;
                    }
                })
        );
    }

    var growl = $('<div>', {id: 'myGrowl'}).addClass('jGrowl').css({position: 'absolute', right: '0', top: '0'});

    var ContactCreateView = View.extend({

        draw: function (app) {
            var self = this,
                model = self.getModel(),
                myId = _.uniqueId('c'),
                editSection = self.createSection(),
                addSection = self.createSection(),
                sectiongroup = self.createSectionGroup(),
                dataHolder,
                fId = config.get("folder.contacts");

            if (_.isArray(self.model._data.distribution_list)) {
                _.each(self.model._data.distribution_list, function (key) {
                    if (key.id) {
                        api.get({id: key.id, folder: fId}).done(function (obj) {
                            drawListetItem(displayBox, obj, key.mail, self);
                        });
                    } else {
                        drawListetItemClear(displayBox, key.display_name, key.mail, self);
                    }
                });
            }

            self.node.append(sectiongroup.append(saveButton(self)));
            sectiongroup.addClass('header')
            .append(self.createLabel({
                id: myId,
                text: gt('List name')
            }), self.createTextField({property: 'display_name', id: myId, classes: 'nice-input'}));

            editSection.append(
                self.createSectionTitle({text: gt('Members')}),
                displayBox
                );
            self.node.append(editSection);

            dataHolder = $('<div>').attr('data-holder', 'data-holder')
            .append(createField(self, 'name', 'input#mail'), createField(self, 'mail', 'input#name'));


            addSection.addClass('last').append(
                //self.createSectionTitle({text: gt('add new Member')}),
                dataHolder,
                addButton(self)
            );

            self.node.append(addSection);

            this.getModel().on('error:invalid', function (evt, err) {
                console.log('error validation');
                console.log(arguments);
                $('#myGrowl').jGrowl(err.message, {header: 'Make an educated guess!', sticky: false});
            });

            return self;
        },

        drawButtons: function () {
            var self = this,
                button = saveButton(self);
            return button;
        },

        saveForm: function () {
            console.log('saveForm -> save', this);
            this.getModel().save();
        }
    });

    return ContactCreateView;
});
