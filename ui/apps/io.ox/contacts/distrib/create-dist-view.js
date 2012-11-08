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
    ['io.ox/backbone/views',
     'io.ox/backbone/forms',
     'gettext!io.ox/contacts',
     'io.ox/core/tk/autocomplete',
     'io.ox/contacts/api',
     'io.ox/core/api/autocomplete',
     'io.ox/contacts/util',
     'io.ox/core/extensions'
    ], function (views, forms, gt, autocomplete, api, AutocompleteAPI, util, ext) {

    "use strict";

    var autocompleteAPI = new AutocompleteAPI({id: 'createDistributionList', contacts: true, distributionlists: false});

    var point = views.point('io.ox/contacts/distrib/create-dist-view'),
        ContactCreateDistView = point.createView({
            tagName: 'div'
//            className: 'container'
        });

    point.extend(new forms.ControlGroup({
        id: 'displayname',
        index: 100,
        attribute: 'display_name',
        label: gt('List name'),
        control: '<input type="text" class="input-xlarge">',
        buildControls: function () {
            var self = this,
                buttonText = (_.isEmpty(self.model.get('distribution_list'))) ?  gt("Create list") : gt("Save");

            return this.nodes.controls || (this.nodes.controls = $('<div class="controls">').append(
                // element
                this.buildElement(),
                // save/create button
                $('<button class="btn btn-primary" data-action="save">').text(buttonText).on("click", function () {
                    self.options.parentView.trigger('save:start');
                    self.options.model.save().done(function () {
                        self.options.parentView.trigger('save:success');
                    }).fail(function () {
                        self.options.parentView.trigger('save:fail');
                    });
                }),
                // cancel button
                $('<button class="btn" data-action="discard">').text(gt('Discard')).on('click', function () {
                    // use this sneaky channel
                    $(this).trigger('controller:quit');
                })
            ));
        }

    }));


    point.extend({
        id: 'add-members',
        index: 300,
        render: function () {
            var self = this;

            this.$el.append(
                $('<legend>').addClass('sectiontitle').text(gt('Members')),
                this.itemList = $('<div>').attr('id', _.uniqueId('box_')).addClass('item-list'),

                $('<div>').attr('data-holder', 'data-holder').append(
                    self.createField(this, 'name', 'input#mail', gt('Name'), '2'),
                    self.createField(this, 'mail', 'input#name', gt('Email address'), '3')
                ),

                $('<a>').attr({
                    'data-action': 'add',
                    'href': '#',
                    'tabindex': '4'
                })
                .addClass('btn btn-inverse')
                .text('+')
                .on('click', function (e) {
                    var newMember,
                    data = self.$el.find('[data-holder="data-holder"]').data(),
                        mailValue = self.$el.find('input#mail').val(),
                        nameValue = self.$el.find('input#name').val();

                    if (data.data) {
                        newMember = self.copyContact(self.$el, data.data, data.email);
                    } else {
                        if (mailValue !== '') {
                            newMember = self.copyContact(self.$el, nameValue, mailValue);
                        }
                    }

                    if (self.checkForDuplicates(newMember)) {
                        self.model.addMember(newMember);
                    }

                    // reset the fields
                    self.$el.find('[data-holder="data-holder"]').removeData();
                    self.$el.find('input#mail').val('');
                    self.$el.find('input#name').val('');

                })

            );

            if (_.isEmpty(this.model.get("distribution_list"))) {
                self.drawEmptyItem(self.$el.find('.item-list'));

            } else {
                _(this.model.get("distribution_list")).each(function (member) {

                    self.$el.find('.item-list').append(
                            self.drawListetItem(member)
                    );
                });
            }
        },

        checkForDuplicates: function (newMember) {
            var self = this,
                currentMembers = self.model.get('distribution_list'),
                selector = false;

            _(currentMembers).each(function (val, key) {
                if (val.mail === newMember.mail && val.display_name === newMember.display_name) {
                    self.drawAlert(newMember.mail, self.$el);
                    selector = true;
                }
            });

            if (selector) {
                return false;
            } else {
                return true;
            }
        },

        drawAlert: function (mail, displayBox) {
            displayBox.parent().find('.sectiontitle .alert.alert-block').remove();
            displayBox.parent().find('.sectiontitle').append(
                $('<div>')
                .addClass('alert alert-block fade in')
                .append(
                    $('<a>').attr({ href: '#', 'data-dismiss': 'alert' })
                    .addClass('close')
                    .html('&times;'),
                    $('<p>').text(
                        gt('The email address ' + mail + ' is already in the list')
                    )
                )
            );
        },

        drawEmptyItem: function (node) {
            node.append(
                $('<div>').addClass('listet-item backstripes')
                .attr({ 'data-mail': 'empty' })
                .text(gt('This list has no members yet'))
            );
        },

        copyContact: function (options, contact, selectedMail) {
            var dataMailId,
                newMember;

            if (_.isString(contact)) {

                dataMailId = '[data-mail="' + contact + '_' + selectedMail + '"]';
                newMember = {
                    display_name: contact,
                    mail: selectedMail,
                    mail_field: 0
                };

            } else {

                dataMailId = '[data-mail="' + contact.display_name + '_' + selectedMail + '"]';
                var mailNr = (util.calcMailField(contact, selectedMail));

                newMember = {
                    id: contact.id,
                    display_name: contact.display_name,
                    mail: selectedMail,
                    mail_field: mailNr
                };
            }

            return newMember;
        },

        createField: function (options, id, related, label, tab) {
            var self = this;
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
                        return autocompleteAPI.search(query);
                        //return api.autocomplete(query);
                    },
                    stringify: function (obj) {
                        if (related === 'input#mail') {
                            return obj.display_name;
                        } else {
                            return obj.email;
                        }

                    },
                    // for a second (related) Field
                    stringifyrelated: function (obj) {
                        if (related === 'input#mail') {
                            return obj.email;
                        } else {
                            return obj.display_name;
                        }

                    },
                    draw: function (obj) {
                        self.drawAutoCompleteItem.call(null, this, obj);
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
        },

        drawAutoCompleteItem: function (node, obj) {
            var img = $('<div>').addClass('create-distributionlist-contact-image'),
                url = util.getImage(obj.data);

            if (Modernizr.backgroundsize) {
                img.css('backgroundImage', 'url(' + url + ')');
            } else {
                img.append(
                    $('<img>', { src: url, alt: '' }).css({ width: '100%', height: '100%' })
                );
            }

            node.append(
                img,
                $('<div>').addClass('person-link ellipsis').text(obj.display_name),
                $('<div>').addClass('ellipsis').text(obj.email)
            );
        },

        onDistributionListChange: function () {
            var self = this;
            this.$el.find('.item-list').empty();

            _(this.model.get("distribution_list")).each(function (member) {

                self.$el.find('.item-list').append(
                        self.drawListetItem(member)
                );
            });

        },

        drawListetItem: function (o) {
            var self = this,
                frame = $('<div>').addClass('listet-item').attr({
                'data-mail': o.display_name + '_' + o.mail
            }),
            img = api.getPicture(o.mail).addClass('contact-image'),
            button = $('<a>', { href: '#' }).addClass('close').html('&times;')
            .on('click', {mail: o.mail, name: o.display_name }, function (e) {
                self.model.removeMember(e.data.mail, e.data.name);
            });
            frame.append(button);
            frame.append(img)
            .append(
                $('<div>').addClass('person-link ellipsis')
                .append($('<a>', {'href': '#'})
                .on('click', {id: o.id, email1: o.mail}, self.fnClickPerson).text(o.display_name)),
                $('<div>').addClass('person-selected-mail')
                .text((o.mail))
            );
            return frame;
        },

        fnClickPerson: function (e) {
            ext.point('io.ox/core/person:action').each(function (ext) {
                _.call(ext.action, e.data, e);
            });
        },

        observe: 'distribution_list'

    });

    ext.point('io.ox/contacts/model/validation/distribution_list').extend({
        id: 'check_for_duplicates',
        validate: function (value) {
//            console.log(value);
//            console.log('im validate');

        }
    });

    point.extend(new forms.ErrorAlert({
        id: 'io.ox/contacts/distrib/create-dist-view/errors'
    }));

    return ContactCreateDistView;
});

