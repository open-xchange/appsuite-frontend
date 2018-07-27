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

define('io.ox/multifactor/settings/views/printBackupString', [
    'io.ox/core/print',
    'gettext!io.ox/core/boot'],
function (print, gt) {

    'use strict';

    function process(data) {
        return { code: data.id.trim() };
    }

    return {
        open: function (selection, win) {
            print.smart({
                get: function (obj) {
                    return $.when(obj);
                },
                i18n: {
                    code: gt('Recovery Code')
                },
                title: gt('Recovery Code'),
                process: process,
                selection: selection,
                window: win,
                selector: '.recovery'
            });
        }
    };
});
