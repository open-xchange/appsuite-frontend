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

define.async('io.ox/mail/write/main',
    ['io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/mail/write/textile',
     'io.ox/core/extensions',
     'io.ox/core/config',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'io.ox/core/i18n',
     'io.ox/core/api/user',
     'io.ox/core/tk/upload',
     'io.ox/core/tk/autocomplete',
     'io.ox/mail/model',
     'io.ox/mail/write/view-main',
     'gettext!io.ox/mail/mail',
     'less!io.ox/mail/style.css',
     'less!io.ox/mail/write/style.css'], function (mailAPI, mailUtil, textile, ext, config, contactsAPI, contactsUtil, i18n, userAPI, upload, autocomplete, MailModel, WriteView, gt) {

    'use strict';

    // actions (define outside of multi-instance app)
    ext.point('io.ox/mail/write/actions/send').extend({
        id: 'send',
        action: function (app) {
            app.send();
        }
    });

    // actions (define outside of multi-instance app)
    ext.point('io.ox/mail/write/actions/draft').extend({
        id: 'send',
        action: function (app) {
            app.saveDraft().done(function (data) {
                app.setMsgRef(data.data);
            }).fail(function (e) {

            });
        }
    });

    ext.point('io.ox/mail/write/actions/proofread').extend({
        id: 'proofread',
        action: function (app) {
            app.proofread();
        }
    });

    // links
//    ext.point('io.ox/mail/write/links/toolbar').extend(new ext.Link({
//        index: 200,
//        id: 'proofread',
//        label: 'Proofread',
//        ref: 'io.ox/mail/write/actions/proofread'
//    }));

    // default sender (used to set from address)
    var defaultSender = [];

    // multi instance pattern
    function createInstance() {

        var app, win,
            editor,
            editorHash = {},
            currentSignature = '',
            editorMode = '',
            mailState,
            composeMode,
            view,
            model;

        model = new MailModel();
        view = new WriteView({model: model});

        app = ox.ui.createApp({
            name: 'io.ox/mail/write',
            title: 'Compose'
        });

        app.getView = function () {
            return view;
        };

        window.newmailapp = function () { return app; };

        app.STATES = {
            'CLEAN': 1,
            'DIRTY': 2
        };

        mailState = app.STATES.CLEAN;

        app.getState = function () {
            return mailState;
        };

        app.markDirty = function () {
            mailState = app.STATES.DIRTY;
        };

        app.markClean = function () {
            mailState = app.STATES.CLEAN;
        };


        app.getView().signatures = config.get('gui.mail.signatures', []);

        app.setSignature = function (e) {

            var self = this;

            var index = e.data.index,
                signature, text;

            if (currentSignature) {
                // remove current signature from editor
                self.getEditor().replaceParagraph(currentSignature, '');
                currentSignature = '';
            }

            // add signature?
            if (index < app.getView().signatures.length) {
                signature = app.getView().signatures[index];
                text = $.trim(signature.signature_text);
                self.getEditor().appendContent(text);
                self.getEditor().scrollTop('bottom');
                currentSignature = text;
            }
        };

        function showMessage(msg, header, sticky) {
            console.log(arguments);
            $('#myGrowl').jGrowl(msg, {header: header, sticky: sticky});
        }

        // launcher
        app.setLauncher(function () {

            win = ox.ui.createWindow({
                name: 'io.ox/mail/write',
                title: '',
                titleWidth: (app.getView().GRID_WIDTH + 10) + 'px',
                toolbar: true,
                close: true
            });

            app.setWindow(win);

            app.getView().render(app);



            // add panels to windows
            win.nodes.main
            .addClass('io-ox-mail-write')
            .append(
                app.getView().form = $('<form>', {
                    name: 'compose',
                    method: 'post',
                    enctype: 'multipart/form-data'
                })
                .addClass('form-inline')
                .append(
                    $('<input>', { type: 'hidden', name: 'msgref', value: '' }),
                    app.getView().main,
                    app.getView().scrollpane
                )
            );

            var dropZone = upload.dnd.createDropZone();
            dropZone.on('drop', function (e, file) {
                app.getView().form.find('input[type=file]').last()
                    .prop('file', file)
                    .trigger('change');
                app.getView().showSection('attachments');
            });

            win.on('show', function () {
                if (app.getEditor()) {
                    app.getEditor().handleShow();
                }
                dropZone.include();
            });

            win.on('hide', function () {
                if (app && app.getEditor()) {
                    app.getEditor().handleHide();
                }
                dropZone.remove();
            });
        });

        /**
         * Setters
         */
        app.setFormat = (function () {

            app.markDirty();

            function load(mode, content) {
                var editorSrc = 'io.ox/core/tk/' + (mode === 'html' ? 'html-editor' : 'text-editor');
                return require([editorSrc]).pipe(function (Editor) {
                    return (editorHash[mode] = new Editor(app.getView().textarea))
                        .done(function () {
                            app.setEditor(editorHash[mode]);
                            app.getEditor().setPlainText(content);
                            app.getEditor().handleShow();
                        });
                });
            }

            function reuse(mode, content) {
                app.setEditor(editorHash[mode]);
                app.getEditor().setPlainText(content);
                app.getEditor().handleShow();
                return $.when();
            }

            function changeMode(mode) {
                // be busy
                app.getView().textarea.attr('disabled', 'disabled').busy();
                if (app.getEditor()) {
                    var content = app.getEditor().getPlainText();
                    app.getEditor().clear();
                    app.getEditor().handleHide();
                    if (app.getEditor().tinymce) {
                        // changing from HTML to TEXT
                        if (!editorHash.text) {
                            // load TEXT editor for the first time
                            return load('text', content);
                        } else {
                            // reuse TEXT editor
                            return reuse('text', content);
                        }
                    } else {
                        // changing from TEXT to HTML
                        if (!editorHash.html) {
                            // load HTML editor for the first time
                            return load('html', content);
                        } else {
                            // reuse HTML editor
                            return reuse('html', content);
                        }
                    }
                } else {
                    // initial editor
                    return load(mode);
                }
            }

            return _.queued(function (mode) {
                // change?
                return (mode === editorMode ?
                    $.when() :
                    changeMode(mode || editorMode).done(function () {
                        editorMode = mode || editorMode;
                    })
                );
            });
        }());

        app.setSubject = function (str) {
            app.markDirty();
            app.getView().subject.val(str || '');
        };

        app.setRawBody = function (str) {
            app.markDirty();
            app.getEditor().setContent(str);
        };

        app.setBody = function (str) {
            app.markDirty();
            // get default signature
            var ds = _(app.getView().signatures)
                    .find(function (o) {
                        return o.signature_default === true;
                    }),
                signature = ds ? $.trim(ds.signature_text) : '',
                pos = ds ? ds.position : 'below',
                content = $.trim(str);
            // set signature?
            if (ds) {
                // remember as current signature
                currentSignature = signature;
                // yep
                if (editorMode === 'html') {
                    // prepare signature for html
                    signature = '<p>' + signature.replace(/\n/g, '<br>') + '</p>';
                    // html
                    app.getEditor().setContent('<p></p>' + (pos === 'above' ? signature + content : content + signature));
                } else {
                    // plain text
                    if (pos === 'above') {
                        app.getEditor().setContent('\n\n' + signature + (content !== '' ? '\n\n' + content : ''));
                    } else {
                        app.getEditor().setContent('\n\n' + (content !== '' ? content + '\n\n' : '') + signature);
                    }
                }

            } else {
                // no signature
                app.getEditor().setContent(content !== '' ? (editorMode === 'html' ? '<p></p>' : '\n\n') + content : '');
            }
        };

        app.setTo = function (list) {
            app.getView().addRecipients('to', list || []);
        };

        app.setCC = function (list) {
            app.getView().addRecipients('cc', list || []);
            if (list && list.length) {
                app.getView().showSection('cc');
            }
        };

        app.setBCC = function (list) {
            app.getView().addRecipients('bcc', list || []);
            if (list && list.length) {
                app.getView().showSection('bcc');
            }
        };

        app.setAttachments = function (list) {
            app.markDirty();
            // look for real attachments
            var found = false;
            _(list || []).each(function (attachment) {
                if (attachment.disp === 'attachment') {
                    // add as linked attachment
                    attachment.type = 'file';
                    found = true;
                    app.getView().form.find('input[type=file]').last()
                        .prop('attachment', attachment)
                        .trigger('change');
                }
            });
            if (found) {
                app.getView().showSection('attachments');
            }
        };

        app.setPriority = function (prio) {
            app.markDirty();
            // be robust
            prio = parseInt(prio, 10) || 3;
            prio = prio < 3 ? 1 : prio;
            prio = prio > 3 ? 5 : prio;
            // set
            app.getView().form.find('input[name=priority][value=' + prio + ']')
                .prop('checked', true);
            // high priority?
            if (prio === 1) {
                app.getView().priorityOverlay.addClass('high');
            }
        };

        app.setAttachVCard = function (bool) {
            app.markDirty();
            // set
            app.getView().form.find('input[name=vcard]').prop('checked', !!bool);
        };

        app.setDeliveryReceipt = function (bool) {
            app.markDirty();
            // set
            app.getView().form.find('input[name=receipt]').prop('checked', !!bool);
        };

        app.setMsgRef = function (ref) {
            app.markDirty();
            app.getView().form.find('input[name=msgref]').val(ref || '');
        };

        var windowTitles = {
            compose: 'Compose new email',
            replyall: 'Reply all',
            reply: 'Reply',
            forward: 'Forward'
        };

        app.setMail = function (mail) {
            // be robust
            mail = mail || {};
            mail.data = mail.data || {};
            mail.mode = mail.mode || 'compose';
            mail.format = mail.format || 'text';
            mail.initial = mail.initial || false;
            // call setters
            var data = mail.data;
            this.setSubject(data.subject);
            this.setTo(data.to);
            this.setCC(data.cc);
            this.setBCC(data.bcc);
            this.setAttachments(data.attachments);
            this.setPriority(data.priority || 3);
            this.setAttachVCard(data.vcard !== undefined ? data.vcard : config.get('mail.vcard', false));
            this.setDeliveryReceipt(data.disp_notification_to !== undefined ? data.disp_notification_to : false);
            this.setMsgRef(data.msgref);
            // apply mode
            var title = data.subject ? data.subject : windowTitles[composeMode = mail.mode];
            win.setTitle(title);
            app.setTitle(title);
            // set signature
            currentSignature = mail.signature || '';
            // set format
            return app.setFormat(mail.format)
                .done(function () {
                    // set body
                    var content = data.attachments && data.attachments.length ? data.attachments[0].content : '';
                    if (mail.format === 'text') {
                        content = content.replace(/<br>\n?/g, '\n');
                    }
                    app[mail.initial ? 'setBody' : 'setRawBody'](content);
                });
        };

        app.failSave = function () {
            var mail = app.getMail();
            delete mail.files;
            return {
                module: 'io.ox/mail/write',
                point: mail
            };
        };

        app.failRestore = function (point) {
            var def = $.Deferred();
            win.show(function () {
                app.setMail(point)
                .done(function () {
                    app.getEditor().focus();
                    def.resolve();
                });
            });
            return def;
        };

        /**
         * Compose new mail
         */
        app.compose = function (data) {

            // register mailto!
            if (navigator.registerProtocolHandler) {
                var l = location, $l = l.href.indexOf('#'), url = l.href.substr(0, $l);
                navigator.registerProtocolHandler(
                    'mailto', url + '#app=io.ox/mail/write:compose&mailto=%s', 'OX7 Mailer'
                );
            }

            var mailto, tmp, params, def = $.Deferred();

            // triggerd by mailto?
            if (data === undefined && (mailto = _.url.hash('mailto'))) {
                tmp = mailto.split(/\?/, 2);
                params = _.deserialize(tmp[1]);
                tmp = tmp[0].split(/\:/, 2);
                // save data
                data = {
                    to: [['', tmp[1]]],
                    subject: params.subject,
                    attachments: [{ content: params.body }]
                };
                // clear hash
                _.url.hash('mailto', null);
            }

            win.show(function () {
                app.setMail({ data: data, mode: 'compose', initial: true })
                .done(function () {
                    if (mailto) {
                        app.getEditor().focus();
                    } else if (data && data.to) {
                        $('input[name=subject]').focus().select();
                    } else {
                        $('input[data-type=to]').focus().select();
                    }
                    def.resolve();
                });
            });

            return def;
        };

        /**
         * Reply all
         */
        app.replyall = function (obj) {
            var def = $.Deferred();
            win.show(function () {
                mailAPI.replyall(obj, editorMode || 'text')
                .done(function (data) {
                    app.setMail({ data: data, mode: 'replyall', initial: true })
                    .done(function () {
                        app.getEditor().focus();
                        def.resolve();
                    });
                });
            });
            return def;
        };

        /**
         * Reply
         */
        app.reply = function (obj) {
            var def = $.Deferred();
            win.show(function () {
                mailAPI.reply(obj, editorMode || 'text')
                .done(function (data) {
                    app.setMail({ data: data, mode: 'reply', initial: true })
                    .done(function () {
                        app.getEditor().focus();
                        def.resolve();
                    });
                });
            });
            return def;
        };

        /**
         * Forward
         */
        app.forward = function (obj) {
            var def = $.Deferred();
            win.show(function () {
                mailAPI.forward(obj, editorMode || 'text')
                .done(function (data) {
                    app.setMail({ data: data, mode: 'forward', initial: true })
                    .done(function () {
                        $('input[data-type=to]').focus().select();
                        def.resolve();
                    });
                });
            });
            return def;
        };

        /**
         * Proof read view
         */
        app.proofread = function () {
            // create reader
            var reader = $('<div>').addClass('abs io-ox-mail-proofread');
            // load detail view
            require(['io.ox/mail/view-detail'], function (view) {
                // get data
                var mail = app.getMail();
                // add missing data
                _.extend(mail.data, {
                    folder_id: 'default0/INBOX',
                    received_date: _.now()
                });
                // draw mail
                reader.append(view.draw(mail.data))
                    .appendTo('body');
            });
        };

        /**
         * Get mail
         */
        app.getMail = function () {
            var // get relevant fields
                fields = app.getView().form
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
                content,
                mail,
                files = [],
                parse = function (list) {
                    return _(mailUtil.parseRecipients([].concat(list).join(', ')))
                        .map(function (recipient) {
                            return ['"' + recipient[0] + '"', recipient[1]];
                        });
                };
            // get content
            if (editorMode === 'html') {
                content = {
                    content_type: 'text/html',
                    content: app.getEditor() ? app.getEditor().getContent() : ''
                };
            } else {
                content = {
                    content_type: 'text/plain',
                    content: (app.getEditor() ? app.getEditor().getContent() : '')
                        .replace(/</g, '&lt;') // escape <
                        .replace(/\n/g, '<br>\n') // escape line-breaks
                };
            }
            // transform raw data
            mail = {
                from: [defaultSender] || [],
                to: parse(data.to),
                cc: parse(data.cc),
                bcc: parse(data.bcc),
                subject: data.subject + '',
                priority: parseInt(data.priority, 10) || 3,
                vcard: parseInt(data.vcard, 10) || 0,
                disp_notification_to: parseInt(data.receipt, 10) || 0,
                attachments: [content]
            };
            // add msgref?
            if (data.msgref) {
                mail.msgref = data.msgref;
            }
            // get files
            app.getView().form.find(':input[name][type=file]')
                .each(function () {
                    // link to existing attachments (e.g. in forwards)
                    var attachment = $(this).prop('attachment'),
                        // get file via property (DND) or files array and add to list
                        file = $(this).prop('file');
                    if (attachment) {
                        // add linked attachment
                        mail.attachments.push(attachment);
                    } else if (file) {
                        // add dropped file
                        files.push(file);
                    } else if (this.files && this.files.length) {
                        // process normal upload
                        _(this.files).each(function (file) {
                            files.push(file);
                        });
                    }
                });
            // return data, file references, mode, format
            return {
                data: mail,
                mode: composeMode,
                format: editorMode,
                signature: currentSignature,
                files: files
            };
        };

        /**
         * Send mail
         */
        app.send = function () {
            // get mail
            var mail = this.getMail();
            // hide app
            //win.hide();
            // send!
            mailAPI.send(mail.data, mail.files)
                .always(function (result) {
                    if (result.error) {
                        console.error(result);
                        win.show();
                        alert('Server error - see console :(');
                    } else {
                        app.markClean();
                        app.quit();
                    }
                });
        };

        app.saveDraft = function () {
            // get mail
            var mail = this.getMail(),
                def = new $.Deferred();
            // send!

            mail.data.sendtype = mailAPI.SENDTYPE.DRAFT;

            if (_(mail.data.flags).isUndefined()) {
                mail.data.flags = mailAPI.FLAGS.DRAFT;
            } else if (mail.data.flags & 4 === 0) {
                mail.data.flags += mailAPI.FLAGS.DRAFT;
            }

            mailAPI.send(mail.data, mail.files)
                .always(function (result) {
                    if (result.error) {
                        console.error(result);
                        def.reject('Server error - see console :(');
                        showMessage('Mail is NOT saved', 'Mail Error', true);
                    } else {
                        showMessage('Mail is saved', 'Mail', false);
                        def.resolve(result);
                        app.markClean();
                    }
                });

            return def;
        };

        /**
         * Get editor
         */
        app.getEditor = function () {
            return editor;
        };

        app.setEditor = function (e) {
            editor = e;
        };

        // destroy
        app.setQuit(function () {

            var def = $.Deferred();

            var clean = function () {
                // clean up editors
                for (var id in editorHash) {
                    editorHash[id].destroy();
                }
                // clear all private vars
                app = win = editor = currentSignature = null;
            };

            if (app.getState() === app.STATES.DIRTY) {
                require(["io.ox/core/tk/dialogs"], function (dialogs) {
                    new dialogs.ModalDialog()
                        .text(gt("Do you really want to cancel editing this mail?"))
                        .addButton("cancel", gt('Cancel'))
                        .addButton("delete", gt('Lose changes'))
                        .addButton('savedraft', gt('Save as draft'))
                        .show()
                        .done(function (action) {
                            console.debug("Action", action);
                            if (action === 'delete') {
                                def.resolve();
                                clean();
                            } else if (action === 'savedraft') {
                                app.saveDraft().done(function (mail) {
                                    console.log(mail);
                                    def.resolve();
                                    clean();
                                }).fail(function (e) {
                                    def.reject(e);
                                });
                            } else {
                                def.reject();
                            }
                        });
                });
            } else {
                clean();
                def.resolve();
            }

            return def;
        });

        return app;
    }

    var module = {
        getApp: createInstance
    };

    // load user
    return userAPI.get(config.get('identifier'))
        .done(function (sender) {
            // inject 'from'
            defaultSender = ['"' + sender.display_name + '"', sender.email1];
        })
        .pipe(function () {
            return module;
        });
});


