/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/mail/compose/actions/send', [
    'io.ox/core/extensions',
    'io.ox/mail/compose/actions/extensions',
    'io.ox/mail/compose/api',
    'io.ox/mail/api',
    'settings!io.ox/mail',
    'io.ox/core/notifications',
    'gettext!io.ox/mail'
], function (ext, extensions, composeAPI, mailAPI, settings, notifications, gt) {

    'use strict';

    ext.point('io.ox/mail/compose/actions/send').extend(
        {
            id: 'metrics',
            index: 100,
            perform: function () {
                // track click on send button
                require(['io.ox/metrics/main'], function (metrics) {
                    metrics.trackEvent({
                        app: 'mail',
                        target: 'compose/toolbar',
                        type: 'click',
                        action: 'send'
                    });
                });
            }
        },
        {
            id: 'check:no-recipients',
            index: 200,
            perform: function (baton) {
                // ask for empty to,cc,bcc and/or empty subject
                var noRecipient = _.isEmpty(baton.model.get('to')) && _.isEmpty(baton.model.get('cc')) && _.isEmpty(baton.model.get('bcc'));
                if (!noRecipient) return;
                notifications.yell('error', gt('Mail has no recipient.'));
                baton.view.$el.find('.tokenfield:first .token-input').focus();
                baton.stopPropagation();
                return $.Deferred().reject();
            }
        },
        {
            id: 'check:no-subject',
            index: 300,
            perform: function (baton) {
                if ($.trim(baton.model.get('subject')) !== '') return;

                var def = $.Deferred();
                // show dialog
                require(['io.ox/backbone/views/modal'], function (ModalDialog) {
                    new ModalDialog({ title: gt('Empty subject'), description: gt('This email has no subject. Do you want to send it anyway?') })
                        .addButton({ label: gt('Add subject'), className: 'btn-default', action: 'cancel' })
                        //#. 'Send' as confirmation button of a modal dialog to send an email without a subject.
                        .addButton({ label: gt('Send'), action: 'send' })
                        .on('send', function () { def.resolve(); })
                        .on('cancel', function () {
                            baton.stopPropagation();
                            setTimeout(function () { baton.view.$el.find('input[name="subject"]').focus(); }, 200);
                            def.reject();
                        })
                        .open();
                });
                return def;
            }
        },
        {
            id: 'check:attachment-empty',
            index: 350,
            perform: extensions.emptyAttachmentCheck
        },
        {
            id: 'check:attachment-missing',
            index: 400,
            perform: extensions.attachmentMissingCheck
        },
        {
            id: 'busy:start',
            index: 500,
            perform: function (baton) {
                var win = baton.app.getWindow();
                composeAPI.queue.add(baton.model, function () {
                    baton.stopPropagation();
                    notifications.yell(gt('error', 'The sending of the message has been canceled.'));
                    composeAPI.queue.remove(baton.model.get('id'));
                    baton.app.getWindow().idle().show();
                });

                // start being busy
                if (win) {
                    win.busy();
                    // close window now (!= quit / might be reopened)
                    win.preQuit();
                }
            }
        },
        {
            id: 'wait-for-pending-uploads',
            index: 600,
            perform: extensions.waitForPendingUploads
        },
        {
            id: 'remove-unused-inline-images',
            index: 700,
            perform: extensions.removeUnusedInlineImages
        },
        {
            id: 'check-for-auto-enabled-drive-mail',
            index: 800,
            perform: extensions.checkForAutoEnabledDriveMail({ yell: true, restoreWindow: true, stopPropagation: true, removeQueue: true })
        },
        {
            id: 'send',
            index: 2000,
            perform: function (baton) {
                return baton.model.send();
            }
        },
        {
            id: 'errors',
            index: 3000,
            perform: function (baton) {
                if (baton.error && !baton.warning) {
                    var win = baton.app.getWindow(),
                        // check if abort is triggered by the ui
                        text = baton.error === 'abort' ? gt('The sending of the message has been canceled.') : baton.error;
                    if (win) {
                        // reenable the close button(s) in toolbar
                        if (baton.close) baton.close.show();
                        if (baton.launcherClose) baton.launcherClose.show();

                        win.idle().show();
                    }

                    // special errors. Those are handled in 'io.ox/mail/compose/main'
                    if (baton.errorCode === 'MSGCS-0007' || baton.errorCode === 'MSGCS-0011') return;
                    // TODO: check if backend just says "A severe error occurred"
                    notifications.yell('error', text);
                    return;
                }
            }
        },
        {
            id: 'warnings',
            index: 3100,
            perform: function (baton) {
                if (!baton.errors && baton.warning) {
                    // no clue if warning(s) is always object, a list or if it might also be a simple string (see bug 42714)
                    var warning = [].concat(baton.warning)[0],
                        message = warning.error || warning.warning;
                    notifications.yell('warning', message);
                    baton.view.dirty(false);
                    baton.app.quit();
                }
            }
        },
        {
            id: 'success',
            index: 4000,
            perform: function (baton) {
                if (baton.error || baton.warning) return;

                // success - some want to be notified, other's not
                if (settings.get('features/notifyOnSent', false)) {
                    notifications.yell('success', gt('The email has been sent'));
                }
                baton.view.dirty(false);
                // don't ask wether the app can be closed if we have unsaved data, we just want to send
                baton.config.set('autoDismiss', true);

                baton.app.quit();
            }
        },
        {
            id: 'update-caches',
            index: 4100,
            perform: function (baton) {
                // update base mail
                var meta = baton.model.get('meta'),
                    isReply = !!meta.replyFor,
                    isForward = !!meta.forwardsFor;

                if (!isReply && !isForward) return;

                [].concat(meta.replyFor, meta.forwardsFor).filter(Boolean).forEach(function (obj) {
                    var model = mailAPI.pool.get('detail').get(_.cid({ id: obj.originalId, folder_id: obj.originalFolderId }));
                    if (!model) return;
                    var flags = model.get('flags');
                    if (isReply) flags |= 1;
                    if (isForward) flags |= 256;
                    model.set('flags', flags);
                });
            }
        }
    );

});
