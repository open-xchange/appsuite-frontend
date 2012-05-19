/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/settings/accounts/email/view-form',
    ['io.ox/core/tk/view',
     'io.ox/core/tk/model'

    ], function (View, Model) {

    'use strict';


    var AccountDetailView = View.extend({
        draw: function () {
            var mynode = $('<div>');

            mynode.addClass('settings-detail-pane')
            .append(
                $('<div>').addClass('clear-title').text(' ')
                  .append(this.createSectionDelimiter())
            )
            .append(
                    this.createSectionTitle({text: 'Account Settings'}),
                    this.createSectionHorizontalWrapper().append(
                        this.createControlGroup().append(
                            this.createControlGroupLabel({text: 'Account Name:', 'for': 'auto'}),
                            this.createControlsWrapper().append(
                                this.createTextField({id: 'last', property: 'name'})
                            )

                        ),
                        this.createControlGroup().append(
                            this.createControlGroupLabel({text: 'E-Mail Address:', 'for': 'auto'}),
                            this.createControlsWrapper().append(
                                this.createTextField({id: 'last', property: 'primary_address'})
                            )
                        ),
                        this.createControlGroup().append(
                                this.createControlsWrapper().append(
                                    this.createCheckbox({property: 'unified_inbox_enabled', label: 'Use Unified Mail for this account'})
                                )
                            ),
                        this.createSectionDelimiter()
                    )
            )
            .append(
                this.createSectionTitle({text: 'Server Settings'}),
                this.createSectionHorizontalWrapper().append(
                    this.createControlGroup().append(
                        this.createControlGroupLabel({text: 'Server Type:', 'for': 'auto'}),
                        this.createControlsWrapper().append(
                            this.createSelectbox({property: 'mail_protocol', items: {'imap': 'imap', 'pop3': 'pop3'}})
                        )
                    ),
                    this.createControlGroup().append(
                        this.createControlGroupLabel(),
                        this.createControlsWrapper().append(
                            this.createCheckbox({ property: 'mail_secure', label: 'Use SSL connection'})
                        )
                    ),
                    this.createControlGroup().append(
                        this.createControlGroupLabel({text: 'Server Name:', 'for': 'auto'}),
                        this.createControlsWrapper().append(
                            this.createTextField({property: 'mail_server', id: 'last'})
                        )
                    ),
                    this.createControlGroup().append(
                        this.createControlGroupLabel({text: 'Server Port:', 'for': 'auto'}),
                        this.createControlsWrapper().append(
                            this.createTextField({property: 'mail_port', id: 'last'})
                        )
                    ),
                    this.createControlGroup().append(
                        this.createControlGroupLabel({text: 'Login', 'for': 'auto'}),
                        this.createControlsWrapper().append(
                            this.createTextField({property: 'login', id: 'last'})
                        )
                    ),
                    this.createControlGroup().append(
                        this.createControlGroupLabel({text: 'Password', 'for': 'auto'}),
                        this.createControlsWrapper().append(
                            this.createPasswordField({property: 'password', id: 'last'})
                        )
                    ),
                    this.createControlGroup().append(
                        this.createControlGroupLabel({text: 'Pop3 refresh rate:', 'for': 'auto'}),
                        this.createControlsWrapper().append(
                            this.createSelectbox({property: 'pop3_refresh_rate', items: {'3': '3', '5': '5', '10': '10', '15': '15', '30': '30', '60': '60', '360': '360'}})
                        )
                    ),
                    this.createControlGroup().append(
                        this.createControlGroupLabel(),
                        this.createControlsWrapper().append(
                            this.createCheckbox({ property: 'pop3_expunge_on_quit', label: 'Leave messages on server'})
                        )
                    ),
                    this.createControlGroup().append(
                        this.createControlGroupLabel(),
                        this.createControlsWrapper().append(
                            this.createCheckbox({ property: 'pop3_delete_write_through', label: 'Deleting messages on local storage also deletes them on server'})
                        )
                    )
                )
            )
            .append(
                this.createSectionTitle({text: 'Outgoing Server Settings (SMTP)'}),
                this.createSectionHorizontalWrapper().append(
                    this.createControlGroup().append(
                            this.createControlGroupLabel(),
                            this.createControlsWrapper().append(
                                this.createCheckbox({ property: 'transport_secure', label: 'Use SSL connection'})
                            )
                        ),
                    this.createControlGroup().append(
                        this.createControlGroupLabel({text: 'Server Name:', 'for': 'auto'}),
                        this.createControlsWrapper().append(
                            this.createTextField({property: 'transport_server', id: 'last'})
                        )
                    ),
                    this.createControlGroup().append(
                        this.createControlGroupLabel({text: 'Server Port:', 'for': 'auto'}),
                        this.createControlsWrapper().append(
                            this.createTextField({property: 'transport_port', id: 'last'})
                        )
                    ),
                    this.createControlGroup().append(
                        this.createControlGroupLabel(),
                        this.createControlsWrapper().append(
                            this.createCheckbox({property: 'mail-common-selectfirst', label: 'Use Login and Password'})
                        )
                    ),
                    this.createControlGroup().append(
                            this.createControlGroupLabel({text: 'Login', 'for': 'auto'}),
                            this.createControlsWrapper().append(
                                this.createTextField({property: 'transport_login', id: 'last'})
                            )
                        ),
                    this.createControlGroup().append(
                        this.createControlGroupLabel({text: 'Password', 'for': 'auto'}),
                        this.createControlsWrapper().append(
                            this.createPasswordField({property: 'transport_password', id: 'last'})
                        )
                    )
                )
            );
            return mynode;
        }
    });

    return AccountDetailView;
});