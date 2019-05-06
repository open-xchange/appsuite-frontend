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

    ox.on('http:error:OAUTH-0040 http:error:MSG-0114', function (err) {
        //do not yell
        err.handled = true;
        if ($('.modal.oauth-reauthorize').length > 0) return;

        require([
            'io.ox/backbone/views/modal',
            'io.ox/oauth/keychain'
        ]).then(function (ModalDialog, keychain) {
            var account = keychain.accounts.get(err.error_params[columnForError(err.code)]);
            if (!account || account.has('reauthCooldown') && _.now() < account.get('reauthCooldown')) return;

            // don't bother me about this account for the next 10 minutes (or relogin)
            account.set('reauthCooldown', _.now() + 10 * 60 * 1000);
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
                    ox.trigger('please:refresh');
                });
            })
            .open();
        });
    });
});
