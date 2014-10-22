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

define('io.ox/mail/compose/extensions',
    ['io.ox/mail/sender',
     'io.ox/backbone/mini-views/common',
     'io.ox/backbone/mini-views/dropdown',
     'io.ox/core/extensions',
     'io.ox/core/api/autocomplete',
     'io.ox/core/tk/typeahead',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'io.ox/core/dropzone',
     'io.ox/core/capabilities',
     'settings!io.ox/mail',
     'gettext!io.ox/mail',
     'static/3rd.party/jquery-ui.min.js'
    ], function (sender, mini, Dropdown, ext, AutocompleteAPI, autocomplete, contactsAPI, contactsUtil, dropzone, capabilities, settings, gt) {

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

    var autocompleteAPI = new AutocompleteAPI({
        id: 'mailwrite',
        contacts: true,
        msisdn: true
    });

    //make strings accessible to translators
    var tokenfieldTranslations = {
        To: gt('To'),
        CC: gt('CC'),
        BCC: gt('BCC')
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
                    $('<button type="button" class="btn btn-default" data-action="discard">')
                        .on('click', function () { baton.view.app.quit(); })
                        .text(gt('Discard')),
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
                    $('<button type="button" class="btn btn-primary" data-action="send">')
                        .on('click', function () { baton.view.send(); })
                        .text(gt('Send'))
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
                            $('<label class="maillabel col-xs-2 col-md-1">').text(gt('From')),
                            $('<div class="col-xs-10 col-md-11">').append(
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

        tokenfield: function (label, addActions) {

            addActions = addActions || false;
            label = String(label);
            var attr = label.toLowerCase();

            return function (baton) {
                var guid = _.uniqueId('form-control-label-'),
                    value = baton.model.get(attr) || [],
                    // display tokeninputfields if necessary
                    cls = 'row' + (addActions || value.length ? '' : ' hidden'),
                    input;
                this.append(
                    $('<div data-extension-id="' + attr + '">')
                        .addClass(cls)
                        .append(
                            $('<label class="maillabel col-xs-2 col-md-1">').text(tokenfieldTranslations[label]).attr({
                                'for': guid
                            }),
                            $('<div class="col-xs-10 col-md-11">').append(
                                input = $('<input type="text" class="form-control tokenfield">').attr({
                                    id: guid,
                                    tabindex: 1
                                }),
                                attr === 'to' ? $('<div class="recipient-actions">').append(
                                    $('<a>').attr({
                                        href: '#',
                                        tabindex: 1,
                                        'data-action': 'add-cc',
                                        role: 'checkbox',
                                        'aria-checked': false,
                                        'aria-label': gt('Show carbon copy input field')
                                    }).text(gt('CC')),
                                    $('<a>').attr({
                                        href: '#',
                                        tabindex: 1,
                                        'data-action': 'add-bcc',
                                        role: 'checkbox',
                                        'aria-checked': false,
                                        'aria-label': gt('Show blind carbon copy input field')
                                    }).text(gt('BCC'))
                                ) : $()
                            )
                        )
                    );

                input.autocompleteNew({
                    api: autocompleteAPI,
                    maxResults: 20,
                    autoselect: true,
                    tokenfield: true,
                    highlight: true,
                    reduce: function (data) {
                        return data;
                    },
                    stringify: function (data) {
                        return {
                            value: data.email || data.phone || '',
                            label: contactsUtil.getMailFullName(data)
                        };
                    },
                    draw: function (data) {
                        ext.point(POINT + '/autoCompleteItem').invoke('draw', this, _.extend(baton, { data: data }));
                    }
                }).on({
                    'tokenfield:createdtoken': function (e) {
                        // for validation etc.
                        ext.point(POINT + '/createtoken').invoke('action', this, _.extend(baton, { event: e }));
                        // add contact picture
                        if (e.attrs) {
                            var data = e.attrs.data ? e.attrs.data : { email: e.attrs.value };
                            _.extend(data, { width: 16, height: 16, scaleType: 'contain' });
                            $(e.relatedTarget).prepend(
                                contactsAPI.pictureHalo($('<div class="contact-image">'), data)
                            );
                        }
                    },
                    'change': function () {
                        baton.model.setTokens(attr, $(this).tokenfield('getTokens'));
                    }
                });

                // bind tokeninput to model and set initial values
                baton.model.on('change:' + attr, function () {
                    input.tokenfield('setTokens', this.getTokens(attr), false, false);
                }).trigger('change:' + attr);

                // add class to tokenfield wrapper
                input.parent().addClass(attr);

                input.getOriginalInput().data('ttTypeahead').dropdown.onAsync('datasetRendered', function() {
                    $('div.contact-image', this.$menu).lazyload({
                        container: this.$menu
                    });
                });

                // init drag 'n' drop sort
                input.closest('div.tokenfield').sortable({
                    items: '> .token',
                    connectWith: 'div.tokenfield',
                    cancel: 'a.close',
                    placeholder: 'token placeholder',
                    revert: 0,
                    forcePlaceholderSize: true,
                    update: function () {
                        baton.model.setTokens(attr, input.tokenfield('getTokens'));
                    }
                }).droppable({
                    hoverClass: 'drophover'
                });
            };
        },

        subject: function (baton) {
            var guid = _.uniqueId('form-control-label-');
            this.append(
                $('<div class="row subject" data-extension-id="subject">').append(
                    $('<label class="maillabel col-xs-2 col-md-1">').text(gt('Subject')).attr({
                        'for': guid
                    }),
                    $('<div class="col-xs-10 col-md-11">').append(
                        new mini.InputView({ model: baton.model, id: guid, name: 'subject' }).render().$el
                    )
                )
            );
        },

        signature: function (baton) {
            var self = this;
            require(['io.ox/core/api/snippets'], function (snippetAPI) {
                snippetAPI.getAll('signature').done(function (signatures) {
                    baton.view.signatures = signatures;
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

                view.listenToOnce(view.collection, 'add remove reset', function () {
                    if (this.getValidModels().length > 0) {
                        this.$el.addClass('open');
                        if (!this.isListRendered) this.renderList();
                    }
                });

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
                        multiselect: true,
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
                if (capabilities.has('infostore')) {
                    var dropdown = new Dropdown({ label: gt('Attachments'), caret: true }),
                        fileInput = $('<input type="file" name="file">').css('display', 'none')
                            .on('change', addLocalFile.bind(this, baton.model))
                            .prop('multiple', true);

                    this.append(
                        fileInput,
                        dropdown.append(
                            $('<a href="#">').append($.txt(gt('Add local file'))).on('click', function () {
                                fileInput.trigger('click');
                            })
                        )
                        .link('add-file', gt('Add from Drive'), openFilePicker.bind(this, baton.model))
                        .render().$el
                    );
                } else {
                    this.append($('<button type="button" class="btn btn-link hidden-file-picker">').append(
                        $('<span class="hidden">'),
                        $.txt(gt('Attachments')),
                        // file input
                        $('<input type="file" name="file" tabindex="1">')
                            .on('change', addLocalFile.bind(this, baton.model))
                            .prop('multiple', true)
                    ));
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
                        'mailto', url + '#app=io.ox/mail/compose:compose&mailto=%s', ox.serverConfig.productNameMail
                    );
                }
            }
        }
    };

    return extensions;
});
