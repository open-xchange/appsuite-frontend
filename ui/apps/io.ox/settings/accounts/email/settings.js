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
       'io.ox/core/tk/forms',
       'io.ox/core/api/account',
       'io.ox/core/tk/dialogs'], function (ext, utils, forms, api, dialogs) {
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
            popup.empty()
            .addClass('settings-detail-pane')
            .append(
                $('<div>').addClass('clear-title').text('Marios Account')
                  .append(forms.createSectionDelimiter())
            )
            .append(
                    forms.createSectionTitle({text: 'Account Settings'}),
                    forms.createSectionHorizontalWrapper().append(
                        forms.createControlGroup().append(
                            forms.createControlGroupLabel({text: 'Account Name:', 'for': 'auto'}),
                            forms.createControlsWrapper().append(
                                forms.createTextField({id: 'last', property: 'mail-account-name', model: settings, validator: myValidator})
                            )

                        ),
                        forms.createControlGroup().append(
                            forms.createControlGroupLabel({text: 'E-Mail Address:', 'for': 'auto'}),
                            forms.createControlsWrapper().append(
                                forms.createTextField({id: 'last', property: 'mail-account-name', model: settings, validator: myValidator})
                            )
                        ),
                        forms.createControlGroup().append(
                                forms.createControlsWrapper().append(
                                    forms.createCheckbox({property: 'mail-common-selectfirst', label: 'Use Unified Mail for this account', model: settings, validator: myValidator})
                                )
                            ),
                        forms.createSectionDelimiter()
                    )
            )
            .append(
                forms.createSectionTitle({text: 'Server Settings'}),
                forms.createSectionHorizontalWrapper().append(
                    forms.createControlGroup().append(
                        forms.createControlGroupLabel({text: 'Server Type:', 'for': 'auto'}),
                        forms.createControlsWrapper().append(
                            forms.createSelectbox({property: 'mail-testselect', items: {'IMAP mail server': 'option1', 'POP3 mail server': 'option2', 'V-split view 3': 'option3'}, currentValue: 'option1',
                              model: settings,
                              validator: myValidator})
                        )
                    ),
                    forms.createControlGroup().append(
                        forms.createControlGroupLabel(),
                        forms.createControlsWrapper().append(
                            forms.createCheckbox({ property: 'mail-common-selectfirst', label: 'Use SSL connection', model: settings, validator: myValidator})
                        )
                    ),
                    forms.createControlGroup().append(
                        forms.createControlGroupLabel({text: 'Server Name:', 'for': 'auto'}),
                        forms.createControlsWrapper().append(
                            forms.createTextField({property: 'mail-account-name', id: 'last', model: settings, validator: myValidator})
                        )
                    ),
                    forms.createControlGroup().append(
                        forms.createControlGroupLabel({text: 'Server Port:', 'for': 'auto'}),
                        forms.createControlsWrapper().append(
                            forms.createTextField({property: 'mail-account-name', id: 'last', model: settings, validator: myValidator})
                        )
                    ),
                    forms.createControlGroup().append(
                        forms.createControlGroupLabel({text: 'Login', 'for': 'auto'}),
                        forms.createControlsWrapper().append(
                            forms.createTextField({property: 'mail-account-name', id: 'last', model: settings, validator: myValidator})
                        )
                    ),
                    forms.createControlGroup().append(
                        forms.createControlGroupLabel({text: 'Password', 'for': 'auto'}),
                        forms.createControlsWrapper().append(
                            forms.createPasswordField({property: 'mail-account-name', id: 'last', model: settings, validator: myValidator})
                        )
                    )
                )
            )
            .append(
                forms.createSectionTitle({text: 'Outgoing Server Settings (SMTP)'}),
                forms.createSectionHorizontalWrapper().append(
                    forms.createControlGroup().append(
                        forms.createControlGroupLabel({text: 'Account Name:', 'for': 'auto'}),
                        forms.createControlsWrapper().append(
                            forms.createTextField({property: 'mail-account-name', id: 'last', model: settings, validator: myValidator})
                        )
                    ),
                    forms.createControlGroup().append(
                        forms.createControlGroupLabel({text: 'E-Mail Address:', 'for': 'auto'}),
                        forms.createControlsWrapper().append(
                            forms.createTextField({property: 'mail-account-name', id: 'last', model: settings, validator: myValidator})
                        )
                    ),
                    forms.createControlGroup().append(
                        forms.createControlGroupLabel(),
                        forms.createControlsWrapper().append(
                            forms.createCheckbox({property: 'mail-common-selectfirst', label: 'Use Unified Mail for this account', model: settings, validator: myValidator})
                        )
                    )
                )
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