/*
define('io.ox/contacts/distrib/create-dist-view',
    ['io.ox/core/extensions',
     'gettext!io.ox/contacts',
     'io.ox/contacts/util',
     'io.ox/contacts/api',
     'io.ox/core/tk/view',
     'io.ox/core/tk/model',
     'io.ox/core/tk/autocomplete',
     'io.ox/core/api/autocomplete',
     'io.ox/core/config',
     'io.ox/core/notifications'
    ], function (ext, gt, util, api, View, Model, autocomplete, AutocompleteAPI, config, notifications) {

    'use strict';

    var autocompleteAPI = new AutocompleteAPI({id: 'createDistributionList', contacts: true, distributionlists: false});

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
            if (data.data) {
                copyContact(options, data.data, data.email);
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

    function drawAutoCompleteItem(node, obj) {
        var img = $('<div>').addClass('create-distributionlist-contact-image'),
            url = util.getImage(obj.data);

        if (Modernizr.backgroundsize) {
            img.css('backgroundImage', 'url(' + url + ')');
        } else {
            img.append(
                $('<img>', { src: url, alt: '' }).css({ width: '100%', height: '100%' })
            );
        }

        node.append(
            img,
            $('<div>').addClass('person-link ellipsis').text(obj.display_name),
            $('<div>').addClass('ellipsis').text(obj.email)
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
            var mailNr = (util.calcMailField(contact, selectedMail));

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
                    return autocompleteAPI.search(query);
                    //return api.autocomplete(query);
                },
                stringify: function (obj) {
                    if (related === 'input#mail') {
                        return obj.display_name;
                    } else {
                        return obj.email;
                    }

                },
                // for a second (related) Field
                stringifyrelated: function (obj) {
                    if (related === 'input#mail') {
                        return obj.email;
                    } else {
                        return obj.display_name;
                    }

                },
                draw: function (obj) {
                    drawAutoCompleteItem.call(null, this, obj);
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

            this.getModel().on('error:invalid', function (evt, err) {
                console.log('error validation');
                console.log(arguments);
                notifications.yell('error', err.message);
            });

            return self;
        }
    });

    return ContactCreateDistView;
});
*/
