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

define('io.ox/find/manager/extensions',[
    'io.ox/find/date/value-model'
], function (DateValue) {

    'use strict';

    var extensions = {

        date: function () {
            var def = $.Deferred(),
                self = this;

            self.valuemodels = _.extend(self.valuemodels || {}, { 'date.custom': DateValue });
            return def;
        }
    };

    return extensions;
});
