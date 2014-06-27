/* jshint unused: false */

/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/mail/compose/view',
    ['io.ox/mail/compose/extensions',
     'io.ox/backbone/mini-views/dropdown',
     'io.ox/core/extensions',
     'io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'io.ox/emoji/main',
     'settings!io.ox/mail',
     'settings!io.ox/core',
     'settings!io.ox/contacts',
     'io.ox/core/notifications',
     'io.ox/core/api/autocomplete',
     'io.ox/core/api/account',
     'gettext!io.ox/mail',
     'static/3rd.party/bootstrap-tokenfield/js/bootstrap-tokenfield.js',
     'static/3rd.party/typeahead.js/dist/typeahead.jquery.js'
    ], function (extensions, Dropdown, ext, mailAPI, mailUtil, contactsAPI, contactsUtil, emoji, settings, coreSettings, contactSettings, notifications, AutocompleteAPI, accountAPI, gt) {

    'use strict';

    var INDEX = 0,
        POINT = 'io.ox/mail/compose',
        convertAllToUnified = emoji.converterFor({
            from: 'all',
            to: 'unified'
        });

    ext.point(POINT + '/fields').extend({
        id: 'title',
        index: INDEX += 100,
        draw: extensions.title
    });

    ext.point(POINT + '/fields').extend({
        id: 'sender',
        index: INDEX += 100,
        draw: extensions.sender
    });

    ext.point(POINT + '/fields').extend({
        id: 'to',
        index: INDEX += 100,
        draw: extensions.to
    });

    ext.point(POINT + '/fields').extend({
        id: 'cc',
        index: INDEX += 100,
        draw: extensions.cc
    });

    ext.point(POINT + '/fields').extend({
        id: 'bcc',
        index: INDEX += 100,
        draw: extensions.bcc
    });

    ext.point(POINT + '/fields').extend({
        id: 'subject',
        index: INDEX += 100,
        draw: extensions.subject
    });

    ext.point(POINT + '/composetoolbar').extend({
        id: 'attachment',
        index: INDEX += 100,
        draw: extensions.attachment
    });

    ext.point(POINT + '/composetoolbar').extend({
        id: 'signature',
        index: INDEX += 100,
        draw: extensions.signature
    });

    ext.point(POINT + '/menuoptions').extend({
        id: 'editor',
        index: 100,
        draw: function () {
            this.data('view')
                .header(gt('Editor'))
                .option('editorMode', 'text', gt('Plain Text'))
                .option('editorMode', 'html', gt('Rich Text'));
        }
    });

    ext.point(POINT + '/menuoptions').extend({
        id: 'priority',
        index: 200,
        draw: function () {
            this.data('view')
                .header(gt('Priority'))
                .option('priority', 0, gt('High'))
                .option('priority', 3, gt('Normal'))
                .option('priority', 5, gt('Low'));
        }
    });

    ext.point(POINT + '/menuoptions').extend({
        id: 'options',
        index: 300,
        draw: function () {
            this.data('view')
                .header(gt('Options'))
                .option('vcard', 1, gt('Attach Vcard'))
                .option('disp_notification_to', true, gt('Delivery Receipt'));
        }
    });

    ext.point(POINT + '/composetoolbar').extend({
        id: 'menu',
        index: INDEX += 100,
        draw: function (baton) {
            var dropdown = new Dropdown({ label: gt('Options'), model: baton.model });

            ext.point(POINT + '/menuoptions').invoke('draw', dropdown.$el, baton);

            this.append(
                $('<div class="col-xs-6 col-md-3">').append(
                    dropdown.render().$el.addClass('pull-right')
                )
            );
        }
    });

    ext.point(POINT + '/fields').extend({
        id: 'composetoolbar',
        index: INDEX += 100,
        draw: function (baton) {
            var node = $('<div class="row">');
            ext.point(POINT + '/composetoolbar').invoke('draw', node, baton);
            this.append(node);
        }
    });

    var contactPictureOptions = { width: 42, height: 42, scaleType: 'contain' };


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
                contactsAPI
                    .getDisplayName(baton.data, { halo: false, stringify: 'getMailFullName', tagName: 'div' })
                    .addClass('recipient-name')
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
            this.addClass('io-ox-mail-compose-contact');
            baton.autocomplete = true;
            // contact picture
            ext.point(POINT + '/contactPicture').invoke('draw', this, baton);
            // display name
            ext.point(POINT + '/displayName').invoke('draw', this, baton);
            // email address
            ext.point(POINT + '/emailAddress').invoke('draw', this, baton);
        }
    });


    var autocompleteAPI = new AutocompleteAPI({ id: 'mailwrite', contacts: true, msisdn: true });

    var MailComposeView = Backbone.View.extend({

        className: 'io-ox-mail-compose container default-content-padding',

        events: {
            'click [data-action="save"]':       'onSave',
            'click [data-action="send"]':       'onSend',
            'click [data-action="discard"]':    'onDiscard',
            'click [data-action="add-cc"]':     'toggleCC',
            'click [data-action="add-bcc"]':    'toggleBCC',
            'change [data-action="from"]':      'setFrom',
            'keyup [data-extension-id="subject"] input': 'setSubject'
        },

        initialize: function (options) {
            this.app = options.app;
            this.editorHash = {};
            this.blocked = [];
            this.editorMode = settings.get('messageFormat', 'html');
            this.messageFormat = settings.get('messageFormat', 'html');
            this.editor = null;
            this.composeMode = 'compose';
            this.textarea = $('<textarea class="plain-text">');
        },

        setSubject: function (e) {
            this.model.set('subject', $(e.target).val());
        },

        onSave: function (e) {
            e.preventDefault();
            this.app.save();
        },

        onSend: function (e) {
            e.preventDefault();
            this.send();
        },

        prepareMailForSending: function (mail) {
            // get flat ids for data.infostore_ids
            if (mail.data.infostore_ids) {
                mail.data.infostore_ids = _(mail.data.infostore_ids).pluck('id');
            }
            // get flat cids for data.contacts_ids
            if (mail.data.contacts_ids) {
                mail.data.contacts_ids = _(mail.data.contacts_ids).map(function (o) { return _.pick(o, 'folder_id', 'id'); });
            }
            // move nested messages into attachment array
            _(mail.data.nested_msgs).each(function (obj) {
                mail.data.attachments.push({
                    id: mail.data.attachments.length + 1,
                    filemname: obj.subject,
                    content_type: 'message/rfc822',
                    msgref: obj.msgref
                });
            });
            delete mail.data.nested_msgs;
        },

        send: function () {
            // get mail
            var self = this,
                mail = this.getMail(),
                def = $.Deferred(),
                convert = emoji.converterFor({to: emoji.sendEncoding()});

            this.blockReuse(mail.data.sendtype);
            this.prepareMailForSending(mail);

            if (mail.data.sendtype === mailAPI.SENDTYPE.EDIT_DRAFT) {
                mail.data.sendtype = mailAPI.SENDTYPE.DRAFT;
            }

            //convert to target emoji send encoding
            if (convert && emoji.sendEncoding() !== 'unified') {
                //convert to send encoding (NOOP, if target encoding is 'unified')
                mail.data.subject = convert(mail.data.subject);
                mail.data.attachments[0].content = convert(mail.data.attachments[0].content, mail.format);
            }

             // fix inline images
            mail.data.attachments[0].content = mailUtil.fixInlineImages(mail.data.attachments[0].content);

            function cont() {
                var win = self.app.getWindow();
                // start being busy
                win.busy();
                // close window now (!= quit / might be reopened)
                win.preQuit();

                /*if (self.attachmentsExceedQouta(mail)) {
                    notifications.yell({
                        type: 'info',
                        message: gt(
                            'One or more attached files exceed the size limit per email. ' +
                            'Therefore, the files are not sent as attachments but kept on the server. ' +
                            'The email you have sent just contains links to download these files.'
                        ),
                        duration: 30000
                    });
                }*/

                // send!
                mailAPI.send(mail.data, mail.files /*view.form.find('.oldschool') */)
                .always(function (result) {

                    if (result.error && !result.warnings) {
                        win.idle().show();
                        notifications.yell(result); // TODO: check if backend just says "A severe error occurred"
                        return;
                    }

                    if (result.warnings) {
                        notifications.yell('warning', result.warnings.error);
                    } else {
                        // success - some want to be notified, other's not
                        if (settings.get('features/notifyOnSent', false)) {
                            notifications.yell('success', gt('The email has been sent'));
                        }
                    }

                    // update base mail
                    var isReply = mail.data.sendtype === mailAPI.SENDTYPE.REPLY,
                        isForward = mail.data.sendtype === mailAPI.SENDTYPE.FORWARD,
                        sep = mailAPI.separator,
                        base, folder, id, msgrefs, ids;

                    if (isReply || isForward) {
                        //single vs. multiple
                        if (mail.data.msgref) {
                            msgrefs = [ mail.data.msgref ];
                        } else {
                            msgrefs = _.chain(mail.data.attachments)
                                .filter(function (attachment) {
                                    return attachment.content_type === 'message/rfc822';
                                })
                                .map(function (attachment) { return attachment.msgref; })
                                .value();
                        }
                        //prepare
                        ids = _.map(msgrefs, function (obj) {
                            base = _(obj.split(sep));
                            folder = base.initial().join(sep);
                            id = base.last();
                            return { folder_id: folder, id: id };
                        });
                        // update cache
                        mailAPI.getList(ids).pipe(function (data) {
                            // update answered/forwarded flag
                            if (isReply || isForward) {
                                var len = data.length;
                                for (var i = 0; i < len; i++) {
                                    if (isReply) data[i].flags |= 1;
                                    if (isForward) data[i].flags |= 256;
                                }
                            }
                            $.when(mailAPI.caches.list.merge(data), mailAPI.caches.get.merge(data))
                            .done(function () {
                                mailAPI.trigger('refresh.list');
                            });
                        });
                    }
                    //app.dirty(false);
                    self.app.quit();
                })
                .always(function (result) {
                    self.unblockReuse(mail.data.sendtype);
                    def.resolve(result);
                });
            }

            // ask for empty to,cc,bcc and/or empty subject
            var noRecipient = _.isEmpty(mail.data.to) && _.isEmpty(mail.data.cc) && _.isEmpty(mail.data.bcc);
            if ($.trim(mail.data.subject) === '' || noRecipient) {
                if (noRecipient) {
                    notifications.yell('error', gt('Mail has no recipient.'));
                    focus('to');
                    def.reject();
                } else if ($.trim(mail.data.subject) === '') {
                    // show dialog
                    require(['io.ox/core/tk/dialogs'], function (dialogs) {
                        new dialogs.ModalDialog()
                            .text(gt('Mail has empty subject. Send it anyway?'))
                            .addPrimaryButton('send', gt('Yes, send without subject'), 'send', {tabIndex: '1'})
                            .addButton('subject', gt('Add subject'), 'subject', {tabIndex: '1'})
                            .show(function () {
                                def.notify('empty subject');
                            })
                            .done(function (action) {
                                if (action === 'send') {
                                    cont();
                                } else {
                                    focus('subject');
                                    def.reject();
                                }
                            });
                    });
                }

            } else {
                cont();
            }

            return def;
        },

        attachmentsExceedQouta: function (mail) {

            var allAttachmentsSizes = [].concat(mail.files).concat(mail.data.attachments)
                    .map(function (m) {
                        return m.size || 0;
                    }),
                quota = coreSettings.get('properties/attachmentQuota', 0),
                accumulatedSize = allAttachmentsSizes
                    .reduce(function (acc, size) {
                        return acc + size;
                    }, 0),
                singleFileExceedsQuota = allAttachmentsSizes
                    .reduce(function (acc, size) {
                        var quotaPerFile = coreSettings.get('properties/attachmentQuotaPerFile', 0);
                        return acc || (quotaPerFile > 0 && size > quotaPerFile);
                    }, false);

            return singleFileExceedsQuota || (quota > 0 && accumulatedSize > quota);
        },

        onDiscard: function (e) {
            e.preventDefault();
            this.app.quit();
        },

        toggleCC: function (e) {
            $(e.target).toggleClass('active');
            this.$el.find('[data-extension-id="cc"]').toggleClass('hidden');
        },

        toggleBCC: function (e) {
            $(e.target).toggleClass('active');
            this.$el.find('[data-extension-id="bcc"]').toggleClass('hidden');
        },

        setFrom: function (e) {
            this.model.set('from', this.val());
        },

        render: function () {
            var self = this,
                data = this.model.toJSON(),
                baton = ext.Baton({ data: data, model: this.model, view: this });

            ext.point('io.ox/mail/compose/fields').invoke('draw', this.$el, baton);

            _.defer($.proxy(this.postRender, this));

            this.model.on('change:editorMode', function () {
                self.changeEditorMode();
            });

            return this;
        },

        loadEditor: function (content) {

            var editorSrc = 'io.ox/core/tk/' + (this.editorMode === 'html' ? 'html-editor' : 'text-editor');
            var self = this;

            return require([editorSrc]).then(function (Editor) {
                return (self.editorHash[self.editorMode] = new Editor(self.textarea))
                    .done(function () {
                        self.editor = self.editorHash[self.editorMode];
                        self.editor.setPlainText(content);
                        self.editor.handleShow();
                    });
            });
        },

        reuseEditor: function (content) {
            this.editor = this.editorHash[this.editorMode];
            this.editor.setPlainText(content);
            this.editor.handleShow();
            return $.when();
        },

        setEditor: function (editor) {
            this.editor = editor;
        },

        getEditor: function () {
            var def = $.Deferred();
            if (this.editor) {
                def.resolve(this.editor);
            } else {
                return this.loadEditor();
            }
            return def;
        },

        changeEditorMode: function () {
            // be busy
            this.textarea.prop('disabled', true).busy();
            if (this.editor) {
                var content = this.editor.getPlainText();
                this.editor.clear();
                this.editor.handleHide();

                // toggle editor
                this.editorMode = this.editor.tinymce ? 'text' : 'html';

                // load TEXT/HTML editor for the first time or reuse TEXT/HTML editor
                return !this.editorHash[this.editorMode] ? this.loadEditor(content) : this.reuseEditor(content);

            } else {
                // initial editor
                return this.loadEditor(this.editorMode);
            }
        },

        setRawBody: function (str) {
            this.editor.setContent(str);
        },

        setBody: function (str) {

            var self = this;

            function trimContent(str) {
                // remove white-space at beginning except in first-line
                str = String(str || '').replace(/^[\s\xA0]*\n([\s\xA0]*\S)/, '$1');
                // remove white-space at end
                return str.replace(/[\s\uFEFF\xA0]+$/, '');
            }

            function prependNewLine(content) {
                var nl = self.editorMode === 'html' ? '<p><br></p>' : '\n\n';
                if (content !== '' && content.indexOf(nl) !== 0) {
                    content = nl + content;
                }
                return content;
            }

            var content = prependNewLine(trimContent(str));

            //set content
            this.editor.setContent(content);
        },

        getFrom: function () {
            return this.model.get('from');
        },

        getContentType: function (mode) {
            if (mode === 'text') {
                return 'text/plain';
            } else {
                return this.messageFormat === 'html' ? 'text/html' : 'alternative';
            }
        },

        getMail: function () {
            var files = [],
                fileList = [],
                attachments = {
                    content: (this.editor ? this.editor.getContent() : ''),
                    content_type: this.getContentType(this.editorMode)
                };

            if (this.editorMode !== 'html') {
                attachments.raw = true;
            }

            // remove trailing white-space, line-breaks, and empty paragraphs
            attachments.content = attachments.content.replace(
                /(\s|&nbsp;|\0x20|<br\/?>|<p( class="io-ox-signature")>(&nbsp;|\s|<br\/?>)*<\/p>)*$/g, ''
            );
            this.model.set('attachments', [attachments]);

            return {
                data: this.model.getMail(),
                mode: this.composeMode,
                format: this.editorMode
            };
        },

        setMail: function (mail) {
            var self = this,
                data = this.model.toJSON();

            data.initial = data.initial || true;

            return this.changeEditorMode().done(function () {
                var attachments = data.attachments ? (_.isArray(data.attachments) ? data.attachments : data.attachments[self.editorMode] || []) : (undefined);
                var content = attachments && attachments.length ? (attachments[0].content || '') : '';
                var format = attachments && attachments.length && attachments[0].content_type === 'text/plain' ? 'text' : 'html';

                if (self.editorMode === 'text') {
                    content = _.unescapeHTML(content.replace(/<br\s*\/?>/g, '\n'));
                }
                // image URL fix
                if (self.editorMode === 'html') {
                    content = content.replace(/(<img[^>]+src=")\/ajax/g, '$1' + ox.apiRoot);
                }
                // convert different emoji encodings to unified
                content = convertAllToUnified(content);
                if (data.replaceBody !== 'no') {
                    self[data.initial ? 'setBody' : 'setRawBody'](content);
                }
            });
        },

        postRender: function () {
            var model = this.model,
                el = this.$el;

            el.find('.tokenfield').each(function () {

                var self = $(this),
                    type = self.data('type');

                self.tokenfield({
                    createTokensOnBlur: true,
                    minLength: contactSettings.get('search/minimumQueryLength', 3),
                    typeahead: [{
                            highlight: true
                        }, {
                            source: function(query, callback) {
                                autocompleteAPI.search(query).then(function (matches) {
                                    callback(_(matches).map(function (data) {
                                        return {
                                            value: data.email || data.phone || '',
                                            label: contactsUtil.getMailFullName(data),
                                            data: data
                                        };
                                    }));
                                });
                            },
                            templates: {
                                suggestion: function (item) {
                                    var node = $('<div class="autocomplete-item">');
                                    ext.point(POINT + '/autoCompleteItem').invoke('draw', node, ext.Baton({ data: item.data }));
                                    return node;
                                }
                            }
                        }
                    ]
                }).on({
                    'tokenfield:createdtoken': function (e) {
                        // A11y: set title
                        var title = '';
                        if (e.attrs) {
                            if (e.attrs.label !== e.attrs.value) {
                                title = e.attrs.label ? '"' + e.attrs.label + '" <' + e.attrs.value + '>' : e.attrs.value;
                            } else {
                                title = e.attrs.label;
                            }
                        }
                        $(e.relatedTarget).attr({
                            title: title
                        });
                    },
                    'change': function () {
                        model.setTokens(type, self.tokenfield('getTokens'));
                    }
                });

                // set initial values
                self.tokenfield('setTokens', model.getTokens(type), true, false);

                self.data('bs.tokenfield').$input.on({
                    // IME support (e.g. for Japanese)
                    compositionstart: function () {
                        $(this).attr('data-ime', 'active');
                    },
                    compositionend: function () {
                        $(this).attr('data-ime', 'inactive');
                    },
                    keydown: function (e) {
                        if (e.which === 13 && $(this).attr('data-ime') !== 'active') {
                            // clear tokenfield input
                            $(this).val('');
                        }
                    },
                    // shortcuts (to/cc/bcc)
                    keyup: function (e) {
                        if (e.which === 13) return;
                        // look for special prefixes
                        var val = $(this).val();
                        if ((/^to:?\s/i).test(val)) {
                            $(this).val('');
                        } else if ((/^cc:?\s/i).test(val)) {
                            $(this).val('');
                            el.find('[data-extension-id="cc"]').removeClass('hidden');
                        } else if ((/^bcc:?\s/i).test(val)) {
                            $(this).val('');
                            el.find('[data-extension-id="bcc"]').removeClass('hidden');
                        }
                    }
                }).first().focus();
            });

            el.append(this.textarea);

        },

        blockReuse: function (sendtype) {
            this.blocked[sendtype] = (this.blocked[sendtype] || 0) + 1;
        },

        unblockReuse: function (sendtype) {
            this.blocked[sendtype] = (this.blocked[sendtype] || 0) - 1;
            if (this.blocked[sendtype] <= 0)
                delete this.blocked[sendtype];
        }

    });

    return MailComposeView;
});
