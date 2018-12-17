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
 * @author Greg Hill <greg.hill@open-xchange.com>
 */

define('io.ox/mail/compose/actions/save', [
    'io.ox/core/extensions',
    'io.ox/mail/compose/actions/extensions',
    'io.ox/mail/compose/api',
    'io.ox/mail/api',
    'io.ox/mail/util',
    'io.ox/core/notifications',
    'gettext!io.ox/mail'
], function (ext, extensions, composeAPI, mailAPI, mailUtil, notifications, gt) {

    'use strict';

    // TODO use new compose model
    ext.point('io.ox/mail/compose/actions/save').extend(
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
                        action: 'saveDraft'
                    });
                });
            }
        },
        {
            id: 'check:attachment-empty',
            index: 200,
            perform: extensions.emptyAttachmentCheck
        },
        // Placeholder for Guard.  Guard actions for signature check at index 300
        {
            id: 'wait-for-pending-images',
            index: 400,
            // important: replaces mail.attachments[0].content
            perform: extensions.waitForPendingImages
        },
        {
            id: 'check:attachment-publishmailattachments',
            index: 500,
            perform: extensions.publishMailAttachments
        },
        {
            id: 'send',
            index: 1000,
            perform: function (baton) {
                return baton.model.saveDraft();
            }
        },
        // Placeholder for Guard auth check, index 1050
        {
            id: 'error',
            index: 1100,
            perform: function (baton) {
                if (baton.error) {
                    notifications.yell('error', baton.error);
                    baton.stopPropagation();
                    return new $.Deferred().reject(baton.error);
                }
            }
        },
        {
            id: 'reload',
            index: 1200,
            perform: function (baton) {
                var opt = mailUtil.parseMsgref(mailAPI.separator, baton.resultData);
                switch (baton.model.get('contentType')) {
                    case 'text/plain':
                        opt.view = 'raw';
                        break;
                    case 'text/html':
                    case 'ALTERNATIVE':
                        opt.view = 'html';
                        break;
                    default:
                        break;
                }

                return $.when(
                    baton.resultData,
                    mailAPI.get(opt)
                );
            }
        },
        {
            id: 'reloadError',
            index: 1300,
            perform: function (baton) {
                if (baton.error) {
                    notifications.yell('error', baton.error);
                    baton.stopPropagation();
                    return new $.Deferred().reject(baton.error);
                }
            }
        },
        {
            id: 'replace',
            index: 2000,
            perform: function (baton) {
                // Replace inline images in contenteditable with links from draft response
                if (baton.config.get('editorMode') === 'html') {
                    $('<div>').html(baton.newData.attachments[0].content).find('img:not(.emoji)').each(function (index, el) {
                        var $el = $(el);
                        $('img:not(.emoji):eq(' + index + ')', baton.view.editorContainer.find('.editable')).attr({
                            src: $el.attr('src'),
                            id: $el.attr('id')
                        });
                    });
                }
                var encrypted = baton.newData.security_info && baton.newData.security_info.encrypted;
                if (!encrypted) {  // Don't update attachments for encrypted files
                    baton.newData.attachments.forEach(function (a, index) {
                        var m = baton.model.get('attachments').at(index);
                        if (typeof m === 'undefined') {
                            if (a.content_type !== 'application/pgp-signature') { // Don't add signature files
                                baton.model.get('attachments').add(a);
                            }
                        } else if (m.id !== a.id) {
                            // add correct group so previews work
                            if (a.id && !m.id && m.get('group')) a.group = 'mail';
                            m.clear({ silent: true });
                            m.set(a);
                        }
                    });
                }

                baton.model.set('msgref', baton.resultData);
                baton.model.set('sendtype', composeAPI.SENDTYPE.EDIT_DRAFT);
                baton.model.dirty(baton.model.previous('sendtype') !== composeAPI.SENDTYPE.EDIT_DRAFT);
                //#. %1$s is the time, the draft was saved
                //#, c-format
                baton.view.inlineYell(gt('Draft saved at %1$s', moment().format('LT')));
                // make model not dirty after save
                baton.view.model.dirty(false);
                return baton.resultData;
            }
        }
    );

});

