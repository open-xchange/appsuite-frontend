/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2013
 * Mail: info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/core/pubsub/subscriptions',
    ['io.ox/core/extensions',
     'io.ox/core/pubsub/model',
     'io.ox/core/api/pubsub',
     'io.ox/core/api/folder',
     'io.ox/core/notifications',
     'io.ox/core/tk/dialogs',
     'io.ox/keychain/api',
     'gettext!io.ox/core/pubsub'
    ],
    function (ext, pubsub, api, folderApi, notifications, dialogs, keychainApi, gt) {

    'use strict';

    var POINT = 'io.ox/core/pubsub/subscribe',

    buildSubscribeDialog = function (baton) {
        var model = new pubsub.Subscription({ folder: baton.data.id, entity: {folder: baton.data.id}, entityModule: baton.data.module }),
            view = new SubscriptionView({model: model}).render();
    },

    SubscriptionView = Backbone.View.extend({
        tagName: "div",
        _modelBinder: undefined,
        initialize: function (options) {
            this._modelBinder = new Backbone.ModelBinder();
        },
        render: function () {

            var self = this,

            popup = new dialogs.ModalDialog({async: true})
                .addPrimaryButton('subscribe', gt('Subscribe'))
                .addButton('cancel', gt('Cancel'));

            popup.getHeader().append($('<h4>').text(gt('Subscribe')));

            api.sources.getAll().done(function (data) {
                var baton = ext.Baton({ view: self, model: self.model, data: self.model.attributes, services: data, popup: popup });
                popup.getBody().addClass('form-horizontal');
                ext.point(POINT + '/dialog').invoke('draw', popup.getBody(), baton);
                popup.show();
                popup.on('subscribe', function (action) {
                    popup.busy();
                    var invalid;
                    _.each(popup.getBody().find('input:not([type=checkbox])'), function (input) {
                        if ($(input).val() === '') {
                            $(input).closest('.control-group').addClass('error');
                            popup.idle();
                            invalid = true;
                        } else {
                            $(input).closest('.control-group').removeClass('error');
                        }
                    });
                    if (invalid) { return; }
                    notifications.yell('info', gt('Checking credentials... This may take a few seconds.'));
                    self.model.save().done(function (id) {
                        api.subscriptions.refresh({id: id}).done(function (data) {
                            notifications.yell('info', gt('Subscription successfully created.'));
                            popup.close();
                        }).fail(function (error) {
                            popup.idle();
                            popup.getBody().find('.control-group:not(:first)').addClass('error');
                            showErrorInline(popup.getBody(), gt('Error:'), _.noI18n(error.error));
                            api.subscriptions.destroy(id);
                        });
                    }).fail(function (error) {
                        popup.idle();
                        if (!self.model.valid) {
                            if (!error.model) {
                                showErrorInline(popup.getBody(), gt('Error:'), _.noI18n(error.error));
                            } else {
                                console.log('Validation error', error.model);
                            }
                        }

                    });
                });
            });

        }
    });

    function showErrorInline(node, label, msg) {
        node.find('div.alert').remove();
        node.prepend($('<div class="alert alert-error alert-block">').append(
            $('<strong>').text(label),
            $.txt(' ' + msg),
            $('<button data-dismiss="alert" class="btn close">').text('x'))
        );

    }

    function buildForm(node, baton) {
        node.empty();
        var service = _(baton.services).select(function (t) {
            return t.id === baton.model.get('source');
        });

        function setSource(id) {
            baton.model.setSource(service[0], { 'account': parseInt(id, 10) });
        }

        function oauth() {
            var win = window.open(ox.base + "/busy.html", "_blank", "height=400, width=600");
            return keychainApi.createInteractively(service[0].displayName.toLowerCase(), win);
        }

        _.each(service[0].formDescription, function (fd) {
            var controls;
            if (fd.widget === 'oauthAccount') {
                var accounts = _.where(keychainApi.getAll(), { serviceId: fd.options.type });
                if (accounts.length === 1) {
                    setSource(accounts[0].id);
                    controls = $('<button>').addClass('btn disabled').text(accounts[0].displayName);
                } else if (accounts.length > 1) {
                    controls = $('<select name="' + fd.name + '">').on('change', function () {
                        setSource($(this).val());
                    });
                    _.each(accounts, function (account) {
                        controls.append(
                            $('<option>').text(account.displayName).val(account.id)
                        );
                    });
                    setSource(accounts[0].id);
                } else {
                    controls = $('<button>').addClass('btn').text(gt('Add new account')).on('click', function () {
                        oauth().done(function (data) {
                            buildForm(node, baton);
                        });
                    });
                }

            } else {
                var input_type = fd.name === 'password' ? 'password' : 'text';
                controls = $('<input type="' + input_type + '" name="' + fd.name + '">');
            }
            node.append(
                $('<div>').addClass('control-group').append(
                    $('<label>').addClass('service-label control-label').attr('for', fd.name).text((fd.name === 'account' ? gt('Account') : fd.displayName)),
                    $('<div>').addClass('controls').append(controls)
                )
            );
        });
        var source = {};
        node.on('change blur', 'input', function (e) {
            var cgroup = $(this).closest('.control-group');
            if ($(this).val() === '' || $(this).val() === undefined) {
                cgroup.addClass('error');
            } else {
                cgroup.removeClass('error');
                source[$(this).attr('name')] = $(this).val();
                baton.model.setSource(service[0], source);
            }
        });
    }

    ext.point(POINT + '/dialog').extend({
        id: 'service',
        index: 100,
        draw: function (baton) {
            var node, userform;

            this.append($('<div>').addClass('control-group').append(
                $('<label>').addClass('service-label control-label').attr('for', 'service-value').text(gt('Source')),
                $('<div>').addClass('controls').append(
                    node = $('<select>').attr('id', 'service-value').addClass('service-value').on('change', function () {
                        baton.model.setSource(_.where(baton.services, { id: node.val() })[0]);
                        buildForm(userform, baton);
                    }))));

            _.each(baton.services, function (service) {
                if (baton.data.entityModule === service.module) {
                    node.append($('<option>').text(service.displayName).val(service.id));
                }
            });

            if (!baton.model.source()) {
                baton.model.setSource(_.where(baton.services, { id: node.val() })[0]);
            } else {
                node.val(baton.model.source().service.id);
            }

            this.append(userform = $('<div>').addClass('userform'));
            buildForm(userform, baton);

        }
    });

    ext.point(POINT + '/dialog').extend({
        id: 'durationinformation',
        index: 200,
        draw: function (baton) {

            var fullNode = $('<div>').addClass('alert alert-info').append(
                $('<b>').addClass('privacy-label').text(gt('Approximate Duration for Subscriptions')),
                        $('<div>').addClass('privacy-text').text(
                            gt('Subscribing to items that are not delivered by another Open-Xchange Server (i.e. OXMF) may take some time. Example: Importing 100 contacts from Xing takes about 5 minutes. We are continually improving this functionality. Future releases will work significantly faster.')));
            var link = $('<div>').addClass('control-group').append($('<a href="#">').addClass('controls').text(gt('Approximate Duration for Subscriptions')).on('click', function (e) {
                    e.preventDefault();
                    link.replaceWith(fullNode);
                }));
            this.append(link);
        }
    });

    return {
        buildSubscribeDialog: buildSubscribeDialog
    };
});
