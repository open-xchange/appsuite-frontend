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
     'io.ox/core/notifications',
     'text!io.ox/mail/accounts/account_detail.html',
     'gettext!io.ox/settings/settings'
    ], function (View, notifications, tmpl, gt) {

    'use strict';


    var staticStrings =  {
            TITLE_ACCOUNT_SETTINGS: gt('Account Settings'),
            ACCOUNT_NAME: gt('Account Name:'),
            PERSONAL: gt('Your name:'),
            EMAIL_ADDRESS: gt('E-Mail Address:'),
            UNIFIED_MAIL: gt('Use Unified Mail for this account'),
            SERVER_SETTINGS: gt('Server Settings'),
            SERVER_TYPE: gt('Server Type:'),
            SERVER_SSL: gt('Use SSL connection'),
            SERVER_NAME: gt('Server Name:'),
            SERVER_PORT: gt('Server Port:'),
            LOGIN: gt('Login'),
            PASSWORD: gt('Password'),
            POP_3_REFRESH: gt('Refresh rate in minutes:'),
            LEAVE_MESSAGES: gt('Leave messages on server'),
            DELETING_ON_LOCAL: gt('Deleting messages on local storage also deletes them on server'),
            TITLE_SERVER_OUT: gt('Outgoing Server Settings (SMTP)'),
            SERVER_OUT_SSL: gt('Use SSL connection'),
            SERVER_OUT_NAME: gt('Server Name:'),
            SERVER_OUT_PORT: gt('Server Port:'),
            LOGIN_AND_PASS: gt('Use Login and Password'),
            LOGIN_OUT: gt('Login'),
            PASSWORD_OUT: gt('Password'),
            TITLE_FOLDER_SETTINGS: gt('Folder Settings'),
            FOLDER_SEND: gt('Send folder'),
            FOLDER_TRASH: gt('Trash folder'),
            FOLDER_DRAFTS: gt('Drafts folder'),
            FOLDER_SPAM: gt('Spam folder'),
            SPAN_SELECT_FOLDER: gt('Select')
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

                //check if login and mailaddress are synced
                this.inSync = false;

                Backbone.Validation.bind(this, {selector: 'data-property', forceUpdate: true});//forceUpdate needed otherwise model is always valid even if inputfields contain wrong values
            },
            render: function () {
                var self = this;
                window.account = self.model; //FIXME: WTF?
                self.$el.empty().append(self.template({
                    strings: staticStrings,
                    optionsServer: optionsServerType,
                    optionsRefreshRate: optionsRefreshRatePop
                }));
                var pop3nodes = self.$el.find('.control-group.pop3');

                var defaultBindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
                self._modelBinder.bind(self.model, self.el, defaultBindings);
                //check if pop3 refresh rate needs to be displayed
                if (self.model.get('mail_protocol') !== 'pop3') {
                    pop3nodes.hide();
                }

                function syncLogin(model, value) {
                    model.set('login', value);
                }

                if (self.model.get('id') !== 0) {//check for primary account

                    //refreshrate field needs to be toggled
                    self.model.on('change:mail_protocol', function (model, value) {
                        if (value !== 'pop3') {
                            pop3nodes.hide();
                        } else {
                            pop3nodes.show();
                        }
                    });

                    //login for server should be email-address by default;
                    if (self.model.get('login') === undefined) {
                        self.model.set('login', self.model.get('primary_address'));
                    }

                    //if login and mailadress are the same change login if mailadress changes
                    if (self.model.get('primary_address') === self.model.get('login') && !self.inSync) {
                        self.model.on('change:primary_address', syncLogin);
                        self.inSync = true;
                    }

                    //react to loginchange
                    self.model.on('change:login', function (model, value) {
                        if (value === model.get('primary_address')) {
                            if (!self.inSync) {//no need to sync if its allready synced...would cause multiple events to be triggerd
                                self.model.on('change:primary_address', syncLogin);
                                self.inSync = true;
                            }
                        } else {
                            self.model.off('change:primary_address', syncLogin);
                            self.inSync = false;
                        }
                    });
                } else {//primary account does not allow editing besides display name and unified mail
                    self.$el.find('input, select').not('#personal, [data-property="unified_inbox_enabled"]').attr('disabled', 'disabled');
                    self.$el.find('button.btn.folderselect').hide();
                }

                return self;
            },
            events: {
                'save': 'onSave',
                'click .folderselect': 'onFolderSelect'
            },
            onSave: function () {
                var self = this;

                this.model.save()
                .done(function (data) {
                    self.dialog.close();
                    if (self.collection) {
                        self.collection.add([data]);
                    }
                    if (self.model.isNew()) {
                        self.succes();
                    }
                })
                .fail(function (data) {
                    if (data.code === "ACC-0004" && data.error_params[0].substring(8, 13) === 'login') {//string comparison is ugly, maybe backend has a translated version of this
                        notifications.yell('error', gt('Login must not be empty.'));
                    } else if (data.code === "SVL-0002") {
                        notifications.yell('error',
                                           //#. %1$s the missing request parameter
                                           //#, c-format
                                           gt("Please enter the following data: %1$s", _.noI18n(data.error_params[0])));
                    } else {
                        notifications.yell('error', _.noI18n(data.error));
                    }
                });
            },

            onFolderSelect: function (e) {
                var self = this;
                if (self.model.get('id') !== 0) {
                    var property = $(e.currentTarget).prev().attr('data-property'),
                        id = self.model.get(property),
                        accountName = self.model.get('name');
                    require(["io.ox/core/tk/dialogs", "io.ox/core/tk/folderviews"], function (dialogs, views) {

                        var label = gt('Select folder'),
                            dialog = new dialogs.ModalDialog({ easyOut: true })
                            .header($('<h3>').text(label))
                            .addPrimaryButton("select", label)
                            .addButton("cancel", gt("Cancel"));
                        dialog.getBody().css({ height: '250px' });
                        var tree = new views.FolderTree(dialog.getBody(), {
                                type: 'mail',
                                rootFolderId: 'default' + self.model.get('id')
                            });
                        dialog.show(function () {
                            tree.paint().done(function () {
                                tree.select(id);
                            });
                        })
                        .done(function (action) {
                            if (action === 'select') {
                                var target = _(tree.selection.get()).first();
                                self.model.set(property, target);
                            }
                            tree.destroy();
                            tree = dialog = null;
                        });
                    });
                }
            }
        });


    return AccountDetailView;
});
