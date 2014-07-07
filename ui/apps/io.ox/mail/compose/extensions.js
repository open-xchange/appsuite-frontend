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
     'io.ox/backbone/mini-views/dropdown',
     'io.ox/core/extensions',
     'io.ox/core/api/autocomplete',
     'io.ox/core/tk/autocomplete',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'settings!io.ox/mail',
     'gettext!io.ox/mail'
    ], function (sender, Dropdown, ext, AutocompleteAPI, autocomplete, contactsAPI, contactsUtil, settings, gt) {

    var SenderDropdown = Dropdown.extend({
        update: function () {
            var $ul = this.$ul,
                self = this;
            _(this.model.changed).each(function (value, name) {
                var li = $ul.find('[data-name="' + name + '"]');
                li.children('i').attr('class', 'fa fa-fw fa-none');
                li.each(function() {
                    if ($(this).attr('data-value') ===  JSON.stringify(value)) {
                        $(this).children('i').attr('class', 'fa fa-fw fa-check');
                        self.label = $(this).children('span').text();
                        self.$el.find('a[data-toggle="dropdown"]').empty().append(
                            $.txt(self.label), $('<i class="fa fa-caret-down">')
                        );
                    }
                });
            }, this);
        },
        option: function (name, value, text) {
            this.$ul.append(
                $('<li>').append(
                    $('<a>', { href: '#', 'data-name': name, 'data-value': value, 'data-toggle': _.isBoolean(value) }).append(
                        $('<i class="fa fa-fw">').addClass(JSON.stringify(this.model.get(name)) === value ? 'fa-check' : 'fa-none'),
                        $('<span>').text(text)
                    )
                )
            );
            return this;
        }
    });

    var POINT = 'io.ox/mail/compose';

    var autocompleteAPI = new AutocompleteAPI({
        id: 'mailwrite',
        contacts: true,
        msisdn: true
    });

    var extensions = {

        title: function () {
            this.append(
                $('<div class="row header" data-extension-id="title">').append(
                    $('<h1 class="col-md-6 clear-title title">').text(gt('Compose new mail')),
                    $('<div class="col-md-6 text-right">').append(
                        $('<button type="button" class="btn btn-default" data-action="discard">').text(gt('Discard')),
                        $('<button type="button" class="btn btn-default" data-action="save">').text(gt('Save')),
                        $('<button type="button" class="btn btn-primary" data-action="send">').text(gt('Send'))
                    )
                )
            );
        },

        sender: function (baton) {

            var node = $('<div class="row sender" data-extension-id="sender">');

            sender.getDefaultSendAddressWithDisplayname().done(function (defaultSender) {

                baton.model.set('from', defaultSender);

                var dropdown = new SenderDropdown({ model: baton.model, label: defaultSender[0][0] + ' <' + defaultSender[0][1] + '>' }),
                    guid = _.uniqueId('form-control-label-');

                sender.drawDropdown().done(function (list) {

                    if (list.sortedAddresses.length >= 1) {
                        _.each(_(list.sortedAddresses).pluck('option'), function (item) {
                            dropdown.option('from', JSON.stringify([item]), item[0] + ' <' + item[1] + '>');
                        });
                    }

                    node.append(
                        $('<label class="maillabel col-xs-2 col-md-1">').text(gt('From')).attr({
                            'for': guid
                        }),
                        $('<div class="col-xs-10 col-md-11">').append(dropdown.render().$el.attr('data-dropdown', 'from'))
                    );
                });
            });

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
                            $('<label class="maillabel col-xs-2 col-md-1">').text(gt(label)).attr({
                                'for': guid
                            }),
                            $('<div class="col-xs-10 col-md-11">').append(
                                input = $('<input type="text" class="form-control tokenfield">').attr({
                                    id: guid,
                                    tabindex: 1
                                }),
                                addActions ? $('<div class="recipient-actions">').append(
                                    $('<a href="#" data-action="add-cc" tabindex="1">').text(gt('CC')),
                                    $('<a href="#" data-action="add-bcc" tabindex="1">').text(gt('BCC'))
                                ) : $()
                            )
                        )
                    );

                input.autocompleteNew({
                    api: autocompleteAPI,
                    tokenfield: true,
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
                        ext.point(POINT + '/autoCompleteItem').invoke('draw', this, ext.Baton({ data: data }));
                    }
                }).on({
                    'tokenfield:createdtoken': function (e) {
                        if (e.attrs) {
                            var data = e.attrs.data ? e.attrs.data.data : { email: e.attrs.value },
                                token = $(e.relatedTarget);
                            token.prepend(
                                contactsAPI.pictureHalo(
                                    $('<div class="contact-image">'),
                                    $.extend(data, { width: 16, height: 16, scaleType: 'contain', hideOnFallback: true })
                                )
                            );
                        }
                    },
                    'change': function () {
                        baton.model.setTokens(attr, input.tokenfield('getTokens'));
                    }
                });

                // add class to tokenfield wrapper
                input.parent().addClass(attr);

                // set initial values
                input.tokenfield('setTokens', baton.model.getTokens(attr) || [], true, false);
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
                        $('<input class="form-control">').val(baton.model.get('subject')).attr({
                            id: guid,
                            tabindex: 1
                        })
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

        attachmentList: function (baton) {
            var $el = this,
                def = $.Deferred();

            require(['io.ox/core/tk/attachments'], function (attachments) {
                var view = new attachments.view.AttachmentList({
                    collection: baton.model.get('attachments')
                });
                view.render();
                $el.append(view.$el);
                view.$el.addClass('inline-items');
                def.resolve(view);
            }, def.reject);
            return def;
        },
        attachment: function (baton) {
            var $el = $('<div class="col-xs-12 col-md-6">'),
                def = $.Deferred(),
                dropdown = new Dropdown({ model: baton.model, label: gt('Attachments'), tagName: 'span' });

            dropdown.render();
            this.append(
                $el.append(dropdown.$el)
            );

            require(['io.ox/core/tk/attachments'], function (attachments) {
                var $widget = attachments.fileUploadWidget({
                    drive: true,
                    tabindex: 7,
                    buttontext: gt('Add Attachment')
                });
                $widget.addClass('dropdown-menu');
                $widget.find('.btn').addClass('btn-link');
                dropdown.$('ul').remove();
                dropdown.$el.append($widget);
                def.resolve($widget);
            }, def.reject);
            return def;
        },

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
