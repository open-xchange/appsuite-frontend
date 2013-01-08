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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define("io.ox/mail/accounts/model", ["io.ox/core/extensions", "io.ox/keychain/model", "io.ox/core/api/account"], function (ext, keychainModel, AccountApi) {
    "use strict";

    var AccountModel = keychainModel.Account.extend({

        defaults: {
            spam_handler: "NoSpamHandler"
        },

        validation: {
            name: {
                required: true,
                msg: 'The account must be named'
            },
            primary_address: {
                required: true,
                fn: 'isMailAddress'
            },
            mail_server: {
                required: true,
                msg: 'This field has to be filled'
            },
            mail_port: {
                required: true,
                msg: 'This field has to be filled'
            },
            login: {
                required: true,
                msg: 'This field has to be filled'
            },
            transport_server: {
                required: true,
                msg: 'This field has to be filled'
            },
            transport_port: {
                required: true,
                msg: 'This field has to be filled'
            }
        },
        isMailAddress: function (newMailaddress) {
            // var regEmail = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(newMailaddress);

            // var regEmail = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(newMailaddress);

            // Above examples would work partially for most adresses but do not cover all RFCs.
            // We should consider using something like this: https://code.google.com/p/isemail/
            // For now validation checks only if there is an @.

            // See also io.ox/backbone/validation.js

            var regEmail = /\@/.test(newMailaddress);

            if (!regEmail) {
                return 'This is not a valid email address';
            }
        },

        initialize: function (options) {

        },

        validationCheck: function (defered, data) {
            data.name = data.primary_address;
            data.personal = data.primary_address; // needs to be calculated
            data.unified_inbox_enabled = false;
            data.mail_secure = true;
            data.transport_secure = true;
            data.transport_credentials = false;

            AccountApi.validate(data).done(function (response) {
                return defered.resolve(response);
            }).fail(function (response) {
                return defered.resolve(response);
            });
        },

        save: function (obj, defered) {

            if (this.attributes.id !== undefined) {
                AccountApi.update(this.attributes).done(function (response) {
                    return defered.resolve(response);
                }).fail(function (response) {
                    return defered.resolve(response);
                });
            } else {
                if (obj) {
                    this.attributes = obj;
                    this.attributes.spam_handler = "NoSpamHandler";
                }
                AccountApi.create(this.attributes).done(function (response) {
                    return defered.resolve(response);
                }).fail(function (response) {
                    return defered.resolve(response);
                });
            }

        },

        destroy: function (options) {
            AccountApi.remove([this.attributes.id]);
            var model = this;
        }

    });

    return AccountModel;

});