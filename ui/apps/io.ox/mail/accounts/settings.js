/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
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
    'gettext!io.ox/mail/accounts/settings',
    'less!io.ox/settings/style'
], function (ext, api, AccountModel, AccountDetailView, dialogs, notifications, gt) {

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

        myView.dialog.append(
            myView.render().el
        )
        .addPrimaryButton('save', gt('Save'), 'save', { tabIndex: 1 })
        .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
        .show(function () {
            this.find('input[type=text]:first').focus();
        });

        //show errors
        myModel.on('validated', function (valid, model, error) {
            var $form = myView.$el;
            $form.find('.error').removeClass('error');
            $form.find('.help-block').remove();

            _.each(error, function (message, key) {
                var $field = myView.$el.find('#' + key).parent(),
                    $row = $field.closest('.form-group'),
                    helpBlock = $('<div class="help-block error">');
                helpBlock.append($.txt(message));
                $field.append(helpBlock);
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

    ext.point('io.ox/mail/add-account/wizard').extend({
        id: 'address',
        index: 100,
        draw: function () {
            this.append(
                $('<div class="form-group">').append(
                    $('<label for="add-mail-account-address">').text(gt('Your mail address')),
                    $('<input id="add-mail-account-address" type="text" class="form-control add-mail-account-address" tabindex="1">')
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
                    $('<input id="add-mail-account-password" type="password" class="form-control add-mail-account-password" tabindex="1">')
                )
            );
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
                $.alert({ message: message, dismissable: true })
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

        validateMailaccount = function (data, popup, def) {

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
                    } else {
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

        autoconfigApiCall = function (args, newMailaddress, newPassword, popup, def) {

            api.autoconfig({
                'email': newMailaddress,
                'password': newPassword
            })
            .done(function (data) {
                if (data.login) {
                    data.primary_address = newMailaddress;
                    data.password = newPassword;
                    // make sure not to set the SMTP credentials
                    delete data.transport_login;
                    delete data.transport_password;
                    validateMailaccount(data, popup, def);
                } else {
                    var data = {};
                    data.primary_address = newMailaddress;
                    if (args) {
                        args.data = data;
                        createExtpointForNewAccount(args);
                    }
                    popup.close();
                    def.reject();
                }
            })
            .fail(function () {
                var data = {};
                data.primary_address = newMailaddress;
                if (args) {
                    args.data = data;
                    createExtpointForNewAccount(args);
                }
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

                new dialogs.ModalDialog({
                    width: 400,
                    async: true,
                    enter: 'add'
                })
                .header(
                    $('<h2>').text(gt('Add mail account'))
                )
                .build(function () {
                    // invoke extensions
                    ext.point('io.ox/mail/add-account/wizard').invoke('draw', this.getContentNode());
                })
                .addPrimaryButton('add', gt('Add'), 'add', { tabIndex: 1 })
                .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
                .addAlternativeButton('skip', gt('Manual'), 'skip', { tabIndex: 1 })
                .on('add', function () {

                    var content = this.getContentNode(),
                        alertPlaceholder = content.find('.alert-placeholder'),
                        newMailaddress = content.find('.add-mail-account-address').val(),
                        newPassword = content.find('.add-mail-account-password').val();

                    if (myModel.isMailAddress(newMailaddress) === undefined) {
                        drawBusy(alertPlaceholder);
                        autoconfigApiCall(args, newMailaddress, newPassword, this, def);
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
                    this.find('input[type=text]:first').focus();
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
                .addButton('cancel', gt('Close'), 'cancel', { tabIndex: 1 })
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
