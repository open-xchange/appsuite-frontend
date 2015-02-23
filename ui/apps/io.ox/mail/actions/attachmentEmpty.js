/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/actions/attachmentEmpty', [
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/mail'
], function (dialogs, gt) {

    'use strict';

    function emptinessCheck(files) {
        var def = new $.Deferred(),
            emptyFile = files ? _(files).filter(function (file) { return file.size === 0; }).length > 0 : false;

        if (emptyFile) {
            new dialogs.ModalDialog()
                .text(gt('You attached an empty file. It could be, that this file has been deleted on your hard drive. Send it anyway?'))
                .addPrimaryButton('send', gt('Yes, with empty attachment'), 'send', { tabIndex: '1' })
                .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: '1' })
                .show(function () {
                    def.notify('empty attachment');
                }).done(function (action) {
                    if (action === 'send') {
                        def.resolve();
                    } else {
                        def.reject();
                    }
                });
        } else {
            def.resolve();
        }

        return def;
    }

    return { emptinessCheck: emptinessCheck };
});
