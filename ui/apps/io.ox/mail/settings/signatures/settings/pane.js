define('io.ox/mail/settings/signatures/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'gettext!io.ox/mail',
    'settings!io.ox/mail',
    'io.ox/core/settings/util',
    'io.ox/backbone/views/modal',
    'io.ox/core/api/snippets',
    'io.ox/backbone/mini-views',
    'io.ox/core/config',
    'io.ox/core/notifications',
    'io.ox/backbone/mini-views/listutils',
    'io.ox/mail/util',
    'io.ox/mail/api',
    'io.ox/backbone/mini-views/settings-list-view',
    'io.ox/core/tk/contenteditable-editor',
    'io.ox/mail/compose/inline-images',
    'static/3rd.party/purify.min.js',
    'less!io.ox/mail/settings/signatures/style'
], function (ext, ExtensibleView, gt, settings, util, ModalDialog, snippets, mini, config, notifications, listutils, mailutil, mailAPI, ListView, Editor, inline, DOMPurify) {

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
                editorId =  _.uniqueId('editor-'),
                container;
            this.$body.append(
                $('<div class="form-group">').css({
                    'min-height': '266px',
                    'height': '266px'
                }).append(
                    container = $('<div class="editor">').attr('data-editor-id', editorId),
                    $('<div class="tinymce-toolbar">').attr('data-editor-id', editorId)
                )
            );

            new Editor(container, {
                toolbar1: 'bold italic | alignleft aligncenter alignright | link image',
                advanced: 'fontselect fontsizeselect forecolor | code',
                css: {
                    //overwrite min-height of editor
                    'min-height': '230px',
                    'height': '230px',
                    'overflow-y': 'auto'
                },
                height: 230,
                plugins: 'autolink oximage oxpaste oxdrop link paste textcolor emoji lists code',
                class: 'io-ox-signature-edit',
                keepalive: mailAPI.keepalive,
                oxContext: { signature: true },
                imageLoader: {
                    upload: function (file) {
                        return inline.api.inlineImage({ file: file, editor: baton.view.editor.tinymce() });
                    },
                    getUrl: function (response) {
                        return inline.api.getInsertedImageUrl(response);
                    }
                }
            }).done(function (editor) {
                var str = DOMPurify.sanitize(signature.content);
                editor.show();
                if (signature.content && !looksLikeHTML(str)) str = $('<p>').append(editor.ln2br(str)).prop('outerHTML');
                editor.setContent(str);
                baton.view.editor = editor;
            });
        }
    });

    ext.point('io.ox/mail/settings/signature-dialog/edit').extend({
        id: 'position',
        index: 400,
        render: function () {
            var signature = this.getSignature();

            this.$body.append(
                $('<div class="form-group">').append(
                    $('<select id="signature-position" class="form-control">')
                        .append(
                            $('<option value="above">').text(gt('Add signature above quoted text')),
                            $('<option value="below">').text(gt('Add signature below quoted text'))
                        )
                        .val(signature.misc.insertion)
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
                var editor = baton.view.editor.tinymce();
                baton.data.content = baton.view.editor.getContent({ format: 'html' });
                if (!editor || !editor.plugins.oximage) return $.when();
                var ids = $('img[data-pending="true"]', editor.getElement()).map(function () {
                        return $(this).attr('data-id');
                    }),
                    deferreds = editor.plugins.oximage.getPendingDeferreds(ids);
                return $.when.apply($, deferreds).then(function () {
                    // maybe image references were updated
                    baton.data.content = baton.view.editor.getContent({ format: 'html' });
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
                    notifications.yell(error);
                    baton.view.idle();
                });
            }
        }
    );

    function fnEditSignature(e, signature) {
        signature = signature || { id: null, name: '', signature: '', misc: {
            insertion: settings.get('defaultSignaturePosition', 'below') }
        };

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
        .addCancelButton()
        .addButton({ action: 'save', label: gt('Save') })
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

    function looksLikeHTML(str) {
        return /(<\/?\w+(\s[^<>]*)?>)/.test(str || '');
    }

    function sanitize(str) {
        str = $.trim(String(str || ''))
            // remove trailing whitespace of every line
            .replace(/[\s\xA0]+$/g, '')
            // fix very special case
            .replace(/^<pre>([\s\S]+)<\/pre>$/, '$1');

        if (!looksLikeHTML(str)) {
            // plain text
            str = _.escape(str).replace(/\n+/g, '<br>');
        } else {
            str = str
                // remove white-space first (carriage return, line feed, tab)
                .replace(/[\r\n\t]/g, '')
                // replace <br>, <div>, and <p> by line breaks
                .replace(/(<br>|<br><\/div>|<\/div>|<\/p>)/gi, '\n')
                // remove all other tags
                .replace(/<(?:.|\n)*?>/gm, '')
                // now convert line breaks to <br>
                .replace(/\n+/g, '<br>');
        }
        return DOMPurify.sanitize(str);
    }

    function fnImportSignatures(e) {

        var signatures = config.get('gui.mail.signatures');

        return new ModalDialog({
            width: 640,
            async: true,
            title: gt('Import signatures'),
            point: 'io.ox/mail/settings/signature-dialog/import',
            model: new Backbone.Model()
        })
        .build(function () {
            this.$body.append(
                $('<p class="help-block">').text(gt('You can import all existing signatures from the previous product generation at once.')),
                util.checkbox('delete', gt('Delete old signatures after import'), this.model),
                $('<ul class="io-ox-signature-import">').append(
                    _(signatures).map(function (sig) {
                        // replace div and p elements to br's and remove all other tags
                        var preview = sanitize(sig.signature_text);
                        // if preview is empty or a single br-tag use fallback
                        if (preview === '' || preview === '<br>') preview = $('<i>').text(gt('No preview available'));
                        return $('<li>').append(
                            $('<div class="signature-name">').text(sig.signature_name),
                            $('<div class="signature-preview">').append(preview)
                        );
                    })
                )
            );
        })
        .addCancelButton()
        .addButton({ action: 'import', label: gt('Import') })
        .on('import', function () {
            var view = this,
                button = $(e.target);

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
                }).fail(notifications.yell);
            });

            $.when.apply($, deferreds).then(function () {
                if (view.model.get('delete')) {
                    button.remove();
                    config.remove('gui.mail.signatures');
                    config.save();
                }
                view.close();
            }, function () {
                view.idle();
            });
        })
        .open();
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
                            mailAPI.updateViewSettings();
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
                    util.header(_.device('smartphone') ? gt('Signature') : gt('Signatures'))
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
                        .on('click', fnImportSignatures)
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
                    var composeId = mailutil.getDefaultSignature('new'),
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
                                var preview = sanitize(model.get('content'));
                                this.$('.list-item-controls').append(
                                    listutils.controlsEdit(),
                                    listutils.controlsDelete()
                                );
                                this.$el.append(
                                    $('<div class="signature-preview">').append(
                                        $('<div>').on('click', clickEdit.bind(self)).append(preview)
                                    )
                                );
                                onChangeDefault();
                            }
                        }
                    })
                    .on('edit', clickEdit)
                    .on('delete', function (e) {
                        var id = $(e.currentTarget).closest('li').attr('data-id');
                        if (mailutil.getDefaultSignature('new') === id) settings.set('defaultSignature', '');
                        if (mailutil.getDefaultSignature('reply/forward') === id) settings.set('defaultReplyForwardSignature', '');
                        snippets.destroy(id).fail(notifications.yell);
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
                        .val(mailutil.getDefaultSignature('new'));
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
                            $('<label for="defaultReplyForwardSignature" class="control-label">')
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
