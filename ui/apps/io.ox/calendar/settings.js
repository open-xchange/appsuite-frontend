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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/calendar/settings',
   ['io.ox/core/extensions',
    'io.ox/settings/utils'], function (ext, utils) {

    'use strict';

    var settings = {
        draw: function (node, app) {
            node
            .append(
              utils.createSettingsHead(app)
            )
            .append(
                $("<span>")
                    .addClass("detail")
                    .append($("<span>").text("I AM A SUPER FINE CALENDARSETTING WHOA"))
            )
            .append($("<br>"));
            return node;
        }
    };

    // created on/by
    ext.point("io.ox/calendar/settings/detail").extend({
        index: 200,
        id: "mailsettings",
        draw: function (data) {
            return settings.draw(this, data);
        }
    });

    return {}; //whoa return nothing at first
});

