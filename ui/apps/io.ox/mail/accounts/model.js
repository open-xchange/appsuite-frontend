/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/mail/accounts/model', [
    'io.ox/core/extensions',
    'io.ox/keychain/model',
    'io.ox/core/api/account',
    'io.ox/core/folder/api',
    'io.ox/backbone/validation',
    'settings!io.ox/mail',
    'gettext!io.ox/keychain'
], function (ext, keychainModel, AccountAPI, folderAPI, validation, mailSettings, gt) {

    'use strict';

    var AccountModel = keychainModel.Account.extend({

        defaults: {
            //some conditional defaults defined in view-form.render (pop3)
            spam_handler: 'NoSpamHandler',
            transport_auth: 'mail',
            transport_password: null
        },

        validation: {
            name: {
                required: true,
                msg: gt('The account must be named')
            },
            primary_address: [
                {
                    required: true,
                    msg: gt('This field is mandatory')
                }, {
                    fn: 'isMailAddress'
                }
            ],
            login: function (value) {
                //for setups without any explicit login name for primary account
                if (this.attributes.id !== 0 && $.trim(value) === '') {
                    return gt('This field is mandatory');
                }
            },
            password: function (value) {
                //if we have an id we are in edit mode, not create new account mode. Here we don't get the password from the server, so this field may be empty.
                if (this.attributes.id === undefined && (!value || value === '')) {
                    return gt('This field is mandatory');
                }
            },
            mail_server: {
                required: function () {
                    return !this.isHidden();
                },
                msg: gt('This field is mandatory')
            },
            mail_port: [
                {
                    required: function () {
                        return !this.isHidden();
                    },
                    msg: gt('This field is mandatory')
                },
                {
                    fn: function (val) {
                        var temp = validation.formats.number(val);
                        if (temp === true) {
                            // strangely if the validation returns true here, it is marked as invalid...
                            return false;
                        }
                        return temp;
                    }
                }
            ],
            transport_server: {
                required: function () {
                    return !this.isHidden() && !this.get('secondary') && mailSettings.get('features/allowExternalSMTP', true);
                },
                msg: gt('This field is mandatory')
            },
            transport_port: [
                {
                    required: function () {
                        return !this.isHidden() && mailSettings.get('features/allowExternalSMTP', true);
                    },
                    msg: gt('This field is mandatory')
                },
                {
                    fn: function (val) {
                        var temp = validation.formats.number(val);
                        if (temp === true) {
                            // strangely if the validation returns true here, it is marked as invalid...
                            return false;
                        }
                        return temp;
                    }
                }
            ]
        },

        isHidden: function () {
            //convention with backend
            return this.attributes.id === 0 && !this.attributes.mail_server;
        },

        isMailAddress: function (newMailaddress) {
            // var regEmail = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4 })+$/.test(newMailaddress);

            // var regEmail = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(newMailaddress);

            // Above examples would work partially for most adresses but do not cover all RFCs.
            // We should consider using something like this: https://code.google.com/p/isemail/
            // For now validation checks only if there is an @.

            // See also io.ox/backbone/validation.js

            var regEmail = /@/.test(newMailaddress);

            if (!regEmail) return gt('This is not a valid email address');
        },

        initialize: function () {

        },

        validationCheck: function (data, options) {

            data = _.extend({ unified_inbox_enabled: false, transport_auth: 'mail' }, data || this.toJSON());
            data.name = data.personal = data.primary_address;
            // don't send transport_login/password if transport_auth is mail
            if (data.transport_auth === 'mail') {
                delete data.transport_login;
                delete data.transport_password;
                if (!mailSettings.get('features/allowExternalSMTP', true)) {
                    delete data.transport_server;
                    delete data.transport_port;
                    delete data.transport_auth;
                }
            }
            return AccountAPI.validate(data, options);
        },

        save: function (obj) {

            var id = this.get('id'),
                model = this;

            if (id !== undefined) {

                // get account to determine changes
                return AccountAPI.get(id).then(function (account) {

                    var changes = { id: id },
                        // primary mail account only allows editing of display name, unified mail and default folders
                        keys = id === 0 ?
                            ['personal', 'name', 'unified_inbox_enabled', 'sent_fullname', 'trash_fullname', 'drafts_fullname', 'spam_fullname', 'archive_fullname'] :
                            model.keys();

                    // compare all attributes
                    _(model.pick(keys)).each(function (value, key) {
                        if (!_.isEqual(value, account[key])) changes[key] = value;
                    });

                    // don't send transport_login/password if transport_auth is mail
                    if (model.get('transport_auth') === 'mail') {
                        delete changes.transport_login;
                        delete changes.transport_password;
                    }

                    return AccountAPI.update(changes).done(function () {
                        var def = $.when();
                        folderAPI.pool.unfetch('default' + id);
                        if (typeof changes.unified_inbox_enabled !== 'undefined') {
                            def = require(['settings!io.ox/mail']).then(function (settings) {
                                // reload settings to fetch unifiedInboxIdentifier
                                return settings.reload();
                            }).then(function () {
                                folderAPI.pool.unfetch('1');
                            });
                        } else if (id === 0) {
                            // reload settings before folder refresh when the primary account is changed to get correct default folders (virtual standard relies on these settings)
                            def = require(['settings!io.ox/mail']).then(function (settings) {
                                // reload settings to fetch unifiedInboxIdentifier
                                return settings.reload();
                            });
                        }
                        def.then(function () {
                            folderAPI.refresh();
                        });
                    });

                }).then(function () {
                    model.trigger('sync', model);
                });
            }

            if (obj) {
                obj = _.extend({ unified_inbox_enabled: false }, obj);
                obj.name = obj.primary_address;
                model.attributes = obj;
                model.attributes.spam_handler = 'NoSpamHandler';
            }

            if (!mailSettings.get('features/allowExternalSMTP', true) && model.get('transport_auth') === 'mail') {
                model.unset('transport_login', { silent: true });
                model.unset('transport_password', { silent: true });
                model.unset('transport_auth', { silent: true });
                model.unset('transport_port', { silent: true });
            }

            return AccountAPI.create(model.attributes);
        },

        destroy: function () {
            AccountAPI.remove([this.attributes.id]);
        }

    });

    return AccountModel;

});
