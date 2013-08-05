/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/settings/util',
     ['io.ox/core/notifications',
       'gettext!io.ox/core'], function (notifications, gt) {

    'use strict';

    return {
        yell: function (def) {
            return def.fail(
                function (e) {
                    var obj = e || {};
                    //custom error messages
                    if (obj.code  === 'MAIL_FILTER-0015')
                        obj.message = gt('Unable to contact mailfilter backend.');
                    notifications.yell(e);
                }
            );
        }
    };
});
