/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/core/sub/subscriptions', [
    'io.ox/core/extensions',
    'io.ox/core/sub/model',
    'io.ox/core/api/sub',
    'io.ox/core/folder/api',
    'io.ox/core/notifications',
    'io.ox/core/tk/dialogs',
    'io.ox/keychain/api',
    'gettext!io.ox/core/sub',
    'settings!io.ox/core'
], function (ext, sub, api, folderAPI, notifications, dialogs, keychainAPI, gt) {

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

        new SubscriptionView({ model: model }).render(options.app);
    },

    isDestructiveSubscription = function (baton) {
        return baton.data.entityModule === 'calendar';
    },

    getAccountType = function (type) {
        return type.substring(type.lastIndexOf('.') + 1);
    },

    SubscriptionView = Backbone.View.extend({
        tagName: 'div',
        render: function (app) {
            var self = this,

            popup = new dialogs.ModalDialog({ async: true, help: 'ox.appsuite.user.concept.pubsub.subscribe' })
                .addPrimaryButton('subscribe', gt('Subscribe'))
                .addButton('cancel', gt('Cancel'));

            popup.getHeader().append($('<h4>').text(gt('Subscribe')));

            api.sources.getAll().done(function (data) {
                var baton = ext.Baton({ view: self, model: self.model, data: self.model.attributes, services: data, popup: popup, newFolder: true });

                function removeFolder(id) {
                    return folderAPI.remove(id);
                }

                function saveModel(newFolder) {

                    notifications.yell('busy', gt('Checking credentials ...'));
                    var folder = self.model.attributes.folder;

                    self.model.save().then(
                        function saveSuccess(id) {
                            //set id, if none is present (new model)
                            if (!self.model.id) { self.model.id = id; }
                            api.subscriptions.refresh({ id: id, folder: folder }).then(
                                function refreshSuccess() {
                                    notifications.yell('info', gt('Subscription successfully created.'));
                                    popup.close();
                                    return self.model;
                                },
                                function refreshFail(error) {
                                    popup.idle();
                                    popup.getBody().find('.control-group:not(:first)').addClass('error');
                                    showErrorInline(popup.getBody(), gt('Error:'), _.noI18n(error.error_html || error.error));
                                    api.subscriptions.destroy(id);
                                    self.model = self.model.clone();
                                    if (newFolder) {
                                        removeFolder(folder);
                                    }
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
                                app.folder.set(folder);
                            });
                        },
                        function saveFail(error) {
                            popup.idle();
                            if (!self.model.valid) {
                                if (!error.model) {
                                    showErrorInline(popup.getBody(), gt('Error:'), _.noI18n(error.error));
                                } else {
                                    notifications.yell({
                                        type: 'error',
                                        headline: gt('Error'),
                                        message: gt('The subscription could not be created.')
                                    });
                                }
                            }
                            if (newFolder) {
                                removeFolder(folder);
                            }
                        }
                    );
                }

                popup.getBody().addClass('form-horizontal');
                ext.point(POINT + '/dialog').invoke('draw', popup.getBody(), baton);
                popup.show(function () {
                    popup.getBody().find('select.service-value').focus();
                });
                popup.on('subscribe', function () {

                    popup.busy();
                    var module = self.model.get('entityModule'),
                        invalid, folder;

                    _.each(popup.getBody().find('.userform input'), function (input) {
                        if (!$(input).val()) {
                            $(input).closest('.control-group').addClass('has-error');
                            popup.idle();
                            invalid = true;
                        } else {
                            $(input).closest('.control-group').removeClass('has-error');
                        }
                    });

                    if (invalid) return;

                    // needs to create an account first
                    var createAccount = popup.getBody().find('.btn-new-account');
                    if (createAccount.length) {
                        createAccount
                            .parent().addClass('has-error')
                            .end().on('click', function () {
                                $(this).parent().removeClass('has-error');
                            });
                        popup.idle();
                        return;
                    }

                    // add new folders under module's default folder!
                    folder = require('settings!io.ox/core').get('folder/' + module);

                    //...but drive uses current selected folder instead
                    if (module === 'infostore') folder = app.folder.get() || folder;

                    if (baton.newFolder) {
                        var service = findId(baton.services, baton.model.get('source'));

                        folderAPI.create(folder, {
                            title: service.displayName || gt('New Folder')
                        })
                        .done(function (folder) {
                            self.model.attributes.folder = self.model.attributes.entity.folder = folder.id;
                            saveModel(true);
                        });
                    } else {
                        self.model.attributes.folder = folder;
                        saveModel();
                    }

                });
            });

        }
    });

    function showErrorInline(node, label, msg) {
        node.find('div.alert').remove();
        node.prepend($('<div class="alert alert-danger" role="alert">').append(
            $('<strong>').text(label),
            $.txt(' '),
            $('<span>').html(msg),
            $('<button type="button" data-dismiss="alert" class="btn btn-default close">').text('x'))
        );

    }

    function findId(list, id) {
        //FIXME: use _.findWhere, once available, to get rid of the anonymous function
        return _(list).find(function (t) {
            return t.id === id;
        });
    }

    function buildForm(node, baton) {
        node.empty();
        var service = findId(baton.services, baton.model.get('source'));

        function setSource(id) {
            baton.model.setSource(service, { 'account': parseInt(id, 10) });
        }

        function oauth(accountType) {
            var win = window.open(ox.base + '/busy.html', '_blank', 'height=400, width=600');
            return keychainAPI.createInteractively(accountType, win);
        }

        _.each(service.formDescription, function (fd) {
            var controls;
            if (fd.widget === 'oauthAccount') {
                var accounts = _.where(keychainAPI.getAll(), { serviceId: fd.options.type });
                if (accounts.length === 1) {
                    setSource(accounts[0].id);
                    controls = $('<button type="button" class="btn btn-default disabled">').text(accounts[0].displayName);
                } else if (accounts.length > 1) {
                    controls = $('<select name="' + fd.name + '">').on('change', function () {
                        setSource($(this).val());
                    });
                    _.each(accounts, function (account) {
                        controls.append(
                            $('<option>').text(account.displayName).val(account.id)
                        );
                    });
                    // set initially to first account in list
                    setSource(accounts[0].id);
                } else {
                    controls = $('<button type="button" class="btn btn-default btn-new-account">').text(gt('Add new account')).on('click', function () {
                        oauth(getAccountType(fd.options.type)).done(function () {
                            buildForm(node, baton);
                        });
                    });
                }

            } else {
                var input_type = fd.name === 'password' ? 'password' : 'text';
                controls = $('<input class="form-control" type="' + input_type + '" name="' + fd.name + '">');
            }
            node.append(
                $('<div>').addClass('control-group').append(
                    $('<label>').addClass('control-label').attr('for', fd.name).text((fd.name === 'account' ? gt('Account') : fd.displayName)),
                    $('<div>').addClass('controls').append(controls)
                )
            );
        });
        var source = {};
        node.on('change blur', 'input[type="text"], input[type="password"]', function () {
            var cgroup = $(this).closest('.control-group');
            if (!$(this).val()) {
                cgroup.addClass('error');
            } else {
                cgroup.removeClass('error');
                source[$(this).attr('name')] = $(this).val();
                baton.model.setSource(service, source);
            }
        });
    }

    ext.point(POINT + '/dialog').extend({
        id: 'missing-oauth',
        index: 1,
        draw: function (baton) {
            // filter disabled/unavailable oauth sources without existing accounts
            baton.services = _.filter(baton.services, function (service) {
                var fdlength = (service.formDescription || []).length, enabled;

                // process when no formDescriptions
                if (fdlength === 0) return true;

                service.formDescription = _.filter(service.formDescription, function (fd) {

                    if (fd.widget !== 'oauthAccount') return true;

                    var accountType = getAccountType(fd.options.type),
                        accounts = _.where(keychainAPI.getAll(), { serviceId: fd.options.type });

                    // process when at least one account exists
                    if (accounts.length) return true;

                    enabled = keychainAPI.isEnabled(accountType);

                    if (!enabled) {
                        console.error('I do not know keys of accountType ' + accountType + '! I suppose a needed plugin was not registered in the server configuration.');
                    }

                    // remove formdescription entry when oauth service isn't available
                    return enabled;
                });

                // remove service in case all formdescriptions where removed
                return (service.formDescription || []).length;
            });
        }
    });

    ext.point(POINT + '/dialog').extend({
        id: 'service',
        index: 100,
        draw: function (baton) {
            var node, userform;

            this.append($('<div>').addClass('control-group').append(
                $('<label>').addClass('control-label').attr('for', 'service-value').text(gt('Source')),
                $('<div>').addClass('controls').append(
                    node = $('<select>').attr('name', 'service-value').addClass('form-control service-value').on('change', function () {
                        userform.parent().find('.alert-danger').remove();
                        userform.parent().find('.error').removeClass('error');
                        baton.model.setSource(findId(baton.services, node.val()));
                        buildForm(userform, baton);
                    }))));

            _.each(baton.services, function (service) {
                if (baton.data.entityModule === service.module) {
                    node.append($('<option>').text(service.displayName).val(service.id));
                }
            });

            if (!baton.model.source()) {
                baton.model.setSource(findId(baton.services, node.val()));
            } else {
                node.val(baton.model.source().service.id);
            }

            this.append(userform = $('<div>').addClass('userform'));
            buildForm(userform, baton);

        }
    });

    ext.point(POINT + '/dialog').extend({
        id: 'targetfolder',
        index: 200,
        draw: function (baton) {
            var destructive = isDestructiveSubscription(baton);
            this.append(
                $('<div>').addClass('control-group').append(
                    $('<div>').addClass('controls').append(
                        $('<label>').addClass('checkbox').text(gt('Add new folder for this subscription')).append(
                            $('<input type="checkbox">')
                                .prop('checked', true)
                                .prop('disabled', destructive)
                                .on('change', function () {
                                    if (destructive) {
                                        baton.newFolder = true;
                                        $(this).prop('checked', true);
                                        return;
                                    }
                                    if (!$(this).prop('checked')) {
                                        baton.newFolder = false;
                                    }
                                })
                        )
                    )
                )
            );

            if (destructive) {
                this.append($('<p class="text-warning">').text(gt('Note: This subscription will replace the calendar content with the external content. Therefore you must create a new folder for this subscription.')));
            }
        }
    });

    ext.point(POINT + '/dialog').extend({
        id: 'durationinformation',
        index: 300,
        draw: function () {
            var fullNode = $('<div>').addClass('alert alert-info').css({ 'margin-bottom': 0, 'margin-top': '10px' }).append(
                $('<b>').addClass('privacy-label').text(gt('Approximate Duration for Subscriptions')),
                        $('<div>').addClass('privacy-text').text(
                            gt('Updating subscribed data takes time. Importing 100 contacts for example, may take up to 5 minutes. Please have some patience.')));
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
