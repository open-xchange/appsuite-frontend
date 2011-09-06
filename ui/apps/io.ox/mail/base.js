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
        extensions.registry.point("io.ox/core/person:action").each(function (i, ext) {
            _.call(ext.action, e.data);
        });
    };
   
    that = {
        
        createNewMailDialog: function () {
            require(["io.ox/mail/write"], function (m) {
                m.getApp().launch();
            });
        },
        
        serializeList: function (list, addHandlers) {
            var i = 0, $i = list.length, tmp = $(), node, displayName = "";
            for (; i < $i; i++) {
                displayName = (list[i][0] || "").replace(/(^["'\\]+|["'\\]+$)/g, "");
                node = $("<span/>").addClass("person")
                    .css("whiteSpace", "nowrap").text(displayName || list[i][1]);
                if (addHandlers) {
                    node.bind("click", { displayName: displayName, email: list[i][1] }, fnClickPerson)
                        .css("cursor", "pointer");
                }
                tmp = tmp.add(node);
                if (i < $i - 1) {
                    tmp = tmp.add($("<span/>").css("color", "#555").html("&nbsp;&bull; "));
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
            
            var node, picture,
                showCC = data.cc && data.cc.length > 0,
                showTO = (data.to && data.to.length > 1) || showCC;
            
            node = $("<div/>")
                .addClass("mail-detail")
                .append(
                    picture = $("<div/>").addClass("contact-picture").hide()
                )
                .append(
                    $("<div/>").addClass("date list").text(this.getTime(data.received_date))
                )
                .append(
                    $("<div/>")
                    .addClass("from list")
                    .append(this.serializeList(data.from, true))
                )
                .append(
                    $("<div/>")
                        .addClass("subject")
                        .text(data.subject)
                )
                .append(
                    showTO ?
                        $("<div/>")
                            .addClass("list")
                            .append(
                                // TO
                                $("<span/>").addClass("label").text("To: ")
                            )
                            .append(
                                this.serializeList(data.to, true)
                            )
                            .append(
                                // CC
                                showCC ? $("<span/>").addClass("label").text(" Copy: ") : []
                            )
                            .append(
                                this.serializeList(data.cc, true)
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