define('io.ox/mail/settings/signatures/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'gettext!io.ox/mail',
    'settings!io.ox/mail',
    'io.ox/core/settings/util',
    'io.ox/core/tk/dialogs',
    'io.ox/backbone/views/modal',
    'io.ox/core/api/snippets',
    'io.ox/backbone/mini-views',
    'io.ox/core/config',
    'io.ox/core/notifications',
    'io.ox/backbone/mini-views/listutils',
    'io.ox/mail/util',
    'io.ox/backbone/mini-views/settings-list-view',
    'less!io.ox/mail/settings/signatures/style'
], function (ext, ExtensibleView, gt, settings, util, dialogs, ModalDialog, snippets, mini, config, notifications, listutils, mailutil, ListView) {

    'use strict';

    ext.point('io.ox/mail/settings/signature-dialog/edit').extend({
        id: 'name',
        index: 100,
        render: function () {
            var signature = this.getSignature();
            this.$body.append(
                $('<div class="form-group">').append(
                    $('<label for="signature-name" class="sr-only">').text(gt('Signature name')),
                    $('<input id="signature-name" type="text" class="form-control">')
                        .attr('placeholder', gt('Signature name'))
                        .val(signature.displayname)
                        .on('change', this.validateName.bind(this))
                )
            );
            // inital focus
            _.defer(function () {
                this.$('#signature-name').focus();
            }.bind(this));
        }
    });

    ext.point('io.ox/mail/settings/signature-dialog/edit').extend({
        id: 'error',
        index: 200,
        render: function () {
            this.$body.append(
                $('<div class="help-block error">').attr('id', _.uniqueId('error-help-'))
            );
        }
    });

    ext.point('io.ox/mail/settings/signature-dialog/edit').extend({
        id: 'editor',
        index: 300,
        render: function (baton) {
            var signature = baton.view.getSignature(),
                container;
            this.$body.append(
                $('<div class="form-group">').css({
                    'min-height': '266px',
                    'height': '266px'
                }).append(
                    container = $('<div class="editor-container">').attr('data-editor-id', _.uniqueId('editor-'))
                )
            );

            function looksLikeHTML(str) {
                return (/<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/).test(str || '');
            }

            require(['io.ox/core/tk/contenteditable-editor', 'io.ox/mail/api'], function (Editor, mailAPI) {
                new Editor(container, {
                    toolbar1: 'bold italic | alignleft aligncenter alignright | link image',
                    advanced: 'fontselect fontsizeselect forecolor | code',
                    css: {
                        //overwrite min-height of editor
                        'min-height': '230px',
                        'height': '230px',
                        'overflow-y': 'auto'
                    },
                    class: 'io-ox-signature-edit',
                    keepalive: mailAPI.keepalive,
                    scrollpane: container,
                    oxContext: { signature: true }
                }).done(function (editor) {
                    editor.show();
                    signature.content = signature.content || '';
                    if (signature.content && !looksLikeHTML(signature.content)) {
                        // convert to html
                        var str = String(signature.content).replace(/[\s\xA0]+$/g, '');
                        signature = $('<p>').append(editor.ln2br(str)).prop('outerHTML');
                    }
                    editor.setContent(signature.content);
                    baton.view.editor = editor;
                });
            });
        }
    });

    ext.point('io.ox/mail/settings/signature-dialog/edit').extend({
        id: 'position',
        index: 400,
        render: function () {
            var signature = this.getSignature(),
                position = signature.misc.insertion ?
                    signature.misc.insertion :
                    settings.get('defaultSignaturePosition', 'below');

            this.$body.append(
                $('<div class="form-group">').append(
                    $('<select id="signature-position" class="form-control">')
                        .append(
                            $('<option value="above">').text(gt('Add signature above quoted text')),
                            $('<option value="below">').text(gt('Add signature below quoted text'))
                        )
                        .val(position)
                )
            );
        }
    });

    ext.point('io.ox/mail/settings/signature-dialog/save').extend(
        {
            id: 'default',
            index: 100,
            perform: function (baton) {
                var signature = this.getSignature();
                baton.data = {
                    id: signature.id,
                    type: 'signature',
                    module: 'io.ox/mail',
                    displayname: this.$('#signature-name').val(),
                    misc: { insertion: baton.view.$('#signature-position').val(), 'content-type': 'text/html' }
                };
            }
        }, {
            id: 'wait-for-pending-images',
            index: 100,
            perform: function (baton) {
                if (!window.tinymce || !window.tinymce.activeEditor || !window.tinymce.activeEditor.plugins.oximage) return $.when();
                var ids = $('img[data-pending="true"]', window.tinymce.activeEditor.getElement()).map(function () {
                        return $(this).attr('data-id');
                    }),
                    deferreds = window.tinymce.activeEditor.plugins.oximage.getPendingDeferreds(ids);
                return $.when.apply($, deferreds).then(function () {
                    // maybe image references were updated
                    baton.data.content = baton.view.editor.getContent();
                });
            }
        }, {
            id: 'trailing-whitespace',
            index: 100,
            perform: function (baton) {
                // remove trailing whitespace when copy/paste signatures out of html pages
                if (baton.data && baton.data.content) baton.data.content = baton.data.content.replace(/(<br>)\s+(\S)/g, '$1$2');
            }
        }, {
            id: 'save',
            index: 1000,
            perform: function (baton) {
                var def = baton.data.id ? snippets.update(baton.data) : snippets.create(baton.data);
                return def.done(function () {
                    snippets.getAll('signature').done(function (signatures) {
                        // set very first signature as default if no other signatures exist
                        if (signatures.length === 1) settings.set('defaultSignature', signatures[0].id).save();
                        baton.view.close();
                    });
                }).fail(function (error) {
                    require(['io.ox/core/notifications'], function (notifications) {
                        notifications.yell(error);
                        baton.view.idle();
                    });
                });
            }
        }
    );

    function fnEditSignature(evt, signature) {
        signature = signature || { id: null, name: '', signature: '' };

        // support for 'old' signatures
        signature.misc = _.isString(signature.misc) ? JSON.parse(signature.misc) : signature.misc || {};

        return new ModalDialog({
            width: 640,
            async: true,
            title: !signature.id ? gt('Add signature') : gt('Edit signature'),
            point: 'io.ox/mail/settings/signature-dialog/edit'
        })
        .inject({
            'getSignature': function () {
                return signature;
            },
            'validateName': function () {
                var field = this.$('#signature-name'),
                    target = this.$('.help-block.error'),
                    isValid = $.trim(field.val()) !== '';
                field.toggleClass('error', !isValid);
                if (isValid) {
                    field.removeAttr('aria-invalid aria-describedby');
                    return target.empty();
                }
                field.attr({ 'aria-invalid': true, 'aria-describedby': target.attr('id') });
                target.text(gt('Please enter a valid name'));
            }
        })
        .build(function () {
            this.$el.addClass('io-ox-signature-dialog');
        })
        .addButton({ action: 'save', label: gt('Save') })
        .addCancelButton()
        .on('save', function () {
            // cancel 'save' on validation error
            this.validateName();
            if (this.$('input.error').length) return this.idle().$('input.error').first().focus();
            // invoke extensions as a waterfall
            var baton = new ext.Baton({ view: this });
            return ext.point('io.ox/mail/settings/signature-dialog/save')
                    .cascade(this, baton).always(function () {
                        // idle in case it wasn't closed/destroyed yet (error case)
                        if (this && this.idle) this.idle();
                    }.bind(this));
        })
        .on('close', function () { if (this.editor) this.editor.destroy(); })
        .open();
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
                var self = this;

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
                                        $('<div>').on('click', clickEdit.bind(self)).append(content)
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
