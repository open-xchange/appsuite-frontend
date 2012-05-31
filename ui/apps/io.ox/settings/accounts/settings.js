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
define('io.ox/settings/accounts/settings',
      ['io.ox/core/extensions',
       'io.ox/core/tk/view',
       'io.ox/settings/utils',
       'io.ox/core/tk/dialogs',
       'io.ox/core/api/account',
       'io.ox/core/tk/forms'
       ], function (ext, View, utils, dialogs, api, forms) {


    'use strict';




    var listOfAccounts,
        listbox = null,

        createAccountItem = function (val) {
            listOfAccounts.push({
                dataid: 'email/' + val.id,
                html: val.primary_address
            });
        },

        seperateEachAccount = function (data) {
            listOfAccounts = [];
            _.each(data, function (val) {
                createAccountItem(val);
            });
        },

        drawAlert = function (alertPlaceholder) {
            alertPlaceholder.find('.alert').remove();
            alertPlaceholder.append(
                $('<div>')
                .addClass('alert alert-block fade in')
                .append(
                    $('<a>').attr({ href: '#', 'data-dismiss': 'alert' })
                    .addClass('close')
                    .html('&times;'),
                    $('<p>').text('This is not an valide emailaddress')
                )
            );
        },

        autoconfigApiCall = function (e, mailaddress) {

            api.autoconfig({
                'email': mailaddress,
                'password': 'test'
            }).done(
                function (data) {
                    e.data.autoconfig = data;
                    e.data.autoconfig.primary_address = mailaddress;
                    createExtpointForNewAccount(e);
                }
            )
            .fail(
                function () {
                    console.log('no configdata recived');
                    e.data.autoconfig = {
                        'primary_address': mailaddress
                    };
                    createExtpointForNewAccount(e);
                }
            );
        },

        validateEmail = function (e, mailaddress, alertPlaceholder) {
            var regEmail = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

            if (regEmail.test(mailaddress)) {
                autoconfigApiCall(e, mailaddress);
            } else {
                drawAlert(alertPlaceholder);
            }
        },

        mailAutoconfigDialog = function (e) {
            var inputField =  $('<input>', { placeholder: 'Mailaddress', value: '' }).addClass('nice-input'),
                alertPlaceholder = $('<div>');

            e.preventDefault();
            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                var self = this;
                new dialogs.ModalDialog({
                    width: 400,
                    easyOut: true
                })
                .header(
                    $('<h4>').text('Create a new mailaccount')
                )
                .append(
                    inputField
                )
                .append(
                    alertPlaceholder
                )
                .addButton('cancel', 'Cancel')
                .addPrimaryButton('add', 'Add')
                .show(function () {
                    this.find('input').focus();
                })
                .done(function () {
                    var mailaddress = inputField.val();
                    validateEmail(e, mailaddress, alertPlaceholder);
                });
            });
        },

        createExtpointForSelectedAccount = function (args) {
            var selectedItemID = args.data.listbox.find('div[selected="selected"]').attr('data-item-id'),
                splitedObj;
            if (selectedItemID !== undefined) {
//                console.log(selectedItemID);
                splitedObj = splitDataItemId(selectedItemID);
                args.data.id = splitedObj.dataid;
                require(['io.ox/settings/accounts/' + splitedObj.type + '/settings'], function (m) {
                    ext.point('io.ox/settings/accounts/' + splitedObj.type + '/settings/detail').invoke('draw', args.data.self.node, args);
                });
            }
        },

        createExtpointForNewAccount = function (args) {
            var type = 'email'; // TODO add more options
            console.log('create a new account');
            require(['io.ox/settings/accounts/' + type + '/settings'], function (m) {
                ext.point('io.ox/settings/accounts/' + type + '/settings/detail').invoke('draw', args.data.self.node, args);
            });
        },

        splitDataItemId = function (selectedItemID) {
            if (selectedItemID !== undefined) {
                var type = selectedItemID.split(/\//)[0],
                    dataid = selectedItemID.split(/\//)[1];
                return {
                    dataid: dataid,
                    type: type
                };
            }
        },

        removeSelectedItem = function (dataid, selectedItemID) {
            var def = $.Deferred();

            require(["io.ox/core/tk/dialogs"], function (dialogs) {
                new dialogs.ModalDialog()
                    .text("Do you really want to delete this account?")
                    .addPrimaryButton("delete", 'delete account')
                    .addButton("cancel", 'Cancel')
                    .show()
                    .done(function (action) {
                        if (action === 'delete') {
                            def.resolve();
                            api.remove([dataid]).done(
                                function () {
                                    listbox.find('[data-item-id="' + selectedItemID + '"]').remove();
                                }
                            );
                        } else {
                            def.reject();
                        }
                    });
            });
        },

        getSelectedItem = function (args) {
            var dataid,
                selectedItemID,
                splitedObj;
            if (args.data !== undefined) {
                selectedItemID = listbox.find('div[selected="selected"]').attr('data-item-id');
            } else {
                selectedItemID = $(args.srcElement.parentNode).attr('data-item-id');
            }
            splitedObj = splitDataItemId(selectedItemID);
            removeSelectedItem(splitedObj.dataid, selectedItemID);
        },

        AccountsSettingsModelView = {
        draw: function (data) {
            var self = this;

            self.node = $('<div>');

            self.node.append(forms.createSettingsHead(data))
            .append(
                    forms.createSection()
                    .append(
                        forms.createSectionTitle({text: 'Accounts'})
                        )
                    .append(
                        forms.createSectionContent()
                        .append(
                            listbox = forms.createListBox({
                                dataid: 'accounts-list',
                                model: {
                                    get: function () {
                                        return listOfAccounts;
                                    }
                                }
                            }).delegate('.close', 'click', getSelectedItem)
                        )
                        .append(
                            forms.createButton({label: 'Add ...', btnclass: 'btn'}).attr('data-action', 'add').css({'margin-right': '15px'})
                                 .on('click', {self: self}, mailAutoconfigDialog),
                            forms.createButton({label: 'Edit ...', btnclass: 'btn'}).attr('data-action', 'edit').css({'margin-right': '15px'})
                                .on('click', {listbox: listbox, self: self}, createExtpointForSelectedAccount),
                            forms.createButton({label: 'Delete ...', btnclass: 'btn'}).attr('data-action', 'delete')
                                .on('click', {self: self}, getSelectedItem)
                        )
                    )
                    .append(forms.createSectionDelimiter())
                );
            return self;

        }
    };

    ext.point("io.ox/settings/accounts/settings/detail").extend({
        index: 200,
        id: "accountssettings",
        draw: function (data) {
            var  that = this;
            api.all().done(function (allAccounts) {
                seperateEachAccount(allAccounts);
                that.append(AccountsSettingsModelView.draw(data).node);
            });

            return AccountsSettingsModelView.node;
        },
        save: function () {
            console.log('now accounts get saved?');
        }
    });

    return {}; //whoa return nothing at first

});

