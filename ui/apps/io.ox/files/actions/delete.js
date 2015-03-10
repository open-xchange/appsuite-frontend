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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/files/actions/delete', [
    'io.ox/files/api',
    'io.ox/core/tk/dialogs',
    'io.ox/core/notifications',
    'gettext!io.ox/files'
], function (api, dialogs, notifications, gt) {

    'use strict';

    function getMessages (type) {
        var plural = (type === 'multiple');
        return {
            question: gt.ngettext(
                    'Do you really want to delete this file?',
                    'Do you really want to delete these files?',
                    plural
            ),
            responseSuccess: gt.ngettext(
                    'This file has been deleted',
                    'These files have been deleted',
                    plural
            ),
            responseFail: gt.ngettext(
                    'This file has not been deleted',
                    'These files have not been deleted',
                    plural
            ),
            responseFailLocked: gt.ngettext(
                    'This file has not been deleted, as it is locked by its owner.',
                    'These files have not been deleted, as they are locked by their owner.',
                    plural
            )
        };
    }

    // store labels once
    var single = getMessages('single'),
        multiple = getMessages('multiple');

    function process(list) {
        var messages = list.length ? single : multiple;
        api.remove(list).then(
            function success() {
                notifications.yell('success', messages.responseSuccess);
            },
            function fail(e) {
                if (e && e.code && e.code === 'IFO-0415') {
                    notifications.yell('error', messages.responseFailLocked);
                } else {
                    notifications.yell('error', messages.responseFail + '\n' + e.error);
                }
            }
        );
    }

    return function (list) {
        var messages = list.length ? single : multiple;
        new dialogs.ModalDialog()
            .text(messages.question)
            .addPrimaryButton('delete', gt('Delete'), 'delete',  { 'tabIndex': '1' })
            .addButton('cancel', gt('Cancel'), 'cancel',  { 'tabIndex': '1' })
            .on('delete', function () {
                process(list);
            })
            .show();
    };
});
