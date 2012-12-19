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

define('io.ox/mail/accounts/view-form',
    ['io.ox/core/tk/view',
     'text!io.ox/mail/accounts/account_detail.html',
     'gettext!io.ox/settings/settings'
    ], function (View, tmpl, gt) {

    'use strict';


    var staticStrings =  {
            TITLE_ACCOUNT_SETTINGS: gt('Account Settings'),
            ACCOUNT_NAME: gt('Account Name:'),
            EMAIL_ADDRESS: gt('E-Mail Address:'),
            UNIFIED_MAIL: gt('Use Unified Mail for this account'),
            SERVER_SETTINGS: gt('Server Settings'),
            SERVER_TYPE: gt('Server Type:'),
            SERVER_SSL: gt('Use SSL connection'),
            SERVER_NAME: gt('Server Name:'),
            SERVER_PORT: gt('Server Port:'),
            LOGIN: gt('Login'),
            PASSWORD: gt('Password'),
            POP_3_REFRESH: gt('POP3:'),
            LEAVE_MESSAGES: gt('Leave messages on server'),
            DELETING_ON_LOCAL: gt('Deleting messages on local storage also deletes them on server'),
            TITLE_SERVER_OUT: gt('Outgoing Server Settings (SMTP)'),
            SERVER_OUT_SSL: gt('Use SSL connection'),
            SERVER_OUT_NAME: gt('Server Name:'),
            SERVER_OUT_PORT: gt('Server Port:'),
            LOGIN_AND_PASS: gt('Use Login and Password'),
            LOGIN_OUT: gt('Login'),
            PASSWORD_OUT: gt('Password')
        },

        optionsServerType = _(['imap', 'pop3']).map(gt.noI18n),

        optionsRefreshRatePop = _([3, 5, 10, 15, 30, 60, 360]).map(gt.noI18n),

        AccountDetailView = Backbone.View.extend({
            tagName: "div",
            _modelBinder: undefined,
            initialize: function (options) {
                // create template
                this.template = doT.template(tmpl);
                this._modelBinder = new Backbone.ModelBinder();

                Backbone.Validation.bind(this, {selector: 'data-property'});
            },
            render: function () {
                var self = this;
                window.account = self.model;
                self.$el.empty().append(self.template({
                    strings: staticStrings,
                    optionsServer: optionsServerType,
                    optionsRefreshRate: optionsRefreshRatePop
                }));
                var defaultBindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
                self._modelBinder.bind(self.model, self.el, defaultBindings);

                return self;
            },
            events: {
                'click .save': 'onSave'
            },
            onSave: function () {
                var self = this,
                    deferedSave = $.Deferred();
                this.model.save(false, deferedSave);
                deferedSave.done(function (data) {
                    self.dialog.close();
                    if (self.collection) {
                        self.collection.add([data]);
                    }
                    if (self.model.isNew()) {
                        self.succes();
                    }
                });
            }
        });


    return AccountDetailView;
});
