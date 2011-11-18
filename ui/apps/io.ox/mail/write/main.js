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

    ext.point('io.ox/mail/write/links/toolbar').extend(new ext.Link({
        index: 100,
        id: 'send',
        label: 'Send',
        ref: 'io.ox/mail/write/actions/send',
        customize: function () {
            this.css('width', '70px').addClass('default-action');
        }
    }));

    // multi instance pattern
    function createInstance() {

        var app, win,
            main, sidepanel,
            GRID_WIDTH = 310,
            subject,
            editor,
            sections = {};

        app = ox.ui.createApp({
            title: 'Compose'
        });

        function sendMail() {
            alert("Coming soon...");
        }

        app.setLauncher(function () {

            win = ox.ui.createWindow({
                name: 'io.ox/mail/write',
                title: '',
                titleWidth: '0px',
                toolbar: true
            });
            app.setWindow(win);
            win.setQuitOnClose(true);

            // main panel
            main = $('<div/>')
            .addClass('reverse leftside')
            .css({
                right: GRID_WIDTH + 'px'
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
                            .attr({ type: 'text', name: "subject", tabindex: '1' })
                            .addClass('subject')
                        )
                    )
                )
                .append(
                    $('<div/>')
                    .addClass('abs editor-container')
                    .append(
                        // text editor
                        editor = $('<textarea>')
                        .attr({ tabindex: '3' })
                        .addClass('text-editor')
                    )
                )
            );

            function addSection(id, label, show) {
                sidepanel.append(
                    sections[id + 'Label'] = $('<div>')
                    .addClass('label')
                    .text(label + '')
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

            function createLink(id, label) {
                return $('<div>')
                .append(
                    $('<a>')
                    .attr({ href: '#', tabindex: '5' })
                    .text(label + '')
                    .on('click', function (e) {
                        e.preventDefault();
                        sections[id + 'Label'].show();
                        sections[id].show();
                        sections[id].find('input').focus();
                        $(this).parent().remove();
                    })
                );
            }

            var fnClickPerson = function (e) {
                ext.point('io.ox/core/person:action').each(function (ext) {
                    _.call(ext.action, e.data, e);
                });
            };

            function drawAutoCompleteItem(node, data) {
                node.addClass('io-ox-mail-write-contact')
                    .append(
                        $('<div>').addClass('contact-image')
                        .css('backgroundImage', 'url(' + contactsUtil.getImage(data.contact) + ')')
                    )
                    .append(
                        $('<div>').addClass('person-link')
                        .text(data.display_name + "\u00a0")
                    )
                    .append($('<div>').text(data.email));
            }

            // drawAutoCompleteItem and drawContact
            // are slightly different. it's easier just having two functions.

            function drawContact(node, data) {

                node.addClass('io-ox-mail-write-contact')
                    .append(
                        contactsAPI.getPicture(data.email + "")
                        .addClass('contact-image')
                    )
                    .append(
                        $('<div>').addClass('person-link')
                        .text(data.display_name + "\u00a0")
                    )
                    .append($('<div>').text(data.email))
                    .on('click', { data: data.contact }, fnClickPerson);
            }

            function createRecipientList(id) {
                return (sections[id + 'List'] = $('<div>'))
                    .addClass('recipient-list').hide();
            }

            function addRecipients(id, list) {
                // loop over list and draw recipient
                _(list).each(function (recipient) {
                    var node = $('<div>');
                    drawContact(node, {
                        display_name: recipient[0],
                        email: recipient[1],
                        contact: {}
                    });
                    // add to proper section (to, CC, ...)
                    sections[id + 'List']
                        .append(node.addClass('list-item'))
                        .show();
                });
            }

            function createField(id) {
                return $('<div>')
                .addClass('fieldset')
                .append(
                    $('<input>')
                    .attr({ type: 'text', tabindex: '2' })
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
                        }
                    })
                    .on('focus', function (e) {
                        $(this).next().show();
                    })
                    .on('blur', function (e) {
                        $(this).next().hide();
                    })
                    .on('keyup', { id: id }, function (e) {
                        if (e.which === 13) {
                            addRecipients(
                                e.data.id,
                                mailUtil.parseRecipients($(this).val())
                            );
                            $(this).val('');
                        }
                    })
                )
                .append(
                    $('<div>').addClass('tooltip')
                    .text('Press enter to add recipient').hide()
                );
            }

            function createRadio(name, value, text, isChecked) {
                var id = name + "_" + value + "_" + _.now(),
                    radio = $('<input>', { type: 'radio', name: name, id: id, value: value, tabindex: '2' }),
                    label = $('<label>', { 'for': id }).text("\u00A0" + text + "\u00A0");
                if (isChecked) {
                    radio.attr('checked', 'checked');
                }
                return radio.add(label);
            }

            function createCheckbox(name, text, isChecked) {
                var id = name + "_" + _.now(),
                    box = $('<input>', { type: 'checkbox', name: name, id: id, value: '1', tabindex: '2' }),
                    label = $('<label>', { 'for': id }).text("\u00A0" + text + "\u00A0");
                if (isChecked) {
                    box.attr('checked', 'checked');
                }
                return box.add(label);
            }

            // side panel
            sidepanel = $('<div/>')
                .css({ width: (GRID_WIDTH - 13) + 'px' })
                .addClass('reverse rightside io-ox-mail-write-sidepanel');

            // sections

            // TO
            addSection('to', 'To')
                .append(createField('to'))
                .append(createRecipientList('to'));

            // CC
            addSection('cc', 'Copy / CC', false)
                .append(createField('cc'))
                .append(createRecipientList('cc'));

            // BCC
            addSection('bcc', 'Blind Copy / BCC', false)
                .append(createField('bcc'))
                .append(createRecipientList('bcc'));

            // Attachments
            addSection('attachments', 'Attachments', false)
                .append(
                    // File upload
                    $('<div>').addClass('section-item')
                    .text("Under construction")
                );

            // Options
            addSection('options', 'Options', false)
                .append(
                    // Priority
                    $('<div>').addClass('section-item')
                    .append(
                        $('<div>').addClass('group-label').text('Priority')
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
            var signatures = config.get('gui.mail.signatures', []);
            if (signatures.length) {
                addSection('signatures', 'Signatures', false)
                    .append(
                        _(signatures).inject(function (memo, o) {
                            return memo.add(
                                    $('<div>').addClass('section-item')
                                    .append(
                                        $('<a>', { href: '#', tabindex: '2' })
                                        .text(o.signature_name)
                                        .on('click', false)
                                    )
                                );
                        }, $())
                    );
            }

            sidepanel.append(
                $('<div>')
                .addClass('links')
                .css({ lineHeight: '1.3333em' })
                .append(createLink('cc', 'Show copy'))
                .append(createLink('bcc', 'Show blind copy'))
                .append(createLink('attachments', 'Show attachments'))
                .append(createLink('options', 'Show options'))
                .append(signatures.length ? createLink('signatures', 'Show signatures') : $())
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
                    var w = editor.outerWidth() - 12;
                    editor.css('paddingRight', Math.max(10, w - 650) + 'px');
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
                    subject.focus().select();
                });
            });
        });

        app.send = function () {
            alert("Coming soon ...");
        };

        return app;
    }

    return {
        getApp: createInstance
    };

});
