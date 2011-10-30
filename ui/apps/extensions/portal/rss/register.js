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

define("io.ox/portal/rss/register",
    ["io.ox/core/extensions"], function (ext, api) {
    
    "use strict";
    
    ext.point("io.ox/portal/widget").extend({
        id: "rss",
        index: 400,
        load: function () {
            // get 'spiegel' RSS via Google Feed API
            var rss = "http://www.spiegel.de/schlagzeilen/tops/index.rss",
                url = "http://ajax.googleapis.com/ajax/services/feed/" +
                        "load?v=1.0&num=4&callback=?&q=" + encodeURIComponent(rss);
            return $.getJSON(url)
                .pipe(function (data) {
                    return data && data.responseData ? data.responseData.feed : {};
                });
        },
        draw: function (feed) {
            
            var self = this;
            
            this.addClass("io-ox-portal-rss")
                .append(
                    $("<div/>").addClass("clear-title")
                        .text(feed.title || "RSS")
                );
            
            _(feed.entries).each(function (entry) {
                self.append(
                    $("<div>").addClass("rss-entry")
                    .append(
                        $("<div>").addClass("rss-title").text(entry.title || "")
                    )
                    .append(
                        $("<div>").addClass("rss-content").html(entry.content || "")
                        .find("img").removeAttr("hspace vspace align")
                        .end()
                    )
                );
            });
            
            return $.Deferred().resolve();
        }
    });
});
