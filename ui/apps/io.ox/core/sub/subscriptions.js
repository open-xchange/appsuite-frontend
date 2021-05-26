/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define.async('io.ox/core/sub/subscriptions', [
    'io.ox/core/extensions',
    'io.ox/core/sub/model',
    'io.ox/core/api/sub',
    'io.ox/core/folder/api',
    'io.ox/core/notifications',
    'io.ox/backbone/views/modal',
    'io.ox/keychain/api',
    'gettext!io.ox/core/sub',
    'io.ox/backbone/mini-views',
    'io.ox/oauth/backbone',
    'io.ox/oauth/keychain',
    'io.ox/core/a11y',
    'settings!io.ox/core'
], function (ext, sub, api, folderAPI, notifications, ModalDialog, keychainAPI, gt, mini, OAuth, oauthAPI, a11y, settings) {

    'use strict';

    var POINT = 'io.ox/core/sub/subscribe',
        // needs id and module (e.g. contacts)
        buildSubscribeDialog = function (options) {
            options = options || {};
            var model = new sub.Subscription({
                folder: options.folder,
                entity: { folder: options.folder },
                entityModule: options.module
            });

            new SubscriptionView({ model: model, app: options.app }).render();
        },

        getAccountType = function (type) {
            return type.substring(type.lastIndexOf('.') + 1);
        },

        availableServices = (function () {
            var s = { calendar: false, contacts: false };
            _(oauthAPI.services.models).each(function (service) {
                if (service.get('availableScopes').indexOf('contacts') !== -1 || service.get('availableScopes').indexOf('contacts_ro') !== -1) s.contacts = true;
                if (service.get('availableScopes').indexOf('calendar') !== -1 || service.get('availableScopes').indexOf('calendar_ro') !== -1) s.calendar = true;
            });
            return s;
        }()),

        SubscriptionView = Backbone.View.extend({

            tagName: 'div',

            initialize: function (opt) {
                this.on('subscribe', this.subscribe);
                this.app = opt.app;
            },

            getServices: function () {
                var self = this;
                return api.sources.getAll().then(function (data) {
                    // filter services for the current module
                    var services = [];
                    _.each(data, function (service) {
                        if (self.model.get('entityModule') === service.module) {
                            services.push(service);
                        }
                    });

                    // filter disabled/unavailable oauth sources without existing accounts
                    services = _.filter(services, function (service) {
                        var fdlength = (service.formDescription || []).length, enabled;

                        // process when no formDescriptions
                        if (fdlength === 0) return true;

                        service.formDescription = _.filter(service.formDescription, function (fd) {

                            if (fd.widget !== 'oauthAccount') return true;

                            var accountType = getAccountType(fd.options.type),
                                accounts = _.where(keychainAPI.getAll(), { serviceId: fd.options.type }).filter(function (account) {
                                    if (!self.app.subscription || !_.isArray(self.app.subscription.wantedOAuthScopes)) {
                                        return true;
                                    }
                                    return self.app.subscription.wantedOAuthScopes.reduce(function (acc, scope) {
                                        return acc && account.availableScopes.indexOf(scope) >= 0;
                                    }, true);
                                });

                            // process when at least one account exists
                            if (accounts.length) return true;

                            enabled = keychainAPI.isEnabled(accountType);

                            if (!enabled) {
                                console.error('Keys for ' + accountType + ' are missing. A needed plugin was not registered in the server config.');
                            }

                            // remove formdescription entry when oauth service isn't available
                            return enabled;
                        });

                        // remove service in case all formdescriptions where removed
                        return (service.formDescription || []).length;
                    });
                    self.services = services;
                    return services;
                });
            },

            render: function () {
                var self = this,
                    title = gt('Subscribe');

                if (this.model.get('entityModule') === 'contacts') title = gt('Subscribe to address book');
                if (this.model.get('entityModule') === 'calendar') title = gt('Subscribe to calendar');

                var popup = new ModalDialog({
                    title: title,
                    async: true,
                    help: 'ox.appsuite.user.sect.contacts.folder.subscribe.html',
                    // 130 * 4 + 8 * 3 + 30, Button.width * ButtonsPerRow + Button.rightMargin * (ButtonsPerRow - 1) + leftAndRightPaddingOfDialog
                    width: 576
                });

                this.getServices().done(function (services) {
                    if (self.app.subscription && _.isArray(self.app.subscription.wantedOAuthScopes)) {
                        // app requires some oauth scopes for subscriptions
                        // TODO: should this info come from the backend?
                        self.model.set('wantedScopes', self.app.subscription.wantedOAuthScopes);
                    }
                    if (services.length > 0) {
                        var baton = ext.Baton({
                            view: self,
                            model: self.model,
                            data: self.model.attributes,
                            services: services,
                            popup: popup,
                            app: self.app
                        });
                        ext.point(POINT + '/dialog').invoke('draw', popup.$body, baton);
                        popup.addCancelButton()
                            .addButton({ label: gt('Add'), action: 'add' })
                            .build(function () { this.$footer.find('[data-action="add"]').hide(); });
                    } else {
                        popup.addDescription(gt('No subscription services available for this module'));
                        popup.addButton({ label: gt('Cancel'), action: 'cancel' });
                    }
                    popup.open();

                    if (services.length <= 3) $('.modal-dialog', popup.$el).css('width', '440px');

                    popup.on('add', function () {
                        popup.$body.find('div.alert').remove();
                        self.subscribe();
                    });
                });

                this.popup = popup;
            },

            subscribe: function () {
                var self = this,
                    popup = this.popup,
                    service = _(this.services).findWhere({ id: this.model.get('source') });

                popup.busy();
                // workaround: service is needed for proper validation
                this.model.set('service', service);

                // validate model and check for errors
                this.model.validate();
                if (this.model.errors && this.model.errors.hasErrors()) {
                    this.model.errors.each(function (errors) {
                        if (errors.length > 0) showErrorInline(popup.$body, gt('Error:'), errors);
                    });
                    popup.idle();
                    return;
                }

                subscribe(this.model, service).then(
                    function saveSuccess(id) {
                        //set id, if none is present (new model)
                        if (!self.model.id) { self.model.id = id; }
                        api.subscriptions.refresh({ id: id, folder: self.model.get('folder') }).then(
                            function refreshSuccess() {
                                notifications.yell('success', gt('Subscription successfully created.'));
                                popup.close();
                                return self.model;
                            },
                            function refreshFail(error) {
                                popup.idle();
                                showErrorInline(popup.$body, gt('Error:'), error.error_html || error.error);
                                api.subscriptions.destroy(id);
                                self.model = self.model.clone();
                                folderAPI.remove(self.model.get('folder'));
                                throw error;
                            }
                        )
                        .then(function (model) {
                            return model.fetch();
                        })
                        .then(function (model) {
                            var subscriptions = sub.subscriptions();
                            //update the model-(collection)
                            subscriptions.add(model, { merge: true });
                        })
                        .done(function () {
                            self.app.folder.set(self.model.get('folder'));
                        });
                    },
                    function saveFail(error) {
                        popup.idle();
                        if (error.error) {
                            showErrorInline(popup.$body, gt('Error:'), error.error);
                        } else {
                            notifications.yell({
                                type: 'error',
                                headline: gt('Error'),
                                message: gt('The subscription could not be created.')
                            });
                        }
                        folderAPI.remove(self.model.get('folder'));
                        throw error;
                    }
                );
            }

        });

    function subscribe(model, service) {
        var module = model.get('entityModule'),
            folder = settings.get('folder/' + module),
            title = gt('New Folder');

        if (service.displayName && module === 'calendar') title = gt('My %1$s calendar', service.displayName);
        if (service.displayName && module === 'contacts') title = gt('My %1$s contacts', service.displayName);

        return folderAPI.create(folder, {
            title: title
        })
        .then(function (folder) {
            model.attributes.folder = model.attributes.entity.folder = folder.id;
            model.unset('wantedScopes');
            return model.save();
        });
    }

    function showErrorInline(node, label, msg) {
        var list = [].concat(msg);
        node.find('div.alert').remove();
        _(list).each(function (msg) {
            this.prepend($('<div class="alert alert-danger alert-dismissible" role="alert">').append(
                $('<strong>').text(label),
                $.txt(' '),
                $('<span>').html(msg),
                $('<button type="button" data-dismiss="alert" class="btn btn-default close">').text('x'))
            );
        }, node);
    }

    ext.point(POINT + '/dialog').extend({
        id: 'service',
        index: 100,
        draw: function (baton) {
            // ensure correct icon
            _(baton.services).each(function (service) {
                if (/.*(contact|calendar)$/.test(service.id)) {
                    // example for service.id: 'com.openexchange.subscribe.google.contact'
                    service.icon = _.last(service.id.split('.'), 2)[0];
                }
                if (service.id.indexOf('gmx.de') >= 0) service.icon = 'gmx';
                if (service.id.indexOf('web.de') >= 0) service.icon = 'webde';
                if (service.id === 'com.openexchange.subscribe.microformats.contacts.http') service.icon = 'oxmf';
            });
            // if oxmf is present, move it to the end
            baton.services = _(baton.services).sortBy(function (service) {
                if (service.id === 'com.openexchange.subscribe.microformats.contacts.http') return 1;
                return 0;
            });
            this.append(new OAuth.Views.ServicesListView({
                collection: new Backbone.Collection(baton.services)
            })
            .on('select', function (model) {
                var fd = model.get('formDescription'),
                    bat = ext.Baton({ view: baton.view, subModel: baton.model, model: model, services: baton.services, popup: baton.popup, app: baton.app });
                baton.model.setSource(model.toJSON());
                baton.popup.$body.find('div.alert').remove();
                if (fd.length === 1 && fd[0].widget === 'oauthAccount') {
                    ext.point(POINT + '/oauth').invoke('configure', this, bat);
                } else {
                    ext.point(POINT + '/subscribe').invoke('configure', this, bat);
                }
            }).render().$el);
        }
    });

    function createAccount(service, scope) {
        var serviceId = service.formDescription[0].options.type,
            account = new OAuth.Account.Model({
                serviceId: serviceId,
                displayName: oauthAPI.chooseDisplayName(service)
            });

        return account.enableScopes(scope).save();
    }
    ext.point(POINT + '/oauth').extend({
        id: 'oauth',
        index: 100,
        configure: function (baton) {
            var model = baton.model,
                service = model.toJSON();
            createAccount(service, baton.subModel.get('wantedScopes')).then(function success(account) {
                baton.subModel.setSource(service, { 'account': parseInt(account.id, 10) });
                baton.view.trigger('subscribe');
            }, function fail(error) {
                showErrorInline(baton.view.popup.$body, gt('Error:'), error);
            });
        }
    });

    ext.point(POINT + '/subscribe').extend({
        id: 'subscribe',
        index: 100,
        configure: function (baton) {
            var model = baton.model,
                inputModel = new Backbone.Model(),
                service = model.toJSON();
            baton.popup.$body.empty().append(
                $('<form class="form-horizontal">').append(
                    $('<h4>').text(gt('Configure %s', model.get('displayName'))),
                    _(model.get('formDescription')).map(function (fd) {
                        var Input = fd.name === 'password' ? mini.PasswordView : mini.InputView;
                        return $('<div class="control-group">').append(
                            $('<label class="control-label">').attr('for', fd.name).text((fd.name === 'account' ? gt('Account') : fd.displayName)),
                            $('<div class="controls">').append(new Input({ model: inputModel, name: fd.name, autocomplete: false }).render().$el)
                        );
                    })
                ).on('keydown', function (e) {
                    if (e.which === 10 || e.which === 13) baton.view.trigger('subscribe');
                })
            );
            baton.popup.$footer.find('[data-action="add"]').show();
            baton.view.listenTo(inputModel, 'change', function () {
                baton.subModel.setSource(service, inputModel.toJSON());
            });
        }
    });

    //
    // Commented out warnings in the dialog. If those warnings are needed again, just uncomment the following extension points.
    //

    // function isDestructiveSubscription (baton) {
    //     return baton.data.entityModule === 'calendar';
    // }

    // ext.point(POINT + '/dialog').extend({
    //     id: 'targetfolder',
    //     index: 200,
    //     draw: function (baton) {
    //         var destructive = isDestructiveSubscription(baton);
    //         this.append(
    //             $('<div class="control-group">').append(
    //                 $('<div class="controls checkbox">').append(
    //                     $('<label>').append(
    //                         $('<input type="checkbox">')
    //                             .prop('checked', true)
    //                             .prop('disabled', destructive)
    //                             .on('change', function () {
    //                                 if (destructive) {
    //                                     baton.newFolder = true;
    //                                     $(this).prop('checked', true);
    //                                     return;
    //                                 }
    //                                 if (!$(this).prop('checked')) {
    //                                     baton.newFolder = false;
    //                                 }
    //                             }),
    //                         $.txt(gt('Add new folder for this subscription'))
    //                     )
    //                 )
    //             )
    //         );

    //         if (destructive) {
    //             this.append($('<p class="text-warning">').text(gt('Note: This subscription will replace the calendar content with the external content. Therefore you must create a new folder for this subscription.')));
    //         }
    //     }
    // });

    // ext.point(POINT + '/dialog').extend({
    //     id: 'durationinformation',
    //     index: 300,
    //     draw: function () {
    //         var fullNode = $('<div class="alert alert-info">').css({ 'margin-bottom': 0, 'margin-top': '10px' }).append(
    //             $('<b class="privacy-label">').text(gt('Approximate Duration for Subscriptions')),
    //                     $('<div class="privacy-text">').text(
    //                         gt('Updating subscribed data takes time. Importing 100 contacts for example, may take up to 5 minutes. Please have some patience.')));
    //         var link = $('<div class="control-group">').append($('<a href="#" class="controls">').text(gt('Approximate Duration for Subscriptions')).on('click', function (e) {
    //             e.preventDefault();
    //             link.replaceWith(fullNode);
    //         }));
    //         this.append(link);
    //     }
    // });

    var def = $.Deferred();
    // try api/sub sources
    if (!availableServices.contacts || !availableServices.calendar) {
        api.sources.getAll().then(function (sources) {
            availableServices.contacts = availableServices.contacts || _(sources).any({ module: 'contacts' });
            availableServices.calendar = availableServices.calendar || _(sources).any({ module: 'calendar' });
        }).always(def.resolve);
    } else {
        def.resolve();
    }

    return def.then(function () {
        return {
            availableServices: availableServices,
            buildSubscribeDialog: buildSubscribeDialog
        };
    });
});
