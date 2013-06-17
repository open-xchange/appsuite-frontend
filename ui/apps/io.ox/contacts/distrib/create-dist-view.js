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
     'io.ox/core/extensions',
     'io.ox/calendar/edit/view-addparticipants',
     'io.ox/core/notifications'
    ], function (views, forms, gt, autocomplete, api, AutocompleteAPI, util, ext, AddParticipantsView, notifications) {

    'use strict';

    var autocompleteAPI = new AutocompleteAPI({id: 'createDistributionList', contacts: true, distributionlists: false });

    var point = views.point('io.ox/contacts/distrib/create-dist-view'),
        ContactCreateDistView = point.createView({
            tagName: 'div'
        });


    point.extend({
        id: 'title-controls',
        index: 100,
        className: 'row-fluid title-controls',
        render: function (baton) {
            var self = this,
            buttonText = (self.model.get('id')) ? gt('Save') : gt('Create list');

            this.$el.append(
                $('<h1 class="clear-title title">').text(gt('Create distribution list')),
                // save/create button
                $('<button class="btn btn-primary" data-action="save" tabindex="3">').text(buttonText).on('click', function () {
                    self.options.parentView.trigger('save:start');
                    self.options.model.save().done(function () {
                        self.options.parentView.trigger('save:success');
                    }).fail(function () {
                        self.options.parentView.trigger('save:fail');
                    });
                }),
                // cancel button
                $('<button class="btn" data-action="discard" tabindex="2">').text(gt('Discard')).on('click', function () {
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
            var self = this;
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
        render: function (baton) {
            var self = this;

            var pNode = $('<div class="autocomplete-controls input-append">').append(
                    $('<input tabindex="1" type="text" class="add-participant">').attr('placeholder', gt('Add member') + ' ...'),
                    $('<button class="btn" type="button" data-action="add" tabindex="1">')
                        .append($('<i class="icon-plus">'))
                ),

            autocomplete = new AddParticipantsView({ el: pNode });

            autocomplete.render({
                autoselect: true,
                parentSelector: 'body',
                placement: 'bottom',
                contacts: true,
                distributionlists: false,
                users: false,
                keepId: true
            });

            autocomplete.on('select', function (data) {
                var newMember,
                    mailValue = data.email1 || data.email2 || data.email3 || data.mail,
                    nameValue = data.display_name;

                if (data.id) {
                    newMember = self.copyContact(self.$el, data, mailValue);
                } else {
                    newMember = self.copyContact(self.$el, nameValue, mailValue);
                }

                if (newMember) {
                    if (self.isUnique(newMember)) {
                        self.model.addMember(newMember);
                    }
                }

            });

            this.$el.append(
                $('<legend>').addClass('sectiontitle').text(gt('Members')),
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
                .text(gt('This list has no members yet'))
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

        drawFail: function () {
            var self = this;
            $('.error-alerts').empty();
            $('.error-alerts').append(
                $.fail(gt("Couldn't load all contact images."), function () {
                    self.model.trigger('change:distribution_list');
                })
            );
        },

        drawListedItem: function (o) {
            var self = this,
                frame = $('<div>').addClass('listed-item span6').attr({
                'data-mail': o.display_name + '_' + o.mail
            }),
            img = api.getPicture(o.mail).addClass('contact-image'),
            button = $('<div>', { tabindex: 1 }).addClass('remove')
            .append($('<div class="icon">').append($('<i class="icon-trash">')))
            .on('click', {mail: o.mail, name: o.display_name }, function (e) {
                self.model.removeMember(e.data.mail, e.data.name);
            });
            frame.append(img)
            .append(
                $('<div>').addClass('person-link ellipsis')
                .append($('<div>').append(api.getDisplayName({email: o.mail, display_name: o.display_name }).attr('tabindex', 1))),
                $('<div>').addClass('person-selected-mail')
                .text((o.mail)),
                button
            );
            api.on('fail', function () {
                self.drawFail();
            });
            return frame;
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
        render: function (baton) {
            this.$el.append($('<div class="alert alert-info">').text(gt('To add participants manually, just provide a valid email address (e.g john.doe@example.com or "John Doe" <jd@example.com>)')));
        }
    });

    /**
    * remove allready used items
    *
    * @return {object} data (list, hits)
    */
    function filterUsed(data, node) {
        var self = this,
            currentMembers = self.model.get('distribution_list') || {},
            hash = {},
            list;

        _(currentMembers).each(function (val) {
            hash[val.mail] = true;
        });

        // ignore doublets
        list = _(data).filter(function (member) {
            return (hash[member.email] === undefined);
        }, this);

        //return number of query hits and the filtered list
        return { list: list, hits: data.length};
    }

    ext.point('io.ox/contacts/model/validation/distribution_list').extend({
        id: 'check_for_duplicates',
        validate: function (value) {
        }
    });

    point.extend(new forms.ErrorAlert({
        id: 'io.ox/contacts/distrib/create-dist-view/errors',
        index: 250
    }));

    return ContactCreateDistView;
});