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

define('io.ox/files/share/public-link', [
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
    'settings!io.ox/contacts',
    'io.ox/core/capabilities',
    'io.ox/backbone/mini-views/addresspicker',
    'io.ox/backbone/mini-views/copy-to-clipboard',
    'static/3rd.party/polyfill-resize.js',
    'less!io.ox/files/share/style'
], function (ModalDialog, DisposableView, ext, api, sModel, miniViews, Dropdown, contactsAPI, groupApi, Tokenfield, yell, settingsUtil, gt, settingsContacts, capabilities, AddressPickerView, CopyToClipboard) {

    'use strict';

    var INDEX = 0,
        POINT = 'io.ox/files/share/public-link';

    /*
     * extension point title text
     */
    ext.point(POINT + '/fields').extend({
        id: 'title',
        index: INDEX += 100,
        draw: function () {
            this.append(
                $('<h5></h5>').text(gt('Public link'))
            );
        }
    });

    /*
     * extension point title text
     */
    ext.point(POINT + '/fields').extend({
        id: 'public-link-row',
        index: INDEX += 100,
        draw: function (baton) {
            var link = baton.model.get('url', ''),
                formID = _.uniqueId('copy-pl-to-clipboard-');
            this.append(
                $('<input type="text" class="public-link-url-input">').attr('id', formID).val(link),
                $('<div class="row"></div>')
                .append(
                    $('<div class="col-sm-1 col-xs-2 text-center"><i class="fa fa-link" aria-hidden="true"></i></div>'),
                    $('<div class="col-sm-9 col-xs-6"></div>').text(gt('Anyone on the internet with link can view the file.')),
                    $('<div class="col-sm-2 col-xs-4 text-right"></div>').append(new CopyToClipboard({ targetId: '#' + formID, buttonStyle: 'link', buttonLabel: gt('Copy link') }).render().$el)
                )
            );
        }
    });

    /*
     * main view
     */
    var PublicLink = DisposableView.extend({

        className: 'public-link',

        initialize: function (options) {

            this.model = new sModel.WizardShare({ files: options.files });

            this.baton = ext.Baton({ model: this.model, view: this });

            this.listenTo(this.model, 'invalid', function (model, error) {
                yell('error', error);
            });
        },

        render: function () {
            this.$el.addClass(this.model.get('type'));
            // draw extensionpoints
            ext.point(POINT + '/fields').invoke('draw', this.$el, this.baton);
            return this;
        },

        showSettingsDialog: function () {
            var dialog = new ModalDialog({
                async: true,
                focus: '.link-group>input[type=text]',
                title: 'Settings',
                point: 'io.ox/files/actions/share-link-settings',
                help: 'ox.appsuite.user.sect.dataorganisation.sharing.link.html',
                smartphoneInputFocus: true,
                width: 600
            });
            dialog
            .addCancelButton()
            .addButton({ label: gt('Save'), action: 'cancel' });
            //ext.point(POINT_SETTINGS + '/settings').invoke('draw', dialog.$body, this.baton);
            dialog.open();
        },

        share: function () {
            // we might have new addresses
            contactsAPI.trigger('maybeNewContact');
            var result;

            // Bug 52046: When the password checkbox is enable and the password could not be validated (e.g. it's empty) in the set function from the model,
            // we have the previous, not up-to-date model data, but also an validationError to indicate that there was a error.
            // So the validation in the save function would work with the old model data. Therefore don't call save() when there
            // is an validationError, because it would work with an old model.
            if (this.model.get('secured') && _.isString(this.model.validationError)) {
                // reject so that the dialog is not closed later and pass the yell message for the fail handler
                result = $.Deferred().reject('error', this.model.validationError);

            } else {
                // function 'save' returns a jqXHR if validation is successful and false otherwise (see backbone api)
                result = this.model.save();

                //  to unify the return type for later functions, we must return a deferred
                if (result === false) {
                    // no yell message needed, therefore return directly, the yell is called in the save function above
                    return $.Deferred().reject();
                }
            }

            return result.fail(yell);

        },

        removeLink: function () {
            var model = this.model;
            return api.deleteLink(model.toJSON(), model.get('lastModified'))
                .done(function () {
                    // refresh the guest group (id = int max value)
                    groupApi.refreshGroup(2147483647);
                })
                .done(model.destroy.bind(model));
        },

        hide: function () {
            this.$el.hide();
        },

        show: function () {
            this.$el.show();
        },

        isVisible: function () {
            return this.$el.is(':visible');
        },

        showLink: function () {
            this.$el.find('.help-block').show();
            this.$el.find('.link-group').show();
        },

        hideLink: function () {
            this.$el.find('.help-block').hide();
            this.$el.find('.link-group').hide();
        },

        showSettings: function () {
            this.$el.find('.shareoptions').show();
            this.$el.find('.recipients').show();
            this.$el.find('.message').show();
            this.showSettingsDialog();
        },

        hideSettingsLink: function () {
            this.$el.find('.share-link-setting').hide();
        },

        showSettingsLink: function () {
            this.$el.find('.share-link-setting').show();
        },

        hideSettings: function () {
            this.$el.find('.shareoptions').hide();
            this.$el.find('.recipients').hide();
            this.$el.find('.message').hide();
        },

        areSettingsVisible: function () {
            return this.$el.find('.shareoptions').is(':visible');
        }
    });

    return PublicLink;
});
