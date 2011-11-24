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

define('io.ox/mail/write/main',
    ['io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/mail/write/textile',
     'io.ox/core/extensions',
     'io.ox/core/config',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'io.ox/core/i18n',
     'io.ox/core/tk/upload',
     'io.ox/core/tk/autocomplete',
     'css!io.ox/mail/style.css',
     'css!io.ox/mail/write/style.css'], function (mailAPI, mailUtil, textile, ext, config, contactsAPI, contactsUtil, i18n, upload) {

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
    ext.point('io.ox/mail/write/links/toolbar').extend(new ext.Link({
        index: 200,
        id: 'proofread',
        label: 'Proofread',
        ref: 'io.ox/mail/write/actions/proofread'
    }));

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
            currentSignature,
            ids = {};

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
                .text(data.display_name + "\u00a0")
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
                .text(data.display_name + "\u00a0")
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
                label = $('<label>', { 'for': id }).text("\u00A0" + text + "\u00A0\u00A0");
            if (isChecked) {
                radio.attr('checked', 'checked');
            }
            return radio.add(label);
        }

        function createCheckbox(name, text, isChecked) {
            var id = name + '_' + _.now(),
                box = $('<input>', { type: 'checkbox', name: name, id: id, value: '1', tabindex: '5' }),
                label = $('<label>', { 'for': id }).text("\u00A0" + text + "\u00A0\u00A0");
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
            return $($.txt(" \u2013 ")) // ndash
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
                    editor.val(val + "\n" + text);
                    // scroll to bottom
                    editor.scrollTop(editor.get(0).scrollHeight);
                    // remember current signature
                    currentSignature = "\n" + text;
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
                            .text("\u2605\u2605\u2605")
                            .on('click', togglePriority)
                    )
                    .append(
                        $('<div>').addClass('sendbutton-wrapper')
                        .append(
                            // send
                            $('<a>', { href: '#', tabindex: '8' })
                            .addClass('button default-action sendbutton')
                            .text('Send')
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
                        .append(
                            // text editor
                            editor = $('<textarea>')
                            .attr({ tabindex: '4', name: 'content' })
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
            addSection('attachments', 'Attachments', true, true);
            addUpload();
            addLink('attachments', 'Attachments').hide();

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
                    .append(createCheckbox('receipt', 'Delivery Receipt'))
                )
                .append(
                    // Attach vCard
                    $('<div>').addClass('section-item')
                    .append(createCheckbox('vcard', 'Attach vCard'))
                );

            addLink('options', 'Show further options');

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

            var adjustEditorMargin = (function () {
                // trick to force document reflow
                var alt = false;
                return _.debounce(function () {
                    var w = Math.max(10, editor.outerWidth() - 12 - 650);
                    editor.css('paddingRight', w + 'px');
                    editorPrintMargin.css('right', Math.max(0, w - 10) + 'px');
                    // force reflow
                    editor.css('display', (alt = !alt) ? 'block' : '');
                }, 100);
            }());

            var dropZone = upload.dnd.createDropZone();
            dropZone.bind('drop', function (file) {
                form.find('input[type=file]').last()
                    .prop('file', file)
                    .trigger('change');
                showSection('attachments');
            });

            win.bind('show', function () {
                adjustEditorMargin();
                $(window).on('resize', adjustEditorMargin);
                dropZone.include();
            });

            win.bind('hide', function () {
                $(window).off('resize', adjustEditorMargin);
                dropZone.remove();
            });
        });

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
                editor.val("\n\n" + (pos === 'above' ? text + "\n\n" + str : str + "\n\n" + text));
                currentSignature = "\n" + text;
            } else {
                // no signature
                editor.val("\n" + str);
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
                        $('input[data-type=to]').focus().select();
                    });
            });
        };

        /**
         * Proof read view
         */
        app.proofread = function () {
            alert('Coming soon ...');
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
                files = [];
            // transform raw data
            mail = {
                from: '',
                to: [].concat(data.to).join(', '),
                cc: [].concat(data.cc).join(', '),
                bcc: [].concat(data.bcc).join(', '),
                subject: data.subject + '',
                priority: data.priority,
                vcard: data.vcard || '0',
                disp_notification_to: data.deliveryReceipt || '0',
                attachments: [{
                    content_type: 'text/plain',
                    content: (data.content + '')
                        .replace(/</g, '&lt;') // escape <
                        .replace(/\n/g, "<br>\n") // escape line-breaks
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

        return app;
    }

    return {
        getApp: createInstance
    };

});
