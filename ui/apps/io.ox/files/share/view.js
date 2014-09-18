/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/files/share/view', [
    'io.ox/core/extensions',
    'io.ox/files/share/model',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/contacts/api',
    'io.ox/contacts/util',
    'io.ox/core/api/autocomplete',
    'io.ox/core/tk/typeahead',
    'io.ox/participants/views',
    'io.ox/core/date',
    'gettext!io.ox/files',
    'less!io.ox/files/share/style'
], function (ext, ShareModel, miniViews, Dropdown, contactsAPI, contactsUtil, AutocompleteAPI, typeahead, pViews, date, gt) {

    'use strict';

    var INDEX = 0,
        POINT = 'io.ox/files/share',
        trans = {
            mail: gt('Invite people via email. Every recipient will get an individual link to access the shared files.'),
            link: gt('Create a link to copy and paste in an email, instant messenger or social network. Please note that anyone who gets the link can access the share.')
        };

    /*
     * extension point share type
     */
    ext.point(POINT + '/fields').extend({
        id: 'type-dropdown',
        index: INDEX += 100,
        draw: function (baton) {
            var typeTranslations = {
                mail: gt('Invite people'),
                link: gt('Get a Link')
            };

            var dropdown = new Dropdown({ model: baton.model, label: typeTranslations[baton.model.get('type')], caret: true })
                .option('type', 'mail', typeTranslations.mail)
                .option('type', 'link', typeTranslations.link)
                .listenTo(baton.model, 'change:type', function (model, type) {
                    this.$el.find('.dropdown-label').text(typeTranslations[type]);
                });

            this.append(
                dropdown.render().$el.addClass('form-group')
            );
        }
    });

    /*
     * extension point descriptive text
     */
    ext.point(POINT + '/fields').extend({
        id: 'description',
        index: INDEX += 100,
        draw: function (baton) {
            this.append(
                baton.nodes.default.description = $('<p>').text(trans[baton.model.get('type', 'mail')])
            );
        }
    });

    /*
     * extension point for contact picture in autocomplete dropdown
     */
    ext.point(POINT +  '/autoCompleteItem').extend({
        id: 'contactPicture',
        index: 100,
        draw: function (baton) {
            this.append(
                $('<div class="contact-image">')
                    .attr('data-original', contactsAPI.pictureHalo($.extend(baton.data, { width: 42, height: 42, scaleType: 'contain' })))
                    .css('background-image', 'url(' + contactsAPI.pictureHalo($.extend(baton.data, { width: 42, height: 42, scaleType: 'contain' })) + ')')
                    // TODO: lazyload does not work in a dialog container ???
                    // .css('background-image', 'url(' + ox.base + '/apps/themes/default/dummypicture.png)')
                    // .lazyload({
                    //     effect: 'fadeIn',
                    //     container: this
                    // })
            );
        }
    });

    /*
     * extension point for display name in autocomplete dropdown
     */
    ext.point(POINT +  '/autoCompleteItem').extend({
        id: 'displayName',
        index: 100,
        draw: function (baton) {
            this.append(
                $('<div class="recipient-name">').text(contactsUtil.getMailFullName(baton.data))
            );
        }
    });

    /*
     * extension point for email in autocomplete dropdown
     */
    ext.point(POINT +  '/autoCompleteItem').extend({
        id: 'emailAddress',
        index: 100,
        draw: function (baton) {
            this.append(
                $('<div class="email">').text(baton.data.email + (baton.data.phone || '') + ' ')
            );
        }
    });

    /*
     * extension point for recipients autocomplete input field
     */
    ext.point(POINT + '/fields').extend({
        id: 'recipients-autocomplete',
        index: INDEX += 100,
        draw: function (baton) {
            var guid = _.uniqueId('form-control-label-'),
                input = $('<input>').attr({
                    id: guid,
                    placeholder: gt('Add mail address'),
                    type: 'text',
                    tabindex: 1
                }).addClass('form-control');

            this.append(
                baton.nodes.invite.autocomplete = $('<div class="form-group">').append(
                    $('<label>').attr({ for: guid }).addClass('sr-only').text(gt('Add mail address')),
                    input
                )
            );

            function onReady() {
                var val = $(this).typeahead('val');
                if (val) {
                    baton.model.getRecipients().addUniquely({ type: 5, mail: val });
                    $(this).typeahead('val', '');
                }
            }

            // add autocomplete
            input.autocompleteNew({
                api: new AutocompleteAPI({
                    contacts: true,
                    groups: true
                }),
                autoselect: true,
                highlight: true,
                draw: function (data) {
                    ext.point(POINT + '/autoCompleteItem').invoke('draw', this, _.extend(baton, { data: data }));
                }
            }).on({
                'typeahead:selected': function (e, contact) {
                    // clear input
                    $(this).typeahead('val', '');
                    // add to collection
                    baton.model.getRecipients().addUniquely(contact.data.contact);
                },
                'blur': function (e) {
                    onReady.apply(this, e);
                },
                'keydown': function (e) {
                    if (e.which !== 13) return;
                    onReady.apply(this, e);
                }
            });
        }
    });

    /*
     * extension point for recipient list
     */
    ext.point(POINT + '/fields').extend({
        id: 'recipients-list',
        index: INDEX += 100,
        draw: function (baton) {
            this.append(
                baton.nodes.invite.container = new pViews.UserContainer({
                    collection: baton.model.getRecipients(),
                    baton: baton
                }).render().$el.addClass('form-group')
            );
        }
    });

    /*
     * extension point for message textarea
     */
    ext.point(POINT + '/fields').extend({
        id: 'message',
        index: INDEX += 100,
        draw: function (baton) {
            var guid = _.uniqueId('form-control-label-');
            this.append(
                baton.nodes.invite.message = $('<div>').addClass('form-group').append(
                    $('<label>').addClass('control-label sr-only').text(gt('Message')).attr({ for: guid }),
                    new miniViews.TextView({
                        name: 'message',
                        model: baton.model
                    }).render().$el.attr({
                        id: guid,
                        rows: 3,
                        placeholder: gt('Message')
                    })
                )
            );
        }
    });

    /*
     * extension point for share options
     */
    ext.point(POINT + '/fields').extend({
        id: 'defaultOptions',
        index: INDEX += 100,
        draw: function (baton) {
            var optionGroup = $('<div>').addClass('share-options').hide(),
                icon = $('<i>').addClass('fa fa-caret-right fa-fw');
            ext.point(POINT + '/options').invoke('draw', optionGroup, baton);
            this.append(
                $('<a href="#" tabindex=1>').append(
                    icon,
                    $('<span>').text(gt('Advanced'))
                ).click(function () {
                    optionGroup.toggle();
                    icon.toggleClass('fa-caret-right fa-caret-down');
                }),
                optionGroup
            );
        }
    });

    /*
     * extension point for write permissions checkbox
     */
    ext.point(POINT + '/options').extend({
        id: 'write-permissions',
        index: INDEX += 100,
        draw: function (baton) {
            this.append(
                $('<div>').addClass('form-group').append(
                    $('<div>').addClass('checkbox').append(
                        $('<label>').addClass('control-label').text(gt('Recipients can edit')).append(
                            new miniViews.CheckboxView({ name: 'edit', model: baton.model }).render().$el
                        )
                    )
                )
            );
        }
    });

    /*
     * extension point for password protection
     */
    ext.point(POINT + '/options').extend({
        id: 'secured',
        index: INDEX += 100,
        draw: function (baton) {
            var guid = _.uniqueId('form-control-label-'), passInput;
            this.append(
                $('<div>').addClass('form-group').append(
                    $('<div>').addClass('checkbox').append(
                        $('<label>').addClass('control-label').text(gt('Password required')).append(
                            new miniViews.CheckboxView({ name: 'secured', model: baton.model }).render().$el
                        )
                    ),
                    $('<div>').addClass('form-group').append(
                        $('<label>').addClass('control-label sr-only').text(gt('Enter Password')).attr({ for: guid }),
                        passInput = new miniViews.PasswordView({ name: 'password', model: baton.model })
                            .render().$el
                            .attr({ id: guid, placeholder: gt('Enter Passowrd') })
                            .prop('disabled', !baton.model.get('secured'))
                    )
                )
            );
            baton.model.on('change:secured', function (model, val) {
                passInput.prop('disabled', !val);
            });
        }
    });

    /*
     * extension point for expires dropdown
     */
    ext.point(POINT + '/options').extend({
        id: 'temporary',
        index: INDEX += 100,
        draw: function (baton) {

            //#. options for terminal element of a sentence starts with "Expires in"
            var typeTranslations = {
                0: gt('one day'),
                1: gt('one week'),
                2: gt('one month'),
                3: gt('three months'),
                4: gt('six months'),
                5: gt('one year')
            };

            var dropdown = new Dropdown({ model: baton.model, label: typeTranslations[baton.model.get('expires')], caret: true })
                .listenTo(baton.model, 'change:expires', function (model, expires) {
                    this.$el.find('.dropdown-label').text(typeTranslations[expires]);
                });

            _(typeTranslations).each(function (val, key) {
                dropdown.option('expires', parseInt(key, 10), val);
            });

            this.append(
                $('<div>').addClass('form-inline').append(
                    $('<div>').addClass('checkbox-inline').append(
                        $('<label>').text(gt('Expires in')).append(
                            new miniViews.CheckboxView({ name: 'temporary', model: baton.model }).render().$el
                        )
                    ),
                    $.txt(' '),
                    dropdown.render().$el.addClass('inline dropup')
                )
            );
            var toggle = dropdown.$el.find('a[data-toggle=dropdown]');
            toggle.dropdown().toggleClass('disabled', !baton.model.get('temporary'));

            baton.model.on({
                'change:temporary': function (model, val) {
                    toggle.toggleClass('disabled', !val);
                }
            });

        }
    });

    /*
     * main view
     */
    var ShareView = Backbone.View.extend({

        tagName: 'form',

        className: 'share-view',

        initialize: function (options) {
            var self = this;
            this.model = new ShareModel({ files: options.files });
            this.baton = ext.Baton({
                model: this.model,
                view: this,
                nodes: {
                    invite: {},
                    default: {}
                }
            });
            this.model.on('change:type', function (model, val) {
                _(self.baton.nodes.invite).each(function (el) {
                    el.toggle(val === 'mail');
                });
                self.baton.nodes.default.description.text(trans[val]);
            });
        },

        render: function () {

            this.$el.attr({
                role: 'form'
            });

            // draw all extensionpoints
            ext.point(POINT + '/fields').invoke('draw', this.$el, this.baton);

            return this;
        },

        getShare: function () {
            return this.model;
        }

    });

    return ShareView;
});
