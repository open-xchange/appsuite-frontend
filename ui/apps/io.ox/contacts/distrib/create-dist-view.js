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

    var saveButton = function (model) {
        return $('<a>', {
                'data-action': 'save',
                href: '#',
                tabindex: '5'
            })
            .addClass('btn btn-primary')
            .on('click', { model: model }, function (e) {
                e.data.model.save();
            })
            .text(
                model.get('mark_as_distributionlist') ? gt('Save') : gt('Create list')
            );
    };

    var drawAlert = function (mail) {
        $('.alert').remove();
        return $('<div>')
            .addClass('alert alert-block fade in')
            .append(
                $('<a>').attr({ href: '#', 'data-dismiss': 'alert' })
                .addClass('close')
                .html('&times;'),
                $('<p>').text(
                    gt('The email address ' + mail + ' is already in the list')
                )
            );
    };

    var fnClickPerson = function (e) {
        ext.point('io.ox/core/person:action').each(function (ext) {
            _.call(ext.action, e.data, e);
        });
    };

    function drawEmptyItem(node) {
        node.append(
            $('<div>').addClass('listet-item backstripes')
            .attr({ 'data-mail': 'empty' })
            .text(gt('This list has no members yet'))
        );
    }

    function insertNewContact(options, name, mail) {
        drawListetItem({
            node: options.displayBox,
            name: name,
            selectedMail: mail,
            options: options
        });

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
        .on('click', function (e) {
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

        node.append(
            img,
            $('<div>').addClass('person-link ellipsis').text(data.display_name),
            $('<div>').addClass('ellipsis').text(data.email)
        );
    }

    function removeContact(e) {
        e.preventDefault();
        var o = e.data.options, model = o.model;
        _.each(model._data.distribution_list, function (val, key) {
            if (val.mail === e.data.mail) {
                model._data.distribution_list.splice(key, 1);
            }
            if (_.isEmpty(model._data.distribution_list)) {
                o.displayBox.append(drawEmptyItem(o.displayBox));
            }
        });
        $(this).parent().remove();
    }

    function drawListetItem(o) {
        o.node.append(
            $('<div>').addClass('listet-item').attr({ 'data-mail': o.selectedMail })
            .append(
                // button
                $('<a>', { href: '#' }).addClass('close').html('&times;')
                    .on('click', { options: o.options, mail: o.selectedMail }, removeContact),
                // image
                api.getPicture(o.selectedMail).addClass('contact-image'),
                // name & email
                $('<div>').addClass('person-link ellipsis')
                .append(
                    $('<a>', {'href': '#'})
                    .on('click', { id: o.id, email1: o.selectedMail }, fnClickPerson).text(o.name)
                ),
                $('<div>').addClass('person-selected-mail').text(o.selectedMail)
            )
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
        drawListetItem({
            node: options.displayBox,
            id: contact.id,
            name: contact.display_name,
            selectedMail: selectedMail,
            options: options
        });
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
                listOfMembers;
            self.displayBox = createDisplayBox();

            if (_.isArray(self.model._data.distribution_list)) {
                listOfMembers = self.model._data.distribution_list;
                _.each(listOfMembers, function (val) {
                    drawListetItem({
                        node: self.displayBox,
                        id: val.id,
                        name: val.display_name,
                        selectedMail: val.mail,
                        options: self
                    });
                });
            }

            self.node.append(sectiongroup);

            sectiongroup.addClass('header')
            .append(
                self.createLabel({
                    id: myId,
                    text: gt('List name')
                }),
                self.createTextField({ property: 'display_name', id: myId, classes: 'input-large' })
                    .find('input').attr('tabindex', '1'),
                saveButton(self.model)
            );

            editSection.addClass('editsection').append(
                self.createSectionTitle({text: gt('Members')}),
                self.displayBox
            );

            if (_.isEmpty(self.model._data.distribution_list)) {
                drawEmptyItem(self.displayBox);
            }
            self.node.append(editSection);

            dataHolder = $('<div>').attr('data-holder', 'data-holder')
                .append(
                    createField(self, 'name', 'input#mail', 'Name', '2'),
                    createField(self, 'mail', 'input#name', 'E-mail address', '3')
                );

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
        }
    });

    return ContactCreateView;
});
