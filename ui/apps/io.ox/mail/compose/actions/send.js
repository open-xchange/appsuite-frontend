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
            id: 'fix-content-type',
            index: 200,
            perform: function (baton) {
                // force correct content-type
                if (baton.model.get('contentType') === 'text/plain' && baton.config.get('editorMode') === 'html') {
                    baton.model.set('contentType', 'text/html', { silent: true });
                }
            }
        },
        {
            id: 'check:no-recipients',
            index: 300,
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
            index: 400,
            perform: function (baton) {
                if ($.trim(baton.model.get('subject')) !== '') return;

                var def = $.Deferred();
                // show dialog
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog({ focus: false })
                    .text(gt('Mail has empty subject. Send it anyway?'))
                    .addPrimaryButton('send', gt('Yes, send without subject'), 'send')
                    .addButton('subject', gt('Add subject'), 'subject')
                    .show(function () {
                        def.notify('empty subject');
                    })
                    .done(function (action) {
                        if (action !== 'send') {
                            this.remove();
                            baton.view.$el.find('input[name="subject"]').focus();
                            baton.stopPropagation();
                            def.reject();
                        } else {
                            def.resolve();
                        }
                    });
                });
                return def;
            }
        },
        {
            id: 'image-resize',
            index: 450,
            perform: function (baton) {
                // TODO: ask Björn
                var def = $.Deferred(),
                    win = baton.app.getWindow();
                if (!settings.get('features/imageResize/enabled', true)) return def.resolve();
                if (!baton.model.has('files') || baton.model.get('files').length === 0) return def.resolve();
                require(['io.ox/mail/compose/resizeUtils'], function (resizeUtils) {
                    win.busy();
                    resizeUtils.mergeResizedFiles(baton.mail.files, baton.config.get('resizedImages'), baton.model.get('imageResizeOption')).done(function () {
                        win.idle();
                        def.resolve();
                    });
                });
                return def;
            }
        },
        {
            id: 'check:attachment-empty',
            index: 500,
            perform: extensions.emptyAttachmentCheck
        },
        {
            id: 'check:attachment-publishmailattachments',
            index: 550,
            perform: extensions.publishMailAttachments
        },
        {
            id: 'check:attachment-missing',
            index: 560,
            perform: extensions.attachmentMissingCheck
        },
        // Placeholder for Guard extensions at index 600-630
        {
            id: 'busy:start',
            index: 700,
            perform: function (baton) {
                var win = baton.app.getWindow();
                // start being busy
                if (win) {
                    win.busy();
                    // close window now (!= quit / might be reopened)
                    win.preQuit();
                }
            }
        },
        // Placeholder for Guard delay send for key check at index 750
        {
            id: 'wait-for-pending-uploads',
            index: 900,
            perform: extensions.waitForPendingUploads
        },
        {
            id: 'disable-manual-close',
            index: 950,
            perform: function () {
                // var app = ox.ui.apps.get(baton.app.id);
                //baton.close = $(app.get('topbarNode').find('.closelink')).hide();
                //baton.launcherClose = app.get('launcherNode').find('.closelink').hide();
            }
        },
        {
            id: 'send',
            index: 1000,
            perform: function (baton) {
                return baton.model.send();
                //return composeAPI.send(baton.mail, baton.mail.files);
            }
        },
        {
            id: 'errors',
            index: 2000,
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
                    baton.app.launch();
                    // TODO: check if backend just says "A severe error occurred"
                    notifications.yell('error', text);
                    return;
                }
            }
        },
        {
            id: 'warnings',
            index: 2000,
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
            index: 2000,
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
            index: 3000,
            perform: function (baton) {
                // update base mail
                var isReply = baton.model.get('meta').type === 'reply',
                    isForward = baton.model.get('meta').type === 'forward',
                    sep = mailAPI.separator,
                    base, folder, id, msgrefs, ids;

                if (isReply || isForward) {
                    //single vs. multiple
                    if (baton.model.get('meta').originalId) {
                        msgrefs = [baton.model.get('meta').originalId];
                    } else {
                        msgrefs = _.chain(baton.mail.attachments)
                            .filter(function (attachment) {
                                return attachment.content_type === 'message/rfc822';
                            })
                            .map(function (attachment) { return attachment.msgref; })
                            .value();
                    }
                    //prepare
                    ids = _.map(msgrefs, function (obj) {
                        base = _(obj.split(sep));
                        folder = base.initial().join(sep);
                        id = base.last();
                        return { folder_id: folder, id: id };
                    });
                    // update cache
                    mailAPI.getList(ids).then(function (data) {
                        // update answered/forwarded flag
                        var len = data.length;
                        for (var i = 0; i < len; i++) {
                            if (isReply) data[i].flags |= 1;
                            if (isForward) data[i].flags |= 256;
                        }
                        $.when(mailAPI.caches.list.merge(data), mailAPI.caches.get.merge(data))
                        .done(function () {
                            mailAPI.trigger('refresh.list');
                        });
                    });
                }
            }
        },
        {
            id: 'busy:end',
            index: 10000,
            perform: function (baton) {
                baton.view.unblockReuse(baton.model.get('meta').type);
            }
        }
    );

});
