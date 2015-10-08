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

define('io.ox/contacts/common-extensions', [
    'io.ox/contacts/util',
    'gettext!io.ox/contacts'
], function (util, gt) {

    'use strict';

    var extensions = {

        fullname: function (baton) {
            var data = baton.data,
                fullname = $.trim(util.getFullName(data)),
                name;
            if (fullname) {
                name = fullname;
                // use html output
                fullname = util.getFullName(data, true);
            } else {
                name = $.trim(util.getFullName(data) || data.yomiLastName || data.yomiFirstName || data.display_name || util.getMail(data));
            }
            this.append(
                $('<div class="fullname">').append(
                   name
                )
            );
        },

        bright: function (baton) {
            var text =  baton.data.mark_as_distributionlist ? gt('Distribution list') : $.trim(util.getJob(baton.data));
            this.append(
                $('<span class="bright">').append(text)
            );
        }

    };

    return extensions;
});
