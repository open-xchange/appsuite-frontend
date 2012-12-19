/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define("io.ox/calendar/view-mini",
    ["io.ox/calendar/util",
     "gettext!io.ox/calendar"], function (util, gettext) {

    "use strict";

    return  {

        draw: function (timestamp) {
            // debugging mode: output to console
            console.debug(util.getDayNames().join(" "));
            var list = util.getMonthScaffold(timestamp);
            _(list).each(function (days) {
                console.debug(
                    _(days).map(function (day) {
                            return _.pad(day.date, 2, " ");
                        })
                        .join(" ")
                );
            });
        }
    };
});
