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
                name = $.trim(data.yomiLastName || data.yomiFirstName || data.display_name || util.getMail(data));

            return fullname ?
                this.append($('<div class="fullname">').html(util.getFullName(data, true))) :
                this.append($('<div class="fullname">').text(name));
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
