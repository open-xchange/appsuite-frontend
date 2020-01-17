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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/actions/attachmentEmpty', [
    'io.ox/backbone/views/modal',
    'gettext!io.ox/mail'
], function (ModalDialog, gt) {

    'use strict';

    function emptinessCheck(files) {
        var def = new $.Deferred(),
            emptyFile = files ? _(files).filter(function (file) { return file.size === 0; }).length > 0 : false;

        if (emptyFile) {

            new ModalDialog({
                //#. 'Empty file attachment' as header of a modal dialog to confirm or cancel sending an email with an empty attachment.
                title: gt('Empty file attachment'),
                description: gt('The attached file is empty. Maybe this file was deleted on your local hard drive. Do you want to send it anyway?')
            })
                .addCancelButton({ action: 'cancel' })
                //#. 'Send with empty attachment' as button text of a modal dialog to confirm to send the mail also without a subject.
                .addButton({ label: gt('Send with empty attachment'), action: 'send' })
                .on('send', function () {
                    def.resolve();
                })
                .on('cancel', function () {
                    def.reject();
                })
                .open();
        } else {
            def.resolve();
        }

        return def;
    }

    return { emptinessCheck: emptinessCheck };
});
