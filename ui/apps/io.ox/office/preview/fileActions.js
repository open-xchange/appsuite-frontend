/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Carsten Driesner <carsten.driesner@open-xchange.com>
 */

define('io.ox/office/preview/fileActions',
    ['io.ox/files/api',
     'io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'gettext!io.ox/files',
     'settings!io.ox/files'], function (api, ext, links, gt, settings) {

    'use strict';

    var Action = links.Action,

        SUPPORTED_EXT = /\.(doc|docx|odt|xls|xlsx|ods|ppt|pptx|odp|odg|dot|dotx|ott|xlt|xltx|ots|pot|potx|otp|otg|docm|xlsm|pptm|dotm|xltm|potm|xlsb|pdf|rtf)$/i;

    new Action('io.ox/files/actions/open', {
        id: 'officepreview',
        // we just need to be called before 'default'
        before: 'default',
        // pick items you want to take care of (actually this function is called by underscore's "filter")
        filter: function (obj) {
            return SUPPORTED_EXT.test(obj.filename);
        },
        action: function (baton) {
            // on Firefox we have to do this check to prevent duplicate actions (default/preview)
            if (SUPPORTED_EXT.test(baton.data.filename)) {
                ox.launch('io.ox/office/preview/main', { action: 'load', file: baton.data });
            }
        }
    });
});
