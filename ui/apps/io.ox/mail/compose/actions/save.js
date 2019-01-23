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
    'io.ox/mail/api',
    'io.ox/mail/util',
    'io.ox/core/notifications'
], function (ext, extensions, mailAPI, mailUtil, notifications) {

    'use strict';

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
        // Placeholder for Guard.  Guard actions for signature check at index 300
        {
            id: 'wait-for-pending-uploads',
            index: 400,
            // important: does changes in 'content' in case of pending uploads
            perform: extensions.waitForPendingUploads
        },
        {
            id: 'remove-unused-inline-images',
            index: 450,
            perform: extensions.removeUnusedInlineImages
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
                return baton.model.saveDraft().then(function (res) {
                    baton.msgref = res.data;
                });
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
                var opt = mailUtil.parseMsgref(mailAPI.separator, baton.msgref);
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

                return mailAPI.get(opt).then(function (data) {
                    baton.mail = data;
                });
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
                    // TODO may need some rework
                    $('<div>').html(baton.mail.attachments[0].content).find('img:not(.emoji)').each(function (index, el) {
                        var $el = $(el);
                        $('img:not(.emoji):eq(' + index + ')', baton.view.editorContainer.find('.editable')).attr({
                            src: $el.attr('src'),
                            id: $el.attr('id')
                        });
                    });
                }
                var encrypted = baton.mail.security_info && baton.mail.security_info.encrypted;
                if (!encrypted) {  // Don't update attachments for encrypted files
                    baton.mail.attachments.forEach(function (a, index) {
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

                // make view not dirty after save
                baton.view.dirty(false);
                return baton.resultData;
            }
        }
    );

});

