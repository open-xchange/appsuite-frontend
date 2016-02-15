/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/keychain/secretRecoveryDialog', [
    'io.ox/keychain/api',
    'io.ox/core/tk/dialogs',
    'io.ox/core/notifications',
    'gettext!io.ox/keychain'
], function (api, dialogs, notifications, gt) {

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
                            $('<input type="password" name"recovery-password" class="form-control" tabindex="1">')
                        )
                    );
                })
                .addPrimaryButton('migrate', gt('Recover'), 'migrate', { 'tabIndex': '1' })
                .addButton('cancel', gt('Cancel'), 'cancel', { 'tabIndex': '1' })
                .on('cancel', function () {
                    this.getContentNode().find('input').val('');
                })
                .on('migrate', function () {
                    var self = this.busy();
                    // recover accounts
                    return api.migrateFromOldSecret(this.getContentNode().find('input').val()).done(function migrationSuccessful() {
                        self.getContentNode().find('input').val('');
                        self.close();

                        require(['io.ox/core/folder/api'], function (api) {
                            api.list('1', { cache: false }).done(function () {
                                api.virtual.refresh();
                            });
                        });

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
                    });
                })
                .show(function () {
                    this.find('input').focus();
                });
        }
    };
});
