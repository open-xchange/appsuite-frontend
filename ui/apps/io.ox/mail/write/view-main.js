/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Martin Holzhauer <martin.holzhauer@open-xchange.com>
 */

define('io.ox/mail/write/view-main',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/mail/actions',
     'io.ox/mail/api',
     'io.ox/core/tk/view',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'io.ox/mail/util',
     'io.ox/core/capabilities',
     'io.ox/core/tk/autocomplete',
     'io.ox/core/api/autocomplete',
     'io.ox/core/api/account',
     'io.ox/core/api/snippets',
     'io.ox/core/util',
     'io.ox/core/notifications',
     'io.ox/mail/sender',
     'io.ox/core/tk/attachments',
     'settings!io.ox/mail',
     'gettext!io.ox/mail'
    ], function (ext, links, actions, mailAPI, ViewClass, contactsAPI, contactsUtil, mailUtil, capabilities, autocomplete, AutocompleteAPI, accountAPI, snippetAPI, util, notifications, sender, attachments, settings, gt) {

    'use strict';

    // extension points

    var POINT = 'io.ox/mail/write';

    ext.point(POINT + '/toolbar').extend(new links.Button({
        id: 'send',
        index: 100,
        label: gt('Send'),
        cssClasses: 'btn btn-primary',
        ref: POINT + '/actions/send',
        tabIndex: '6'
    }));

    ext.point(POINT + '/toolbar').extend(new links.Button({
        id: 'draft',
        index: 200,
        // is 'Save as draft' but let's keep it short for small devices
        label: gt('Save'),
        cssClasses: 'btn btn-default',
        ref: POINT + '/actions/draft',
        tabIndex: '6'
    }));

    ext.point(POINT + '/toolbar').extend(new links.Button({
        id: 'discard',
        index: 1000,
        label: gt('Discard'),
        cssClasses: 'btn btn-default',
        ref: POINT + '/actions/discard',
        tabIndex: '6'
    }));

    /*
     * extension point for mobile toolbar on the bottom of the page
     */
    ext.point(POINT +  '/bottomToolbar').extend({
        id: 'toolbar',
        index: 100,
        draw: function (ref) {
            var node = $(this.app.attributes.window.nodes.body),
                toolbar = $('<div class="app-bottom-toolbar">');

            // disable the button
            ext.point(POINT + '/toolbar').disable('draft');

            //invoke other buttons with new container
            ext.point(POINT + '/toolbar').invoke(
                'draw', toolbar, ext.Baton({ app: this.app })
            );

            node.append(toolbar);
            // pass reference around for later use
            ref.buttons = toolbar;
        }

    });

    var contactPictureOptions = { width: 42, height: 42, scaleType: 'contain' };

    var autocompleteAPI = new AutocompleteAPI({ id: 'mailwrite', contacts: true, msisdn: true });

    var View = ViewClass.extend({

        initialize: function (app) {
            this.sections = {};
            this.baton = ext.Baton({
                app: app,
                //files preview
                view: this
            });
        },

        destroy: function () {
            ViewClass.prototype.destroy.call(this);
            // too many internal references!
            this.sections = this.app = null;
            this.baton = this.baton.app = this.baton.view = null;
            this.scrollpane = this.rightside = this.leftside = this.editor = this.emoji = null;
            this.priorityOverlay = this.subject = this.spacer = null;
            this.textarea = this.form = this.emojiview = this.signatures = null;
        },

        createLink: function (id, label, show) {

            return (this.sections[id + 'Link'] = $('<div>'))
                .addClass('section-link')
                .append(
                    $('<a>', { href: '#', tabindex: '7', role: 'button' })
                    .attr({
                        'data-section-link': id,
                        'aria-label': (!show ? gt('open') : gt('close')) + ' ' + label,
                        'aria-expanded': !!show
                    })
                    .data('label', label)
                    .text(label)
                    .prepend($('<i class="fa fa-caret-' + (show ? 'down' : 'right') + '" aria-hidden="true">'))
                    .on('click', { id: id }, $.proxy(this.fnToggleSection, this))
                );
        },

        createSection: function (id, show, label) {
            this.sections[id] = $('<div>').addClass('section').attr('data-section', id);
            if (label) {
                this.sections[id].append(
                    $('<span>')
                        .text(label)
                        .attr('data-section-label', id)
                        .addClass('io-ox-label')
                );
            }
            if (show === false) {
                this.sections[id].hide();
            }
            return this.sections[id];
        },

        addSection: function (id, show, label, collapsible) {
            if (collapsible) {
                this.scrollpane.append(this.createLink(id, label, show));
                label = null;
            }
            this.scrollpane.append(this.createSection(id, show, label));
            return this.sections[id];
        },

        showSection: function (id, focus) {
            if (this.sections[id]) {
                this.sections[id].show().trigger('show');
                if (focus !== false && _.device('!smartphone')) {
                    this.sections[id].find('input[type!=hidden], select').eq(0).focus();
                }
            }
        },

        hideSection: function (id, node) {
            this.sections[id].hide();
            $(node).trigger('hide');
        },

        fnToggleSection: function(e) {
            e.preventDefault();
            var id = e.data.id,
                link = this.sections[id + 'Link'].find('a');
                link.find('i').toggleClass('fa-caret-down fa-caret-right');
            if (this.sections[id].is(':visible')) {
                link.attr({
                    'aria-label': gt('open') + ' ' + link.data('label'),
                    'aria-expanded': false
                });
                this.hideSection(id, e.target);
            } else {
                link.attr({
                    'aria-label': gt('close') + ' ' + link.data('label'),
                    'aria-expanded': true
                });
                this.showSection(id, e.target);
            }
        },

        createField: function (id, label) {

            var self = this, node = self.app.getWindowNode();

            return $('<div class="fieldset">').append(
                $('<label>', { 'for' : 'writer_field_' + id })
                .addClass('wrapping-label')
                .append(
                    $('<input type="text" class="discreet" data-ime="inactive">')
                    .attr({
                        tabindex: (id === 'to' ? '2' : '7'),
                        id: 'writer_field_' + id,
                        // not name=id!
                        'data-type': id
                    })
                    .autocomplete({
                        api: autocompleteAPI,
                        reduce: function (data) {
                            var hash = {},
                                list;
                            // remove duplicates
                            node.find('input[name=' + id + ']').map(function () {
                                var rcpt = mailUtil.parseRecipient($(this).val())[1];
                                hash[rcpt] = true;
                            });
                            list = _(data).filter(function (o) {
                                return o.email !== '' ? hash[o.email] === undefined : hash[mailUtil.cleanupPhone(o.phone)] === undefined;
                            });

                            //return number of query hits and the filtered list
                            return { list: list, hits: data.length };
                        },
                        stringify: function (data) {
                            var name = contactsUtil.getMailFullName(data),
                                address = data.email || data.phone || '';
                            return name ? '"' + name + '" <' + address + '>' : address;
                        },
                        draw: function (data) {
                            ext.point(POINT + '/autoCompleteItem').invoke('draw', this, ext.Baton({ data: data }));
                        },
                        click: function (e) {
                            copyRecipients.call(self, id, $(this), e);
                        },
                        blur: function (e) {
                            copyRecipients.call(self, id, $(this), e);
                        }
                    })
                    .on({
                        // IME support (e.g. for Japanese)
                        compositionstart: function () {
                            $(this).attr('data-ime', 'active');
                        },
                        compositionend: function () {
                            $(this).attr('data-ime', 'inactive');
                        },
                        keydown: function (e) {
                            if (e.which === 13 && $(this).attr('data-ime') !== 'active') {
                                copyRecipients.call(self, id, $(this), e);
                            }
                        },
                        // shortcuts (to/cc/bcc)
                        keyup: function (e) {
                            if (e.which === 13) return;
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
                    }),
                    label ? $('<span class="sr-only">').text(label) : $()
                )
            );
        },

        createSenderField: function () {
            var node,
                select,
                guid = _.uniqueId('form-control-label-'),
                node = $('<div class="fromselect-wrapper">').append(
                    $('<label class="wrapping-label">').attr('for', guid).text(gt('From')),
                    select = $('<select class="sender-dropdown form-control" name="from" tabindex="7">').attr('id', guid).css('width', '100%')
                );

            sender.drawOptions(select);

            return node;
        },

        createReplyToField: function () {
            //TODO: once this is mapped to jslob, use settings here (key should be showReplyTo)
            if (settings.get('showReplyTo/configurable', true) !== true) {
                return;
            }
            return $('<div>').addClass('fieldset').append(
                $('<label>', {'for': 'writer_field_replyTo'})
                .addClass('wrapping-label').text(gt('Reply to')),
                $('<input>',
                    {'type' : 'text',
                     'id' : 'writer_field_replyTo',
                     'name' : 'replyTo'
                    })
                .addClass('discreet')
                .autocomplete({
                    source: function (val) {
                        return autocompleteAPI.search(val).then(function (autocomplete_result) {
                            return accountAPI.getAllSenderAddresses().then(function (result) {
                                result = result.filter(function (elem) {
                                    return elem[0].indexOf(val) >= 0 || elem[1].indexOf(val) >= 0;
                                });
                                return { list: result.concat(autocomplete_result), hits: result.length };
                            });
                        });
                    },
                    draw: function (data) {
                        ext.point(POINT + '/autoCompleteItem').invoke('draw', this, ext.Baton({ data: data }));
                    },
                    reduce: function (data) {
                        data.list = _(data.list).map(function (elem) {
                            return elem.type === 'contact' ? elem : {data: {}, display_name: elem[0], email: elem[1]};
                        });
                        return data;
                    },
                    stringify: function (data) {
                        return mailUtil.formatSender(data.display_name, data.email);
                    }
                })
            );
        },

        createRecipientList: function (id) {
            return (this.sections[id + 'List'] = $('<div>'))
                .addClass('recipient-list').hide();
        },

       /**
        * appends recipient nodes
        *
        * @param {string} id defines section (f.e. 'cc')
        * @param {array} list contains recipient objects
        * @return {void}
        */
        addRecipients: function (id, list) {

            if (!list || !list.length) return;

            // get current recipients
            var recipients = this.app.getRecipients(id),
                maximum = settings.get('maximumNumberOfRecipients', 0),
                hash = {};

            // too many recipients?
            if (maximum > 0 && (recipients.length + list.length) > maximum) {
                notifications.yell('info',
                    //#. Mail compose. Maximum number of recipients exceeded
                    //#. %1$s = maximum
                    gt('The number of recipients is limited to %1$s recipients per field', maximum)
                );
                return;
            }

            list = getNormalized(list);

            // hash current recipients
            this.app.getWindowNode().find('input[name=' + id + ']').map(function () {
                var rcpt = mailUtil.parseRecipient($(this).val())[1];
                hash[rcpt] = true;
            });

            // ignore doublets and draw remaining
            list = _(list).filter(function (recipient) {
                if (hash[recipient.email] === undefined && hash[mailUtil.cleanupPhone(recipient.phone)] === undefined) {
                    //draw recipient
                    var node = $('<div>'), value;
                    ext.point(POINT + '/contactItem').invoke('draw', node,
                        ext.Baton({ id: id, data: recipient, app: this.app }));
                    // add to proper section (to, CC, ...)
                    this.sections[id + 'List'].append(node);
                    // if list itself contains doublets
                    value = recipient.email !== '' ? recipient.email : mailUtil.cleanupPhone(recipient.phone);
                    return hash[value] = true;
                }
            }, this);

            this.sections[id + 'List'].show().trigger('show');
        },

        /**
         * inserts an UNICODE to the textarea which will be replaced by a nice native
         * icon on mobile devices.
         * @param  {[type]} e [description]
         * @return {[type]}   [description]
         */
        onInsertEmoji: function (e) {

            e.preventDefault();

            var icon = $(e.target).data('icon'),
                content = this.editor.val(),
                caret = parseInt($(this.editor).attr('caretPosition'), 10);

            this.emoji.recent(icon.unicode);

            // string insert
            function insert(index, text, emoji) {
                if (index > 0) {
                    return text.substring(0, index) + emoji + text.substring(index, text.length);
                } else {
                    return emoji + text;
                }
            }

            this.editor
                .val(insert(caret, content, icon.unicode))
                .attr('caretPosition', caret + icon.unicode.length);

            /* disabled emoji input on subject at the moment */

            // insert unicode and increse caret position manually
            /*if (this.editor.attr('emojifocus') === 'true') {
                this.editor
                    .val(insert(caret, content, icon.unicode))
                    .attr('caretPosition', caret + 2);
            } else {
                this.subject
                    .val(insert(subjectCaret, this.subject.val(), icon.unicode))
                    .attr('caretPosition', subjectCaret + 2);
            }*/

        },
        /**
         * needs to be fixed, does not work properly
         * @return {[type]} [description]
         */
        scrollEmoji: function () {
            var self = this,
                top = self.textarea.attr('offsettop') || 0,
                caretPos = self.textarea.textareaHelper('caretPos').top;

            // wait for keyboard to hide
            setTimeout(function () {
                self.app.attributes.window.nodes.main.scrollTop(parseFloat(top + caretPos + 210));
            }, 350);
        },
        /**
         * shows a emoji palette for mobile devices to use
         * with plain text editor
         * @return {[type]} [description]
         */
        showEmojiPalette: function () {
            var self = this;
            return function () {
                var tab = _.device('smartphone'),
                    innerContainer = self.rightside.find('.editor-inner-container');
                if (self.emojiview === undefined) {
                    ox.load(['io.ox/core/emoji/view']).done(function (EmojiView) {
                        self.emojiview = new EmojiView({ editor: self.textarea, subject: self.subject, onInsertEmoji: self.onInsertEmoji });
                        var emo = $('<div class="mceEmojiPane">');
                        self.emojiview.setElement(emo);
                        if (tab) {
                            innerContainer.addClass('textarea-shift');
                            // nasty, but position:fixed elements must be in a non-scrollable container to work
                            // properly on iOS
                            $(self.app.attributes.window.nodes.body).append(self.emojiview.$el);
                        } else {
                            $(self.rightside).append(self.emojiview.$el);
                        }

                        self.emojiview.toggle();
                        self.spacer.show();
                        self.scrollEmoji();

                    });
                } else {
                    self.emojiview.toggle();
                    if (self.emojiview.isOpen) {
                        if (tab) {
                            innerContainer.addClass('textarea-shift');
                        }
                        self.spacer.show();
                        self.scrollEmoji();
                    } else {
                        if (tab) {
                            innerContainer.removeClass('textarea-shift');
                        }
                        self.spacer.hide();
                    }
                }

            };
        },

        render: function () {

            var self = this, app = self.app, buttons = {}, emojiMobileSupport = false;

            if (capabilities.has('emoji') && _.device('!desktop')) {
                emojiMobileSupport = true;
            }

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
            this.addSection('to', true, null, false).append(
                this.createRecipientList('to'),
                this.createField('to', gt('To'))
                    .find('input').attr('placeholder', gt.format('%1$s ...', gt('To'))).placeholder().end()
            );

            // CC
            this.addSection('cc', false, gt('Copy (CC) to'), true)
                .append(this.createRecipientList('cc'))
                .append(this.createField('cc', gt('in copy'))
                        .find('input').attr('placeholder', gt.format('%1$s ...', gt('in copy'))).placeholder().end()
                    );

            // BCC
            this.addSection('bcc', false, gt('Blind copy (BCC) to'), true)
                .append(this.createRecipientList('bcc'))
                .append(this.createField('bcc', gt('in blind copy'))
                        .find('input').attr('placeholder', gt.format('%1$s ...', gt('in blind copy'))).placeholder().end()
                    );

            // Attachments
            this.fileCount = 0;
            var uploadSection = this.createSection('attachments', _.device('!smartphone')),
                dndInfo =  $('<div class="alert alert-info">').text(gt('You can drag and drop files from your computer here to add as attachment.'));

            var $inputWrap = attachments.fileUploadWidget({
                    drive: true,
                    tabindex: 7,
                    buttontext: gt('Add Attachment')
                }),
                $input = $inputWrap.find('input[type="file"]'),
                changeHandler = function (e) {
                    // update input reference (esp. for IE10)
                    $input = $inputWrap.find('input[type="file"]');
                    //register rightside node
                    e.preventDefault();
                    if (_.browser.IE !== 9) {
                        var list = [];
                        //fileList to array of files
                        _($input[0].files).each(function (file) {
                            list.push(_.extend(file, {group: 'file'}));
                        });
                        self.baton.fileList.add(list);
                        $input.trigger('reset.fileupload');
                    } else {
                        //IE
                        if ($input.val()) {
                            var file = {
                                name: $input.val().match(/[^\/\\]+$/).toString(),
                                group: 'input',
                                hiddenField: $input
                            };
                            self.baton.fileList.add(file);
                            //hide input field with file
                            $input.addClass('add-attachment').hide();
                            //create new input field
                            $input = $('<input>', { type: 'file', name: 'file' })
                                    .on('change', changeHandler)
                                    .appendTo($input.parent());
                        }
                    }
                };

            $inputWrap.on('change.fileupload', function () {
                //use bubbled event to add fileupload-new again (workaround to add multiple files with IE)
                $(this).find('div[data-provides="fileupload"]').addClass('fileupload-new').removeClass('fileupload-exists');
            });

            $input.on('change', changeHandler);

            $input.on('reset.fileupload', function () {
                $(this).val('');
            });

            $inputWrap.find('button[data-action="addinternal"]').click(function (e) {
                e.preventDefault();
                require(['io.ox/files/filepicker']).done(function (Picker) {
                    var picker = new Picker({
                        // prefix for custom ext. point
                        point: POINT,
                        // filter function
                        filter: function () {
                            return true;
                        },
                        primaryButtonText: gt('Add'),
                        cancelButtonText: gt('Cancel'),
                        header: gt('Add files'),
                        multiselect: true
                    });
                    picker.done(function (files) {
                        app.addFiles(files, 'infostore');
                    });
                });
            });

            this.scrollpane.append(
                $('<form class="oldschool">').append(
                    this.createLink('attachments', gt('Attachments'), true),
                    uploadSection.append(
                        $inputWrap,
                        (_.device('!touch') && (!_.browser.IE || _.browser.IE > 9) ? dndInfo : '')
                    )
                )
            );

            ext.point(POINT + '/filelist').invoke();
            //referenced via baton.fileList
            ext.point(POINT + '/filelist').extend(new attachments.EditableFileList({
                id: 'attachment_list',
                className: 'div',
                preview: true,
                index: 300,
                $el: $('<div>').insertBefore(uploadSection.find('div.form-group:last')),
                registerTo: [self, this.baton],
                ref: POINT + '/filelist/file/customizer'
            }, this.baton), {
                rowClass: 'collapsed'
            });

            // Signatures
            (function () {
                if (_.device('smartphone')) return;

                var signatureNode = self.addSection('signatures', false, gt('Signatures'), true);

                function fnDrawSignatures() {
                    snippetAPI.getAll('signature').done(function (signatures) {
                        self.signatures = signatures;
                        signatureNode.empty();
                        signatureNode.append(
                            _(signatures.concat(dummySignature))
                            .inject(function (memo, o, index) {
                                var preview = _.ellipsis(
                                                mailUtil.signatures.cleanPreview(o.content),
                                                {max: 150}
                                            );
                                return memo.add(
                                    $('<div class="section-item pointer">')
                                    .addClass(index >= signatures.length ? 'signature-remove' : '')
                                    .append(
                                        $('<a href="#" tabindex="7">')
                                        .on('click dragstart', $.preventDefault)
                                        .text(o.displayname)
                                    )
                                    .append(
                                        preview.length ?
                                            $('<div class="signature-preview">')
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

                fnDrawSignatures();
                snippetAPI.on('refresh.all', fnDrawSignatures);
                signatureNode.on('dispose', function () {
                    snippetAPI.off('refresh.all', fnDrawSignatures);
                });

            }());

            // FROM
            this.addSection('sender', true, gt('Sender'), true)
                .append(this.createSenderField())
                .append(this.createReplyToField());

            accountAPI.getAllSenderAddresses().done(function (addresses) {
                if (addresses.length <= 1) {
                    self.hideSection('sender');
                    self.sections.senderLink.hide();
                } else {
                    // show section
                    self.showSection('sender');
                }
            });

            // Options
            this.addSection('options', false, gt('More'), true).append(
                // Priority
                $('<fieldset>').addClass('section-item')
                .css({ paddingTop: '1em', paddingBottom: '0.5em' })
                .append(
                    $('<legend>').addClass('group-label').text(gt('Priority'))
                )
                .append(createRadio('priority', '1', gt('High')))
                .append(createRadio('priority', '3', gt('Normal'), true))
                .append(createRadio('priority', '5', gt('Low')))
                .on('change', 'input', function () {
                    var radio = $(this);
                    if (radio.prop('checked')) self.app.setPriority(radio.val());
                }),
                // Attach vCard
                $('<div>').addClass('section-item')
                .css({ paddingTop: '1em', paddingBottom: '1em' })
                .append(createCheckbox('vcard', gt('Attach my vCard'))),
                // Attach vCard
                $('<div>').addClass('section-item')
                .css({ paddingTop: '1em', paddingBottom: '1em' })
                .append(createCheckbox('disp_notification_to', gt('Request read receipt')))
            );

            if (_.device('!touch')) {
                var format = settings.get('messageFormat', 'html');
                this.addSection('format', true, null , false).append(

                    $('<fieldset class="section-item">').append(
                        $('<legend>').text(gt('Text format')),
                        createRadio('format', 'text', gt('Text'), format === 'text'),
                        createRadio('format', 'html', gt('HTML'), format === 'html' || format === 'alternative')
                    )
                    .css({
                        paddingTop: '1em',
                        paddingBottom: '1em'
                    })
                    .on('change', 'input', function () {
                        var radio = $(this), format = radio.val();
                        app.setFormat(format).done(function () {
                            app.getEditor().focus();
                        });
                    })
                );
            }

            /*
             * EMOJI FOR MOBILE
             */

            this.emojiToggle = function () {
                if (emojiMobileSupport) {
                    this.rightside.addClass('mobile-emoji-shift');
                    return $('<div>').addClass('emoji-icon')
                        .on('click', this.showEmojiPalette());
                } else return $();
            };

            /*
             * RIGHTSIDE
             */

            this.rightside = $('<div class="rightside">');

            // custom toolbar on mobile
            if (_.device('smartphone')) {
                ext.point(POINT + '/bottomToolbar').invoke('draw', this, buttons);
            } else {
                ext.point(POINT + '/toolbar').invoke(
                    'draw', buttons.buttons = $('<div class="inline-buttons top">'), ext.Baton({ app: app })
                );
            }

            /*
             * Editor
             */
            function createEditor() {
                // autogrow function which expands a textarea while typing
                // to prevent overflowing on mobile devices
                var autogrow = function () {
                    var input = $(this),
                        scrollHeight = input[0].scrollHeight,
                        clientHeight = input[0].clientHeight,
                        parentScrollpane = self.form.parent(),
                        paddingTop, paddingBottom, paddingHeight;

                    if (clientHeight < scrollHeight) {
                        paddingTop = parseFloat(input.css('padding-top'));
                        paddingBottom = parseFloat(input.css('padding-bottom'));
                        paddingHeight = paddingTop + paddingBottom;

                        var scroll = (scrollHeight - paddingHeight + 15) - input.height();

                        input.height(scrollHeight - paddingHeight + 15);
                        //keep the scrollposition
                        parentScrollpane.scrollTop(parentScrollpane.scrollTop() + scroll);
                    }
                };

                self.textarea = $('<textarea>')
                    .attr({ name: 'content', tabindex: '4', disabled: 'disabled', caretPosition: '0' })
                    .addClass('text-editor')
                    .addClass(settings.get('useFixedWidthFont') ? 'monospace' : '')
                    .on('keyup click touchend', function () {
                        /* disabled emoji input for subject */
                        //$(this).attr('emojiFocus', 'true');
                        //self.subject.attr('emojiFocus', 'false');
                        if (this.selectionStart === undefined) return;
                        $(this).attr({
                            'caretPosition': this.selectionStart,
                            'offsetTop': $(this).offset().top
                        });
                    });

                if (_.device('!smartphone')) {
                    // standard textarea for desktops
                    return $('<div class="abs editor-outer-container">').append(
                        // white background
                        $('<div>').addClass('abs editor-background'),
                        // inner div
                        $('<div>').addClass('abs editor-inner-container')
                        .css('overflow', 'hidden')
                        .append(self.textarea)
                    );
                } else {
                    // on mobile devices we do not need all the containers and
                    // stuff, just a plain textarea which supports auto-growing on input
                    self.textarea
                        .on('keyup change input paste', autogrow)
                        .on('focus', function () {
                            // do we have emoji support
                            if (emojiMobileSupport) {
                                $(this).attr('emojiFocus', 'true');
                                if (self.emojiview && self.emojiview.isOpen) {

                                    if (self.emojiview.isOpen) {
                                        self.emojiview.toggle();
                                        self.spacer.hide();
                                    } else {
                                        self.emojiview.toggle();
                                        self.spacer.show();
                                        self.scrollEmoji();
                                    }
                                    //android needs special handling here
                                    if (_.device('android')) {
                                        //use timeout because the onscreen keyboard resizes the window
                                        setTimeout(function () {
                                            self.form.parent().scrollTop(self.form.parent().height());
                                        }, 500);

                                        self.textarea.on('blur', function () {
                                            //hide spacer again after onscreen keyboard is closed
                                            self.spacer.hide();
                                        });
                                    } else {
                                        //show spacer to prevent onscreen keyboard from overlapping
                                        self.spacer.show();
                                        self.form.parent().scrollTop(self.form.parent().scrollTop() + self.spacer.height());
                                    }
                                }
                            }

                        });
                    return self.textarea;
                }
            }

            this.rightside.append(
                // buttons
                _.device('!smartphone') ? buttons.buttons: $(),
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
                                placeholder: gt('Subject')
                            })
                            // no padding-right for input fields in IE9
                            // see Bug 27069 - Subject does not scroll properly for long strings in IE9
                            .css('width', function () {
                                return _.device('desktop') && _.browser.IE < 10 ? '85%' : null;
                            })
                            .css('padding-right', function () {
                                return _.device('desktop') && _.browser.IE < 10 ? '5px' : null;
                            })
                            .addClass('subject')
                            .val('')
                            .placeholder()
                            .on('keydown', function (e) {
                                if (e.which === 13 || (e.which === 9 && !e.shiftKey)) {
                                    // auto jump to editor on enter/tab
                                    e.preventDefault();
                                    if (_.device('!smartphone')) app.getEditor().focus();
                                }
                            })
                            .on('keyup', function () {
                                var title = _.noI18n($.trim($(this).val()));
                                if (title.length > 0) {
                                    app.setTitle(title);
                                } else {
                                    app.setTitle(app.getDefaultWindowTitle());
                                }
                            }),
                            /* disabled emoji input for subject field */
                            /*
                            .on('keyup click', function () {
                                // subject has focus
                                $(this).attr('emojiFocus', 'true');
                                $(self.textarea).attr('emojiFocus', 'false');
                                if (this.selectionStart === undefined) return;
                                $(this).attr({
                                    'caretPosition': this.selectionStart,
                                    'offsetTop': $(this).offset().top
                                });
                            })
                            .on('focus', function () {
                                // do we have emoji support
                                if (emojiMobileSupport && self.emojiview && self.emojiview.isOpen) {

                                    if (self.emojiview.isOpen) {
                                        self.emojiview.toggle();
                                        self.spacer.hide();
                                    } else {
                                        self.emojiview.toggle();
                                        self.spacer.show();
                                    }
                                }
                            }),*/
                            'mail_subject'
                        ).append(
                            $('<span class="sr-only">').text(gt('Subject'))
                        )
                    ),
                    // append emojitoggle
                    this.emojiToggle(),
                    // priority
                    this.priorityOverlay = $('<div class="priority-overlay">')
                        .attr('title', 'Priority')
                        .append(
                            $('<i class="fa fa-exclamation">')
                        )
                        .on('click', $.proxy(togglePriority, this))
                ),
                // editor container
                createEditor(),
                this.spacer = $('<div class="spacer">').css('height', '205px')
            );

            // iOS 7 has problems with rotation changes while the keyboard is shown (on iPad)
            // blur to dismiss the keyboard
            // see bug 29386
            // TODO: PLEASE REMOVE THIS UGLY PIECE OF CODE ASA APPLE HAS FIXED THIS BUG
            if (_.browser.ios >= 7 && _.device('medium')) {
                $(this.leftside, this.tightside).on('orientationchange', function () {
                    $('input, textarea', this.leftside).blur();
                    if ('orientation' in window) {
                        if (window.orientation === 0 || window.orientation === 180) {
                            setTimeout(function () {
                                $('body').css('width', window.innerWidth + 1 + 'px');
                                setTimeout(function () {
                                    $('body').removeAttr('style');
                                }, 300);
                            }, 1000);
                        }
                    }
                });
            }

            // prevent dragging of links and text
            $(this.leftside).on('dragstart', 'a, span', function (e) {
                e.preventDefault();
            });
        }
    });

    var dummySignature = { displayname: gt('No signature') };

    function togglePriority() {
        var priority = this.app.getPriority();
        // cycle priorities
        if (priority === 3) {
            this.app.setPriority(1);
        } else if (priority === 1) {
            this.app.setPriority(5);
        } else {
            this.app.setPriority(3);
        }
    }

    function copyRecipients(id, node, e) {

        var valBase, list;

        // normalize data
        if (e && e.data && e.data.distlistarray !== null) {
            // distribution list
            list = _(e.data.distlistarray).map(function (member) {
                return {
                    full_name: member.display_name,
                    display_name: member.display_name,
                    email: member.mail
                };
            });
        } else if (e && e.data && e.data.id) {
            // selected contact list
            list = [e.data];
        } else {
            valBase = node.val();
            list = mailUtil.parseRecipients(valBase);
        }

        if (list.length) {
            // add
            this.addRecipients(id, list);
            // don't refocus on blur
            if (e.type !== 'blur') node.val('').focus();
            //clear the input field
            node.val('');
        } else if ($.trim(node.val()) !== '') {
            // not accepted but has content
            node.prop('disabled', true)
                .css({ border: '1px solid #a00', backgroundColor: '#fee' })
                .delay(600)
                .queue(function () {
                    node.css({ border: '', backgroundColor: '' })
                        .prop('disabled', false)
                        .focus()
                        .dequeue();
                });
        }
    }

   /**
    * returns an array of normalized contact objects (display_name, mail, image1_url, folder_id, id)
    * @author <a href="mailto:frank.paczynski@open-xchange.com">Frank Paczynski</a>
    *
    * @param {array|object} list contacts
    * @return {array} array with contact object
    */
    function getNormalized(list) {

        return list.map(function (elem) {

            // parsed object?
            if (_.isArray(elem)) {
                var channel = mailUtil.getChannel ? mailUtil.getChannel(elem[1]) : 'email',
                    custom = {
                        full_name: elem[0],
                        display_name: elem[0]
                    };
                // email or phone property?
                custom[channel] = elem[1];
                elem = custom;
            }

            if (!elem.full_name && elem.contact) {
                elem.full_name = contactsUtil.getMailFullName(elem.contact);
            }

            var obj = {
                full_name: util.unescapeDisplayName(elem.full_name),
                first_name: elem.first_name || '',
                last_name: elem.last_name || '',
                display_name: util.unescapeDisplayName(elem.full_name || elem.display_name).replace(/"/g, ''),
                // distribution lists just have "mail"
                email: elem.email || elem.mail || '',
                phone: elem.phone || '',
                field: elem.field || '',
                image1_url: elem.image1_url || '',
                folder_id: elem.folder_id || '',
                id: elem.id || ''
            };

            return obj;
        });
    }

    /**
     * mapping for getFieldLabel()
     * @type {object}
     */
    var mapping = {
        telephone_business1: gt('Phone (business)'),
        telephone_business2: gt('Phone (business)'),
        telephone_home1: gt('Phone (private)'),
        telephone_home2: gt('Phone (private)'),
        cellular_telephone1: gt('Mobile'),
        cellular_telephone2: gt('Mobile')
    };

    /**
     * fieldname to fieldlabel
     * @param  {string} field
     * @return {string} label
     */
    function getFieldLabel(field) {
        return mapping[field] || '';
    }

    /*
     * extension point for contact picture
     */
    ext.point(POINT +  '/contactPicture').extend({
        id: 'contactPicture',
        index: 100,
        draw: function (baton) {
            this.append(
                contactsAPI.pictureHalo(
                    $('<div class="contact-image">'),
                    $.extend(baton.data, contactPictureOptions)
                )
            );
        }
    });

    /*
     * extension point for display name
     */
    ext.point(POINT +  '/displayName').extend({
        id: 'displayName',
        index: 100,
        draw: function (baton) {
            this.append(
                util.renderPersonalName(
                    {
                        $el: $('<div class="recipient-name">'),
                        name: contactsUtil.getMailFullName(baton.data)
                    },
                    baton.data
                )
            );
        }
    });

    // /*
    //  * extension point for halo link
    //  */
    ext.point(POINT +  '/emailAddress').extend({
        id: 'emailAddress',
        index: 100,
        draw: function (baton) {
            var data = baton.data;
            if (baton.autocomplete) {
                this.append(
                    $('<div class="ellipsis email">').append(
                        $.txt(baton.data.email + (baton.data.phone || '') + ' '),
                        getFieldLabel(baton.data.field) !== '' ?
                            $('<span style="color: #888;">').text('(' + getFieldLabel(baton.data.field) + ')') : []
                    )
                );
            } else {
                this.append(
                    $('<div>').append(
                        data.email ?
                            $('<a href="#" class="halo-link">')
                            .data({ email1: data.email })
                            .text(_.noI18n(String(data.email).toLowerCase())) :
                            $('<span>').text(_.noI18n(data.phone || ''))
                    )
                );
            }
        }
    });

    // drawAutoCompleteItem and drawContact
    // are slightly different. it's easier just having two functions.

    /*
     * extension point for autocomplete item
     */
    ext.point(POINT +  '/autoCompleteItem').extend({
        id: 'autoCompleteItem',
        index: 100,
        draw: function (baton) {
            this.addClass('io-ox-mail-write-contact');
            baton.autocomplete = true;
            // contact picture
            ext.point(POINT + '/contactPicture').invoke('draw', this, baton);
            // display name
            ext.point(POINT + '/displayName').invoke('draw', this, baton);
            // email address
            ext.point(POINT + '/emailAddress').invoke('draw', this, baton);
        }
    });

    /*
     * extension point for contact item
     */
    ext.point(POINT +  '/contactItem').extend({
        id: 'contactItem',
        index: 100,
        draw: function (baton) {
            var data = baton.data,
                id = baton.id,
                valid = _(['email', 'phone', 'display_name', 'full_name']).find(function (key) {
                    //just whitespace?
                    return (data[key] || '').trim() !== '';
                });

            //ignore 'whitespace only' data
            if (valid) {
                baton.autocomplete = false;
                //add parsed emailadress as display_name (if not set yet9
                if ($.trim(data.display_name || data.display_name) === '' && !_.isUndefined(data.phone || data.email)) {
                    data = $.extend(data, {
                        display_name: _.flatten(mailUtil.parseRecipients(data.phone || data.email))[0] || data.display_name || ''
                    });
                }
                // picture
                ext.point(POINT + '/contactPicture').invoke('draw', this, baton);
                // add hidden input
                this.addClass('io-ox-mail-write-contact section-item').append(
                    // hidden field
                    $('<input>', { type: 'hidden', name: id, value: serialize(data) })
                );
                // display name
                ext.point(POINT + '/displayName').invoke('draw', this, baton);
                // email address
                ext.point(POINT + '/emailAddress').invoke('draw', this, baton);
                this.append(
                    // remove
                    $('<a role="button" href="#" class="remove">')
                        .attr('title', gt('Remove from recipient list'))
                        .append(
                            $('<i class="fa fa-trash-o">')
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
        }
    });

    // helper

    function serialize(obj) {
        // display_name might be null!
        return obj.display_name ?
             '"' + obj.display_name.replace(/"/g, '\"') + '" <' + obj.email + (obj.phone || '') + '>' : '<' + obj.email + (obj.phone || '') + '>';
    }

    function createRadio(name, value, text, isChecked) {
        var label, radio;
        radio = $('<input>', { type: 'radio', name: name, value: value, tabindex: '7' });
        label = $('<label class="radio">').append(
            radio, $.txt(_.noI18n('\u00A0\u00A0')), text, $.txt(_.noI18n('\u00A0\u00A0\u00A0\u00A0 '))
        );
        if (isChecked) {
            radio.prop('checked', true);
        }
        return label;
    }

    function createCheckbox(name, text, isChecked) {
        var label, box;
        box = $('<input>', { type: 'checkbox', name: name, value: '1', tabindex: '7' });
        label = $('<label class="checkbox">').append(
            box, $.txt(_.noI18n('\u00A0\u00A0')), text, $.txt(_.noI18n('\u00A0\u00A0\u00A0\u00A0 '))
        );
        if (isChecked) {
            box.prop('checked', true);
        }
        return label;
    }

    return View;
});
