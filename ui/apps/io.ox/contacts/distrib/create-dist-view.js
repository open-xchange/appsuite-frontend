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

    var drawAlert = function (mail, displayBox) {
        displayBox.parent().find('.alert').remove();
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


    var addButton = function (options) {
        var button = $('<a>').attr({
            'data-action': 'add',
            'href': '#',
            'tabindex': '4'
        })
        .addClass('btn btn-inverse')
        .text('+')
        .on('click', function (e) {
            var data = options.node.find('[data-holder="data-holder"]').data(),
                mailValue = options.node.find('input#mail').val(),
                nameValue = options.node.find('input#name').val();
            if (data.contact) {
                copyContact(options, data.contact, data.email);
            } else {
                if (mailValue !== '') {
                    copyContact(options, nameValue, mailValue);
                }
            }
            // reset the fields
            options.node.find('[data-holder="data-holder"]').removeData();
            options.node.find('input#mail').val('');
            options.node.find('input#name').val('');
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
        var selectFrame, items,
        selectFrame = (e.data.frame).parent();
        e.preventDefault();
        var o = e.data.options, model = o.model;

        for (var i = 0; i < model._data.distribution_list.length;) {
            if ((model._data.distribution_list[i]).mail === e.data.mail && (model._data.distribution_list[i]).display_name === e.data.name) {
                model._data.distribution_list.splice(i, 1);
            } else {
                i += 1;
            }
        }

        items = selectFrame.find('[data-mail="' + e.data.name + '_' + e.data.mail + '"]');
        selectFrame.find(items).remove();

        if (!selectFrame.find('.listet-item')[0]) {
            o.displayBox.append(drawEmptyItem(o.displayBox));
        }
    }

    function drawListetItem(o) {
        var frame = $('<div>').addClass('listet-item').attr({
            'data-mail': o.name + '_' + o.selectedMail
        }),
        img = api.getPicture(o.selectedMail).addClass('contact-image'),
        button = $('<a>', { href: '#' }).addClass('close').html('&times;')
            .on('click', { options: o.options, mail: o.selectedMail, name: o.name, frame: frame }, removeContact);
        frame.append(button);
        frame.append(img)
        .append(
            $('<div>').addClass('person-link ellipsis')
            .append($('<a>', {'href': '#'})
            .on('click', {id: o.id, email1: o.selectedMail}, fnClickPerson).text(o.name)),
            $('<div>').addClass('person-selected-mail')
            .text((o.selectedMail))
        );
        o.node.append(frame);
    }

    function calcMailField(contact, selectedMail) {
        var field, mail;
        mail = [contact.email1, contact.email2, contact.email3];
        _.each(mail, function (val, key) {
            if (selectedMail === val) {
                field = key + 1;
            }
        });
        return field;
    }

    function copyContact(options, contact, selectedMail) {
        var dataMailId;

        if (!options.model._data.distribution_list) {
            options.model._data.distribution_list = [];
        }

        if (_.isString(contact)) {
            drawListetItem({
                node: options.displayBox,
                name: contact,
                selectedMail: selectedMail,
                options: options
            });
            dataMailId = '[data-mail="' + contact + '_' + selectedMail + '"]';
            options.model._data.distribution_list.push({
                display_name: contact,
                mail: selectedMail,
                mail_field: 0
            });

        } else {
            drawListetItem({
                node: options.displayBox,
                id: contact.id,
                name: contact.display_name,
                selectedMail: selectedMail,
                options: options
            });
            dataMailId = '[data-mail="' + contact.display_name + '_' + selectedMail + '"]';
            var mailNr = (calcMailField(contact, selectedMail));

            options.model._data.distribution_list.push({
                id: contact.id,
                display_name: contact.display_name,
                mail: selectedMail,
                mail_field: mailNr
            });
        }

        if (options.displayBox.find(dataMailId)[1]) {
            drawAlert(selectedMail, options.displayBox).appendTo(options.displayBox.parent().parent().find('.editsection'));
        }

        if (!_.isEmpty(options.model._data.distribution_list)) {
            options.displayBox.find('[data-mail="empty"]').remove();
        }
    }

    function createField(options, id, related, label, tab) {

        return $('<div>')
        .addClass('fieldset ' + id)
        .append(
            $('<label>', { 'for' : 'input_field_' + id }).text(label),
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

    var ContactCreateDistView = View.extend({

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
                    createField(self, 'name', 'input#mail', gt('Name'), '2'),
                    createField(self, 'mail', 'input#name', gt('Email address'), '3')
                );

            addSection.addClass('last').append(
                //self.createSectionTitle({text: gt('add new Member')}),
                dataHolder,
                addButton(self)
            );

            self.node.append(addSection);

            self.node.append($('<div>', { id: 'myGrowl' })
                    .addClass('jGrowl').css({position: 'absolute', right: '-275px', top: '-10px'}));

            this.getModel().on('error:invalid', function (evt, err) {
                console.log('error validation');
                console.log(arguments);
                $('#myGrowl').jGrowl(err.message, {header: 'Make an educated guess!', sticky: false});
            });

            return self;
        }
    });

    return ContactCreateDistView;
});
