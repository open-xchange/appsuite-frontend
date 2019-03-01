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
    'io.ox/backbone/views/modal',
    'io.ox/metrics/main',
    'io.ox/core/yell',
    'gettext!io.ox/files',
    // must be required here or popupblocker blocks the window while we require files
    'io.ox/oauth/keychain',
    'io.ox/core/api/filestorage',
    'io.ox/oauth/backbone'
], function (ModalDialog, metrics, yell, gt, oauthAPI, filestorageApi, OAuth) {

    'use strict';

    function createAccount(service) {
        var account = new OAuth.Account.Model({
            serviceId: service.id,
            displayName: oauthAPI.chooseDisplayName(service)
        });

        // if only the filestorage account is missing there is no need for Oauth authorization.
        if (oauthAPI.accounts.forService(service.id)[0] && _(account.attributes.enabledScopes).contains('drive') && !filestorageApi.getAccountForOauth(account.attributes)) {
            return filestorageApi.createAccountFromOauth(account.attributes).done(function () {
                yell('success', gt('Account added successfully'));
            });
        }

        return account.enableScopes('drive').save().then(function (res) {
            require('io.ox/core/folder/api').once('pool:add', function () {
                // fetch account again - there should be new "associations" for this account
                var a = oauthAPI.accounts.get(res.id);
                if (a) a.fetch();
            });

            return filestorageApi.createAccountFromOauth(res);
        }).then(function () {
            yell('success', gt('Account added successfully'));
        });
    }

    function drawContent() {

        var dialog = this,
            availableServices = oauthAPI.services.filter(function (service) {
                return service.canAdd({ scopes: ['drive'] }) && filestorageApi.isStorageAvailable(service.id);
            }),
            view = new OAuth.Views.ServicesListView({
                collection: new Backbone.Collection(availableServices)
            });
        view.listenTo(view, 'select', function (service) {
            createAccount(service).fail(function (e) {
                if (e && e.code === 'EEXISTS') {
                    //#. error message shown to the user after trying to create a duplicate account
                    yell('error', gt('Account already exists'));
                } else if (e) {
                    yell(e);
                } else {
                    yell('error', gt('Account could not be added'));
                }
            }).always(function () {
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

        dialog.$body.append(view.render().$el);
    }

    return function () {
        return new ModalDialog({ title: gt('Add storage account'), width: 576 })
            .addButton({ label: gt('Close'), action: 'close' })
            .build(drawContent)
            .open();
    };
});
