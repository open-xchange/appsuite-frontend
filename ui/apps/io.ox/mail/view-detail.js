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

define('io.ox/mail/view-detail',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/mail/util',
     'io.ox/mail/api',
     'gettext!io.ox/mail/mail',
     'io.ox/mail/actions'
    ], function (ext, links, util, api, gt) {

    'use strict';

    // define global iframe resize handler
    window.iframeResize = function (guid, doc) {
        _.defer(function () {
            var height = $(doc.body).outerHeight(true);
            $('#tmp-iframe-' + guid).css('height', height + 30 + 'px');
        });
        if (Modernizr.touch) {
            $(doc).on('touchmove', function (e) {
                e.preventDefault();
            });
        }
    };

    /*
     * Helpers to beautify text mails
     */
    var markupQuotes = function (text) {
        var lines = String(text || '').split(/<br\s?\/?>/i),
            quoting = false,
            regQuoted = /^&gt;( |$)/i,
            i = 0, $i = lines.length, tmp = [], line;
        for (text = ''; i < $i; i++) {
            line = lines[i];
            if (!regQuoted.test(line)) {
                if (!quoting) {
                    text += line + '<br>';
                } else {
                    tmp = $.trim(tmp.join('\n')).replace(/\n/g, '<br>');
                    text = text.replace(/<br>$/, '') + '<blockquote><p>' + tmp + '</p></blockquote>' + line;
                    quoting = false;
                }
            } else {
                if (quoting) {
                    tmp.push(line.replace(regQuoted, ''));
                } else {
                    quoting = true;
                    tmp = [line.replace(regQuoted, '')];
                }
            }
        }
        return text;
    };

    var beautifyText = function (text) {

        var content = markupQuotes(
            $.trim(text)
            // remove line breaks
            .replace(/\n|\r/g, '')
            // replace leading BR
            .replace(/^\s*(<br\/?>\s*)+/g, '')
            // reduce long BR sequences
            .replace(/(<br\/?>\s*){3,}/g, '<br><br>')
            // remove split block quotes
            .replace(/<\/blockquote>\s*(<br\/?>\s*)+<blockquote[^>]+>/g, '<br><br>')
            // add markup for email addresses
            .replace(/(&quot;([^&]+)&quot;|"([^"]+)"|'([^']+)')(\s|<br>)+&lt;([^@]+@[^&]+)&gt;/g, '<a href="mailto:$6">$2$3</a>')
        );

//      // get contents to split long character sequences for better wrapping
//      content.contents().each(function (i) {
//          var node = $(this), text = node.text(), length = text.length;
//          if (length >= 60) {
//              node.text(text.replace(/(\S{60})/g, '$1\u200B')); // zero width space
//          }
//      });

//      // collapse block quotes
//      content.find('blockquote').each(function () {
//          var quote = $(this);
//          quote.text(quote.contents().text().substr(0, 150));
//      });

        return content;
    };

    var getContentType = function (type) {
        // might be: image/jpeg; name=Foto.JPG", so ...
        var split = (type || 'unknown').split(/;/);
        return split[0];
    };

    var regHTML = /^text\/html$/i,
        regText = /^text\/plain$/i,
        regImage = /^image\/(jpe?g|png|gif|bmp)$/i,
        regFolder = /^(\s*)(http[^#]+#m=infostore&f=\d+)(\s*)$/i,
        regDocument = /^(\s*)(http[^#]+#m=infostore&f=\d+&i=\d+)(\s*)$/i,
        regLink = /^(\s*)(http\S+)(\s*)$/i;

    var hasMultipleTextParts = function (att) {
        return _(att).reduce(function (memo, a) {
            var type = getContentType(a.content_type);
            return memo + regText.test(type);
        }, 0) > 1;
    };

    var drawDocumentLink = function (href, title) {
        return $('<a>', { href: $.trim(href) }).css({ textDecoration: 'none', fontFamily: 'Arial' })
            .append($('<span class="label label-info">').text(title));
    };

    var drawLink = function (href) {
        return $('<a>', { href: href }).text(href);
    };

    var that = {

        getContent: function (data) {

            if (!data || !data.attachments) {
                return $();
            }

            var att = data.attachments, i = 0, $i = att.length,
                text = '', html = '', type, src,
                multipleTextParts = hasMultipleTextParts(att),
                content = $('<div>').addClass('content');

            for (; i < $i; i++) {
                type = getContentType(att[i].content_type);
                if (html === '' && text === '' && regHTML.test(type)) {
                    // HTML
                    html = att[i].content;
                    break;
                } else if (regText.test(type)) {
                    // plain TEXT
                    text += att[i].content;
                } else if (multipleTextParts && regImage.test(type)) {
                    // image surrounded by text parts
                    src = api.getUrl(att[i], 'view') + '&scaleType=contain&width=800&height=600';
                    text += '\n<br>\n<br>\n<img src="' + src + '" alt="" style="display: block">\n';
                }
            }

            // empty?
            if ($.trim(html || text) === '') {
                return content.append(
                    $('<div>')
                    .addClass('infoblock backstripes')
                    .text(gt('This email has no content'))
                );
            }

            if (html !== '') {
                // HTML
                content.append($(html))
                    .find('meta').remove().end();
            }
            else if (text !== '') {
                // plain TEXT
                content.addClass('plain-text').html(beautifyText(text));
            }

            // further fixes
            content
                .find('*')
                    .filter(function () {
                        return $(this).children().length === 0;
                    })
                    .each(function () {
                        var node = $(this), text = node.text(), m;
                        if ((m = text.match(regDocument)) && m.length) {
                            // link to document
                            node.replaceWith(
                                 $($.txt(m[1])).add(drawDocumentLink(m[2], gt('Document'))).add($.txt(m[3]))
                            );
                        } else if ((m = text.match(regFolder)) && m.length) {
                            // link to folder
                            node.replaceWith(
                                $($.txt(m[1])).add(drawDocumentLink(m[2], gt('Folder'))).add($.txt(m[3]))
                            );
                        } else if ((m = text.match(regLink)) && m.length && node.closest('a').length === 0) {
                            node.replaceWith(
                                $($.txt(m[1])).add(drawLink(m[2])).add($.txt(m[3]))
                            );
                        }
                    })
                    .end().end()
                .find('blockquote').removeAttr('style type').end()
                .find('a').attr('target', '_blank').end();

            return content;
        },

        drawScaffold: function (obj, resolver) {
            return $('<div>')
                .addClass('mail-detail page')
                .busy()
                .one('resolve', obj, resolver);
        },

        draw: function (data) {

            if (!data) {
                return $('<div>');
            }

            var node = $('<div>').addClass('mail-detail');
            ext.point('io.ox/mail/detail').invoke('draw', node, data);
            return node;
        }
    };

    //extensions

    ext.point('io.ox/mail/detail').extend({
        index: 100,
        id: 'contact-picture',
        draw: function (data) {
            var picture;
            this.append(
                picture = $('<div>').addClass('contact-picture').hide()
            );
            require(['io.ox/contacts/api'], function (api) {
                // get contact picture
                api.getPictureURL(data.from[0][1])
                    .done(function (url) {
                        if (url) {
                            picture.css('background-image', 'url(' + url + ')').show();
                        }
                        if (/dummypicture\.png$/.test(url)) {
                            picture.addClass('default-picture');
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
                $('<div>').addClass('date list').text(util.getSmartTime(data.received_date))
            );
        }
    });

    ext.point('io.ox/mail/detail').extend({
        index: 120,
        id: 'fromlist',
        draw: function (data) {
            this.append(
                $('<div>')
                .addClass('from list')
                .append(util.serializeList(data.from, true))
            );
        }
    });

    ext.point('io.ox/mail/detail').extend({
        index: 125,
        id: 'flag',
        draw: function (data) {
            this.append(
                $('<div>').addClass('flag flag_' + util.getFlag(data) + ' clear-title').text('\u00A0')
            );
        }
    });

    ext.point('io.ox/mail/detail').extend({
        index: 130,
        id: 'subject',
        draw: function (data) {
            this.append(
                $('<div>')
                    .addClass('subject clear-title')
                    // inject some zero width spaces for better word-break
                    .text(_.prewrap(data.subject || '\u00A0'))
                    .append($('<span>').addClass('priority').append(util.getPriority(data)))
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
                    $('<div>')
                        .addClass('to-cc list')
                        .append(
                            // TO
                            $('<span>').addClass('io-ox-label').text(gt('To') + '\u00A0\u00A0'),
                            util.serializeList(data.to, true),
                            $.txt(' \u00A0 '),
                            // CC
                            showCC ? $('<span>').addClass('io-ox-label').text(gt('Copy') + '\u00A0\u00A0') : [],
                            util.serializeList(data.cc, true)
                        )
                    : []
            );
        }
    });

    var drawAttachmentDropDown = function (node, label, data) {
        // use extension pattern
        new links.DropdownLinks({
            label: label,
            classes: 'attachment-link',
            ref: 'io.ox/mail/attachment/links'
        }).draw.call(node, data);
    };

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
                if (data.attachments[i].disp === 'attachment') {
                    attachments.push(
                        _.extend(data.attachments[i], { mail: { id: data.id, folder_id: data.folder_id }})
                    );
                    hasAttachments = true;
                }
            }
            if (hasAttachments) {
                var outer = $('<div>').append(
                    $('<span>').addClass('io-ox-label').text(gt('Attachments') + '\u00A0\u00A0')
                );
                _(attachments).each(function (a, i) {
                    var label = a.filename || ('Attachment #' + i);
                    drawAttachmentDropDown(outer, label, a);
                });
                // how 'all' drop down?
                if (attachments.length > 1) {
                    drawAttachmentDropDown(outer, gt('All'), attachments);
                }
                this.append(outer);
            }
        }
    });

    ext.point('io.ox/mail/detail').extend(new links.InlineLinks({
        index: 170,
        id: 'inline-links',
        ref: 'io.ox/mail/links/inline'
    }));

    ext.point('io.ox/mail/detail').extend({
        index: 195,
        id: 'externalresources-warning',
        draw: function (data) {
            var self = this;
            if (data.modified === 1) {
                this.append(
                    $('<div>')
                    .addClass('list')
                    .addClass('infoblock backstripes')
                    .append(
                         $('<a>').text(gt('Bilder anzeigen')),
                         $('<i>').text(
                              ' \u2013 ' +
                              gt('In dieser E-Mail wurden externe Bilder blockiert, um potenziellen Missbrauch durch SPAM zu verhindern.')
                         )
                     )
                    .on('click', function (e) {
                        e.preventDefault();
                        require(['io.ox/mail/api'], function (api) {
                            // get unmodified mail
                            api.getUnmodified(data)
                                .done(function (unmodifiedData) {
                                    // keep outer node due to custom CSS classes (e.g. page)
                                    var content = that.draw(unmodifiedData);
                                    self.empty().append(content.children());
                                });
                        });
                    })
                );
            }
        }
    });

    ext.point('io.ox/mail/detail').extend({
        index: 200,
        id: 'content',
        draw: function (data) {
            this.addClass('view').append(
                that.getContent(data),
                $('<div>').addClass('mail-detail-clear-both')
            );
        }
    });

    return that;
});
