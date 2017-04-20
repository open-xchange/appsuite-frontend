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
 */

define('io.ox/files/actions/add-storage-account', [
    'io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'io.ox/metrics/main',
    'io.ox/core/yell',
    'gettext!io.ox/files',
    // must be required here or popupblocker blocks the window while we require files
    'io.ox/oauth/keychain',
    'io.ox/core/api/filestorage',
    'io.ox/oauth/backbone'
], function (ext, dialogs, metrics, yell, gt, oauthAPI, filestorageApi, OAuth) {

    'use strict';

    var services = {
        'google': {
            title: gt('Google Drive'),
            className: 'logo-google'
        },
        'dropbox': {
            title: gt('Dropbox'),
            className: 'logo-dropbox'
        },
        'boxcom': {
            title: gt('Box'),
            className: 'logo-boxcom'
        },
        msliveconnect: {
            title: gt('OneDrive'),
            className: 'logo-onedrive'
        }
    };

    ext.point('io.ox/files/storage-accounts/list').invoke('customize', services);

    function needsOAuthScope(accounts) {
        return accounts.reduce(function (acc, account) {
            return acc || (_(account.availableScopes).contains('drive') && !_(account.enabledScopes).contains('drive'));
        }, false);
    }

    // returns true if Oauth account with available and enabled scope is there but filestorage account is missing
    function onlyNeedsFilestorageAccount(accounts) {
        return accounts.reduce(function (acc, account) {
            return acc || (_(account.availableScopes).contains('drive') && _(account.enabledScopes).contains('drive') && !filestorageApi.getAccountForOauth(account));
        }, false);
    }

    function getAvailableServices() {
        return require(['io.ox/keychain/api']).then(function (keychainApi) {
            var availableFilestorageServices = _(filestorageApi.isStorageAvailable()).map(function (service) { return service.match(/\w*?$/)[0]; });
            return _(keychainApi.submodules).filter(function (submodule) {
                if (!services[submodule.id]) return false;
                // we need support for both accounts, Oauth accounts and filestorage accounts.
                return (!_.isFunction(submodule.canAdd) || submodule.canAdd({ scopes: ['drive'] }) || needsOAuthScope(submodule.getAll()) || onlyNeedsFilestorageAccount(submodule.getAll())) && availableFilestorageServices.indexOf(submodule.id) >= 0;
            });
        });
    }

    function onClick(e) {
        e.preventDefault();
        $(this).tooltip('destroy');
        e.data.dialog.close();
        var service = oauthAPI.services.withShortId(e.data.service.id),
            account = oauthAPI.accounts.forService(service.id)[0] || new OAuth.Account.Model({
                serviceId: service.id,
                displayName: 'My ' + service.get('displayName') + ' account'
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

        account.enableScopes('drive').save().then(function (res) {
            // add new account after it has been created succesfully
            oauthAPI.accounts.add(account);
            return filestorageApi.createAccountFromOauth(res);
        }).then(function () {
            yell('success', gt('Account added successfully'));
        });
    }

    function drawLink(service) {

        var data = services[service.id];

        return $('<button class="btn btn-default storage-account-item">')
            .addClass(data.className)
            .append(
                $('<div class="icon">'),
                $('<span>').text(data.title)
            )
            .attr({
                'data-service': service.id,
                //#. %1$s is the account name like Dropbox, Google Drive, or OneDrive
                'aria-label': gt('Add %1$s account', data.title)
            })
            .on('click', { dialog: this, service: service }, onClick);
    }

    function drawContent(node) {

        // consider metrics
        if (metrics.isEnabled()) {
            node.delegate('.storage-account-item', 'mousedown', function (e) {
                metrics.trackEvent({
                    app: 'drive',
                    target: 'folder/account/add',
                    type: 'click',
                    action: $(e.currentTarget).attr('data-service') || 'unknown'
                });
            });
        }

        var draw = drawLink.bind(this);

        return getAvailableServices().done(function (availableServices) {
            node.append(_(availableServices).map(draw)).show();
        });
    }

    return function () {

        var def, dialog;

        dialog = new dialogs.ModalDialog({ width: 506 })
            .header($('<h4>').text(gt('Add storage account')))
            .addPrimaryButton('close', gt('Close'), 'close')
            .build(function () {
                this.getPopup().addClass('select-storage-account-dialog');
                def = drawContent.call(this, this.getContentNode());
            });

        def.done(function () {
            dialog.show();
            dialog = def = null;
        });
    };
});
