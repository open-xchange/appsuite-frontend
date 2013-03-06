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

    var autocompleteAPI = new AutocompleteAPI({id: 'createDistributionList', contacts: true, distributionlists: false });

    var point = views.point('io.ox/contacts/distrib/create-dist-view'),
        ContactCreateDistView = point.createView({
            tagName: 'div'
//            className: 'container'
        });

    point.extend(new forms.ControlGroup({
        id: 'displayname',
        index: 100,
        attribute: 'display_name',
        label: gt('List name'), // noun
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
                        nameValue = self.$el.find('input#name').val(),
                        isUpToDate = data.email === mailValue && data.display_name === nameValue;

                    if (isUpToDate && data.data) {
                        newMember = self.copyContact(self.$el, data.data, data.email);
                    } else {
                        //normalise
                        if (nameValue !== '' || mailValue !== '') {
                            nameValue = nameValue === '' ? mailValue : nameValue;
                            mailValue = mailValue === '' ? nameValue : mailValue;
                            newMember = self.copyContact(self.$el, nameValue, mailValue);
                        }
                    }

                    if (newMember) {
                        self.validateMail(newMember);

                        if (self.isUnique(newMember)) {
                            self.model.addMember(newMember);
                        }

                        // reset the fields
                        self.$el.find('[data-holder="data-holder"]').removeData();
                        self.$el.find('input#mail').val('');
                        self.$el.find('input#name').val('');
                    }

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

        validateMail: function (newMember) {
            var regEmail = /\@/,
                self = this,
                message = gt('The email address ' + newMember.mail + ' is not valid'),
                result = (regEmail.test(newMember.mail) || newMember.mail === '') ? true : self.drawAlert(message, self.$el);
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

                    self.drawAlert(message, self.$el);
                    //abort each-loop
                    unique = false;
                    return unique;
                }
            });

            return unique;
        },

        drawAlert: function (message, displayBox) {
            displayBox.parent().find('.sectiontitle .alert.alert-block').remove();
            displayBox.parent().find('.sectiontitle').append(
                $('<div>')
                .addClass('alert alert-block fade in')
                .append(
                    $('<a>').attr({ href: '#', 'data-dismiss': 'alert' })
                    .addClass('close')
                    .html('&times;'),
                    $('<p>').text(message)
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
                    id: id
                })
                .attr('data-type', id) // not name=id!
                .addClass('discreet input-large')
                .autocomplete({
                    api: autocompleteAPI,
                    reduce: function (data) {
                        return filterUsed.call(self, data, $(this));
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
                        return (related === 'input#mail') ? obj.email : obj.display_name;
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

        drawFail: function () {
            var self = this;
            $('.error-alerts').empty();
            $('.error-alerts').append(
                $.fail(gt("Couldn't load all contact images."), function () {
                    self.model.trigger("change:distribution_list");
                })
            );
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
                .append($('<div>').append(api.getDisplayName({email: o.mail, display_name: o.display_name }))),
                $('<div>').addClass('person-selected-mail')
                .text((o.mail))
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
//            console.log(value);
//            console.log('im validate');

        }
    });

    point.extend(new forms.ErrorAlert({
        id: 'io.ox/contacts/distrib/create-dist-view/errors',
        index: 250
    }));

    return ContactCreateDistView;
});
