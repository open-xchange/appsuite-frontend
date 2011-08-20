/**
 * 
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
 * 
 */

define("io.ox/mail/base", function () {
    
    var ngettext = function (s, p, n) {
            return n > 1 ? p : s;
        },
        format = ox.util.printf,
        MINUTE = 60 * 1000,
        HOUR = MINUTE * 60;
    
    return {

        serializeList: function (list, delimiter) {
            var i = 0, $i = list.length, tmp = [];
            for (; i < $i; i++) {
                tmp.push(
                    (list[i][0] || list[i][1]).replace(/(^["']|["']$)/g, "")
                );
            }
            return tmp.join(delimiter || "; ");
        },
        
        getTime: function (timestamp) {
            var now = new Date(),
                zone = now.getTimezoneOffset(),
                time = now.getTime() - zone * 60 * 1000,
                delta = time - timestamp,
                d = new Date(timestamp),
                n = 0;
            // today?
            if (d.getDate() === now.getDate()) {
                if (delta < HOUR) {
                    n = Math.ceil(delta / MINUTE);
                    return "" + format(ngettext("%d minute ago", "%d minutes ago", n), n); /*i18n*/
                } else {
                    n = Math.ceil(delta / HOUR);
                    return ""+ format(ngettext("%d hour ago", "%d hours ago", n), n); /*i18n*/
                }
            } else if (d.getDate() === now.getDate() - 1) {
                // yesterday
                return "Yesterday";
            } else {
                return d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
            }
        },
        
        isUnread: function (data) {
            return (data.flags & 32) !== 32;
        },
        
        isMe: function (data) {
            // hard wired
            return data.from && data.from.length && data.from[0][1] === "matthias.biggeleben@open-xchange.com";
        },
        
        draw: function (data) {
            
            var mailtext = data.attachments.length ? data.attachments[0].content : "";
            
            return $("<div/>")
                .addClass("abs mail-detail-pane")
                .append(
                    $("<div/>")
                        .addClass("mail-detail")
                        .append(
                            $("<div/>")
                                .addClass("subject")
                                .text(data.subject)
                        )
                        .append(
                            $("<div/>")
                                .addClass("from person")
                                .text(this.serializeList(data.from))
                        )
                        .append(
                            $("<div/>").text("\u00a0").addClass("spacer")
                        )
                        .append(
                            $("<div/>")
                                .addClass("content")
                                .html(mailtext)
                        )
                )
                // just for bottom space
                .append(
                    $("<div/>").css("height", "1px")
                );
        }
        
    };
});