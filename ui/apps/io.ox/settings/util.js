/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
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
                            console.warn('NOTIFIY: ' +  current.state());
                        } else if (def.state) {
                            console.warn('NOTIFIY: ' +  def.state());
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
                    if (obj.code  === 'MAIL_FILTER-0015') {
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
