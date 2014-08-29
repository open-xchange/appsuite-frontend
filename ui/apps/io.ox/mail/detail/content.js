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

define('io.ox/mail/detail/content',
    ['io.ox/mail/api',
     'io.ox/core/util',
     'io.ox/core/emoji/util',
     'io.ox/core/extensions',
     'io.ox/core/capabilities',
     'settings!io.ox/mail',
     'gettext!io.ox/mail',
     'io.ox/mail/detail/links'
    ], function (api, coreUtil, emoji, ext, capabilities, settings, gt) {

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
        regMailComplexReplace = /(&quot;([^&]+)&quot;|"([^"]+)"|'([^']+)')(\s|<br>)+&lt;([^@]+@[^&\s]+)&gt;/g, /* "name" <address> */
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

        var regex = /(&quot)?([:;]-?[(|)D])(\W|$)/g;

        return function (text) {
            if (settings.get('displayEmoticons') && capabilities.has('emoji')) {
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
                return '<a href="mailto:' + args[6] + '" target="_blank">' + args[2] + (args[3] || '') + '</a>';
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
                return line;
            })
            .join('');

        text = markupQuotes(text);

        return text;
    };

    // source

    ext.point('io.ox/mail/detail/source').extend({
        id: 'empty',
        index: 100,
        process: function (baton) {
            // empty?
            if (baton.source !== '') return;
            // stop any further processing
            baton.stopPropagation();
            baton.source = '<div class="no-content">' + gt('This mail has no content') + '</div>';
        }
    });

    ext.point('io.ox/mail/detail/source').extend({
        id: 'images',
        index: 200,
        process: function (baton) {
            // replace images on source level
            baton.source = baton.source.replace(regImageSrc, '$1' + ox.apiRoot);
        }
    });

    ext.point('io.ox/mail/detail/source').extend({
        id: 'emoji',
        index: 300,
        process: function (baton) {
            baton.processedEmoji = false;
            baton.source = emoji.processEmoji(baton.source, function (text, lib) {
                baton.processedEmoji = !lib.loaded;
                baton.source = text;
            });
        }
    });

    ext.point('io.ox/mail/detail/source').extend({
        id: 'plain-text-links',
        index: 300,
        process: function (baton) {
            if (baton.isLarge) return;
            // Jericho HTML Parser produces stupid links if text and url is identical. simple pattern.
            baton.source = baton.source.replace(/(<a href="https?:\/\/[^"]+" target="_blank">https?:\/\/[^<]+<\/a>) &lt;<a href="https?:\/\/[^"]+" target="_blank">https?:\/\/[^<]+<\/a>&gt;/g, '$1');
        }
    });

    ext.point('io.ox/mail/detail/source').extend({
        id: 'remove-wbr',
        index: 400,
        process: function (baton) {
            if (baton.isLarge) return;
            baton.source = baton.source.replace(/<wbr>/g, '');
        }
    });

    var setLinkTarget = function (match /*, link*/) {
        //replace or add link target to '_blank'
        return (/target/).test(match) ? match.replace(/(target="[^"]*")/i, 'target="_blank"') : match.replace('>', ' target="_blank">');
    };

    ext.point('io.ox/mail/detail/source').extend({
        id: 'link-target',
        index: 500,
        process: function (baton) {
            baton.source = baton.source.replace(/<a[^>]*href=(?:\"|\')(https?:\/\/[^>]+)(?:\"|\')[^>]*>/g, setLinkTarget);
        }
    });

    ext.point('io.ox/mail/detail/source').extend({
        id: 'white-space',
        index: 600,
        process: function (baton) {
            baton.source = baton.source
                // remove leading white-space
                .replace(/^(<div[^>]+>)(\s|&nbsp;|\0x20|<br\/?>|<p[^>]*>(\s|<br\/?>|&nbsp;|&#160;|\0x20)*<\/p>|<div[^>]*>(\s|<br\/?>|&nbsp;|&#160;|\0x20)*<\/div>)+/g, '$1')
                // remove closing <html> tag
                .replace(/\s*<\/html>\s*$/g, '')
                // remove tailing white-space
                .replace(/(\s|&nbsp;|\0x20|<br\/?>|<p[^>]*>(\s|<br\/?>|&nbsp;|&#160;|\0x20)*<\/p>|<div[^>]*>(\s|<br\/?>|&nbsp;|&#160;|\0x20)*<\/div>)+<\/div>$/g, '');
        }
    });

    // content

    ext.point('io.ox/mail/detail/content').extend({
        id: 'pseudo-blockquotes',
        index: 100,
        process: function (baton) {
            if (!baton.isHTML) return;
            // transform outlook's pseudo blockquotes
            this.find('div[style*="none none none solid"][style*="1.5pt"]').each(function () {
                $(this).replaceWith($('<blockquote type="cite">').append($(this).contents()));
            });
        }
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'blockquotes',
        index: 200,
        process: function (baton) {
            if (!baton.isHTML) return;
            this.find('blockquote')
                // remove white-space: pre/nowrap
                .find('[style*="white-space: "]').css('whiteSpace', '').end();
        }
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'images',
        index: 300,
        process: function (baton) {
            if (!baton.isHTML) return;
            // images with attribute width/height
            this.find('img[width], img[height]').each(function () {
                var node = $(this), w = node.attr('width'), h = node.attr('height'),
                    pat = /%/;
                node.removeAttr('width height');
                // just set width; max-width=100% should still apply
                if (w) { node.css({ width: pat.test(w) ? w : w + 'px'}); }
                if (h) { node.css({ height: pat.test(h) ? h : h + 'px'}); }
            });
        }
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'tables',
        index: 400,
        process: function (baton) {
            if (!baton.isHTML) return;
            // tables with bgcolor attribute
            this.find('table[bgcolor]').each(function () {
                var node = $(this), bgcolor = node.attr('bgcolor');
                node.css('background-color', bgcolor);
            });
            // loop over tables in reverse order
            // so that tables are processed inside-out
            $.each(this.find('table[cellpadding]').get().reverse(), function () {
                var node = $(this), cellpadding = node.attr('cellpadding');
                if (node.attr('cellspacing') === '0') {
                    node.css('border-collapse', 'collapse');
                }
                node.find('th, td').each(function () {
                    var node = $(this), style = node.attr('style') || '';
                    // style might already contain padding or padding-top/right/bottom/left.
                    if (style.indexOf('padding:') > -1) return;
                    // So we add the cellpadding at the beginning so that it doesn't overwrite existing paddings
                    if (style) style = ' ' + style;
                    node.attr('style', 'padding: ' + cellpadding + 'px;' + style);
                });
            });
        }
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'nested',
        index: 500,
        process: function (baton) {
            if (!baton.isHTML) return;
            // nested message?
            var data = baton.data;
            if ('folder_id' in data || !('filename' in data)) return;
            // fix inline images in nested message
            this.find('img[src^="cid:"]').each(function () {
                var node = $(this), cid = '<' + String(node.attr('src') || '').substr(4) + '>', src,
                    // get proper attachment
                    attachment = _.chain(baton.data.attachments).filter(function (a) {
                        return a.cid === cid;
                    }).first().value();
                if (attachment) {
                    src = api.getUrl(_.extend(attachment, { mail: data.parent }), 'view');
                    node.attr('src', src);
                }
            });
        }
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'fixed-width',
        index: 600,
        process: function (baton) {
            if (baton.isText && settings.get('useFixedWidthFont', false)) this.addClass('fixed-width-font');
        }
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'color-quotes',
        index: 700,
        process: function () {
            if (settings.get('isColorQuoted', true)) this.addClass('colorQuoted');
        }
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'clean-blockquotes',
        index: 800,
        process: function () {
            // for support for very large mails we do the following stuff manually,
            // otherwise jQuery explodes with "Maximum call stack size exceeded"
            _(this.get(0).getElementsByTagName('BLOCKQUOTE')).each(function (node) {
                node.removeAttribute('style');
                node.removeAttribute('type');
            });
        }
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'link-target',
        index: 900,
        process: function () {
            // for support for very large mails we do the following stuff manually,
            // otherwise jQuery explodes with "Maximum call stack size exceeded"
            _(this.get(0).getElementsByTagName('A')).each(function (node) {
                var link = $(node)
                        .filter('[href^="mailto:"]')
                        .addClass('mailto-link')
                        .attr('target', '_blank'), // to be safe
                    text = link.text();
                // trim text if it contains mailto:...
                if (text.search(/^mailto:/) > -1) {
                    text = text.substring(7);//cut of mailto
                    text = text.split(/\?/, 2)[0];//cut of additional parameters
                    link.text(text);
                }
            });
        }
    });

    function getText(node) {
        // get text content for current node if it's a text node
        var value = (node.nodeType === 3 && String(node.nodeValue).trim()) || '',
            // ignore white-space
            str = value ? value + ' ' : '';
        // loop over child nodes for recursion
        _(node.childNodes).each(function (child) {
            if (child.tagName === 'STYLE') return;
            str += getText(child);
        });
        return str;
    }

    var explandBlockquote = function (e) {
        e.preventDefault();
        $(this).hide().prev().slideDown('fast', function () {
            $(e.delegateTarget).trigger('resize');
        });
    };

    ext.point('io.ox/mail/detail/content').extend({
        id: 'auto-collapse',
        index: 1000,
        process: function (baton) {
            // auto-collapse blockquotes?
            if (baton.options.autoCollapseBlockquotes === false) return; // use by printing, for example
            if (settings.get('features/autoCollapseBlockquotes', true) !== true) return;
            // blockquotes (top-level only)
            this.find('blockquote').not(this.find('blockquote blockquote')).each(function () {
                var text = getText(this);
                if (text.length > 300) text = text.substr(0, 300) + '\u2026'; else return;
                $(this).addClass('collapsed-blockquote').after(
                    $('<div class="blockquote-toggle">').append(
                        // we don't use <a href=""> here, as we get too many problems with :visited inside mail content
                        $('<i class="fa fa-ellipsis-h" tabindex="1">')
                        .attr('title', gt('Show quoted text')),
                        $.txt(text)
                    )
                );
            });
            // delegate
            this.on('click', '.blockquote-toggle', explandBlockquote);
        }
    });

    function isBlockquoteToggle(node) {
        return node.parent().hasClass('blockquote-toggle');
    }

    function findFarthestElement(memo, node) {
        var pos;
        if (node.css('position') === 'absolute' && !isBlockquoteToggle(node) && (pos = node.position())) {
            memo.x = Math.max(memo.x, pos.left + node.width());
            memo.y = Math.max(memo.y, pos.top + node.height());
            memo.found = true;
        }
        return memo;
    }

    function fixAbsolutePositions(content, isLarge) {
        var farthest = { x: content.get(0).scrollWidth, y: content.get(0).scrollHeight, found: false },
            width = content.width(), height = content.height();
        if (!isLarge && (farthest.x >= width || farthest.y >= height)) { // Bug 22756: FF18 is behaving oddly correct, but impractical
            farthest = _.chain($(content).find('*')).map($).reduce(findFarthestElement, farthest).value();
        }
        // only do this for absolute elements
        if (farthest.found) {
            content.css('overflow-x', 'auto');
            if (farthest.y > height) content.css('height', Math.round(farthest.y) + 'px');
        }
        // look for resize event
        content.one('resize', function () {
            fixAbsolutePositions($(this), isLarge);
        });
    }

    return {

        get: function (data, options) {

            if (!data || !data.attachments) {
                return { content: $(), isLarge: false, type: 'text/plain' };
            }

            var baton = new ext.Baton({ data: data, options: options || {}, source: '', type: 'text/plain' }), content;

            try {

                // find first text/html attachment to determine content type
                _(data.attachments).find(function (obj) {
                    if ((/^text\/(plain|html)$/i).test(obj.content_type)) {
                        baton.type = obj.content_type;
                        return true;
                    } else {
                        return false;
                    }
                });

                // add other parts?
                _(data.attachments).each(function (attachment) {
                    if (attachment.disp === 'inline' && attachment.content_type === baton.type) {
                        baton.source += attachment.content;
                    }
                });

                baton.source = $.trim(baton.source);
                baton.isHTML = regHTML.test(baton.type);
                baton.isText = !baton.isHTML;
                // large emails cannot be processed because it takes too much time
                // on slow devices or slow browsers. 32 KB is a good size limit; we cannot
                // measure the overall performance of the device but we know that
                // a fresh Chrome browser can handle larger mails without grilling the CPU.
                baton.isLarge = baton.source.length > (1024 * (_.device('chrome >= 30') ? 64 : 32));

                // process source
                ext.point('io.ox/mail/detail/source').invoke('process', $(), baton);

                if (baton.isHTML) {
                    // robust constructor for large HTML
                    content = document.createElement('DIV');
                    content.className = 'content noI18n';
                    content.innerHTML = baton.source;
                    content = $(content);
                    // last line of defense
                    content.find('script, base, meta').remove();
                } else {
                    // plain TEXT
                    content = $('<div class="content plain-text noI18n">');
                    content.html(beautifyText(baton.source));
                    if (!baton.processedEmoji) {
                        emoji.processEmoji(baton.source, function (text, lib) {
                            baton.processedEmoji = !lib.loaded;
                            content.html(beautifyText(text));
                        });
                    }
                }

                // process content unless too large
                if (!baton.isLarge) ext.point('io.ox/mail/detail/content').invoke('process', content, baton);

                setTimeout(fixAbsolutePositions, 10, content, baton.isLarge);

            } catch (e) {
                console.error('mail.getContent', e.message, e, data);
            }

            return { content: content, isLarge: baton.isLarge, type: baton.type, processedEmoji: baton.processedEmoji };
        }
    };
});
