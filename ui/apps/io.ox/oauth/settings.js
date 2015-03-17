/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/oauth/settings',
    ['io.ox/core/extensions',
     'io.ox/oauth/keychain',
     'io.ox/keychain/api',
     'io.ox/core/tk/dialogs',
     'gettext!io.ox/settings/oauth'
    ], function (ext, oauthKeychain, keychain, dialogs, gt) {

    'use strict';

    function OAuthAccountDetailExtension(serviceId) {
        this.id = serviceId;

        this.draw = function (args) {
            var $form,
                account = keychain.get(serviceId, args.data.id),
                $displayNameField,
                dialog;

            function closeDialog() {
                if (dialog) {
                    dialog.close();
                    dialog = null;
                }
            }

            function displaySuccess() {
                return function () {
                    // TODO: Once we know how to notify user about results
                    closeDialog();
                };
            }

            function displayError() {
                return function () {
                    // TODO: Once we know how to notify user about results
                };
            }

            function doSave() {
                if (account.displayName !== $displayNameField.val()) {
                    account.displayName = $displayNameField.val();
                    keychain.update(account).done(displaySuccess(gt('Changes have been saved.'))).fail(displayError(gt('Something went wrong saving your changes.')));
                }
                closeDialog();
            }

            function doReauthorize() {
                account.displayName = $displayNameField.val();
                keychain.submodules[serviceId].reauthorize(account).done(displaySuccess(gt('You have reauthorized this account.'))).fail(displayError(gt('Something went wrong reauthorizing the account.')));
            }

            $form = $('<div class="settings-detail-pane">').append(
                $('<legend class="sectiontitle">').text(gt('Account Settings')),
                $('<div class="form-horizontal">').append(
                    $('<div class="control-group">').append(
                        $('<label for="displayName">').text(gt('Display Name')),
                        $('<div class="controls">').append(
                            $displayNameField = $('<input type="text" name="displayName" class="form-control" tabindex="1">').val(account.displayName)
                        )
                    )
                )
            );

            dialog = new dialogs.ModalDialog();
            dialog
                .append($form)
                .addPrimaryButton('save', gt('Save'), 'save', {tabIndex: '1'})
                .addAlternativeButton('reauthorize', gt('Reauthorize'), 'reauthorize', {tabIndex: '1'})
                .addButton('cancel', gt('Cancel'), 'cancel', {tabIndex: '1'})
                .show()
                .done(function (action) {
                    if (action === 'save') {
                        doSave();
                    } else if (action === 'reauthorize') {
                        doReauthorize();
                    }
                });
        };
    }

    _(oauthKeychain.serviceIDs).each(function (serviceId) {
        ext.point('io.ox/settings/accounts/' + serviceId + '/settings/detail').extend(new OAuthAccountDetailExtension(serviceId));
    });

    return {};
});
