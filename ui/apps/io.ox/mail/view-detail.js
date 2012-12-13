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
     'io.ox/core/http',
     'io.ox/core/api/account',
     'settings!io.ox/mail',
     'gettext!io.ox/mail',
     'io.ox/mail/actions',
     'less!io.ox/mail/style.css'
    ], function (ext, links, util, api, config, http, account, settings, gt) {

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

    var regHTML = /^text\/html$/i,
        regImage = /^image\/(jpe?g|png|gif|bmp)$/i,
        regFolder = /^(\s*)(http[^#]+#m=infostore&f=\d+)(\s*)$/i,
        regDocument = /^(\s*)(http[^#]+#m=infostore&f=\d+&i=\d+)(\s*)$/i,
        regDocumentAlt = /^(\s*)(http[^#]+#!&?app=io.ox\/files&perspective=list?&folder=\d+&id=[\d\.]+)(\s*)$/i,
        regLink = /^(.*)(https?:\/\/\S+)(\s.*)?$/i,
        regMail = /([^\s<;\(\)\[\]]+@([a-z0-9äöüß\-]+\.)+[a-z]{2,})/i,
        regMailReplace = /([^\s<;\(\)\[\]]+@([a-z0-9äöüß\-]+\.)+[a-z]{2,})/ig, /* dedicated one to avoid strange side effects */
        regMailComplex = /(&quot;([^&]+)&quot;|"([^"]+)"|'([^']+)')(\s|<br>)+&lt;([^@]+@[^&]+)&gt;/, /* "name" <address> */
        regMailComplexReplace = /(&quot;([^&]+)&quot;|"([^"]+)"|'([^']+)')(\s|<br>)+&lt;([^@]+@[^&]+)&gt;/g, /* "name" <address> */
        regImageSrc = /(<img[^>]+src=")\/ajax/g;

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
            .replace(regMailComplex, '<a href="mailto:$6">$2$3</a>')
        );

        return content;
    };

    var getContentType = function (type) {
        // might be: image/jpeg; name=Foto.JPG", so ...
        var split = (type || 'unknown').split(/;/);
        return split[0];
    };

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

    var delayedRead = function (data, node) {
        setTimeout(function () {
            node.removeClass('unread');
            api.tracker.applyAutoRead(data);
            ext.point('io.ox/mail/detail/notification').invoke('action', node, data);
            node = data = null;
        }, 1000); // 1 second(s)
    };

    var blockquoteMore, blockquoteClickOpen, blockquoteClickClose, mailTo;

    blockquoteMore = function (e) {
        e.preventDefault();
        blockquoteClickOpen.call($(this).prev().get(0));
        $(this).hide();
    };

    blockquoteClickOpen = function () {
        var h = this.scrollHeight + 'px', node = $(this);
        $(this)
            .off('click.open')
            .on('dblclick.close', blockquoteClickClose)
            .stop().animate({ maxHeight: h }, 300, function () {
                $(this).removeClass('collapsed-blockquote');
            });
        $(this).next().hide();
    };

    blockquoteClickClose = function () {
        // collapse selection created by double click
        if (document.getSelection) {
            document.getSelection().collapse(this, 0);
        }
        $(this).off('dblclick.close')
            .on('click.open', blockquoteClickOpen)
            .stop().animate({ maxHeight: '2em' }, 300, function () {
                $(this).addClass('collapsed-blockquote');
            });
        $(this).next().show();
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

    var copyThreadData = function (a, b) {
        a.threadKey = b.threadKey;
        a.threadPosition = b.threadPosition;
        a.threadSize = b.threadSize;
    };

    var that = {

        getContent: function (data) {

            if (!data || !data.attachments) {
                return $();
            }

            var att = data.attachments, source = '', type = 'text/plain',
                isHTML = false, isLarge = false, content = '';

            try {

                // find first text/html attachment to determine content type
                _(att).find(function (obj) {
                    if ((/^text\/(plain|html)$/i).test(obj.content_type)) {
                        type = obj.content_type;
                        return true;
                    } else {
                        return false;
                    }
                });

                isHTML = regHTML.test(type);

                // add other parts?
                _(att).each(function (attachment, index) {
                    if (attachment.disp === 'inline' && attachment.content_type === type) {
                        source += attachment.content;
                    }
                });

                source = $.trim(source);
                isLarge = source.length > 1024 * 512; // > 512 KB

                // empty?
                if (source === '') {
                    return $('<div class="content">').append(
                        $('<div class="alert alert-info">')
                        .text(gt('This mail has no content'))
                    );
                }

                // replace images on source level
                source = source.replace(regImageSrc, '$1' + ox.apiRoot);

                // robust constructor for large HTML
                content = document.createElement('DIV');
                content.className = 'content noI18n';
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
                        // base tag
                        .find('base').remove().end()
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
                            // just set width; max-width=100% should still apply
                            if (w) { node.css({ width: w + 'px' }); }
                            if (h) { node.css({ height: h + 'px'}); }
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
                    content.contents().add(content.find('*').not('style').contents()).each(function () {
                        if (this.nodeType === 3) {
                            var node = $(this), text = this.nodeValue, length = text.length, m;
                            // split long character sequences for better wrapping
                            if (length >= 60 && /\S{60}/.test(text)) {
                                this.nodeValue = text.replace(/(\S{60})/g, '$1\u200B'); // zero width space
                            }
                            // some replacements
                            if (((m = text.match(regDocument)) && m.length) || ((m = text.match(regDocumentAlt)) && m.length)) {
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
                            } else if (regMail.test(text) && node.closest('a').length === 0) {
                                // links
                                // escape first
                                text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                // try the "NAME" <ADDRESS> pattern
                                if (regMailComplex.test(text)) {
                                    node.replaceWith(
                                        $('<div>')
                                        .html(text.replace(regMailComplexReplace, '<a href="mailto:$6">$2$3</a>'))
                                        .contents()
                                    );
                                } else {
                                    node.replaceWith(
                                        $('<div>')
                                        .html(text.replace(regMailReplace, '<a href="mailto:$1">$1</a>'))
                                        .contents()
                                    );
                                }
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
                    content.find('blockquote').not(content.find('blockquote blockquote')).each(function () {
                        var node = $(this);
                        node.addClass('collapsed-blockquote')
                            .css({ opacity: 0.75, maxHeight: '2em' })
                            .on('click.open', blockquoteClickOpen)
                            .on('dblclick.close', blockquoteClickClose)
                            .after(
                                $('<a href="#" class="toggle-blockquote">').text(gt('Show more'))
                                .on('click', blockquoteMore)
                            );
                        setTimeout(function () {
                            if (node.prop('scrollHeight') < 60) { // 3 rows a 20px line-height
                                node.removeClass('collapsed-blockquote')
                                    .css('maxHeight', '')
                                    .off('click.open dblclick.close')
                                    .next().remove();
                            }
                            node = null;
                        }, 0);
                    });
                }

            } catch (e) {
                console.error('mail.getContent', e.message, e, data);
            }

            return content;
        },

        drawScaffold: function (baton, resolver) {
            return $('<div class="mail-detail"></div>')
                .busy()
                .one('resolve', { baton: baton }, resolver);
        },

        draw: function (baton) {

            if (!baton) {
                return $('<div>');
            }

            // ensure baton
            baton = ext.Baton.ensure(baton);

            var data = baton.data,
                self = this,
                node = $('<div class="mail-detail">'),
                container = $.createViewContainer(data, api)
                    .addClass('mail-detail-decorator')
                    .on('redraw', function (e, tmp) {
                        copyThreadData(tmp, data);
                        container.replaceWith(self.draw(tmp));
                    });

            try {

                // threaded & send by myself (and not in sent folder)?
                if (data.threadSize > 1 && util.byMyself(data) && !account.is('sent', data.folder_id)) {
                    node.addClass('by-myself');
                }

                if (api.tracker.isUnseen(data)) {
                    node.addClass('unread');
                }
                if (api.tracker.canAutoRead(data)) {
                    delayedRead(data, node);
                }

                // invoke extensions
                ext.point('io.ox/mail/detail').invoke('draw', node, baton);

            } catch (e) {
                console.error('mail.draw', e.message, e, baton);
            }

            return container.append(node);
        },

        autoResolveThreads: (function () {

            function resolve(node, baton) {
                api.get(api.reduce(baton.data)).then(
                    function (data) {
                        // replace placeholder with mail content
                        copyThreadData(data, baton.data);
                        node.replaceWith(that.draw(ext.Baton({ data: data, options: baton.options })));
                        baton = null;
                    },
                    function (err) {
                        node.idle().empty().append(
                            $.fail(baton.options.failMessage, function () {
                                resolve(node, baton);
                                baton = null;
                            })
                        );
                    }
                );
            }

            return function (e) {
                resolve($(this), e.data.baton);
            };

        }()),

        drawThread: (function () {

            function autoResolve(e) {
                // check for data (due to debounce)
                if (e.data) {
                    // determine visible nodes
                    var pane = $(this), node = e.data.node,
                        top = pane.scrollTop(), bottom = top + node.parent().height();
                    e.data.nodes.each(function () {
                        var self = $(this), pos = self.position();
                        if ((pos.top + 100) > top && pos.top < bottom) { // +100 due to min-height
                            self.trigger('resolve');
                        }
                    });
                }
            }

            function fail(node, baton) {
                node.idle().empty().append($.fail(baton.options.failMessage, function () {
                    baton.options.retry(baton);
                }));
            }

            function drawThread(node, baton, pos, top, bottom, mails) {
                var i, obj, frag = document.createDocumentFragment(),
                    scrollpane = node.closest('.scrollable').off('scroll'),
                    nodes, inline, top, mail,
                    list = baton.data;
                try {
                    // draw inline links for whole thread
                    if (list.length > 1) {
                        inline = $('<div class="thread-inline-actions">');
                        ext.point('io.ox/mail/thread').invoke('draw', inline, baton);
                        inline.find('.dropdown > a').addClass('btn btn-primary');
                        frag.appendChild(inline.get(0));
                    }
                    // loop over thread - use fragment to be fast for tons of mails
                    for (i = 0; (obj = list[i]); i++) {
                        if (i >= top && i <= bottom) {
                            mail = mails.shift();
                            copyThreadData(mail, obj);
                            frag.appendChild(that.draw(
                                ext.Baton({ data: mail, app: baton.app, options: baton.options })
                            ).get(0));
                        } else {
                            frag.appendChild(that.drawScaffold(
                                ext.Baton({ data: obj, app: baton.app, options: baton.options }),
                                that.autoResolveThreads).get(0)
                            );
                        }
                    }
                    node.get(0).appendChild(frag);
                    // get nodes
                    nodes = node.find('.mail-detail').not('.thread-inline-actions');
                    // set initial scroll position (37px not to see thread's inline links)
                    top = nodes.eq(pos).position().top - 20;
                    scrollpane.scrollTop(list.length === 1 ? 0 : top);
                    scrollpane.on('scroll', { nodes: nodes, node: node }, _.debounce(autoResolve, 100));
                    scrollpane.one('scroll.now', { nodes: nodes, node: node }, autoResolve);
                    scrollpane.trigger('scroll.now'); // to be sure
                    nodes = frag = node = scrollpane = list = mail = mails = null;
                } catch (e) {
                    console.error('mail.drawThread', e.message, e);
                    fail(node, baton);
                }
            }

            return function (baton) {

                // define next step now
                var list = baton.data,
                    next = _.lfo(drawThread),
                    node = this;

                // get list data, esp. to know unseen flag - we need this list for inline link checks anyway
                api.getList(list).then(
                    function (list) {

                        var i, $i, pos, numVisible, top, bottom, defs = [];

                        try {
                            // getList might be incomplete
                            list = _(list).compact();

                            // which mail to focus?
                            for (i = pos = $i = list.length - 1; i >= 0; i--) {
                                pos = i;
                                if (util.isUnread(list[i])) { break; }
                            }
                            // how many visible?
                            if (pos === 0) {
                                numVisible = 1;
                                top = bottom = 0;
                            } else {
                                numVisible = Math.ceil(node.parent().height() / 300);
                                bottom = Math.min(pos + numVisible, $i);
                                top = Math.max(0, pos - (pos + numVisible - bottom));
                            }
                            // fetch mails we will display
                            for (i = top; i <= bottom; i++) {
                                defs.push(api.get(api.reduce(list[i])));
                            }
                            $.when.apply($, defs).then(
                                function () {
                                    baton = ext.Baton({ data: list, app: baton.app, options: baton.options });
                                    next(node, baton, pos, top, bottom, $.makeArray(arguments));
                                },
                                function () {
                                    fail(node, baton);
                                }
                            );
                        } catch (e) {
                            console.error('mail.drawThread', e.message, e);
                            fail(node, baton);
                        }
                    },
                    function () {
                        fail(node, baton);
                    }
                );
            };
        }())
    };

    //extensions

    ext.point('io.ox/mail/detail').extend({
        index: 100,
        id: 'contact-picture',
        draw: function (baton) {
            var data = baton.data, picture;
            this.append(
                picture = $('<div>').addClass('contact-picture')
            );
            require(['io.ox/contacts/api'], function (api) {
                // get contact picture
                api.getPictureURL(data.from && data.from.length ? data.from[0][1] : '', { width: 64, height: 64, scaleType: 'contain' })
                    .done(function (url) {
                        if (url) {
                            picture.css({ backgroundImage: 'url(' + url + ')' });
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
        draw: function (baton) {
            // some mails just have a sent_date, e.g. nested EMLs
            var data = baton.data;
            var date = util.getDateTime(data.received_date || data.sent_date || 0);
            this.append(
                $('<div>').addClass('date list').text(_.noI18n(date))
            );
        }
    });

    function searchSender(e) {
        var app = ox.ui.App.get('io.ox/mail')[0],
            win = app.getWindow(),
            query = e.data.display_name || e.data.email1;
        // trigger search
        win.search.start(query);
    }

    ext.point('io.ox/mail/detail').extend({
        index: 120,
        id: 'fromlist',
        draw: function (baton) {
            var data = baton.data, list = util.serializeList(data, 'from'), node;
            this.append($('<div class="from list">').append(list));
            if (ox.ui.App.get('io.ox/mail').length) {
                node = list.last();
                node.after(
                    $('<i class="icon-search">').on('click', node.data('person'), searchSender)
                        .css({ marginLeft: '0.5em', opacity: 0.3, cursor: 'pointer' })
                );
            }
            list = node = null;
        }
    });

    ext.point('io.ox/mail/detail').extend({
        index: 124,
        id: 'thread-position',
        draw: function (baton) {
            var data = baton.data;
            if (data.threadSize > 1) {
                this.append(
                    $('<div>')
                    .addClass('thread-size clear-title')
                    .text(_.noI18n(data.threadPosition + ' / ' + data.threadSize))
                );
            }
        }
    });

    var colorNames = {
        NONE:       gt('None'),
        RED:        gt('Red'),
        BLUE:       gt('Blue'),
        GREEN:      gt('Green'),
        GREY:       gt('Grey'),
        PURPLE:     gt('Purple'),
        LIGHTGREEN: gt('Light green'),
        ORANGE:     gt('Orange'),
        PINK:       gt('Pink'),
        LIGHTBLUE:  gt('Light blue'),
        YELLOW:     gt('Yellow')
    };

    function changeLabel(e) {
        e.preventDefault();
        $(this).closest('.flag-dropdown').removeClass(e.data.flagclass).addClass('flag_' + e.data.color);
        return api.changeColor(e.data.data, e.data.color);
    }

    ext.point('io.ox/mail/detail').extend({
        index: 105,
        id: 'flag',
        draw: function (baton) {
            var data = baton.data,
            flagclass = 'flag_' + util.getFlag(data);
            this.append(
                $('<div class="dropdown flag-dropdown clear-title flag">')
                .addClass(flagclass)
                .append(
                    // box
                    $('<a href="#" class="abs dropdown-toggle" data-toggle="dropdown">'),
                    // drop down
                    $('<ul class="dropdown-menu">')
                    .append(
                        _(api.COLORS).reduce(function (memo, index, color) {
                            return memo.add($('<li>').append(
                                $('<a href="#">').append(
                                    index > 0 ? $('<span class="flag-example">').addClass('flag_' + index) : $(),
                                    $.txt(colorNames[color])
                                )
                                .on('click', { data: data, color: index, flagclass: flagclass }, changeLabel)
                                .addClass(data.color_label === index ? 'active-label' : undefined)
                            ));
                        }, $())
                    )
                )
            );
        }
    });

    ext.point('io.ox/mail/detail').extend({
        index: 130,
        id: 'subject',
        draw: function (baton) {
            var data = baton.data;
            this.append(
                $('<div>')
                    .addClass('subject clear-title')
                    // inject some zero width spaces for better word-break
                    .text(_.noI18n(data.subject ? $.trim(data.subject) : '\u00A0'))
                    .append($('<span>').addClass('priority').append(util.getPriority(data)))
            );
        }
    });

    var drawAllDropDown = function (node, label, data) {
        // use extension pattern
        var dd = new links.DropdownLinks({
                label: label,
                classes: 'all-link',
                ref: 'io.ox/mail/all/actions'
            }).draw.call(node, data);
    };

    ext.point('io.ox/mail/detail').extend({
        index: 150,
        id: 'tocopy',
        draw: function (baton) {

            var data = baton.data;

            // figure out if 'to' just contains myself - might be a mailing list, for example
            var showCC = data.cc && data.cc.length > 0,
                showTO = data.to && data.to.length > 0,
                show = showTO || showCC,
                container = $('<div>').addClass('to-cc list');

            if (show) {
                this.append(
                    container.append(
                        // TO
                        $('<span>').addClass('io-ox-label').append(
                            $.txt(gt('To')),
                            $.txt(_.noI18n('\u00A0\u00A0'))
                        ),
                        util.serializeList(data, 'to'),
                        $.txt(_.noI18n(' \u00A0 ')),
                        //#. CC list - use npgettext cause pgettext is broken
                        showCC ? $('<span>').addClass('io-ox-label').append(
                            $.txt(gt.npgettext('CC', 'Copy', 'Copy', 1)),
                            _.noI18n('\u00A0\u00A0')
                        ) : [],
                        util.serializeList(data, 'cc'),
                        $.txt(_.noI18n(' \u00A0 '))
                    )
                );
                drawAllDropDown(container, gt('All recipients'), data);
            }
        }
    });

    var drawAttachmentDropDown = function (node, label, data) {
        // use extension pattern
        var dd = new links.DropdownLinks({
                label: label,
                classes: 'attachment-link',
                ref: 'io.ox/mail/attachment/links'
            }).draw.call(node, ext.Baton({ data: data })),
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
        return dd;
    };

    function showAllAttachments(e) {
        $(this).closest('.attachment-list').children().css('display', 'inline-block');
        $(this).remove();
    }

    ext.point('io.ox/mail/detail').extend({
        index: 160,
        id: 'attachments',
        draw: function (baton) {

            var data = baton.data;
            var attachments = util.getAttachments(data), length = attachments.length;

            if (length > 0) {
                var outer = $('<div>').addClass('list attachment-list').append(
                    $('<span>').addClass('io-ox-label').append(
                        $.txt(gt.npgettext('plural', 'Attachment', 'Attachments', length)),
                        $.txt('\u00A0\u00A0')
                    )
                );
                _(attachments).each(function (a, i) {
                    try {
                        var label = (a.filename || ('Attachment #' + i))
                            // lower case file extensions for better readability
                            .replace(/\.(\w+)$/, function (match) {
                                return match.toLowerCase();
                            });
                        // draw
                        var dd = drawAttachmentDropDown(outer, _.noI18n(label), a);
                        // cut off long lists?
                        if (i > 3 && length > 5) {
                            dd.hide();
                        }
                    } catch (e) {
                        console.error('mail.drawAttachment', e.message);
                    }
                });
                // add "[n] more ..."
                if (length > 5) {
                    outer.append(
                        //#. 'more' like in 'x more attachments' / 'weitere' in German
                        $('<a href="#" class="n-more">').text((length - 4) + ' ' + gt('more') + ' ...').click(showAllAttachments)
                    );
                }
                // how 'all' drop down?
                if (length > 1) {
                    attachments.subject = data.subject;
                    drawAttachmentDropDown(outer, gt('All attachments'), attachments).find('a').removeClass('attachment-link');
                }
                this.append(outer);
            }
        }
    });

    // inline links for each mail
    ext.point('io.ox/mail/detail').extend(new links.InlineLinks({
        index: 170,
        id: 'inline-links',
        ref: 'io.ox/mail/links/inline'
    }));

    // inline links for entire thread
    ext.point('io.ox/mail/thread').extend(new links.DropdownLinks({
        label: gt('Entire thread'),
        zIndex: 12001,
        ref: 'io.ox/mail/links/inline'
    }));

    ext.point('io.ox/mail/detail').extend({
        index: 90,
        id: 'phishing-warning',
        draw: function (baton) {
            var data = baton.data;
            if ('headers' in data) {
                // TODO: get proper settings here
                var headers = settings.get('phishing/headers', []), key;
                for (key in headers) {
                    if (headers[key] in data.headers) {
                        // show phishing warning
                        this.append(
                            $('<div class="mail-warning progress progress-warning progress-striped">')
                            .append(
                                 $('<div class="bar">')
                                 .text(gt('Warning: This message might be a phishing or scam mail'))
                             )
                        );
                        break;
                    }
                }
            }
        }
    });

    // TODO: remove click handler out of inner closure
    ext.point('io.ox/mail/detail').extend({
        index: 195,
        id: 'externalresources-warning',
        draw: function (baton) {
            var data = baton.data;
            var self = this;
            if (data.modified === 1) {
                this.append(
                    $('<div class="alert alert-info cursor-pointer">')
                    .append(
                         $('<a>').text(gt('Show images')),
                         $('<i>').append(
                             $.txt(_.noI18n(' \u2013 ')),
                             $.txt(gt('External images have been blocked to protect you against potential spam!'))
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
                                    self.parent().empty().append(content.children());
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
        draw: function (baton) {

            var data = baton.data;

            this.attr('data-cid', data.folder_id + '.' + data.id)
            .append(that.getContent(data), $('<div>').addClass('mail-detail-clear-both'));

            var content = this.find('.content');

            setTimeout(function () {
                var scrollHeight = content.get(0).scrollHeight;
                if (scrollHeight > content.height()) {
                    content.css('height', scrollHeight + 'px');
                }
                content = null;
            }, 0);
        }
    });

    //Extensionpoint to remove read mails in notification Area
    ext.point('io.ox/mail/detail/notification').extend({
        index: 100,
        id: 'update-notification',
        action: function (data) {
            //build cid
            var cid = (data.folder_id || data.folder) + '.' + data.id,
                notificationItem = $.find('#io-ox-notifications-mail .item[data-cid="' + cid + '"]');
            if (notificationItem) {
                $(notificationItem).trigger('dispose');//use dispose event, to clean up properly
            }
        }
    });

    return that;
});
