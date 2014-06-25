/* jshint unused: false */
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
     'io.ox/core/tk/autocomplete',
     'io.ox/core/api/autocomplete',
     'io.ox/core/api/account',
     'io.ox/mail/util',
     'settings!io.ox/mail',
     'gettext!io.ox/mail'], function (sender, Dropdown, autocomplete, AutocompleteAPI, accountAPI, mailUtil, settings, gt) {

    var autocompleteAPI = new AutocompleteAPI({ id: 'mailwrite', contacts: true, msisdn: true });

    var SenderDropdown = Dropdown.extend({
        update: function () {
            var $el = this.$el;
            _(this.model.changed).each(function (value, name) {
                var li = $el.find('[data-name="' + name + '"]');
                var a = li.filter('[data-display-name="' + value[0][0] + '"]').filter('[data-address="' + value[0][1] + '"]');
                li.children('i').attr('class', 'fa fa-fw fa-none');
                a.children('i').attr('class', 'fa fa-fw fa-check');
                if (name === 'from') {
                    this.label = a.text();
                    this.$el.empty();
                    this.render();
                }
            }, this);
        },
        option: function (name, o) {
            var address = sender.getsender(o);

            this.$ul.append(
                $('<li>').append(
                    $('<a>', {
                        href: '#',
                        'data-name': name,
                        'data-value': address.text,
                        'data-toggle': _.isBoolean(address.value),
                        'data-display-name': address.display_name,
                        'data-address': address.address
                    }).append(
                        $('<i class="fa fa-fw">').addClass(this.model.get(name).toString() === [[address.display_name, address.address]] ? 'fa-check' : 'fa-none'),
                        $('<span>').text(address.text)
                    )
                )
            );
            return this;
        },
        onClick: function (e) {
            e.preventDefault();
            var node = $(e.currentTarget);
            var from = [node.data('display-name'), node.data('address')];
            this.model.set('from', [from]);
        },
        populate: function (senders) {
            var self = this;
            senders.map(function (o) {
                self.option('from', o);
            });
        }
    });


    var extensions = {
        title: function () {
            this.append(
                $('<div class="row" data-extension-id="title">').append(
                    $('<div class="col-lg-12 header">').append(
                        $('<h1 class="clear-title title">').text('Compose new mail'),
                        $('<button type="button" class="btn btn-primary" data-action="send">').text('Send'),
                        $('<button type="button" class="btn btn-default" data-action="save">').text('Save'),
                        $('<button type="button" class="btn btn-default" data-action="discard">').text('Discard')
                    )
                )
            );
        },

        sender: function (baton) {

          /*  var node = $('<div class="row" data-extension-id="sender">');

            var dropdown = new SenderDropdown({ model: baton.model, label: gt('From') });


            sender.drawDropdown().done(function (list) {
                if (list.sortedAddresses.length >= 1) {
                    dropdown.populate(_(list.sortedAddresses).pluck('option'));
                    node.append(
                        $('<div class="col-sm-12">').append(dropdown.render().$el.attr('data-dropdown', 'from'))
                    );
                }
            });

            this.append(node);*/
        },
        to: function () {
            this.append(
                $('<div class="row" data-extension-id="to">').append(
                    $('<div class="col-xs-2 col-md-1">').append($('<span class="maillabel">').text('To')),
                    $('<div class="col-xs-10 col-md-11">').append(
                        $('<div class="recipient-actions pull-right">').append(
                            $('<span data-action="add-cc">').text('CC'),
                            $('<span data-action="add-bcc">').text('BCC')
                        ),
                        $('<input type="text" class="form-control to tokenfield">').data('type', 'to')
                    )
                )
            );
        },
        cc: function () {
            this.append(
                $('<div class="row hidden" data-extension-id="cc">').append(
                    $('<div class="col-xs-2 col-md-1">').append($('<span class="maillabel">').text('CC')),
                    $('<div class="col-xs-10 col-md-11">').append(
                        $('<input type="text" class="form-control cc tokenfield">').data('type', 'cc')
                    )
                )
            );
        },
        bcc: function () {
            this.append(
                $('<div class="row hidden" data-extension-id="bcc">').append(
                    $('<div class="col-xs-2 col-md-1">').append($('<span class="maillabel">').text('BCC')),
                    $('<div class="col-xs-10 col-md-11">').append(
                        $('<input type="text" class="form-control bcc tokenfield">').data('type', 'bcc')
                    )
                )
            );
        },
        subject: function (baton) {
            this.append(
                $('<div class="row" data-extension-id="subject">').append(
                    $('<div class="col-xs-2 col-md-1">').append($('<span class="maillabel">').text('Subject')),
                    $('<div class="col-xs-10 col-md-11">').append(
                        $('<input class="form-control">').val(baton.model.get('subject'))
                    )
                )
            );
        },
        signature: function (baton) {
            var dropdown = new Dropdown({ model: baton.model, label: gt('Signature'), tagName: 'span' })
                .option('signature', false, gt('No signature'));
            require(['io.ox/core/api/snippets'], function (snippetAPI) {
                snippetAPI.getAll('signature').done(function (signatures) {
                    var sa = _.map(signatures, function (o) {
                        return { 'id': o.id, 'displayName': o.displayname };
                    });

                    if (sa.length >= 1) {
                        _.each(sa, function (item) {
                            dropdown.option('signature', item.id, item.displayName);
                        });
                    }
                });
            });

            this.append(
                $('<div class="col-xs-6 col-md-3">').append(
                    dropdown.render().$el
                        .attr('data-dropdown', 'signature')
                )
            );
        },
        attachment: function () {
            this.append(
                $('<div class="col-xs-12 col-md-6">').append(

                )
            );
        },
        body: function () {
            var self = this;
            var editorId = _.uniqueId('tmce-');
            var editorToolbarId = _.uniqueId('tmcetoolbar-');
            var node;

            self.append($('<div class="row">').append($('<div class="col-sm-12">').append(
                $('<div class="editable-toolbar">').attr('id', editorToolbarId),
                node = $('<div class="editable">').attr('id', editorId).css('min-height', '400px')
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
