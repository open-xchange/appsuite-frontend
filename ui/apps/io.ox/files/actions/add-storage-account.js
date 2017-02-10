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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 *
 */

define('io.ox/files/actions/add-storage-account', [
    'io.ox/core/tk/dialogs',
    'io.ox/metrics/main',
    'io.ox/core/yell',
    'io.ox/core/a11y',
    'gettext!io.ox/files',
    // must be required here or popupblocker blocks the window while we require files
    'io.ox/oauth/keychain',
    'io.ox/core/api/filestorage',
    'io.ox/oauth/backbone'
], function (dialogs, metrics, yell, a11y, gt, oauthAPI, filestorageApi, OAuth) {

    'use strict';

    function createAccount(service) {
        var account = oauthAPI.accounts.forService(service.id).filter(function (account) {
            return !account.hasScopes('drive');
        })[0] || new OAuth.Account.Model({
            serviceId: service.id,
            //#. %1$s is the display name of the account
            //#. e.g. My Xing account
            displayName: gt('My %1$s account', service.get('displayName'))
        });

        // if only the filestorage account is missing there is no need for Oauth authorization.
        if (oauthAPI.accounts.forService(service.id)[0] && _(account.attributes.enabledScopes).contains('drive') && !filestorageApi.getAccountForOauth(account.attributes)) {
            return filestorageApi.createAccountFromOauth(account.attributes).done(function () {
                yell('success', gt('Account added successfully'));
            }).fail(function (e) {
                if (e) {
                    yell(e);
                    return;
                }
                yell('error', gt('Account could not be added'));
            });
        }

        return account.enableScopes('drive').save().then(function (res) {
            // add new account after it has been created succesfully
            oauthAPI.accounts.add(account);
            return filestorageApi.createAccountFromOauth(res);
        }).then(function () {
            yell('success', gt('Account added successfully'));
        });
    }

    function drawContent() {

        var dialog = this,
            availableServices = oauthAPI.services.filter(function (service) {
                return _(service.get('availableScopes')).contains('drive') && _(filestorageApi.isStorageAvailable()).indexOf(service.id) >= 0;
            }),
            view = new OAuth.Views.ServicesListView({
                collection: new Backbone.Collection(availableServices)
            });
        view.listenTo(view, 'select', function (service) {
            createAccount(service).always(function () {
                view.trigger('done');
            });
        });
        view.listenTo(view, 'done', function () {
            view.stopListening();
            view = null;
            dialog.close();
        });

        // consider metrics
        if (metrics.isEnabled()) {
            view.listenTo(view, 'select', function (service) {
                metrics.trackEvent({
                    app: 'drive',
                    target: 'folder/account/add',
                    type: 'click',
                    action: service.get('id') || 'unknown'
                });
            });
        }

        dialog.getContentNode().append(
            view.render().$el
        );
    }

    return function () {
        return new dialogs.ModalDialog({ width: 633 })
            .header($('<h4>').text(gt('Add storage account')))
            .addPrimaryButton('close', gt('Close'), 'close')
            .build(drawContent)
            .show(function () {
                a11y.getTabbable(this).first().focus();
            });
    };
});
