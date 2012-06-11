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
            if (evt.data.id) {
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
                auto = evt.data.autoconfig;
                myModel = new AccountModel(auto);
                myView = new AccountDetailView({model: myModel, node: myViewNode});
                myView.dialog = new dialogs.SidePopup('800').show(evt, function (pane) {
                    pane.append(myView.render().el);

                });
                return myView.node;
            }
        }
    });

    var autoconfigDialogbox,
        validateDialogbox,

        createExtpointForNewAccount = function (args) {
            var type = 'email', // TODO add more options
                node = $('<div>');

            require(['io.ox/settings/accounts/' + type + '/settings'], function (m) {
                ext.point('io.ox/settings/accounts/' + type + '/settings/detail').invoke('draw', node, args);
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

        apiCreateNewAccountCall = function (obj, alertPlaceholder) {
            obj.name = obj.primary_address;
            obj.personal = obj.primary_address; // needs to be calculated
            obj.unified_inbox_enabled = false;
            obj.mail_secure = true;
            obj.transport_secure = true;
            obj.transport_credentials = false;
            obj.spam_handler = "NoSpamHandler";
            validateMailaccount(obj, alertPlaceholder);
        },

        drawNewItem = function (id, email) {
                var item = $('<div>'),
                    box = $('.listbox'),
                    checkItem = box.find($('[data-item-id="email/' + id + '"]'));
                if (!checkItem[0]) { // draw triggers twice at the moment
                    item.addClass('deletable-item');
                    item.attr('data-item-id', 'email/' + id);

                    item.append(
                            $('<a>').html('&times;').addClass('close')
                          );

                    item.append($('<div>').html(email));

                    item.on('click', function () {
                        console.log('click');
                        item.parent().find('div[selected="selected"]').attr('selected', null);
                        item.attr('selected', 'selected');
                    });
                    box.append(item);
                }

            },

        validateMailaccount = function (obj, alertPlaceholder) {
            api.on('account_created', function (e, data) {
                drawNewItem(data.id, data.email);
                validateDialogbox.close();
                successDialog();
            });
            api.validate(obj).done(function (data) {
                if (data === false) {
                    var message = gt('Failed to connect. Please check your password and try again');
                    drawAlert(alertPlaceholder, message);
                    validateDialogbox.idle();
                } else {
                    var myModel = new AccountModel({});
                    myModel.save(obj);
                }
            }).fail(function () {
                var message = gt('Failed to connect.');
                drawAlert(alertPlaceholder, message);
                validateDialogbox.idle();
            });
        },

        autoconfigApiCall = function (e, newMailaddress) {
            api.autoconfig({
                'email': newMailaddress,
                'password': 'test'
            }).done(function (data) {
                if (!e.data) {
                    e.data = {};
                }
                e.data.autoconfig = data;
                e.data.autoconfig.primary_address = newMailaddress;
                autoconfigDialogbox.close();
                inputPasswordDialog(e);
            })
            .fail(function () {
                console.log('no configdata recived');
                if (!e.data) {
                    e.data = {};
                    e.data.autoconfig = {};
                }
                e.data.autoconfig = {};
                e.data.autoconfig.primary_address = newMailaddress;
                createExtpointForNewAccount(e);
                autoconfigDialogbox.close();
            });
        },

        validateEmail = function (newMailaddress) {
            var regEmail = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            if (regEmail.test(newMailaddress)) {
                return true;
            }
        },

        mailAutoconfigDialog = function (e) {

            var label = $('<label>').text(gt('Your mail address')),
                inputField =  $('<input>', { value: '' }).addClass('input-large'),
                alertPlaceholder = $('<div>');
            inputField.keyup(function (e) {
                if (e.keyCode === 13) {
                    var addButton = autoconfigDialogbox.getFooter().find('.btn-primary');
                    addButton.trigger('click');
                }
            });

            e.preventDefault();
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

                autoconfigDialogbox.on('add', function () {
                    var newMailaddress = inputField.val();
                    if (validateEmail(newMailaddress)) {
                        drawBusy(alertPlaceholder);
                        autoconfigApiCall(e, newMailaddress);
                    } else {
                        var message = gt('This is not an valid mail address');
                        drawAlert(alertPlaceholder, message);
                        inputField.focus();
                        autoconfigDialogbox.idle();
                    }
                });

            });
        },

        inputPasswordDialog = function (e) {

            var label = $('<label>').text(gt('Your password')),
                inputField =  $('<input>', { value: '' }).attr('type', 'password').addClass('input-large'),
                alertPlaceholder = $('<div>');
            inputField.keyup(function (e) {
                if (e.keyCode === 13) {
                    var submitButton = validateDialogbox.getFooter().find('.btn-primary');
                    submitButton.trigger('click');
                }
            });

            e.preventDefault();
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
                        e.data.autoconfig.password = password;
                        obj =  e.data.autoconfig;
                        drawBusy(alertPlaceholder);
                        apiCreateNewAccountCall(obj, alertPlaceholder);
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
        };



    return {
        mailAutoconfigDialog: mailAutoconfigDialog
    }; //whoa return nothing at first
});
