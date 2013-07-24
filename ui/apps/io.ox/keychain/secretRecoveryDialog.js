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

    return {
        show: function () {
            new dialogs.ModalDialog({ easyOut: false, async: true, width: 500, enter: 'migrate' })
                .build(function () {
                    this.getHeader().append(
                        $('<h4>').text(gt('Recover passwords'))
                    );
                    this.getContentNode().append(
                        $('<p>').text(gt('Please provide the old password so the account passwords can be recovered.')),
                        $('<label>').append(
                            $.txt(gt('Your old password')), $('<br>'),
                            $('<input type="password" name"recovery-password" class="input-xlarge">')
                        )
                    );
                })
                .addPrimaryButton('migrate', gt('Recover'))
                .addButton('cancel', gt('Cancel'))
                .addAlternativeButton('cleanUp', gt('Delete all accounts'), 'cleanup', { classes: 'btn-danger'})
                .on('cancel', function () {
                    this.getContentNode().find('input').val('');
                })
                .on('cleanUp', function () {
                    var self = this.busy(), def = $.Deferred();
                    // use native confirm dialog
                    if (window.confirm(gt('Are you sure?'))) {
                        api.cleanUpIrrecoverableItems().then(
                            function () {
                                self.getContentNode().find('input').val('');
                                self.close();
                                def.resolve();
                            },
                            function () {
                                self.idle();
                                self.getContentNode().find('input').focus();
                                def.reject();
                            }
                        );
                    } else {
                        self.idle();
                        self.getContentNode().find('input').focus();
                        def.reject();
                    }
                    return def;
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
