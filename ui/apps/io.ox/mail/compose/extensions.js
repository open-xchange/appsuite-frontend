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

          var node = $('<div class="row" data-extension-id="sender">');

            var dropdown = new SenderDropdown({ model: baton.model, label: gt('From') });


            sender.drawDropdown().done(function (list) {
                if (list.sortedAddresses.length >= 1) {
                    dropdown.populate(_(list.sortedAddresses).pluck('option'));
                    node.append(
                        $('<div class="col-sm-12">').append(dropdown.render().$el.attr('data-dropdown', 'from'))
                    );
                }
            });

            this.append(node);
        },
        to: function () {
            var guid = _.uniqueId('form-control-label-');
            this.append(
                $('<div class="row" data-extension-id="to">').append(
                    $('<label class="maillabel col-xs-2 col-md-1">').text(gt('To')).attr({
                        'for': guid
                    }),
                    $('<div class="col-xs-10 col-md-11">').append(
                        $('<div class="recipient-actions">').append(
                            $('<a href="#" data-action="add-cc">').text(gt('CC')),
                            $('<a href="#" data-action="add-bcc">').text(gt('BCC'))
                        ),
                        $('<input type="text" class="form-control to tokenfield">').data('type', 'to').attr({
                            id: guid
                        })
                    )
                )
            );
        },
        cc: function () {
            var guid = _.uniqueId('form-control-label-');
            this.append(
                $('<div class="row hidden io-ox-core-animation slidedown in" data-extension-id="cc">').append(
                    $('<label class="maillabel col-xs-2 col-md-1">').text(gt('CC')).attr({
                        'for': guid
                    }),
                    $('<div class="col-xs-10 col-md-11">').append(
                        $('<input type="text" class="form-control cc tokenfield">').data('type', 'cc').attr({
                            id: guid
                        })
                    )
                )
            );
        },
        bcc: function () {
            var guid = _.uniqueId('form-control-label-');
            this.append(
                $('<div class="row hidden io-ox-core-animation slidedown in" data-extension-id="bcc">').append(
                    $('<label class="maillabel col-xs-2 col-md-1">').text(gt('BCC')).attr({
                        'for': guid
                    }),
                    $('<div class="col-xs-10 col-md-11">').append(
                        $('<input type="text" class="form-control bcc tokenfield">').data('type', 'bcc').attr({
                            id: guid
                        })
                    )
                )
            );
        },
        subject: function (baton) {
            var guid = _.uniqueId('form-control-label-');
            this.append(
                $('<div class="row" data-extension-id="subject">').append(
                    $('<label class="maillabel col-xs-2 col-md-1">').text(gt('Subject')).attr({
                        'for': guid
                    }),
                    $('<div class="col-xs-10 col-md-11">').append(
                        $('<input class="form-control">').val(baton.model.get('subject')).attr({
                            id: guid
                        })
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
