/* jshint unused: false */
/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define.async('io.ox/core/tk/contenteditable-editor',
    ['io.ox/core/emoji/util',
     'io.ox/core/capabilities',
     'settings!io.ox/core',
     'io.ox/core/extensions'
    ], function (emoji, capabilities, settings, ext) {

    'use strict';

    /*
     * Helpers to handle paste
     */
    function makeParagraph() {
        var self = $(this),
            style = self.attr('style'),
            p = $('<p>');
        if (style) {
            p.attr('style', style);
        }
        self.replaceWith(p.append(self.contents()));
    }

    // just to test if class attribute contains "emoji"
    var regEmoji = /emoji/,
        // check for http:, mailto:, or tel:
        regProtocal = /^\w+:/;

    function paste_preprocess(pl, o) {
        //console.debug('pre', o.content);
        o.content = o.content
            // remove comments
            .replace(/<!--(.*?)-->/g, '')
            // remove class attribute - except for emojis
            .replace(/\sclass="[^"]+"/g, function (all) {
                return regEmoji.test(all) ? all : '';
            })
            // remove emoji images and convert them back to unicode characters
            .replace(/<img[^>]* data-emoji-unicode=\"([^\"]*)\"[^>]*>/gi, '$1')

            // remove custom attributes
            .replace(/ data-[^=]+="[^"]*"/ig, '')
            // remove relative links
            .replace(/(<a[^<]+)href="([^"]+)"/g, function (all, prefix, href) {
                return regProtocal.test(href) ? all : prefix;
            })
            // remove &nbsp;
            .replace(/&nbsp;/ig, ' ')
            // fix missing white-space before/after links
            .replace(/([^>\s])<a/ig, '$1 <a')
            .replace(/<\/\s?a>([^<\s,\.:;])/ig, '</a> $1')
            // beautify simple quotes
            .replace(/([^=])"([\w\- ]+)"/g, '$1\u201C$2\u201D')
            // beautify dashes
            .replace(/(\w\s)-(\s\w)/g, '$1\u2013$2');
        o.content = emoji.processEmoji(o.content);
    }

    // simplify DOM tree
    function simplify(memo, elem) {
        var self = $(elem),
            tagName = elem.tagName,
            children = self.children(),
            text,
            unwrapDiv = true;

        if (tagName === 'DIV' && self.attr('id') && self.attr('id').indexOf('ox-text-p') !== -1) {
            // OX Text Paragraph DIV
            unwrapDiv = false;
        }

        // remove attributes
        self.removeAttr('id title alt rel');
        // is closed tag?
        if (/^(BR|HR|IMG)$/.test(tagName)) {
            return memo;
        }
        // fix text align
        if (self.attr('align')) {
            self.css('textAlign', self.attr('align')).removeAttr('align');
        }
        // fix text nodes
        self.contents().each(function () {
            if (elem.nodeType === 3) {
                elem.nodeValue = elem.nodeValue
                    // fix space before quotes
                    .replace(/:$/, ': ');
            }
        });
        // has no children?
        if (children.length === 0) {
            text = $.trim(self.text());
            // has no text?
            if (text === '') {
                // empty table cell?
                if (tagName === 'TD') {
                    self.text('\u00A0');
                } else {
                    // remove empty element
                    self.remove();
                    return false;
                }
            } else {
                // remove simple <span>, <small>, and <pre>
                if (/^(SPAN|SMALL|PRE)$/.test(tagName)) {
                    if (!self.attr('class') && !self.attr('style')) {
                        self.replaceWith($.txt(self.text()));
                        return false;
                    }
                }
                // is quote?
                if (/^".+"$/.test(text)) {
                    self.text(text.replace(/^"/, '\u201C').replace(/"$/, '\u201D'));
                }
            }
        } else {
            // extraneous DIV?
            if (tagName === 'DIV' && !self.attr('class') && !self.attr('style') && unwrapDiv) {
                children.eq(0).unwrap();
                return false;
            }
        }
        return memo;
    }

    function unwrap() {
        $(this).children().first().unwrap();
    }

    function cleanUpLinks() {
        var self = $(this), match;
        if (!self.attr('href')) {
            // unwrap dead links (usually javascript hooks)
            self.replaceWith(self.contents());
        } else {
            // remove title & target
            self.removeAttr('title target');
            // fix references
            if (/^\[\d+\]$/.test(self.text()) && /^#/.test(self.attr('href'))) {
                match = (String(self.text())).match(/^\[(\d+)\]$/);
                self.replaceWith($('<sup>').text(match[1]).add($.txt(' ')));
            }
        }
    }

    function replaceCodeByEm() {
        var self = $(this);
        self.replaceWith($('<em>').text(self.text()));
    }

    function beautifyTable() {
        var self = $(this);
        self.removeAttr('width')
            .attr({
                border: '0',
                cellSpacing: '0',
                cellPadding: '0'
            })
            .css({
                lineHeight: '1em',
                margin: '0.5em auto 0.5em auto' // center!
            });
        self.find('th')
            .css({
                fontWeight: 'bold',
                textAlign: 'center',
                borderBottom: '1px solid #555',
                padding: '0.4em 1em 0.4em 1em'
            });
        self.find('td')
            .css({
                borderBottom: '1px solid #aaa',
                padding: '0.4em 1em 0.4em 1em'
            });
        self.find('tr').first()
            .find('td, th').css({
                borderTop: '1px solid #555'
            });
        self.find('tr').last()
            .find('td, th').css({
                borderBottom: '1px solid #555'
            });
    }

    function removeEmptyParagraphs() {
        var self = $(this),
            contents = self.contents();
        if (contents.length === 1 && contents.get(0).tagName === 'BR') {
            self.remove();
        }
    }

    function paste_postprocess(pl, o) {
        var node = $(o.node), done;
        //console.debug('post', node.html());
        // remove iframes and other stuff that shouldn't be in an email
        // images too - doesn't work with copy/paste (except for emoji classed images)
        node.find(
            'iframe, object, applet, input, textarea, button, select, ' +
            'canvas, script, noscript, audio, video, img'
            )
            .filter(':not(img.emoji,img[src*="' + ox.abs + ox.root + '/api/file"])').remove();
        // beautify SUP tags
        node.find('sup').css('lineHeight', '0');
        // unwrap
        node.find('article, header, footer, section, form').each(unwrap);
        // clean up links
        node.find('a').each(cleanUpLinks);
        // replace <code> by <em>
        node.find('code').each(replaceCodeByEm);
        // simplify structure
        do {
            done = _(node.find('*')).inject(simplify, true);
        } while (!done);
        // beautify tables
        node.find('table').each(beautifyTable);
        // replace top-level <div> by <p>
        node.eq(0).children('div').each(makeParagraph);
        // remove <p> with just one <br> inside
        node.find('p').each(removeEmptyParagraphs);
    }

    function isInsideBlockquote(range) {
        // get ancestor/parent container
        var container = range.commonAncestorContainer || range.parentElement();
        // loop for blockquote
        var bq = $(container).parents('blockquote').last(),
            is = bq.length > 0;
        //console.debug('inside?', is, bq);
        return is;
    }

    function splitContent_W3C(ed) {
        // get current range
        var range = ed.selection.getRng();
        // range collapsed?
        if (!range.collapsed) {
            // delete selected content now
            ed.execCommand('Delete', false, null);
            // reselect new range
            range = ed.selection.getRng();
        }
        // do magic
        var container = range.commonAncestorContainer;
        var lastBR = null,
            traverse;
        // helper
        traverse = function (node) {
            var i;
            if (node) {
                if (node.hasChildNodes()) {
                    // skip text nodes
                    for (i = 0; i < node.childNodes.length; i++) {
                        if (node.childNodes[i].nodeType === 1) {
                            // follow this node
                            traverse(node.childNodes[i]);
                            return;
                        } else if (node.childNodes[i].nodeType === 3) {
                            // remove zero width space (good for safari)
                            node.childNodes[i].nodeValue = node.childNodes[i].nodeValue.replace('\u200B', '');
                        }
                    }
                } else if (node.nodeName === 'BR') {
                    // remember node
                    lastBR = node;
                }
            }
        };
        while (container && !/mce-content-body/.test(container.className)) {
            // set range to end of container
            range.setEndAfter(container);
            // get parent node
            var p = container.parentNode;
            // add range content before next sibling (or at the end of the parent node)
            var contents = range.extractContents();
            // BR fix (remove unwanted newline)
            traverse(contents.firstChild);
            // now insert contents
            if ($(contents).text().length > 0) {
                // insert this content only if it includes something visible
                // Actually this allows to split a quote after the very last
                // character without getting empty gray blocks below the split
                p.insertBefore(contents, container.nextSibling);
            }
            // fix ordered lists. Look for subsequent <ol>...</ol><ol>...
            try {
                var ol = $(p).children('ol + ol'), prev, start;
                if (ol.length > 0) {
                    prev = ol.prev();
                    start = prev.children('li').length + 1;
                    ol.attr('start', start);
                }
            } catch (e) { }
            // climb up
            container = p;
        }
        // last BR?
        if (lastBR) {
            try {
                lastBR.parentNode.removeChild(lastBR);
            } catch (e) {
            }
        }
        // create new elements
        var dummySpan = ed.getDoc().createElement('span');
        dummySpan.innerHTML = '&nbsp;';
        var para = ed.getDoc().createElement('p');
        // and both elements to editor
        para.appendChild(dummySpan);
        range.insertNode(para);
        // select the span
        ed.selection.select(dummySpan);
        // and delete it
        ed.execCommand('Delete', false, null);
    }

    function splitContent(ed, e) {
        // get current range
        var range = ed.selection.getRng();
        // inside blockquote?
        if (!isInsideBlockquote(range)) return;
        if (!range.startContainer) return;
        if (_.device('IE')) return;
        // split; W3C-compliant strategy; older IEs needed a different strategy
        splitContent_W3C(ed);
        ed.dom.events.cancel(e);
    }

    function lookupTinyMCELanguage() {
        var tinymce_lang,
        lookup_lang = ox.language,
        tinymce_langpacks = ['ar', 'ar_SA', 'az', 'be', 'bg_BG', 'bn_BD', 'bs', 'ca', 'cs', 'cy', 'da', 'de', 'de_AT', 'dv', 'el', 'en_CA', 'en_GB', 'es', 'et', 'eu', 'fa', 'fi', 'fo', 'fr_FR', 'gd', 'gl', 'he_IL', 'hr', 'hu_HU', 'hy', 'id', 'is_IS', 'it', 'ja', 'ka_GE', 'kk', 'km_KH', 'ko_KR', 'lb', 'lt', 'lv', 'ml', 'ml_IN', 'mn_MN', 'nb_NO', 'nl', 'pl', 'pt_BR', 'pt_PT', 'ro', 'ru', 'si_LK', 'sk', 'sl_SI', 'sr', 'sv_SE', 'ta', 'ta_IN', 'tg', 'th_TH', 'tr_TR', 'tt', 'ug', 'uk', 'uk_UA', 'vi', 'vi_VN', 'zh_CN', 'zh_TW'],

        tinymce_lang = _.indexOf(tinymce_langpacks, lookup_lang, true);

        // See bug 38381
        if (lookup_lang === 'fr_CA') return 'fr_FR';

        if (tinymce_lang > -1) {
            return tinymce_langpacks[tinymce_lang];
        } else {
            tinymce_lang = _.indexOf(tinymce_langpacks, lookup_lang.substr(0, 2), true);
            return (tinymce_lang > -1) ? tinymce_langpacks[tinymce_lang] : 'en';
        }
    }

    function Editor(el) {

        var def = $.Deferred(), ed,
            toolbar1, toolbar2, toolbar3, advanced;

        // toolbar default
        toolbar1 = 'undo redo | bold italic | emoji | bullist numlist outdent indent';
        advanced = 'styleselect fontselect fontsizeselect | forecolor backcolor | link image';
        toolbar2 = '';
        toolbar3 = '';

        toolbar1 += ' | ' + advanced;

        // consider custom configurations
        toolbar1 = settings.get('tinyMCE/theme_advanced_buttons1', toolbar1);
        toolbar2 = settings.get('tinyMCE/theme_advanced_buttons2', toolbar2);
        toolbar3 = settings.get('tinyMCE/theme_advanced_buttons3', toolbar3);

        // remove unsupported stuff
        if (!capabilities.has('emoji')) {
            toolbar1 = toolbar1.replace(/( \| )?emoji( \| )?/g, ' | ');
            toolbar2 = toolbar2.replace(/( \| )?emoji( \| )?/g, ' | ');
            toolbar3 = toolbar3.replace(/( \| )?emoji( \| )?/g, ' | ');
        }

        var fixed_toolbar = '[data-editor-id="' + el.attr('data-editor-id') + '"].editable-toolbar';

        el = $(el);
        el.tinymce({

            script_url: ox.base + '/apps/3rd.party/tinymce/tinymce.min.js',

            extended_valid_elements: 'blockquote[type]',

            // CSS for Editor content (See /apps/io.ox/core/tk/html-editor.less)
            // content_css: ox.base + '/apps/themes/' + require('settings!io.ox/core').get('theme') + '/io.ox/core/tk/html-editor.css',

            inline: true,

            fixed_toolbar_container: fixed_toolbar,

            menubar: false,
            statusbar: false,

            skin: 'ox',

            toolbar1: toolbar1,
            toolbar2: toolbar2,
            toolbar3: toolbar3,

            relative_urls: false,
            remove_script_host: false,

            entity_encoding: 'raw',

            browser_spellcheck: true,

            plugins: 'autolink oximage link paste textcolor emoji',

            language: lookupTinyMCELanguage(),

            // disable the auto generation of hidden input fields (we don't need them)
            hidden_input: false,

            theme: 'unobtanium',

            /*
            TODO: needed for emoji ?
            object_resizing: 0,
            */

            // need this to work in karma/phantomjs // TODO: still needed?
            //content_element: textarea.get(0),

            init_instance_callback: function (editor) {
                ed = editor;
                def.resolve();
            },

            execcommand_callback: function (editor_id, elm, command) {
                if (command === 'createlink') {
                    _.defer(function () {
                        $(tinyMCE.get(editor_id).getBody()).find('a').attr('target', '_blank');
                    });
                }
            },
            // post processing (string-based)
            paste_preprocess: paste_preprocess,
            // post processing (DOM-based)
            paste_postprocess: paste_postprocess,

            setup: function (ed) {
                ed.on('keydown', function (e) {
                    // pressed enter?
                    if ((e.keyCode || e.which) === 13) {
                        try {
                            // split content
                            splitContent(ed, e);
                        } catch (e) {
                            console.error('Ooops! setup.onKeyDown()', e);
                        }
                    }
                });

                ext.point('3rd.party/emoji/editor_css').each(function (point) {
                    var url = ed.convertURL(require.toUrl(point.css));
                    ed.contentCSS.push(url);
                });
            }
        });

        function trimEnd(str) {
            return String(str || '').replace(/[\s\xA0]+$/g, '');
        }

        var resizeEditor = _.debounce(function () {
          if (el === null) return;

            var p = el.parent(),
            h = $(window).height(),
            top = el.offset().top;

            el.css('min-height', (h - top - 40));
            var th = $(fixed_toolbar + ' > div').height(),
                w = $(fixed_toolbar).next().outerWidth();
            if (th) {
                $(fixed_toolbar).css('height', th + 1);
            }
            if (w) {
                $(fixed_toolbar).css('width', w);
            }
            return;

        }, 30),

        quote = function (str) {
            return '> ' + $.trim(str).replace(/\n/g, '\n> ');
        },

        set = function (str) {
            var text = emoji.processEmoji(str, function (text, lib) {
                if (!lib.loaded) return;
                ed.setContent(text);
            });
            ed.setContent(text);
        },

        clear = function () {
            set('');
        },

        ln2br = function (str) {
            return String(str || '').replace(/\r/g, '')
                .replace(new RegExp('\\n', 'g'), '<br>'); // '\n' is for IE
        },

        // get editor content
        // trim white-space and clean up pseudo XHTML
        // remove empty paragraphs at the end
        get = function () {
            // remove tinyMCE resizeHandles
            $(ed.getBody()).find('.mce-resizehandle').remove();

            // get raw content
            var content = ed.getContent({ format: 'raw' });
            // convert emojies
            content = emoji.imageTagsToUnified(content);
            // clean up
            content = content
                // remove custom attributes (incl. bogus attribute)
                .replace(/\sdata-[^=]+="[^"]*"/g, '')
                .replace(/<(\w+)[ ]?\/>/g, '<$1>')
                .replace(/(<p>(<br>)?<\/p>)+$/, '');

            // remove trailing white-space, line-breaks, and empty paragraphs
            content = content.replace(
                /(\s|&nbsp;|\0x20|<br\/?>|<p( class="io-ox-signature")>(&nbsp;|\s|<br\/?>)*<\/p>)*$/g, ''
            );

            // remove trailing white-space
            return trimEnd(content);
        };

        // publish internal 'done'
        this.done = function (fn) {
            def.done(fn);
            return def;
        };

        this.focus = function () {
            ed.focus();
        };

        this.ln2br = ln2br;

        this.clear = clear;

        this.getContent = get;

        this.getPlainText = function () {

            if (_.browser.IE) {
                // IE ignores paragraphs, so we help a bit
                $('p', ed.getBody()).append('<br>');
            }
            // fix headers
            $(':header', ed.getBody()).append('<br>');
            // loop over top-level nodes
            var tmp = '';
            $(ed.getBody()).children().each(function () {
                var text = '',
                    content;
                // get text via selection
                // use jQuery to parse HTML, because there is no obvious way to
                // transform the emoji img tags to unicode before getContent call
                ed.selection.select(this, true);
                content = emoji.imageTagsToUnified(ed.selection.getContent());
                // preserve simple line breaks and get text content
                text = $('<div>').html(content.replace(/<br>/g, '\n')).text();
                switch (this.tagName) {
                case 'BLOCKQUOTE':
                    tmp += quote(text) + '\n\n';
                    break;
                case 'P':
                case 'H1':
                case 'H2':
                case 'H3':
                case 'H4':
                    tmp += text + '\n\n';
                    break;
                default:
                    tmp += text + '\n';
                    break;
                }
            });
            return tmp;
        };

        this.setContent = set;

        this.setPlainText = function (str) {
            var text = '', quote = false, tmp = '', lTag, rTag;
            // clean up
            str = trimEnd(str);
            // needs leading empty paragraph?
            if (str.substr(0, 2) === '\n\n') {
                text += '<p></p>';
                str = str.substr(2);
            }
            // split & loop
            _(str.split('\n').concat('')).each(function (line) {
                var trimmed = $.trim(line);
                if (trimmed === '' || (quote && trimmed.substr(0, 1) !== '>')) {
                    lTag = quote ? '<blockquote type="cite"><p>' : '<p>';
                    rTag = quote ? '</blockquote></p>' : '</p>';
                    text += tmp !== '' ? lTag + tmp.replace(/<br>$/, '') + rTag : '';
                    tmp = '';
                    quote = false;
                } else if (trimmed.substr(0, 1) === '>') {
                    tmp += trimmed.substr(2).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '<br>';
                    quote = true;
                } else {
                    // use untrimmed "line" here!
                    tmp += line.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '<br>';
                }
            });
            set(text);
        };

        this.paste = function (str) {
            ed.execCommand('mceInsertClipboardContent', false, { content: str });
        };

        this.scrollTop = function (pos) {
            var doc = $(ed.getDoc());
            if (pos === undefined) {
                return doc.scrollTop();
            } else if (pos === 'top') {
                doc.scrollTop(0);
            } else if (pos === 'bottom') {
                doc.scrollTop(doc.get(0).body.scrollHeight);
            }
        };

        this.setCaretPosition = function () {
            $(ed.getDoc()).scrollTop(0);
        };

        this.appendContent = function (str) {
            var content = this.getContent();
            str = (/^<p/i).test(str) ? str : '<p>' + ln2br(str) + '</p>';
            this.setContent(content + str);
        };

        this.prependContent = function (str) {
            var content = this.getContent();
            str = (/^<p/i).test(str) ? str : '<p>' + ln2br(str) + '</p>';
            this.setContent(str + content);
        };

        this.replaceParagraph = function (str, rep) {
            var content = this.getContent(), pos, top;
            str = (/^<p/i).test(str) ? str : '<p>' + ln2br(str) + '</p>';
            // exists?
            if ((pos = content.indexOf(str)) > -1) {
                // replace content
                top = this.scrollTop();
                this.setContent(content.substr(0, pos) + (rep || '') + content.substr(pos + str.length));
                this.scrollTop(top);
                return true;
            } else {
                return false;
            }
        };

        this.removeContent = function (str) {
            this.replaceContent(str, '');
        };

        // allow jQuery access
        this.find = function (selector) {
            return $(ed.getDoc()).find(selector);
        };

        this.replaceContent = function (str, rep) {

            // adopted from tinyMCE's searchreplace plugin
            var range, win = ed.getWin(),
                found = false;

            function replace() {
                ed.selection.setContent(rep || '');
            }

            ed.selection.select(ed.getBody(), true);
            ed.selection.collapse(true);

            if (_.browser.IE) {
                ed.focus();
                range = ed.getDoc().selection.createRange();
                while (range.findText(str, 1, 0)) {
                    range.scrollIntoView();
                    range.select();
                    replace();
                    found = true;
                }
            } else {
                while (win.find(str, 0, 0, false, false, false, false)) {
                    replace();
                    found = true;
                }
            }

            return found;
        };

        this.getMode = function () {
            return 'html';
        };

        // convenience access
        this.tinymce = function () {
            return el.tinymce ? el.tinymce() : {};
        };

        this.handleShow = function () {
            el.parents('.window-content').find('textarea').hide();
            el.idle().show();
            $(fixed_toolbar).show();
            resizeEditor();
            $(window).on('resize.tinymce', resizeEditor);
        };

        this.handleHide = function () {
            $(window).off('resize.tinymce');
        };

        this.destroy = function () {
            this.handleHide();
            if (el.tinymce()) {
                el.tinymce().remove();
            }
            el = el.tinymce = def = ed = null;
        };
    }

    // $.getScript adds cache busting query
    return $.ajax({ url: ox.base + '/apps/3rd.party/tinymce/jquery.tinymce.min.js', cache: true, dataType: 'script' }).then(function () {
        // publish editor class
        return Editor;
    });
});
