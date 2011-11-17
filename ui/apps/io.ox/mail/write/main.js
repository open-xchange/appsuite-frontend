/**
 *
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
 *
 */

define('io.ox/mail/write/main',
    ['io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/mail/write/textile',
     'io.ox/core/extensions',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'io.ox/core/tk/autocomplete',
     'css!io.ox/mail/style.css',
     'css!io.ox/mail/write/style.css'], function (mailAPI, mailUtil, textile, ext, contactsAPI, contactsUtil) {

    'use strict';

//    // actions
//    ext.point('io.ox/mail/write/actions/send').extend({
//        id: 'send',
//        action: function (app) {
//            app.send();
//        }
//    });
//    ext.point('io.ox/mail/write/links/toolbar').extend(new ext.Link({
//        index: 100,
//        id: 'send',
//        label: 'Send',
//        ref: 'io.ox/mail/write/actions/send'
//    }));
//    // add 'create' link
//    ext.point('io.ox/mail/write/toolbar').extend(new ext.ToolbarLinks({
//        index: 100,
//        id: 'inline-links',
//        ref: 'io.ox/mail/write/links/toolbar'
//    }));


    // multi instance pattern
    function createInstance() {

        var app, win,
            main, sidepanel,
            GRID_WIDTH = 310,
            subject,
            editor,
            sections = {};

        app = ox.ui.createApp({
            title: 'New E-Mail'
        });

        app.setLauncher(function () {

            win = ox.ui.createWindow({
                name: 'io.ox/mail/write',
                title: ''
            });
            app.setWindow(win);
            win.setQuitOnClose(true);

            // main panel
            main = $('<div/>')
            .addClass('reverse leftside')
            .css({
                right: GRID_WIDTH + 'px'
            });

            function sendMail() {
                alert("jaja ...");
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
                        // send button
                        $.button({ label: 'Send', tabIndex: 4, action: sendMail })
                        .addClass('default-action send-button')
                    )
                    .append(
                        // subject
                        subject = $('<input>')
                        .attr({ type: 'text', tabindex: '1' })
                        .addClass('subject')
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
                    sections[id] = $('<div>')
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

            // side panel
            sidepanel = $('<div/>')
                .css({ width: (GRID_WIDTH - 13) + 'px' })
                .addClass('reverse rightside io-ox-mail-write-sidepanel');

            addSection('to', 'To')
                .append(createField('to'))
                .append(createRecipientList('to'));

            addSection('cc', 'Copy / CC', false)
                .append(createField('cc'))
                .append(createRecipientList('cc'));

            addSection('bcc', 'Blind Copy / BCC', false)
                .append(createField('bcc'))
                .append(createRecipientList('bcc'));

            addSection('attachments', 'Attachments', false);
            addSection('options', 'Options', false);
            addSection('signatures', 'Signatures', false);

            sidepanel.append(
                $('<div>')
                .addClass('links')
                .css({ lineHeight: '1.3333em' })
                .append(createLink('cc', 'Show copy'))
                .append(createLink('bcc', 'Show blind copy'))
                .append(createLink('attachments', 'Show attachments'))
                .append(createLink('options', 'Show options'))
                .append(createLink('signatures', 'Show signatures'))
            );

            // add panels to windows
            win.nodes.main.addClass('io-ox-mail-write')
                .append(main).append(sidepanel);

//            // load example text
//            $.ajax({
//                url: ox.base + '/apps/io.ox/mail/write/example.txt',
//                dataType: 'text'
//            })
//            .done(function (txt) {
//                editor.val(txt).focus();
//                win.show(function () {
//                    subject.focus().select();
//                });
//            });

            win.show(function () {
                subject.focus().select();
            });

        });

        app.send = function () {
            console.log('YEAH.send!', arguments);
        };

        return app;
    }

    return {
        getApp: createInstance
    };

});