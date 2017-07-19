define('io.ox/mail/settings/signatures/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'gettext!io.ox/mail',
    'settings!io.ox/mail',
    'io.ox/core/settings/util',
    'io.ox/core/tk/dialogs',
    'io.ox/core/api/snippets',
    'io.ox/backbone/mini-views',
    'io.ox/core/http',
    'io.ox/core/config',
    'io.ox/core/notifications',
    'io.ox/backbone/mini-views/listutils',
    'io.ox/mail/util',
    'io.ox/backbone/mini-views/settings-list-view',
    'less!io.ox/mail/settings/signatures/style'
], function (ext, ExtensibleView, gt, settings, util, dialogs, snippets, mini, http, config, notifications, listutils, mailutil, ListView) {

    'use strict';

    /**
     * By updating the last access timestamp the referenced file is prevented from being deleted from both session and disk storage.
     * Needed for inline images
     */
    function keepAlive(id) {
        return http.GET({
            module: 'file',
            params: { action: 'keepalive', id: id }
        });
    }

    ext.point('io.ox/mail/settings/signature-dialog').extend({
        id: 'name',
        index: 100,
        draw: function (baton) {
            this.append(
                $('<div class="form-group">').append(
                    baton.$.name = $('<input id="signature-name" type="text" class="form-control">').attr('placeholder', gt('Signature name'))
                )
            );
        }
    });

    ext.point('io.ox/mail/settings/signature-dialog').extend({
        id: 'error',
        index: 200,
        draw: function (baton) {
            this.append(
                baton.$.error = $('<div class="help-block error">').attr('id', _.uniqueId('error-help-'))
            );
        }
    });

    ext.point('io.ox/mail/settings/signature-dialog').extend({
        id: 'textarea',
        index: 300,
        draw: function (baton) {
            this.append(
                $('<div class="form-group">').css({
                    'min-height': '266px',
                    height: '266px'
                }).append(
                    baton.$.contentEditable = $('<div>').attr('data-editor-id', baton.editorId)
                )
            );

            require(['io.ox/core/tk/contenteditable-editor'], function (Editor) {
                new Editor(baton.$.contentEditable, {
                    toolbar1: 'bold italic | alignleft aligncenter alignright | link image',
                    advanced: 'fontselect fontsizeselect forecolor | code',
                    css: {
                        'min-height': '230px', //overwrite min-height of editor
                        'height': '230px',
                        'overflow-y': 'auto'
                    },
                    class: 'io-ox-signature-edit',
                    keepalive: keepAlive,
                    scrollpane: baton.$.contentEditable,
                    oxContext: { signature: true }
                }).done(function (ed) {
                    baton.editor = ed;
                    baton.editor.show();
                    baton.content = baton.content || '';

                    if (baton.content && !looksLikeHTML(baton.content)) {
                        // convert to html
                        var str = String(baton.content).replace(/[\s\xA0]+$/g, '');
                        baton.content = $('<p>').append(baton.editor.ln2br(str)).prop('outerHTML');
                    }

                    baton.editor.setContent(baton.content);
                });
            });
        }
    });

    ext.point('io.ox/mail/settings/signature-dialog').extend({
        id: 'position',
        index: 400,
        draw: function (baton) {
            this.append(
                $('<div class="form-group">').append(
                    baton.$.insertion = $('<select id="signature-position" class="form-control">')
                        .append(
                            $('<option value="above">').text(gt('Add signature above quoted text')),
                            $('<option value="below">').text(gt('Add signature below quoted text'))
                        )
                        .val(settings.get('defaultSignaturePosition', 'below'))
                )
            );
        }
    });

    function looksLikeHTML(str) {
        str = str || '';
        return (/<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/).test(str);
    }

    function fnEditSignature(evt, signature) {
        if (!signature) {
            signature = {
                id: null,
                name: '',
                signature: ''
            };
        }

        function validateField(field, target) {
            if ($.trim(field.val()) === '') {
                //trim here because backend does not allow names containing only spaces
                field.addClass('error').attr({
                    'aria-invalid': true,
                    'aria-describedby': target.attr('id')
                });
                target.text(gt('Please enter a valid name'));
            } else {
                field.removeClass('error').removeAttr('aria-invalid aria-describedby');
                target.empty();
            }
        }

        if (_.isString(signature.misc)) { signature.misc = JSON.parse(signature.misc); }

        var popup = new dialogs.ModalDialog({ async: true, width: 640, addClass: 'io-ox-signature-dialog' });
        popup.header($('<h4>').text(signature.id === null ? gt('Add signature') : gt('Edit signature')));

        var baton = new ext.Baton({
            editorId: _.uniqueId('editor-'),
            content: signature.content
        });
        ext.point('io.ox/mail/settings/signature-dialog').invoke('draw', popup.getContentNode(), baton);

        popup.addPrimaryButton('save', gt('Save'), 'save')
        .addButton('cancel', gt('Cancel'), 'cancel')
        .on('save', function () {
            if (baton.$.name.val() !== '') {
                var update = signature.id ? {} : { type: 'signature', module: 'io.ox/mail', displayname: '', content: '', misc: { insertion: 'below', 'content-type': 'text/html' } },
                    editorContent = baton.editor.getContent();

                update.id = signature.id;
                update.misc = { insertion: baton.$.insertion.val(), 'content-type': 'text/html' };

                if (editorContent !== signature.content) update.content = editorContent;
                if (baton.$.name.val() !== signature.displayname) update.displayname = baton.$.name.val();

                // remove trailing whitespace when copy/paste signatures out of html pages
                if (update && update.content) update.content = update.content.replace(/(<br>)\s+(\S)/g, '$1$2');

                popup.busy();

                var def = null;
                if (signature.id) {
                    def = snippets.update(update);
                } else {
                    def = snippets.create(update);
                }
                def.done(function () {
                    snippets.getAll('signature').done(function (sigs) {
                        // set very first signature as default if no other signatures exist
                        if (sigs.length === 1) {
                            settings.set('defaultSignature', sigs[0].id).save();
                        }
                        popup.idle();
                        popup.close();
                    });
                }).fail(function (error) {
                    require(['io.ox/core/notifications'], function (notifications) {
                        notifications.yell(error);
                        popup.idle();
                    });
                });
            } else {
                popup.idle();
                validateField(baton.$.name, baton.$.error);
            }
        })
        .on('close', function () {
            if (baton.editor) baton.editor.destroy();
        })
        .show();

        baton.$.name.val(signature.displayname);
        baton.$.name.focus();

        if (_.isObject(signature.misc) && signature.misc.insertion) {
            baton.$.insertion.val(signature.misc.insertion);
        }

        _.defer(function () {
            if (signature.displayname) {
                baton.$.contentEditable.select();
            } else {
                baton.$.name.select();
            }
        });

        baton.$.name.on('change', function () {
            validateField(baton.$.name, baton.$.error);
        });
    }

    function fnImportSignatures(evt, signatures) {

        // create modal dialog with a list of old signatures (ox 6)
        var dialog = new dialogs.ModalDialog({ async: true }),
            Model = Backbone.Model.extend({
                defaults: {
                    check: false
                }
            }),
            model = new Model();
        dialog.header($('<h4>').text(gt('Import signatures')))
        .append(
            $('<p class="help-block">').text(gt('You can import existing signatures from the previous product generation.')),
            util.checkbox('check', gt('Delete old signatures after import'), model),
            $('<ul class="io-ox-signature-import">').append(
                _(signatures).map(function (sig) {
                    //replace div and p elements to br's and remove all other tags.
                    var preview = (sig.signature_text || '')
                        .replace(/<(br|\/br|\/p|\/div)>(?!$)/g, '\n')
                        .replace(/<(?:.|\n)*?>/gm, '')
                        .replace(/(\n)+/g, '<br>');

                    // if preview is empty or a single br-tag, do not append a preview
                    if (preview === '' || preview === '<br>') {
                        return '';
                    }

                    return $('<li>').append(
                        $('<div class="signature-name">').text(sig.signature_name),
                        $('<div class="signature-preview">').append(preview)
                    );
                })
            )
        )
        .addPrimaryButton('import', gt('Import'))
        .addButton('cancel', gt('Cancel'));

        // show dialog
        dialog.show();

        dialog.on('import', function () {
            dialog.busy();

            var deferreds = _(signatures).map(function (sig) {
                return snippets.create({
                    type: 'signature',
                    module: 'io.ox/mail',
                    displayname: sig.signature_name,
                    content: sig.signature_text,
                    misc: {
                        insertion: sig.position,
                        'content-type': 'text/html'
                    },
                    meta: {
                        imported: sig
                    }
                }).fail(require('io.ox/core/notifications').yell);
            });

            if (model.get('check')) config.remove('gui.mail.signatures');

            $.when.apply(this, deferreds).then(function success() {
                dialog.close();
                if (model.get('check')) {
                    config.save();
                    evt.target.remove();
                }
            }, function fail() {
                dialog.idle();
            });
        });
    }

    ext.point('io.ox/mail/settings/signatures/settings/detail').extend({
        id: 'view',
        index: 100,
        draw: function () {
            this.append(
                new ExtensibleView({ point: 'io.ox/mail/settings/signatures/detail/view', model: settings })
                .build(function () {
                    this.listenTo(settings, 'change', function () {
                        settings.saveAndYell().done(function () {
                            //update mailapi
                            require(['io.ox/mail/api'], function (mailAPI) {
                                mailAPI.updateViewSettings();
                            });
                        });
                    });
                })
                .render().$el
            );
        }
    });

    ext.point('io.ox/mail/settings/signatures/detail/view').extend(
        //
        // Header
        //
        {
            id: 'header',
            index: 100,
            render: function () {
                this.$el.addClass('io-ox-signature-settings').append(
                    util.header(gt('Signatures'))
                );
            }
        },
        //
        // Buttons
        //
        {
            id: 'buttons',
            index: 200,
            render: function () {

                if (_.device('smartphone')) return;

                var $el = $('<div class="form-group buttons">').append(
                    $('<button type="button" class="btn btn-primary">').append(
                        $('<i class="fa fa-plus" aria-hidden="true">'), $.txt(gt('Add new signature'))
                    )
                    .on('click', fnEditSignature)
                );

                if (config.get('gui.mail.signatures') && !_.isNull(config.get('gui.mail.signatures')) && config.get('gui.mail.signatures').length > 0) {
                    $el.append(
                        $('<button type="button" class="btn btn-default">')
                        .text(gt('Import signatures') + ' ...')
                        .on('click', function (e) {
                            fnImportSignatures(e, config.get('gui.mail.signatures'));
                            return false;
                        })
                    );
                }

                this.$el.append($el);
            }
        },
        //
        // Collection
        //
        {
            id: 'collection',
            index: 300,
            render: function () {

                if (_.device('smartphone')) return;

                var collection = this.collection = new Backbone.Collection();

                load();
                snippets.on('refresh.all', load);

                this.on('dispose', function () {
                    snippets.off('refresh.all', load);
                });

                function load() {
                    snippets.getAll('signature').then(function (sigs) {
                        collection.reset(sigs);
                    });
                }
            }
        },
        //
        // List view
        //
        {
            id: 'list-view',
            index: 400,
            render: function () {

                if (_.device('smartphone')) return;

                function clickEdit(e) {
                    if ((e.type === 'click') || (e.which === 13)) {
                        var id = $(e.currentTarget).closest('li').attr('data-id'),
                            model = this.collection.get(id);
                        fnEditSignature(e, model.toJSON());
                        e.preventDefault();
                    }
                }

                var onChangeDefault = _.throttle(function () {
                    var composeId = mailutil.getDefaultSignature('compose'),
                        replyForwardId = mailutil.getDefaultSignature('reply/forward');
                    this.$('.default').removeClass('default').find('>.default-label').remove();
                    this.$('[data-id="' + replyForwardId + '"]')
                        .addClass('default')
                        .append($('<div class="default-label">').append(
                            $('<span class="label label-primary">').text(composeId === replyForwardId ? gt('Default signature') : gt('Default signature for replies or forwardings'))
                        ));
                    if (composeId === replyForwardId) return;
                    this.$('[data-id="' + composeId + '"]')
                        .addClass('default')
                        .append($('<div class="default-label">').append(
                            $('<span class="label label-default">').text(gt('Default signature for new messages'))
                        ));
                }.bind(this), 100);

                this.$el.append(
                    new ListView({
                        tagName: 'ul',
                        collection: this.collection,
                        childOptions: {
                            titleAttribute: 'displayname',
                            customize: function (model) {
                                var content = model.get('content')
                                    .replace(/<(br|\/br|\/p|\/div)>(?!$)/g, '\n')
                                    .replace(/<(?:.|\n)*?>/gm, '')
                                    .replace(/(\n)+/g, '<br>');

                                this.$('.list-item-controls').append(
                                    listutils.controlsEdit(),
                                    listutils.controlsDelete()
                                );
                                this.$el.append(
                                    $('<div class="signature-preview">').append(
                                        $('<div>').on('click', clickEdit.bind(this)).append(content)
                                    )
                                );
                                onChangeDefault();
                            }
                        }
                    })
                    .on('edit', clickEdit)
                    .on('delete', function (e) {
                        var id = $(e.currentTarget).closest('li').attr('data-id');
                        if (mailutil.getDefaultSignature('compose') === id) settings.set('defaultSignature', '');
                        if (mailutil.getDefaultSignature('replay/forward') === id) settings.set('defaultReplyForwardSignature', '');
                        snippets.destroy(id).fail(require('io.ox/core/notifications').yell);
                        e.preventDefault();
                    })
                    .render().$el
                );

                this.listenTo(settings, 'change:defaultSignature change:defaultReplyForwardSignature', onChangeDefault);
            }
        },
        //
        // Selection
        //
        {
            id: 'selection',
            index: 500,
            render: function () {

                if (_.device('smartphone')) return;

                var defaultSignatureView = new mini.SelectView({
                        list: [],
                        name: 'defaultSignature',
                        model: settings,
                        id: 'defaultSignature'
                    }),
                    defaultReplyForwardView = new mini.SelectView({
                        list: [],
                        name: 'defaultReplyForwardSignature',
                        model: settings,
                        id: 'defaultReplyForwardSignature'
                    });

                function makeOption(model) {
                    return $('<option>').attr({ 'value': model.get('id') }).text(model.get('displayname'));
                }

                this.collection.on('reset', function () {
                    defaultSignatureView.$el.empty()
                        .append(
                            $('<option value="">').text(gt('No signature')),
                            this.map(makeOption)
                        )
                        .val(mailutil.getDefaultSignature('compose'));
                    defaultReplyForwardView.$el.empty()
                        .append(
                            $('<option value="">').text(gt('No signature')),
                            this.map(makeOption)
                        )
                        .val(mailutil.getDefaultSignature('reply/forward'));
                });

                this.$el.append(
                    $('<div class="row">').append(
                        $('<div class="form-group col-xs-12 col-md-6">').append(
                            $('<label for="defaultSignature" class="control-label">')
                            .text(gt('Default signature for new messages')),
                            $('<div class="controls">').append(
                                defaultSignatureView.render().$el
                            )
                        ),
                        $('<div class="form-group col-xs-12 col-md-6">').append(
                            $('<label for="defaultSignature" class="control-label">')
                            .text(gt('Default signature for replies or forwards')),
                            $('<div class="controls">').append(
                                defaultReplyForwardView.render().$el
                            )
                        )
                    )
                );

                // always trigger a reset, even if the collection is empty, so the no signature option is displayed properly.
                this.collection.trigger('reset');
            }
        },
        //
        // Smartphone
        //
        {
            id: 'smartphone',
            index: 1000,
            render: function () {

                if (_.device('!smartphone')) return;

                var radioCustom,
                    signatureText,
                    type = settings.get('mobileSignatureType');

                function radioChange() {
                    var type = radioCustom.prop('checked') ? 'custom' : 'none';
                    settings.set('mobileSignatureType', type);
                }

                function textChange() {
                    settings.set('mobileSignature', signatureText.val());
                }

                if (type !== 'custom') type = 'none';

                this.$el.append(
                    $('<div class="form-group">').append(
                        $('<div class="radio">').append(
                            $('<label>').append(
                                $('<input type="radio" name="mobileSignature">')
                                    .prop('checked', type === 'none'),
                                gt('No signature')
                            )
                            .on('change', radioChange)
                        ),
                        $('<div class="radio">').append(
                            $('<label>').append(
                                radioCustom = $('<input type="radio" name="mobileSignature">')
                                .prop('checked', type === 'custom')
                                .on('change', radioChange),
                                signatureText = $('<textarea class="form-control col-xs-12" rows="5">')
                                .val(settings.get('mobileSignature'))
                                .on('change', textChange)
                            )
                        )
                    )
                );
            }
        }
    );
});
