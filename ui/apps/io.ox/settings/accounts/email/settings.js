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
/*global
define: true, _: true
*/
define('io.ox/settings/accounts/email/settings',
      ['io.ox/core/extensions',
       'io.ox/settings/utils',
       'io.ox/core/api/account',
       'io.ox/settings/accounts/email/model',
       'io.ox/settings/accounts/email/view-form',
       'io.ox/core/tk/dialogs',
       'gettext!io.ox/settings/settings'
       ], function (ext, utils, api, AccountModel, AccountDetailView, dialogs, gt) {
    'use strict';

    ext.point("io.ox/settings/accounts/email/settings/detail").extend({
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
                    myView.dialog = new dialogs.SidePopup('800').show(evt, function (pane) {
                        pane.append(myView.render().el);
                    });

                    return myView.node;
                });

            } else {
                myViewNode = $("<div>").addClass("accountDetail");
                myModel = new AccountModel(evt.data);
                myView = new AccountDetailView({model: myModel, node: myViewNode});
                myView.dialog = new dialogs.SidePopup('800').show(evt, function (pane) {
                    pane.append(myView.render().el);
                });
                myView.succes = successDialog;
                myView.collection = collection;
                return myView.node;
            }

        }
    });

    var autoconfigDialogbox,
        validateDialogbox,
        collection,
        myModel = new AccountModel({}),

        createExtpointForNewAccount = function (args) {
            var node = $('<div>');

            require(['io.ox/settings/accounts/email/settings'], function (m) {
                ext.point('io.ox/settings/accounts/email/settings/detail').invoke('draw', node, args);
            });
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

        validateMailaccount = function (data, alertPlaceholder) {
            var deferedValidation = $.Deferred(),
                deferedSave = $.Deferred();

            myModel.validationCheck(deferedValidation, data);
            deferedValidation.done(function (response) {
                if (response === false) {
                    var message = gt('Failed to connect. Please check your password and try again');
                    drawAlert(alertPlaceholder, message);
                    validateDialogbox.idle();
                } else {

                    myModel.save(data, deferedSave);
                    deferedSave.done(function (response) {
                        if (response.error_id) {
                            validateDialogbox.close();
                            failDialog(response.error);
                        } else {
                            validateDialogbox.close();
                            if (collection) {
                                collection.add([response]);
                            }
                            successDialog();
                        }

                    });
                }
            }).fail(function () {
                var message = gt('Failed to connect.');
                drawAlert(alertPlaceholder, message);
                validateDialogbox.idle();
            });
        },

        autoconfigApiCall = function (args, newMailaddress) {
            api.autoconfig({
                'email': newMailaddress,
                'password': 'test'
            }).done(function (data) {
                data.primary_address = newMailaddress;
                autoconfigDialogbox.close();
                inputPasswordDialog(data, collection);
            })
            .fail(function () {
                var data = {};
                console.log('no configdata recived');
                data.primary_address = newMailaddress;
                args.data = data;
                createExtpointForNewAccount(args);
                autoconfigDialogbox.close();
            });
        },

        validateEmail = function (newMailaddress) {
            var regEmail = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            if (regEmail.test(newMailaddress)) {
                return true;
            }
        },

        mailAutoconfigDialog = function (args, o) {
            if (o) {
                collection = o.collection;
            }
            var label = $('<label>').text(gt('Your mail address')),
                inputField =  $('<input>', { value: '' }).addClass('input-large'),
                alertPlaceholder = $('<div>');
            inputField.keyup(function (e) {
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
                        label.append(inputField)
                )
                .append(
                    alertPlaceholder
                )
                .addButton('cancel', 'Cancel')
                .addPrimaryButton('add', 'Add')
                .show(function () {
                    inputField.focus();
                });

                autoconfigDialogbox.on('add', function (e) {
                    var newMailaddress = inputField.val();
                    if (validateEmail(newMailaddress)) {
                        drawBusy(alertPlaceholder);
                        autoconfigApiCall(args, newMailaddress);
                    } else {
                        var message = gt('This is not a valid mail address');
                        drawAlert(alertPlaceholder, message);
                        inputField.focus();
                        autoconfigDialogbox.idle();
                    }
                });

            });
        },

        inputPasswordDialog = function (data, collection) {

            var label = $('<label>').text(gt('Your password')),
                inputField =  $('<input>', { value: '' }).attr('type', 'password').addClass('input-large'),
                alertPlaceholder = $('<div>');
            inputField.keyup(function (e) {
                if (e.keyCode === 13) {
                    var submitButton = validateDialogbox.getFooter().find('.btn-primary');
                    submitButton.trigger('click');
                }
            });

            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                var self = this;
                validateDialogbox = new dialogs.ModalDialog({
                    width: 400,
                    easyOut: true,
                    async: true
                });

                validateDialogbox.header(
                    $('<h4>').text(gt('Add password for mail account'))
                )
                .append(
                    label.append(inputField)
                )
                .append(
                    alertPlaceholder
                )
                .addButton('cancel', gt('Cancel'))
                .addPrimaryButton('add', gt('Submit'))
                .show(function () {
                    inputField.focus();
                });
                var message = gt('We now need your password to complete the setup process');
                drawMessage(alertPlaceholder, message);

                validateDialogbox.on('add', function (event) {
                    var password = inputField.val(),
                        obj;
                    if (password !== '') {
                        data.password = password;
                        drawBusy(alertPlaceholder);
                        validateMailaccount(data, alertPlaceholder);
                    } else {
                        var message = gt('Please fill the password');
                        drawAlert(alertPlaceholder, message);
                        inputField.focus();
                        validateDialogbox.idle();
                    }
                });
            });
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
    }; //whoa return nothing at first
});
