/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/mailfilter/settings/filter/view-form',
    ['io.ox/core/tk/view',
     'io.ox/core/notifications',
     'gettext!io.ox/settings/settings',
     'io.ox/core/extensions',
     'io.ox/backbone/forms',
     'io.ox/backbone/views',
     'apps/io.ox/core/tk/jquery-ui.min.js'
    ], function (View, notifications, gt, ext, forms, views) {

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

        POINT = 'io.ox/mailfilter/settings/filter/detail',

        optionsServerType = _(['imap', 'pop3']).map(gt.noI18n),

        optionsRefreshRatePop = _([3, 5, 10, 15, 30, 60, 360]).map(gt.noI18n),

        AccountDetailView = Backbone.View.extend({
            tagName: "div",
            _modelBinder: undefined,
            initialize: function (options) {

                //check if login and mailaddress are synced
                this.inSync = false;

                Backbone.Validation.bind(this, {selector: 'data-property', forceUpdate: true});//forceUpdate needed otherwise model is always valid even if inputfields contain wrong values
            },
            render: function () {

                var baton = ext.Baton({ model: this.model, view: this });
                ext.point(POINT + '/view').invoke('draw', this.$el.empty(), baton);
                return this;

            },
            events: {
                'save': 'onSave',
                'click .folderselect': 'onFolderSelect'
            },
            onSave: function () {
                console.log('der SAVE');
//                var self = this;
//
//                if (!self.model.isNew()) {
//                    // updating account, since we save on close of the dialog,
//                    // dialog is already gone, tell the user that something is happening
//                    notifications.yell('info', gt('Updating account data. This might take a few seconds.'));
//                }
//                this.model.save()
//                .done(function (data) {
//                    self.dialog.close();
//                    if (self.collection) {
//                        self.collection.add([data]);
//                    }
//                    if (self.model.isNew()) {
//                        self.succes();
//                    } else {
//                        notifications.yell('success', gt('Account updated'));
//                    }
//                })
//                .fail(function (data) {
//                    if (data.code === "ACC-0004" && data.error_params[0].substring(8, 13) === 'login') {//string comparison is ugly, maybe backend has a translated version of this
//                        notifications.yell('error', gt('Login must not be empty.'));
//                    } else if (data.code === "SVL-0002") {
//                        notifications.yell('error',
//                                           //#. %1$s the missing request parameter
//                                           //#, c-format
//                                           gt("Please enter the following data: %1$s", _.noI18n(data.error_params[0])));
//                    } else {
//                        notifications.yell('error', _.noI18n(data.error));
//                    }
//                });
            },

            onFolderSelect: function (e) {
//                var self = this;
//                if (self.model.get('id') !== 0) {
//                    var property = $(e.currentTarget).prev().attr('data-property'),
//                        id = self.model.get(property),
//                        accountName = self.model.get('name');
//                    require(["io.ox/core/tk/dialogs", "io.ox/core/tk/folderviews"], function (dialogs, views) {
//
//                        var label = gt('Select folder'),
//                            dialog = new dialogs.ModalDialog({ easyOut: true })
//                            .header($('<h4>').text(label))
//                            .addPrimaryButton("select", label)
//                            .addButton("cancel", gt("Cancel"));
//                        dialog.getBody().css({ height: '250px' });
//                        var tree = new views.FolderTree(dialog.getBody(), {
//                                type: 'mail',
//                                rootFolderId: 'default' + self.model.get('id')
//                            });
//                        dialog.show(function () {
//                            tree.paint().done(function () {
//                                tree.select(id);
//                            });
//                        })
//                        .done(function (action) {
//                            if (action === 'select') {
//                                var target = _(tree.selection.get()).first();
//                                self.model.set(property, target);
//                            }
//                            tree.destroy().done(function () {
//                                tree = dialog = null;
//                            });
//                        });
//                    });
//                }
            }
        });

    ext.point(POINT + '/view').extend({
        index: 150,
        id: 'tests',
        draw: function (baton) {

            console.log(baton);

            var listTests = $('<ol class="widget-list">').text('tests'),
                listActions = $('<ol class="widget-list">').text('actions');

            var appliedTest = baton.model.get('test').tests;

            _(appliedTest).each(function (test) {
                listTests.append($('<li>').text(test.id));
            });

            _(baton.model.get('actioncmds')).each(function (action) {
                listActions.append($('<li>').text(action.id));
            });

            this.append(listTests, listActions);

            listTests.sortable({
                containment: this,
                axis: 'y',
                scroll: true,
                delay: 150,
                stop: function (e, ui) {
//                    widgets.save(list);
                }
            });

            listActions.sortable({
                containment: this,
                axis: 'y',
                scroll: true,
                delay: 150,
                stop: function (e, ui) {
//                    widgets.save(list);
                }
            });
        }
    });

    views.point(POINT + '/view').extend(new forms.ControlGroup({
        id: 'rulename',
        index: 100,
        fluid: true,
        label: 'rulename',
        control: '<input type="text" class="span7" name="rulename">',
        attribute: 'rulename'
    }));

    views.point(POINT + '/view').extend(new forms.CheckBoxField({
        id: 'active',
        index: 350,
        label: 'active',
        attribute: 'active',
        customizeNode: function () {
            this.$el.css({
                width: '300px'
            });
        }
    }));


    return AccountDetailView;
});
