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
