/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/oauth/reauth_handler', [
    'gettext!io.ox/core'
], function (gt) {

    'use strict';

    function columnForError(code) {
        var map = { 'OAUTH-0040': 1, 'MSG-0114': 5 };
        return map[code];
    }

    // some apps have their own handling so the reauth dialog is less "In your face!" style
    var appsWithOwnHandling = ['mail'];

    function showDialog(account, err) {
        require(['io.ox/backbone/views/modal'], function (ModalDialog) {
            new ModalDialog({ title: gt('Error') })
            .build(function () {
                this.$el.addClass('oauth-reauthorize');
                this.$body.append(err.error);
            })
            .addCancelButton()
            .addButton({
                action: 'reauthorize',
                label: gt('Reauthorize')
            })
            .on('reauthorize', function () {
                account.reauthorize().then(function () {
                    ox.trigger('account:reauthorized', account);
                    ox.trigger('please:refresh');
                });
            })
            .open();
        });
    }

    ox.on('http:error:OAUTH-0040 http:error:MSG-0114', function (err) {
        //do not yell
        err.handled = true;
        if ($('.modal.oauth-reauthorize').length > 0) return;

        require([
            'io.ox/oauth/keychain'
        ]).then(function (keychain) {
            var account = keychain.accounts.get(err.error_params[columnForError(err.code)]);
            if (!account || (account.has('reauthCooldown') && _.now() < account.get('reauthCooldown')) ||
            // some apps like mail have their own handling, so when the problem only affects those apps, don't show the dialog
            (account.get('enabledScopes').length > 0 && _(account.get('enabledScopes')).difference(appsWithOwnHandling).length === 0 && account.get('associations').length > 0)) return;

            // don't bother me about this account for the next 10 minutes (or relogin)
            account.set('reauthCooldown', _.now() + 10 * 60 * 1000);
            showDialog(account, err);
        });
    });

    return {
        showDialog: showDialog,
        columnForError: columnForError
    };
});
