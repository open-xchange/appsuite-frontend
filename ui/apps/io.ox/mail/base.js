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
   
    return that = {
        
        createNewMailDialog: function () {
            require(["io.ox/mail/new"], function (m) {
                m.getApp().launch();
            });
        },
        
        serializeList: function (list) {
            var i = 0, $i = list.length, tmp = $();
            for (; i < $i; i++) {
                tmp = tmp.add(
                    $("<span/>").addClass("person").css("whiteSpace", "nowrap").text(
                        (list[i][0] || list[i][1]).replace(/(^["']|["']$)/g, "")
                    )
                );
                if (i < $i - 1) {
                    tmp = tmp.add($("<span/>").css("color", "#555").html(" &bull; "));
                }
            }
            return tmp;
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
                if (html === null && att[i].content_type === "text/html") {
                    html = att[i].content;
                } else if (text === null && att[i].content_type === "text/plain") {
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
                        var doc = this.contentDocument;
                        // this timeout is needed for chrome. seems that there is some kind of
                        // recursion protection (too close "load" events triggered by the same object).
                        setTimeout(function () {
                            // inject onload handler
                            html = html
                                .replace(/<\/head>/, '  <style type="text/css">body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; }</style>' + "\n</head>")
                                .replace(/<body/, '<body onload="parent.iframeResize(' + e.data + ', document.body);"');
                            // write content to document
                            doc.open();
                            doc.write(html);
                            doc.close();
                            html = doc = null;
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
                        node.text(text.replace(/(\S{60})/g, "$1\u200B"));
                    }
                });
                
                // collapse block quotes
                content.find("blockquote").each(function () {
                    var quote = $(this);
                    quote.text( quote.contents().text().substr(0, 150) );
                });
            }
            
            return content;
        },
        
        draw: function (data) {
            
            if (!data) {
                return $("<div/>");
            }
            
            var node, picture;
            
            node = $("<div/>")
                .addClass("mail-detail")
                .append(
                    picture = $("<div/>").addClass("contact-picture")
                )
                .append(
                    $("<div/>")
                        .addClass("subject")
                        .text(data.subject)
                )
                .append(
                    $("<table/>", { border: "0", cellpadding: "0", cellspacing: "0" })
                    .append(
                        $("<tbody/>")
                        .append(
                            // FROM
                            $("<tr/>")
                            .append(
                                $("<td/>").addClass("list label").text("From: ")
                            )
                            .append(
                                $("<td/>").addClass("list")
                                .append(this.serializeList(data.from))
                            )
                        )
                        .append(
                            // TO
                            $("<tr/>")
                            .append(
                                $("<td/>").addClass("list label").text("To: ")
                            )
                            .append(
                                $("<td/>").addClass("list")
                                .append(this.serializeList(data.to))
                            )
                        )
                        .append(
                            data.cc.length ?
                                // CC
                                $("<tr/>")
                                .append(
                                    $("<td/>").addClass("list label").text("Copy: ")
                                )
                                .append(
                                    $("<td/>").addClass("list")
                                    .append(this.serializeList(data.cc))
                                )
                                :
                                $()
                        )
                    )
                )
                .append(
                    $("<div/>").text("\u00a0").addClass("spacer")
                )
                .append(
                    this.getContent(data)
                );
            
            require(["io.ox/mail/api"], function (api) {
                // get contact picture
                api.getContactPicture(data.from[0][1])
                    .done(function (url) {
                        picture.css("background-image", "url(" + url + ")");
                    });
            });
            
            return node;
        }
    };
});