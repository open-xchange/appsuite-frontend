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

    function renderDetailView(evt, data) {
        var myView, myModel, myViewNode;

        myViewNode = $("<div>").addClass("accountDetail");
        myModel = new AccountModel(data);
        myView = new AccountDetailView({model: myModel, node: myViewNode});
        myView.dialog = new dialogs.SidePopup({modal: true, arrow: false, saveOnClose: true}).show(evt, function (pane) {
            pane.append(myView.render().el);
        });
        myView.succes = successDialog;
        myView.collection = collection;
        return myView.node;
    }

    ext.point("io.ox/settings/accounts/mail/settings/detail").extend({
        index: 200,
        id: "emailaccountssettings",
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
        draw: function (baton) {
            this.append(
                $('<label>').text(gt('Your mail address')).append(
                    $('<input type="text" class="input-large add-mail-account-address">')
                )
            );
        }
    });

    ext.point('io.ox/mail/add-account/wizard').extend({
        id: 'password',
        index: 200,
        draw: function (baton) {
            this.append(
                $('<label>').text(gt('Your password')).append(
                    $('<input type="password" class="input-large add-mail-account-password">')
                    .on('keyup', function (e) {
                        if (e.which === 13) {
                            $(this).closest('.io-ox-dialog-popup').find('.modal-footer .btn-primary').trigger('click');
                        }
                    })
                )
            );
        }
    });

    ext.point('io.ox/mail/add-account/wizard').extend({
        id: 'feedback',
        index: 'last',
        draw: function (baton) {
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
                $('<div>')
                .addClass('alert alert-error alert-block')
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

        validateMailaccount = function (data, popup, def) {
            var deferedValidation = $.Deferred(),
                deferedSave = $.Deferred();

            myModel.validationCheck(data).then(
                function success(response) {
                    if (response === false) {
                        var message = gt('There was no suitable server found for this mail/password combination');
                        drawAlert(getAlertPlaceholder(popup), message);
                        popup.idle();
                    } else {
                        myModel.save(data, deferedSave);
                        deferedSave.done(function (response) {
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
                        });
                    }
                },
                function fail(e) {
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
            }).done(function (data) {
                if (data.login) {
                    data.primary_address = newMailaddress;
                    data.password = newPassword;
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

                var self = this;

                new dialogs.ModalDialog({
                    width: 400,
                    easyOut: true,
                    async: true
                })
                .header(
                    $('<h4>').text(gt('Add mail account'))
                )
                .build(function () {
                    // invoke extensions
                    ext.point('io.ox/mail/add-account/wizard').invoke('draw', this.getContentNode());
                })
                .addPrimaryButton('add', gt('Add'))
                .addButton('cancel', gt('Cancel'))
                .addAlternativeButton('skip', gt('Manual'))
                .on('add', function (e) {

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
                .on('skip', function (e) {
                    // primary address needs to be provided, why? fails without
                    args.data = { primary_address: this.getContentNode().find('.add-mail-account-address').val() };
                    // close
                    this.close();
                    def.reject();
                    // jump to manual configuration
                    createExtpointForNewAccount(args);
                })
                .show(function () {
                    this.find('input[type=text]').focus();
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
