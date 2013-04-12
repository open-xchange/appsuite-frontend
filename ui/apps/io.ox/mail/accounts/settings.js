/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/mail/accounts/settings',
      ['io.ox/core/extensions',
       'io.ox/core/api/account',
       "io.ox/mail/accounts/model",
       'io.ox/mail/accounts/view-form',
       'io.ox/core/tk/dialogs',
       'gettext!io.ox/mail/accounts/settings',
       'less!io.ox/settings/style.less'
       ], function (ext, api, AccountModel, AccountDetailView, dialogs, gt) {

    'use strict';

    ext.point("io.ox/settings/accounts/mail/settings/detail").extend({
        index: 200,
        id: "emailaccountssettings",
        draw: function (evt) {
            var data,
                myView,
                myModel,
                auto,
                myViewNode;
            if (evt.data.id >= 0) {
                api.get(evt.data.id).done(function (obj) {
                    data = obj;
                    myViewNode = $("<div>").addClass("accountDetail");
                    myModel = new AccountModel(data);
                    myView = new AccountDetailView({model: myModel, node: myViewNode});
                    myView.dialog = new dialogs.SidePopup({modal: true, arrow: false, saveOnClose: true}).show(evt, function (pane) {
                        pane.append(myView.render().el);
                    });
                    return myView.node;
                });
            } else {
                myViewNode = $("<div>").addClass("accountDetail");
                myModel = new AccountModel(evt.data);
                myView = new AccountDetailView({model: myModel, node: myViewNode});
                myView.dialog = new dialogs.SidePopup({modal: true, arrow: false, saveOnClose: true}).show(evt, function (pane) {
                    pane.append(myView.render().el);
                });
                myView.succes = successDialog;
                myView.collection = collection;
                return myView.node;
            }
        }
    });

    var autoconfigDialogbox,
        collection,
        myModel = new AccountModel({}),

        createExtpointForNewAccount = function (args) {
            var node = $('<div>');
            ext.point('io.ox/settings/accounts/mail/settings/detail').invoke('draw', node, args);
        },

        drawAlert = function (alertPlaceholder, message) {
            alertPlaceholder.find('.alert').remove();
            alertPlaceholder.find('.busynotice').remove();
            alertPlaceholder.append(
                $('<div>')
                .addClass('alert alert-block fade in')
                .append(
                    $('<a>').attr({ href: '#', 'data-dismiss': 'alert' })
                    .addClass('close')
                    .html('&times;'),
                    $('<p>').text(message)
                )
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

        drawMessage = function (alertPlaceholder, message) {
            alertPlaceholder.find('.notice').remove();
            alertPlaceholder.find('.alert').remove();
            alertPlaceholder.append(
                $('<div>').addClass('alert alert-success').text(message)
            );
        },

        drawMessageWarning = function (alertPlaceholder, message) {
            alertPlaceholder.find('.notice').remove();
            alertPlaceholder.find('.alert').remove();
            alertPlaceholder.append(
                $('<div>').addClass('alert alert-error').text(message)
            );
        },

        validateMailaccount = function (data, alertPlaceholder, def) {
            var deferedValidation = $.Deferred(),
                deferedSave = $.Deferred();

            myModel.validationCheck(data).then(
                function success(response) {
                    if (response === false) {
                        var message = gt('There was no suitable server found for this mail/password combination');
                        drawAlert(alertPlaceholder, message);
                        autoconfigDialogbox.idle();
                    } else {
                        myModel.save(data, deferedSave);
                        deferedSave.done(function (response) {
                            if (response.error_id) {
                                autoconfigDialogbox.close();
                                failDialog(response.error);
                            } else {
                                autoconfigDialogbox.close();
                                if (collection) {
                                    collection.add([response]);
                                }
                                successDialog();
                                def.resolve(response);
                            }
                        });
                    }
                },
                function fail() {
                    var message = gt('Failed to connect.');
                    drawAlert(alertPlaceholder, message);
                    autoconfigDialogbox.idle();
                }
            );
        },

        autoconfigApiCall = function (args, newMailaddress, newPassword, alertPlaceholder, def) {
            api.autoconfig({
                'email': newMailaddress,
                'password': newPassword
            }).done(function (data) {
                if (data.login) {
                    data.primary_address = newMailaddress;
                    data.password = newPassword;
                    validateMailaccount(data, alertPlaceholder, def);
                } else {
                    var data = {};
                    data.primary_address = newMailaddress;
                    if (args) {
                        args.data = data;
                        createExtpointForNewAccount(args);
                    }
                    autoconfigDialogbox.close();
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
                autoconfigDialogbox.close();
                def.reject();
            });
        },

        mailAutoconfigDialog = function (args, o) {
            var def = $.Deferred();
            if (o) {
                collection = o.collection;
            }
            var labelMail = $('<label>').text(gt('Your mail address')),
                labelPassword = $('<label>').text(gt('Your password')),
                inputFieldMail =  $('<input>', { value: '' }).attr('type', 'text').addClass('input-large'),
                inputFieldPassword = $('<input>', { value: '' }).attr('type', 'password').addClass('input-large'),
                alertPlaceholder = $('<div>');
            inputFieldPassword.keyup(function (e) {
                if (e.keyCode === 13) {
                    var addButton = autoconfigDialogbox.getFooter().find('.btn-primary');
                    addButton.trigger('click');
                }
            });
            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                var self = this;
                autoconfigDialogbox = new dialogs.ModalDialog({
                    width: 400,
                    easyOut: true,
                    async: true
                });

                autoconfigDialogbox.header(
                    $('<h4>').text(gt('Add mail account'))
                )
                .append(
                        labelMail.append(inputFieldMail)
                )
                .append(
                        labelPassword.append(inputFieldPassword)
                )
                .append(
                    alertPlaceholder
                )
                .addPrimaryButton('add', gt('Add'))
                .addButton('cancel', gt('Cancel'))
                .addAlternativeButton('skip', gt('Manual'))
                .show(function () {
                    inputFieldMail.focus();
                });

                autoconfigDialogbox.on('add', function (e) {
                    var newMailaddress = inputFieldMail.val(),
                        newPassword = inputFieldPassword.val();

                    if (myModel.isMailAddress(newMailaddress) === undefined) {
                        drawBusy(alertPlaceholder);
                        autoconfigApiCall(args, newMailaddress, newPassword, alertPlaceholder, def);
                    } else {
                        var message = gt('This is not a valid mail address');
                        drawAlert(alertPlaceholder, message);
                        inputFieldPassword.focus();
                        autoconfigDialogbox.idle();
                    }
                });

                autoconfigDialogbox.on('skip', function (e) {
                    autoconfigDialogbox.close();
                    def.reject();
                    //primary address needs to be provided, why? fails without
                    args.data = {primary_address: inputFieldMail.val()};
                    createExtpointForNewAccount(args);
                });
            });

            return def;
        },

        successDialog = function () {

            var alertPlaceholder = $('<div>');

            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                var self = this,
                    successDialogbox = new dialogs.ModalDialog({
                        width: 400,
                        easyOut: true,
                        async: true
                    });
                successDialogbox.header()
                .append(
                    alertPlaceholder
                )
                .addButton('cancel', gt('Close'))
                .show(function () {
                    successDialogbox.getFooter().find('.btn').addClass('closebutton');
                    var message = gt('Account added successfully');
                    drawMessage(alertPlaceholder, message);
                });
            });
        },

        failDialog = function (message) {

            var alertPlaceholder = $('<div>');

            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                var self = this,
                    failDialogbox = new dialogs.ModalDialog({
                        width: 400,
                        easyOut: true,
                        async: true
                    });
                failDialogbox.header()
                .append(
                    alertPlaceholder
                )
                .addButton('cancel', gt('Close'))
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
