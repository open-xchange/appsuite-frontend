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
], function (sender, mini, Dropdown, ext, Tokenfield, dropzone, capabilities, settings, gt) {

    function renderFrom(array) {
        if (!array) return;
        var name = _(array).first(),
            address = _(array).last();
        return [
            $('<span class="name">').text(name ? name + ' ' : ''),
            $('<span class="address">').text('<' + address + '>')
        ];
    }

    var SenderDropdown = Dropdown.extend({

        label: function () {
            var from = _(this.model.get('from')).first();
            this.$('.dropdown-label').empty().append(renderFrom(from));
        }
    });

    var POINT = 'io.ox/mail/compose';

    //make strings accessible to translators
    var tokenfieldTranslations = {
        to: gt('To'),
        cc: gt('CC'),
        bcc: gt('BCC'),
        reply_to: /*#. Must not exceed 8 characters. e.g. German would be: "Antworten an", needs to be abbreviated like "Antw. an" as space is very limited */ gt.pgettext('compose', 'Reply to')
    };

    var extensions = {

        header: function (baton) {
            if (!baton.view.app.getWindow()) return;
            var header = $('<div class="row" data-extension-id="header">');
            ext.point(POINT + '/header').invoke('draw', header, baton);
            baton.view.app.getWindow().setHeader(header).addClass('container default-header-padding');
        },

        title: function () {
            this.append(
                $('<h1 class="col-sm-6 hidden-xs clear-title title">').text(gt('Compose new mail'))
            );
        },

        buttons: function (baton) {
            this.append(
                $('<div class="col-xs-12 col-sm-6 text-right">').append(
                        $('<button type="button" class="btn btn-primary" data-action="send">')
                            .on('click', function () { baton.view.send(); })
                            .text(gt('Send')),
                    $('<button type="button" class="btn btn-default" data-action="save">')
                        .on('click', function () {
                            if (baton.view.isSaving === true) return false;
                            baton.view.isSaving = true;
                            baton.view.saveDraft().done(function () {
                                baton.view.isSaving = false;
                            }).fail(function () {
                                baton.view.isSaving = false;
                            });
                        })
                        .text(gt('Save')),
                    $('<button type="button" class="btn btn-default" data-action="discard">')
                        .on('click', function () { baton.view.app.quit(); })
                        .text(gt('Discard'))
                )
            );
        },

        sender: function (baton) {

            var node = $('<div class="row sender" data-extension-id="sender">'),
                render = function () {
                    var defaultSender = _(baton.model.get('from')).first(),
                        dropdown = new SenderDropdown({
                            model: baton.model,
                            label: _(defaultSender).first() + ' <' + _(defaultSender).last() + '>',
                            aria: gt('From'),
                            caret: true
                        });

                    sender.drawDropdown().done(function (list) {

                        if (list.sortedAddresses.length >= 1) {
                            _.each(_(list.sortedAddresses).pluck('option'), function (item) {
                                dropdown.option('from', [item], function () {
                                    return renderFrom(item);
                                });
                            });
                        }

                        node.append(
                            $('<label class="maillabel col-xs-2 col-sm-1">').text(gt('From')),
                            $('<div class="col-xs-10 col-sm-11">').append(
                                dropdown.render().$el.attr({ 'data-dropdown': 'from' })
                            )
                        );
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
            var node = $('<a href="#" tabindex="1" data-action="add" role="checkbox" aria-checked="false">').append($('<span class="fa fa-angle-right">'));
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
                    tokenfieldView = new Tokenfield({
                        id: guid,
                        className: attr,
                        placeholder: false,
                        apiOptions: {
                            contacts: true,
                            distributionlists: true,
                            msisdn: true,
                            emailAutoComplete: true
                        },
                        maxResults: 20,
                        draw: function (token) {
                            baton.participantModel = token.model;
                            ext.point(POINT + '/autoCompleteItem').invoke('draw', this, baton);
                        }
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

                // bind model to collection
                tokenfieldView.listenTo(baton.model, 'change:' + attr, function (mailModel, recipients) {
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

                baton.model.trigger('change:' + attr, baton.model, baton.model.get(attr));

                tokenfieldView.collection.on('change add remove sort', function () {
                    var recipients = this.map(function (model) {
                        var token = model.get('token');
                        return [token.label, token.value];
                    });
                    baton.model.set(attr, recipients, { silent: true });
                });
            };
        },

        subject: function (baton) {
            var guid = _.uniqueId('form-control-label-');
            this.append(
                $('<div class="row subject" data-extension-id="subject">').append(
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
                    baton.view.signatures = signatures;
                    baton.view.signaturesLoading.resolve(signatures);
                    var sa = _.map(signatures, function (o) {
                        return { 'id': o.id, 'displayName': o.displayname };
                    });

                    if (sa.length >= 1) {
                        _.each(sa, function (item) {
                            self.data('view').option('signature', item.id, item.displayName);
                        });
                    }
                });
            });
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
                // only for browsers != firefox due to a bug in firefox
                // https://bugzilla.mozilla.org/show_bug.cgi?id=440620
                // maybe this will be fixed in the future by mozilla
                if (navigator.registerProtocolHandler && !_.browser.Firefox) {
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
