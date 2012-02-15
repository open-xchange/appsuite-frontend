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
     'gettext!io.ox/mail/mail',
     'less!io.ox/mail/style.css',
     'less!io.ox/mail/write/style.css'], function (mailAPI, mailUtil, textile, ext, config, contactsAPI, contactsUtil, i18n, userAPI, upload, autocomplete, gt) {

    'use strict';

    // actions (define outside of multi-instance app)
    ext.point('io.ox/mail/write/actions/send').extend({
        id: 'send',
        action: function (app) {
            app.send();
        }
    });

    // actions (define outside of multi-instance app)
    ext.point('io.ox/mail/write/actions/draft').extend({
        id: 'send',
        action: function (app) {
            app.saveDraft().done(function (data) {
                app.setMsgRef(data.data);
            }).fail(function (e) {

            });
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
    var defaultSender = [];

    // multi instance pattern
    function createInstance() {

        var app, win,
            main, scrollpane, sidepanel,
            GRID_WIDTH = 330,
            form,
            subject,
            textarea,
            editor,
            editorHash = {},
            priorityOverlay,
            sections = {},
            currentSignature = '',
            editorMode = '',
            mailState,
            composeMode;

        app = ox.ui.createApp({
            name: 'io.ox/mail/write',
            title: 'Compose'
        });

        app.STATES = {
            'CLEAN': 1,
            'DIRTY': 2
        };

        mailState = app.STATES.CLEAN;

        app.getState = function () {
            return mailState;
        };

        app.markDirty = function () {
            mailState = app.STATES.DIRTY;
        };

        app.markClean = function () {
            mailState = app.STATES.CLEAN;
        };

        // helper

        function applyHighPriority(flag) {
            if (flag) {
                priorityOverlay.addClass('high');
            } else {
                priorityOverlay.removeClass('high');
            }
        }

        function togglePriority(e) {
            var high = form.find('input[name=priority][value=1]'),
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
                .attr('data-section-label', id)
                .addClass('io-ox-label')
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

            sections[id] = $('<div>').addClass('section')
                .attr('data-section', id);

            sidepanel.append(sections[id + 'Label']).append(sections[id]);

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
                    .attr('data-section-link', id)
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

            var img = $('<div>').addClass('contact-image'),
                url = contactsUtil.getImage(data.contact);

            if (Modernizr.backgroundsize) {
                img.css('backgroundImage', 'url(' + url + ')');
            } else {
                img.append(
                    $('<img>', { src: url, alt: '' }).css({ width: '100%', height: '100%' })
                );
            }

            node.addClass('io-ox-mail-write-contact')
            .append(img)
            .append(
                $('<div>').addClass('person-link ellipsis')
                .text(data.display_name + '\u00A0')
            )
            .append($('<div>').addClass('ellipsis').text(data.email));
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
            app.markDirty();
            // loop over list and draw recipient
            _(list).each(function (recipient) {
                var node = $('<div>');
                drawContact(id, node, {
                    display_name: recipient[0] ? recipient[0].replace(/^('|")|('|")$/g, '') : recipient[0],
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
                // add
                addRecipients(id, list);
                node.val('').focus();
            } else if ($.trim(node.val()) !== '') {
                // not accepted but has content -> shake
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
                $('<label>', { 'for' : 'writer_field_' + id })
                .append(
                    $('<input>', {
                        type: 'text',
                        tabindex: '2',
                        autocapitalize: 'off',
                        autocomplete: 'off',
                        autocorrect: 'off',
                        id: 'writer_field_' + id
                    })
                    .attr('data-type', id) // not name=id!
                    .addClass('discreet')
                    .autocomplete({
                        source: function (query) {
                            return contactsAPI.autocomplete(query);
                        },
                        stringify: function (data) {
                            return data.display_name ?
                                '"' + data.display_name + '" <' + data.email + '>' :
                                data.email;
                        },
                        draw: function (data) {
                            drawAutoCompleteItem.call(null, this, data);
                        },
                        click: function (e) {
                            copyRecipients.call(null, id, $(this));
                        },
                        blur: function (e) {
                            // copy valid recipients
                            copyRecipients.call(null, id, $(this));
                        }
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
                )
            );
        }

        function createRadio(name, value, text, isChecked) {
            var id = name + '_' + value + '_' + _.now(),
                radio = $('<input>', { type: 'radio', name: name, id: id, value: value, tabindex: '5' }),
                label = $('<label>', { 'for': id }).text('\u00A0\u00A0' + text + '\u00A0\u00A0\u00A0\u00A0 ');
            if (isChecked) {
                radio.attr('checked', 'checked');
            }
            if (Modernizr.touch) {
                label.on('click', { id: id }, function (e) {
                    var node = $(this).prev();
                    node.prop('selected', !node.prop('selected')).trigger('change'); // selected, not checked!
                });
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
            if (Modernizr.touch) {
                label.on('click', { id: id }, function (e) {
                    var node = $(this).prev();
                    node.prop('selected', !node.prop('selected')).trigger('change'); // selected, not checked!
                });
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

            if (Modernizr.file) {
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
            }
            addUpload();
        };

        addUpload = function () {
            var inputOptions;

            if (Modernizr.file) {
                inputOptions = { type: 'file', name: 'upload', multiple: 'multiple', tabindex: '2' };
            } else {
                inputOptions = { type: 'file', name: 'upload', tabindex: '2' };
            }

            return $('<div>')
                .addClass('section-item upload')
                .append(
                    $.labelize(
                        $('<input>', inputOptions)
                        .on('change', handleFileSelect),
                        'mail_attachment'
                    )
                )
                .appendTo(sections.attachments);
        };

        var signatures = config.get('gui.mail.signatures', []),
        dummySignature = { signature_name: 'No signature' };

        function setSignature(e) {

            var index = e.data.index,
                signature, val, pos, $l, text,
                top;

            if (currentSignature) {
                // remove current signature from editor
                editor.replaceParagraph(currentSignature, '');
                currentSignature = '';
            }

            // add signature?
            if (index < signatures.length) {
                signature = signatures[index];
                text = $.trim(signature.signature_text);
                editor.appendContent(text);
                editor.scrollTop('bottom');
                currentSignature = text;
            }
        }
        function fnSetSignature(e) {
            e.preventDefault();
            setSignature(e);
        }

        function showMessage(msg, header, sticky) {
            console.log(arguments);
            $('#myGrowl').jGrowl(msg, {header: header, sticky: sticky});
        }

        // launcher
        app.setLauncher(function () {

            win = ox.ui.createWindow({
                name: 'io.ox/mail/write',
                title: '',
                titleWidth: (GRID_WIDTH + 10) + 'px',
                toolbar: true,
                close: true
            });
            app.setWindow(win);

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
                    $('<div>').addClass('io-ox-label').text('Subject')
                )
                .append(
                    $('<div>')
                    .css('position', 'relative')
                    .append(
                        $('<div>').addClass('subject-wrapper')
                        .append(
                            // subject
                            $.labelize(
                                subject = $('<input>')
                                .attr({ type: 'text', name: 'subject', tabindex: '3' })
                                .addClass('subject')
                                .val('')
                                .on('keydown', function (e) {
                                    if (e.which === 13 || (e.which === 9 && !e.shiftKey)) {
                                        // auto jump to editor on enter/tab
                                        e.preventDefault();
                                        editor.focus();
                                    }
                                    app.getWindow().setTitle($.trim($(this).val()));
                                }),
                                'mail_subject'
                            )
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
                    .append(
                        $('<div>').addClass('draftbutton-wrapper')
                        .append(
                            // send
                            $('<a>', { href: '#', tabindex: '9' })
                            .addClass('button action draftbutton')
                            .html('Draft')
                            .on('click', function (e) {
                                e.preventDefault();
                                ext.point('io.ox/mail/write/actions/draft').invoke('action', null, app);
                            })
                        )
                    )
                )
                .append(
                    $('<div>')
                    .addClass('abs editor-outer-container')
                    .append(
                        // white background
                        $('<div>').addClass('abs editor-background')
                    )
                    .append(
                        // editor's print margin
                        $('<div>').addClass('abs editor-print-margin')
                    )
                    .append(
                        $('<div>')
                        .addClass('abs editor-inner-container')
                        .css('overflow', 'hidden')
                        .append(
                            // text editor
                            $.labelize(
                               textarea = $('<textarea>')
                               .attr({ name: 'content', tabindex: '4', disabled: 'disabled' })
                               .addClass('text-editor'),
                               'mail_content'
                            )
                        )
                    )
                )
            ).append($('<div>', {id: 'myGrowl'}).addClass('jGrowl').css({position: 'absolute', right: '0', top: '0'}));

            // side panel
            var scrollpane = $('<div>')
                .css({ width: (GRID_WIDTH - 26) + 'px' })
                .addClass('leftside io-ox-mail-write-sidepanel');

            sidepanel = scrollpane.scrollable();

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
                            .on('click', { index: index }, fnSetSignature)
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
                    .append(createRadio('priority', '1', 'High'))
                    .append(createRadio('priority', '3', 'Normal', true))
                    .append(createRadio('priority', '5', 'Low'))
                    .on('change', 'input', function () {
                        var radio = $(this);
                        if (radio.attr('value') === '1' && radio.prop('checked')) {
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

            var fnChangeFormat = function (e) {
                e.preventDefault();
                app.setFormat(e.data.format).done(function () {
                    editor.focus();
                });
            };

            if (!Modernizr.touch) {
                addSection('format', 'Text format', true, false)
                    .append(
                        $('<div>').addClass('change-format')
                        .append(
                            $('<a>', { href: '#' }).text('Text').on('click', { format: 'text' }, fnChangeFormat)
                        )
                        .append($.txt(' \u00A0\u2013\u00A0 ')) // &ndash;
                        .append(
                            $('<a>', { href: '#' }).text('HTML').on('click', { format: 'html' }, fnChangeFormat)
                        )
                    );
            }

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
                .append(scrollpane)
            );

            var dropZone = upload.dnd.createDropZone();
            dropZone.on('drop', function (file) {
                form.find('input[type=file]').last()
                    .prop('file', file)
                    .trigger('change');
                showSection('attachments');
            });

            win.on('show', function () {
                if (editor) {
                    editor.handleShow();
                }
                dropZone.include();
            });

            win.on('hide', function () {
                if (editor) {
                    editor.handleHide();
                }
                dropZone.remove();
            });
        });

        /**
         * Setters
         */
        app.setFormat = (function () {

            app.markDirty();

            function load(mode, content) {
                var editorSrc = 'io.ox/core/tk/' + (mode === 'html' ? 'html-editor' : 'text-editor');
                return require([editorSrc]).pipe(function (Editor) {
                    return (editor = editorHash[mode] = new Editor(textarea))
                        .done(function () {
                            editor.setPlainText(content);
                            editor.handleShow();
                        });
                });
            }

            function reuse(mode, content) {
                editor = editorHash[mode];
                editor.setPlainText(content);
                editor.handleShow();
                return $.when();
            }

            function changeMode(mode) {
                // be busy
                textarea.attr('disabled', 'disabled').busy();
                if (editor) {
                    var content = editor.getPlainText();
                    editor.clear();
                    editor.handleHide();
                    if (editor.tinymce) {
                        // changing from HTML to TEXT
                        if (!editorHash.text) {
                            // load TEXT editor for the first time
                            return load('text', content);
                        } else {
                            // reuse TEXT editor
                            return reuse('text', content);
                        }
                    } else {
                        // changing from TEXT to HTML
                        if (!editorHash.html) {
                            // load HTML editor for the first time
                            return load('html', content);
                        } else {
                            // reuse HTML editor
                            return reuse('html', content);
                        }
                    }
                } else {
                    // initial editor
                    return load(mode);
                }
            }

            return _.queued(function (mode) {
                // change?
                return (mode === editorMode ?
                    $.when() :
                    changeMode(mode || editorMode).done(function () {
                        editorMode = mode || editorMode;
                    })
                );
            });
        }());

        app.setSubject = function (str) {
            app.markDirty();
            subject.val(str || '');
        };

        app.setRawBody = function (str) {
            app.markDirty();
            editor.setContent(str);
        };

        app.setBody = function (str) {
            app.markDirty();
            // get default signature
            var ds = _(signatures)
                    .find(function (o) {
                        return o.signature_default === true;
                    }),
                signature = ds ? $.trim(ds.signature_text) : '',
                pos = ds ? ds.position : 'below',
                content = $.trim(str);
            // set signature?
            if (ds) {
                // remember as current signature
                currentSignature = signature;
                // yep
                if (editorMode === 'html') {
                    // prepare signature for html
                    signature = '<p>' + signature.replace(/\n/g, '<br>') + '</p>';
                    // html
                    editor.setContent('<p></p>' + (pos === 'above' ? signature + content : content + signature));
                } else {
                    // plain text
                    if (pos === 'above') {
                        editor.setContent('\n\n' + signature + (content !== '' ? '\n\n' + content : ''));
                    } else {
                        editor.setContent('\n\n' + (content !== '' ? content + '\n\n' : '') + signature);
                    }
                }

            } else {
                // no signature
                editor.setContent(content !== '' ? (editorMode === 'html' ? '<p></p>' : '\n\n') + content : '');
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
            app.markDirty();
            // look for real attachments
            var found = false;
            _(list || []).each(function (attachment) {
                if (attachment.disp === 'attachment') {
                    // add as linked attachment
                    attachment.type = 'file';
                    found = true;
                    form.find('input[type=file]').last()
                        .prop('attachment', attachment)
                        .trigger('change');
                }
            });
            if (found) {
                showSection('attachments');
            }
        };

        app.setPriority = function (prio) {
            app.markDirty();
            // be robust
            prio = parseInt(prio, 10) || 3;
            prio = prio < 3 ? 1 : prio;
            prio = prio > 3 ? 5 : prio;
            // set
            form.find('input[name=priority][value=' + prio + ']')
                .prop('checked', true);
            // high priority?
            if (prio === 1) {
                priorityOverlay.addClass('high');
            }
        };

        app.setAttachVCard = function (bool) {
            app.markDirty();
            // set
            form.find('input[name=vcard]').prop('checked', !!bool);
        };

        app.setDeliveryReceipt = function (bool) {
            app.markDirty();
            // set
            form.find('input[name=receipt]').prop('checked', !!bool);
        };

        app.setMsgRef = function (ref) {
            app.markDirty();
            form.find('input[name=msgref]').val(ref || '');
        };

        var windowTitles = {
            compose: 'Compose new email',
            replyall: 'Reply all',
            reply: 'Reply',
            forward: 'Forward'
        };

        app.setMail = function (mail) {
            // be robust
            mail = mail || {};
            mail.data = mail.data || {};
            mail.mode = mail.mode || 'compose';
            mail.format = mail.format || 'text';
            mail.initial = mail.initial || false;
            // call setters
            var data = mail.data;
            this.setSubject(data.subject);
            this.setTo(data.to);
            this.setCC(data.cc);
            this.setBCC(data.bcc);
            this.setAttachments(data.attachments);
            this.setPriority(data.priority || 3);
            this.setAttachVCard(data.vcard !== undefined ? data.vcard : config.get('mail.vcard', false));
            this.setDeliveryReceipt(data.disp_notification_to !== undefined ? data.disp_notification_to : false);
            this.setMsgRef(data.msgref);
            // apply mode
            win.setTitle(data.subject ? data.subject : windowTitles[composeMode = mail.mode]);
            // set signature
            currentSignature = mail.signature || '';
            // set format
            return app.setFormat(mail.format)
                .done(function () {
                    // set body
                    var content = data.attachments && data.attachments.length ? data.attachments[0].content : '';
                    if (mail.format === 'text') {
                        content = content.replace(/<br>\n?/g, '\n');
                    }
                    app[mail.initial ? 'setBody' : 'setRawBody'](content);
                });
        };

        app.failSave = function () {
            var mail = app.getMail();
            delete mail.files;
            return {
                module: 'io.ox/mail/write',
                point: mail
            };
        };

        app.failRestore = function (point) {
            var def = $.Deferred();
            win.show(function () {
                app.setMail(point)
                .done(function () {
                    editor.focus();
                    def.resolve();
                });
            });
            return def;
        };

        /**
         * Compose new mail
         */
        app.compose = function (data) {
            var def = $.Deferred();
            win.show(function () {
                app.setMail({ data: data, mode: 'compose', initial: true })
                .done(function () {
                    if (data && data.to) {
                        $('input[name=subject]').focus().select();
                    } else {
                        $('input[data-type=to]').focus().select();
                    }
                    def.resolve();
                });
            });
            return def;
        };

        /**
         * Reply all
         */
        app.replyall = function (obj) {
            var def = $.Deferred();
            win.show(function () {
                mailAPI.replyall(obj, editorMode || 'text')
                .done(function (data) {
                    app.setMail({ data: data, mode: 'replyall', initial: true })
                    .done(function () {
                        editor.focus();
                        def.resolve();
                    });
                });
            });
            return def;
        };

        /**
         * Reply
         */
        app.reply = function (obj) {
            var def = $.Deferred();
            win.show(function () {
                mailAPI.reply(obj, editorMode || 'text')
                .done(function (data) {
                    app.setMail({ data: data, mode: 'reply', initial: true })
                    .done(function () {
                        editor.focus();
                        def.resolve();
                    });
                });
            });
            return def;
        };

        /**
         * Forward
         */
        app.forward = function (obj) {
            var def = $.Deferred();
            win.show(function () {
                mailAPI.forward(obj, editorMode || 'text')
                .done(function (data) {
                    app.setMail({ data: data, mode: 'forward', initial: true })
                    .done(function () {
                        $('input[data-type=to]').focus().select();
                        def.resolve();
                    });
                });
            });
            return def;
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
                content,
                mail,
                files = [],
                parse = function (list) {
                    return _(mailUtil.parseRecipients([].concat(list).join(', ')))
                        .map(function (recipient) {
                            return ['"' + recipient[0] + '"', recipient[1]];
                        });
                };
            // get content
            if (editorMode === 'html') {
                content = {
                    content_type: 'text/html',
                    content: editor ? editor.getContent() : ''
                };
            } else {
                content = {
                    content_type: 'text/plain',
                    content: (editor ? editor.getContent() : '')
                        .replace(/</g, '&lt;') // escape <
                        .replace(/\n/g, '<br>\n') // escape line-breaks
                };
            }
            // transform raw data
            mail = {
                from: [defaultSender] || [],
                to: parse(data.to),
                cc: parse(data.cc),
                bcc: parse(data.bcc),
                subject: data.subject + '',
                priority: parseInt(data.priority, 10) || 3,
                vcard: parseInt(data.vcard, 10) || 0,
                disp_notification_to: parseInt(data.receipt, 10) || 0,
                attachments: [content]
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
            // return data, file references, mode, format
            return {
                data: mail,
                mode: composeMode,
                format: editorMode,
                signature: currentSignature,
                files: files
            };
        };

        /**
         * Send mail
         */
        app.send = function () {
            // get mail
            var mail = this.getMail();
            // hide app
            //win.hide();
            // send!
            mailAPI.send(mail.data, mail.files)
                .always(function (result) {
                    if (result.error) {
                        console.error(result);
                        win.show();
                        alert('Server error - see console :(');
                    } else {
                        app.markClean();
                        app.quit();
                    }
                });
        };

        app.saveDraft = function () {
            // get mail
            var mail = this.getMail(),
                def = new $.Deferred();
            // send!

            mail.data.sendtype = mailAPI.SENDTYPE.DRAFT;

            if (_(mail.data.flags).isUndefined()) {
                mail.data.flags = mailAPI.FLAGS.DRAFT;
            } else if (mail.data.flags & 4 === 0) {
                mail.data.flags += mailAPI.FLAGS.DRAFT;
            }

            mailAPI.send(mail.data, mail.files)
                .always(function (result) {
                    if (result.error) {
                        console.error(result);
                        def.reject('Server error - see console :(');
                        showMessage('Mail is NOT saved', 'Mail Error', true);
                    } else {
                        showMessage('Mail is saved', 'Mail', false);
                        def.resolve(result);
                        app.markClean();
                    }
                });

            return def;
        };

        /**
         * Get editor
         */
        app.getEditor = function () {
            return editor;
        };

        // destroy
        app.setQuit(function () {

            var def = $.Deferred();

            var clean = function () {
                // clean up editors
                for (var id in editorHash) {
                    editorHash[id].destroy();
                }
                // clear all private vars
                app = win = main = sidepanel = form = subject = editor = null;
                priorityOverlay = sections = currentSignature = null;
            };

            if (app.getState() === app.STATES.DIRTY) {
                require(["io.ox/core/tk/dialogs"], function (dialogs) {
                    new dialogs.ModalDialog()
                        .text(gt("Do you really want to cancel editing this mail?"))
                        .addButton("cancel", gt('Cancel'))
                        .addButton("delete", gt('Lose changes'))
                        .addButton('savedraft', gt('Save as draft'))
                        .show()
                        .done(function (action) {
                            console.debug("Action", action);
                            if (action === 'delete') {
                                def.resolve();
                                clean();
                            } else if (action === 'savedraft') {
                                app.saveDraft().done(function (mail) {
                                    console.log(mail);
                                    def.resolve();
                                    clean();
                                }).fail(function (e) {
                                    def.reject(e);
                                });
                            } else {
                                def.reject();
                            }
                        });
                });
            } else {
                clean();
                def.resolve();
            }

            return def;
        });

        return app;
    }





    var module = {
        getApp: createInstance
    };

    // load user
    return userAPI.get(config.get('identifier'))
        .done(function (sender) {
            // inject 'from'
            defaultSender = ['"' + sender.display_name + '"', sender.email1];
        })
        .pipe(function () {
            return module;
        });
});


