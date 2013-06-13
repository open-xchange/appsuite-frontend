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
 */

define.async('io.ox/core/tk/html-editor',
    ['moxiecode/tiny_mce/plugins/emoji/main',
     'settings!io.ox/core'
     ], function (emoji, settings) {

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

    function paste_preprocess(pl, o) {
        //console.debug('pre', o.content);
        o.content = o.content
            // remove comments
            .replace(/<!--(.*?)-->/g, '')
            // remove custom attributes
            .replace(/ data-[^=]+="[^"]*"/g, '')
            // remove &nbsp;
            .replace(/&nbsp;/ig, ' ')
            // fix missing white-space before/after links
            .replace(/([^>\s])<a/ig, '$1 <a')
            .replace(/<\/\s?a>([^<\s,\.:;])/ig, '</a> $1')
            // beautify simple quotes
            .replace(/([^=])"([\w\- ]+)"/g, '$1\u201C$2\u201D')
            // beautify dashes
            .replace(/(\w\s)-(\s\w)/g, '$1\u2013$2');
        o.content = emoji.unifiedToImageTag(o.content);
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
                match = (self.text() + '').match(/^\[(\d+)\]$/);
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
            .find(':not(img.emoji)').remove();
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
            ed.execCommand("Delete", false, null);
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
                } else if (node.nodeName === "BR") {
                    // remember node
                    lastBR = node;
                }
            }
        };
        while (container && container.nodeName !== "BODY") {
            // set range to end of container
            range.setEndAfter(container);
            // get parent node
            var p = container.parentNode;
            // add range content before next sibling (or at the end of the parent
            // node)
            var contents = range.extractContents();
            // BR fix (remove unwanted newline)
            traverse(contents.firstChild);
            // now insert contents
            if ($(contents).text().length > 0) {
                // insert this content only if it includes something visible
                // Actually this allows to split a quote after the very last
                // character
                // without getting empty gray blocks below the split
                p.insertBefore(contents, container.nextSibling);
            }
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
        var dummySpan = ed.getDoc().createElement("span");
        dummySpan.innerHTML = "&nbsp;";
        var para = ed.getDoc().createElement("p");
        // and both elements to editor
        para.appendChild(dummySpan);
        range.insertNode(para);
        // select the span
        ed.selection.select(dummySpan);
        // and delete it
        ed.execCommand("Delete", false, null);
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
        tinymce_langpacks = ['ar', 'az', 'be', 'bg', 'bn', 'br', 'bs', 'ca', 'ch', 'cn', 'cs', 'cy', 'da', 'de', 'dv', 'el', 'en', 'eo', 'es', 'et', 'eu', 'fa', 'fi', 'fr', 'gl', 'gu', 'he', 'hi', 'hr', 'hu', 'hy', 'ia', 'id', 'is', 'it', 'ja', 'ka', 'kk', 'kl', 'km', 'ko', 'lb', 'lt', 'lv', 'mk', 'ml', 'mn', 'ms', 'my', 'nb', 'nl', 'nn', 'no', 'pl', 'ps', 'pt', 'ro', 'ru', 'sc', 'se', 'si', 'sk', 'sl', 'sq', 'sr', 'sv', 'sy', 'ta', 'te', 'th', 'tn', 'tr', 'tt', 'tw', 'uk', 'ur', 'vi', 'zh', 'zu'],

        tinymce_special = {
            zh_CN: "zh-cn",
            zh_TW: "zh-tw"
        };

        if (_.has(tinymce_special, lookup_lang)) {
            return tinymce_special[lookup_lang];
        }

        tinymce_lang = _.indexOf(tinymce_langpacks, lookup_lang.substr(0, 2), true);
        if (tinymce_lang > -1) {
            return tinymce_langpacks[tinymce_lang];
        } else {
            return 'en';
        }
    }

    function Editor(textarea) {

        var def = $.Deferred(), ed;

        var toolbarDefault = 'bold,italic,underline,strikethrough,|,' +
                'emoji,|,bullist,numlist,outdent,indent,|,' +
                'justifyleft,justifycenter,justifyright,|,' +
                'forecolor,backcolor,|,formatselect,|,' +
                'undo,redo,';

        (textarea = $(textarea)).tinymce({

            gecko_spellcheck: true,
            language: lookupTinyMCELanguage(),
            plugins: 'autolink,paste,emoji',
            relative_urls: false,
            remove_script_host: false,
            script_url: ox.base + '/apps/moxiecode/tiny_mce/tiny_mce.js',
            skin: 'ox',
            theme: 'advanced',

            init_instance_callback: function () {
                // get internal editor reference
                ed = textarea.tinymce();
                if ($('#' + ed.id + '_ifr')) {
                    $('#' + ed.id + '_ifr').attr('tabindex', '5');
                }
                // add handler for focus/blur
                $(ed.getWin())
                    .on('focus', function (e) {
                        $('#' + ed.id + '_tbl').addClass('focused');
                        ed.getBody().focus();
                    })
                    .on('blur', function (e) {
                        $('#' + ed.id + '_tbl').removeClass('focused');
                    });
                // done!
                def.resolve();
            },

            execcommand_callback: function (editor_id, elm, command) {
                if (command === 'createlink') {
                    _.defer(function () {
                        $(tinyMCE.get(editor_id).getBody()).find('a').attr('target', '_blank');
                    });
                }
            },

            theme_advanced_buttons1: settings.get('tinyMCE/theme_advanced_buttons1', toolbarDefault),
            theme_advanced_buttons2: settings.get('tinyMCE/theme_advanced_buttons2', ''),
            theme_advanced_buttons3: settings.get('tinyMCE/theme_advanced_buttons3', ''),
            theme_advanced_toolbar_location: settings.get('tinyMCE/theme_advanced_toolbar_location', 'top'),
            theme_advanced_toolbar_align: settings.get('tinyMCE/theme_advanced_toolbar_align', 'left'),

            // formats
            theme_advanced_blockformats: 'h1,h2,h3,h4,p,blockquote',

            // colors
            theme_advanced_more_colors: false,
            //theme_advanced_text_colors: '000000,555555,AAAAAA,0088CC,AA0000',
            //theme_advanced_background_colors: 'FFFFFF,FFFF00,00FFFF,00FF00,00FFFF,FFBE33',
            theme_advanced_default_foreground_color: '#000000',
            theme_advanced_default_background_color: '#FFFFFF',

            // for performance
            entity_encoding: 'raw',
            verify_html: false,

            // better paste
            paste_auto_cleanup_on_paste: true,
            paste_remove_styles: true,
            paste_remove_styles_if_webkit: true,
            paste_strip_class_attributes: 'all',
            paste_block_drop: false,

            // post processing (string-based)
            paste_preprocess: paste_preprocess,
            // post processing (DOM-based)
            paste_postprocess: paste_postprocess,

            setup: function (ed) {
                ed.onKeyDown.add(function (ed, e) {
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
            }
        });

        function trimEnd(str) {
            return String(str || '').replace(/[\s\xA0]+$/g, '');
        }

        var resizeEditor = _.debounce(function () {
                var p = textarea.parent(), w = p.width(), h = p.height(),
                    iframeHeight = h - p.find('td.mceToolbar').outerHeight() - 2;
                p.find('table.mceLayout').css({ width: w + 'px', height: h + 'px' });
                p.find('iframe').css('height', iframeHeight + 'px');
            }, 100),

            trimIn = function (str) {
                return trimEnd(str);
            },

            trimOut = function (str) {
                return trimEnd(str).replace(/[\r\n]+/g, '');
            },

            quote = function (str) {
                return '> ' + $.trim(str).replace(/\n/g, '\n> ');
            },

            set = function (str) {
                ed.setContent(emoji.unifiedToImageTag(str) + '');
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
                return trimOut(ed.getContent())
                    .replace(/<(\w+)[ ]?\/>/g, '<$1>')
                    .replace(/(<p>(<br>)?<\/p>)+$/, '');
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
                var text = '';
                // get text via selection
                ed.selection.select(this, true);
                text = ed.selection.getContent({ format: 'text' });
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
            str = trimIn(str);
            // needs leading empty paragraph?
            if (str.substr(0, 2) === '\n\n') {
                text += '<p></p>';
                str = str.substr(2);
            }
            // split & loop
            _(str.split('\n').concat('')).each(function (line, i) {
                var trimmed = $.trim(line);
                if (trimmed === '' || (quote && trimmed.substr(0, 1) !== '>')) {
                    lTag = quote ? '<blockquote><p>' : '<p>';
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

        this.setCaretPosition = function (pos) {
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

        this.removeBySelector = function (selector) {
            $(selector, ed.getDoc()).remove();
        };

        this.removeClassBySelector = function (selector, name) {
            $(selector, ed.getDoc()).removeClass(name);
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
            textarea.removeAttr('disabled').idle().next().show();
            textarea.hide();
            resizeEditor();
            $(window).on('resize', resizeEditor);
        };

        this.handleHide = function () {
            $(window).off('resize', resizeEditor);
        };

        this.destroy = function () {
            this.handleHide();
            if (ed) {
                $(ed.getWin()).off('focus blur');
            }
            if (textarea.tinymce()) {
                textarea.tinymce().remove();
            }
            textarea = textarea.tinymce = def = ed = null;
        };
    }

    return $.getScript(ox.base + '/apps/moxiecode/tiny_mce/jquery.tinymce.js')
        .pipe(function () {
            // publish editor class
            return Editor;
        });
});
