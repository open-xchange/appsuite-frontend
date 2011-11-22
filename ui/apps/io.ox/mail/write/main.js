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
     'io.ox/core/tk/autocomplete',
     'css!io.ox/mail/style.css',
     'css!io.ox/mail/write/style.css'], function (mailAPI, mailUtil, textile, ext, config, contactsAPI, contactsUtil) {

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
            state = {},
            ids = {};

        app = ox.ui.createApp({
            title: 'Compose'
        });

        app.setLauncher(function () {

            win = ox.ui.createWindow({
                name: 'io.ox/mail/write',
                title: 'Compose new email',
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
                            .attr({ tabindex: '5', name: 'content' })
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

            function unique(id) {
                return id;// + '[]';// + (ids[id] = (ids[id] || 0) + 1);
            }

            function serialize(obj) {
                return '"' + obj.display_name.replace(/"/g, '\"') + '" <' + obj.email + '>';
            }

            function collapseSection(id) {
                sections[id + 'Label'].add(sections[id]).hide();
                $(this).trigger('hide');
                sections[id + 'Link'].show();
            }

            function fnCollapseSection(e) {
                var id = e.data.id;
                e.preventDefault();
                collapseSection(id);
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
                    sections[id + 'Label'].on('click', { id: id }, fnCollapseSection);
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
                        $('<a>', { href: '#', tabindex: '6' })
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
                    contactsAPI.getPicture(data.email + "")
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
                    sections[id + 'List']
                        .append(node)
                        .show()
                        .trigger('show');
                });
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
                var id = name + "_" + value + "_" + _.now(),
                    radio = $('<input>', { type: 'radio', name: name, id: id, value: value, tabindex: '4' }),
                    label = $('<label>', { 'for': id }).text("\u00A0" + text + "\u00A0\u00A0");
                if (isChecked) {
                    radio.attr('checked', 'checked');
                }
                return radio.add(label);
            }

            function createCheckbox(name, text, isChecked) {
                var id = name + "_" + _.now(),
                    box = $('<input>', { type: 'checkbox', name: name, id: id, value: '1', tabindex: '4' }),
                    label = $('<label>', { 'for': id }).text("\u00A0" + text + "\u00A0\u00A0");
                if (isChecked) {
                    box.attr('checked', 'checked');
                }
                return box.add(label);
            }

            var autoHideSection = (function () {

                var timer = {},

                    clear = function (id) {
                        if (timer[id]) {
                            clearTimeout(timer[id]);
                            timer[id] = null;
                        }
                    },

                    defer = function (id) {
                        clear(id);
                        timer[id] = setTimeout(function () {
                            collapseSection(id);
                            clear(id);
                        }, 3000);
                    },

                    update = function (e) {
                        defer(e.data.id);
                    },

                    onShow = function (e) {
                        defer(e.data.id);
                        $(this).on('focus', 'input, a', { id: e.data.id }, update);
                        $(this).on('mousedown mousemove', { id: e.data.id }, update);
                    },

                    onHide = function (e) {
                        clear(e.data.id);
                        $(this).off('focus', 'input, a', update);
                        $(this).off('mousedown mousemove', update);
                    };

                return function (id) {
                    sections[id]
                        .on('show', { id: id }, onShow)
                        .on('hide', { id: id }, onHide);
                };
            }());

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
            addSection('cc', 'Send copy to', false, true)
                .append(createRecipientList('cc'))
                .append(createField('cc'));
            addLink('cc', 'Send copy (CC) to ...');

            // BCC
            addSection('bcc', 'Send blind copy to', false, true)
                .append(createRecipientList('bcc'))
                .append(createField('bcc'));
            addLink('bcc', 'Send blind copy (BCC) to ...');

            // Attachments

            var handleFileSelect, addUpload;

            handleFileSelect = function (e) {
                _(e.target.files).each(function (file) {
                    sections.attachments.append(
                        $('<div>').addClass('section-item file')
                        .text(file.name)
                    );
                });
                $(this).parent().hide();
                addUpload();
            };

            addUpload = function () {
                sections.attachments.append(
                    $('<div>').addClass('section-item upload')
                    .append(
                        $('<input>', { type: 'file', name: 'upload', multiple: 'multiple' })
                        .on('change', handleFileSelect)
                    )
                );
            };

            addSection('attachments', 'Attachments', true, true);
            addUpload();
            addLink('attachments', 'Attachments').hide();

            // Signatures
            var signatures = config.get('gui.mail.signatures', []),
                dummySignature = { signature_name: 'No signature' };

            function setSignature(e) {

                var index = e.data.index,
                    signature, val, pos, $l, text,
                    top;

                e.preventDefault();

                if (state.signature !== undefined) {
                    // remove current signature from editor
                    val = editor.val();
                    if ((pos = val.indexOf(state.signature)) > -1) {
                        // remove signature
                        $l = state.signature.length;
                        top = editor.scrollTop();
                        editor.val(val.substr(0, pos) + '' + val.substr(pos + $l));
                        editor.scrollTop(top);
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
                        state.signature = "\n" + text;
                    }
                }
            }

            if (signatures.length) {
                addSection('signatures', 'Signatures', false, true)
                    .append(
                        _(signatures.concat(dummySignature))
                            .inject(function (memo, o, index) {
                                var preview = (o.signature_text || "")
                                    .replace(/\s\s+/g, ' ') // remove subsequent white-space
                                    .replace(/(\W\W\W)\W+/g, '$1 '); // reduce special char sequences
                                preview = preview.length > 150 ? preview.substr(0, 150) + ' ...' : preview;
                                return memo.add(
                                        $('<div>').addClass('section-item pointer')
                                        .addClass(index >= signatures.length ? 'signature-remove' : '')
                                        .append(
                                            $('<a>', { href: '#', tabindex: '4' })
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
                //autoHideSection('signatures');
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
            //autoHideSection('options');

            // add panels to windows
            win.nodes.main
            .addClass('io-ox-mail-write')
            .append(
                form = $('<form>', {
                    name: 'compose',
                    method: 'post',
                    enctype: 'multipart/form-data'
                })
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

            win.bind('show', function () {
                adjustEditorMargin();
                $(window).on('resize', adjustEditorMargin);
            });

            win.bind('hide', function () {
                $(window).off('resize', adjustEditorMargin);
            });

//            // load example text
//            $.ajax({
//                url: ox.base + '/apps/io.ox/mail/write/example.txt',
//                dataType: 'text'
//            })
//            .done(function (txt) {
//                win.show(function () {
//                    editor.val(txt);
//                    $('input[name=to]').focus().select();
//                });
//            });

            win.show(function () {
                $('input[data-type=to]').focus().select();
            });
        });

        app.proofread = function () {
            alert("Coming soon ...");
        };

        app.send = function () {
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
                mail;
            // transform raw data
            mail = {
                from: '',
                to: [].concat(data.to).join(', '),
                cc: [].concat(data.cc).join(', '),
                bcc: [].concat(data.bcc).join(', '),
                subject: data.subject + '',
                priority: data.priority,
                vcard: data.vcard || "0",
                disp_notification_to: data.deliveryReceipt || "0",
                attachments: [{
                    content_type: 'text/plain',
                    content: data.content
                }]
            };
            mailAPI.send(mail).always(function (result) {
                alert("Yep. Your mail is sent!");
            });
        };

        return app;
    }

    return {
        getApp: createInstance
    };

});
