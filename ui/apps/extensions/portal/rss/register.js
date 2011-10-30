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
    
    var feeds = [];
    
    // SPIEGEL Online
    feeds.push({
        id: "rss-spiegel",
        url: "http://www.spiegel.de/schlagzeilen/tops/index.rss",
        index: 400,
        cssClass: "spiegel"
    });
    
    // Engadget
    feeds.push({
        id: "rss-engadget",
        url: "http://www.engadget.com/rss.xml",
        index: 500
    });
    
    _(feeds).each(function (extension) {
    
        ext.point("io.ox/portal/widget").extend({
            id: extension.id,
            index: extension.index,
            load: function () {
                // get RSS feed via Google Feed API
                var url = "http://ajax.googleapis.com/ajax/services/feed/" +
                    "load?v=1.0&num=4&callback=?&q=" + encodeURIComponent(extension.url);
                return $.getJSON(url)
                    .pipe(function (data) {
                        return data && data.responseData ? data.responseData.feed : {};
                    });
            },
            draw: function (feed) {
                
                var self = this;
                
                this.addClass(
                        "io-ox-portal-rss" + (extension.cssClass ? " " + extension.cssClass : "")
                    )
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
                            .find("a")
                                .attr("target", "_blank")
                            .end()
                            .find("img")
                                .removeAttr("hspace vspace align height")
                                .css("height", "auto")
                            .end()
                            .find("iframe")
                                .attr("frameborder", "0")
                                .attr("border", "0")
                                .attr("width", "405")
                                .attr("height", "230")
                            .end()
                            .append($.txt(" "))
                            .append(
                                $("<a>", { href: entry.link, target: "_blank"})
                                .css("whiteSpace", "nowrap")
                                .text("Read full article")
                            )
                        )
                    );
                });
                
                return $.Deferred().resolve();
            }
        });
    });
});
