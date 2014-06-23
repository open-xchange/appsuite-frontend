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
     'io.ox/core/notifications',
     'io.ox/core/tk/autocomplete',
     'io.ox/core/api/autocomplete',
     'io.ox/core/api/account',
     'gettext!io.ox/mail',
     'static/3rd.party/bootstrap-tokenfield/js/bootstrap-tokenfield.js'
    ], function (extensions, Dropdown, ext, mailAPI, mailUtil, contactsAPI, contactsUtil, emoji, settings, coreSettings, notifications, autocomplete, AutocompleteAPI, accountAPI, gt) {

    'use strict';

    var INDEX = 0,
        POINT = 'io.ox/mail/compose';

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
                .option('priority', 0, gt('Low'))
                .option('priority', 3, gt('Normal'))
                .option('priority', 5, gt('High'));
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
                $('<div class="col-xs-6 col-md-4">').append(
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


    var autocompleteAPI = new AutocompleteAPI({ id: 'mailwrite', contacts: true, msisdn: true });

    var Recipient = Backbone.Model.extend({

    });

    var Recipients = Backbone.Collection.extend({
        model: Recipient
    });

    var MailComposeView = Backbone.View.extend({

        className: 'io-ox-mail-compose container default-content-padding',

        events: {
            'click [data-action="save"]':       'onSave',
            'click [data-action="send"]':       'onSend',
            'click [data-action="discard"]':    'onDiscard',
            'click [data-action="add-cc"]':     'addCC',
            'click [data-action="add-bcc"]':    'addBCC',
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
            this.textarea = $('<textarea>');
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

            //mail.data.to = [['David Bauer', 'david.bauer@open-xchange.com']];
            //mail.data.from = [['David Bauer', 'david.bauer@open-xchange.com']];

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
            mail.data.attachments[0].content = mail.data.attachments[0].content
                    .replace(new RegExp('(<img[^>]+src=")' + ox.abs + ox.apiRoot), '$1/ajax')
                    .replace(new RegExp('(<img[^>]+src=")' + ox.apiRoot, 'g'), '$1/ajax')
                    .replace(/on(mousedown|contextmenu)="return false;"\s?/g, '')
                    .replace(/data-mce-src="[^"]+"\s?/, '');

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

        addCC: function (e) {
            $(e.target).toggleClass('active');
            this.$el.find('[data-extension-id="cc"]').toggleClass('hidden');
        },

        addBCC: function (e) {
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

        changeEditorMode: function (mode) {
            // be busy
            this.textarea.prop('disabled', true).busy();
            if (this.editor) {
                var content = this.editor.getPlainText();
                this.editor.clear();
                this.editor.handleHide();
                if (this.editor.tinymce) {
                    // changing from HTML to TEXT
                    this.editorMode = 'text';
                    if (!this.editorHash.text) {
                        // load TEXT editor for the first time
                        return this.loadEditor(content);
                    } else {
                        // reuse TEXT editor
                        return this.reuseEditor(content);
                    }
                } else {
                    // changing from TEXT to HTML
                    this.editorMode = 'html';
                    if (!this.editorHash.html) {
                        // load HTML editor for the first time
                        return this.loadEditor(content);
                    } else {
                        // reuse HTML editor
                        return this.reuseEditor(content);
                    }
                }
            } else {
                // initial editor
                return this.loadEditor(mode);
            }
        },

        setFormat: function (mode) {
            var self = this;
            var test = _.queued(function (mode) {
                // change?
                return (mode === self.editorMode ?
                    $.when() :
                    self.changeEditorMode(mode).done(function () {
                        self.editorMode = mode;
                    })
                );
            });
            return test();
        },

        setRawBody: function (str) {
            this.editor.setContent(str);
        },

        setBody: function (str) {

            function trimContent(str) {
                // remove white-space at beginning except in first-line
                str = String(str || '').replace(/^[\s\xA0]*\n([\s\xA0]*\S)/, '$1');
                // remove white-space at end
                return str.replace(/[\s\uFEFF\xA0]+$/, '');
            }

            var content = trimContent(str), dsID, ds;

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
            var data = this.model.getMail(),
                headers,
                attachments,
                mail,
                files = [],
                fileList = [], //view.baton.fileList,
                parse = function (list) {
                    return _(mailUtil.parseRecipients([].concat(list).join(', ')))
                        .map(function (recipient) {
                            var typesuffix = mailUtil.getChannel(recipient[1]) === 'email' ? '' : mailUtil.getChannelSuffixes().msisdn;
                            return ['"' + recipient[0] + '"', recipient[1], typesuffix];
                        });
                },
                replyTo = parse(data.replyTo)[0] || [];

            // get content
            attachments = {
                content: (this.editor ? this.editor.getContent() : '')
            };
            if (this.editorMode !== 'html') {
                attachments.raw = true;
            }

            // remove trailing white-space, line-breaks, and empty paragraphs
            attachments.content = attachments.content.replace(
                /(\s|&nbsp;|\0x20|<br\/?>|<p( class="io-ox-signature")>(&nbsp;|\s|<br\/?>)*<\/p>)*$/g, ''
            );

            attachments.content_type = this.getContentType(this.editorMode);

            // might fail
            try {
                headers = JSON.parse(data.headers);
            } catch (e) {
                headers = {};
            }

            mail = {
                from: [data.from] || [],
                to: parse(data.to),
                cc: parse(data.cc),
                bcc: parse(data.bcc),
                headers: headers,
                reply_to: mailUtil.formatSender(replyTo),
                subject: String(data.subject),
                priority: parseInt(data.priority, 10) || 3,
                vcard: parseInt(data.vcard, 10) || 0,
                attachments: [attachments],
                nested_msgs: []
            };

            // add disp_notification_to?
            if (data.disp_notification_to) mail.disp_notification_to = true;
            // add msgref?
            if (data.msgref) mail.msgref = data.msgref;
            // sendtype
            mail.sendtype = data.sendtype || mailAPI.SENDTYPE.NORMAL;

            return {
                data: mail,
                mode: this.composeMode,
                format: this.editorMode
            };
        },

        setMail: function (mail) {
            return this.setFormat(mail.format).done(function () { });
        },

        postRender: function () {
            var self = this;
            var el = this.$el,
            editor = el.find('.editable');

            el.find('.tokenfield').tokenfield();

            var to = el.find('.to.tokenfield');
            var node = to.data('bs.tokenfield').$input;
            node.autocomplete({
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
                    var name = contactsUtil.getMailFullName(data),
                                address = data.email || data.phone || '';
                    //return name ? '"' + name + '" <' + address + '>' : address;
                    if (name) {
                        return { value: address, label: name };
                        //to.tokenfield('createToken', { value: address, label: name });
                    } else {
                        return address;
                        //to.tokenfield('createToken', address);
                    }
                },
                click: function (e) {
                    copyRecipients.call(self, to, $(this), e);
                },
                blur: function (e) {
                    copyRecipients.call(self, to, $(this), e);
                }
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

    function copyRecipients(to, node, e) {

        var valBase, list;

        // normalize data
        if (e && e.data && e.data.distlistarray !== null) {
            // distribution list
            list = _(e.data.distlistarray).map(function (member) {
                return {
                    label: member.display_name,
                    value: member.mail
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
            //this.addRecipients(id, list);
            to.tokenfield('createToken', list);
            // don't refocus on blur
            if (e.type !== 'blur') node.val('').focus();
            //clear the input field
            node.val('');
        } else if ($.trim(node.val()) !== '') {
            // not accepted but has content
        }
    }

    return MailComposeView;
});
