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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/mail/accounts/model', [
    'io.ox/core/extensions',
    'io.ox/keychain/model',
    'io.ox/core/api/account',
    'io.ox/core/folder/api',
    'io.ox/backbone/validation',
    'gettext!io.ox/keychain'
], function (ext, keychainModel, AccountAPI, folderAPI, validation, gt) {

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
                    msg: gt('This field has to be filled')
                }, {
                    fn: _.noI18n('isMailAddress')
                }
            ],
            login: function (value) {
                //for setups without any explicit login name for primary account
                if (this.attributes.id !== 0 && $.trim(value) === '') {
                    return gt('This field has to be filled');
                }
            },
            password: function (value) {
                //if we have an id we are in edit mode, not create new account mode. Here we don't get the password from the server, so this field may be empty.
                if (this.attributes.id === undefined && (!value || value === '')) {
                    return gt('This field has to be filled');
                }
            },
            mail_server: {
                required: function () {
                    return !this.isHidden();
                },
                msg: gt('This field has to be filled')
            },
            mail_port: [{
                required: function () {
                    return !this.isHidden();
                },
                msg: gt('This field has to be filled')
            }, { fn: function (val) {
                var temp = validation.formats.number(val);
                if (temp === true) {
                    // strangely if the validation returns true here, it is marked as invalid...
                    return false;
                }
                return temp;
            }}],
            transport_server: {
                required: function () {
                    return !this.isHidden();
                },
                msg: gt('This field has to be filled')
            },
            transport_port: [{
                required: function () {
                    return !this.isHidden();
                },
                msg: gt('This field has to be filled')
            }, { fn: function (val) {
                var temp = validation.formats.number(val);
                if (temp === true) {
                    // strangely if the validation returns true here, it is marked as invalid...
                    return false;
                }
                return temp;
            }}]
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

            var regEmail = /\@/.test(newMailaddress);

            if (!regEmail) {
                return gt('This is not a valid email address');
            }
        },

        initialize: function () {

        },

        validationCheck: function (data, options) {

            data = _.extend({ unified_inbox_enabled: false, transport_auth: 'mail' }, data || this.toJSON());
            data.name = data.personal = data.primary_address;
            return AccountAPI.validate(data, options);
        },

        save: function (obj) {

            var id = this.get('id');

            if (id !== undefined) {

                // get account to determine changes
                return AccountAPI.get(id).then(function (account) {

                    var changes = { id: id };

                    // primary mail account only allows editing of display name and unified mail
                    if (id === 0) {
                        changes.personal = this.get('personal');
                        changes.unified_inbox_enabled = this.get('unified_inbox_enabled');
                    } else {
                        // compare all attributes
                        _(this.toJSON()).each(function (value, key) {
                            if (!_.isEqual(value, account[key])) changes[key] = value;
                        });
                        // don't send transport_login/password if transport_auth is mail
                        if (this.get('transport_auth') === 'mail') {
                            delete changes.transport_login;
                            delete changes.transport_password;
                        }
                    }

                    return AccountAPI.update(changes).done(function () {
                        folderAPI.pool.unfetch('default' + id);
                    });

                }.bind(this));
            }

            if (obj) {
                obj = _.extend({ unified_inbox_enabled: false }, obj);
                obj.name = obj.personal = obj.primary_address;
                this.attributes = obj;
                this.attributes.spam_handler = 'NoSpamHandler';
            }
            return AccountAPI.create(this.attributes);
        },

        destroy: function () {
            AccountAPI.remove([this.attributes.id]);
        }

    });

    return AccountModel;

});
