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
     "io.ox/core/extPatterns/links",
     "io.ox/mail/util",
     "io.ox/mail/actions",
     'io.ox/core/tk/view',
     'io.ox/core/tk/model',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'io.ox/mail/util',
     'io.ox/preview/main',
     'io.ox/core/tk/dialogs',
     'io.ox/core/tk/autocomplete',
     'io.ox/core/api/autocomplete',
     'io.ox/core/api/account',
     'io.ox/core/api/snippets',
     'io.ox/core/strings',
     'gettext!io.ox/mail'
    ], function (ext, links, util, actions, View, Model, contactsAPI, contactsUtil, mailUtil, pre, dialogs, autocomplete, AutocompleteAPI, accountAPI, snippetAPI, strings, gt) {

    'use strict';

    // extension points

    var POINT = 'io.ox/mail/write';

    ext.point(POINT + '/toolbar').extend(new links.Button({
        id: 'send',
        index: 100,
        label: gt('Send'),
        cssClasses: 'btn btn-primary',
        ref: POINT + '/actions/send'
    }));

    ext.point(POINT + '/toolbar').extend(new links.Button({
        id: 'draft',
        index: 200,
        label: gt('Save'), // is "Save as draft" but let's keep it short for small devices
        cssClasses: 'btn',
        ref: POINT + '/actions/draft'
    }));

    ext.point(POINT + '/toolbar').extend(new links.Button({
        id: 'discard',
        index: 1000,
        label: gt('Discard'),
        cssClasses: 'btn',
        ref: POINT + '/actions/discard'
    }));

    var contactPictureOptions = { width: 42, height: 42, scaleType: 'contain' };

    var autocompleteAPI = new AutocompleteAPI({id: 'mailwrite', contacts: true });

    var view = View.extend({

        initialize: function () {
            var self = this;
            this.sections = {};
        },

        focusSection: function (id) {
            this.sections[id].find('input[type!=hidden]').eq(0).focus();
        },

        createSection: function (id, label, show, collapsable) {

            if (label) {
                this.sections[id + 'Label'] = $('<div>')
                    .attr('data-section-label', id)
                    .addClass('io-ox-label')
                    .text(label)
                    .prepend(
                        collapsable ?
                            $('<a>', { href: '#', tabindex: '7' })
                            .addClass('collapse').text(gt('Hide'))
                            .on('click', $.preventDefault) :
                            $()
                    );
            } else {
                this.sections[id + 'Label'] = $();
            }

            if (collapsable) {
                this.sections[id + 'Label'].on('click', { id: id }, $.proxy(fnHideSection, this));
            } else {
                this.sections[id + 'Label'].css('cursor', 'default');
            }

            this.sections[id] = $('<div>').addClass('section').attr('data-section', id);

            if (show === false) {
                this.sections[id + 'Label'].hide();
                this.sections[id].hide();
            }

            return { label: $(this.sections[id + 'Label']), section: this.sections[id] };
        },

        addSection: function (id, label, show, collapsable) {
            this.createSection(id, label, show, collapsable);
            this.scrollpane.append(this.sections[id + 'Label'], this.sections[id]);
            return this.sections[id];
        },

        showSection: function (id, focus) {
            var secLabel = this.sections[id + 'Label'],
                secLink = this.sections[id + 'Link'],
                sec = this.sections[id];
            if (secLabel) {
                secLabel.show();
            }
            if (sec) {
                sec.show().trigger('show');
                if (focus !== false) {
                    this.focusSection(id);
                }
            }
            if (secLink) {
                secLink.hide();
            }
        },

        hideSection: function (id, node) {
            this.sections[id + 'Label'].add(this.sections[id]).hide();
            $(node).trigger('hide');
            this.sections[id + 'Link'].show();
        },

        createLink: function (id, label) {
            return (this.sections[id + 'Link'] = $('<div>'))
                .addClass('section-link')
                .append(
                    $('<a>', { href: '#', tabindex: '7' })
                    .attr('data-section-link', id)
                    .text(label)
                    .on('click', { id: id }, $.proxy(fnShowSection, this))
                );
        },

        addLink: function (id, label) {
            return this.createLink(id, label).appendTo(this.scrollpane);
        },

        applyHighPriority: function (flag) {
            if (flag) {
                this.priorityOverlay.addClass('high');
            } else {
                this.priorityOverlay.removeClass('high');
            }
        },

        createUpload: (function () {

            var change = function (e) {
                handleFileSelect(e, this);
            };

            return function () {

                var inputOptions = Modernizr.file && 'FormData' in window ?
                    { type: 'file', name: 'file_' + (this.fileCount++), multiple: 'multiple', tabindex: '2' } :
                    { type: 'file', name: 'file_' + (this.fileCount++), tabindex: '2' };

                return $('<div class="section-item upload">').append(
                    $('<input>', inputOptions).on('change', $.proxy(change, this))
                );
            };

        }()),

        createField: function (id) {

            var self = this, node = self.app.getWindowNode();

            return $('<div class="fieldset">').append(
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
                    var option = $('<option>').text(_.noI18n(util.formatSender(obj.personal, obj.primary_address)));

                    option.data({
                        primaryaddress: obj.primary_address,
                        displayname: obj.personal
                    });
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

            var self = this, app = self.app, buttons;

            /*
             * LEFTSIDE
             */

            // side panel
            this.leftside = $('<div class="leftside io-ox-mail-write-sidepanel">');
            this.scrollpane = this.leftside.scrollable();

            // title
            this.scrollpane.append(
                $('<h1 class="title">').text('\u00A0')
            );

            // sections

            // TO
            this.addSection('to').append(
                this.createRecipientList('to'),
                this.createField('to')
                    .find('input').attr('placeholder', gt.format('%1$s ...', gt('To'))).placeholder().end()
            );

            // CC
            this.addSection('cc', gt('Copy to'), false, true)
                .append(this.createRecipientList('cc'))
                .append(this.createField('cc'));
            this.addLink('cc', gt('Copy (CC) to'));

            // BCC
            this.addSection('bcc', gt('Blind copy to'), false, true)
                .append(this.createRecipientList('bcc'))
                .append(this.createField('bcc'));
            this.addLink('bcc', gt('Blind copy (BCC) to'));

            // Attachments (unless we're on iOS)
            if (!_.browser.iOS) {
                this.fileCount = 0;
                var uploadSection = this.createSection('attachments', gt('Attachments'), false, true);
                this.scrollpane.append(
                    $('<form class="oldschool">').append(
                        this.createLink('attachments', gt('Attachments')),
                        uploadSection.label,
                        uploadSection.section.append(
                            this.createUpload()
                        )
                    )
                );
                // add preview side-popup
                new dialogs.SidePopup().delegate(this.sections.attachments, '.attachment-preview', previewAttachment);
            }

            // Signatures
            (function () {
                var signatureNode = self.addSection('signatures', gt('Signatures'), false, true);

                function fnDrawSignatures() {
                    snippetAPI.getAll('signature').done(function (signatures) {
                        self.signatures = signatures;
                        signatureNode.empty();
                        signatureNode.append(
                            _(signatures.concat(dummySignature))
                            .inject(function (memo, o, index) {
                                var preview = (o.content || '')
                                    .replace(/\s\s+/g, ' ') // remove subsequent white-space
                                    .replace(/(\W\W\W)\W+/g, '$1 '); // reduce special char sequences
                                preview = preview.length > 150 ? preview.substr(0, 150) + ' ...' : preview;
                                return memo.add(
                                    $('<div>').addClass('section-item pointer')
                                    .addClass(index >= signatures.length ? 'signature-remove' : '')
                                    .append(
                                        $('<a>', { href: '#', tabindex: '7' })
                                        .on('click dragstart', $.preventDefault)
                                        .text(o.displayname)
                                    )
                                    .append(
                                        preview.length ?
                                            $('<div>').addClass('signature-preview')
                                            .text(_.noI18n(' ' + preview)) :
                                            $()
                                    )
                                    .on('click', { index: index }, function (e) {
                                        e.preventDefault();
                                        app.setSignature(e);
                                    })
                                );
                            }, $(), self)
                        );
                        if (signatures.length === 0) {
                            self.sections.signaturesLink.hide();
                        } else {
                            self.sections.signaturesLink.show();
                        }

                    });
                }

                self.addLink('signatures', gt('Signatures'));

                fnDrawSignatures();
                snippetAPI.on('refresh.all', fnDrawSignatures);
                signatureNode.on('dispose', function () {
                    snippetAPI.off('refresh.all', fnDrawSignatures);
                });

            }());



            // FROM
            this.addSection('from', gt('From'), false, true)
                .append(this.createSenderField());

            accountAPI.all().done(function (array) {
                if (array[1]) {
                    self.addLink('from', gt('Sender'));
                }
            });

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
                    // Attach vCard
                    $('<div>').addClass('section-item')
                    .css({ paddingTop: '1em', paddingBottom: '1em' })
                    .append(createCheckbox('vcard', gt('Attach vCard')))
                );

            this.addLink('options', gt('More'));

            var fnChangeFormat = function (e) {
                e.preventDefault();
                app.setFormat(e.data.format).done(function () {
                    app.getEditor().focus();
                });
            };

            if (!Modernizr.touch) {
                this.addSection('format', gt('Text format'), true, false)
                    .append(
                        $('<div>').addClass('change-format').append(
                            $('<a>', { href: '#' }).text(gt('Text')).on('click', { format: 'text' }, fnChangeFormat),
                            $.txt(_.noI18n(' \u00A0\u2013\u00A0 ')), // &ndash;
                            $('<a>', { href: '#' }).text(gt('HTML')).on('click', { format: 'html' }, fnChangeFormat)
                        )
                    );
            }

            /*
             * RIGHTSIDE
             */

            this.rightside = $('<div class="rightside">');

            ext.point(POINT + '/toolbar').invoke(
                'draw', buttons = $('<div class="inline-buttons top">'), ext.Baton({ app: app })
            );

            this.rightside.append(
                // buttons
                buttons,
                // subject field
                $('<div>').css('position', 'relative').append(
                    $('<div>').addClass('subject-wrapper')
                    .append(
                        // subject
                        $.labelize(
                            this.subject = $('<input>')
                            .attr({
                                type: 'text',
                                name: 'subject',
                                tabindex: '3',
                                placeholder: gt('Subject'),
                                autocomplete: 'off'
                            })
                            .addClass('subject')
                            .val('')
                            .placeholder()
                            .on('keydown', function (e) {
                                if (e.which === 13 || (e.which === 9 && !e.shiftKey)) {
                                    // auto jump to editor on enter/tab
                                    e.preventDefault();
                                    app.getEditor().focus();
                                }
                            })
                            .on('keyup', function () {
                                var title = _.noI18n($.trim($(this).val()));
                                app.setTitle(title);
                            }),
                            'mail_subject'
                        )
                    ),
                    // priority
                    this.priorityOverlay = $('<div>').addClass('priority-overlay')
                        .attr('title', 'Priority')
                        .text(_.noI18n('\u2605\u2605\u2605'))
                        .on('click', $.proxy(togglePriority, this))
                ),
                // editor container
                $('<div class="abs editor-outer-container">').append(
                    // white background
                    $('<div>').addClass('abs editor-background'),
                    // editor's print margin
                    $('<div>').addClass('abs editor-print-margin'),
                    // inner div
                    $('<div>').addClass('abs editor-inner-container')
                    .css('overflow', 'hidden')
                    .append(
                        // text editor
                        // FIXME: Labelize Call?
                        this.textarea = $('<textarea>')
                        .attr({ name: 'content', tabindex: '4', disabled: 'disabled' })
                        .addClass('text-editor')
                    )
                )
            );
        }
    });

    var dummySignature = { displayname: gt('No signature') };
    var handleFileSelect, addUpload, supportsPreview, previewAttachment, createPreview;

    supportsPreview = function (file) {
        // is not local?
        if (file.message) {
            return new pre.Preview({ mimetype: 'message/rfc822' }).supportsPreview();
        } else {
            return window.FileReader && (/^image\/(png|gif|jpe?g|bmp)$/i).test(file.type);
        }
    };

    previewAttachment = function (popup, e, target) {

        e.preventDefault();

        var file = target.data('file'), message = file.message, preview, reader;

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
                popup.append($('<div>').text(_.noI18n('\u00A0')));
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
    };

    createPreview = function (file) {
        return $('<a href="#" class="attachment-preview">').data('file', file).text(gt('Preview'));
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
                size = size !== undefined ? gt.format('%1$s\u00A0 ', strings.fileSize(size)) : '';
                // draw
                view.sections.attachments.append(
                    $('<div>').addClass('section-item file').append(
                        // filename
                        $('<div class="row-1">').text(_.noI18n(file.filename || file.name || '')),
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
                            $('<div>').addClass('icon').text(_.noI18n('\u00D7')) // 00D7 = &times;
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

        view.sections.attachments.append(
            view.createUpload()
        );
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

        var url = contactsUtil.getImage(data.data, contactPictureOptions);

        node.addClass('io-ox-mail-write-contact').append(
            $('<div class="contact-image">').css('backgroundImage', 'url(' + url + ')'),
            $('<div class="person-link ellipsis">').text(_.noI18n(data.display_name + '\u00A0')),
            $('<div class="ellipsis">').text(_.noI18n(data.email))
        );
    }

    // drawAutoCompleteItem and drawContact
    // are slightly different. it's easier just having two functions.

    function drawContact(id, node, data) {

        node.addClass('io-ox-mail-write-contact section-item').append(
            // picture
            contactsAPI.getPicture(data.email + '', contactPictureOptions).addClass('contact-image'),
            // hidden field
            $('<input>', { type: 'hidden', name: id, value: serialize(data) }),
            // display name
            $('<div>').append(
                $('<a href="#" class="halo-link">')
                .data({
                    display_name: data.display_name,
                    email1: data.email
                })
                .text(_.noI18n(data.display_name + '\u00A0'))
            ),
            // email address
            $('<div>').text(_.noI18n(String(data.email || '').toLowerCase())),
            // remove
            $('<a>', { href: '#', tabindex: '6' })
                .addClass('remove')
                .append(
                    $('<div>').addClass('icon').text(_.noI18n('\u00D7')) // &times;
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

    // function clickRadio(e) {
    //     var node = $(this).parent();
    //     node.prop('selected', !node.prop('selected')).trigger('change'); // selected, not checked!
    // }

    function createRadio(name, value, text, isChecked) {
        var label, radio;
        radio = $('<input>', { type: 'radio', name: name, value: value, tabindex: '7' });
        label = $('<label class="radio">').append(
            radio, $.txt(_.noI18n('\u00A0\u00A0')), text, $.txt(_.noI18n('\u00A0\u00A0\u00A0\u00A0 '))
        );
        if (isChecked) {
            radio.attr('checked', 'checked');
        }
        // if (Modernizr.touch) {
        //     label.on('click', clickRadio);
        // }
        return label;
    }

    // function clickCheckbox(e) {
    //     var node = $(this).parent();
    //     node.prop('selected', !node.prop('selected')).trigger('change'); // selected, not checked!
    // }

    function createCheckbox(name, text, isChecked) {
        var label, box;
        box = $('<input>', { type: 'checkbox', name: name, value: '1', tabindex: '7' });
        label = $('<label class="checkbox">').append(
            box, $.txt(_.noI18n('\u00A0\u00A0')), text, $.txt(_.noI18n('\u00A0\u00A0\u00A0\u00A0 '))
        );
        if (isChecked) {
            box.attr('checked', 'checked');
        }
        // if (Modernizr.touch) {
        //     label.on('click', clickCheckbox);
        // }
        return label;
    }

    return view;
});
