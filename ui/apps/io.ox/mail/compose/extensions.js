/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/compose/extensions', [
    'io.ox/mail/api',
    'io.ox/mail/sender',
    'io.ox/backbone/mini-views/common',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/tk/tokenfield',
    'io.ox/core/dropzone',
    'io.ox/core/capabilities',
    'io.ox/mail/actions/attachmentQuota',
    'io.ox/core/util',
    'io.ox/core/attachments/view',
    'io.ox/mail/compose/util',
    'io.ox/mail/util',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'settings!io.ox/contacts',
    'io.ox/core/attachments/backbone',
    'io.ox/core/strings',
    'io.ox/mail/compose/resize-view',
    'io.ox/mail/compose/resize',
    'static/3rd.party/jquery-ui.min.js'
], function (mailAPI, sender, mini, Dropdown, ext, actionsUtil, Tokenfield, dropzone, capabilities, attachmentQuota, util, AttachmentView, composeUtil, mailUtil, settings, gt, settingsContacts, Attachments, strings, ResizeView, imageResize) {

    var POINT = 'io.ox/mail/compose';

    //make strings accessible to translators
    var tokenfieldTranslations = {
        to: gt('To'),
        pickerto: gt('Select contacts'),
        //#. %1$s is the name of the inputfield (To, CC, BCC)
        ariato: gt('%1$s autocomplete token field. Use left and right Arrowkeys to navigate between the tokens', gt('To')),
        cc: gt('CC'),
        pickercc: gt('Select CC contacts'),
        //#. %1$s is the name of the inputfield (To, CC, BCC)
        ariacc: gt('%1$s autocomplete token field. Use left and right Arrowkeys to navigate between the tokens', gt('CC')),
        bcc: gt('BCC'),
        pickerbcc: gt('Select BCC contacts'),
        //#. %1$s is the name of the inputfield (To, CC, BCC)
        ariabcc: gt('%1$s autocomplete token field. Use left and right Arrowkeys to navigate between the tokens', gt('BCC')),
        reply_to: /*#. Must not exceed 8 characters. e.g. German would be: "Antworten an", needs to be abbreviated like "Antw. an" as space is very limited */ gt.pgettext('compose', 'Reply to')
    };

    var IntermediateModel = Backbone.Model.extend({
        initialize: function (opt) {
            this.config = opt.config;
            this.model = opt.model;
            this.configFields = opt.configFields;
            this.modelFields = opt.modelFields;

            delete this.attributes.config;
            delete this.attributes.model;
            delete this.attributes.configFields;
            delete this.attributes.modelFields;

            this.listenTo(this.config, this.configFields.map(this.changeMapper).join(' '), this.getData);
            this.listenTo(this.model, this.modelFields.map(this.changeMapper).join(' '), this.getData);
            this.getData();
            this.on('change', this.updateModels);
        },
        changeMapper: function (str) {
            return 'change:' + str;
        },
        getData: function () {
            this.configFields.forEach(function (attr) {
                this.set(attr, this.config.get(attr));
            }.bind(this));
            this.modelFields.forEach(function (attr) {
                this.set(attr, this.model.get(attr));
            }.bind(this));
        },
        updateModels: function () {
            _(this.changed).forEach(function (value, key) {
                if (this.configFields.indexOf(key) >= 0) return this.config.set(key, value);
                if (this.modelFields.indexOf(key) >= 0) return this.model.set(key, value);
            }.bind(this));
        }
    });

    var SenderView = Backbone.DisposableView.extend({

        className: 'row sender',

        attributes: { 'data-extension-id': 'sender' },

        initialize: function (options) {
            this.config = options.config;
            this.dropdown = new Dropdown({
                model: new IntermediateModel({
                    model: this.model,
                    config: this.config,
                    configFields: ['sendDisplayName', 'editorMode'],
                    modelFields: ['from']
                }),
                label: this.getItemNode.bind(this),
                aria: gt('From'),
                caret: true
            });

            this.listenTo(this.model, 'change:from', this.renderDropdown);
            this.listenTo(this.config, 'change:sendDisplayName', function (model, value) {
                settings.set('sendDisplayName', value);
            });
        },

        render: function () {
            // label
            this.$el.empty().append(
                $('<label class="maillabel col-xs-2">').text(gt('From')),
                $('<div class="mail-input col-xs-10">').append(
                    // label gets rendered by dropdown view, dropdown.$el is empty now
                    this.dropdown.render().$el.attr({ 'data-dropdown': 'from' })
                )
            );
            // ready to draw dropdown
            sender.getAddressesOptions(options).then(function (list) {
                this.list = list;
                this.renderDropdown();
            }.bind(this));
            return this;
        },

        renderDropdown: function () {
            var from = this.model.get('from') ? this.model.get('from')[1] : undefined;
            // reset
            this.dropdown.$ul.empty().css('width', 'auto');
            // render
            this.setDropdownOptions();
            this.dropdown.$toggle.find('.dropdown-label').empty().append(this.getItemNode());
            this.dropdown.$toggle.attr('href', from ? 'mailto:' + from : '#');
            if (this.dropdown.$el.hasClass('open')) this.dropdown.adjustBounds();
            // re-focus element otherwise the bootstap a11y closes the drop-down
            this.dropdown.$ul.find('[data-name="sendDisplayName"]').focus();
        },

        setDropdownOptions: function () {
            var self = this;
            if (!this.list || !this.list.sortedAddresses.length) return;

            var defaultAddress = settings.get('defaultSendAddress', '').trim();

            // prepare list
            var sortedAddresses = _(this.list.sortedAddresses)
                .chain()
                .map(function (address) {
                    var array = mailUtil.getSender(address.option, self.config.get('sendDisplayName'));
                    return { key: _(array).compact().join(' ').toLowerCase(), array: array };
                })
                .sortBy('key')
                .pluck('array')
                .value();

            // draw default address first
            sortedAddresses = _(sortedAddresses).filter(function (item) {
                if (item[1] !== defaultAddress) return true;
                self.dropdown.option('from', item, function () {
                    return self.getItemNode(item);
                });
                if (sortedAddresses.length > 1) self.dropdown.divider();
                return false;
            });

            _(sortedAddresses).each(function (item) {
                self.dropdown.option('from', item, function () {
                    return self.getItemNode(item);
                });
            });

            if (_.device('smartphone')) return;

            // append options to toggle and edit names
            this.dropdown
                .divider()
                .option('sendDisplayName', true, gt('Show names'), { keepOpen: true })
                .divider()
                .link('edit-real-names', gt('Edit names'), this.onEditNames);
        },

        getItemNode: function (item) {
            item = item || this.model.get('from');
            if (!item) return;
            var name = item[0], address = item[1];
            return [
                $('<span class="name">').text(name ? name + ' ' : ''),
                $('<span class="address">').text(name ? '<' + address + '>' : address)
            ];
        },

        onEditNames: function () {
            require(['io.ox/mail/compose/names'], function (names) {
                names.open();
            });
        }
    });

    var extensions = {

        header: function (baton) {
            if (!baton.view.app.getWindow()) return;
            var header = $('<div data-extension-id="header">');
            baton.$header = header;
            ext.point(POINT + '/header').invoke('draw', header, baton);
            baton.view.app.getWindow().setHeader(header);
        },

        title: function () {
            this.append(
                $('<h1 class="sr-only">').text(gt('Compose new email'))
            );
        },

        buttons: {
            discard: function (baton) {
                return (
                    $('<button type="button" class="btn btn-default" data-action="discard">')
                        .on('click', function () { baton.view.app.quit(); })
                        .text(baton.model.keepDraftOnClose() ? gt('Delete') : gt('Discard'))
                        .appendTo(this)
                );
            },
            send: function (baton) {
                this.append($('<button type="button" class="btn btn-primary" data-action="send">')
                    .on('click', function () { baton.view.send(); })
                    .on('keyup', function (e) {
                        if (e.which === 27) baton.view.focusEditor();
                    })
                    .text(gt('Send')));
            }
        },

        inlineYell: function () {
            // role log is a special kind of live region for status messages, errors etc.
            this.append($('<div role="log" aria-live="polite" class="inline-yell">'));
        },

        sender: function (baton) {
            var view = new SenderView({ model: baton.model, config: baton.config });
            this.append(view.render().$el);
        },

        senderRealName: function (baton) {
            var fields = this,
                config = baton.config;

            function toggleVisibility() {
                fields.toggleClass('no-realname', !config.get('sendDisplayName'));
            }

            config.on('change:sendDisplayName', toggleVisibility);
            toggleVisibility();

            this.append(
                $('<div class="row sender-realname" data-extension-id="sender-realname">').append(
                    $('<div class="mail-input col-xs-10 col-xs-offset-2">')
                        .text(gt('This email just contains your email address as sender. Your real name is not used.'))
                )
            );
        },

        recipientActionLink: function (type) {
            return function () {
                var node = $('<button type="button" class="btn btn-link" data-action="add">');
                if (type === 'cc') {
                    node.attr({ 'data-type': 'cc', 'title': gt('Show carbon copy input field') }).text(gt('CC'));
                } else {
                    node.attr({ 'data-type': 'bcc', 'title': gt('Show blind carbon copy input field') }).text(gt('BCC'));
                }
                this.append(node);
            };
        },

        recipientActionLinkMobile: function () {
            var node = $('<a href="#" data-action="add" role="checkbox" aria-checked="false">').append($('<span class="fa fa-angle-right" aria-hidden="true">'));
            this.append(node);
        },

        recipientActions: function () {
            var node = $('<div class="recipient-actions">');
            if (_.device('!smartphone')) {
                ext.point(POINT + '/recipientActionLink').invoke('draw', node);
            } else {
                ext.point(POINT + '/recipientActionLinkMobile').invoke('draw', node);
            }

            this.append(node);
        },

        tokenfield: function (attr) {

            if (attr === 'reply_to' && settings.get('showReplyTo/configurable', false) === false) return;

            function openAddressBookPicker(e) {
                e.preventDefault();
                var attr = e.data.attr, model = e.data.model;
                require(['io.ox/contacts/addressbook/popup'], function (popup) {
                    popup.open(function (result) {
                        var list = model.get(attr) || [];
                        model.set(attr, list.concat(_(result).pluck('array')));
                    });
                });
            }

            return function (baton) {
                var extNode,
                    guid = _.uniqueId('form-control-label-'),
                    value = baton.model.get(attr) || [],
                    // hide tokeninputfields if necessary (empty cc/bcc)
                    cls = 'row' + (/cc$/.test(attr) && !value.length ? ' hidden' : ''),
                    redrawLock = false,
                    tokenfieldView = new Tokenfield({
                        id: guid,
                        className: attr,
                        extPoint: POINT + '/' + attr,
                        isMail: true,
                        apiOptions: {
                            users: true,
                            limit: settings.get('compose/autocompleteApiLimit', 20),
                            contacts: true,
                            distributionlists: true,
                            emailAutoComplete: true
                        },
                        keepInComposeWindow: true,
                        maxResults: settings.get('compose/autocompleteDrawLimit', 30),
                        placeholder: tokenfieldTranslations[attr], // for a11y and easy access for custom dev when they want to display placeholders (these are made transparent via less)
                        ariaLabel: tokenfieldTranslations['aria' + attr]
                    });

                var node = $('<div class="mail-input col-xs-10">').append(tokenfieldView.$el);

                if (attr === 'to') {
                    ext.point(POINT + '/recipientActions').invoke('draw', node);
                }

                var usePicker = !_.device('smartphone') && capabilities.has('contacts') && settingsContacts.get('picker/enabled', true);

                if (usePicker) {
                    node.addClass('has-picker').append(
                        $('<a href="#" role="button" class="open-addressbook-popup">').append(
                            $('<i class="fa fa-address-book" aria-hidden="true">').attr('title', tokenfieldTranslations['picker' + attr])
                        ).attr('aria-label', tokenfieldTranslations['picker' + attr])
                        .on('click', { attr: attr, model: baton.model }, openAddressBookPicker)
                    );
                }

                var title = gt('Select contacts');

                this.append(
                    extNode = $('<div data-extension-id="' + attr + '">').addClass(cls)
                    .append(
                        usePicker ?
                            // with picker
                            $('<div class="maillabel col-xs-2">').append(
                                $('<a href="#" role="button">')
                                .text(tokenfieldTranslations[attr])
                                .attr({
                                    // add aria label since tooltip takes away the title attribute
                                    'aria-label': title,
                                    'title': title
                                })
                                .on('click', { attr: attr, model: baton.model }, openAddressBookPicker)
                                .tooltip({ animation: false, delay: 0, placement: 'right', trigger: 'hover' })
                            ) :
                            // without picker
                            $('<label class="maillabel col-xs-2">').text(tokenfieldTranslations[attr]).attr({ 'for': guid })
                    )
                    .append(node)
                );

                tokenfieldView.render().$el.on('tokenfield:createdtoken', function (e) {
                    // extension point for validation etc.
                    ext.point(POINT + '/createtoken').invoke('action', this, _.extend(baton, { event: e }));

                }).on('tokenfield:next', function () {
                    extNode.nextAll().find('input.tt-input,input[name="subject"]').filter(':visible').first().focus();
                }).on('tokenfield:removetoken', function (e) {
                    ext.point(POINT + '/removetoken').invoke('action', this, _.extend(baton, { event: e }));
                });

                // bind mail-model to collection
                tokenfieldView.listenTo(baton.model, 'change:' + attr, function (mailModel, recipients) {
                    if (redrawLock) return;
                    var recArray = _(recipients).map(function (recipient) {
                        var display_name = util.removeQuotes(recipient[0]),
                            email = recipient[1],
                            image = recipient[2];
                        return {
                            type: 5,
                            display_name: display_name,
                            email1: email,
                            image1_url: image,
                            token: { label: display_name, value: email }
                        };
                    });
                    this.collection.reset(recArray);
                });

                // trigger change to fill tokenfield
                baton.model.trigger('change:' + attr, baton.model, baton.model.get(attr));

                tokenfieldView.collection.on('change reset add remove sort', _.debounce(function () {
                    var recipients = this.map(function (model) {
                        var token = model.get('token'),
                            display_name = util.removeQuotes(token.label),
                            email = token.value;
                        return [display_name, email];
                    });
                    redrawLock = true;
                    baton.model.set(attr, recipients);
                    redrawLock = false;
                }.bind(tokenfieldView.collection)), 20);

                baton.view.on('updateTokens', function () {
                    var recipients = this.map(function (model) {
                        var token = model.get('token'),
                            display_name = util.removeQuotes(token.label),
                            email = token.value;
                        return [display_name, email];
                    });
                    redrawLock = true;
                    baton.model.set(attr, recipients);
                    redrawLock = false;
                }.bind(tokenfieldView.collection));

                baton.view.app.getWindow().one('idle', function () {
                    // idle event is triggered, after the view is visible
                    // call update when visible to correctly calculate tokefield dimensions (see Bug 52137)
                    tokenfieldView.$el.data('bs.tokenfield').update();
                });

                // see bug 53327
                ext.point(POINT + '/createtoken').extend({
                    id: 'scrolltop',
                    index: 10,
                    action: function (baton) {
                        if (_.device('!smartphone')) return;
                        if (baton && baton.view) {
                            setTimeout(function () {
                                if (baton.view.$el[0].scrollIntoView) baton.view.$el[0].scrollIntoView();
                            }, 10);
                        }
                    }
                });
            };
        },

        subject: function (baton) {
            var guid = _.uniqueId('form-control-label-');
            this.append(
                $('<div data-extension-id="subject" class="row subject">').append(
                    // dont use col-xs and col-sm here, breaks style in landscape mode
                    $('<label class="maillabel" >').addClass(_.device('smartphone') ? 'hidden-md hidden-sm hidden-xs' : 'col-xs-2').text(gt('Subject')).attr('for', guid),
                    $('<div class="mail-input" >').addClass(_.device('smartphone') ? 'col-xs-12' : 'col-xs-10').append(
                        new mini.InputView({ model: baton.model, id: guid, name: 'subject', autocomplete: false }).render().$el.attr('placeholder', gt('Subject'))
                    )
                )
            );
        },

        optionsmenu: (function () {
            return function (baton) {
                var dropdown = new Dropdown({ model: new IntermediateModel({
                    model: baton.model,
                    config: baton.config,
                    configFields: ['editorMode', 'vcard'],
                    modelFields: ['priority', 'requestReadReceipt']
                }), label: gt('Options'), caret: true });

                ext.point(POINT + '/menuoptions').invoke('draw', dropdown.$el, baton);

                dropdown.$ul.addClass('pull-right');

                this.append(dropdown.render().$el.addClass('text-left'));
            };
        }()),

        attachmentPreviewList: function (baton) {
            var $el = this;

            var view = baton.attachmentsView = new AttachmentView.List({
                point: 'io.ox/mail/compose/attachment/header',
                collection: baton.model.get('attachments'),
                editable: true,
                model: baton.model,
                mode: settings.get('attachments/layout/compose/' + _.display(), 'preview')
            });

            // dropzone
            var zone = new dropzone.Inplace({
                caption: gt('Drop attachments here')
            });

            zone.on({
                'show': function () {
                    $el.css('minHeight', '100px');
                    $(window).trigger('resize');
                },
                'hide': function () {
                    $el.css('minHeight', 0);
                    $(window).trigger('resize');
                },
                'drop': function (files) {
                    var models = _(files).map(function (file) {
                        var attachment = new Attachments.Model({ filename: file.name, origin: { file: file } });
                        composeUtil.uploadAttachment({
                            model: baton.model,
                            filename: file.filename,
                            origin: { file: file },
                            attachment: attachment
                        });
                        return attachment;
                    });
                    baton.model.attachFiles(models);
                    $(window).trigger('resize');
                }
            });

            view.listenTo(baton.model, 'change:attachments', function () {
                view.$list.empty();
                view.$preview.empty();
                view.renderList();
                view.updateScrollControls();
            });

            view.listenToOnce(view.collection, 'add remove reset', _.debounce(function () {
                if (this.getValidModels().length > 0) {
                    this.$el.addClass('open');
                    if (!this.isListRendered) {
                        this.renderList();
                        view.updateScrollControls();
                    }
                }
            }));

            // tinymce resize
            view.listenTo(view.collection, 'add remove reset', _.debounce(function () {
                if (baton.resizeView) baton.resizeView.update();
                if (this.getValidModels().length <= 1) $(window).trigger('resize');
            }));
            view.on('change:expanded', function () { $(window).trigger('resize'); });

            view.render();
            if (view.getValidModels().length > 0) {
                view.renderList();
                view.$el.addClass('open');
            }
            $el.append(
                zone.render().$el.addClass('abs'),
                view.$el
            );

            view.$el.on('click', 'li.item', function (e) {

                var node = $(e.currentTarget), id, data, baton, list;

                // skip attachments without preview
                if (!node.attr('data-original')) return;

                id = node.attr('data-id');
                data = view.collection.get(id).toJSON();

                if (data.group === 'localFile') {
                    data.fileObj = view.collection.get(id).fileObj;
                    // generate pseudo id so multiple localFile attachments do not overwrite themselves in the Viewer collection
                    data.id = 'localFileAttachment-' + id;
                }

                list = view.collection.filter(function (a) {
                    return a.get('disp') === 'attachment';
                })

                .map(function (model) {
                    var obj = model.toJSON();
                    // map name attibute for composition space attachments
                    obj.filename = obj.filename || obj.name;
                    if (obj.group === 'localFile') {
                        obj.fileObj = model.fileObj;
                        // generate pseudo id so multiple localFile attachments do not overwrite themselves in the Viewer collection
                        obj.id = 'localFileAttachment-' + model.cid;
                    }
                    return obj;
                });

                baton = ext.Baton({ simple: true, data: data, list: list, restoreFocus: $(e.target), openedBy: 'io.ox/mail/compose' });
                actionsUtil.invoke('io.ox/mail/attachment/actions/view', baton);
            });

            baton.app.once('ready', view.updateScrollControls.bind(view, undefined));

            view.on('change:layout', function (mode) {
                settings.set('attachments/layout/compose/' + _.display(), mode).save();
            });
        },

        attachmentSharing: function (baton) {
            if (!settings.get('compose/shareAttachments/enabled', false)) return;
            if (!capabilities.has('infostore')) return;
            if (_.device('smartphone')) return;

            require(['io.ox/mail/compose/sharing'], function (SharingView) {
                var view = baton.sharingView = new SharingView({
                    model: baton.model
                });
                baton.attachmentsView.$header.find('.links').before(view.render().$el);
            });
        },


        mailSize: function (baton) {
            var attachmentView = baton.attachmentsView,
                node = $('<span class="mail-size">');

            attachmentView.$footer.append(node);

            var update = _.debounce(function () {
                    var hasUploadedAttachments = baton.model.get('attachments').some(function (model) {
                            return model.get('group') === 'mail';
                        }),
                        isDriveMail = !!(baton.model.get('sharedAttachments') || {}).enabled,
                        visible = hasUploadedAttachments && !isDriveMail;
                    node.text(gt('Mail size: %1$s', getMailSize())).toggleClass('invisible', !visible);
                }, 10),
                lazyUpdate = _.throttle(update, 5000);
            update();

            attachmentView.listenTo(attachmentView.collection, 'add remove reset change:size', update);
            attachmentView.listenTo(baton.model, 'change:sharedAttachments', update);
            attachmentView.listenTo(baton.model, 'change:content', lazyUpdate);

            function getMailSize() {
                var content = baton.model.get('content').replace(/src="data:image[^"]*"/g, ''),
                    mailSize = content.length,
                    attachmentSize = baton.model.get('attachments').reduce(function (memo, attachment) {
                        // check if inline attachment is really in DOM. Otherwise, it will be removed on send/save
                        if (attachment.get('contentDisposition') === 'INLINE') {
                            var space = baton.model.get('id'),
                                url = mailAPI.getUrl(_.extend({ space: space }, attachment), 'view').replace('?', '\\?'),
                                containsServerReplacedURL = new RegExp('<img[^>]*src="' + url + '"[^>]*>').test(baton.model.get('content')),
                                containsClientReplacedURL = new RegExp('<img[^>]*src="[^"]*' + attachment.get('id') + '"[^>]*>').test(baton.model.get('content'));

                            if (!containsServerReplacedURL && !containsClientReplacedURL) return memo;
                        }

                        return memo + (attachment.getSize() || 0);
                    }, 0);

                return strings.fileSize(mailSize + attachmentSize, 1);
            }
        },

        imageResizeOption: function (baton) {
            var attachmentView = baton.attachmentsView,
                resizeView = new ResizeView({ model: baton.config, collection: attachmentView.collection });

            attachmentView.$footer.append(
                resizeView.render().$el
            );

            attachmentView.listenTo(attachmentView.collection, 'add remove reset', _.debounce(update, 0));
            update();

            function update() {
                var models = baton.model.get('attachments').models;
                imageResize.containsResizables(models).then(function (show) {
                    resizeView.$el.toggle(show);
                });
            }
        },

        attachment: (function () {
            function addLocalFile(model, e) {
                var self = this,
                    attachmentCollection = model.get('attachments'),
                    accumulatedSize = attachmentCollection.filter(function (m) {
                        var size = m.get('size');
                        return typeof size !== 'undefined';
                    })
                    .map(function (m) { return m.get('size'); })
                    .reduce(function (m, n) { return m + n; }, 0);

                if (attachmentQuota.checkQuota(e.target.files, accumulatedSize)) {
                    //#. %s is a list of filenames separeted by commas
                    //#. it is used by screenreaders to indicate which files are currently added to the list of attachments
                    self.trigger('aria-live-update', gt('Added %s to attachments.', _(e.target.files).map(function (file) { return file.name; }).join(', ')));
                    var models = _(e.target.files).map(function (file) {
                        var attachment = new Attachments.Model({ filename: file.name, origin: { file: file } });
                        composeUtil.uploadAttachment({
                            model: model,
                            filename: file.filename,
                            origin: { file: file },
                            attachment: attachment
                        });
                        return attachment;
                    });
                    model.attachFiles(models);
                }
            }

            function openFilePicker(model) {
                var self = this;
                require(['io.ox/files/filepicker'], function (Picker) {
                    new Picker({
                        primaryButtonText: gt('Add'),
                        cancelButtonText: gt('Cancel'),
                        header: gt('Add attachments'),
                        multiselect: true,
                        createFolderButton: false,
                        extension: 'io.ox/mail/mobile/navbar',
                        uploadButton: true
                    })
                    .done(function (files) {
                        self.trigger('aria-live-update', gt('Added %s to attachments.', _(files).map(function (file) { return file.filename; }).join(', ')));
                        var models = files.map(function (file) {
                            var attachment = new Attachments.Model({ filename: file.filename });
                            composeUtil.uploadAttachment({
                                model: model,
                                filename: file.filename,
                                origin: { origin: 'drive', id: file.id, folderId: file.folder_id },
                                attachment: attachment
                            });
                            return attachment;
                        });
                        model.attachFiles(models);
                    });
                });
            }

            return function (baton) {
                var fileInput = $('<input type="file" name="file">').css('display', 'none')
                        .on('change', addLocalFile.bind(this, baton.model))
                        // multiple is off on smartphones in favor of camera roll/capture selection
                        .prop('multiple', _.device('!smartphone'));

                if (capabilities.has('infostore')) {
                    var dropdown = new Dropdown({ label: gt('Attachments'), caret: true });
                    this.append(
                        fileInput,
                        dropdown.append(
                            $('<a href="#">').append($.txt(gt('Add local file'))).on('click', function () {
                                //WORKAROUND "bug" in Chromium (no change event triggered when selecting the same file again,
                                //in file picker dialog - other browsers still seem to work)
                                fileInput[0].value = '';
                                fileInput.trigger('click');
                            })
                        )
                        .link('add-file', gt('Add from Drive'), openFilePicker.bind(this, baton.model))
                        .render().$el
                    );
                } else {
                    this.append(
                        // file input
                        fileInput,
                        $('<button type="button" class="btn btn-link">')
                            .text(gt('Attachments'))
                            .on('click', function () {
                                //WORKAROUND "bug" in Chromium (no change event triggered when selecting the same file again,
                                //in file picker dialog - other browsers still seem to work)
                                fileInput[0].value = '';
                                fileInput.trigger('click');
                            })
                    );
                }
            };
        }()),

        body: function () {

            var self = this,
                editorId = _.uniqueId('tmce-'),
                editorToolbarId = _.uniqueId('tmcetoolbar-');

            self.append($('<div class="row">').append($('<div class="col-sm-12">').append(
                $('<div class="editable-toolbar">').attr('id', editorToolbarId),
                $('<div class="editable">').attr('id', editorId).css('min-height', '400px')
            )));
        },

        mailto: function () {
            // register mailto!
            if (settings.get('features/registerProtocolHandler', true)) {
                if (navigator.registerProtocolHandler) {
                    var l = location, $l = l.href.indexOf('#'), url = l.href.substr(0, $l);
                    navigator.registerProtocolHandler(
                        'mailto', url + '#app=' + ox.registry.get('mail-compose') + ':compose&mailto=%s', ox.serverConfig.productNameMail
                    );
                }
            }
        }
    };

    return extensions;
});
