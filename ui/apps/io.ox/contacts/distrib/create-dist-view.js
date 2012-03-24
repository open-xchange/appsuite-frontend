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
            'href': '#',
            'tabindex': '5'
        }).addClass('btn btn-primary').on('click', function () {
            options.saveForm();
        });
        if (options.model._data.mark_as_distributionlist) {
            button.text(gt('Save'));
        } else {
            button.text(gt('Create list'));
        }
        return button;
    };

    var drawAlert = function (mail) {
        $('.alert').remove();
        var alert = $('<div>').addClass('alert alert-block fade in').append(
                $('<a>').attr({
                    'href': '#',
                    'class': 'close',
                    'data-dismiss': 'alert'
                }).append($('<div>').addClass('delete-button')), $('<p>').text(gt('The email address ' + mail + ' is already in the list'))
            );
        return alert;
    };

    var fnClickPerson = function (e) {
        ext.point('io.ox/core/person:action').each(function (ext) {
            _.call(ext.action, e.data, e);
        });
    };

    function drawListetItemClear(node, name, selectedMail, options) {
        var frame = $('<div>').addClass('listet-item').attr({
                'data-mail': selectedMail
            }),
            img = $('<div>').addClass('contact-image'),
            url = util.getImage({}),
            button = $('<div>').addClass('delete-button').on('click', {
                options: options,
                mail: selectedMail,
                frame: frame
            }, removeContact);
        if (name === undefined) {
            name = '';
        }

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
            .append($('<a>', {'href': '#'}).on('click', {display_name: name, email1: selectedMail}, fnClickPerson).text(name + '\u00A0')),
            //.text(name + '\u00A0').on('click', {display_name: name, email1: selectedMail}, fnClickPerson),
            $('<div>').addClass('person-selected-mail')
            .text(selectedMail)
        );
    }

    function drawEmptyItem(node) {
        var frame = $('<div>').addClass('listet-item backstripes').attr({
            'data-mail': 'empty'
        });
        frame.text(gt('This list has no entries'));
        node.append(frame);
    }

    function insertNewContact(options, name, mail) {
        drawListetItemClear(options.displayBox, name, mail, options);

        if (!options.model._data.distribution_list) {
            options.model._data.distribution_list = [];
        }

        if ($('[data-mail="' + mail + '"]')[1]) {
            drawAlert(mail).appendTo($('.editsection'));
        }

        options.model._data.distribution_list.push({
            display_name: name,
            mail: mail
        });

        if (!_.isEmpty(options.model._data.distribution_list)) {
            options.displayBox.find('[data-mail="empty"]').remove();
        }
    }

    var addButton = function (options) {
        var button = $('<a>').attr({
            'data-action': 'add',
            'href': '#',
            'tabindex': '4'
        })
        .addClass('btn btn-inverse')
        .text('+')
        .on('click', function (e) { //TODO some css related issues with color
            var data = $('[data-holder="data-holder"]').data(),
                mailValue = $('input#mail').val(),
                nameValue = $('input#name').val();
            if (data.contact) {
                copyContact(options, data.contact, data.email);
            } else {
                if (mailValue !== '') {
                    insertNewContact(options, nameValue, mailValue);
                }
            }
            // reset the fields
            $('[data-holder="data-holder"]').removeData();
            $('input#mail').val('');
            $('input#name').val('');
        });

        return button;
    };

    function createDisplayBox() {
        return $('<div>').attr('id', _.uniqueId('box_')).addClass('item-list');
    }

    function drawAutoCompleteItem(node, data) {

        var img = $('<div>').addClass('create-distributionlist-contact-image'),
            url = util.getImage(data.contact);

        if (Modernizr.backgroundsize) {
            img.css('backgroundImage', 'url(' + url + ')');
        } else {
            img.append(
                $('<img>', { src: url, alt: '' }).css({ width: '100%', height: '100%' })
            );
        }

        node
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
            if (_.isEmpty(e.data.options.model._data.distribution_list)) {
                e.data.options.displayBox.append(drawEmptyItem(e.data.options.displayBox));
            }
        });
        e.data.frame.remove();
    }

    function drawListetItem(node, data, selectedMail, options) {
        var frame = $('<div>').addClass('listet-item').attr({
                'data-mail': selectedMail
            }),
            img = $('<div>').addClass('contact-image'),
            url = util.getImage(data),
            button = $('<div>').addClass('delete-button').on('click', {
                options: options,
                mail: selectedMail,
                frame: frame
            }, removeContact);

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
            .append($('<a>', {'href': '#'}).on('click', {display_name: data.display_name, email1: data.email1, id: data.id}, fnClickPerson).text(data.display_name + '\u00A0')),
            //.text(data.display_name + '\u00A0').on('click', {display_name: data.display_name, email1: data.email1, id: data.id}, fnClickPerson),
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
        drawListetItem(options.displayBox, contact, selectedMail, options);
        var mailNr = (calcMailField(contact, selectedMail));
        if (!options.model._data.distribution_list) {
            options.model._data.distribution_list = [];
        }
        if ($('[data-mail="' + selectedMail + '"]')[1]) {
            drawAlert(selectedMail).appendTo($('.editsection'));
        }

        options.model._data.distribution_list.push({
            id: contact.id,
            display_name: contact.display_name,
            mail: selectedMail,
            mail_field: mailNr
        });
        if (!_.isEmpty(options.model._data.distribution_list)) {
            options.displayBox.find('[data-mail="empty"]').remove();
        }
    }

    function createField(options, id, related, label, tab) {

        return $('<div>')
        .addClass('fieldset ' + id)
        .append(
            $('<label>', { 'for' : 'input_field_' + id }).text(gt(label)),
            $('<input>', {
                type: 'text',
                tabindex: tab,
                autocapitalize: 'off',
                autocomplete: 'off',
                autocorrect: 'off',
                id: id
            })
                .attr('data-type', id) // not name=id!
                .addClass('discreet input-large')
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
                .on('keydown', function (e) {
                    if (e.which === 13) {
                        $('[data-action="add"]').trigger('click');
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
                fId = config.get("folder.contacts"),
                listOfMembers = [];

            self.displayBox = createDisplayBox();

            if (_.isArray(self.model._data.distribution_list)) {
                var count = self.model._data.distribution_list.length;
                _.each(self.model._data.distribution_list, function (val) {
                    if (val.id) {
                        api.get({id: val.id, folder: fId}).done(function (obj) {
                            listOfMembers.push({
                                display_name: obj.display_name,
                                obj: obj,
                                mail: val.mail
                            });
                            if (listOfMembers.length === count) {
                                listOfMembers.sort(util.nameSort);
                                _.each(listOfMembers, function (val) {
                                    if (val.obj) {
                                        drawListetItem(self.displayBox, val.obj, val.mail, self);
                                    } else {
                                        drawListetItemClear(self.displayBox, val.display_name, val.mail, self);
                                    }
                                });
                            }
                        });
                    } else {
                        listOfMembers.push({
                            display_name: val.display_name,
                            mail: val.mail
                        });
                    }
                });
            }

            self.node.append(sectiongroup.append());
            sectiongroup.addClass('header')
            .append(self.createLabel({
                id: myId,
                text: gt('List name')
            }), self.createTextField({property: 'display_name', id: myId, classes: 'input-large'})
            .find('input').attr('tabindex', '1'), saveButton(self));
            editSection.addClass('editsection').append(

                self.createSectionTitle({text: gt('Members')}),
                self.displayBox
                );
            if (_.isEmpty(self.model._data.distribution_list)) {
                drawEmptyItem(self.displayBox);
            }
            self.node.append(editSection);

            dataHolder = $('<div>').attr('data-holder', 'data-holder')
            .append(createField(self, 'name', 'input#mail', 'Name', '2'), createField(self, 'mail', 'input#name', 'E-mail address', '3'));


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
