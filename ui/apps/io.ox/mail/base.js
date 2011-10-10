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

define("io.ox/mail/base", ["io.ox/core/extensions"], function (extensions) {
    
    var that = {};
    
    var ngettext = function (s, p, n) {
            return n > 1 ? p : s;
        },
        format = _.printf,
        MINUTE = 60 * 1000,
        HOUR = MINUTE * 60;
        
    // resolve mails on scroll
    var autoResolve = function (e) {
        // get mail api
        var self = $(this);
        require(["io.ox/mail/api"], function (api) {
            // get mail data
            api.get(e.data).done(function (data) {
                // replace placeholder with mail content
                self.replaceWith(that.draw(data));
            });
        });
    };
    
    // define global iframe resize handler
    window.iframeResize = function (guid, body) {
        var height = $(body).outerHeight(true);
        $("#tmp-iframe-" + guid).css("height", height + 20 + "px");
    };
    
    var fnClickPerson = function (e) {
        extensions.point("io.ox/core/person:action").each(function (ext) {
            _.call(ext.action, e.data);
        });
    };
   
    that = {
        
        createNewMailDialog: function () {
            require(["io.ox/mail/write"], function (m) {
                m.getApp().launch();
            });
        },
        
        getDisplayName: function (pair) {
            var display_name = (pair[0] || "").replace(/(^["'\\]+|["'\\]+$)/g, "");
            return display_name || pair[1];
        },
        
        getFrom: function (list, prewrap) {
            var dn = this.getDisplayName(list[0]);
            return $("<span/>").addClass("person").text(prewrap ? _.prewrap(dn) : dn);
        },
        
        getFlag: function (data) {
            return data.color_label || 0;
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
        
        /* @returns {String} Proper text */
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
        },
        
        drawScaffold: function (obj) {
            return $("<div/>")
                .addClass("mail-detail")
                .busy()
                .bind("resolve", obj, autoResolve);
        },
        
        getContent: function (data) {
            
            if (!data || !data.attachments) {
                return "";
            }
            
            var att = data.attachments, i = 0, $i = att.length,
                text = null, html = null,
                content = $("<div/>").addClass("content");
            
            for (; i < $i; i++) {
                if (html === null && /^text\/html$/i.test(att[i].content_type)) {
                    html = att[i].content;
                } else if (text === null && /^text\/plain$/i.test(att[i].content_type)) {
                    text = att[i].content;
                }
            }
            
            // HTML content?
            if (html !== null) {
                
                var iframeGUID = _.now();
                
                $("<iframe/>", {
                        id: "tmp-iframe-" + iframeGUID,
                        src: "blank.html",
                        frameborder: "0",
                        marginwidth: "0",
                        marginheight: "0"
                    })
                    .css({
                        width: "100%"
                    })
                    .one("load", iframeGUID, function (e) {
                        var doc = this.contentDocument,
                            css = 'body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 12pt; }' + "\n" +
                                'pre { white-space: pre; white-space: pre-wrap; }' + "\n" +
                                'blockquote { margin: 1em 0 1em 40px; }';
                        // this timeout is needed for chrome. seems that there is some kind of
                        // recursion protection (too close "load" events triggered by the same object).
                        setTimeout(function () {
                            // inject onload handler
                            html = html
                                .replace(/<\/head>/, '  <style type="text/css">' + css + '</style>' + "\n</head>")
                                .replace(/<body/, '<body onload="parent.iframeResize(' + e.data + ', document.body);"')
                                .replace(/(>|\n)([ ]+)/g, "$1 ") // improve readability of <pre> blocks
                                .replace(/\n[ ]/g, "\n");
                            // write content to document
                            doc.open();
                            doc.write(html);
                            doc.close();
                            // don't leak
                            html = text = doc = data = att = content = null;
                        }, 1);
                    })
                    .appendTo(content);
                
            }
            else if (text !== null) {
                
                content.html(
                    $.trim(text)
                        // replace leading BR
                        .replace(/^\s*(<br\/?>\s*)+/g, "")
                        // reduce long BR sequences
                        .replace(/(<br\/?>\s*){3,}/g, "<br/><br/>")
                        // remove split block quotes
                        .replace(/<\/blockquote>\s*(<br\/?>\s*)+<blockquote[^>]+>/g, "<br/><br/>")
                );
                
                // get contents to split long character sequences for better wrapping
                content.contents().each(function (i) {
                    var node = $(this), text = node.text(), length = text.length;
                    if (length >= 60) {
                        node.text(text.replace(/(\S{60})/g, "$1\u200B")); // zero width space
                    }
                });
                
                // collapse block quotes
                content.find("blockquote").each(function () {
                    var quote = $(this);
                    quote.text(quote.contents().text().substr(0, 150));
                });
            }
            
            return content;
        },
        
        draw: function (data) {
            
            if (!data) {
                return $("<div/>");
            }
            
            var node, picture,
                showCC = data.cc && data.cc.length > 0,
                showTO = (data.to && data.to.length > 1) || showCC,
                i = 0, $i = (data.attachments || []).length, attachments = [], hasAttachments = false;
            
            // get non-inline attachments
            for (; i < $i; i++) {
                if (data.attachments[i].disp === "attachment") {
                    attachments.push(data.attachments[i]);
                    hasAttachments = true;
                }
            }
            
            node = $("<div/>")
                .addClass("mail-detail")
                .append(
                    $("<div>").addClass("abs flag flag_" + this.getFlag(data))
                )
                .append(
                    picture = $("<div/>").addClass("contact-picture").hide()
                )
                .append(
                    $("<div/>").addClass("date list").text(this.getSmartTime(data.received_date))
                )
                .append(
                    $("<div/>")
                    .addClass("from list")
                    .append(this.serializeList(data.from, true))
                )
                .append(
                    $("<div/>")
                        .addClass("subject clear-title")
                        // inject some zero width spaces for better word-break
                        .text(_.prewrap(data.subject))
                        .append(
                            $("<span/>").addClass("priority").text(" " + that.getPriority(data))
                        )
                )
                .append(
                    showTO ?
                        $("<div/>")
                            .addClass("list")
                            .append(
                                // TO
                                $("<span/>").addClass("label").text("To:\u00a0")
                            )
                            .append(
                                this.serializeList(data.to, true)
                            )
                            .append(
                                // CC
                                showCC ? $("<span/>").addClass("label").text(" Copy:\u00a0") : []
                            )
                            .append(
                                this.serializeList(data.cc, true)
                            )
                        : []
                )
                .append(
                    // attachments
                    hasAttachments ?
                        $("<div/>")
                            .addClass("list")
                            .append(
                                 // TO
                                 $("<span/>").addClass("label").text("Attachments: ")
                             )
                             .append(
                                 this.serializeAttachments(data, attachments)
                             )
                        : []
                )
                .append(
                    $("<hr/>", { noshade: "noshade", size: "1" }).addClass("spacer")
                )
                .append(
                    this.getContent(data)
                );
            
            require(["io.ox/mail/api"], function (api) {
                // get contact picture
                api.getContactPicture(data.from[0][1])
                    .done(function (url) {
                        if (url) {
                            picture.css("background-image", "url(" + url + ")").show();
                        }
                        url = picture = data = null;
                    });
            });
            
            return node;
        }
    };
    
    return that;
});