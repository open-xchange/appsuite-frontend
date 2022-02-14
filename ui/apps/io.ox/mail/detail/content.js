/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

/* global blankshield:true */

define('io.ox/mail/detail/content', [
    'io.ox/mail/api',
    'io.ox/mail/util',
    'io.ox/core/util',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/mail/detail/links',
    'io.ox/mail/sanitizer',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (api, util, coreUtil, ext, capabilities, links, sanitizer, settings, gt) {

    'use strict';

    var regHTML = /^text\/html$/i;

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
                // add missing http protocol prefix
                .replace(/<a[^>]*href=(?:"|')((?!https?:\/\/)[^'">]+)(?:"|')[^>]*>/g, addMissingProtocol)
                // fix targets
                .replace(/<a[^>]*href\s*=\s*(?:"|')(https?:\/\/[^>]+)(?:"|')[^>]*>/g, setLinkTarget);
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
        // safari only
        tableHeight: function (baton) {
            if (!_.browser.safari && !baton.isHTML) return;
            baton.source = baton.source.replace(/(<table[^>]+?style[\s]*=[\s]*["'])(.*?)(["'][^>]*>)/g, function (match, head, value, tail) {
                return head + value.replace(/[^-]height:\s100%\s!important/, 'height: auto') + tail;
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
            if (!util.isMalicious(baton.data) && !util.authenticity('block', baton.data)) return;
            if (util.isWhiteListed(baton.data)) return;
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
                    if (shareLinkUrl && link.attr('href') === shareLinkUrl) {
                        // check if it is a valid app
                        if (ox.ui.apps.get('io.ox/' + data.app) || ox.ui.apps.get(data.app)) {
                            link.addClass('deep-link-app');
                        }
                    }
                    return;
                }

                // important: if this is not an internal deeplink (not in valid hosts), we must remove deeplink markup. Otherwise our event listeners are triggered instead of opening in a new tab.
                link.removeClass('deep-link-files', 'deep-link-contacts', 'deep-link-calendar', 'deep-link-tasks', 'deep-link-gdpr', 'deep-link-app');

                if (href.search(/^\s*mailto:/i) > -1) {
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
                var fulltext = getText(node);
                if (fulltext.length < 500) return;
                var blockquoteId = _.uniqueId('collapsed-blockquote-');
                var ellipsisButton = $('<button type="button" class="bqt">').attr('title', gt('Show quoted text')).append(
                    $('<span aria-hidden="true">').text('...')
                );
                if (!_.browser.Chrome) {
                    ellipsisButton.attr({
                        'aria-controls': blockquoteId,
                        'aria-expanded': false
                    });
                }
                // we don't use <a href=""> here, as we get too many problems with :visited inside mail content
                var parts = [ellipsisButton];
                // some text optimizations
                var text = getText(node, true).replace(/<\s/g, '<').replace(/\s>/g, '>')
                    .replace(/("'\s?|\s?'")/g, '').replace(/[-_]{3,}/g, '');
                if (text.length > 500) {
                    parts.push(
                        $.txt(text.substr(0, 210).replace(/\s\S{1,10}$/, ' ') + '\u2026'),
                        $('<br>'),
                        $.txt('\u2026' + text.substr(-210).replace(/^\S{1,10}\s/, ' '))
                    );
                } else {
                    parts.push($.txt(text));
                }
                $(node).addClass('collapsed-blockquote').hide().attr('id', blockquoteId).after(
                    $('<div class="blockquote-toggle">').append(parts)
                );
            });
            // delegate
            $(this).on('click keydown', '.blockquote-toggle', expandBlockquote);
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
        id: 'table-height',
        index: 550,
        process: extensions.tableHeight
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
            if (!util.isMalicious(baton.data) && !util.authenticity('block', baton.data)) return;
            if (util.isWhiteListed(baton.data)) return;
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

    // forward image load event to trigger resize in view
    ext.point('io.ox/mail/detail/content').extend({
        id: 'image-load',
        index: 1200,
        process: function () {
            var self = this;
            $(self).find('img[src!=""]').each(function () {
                var img = $(this);
                img.on('load error', function () {
                    $(self).trigger('imageload');
                });
            });
        }
    });

    //
    // Beautify
    //

    ext.point('io.ox/mail/detail/beautify').extend(
        {
            id: 'no-ampersand',
            process: function (baton) {
                baton.data = baton.data.replace(/&/g, '&amp;');
            }
        },
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
        },
        {
            id: 'white-space',
            process: function (baton) {
                // maintain spaces after opening tags as well as subsequent spaces (see bug 56851)
                baton.data = baton.data.replace(/((>) |( ) )/g, '$1&nbsp;');
            }
        }
    );

    //
    // Helpers
    //

    function setLinkTarget(match /*, link*/) {
        //replace or add link target to '_blank'
        return (/target="[^"]*"/).test(match) ? match.replace(/(target="[^"]*")/i, 'target="_blank"') : match.replace('>', ' target="_blank" rel="noopener">');
    }

    function addMissingProtocol(match, url) {
        // other protocol (mailto:, ftp://, ...)
        if (/^[^:.#]+:/.test(url)) return match;
        // anchor link
        if (/^#/.test(url)) return match;
        return match.replace(url, 'http://' + url);
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

    function getText(node, skipBlockquote) {
        // get text content for current node if it's a text node
        var value = (node.nodeType === 3 && String(node.nodeValue).trim()) || '',
            // ignore white-space
            str = value ? value + ' ' : '';
        // loop over child nodes for recursion
        _(node.childNodes).each(function (child) {
            if (child.tagName === 'STYLE') return;
            if (skipBlockquote && child.tagName === 'BLOCKQUOTE') return;
            str += getText(child, skipBlockquote);
        });
        return str;
    }

    function expandBlockquote(e) {
        if (e.which === 13 || e.which === 23 || e.type === 'click') {
            e.preventDefault();
            e.stopPropagation();
            $(this).hide().prev().show();
            // needed for FF to handle the resize
            _.delay(function () {
                $(e.delegateTarget).trigger('resize').trigger('toggle-blockquote');
            }, 20);

            $(this).remove();
        }
    }


    var that = {

        extensions: extensions,

        get: function (data, options, flow) {

            if (!data || !data.attachments) {
                return { content: $(), isLarge: false, type: 'text/plain' };
            }

            var baton = new ext.Baton(_({ data: data, options: options || {}, source: '', type: 'text/plain', flow: flow }).omit(function (val) { return val === undefined; })), content,
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
                    } else if (baton.type === 'text/plain' && isImage.test(attachment.content_type) && settings.get('allowHtmlMessages', true)) {
                        // add images if text
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
                    baton.source = sanitizer.sanitize({
                        content_type: 'text/html',
                        content: baton.source
                    }).content;
                    // robust constructor for large HTML -- no jQuery here to avoid its caches
                    content = document.createElement('HTML');
                    content.innerHTML = baton.source;
                    // we only need the body
                    content = content.getElementsByTagName('body')[0];
                    content.className = content.className + ' mail-detail-content noI18n';
                    // last line of defense
                    each(content, 'script, base, meta', function (node) {
                        node.parentNode.removeChild(node);
                    });
                } else {
                    // plain TEXT
                    content = document.createElement('DIV');
                    content.className = 'mail-detail-content plain-text noI18n';
                    baton.source = that.beautifyPlainText(baton.source);
                    content.innerHTML = baton.source;
                }

                content.setAttribute('role', 'complementary');
                content.setAttribute('aria-label', data.subject);

                // process content
                ext.point('io.ox/mail/detail/content-general').invoke('process', content, baton);
                if (!baton.isLarge) ext.point('io.ox/mail/detail/content').invoke('process', content, baton);

            } catch (e) {
                console.error('mail.getContent', e.message, e, data);
            }

            return { content: content, isLarge: baton.isLarge, type: baton.type, isText: baton.isText };
        },

        beautifyPlainText: function (str) {
            var baton = ext.Baton({ data: str });
            ext.point('io.ox/mail/detail/beautify').invoke('process', this, baton);
            return sanitizer.simpleSanitize(baton.data);
        },

        transformForHTMLEditor: function (str) {
            return this.text2html(str, { blockquotes: true, links: true });
        },

        // convert plain text to html
        // supports blockquotes
        // note: this does not work with our pseudo text mails that still contain markup (e.g. <br> and <a href>)
        text2html: (function () {

            var regBlockquote = /^>+( [^\n]*|)(\n>+( [^\n]*|))*\n?/,
                regNewline = /^\n+/,
                regText = /^[^\n]*(\n(?![ ]*(> ))[^\n]*)*\n?/,
                regLink = /(https?:\/\/.*?)([!?.,>()[\]]+\s|\s|[!?.,>()[\]]+$|$)/gi,
                regMailAddress = /([^@"\s<,:;|()[\]\u0100-\uFFFF]+?@[^@\s]*?(\.[\w-]+)+)/g,
                regImage = /^!\([^)]+\)$/gm,
                defaults = { blockquotes: true, images: true, links: true };

            function exec(regex, str) {
                var match = regex.exec(str);
                return match && match[0];
            }

            function parse(str, options) {

                var out = '', match;

                options = options || defaults;

                while (str) {

                    if (options.blockquotes && (match = exec(regBlockquote, str))) {
                        str = str.substr(match.length);
                        match = match.replace(/^(>(>)|> |>$)/gm, '$2');
                        match = parse(match, options).replace(/(<br>)?(<\/?blockquote[^>]*>)(<br>)?/g, '$2').replace(/<br>$/, '');
                        out += '<blockquote type="cite">' + match + '</blockquote>';
                        continue;
                    }

                    if (match = exec(regNewline, str)) {
                        str = str.substr(match.length);
                        out += match.replace(/\n/g, '<div><br></div>');
                        continue;
                    }

                    if (match = exec(regText, str)) {
                        // advance
                        str = str.substr(match.length);
                        // escape first (otherwise we escape our own markup later)
                        // however, we just escape < (not quotes, not closing brackets)
                        // we add a \r to avoid &lt; become part of URLs
                        match = match.replace(/</g, '\r&lt;');
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
                        out += '<div>' + match
                            .replace(/\r/g, '')
                            .replace(/\n+/g, function (all) {
                                return '</div>' + new Array(all.length).join('<div><br></div>') + '<div>';
                            })
                            + '</div>';
                        continue;
                    }

                    if (str) {
                        if (ox.debug) console.error('Ooops', out + '\n\n' + str);
                        break;
                    }
                }

                out = out.replace(/<div><\/div>/g, '');

                return out;
            }

            function replaceImage(str) {
                return '<img src="' + str.substr(2, str.length - 3) + '" alt="">';
            }

            return parse;

        }())
    };

    return that;
});
