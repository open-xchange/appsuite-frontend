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
        yellOnReject: function (def, options) {
            //be robust
            if (!(def && def.promise && def.resolve))
                def = new $.Deferred();

            var opt = $.extend({
                    details: true,
                    debug: false
                }, options || {});

            //debug
            if (opt.debug) {
                def.always(function () {
                    var list = _.isArray(this) ? this : [this];
                    _.each(list, function (current) {
                        if (current.state)
                            console.warn('NOTIFIY: ' +  current.state());
                        else if (def.state)
                            console.warn('NOTIFIY: ' +  def.state());
                    });
                });
            }

            //yell on error
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
                        obj.message = gtcore('Unable to load mail filter settings.');
                    } else if (opt.details && obj.error_params[0]) {
                        //show detailed error messages
                        _.each(obj.error_params, function (error) {
                            obj.message = (obj.message || '') + gt(error) + '\n';
                        });
                    } else if (obj.erro) {
                        // show main error message
                        obj.message = gt(obj.error);
                    }

                    //notification.yell favors obj.message over obj.error
                    notifications.yell(obj);
                }
            );
        }
    };
});
