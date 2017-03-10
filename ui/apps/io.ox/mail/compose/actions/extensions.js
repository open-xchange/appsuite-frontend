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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/mail/compose/actions/extensions', [
    'io.ox/mail/actions/attachmentEmpty',
    'io.ox/mail/actions/attachmentQuota'
], function (attachmentEmpty, attachmentQuota) {
    'use strict';

    var api = {};

    api.emptyAttachmentCheck = function (baton) {
        return attachmentEmpty.emptinessCheck(baton.mail.files).then(_.identity, function () {
            baton.stopPropagation();
        });
    };

    api.waitForPendingImages = function (baton) {
        if (!window.tinymce || !window.tinymce.activeEditor || !window.tinymce.activeEditor.plugins.oximage) return $.when();

        var ids = $('img[data-pending="true"]', window.tinymce.activeEditor.getElement()).map(function () {
                return $(this).attr('data-id');
            }),
            deferreds = window.tinymce.activeEditor.plugins.oximage.getPendingDeferreds(ids);

        return $.when.apply($, deferreds).then(function () {
            // use actual content since the image urls could have changed
            baton.mail.attachments[0].content = baton.model.getMail().attachments[0].content;
        });
    };

    api.publishMailAttachments = function (baton) {
        return attachmentQuota.publishMailAttachmentsNotification(baton.mail.files);
    };

    return api;
});
