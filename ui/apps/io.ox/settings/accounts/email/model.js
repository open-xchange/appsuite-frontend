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
define('io.ox/settings/accounts/email/model',
      ['io.ox/core/tk/model',
       'io.ox/core/api/account'
       ], function (Model, AccountApi) {

    'use strict';

    var AccountModel = Backbone.Model.extend({

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
            var regEmail = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            if (!regEmail.test(newMailaddress)) {
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
            if (this.attributes.id) {
                AccountApi.update(this.attributes);
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







