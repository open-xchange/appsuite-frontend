define('io.ox/mail/settings/signatures/settings/pane', [
    'io.ox/core/extensions',
    'gettext!io.ox/mail',
    'settings!io.ox/mail',
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
], function (ext, gt, settings, dialogs, snippets, mini, http, config, notifications, listutils, mailutil, ListView) {

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

                    if (!looksLikeHTML(baton.content)) {
                        // convert to html
                        var str = String(baton.content || '').replace(/[\s\xA0]+$/g, '');

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

        var popup = new dialogs.ModalDialog({ async: true, tabTrap: false, width: 640, addClass: 'io-ox-signature-dialog' });
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
            baton.editor.destroy();
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
            $('<div>').addClass('checkbox').append(
                $('<label>').text(gt('Delete old signatures after import')).prepend(
                    new mini.CheckboxView({ name: 'check', model: model }).render().$el
                )
            ),
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
        id: 'header',
        index: 100,
        draw: function () {
            var buttonContainer = $('<div class="btn-group pull-right">').append(
                $('<button type="button" class="btn btn-primary">').text(gt('Add new signature')).on('click', fnEditSignature)
            );

            this.addClass('io-ox-signature-settings').append(
                $('<h1 class="pull-left">').text(gt('Signatures')),
                !_.device('smartphone') ? buttonContainer : [],
                $('<div class="clearfix">')
            );

            if (config.get('gui.mail.signatures') && !_.isNull(config.get('gui.mail.signatures')) && config.get('gui.mail.signatures').length > 0) {
                buttonContainer.append(
                    $('<button type="button" class="btn btn-default">').text(gt('Import signatures')).on('click', function (e) {
                        fnImportSignatures(e, config.get('gui.mail.signatures'));
                        return false;
                    })
                );
            }
        },
        save: function () {
            settings.saveAndYell().done(function () {
                //update mailapi
                require(['io.ox/mail/api'], function (mailAPI) {
                    mailAPI.updateViewSettings();
                });
            }).fail(function () {
                notifications.yell('error', gt('Could not save settings'));
            });
        }
    });

    ext.point('io.ox/mail/settings/signatures/settings/detail').extend({
        id: 'collection',
        index: 200,
        draw: function (baton) {
            if (_.device('smartphone')) return;

            var collection = new Backbone.Collection(),
                load = function () {
                    snippets.getAll('signature').then(function (sigs) {
                        collection.reset(sigs);
                    });
                };

            load();
            snippets.on('refresh.all', load);

            baton.collection = collection;
        }
    });

    ext.point('io.ox/mail/settings/signatures/settings/detail').extend({
        id: 'signatures',
        index: 300,
        draw: function (baton) {
            if (_.device('smartphone')) return;

            function clickEdit(e) {
                if ((e.type === 'click') || (e.which === 13)) {
                    var id = $(e.currentTarget).closest('li').attr('data-id'),
                        model = baton.collection.get(id);
                    fnEditSignature(e, model.toJSON());
                    e.preventDefault();
                }
            }

            var list = new ListView({
                tagName: 'ul',
                collection: baton.collection,
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
                        this.$el.append($('<div class="signature-preview">').append($('<div>').on('click', clickEdit).append(content)));

                        if (mailutil.getDefaultSignature('compose') === model.get('id')) this.$el.addClass('default');
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
            });

            this.append(list.render().$el);

            function onChangeDefault() {
                var id = mailutil.getDefaultSignature('compose');
                list.$('.default').removeClass('default');
                list.$('[data-id="' + id + '"]').addClass('default');
            }

            settings.on('change:defaultSignature', onChangeDefault);
            list.on('dispose', function () {
                settings.off('change:defaultSignature', onChangeDefault);
            });
        }
    });

    ext.point('io.ox/mail/settings/signatures/settings/detail').extend({
        id: 'selection',
        index: 400,
        draw: function (baton) {
            if (_.device('smartphone')) return;

            var defaultSignatureView = new mini.SelectView({
                    list: [],
                    name: 'defaultSignature',
                    model: settings,
                    id: 'defaultSignature',
                    className: 'form-control'
                }),
                defaultReplyForwardView = new mini.SelectView({
                    list: [],
                    name: 'defaultReplyForwardSignature',
                    model: settings,
                    id: 'defaultReplyForwardSignature',
                    className: 'form-control'
                });

            function makeOption(model) {
                return $('<option>').attr({ 'value': model.get('id') }).text(model.get('displayname'));
            }

            baton.collection.on('reset', function () {
                defaultSignatureView.$el.empty().append(
                    $('<option value="">').text(gt('No signature')),
                    baton.collection.map(makeOption)
                ).val(mailutil.getDefaultSignature('compose'));
                defaultReplyForwardView.$el.empty().append(
                    $('<option value="">').text(gt('No signature')),
                    baton.collection.map(makeOption)
                ).val(mailutil.getDefaultSignature('reply/forward'));
            });

            this.append(
                $('<div class="row">').append(
                    $('<div class="form-group col-xs-12 col-md-6">').append(
                        $('<label for="defaultSignature" class="control-label">')
                        .text(gt('Default signature for new messages')),
                        $('<div>').addClass('controls').append(
                            defaultSignatureView.render().$el
                        )
                    ),
                    $('<div class="form-group col-xs-12 col-md-6">').append(
                        $('<label for="defaultSignature" class="control-label">')
                        .text(gt('Default signature for replies or forwardings')),
                        $('<div>').addClass('controls').append(
                            defaultReplyForwardView.render().$el
                        )
                    )
                )
            );

            // if the collection is already filled trigger reset, so the selectionbox options are drawn
            if (baton.collection.models.length) {
                baton.collection.trigger('reset');
            }
        }
    });

    ext.point('io.ox/mail/settings/signatures/settings/detail').extend({
        id: 'signatures-mobile',
        index: 500,
        draw: function () {
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

            this.append(
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
    });
});
