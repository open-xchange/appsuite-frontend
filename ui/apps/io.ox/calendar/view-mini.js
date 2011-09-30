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
    ["io.ox/calendar/util", "io.ox/core/gettext"
    ], function (util, gettext) {
    
    return  {
        
        draw: function (timestamp) {
            // debugging mode: output to console
            console.log(util.getDayNames().join(" "));
            var list = util.getMonthScaffold(timestamp);
            _(list).each(function (days) {
                console.log(
                    _(days).map(function (day) {
                            return _.pad(day.date, 2, " ");
                        })
                        .join(" ")
                );
            });
        }
    };
});