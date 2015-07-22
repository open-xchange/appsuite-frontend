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

define('io.ox/files/share/wizard', [
    'io.ox/backbone/disposable',
    'io.ox/core/extensions',
    'io.ox/files/share/model',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/contacts/api',
    'io.ox/core/tk/tokenfield',
    'io.ox/core/yell',
    'gettext!io.ox/files',
    'less!io.ox/files/share/style'
], function (DisposableView, ext, sModel, miniViews, Dropdown, contactsAPI, Tokenfield, yell, gt) {

    'use strict';

    var INDEX = 0,
        POINT = 'io.ox/files/share/wizard',
        trans = {
            invite: gt('Invite people via email. Every recipient will get an individual link to access the shared files.'),
            link: gt('You can copy and paste this link in an email, instant messenger or social network. Please note that anyone with this link can access the share.')
        };

    /*
     * extension point descriptive text
     */
    ext.point(POINT + '/fields').extend({
        id: 'description',
        index: INDEX += 100,
        draw: function (baton) {
            this.append(
                $('<span>').addClass('help-block').text(trans[baton.model.get('type', 'invite')])
            );
        }
    });

    /*
     * extension point for share link
     */
    ext.point(POINT + '/fields').extend({
        id: 'link',
        index: INDEX += 100,
        draw: function (baton) {
            // only available for type link
            if (baton.model.get('type') !== baton.model.TYPES.LINK) return;

            var linkNode,
                link = baton.model.get('url', ''),
                formID = _.uniqueId('form-control-label-');
            this.append(
                linkNode = $('<div class="form-group">').append(
                    $('<label>').attr({ for: formID }).text(),
                    $('<input class="form-control">').attr({ id: formID, type: 'text', tabindex: 1, readonly: 'readonly' }).val(link)
                )
            );
            baton.view.listenTo(baton.model, 'change:url', function (model, val) {
                linkNode.find('input').val(val).focus().select();
            });
            if (link === '' ) {
                baton.model.fetch();
            }
        }
    });

    /*
     * extension point for recipients autocomplete input field
     */
    ext.point(POINT + '/fields').extend({
        id: 'recipients-tokenfield',
        index: INDEX += 100,
        draw: function (baton) {
            var guid = _.uniqueId('form-control-label-');

            // add autocomplete
            var tokenfieldView = new Tokenfield({
                id: guid,
                extPoint: POINT,
                placeholder: gt('Add recipients ...'),
                apiOptions: {
                    contacts: true,
                    users: true,
                    // only availiable for invite autocomplete
                    groups: baton.model.get('type') === 'invite'
                },
                leftAligned: true
            });

            this.append(
                $('<div class="form-group">').append(
                    $('<label>').attr({ for: guid }).addClass('sr-only').text(gt('Add recipients ...')),
                    tokenfieldView.$el
                )
            );

            tokenfieldView.render();

            // bind collection to share model
            tokenfieldView.collection.on('change add remove sort', function () {
                baton.model.set('recipients', this.toArray(), { silent: true });
            });
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
                $('<div>').addClass('form-group').append(
                    $('<label>').addClass('control-label sr-only').text(gt('Message (optional)')).attr({ for: guid }),
                    new miniViews.TextView({
                        name: 'message',
                        model: baton.model
                    }).render().$el.attr({
                        id: guid,
                        rows: 3,
                        //#. placeholder text in share dialog
                        placeholder: gt('Message (optional)')
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
            var optionGroup = $('<div>').addClass('shareoptions');
            ext.point(POINT + '/options').invoke('draw', optionGroup, baton);
            this.append(optionGroup);
        }
    });

    /*
     * extension point for expires dropdown
     */
    ext.point(POINT + '/options').extend({
        id: 'temporary',
        index: INDEX += 100,
        draw: function (baton) {
            // only available for type link
            if (baton.model.get('type') !== baton.model.TYPES.LINK) return;

            //#. options for terminal element of a sentence starts with "Expires in"
            var typeTranslations = {
                0: gt('one day'),
                1: gt('one week'),
                2: gt('one month'),
                3: gt('three months'),
                4: gt('six months'),
                5: gt('one year')
            };

            // create dropdown
            var dropdown = new Dropdown({ tagName: 'span', model: baton.model, label: typeTranslations[baton.model.get('expires')], caret: true });

            // set dropdown link
            if (baton.model.get('expiry_date')) {
                dropdown.$el.find('.dropdown-label').text(new moment(baton.model.get('expiry_date')).format('L'));
            }

            // add dropdown options
            _(typeTranslations).each(function (val, key) {
                dropdown.option('expires', parseInt(key, 10), val);
            });

            this.append(
                $('<div>').addClass('form-group expiresgroup').append(
                    $('<label>').addClass('checkbox-inline').text(gt('Expires on')).prepend(
                        new miniViews.CheckboxView({ name: 'temporary', model: baton.model }).render().$el
                    ),
                    $.txt(' '),
                    dropdown.render().$el.addClass('dropup')
                )
            );

            baton.model.on('change:expiry_date', function (model, val) {
                dropdown.$el.find('.dropdown-label').text(new moment(val).format('L'));
                model.set('temporary', true);
            });

            baton.model.on('change:expires', function (model) {
                model.set({
                    'temporary': true,
                    'expiry_date': model.getExpiryDate()
                });
            });

        }
    });

    /*
     * extension point for write permissions checkbox
     */
    ext.point(POINT + '/options').extend({
        id: 'write-permissions',
        index: INDEX += 100,
        draw: function (baton) {
            // only available for type invite
            if (baton.model.get('type') !== baton.model.TYPES.INVITE) return;
            this.append(
                $('<div>').addClass('form-group editgroup').append(
                    $('<div>').addClass('checkbox').append(
                        $('<label>').addClass('control-label').text(gt('Recipients can edit')).prepend(
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
                $('<div>').addClass('form-inline passwordgroup').append(
                    $('<div>').addClass('form-group').append(
                        $('<label>').addClass('checkbox-inline').text(gt('Password required')).prepend(
                            new miniViews.CheckboxView({ name: 'secured', model: baton.model }).render().$el
                        )
                    ),
                    $.txt(' '),
                    $('<div>').addClass('form-group').append(
                        $('<label>').addClass('control-label sr-only').text(gt('Enter Password')).attr({ for: guid }),
                        passInput = new miniViews.PasswordView({ name: 'password', model: baton.model })
                            .render().$el
                            .attr({ id: guid, placeholder: gt('Password') })
                            .prop('disabled', !baton.model.get('secured'))
                    )
                )
            );
            baton.view.listenTo(baton.model, 'change:password', function (model, val) {
                if (val && !model.get('secured')) {
                    model.set('secured', true);
                }
            });
            baton.view.listenTo(baton.model, 'change:secured', function (model, val) {
                passInput.prop('disabled', !val);
                if (val) {
                    passInput.focus();
                }
            });
        }
    });

    /*
     * main view
     */
    var ShareWizard = DisposableView.extend({

        tagName: 'form',

        className: 'share-wizard',

        initialize: function (options) {

            this.model = new sModel.WizardShare({ files: options.files, type: options.type });

            this.baton = ext.Baton({
                model: this.model,
                view: this
            });

            this.listenTo(this.model, 'invalid', function (model, error) {
                yell('error', error);
            });

        },

        render: function () {

            this.$el.attr({
                role: 'form'
            }).addClass(this.model.get('type'));

            // draw all extensionpoints
            ext.point(POINT + '/fields').invoke('draw', this.$el, this.baton);

            return this;
        },

        share: function () {
            var def = $.Deferred();
            return $.when(this.model.save()).then(function (res) {
                if (res) {
                    yell('success', gt('Done'));
                    def.resolve(res);
                } else {
                    def.reject();
                }
                return def;
            }, function () {
                yell.apply(this, arguments);
                return def.reject();
            });
        },

        cancel: function () {
            this.model.destroy();
            this.remove();
        }

    });

    return ShareWizard;
});
