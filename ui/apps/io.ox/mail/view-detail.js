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
     'io.ox/core/config',
     'io.ox/core/api/account',
     'gettext!io.ox/mail/mail',
     'io.ox/mail/actions'
    ], function (ext, links, util, api, config, account, gt) {

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

        return content;
    };

    var getContentType = function (type) {
        // might be: image/jpeg; name=Foto.JPG", so ...
        var split = (type || 'unknown').split(/;/);
        return split[0];
    };

    var regHTML = /^text\/html$/i,
        regImage = /^image\/(jpe?g|png|gif|bmp)$/i,
        regFolder = /^(\s*)(http[^#]+#m=infostore&f=\d+)(\s*)$/i,
        regDocument = /^(\s*)(http[^#]+#m=infostore&f=\d+&i=\d+)(\s*)$/i,
        regLink = /^(.*)(http:\/\/\S+)(\s.*)?$/i,
        regImageSrc = /(<img[^>]+src=")\/ajax/g;

    var openDocumentLink = function (e) {
        e.preventDefault();
        location.hash = e.data.hash;
        ox.launch('io.ox/files/main');
    };

    var isValidHost = function (url) {
        var match;
        return (match = url.match(/^https?:\/\/([^\/]+)/i)) && match.length &&
                _(ox.serverConfig.hosts).indexOf(match[1]);
    };

    var drawDocumentLink = function (href, title) {
        var link, match, folder, id;
        // create link
        link = $('<a>', { href: '#' })
            .css({ textDecoration: 'none', fontFamily: 'Arial' })
            .append($('<span class="label label-info">').text(title));
        // internal document?
        if (isValidHost(href) && (match = href.match(/#m=infostore&f=(\d+)&i=(\d+)/i)) && match.length) {
            // yep, internal
            folder = match[1];
            id = match[2];
            href = '#app=io.ox/files&folder=' + folder + '&id=' + folder + '.' + id;
            link.on('click', { hash: href }, openDocumentLink);
        } else {
            // nope, external
            link.attr('href', $.trim(href));
        }
        return link;
    };

    var drawLink = function (href) {
        return $('<a>', { href: href }).text(href);
    };

    var blockquoteClickOpen, blockquoteClickClose, mailTo;

    blockquoteClickOpen = function () {
        var h = this.scrollHeight + 'px';
        $(this).off('click.open')
            .css('cursor', '')
            .on('dblclick.close', blockquoteClickClose)
            .stop().animate({ maxHeight: h, opacity: 1.0 }, 500);
    };

    blockquoteClickClose = function () {
        // collapse selection created by double click
        if (document.getSelection) {
            document.getSelection().collapse(this, 0);
        }
        $(this).off('dblclick.close')
            .css('cursor', 'pointer')
            .on('click.open', blockquoteClickOpen)
            .stop().animate({ maxHeight: '3em', opacity: 0.5 }, 500);
    };

    mailTo = function (e) {
        e.preventDefault();
        var node = $(this),
            email = node.attr('href').substr(7), // cut off leading "mailto:"
            text = node.text();
        ox.launch('io.ox/mail/write/main').done(function () {
            this.compose({ to: [[text, email]] });
        });
    };

    var that = {

        getContent: function (data) {

            if (!data || !data.attachments) {
                return $();
            }

            var att = data.attachments, source = '', type, isHTML, isLarge, content;

            // use first attachment to determine content type
            type = getContentType(att[0].content_type);
            isHTML = regHTML.test(type);
            source = $.trim(att[0].content);
            isLarge = source.length > 1024 * 512; // > 512 KB

            // empty?
            if (source === '') {
                return $('<div>').addClass('content').append(
                    $('<div>')
                    .addClass('infoblock backstripes')
                    .text(gt('This email has no content'))
                );
            }

            // replace images on source level
            source = source.replace(regImageSrc, '$1' + ox.apiRoot);

            // robust constructor for large HTML
            content = document.createElement('DIV');
            content.className = 'content';
            content.innerHTML = source;
            content = $(content);

            if (isHTML) {
                // HTML
                if (!isLarge) {
                    // remove stupid tags
                    content.find('meta').remove();
                    // transform outlook's pseudo blockquotes
                    content.find('div[style*="none none none solid"][style*="1.5pt"]').each(function () {
                        $(this).replaceWith($('<blockquote>').append($(this).contents()));
                    })
                    .end()
                    // blockquote
                    .find('blockquote')
                        // remove white-space: pre/nowrap
                        .find('[style*="white-space: "]').css('whiteSpace', '').end()
                        // remove color inside blockquotes
                        .find('*').css('color', '').end()
                    .end()
                    // images with attribute width/height
                    .find('img[width], img[height]').each(function () {
                        var node = $(this), w = node.attr('width'), h = node.attr('height');
                        node.removeAttr('width height');
                        if (w) { node.css({ width: w + 'px', maxWidth: w + 'px' }); }
                        if (h) { node.css('height', h + 'px'); }
                    })
                    .end();
                    // nested message?
                    if (!('folder_id' in data) && 'filename' in data) {
                        // fix inline images in nested message
                        content.find('img[src^="cid:"]').each(function () {
                            var node = $(this), cid = '<' + String(node.attr('src') || '').substr(4) + '>', src,
                                // get proper attachment
                                attachment = _.chain(data.attachments).filter(function (a) {
                                    return a.cid === cid;
                                }).first().value();
                            if  (attachment) {
                                src = api.getUrl(_.extend(attachment, { mail: data.parent }), 'view');
                                node.attr('src', src);
                            }
                        });
                    }
                }
            } else {
                // plain TEXT
                content.addClass('plain-text').html(beautifyText(source));
            }

            // process all text nodes unless mail is too large (> 512 KB)
            if (!isLarge) {
                content.find('*').contents().each(function () {
                    if (this.nodeType === 3) {
                        var node = $(this), text = this.nodeValue, length = text.length, m;
                        // split long character sequences for better wrapping
                        if (length >= 60 && /\S{60}/.test(text)) {
                            this.nodeValue = text.replace(/(\S{60})/g, '$1\u200B'); // zero width space
                        }
                        // some replacements
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
                                $($.txt(m[1] || '')).add(drawLink(m[2])).add($.txt(m[3]))
                            );
                        }
                    }
                });
            }

            // further fixes
            // for support for very large mails we do the following stuff manually,
            // otherwise jQuery explodes with "Maximum call stack size exceeded"

            _(content.get(0).getElementsByTagName('BLOCKQUOTE')).each(function (node) {
                node.removeAttribute('style');
                node.removeAttribute('type');
            });

            _(content.get(0).getElementsByTagName('A')).each(function (node) {
                $(node).attr('target', '_blank')
                    .filter('[href^="mailto:"]').on('click', mailTo);
            });

            if (!isLarge) {
                // blockquotes (top-level only)
                content.find('blockquote').not(content.find('blockquote blockquote'))
                    .css({ maxHeight: '3em', overflow: 'hidden', opacity: 0.5, cursor: 'pointer' })
                    .on('click.open', blockquoteClickOpen)
                    .on('dblclick.close', blockquoteClickClose);
            }

            return content;
        },

        drawScaffold: function (obj, resolver) {
            return $('<div>')
                .addClass('mail-detail')
                .busy()
                .one('resolve', obj, resolver);
        },

        draw: function (data) {

            if (!data) {
                return $('<div>');
            }

            // outer node
            var node = $('<div>').addClass('mail-detail');

            // threaded & send by myself (and not in sent folder)?
            if (data.threadSize > 1 && util.byMyself(data) && !account.is('sent', data.folder_id)) {
                node.addClass('by-myself');
            }

            // invoke extensions
            ext.point('io.ox/mail/detail').invoke('draw', node, data);

            return node;
        },

        autoResolveThreads: function (e) {
            var self = $(this), parents = self.parents();
            api.get(e.data).done(function (data) {
                // replace placeholder with mail content
                data.threadPosition = e.data.threadPosition;
                data.threadSize = e.data.threadSize;
                self.replaceWith(that.draw(data));
            });
        },

        drawThread: function (node, list, mail) {
            var i = 0, obj, frag = document.createDocumentFragment(),
                scrollpane = node.closest('.scrollable'),
                nodes, numVisible;
            // loop over thread - use fragment to be fast for tons of mails
            for (; (obj = list[i]); i++) {
                if (i === 0) {
                    mail.threadPosition = obj.threadPosition;
                    mail.threadSize = obj.threadSize;
                    frag.appendChild(that.draw(mail).get(0));
                } else {
                    frag.appendChild(that.drawScaffold(obj, that.autoResolveThreads).get(0));
                }
            }
            scrollpane.scrollTop(0);
            node.idle().empty().get(0).appendChild(frag);
            // show many to resolve?
            nodes = node.find('.mail-detail');
            numVisible = (node.parent().height() / nodes.eq(0).outerHeight(true) >> 0) + 1;
            // resolve visible
            nodes.slice(0, numVisible).trigger('resolve');
            // look for scroll
            var autoResolve = function (e) {
                // determine visible nodes
                var pane = $(this), node = e.data.node;
                e.data.nodes.each(function () {
                    var self = $(this), bottom = pane.scrollTop() + (2 * node.parent().height());
                    if (bottom > self.position().top) {
                        self.trigger('resolve');
                    }
                });
            };
            scrollpane.off('scroll').on('scroll', { nodes: nodes, node: node }, _.debounce(autoResolve, 250));
            nodes = frag = node = scrollpane = list = mail = null;
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
            // some mails just have a sent_date, e.g. nested EMLs
            var date = util.getDateTime(data.received_date || data.sent_date || 0);
            this.append(
                $('<div>').addClass('date list').text(date)
            );
        }
    });

    function searchSender(e) {
        var app = ox.ui.App.get('io.ox/mail')[0],
            win = app.getWindow(),
            query = e.data.display_name || e.data.email1;
        // trigger search
        win.nodes.search.val(query).focus();
        win.search.query = query;
        win.trigger('search');
    }

    ext.point('io.ox/mail/detail').extend({
        index: 120,
        id: 'fromlist',
        draw: function (data) {
            this.append(
                $('<div>')
                .addClass('from list')
                .append(
                    util.serializeList(data.from, true, function (obj) {
                        if (ox.ui.App.get('io.ox/mail').length) {
                            this.append(
                                $('<i class="icon-search">').on('click', obj, searchSender)
                                    .css({ marginLeft: '0.5em', opacity: 0.3, cursor: 'pointer' })
                            );
                        }
                    })
                )
            );
        }
    });

    ext.point('io.ox/mail/detail').extend({
        index: 124,
        id: 'thread-position',
        draw: function (data) {
            if (data.threadSize > 1) {
                this.append(
                    $('<div>')
                    .addClass('thread-size clear-title')
                    .text(data.threadPosition + ' / ' + data.threadSize)
                );
            }
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
                    .text(_.prewrap(data.subject ? $.trim(data.subject) : '\u00A0'))
                    .append($('<span>').addClass('priority').append(util.getPriority(data)))
            );
        }
    });

    ext.point('io.ox/mail/detail').extend({
        index: 150,
        id: 'tocopy',
        draw: function (data) {

            // figure out if 'to' just contains myself - might be a mailing list, for example
            var justMe = _(data.to).reduce(function (memo, to) {
                    return memo && to[1] === config.get('mail.defaultaddress');
                }, true),
                showCC = data.cc && data.cc.length > 0,
                showTO = data.to && (data.to.length > 1 || !justMe),
                show = showTO || showCC;

            if (show) {
                this.append(
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
                );
            }
        }
    });

    var drawAttachmentDropDown = function (node, label, data) {
        // use extension pattern
        var dd = new links.DropdownLinks({
                label: label,
                classes: 'attachment-link',
                ref: 'io.ox/mail/attachment/links'
            }).draw.call(node, data),
            contentType = getContentType(data.content_type),
            url,
            filename;
        // add instant preview
        if (regImage.test(contentType)) {
            dd.find('a').on('click', data, function (e) {
                var node = $(this), data = e.data, p = node.parent(), url, src;
                if (p.hasClass('open') && p.find('.instant-preview').length === 0) {
                    url = api.getUrl(data, 'view');
                    src = url + '&scaleType=contain&width=190&height=190'; // 190 + 2 * 15 pad = 220 max-width
                    p.find('ul').append($('<li>').append($('<a>', { href: url, target: '_blank' }).append(
                        $('<img>', { src: src, alt: '' }).addClass('instant-preview')
                    )));
                }
            });
        }
        // make draggable (drag-out)
        if (_.isArray(data)) {
            url = api.getUrl(data, 'zip');
            filename = (data.subject || 'mail') + '.zip'; // yep, array prop
        } else {
            url = api.getUrl(data, 'download');
            filename = String(data.filename || '');
        }
        dd.find('a')
            .attr({
                title: data.title,
                draggable: true,
                'data-downloadurl': contentType + ':' + filename.replace(/:/g, '') + ':' + ox.abs + url
            })
            .on('dragstart', function (e) {
                $(this).css({ display: 'inline-block', backgroundColor: 'white' });
                e.originalEvent.dataTransfer.setData('DownloadURL', this.dataset.downloadurl);
            });
    };

    var isWinmailDATPart = function (obj) {
        return !('filename' in obj) && obj.attachments &&
            obj.attachments.length === 1 && obj.attachments[0].content === null;
    };

    ext.point('io.ox/mail/detail').extend({
        index: 160,
        id: 'attachments',
        draw: function (data) {

            var i, $i, obj, dat, attachments = [], hasAttachments = false,
                mail = { id: data.id, folder_id: data.folder_id };

            // get nested messages
            for (i = 0, $i = (data.nested_msgs || []).length; i < $i; i++) {
                obj = data.nested_msgs[i];
                // is wrapped attachment? (winmail.dat stuff)
                if (isWinmailDATPart(obj)) {
                    dat = obj.attachments[0];
                    attachments.push(
                        _.extend({}, dat, { mail: mail, title: obj.filename || '' })
                    );
                } else {
                    attachments.push({
                        id: obj.id,
                        content_type: 'message/rfc822',
                        filename: obj.filename ||
                            _.ellipsis((obj.subject || '').replace(/\s+/g, ' '), 50), // remove consecutive white-space
                        title: obj.filename || obj.subject || '',
                        mail: mail,
                        nested_message: _.extend({}, obj, { parent: mail })
                    });
                }
                hasAttachments = true;
            }

            // get non-inline attachments
            for (i = 0, $i = (data.attachments || []).length; i < $i; i++) {
                obj = data.attachments[i];
                if (obj.disp === 'attachment') {
                    attachments.push(
                        _.extend(obj, { mail: mail, title: obj.filename || '' })
                    );
                    hasAttachments = true;
                }
            }

            if (hasAttachments) {
                var outer = $('<div>').addClass('list attachment-list').append(
                    $('<span>').addClass('io-ox-label').text(gt('Attachments') + '\u00A0\u00A0')
                );
                _(attachments).each(function (a, i) {
                    var label = (a.filename || ('Attachment #' + i))
                        // lower case file extensions for better readability
                        .replace(/\.(\w+)$/, function (match) {
                            return match.toLowerCase();
                        });
                    // draw
                    drawAttachmentDropDown(outer, label, a);
                });
                // how 'all' drop down?
                if (attachments.length > 1) {
                    attachments.subject = data.subject;
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

    // TODO: remove click handler out of inner closure

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
                         $('<a>').text(gt('Show images')),
                         $('<i>').text(
                              ' \u2013 ' +
                              gt('External images have been blocked to protect you against potential spam!')
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

            this.addClass('view')
            .attr('data-cid', data.folder_id + '.' + data.id)
            .append(that.getContent(data), $('<div>').addClass('mail-detail-clear-both'));
        }
    });

    return that;
});
