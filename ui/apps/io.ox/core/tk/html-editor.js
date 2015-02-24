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

define('io.ox/core/tk/html-editor',
    ['io.ox/core/emoji/util',
     'io.ox/core/capabilities',
     'settings!io.ox/core',
     'io.ox/core/extensions',
     'io.ox/core/tk/textproc',
     '3rd.party/tinymce/jquery.tinymce.min'
    ], function (emoji, capabilities, settings, ext, textproc) {

    'use strict';

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

        function isInsideBlockquote(range) {
            // get ancestor/parent container
            var container = range.commonAncestorContainer || range.parentElement();
            // loop for blockquote
            var bq = $(container).parents('blockquote').last(),
                is = bq.length > 0;
            //console.debug('inside?', is, bq);
            return is;
        }

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
            self = this;

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

            // TODO: needed for emoji ?
            /*
            object_resizing: 0,
            */

            // TODO: still needed?
            // need this to work in karma/phantomjs
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

                ox.trigger('editor:ready', { editor: self, tinymce: ed });

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
            paste_preprocess: textproc.paste_preprocess,
            // post processing (DOM-based)
            paste_postprocess: textproc.paste_postprocess,

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
                // '\n' is for IE
                .replace(new RegExp('\\n', 'g'), '<br>');
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
           return textproc.htmltotext($(ed.getBody()).html());
        };

        this.setContent = set;

        this.setPlainText = function (str) {
            // clean up
            str = trimEnd(str);
            if (!str) return;
            return textproc.texttohtml(str).done(function (content) {
                if (/^<blockquote\>/.test(content)) {
                    content = '<p></p>' + content;
                }
                set(content);
            });
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
            textarea.prop('disabled', false).idle();
            textarea.parents('.window-content').find('.mce-tinymce').show();
            textarea.hide();
            //wait a bit or some browsers have problems calculating the correct toolbar height (see Bug 34607)
            setTimeout(function () { resizeEditor(); }, 150);
            $(window).on('resize.tinymce', _.debounce(resizeEditor, 50));
        };

        this.handleHide = function () {
            $(window).off('resize.tinymce');
        };

        this.getContainer = function () {
            return $('iframe', ed.getContentAreaContainer());
        };

        var gc = {

            items: [],

            collect: function (obj) {
                if (!_.isObject(obj)) return;
                if (obj._elmCache) this.items.push(obj);
                if (obj._items) obj._items.each(this.collect.bind(this));
            },

            run: function () {
                _(this.items).each(function (item) {
                    // clear internal _elmCache manually to avoid leaks
                    item._elmCache = {};
                });
                this.items = [];
            }
        };

        this.destroy = function () {
            this.handleHide();
            if (ed) {
                // fix IE9/10 focus bug (see bug 29616); similar: http://bugs.jqueryui.com/ticket/9122
                this.getContainer().attr('src', 'blank.html');
                $(ed.getWin()).off('focus blur');
            }
            if (ed && ed.theme && ed.theme.panel) {
                // we need to collect all items first
                // some items are removed by TinyMCE's internal "remove" function
                // some items are added, however
                gc.collect(ed.theme.panel);
            }
            if (textarea.tinymce()) {
                textarea.tinymce().remove();
            }
            gc.run();
            textarea = textarea.tinymce = def = ed = null;
        };
    }

    return Editor;
});
