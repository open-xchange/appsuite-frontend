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
    'io.ox/backbone/mini-views',
    'io.ox/core/yell',
    'io.ox/core/settings/util',
    'gettext!io.ox/files',
    'io.ox/core/folder/util',
    'static/3rd.party/polyfill-resize.js',
    'less!io.ox/files/share/style'
], function (ModalDialog, DisposableView, ext, miniViews, yell, settingsUtil, gt, util) {

    'use strict';

    var INDEX = 0,
        POINT_SETTINGS = 'io.ox/files/share/share-settings';

    /*
     * Extension point for public link title text
     */
    ext.point(POINT_SETTINGS + '/settings-public-link').extend({
        id: 'title',
        index: INDEX += 100,
        draw: function () {
            this.append(
                $('<h5></h5>').text(gt('Link options'))
            );
        }
    });

    /*
     * Extension point for public link expires dropdown
     */
    ext.point(POINT_SETTINGS + '/settings-public-link').extend({
        id: 'temporary',
        index: INDEX += 100,
        draw: function (baton) {
            var dataId = 'data-expire-date';
            var guid = _.uniqueId('form-control-label-');

            //#. options for terminal element of a sentence starts with "Expires in"
            var typeTranslations = {
                0: gt('One day'),
                1: gt('One week'),
                2: gt('One month'),
                3: gt('Three months'),
                4: gt('Six months'),
                5: gt('One year'),
                6: gt('Never')
            };

            var select = $('<select>');
            _(typeTranslations).each(function (val, key) {
                key = parseInt(key, 10);
                var option = $('<option>').val(key).text(val);
                select.append(option);
            });

            if (!baton.view.hasPublicLink) {
                this.append($('<div>').append(
                    $('<label></label>').attr({ for: guid }).text(gt('Expiration')),
                    $('<div>').addClass('row vertical-align-center').append($('<div>').addClass('form-group col-sm-12').append(select.attr('id', guid).attr('disabled', true)))
                ));
                return;
            }

            this.append(
                $('<div>').append(
                    $('<label>').attr({ for: guid = _.uniqueId('form-control-label-') }).text(gt('Expiration')),
                    $('<div>').addClass('row vertical-align-center').append($('<div>').addClass('form-group col-sm-12').append(select.attr('id', guid)))
                )
            );

            baton.model.on('change:expiry_date', function (model, val) {
                if (baton.model.get('expires') !== null && baton.model.get('expires') !== '6') {
                    var optionSelected = select.find('option:selected');
                    optionSelected.removeAttr('selected');
                    var option = select.find('option[' + dataId + ']');
                    if (option.length === 0) {
                        option = $('<option>')
                        .attr(dataId, 'true');
                        select.append($('<optgroup>').append(option));
                    }
                    option.val(baton.model.get('expiry_date')).attr('selected', 'true').text(new moment(val).format('L'));
                    setTimeout(function () {
                        select.val(baton.model.get('expiry_date'));
                        model.set('temporary', true);
                    }, 10);
                } else {
                    // Expired option is Never
                    model.set('temporary', false);
                    model.set('expiry_date', null);
                    select.find('.option:selected').text(typeTranslations[6]);
                }
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

            if (baton.model.get('expiry_date')) {
                var option = $('<option>')
                    .val(baton.model.get('expiry_date'))
                    .attr('selected', 'selected')
                    .attr(dataId, 'true')
                    .text(new moment(baton.model.get('expiry_date')).format('L'));
                select.append($('<optgroup>').append(option));
                //select.find('.option:selected').text(new moment(baton.model.get('expiry_date')).format('L'));
            } else {
                select.find('option[value="6"]').attr('selected', 'true');
            }

            select.on('change', function (e) {
                baton.model.set('expires', e.target.value);
            });
        }
    });

    /**
     * Extension point for public link password
     */
    ext.point(POINT_SETTINGS + '/settings-public-link').extend({
        id: 'password',
        index: INDEX += 100,
        draw: function (baton) {
            var guid;

            this.append(
                $('<div>').append(
                    $('<h5>').addClass('password').text(gt('Password (optional)'))
                ),
                $.txt(' '),
                $('<div class="form-group">').append(
                    $('<label class="control-label sr-only">').text(gt('Enter Password')).attr({ for: guid = _.uniqueId('form-control-label-') }),
                    new miniViews.PasswordViewToggle({ name: 'password', model: baton.model, autocomplete: false })
                        .render().$el.find('input')
                        // see bug 49639
                        .attr({ id: guid, placeholder: gt('Password') })
                        .removeAttr('name')
                        .prop('disabled', !baton.view.hasPublicLink)
                        .end()
                )
            );
        }
    });

    /*
     * Extension point for public link allowance of subfolder access
     *
     * see SoftwareChange Request SCR-97: [https://jira.open-xchange.com/browse/SCR-97]
     */
    ext.point(POINT_SETTINGS + '/settings-invite-people').extend({
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
                settingsUtil.checkbox('includeSubfolders', gt('Share with subfolders'), baton.model).addClass((!baton.view.hasPublicLink) ? 'disabled' : '').on('change', function (e) {
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

            if (!baton.view.hasPublicLink) {
                this.find('input').prop('checked', baton.view.hasPublicLink).attr('disabled', 'disabled');
            }
        }
    });

    // /* Begin of permission options */
    // var DialogConfigModel = Backbone.Model.extend({
    //     defaults: {
    //         // default is true for nested and false for flat folder tree, #53439
    //         cascadePermissions: true,
    //         message: '',
    //         sendNotifications: false,
    //         disabled: false
    //     },
    //     toJSON: function () {
    //         var data = {
    //             cascadePermissions: this.get('cascadePermissions'),
    //             notification: { transport: 'mail' }
    //         };

    //         if (dialogConfig.get('sendNotifications')) {
    //             // add personal message only if not empty
    //             // but always send notification!
    //             if (this.get('message') && $.trim(this.get('message')) !== '') {
    //                 data.notification.message = this.get('message');
    //             }
    //         } else {
    //             delete data.notification;
    //         }
    //         return data;
    //     }
    // });
    // var dialogConfig = new DialogConfigModel();

    /*
     * Extension point for invite people options title text
     */
    ext.point(POINT_SETTINGS + '/settings-invite-people').extend({
        id: 'invite-options-title',
        index: INDEX += 100,
        draw: function () {
            this.append(
                $('<h5></h5>').text(gt('Invite options'))
            );
        }
    });

    /*
     * Extension point for invite people options send notification email
     */
    ext.point(POINT_SETTINGS + '/settings-invite-people').extend({
        id: 'inviteptions-send-email',
        index: INDEX += 100,
        draw: function (baton) {
            this.append(
                $('<div>').addClass(_.device('smartphone') ? '' : 'cascade').append(
                    settingsUtil.checkbox('sendNotifications', gt('Send notification by email'), baton.dialogConfig).on('change', function (e) {
                        var input = e.originalEvent.srcElement;
                        baton.dialogConfig.set('byHand', input.checked);
                    }).prop('disabled', baton.dialogConfig.get('disabled'))
                )
            );
            this.find('[name="sendNotifications"]').prop('disabled', baton.dialogConfig.get('disabled'));
        }
    });

    /*
     * extension point for invite people options include subfolder
     */
    ext.point(POINT_SETTINGS + '/settings-invite-people').extend({
        id: 'inviteptions-cascade-permissions',
        index: INDEX += 100,
        draw: function (baton) {
            if (baton.view.applyToSubFolder) {
                this.append(
                    $('<div class="form-group">').addClass(_.device('smartphone') ? '' : 'cascade').append(
                        settingsUtil.checkbox('cascadePermissions', gt('Apply to all subfolders'), baton.dialogConfig).on('change', function (e) {
                            var input = e.originalEvent.srcElement;
                            baton.dialogConfig.set('cascadePermissions', input.checked);
                        })
                    )
                );
            }
        }
    });

    /*
     * main view
     */
    var ShareSettingsView = DisposableView.extend({

        className: 'share-wizard',
        hasLinkSupport: true,
        applyToSubFolder: false,
        isFolder: false,

        initialize: function (options) {

            this.model = options.model.model;
            this.hasPublicLink = options.model.hasPublicLink();
            this.hasLinkSupport = options.hasLinkSupport;
            this.applyToSubFolder = options.applyToSubFolder;
            this.baton = ext.Baton({ model: this.model, view: this, dialogConfig: options.dialogConfig });

            this.listenTo(this.model, 'invalid', function (model, error) {
                yell('error', error);
            });
        },

        render: function () {
            this.$el.addClass(this.model.get('type'));
            if (this.hasLinkSupport) {
                ext.point(POINT_SETTINGS + '/settings-public-link').invoke('draw', this.$el, this.baton);
            }
            ext.point(POINT_SETTINGS + '/settings-invite-people').invoke('draw', this.$el, this.baton);
            return this;
        }
    });

    return {
        ShareSettingsView: ShareSettingsView,
        showSettingsDialog: function (shareSettingsView) {
            var dialog = new ModalDialog({
                async: true,
                title: 'Sharing options',
                width: 350,
                smartphoneInputFocus: true
            });
            dialog
            .addCancelButton()
            .addButton({ label: gt('Save'), action: 'save' });
            dialog.on('save', function () {
                dialog.close();
            });
            dialog.$body.append(shareSettingsView.render().$el);
            dialog.$body.addClass('share-options');
            dialog.open();
        }
    };
});
