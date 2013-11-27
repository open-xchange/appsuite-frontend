/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
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
     'io.ox/contacts/util',
     'io.ox/core/extensions',
     'io.ox/calendar/edit/view-addparticipants',
     'io.ox/core/notifications'
    ], function (views, forms, gt, autocomplete, api, util, ext, AddParticipantsView, notifications) {

    'use strict';

    var point = views.point('io.ox/contacts/distrib/create-dist-view'),
        ContactCreateDistView = point.createView({
            tagName: 'div'
        });


    point.extend({
        id: 'title-controls',
        index: 100,
        className: 'row-fluid title-controls',
        render: function () {
            var self = this,
            buttonText = (self.model.get('id')) ? gt('Save') : gt('Create list');

            this.$el.append(
                $('<h1 class="clear-title title">').text(gt('Create distribution list')),
                // save/create button
                $('<button type="button" class="btn btn-primary" data-action="save" tabindex="3">').text(buttonText).on('click', function () {
                    self.options.parentView.trigger('save:start');
                    self.options.model.save().done(function () {
                        self.options.parentView.trigger('save:success');
                    }).fail(function () {
                        self.options.parentView.trigger('save:fail');
                    });
                }),
                // cancel button
                $('<button type="button" class="btn" data-action="discard" tabindex="2">').text(gt('Discard')).on('click', function () {
                    // use this sneaky channel
                    $(this).trigger('controller:quit');
                })
            );
        }
    });


    point.extend(new forms.ControlGroup({
        id: 'displayname',
        index: 200,
        attribute: 'display_name',
        className: 'row-fluid',
        label: gt('List name'), // noun
        control: '<input tabindex="1" type="text" class="span6">',
        buildControls: function () {
            return this.nodes.controls || (this.nodes.controls = $('<div class="controls">').append(
                // element
                this.buildElement()
            ));
        }
    }));

    point.extend({
        id: 'add-members',
        index: 300,
        className: 'row-fluid',
        render: function () {
            var self = this;

            var pNode = $('<div class="autocomplete-controls input-append">').append(
                    $('<input tabindex="1" type="text" class="add-participant">').attr('placeholder', gt('Add contact') + ' ...'),
                    $('<button type="button" class="btn" data-action="add" tabindex="1">')
                        .append($('<i class="icon-plus">'))
                ),

            autocomplete = new AddParticipantsView({ el: pNode });

            if (!_.browser.Firefox) { pNode.addClass('input-append-fix'); }

            autocomplete.render({
                autoselect: true,
                parentSelector: '.create-distributionlist',
                placement: 'bottom',
                contacts: true,
                resources: false,
                distributionlists: false,
                users: false,
                groups: false,
                keepId: true
            });

            autocomplete.on('select', function (data) {

                // overwrite display_name
                data.display_name = util.getMailFullName(data);

                var mailValue = data.email1 || data.email2 || data.email3 || data.mail,
                    nameValue = data.display_name,
                    newMember = self.copyContact(self.$el, data.id ? data : nameValue, mailValue);

                if (newMember && self.isUnique(newMember)) {
                    self.model.addMember(newMember);
                }

            });

            this.$el.append(
                $('<legend>').addClass('sectiontitle').text(gt('Contacts')),
                this.itemList = $('<div>').addClass('item-list row-fluid'),
                pNode
            );

            if (_.isEmpty(this.model.get('distribution_list'))) {
                self.drawEmptyItem(self.$el.find('.item-list'));

            } else {
                _(this.model.get('distribution_list')).each(function (member) {
                    self.$el.find('.item-list').append(
                        self.drawListedItem(member)
                    );
                });
            }
        },

       /**
        * check for uniqueness (emailadress, name-only entries) and displays error message
        *
        * @param {object} newMember contains with properties email and display_name
        * @return {boolean}
        */
        isUnique: function (newMember) {

            var self = this,
                unique = true,
                currentMembers = self.model.get('distribution_list');

            _(currentMembers).each(function (val) {
                var matchingEmail = newMember.mail === val.mail && val.mail !== '',
                    matchingPlaceholder = newMember.mail === val.mail && val.mail === '' && val.display_name === newMember.display_name;

                if (matchingEmail || matchingPlaceholder) {
                    // custom error message
                    var message;
                    if (matchingEmail)
                        message = gt('The email address ' + newMember.mail + ' is already in the list');
                    else if (matchingPlaceholder)
                        message = gt('The person ' + newMember.display_name + ' is already in the list');

                    notifications.yell('info', message);

                    //abort each-loop
                    unique = false;
                    return unique;
                }
            });

            return unique;
        },

        drawEmptyItem: function (node) {
            node.append(
                $('<div>').addClass('listed-item backstripes')
                .attr({ 'data-mail': 'empty' })
                .text(gt('This list has no contacts yet'))
            );
        },

        copyContact: function (options, contact, selectedMail) {

            var newMember;

            if (_.isString(contact)) {
                newMember = {
                    display_name: contact,
                    mail: selectedMail,
                    mail_field: 0
                };

            } else {

                var mailNr = (util.calcMailField(contact, selectedMail));

                newMember = {
                    id: contact.id,
                    folder_id: contact.folder_id,
                    display_name: contact.display_name,
                    mail: selectedMail,
                    mail_field: mailNr
                };
            }

            return newMember;
        },

        onDistributionListChange: function () {
            var self = this;
            this.$el.find('.item-list').empty();
            _(this.model.get('distribution_list')).each(function (member) {
                self.$el.find('.item-list').append(
                    self.drawListedItem(member)
                );
            });

        },

        drawListedItem: function (o) {

            var self = this;

            return $('<div class="listed-item span6">')
                .attr('data-mail', o.display_name + '_' + o.mail)
                .append(
                    // contact picture
                    api.pictureHalo(
                        $('<div class="contact-image">'),
                        $.extend(_.copy(o), { width: 48, height: 48, scaleType: 'cover', userid: o.id })
                    ),
                    // name
                    $('<div class="person-name">').text(o.display_name),
                    // mail address
                    $('<div class="person-mail">').append(
                        $('<a href="#" class="halo-link" tabindex="1">')
                            .data({ email1: o.mail })
                            .text(o.mail)
                    ),
                    // remove icon
                    $('<a href="#" class="remove" tabindex="1">').append(
                        $('<div class="icon">').append(
                            $('<i class="icon-trash">')
                        )
                    )
                    .on('click', { mail: o.mail, name: o.display_name }, function (e) {
                        e.preventDefault();
                        self.model.removeMember(e.data.mail, e.data.name);
                    })
                );
        },

        fnClickPerson: function (e) {
            if (e.data && e.data.email1 !== '') {
                ext.point('io.ox/core/person:action').each(function (ext) {
                    _.call(ext.action, e.data, e);
                });
            }
        },

        observe: 'distribution_list'

    });

    point.extend({
        id: 'notice',
        index: 400,
        render: function () {
            this.$el.append($('<div class="alert alert-info">').text(gt('To add contacts manually, just provide a valid email address (e.g john.doe@example.com or "John Doe" <jd@example.com>)')));
        }
    });

    ext.point('io.ox/contacts/model/validation/distribution_list').extend({
        id: 'check_for_duplicates',
        validate: function () {
        }
    });

    point.extend(new forms.ErrorAlert({
        id: 'io.ox/contacts/distrib/create-dist-view/errors',
        index: 250
    }));

    return ContactCreateDistView;
});
