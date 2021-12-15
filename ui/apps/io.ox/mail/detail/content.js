/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

/* global blankshield:true */
/*jshint scripturl:true*/

define('io.ox/mail/detail/content', [
    'io.ox/mail/api',
    'io.ox/mail/util',
    'io.ox/core/util',
    'io.ox/core/emoji/util',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/mail/detail/links',
    'io.ox/mail/sanitizer',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'io.ox/emoji/bundle'
], function (api, util, coreUtil, emoji, ext, capabilities, links, sanitizer, settings, gt) {

    'use strict';

    var regHTML = /^text\/html$/i,
        regMailComplexReplace = /(&quot;([^&]+)&quot;|"([^"]+)"|'([^']+)')(\s|<br>)+&lt;([^@]+@[^&\s]+)&gt;/g, /* "name" <address> */
        regIsURL = /^https?:\S+$/i;

    //
    // Extensions
    //

    var extensions = {

        //
        // Source
        //

        empty: function (baton) {
            // empty?
            if (baton.source !== '') return;
            // stop any further processing
            baton.stopPropagation();
            baton.source = baton.isHTML ? '<div class="no-content">' + gt('This mail has no content') + '</div>' : gt('This mail has no content');
        },

        images: function (baton) {
            // replace images on source level
            // look if prefix, usually '/ajax', needs do be replaced
            baton.source = util.replaceImagePrefix(baton.source);
        },

        emoji: function (baton) {
            if (baton.isText) return;
            if (baton.processedEmoji) return;
            baton.processedEmoji = false;
            baton.source = emoji.processEmoji(baton.source, function (text, lib) {
                baton.processedEmoji = !lib.loaded;
                baton.source = text;
            });
        },

        plainTextLinks: function (baton) {
            if (baton.isLarge) return;
            // Jericho HTML Parser produces stupid links if text and url is identical. simple pattern.
            baton.source = baton.source.replace(/(<a href="https?:\/\/[^"]+" target="_blank">https?:\/\/[^<]+<\/a>) &lt;<a href="https?:\/\/[^"]+" target="_blank">https?:\/\/[^<]+<\/a>&gt;/g, '$1');
        },

        removeWBR: function (baton) {
            if (baton.isLarge) return;
            baton.source = baton.source.replace(/<wbr>/g, '');
        },

        linkTarget: function (baton) {
            baton.source = baton.source
                // fix missing protocol
                .replace(/(<a.*?href=("|'))www\./g, '$1http://www.')
                // fix targets
                .replace(/<a[^>]*href=(?:\"|\')(https?:\/\/[^>]+)(?:\"|\')[^>]*>/g, setLinkTarget);
        },

        whitespace: function (baton) {
            // espeically firefox doesn't like those regex for large messages
            if (baton.isLarge) return;
            baton.source = baton.source
                // remove leading white-space
                .replace(/^(<div[^>]+>)(\s|&nbsp;|\0x20|<br\/?>|<p[^>]*>(\s|<br\/?>|&nbsp;|&#160;|\0x20)*<\/p>|<div[^>]*>(\s|<br\/?>|&nbsp;|&#160;|\0x20)*<\/div>)+/g, '$1')
                // remove closing <html> tag
                .replace(/\s*<\/html>\s*$/g, '')
                // remove tailing white-space
                .replace(/(\s|&nbsp;|\0x20|<br\/?>|<p[^>]*>(\s|<br\/?>|&nbsp;|&#160;|\0x20)*<\/p>|<div[^>]*>(\s|<br\/?>|&nbsp;|&#160;|\0x20)*<\/div>)+<\/div>$/g, '');
        },

        linkDisable: function (source) {
            return source.replace(/(<a[^>]*)>/g, '$1 disabled="disabled" aria-disabled="true">');
        },

        linkRemoveRef: function (source) {
            return source.replace(/(<a[^>]+?href[\s]*=[\s]*["']).*?(["'][^>]*)>/g, '$1#$2>');
        },

        linkRemoveStyle: function (source) {
            return source.replace(/(<a[^>]+?style[\s]*=[\s]*["'])(.*?)(["'][^>]*>)/g, function (match, head, value, tail) {
                return head + value.replace(/(^|;|\s)color:[^;]+?($|;)/g, '').replace(/text-decoration:[^;]+?($|;)/g, '') + tail;
            });
        },

        //
        // Content general
        //

        anchorLinks: function (baton) {
            // see Bug 44637 - Inline links to anchors don't work anymore or shift the viewport
            if (!baton.isHTML) return;
            // handle anchor links manually / use native listener to avoid leaks
            this.addEventListener('click', function (e) {
                if (!$(e.target).is('a[href^="#"]')) return;
                // manually scroll to
                e.preventDefault();
                var id = $.escape($(e.target).attr('href').substr(1)),
                    anchor = $(this).find('#' + id + ', [name="' + $.escape(id) + '"]');
                if (anchor.length) anchor[0].scrollIntoView();
            }, false);
        },

        disableLinks: function (baton) {
            if (!util.isMalicious(baton.data)) return;
            $(this).addClass('disable-links').on('click', function () { return false; });
        },

        //
        // Content
        //

        pseudoBlockquotes: function (baton) {
            if (!baton.isHTML) return;
            // transform outlook's pseudo blockquotes
            each(this, 'div[style*="none none none solid"][style*="1.5pt"]', function (node) {
                $(node).replaceWith($('<blockquote type="cite">').append($(node).contents()));
            });
        },

        nested: function (baton) {
            if (!baton.isHTML) return;
            // nested message?
            var data = baton.data;
            if ('folder_id' in data || !('filename' in data)) return;
            // fix inline images in nested message
            each(this, 'img[src^="cid:"]', function (node) {
                var cid = '<' + String(node.getAttribute('src') || '').substr(4) + '>', src,
                    // get proper attachment
                    attachment = _.chain(baton.data.attachments).filter(function (a) {
                        return a.cid === cid;
                    }).first().value();
                if (attachment) {
                    src = api.getUrl(_.extend(attachment, { mail: data.parent }), 'view');
                    node.setAttribute('src', src);
                }
            });
        },

        fixedWidth: function (baton) {
            if (baton.isText && settings.get('useFixedWidthFont', false)) $(this).addClass('fixed-width-font');
        },

        colorQuotes: function () {
            if (settings.get('isColorQuoted', true)) $(this).addClass('colorQuoted');
        },

        cleanBlockquotes: function () {
            each(this, 'blockquote', function (node) {
                var indent = (/border:\s*(none|0)/i).test(node.getAttribute('style'));
                node.removeAttribute('style');
                node.removeAttribute('type');
                // hide border to use blockquote just for indentation
                if (indent) node.style.border = '0';
            });
        },

        checkLinks: function (baton) {
            var shareLinkUrl = baton.data.headers['X-Open-Xchange-Share-URL'];

            each(this, 'a', function (node) {
                var link = $(node),
                    href = link.attr('href') || '',
                    data, text;
                // deep links?
                if (links.isInternalDeepLink(href)) {
                    data = links.parseDeepLink(href);
                    // fix invalid "folder DOT folder SLASH id" pattern
                    if (/^(\d+)\.\1\/\d+$/.test(data.id)) data.id = data.id.replace(/^\d+\./, '');
                    // fix ID, i.e. replace the DOT (old notation) by a SLASH (new notation, 7.8.0)
                    if (/^\d+\./.test(data.id)) data.id = data.id.replace(/\./, '/');
                    link.addClass(data.className).data(data);
                    // if this is a sharing link add the generic deep link class so event handlers work properly and it doesn't get opened in a new tab
                    if (shareLinkUrl && link.attr('href') === shareLinkUrl) link.addClass('deep-link-app');
                } else if (href.search(/^\s*mailto:/i) > -1) {
                    // mailto:
                    link.addClass('mailto-link').attr('target', '_blank');
                    text = link.text();
                    if (text.search(/^mailto:/) > -1) {
                        //cut of mailto
                        text = text.substring(7);
                        //cut of additional parameters
                        text = text.split(/\?/, 2)[0];
                        link.text(text);
                    }
                } else if (link.attr('href')) {
                    // other links
                    link.attr({ 'rel': 'noopener', 'target': '_blank' });
                    // Replace doublequotes that are actually written as &quot; / Prevents XSS (See Bugs 57692 and 58333)
                    link.attr('href', link.attr('href').replace(/"/g, '%22'));
                } else if (!href) {
                    // missing or broken href attribute
                    // remove href as it points to nowhere
                    link.removeAttr('href');
                }
            });
        },

        autoCollapse: function (baton) {
            // auto-collapse blockquotes?
            // use by printing, for example
            if (baton.options.autoCollapseBlockquotes === false) return;
            if (settings.get('features/autoCollapseBlockquotes', true) !== true) return;
            // blockquotes (top-level only)
            each(this, 'blockquote', function (node) {
                // ignore nested blockquotes
                if (hasParent(node, 'blockquote')) return;
                var text = getText(node);
                if (text.length > 300) text = text.substr(0, 300) + '\u2026'; else return;
                var blockquoteId = _.uniqueId('collapsed-blockquote-');
                var ellipsisButton = $('<button class="bqt">').attr('title', gt('Show quoted text')).append(
                    $('<span aria-hidden="true">').text('...')
                );
                if (!_.browser.Chrome) {
                    ellipsisButton.attr({
                        'aria-controls': blockquoteId,
                        'aria-expanded': false
                    });
                }
                $(node).addClass('collapsed-blockquote').attr('id', blockquoteId).after(
                    $('<div class="blockquote-toggle">').append(
                        // we don't use <a href=""> here, as we get too many problems with :visited inside mail content
                        ellipsisButton,
                        $.txt(
                            text.replace(/<\s/g, '<')
                                .replace(/\s>/g, '>')
                                .replace(/("'\s?|\s?'")/g, '')
                                .replace(/[-_]{3,}/g, '')
                        )
                    )
                );
            });
            // delegate
            $(this).on('click keydown', '.blockquote-toggle', explandBlockquote);
        },

        checkSimple: function () {
            var container = $(this);
            // if a mail contains a table, we assume that it is a mail with a lot of markup
            // and styles and things like max-width: 100% will destroy the layout
            if (container.find('table').length === 0) container.addClass('simple-mail');
        },

        formSubmit: function () {
            $(this).on('submit', 'form', function (e) {
                e.preventDefault();
                var name = _.uniqueId('blank');
                /* eslint no-script-url: 2 */
                blankshield.open('javascript:0', name);
                /* eslint no-script-url: 0 */
                this.target = name;
                setTimeout(this.submit.bind(this));
            });
        }
    };

    //
    // Source
    //

    ext.point('io.ox/mail/detail/source').extend({
        id: 'empty',
        index: 100,
        process: extensions.empty
    });

    ext.point('io.ox/mail/detail/source').extend({
        id: 'images',
        index: 200,
        process: extensions.images
    });

    ext.point('io.ox/mail/detail/source').extend({
        id: 'emoji',
        index: 300,
        process: extensions.emoji
    });

    ext.point('io.ox/mail/detail/source').extend({
        id: 'plain-text-links',
        index: 300,
        process: extensions.plainTextLinks
    });

    ext.point('io.ox/mail/detail/source').extend({
        id: 'remove-wbr',
        index: 400,
        process: extensions.removeWBR
    });

    ext.point('io.ox/mail/detail/source').extend({
        id: 'link-target',
        index: 500,
        process: extensions.linkTarget
    });

    ext.point('io.ox/mail/detail/source').extend({
        id: 'white-space',
        index: 600,
        process: extensions.whitespace
    });

    ext.point('io.ox/mail/detail/source').extend({
        id: 'disable-links',
        index: 700,
        enabled: settings.get('maliciousCheck'),
        process: function (baton) {
            if (!util.isMalicious(baton.data)) return;
            baton.source = baton.source
                .replace(/.*/g, extensions.linkDisable)
                .replace(/.*/g, extensions.linkRemoveRef)
                .replace(/.*/g, extensions.linkRemoveStyle);
        }
    });

    //
    // Content general
    //

    ext.point('io.ox/mail/detail/content-general').extend({
        id: 'anchor-links',
        index: 100,
        process: extensions.anchorLinks
    });

    ext.point('io.ox/mail/detail/content-general').extend({
        id: 'disable-links',
        index: 200,
        process: extensions.disableLinks
    });

    //
    // Content
    //

    ext.point('io.ox/mail/detail/content').extend({
        id: 'pseudo-blockquotes',
        index: 100,
        process: extensions.pseudoBlockquotes
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'nested',
        index: 500,
        process: extensions.nested
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'fixed-width',
        index: 600,
        process: extensions.fixedWidth
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'color-quotes',
        index: 700,
        process: extensions.colorQuotes
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'clean-blockquotes',
        index: 800,
        process: extensions.cleanBlockquotes
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'check-links',
        index: 900,
        process: extensions.checkLinks
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'auto-collapse',
        index: 1000,
        process: extensions.autoCollapse
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'check-simple',
        index: 1100,
        process: extensions.checkSimple
    });

    ext.point('io.ox/mail/detail/content').extend({
        id: 'form-submit',
        index: 1200,
        process: extensions.formSubmit
    });

    // commented out DUE TO BUGS! (27.01.2016)
    // ext.point('io.ox/mail/detail/content').extend({
    //     id: 'lazyload-images',
    //     index: 1200,
    //     process: function () {
    //         $(this).find('img[src!=""]').each(function () {
    //             var img = $(this);
    //             img.attr({
    //                 'data-original': img.attr('src'),
    //                 'src': '//:0'
    //             }).addClass('lazyload');
    //         });
    //     }
    // });

    //
    // Beautify
    //

    ext.point('io.ox/mail/detail/beautify').extend(
        {
            id: 'trim',
            process: function (baton) {
                baton.data = baton.data.trim();
            }
        },
        {
            id: 'carriage-return',
            process: function (baton) {
                baton.data = baton.data.replace(/\r/g, '');
            }
        },
        {
            id: 'multiple-empty-lines',
            process: function (baton) {
                if (!settings.get('transform/multipleEmptyLines', true)) return;
                baton.data = baton.data.replace(/\n{4,}/g, '\n\n\n');
            }
        },
        {
            id: 'emojis',
            process: function (baton) {
                baton.data = insertEmoticons(baton.data);
            }
        },
        {
            id: 'text-to-html',
            process: function (baton) {
                baton.data = this.text2html(baton.data, { blockquotes: true, images: true, links: true });
            }
        },
        {
            id: 'br',
            process: function (baton) {
                baton.data = baton.data.replace(/^\s*(<br\s*\/?>\s*)+/g, '');
            }
        }
    );

    //
    // Helper IIFEs
    //

    var insertEmoticons = (function () {

        var emotes = {
            ':-)': '&#x1F60A;',
            ':)': '&#x1F60A;',
            ';-)': '&#x1F609;',
            ';)': '&#x1F609;',
            ':-D': '&#x1F603;',
            ':D': '&#x1F603;',
            // may be, switch to &#x1F610; once we have the icon for it (neutral face)
            ':-|': '&#x1F614;',
            // may be, switch to &#x1F610; once we have the icon for it (neutral face)
            ':|': '&#x1F614;',
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

    var fixAbsolutePositions = (function () {

        function isBlockquoteToggle(elem) {
            return $(elem).parent().hasClass('blockquote-toggle');
        }

        function findFarthestElement(memo, elem) {
            if (getComputedStyle(elem).position !== 'absolute') return memo;
            if (isBlockquoteToggle(elem)) return memo;
            var pos = $(elem).position();
            if (pos) {
                memo.x = Math.max(memo.x, pos.left + elem.offsetWidth);
                memo.y = Math.max(memo.y, pos.top + elem.offsetHeight);
                memo.found = true;
            }
            return memo;
        }

        return function (elem, size) {
            var farthest = { x: elem.scrollWidth, y: elem.scrollHeight, found: false },
                width = elem.offsetWidth,
                height = elem.offsetHeight;
            // FF18 is behaving oddly correct, but impractical
            // some early returns (allow 128KB for Chrome, 64KB for others)
            if (_.device('chrome')) { if (size > 0x1FFFF) return; } else if (size > 0xFFFF) return;
            // the following might change after a resize
            if (farthest.x >= width || farthest.y >= height) {
                farthest = _(elem.querySelectorAll('*')).reduce(findFarthestElement, farthest);
            }
            // only do this for absolute elements
            if (farthest.found) {
                $(elem).css('overflow-x', 'auto');
                if (farthest.y > height) $(elem).css('height', Math.round(farthest.y) + 'px');
            }
            // look for resize event
            $(elem).one('resize', function () {
                fixAbsolutePositions(this, size);
            });
        };
    })();

    //
    // Helpers
    //

    function beautifyText(text) {
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
                if (regIsURL.test(line)) return line;
                // process plain text
                line = insertEmoticons(line);
                return line;
            })
            .join('');

        return text;
    }

    function setLinkTarget(match /*, link*/) {
        //replace or add link target to '_blank'
        return (/target/).test(match) ? match.replace(/(target="[^"]*")/i, 'target="_blank"') : match.replace('>', ' target="_blank">');
    }

    // helper: use native functions to avoid jQuery caches;
    // also avoids "Maximum call stack size exceeded" for huge contents
    function each(elem, selector, callback) {
        _(elem.querySelectorAll(selector)).each(callback);
    }

    // helper: check if an element has a certain parent element
    function hasParent(elem, selector) {
        while (elem) {
            elem = elem.parentNode;
            if (elem && elem.matches && elem.matches(selector)) return true;
        }
        return false;
    }

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

    function explandBlockquote(e) {
        if (e.which === 13 || e.which === 23 || e.type === 'click') {
            e.preventDefault();
            e.stopPropagation();
            var self = this;
            $(this).hide().prev().slideDown('fast', function () {
                $(e.delegateTarget).trigger('resize');
                $(self).remove();
            });
        }
    }


    var that = {

        extensions: extensions,

        get: function (data, options) {

            if (!data || !data.attachments) {
                return { content: $(), isLarge: false, type: 'text/plain' };
            }

            var baton = new ext.Baton({ data: data, options: options || {}, source: '', type: 'text/plain' }), content,
                // was: beautifyPlainText = settings.get('beautifyPlainText'),
                // true until bug 52294 gets fixed
                beautifyPlainText = true,
                isTextOrHTML = /^text\/(plain|html)$/i,
                isImage = /^image\//i;

            try {

                // find first text/html attachment that is not displaytype attachment or none to determine content type
                _(data.attachments).find(function (obj) {
                    if ((obj.disp !== 'attachment' && obj.disp !== 'none') && isTextOrHTML.test(obj.content_type)) {
                        baton.type = obj.content_type.toLowerCase();
                        return true;
                    }
                    return false;
                });

                // add other parts?
                _(data.attachments).each(function (attachment) {
                    if (attachment.disp !== 'inline') return;
                    if (attachment.content_type === baton.type) {
                        // add content parts
                        baton.source += attachment.content;
                    } else if (baton.type === 'text/plain' && beautifyPlainText && isImage.test(attachment.content_type)) {
                        // add images if text and using beautifyPlainText
                        baton.source += '\n!(api/image/mail/picture?' +
                            $.param({ folder: data.folder_id, id: data.id, uid: attachment.filename, scaleType: 'contain', width: 1024 }) +
                            ')\n';
                    }
                });

                baton.source = baton.source.trim();
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
                    // robust constructor for large HTML -- no jQuery here to avoid its caches
                    content = document.createElement('DIV');
                    content.innerHTML = baton.source;
                    content.className = content.className + ' mail-detail-content noI18n';
                    // last line of defense
                    each(content, 'script, base, meta', function (node) {
                        node.parentNode.removeChild(node);
                    });
                } else {
                    // plain TEXT
                    content = document.createElement('DIV');
                    content.className = 'mail-detail-content plain-text noI18n';
                    baton.source = beautifyPlainText ? that.beautifyPlainText(baton.source) : beautifyText(baton.source);
                    content.innerHTML = baton.source;
                    // process emoji now (and don't do it again)
                    baton.processedEmoji = true;
                    emoji.processEmoji(baton.source, function (html) {
                        content.innerHTML = html;
                    });
                }

                // process content
                ext.point('io.ox/mail/detail/content-general').invoke('process', content, baton);
                if (!baton.isLarge) ext.point('io.ox/mail/detail/content').invoke('process', content, baton);

                // fix absolute positions
                // heuristic: the source must at least contain the word "absolute" somewhere
                if ((/absolute/i).test(baton.source)) {
                    setTimeout(fixAbsolutePositions, 10, content, baton.source.length);
                }

            } catch (e) {
                console.error('mail.getContent', e.message, e, data);
            }

            return { content: content, isLarge: baton.isLarge, type: baton.type, processedEmoji: baton.processedEmoji };
        },

        beautifyPlainText: function (str) {
            var baton = ext.Baton({ data: str });
            ext.point('io.ox/mail/detail/beautify').invoke('process', this, baton);
            return sanitizer.simpleSanitize(baton.data);
        },

        transformForHTMLEditor: function (str) {
            return this.text2html(str, { blockquotes: true, links: true, lists: true, rulers: true });
        },

        // convert plain text to html
        // supports blockquotes and lists
        // note: this does not work with our pseudo text mails that still contain markup (e.g. <br> and <a href>)
        text2html: (function () {

            var regBlockquote = /^>+( [^\n]*|)(\n>+( [^\n]*|))*/,
                regIsUnordered = /^(\*|-) [^\n]*(\n(\*|-) [^\n]*|\n {2,}(\*|-) [^\n]*)*/,
                regIsOrdered = /^\d+\. [^\n]*(\n\d+\. [^\n]*|\n {2}\d+\. [^\n]*)*/,
                regNewline = /^\n+/,
                regText = /^[^\n]*(\n(?![ ]*(\* |- |> |\d+\. ))[^\n]*)*/,
                regLink = /(https?:\/\/.*?)([!?.,>()]\s|\s|[!?.,>()]$|$)/gi,
                regMailAddress = /([^@"\s<,:;|()[\]\u0100-\uFFFF]+?@[^@\s]*?(\.[\w-]+)+)/g,
                regRuler = /(^|\n)(-|=|\u2014){10,}(\n|$)/g,
                regImage = /^!\([^\)]+\)$/gm,
                defaults = { blockquotes: true, images: true, links: true, lists: true, rulers: true };

            function exec(regex, str) {
                var match = regex.exec(str);
                return match && match[0];
            }

            function parse(str, options) {

                var out = '', match, start;

                options = options || defaults;

                while (str) {

                    if (options.blockquotes && (match = exec(regBlockquote, str))) {
                        str = str.substr(match.length);
                        match = match.replace(/^(>(>)|> |>$)/gm, '$2');
                        match = parse(match, options).replace(/(<br>)?(<\/?blockquote[^>]*>)(<br>)?/g, '$2').replace(/<br>$/, '');
                        out += '<blockquote type="cite">' + match + '</blockquote>';
                        continue;
                    }

                    if (options.lists && (match = exec(regIsUnordered, str))) {
                        str = str.substr(match.length);
                        match = match.replace(/^../gm, '');
                        match = parse(match, options).replace(/<br><ul>/g, '<ul>').replace(/<br>/g, '</li><li>');
                        out += '<ul><li>' + match + '</li></ul>';
                        continue;
                    }

                    if (options.lists && (match = exec(regIsOrdered, str))) {
                        str = str.substr(match.length);
                        start = parseInt(match, 10);
                        match = match.replace(/^\d+\. /gm, '');
                        match = parse(match, options).replace(/<br>(<ol[^>]*>)/g, '$1').replace(/<br>/g, '</li><li>');
                        out += '<ol start="' + start + '"><li>' + match + '</li></ol>';
                        continue;
                    }

                    if (match = exec(regNewline, str)) {
                        str = str.substr(match.length);
                        out += match.replace(/\n/g, '<br>');
                        continue;
                    }

                    if (match = exec(regText, str)) {
                        // advance
                        str = str.substr(match.length + (options.lists ? 1 : 0));
                        // escape first (otherwise we escape our own markup later)
                        // however, we just escape < (not quotes, not closing brackets)
                        // we add a \r to avoid &lt; become part of URLs
                        match = match.replace(/</g, '\r&lt;');
                        // rulers
                        if (options.rulers) {
                            match = match.replace(regRuler, replaceRuler);
                        }
                        // images
                        if (options.images) {
                            match = match.replace(regImage, replaceImage);
                        }
                        // links & mail addresses
                        if (options.links && /(http|@)/i.test(match)) {
                            match = match
                                .replace(regLink, function (all, href, suffix) {
                                    // substitute @ by entity to avoid double detection, e.g. if an email address is part of a link
                                    href = href.replace(/@/g, '&#64;');
                                    return '<a href="' + href + '" rel="noopener" target="_blank">' + href + '</a>' + suffix;
                                })
                                .replace(regMailAddress, function (all, address) {
                                    return '<a href="mailto:' + address + '">' + address + '</a>';
                                });
                        }
                        // remove \r and replace newlines
                        out += match.replace(/\r/g, '').replace(/\n/g, '<br>');
                        continue;
                    }

                    if (str) {
                        if (ox.debug) console.error('Ooops', out + '\n\n' + str);
                        break;
                    }
                }

                return out;
            }

            function replaceRuler(str) {
                switch (str[0]) {
                    case '=':
                        return '<hr style="height: 0; border: 0; border-top: 3px double #555; margin: 8px 0;">';
                    default:
                        return '<hr style="height: 0; border: 0; border-top: 1px solid #aaa; margin: 8px 0;">';
                }
            }

            function replaceImage(str) {
                return '<img src="' + str.substr(2, str.length - 3) + '" alt="">';
            }

            return parse;

        }())
    };

    return that;
});
