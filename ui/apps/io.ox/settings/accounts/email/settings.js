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
       'io.ox/core/tk/dialogs'], function (ext, utils, dialogs) {
    'use strict';

    var settings = null; //should be initialized by the ext.point
    var myValidator = {
    
    };

    var accountDetailView = {
        dialog: null,
        node: null,
        itemid: null,
        save: function () {
 
        },
        draw: function (popup) {
            console.log('opening');
            popup.empty()
            .addClass('settings-detail-pane')
            .append(
                $('<div>').addClass('clear-title').text('Marios Account')
                  .append(utils.createSectionDelimiter())
            )
            .append(
                utils.createSection()
                  .append(utils.createSectionTitle({text: 'Account Settings'}))
                  .append(
                      utils.createSectionContent()
                        .append(utils.createLabeledTextField({label: 'Account Name:', dataid: 'mail-account-name', model: settings, validator: myValidator}))
                        .append(utils.createLabeledTextField({label: 'E-Mail Address:', dataid: 'mail-account-name', model: settings, validator: myValidator}))
                        .append(utils.createLabeledTextField({label: 'Account Name:', dataid: 'mail-account-name', model: settings, validator: myValidator}))
                        .append(utils.createCheckbox({dataid: 'mail-common-selectfirst', label: 'Use Unified Mail for this account', model: settings, validator: myValidator}))
                  )
                  .append(utils.createSectionDelimiter())
            )
            .append(
                utils.createSection()
                  .append(utils.createSectionTitle({text: 'Server Settings'}))
                  .append(
                      utils.createSectionContent()
                        .append(
                          utils.createSectionGroup()
                            .append(
                              utils.createSelectbox({dataid: 'mail-testselect', label: 'Server Type:', items: {
                                    'IMAP mail server': 'option1',
                                    'POP3 mail server': 'option2',
                                    'V-split view 3': 'option3'
                                  }, currentValue: 'option1', model: settings, validator: myValidator})
                            )
                        )
                        .append(utils.createCheckbox({ dataid: 'mail-common-selectfirst', label: 'Use SSL connection', model: settings, validator: myValidator}))
                        .append(utils.createLabeledTextField({label: 'Server Name:', dataid: 'mail-account-name', model: settings, validator: myValidator}))
                        .append(utils.createLabeledTextField({label: 'Server Port:', dataid: 'mail-account-name', model: settings, validator: myValidator}))
                        .append(utils.createLabeledTextField({label: 'Login', dataid: 'mail-account-name', model: settings, validator: myValidator}))
                        .append(utils.createLabeledPasswordField({label: 'Password', dataid: 'mail-account-name', model: settings, validator: myValidator}))
                  )
                  .append(utils.createSectionDelimiter())
            )
            .append(
                utils.createSection()
                  .append(utils.createSectionTitle({text: 'Outgoing Server Settings (SMTP)'}))
                  .append(
                      utils.createSectionContent()
                        .append(utils.createLabeledTextField({label: 'Account Name:', dataid: 'mail-account-name', model: settings, validator: myValidator}))
                        .append(utils.createLabeledTextField({label: 'E-Mail Address:', dataid: 'mail-account-name', model: settings, validator: myValidator}))
                        .append(utils.createLabeledTextField({label: 'Account Name:', dataid: 'mail-account-name', model: settings, validator: myValidator}))
                        .append(utils.createCheckbox({dataid: 'mail-common-selectfirst', label: 'Use Unified Mail for this account', model: settings, validator: myValidator}))
                  )
                  .append(utils.createSectionDelimiter())
            );

        },
        open: function (options) {
            accountDetailView.node = options.topnode.append($("<div>").addClass("accountDetail"));
            accountDetailView.dialog = new dialogs.SidePopup('800')
                .delegate(accountDetailView.node, '', accountDetailView.draw);

            return accountDetailView.node;
        }
    };



    ext.point("io.ox/settings/accounts/email/settings/detail").extend({
        index: 200,
        id: "emailaccountssettings",
        draw: function (dataid) {
            var mynode = this;
            require(['settings!io.ox/settings/accounts/email/' + dataid], function (settingsWrapper) {
                settings = settingsWrapper;
                console.log('open tha detail page');
                accountDetailView.open({topnode: mynode});
            });
        },
        save: function () {
            console.log('now accounts get saved?');
        }
    });
    
    return {}; //whoa return nothing at first
});
