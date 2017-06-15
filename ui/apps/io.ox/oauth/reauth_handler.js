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

    ox.on('http:error:OAUTH-0040', function (err) {
        //do not yell
        err.handled = true;
        if ($('.modal.oauth-reauthorize').length > 0) return;

        require(['io.ox/backbone/views/modal']).then(function (ModalDialog) {
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
                require(['io.ox/oauth/keychain']).then(function (keychain) {
                    var account = keychain.accounts.get(err.error_params[1]);

                    account.reauthorize();
                });
            })
            .open();
        });
    });
});
