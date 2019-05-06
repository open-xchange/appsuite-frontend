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
 * @author David Bauer <david.bauer@open-xchange.com>
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
                    new ModalDialog({ title: gt('Mail has empty subject. Send it anyway?') })
                        .addButton({ label: gt('Yes, send without subject'), className: 'btn-default', action: 'send' })
                        .addButton({ label: gt('Add subject'), action: 'subject' })
                        .on('send', function () { def.resolve(); })
                        .on('subject', function () {
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
            id: 'check:attachment-publishmailattachments',
            index: 800,
            perform: extensions.publishMailAttachments
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
                    // no clue if warning(s) is always object or if it might also be a simple string (see bug 42714)
                    var message = baton.warning.error || baton.warning;
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
