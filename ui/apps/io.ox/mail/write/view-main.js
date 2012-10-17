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
     'io.ox/preview/main',
     'io.ox/core/tk/autocomplete',
     'io.ox/core/api/autocomplete',
     'io.ox/core/api/account',
     'io.ox/core/strings',
     'gettext!io.ox/mail'
    ], function (ext, util, actions, View, Model, contactsAPI, contactsUtil, mailUtil, pre, autocomplete, AutocompleteAPI, accountAPI, strings, gt) {

    'use strict';

    var autocompleteAPI = new AutocompleteAPI({id: 'mailwrite', contacts: true });

    var view = View.extend({

        initialize: function () {
            this.signatures = [];
            this.sections = {};
        },

        focusSection: function (id) {
            this.sections[id].find('input[type!=hidden]').eq(0).focus();
        },

        addSection: function (id, label, show, collapsable) {

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
                this.sections[id + 'Label'].on('click', { id: id }, $.proxy(fnHideSection, this));
            } else {
                this.sections[id + 'Label'].css('cursor', 'default');
            }

            this.sections[id] = $('<div>').addClass('section')
                .attr('data-section', id);

            this.sidepanel.append(this.sections[id + 'Label'], this.sections[id]);

            if (show === false) {
                this.sections[id + 'Label'].hide();
                this.sections[id].hide();
            }
            return this.sections[id];
        },

        showSection: function (id, focus) {
            this.sections[id + 'Label'].show();
            this.sections[id].show().trigger('show');
            if (focus !== false) {
                this.focusSection(id);
            }
            this.sections[id + 'Link'].hide();
        },

        hideSection: function (id, node) {
            this.sections[id + 'Label'].add(this.sections[id]).hide();
            $(node).trigger('hide');
            this.sections[id + 'Link'].show();
        },

        addLink: function (id, label) {
            return (this.sections[id + 'Link'] = $('<div>'))
                .addClass('section-link')
                .append(
                    $('<a>', { href: '#', tabindex: '5' })
                    .attr('data-section-link', id)
                    .text(label + '')
                    .on('click', { id: id }, $.proxy(fnShowSection, this))
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

            var self = this, node = self.app.getWindowNode();

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
                            return autocompleteAPI.search(query)
                                .pipe(function (data) {
                                    // remove duplicates
                                    var hash = {};
                                    node.find('input[name=' + id + ']').map(function () {
                                        var rcpt = mailUtil.parseRecipient($(this).val())[1];
                                        hash[rcpt] = true;
                                    });
                                    return _(data).filter(function (o) {
                                        return hash[o.email] === undefined;
                                    });
                                });
                            /*return contactsAPI.autocomplete(query)
                                .pipe(function (data) {
                                    // remove duplicates
                                    var hash = {};
                                    node.find('input[name=' + id + ']').map(function () {
                                        var rcpt = mailUtil.parseRecipient($(this).val())[1];
                                        hash[rcpt] = true;
                                    });
                                    return _(data).filter(function (o) {
                                        return hash[o.email] === undefined;
                                    });
                                });*/
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
                            copyRecipients.call(self, id, $(this), e);
                        },
                        blur: function (e) {
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

        createSenderField: function () {
            var node = $('<div>').addClass('fromselect-wrapper')
                    .append($('<select>').css('width', '100%'));
            accountAPI.all().done(function (array) {
                var select = node.find('select');
                _.each(array, function (obj, index) {
                    var display_name = obj.personal || obj.primary_address,
                        value = obj.primary_address + '|' + display_name,
                        option = $('<option>', { 'data-displayname': display_name, value: value })
                            .text(obj.primary_address);
                    if (index === 0) {
                        option.attr('selected', 'selected');
                    }
                    select.append(option);
                });
            });
            return node;
        },

        createRecipientList: function (id) {
            return (this.sections[id + 'List'] = $('<div>'))
                .addClass('recipient-list').hide();
        },

        addRecipients: function (id, list) {
            // loop over list and draw recipient
            _(list).each(function (recipient) {
                var node = $('<div>');
                drawContact(id, node, {
                    display_name: recipient[0] ? recipient[0].replace(/^('|")|('|")$/g, '') : recipient[1],
                    email: recipient[1],
                    contact: {}
                });
                // add to proper section (to, CC, ...)
                this.sections[id + 'List'].append(node);
            }, this);
            if (list && list.length) {
                this.sections[id + 'List'].show().trigger('show');
            }
        },

        render: function () {

            var self = this, app = self.app;

            // main panel
            this.main = $('<div>')
                .addClass('rightside');

            this.main.append(
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
                                this.subject = $('<input>')
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
                        this.priorityOverlay = $('<div>').addClass('priority-overlay')
                            .attr('title', 'Priority')
                            .text('\u2605\u2605\u2605')
                            .on('click', $.proxy(togglePriority, this))
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
                            this.textarea = $('<textarea>')
                            .attr({ name: 'content', tabindex: '4', disabled: 'disabled' })
                            .addClass('text-editor')
                        )
                    )
                )
            );

            // side panel
            this.scrollpane = $('<div>')
                .addClass('leftside io-ox-mail-write-sidepanel');

            this.sidepanel = this.scrollpane.scrollable();

            // sections

            // TO
            this.addSection('to', gt('To'))
                .append(this.createRecipientList('to'))
                .append(this.createField('to'));

            // CC
            this.addSection('cc', gt('Copy to'), false, true)
                .append(this.createRecipientList('cc'))
                .append(this.createField('cc'));
            this.addLink('cc', gt('Copy (CC) to ...'));

            // BCC
            this.addSection('bcc', gt('Blind copy to'), false, true)
                .append(this.createRecipientList('bcc'))
                .append(this.createField('bcc'));
            this.addLink('bcc', gt('Blind copy (BCC) to ...'));

         // FROM
            this.addSection('from', gt('From'), false, true)
            .append(this.createSenderField());
            this.addLink('from', gt('From'));

            // Attachments
            this.addSection('attachments', gt('Attachments'), false, true);
            this.addUpload();
            this.addLink('attachments', gt('Attachments'));

            // Signatures
            if (this.signatures.length) {
                this.addSection('signatures', gt('Signatures'), false, true)
                .append(
                    _(this.signatures.concat(dummySignature))
                    .inject(function (memo, o, index) {
                        var preview = (o.signature_text || '')
                            .replace(/\s\s+/g, ' ') // remove subsequent white-space
                            .replace(/(\W\W\W)\W+/g, '$1 '); // reduce special char sequences
                        preview = preview.length > 150 ? preview.substr(0, 150) + ' ...' : preview;
                        return memo.add(
                            $('<div>').addClass('section-item pointer')
                            .addClass(index >= this.signatures.length ? 'signature-remove' : '')
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
                    }, $(), this)
                );

                this.addLink('signatures', gt('Signatures'));
            }

            // Options
            this.addSection('options', gt('Options'), false, true)
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
                        if (radio.val() === '1' && radio.prop('checked')) {
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

            this.addLink('options', gt('More ...'));

            var fnChangeFormat = function (e) {
                e.preventDefault();
                app.setFormat(e.data.format).done(function () {
                    app.getEditor().focus();
                });
            };

            if (!Modernizr.touch) {
                this.addSection('format', gt('Text format'), true, false)
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

    var handleFileSelect, addUpload, supportsPreview, createPreview;

    supportsPreview = function (file) {
        // is not local?
        if (file.message) {
            return new pre.Preview({ mimetype: 'message/rfc822' }).supportsPreview();
        } else {
            return window.FileReader && (/^image\/(png|gif|jpe?g|bmp)$/i).test(file.type);
        }
    };

    createPreview = function (file) {
        return $('<a>', { href: '#' })
            .text(gt('Preview'))
            .on('click', { file: file }, function (e) {
                e.preventDefault();
                // open side popup
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.SidePopup().show(e, function (popup) {
                        var file = e.data.file, message = file.message, preview, reader;
                        // nested message?
                        if (message) {
                            preview = new pre.Preview({
                                    data: { nested_message: message },
                                    mimetype: 'message/rfc822'
                                }, {
                                    width: popup.parent().width(),
                                    height: 'auto'
                                });
                            if (preview.supportsPreview()) {
                                preview.appendTo(popup);
                                popup.append($('<div>').text('\u00A0'));
                            }
                        } else {
                            // inject image as data-url
                            reader = new FileReader();
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
                            reader.readAsDataURL(file);
                        }
                    });
                });
            });
    };

    function round(num, digits) {
        // TODO: add localization (. vs ,)
        digits = digits || 0;
        var pow = Math.pow(10, digits);
        return Math.round(num * pow) / pow;
    }

    handleFileSelect = function (e, view) {

        // look for linked attachments or dropped files
        var target = $(e.currentTarget),
            item = target.prop('attachment') || target.prop('file') || target.prop('nested'),
            list = item ? [item] : e.target.files;

        if (list.length) {
            // loop over all attachments
            _(list).each(function (file) {
                // get size
                var size = file.size || file.file_size;
                size = size !== undefined ? strings.fileSize(size) + '\u00A0 ' :
                                            '';
                // draw
                view.sections.attachments.append(
                    $('<div>').addClass('section-item file').append(
                        // filename
                        $('<div class="row-1">').text(file.filename || file.name || ''),
                        // filesize / preview
                        $('<div class="row-2">').append(
                            // filesize
                            $('<span>').addClass('filesize').text(size),
                            // preview?
                            supportsPreview(file) ? createPreview(file) : $(),
                            // nbsp
                            $.txt('\u00A0')
                        ),
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

    function fnHideSection(e) {
        var id = e.data.id;
        e.preventDefault();
        this.hideSection(id, e.target);
    }

    function fnShowSection(e) {
        var id = e.data.id;
        e.preventDefault();
        this.showSection(id, e.target);
    }

    function togglePriority() {
        var high = this.form.find('input[name=priority][value=1]'),
            normal = this.form.find('input[name=priority][value=3]');
        if (high.prop('checked')) {
            high.prop('checked', false);
            normal.prop('checked', true);
            this.applyHighPriority(false);
        } else {
            high.prop('checked', true);
            normal.prop('checked', false);
            this.applyHighPriority(true);
        }
    }

    function createStringOfRecipients(distlistarray) {
        var string;
        _.each(distlistarray, function (val) {
            if (string === '') {
                string = '"' + val.display_name + '"' + '<' + val.mail + '>';
            } else {
                string = string + ', "' + val.display_name + '"' + '<' + val.mail + '>';
            }
        });
        return string;
    }

    function copyRecipients(id, node, e) {
        var valBase;
        if (e && e.data.distlistarray !== null) {
            valBase = createStringOfRecipients(e.data.distlistarray);
        }
         else {
            valBase = node.val();
        }
        var list = mailUtil.parseRecipients(valBase);
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
            url = contactsUtil.getImage(data.data),
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

        node.addClass('io-ox-mail-write-contact section-item').append(
            // picture
            contactsAPI.getPicture(data.email + '').addClass('contact-image'),
            // hidden field
            $('<input>', { type: 'hidden', name: id, value: serialize(data) }),
            // display name
            $('<div>').append(
                $('<a>', { href: '#' }).addClass('person-link')
                .text(data.display_name + '\u00A0')
                .on('click', {
                    display_name: data.display_name,
                    email1: data.email
                }, fnClickPerson)
            ),
            // email address
            $('<div>').text(String(data.email || '').toLowerCase()),
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
        // display_name might be null!
        return obj.display_name ?
             '"' + obj.display_name.replace(/"/g, '\"') + '" <' + obj.email + '>' : '<' + obj.email + '>';
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

    return view;
});
