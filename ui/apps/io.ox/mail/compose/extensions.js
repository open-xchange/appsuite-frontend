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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/compose/extensions', [
    'io.ox/contacts/api',
    'io.ox/mail/sender',
    'io.ox/backbone/mini-views/common',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/extensions',
    'io.ox/core/tk/tokenfield',
    'io.ox/core/dropzone',
    'io.ox/core/capabilities',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'static/3rd.party/jquery-ui.min.js'
], function (contactAPI, sender, mini, Dropdown, ext, Tokenfield, dropzone, capabilities, settings, gt) {

    var POINT = 'io.ox/mail/compose';

    //make strings accessible to translators
    var tokenfieldTranslations = {
        to: gt('To'),
        cc: gt('CC'),
        bcc: gt('BCC')
    };

    var extensions = {

        header: function (baton) {
            if (!baton.view.app.getWindow()) return;
            var header = $('<div data-extension-id="header">');
            ext.point(POINT + '/header').invoke('draw', header, baton);
            baton.view.app.getWindow().setHeader(header);
        },

        title: function () {
            this.append(
                $('<h1 class="sr-only">').text(gt('Compose new mail'))
            );
        },

        buttons: {
            discard: function (baton) {
                this.append(
                    $('<button type="button" class="btn btn-default" data-action="discard">')
                        .on('click', function () { baton.view.app.quit(); })
                        .text(gt('Discard')));
            },
            save: function (baton) {
                this.append($('<button type="button" class="btn btn-default" data-action="save">')
                    .on('click', function () {
                        if (baton.view.isSaving === true) return false;
                        baton.view.isSaving = true;
                        baton.view.saveDraft().done(function () {
                            baton.view.isSaving = false;
                        }).fail(function () {
                            baton.view.isSaving = false;
                        });
                    })
                    .text(gt('Save')));
            },
            send: function (baton) {
                this.append($('<button type="button" class="btn btn-primary" data-action="send">')
                    .on('click', function () { baton.view.send(); })
                    .text(gt('Send')));
            }
        },

        sender: function (baton) {

            function editNames() {
                require(['io.ox/mail/compose/names'], function (names) {
                    names.open();
                });
            }

            var node = $('<div class="row sender" data-extension-id="sender">'),
                render = function () {
                    function renderFrom(array) {
                        if (!array) return;
                        var name = _(array).first(), address = _(array).last();
                        // consider custom settings
                        if (!settings.get('sendDisplayName', true)) {
                            name = null;
                        } else if (settings.get(['customDisplayNames', address, 'overwrite'])) {
                            name = settings.get(['customDisplayNames', address, 'name'], '');
                        }
                        return [
                            $('<span class="name">').text(name ? name + ' ' : ''),
                            $('<span class="address">').text(name ? '<' + address + '>' : address)
                        ];
                    }

                    var defaultSender = _(baton.model.get('from')).first(),
                        dropdown = new Dropdown({
                            model: baton.model,
                            label: renderFrom(defaultSender),
                            aria: gt('From'),
                            caret: true
                        });

                    sender.drawDropdown().done(function (list) {

                        function toggleNames() {
                            var value = !!settings.get('sendDisplayName', true);
                            settings.set('sendDisplayName', !value).save();
                            baton.model.set('sendDisplayName', !value);
                            redraw();
                            // stop propagation to keep drop-down open
                            return false;
                        }

                        function redraw() {
                            var from = _(baton.model.get('from')).first();
                            dropdown.$('ul').empty();
                            drawOptions();

                            dropdown.$('.dropdown-label').empty().append(renderFrom(from));
                            // re-focus element otherwise the bootstap a11y closes the drop-down
                            dropdown.$ul.find('[data-name="toggle-display"]').focus();
                        }

                        function drawOptions() {

                            if (!list.sortedAddresses.length) return;
                            var options = _(list.sortedAddresses).pluck('option');

                            _(options).each(function (item) {
                                dropdown.option('from', [item], function () {
                                    return renderFrom(item);
                                });
                            });

                            if (_.device('smartphone')) return;

                            // append options to toggle and edit names
                            var state = !!settings.get('sendDisplayName', true);
                            dropdown
                                .divider()
                                .link('toggle-display', state ? gt('Hide names') : gt('Show names'), toggleNames)
                                .link('edit-real-names', gt('Edit names'), editNames);
                        }

                        drawOptions();

                        node.append(
                            $('<label class="maillabel col-xs-1">').text(gt('From')),
                            $('<div class="col-xs-11">').append(
                                dropdown.render().$el.attr({ 'data-dropdown': 'from' })
                            )
                        );

                        ox.on('change:customDisplayNames', redraw);
                        baton.view.listenTo(baton.model, 'change:from', redraw);
                    });
                };

            if (!baton.model.get('from')) {
                baton.model.once('change:from', function () {
                    render();
                });
            } else {
                render();
            }

            this.append(node);
        },

        // TODO: only used by search
        tokenPicture: function (model) {
            // add contact picture
            $(this).prepend(
                contactAPI.pictureHalo(
                    $('<div class="contact-image">'),
                    model.toJSON(),
                    { width: 16, height: 16, scaleType: 'contain' }
                )
            );
        },

        recipientActionLink: function (type) {
            return function () {
                var node = $('<a href="#" tabindex="1" data-action="add" role="checkbox" aria-checked="false">');
                if (type === 'cc') {
                    node.attr({ 'data-type': 'cc', 'aria-label': gt('Show carbon copy input field') }).text(gt('CC'));
                } else {
                    node.attr({ 'data-type': 'bcc', 'aria-label': gt('Show blind carbon copy input field') }).text(gt('BCC'));
                }
                this.append(node);
            };
        },

        recipientActionLinkMobile: function () {
            var node = $('<a href="#" tabindex="1" data-action="add" role="checkbox" aria-checked="false">').append($('<span class="fa fa-angle-down">'));
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

        tokenfield: function (label) {

            var attr = String(label).toLowerCase();

            return function (baton) {
                var guid = _.uniqueId('form-control-label-'),
                    value = baton.model.get(attr) || [],
                    // display tokeninputfields if necessary
                    cls = 'row' + (attr === 'to' || value.length ? '' : ' hidden'),
                    redrawLock = false,
                    tokenfieldView = new Tokenfield({
                        id: guid,
                        className: attr,
                        extPoint: POINT,
                        apiOptions: {
                            contacts: true,
                            distributionlists: true,
                            msisdn: true,
                            emailAutoComplete: true
                        },
                        maxResults: 20
                    });

                var node = $('<div class="col-xs-11">').append(
                    tokenfieldView.$el
                );
                if (attr === 'to') {
                    ext.point(POINT + '/recipientActions').invoke('draw', node);
                }

                this.append(
                    $('<div data-extension-id="' + attr + '">').addClass(cls)
                        .append(
                            $('<label class="maillabel col-xs-1">').text(tokenfieldTranslations[attr]).attr({ 'for': guid }),
                            node
                        )
                    );

                tokenfieldView.render().$el.on('tokenfield:createdtoken', function (e) {
                    // extension point for validation etc.
                    ext.point(POINT + '/createtoken').invoke('action', this, _.extend(baton, { event: e }));
                });

                // bind mail-model to collection
                tokenfieldView.listenTo(baton.model, 'change:' + attr, function (mailModel, recipients) {
                    if (redrawLock) return;
                    var recArray = _(recipients).map(function (recipient) {
                        return {
                            type: 5,
                            display_name: recipient[0],
                            email1: recipient[1],
                            token: {
                                label: recipient[0],
                                value: recipient[1]
                            }
                        };
                    });
                    this.collection.reset(recArray);
                });

                // trigger change to fill tokenfield
                baton.model.trigger('change:' + attr, baton.model, baton.model.get(attr));

                tokenfieldView.collection.on('change reset add remove sort', function () {
                    var recipients = this.map(function (model) {
                        var token = model.get('token');
                        return [token.label, token.value];
                    });
                    redrawLock = true;
                    baton.model.set(attr, recipients);
                    redrawLock = false;
                });
            };
        },

        subject: function (baton) {
            var guid = _.uniqueId('form-control-label-');
            this.append(
                $('<div data-extension-id="subject" class="row subject">').append(
                    $('<label class="maillabel hidden-xs col-sm-1">').text(gt('Subject')).attr({
                        'for': guid
                    }),
                    $('<div class="col-xs-12 col-sm-11">').append(
                        new mini.InputView({ model: baton.model, id: guid, name: 'subject' }).render().$el.attr({ placeholder: gt('Subject') })
                    )
                )
            );
        },

        signature: function (baton) {
            if (_.device('smartphone')) return;
            var self = this;
            baton.view.signaturesLoading = $.Deferred();
            require(['io.ox/core/api/snippets'], function (snippetAPI) {
                snippetAPI.getAll('signature').always(function (signatures) {
                    baton.model.set('signatures', signatures);
                    baton.view.signaturesLoading.resolve(signatures);
                    var sa = _.map(signatures, function (o) {
                        return { 'id': o.id, 'displayName': o.displayname };
                    });

                    if (sa.length >= 1) {
                        _.each(sa, function (item) {
                            self.data('view').option('defaultSignatureId', item.id, item.displayName);
                        });
                    }
                });
            });
        },

        signaturemenu: function (baton) {
            if (_.device('smartphone')) return;
            var self = this,
            dropdown = new Dropdown({ model: baton.model, label: gt('Signatures'), caret: true })
                .option('defaultSignatureId', '', gt('No signature'));
            ext.point(POINT + '/signatures').invoke('draw', dropdown.$el, baton);
            dropdown.$ul.addClass('pull-right');
            baton.view.signaturesLoading.done(function (sig) {
                if (sig.length > 0) {
                    dropdown.$ul.addClass('pull-right');
                    dropdown.render().$el.addClass('signatures text-left');
                }
            });
            self.append(dropdown.$el);
        },

        optionsmenu: function (baton) {
            var dropdown = new Dropdown({ model: baton.model, label: gt('Options'), caret: true });
            ext.point(POINT + '/menuoptions').invoke('draw', dropdown.$el, baton);

            dropdown.$ul.addClass('pull-right');

            this.append(dropdown.render().$el.addClass('text-left'));
        },

        attachmentPreviewList: function (baton) {
            var $el = this,
                def = $.Deferred();

            require(['io.ox/core/attachments/view'], function (Attachments) {
                var view = new Attachments.List({
                        collection: baton.model.get('attachments'),
                        editable: true
                    });

                // dropzone
                var zone = new dropzone.Inplace({
                    caption: gt('Drop attachments here')
                });

                zone.on({
                    'show': function () {
                        $el.css('minHeight', '100px');
                    },
                    'hide': function () {
                        $el.css('minHeight', 0);
                    },
                    'drop': function (files) {
                        baton.model.attachFiles(
                            _(files).map(function (file) {
                                return _.extend(file, { group: 'localFile' });
                            })
                        );
                    }
                });

                view.listenTo(baton.model, 'change:attachments', function () {
                    view.$list.empty();
                    view.renderList();
                });

                view.listenToOnce(view.collection, 'add remove reset', _.debounce(function () {
                    if (this.getValidModels().length > 0) {
                        this.$el.addClass('open');
                        if (!this.isListRendered) this.renderList();
                    }
                }));

                view.render();
                if (view.getValidModels().length > 0) {
                    view.renderList();
                    view.$el.addClass('open');
                }
                $el.append(
                    zone.render().$el.addClass('abs'),
                    view.$el
                );

                def.resolve(view);
            }, def.reject);

            return def;
        },

        attachment: (function () {

            function addLocalFile(model, e) {
                model.attachFiles(
                    _(e.target.files).map(function (file) {
                        return _.extend(file, { group: 'localFile' });
                    })
                );
            }

            function openFilePicker(model) {
                require(['io.ox/files/filepicker'], function (Picker) {
                    new Picker({
                        primaryButtonText: gt('Add'),
                        cancelButtonText: gt('Cancel'),
                        header: gt('Add attachments'),
                        multiselect: true
                    })
                    .done(function (files) {
                        model.attachFiles(
                            _(files).map(function (file) {
                                return _.extend(file, { group: 'file' });
                            })
                        );
                    });
                });
            }

            return function (baton) {
                var fileInput = $('<input type="file" name="file" capture="camera">').css('display', 'none')
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
