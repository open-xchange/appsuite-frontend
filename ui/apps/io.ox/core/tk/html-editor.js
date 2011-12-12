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

define.async('io.ox/core/tk/html-editor', [], function () {

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
    }

    // simplify DOM tree
    function simplify(memo, elem) {
        var self = $(elem),
            tagName = elem.tagName,
            children = self.children(),
            text;
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
            if (tagName === 'DIV' && !self.attr('class') && !self.attr('style')) {
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
        // images too - doesn't work with copy/paste
        node.find(
            'iframe, object, applet, input, textarea, button, select, ' +
            'canvas, script, noscript, audio, video, img'
            ).remove();
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

    function Editor(textarea) {

        var def = $.Deferred(), ed;

        (textarea = $(textarea)).tinymce({

            script_url: ox.base + '/apps/moxiecode/tiny_mce/tiny_mce.js',
            plugins: 'paste',
            theme: 'advanced',
            skin: 'ox',

            init_instance_callback: function () {
                // get internal editor reference
                ed = textarea.tinymce();
                // add handler for focus/blur
                $(ed.getWin())
                    .on('focus', function (e) {
                        $('#' + ed.id + '_tbl').addClass('focused');
                    })
                    .on('blur', function (e) {
                        $('#' + ed.id + '_tbl').removeClass('focused');
                    });
                // done!
                def.resolve();
            },

            theme_advanced_buttons1:
                'bold,italic,underline,|,' +
                'undo,redo,|,' +
                'bullist,numlist,indent,outdent,|,' +
                'justifyleft,justifycenter,justifyright,|,' +
                'forecolor,backcolor,|,formatselect',
            theme_advanced_buttons2: '',
            theme_advanced_buttons3: '',
            theme_advanced_toolbar_location: 'top',
            theme_advanced_toolbar_align: 'left',

            // formats
            theme_advanced_blockformats: 'h1,h2,h3,h4,p,blockquote',

            // colors
            theme_advanced_more_colors: false,
            theme_advanced_text_colors: '000000,555555,AAAAAA,0088CC,AA0000',
            theme_advanced_background_colors: 'FFFFFF,FFFF00,00FFFF,00FF00,00FFFF,FFBE33',
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
            paste_postprocess: paste_postprocess
        });

        var resizeEditor = _.debounce(function () {
                var p = textarea.parent(), w = p.width(), h = p.height(),
                    iframeHeight = h - p.find('td.mceToolbar').outerHeight() - 2;
                p.find('table.mceLayout').css({ width: w + 'px', height: h + 'px' });
                p.find('iframe').css('height', iframeHeight + 'px');
            }, 100),

            trim = function (str) {
                return $.trim((str + '').replace(/[\r\n]+/g, ''));
            },

            set = function (str) {
                ed.setContent(str + '');
            },

            clear = function () {
                set('');
            },

            ln2br = function (str) {
                return String(str || '').replace(/\r/g, '')
                    .replace('\n', '<br>'); // '\n' is for IE
            },

            // get editor content
            // trim white-space and clean up pseudo XHTML
            // remove empty paragraphs at the end
            get = function () {
                return trim(ed.getContent())
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

        this.clear = clear;

        this.getContent = get;

        this.getPlainText = function () {
            if (_.browser.IE) {
                // IE ignores paragraphs, so we help a bit
                $('p', ed.getBody()).append('<br>');
            }
            // return via selection
            ed.selection.select(ed.getBody(), true);
            return ed.selection.getContent({ format: 'text' });
        };

        this.setContent = set;

        this.setPlainText = function (str) {
            var text = '', tmp = '', lines = $.trim(str).split('\n').concat('');
            _(lines).each(function (line, i) {
                line = $.trim(line);
                if (line === '') {
                    text += tmp !== '' ? '<p>' + tmp.replace(/<br>$/, '') + '</p>' : '';
                    tmp = '';
                } else {
                    tmp += line + '<br>';
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

        this.appendContent = function (str) {
            var content = this.getContent();
            str = (/^<p/i).test(str) ? str : '<p>' + ln2br(str) + '</p>';
            this.setContent(content + str);
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
            this.setContent('');
            $(ed.getWin()).off('focus blur');
            textarea.tinymce().remove();
            textarea = textarea.tinymce = def = ed = null;
        };
    }

    return $.getScript(ox.base + '/apps/moxiecode/tiny_mce/jquery.tinymce.js')
        .pipe(function () {
            // publish editor class
            return Editor;
        });
});