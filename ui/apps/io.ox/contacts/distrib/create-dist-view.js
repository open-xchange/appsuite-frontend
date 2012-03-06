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
     'io.ox/core/tk/autocomplete'
    ], function (ext, gt, util, api, View, Model, autocomplete) {

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
        var frame = $('<div>').addClass('listet-item' + ' ' + _.uniqueId()).attr({
                'data-mail': selectedMail
            }),
            img = $('<div>').addClass('contact-image'),

            button = $('<div>').addClass('delete-button').on('click', {options: options, mail: selectedMail, frame: frame}, removeContact);

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
        }).addClass('button  addButton').text('Add').on('click', function (e) {
            var data = $('[data-holder="data-holder"]').data(),
                mailValue = $('input#mail').val(),
                nameValue = $('input#name').val();
            if (data.contact) {
                copyContact(options, data.contact, data.email);
            } else {
                insertNewContact(options, nameValue, mailValue);
            }
            $('input#mail').val('');
            $('[data-holder="data-holder"]').removeData();
            $('input#name').val('');
        });

        return button;
    };

    var displayBox = $('<div>').addClass('maillist').append(
            $('<div>').addClass('maillist-header').append(
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



    function calcMailField(contact, selectedMail) { // TODO: needs abb better concept
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
        console.log(options);
    }

    function createInputFieldName(options, id) {

        return $('<div>')
        .addClass('fieldset name')
        .append(
            $('<label>', { 'for' : 'writer_field_' + id }).text('name'),
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
                        return data.display_name;  // '"' + data.display_name + '" <' + data.email + '>' :
//                        return '';
//                        console.log('not needed');
                    },

                    // for a second (related) Field
                    stringifyrelated: function (data) {
                        return data.email;  // '"' + data.display_name + '" <' + data.email + '>' :
//                        return '';
//                        console.log('not needed');
                    },
                    draw: function (data) {
                        drawAutoCompleteItem.call(null, this, data);
                    },
                    click: function (e) {
                       // copyRecipients.call(null, id, $(this));
                       // copyContact(options, e.data.contact, e.data.email);
//                        console.log(e);
                    },
                    blur: function (e) {
                        // copy valid recipients
//                        copyRecipients.call(null, id, $(this));
                        console.log('dead end :-)');
                    },
                    // to specify the related Field
                    related: function () {
                        var test = $('input#mail');
                        return test;
                    },
                    dataHolder: function () {
                        var holder = $('[data-holder="data-holder"]');
                        return holder;
                    }
                })
                .on('keyup', function (e) {
                    if (e.which === 13) {
//                        copyRecipients.call(null, id, $(this));
                        console.log('dead end :-)');
                    } else {
                        // look for special prefixes
                        var val = $(this).val();
                        if ((/^to:?\s/i).test(val)) {
                            $(this).val('');
//                            showSection('to');
                            console.log('dead end :-)');
                        } else if ((/^cc:?\s/i).test(val)) {
                            $(this).val('');
//                            showSection('cc');
                            console.log('dead end :-)');
                        } else if ((/^bcc:?\s/i).test(val)) {
                            $(this).val('');
//                            showSection('bcc');
                            console.log('dead end :-)');
                        }
                    }
                })

        );
    }
    function createField(options, id) {

        return $('<div>')
        .addClass('fieldset mail')
        .append(
            $('<label>', { 'for' : 'writer_field_' + id }).text('mail'),
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
                        return data.email;// '"' + data.display_name + '" <' + data.email + '>' :
//                        return '';
//                        console.log('not needed');
                    },

                    // for a second (related) Field
                    stringifyrelated: function (data) {
                        return data.display_name;  // '"' + data.display_name + '" <' + data.email + '>' :
//                        return '';
//                        console.log('not needed');
                    },
                    draw: function (data) {
                        drawAutoCompleteItem.call(null, this, data);
                    },
                    click: function (e) {
                       // copyRecipients.call(null, id, $(this));
                        //copyContact(options, e.data.contact, e.data.email);
//                        console.log(e);
                    },
                    blur: function (e) {
                        // copy valid recipients
//                        copyRecipients.call(null, id, $(this));
                        console.log('dead end :-)');
                    },
                    // to specify the related Field
                    related: function () {
                        var test = $('input#name');
                        return test;
                    },
                    dataHolder: function () {
                        var holder = $('[data-holder="data-holder"]');
                        return holder;
                    }
                })
                .on('keyup', function (e) {
                    if (e.which === 13) {
//                        copyRecipients.call(null, id, $(this));
                        console.log('dead end :-)');
                    } else {
                        // look for special prefixes
                        var val = $(this).val();
                        if ((/^to:?\s/i).test(val)) {
                            $(this).val('');
//                            showSection('to');
                            console.log('dead end :-)');
                        } else if ((/^cc:?\s/i).test(val)) {
                            $(this).val('');
//                            showSection('cc');
                            console.log('dead end :-)');
                        } else if ((/^bcc:?\s/i).test(val)) {
                            $(this).val('');
//                            showSection('bcc');
                            console.log('dead end :-)');
                        }
                    }
                })

        );
    }


    var growl = $('<div>', {id: 'myGrowl'}).addClass('jGrowl').css({position: 'absolute', right: '0', top: '0'});

    var ContactCreateView = View.extend({

        draw: function (app) {
            var self = this,
                meta = ['display_name'];
            if (_.isArray(self.model._data.distribution_list)) {
                _.each(self.model._data.distribution_list, function (key) {
                    if (key.id) {
                        api.get({id: key.id, folder: '11179'}).done(function (obj) {
                            drawListetItem(displayBox, obj, key.mail, self);
                            console.log(displayBox);
                        });
                    } else {
                        drawListetItemClear(displayBox, key.display_name, key.mail, self);
                        console.log(displayBox);
                    }


                });
            }

            _.each(meta, function (field) {
                var myId = _.uniqueId('c'),
                sectiongroup = self.createSectionGroup(),
                model = self.getModel(),
                fieldtype = model.schema.getFieldType(field),
                createFunction;

                switch (fieldtype) {
                case "string":
                    createFunction = self.createTextField({property: field, id: myId, classes: 'nice-input'});
                    break;
                case "pastDate":
                    createFunction = self.createDateField({property: field, id: myId, classes: 'nice-input'});
                    break;
                default:
                    createFunction = self.createTextField({property: field, id: myId, classes: 'nice-input'});
                    break;
                }
                self.node.append(sectiongroup.append(saveButton(self)));
                sectiongroup.addClass('header')
                .append(self.createLabel({
                    id: myId,
                    text: gt(field)
                }), createFunction);



                var editSection = self.createSection();
                editSection.append(
                    self.createSectionTitle({text: gt('Members')}),
                    displayBox

                        );
                self.node.append(editSection);

                var dataHolder = $('<div>').attr('data-holder', 'data-holder')
                .append(createInputFieldName(self, 'name'), createField(self, 'mail'));

                var addSection = self.createSection();
                addSection.addClass('last').append(
                    self.createSectionTitle({text: gt('add new Member')}),
                    dataHolder,
                    addButton(self)
                );

                self.node.append(addSection);


            });

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
