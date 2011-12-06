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

/*globals tinyMCE */

define.async('io.ox/mail/write/main',
    ['io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/mail/write/textile',
     'io.ox/core/extensions',
     'io.ox/core/config',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'io.ox/core/i18n',
     'io.ox/core/api/user',
     'io.ox/core/tk/upload',
     'io.ox/core/tk/autocomplete',
     'css!io.ox/mail/style.css',
     'css!io.ox/mail/write/style.css'], function (mailAPI, mailUtil, textile, ext, config, contactsAPI, contactsUtil, i18n, userAPI, upload) {

    'use strict';

    // actions (define outside of multi-instance app)
    ext.point('io.ox/mail/write/actions/send').extend({
        id: 'send',
        action: function (app) {
            app.send();
        }
    });

    ext.point('io.ox/mail/write/actions/proofread').extend({
        id: 'proofread',
        action: function (app) {
            app.proofread();
        }
    });

    // links
//    ext.point('io.ox/mail/write/links/toolbar').extend(new ext.Link({
//        index: 200,
//        id: 'proofread',
//        label: 'Proofread',
//        ref: 'io.ox/mail/write/actions/proofread'
//    }));

    // default sender (used to set from address)
    var defaultSender,
        // editor mode
        editorMode = 'html';

    // multi instance pattern
    function createInstance() {

        var app, win,
            main, sidepanel,
            GRID_WIDTH = 330,
            form,
            subject,
            editor,
            editorPrintMargin,
            priorityOverlay,
            sections = {},
            currentSignature;

        app = ox.ui.createApp({
            title: 'Compose'
        });

        // helper

        function applyHighPriority(flag) {
            if (flag) {
                priorityOverlay.addClass('high');
            } else {
                priorityOverlay.removeClass('high');
            }
        }

        function togglePriority(e) {
            var high = form.find('input[name=priority][value=2]'),
                normal = form.find('input[name=priority][value=3]');
            if (high.prop('checked')) {
                high.prop('checked', false);
                normal.prop('checked', true);
                applyHighPriority(false);
            } else {
                high.prop('checked', true);
                normal.prop('checked', false);
                applyHighPriority(true);
            }
        }

        function serialize(obj) {
            return '"' + obj.display_name.replace(/"/g, '\"') + '" <' + obj.email + '>';
        }

        function hideSection(id) {
            sections[id + 'Label'].add(sections[id]).hide();
            $(this).trigger('hide');
            sections[id + 'Link'].show();
        }

        function fnHideSection(e) {
            var id = e.data.id;
            e.preventDefault();
            hideSection(id);
        }

        function focusSection(id) {
            sections[id].find('input[type!=hidden]').eq(0).focus();
        }

        function addSection(id, label, show, collapsable) {

            sections[id + 'Label'] = $('<div>')
                .addClass('label')
                .text(label + '')
                .prepend(
                    collapsable ?
                        $('<a>', { href: '#', tabindex: '7' })
                        .addClass('collapse').text('Hide')
                        .on('click', $.preventDefault) :
                        $()
                );

            if (collapsable) {
                sections[id + 'Label'].on('click', { id: id }, fnHideSection);
            } else {
                sections[id + 'Label'].css('cursor', 'default');
            }

            sidepanel
                .append(sections[id + 'Label'])
                .append(sections[id] = $('<div>').addClass('section'));
            if (show === false) {
                sections[id + 'Label'].hide();
                sections[id].hide();
            }
            return sections[id];
        }

        function showSection(id) {
            sections[id + 'Label'].show();
            sections[id].show().trigger('show');
            focusSection(id);
            sections[id + 'Link'].hide();
        }

        function fnShowSection(e) {
            var id = e.data.id;
            e.preventDefault();
            showSection(id);
        }

        function addLink(id, label) {
            return (sections[id + 'Link'] = $('<div>'))
                .addClass('section-link')
                .append(
                    $('<a>', { href: '#', tabindex: '5' })
                    .text(label + '')
                    .on('click', { id: id }, fnShowSection)
                )
                .appendTo(sidepanel);
        }

        var fnClickPerson = function (e) {
            e.preventDefault(e);
            ext.point('io.ox/core/person:action').each(function (ext) {
                _.call(ext.action, e.data, e);
            });
        };

        function drawAutoCompleteItem(node, data) {
            node.addClass('io-ox-mail-write-contact')
            .append(
                $('<div>').addClass('contact-image')
                .css({
                    backgroundImage: 'url(' + contactsUtil.getImage(data.contact) + ')'
                })
            )
            .append(
                $('<div>').addClass('person-link')
                .text(data.display_name + '\u00A0')
            )
            .append($('<div>').text(data.email));
        }

        // drawAutoCompleteItem and drawContact
        // are slightly different. it's easier just having two functions.

        function drawContact(id, node, data) {

            node.addClass('io-ox-mail-write-contact section-item')
            .append(
                contactsAPI.getPicture(data.email + '')
                .addClass('contact-image')
            )
            .append(
                $('<input>', { type: 'hidden', name: id, value: serialize(data) })
            )
            .append(
                $('<a>', { href: '#' }).addClass('person-link')
                .text(data.display_name + '\u00A0')
                .on('click', {
                    display_name: data.display_name,
                    email1: data.email
                }, fnClickPerson)
            )
            .append($('<div>').text(data.email))
            .append(
                // remove
                $('<a>', { href: '#', tabindex: '6' })
                .addClass('remove')
                .append(
                    $('<div>').addClass('icon').text('x')
                )
                .on('click', { id: id }, function (e) {
                    e.preventDefault();
                    var list = $(this).parents().find('.recipient-list');
                    $(this).parent().remove();
                    // hide section if empty
                    if (list.children().length === 0) {
                        list.hide();
                    }
                })
            );
        }

        function createRecipientList(id) {
            return (sections[id + 'List'] = $('<div>'))
                .addClass('recipient-list').hide();
        }

        function addRecipients(id, list) {
            // loop over list and draw recipient
            _(list).each(function (recipient) {
                var node = $('<div>');
                drawContact(id, node, {
                    display_name: recipient[0],
                    email: recipient[1],
                    contact: {}
                });
                // add to proper section (to, CC, ...)
                sections[id + 'List'].append(node);
            });
            if (list && list.length) {
                sections[id + 'List'].show().trigger('show');
            }
        }

        function copyRecipients(id, node) {
            var list = mailUtil.parseRecipients(node.val());
            if (list.length) {
                addRecipients(id, list);
                node.val('');
            } else if ($.trim(node.val()) !== '') {
                node.attr('disabled', 'disabled')
                    .css({ border: '1px solid #a00', backgroundColor: '#fee' })
                    .shake()
                    .done(function () {
                        node.css({ border: '', backgroundColor: '' })
                            .removeAttr('disabled').focus();
                    });
            }
        }

        function createField(id) {
            return $('<div>')
            .addClass('fieldset')
            .append(
                $('<input>', { type: 'text', tabindex: '2' })
                .attr('data-type', id)
                .addClass('discreet')
                .autocomplete({
                    source: function (query) {
                        return contactsAPI.autocomplete(query);
                    },
                    toString: function (data) {
                        return data.display_name ?
                            '"' + data.display_name + '" <' + data.email + '>' :
                            data.email;
                    },
                    draw: function (data) {
                        drawAutoCompleteItem.call(null, this, data);
                    },
                    click: function (e) {
                        copyRecipients.call(null, id, $(this));
                    }
                })
                .on('blur', function (e) {
                    // copy valid recipients
                    copyRecipients.call(null, id, $(this));
                })
                .on('keyup', function (e) {
                    if (e.which === 13) {
                        copyRecipients.call(null, id, $(this));
                    } else {
                        // look for special prefixes
                        var val = $(this).val();
                        if ((/^to:?\s/i).test(val)) {
                            $(this).val('');
                            showSection('to');
                        } else if ((/^cc:?\s/i).test(val)) {
                            $(this).val('');
                            showSection('cc');
                        } else if ((/^bcc:?\s/i).test(val)) {
                            $(this).val('');
                            showSection('bcc');
                        }
                    }
                })
            );
        }

        function createRadio(name, value, text, isChecked) {
            var id = name + '_' + value + '_' + _.now(),
                radio = $('<input>', { type: 'radio', name: name, id: id, value: value, tabindex: '5' }),
                label = $('<label>', { 'for': id }).text('\u00A0\u00A0' + text + '\u00A0\u00A0\u00A0\u00A0 ');
            if (isChecked) {
                radio.attr('checked', 'checked');
            }
            return radio.add(label);
        }

        function createCheckbox(name, text, isChecked) {
            var id = name + '_' + _.now(),
                box = $('<input>', { type: 'checkbox', name: name, id: id, value: '1', tabindex: '5' }),
                label = $('<label>', { 'for': id }).text('\u00A0\u00A0' + text + '\u00A0\u00A0\u00A0\u00A0 ');
            if (isChecked) {
                box.attr('checked', 'checked');
            }
            return box.add(label);
        }

        var handleFileSelect, addUpload, supportsPreview, createPreview;

        supportsPreview = function (file) {
            return window.FileReader &&
                (/^image\/(png|gif|jpe?g|bmp)$/i).test(file.type);
        };

        createPreview = function (file) {
            return $($.txt(' \u2013 ')) // ndash
                .add(
                    $('<a>', { href: '#' })
                    .text('Preview')
                    .on('click', { file: file }, function (e) {
                        e.preventDefault();
                        // open side popup
                        require(['io.ox/core/tk/dialogs'], function (dialogs) {
                            new dialogs.SidePopup().show(e, function (popup) {
                                // inject image as data-url
                                var reader = new FileReader();
                                reader.onload = function (e) {
                                    popup.append(
                                        $('<div>')
                                        .css({
                                            width: '100%',
                                            height: '100%',
                                            backgroundImage: 'url(' + e.target.result + ')',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'center center',
                                            backgroundSize: 'contain'
                                        })
                                    );
                                    reader = reader.onload = null;
                                };
                                reader.readAsDataURL(e.data.file);
                            });
                        });
                    })
                );
        };

        handleFileSelect = function (e) {

            // look for linked attachments or dropped files
            var item = $(this).prop('attachment') || $(this).prop('file'),
                list = item ? [item] : e.target.files;

            _(list).each(function (file) {
                sections.attachments.append(
                    $('<div>').addClass('section-item file')
                    .append($('<div>').text(file.filename || file.name || ''))
                    .append(
                        $('<div>')
                        .append(
                            $('<span>').addClass('filesize')
                            .text(i18n.filesize(file.size))
                        )
                        .append(
                            supportsPreview(file) ? createPreview(file) : $()
                        )
                    )
                    .append(
                        // remove
                        $('<a>', { href: '#', tabindex: '6' })
                        .addClass('remove')
                        .append(
                            $('<div>').addClass('icon').text('x')
                        )
                        .on('click', function (e) {
                            e.preventDefault();
                            $(this).parent().remove();
                        })
                    )
                );
            });
            $(this).parent().hide();
            addUpload();
        };

        addUpload = function () {
            return $('<div>')
                .addClass('section-item upload')
                .append(
                    $('<input>', { type: 'file', name: 'upload', multiple: 'multiple', tabindex: '2' })
                    .on('change', handleFileSelect)
                )
                .appendTo(sections.attachments);
        };

        var signatures = config.get('gui.mail.signatures', []),
        dummySignature = { signature_name: 'No signature' };

        function setSignature(e) {

            var index = e.data.index,
                signature, val, pos, $l, text,
                top;

            e.preventDefault();

            if (currentSignature !== undefined) {
                // remove current signature from editor
                val = editor.val();
                if ((pos = val.indexOf(currentSignature)) > -1) {
                    // remove signature
                    $l = currentSignature.length;
                    top = editor.scrollTop();
                    editor.val(val.substr(0, pos) + '' + val.substr(pos + $l));
                    editor.scrollTop(top);
                    currentSignature = undefined;
                }
            }

            // add signature?
            if (index < signatures.length) {
                signature = signatures[index];
                text = $.trim(signature.signature_text);
                val = editor.val();
                if (val.indexOf(text) === -1) {
                    // set
                    editor.val(val + '\n' + text);
                    // scroll to bottom
                    editor.scrollTop(editor.get(0).scrollHeight);
                    // remember current signature
                    currentSignature = '\n' + text;
                }
            }
        }

        // launcher
        app.setLauncher(function () {

            win = ox.ui.createWindow({
                name: 'io.ox/mail/write',
                title: '',
                titleWidth: GRID_WIDTH + 'px',
                toolbar: true
            });
            app.setWindow(win);
            win.setQuitOnClose(true);

            // main panel
            main = $('<div>')
            .addClass('rightside')
            .css({
                left: GRID_WIDTH + 'px'
            });

            main.append(
                $('<div>')
                .addClass('abs io-ox-mail-write-main')
                .append(
                    $('<div>').addClass('label').text('Subject')
                )
                .append(
                    $('<div>')
                    .css('position', 'relative')
                    .append(
                        $('<div>').addClass('subject-wrapper')
                        .append(
                            // subject
                            subject = $('<input>')
                            .attr({ type: 'text', name: 'subject', tabindex: '3' })
                            .addClass('subject')
                            .on('keyup', function (e) {
                                if (e.which === 13) {
                                    // auto jump to editor on enter
                                    editor.focus();
                                }
                            })
                        )
                    )
                    .append(
                        priorityOverlay = $('<div>').addClass('priority-overlay')
                            .attr('title', 'Priority')
                            .text('\u2605\u2605\u2605')
                            .on('click', togglePriority)
                    )
                    .append(
                        $('<div>').addClass('sendbutton-wrapper')
                        .append(
                            // send
                            $('<a>', { href: '#', tabindex: '8', accesskey: 's' })
                            .addClass('button default-action sendbutton')
                            .html('<u>S</u>end')
                            .on('click', function (e) {
                                e.preventDefault();
                                ext.point('io.ox/mail/write/actions/send').invoke('action', null, app);
                            })
                        )
                    )
                )
                .append(
                    $('<div/>')
                    .addClass('abs editor-outer-container')
                    .append(
                        $('<div>')
                        .addClass('abs editor-inner-container')
                        .css('overflow', 'hidden')
                        .append(
                            // text editor
                            editor = $('<textarea>')
                                .attr({ name: 'content', tabindex: '4' })
                               .addClass('text-editor')
                        )
                    )
                    .append(
                        // editor's print margin
                        editorPrintMargin = $('<div/>')
                        .addClass('abs editor-print-margin')
                    )
                )
            );

            // side panel
            sidepanel = $('<div/>')
                .css({ width: (GRID_WIDTH - 26) + 'px' })
                .addClass('leftside io-ox-mail-write-sidepanel');

            // sections

            // TO
            addSection('to', 'To')
                .append(createRecipientList('to'))
                .append(createField('to'));

            // CC
            addSection('cc', 'Copy to', false, true)
                .append(createRecipientList('cc'))
                .append(createField('cc'));
            addLink('cc', 'Copy (CC) to ...');

            // BCC
            addSection('bcc', 'Blind copy to', false, true)
                .append(createRecipientList('bcc'))
                .append(createField('bcc'));
            addLink('bcc', 'Blind copy (BCC) to ...');

            // Attachments
            addSection('attachments', 'Attachments', false, true);
            addUpload();
            addLink('attachments', 'Attachments');

            // Signatures
            if (signatures.length) {
                addSection('signatures', 'Signatures', false, true)
                    .append(
                        _(signatures.concat(dummySignature))
                            .inject(function (memo, o, index) {
                                var preview = (o.signature_text || '')
                                    .replace(/\s\s+/g, ' ') // remove subsequent white-space
                                    .replace(/(\W\W\W)\W+/g, '$1 '); // reduce special char sequences
                                preview = preview.length > 150 ? preview.substr(0, 150) + ' ...' : preview;
                                return memo.add(
                                        $('<div>').addClass('section-item pointer')
                                        .addClass(index >= signatures.length ? 'signature-remove' : '')
                                        .append(
                                            $('<a>', { href: '#', tabindex: '5' })
                                            .on('click dragstart', $.preventDefault)
                                            .text(o.signature_name)
                                        )
                                        .append(
                                            preview.length ?
                                                $('<div>').addClass('signature-preview')
                                                .text(' ' + preview) :
                                                $()
                                        )
                                        .on('click', { index: index }, setSignature)
                                    );
                            }, $())
                    );

                addLink('signatures', 'Signatures');
            }

            // Options
            addSection('options', 'Options', false, true)
                .append(
                    // Priority
                    $('<div>').addClass('section-item')
                    .css({ paddingTop: '0.5em', paddingBottom: '0.5em' })
                    .append(
                        $('<span>').addClass('group-label').text('Priority')
                    )
                    .append(createRadio('priority', '2', 'High'))
                    .append(createRadio('priority', '3', 'Normal', true))
                    .append(createRadio('priority', '4', 'Low'))
                    .on('change', 'input', function () {
                        var radio = $(this);
                        if (radio.attr('value') === '2' && radio.prop('checked')) {
                            applyHighPriority(true);
                        } else {
                            applyHighPriority(false);
                        }
                    })
                )
                .append(
                    // Delivery Receipt
                    $('<div>').addClass('section-item')
                    .css({ paddingTop: '1em', paddingBottom: '1em' })
                    .append(createCheckbox('receipt', 'Delivery Receipt'))
                )
                .append(
                    // Attach vCard
                    $('<div>').addClass('section-item')
                    .css({ paddingTop: '1em', paddingBottom: '1em' })
                    .append(createCheckbox('vcard', 'Attach vCard'))
                );

            addLink('options', 'More ...');

            // add panels to windows
            win.nodes.main
            .addClass('io-ox-mail-write')
            .append(
                form = $('<form>', {
                    name: 'compose',
                    method: 'post',
                    enctype: 'multipart/form-data'
                })
                .append(
                    $('<input>', { type: 'hidden', name: 'msgref', value: '' })
                )
                .append(main)
                .append(sidepanel)
            );

            var resizeEditorMargin = (function () {
                    // trick to force document reflow
                    var alt = false;
                    return _.debounce(function () {
                        var w = Math.max(10, editor.outerWidth() - 12 - 750);
                        editor.css('paddingRight', w + 'px');
                        editorPrintMargin.css('right', Math.max(0, w - 10) + 'px');
                        // force reflow
                        editor.css('display', (alt = !alt) ? 'block' : '');
                    }, 100);
                }()),

                resizeEditor = _.debounce(function () {
                    var p = editor.parent(), w = p.width(), h = p.height();
                    p.find('table.mceLayout').css({ width: w + 'px', height: h + 'px' });
                }, 100);

            var dropZone = upload.dnd.createDropZone();
            dropZone.bind('drop', function (file) {
                form.find('input[type=file]').last()
                    .prop('file', file)
                    .trigger('change');
                showSection('attachments');
            });

            win.bind('show', function () {
                if (editorMode === 'text') {
                    resizeEditorMargin();
                    $(window).on('resize', resizeEditorMargin);
                } else {
                    $(window).on('resize', resizeEditor);
                }
                dropZone.include();
            });

            win.bind('hide', function () {
                if (editorMode === 'text') {
                    $(window).off('resize', resizeEditorMargin);
                } else {
                    $(window).off('resize', resizeEditor);
                }
                dropZone.remove();
            });
        });

        function initializeEditor() {

            function makeParagraph() {
                var self = $(this),
                    style = self.attr('style'),
                    p = $('<p>');
                if (style) {
                    p.attr('style', style);
                }
                self.replaceWith(p.append(self.contents()));
            }

            // html?
            if (editorMode === 'html') {
                editor.tinymce({

                    script_url: ox.base + '/apps/moxiecode/tiny_mce/tiny_mce.js',
                    plugins: 'paste',
                    theme: 'advanced',
                    skin: 'ox',

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
                    paste_preprocess: function (pl, o) {
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
                    },

                    // post processing (DOM-based)
                    paste_postprocess: function (pl, o) {

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
                        node.find('article, header, footer, section, form').each(function () {
                            $(this).children().first().unwrap();
                        });

                        // clean up links
                        node.find('a').each(function () {
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
                        });

                        // replace <code> by <em>
                        node.find('code').each(function () {
                            var self = $(this);
                            self.replaceWith($('<em>').text(self.text()));
                        });

                        // simplify DOM tree
                        function simplify() {
                            var self = $(this),
                                tagName = this.tagName,
                                children = self.children(),
                                text;
                            // remove attributes
                            self.removeAttr('id title alt rel');
                            // is closed tag?
                            if (/^(BR|HR|IMG)$/.test(tagName)) {
                                return;
                            }
                            // fix text align
                            if (self.attr('align')) {
                                self.css('textAlign', self.attr('align')).removeAttr('align');
                            }
                            // fix text nodes
                            self.contents().each(function () {
                                if (this.nodeType === 3) {
                                    this.nodeValue = this.nodeValue
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
                                        done = false;
                                        return;
                                    }
                                } else {
                                    // remove simple <span>, <small>, and <pre>
                                    if (/^(SPAN|SMALL|PRE)$/.test(tagName)) {
                                        if (!self.attr('class') && !self.attr('style')) {
                                            self.replaceWith($.txt(self.text()));
                                            done = false;
                                            return;
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
                                    done = false;
                                }
                            }
                        }
                        do {
                            done = true;
                            node.find('*').each(simplify);
                        } while (!done);

                        // beautify tables
                        node.find('table').each(function () {
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
                        });

                        // replace top-level <div> by <p>
                        node.eq(0).children('div').each(makeParagraph);

                        // remove <p> with just one <br> inside
                        node.find('p').each(function () {
                            var self = $(this),
                                contents = self.contents();
                            if (contents.length === 1 && contents.get(0).tagName === 'BR') {
                                self.remove();
                            }
                        });
                    }
                });
            }
        }

        /**
         * Setters
         */
        app.setSubject = function (str) {
            subject.val(str || '');
        };

        app.setRawBody = function (str) {
            editor.val(str);
        };

        app.setBody = function (str) {
            // get default signature
            var ds = _(signatures)
                    .find(function (o) {
                        return o.signature_default === true;
                    }),
                text = ds ? $.trim(ds.signature_text) : '',
                pos = ds ? ds.position : 'below';
            // set signature?
            if (ds) {
                // yep
                editor.val('\n\n' + (pos === 'above' ? text + '\n\n' + str : str + '\n\n' + text));
                currentSignature = '\n' + text;
            } else {
                // no signature
                editor.val('\n' + str);
            }
        };

        app.setTo = function (list) {
            addRecipients('to', list || []);
        };

        app.setCC = function (list) {
            addRecipients('cc', list || []);
            if (list && list.length) {
                showSection('cc');
            }
        };

        app.setBCC = function (list) {
            addRecipients('bcc', list || []);
            if (list && list.length) {
                showSection('bcc');
            }
        };

        app.setAttachments = function (list) {
            // look for real attachments
            _(list || []).each(function (attachment) {
                if (attachment.disp === 'attachment') {
                    // add as linked attachment
                    attachment.type = 'file';
                    form.find('input[type=file]').last()
                        .prop('attachment', attachment)
                        .trigger('change');
                }
            });
            if (list && list.length) {
                showSection('attachments');
            }
        };

        app.setPriority = function (prio) {
            // be robust
            prio = parseInt(prio, 10) || 3;
            prio = prio >= 2 && prio <= 4 ? prio : 3;
            // set
            form.find('input[name=priority][value=' + prio + ']')
                .prop('checked', true);
            // high priority?
            if (prio === 2) {
                priorityOverlay.addClass('high');
            }
        };

        app.setAttachVCard = function (bool) {
            // set
            form.find('input[name=vcard]').prop('checked', !!bool);
        };

        app.setDeliveryReceipt = function (bool) {
            // set
            form.find('input[name=receipt]').prop('checked', !!bool);
        };

        app.setMsgRef = function (ref) {
            form.find('input[name=msgref]').val(ref || '');
        };

        app.setMail = function (data, mode) {
            // be robust
            data = data || {};
            // call setters
            this.setSubject(data.subject);
            this.setTo(data.to);
            this.setCC(data.cc);
            this.setBCC(data.bcc);
            this.setAttachments(data.attachments);
            this.setPriority(3);
            this.setAttachVCard(config.get('mail.vcard', false));
            this.setDeliveryReceipt(false);
            this.setMsgRef(data.msgref);
            // set body
            var content = data.attachments && data.attachments.length ? data.attachments[0].content : '';
            this[mode !== 'edit' ? 'setBody' : 'setRawBody'](content);
        };

        /**
         * Compose new mail
         */
        app.compose = function () {
            win.setTitle('Compose new email')
                .show(function () {
                    initializeEditor();
                    $('input[data-type=to]').focus().select();
                });
        };

        /**
         * Reply all
         */
        app.replyall = function (obj) {
            mailAPI.replyall(obj).done(function (data) {
                app.setMail(data, 'replyall');
                win.setTitle('Reply all')
                    .show(function () {
                        initializeEditor();
                        editor.focus();
                    });
            });
        };

        /**
         * Reply
         */
        app.reply = function (obj) {
            mailAPI.reply(obj).done(function (data) {
                app.setMail(data, 'reply');
                win.setTitle('Reply')
                    .show(function () {
                        initializeEditor();
                        editor.focus();
                    });
            });
        };

        /**
         * Forward
         */
        app.forward = function (obj) {
            mailAPI.forward(obj).done(function (data) {
                app.setMail(data, 'forward');
                win.setTitle('Forward')
                    .show(function () {
                        initializeEditor();
                        $('input[data-type=to]').focus().select();
                    });
            });
        };

        /**
         * Proof read view
         */
        app.proofread = function () {
            // create reader
            var reader = $('<div>').addClass('abs io-ox-mail-proofread');
            // load detail view
            require(['io.ox/mail/view-detail'], function (view) {
                // get data
                var mail = app.getMail();
                // add missing data
                _.extend(mail.data, {
                    folder_id: 'default0/INBOX',
                    received_date: _.now()
                });
                // draw mail
                reader.append(view.draw(mail.data))
                    .appendTo('body');
            });
        };

        /**
         * Get mail
         */
        app.getMail = function () {
            var // get relevant fields
                fields = form
                    .find(':input[name]')
                    .filter('textarea, [type=text], [type=hidden], [type=radio]:checked, [type=checkbox]:checked'),
                // get raw data
                data = _(fields).inject(function (obj, field) {
                    var key = field.name, pre = obj[key], val = $(field).val();
                    if (pre !== undefined) {
                        // make array or push to array
                        (_.isArray(pre) ? pre : (obj[key] = [pre])).push(val);
                    } else {
                        obj[key] = val;
                    }
                    return obj;
                }, {}),
                mail,
                files = [],
                parse = function (list) {
                    return mailUtil.parseRecipients([].concat(list).join(', '));
                };
            // transform raw data
            mail = {
                from: [defaultSender] || [],
                to: parse(data.to),
                cc: parse(data.cc),
                bcc: parse(data.bcc),
                subject: data.subject + '',
                priority: data.priority,
                vcard: data.vcard || '0',
                disp_notification_to: data.deliveryReceipt || '0',
                attachments: [{
                    content_type: 'text/plain',
                    content: (data.content + '')
                        .replace(/</g, '&lt;') // escape <
                        .replace(/\n/g, '<br>\n') // escape line-breaks
                }]
            };
            // add msgref?
            if (data.msgref) {
                mail.msgref = data.msgref;
            }
            // get files
            form.find(':input[name][type=file]')
                .each(function () {
                    // link to existing attachments (e.g. in forwards)
                    var attachment = $(this).prop('attachment'),
                        // get file via property (DND) or files array and add to list
                        file = $(this).prop('file');
                    if (attachment) {
                        // add linked attachment
                        mail.attachments.push(attachment);
                    } else if (file) {
                        // add dropped file
                        files.push(file);
                    } else if (this.files && this.files.length) {
                        // process normal upload
                        _(this.files).each(function (file) {
                            files.push(file);
                        });
                    }
                });
            // return data & file references
            return { data: mail, files: files };
        };

        /**
         * Send mail
         */
        app.send = function () {
            // get mail
            var mail = this.getMail();
            // hide app
            win.hide();
            // send!
            mailAPI.send(mail.data, mail.files)
                .always(function (result) {
                    if (result.error) {
                        console.error(result);
                        win.show();
                        alert('Server error - see console :(');
                    } else {
                        app.quit();
                    }
                });
        };

        window.heinz = app;
        app.test = function () {

            var ed = window.horst = editor.tinymce(),
                base = ox.base + '/apps/io.ox/mail/write';

            function clear() {
                ed.setContent('');
                ed.execCommand('SelectAll');
            }

            function trim(str) {
                return $.trim((str + '').replace(/[\r\n]+/g, ''));
            }

            function get() {
                // get editor content (trim white-space and clean up pseudo XHTML)
                return trim(ed.getContent()).replace(/<(\w+)[ ]?\/>/g, '<$1>');
            }

            function equals(a, b) {
                if (a !== b) {
                    console.error('Fail!', a, 'vs', b);
                } else {
                    console.log('Test passed!');
                }
            }

            // basic test
            clear();
            ed.execCommand('mceInsertClipboardContent', false, {
                content: '<p>Hello World</p>'
            });
            equals(get(), '<p>Hello World</p>');

            // remove color
            clear();
            ed.execCommand('mceInsertClipboardContent', false, {
                content: '<p style="color: red">Hello World</p>'
            });
            equals(get(), '<p>Hello World</p>');

            // simple text
            clear();
            ed.execCommand('mceInsertClipboardContent', false, {
                content: '<p>Hello<br />World</p><p>one empty line, then this one</p>'
            });
            equals(get(), '<p>Hello<br>World</p><p>one empty line, then this one</p>');

            // complex test cases
            $.when(
                $.get(base + '/test_1a.html'),
                $.get(base + '/test_1b.html')
            )
            .done(function (a, b) {
                clear();
                ed.execCommand('mceInsertClipboardContent', false, { content: a[0] });
                equals(get(), trim(b[0]));
            })
            .done(function () {

                $.when(
                    $.get(base + '/test_2a.html'),
                    $.get(base + '/test_2b.html')
                )
                .done(function (a, b) {
                    clear();
                    ed.execCommand('mceInsertClipboardContent', false, { content: a[0] });
                    equals(get(), trim(b[0]));
                });
            });

            return ed;
        };

        return app;
    }

    var module = {
            getApp: createInstance
        };

    // initialize
    var loadUser, loadTinyMCE;

    // load user
    loadUser = userAPI.get(config.get('identifier'))
        .done(function (sender) {
            // inject 'from'
            defaultSender = [sender.display_name, sender.email1];
        });

    // load tinyMCE?
    if (editorMode === 'html') {
        loadTinyMCE = $.getScript(ox.base + '/apps/moxiecode/tiny_mce/jquery.tinymce.js');
    } else {
        loadTinyMCE = $.when();
    }

    return $.when(loadUser, loadTinyMCE)
        .pipe(function () {
            return module;
        });
});


