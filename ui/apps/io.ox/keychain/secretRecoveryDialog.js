/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/keychain/secretRecoveryDialog', ['io.ox/keychain/api', 'io.ox/core/tk/dialogs', 'io.ox/core/notifications', 'gettext!io.ox/keychain'], function (api, dialogs, notifications, gt) {
    'use strict';

    function fnKeyPress(e) {
        if (e.which === 13) {
            e.data.popup.invoke(e.data.action);
        }
    }

    return {
        show: function () {
            new dialogs.ModalDialog({ easyOut: false, async: true, width: 400 })
                .build(function () {
                    this.getHeader().append(
                        $('<h4>').text(gt('Your password has changed')),
                        $('<div>').text(gt('Please provide the old password so the account passwords can be recovered.'))
                    );
                    this.getContentNode().append(
                        $('<label>').text(gt('Password')),
                        $('<input type="password" name"recovery-password" class="input-xlarge">')
                        .on('keypress', { popup: this, action: 'migrate' }, fnKeyPress)
                    );
                })
                .addPrimaryButton('migrate', gt('Recover accounts'))
                .addAlternativeButton('cancel', gt('Cancel'))
                .on('cancel', function () {
                    this.getContentNode().find('input').val('');
                })
                .addDangerButton('cleanUp', gt('Delete accounts'))
                .on('cleanUp', function () {
                    var self = this.busy();
                    return api.cleanUpIrrecoverableItems().done(function () {
                        self.getContentNode().find('input').val('');
                        self.close();
                    });
                })
                .on('migrate', function () {
                    var self = this.busy();
                    // recover accounts
                    return api.migrateFromOldSecret(this.getContentNode().find('input').val()).done(function migrationSuccessful() {
                            self.getContentNode().find('input').val('');
                            self.close();
                            // process queue
                        }).fail(function migrationFailed(e) {
                            // eloquentify standard error message ;-)
                            notifications.yell({
                                headline: gt('Failed to recover accounts'),
                                type: 'error',
                                message: e.error
                            });
                            self.idle();
                            self.getContentNode().find('input').focus().select();
                        }
                    );
                })
                .show(function () {
                    this.find('input').focus();
                });
        }
    };
});