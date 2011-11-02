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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define("io.ox/mail/util", ["io.ox/core/extensions"], function (ext) {
    
    'use strict';
    
    var that,
        ngettext,
        format = _.printf,
        MINUTE = 60 * 1000,
        HOUR = MINUTE * 60;
    
    ngettext = function (s, p, n) {
        return n > 1 ? p : s;
    };
    
    var fnClickPerson = function (e) {
        ext.point("io.ox/core/person:action").each(function (ext) {
            _.call(ext.action, e.data, e);
        });
    };
    
    that = {
            
        // TODO: should be externalized soon - its a ui function
        createNewMailDialog: function () {
            require(["io.ox/mail/write"], function (m) {
                m.getApp().launch();
            });
        },
        
        serializeList: function (list, addHandlers) {
            var i = 0, $i = list.length, tmp = $(), node, display_name = "";
            for (; i < $i; i++) {
                display_name = this.getDisplayName(list[i]);
                node = $("<span/>").addClass(addHandlers ? "person-link" : "person")
                    .css("whiteSpace", "nowrap").text(display_name);
                if (addHandlers) {
                    node.bind("click", { display_name: display_name, email1: list[i][1] }, fnClickPerson)
                        .css("cursor", "pointer");
                }
                tmp = tmp.add(node);
                if (i < $i - 1) {
                    tmp = tmp.add($("<span/>").addClass("delimiter").html("&nbsp;&bull; "));
                }
            }
            return tmp;
        },
        
        serializeAttachments: function (data, list) {
            var i = 0, $i = list.length, tmp = $(), filename = "", href = "";
            for (; i < $i; i++) {
                filename = list[i].filename || "";
                href = "/ajax/mail?" + $.param({
                    action: "attachment",
                    folder: data.folder_id,
                    id: data.id,
                    attachment: list[i].id,
                    save: "1",
                    session: ox.session
                });
                tmp = tmp.add(
                    $("<a/>", { href: href, target: "_blank" }).addClass("attachment-link").text(filename)
                );
                if (i < $i - 1) {
                    tmp = tmp.add(
                        $("<span/>").addClass("delimiter").html("&nbsp;&bull; ")
                    );
                }
            }
            return tmp;
        },
        
        getDisplayName: function (pair) {
            var display_name = (pair[0] || "").replace(/(^["'\\]+|["'\\]+$)/g, "");
            return display_name || pair[1];
        },
        
        getFrom: function (list, prewrap) {
            var dn = that.getDisplayName(list[0]);
            return $("<span>").addClass("person").text(prewrap ? _.prewrap(dn) : dn);
        },
        
        getFlag: function (data) {
            return data.color_label || 0;
        },
        
        getPriority: function (data) {
            return data.priority < 3 ? " \u2605\u2605\u2605 " : "";
        },
        
        getTime: function (timestamp) {
            var now = new Date(),
                d = new Date(timestamp),
                time = function () {
                    return _.pad(d.getUTCHours(), 2) + ":" + _.pad(d.getUTCMinutes(), 2);
                },
                date = function () {
                    return _.pad(d.getUTCDate(), 2) + "." + _.pad(d.getUTCMonth() + 1, 2) + "." + d.getUTCFullYear();
                };
            // today?
            if (d.getUTCDate() === now.getUTCDate()) {
                return time();
            } else {
                return date();
            }
        },
        
        getSmartTime: function (timestamp) {
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
                    return "" + format(ngettext("%d hour ago", "%d hours ago", n), n); /*i18n*/
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
        
        isDeleted: function (data) {
            return (data.flags & 2) === 2;
        },
        
        isMe: function (data) {
            // hard wired
            return data.from && data.from.length && data.from[0][1] === ox.user;
        }
    };
    return that;
});