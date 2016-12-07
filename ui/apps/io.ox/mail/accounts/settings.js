/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/mail/accounts/settings', [
    'io.ox/core/extensions',
    'io.ox/core/api/account',
    'io.ox/mail/accounts/model',
    'io.ox/mail/accounts/view-form',
    'io.ox/core/tk/dialogs',
    'io.ox/core/notifications',
    'io.ox/core/a11y',
    'settings!io.ox/mail',
    'gettext!io.ox/mail/accounts/settings',
    'less!io.ox/settings/style'
], function (ext, api, AccountModel, AccountDetailView, dialogs, notifications, a11y, mailSettings, gt) {

    'use strict';

    function renderDetailView(evt, data) {
        var myView, myModel, myViewNode;

        myViewNode = $('<div>').addClass('accountDetail');
        myModel = new AccountModel(data);
        myView = new AccountDetailView({ model: myModel, node: myViewNode });

        myView.dialog = new dialogs.ModalDialog({
            width: 700,
            async: true
        });
        //TOOD: hack to avoid horizontal scrollbar
        myView.dialog.getBody().css('padding-right', '15px');

        myView.dialog.header(
            $('<h2>').text(myModel.get('id') || myModel.get('id') === 0 ? gt('Edit mail account') : gt('Add mail account'))
        ).append(
            myView.render().el
        )
        .addPrimaryButton('save', gt('Save'), 'save')
        .addButton('cancel', gt('Cancel'), 'cancel')
        .show(function () {
            a11y.getTabbable(this).first().focus();
        });

        //show errors
        myModel.on('validated', function (valid, model, error) {
            var $form = myView.$el;
            $form.find('.error').removeClass('error');
            $form.find('.help-block').prev().removeAttr('aria-invalid aria-describedby');
            $form.find('.help-block').remove();

            _.each(error, function (message, key) {
                var $field = myView.$el.find('#' + key).parent(),
                    $row = $field.closest('.form-group'),
                    helpBlock = $('<div class="help-block error">').attr('id', _.uniqueId('error-help-'));
                helpBlock.append($.txt(message));
                $field.append(helpBlock);
                helpBlock.prev().attr({
                    'aria-invalid': true,
                    'aria-describedby': helpBlock.attr('id')
                });
                $row.addClass('error');
            });
        });

        myView.dialog.on('save', function () {
            myModel.validate();
            if (myModel.isValid()) {
                myView.dialog.getBody().find('.settings-detail-pane').trigger('save');
            } else {
                notifications.yell('error', gt('Account settings could not be saved. Please take a look at the annotations in the form. '));
                myView.dialog.idle();

                //disable fields for primary account again
                if (myModel.get('id') === 0) {
                    myView.$el.find('input, select').not('#personal, [data-property="unified_inbox_enabled"]').prop('disabled', true);
                }

            }
        });

        myView.success = successDialog;
        myView.collection = collection;
        return myView.node;
    }

    ext.point('io.ox/settings/accounts/mail/settings/detail').extend({
        index: 200,
        id: 'emailaccountssettings',
        draw: function (evt) {
            if (evt.data.id >= 0) {
                api.get(evt.data.id).done(function (obj) {
                    renderDetailView(evt, obj);
                });
            } else {
                renderDetailView(evt, evt.data);
            }
        }
    });

    ext.point('io.ox/mail/add-account/preselect').extend({
        id: 'oauth',
        index: 100,
        draw: function (baton) {
            var $el = this;
            if (!mailSettings.get('dsc/enabled')) {
                // normal mode for all setups not using DSC
                require(['io.ox/oauth/keychain', 'io.ox/oauth/backbone']).then(function (oauthAPI, OAuth) {
                    var mailServices = new Backbone.Collection(oauthAPI.services.filter(function (service) {
                            console.log('services', service);
                            return _(service.get('availableScopes')).contains('mail') &&
                                oauthAPI.accounts.forService(service.id, { scope: 'mail' }).map(function (account) {
                                    return account.id;
                                }).reduce(function (acc, oauthId) {
                                    // make sure, no mail account using this oauth-account exists
                                    return acc && !_(api.cache).chain()
                                        .values()
                                        .map(function (account) {
                                            return account.mail_oauth;
                                        })
                                        .any(oauthId)
                                        .value();
                                }, true);
                        })), list = new OAuth.Views.ServicesListView({ collection: mailServices });

                    // only valid for non dsc setups
                    mailServices.push({
                        id: 'wizard',
                        displayName: gt('Other')
                    });

                    $el.append(
                        $('<label>').text(gt('Please select your mail account provider')),
                        list.render().$el
                    );

                    list.listenTo(list, 'select', function (service) {
                        if (service.id === 'wizard') return;

                        var account = new OAuth.Account.Model({
                            serviceId: service.id,
                            displayName: 'My ' + service.get('displayName') + ' account'
                        });

                        account.enableScopes('mail').save().then(function () {
                            api.autoconfig({
                                oauth: account.id
                            }).then(function (data) {
                                var def = $.Deferred();
                                // hopefully, login contains a valid mail address
                                data.primary_address = data.login;

                                validateMailaccount(data, baton.popup, def);
                                return def;
                            }).then(function () {
                                oauthAPI.accounts.add(account, { merge: true });
                            }, notifications.yell);
                        });
                    });

                    list.listenTo(list, 'select:wizard', function () {
                        baton.popup.getFooter().find('[data-action="add"]').show();
                        // invoke wizard
                        ext.point('io.ox/mail/add-account/wizard').invoke('draw', baton.popup.getContentNode().empty());
                    });
                });
            } else {
                // show classic wizard for DSC setups, bypass oauth accounts
                ext.point('io.ox/mail/add-account/wizard').invoke('draw', baton.popup.getContentNode().empty());
                _.defer(function () {
                    baton.popup.getFooter().find('[data-action="add"]').show();
                }, 1000);
            }
        }
    });

    ext.point('io.ox/mail/add-account/wizard').extend({
        id: 'address',
        index: 100,
        draw: function () {
            this.append(
                $('<div class="form-group">').append(
                    $('<label for="add-mail-account-address">').text(gt('Your mail address')),
                    $('<input id="add-mail-account-address" type="text" class="form-control add-mail-account-address">')
                )
            );
        }
    });

    ext.point('io.ox/mail/add-account/wizard').extend({
        id: 'password',
        index: 200,
        draw: function () {
            this.append(
                $('<div class="form-group">').append(
                    $('<label for="add-mail-account-password">').text(gt('Your password')),
                    $('<input id="add-mail-account-password" type="password" class="form-control add-mail-account-password">')
                )
            );
        }
    });

    ext.point('io.ox/mail/add-account/wizard').extend({
        id: 'security-hint',
        index: 300,
        draw: function () {
            if (window.location.protocol !== 'https:') return;
            this.append($('<div class="help-block">').text(gt('Your credentials will be sent over a secure connection only')));
        }
    });

    ext.point('io.ox/mail/add-account/wizard').extend({
        id: 'feedback',
        index: 1000000000000,
        draw: function () {
            this.append(
                $('<div class="alert-placeholder">')
            );
        }
    });

    var collection,
        myModel = new AccountModel({}),

        createExtpointForNewAccount = function (args) {
            var node = $('<div>');
            ext.point('io.ox/settings/accounts/mail/settings/detail').invoke('draw', node, args);
        },

        getAlertPlaceholder = function (popup) {
            return popup.getContentNode().find('.alert-placeholder');
        },

        drawAlert = function (alertPlaceholder, message) {
            alertPlaceholder.find('.alert').remove();
            alertPlaceholder.find('.busynotice').remove();
            alertPlaceholder.append(
                $.alert({ message: message, dismissable: true }).one('click', '.close', function () {
                    alertPlaceholder.empty();
                })
            );
        },

        drawBusy = function (alertPlaceholder) {
            alertPlaceholder.find('.notice').remove();
            alertPlaceholder.find('.alert').remove();
            alertPlaceholder.append(
                $('<div>').addClass('busynotice').text(gt('Trying to auto-configure your mail account'))
                .addClass('notice')
                .append($('<div>').addClass('busy_pic')
                )
            );
        },

        drawMessageWarning = function (alertPlaceholder, message) {
            alertPlaceholder.find('.notice').remove();
            alertPlaceholder.find('.alert').remove();
            alertPlaceholder.append(
                $('<div>').addClass('alert alert-danger').text(message)
            );
        },

        validateMailaccount = function (data, popup, def, options) {
            myModel.validationCheck(data, { ignoreInvalidTransport: true }).then(
                function success(response, responseobject) {
                    if (response === true) {
                        myModel.save(data).then(
                            function saveSuccess(response) {
                                if (response.error_id) {
                                    popup.close();
                                    failDialog(response.error);
                                } else {
                                    popup.close();
                                    if (collection) {
                                        collection.add([response]);
                                    }
                                    successDialog();
                                    def.resolve(response);
                                }
                            },
                            function saveFail(response) {
                                popup.close();
                                failDialog(response.error);
                            }
                        );
                    } else if (options && options.onValidationError) {
                        options.onValidationError(response, responseobject);
                    } else {
                        // this will not work if called from the "add account" autoconfig part, in this case
                        // the callback from the options will be called (see above)
                        var message = responseobject.error ? responseobject.error : gt('There was no suitable server found for this mail/password combination');
                        drawAlert(getAlertPlaceholder(popup), message);
                        popup.idle();
                        popup.getBody().find('a.close').focus();

                    }
                },
                function fail() {
                    var message = gt('Failed to connect.');
                    drawAlert(getAlertPlaceholder(popup), message);
                    popup.idle();
                }
            );
        },

        configureManuallyDialog = function (args, newMailaddress) {
            new dialogs.ModalDialog({ width: 400 })
                .text(gt('Auto-configuration failed. Do you want to configure your account manually?'))
                .addPrimaryButton('yes', gt('Yes'), 'yes')
                .addButton('no', gt('No'), 'no')
                .on('yes', function () {
                    var data = {};
                    data.primary_address = newMailaddress;
                    if (args) {
                        args.data = data;
                        createExtpointForNewAccount(args);
                    }
                })
                .show();
        },

        autoconfigApiCall = function (args, newMailaddress, newPassword, popup, def, forceSecure) {

            api.autoconfig({
                'email': newMailaddress,
                'password': newPassword,
                'force_secure': !!forceSecure
            })
            .done(function (data) {
                if (data.login) {
                    data.primary_address = newMailaddress;
                    data.password = newPassword;
                    // make sure not to set the SMTP credentials
                    delete data.transport_login;
                    delete data.transport_password;

                    validateMailaccount(data, popup, def, { onValidationError: function () {
                        // in case the validation fails this callback will be executed
                        configureManuallyDialog(args, newMailaddress);
                        popup.close();
                        def.reject();
                    } });

                } else if (forceSecure) {
                    new dialogs.ModalDialog({ async: true, width: 400 })
                        .text(gt('Cannot establish secure connection. Do you want to proceed anyway?'))
                        .addPrimaryButton('yes', gt('Yes'), 'yes')
                        .addButton('no', gt('No'), 'no')
                        .on('yes', function () {
                            autoconfigApiCall(args, newMailaddress, newPassword, this, def, false);
                        })
                        .on('no', function () {
                            def.reject();
                            this.close();
                        })
                        .show();
                    popup.close();
                } else {
                    configureManuallyDialog(args, newMailaddress);
                    popup.close();
                    def.reject();
                }
            })
            .fail(function () {
                configureManuallyDialog(args, newMailaddress);
                popup.close();
                def.reject();
            });
        },

        mailAutoconfigDialog = function (args, o) {
            var def = $.Deferred();
            if (o) {
                collection = o.collection;
            }

            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                var baton = ext.Baton({});

                new dialogs.ModalDialog({
                    width: 400,
                    async: true,
                    enter: 'add'
                })
                .header(
                    $('<h2>').text(gt('Add mail account'))
                )
                .build(function () {
                    baton.popup = this;
                    // invoke extensions
                    ext.point('io.ox/mail/add-account/preselect').invoke('draw', this.getContentNode(), baton);
                })
                .addPrimaryButton('add', gt('Add'), 'add')
                .addButton('cancel', gt('Cancel'), 'cancel')
                .addAlternativeButton('skip', gt('Manual'), 'skip')
                .on('add', function () {

                    var content = this.getContentNode(),
                        alertPlaceholder = content.find('.alert-placeholder'),
                        newMailaddress = content.find('.add-mail-account-address').val(),
                        newPassword = content.find('.add-mail-account-password').val();

                    if (myModel.isMailAddress(newMailaddress) === undefined) {
                        drawBusy(alertPlaceholder);
                        autoconfigApiCall(args, newMailaddress, newPassword, this, def, true);
                    } else {
                        var message = gt('This is not a valid mail address');
                        drawAlert(alertPlaceholder, message);
                        content.find('.add-mail-account-password').focus();
                        this.idle();
                    }
                })
                .on('skip', function () {
                    // primary address needs to be provided, why? fails without
                    args.data = { primary_address: this.getContentNode().find('.add-mail-account-address').val() };
                    // close
                    this.close();
                    def.reject();
                    // jump to manual configuration
                    createExtpointForNewAccount(args);
                })
                .show(function () {
                    // hide add button for now
                    this.find('[data-action="add"]').hide();
                    a11y.getTabbable(this).first().focus();
                });

            });

            return def;
        },

        successDialog = function () {
            notifications.yell('success', gt('Account added successfully'));
        },

        failDialog = function (message) {

            var alertPlaceholder = $('<div>');

            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                var failDialogbox = new dialogs.ModalDialog({
                    width: 400,
                    async: true
                });
                failDialogbox.header()
                .append(
                    alertPlaceholder
                )
                .addButton('cancel', gt('Close'), 'cancel')
                .show(function () {
                    failDialogbox.getFooter().find('.btn').addClass('closebutton');
                    drawMessageWarning(alertPlaceholder, message);
                });
            });
        };

    return {
        mailAutoconfigDialog: mailAutoconfigDialog
    };
});
