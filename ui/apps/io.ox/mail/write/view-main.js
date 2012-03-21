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
 * @author Martin Holzhauer <martin.holzhauer@open-xchange.com>
 */

define("io.ox/mail/write/view-main",
    ["io.ox/core/extensions",
     "io.ox/mail/util",
     "io.ox/mail/actions",
     'io.ox/core/tk/view',
     'io.ox/core/tk/model',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'io.ox/mail/util',
     'io.ox/core/i18n',
     'gettext!io.ox/mail/mail'
    ], function (ext, util, actions, View, Model, contactsAPI, contactsUtil, mailUtil, i18n, gt) {

    'use strict';
    var app;

    var theView = View.extend({
        focusSection: function (id) {
            this.sections[id].find('input[type!=hidden]').eq(0).focus();
        },
        addSection: function (id, label, show, collapsable) {
            var self = this;
            this.sections[id + 'Label'] = $('<div>')
                .attr('data-section-label', id)
                .addClass('io-ox-label')
                .text(label + '')
                .prepend(
                    collapsable ?
                        $('<a>', { href: '#', tabindex: '7' })
                        .addClass('collapse').text(gt('Hide'))
                        .on('click', $.preventDefault) :
                        $()
                );

            if (collapsable) {
                this.sections[id + 'Label'].on('click', { id: id }, function (e) { fnHideSection(e, self); });
            } else {
                this.sections[id + 'Label'].css('cursor', 'default');
            }

            this.sections[id] = $('<div>').addClass('section')
                .attr('data-section', id);

            this.sidepanel.append(this.sections[id + 'Label']).append(this.sections[id]);

            if (show === false) {
                this.sections[id + 'Label'].hide();
                this.sections[id].hide();
            }
            return this.sections[id];
        },
        showSection: function (id, self) {
            this.sections[id + 'Label'].show();
            this.sections[id].show().trigger('show');
            this.focusSection(id);
            this.sections[id + 'Link'].hide();
        },
        hideSection: function (id, self) {
            this.sections[id + 'Label'].add(this.sections[id]).hide();
            $(self).trigger('hide');
            this.sections[id + 'Link'].show();
        },
        addLink: function (id, label) {
            var self = this;
            return (this.sections[id + 'Link'] = $('<div>'))
                .addClass('section-link')
                .append(
                    $('<a>', { href: '#', tabindex: '5' })
                    .attr('data-section-link', id)
                    .text(label + '')
                    .on('click', { id: id }, function (e) { fnShowSection(e, self); })
                )
                .appendTo(this.sidepanel);
        },
        applyHighPriority: function (flag) {
            if (flag) {
                this.priorityOverlay.addClass('high');
            } else {
                this.priorityOverlay.removeClass('high');
            }
        },
        addUpload: function () {
            var inputOptions, self = this;

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
                        .on('change', function (e) { handleFileSelect(e, self); }),
                        'mail_attachment'
                    )
                )
                .appendTo(self.sections.attachments);
        },

        createField: function (id) {
            var self = this;

            return $('<div>')
            .addClass('fieldset')
            .append(
                $('<label>', { 'for' : 'writer_field_' + id })
                .addClass('wrapping-label')
                .append(
                    $('<input>', {
                        type: 'text',
                        tabindex: '2',
                        id: 'writer_field_' + id
                    })
                    .attr('data-type', id) // not name=id!
                    .addClass('discreet')
                    .autocomplete({
                        source: function (query) {
                            return contactsAPI.autocomplete(query)
                                .pipe(function (data) {
                                    // remove duplicates
                                    var hash = {};
                                    $('input[name=' + id + ']').map(function () {
                                        var rcpt = mailUtil.parseRecipient($(this).val())[1];
                                        hash[rcpt] = true;
                                    });
                                    return _(data).filter(function (o) {
                                        return hash[o.email] === undefined;
                                    });
                                });
                        },
                        stringify: function (data) {
                            return data.display_name ?
                                '"' + data.display_name + '" <' + data.email + '>' :
                                data.email;
                        },
                        draw: function (data, query) {
                            drawAutoCompleteItem.call(null, this, data, query);
                        },
                        click: function (e) {
                            copyRecipients.call(self, id, $(this));
                        },
                        blur: function (e) {
                            // copy valid recipients
                            copyRecipients.call(self, id, $(this));
                        }
                    })
                    .on('keyup', function (e) {
                        if (e.which === 13) {
                            copyRecipients.call(self, id, $(this));
                        } else {
                            // look for special prefixes
                            var val = $(this).val();
                            if ((/^to:?\s/i).test(val)) {
                                $(this).val('');
                                self.showSection('to');
                            } else if ((/^cc:?\s/i).test(val)) {
                                $(this).val('');
                                self.showSection('cc');
                            } else if ((/^bcc:?\s/i).test(val)) {
                                $(this).val('');
                                self.showSection('bcc');
                            }
                        }
                    })
                )
            );
        },

        createRecipientList: function (id) {
            return (this.sections[id + 'List'] = $('<div>'))
                .addClass('recipient-list').hide();
        },

        addRecipients: function (id, list) {
            var self = this;
            // loop over list and draw recipient
            _(list).each(function (recipient) {
                var node = $('<div>');
                drawContact(id, node, {
                    display_name: recipient[0] ? recipient[0].replace(/^('|")|('|")$/g, '') : recipient[0],
                    email: recipient[1],
                    contact: {}
                });
                // add to proper section (to, CC, ...)
                self.sections[id + 'List'].append(node);
            });
            if (list && list.length) {
                self.sections[id + 'List'].show().trigger('show');
            }
        },

        render: function (theApp) {
            var self = this;
            app = theApp;

            // main panel
            self.main = $('<div>')
            .addClass('rightside')
            .css({
                left: self.GRID_WIDTH + 'px'
            });

            self.main.append(
                $('<div>')
                .addClass('abs io-ox-mail-write-main')
                .append(
                    $('<div>').addClass('io-ox-label').text(gt('Subject'))
                )
                .append(
                    $('<div>')
                    .css('position', 'relative')
                    .append(
                        $('<div>').addClass('subject-wrapper')
                        .append(
                            // subject
                            $.labelize(
                                self.subject = $('<input>')
                                .attr({ type: 'text', name: 'subject', tabindex: '3', autocomplete: 'off' })
                                .addClass('subject')
                                .val('')
                                .on('keydown', function (e) {
                                    if (e.which === 13 || (e.which === 9 && !e.shiftKey)) {
                                        // auto jump to editor on enter/tab
                                        e.preventDefault();
                                        app.getEditor().focus();
                                    }
                                })
                                .on('keyup', function () {
                                    var title = $.trim($(this).val());
                                    app.getWindow().setTitle(title);
                                    app.setTitle(title);
                                }),
                                'mail_subject'
                            )
                        )
                    )
                    .append(
                        self.priorityOverlay = $('<div>').addClass('priority-overlay')
                            .attr('title', 'Priority')
                            .text('\u2605\u2605\u2605')
                            .on('click', function (e) { togglePriority(e, self); })
                    )
                    .append(
                        // split button
                        $('<div>').addClass('btn-group sendbutton-wrapper')
                        .append(
                            // send
                            $('<a>', { href: '#', tabindex: '8' })
                            .addClass('btn btn-primary')
                            .css('width', '100px')
                            .text(gt('Send'))
                            .on('click', function (e) {
                                e.preventDefault();
                                ext.point('io.ox/mail/write/actions/send').invoke('action', null, app);
                            })
                            .button()
                        )
                        .append(
                            $('<a>', { href: '#', tabindex: '9' })
                            .attr('data-toggle', 'dropdown')
                            .addClass('btn btn-primary dropdown-toggle')
                            .append(
                                $('<span>').addClass("caret")
                            )
                            .button()
                        )
                        .append(
                            $('<ul>').addClass('dropdown-menu dropdown-right')
                            .append(
                                $('<li>').append(
                                    $('<a>', { href: '#' })
                                    .text(gt('Save as draft'))
                                    .on('click', function (e) {
                                        e.preventDefault();
                                        ext.point('io.ox/mail/write/actions/draft').invoke('action', null, app);
                                    })
                                )
                            )
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
                            // FIXME: Labelize Call?
                            self.textarea = $('<textarea>')
                            .attr({ name: 'content', tabindex: '4', disabled: 'disabled' })
                            .addClass('text-editor')
                        )
                    )
                )
            ).append($('<div>', {id: 'myGrowl'}).addClass('jGrowl').css({position: 'absolute', right: '0', top: '0'}));




            // side panel
            self.scrollpane = $('<div>')
                .css({ width: (self.GRID_WIDTH - 26) + 'px' })
                .addClass('leftside io-ox-mail-write-sidepanel');

            self.sidepanel = self.scrollpane.scrollable();

            // sections

            // TO
            self.addSection('to', gt('To'))
                .append(self.createRecipientList('to'))
                .append(self.createField('to'));

            // CC
            self.addSection('cc', gt('Copy to'), false, true)
                .append(self.createRecipientList('cc'))
                .append(self.createField('cc'));
            self.addLink('cc', gt('Copy (CC) to ...'));

            // BCC
            self.addSection('bcc', gt('Blind copy to'), false, true)
                .append(self.createRecipientList('bcc'))
                .append(self.createField('bcc'));
            self.addLink('bcc', gt('Blind copy (BCC) to ...'));

            // Attachments
            self.addSection('attachments', gt('Attachments'), false, true);
            self.addUpload();
            self.addLink('attachments', gt('Attachments'));

            // Signatures
            if (self.signatures.length) {
                self.addSection('signatures', gt('Signatures'), false, true)
                .append(
                    _(self.signatures.concat(dummySignature))
                    .inject(function (memo, o, index) {
                        var preview = (o.signature_text || '')
                            .replace(/\s\s+/g, ' ') // remove subsequent white-space
                            .replace(/(\W\W\W)\W+/g, '$1 '); // reduce special char sequences
                        preview = preview.length > 150 ? preview.substr(0, 150) + ' ...' : preview;
                        return memo.add(
                            $('<div>').addClass('section-item pointer')
                            .addClass(index >= self.signatures.length ? 'signature-remove' : '')
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
                            .on('click', { index: index }, function (e) {
                                e.preventDefault();
                                app.setSignature(e);
                            })
                        );
                    }, $())
                );

                self.addLink('signatures', gt('Signatures'));
            }

            // Options
            self.addSection('options', gt('Options'), false, true)
                .append(
                    // Priority
                    $('<div>').addClass('section-item')
                    .css({ paddingTop: '0.5em', paddingBottom: '0.5em' })
                    .append(
                        $('<span>').addClass('group-label').text(gt('Priority'))
                    )
                    .append(createRadio('priority', '1', gt('High')))
                    .append(createRadio('priority', '3', gt('Normal'), true))
                    .append(createRadio('priority', '5', gt('Low')))
                    .on('change', 'input', function () {
                        var radio = $(this);
                        if (radio.attr('value') === '1' && radio.prop('checked')) {
                            self.applyHighPriority(true);
                        } else {
                            self.applyHighPriority(false);
                        }
                    })
                )
                .append(
                    // Delivery Receipt
                    $('<div>').addClass('section-item')
                    .css({ paddingTop: '1em', paddingBottom: '1em' })
                    .append(createCheckbox('receipt', gt('Delivery Receipt')))
                )
                .append(
                    // Attach vCard
                    $('<div>').addClass('section-item')
                    .css({ paddingTop: '1em', paddingBottom: '1em' })
                    .append(createCheckbox('vcard', gt('Attach vCard')))
                );

            self.addLink('options', gt('More ...'));

            var fnChangeFormat = function (e) {
                e.preventDefault();
                app.setFormat(e.data.format).done(function () {
                    app.getEditor().focus();
                });
            };

            if (!Modernizr.touch) {
                self.addSection('format', gt('Text format'), true, false)
                    .append(
                        $('<div>').addClass('change-format')
                        .append(
                            $('<a>', { href: '#' }).text(gt('Text')).on('click', { format: 'text' }, fnChangeFormat)
                        )
                        .append($.txt(' \u00A0\u2013\u00A0 ')) // &ndash;
                        .append(
                            $('<a>', { href: '#' }).text(gt('HTML')).on('click', { format: 'html' }, fnChangeFormat)
                        )
                    );
            }

        }
    });

    var dummySignature = { signature_name: gt('No signature') };

    theView.prototype.sections = {};
    theView.prototype.form = null;
    theView.prototype.main = null;
    theView.prototype.priorityOverlay = null;
    theView.prototype.scrollpane = null;
    theView.prototype.sidepanel = null;
    theView.prototype.subject = null;
    theView.prototype.textarea = null;
    theView.prototype.GRID_WIDTH = 330;
    theView.prototype.signatures = {};


    var handleFileSelect, addUpload, supportsPreview, createPreview;

    supportsPreview = function (file) {
        return window.FileReader &&
            (/^image\/(png|gif|jpe?g|bmp)$/i).test(file.type);
    };

    createPreview = function (file) {
        return $($.txt(' \u2013 ')) // ndash
            .add(
                $('<a>', { href: '#' })
                .text(gt('Preview'))
                .on('click', { file: file }, function (e) {
                    e.preventDefault();
                    // open side popup
                    require(['io.ox/core/tk/dialogs'], function (dialogs) {
                        new dialogs.SidePopup().show(e, function (popup) {
                            // inject image as data-url
                            var reader = new FileReader();
                            reader.onload = function (e) {
                                popup.css({ width: '100%', height: '100%' })
                                .append(
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

    handleFileSelect = function (e, view) {

        if (Modernizr.file) {

            // look for linked attachments or dropped files
            var item = $(e.currentTarget).prop('attachment') || $(e.currentTarget).prop('file'),
                list = item ? [item] : e.target.files;
            // loop over all attachments

            _(list).each(function (file) {
                view.sections.attachments.append(
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
                            $(this).parent().prev().remove();
                            $(this).parent().remove();
                        })
                    )
                );
            });
            // hide current upload field
            $(e.target).closest('.section-item.upload').hide();
        }
        view.addUpload(handleFileSelect);
    };


    function fnHideSection(e, view) {
        var id = e.data.id;
        e.preventDefault();
        view.hideSection(id, e.target);
    }
    function fnShowSection(e, view) {
        var id = e.data.id;
        e.preventDefault();
        view.showSection(id, e.target);
    }

    function togglePriority(e, view) {
        var high = view.form.find('input[name=priority][value=1]'),
            normal = view.form.find('input[name=priority][value=3]');
        if (high.prop('checked')) {
            high.prop('checked', false);
            normal.prop('checked', true);
            view.applyHighPriority(false);
        } else {
            high.prop('checked', true);
            normal.prop('checked', false);
            view.applyHighPriority(true);
        }
    }

    function copyRecipients(id, node) {
        var list = mailUtil.parseRecipients(node.val());
        if (list.length) {
            // add
            this.addRecipients(id, list);
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

    function drawAutoCompleteItem(node, data, query) {

        var img = $('<div>').addClass('contact-image'),
            url = contactsUtil.getImage(data.contact),
            name = highlight(data.display_name, query),
            email = highlight(data.email, query);

        if (Modernizr.backgroundsize) {
            img.css('backgroundImage', 'url(' + url + ')');
        } else {
            img.append(
                $('<img>', { src: url, alt: '' }).css({ width: '100%', height: '100%' })
            );
        }

        node.addClass('io-ox-mail-write-contact').append(
            img,
            $('<div>').addClass('person-link ellipsis').html(name + '\u00A0'),
            $('<div>').addClass('ellipsis').html(email)
        );
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
    // helper

    function serialize(obj) {
        return '"' + obj.display_name.replace(/"/g, '\"') + '" <' + obj.email + '>';
    }

    var fnClickPerson = function (e) {
        e.preventDefault(e);
        ext.point('io.ox/core/person:action').each(function (ext) {
            _.call(ext.action, e.data, e);
        });
    };

    function highlight(text, query) {
        return String(text).replace(/</g, '&lt;')
            .replace(new RegExp(query, 'i'), '<b>' + query + '</b>');
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

    return theView;
});
