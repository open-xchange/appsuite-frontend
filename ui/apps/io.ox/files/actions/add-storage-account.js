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

    var defaultNames = {
        'com.openexchange.oauth.google': 'Google Drive',
        'com.openexchange.oauth.boxcom': 'Box Drive',
        'com.openexchange.oauth.dropbox': 'Dropbox',
        'com.openexchange.oauth.microsoft.graph': 'OneDrive'
    };

    function createAccount(service) {
        var account = new OAuth.Account.Model({
                serviceId: service.id,
                displayName: oauthAPI.chooseDisplayName(service)
            }),
            options = {};
        //#. Folder name for an external file storage (dropbox, google drive etc)
        //#. %1$s - the name of the file storage service (dropbox, one drive, google drive, box drive)
        if (defaultNames[service.id]) options.displayName = gt('My %1$s', defaultNames[service.id]);

        // if only the filestorage account is missing there is no need for Oauth authorization.
        if (oauthAPI.accounts.forService(service.id)[0] && _(account.attributes.enabledScopes).contains('drive') && !filestorageApi.getAccountForOauth(account.attributes)) {
            return filestorageApi.createAccountFromOauth(account.attributes, options).done(function () {
                yell('success', gt('Account added successfully'));
            });
        }

        return account.enableScopes('drive').save().then(function (res) {
            require('io.ox/core/folder/api').once('pool:add', function () {
                // fetch account again - there should be new "associations" for this account
                var a = oauthAPI.accounts.get(res.id);
                if (a) a.fetch();
            });

            return filestorageApi.createAccountFromOauth(res, options);
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

        _.each(this.options.caps, function (cap) {
            filestorageApi.getService(cap).done(function (data) {
                view.collection.add([{ id: data.attributes.id, displayName: data.attributes.displayName, type: 'basicAuthentication' }]);
            });
        });

        view.listenTo(view, 'select', function (service) {
            if (service.get('type') === 'basicAuthentication') {
                ox.load(['io.ox/files/actions/basic-authentication-account']).done(function (add) {
                    add('create', service).always(function () {
                        view.trigger('done');
                    });
                });
            } else {
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
            }

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

    return function (caps) {
        return new ModalDialog({
            title: gt('Add storage account'),
            width: 576,
            caps: caps })
            .addButton({ label: gt('Close'), action: 'close' })
            .build(drawContent)
            .open();
    };
});
