/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/settings/util', [
    'io.ox/core/notifications',
    'gettext!io.ox/core'
], function (notifications, gt) {

    'use strict';

    return {

        destroy: function () {
            notifications.yell('destroy');
        },

        yellOnReject: function (def, options) {

            // be robust
            if (!(def && def.promise && def.done)) return $.when();

            var opt = $.extend({
                debug: false
            }, options || {});

            // debug
            if (opt.debug) {
                def.always(function () {
                    var list = _.isArray(this) ? this : [this];
                    _.each(list, function (current) {
                        if (current.state) {
                            console.warn('NOTIFIY: ' + current.state());
                        } else if (def.state) {
                            console.warn('NOTIFIY: ' + def.state());
                        }
                    });
                });
            }

            // yell on error
            return def.fail(
                function (e) {
                    //try to add a suitable message (new property)
                    var obj = $.extend({
                        type: 'error',
                        error: 'unknown',
                        error_params: []
                    }, e || {});
                    if (obj.code === 'MAIL_FILTER-0015') {
                        //show custom error message
                        obj.message = gt('Unable to load mail filter settings.');
                    } else if (obj.error) {
                        // show main error message
                        obj.message = obj.error;
                    }

                    // notification.yell favors obj.message over obj.error
                    notifications.yell(obj);
                }
            );
        }
    };
});
