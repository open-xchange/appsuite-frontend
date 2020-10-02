/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Lars Behrmann <lars.behrmann@open-xchange.com>
 */

define('io.ox/files/share/share-settings', [
    'io.ox/backbone/views/modal',
    'io.ox/backbone/views/disposable',
    'io.ox/core/extensions',
    'io.ox/files/share/api',
    'io.ox/files/share/model',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/contacts/api',
    'io.ox/core/api/group',
    'io.ox/core/tk/tokenfield',
    'io.ox/core/yell',
    'io.ox/core/settings/util',
    'gettext!io.ox/files',
    'io.ox/core/folder/util',
    'static/3rd.party/polyfill-resize.js',
    'less!io.ox/files/share/style'
], function (ModalDialog, DisposableView, ext, api, sModel, miniViews, Dropdown, contactsAPI, groupApi, Tokenfield, yell, settingsUtil, gt, util) {

    'use strict';

    var INDEX = 0,
        POINT_SETTINGS = 'io.ox/files/share/share-settings';

    /*
     * extension point public link title text
     */
    ext.point(POINT_SETTINGS + '/settings').extend({
        id: 'title',
        index: INDEX += 100,
        draw: function () {
            this.append(
                $('<h5></h5>').text(gt('Link options'))
            );
        }
    });
    /*
     * extension point for expires dropdown
     */
    ext.point(POINT_SETTINGS + '/settings').extend({
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

            // create dropdown
            var dropdown = new Dropdown({ tagName: 'span', model: baton.model, label: typeTranslations[baton.model.get('expires')], caret: true });

            // add dropdown options
            _(typeTranslations).each(function (val, key) {
                dropdown.option('expires', parseInt(key, 10), val);
            });

            this.append($('<div class="form-inline">').append($('<div class="form-group expiresgroup">').append(
                settingsUtil.checkbox('temporary', gt('Expires in'), baton.model).on('change', function (e) {
                    var input = e.originalEvent.srcElement;
                    baton.model.set('temporary', input.checked);
                }),
                $.txt(' '),
                dropdown.render().$el.addClass('dropup')
            )));

            baton.model.on('change:expiry_date', function (model, val) {
                dropdown.$el.find('.dropdown-label').text(new moment(val).format('L'));
                dropdown.$el.closest('.expiresgroup').find('span.caption>span').text(gt('Expires on'));
                model.set('temporary', true);
            });

            baton.model.on('change:expires', function (model) {
                if (baton.model.get('expires') !== null) {
                    model.set({
                        'temporary': true,
                        'expiry_date': model.getExpiryDate()
                    });
                }
            });

            if (baton.model.get('expiry_date')) {
                baton.model.set('expires', null);
            }

            // set dropdown link
            if (baton.model.get('expiry_date')) {
                dropdown.$el.find('.dropdown-label').text(new moment(baton.model.get('expiry_date')).format('L'));
            }
        }
    });
    /*
     * extension point for password protection
     */
    ext.point(POINT_SETTINGS + '/settings').extend({
        id: 'secured',
        index: INDEX += 100,
        draw: function (baton) {
            var guid, passContainer;

            this.append($('<div class="form-inline passwordgroup">').append(
                $('<div class="form-group">').append(
                    settingsUtil.checkbox('secured', gt('Password required'), baton.model).on('change', function (e) {
                        var input = e.originalEvent.srcElement;
                        baton.model.set('secured', input.checked);
                    })
                ),
                $.txt(' '),
                $('<div class="form-group">').append(
                    $('<label class="control-label sr-only">').text(gt('Enter Password')).attr({ for: guid = _.uniqueId('form-control-label-') }),
                    passContainer = new miniViews.PasswordViewToggle({ name: 'password', model: baton.model, autocomplete: false })
                        .render().$el.find('input')
                        // see bug 49639
                        .attr({ id: guid, placeholder: gt('Password') })
                        .removeAttr('name')
                        .prop('disabled', !baton.model.get('secured'))
                        .end()
                )
            ));

            baton.view.listenTo(baton.model, 'change:password', function (model, val, options) {
                if (val && !model.get('secured')) {
                    model.set('secured', true, options);
                }
            });
            baton.view.listenTo(baton.model, 'change:secured', function (model, val, opt) {
                var passInput = passContainer.find('input');
                passInput.prop('disabled', !val);
                passContainer.prop('disabled', !val);
                if (!opt._inital) passInput.focus();
            });
            baton.model.once('change', function (model) {
                var passInput = passContainer.find('input'),
                    state = false;
                if (model.get('password')) {
                    state = true;
                }
                model.set('secured', state);
                passInput.prop('disabled', !state);
                passContainer.prop('disabled', !state);
            });
        }
    });
    /*
     * extension point for allowance of subfolder access
     *
     * see SoftwareChange Request SCR-97: [https://jira.open-xchange.com/browse/SCR-97]
     */
    ext.point(POINT_SETTINGS + '/settings').extend({
        id: 'includeSubfolders',
        index: INDEX += 100,
        draw: function (baton) {
            var isDrive = _(baton.model.get('files')).every(function (model) {
                return !model.isFolder() || util.is('drive', model.attributes);
            });
            if (!isDrive || !baton.model.attributes || !baton.model.attributes.files) {
                return baton.model.set('includeSubfolders', false, { silent: true });
            }
            var onlyFiles = true;
            _.each(baton.model.attributes.files, function (model) {
                if (model.isFolder()) {
                    onlyFiles = false;
                }
            });
            if (onlyFiles) return;

            this.append($('<div class="form-inline">').append($('<div class="form-group">').append(
                settingsUtil.checkbox('includeSubfolders', gt('Share with subfolders'), baton.model).on('change', function (e) {
                    var input = e.originalEvent.srcElement;
                    baton.model.set('includeSubfolders', input.checked);
                })
            )));

            baton.model.once('change', function (model) {
                var isNewLink = model.get('is_new'),
                    state = false;

                if (isNewLink === true) {
                    state = isNewLink;
                    model.set('includeSubfolders', state);
                } else {
                    state = model.get('includeSubfolders');
                }
            });
        }
    });
    /* Begin of permission options */
    var DialogConfigModel = Backbone.Model.extend({
        defaults: {
            // default is true for nested and false for flat folder tree, #53439
            cascadePermissions: true,
            message: '',
            sendNotifications: false,
            disabled: false
        },
        toJSON: function () {
            var data = {
                cascadePermissions: this.get('cascadePermissions'),
                notification: { transport: 'mail' }
            };

            if (dialogConfig.get('sendNotifications')) {
                // add personal message only if not empty
                // but always send notification!
                if (this.get('message') && $.trim(this.get('message')) !== '') {
                    data.notification.message = this.get('message');
                }
            } else {
                delete data.notification;
            }
            return data;
        }
    });
    var dialogConfig = new DialogConfigModel();
    /*
     * extension point invite options title text
     */
    ext.point(POINT_SETTINGS + '/settings').extend({
        id: 'invite-options-title',
        index: INDEX += 100,
        draw: function () {
            this.append(
                $('<h5></h5>').text(gt('Invite options'))
            );
        }
    });
    /*
     * extension point invite options send email
     */
    ext.point(POINT_SETTINGS + '/settings').extend({
        id: 'inviteptions-send-email',
        index: INDEX += 100,
        draw: function () {
            this.append(
                $('<div class="form-group">').addClass(_.device('smartphone') ? '' : 'cascade').append(
                    settingsUtil.checkbox('sendNotifications', gt('Send notification by email'), dialogConfig).on('change', function (e) {
                        var input = e.originalEvent.srcElement;
                        dialogConfig.set('byHand', input.checked);
                    })
                )
            );
        }
    });
    /*
     * extension point invite options include subfolder
     */
    ext.point(POINT_SETTINGS + '/settings').extend({
        id: 'inviteptions-cascade-permissions',
        index: INDEX += 100,
        draw: function () {
            this.append(
                $('<div class="form-group">').addClass(_.device('smartphone') ? '' : 'cascade').append(
                    settingsUtil.checkbox('cascadePermissions', gt('Apply to all subfolders'), dialogConfig).on('change', function (e) {
                        var input = e.originalEvent.srcElement;
                        dialogConfig.set('cascadePermissions', input.checked);
                    })
                )
            );
        }
    });
    /*
     * main view
     */
    var ShareSettingsView = DisposableView.extend({

        className: 'share-wizard',

        initialize: function (options) {

            this.model = options.model;

            this.baton = ext.Baton({ model: this.model, view: this });

            this.listenTo(this.model, 'invalid', function (model, error) {
                yell('error', error);
            });
        },

        render: function () {
            this.$el.addClass(this.model.get('type'));
            ext.point(POINT_SETTINGS + '/settings').invoke('draw', this.$el, this.baton);
            return this;
        }
    });

    return {
        ShareSettingsView: ShareSettingsView,
        showSettingsDialog: function (shareSettingsView) {
            var dialog = new ModalDialog({
                async: true,
                focus: '.link-group>input[type=text]',
                title: 'Settings',
                smartphoneInputFocus: true
            });
            dialog
            .addCancelButton()
            .addButton({ label: gt('Save'), action: 'save' });
            dialog.on('save', function () {
                shareSettingsView.trigger('changePublicLinkSettings', shareSettingsView.model);
                dialog.close();
            });
            dialog.$body.append(shareSettingsView.render().$el);
            dialog.open();
        }
    };
});
