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

    // source

    ext.point('io.ox/mail/detail/source').extend({
        id: 'empty',
        index: 100,
        process: function (baton) {
            // empty?
            if (baton.source !== '') return;
            // stop any further processing
            baton.stopPropagation();
            baton.source = '<div class="alert alert-info">' + gt('This mail has no content') + '</div>';
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
            if (!baton.isHTML || baton.isLarge) return;
            baton.source = emoji.processEmoji(baton.source);
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

    // content

    ext.point('io.ox/mail/detail/content').extend({
        id: 'remove',
        index: 100,
        process: function (baton) {
            if (!baton.isHTML) return;
            // remove stupid tags
            this.find('meta base').remove();
        }
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'pseudo-blockquotes',
        index: 200,
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
        index: 300,
        process: function (baton) {
            if (!baton.isHTML) return;
            this.find('blockquote')
                // remove white-space: pre/nowrap
                .find('[style*="white-space: "]').css('whiteSpace', '').end()
                // remove color inside blockquotes
                .find('*').css('color', '');
        }
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'images',
        index: 400,
        process: function (baton) {
            if (!baton.isHTML) return;
            // images with attribute width/height
            this.find('img[width], img[height]').each(function () {
                var node = $(this), w = node.attr('width'), h = node.attr('height');
                node.removeAttr('width height');
                // just set width; max-width=100% should still apply
                if (w) { node.css({ width: w + 'px' }); }
                if (h) { node.css({ height: h + 'px'}); }
            });
        }
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'tables',
        index: 500,
        process: function (baton) {
            if (!baton.isHTML) return;
            // tables with bgcolor attribute
            this.find('table[bgcolor]').each(function () {
                var node = $(this), bgcolor = node.attr('bgcolor');
                node.css('background-color', bgcolor);
            });
        }
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'nested',
        index: 600,
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
        index: 700,
        process: function (baton) {
            if (baton.isText && settings.get('useFixedWidthFont', false)) this.addClass('fixed-width-font');
        }
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'color-quotes',
        index: 800,
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
                $(node).attr('target', '_blank')
                    .filter('[href^="mailto:"]').on('click', mailTo);
            });
        }
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'auto-collapse',
        index: 1000,
        process: function (baton) {
            // auto-collapse blockquotes?
            if (baton.isLarge) return;
            if (baton.options.autoCollapseBlockquotes === false) return;
            if (settings.get('features/autoCollapseBlockquotes', true) !== true) return;
            // blockquotes (top-level only)
            this.find('blockquote').not(this.find('blockquote blockquote')).each(function () {
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
    });

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
                baton.isLarge = baton.source.length > 1024 * 32; // > 32 KB

                // process source
                ext.point('io.ox/mail/detail/source').invoke('process', $(), baton);

                if (baton.isHTML) {
                    // robust constructor for large HTML
                    content = document.createElement('DIV');
                    content.className = 'content noI18n';
                    content.innerHTML = baton.source;
                    content = $(content);
                    // last line of defense
                    content.find('script').remove();
                } else {
                    // plain TEXT
                    content = $('<div class="content plain-text noI18n">');
                    content.html(beautifyText(baton.source));
                }

                // process content
                ext.point('io.ox/mail/detail/content').invoke('process', content, baton);

            } catch (e) {
                console.error('mail.getContent', e.message, e, data);
            }

            return { content: content, isLarge: baton.isLarge, type: baton.type };
        }
    };
});
