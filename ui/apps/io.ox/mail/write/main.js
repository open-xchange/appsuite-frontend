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
        index: 100,
        id: 'send',
        label: 'Send',
        ref: 'io.ox/mail/write/actions/send',
        customize: function () {
            this.css('width', '70px').addClass('default-action');
        }
    }));

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
            subject,
            editor,
            editorPrintMargin,
            sections = {},
            state = {};

        app = ox.ui.createApp({
            title: 'Compose'
        });

        function sendMail() {
            alert("Coming soon...");
        }

        app.setLauncher(function () {

            win = ox.ui.createWindow({
                name: 'io.ox/mail/write',
                title: '', //Compose new email',
                titleWidth: '0px', //GRID_WIDTH + 'px',
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
                            .attr({ tabindex: '4' })
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

            function collapseSection(e) {
                var id = e.data.id;
                e.preventDefault();
                sections[id + 'Label'].hide();
                sections[id].hide();
                sections[id + 'Link'].show();
            }

            function focusSection(id) {
                sections[id].find('input').eq(0).focus();
            }

            function addSection(id, label, show, collapsable) {
                sidepanel
                    .append(
                        sections[id + 'Label'] = $('<div>')
                        .addClass('label')
                        .text(label + '')
                        .prepend(
                            collapsable ?
                                $('<a>', { href: '#', tabindex: '5' })
                                .addClass('collapse').text('Hide')
                                .on('click', { id: id }, collapseSection) :
                                $()
                        )
                    )
                    .append(
                        sections[id] = $('<div>').addClass('section')
                    );
                if (show === false) {
                    sections[id + 'Label'].hide();
                    sections[id].hide();
                }
                return sections[id];
            }

            function fnClickSectionLink(e) {
                var id = e.data.id;
                e.preventDefault();
                sections[id + 'Label'].show();
                sections[id].show();
                focusSection(id);
                $(this).parent().hide();
            }

            function createLink(id, label) {
                return (sections[id + 'Link'] = $('<div>'))
                    .append(
                        $('<a>', { href: '#', tabindex: '5' })
                        .addClass('section-link')
                        .text(label + '')
                        .on('click', { id: id }, fnClickSectionLink)
                    );
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
                    $('<a>', { href: '#', tabindex: '5' })
                    .addClass('remove')
                    .append(
                        $('<div>').addClass('icon').text('x')
                    )
                    .on('click', { id: id }, function (e) {
                        e.preventDefault();
                        $(this).parent().remove();
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
                        .show();
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
                    $('<input>', { type: 'text', name: id, tabindex: '2' })
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
//                    .on('focus', function (e) {
//                        $(this).next().show();
//                    })
//                    .on('blur', function (e) {
//                        $(this).next().hide();
//                    })
                    .on('keyup', function (e) {
                        if (e.which === 13) {
                            copyRecipients.call(null, id, $(this));
                        }
                    })
                );
//                .append(
//                    $('<div>').addClass('tooltip')
//                    .text('Press enter to add recipient').hide()
//                );
            }

            function createRadio(name, value, text, isChecked) {
                var id = name + "_" + value + "_" + _.now(),
                    radio = $('<input>', { type: 'radio', name: name, id: id, value: value, tabindex: '5' }),
                    label = $('<label>', { 'for': id }).text("\u00A0" + text + "\u00A0\u00A0");
                if (isChecked) {
                    radio.attr('checked', 'checked');
                }
                return radio.add(label);
            }

            function createCheckbox(name, text, isChecked) {
                var id = name + "_" + _.now(),
                    box = $('<input>', { type: 'checkbox', name: name, id: id, value: '1', tabindex: '5' }),
                    label = $('<label>', { 'for': id }).text("\u00A0" + text + "\u00A0\u00A0");
                if (isChecked) {
                    box.attr('checked', 'checked');
                }
                return box.add(label);
            }

            // side panel
            sidepanel = $('<div/>')
                .css({ width: (GRID_WIDTH - 26) + 'px' })
                .addClass('leftside io-ox-mail-write-sidepanel');

            // sections

            // TO
            addSection('to', 'To')
                .append(createField('to'))
                .append(createRecipientList('to'));

            // CC
            addSection('cc', 'Copy', false, true)
                .append(createField('cc'))
                .append(createRecipientList('cc'));

            // BCC
            addSection('bcc', 'Blind Copy', false, true)
                .append(createField('bcc'))
                .append(createRecipientList('bcc'));

            // Attachments
            addSection('attachments', 'Attachments', false, true)
                .append(
                    // File upload
                    $('<div>').addClass('section-item')
                    .text("Under construction")
                );

            // Options
            addSection('options', 'Options', false, true)
                .append(
                    // Priority
                    $('<div>').addClass('section-item')
                    .append(
                        $('<span>').addClass('group-label').text('Priority')
                    )
                    .append(createRadio('priority', 'high', 'High'))
                    .append(createRadio('priority', 'normal', 'Normal', true))
                    .append(createRadio('priority', 'low', 'Low'))
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
                if (index > 0) {
                    signature = signatures[index - 1];
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
                        _([dummySignature].concat(signatures))
                            .inject(function (memo, o, index) {
                                var preview = (o.signature_text || "")
                                    .replace(/\s\s+/g, ' ') // remove subsequent white-space
                                    .replace(/(\W\W\W)\W+/g, '$1 '); // reduce special char sequences
                                preview = preview.length > 150 ? preview.substr(0, 150) + ' ...' : preview;
                                return memo.add(
                                        $('<div>').addClass('section-item pointer')
                                        .append(
                                            $('<a>', { href: '#', tabindex: '2' })
                                            .on('click', $.preventDefault)
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
            }

            sidepanel.append(
                $('<div>')
                .addClass('links')
                .append(createLink('cc', 'Show copy'))
                .append(createLink('bcc', 'Show blind copy'))
                .append(createLink('attachments', 'Add attachment'))
                .append(createLink('options', 'Show options'))
                .append(signatures.length ? createLink('signatures', 'Change signature') : $())
            );

            // add panels to windows
            win.nodes.main.addClass('io-ox-mail-write')
                .append(
                    $('<form name="compose">')
                    .append(main).append(sidepanel)
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

            // load example text
            $.ajax({
                url: ox.base + '/apps/io.ox/mail/write/example.txt',
                dataType: 'text'
            })
            .done(function (txt) {
                win.show(function () {
                    editor.val(txt);
                    $('input[name=to]').focus().select();
                });
            });
        });

        app.send = app.proofread = function () {
            alert("Coming soon ...");
        };

        return app;
    }

    return {
        getApp: createInstance
    };

});
