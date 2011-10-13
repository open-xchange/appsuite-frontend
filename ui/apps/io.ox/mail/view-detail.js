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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com
 */

define("io.ox/mail/view-detail", [
        "io.ox/core/extensions",
        "io.ox/mail/util"
    ], function (ext, util) {
        
        'use strict';
        
        // define global iframe resize handler
        window.iframeResize = function (guid, body) {
            var height = $(body).outerHeight(true);
            $("#tmp-iframe-" + guid).css("height", height + 20 + "px");
        };
        
        var that = {
                
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
            
            drawScaffold: function (obj, resolver) {
                return $("<div/>")
                    .addClass("mail-detail")
                    .busy()
                    .bind("resolve", obj, resolver);
            },
            
            draw: function (data) {
                
                if (!data) {
                    return $("<div/>");
                }
                
                var node = $("<div/>").addClass("mail-detail");
                ext.point('io.ox/mail/detail').invoke('draw', node, data);
                
                return node;
            }
        };
        
        //extensions
        ext.point('io.ox/mail/detail').extend({
            index: 120,
            id: 'flag',
            draw: function (data) {
                this.append(
                    $("<div>").addClass("abs flag flag_" + util.getFlag(data))
                );
            }
        });
        ext.point('io.ox/mail/detail').extend({
            index: 100,
            id: 'contact-picture',
            draw: function (data) {
                var picture;
                this.append(
                    picture = $("<div/>").addClass("contact-picture").hide()
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
            }
        });
        ext.point('io.ox/mail/detail').extend({
            index: 110,
            id: 'receiveddate',
            draw: function (data) {
                this.append(
                    $("<div/>").addClass("date list").text(util.getSmartTime(data.received_date))
                );
            }
        });
        ext.point('io.ox/mail/detail').extend({
            index: 120,
            id: 'fromlist',
            draw: function (data) {
                this.append(
                    $("<div/>")
                    .addClass("from list")
                    .append(util.serializeList(data.from, true))
                );
            }
        });
        ext.point('io.ox/mail/detail').extend({
            index: 130,
            id: 'subject',
            draw: function (data) {
                this.append(
                    $("<div/>")
                        .addClass("subject clear-title")
                    // inject some zero width spaces for better word-break
                        .text(_.prewrap(data.subject))
                        .append($("<span/>").addClass("priority").text(" " + util.getPriority(data)))
                    );
            }
        });
        ext.point('io.ox/mail/detail').extend({
            index: 150,
            id: 'tocopy',
            draw: function (data) {
                var showCC = data.cc && data.cc.length > 0,
                showTO = (data.to && data.to.length > 1) || showCC;
                
                this.append(
                    showTO ?
                        $("<div/>")
                            .addClass("list")
                            .append(
                                // TO
                                $("<span/>").addClass("label").text("To:\u00A0")
                            )
                            .append(
                                that.serializeList(data.to, true)
                            )
                            .append(
                                // CC
                                showCC ? $("<span/>").addClass("label").text(" Copy:\u00A0") : []
                            )
                            .append(
                                that.serializeList(data.cc, true)
                            )
                        : []
                );
            }
        });
        ext.point('io.ox/mail/detail').extend({
            index: 160,
            id: 'attachments',
            draw: function (data) {
                var i = 0,
                    $i = (data.attachments || []).length,
                    attachments = [],
                    hasAttachments = false;
                
                // get non-inline attachments
                for (; i < $i; i++) {
                    if (data.attachments[i].disp === "attachment") {
                        attachments.push(data.attachments[i]);
                        hasAttachments = true;
                    }
                }
                this.append(
                    // attachments
                    hasAttachments ?
                        $("<div/>")
                            .addClass("list")
                            .append(
                                 // TO
                                 $("<span/>").addClass("label").text("Attachments: ")
                             )
                             .append(
                                 util.serializeAttachments(data, attachments)
                             )
                        : []
                );
            }
        });
        ext.point('io.ox/mail/detail').extend({
            index: 170,
            id: 'spacer',
            draw: function (data) {
                this.append(
                    $("<hr/>", { noshade: "noshade", size: "1" }).addClass("spacer")
                );
            }
        });
        ext.point('io.ox/mail/detail').extend({
            index: 180,
            id: 'content',
            draw: function (data) {
                this.append(
                    that.getContent(data)
                );
            }
        });
        return that;
    }
);