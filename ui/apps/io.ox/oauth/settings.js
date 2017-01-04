/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/oauth/settings', [
    'io.ox/core/extensions',
    'io.ox/oauth/keychain',
    'io.ox/oauth/backbone',
    'io.ox/backbone/mini-views/settings-list-view',
    'io.ox/settings/accounts/views',
    'io.ox/keychain/api',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/settings'
], function (ext, oauthKeychain, OAuth, ListView, AccountViews, keychain, dialogs, gt) {

    'use strict';

    function OAuthAccountDetailExtension(serviceId) {
        this.id = serviceId;

        this.draw = function (args) {
            var $form,
                account = oauthKeychain.accounts.get(args.data.id),
                $displayNameField,
                dialog,
                relatedAccountsView = new ListView({
                    tagName: 'ul',
                    childView: AccountViews.ListItem,
                    collection: new Backbone.Collection()
                });

            account.fetchRelatedAccounts().then(function (accounts) {
                relatedAccountsView.collection.push(accounts);
            });

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
                account.set('displayName', $displayNameField.val());
                account.save()
                    .then(displaySuccess(gt('Changes have been saved.')), displayError(gt('Something went wrong saving your changes.')));
                closeDialog();
            }

            function doReauthorize() {
                account.set('displayName', $displayNameField.val());
                account.save()
                    .then(displaySuccess(gt('You have reauthorized this account.')), displayError(gt('Something went wrong reauthorizing the account.')));
            }

            $form = $('<div class="settings-detail-pane">').append(
                $('<legend class="sectiontitle">').text(gt('OAuth application overview')),
                $('<div class="form-horizontal">').append(
                    $('<div class="control-group">').append(
                        $('<label for="displayName">').text(gt('Display Name')),
                        $('<div class="controls">').append(
                            $displayNameField = $('<input type="text" name="displayName" class="form-control">').val(account.get('displayName'))
                        )
                    ),
                    $('<div class="control-group">').append(
                        $('<label>').text(gt('Related accounts')),
                        $('<div class="controls">').append(
                            relatedAccountsView.render().$el
                        )
                    )
                )
            );

            dialog = new dialogs.ModalDialog();
            dialog
                .append($form)
                .addPrimaryButton('save', gt('Save'), 'save')
                .addAlternativeButton('reauthorize', gt('Reauthorize'), 'reauthorize')
                .addButton('cancel', gt('Cancel'), 'cancel')
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
