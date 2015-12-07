/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/mail/compose/actions/send', [
    'io.ox/core/extensions',
    'io.ox/mail/api',
    'settings!io.ox/mail',
    'io.ox/core/notifications',
    'gettext!io.ox/mail',
    'io.ox/mail/actions/attachmentEmpty'
], function (ext, mailAPI, settings, notifications, gt, attachmentEmpty) {

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
                if (baton.mail.attachments[0].content_type === 'text/plain' && baton.model.get('editorMode') === 'html') {
                    baton.mail.attachments[0].content_type = 'text/html';
                }
            }
        },
        {
            id: 'check:no-recipients',
            index: 300,
            perform: function (baton) {
                // ask for empty to,cc,bcc and/or empty subject
                var noRecipient = _.isEmpty(baton.mail.to) && _.isEmpty(baton.mail.cc) && _.isEmpty(baton.mail.bcc);
                if (noRecipient) {
                    notifications.yell('error', gt('Mail has no recipient.'));
                    baton.view.$el.find('.tokenfield:first .token-input').focus();
                    baton.stopPropagation();
                    return $.Deferred().reject();
                }
            }
        },
        {
            id: 'check:no-subject',
            index: 400,
            perform: function (baton) {
                if ($.trim(baton.mail.subject) === '') {
                    var def = $.Deferred();
                    // show dialog
                    require(['io.ox/core/tk/dialogs'], function (dialogs) {
                        new dialogs.ModalDialog({ focus: false })
                        .text(gt('Mail has empty subject. Send it anyway?'))
                        .addPrimaryButton('send', gt('Yes, send without subject'), 'send', { tabIndex: 1 })
                        .addButton('subject', gt('Add subject'), 'subject', { tabIndex: 1 })
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
            }
        },
        {
            id: 'check:attachment-empty',
            index: 500,
            perform: function (baton) {
                return attachmentEmpty.emptinessCheck(baton.mail.files).then(_.identity, function () {
                    baton.stopPropagation();
                });
            }
        },
        {
            id: 'busy:start',
            index: 600,
            perform: function (baton) {
                baton.view.blockReuse(baton.mail.sendtype);

                var win = baton.app.getWindow();
                // start being busy
                if (win) {
                    win.busy();
                    // close window now (!= quit / might be reopened)
                    win.preQuit();
                }
            }
        },
        {
            id: 'fix-draft-sendtype',
            index: 700,
            perform: function (baton) {
                if (baton.mail.sendtype === mailAPI.SENDTYPE.EDIT_DRAFT) {
                    baton.mail.sendtype = mailAPI.SENDTYPE.DRAFT;
                }
            }
        },
        {
            id: 'wait-for-pending-images',
            index: 800,
            perform: function (baton) {
                if (!window.tinymce || !window.tinymce.activeEditor || !window.tinymce.activeEditor.plugins.oximage) return $.when();

                var ids = $('img[data-pending="true"]', window.tinymce.activeEditor.getElement()).map(function () {
                        return $(this).attr('id');
                    }),
                    deferreds = window.tinymce.activeEditor.plugins.oximage.getPendingDeferreds(ids);

                return $.when(deferreds).then(function () {
                    // use actual content since the image urls could have changed
                    baton.mail.attachments[0].content = baton.model.getMail().attachments[0].content;
                });
            }
        },
        {
            id: 'send',
            index: 1000,
            perform: function (baton) {
                return mailAPI.send(baton.mail, baton.mail.files);
            }
        },
        {
            id: 'errors',
            index: 2000,
            perform: function (baton) {
                if (baton.error && !baton.warning) {
                    var win = baton.app.getWindow();
                    if (win) { win.idle().show(); }
                    baton.app.launch();
                    // TODO: check if backend just says "A severe error occurred"
                    notifications.yell('error', baton.error);
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
                    baton.model.dirty(false);
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
                baton.model.dirty(false);
                baton.app.quit();
            }
        },
        {
            id: 'update-caches',
            index: 3000,
            perform: function (baton) {
                // update base mail
                var isReply = baton.mail.sendtype === mailAPI.SENDTYPE.REPLY,
                    isForward = baton.mail.sendtype === mailAPI.SENDTYPE.FORWARD,
                    sep = mailAPI.separator,
                    base, folder, id, msgrefs, ids;

                if (isReply || isForward) {
                    //single vs. multiple
                    if (baton.mail.msgref) {
                        msgrefs = [ baton.mail.msgref ];
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
                baton.view.unblockReuse(baton.mail.sendtype);
            }
        }
    );

});
