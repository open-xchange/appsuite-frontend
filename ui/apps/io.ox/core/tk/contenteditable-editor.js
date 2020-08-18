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

/* global tinyMCE: true */

define('io.ox/core/tk/contenteditable-editor', [
    'io.ox/core/capabilities',
    'io.ox/core/extensions',
    'io.ox/core/tk/textproc',
    'io.ox/mail/api',
    'io.ox/mail/util',
    'static/3rd.party/purify.min.js',
    'settings!io.ox/core',
    'settings!io.ox/mail',
    'gettext!io.ox/core',
    // load content styles as text file otherwise they would not only be applied to the iframe but the whole UI
    'text!themes/default/io.ox/core/tk/contenteditable-editor-content.css',
    'less!io.ox/core/tk/contenteditable-editor'
], function (capabilities, ext, textproc, mailAPI, mailUtil, DOMPurify, settings, mailSettings, gt, contentCss) {

    'use strict';

    // some gt-calls for translations inside the custom plugins for tinymce
    gt('Drop inline images here');
    gt('Please only drop images here. If you want to send other files, you can send them as attachments.');

    var POINT = 'io.ox/core/tk/contenteditable-editor';

    var INDEX = 0;

    ext.point(POINT + '/setup').extend({
        id: 'default',
        index: INDEX += 100,
        draw: function (ed) {
            ed.on('keydown', function (e) {
                // pressed enter?
                if (!e.shiftKey && e.which === 13) splitContent(ed, e);
                if ((e.which === 13 && !e.shiftKey) || e.which === 40) setTimeout(throttledScrollOnEnter, 0, ed);
                if (e.which === 38 || e.which === 8) setTimeout(throttledScrollOnCursorUp, 0, ed);
            });
        }
    });

    ext.point(POINT + '/setup').extend({
        id: 'list-style-position',
        index: INDEX += 100,
        draw: function (ed) {
            ed.on('NodeChange', function (e) {
                if (e.element.nodeName !== 'LI') return;
                if (e.element.style.textAlign === 'left' || e.element.style.textAlign === '') return;
                $(e.element).css('list-style-position', 'inside');
            });
        }
    });

    ext.point(POINT + '/setup').extend({
        id: 'sanitize',
        index: INDEX += 100,
        draw: function (ed) {
            var sanitizeAttributes = function (e) {
                if (!e.content) return;
                // aways cast to String (See Bug 66936) - since this is handed over to tinyMCE
                // we have no choice but making this a String
                e.content = DOMPurify.sanitize(e.content) + '';
            };
            // see bug 48231 and 50849
            ed.on('PastePreProcess', sanitizeAttributes);
        }
    });

    ext.point(POINT + '/setup').extend({
        id: 'retrigger-change',
        index: INDEX += 100,
        draw: function (ed) {
            ed.on('keyup input SetContent Change', _.throttle(this.trigger.bind(this, 'change'), 50));
        }
    });

    // see Bug 67872
    // fixes ios iframe focus bug
    ext.point(POINT + '/setup').extend({
        id: 'ios-focus',
        index: INDEX += 100,
        draw: function (ed) {
            if (_.device('!tablet && ios >= 13')) return;
            ed.on('touchstart', function () {
                if (!$(document.activeElement).is('iframe')) $(document.activeElement).blur();
            });
        }
    });

    /*
    // disabled for 7.10.1, will be removed with 7.10.2
    ext.point(POINT + '/options').extend({
        id: 'mention',
        index: INDEX += 100,
        config: function (context) {

            var enabled = mailSettings.get('features/mentions', false);

            if (!enabled) return;

            this.plugins = this.plugins + ' oxmention';

            var model = context.view.model,
                cachedResponse;

            var template = _.template('<li class="list-item selectable" aria-selected="false" role="option" tabindex="-1" data-cid="<%- item.cid %>">' +
                '  <div class="list-item-content">' +
                '    <% if (item.list) { %>' +
                '      <div class="contact-picture distribution-list" aria-hidden="true"><i class="fa fa-align-justify" aria-hidden="true"></i></div>' +
                '    <% } else if (item.label) { %>' +
                '      <div class="contact-picture label" aria-hidden="true"><i class="fa fa-users" aria-hidden="true"></i></div>' +
                '    <% } else if (item.image) { %>' +
                '      <div class="contact-picture image" data-original="<%= item.image %>" style="background-image: url(<%= item.image %>)" aria-hidden="true"></div>' +
                '    <% } else { %>' +
                '      <div class="contact-picture initials <%= item.initial_color %>" aria-hidden="true"><%- item.initials %></div>' +
                '    <% } %>' +
                '    <div class="name">' +
                '       <%= item.full_name_html || item.email || "\u00A0" %>' +
                '       <% if (item.department) { %><span class="gray">(<%- item.department %>)</span><% } %>' +
                '    </div>' +
                '    <div class="email gray"><%- item.caption || "\u00A0" %></div>' +
                '  </div>' +
                '</li>');

            //https://github.com/StevenDevooght/tinyMCE-mention#configuration
            this.mentions = {

                items: settings.get('mentions/limit', 5),

                source: function (query, process) {
                    require(['io.ox/contacts/addressbook/popup', 'less!io.ox/contacts/addressbook/style'], function (addressbook) {
                        $.when().then(function () {
                            return cachedResponse || addressbook.getAllMailAddresses({ useGABOnly: false, lists: false });
                        }).then(function (response) {
                            cachedResponse = response;
                            process(addressbook.search(query, response.index, response.hash));
                        });
                    });
                },
                renderDropdown: function () {
                    // classes 'focus-indicator has-focus visible-selection' used to apply listview styles
                    return '<ul class="mentions-autocomplete dropdown-menu focus-indicator has-focus visible-selection" style="display:none"></ul>';
                },
                render: function (item) {
                    return template({ item: item });
                },
                insert: function (item) {
                    var list = model.get('to') || [],
                        name = item.mail_full_name, mail = item.mail || item.email;
                    model.set('to', list.concat([[name || null, mail || null]]));
                    return '<span>@' + item.mail_full_name + '&nbsp;</span>';
                },

                // matching/sorting done withing addressbook component
                matcher: _.constant(true),
                sorter: _.identity
            };

            require(['io.ox/contacts/api'], function (api) {
                api.on('create update delete', function () {
                    cachedResponse = null;
                });
            });
        }
    });
    */

    function splitContent_W3C(ed) {
        // get current range
        var range = ed.contentWindow.getSelection().getRangeAt(0);
        // range collapsed?
        if (!range.collapsed) {
            // delete selected content now
            ed.execCommand('Delete', false, null);
            // reselect new range
            range = ed.contentWindow.getSelection().getRangeAt(0);
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
            } catch (e) {
                if (ox.debug) console.error(e);
            }
            // climb up
            container = p;
        }
        // last BR?
        if (lastBR) {
            try {
                lastBR.parentNode.removeChild(lastBR);
            } catch (e) {
                if (ox.debug) console.error(e);
            }
        }
        // create new elements
        var newNode = mailUtil.getDefaultStyle().node.get(0);
        range.insertNode(newNode);
        range.setStart(newNode, 0);
        range.setEnd(newNode, 0);
        ed.contentWindow.getSelection().empty();
        ed.contentWindow.getSelection().addRange(range);
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
        var range = ed.contentWindow.getSelection().getRangeAt(0);
        // inside blockquote?
        if (!isInsideBlockquote(range)) return;
        if (!range.startContainer) return;
        splitContent_W3C(ed);
        ed.dom.events.cancel(e);
        //focus is lost after content has been split, at least starting with tinyMCE 4.6.6 (4.6.5 didn't)
        ed.focus();
    }

    function getCursorPosition(ed) {
        var scrollable = $(ed.container).closest('.scrollable'),
            selection = ed.contentWindow.getSelection(),
            range = selection.getRangeAt(0),
            // Safari behaves strange here and gives a boundingClientRect with 0 for all properties
            rect = _.device('safari') ? range.getClientRects()[0] : range.getBoundingClientRect(),
            top = rect ? rect.top : 0,
            composeFieldsHeight = scrollable.find('.mail-compose-fields').height(),
            footerHeight = scrollable.parents('.window-container-center').find('.window-footer').outerHeight(),
            marginBottom = scrollable.find('.contenteditable-editor').css('margin-bottom') || '0px',
            editorBottomMargin = parseInt(marginBottom.replace('px', ''), 10) || 0,
            bottom = scrollable.height() - footerHeight - editorBottomMargin * 2;

        // for empty lines we get no valid rect
        if (top === 0) {
            if (selection.modify) {
                // copy the selection prior to changing it
                var prevRange = selection.getRangeAt(0).cloneRange();
                selection.modify('extend', 'backward', 'character');
                range = selection.getRangeAt(0);
                rect = range.getBoundingClientRect();
                top = rect.top + rect.height;
                // restore selection to previous state
                selection.removeAllRanges();
                selection.addRange(prevRange);
            } else {
                var container = range.commonAncestorContainer;
                top = $(container).offset().top + container.clientHeight;
            }
        }
        var pos = top - scrollable.scrollTop() + composeFieldsHeight;

        return { pos: pos, top: top, bottom: bottom, scrollable: scrollable };
    }

    var duration = 300,
        easing = 'swing',
        throttledScrollOnCursorUp = _.throttle(scrollOnCursorUp, duration),
        throttledScrollOnEnter = _.throttle(scrollOnEnter, duration);

    // This is to keep the caret visible at all times, otherwise the fixed menubar may hide it.
    // See Bug #56677
    function scrollOnCursorUp(ed) {
        var cursorPosition = getCursorPosition(ed);

        // Scroll to cursor position (If you manually set this to something else, it doesn't feel native)
        if (cursorPosition.top > 0 && cursorPosition.pos < 0) cursorPosition.scrollable.animate({ scrollTop: cursorPosition.top }, duration, easing);
        // Scroll whole window to the top, if cursor reaches top of the editable area
        if (cursorPosition.top < 16) cursorPosition.scrollable.animate({ scrollTop: 0 }, duration, easing);
    }

    function scrollOnEnter(ed) {
        var cursorPosition = getCursorPosition(ed);

        if (cursorPosition.pos >= cursorPosition.bottom) {
            cursorPosition.scrollable.animate({ scrollTop: cursorPosition.top }, duration, easing);
        }
    }

    function lookupTinyMCELanguage() {
        var lookup_lang = ox.language,
            tinymce_langpacks = ['ar', 'ar_SA', 'az', 'be', 'bg_BG', 'bn_BD', 'bs', 'ca', 'cs', 'cy', 'da', 'de', 'de_AT', 'dv', 'el', 'en_CA', 'en_GB', 'es', 'et', 'eu', 'fa', 'fi', 'fo', 'fr_FR', 'gd', 'gl', 'he_IL', 'hr', 'hu_HU', 'hy', 'id', 'is_IS', 'it', 'ja', 'ka_GE', 'kk', 'km_KH', 'ko_KR', 'lb', 'lt', 'lv', 'ml', 'ml_IN', 'mn_MN', 'nb_NO', 'nl', 'pl', 'pt_BR', 'pt_PT', 'ro', 'ru', 'si_LK', 'sk', 'sl_SI', 'sr', 'sv_SE', 'ta', 'ta_IN', 'tg', 'th_TH', 'tr_TR', 'tt', 'ug', 'uk', 'uk_UA', 'vi', 'vi_VN', 'zh_CN', 'zh_TW'],
            tinymce_lang = _.indexOf(tinymce_langpacks, lookup_lang, true);

        // See bug 38381
        if (lookup_lang === 'fr_CA') return 'fr_FR';

        if (tinymce_lang > -1) {
            return tinymce_langpacks[tinymce_lang];
        }
        tinymce_lang = _.indexOf(tinymce_langpacks, lookup_lang.substr(0, 2), true);
        return (tinymce_lang > -1) ? tinymce_langpacks[tinymce_lang] : 'en';
    }

    function Editor(el, opt) {

        var $el, initialized = $.Deferred(), ed, self = this;
        var editor, editorId = el.data('editorId');
        var defaultStyle = mailUtil.getDefaultStyle();

        _.extend(this, Backbone.Events);

        el.append(
            $el = $('<div class="contenteditable-editor">').attr('data-editor-id', editorId).on('keydown', function (e) { if (e.which === 27) e.preventDefault(); }).append(
                editor = $('<div class="editable" tabindex="0" role="textbox" aria-multiline="true">')
                    .attr('aria-label', gt('Rich Text Area. Press ALT-F10 for toolbar'))
                    //.css('margin-bottom', '32px')
                    .toggleClass('simple-linebreaks', mailSettings.get('compose/simpleLineBreaks', false))
            )
        );

        opt = _.extend({
            toolbar1: '*undo *redo | bold italic underline | bullist numlist outdent indent',
            advanced: '*styleselect | *fontselect fontsizeselect | removeformat | link image *emoji | forecolor backcolor',
            toolbar2: '',
            toolbar3: '',
            plugins: 'autoresize autolink oximage oxpaste oxdrop link paste emoji lists code',
            theme: 'silver',
            imageLoader: null // is required to upload images. should have upload(file) and getUrl(response) methods
        }, opt);

        editor.addClass(opt.class);

        opt.toolbar1 += ' | ' + opt.advanced;

        // consider custom configurations
        opt.toolbar1 = settings.get('tinyMCE/theme_advanced_buttons1', opt.toolbar1);
        opt.toolbar2 = settings.get('tinyMCE/theme_advanced_buttons2', opt.toolbar2);
        opt.toolbar3 = settings.get('tinyMCE/theme_advanced_buttons3', opt.toolbar3);

        // remove unsupported stuff
        if (!capabilities.has('emoji')) {
            opt.toolbar1 = opt.toolbar1.replace(/( \| )?\*?emoji( \| )?/g, ' | ');
            opt.toolbar2 = opt.toolbar2.replace(/( \| )?\*?emoji( \| )?/g, ' | ');
            opt.toolbar3 = opt.toolbar3.replace(/( \| )?\*?emoji( \| )?/g, ' | ');
            opt.plugins = opt.plugins.replace(/emoji/g, '').trim();
        }

        // store a copy of original toolbar to adjust toolbar in DOM later
        var originalToolbarConfig = opt.toolbar1.replace(/\s*\|\s*/g, ' ');
        opt.toolbar1 = opt.toolbar1.replace(/\*/g, '');

        var fixed_toolbar = '.contenteditable-editor[data-editor-id="' + editorId + '"] .tox-editor-header';

        var options = {
            script_url: (window.cordova ? ox.localFileRoot : ox.base) + '/apps/3rd.party/tinymce/tinymce.min.js',

            extended_valid_elements: 'blockquote[type]',
            invalid_elements: 'object,iframe,script,embed',

            height: opt.height,
            autoresize_bottom_margin: 0,
            menubar: false,
            statusbar: false,

            toolbar_location: 'bottom',

            skin: opt.skin,

            body_class: 'ox-mce',
            content_style: contentCss,

            toolbar1: opt.toolbar1,
            toolbar2: opt.toolbar2,
            toolbar3: opt.toolbar3,

            relative_urls: false,
            remove_script_host: false,

            entity_encoding: 'raw',

            font_formats: mailUtil.getFontFormats(),
            fontsize_formats: '8pt 10pt 11pt 12pt 13pt 14pt 16pt 18pt 24pt 36pt',

            forced_root_block: 'div',
            forced_root_block_attrs: { 'style': defaultStyle.string, 'class': 'default-style' },

            browser_spellcheck: true,

            // touch devices: support is limited to 'lists', 'autolink', 'autosave'
            plugins: opt.plugins,

            // link plugin settings
            link_title: false,
            target_list: false,
            link_assume_external_targets: true,

            language: lookupTinyMCELanguage(),

            // disable the auto generation of hidden input fields (we don't need them)
            hidden_input: false,

            theme: opt.theme,
            mobile: {
                theme: 'silver',
                toolbar1: false
            },

            init_instance_callback: function (editor) {
                ed = editor;
                initialized.resolve();
            },

            execcommand_callback: function (editor_id, elm, command) {
                if (command === 'createlink') {
                    _.defer(function () {
                        $(tinyMCE.get(editor_id).getBody()).find('a').attr({
                            target: '_blank',
                            rel: 'noopener'
                        });
                    });
                }
            },
            // post processing (string-based)
            paste_preprocess: textproc.paste_preprocess,
            // post processing (DOM-based)
            paste_postprocess: textproc.paste_postprocess,

            setup: function (ed) {
                if (opt.oxContext) ed.oxContext = opt.oxContext;
                ext.point(POINT + '/setup').invoke('draw', self, ed);
                ed.on('init', function () {
                    // marker class to fix scroll behavior
                    if (this.oxContext && this.oxContext.signature) {
                        $(this.contentDocument.getElementsByTagName('html')[0]).addClass('signature-editor');
                    }

                    // adjust toolbar
                    var widgets = $(fixed_toolbar).find('.tox-tbtn');
                    originalToolbarConfig.split(' ').forEach(function (id, index) {
                        widgets.eq(index).attr('data-name', id);
                        if (/^\*/.test(id)) widgets.eq(index).attr('data-hidden', 'xs');
                    });

                    ed.on('SetContent', function (o) {
                        if (!o.paste) return;
                        setTimeout(throttledScrollOnEnter, 0, ed);
                    });

                });
            },

            oxImageLoader: opt.imageLoader
        };

        ext.point(POINT + '/options').invoke('config', options, opt.oxContext);

        require(['3rd.party/tinymce/jquery.tinymce.min']).then(function () {
            editor.tinymce(options);
        });

        function trimEnd(str) {
            return String(str || '').replace(/[\s\xA0]+$/g, '');
        }

        var stripDataAttributes = function (content) {
            return content.replace(/<[a-z][^>]*\sdata-mce.*?>/gi, function (match) {
                // replace all data-mce-* attributes which are written with single or double quotes
                return match.replace(/\sdata-mce-\S+=("[^"]*"|'[^']*')/g, '');
            });
        };

        function resizeEditor() {

            if (el === null) return;

            // This is needed for keyboard to work in small windows with buttons that are hidden
            var buttons = el.find('.tox-tbtn').filter('[data-hidden="xs"]');
            buttons.filter(':hidden').attr({ role: 'presentation', 'aria-hidden': true });
            buttons.filter(':visible').removeAttr('aria-hidden').attr('role', 'button');

            var h = 0,
                top = 0,
                iframe = el.find('iframe'),
                iframeContents = iframe.contents().height(),
                container = el.closest('.window-container'),
                header = container.find('.window-header:visible').outerHeight() || 0,
                footer = container.find('.window-footer:visible').outerHeight() || 0,
                padding = 0;

            if (_.device('smartphone')) {
                h = $(window).height();
                top = el.offset().top;
            } else {
                h = el.closest('.window-content').height();
                top = el.parent().find('.mail-compose-fields').outerHeight();
                padding = 8;
            }

            var availableHeight = h - top - header - footer - padding;

            if (_.device('smartphone') && (iframeContents > availableHeight)) {
                availableHeight = iframeContents;
            }

            editor.css('min-height', availableHeight + 'px');
            el.find('.tox.tox-tinymce.tox-tinymce--toolbar-bottom').css('min-height', availableHeight + 'px');
            iframe.css('min-height', availableHeight + 'px');
            if (opt.css) editor.css(opt.css);
        }

        var resizeEditorDebounced = _.debounce(resizeEditor, 30),

            set = function (str) {

                ed.setContent(str);

                // Remove all position: absolute and white-space: nowrap inline styles
                // This is a fix for the infamous EUROPCAR mail bugs
                // Don't change this if you don't know what you are doing
                if (/position:(\s+)?absolute/i.test(str)) {
                    $(ed.getBody()).find('[style*=absolute]').css('position', 'static');
                }
                if (/white-space:(\s+)?nowrap/i.test(str)) {
                    $(ed.getBody()).find('[style*=nowrap]').css('white-space', 'normal');
                }

            },

            clear = function () {
                set('');
            },

            ln2br = function (str) {
                return String(str || '').replace(/\r/g, '')
                    // '\n' is for IE; do not add for signatures
                    .replace(new RegExp('\\n', 'g'), str.indexOf('io-ox-signature') > -1 ? '\n' : '<br>');
            },

            // get editor content
            // trim white-space and clean up pseudo XHTML
            // remove empty paragraphs at the end
            get = function (options) {
                options = options || {};
                // remove tinyMCE resizeHandles
                $(ed.getBody()).find('.mce-resizehandle').remove();

                // get content, do not use { format: 'raw' } here or we get tons of <br data-mce-bogus=\"1\"> elements in firefox and create unwanted newlines
                var content = ed.getContent({ format: options.format || 'raw' });
                // strip data attributes (incl. bogus attribute)
                content = stripDataAttributes(content);
                // clean up
                content = content
                    .replace(/<(\w+)[ ]?\/>/g, '<$1>')
                    .replace(/(<div (([^>]*))?>(<br>)?<\/div>)+$/, '');

                // remove trailing white-space, line-breaks, and empty paragraphs
                content = content.replace(
                    /(\s|&nbsp;|\0x20|<br\/?>|<div( class="io-ox-signature")>(&nbsp;|\s|<br\/?>)*<\/div>)*$/g, ''
                );

                // remove trailing white-space
                return trimEnd(content);
            };

        // special handling for alternative mode, send HTML to backend and it will create text/plain part of the mail automagically
        this.content_type = opt.config && opt.config.get('preferredEditorMode') === 'alternative' ? 'ALTERNATIVE' : 'text/html';

        // publish internal 'done'
        this.done = function (fn) {
            return $.when(initialized).then(function () {
                fn(this);
                return this;
            }.bind(this));
        };

        this.focus = function () {
            if (_.device('ios')) return;
            _.defer(function () {
                if (!ed) return;
                ed.focus();
                ed.execCommand('mceFocus', false, editorId);
            });
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
            if (_.isUndefined(str)) return;
            require(['io.ox/mail/detail/content'], function (proc) {
                set(proc.text2html(str));
                ed.undoManager.clear();
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
            str = (/^<div/i).test(str) ? str : '<div>' + ln2br(str) + '</div>';
            content = content.replace(/^(<div><br><\/div>){2,}/, '').replace(/(<div><br><\/div>)+$/, '') + '<div><br></div>' + str;
            if (/^<blockquote/.test(content)) {
                content = '<div><br></div>' + content;
            }
            this.setContent(content);
        };

        this.prependContent = function (str) {
            var content = this.getContent();
            str = (/^<div/i).test(str) ? str : '<div>' + ln2br(str) + '</div>';
            content = str + '<div><br></div>' + content.replace(/^(<div><br><\/div>)+/, '').replace(/(<div><br><\/div>){2,}$/, '');
            content = '<div><br></div>' + content;
            this.setContent(content);
        };

        this.setContentParts = function (data, type) {
            var content = '';
            // normalise
            data = _.isString(data) ? { content: data } : data;
            data.content = data.content.replace(/^(<div><br><\/div>)+/, '').replace(/(<div><br><\/div>){2,}$/, '');
            // concat content parts
            if (data.content) content += data.content;
            else content += '<div class="default-style" style="' + defaultStyle.string + '"><br></div>';
            if (type === 'above' && data.cite) content += data.cite;
            if (data.quote) {
                // backend appends &nbsp; to the quote which are wrapped in a paragraph by the ui. remove those.
                data.quote = data.quote.replace(/<div><br>(&nbsp;|&#160;)<\/div>/, '');
                content += (data.quote || '');
            }
            if (type === 'below' && data.cite) {
                // add a blank line between the quoted text and the signature below
                // but only, if the sigature is directly after the quoted text
                // then, the user can always insert text between the quoted text and the signature but has no unnecessary empty lines
                if (!/<div><br><\/div>$/i.test(content) && /<\/blockquote>$/.test(content)) content += '<div class="default-style" style="' + defaultStyle.string + '"><br></div>';
                content += data.cite;
            }
            this.setContent(content);
        };

        // hint: does not detects the cite block
        this.getContentParts = function () {
            var content = this.getContent(),
                isForwardUnquoted = opt.view.model.get('mode') === 'forward' && mailSettings.get('forwardunquoted', false),
                index = content.indexOf(isForwardUnquoted ? '----' : '<blockquote type="cite">');
            // special case: initially replied/forwarded text mail
            if (content.substring(0, 15) === '<blockquote type="cite"><div>') index = 0;
            // special case: switching between signatures in such a mail
            if (content.substring(0, 23) === '<div><br></div><blockquote type="cite">') index = 0;
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
            str = (/^<div/i).test(str) ? str : '<div>' + ln2br(str) + '</div>';
            // add cite
            data.cite = str;
            this.setContentParts(data, 'above');
        };

        this.insertPostCite = function (str) {
            var data = this.getContentParts();
            str = (/^<div/i).test(str) ? str : '<div>' + ln2br(str) + '</div>';
            // add cite
            data.cite = str;
            this.setContentParts(data, 'below');
        };

        this.replaceParagraph = function (str, rep) {
            var content = this.getContent(), pos, top;
            str = (/^<div/i).test(str) ? str : '<div>' + ln2br(str) + '</div>';
            // exists?
            if ((pos = content.indexOf(str)) > -1) {
                // replace content
                top = this.scrollTop();
                this.setContent(content.substr(0, pos) + (rep || '') + content.substr(pos + str.length));
                this.scrollTop(top);
                return true;
            }
            return false;
        };

        this.removeContent = function (str) {
            this.replaceContent(str, '');
        };

        // allow jQuery access
        this.find = function (selector) {
            return $(ed.getBody()).find(selector);
        };

        this.children = function (selector) {
            return $(ed.getBody()).children(selector);
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

        this.getMode = function () { return 'html'; };

        // convenience access
        this.tinymce = function () { return editor.tinymce ? editor.tinymce() : {}; };

        this.show = function () {
            // tinymce hides toolbar on non-desktop devices (own detection)
            if (!window.tinyMCE.Env.desktop) this.trigger('device:non-desktop');
            $el.show();
            // set display to empty string because of overide 'display' property in css
            $(fixed_toolbar).css('display', '');
            window.toolbar = $(fixed_toolbar);
            $(window).on('resize.tinymce xorientationchange.tinymce changefloatingstyle.tinymce', resizeEditorDebounced);
            $(window).trigger('resize');
        };

        this.hide = function () {
            $el.hide();
            $(window).off('resize.tinymce xorientationchange.tinymce changefloatingstyle.tinymce', resizeEditorDebounced);
        };

        this.destroy = function () {
            this.hide();
            clearKeepalive();
            // have to unset active editor manually. may be removed for future versions of tinyMCE
            delete tinyMCE.EditorManager.activeEditor;
            tinyMCE.EditorManager.remove(ed);
            ed = opt = undefined;
        };

        var intervals = [];

        function addKeepalive(id) {
            var timeout = Math.round(settings.get('maxUploadIdleTimeout', 200000) * 0.9);
            intervals.push(setInterval(opt.keepalive || mailAPI.keepalive, timeout, id));
        }

        function clearKeepalive() {
            _(intervals).each(clearInterval);
        }

        editor.on('addInlineImage', function (e, id) { addKeepalive(id); });
    }

    return Editor;
});
