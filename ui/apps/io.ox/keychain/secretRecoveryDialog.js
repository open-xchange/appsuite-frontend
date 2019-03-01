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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/keychain/secretRecoveryDialog', [
    'io.ox/keychain/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/notifications',
    'gettext!io.ox/keychain'
], function (api, ModalDialog, notifications, gt) {

    'use strict';

    return {
        show: function () {
            new ModalDialog({
                title: gt('Recover passwords'),
                description: gt('Please provide the old password so the account passwords can be recovered.'),
                easyOut: false, async: true, width: 500, enter: 'migrate'
            })
                .build(function () {
                    var guid = _.uniqueId('form-control-label-');
                    this.$body.append(
                        $('<label>').attr('for', guid).text(gt('Your old password')),
                        $('<input type="password" name"recovery-password" class="form-control">').attr('id', guid)
                    );
                })
                .addCancelButton()
                .addButton({ label: gt('Ignore'), action: 'ignore', className: 'btn-default' })
                .addButton({ label: gt('Recover'), action: 'migrate' })
                .on('cancel', function () {
                    this.$body.find('input').val('');
                })
                .on('ignore', function () {
                    var self = this.busy();
                    return api.cleanUp().done(function () {
                        self.close();
                    }).fail(function (e) {
                        notifications.yell({
                            headline: gt('Error'),
                            type: 'error',
                            message: e.error
                        });
                        self.idle();
                    });
                })
                .on('migrate', function () {
                    var self = this.busy();
                    // recover accounts
                    return api.migrateFromOldSecret(this.$body.find('input').val()).done(function migrationSuccessful() {
                        self.$body.find('input').val('');
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
                        self.$body.find('input').focus().select();
                    });
                })
                .open();
        }
    };
});
