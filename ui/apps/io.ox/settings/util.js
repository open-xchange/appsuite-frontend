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
       'gettext!io.ox/settings/settings',
       'gettext!io.ox/core'], function (notifications, gt, gtcore) {

    'use strict';

    return {
        yell: function (def, options) {
            var opt = $.extend({
                    details: true,
                    debug: false
                }, options || {});

            //debug
            if (opt.debug) {
                def.always(function () {
                    console.warn('NOTIFIY: ' +  this.state());
                });
            }

            return def.fail(
                function (e) {
                    var obj = e || {};
                    if (obj.code  === 'MAIL_FILTER-0015') {
                        //custom error message
                        obj.message = gtcore('Unable to contact mailfilter backend.');
                    } else if (e.error_params[0] === null || e.error_params[0] === '') {
                        // use received error message
                        obj.message = gt(e.error);
                    } else if (opt.details) {
                        console.error('DETAILS');
                        _.each(e.error_params, function (error) {
                            //list received error params
                            obj.message = (obj.message || '') + gt(error) + '\n';
                        });
                    }

                    //yell favors obj.message over obj.error
                    notifications.yell(obj);
                }
            );
        }
    };
});
