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

define.async('io.ox/core/tk/html-editor',
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

    function splitContent_IE(ed) {
        // get current range
        var range = ed.selection.getRng(),
            // get body
            body = ed.getBody(),
            // get two text ranges
            before = body.createTextRange(),
            after = body.createTextRange(),
            mark, markHTML;
        // initialize first range & get its content
        before.setEndPoint('EndToStart', range);
        before = before.htmlText;
        // initialize second range & get its content
        after.setEndPoint('StartToEnd', range);
        // BR fix (remove unwanted newline)
        // leading white space in regexp is necessary (don't ask)
        after = after.htmlText.replace(/^(\s*<[^>]+>\s*)<BR\s*\/?>(.*)$/im, '$1$2');
        // create a unique mark
        mark = '#cursor~mark^';
        // check uniqueness
        while (before.indexOf(mark) >= 0 || after.indexOf(mark) >= 0) {
            // add random characters until its unique
            mark += String.fromCharCode(64 + Math.random() * 63);
        }
        // replace editor content
        markHTML = '<p>' + mark + '</p>';
        body.innerHTML = before + markHTML + after;
        // select mark
        range.findText(mark);
        range.select();
        // delete mark (this way!)
        range.pasteHTML('');
        range.collapse(true);
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
        while (container && container.nodeName !== 'BODY') {
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
        if (isInsideBlockquote(range)) {
            // W3C or IE?
            if (range.startContainer) {
                // strategy #1 (W3C compliant)
                splitContent_W3C(ed);
            } else {
                // strategy #2 (IE-specific / IE7 & IE8)
                splitContent_IE(ed);
            }
            ed.dom.events.cancel(e);
        }
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

    function Editor(textarea) {

        var def = $.Deferred(), ed,
            toolbar1, toolbar2, toolbar3, advanced,
            width = $(document).width();

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

        textarea = $(textarea);
        textarea.tinymce({

            script_url: ox.base + '/apps/3rd.party/tinymce/tinymce.min.js',

            extended_valid_elements: 'blockquote[type]',

            // CSS for Editor content (See /apps/io.ox/core/tk/html-editor.less)
            content_css: ox.base + '/apps/themes/default/io.ox/core/tk/html-editor.css',

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

            /*
            TODO: needed for emoji ?
            object_resizing: 0,
            */

            // need this to work in karma/phantomjs // TODO: still needed?
            //content_element: textarea.get(0),

            init_instance_callback: function (editor) {

                ed = editor;

                if ($('#' + ed.id + '_ifr')) {
                    $('#' + ed.id + '_ifr').attr('tabindex', '5');
                }
                // add handler for focus/blur
                $(ed.getWin())
                    .on('focus', function () {
                        $('#' + ed.id + '_tbl').addClass('focused');
                        ed.getBody().focus();
                    })
                    .on('blur', function () {
                        $('#' + ed.id + '_tbl').removeClass('focused');
                    });
                // done!

                //suppress firefox dnd inline image support
                var iframe = textarea.parent().find('iframe'),
                    html = $(iframe[0].contentDocument).find('html'),
                    smallPara = settings.get('features/mailComposeSmallParagraphs', 1);

                //UGLY: work around issue with scrolling not working after switching
                //to another app and back to editor in chrome
                iframe.on('mousewheel', function () { return true; });

                // small paragraphs option
                if (_.isBoolean(smallPara)) smallPara = smallPara ? 0.5 : 1;
                smallPara = parseFloat(smallPara);
                if (smallPara >= 0 && smallPara <= 1) {
                    html.find('head').append('<style type="text/css">body>p{margin:' + smallPara + 'em 0;}</style>');
                }

                html.on('dragover drop', function (e) {
                    if (_.browser.Firefox && _(e.originalEvent.dataTransfer.types).contains('application/x-moz-file'))
                        e.preventDefault();
                });

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

            paste_data_images: true,

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

        var resizeEditor = function () {
            if (textarea === null) return;
            var p = textarea.parent(),
                h = p.height(),
                toolbar = p.find('.mce-toolbar-grp').outerHeight(),
                iframeHeight = h - toolbar - 2;

            p.find('.mce-tinymce.mce-container.mce-panel').css({ height: iframeHeight });
            p.find('iframe').css('height', iframeHeight);

            return;
        },

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
            return textarea.tinymce ? textarea.tinymce() : {};
        };

        this.handleShow = function () {
            textarea.parents('.window-content').find('.editor-print-margin').hide();
            textarea.prop('disabled', false).idle();
            textarea.parents('.window-content').find('.mce-tinymce').show();
            textarea.hide();
            setTimeout(function () { resizeEditor(); }, 150);//wait a bit or some browsers have problems calculating the correct toolbar height (see Bug 34607)
            $(window).on('resize.tinymce', _.debounce(resizeEditor, 50));
        };

        this.handleHide = function () {
            $(window).off('resize.tinymce');
        };

        this.getContainer = function () {
            return $('iframe', ed.getContentAreaContainer());
        };

        this.destroy = function () {
            this.handleHide();
            if (ed) {
                // fix IE9/10 focus bug (see bug 29616); similar: http://bugs.jqueryui.com/ticket/9122
                this.getContainer().attr('src', 'blank.html');
                $(ed.getWin()).off('focus blur');
            }
            if (textarea.tinymce()) {
                textarea.tinymce().remove();
            }
            textarea = textarea.tinymce = def = ed = null;
        };
    }

    // $.getScript adds cache busting query
    return $.ajax({ url: ox.base + '/apps/3rd.party/tinymce/jquery.tinymce.min.js', cache: true, dataType: 'script' }).then(function () {
        // publish editor class
        return Editor;
    });
});
