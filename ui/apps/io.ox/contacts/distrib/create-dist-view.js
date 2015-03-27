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

define('io.ox/contacts/distrib/create-dist-view', [
    'io.ox/backbone/views',
    'io.ox/backbone/mini-views',
    'gettext!io.ox/contacts',
    'io.ox/contacts/api',
    'io.ox/contacts/util',
    'io.ox/core/extensions',
    'io.ox/calendar/edit/view-addparticipants',
    'io.ox/core/notifications',
    'less!io.ox/participants/participants'
], function (views, mini, gt, api, util, ext, AddParticipantsView, notifications) {

    'use strict';

    var point = views.point('io.ox/contacts/distrib/create-dist-view'),
        ContactCreateDistView = point.createView({
            tagName: 'div',
            className: 'create-distributionlist-view'
        });

    point.basicExtend({
        id: 'title-controls',
        index: 100,
        className: 'row title-controls',
        draw: function (baton) {
            var buttonText = gt('Create list'),
                header = gt('Create distribution list');

            // on edit
            if (baton.model.get('id')) {
                buttonText = gt('Save');
                header = gt('Edit distribution list');
            }
            baton.app.getWindow().setHeader(
                $('<div class="header">').append(
                    $('<h1 class="clear-title title">').text(header),
                    // save/create button
                    $('<button type="button" class="btn btn-primary" data-action="save" tabindex="3">').text(buttonText).on('click', function () {
                        baton.model.save();
                    }),
                    // cancel button
                    $('<button type="button" class="btn btn-default" data-action="discard" tabindex="2">').text(gt('Discard')).on('click', function () {
                        // use this sneaky channel
                        $(this).trigger('controller:quit');
                    })
                )
            );

        }
    });

    point.extend({
        id: 'displayname',
        index: 200,
        className: 'row',
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<div>').addClass('form-group col-md-12').append(
                    // see Bug 31073 - [L3] Field "List name" is mentioned as Display Name in the error message appears on create distribution list page
                    //#. Name of distribution list
                    $('<label>').addClass('control-label').attr('for', guid).text(gt('Name')),
                    new mini.InputView({ name: 'display_name', model: this.baton.model, className: 'form-control control', id: guid }).render().$el
                )
            );
        }
    });

    point.extend({
        id: 'add-members',
        index: 300,
        className: 'row',

        init: function () {
            this.listenTo(this.model, 'change:distribution_list', this.onDistributionListChange);
        },

        render: function () {
            var self = this;

            var pNode = $('<div class="col-xs-12 col-md-6">').append(
                    $('<div class="autocomplete-controls input-group">').append(
                        $('<input tabindex="1" type="text" class="add-participant form-control">').attr({ 'placeholder': gt('Add contact') + ' ...', 'aria-label': gt('Add contact') }),
                        $('<span class="input-group-btn">').append(
                            $('<button type="button" class="btn btn-default" aria-label="' + gt('Add contact') + '" data-action="add" tabindex="1">')
                                .append($('<i class="fa fa-plus">'))
                        )
                    )
                ),

            autocomplete = new AddParticipantsView({ el: pNode });

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

                var mailValue = data.field ? data[data.field] : data.mail,
                    newMember = self.copyContact(self.$el, data.id ? data : data.display_name, mailValue);

                if (newMember && self.isUnique(newMember)) {
                    var tmpList = _.clone(self.model.get('distribution_list') || []);
                    tmpList.push(newMember);
                    self.model.set('distribution_list', tmpList, { validate: true });
                }

            });

            this.$el.append(
                $('<legend>').addClass('sectiontitle col-md-12').text(gt('Contacts')),
                this.itemList = $('<div>').addClass('item-list participantsrow col-md-12'),
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

            // draw empty item again
            this.listenTo(this.model, 'change:distribution_list', function () {
                if (self.model.get('distribution_list').length === 0)
                    self.drawEmptyItem(self.$el.find('.item-list'));
            });
        },

        /**
         * check for uniqueness (emailadress, name-only entries) and displays error message
         *
         * @param {object} newMember contains with properties email and display_name
         * @return { boolean }
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
                    if (matchingEmail) {
                        //#. uniqueness of distribution listmembers
                        //#. %1$s is the duplicate mail address
                        message = gt.format(gt('The email address %1$s is already in the list'),  newMember.mail);
                    } else if (matchingPlaceholder) {
                        //#. uniqueness of distribution listmembers
                        //#. %1$s is the duplicate display name of the person
                        message = gt.format(gt('The person %1$s is already in the list'), newMember.display_name);
                    }

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
                $('<div>').addClass('participant-wrapper')
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

        onDistributionListChange: function (model, list) {
            var self = this;
            this.$el.find('.item-list').empty();
            _(list).each(function (member) {
                self.$el.find('.item-list').append(
                    self.drawListedItem(member)
                );
            });
        },

        drawListedItem: function (o) {

            var self = this;

            // get proper data for picture halo but ignore client-side ids (0.99988765533211)
            var halo = $.extend({}, o);
            if (/^0\./.test(halo.id)) delete halo.id;

            return $('<div class="participant-wrapper removable col-xs-12 col-md-6">')
                .attr('data-mail', o.display_name + '_' + o.mail)
                .append(
                    // contact picture
                    api.pictureHalo(
                        $('<div class="participant-image">'),
                        halo,
                        { width: 48, height: 48 }
                    ),
                    // name
                    $('<div class="participant-name">').text(o.display_name),
                    // mail address
                    $('<div class="participant-mail">').append(
                        $('<a href="#" class="halo-link" tabindex="1">')
                            .data({ email1: o.mail })
                            .text(o.mail)
                    ),
                    // remove icon
                    $('<a href="#" class="remove" role="button" aria-label="' + gt('Remove contact') + '" tabindex="1">').append(
                        $('<div class="icon">').append(
                            $('<i class="fa fa-trash-o">')
                        )
                    )
                    .on('click', { mail: o.mail, name: o.display_name }, function (e) {
                        e.preventDefault();
                        self.model.set('distribution_list', _(self.model.get('distribution_list')).filter(function (val) {
                            return val.mail !== e.data.mail || val.display_name !== e.data.name;
                        }));
                    })
                );
        },

        fnClickPerson: function (e) {
            if (e.data && e.data.email1 !== '') {
                ext.point('io.ox/core/person:action').each(function (ext) {
                    _.call(ext.action, e.data, e);
                });
            }
        }

    });

    point.extend({
        id: 'notice',
        index: 400,
        render: function () {
            this.$el.addClass('help-block').text(gt('To add contacts manually, just provide a valid email address (e.g john.doe@example.com or "John Doe" <jd@example.com>)'));
        }
    });

    ext.point('io.ox/contacts/model/validation/distribution_list').extend({
        id: 'check_for_duplicates',
        validate: $.noop
    });

    return ContactCreateDistView;
});
