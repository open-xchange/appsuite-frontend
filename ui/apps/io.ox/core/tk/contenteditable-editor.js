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
     'io.ox/core/extensions',
     'io.ox/core/tk/textproc'
    ], function (emoji, capabilities, settings, ext, textproc) {

    'use strict';

    var POINT = 'io.ox/core/tk/contenteditable-editor';

    var INDEX = 0;

    ext.point(POINT + '/setup').extend({
        id: 'default',
        index: INDEX += 100,
        draw: function (ed) {
            ed.on('keydown', function (e) {
                // pressed enter?
                if ((e.keyCode || e.which) === 13) {
                    splitContent(ed, e);
                }
            });

            ext.point('3rd.party/emoji/editor_css').each(function (point) {
                var url = ed.convertURL(require.toUrl(point.css));
                ed.contentCSS.push(url);
            });
        }
    });

    ext.point(POINT + '/setup').extend({
        id: 'emoji',
        index: INDEX += 100,
        draw: function (ed) {
            ext.point('3rd.party/emoji/editor_css').each(function (point) {
                var url = ed.convertURL(require.toUrl(point.css));
                ed.contentCSS.push(url);
            });
        }
    });

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

    function isInsideBlockquote(range) {
        // get ancestor/parent container
        var container = range.commonAncestorContainer || range.parentElement();
        // loop for blockquote
        var bq = $(container).parents('blockquote').last(),
            is = bq.length > 0;
        //console.debug('inside?', is, bq);
        return is;
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

    function Editor(el, opt) {

        var rendered = $.Deferred(), initialized = $.Deferred(), ed;

        opt = _.extend({
            toolbar1: 'undo redo | bold italic | emoji | bullist numlist outdent indent',
            advanced: 'styleselect fontselect fontsizeselect | forecolor backcolor | link image',
            toolbar2: '',
            toolbar3: ''
        }, opt);

        opt.toolbar1 += ' | ' + opt.advanced;

        // consider custom configurations
        opt.toolbar1 = settings.get('tinyMCE/theme_advanced_buttons1', opt.toolbar1);
        opt.toolbar2 = settings.get('tinyMCE/theme_advanced_buttons2', opt.toolbar2);
        opt.toolbar3 = settings.get('tinyMCE/theme_advanced_buttons3', opt.toolbar3);

        // remove unsupported stuff
        if (!capabilities.has('emoji')) {
            opt.toolbar1 = opt.toolbar1.replace(/( \| )?emoji( \| )?/g, ' | ');
            opt.toolbar2 = opt.toolbar2.replace(/( \| )?emoji( \| )?/g, ' | ');
            opt.toolbar3 = opt.toolbar3.replace(/( \| )?emoji( \| )?/g, ' | ');
        }

        var fixed_toolbar = '[data-editor-id="' + el.attr('data-editor-id') + '"].editable-toolbar';

        var options = {
            script_url: ox.base + '/apps/3rd.party/tinymce/tinymce.min.js',

            extended_valid_elements: 'blockquote[type]',

            // CSS for Editor content (See /apps/io.ox/core/tk/html-editor.less)
            // content_css: ox.base + '/apps/themes/' + require('settings!io.ox/core').get('theme') + '/io.ox/core/tk/html-editor.css',

            inline: true,

            fixed_toolbar_container: fixed_toolbar,

            menubar: false,
            statusbar: false,

            skin: 'ox',

            toolbar1: opt.toolbar1,
            toolbar2: opt.toolbar2,
            toolbar3: opt.toolbar3,

            relative_urls: false,
            remove_script_host: false,

            entity_encoding: 'raw',

            browser_spellcheck: true,

            plugins: 'autolink oximage link paste textcolor emoji',

            //link plugin settings
            link_title: false,
            target_list: false,

            language: lookupTinyMCELanguage(),

            // disable the auto generation of hidden input fields (we don't need them)
            hidden_input: false,

            theme: 'unobtanium',

            // TODO: still needed?
            // need this to work in karma/phantomjs
            //content_element: textarea.get(0),

            init_instance_callback: function (editor) {
                ed = editor;
                initialized.resolve();
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

            setup: function (ed) {
                if (opt.oxContext) ed.oxContext = opt.oxContext;
                ext.point(POINT + '/setup').invoke('draw', this, ed);
                ed.on('BeforeRenderUI', function () {
                    rendered.resolve();
                });
            }
        };

        el = $(el);

        ext.point(POINT + '/options').invoke('config', options, opt.oxContext);

        el.tinymce(options);

        function trimEnd(str) {
            return String(str || '').replace(/[\s\xA0]+$/g, '');
        }

        var resizeEditor = _.debounce(function () {
            if (el === null) return;

            var h = $(window).height(),
                top = el.offset().top;

            el.css('min-height', h - top - 40 + 'px');
            if (opt.css) el.css(opt.css);

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

            // remove trailing white-space, line-breaks, and empty paragraphs
            content = content.replace(
                /(\s|&nbsp;|\0x20|<br\/?>|<p( class="io-ox-signature")>(&nbsp;|\s|<br\/?>)*<\/p>)*$/g, ''
            );

            // remove trailing white-space
            return trimEnd(content);
        };

        // publish internal 'done'
        this.done = function (fn) {
            return $.when(initialized, rendered).done(fn);
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

        this.setContentParts = function (data, type) {
            var content = '';
            // normalise
            data = _.isString(data) ? { content: data } : data;
            // concat content parts
            if (data.content) content += data.content;
            if (type === 'above' && data.cite) content += ('\n\n' + data.cite);
            if (data.quote) content += ('\n\n' + data.quote || '');
            if (type === 'below' && data.cite) content += ('\n\n' + data.cite);
            this.setContent(content);
        };

        // hint: does not detects the cite block
        this.getContentParts = function () {
            var content = this.getContent(),
                index = content.indexOf('<blockquote type="cite">');
            if (index < 0) return { content: content };
            return {
                // content without trailing whitespace
                content: content.substring(0, index).replace(/\s+$/g, ''),
                quote: content.substring(index),
                cite: undefined
            };
        };

        this.insertPrevCite = function (str) {
            var data = this.getContentParts();
            str = (/^<p/i).test(str) ? str : '<p>' + ln2br(str) + '</p>';
            // add cite
            data.cite = str;
            this.setContentParts(data, 'above');
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
                //empty node before removing because tiny saves the contents before.
                //this might cause server errors if there were inline images (those only exist temporarily and are already removed)
                el.empty();
                el.tinymce().remove();
            }
            el = el.tinymce = initialized = rendered = ed = null;
        };
    }

    // $.getScript adds cache busting query
    return $.ajax({ url: ox.base + '/apps/3rd.party/tinymce/jquery.tinymce.min.js', cache: true, dataType: 'script' }).then(function () {
        // publish editor class
        return Editor;
    });
});
