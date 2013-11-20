/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/content',
    ['io.ox/mail/api',
     'io.ox/core/util',
     'io.ox/core/emoji/util',
     'settings!io.ox/mail',
     'gettext!io.ox/mail'
    ], function (api, coreUtil, emoji, settings, gt) {

    'use strict';

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
                    text = text.replace(/<br>$/, '') + '<blockquote type="cite"><p>' + tmp + '</p></blockquote>' + line;
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
        return text.replace(/<br>$/, '');
    };

    var regHTML = /^text\/html$/i,
        regFolder = /^(\s*)(http[^#]+#m=infostore&f=(\d+))(\s*)$/i,
        regFolderAlt = /^(\s*)(http[^#]+#!?&?app=io\.ox\/files(?:&perspective=\S*)?&folder=(\d+))(\s*)$/i,
        regDocument = /^(\s*)(http[^#]+#m=infostore&f=(\d+)&i=(\d+))(\s*)$/i,
        regDocumentAlt = /^(\s*)(http[^#]+#!?&?app=io\.ox\/files(?:&perspective=\S*)?&folder=(\d+)&id=([\d\.]+))(\s*)$/i,
        regDocumentAlt2 = /^(\s*)(http[^#]+#!?&?app=io\.ox\/files&folder=(\d+)(?:&perspective=\S*)?&id=([\d\.]+))(\s*)$/i,
        regTask = /^(\s*)(http[^#]+#m=task&i=(\d+)&f=(\d+))(\s*)$/i,
        regTaskAlt = /^(\s*)(http[^#]+#!?&?app=io\.ox\/tasks&id=\d+.(\d+)&folder=([\d\.]+))(\s*)$/i,
        regAppointment = /^(\s*)(http[^#]+#m=calendar&i=(\d+)&f=(\d+))(\s*)$/i,
        regAppointmentAlt = /^(\s*)(http[^#]+#!?&?app=io\.ox\/calendar(?:&perspective=list)?&folder=(\d+)&id=([\d\.]+))(\s*)$/i,
        regLink = /^(.*)(https?:\/\/\S+)(\s.*)?$/i,
        regMail = /([^\s<;\(\)\[\]]+@([a-z0-9äöüß\-]+\.)+[a-z]{2,})/i,
        regMailReplace = /([^\s<;\(\)\[\]\|\"]+@([a-z0-9äöüß\-]+\.)+[a-z]{2,})/ig, /* dedicated one to avoid strange side effects */
        regMailComplex = /(&quot;([^&]+)&quot;|"([^"]+)"|'([^']+)')(\s|<br>)+&lt;([^@]+@[^&]+)&gt;/, /* "name" <address> */
        regMailComplexReplace = /(&quot;([^&]+)&quot;|"([^"]+)"|'([^']+)')(\s|<br>)+&lt;([^@]+@[^&]+)&gt;/g, /* "name" <address> */
        regImageSrc = /(<img[^>]+src=")\/ajax/g;

    var insertEmoticons = (function () {

        var emotes = {
            ':-)': '&#x1F60A;',
            ':)': '&#x1F60A;',
            ';-)': '&#x1F609;',
            ';)': '&#x1F609;',
            ':-D': '&#x1F603;',
            ':D': '&#x1F603;',
            ':-|': '&#x1F614;', // may be, switch to &#x1F610; once we have the icon for it (neutral face)
            ':|': '&#x1F614;', // may be, switch to &#x1F610; once we have the icon for it (neutral face)
            ':-(': '&#x1F61E;',
            ':(': '&#x1F61E;'
        };

        var regex = /(&quot)?([:;]-?[(|)D])\W/g;

        return function (text) {
            if (settings.get('displayEmoticons')) {
                text = text.replace(regex, function (all, quot, match) {
                    // if we hit &quot;-) we just return
                    if (quot) return all;
                    // otherwise find emote
                    var emote = $('<div>').html(emotes[match]).text();
                    return !emote ? match : emote;
                });
            }
            return text;
        };
    }());

    var isURL = /^https?:\S+$/i;

    var beautifyText = function (text) {

        text = $.trim(text)
            // remove line breaks
            .replace(/[\n\r]/g, '')
            // remove leading BR
            .replace(/^\s*(<br\s*\/?>\s*)+/g, '')
            // reduce long BR sequences
            .replace(/(<br\/?>\s*){3,}/g, '<br><br>')
            // combine split block quotes
            .replace(/<\/blockquote>\s*(<br\/?>\s*)*<blockquote[^>]+>/g, '<br><br>')
            // add markup for email addresses
            .replace(regMailComplexReplace, function () {
                var args = _(arguments).toArray();
                // need to ignore line breaks, i.e. <br> tags inside this pattern (see Bug 28960)
                if (/<br\/?>/.test(args[0])) return args[0];
                // ignore if display name is again mail address
                if (/@/.test(args[2])) return args[0];
                return '<a href="mailto:' + args[6] + '">' + args[2] + (args[3] || '') + '</a>';
            });

        // split source to safely ignore tags
        text = _(text.split(/(<[^>]+>)/))
            .map(function (line) {
                // ignore tags
                if (line[0] === '<') return line;
                // ignore URLs
                if (isURL.test(line)) return line;
                // process plain text
                line = insertEmoticons(line);
                line = emoji.processEmoji(line);
                return line;
            })
            .join('');

        text = markupQuotes(text);

        return text;
    };

    var openTaskLink = function (e) {
        e.preventDefault();
        ox.launch('io.ox/tasks/main', { folder: e.data.folder}).done(function () {
            var app = this, folder = e.data.folder, id = e.data.id;
            if (app.folder.get() === folder) {
                app.getGrid().selection.set(id);
            } else {
                app.folder.set(folder).done(function () {
                    app.getGrid().selection.set(id);
                });
            }
        });
    };

    var openDocumentLink = function (e) {
        e.preventDefault();
        ox.launch('io.ox/files/main', { folder: e.data.folder, perspective: 'fluid:list' }).done(function () {
            var app = this, folder = e.data.folder, id = e.data.id;
            // switch to proper perspective
            ox.ui.Perspective.show(app, 'fluid:list').done(function () {
                // set proper folder
                if (app.folder.get() === folder) {
                    app.selection.set(id);
                } else {
                    app.folder.set(folder).done(function () {
                        app.selection.set(id);
                    });
                }
            });
        });
    };

    var openAppointmentLink = function (e) {
        e.preventDefault();
        ox.launch('io.ox/calendar/main', { folder: e.data.folder, perspective: 'list' }).done(function () {
            var app = this, folder = e.data.folder, id = e.data.id;
            // switch to proper perspective
            ox.ui.Perspective.show(app, 'list').done(function () {
                // set proper folder
                if (app.folder.get() === folder) {
                    app.trigger('show:appointment', {id: id, folder_id: folder, recurrence_position: 0}, true);
                } else {
                    app.folder.set(folder).done(function () {
                        app.trigger('show:appointment', {id: id, folder_id: folder, recurrence_position: 0}, true);
                    });
                }
            });
        });
    };

    // fix hosts (still need a configurable list on the backend)
    // ox.serverConfig.hosts = ox.serverConfig.hosts.concat('appsuite-dev.open-xchange.com', 'ui-dev.open-xchange.com', 'ox6-dev.open-xchange.com', 'ox6.open-xchange.com');

    var isValidHost = function (url) {
        var match = url.match(/^https?:\/\/([^\/#]+)/i);
        return match && match.length && _(ox.serverConfig.hosts).indexOf(match[1]) > -1;
    };

    var drawInfostoreLink = function (matches, title) {
        var link, href, folder, id;
        // create link
        link = $('<a>', { href: '#' })
            .css({ textDecoration: 'none', fontFamily: 'Arial' })
            .append($('<span class="label label-info">').text(title));
        // get values
        href = matches[2];
        folder = matches[3];
        id = matches[4];
        // internal document?
        /* TODO: activate internal Links when files app is ready */
        if (isValidHost(href)) {
            // yep, internal
            href = '#app=io.ox/files&folder=' + folder + '&id=' + id;
            link.on('click', { hash: href, folder: folder, id: id }, openDocumentLink);
        } else {
            // nope, external
            link.attr({ href: matches[0], target: '_blank' });
        }
        return link;
    };

    // biggeleben: the following is not really DRY ...

    var drawAppointmentLink = function (matches, title) {
        var link, href, folder, id;
        // create link
        link = $('<a>', { href: '#' })
            .css({ textDecoration: 'none', fontFamily: 'Arial' })
            .append($('<span class="label label-info">').text(title));
        // get values
        href = matches[2];
        folder = matches[4];
        id = matches[3];
        // internal document?
        if (isValidHost(href)) {
            // yep, internal
            href = '#app=io.ox/calendar&perspective=list&folder=' + folder + '&id=' + folder + '.' + id;
            link.on('click', { hash: href, folder: folder, id: id }, openAppointmentLink);
        } else {
            // nope, external
            link.attr({ href: matches[0], target: '_blank' });
        }
        return link;
    };

    var drawTaskLink = function (matches, title) {
        var link, href, folder, id;
        // create link
        link = $('<a>', { href: '#' })
            .css({ textDecoration: 'none', fontFamily: 'Arial' })
            .append($('<span class="label label-info">').text(title));
        // get values
        href = matches[2];
        folder = matches[4];
        id = matches[3];
        // internal document?
        if (isValidHost(href)) {
            // yep, internal
            href = '#app=io.ox/tasks&folder=' + folder + '&id=' + folder + '.' + id;
            link.on('click', { hash: href, folder: folder, id: folder + '.' + id }, openTaskLink);
        } else {
            // nope, external
            link.attr({ href: matches[0], target: '_blank' });
        }
        return link;
    };

    var drawLink = function (href) {
        return $('<a>', { href: href }).text(href);
    };

    var blockquoteMore, blockquoteClickOpen, blockquoteCollapsedHeight = 57, mailTo;

    blockquoteMore = function (e) {
        e.preventDefault();
        blockquoteClickOpen.call($(this).prev().get(0));
        $(this).hide();
    };

    blockquoteClickOpen = function () {
        var h = this.scrollHeight + 'px';
        $(this)
            .off('click.open')
            .stop().animate({ maxHeight: h }, 300, function () {
                $(this).css('opacity', 1.00).removeClass('collapsed-blockquote');
            });
        $(this).next().hide();
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

    return {

        get: function (data, options) {

            if (!data || !data.attachments) {
                return { content: $(), isLarge: false, type: 'text/plain' };
            }

            options = options || {};

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
                _(att).each(function (attachment) {
                    if (attachment.disp === 'inline' && attachment.content_type === type) {
                        source += attachment.content;
                    }
                });

                source = $.trim(source);
                isLarge = source.length > 1024 * 100; // > 100 KB

                // empty?
                if (source === '') {
                    return {
                        content: $('<div class="content">').append(
                            $('<div class="alert alert-info">').text(gt('This mail has no content'))
                        ),
                        isLarge: false,
                        type: 'text/html'
                    };
                }

                // replace images on source level
                source = source.replace(regImageSrc, '$1' + ox.apiRoot);

                // apply emoji stuff for HTML
                if (isHTML && !isLarge) {
                    source = emoji.processEmoji(source);
                }

                // robust constructor for large HTML
                content = document.createElement('DIV');
                content.className = 'content noI18n';
                content.innerHTML = source;
                content = $(content);

                // last line of defense
                content.find('script').remove();

                // setting isColorQuoted
                var colorQuoted = settings.get('isColorQuoted', true);
                if (colorQuoted) content.addClass('colorQuoted');

                if (isHTML) {
                    // HTML
                    if (!isLarge) {
                        // remove stupid tags
                        content.find('meta base').remove();
                        // transform outlook's pseudo blockquotes
                        content.find('div[style*="none none none solid"][style*="1.5pt"]').each(function () {
                            $(this).replaceWith($('<blockquote type="cite">').append($(this).contents()));
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
                            // just set width; max-width=100% should still apply
                            if (w) { node.css({ width: w + 'px' }); }
                            if (h) { node.css({ height: h + 'px'}); }
                        })
                        .end()
                        // tables with bgcolor attribute
                        .find('table[bgcolor]').each(function () {
                            var node = $(this), bgcolor = node.attr('bgcolor');
                            node.css('background-color', bgcolor);
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
                    if (settings.get('useFixedWidthFont', false)) content.addClass('fixed-width-font');
                    content.addClass('plain-text').html(beautifyText(source));
                }

                // process all text nodes unless mail is too large (> 512 KB)
                if (!isLarge) {
                    var processTextNode = function () {
                        if (this.nodeType === 3) {
                            var node = $(this), text = this.nodeValue, length = text.length, m, n;
                            // some replacements
                            if ((m = text.match(regDocument)) && m.length) {
                                // link to document
                                if (node.parent().attr('href') === text) node = node.parent();
                                node.replaceWith(
                                     $($.txt(m[1])).add(drawInfostoreLink(m, gt('Document'))).add($.txt(m[5]))
                                );
                            } else if ((m = (text.match(regDocumentAlt) || text.match(regDocumentAlt2))) && m.length) {
                                // link to document (new syntax)
                                if (node.parent().attr('href') === text) node = node.parent();
                                node.replaceWith(
                                     $($.txt(m[1])).add(drawInfostoreLink(m, gt('Document'))).add($.txt(m[6]))
                                );
                            } else if ((m = text.match(regFolder)) && m.length) {
                                // link to folder
                                if (node.parent().attr('href') === text) node = node.parent();
                                node.replaceWith(
                                    $($.txt(m[1])).add(drawInfostoreLink(m, gt('Folder'))).add($.txt(m[4]))
                                );
                            } else if ((m = text.match(regFolderAlt)) && m.length) {
                                // link to folder
                                if (node.parent().attr('href') === text) node = node.parent();
                                node.replaceWith(
                                    $($.txt(m[1])).add(drawInfostoreLink(m, gt('Folder'))).add($.txt(m[4]))
                                );
                            } else if ((m = text.match(regTask) || text.match(regTaskAlt)) && m.length) {
                                // link to folder
                                if (node.parent().attr('href') === text) node = node.parent();
                                node.replaceWith(
                                    $($.txt(m[1])).add(drawTaskLink(m, gt('Task')))
                                );
                            } else if ((m = text.match(regAppointment) || text.match(regAppointmentAlt)) && m.length) {
                                // link to folder
                                if (node.parent().attr('href') === text) node = node.parent();
                                node.replaceWith(
                                    $($.txt(m[1])).add(drawAppointmentLink(m, gt('Appointment')))
                                );
                            } else if ((n = text.match(regLink)) && n.length && node.closest('a').length === 0) {
                                if ((m = n[2].match(regDocument)) && m.length) {
                                    // link to document
                                    node.replaceWith(
                                        $($.txt(m[1])).add(drawInfostoreLink(m, gt('Document'))).add($.txt(m[3]))
                                    );
                                } else if ((m = n[2].match(regDocumentAlt)) && m.length) {
                                    // link to document
                                    node.replaceWith(
                                        $($.txt(m[1])).add(drawInfostoreLink(m, gt('Document'))).add($.txt(m[4]))
                                    );
                                } else if ((m = n[2].match(regFolder)) && m.length) {
                                    // link to folder
                                    node.replaceWith(
                                        $($.txt(m[1])).add(drawInfostoreLink(m, gt('Folder'))).add($.txt(m[4]))
                                    );
                                } else if ((m = n[2].match(regTask) || n[2].match(regTaskAlt)) && m.length) {
                                    // link to folder
                                    node.replaceWith(
                                        $($.txt(m[1])).add(drawTaskLink(m, gt('Task')))
                                    );
                                } else if ((m = n[2].match(regAppointment) || n[2].match(regAppointmentAlt)) && m.length) {
                                    // link to folder
                                    node.replaceWith(
                                        $($.txt(m[1])).add(drawAppointmentLink(m, gt('Appointment')))
                                    );
                                } else {
                                    m = n;
                                    node.replaceWith(
                                        $($.txt(m[1] || '')).add(drawLink(m[2])).add($.txt(m[3]))
                                    );
                                }
                            } else if (regMail.test(text) && node.closest('a').length === 0) {
                                // links
                                // escape first
                                text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                // try the "NAME" <ADDRESS> pattern
                                if (isHTML && regMailComplex.test(text)) {
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
                            else if (length >= 30 && /\S{30}/.test(text)) {
                                // split long character sequences for better wrapping
                                node.replaceWith(
                                    $.parseHTML(coreUtil.breakableHTML(text))
                                );
                            }
                        }
                    };
                    // don't combine these two lines via add() - very slow!
                    content.contents().each(processTextNode);
                    $('*', content).not('style').contents().each(processTextNode);
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

                // auto-collapse blockquotes?
                var autoCollapse = !isLarge &&
                    options.autoCollapseBlockquotes !== false &&
                    settings.get('features/autoCollapseBlockquotes', true) === true;

                if (autoCollapse) {
                    // blockquotes (top-level only)
                    content.find('blockquote').not(content.find('blockquote blockquote')).each(function () {
                        var node = $(this);
                        node.addClass('collapsed-blockquote')
                            .css({ opacity: 0.50, maxHeight: blockquoteCollapsedHeight })
                            .on('click.open', blockquoteClickOpen)
                            .after(
                                $('<a href="#" class="toggle-blockquote">').text(gt('Show more'))
                                .on('click', blockquoteMore)
                            );
                        setTimeout(function () {
                            if ((node.prop('scrollHeight') - 3) <= node.prop('offsetHeight')) { // 3 rows a 20px line-height
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

            return { content: content, isLarge: isLarge, type: type };
        }
    };
});
