/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define.async('io.ox/mail/accounts/view-form',
    ['io.ox/core/tk/view',
     'io.ox/core/notifications',
     'io.ox/core/api/account',
     'settings!io.ox/mail',
     'gettext!io.ox/settings/settings',
     'io.ox/core/extensions'
    ], function (View, notifications, accountAPI, settings, gt, ext) {

    'use strict';

    var POINT = 'io.ox/settings/accounts/mail/settings/detail',
        model,

        optionsServerType = [
            { label: gt.noI18n('imap'), value: 'imap'},
            { label: gt.noI18n('pop3'), value: 'pop3'}
        ],

        optionsRefreshRatePop = [
            { label: gt.noI18n('3'), value: '3'},
            { label: gt.noI18n('5'), value: '5'},
            { label: gt.noI18n('10'), value: '10'},
            { label: gt.noI18n('15'), value: '15'},
            { label: gt.noI18n('30'), value: '30'},
            { label: gt.noI18n('60'), value: '60'},
            { label: gt.noI18n('360'), value: '360'}
        ],

        //conditional defaults
        defaults = {
            pop3: {
                pop3_refresh_rate: optionsRefreshRatePop[0],
                pop3_delete_write_through: false,
                pop3_expunge_on_quit: false
            }
        },

        oldModel,

        validationCheck = function (data) {

            data = _.extend({
                unified_inbox_enabled: false,
                transport_credentials: false
            }, data);

            data.name = data.personal = data.primary_address;

            return accountAPI.validate(data);
        },

        buildInputText = function (name) {
            var input = $('<input type="text">').attr({ 'id': name, 'tabindex': 1, 'data-property': name })
            .on('change', function () {
                model.set(name, input.val());
            });
            input.val(model.get(name));
            return input;
        },

        buildCheckbox = function (name) {
            var checkbox = $('<input>').attr({  'data-property': name, 'type': 'checkbox', 'tabindex': 1 })
            .on('change', function () {
                model.set(name, checkbox.prop('checked'));
            }).addClass('input-xlarge');
            checkbox.prop('checked', model.get(name));
            return checkbox;
        },

        buildOptionsSelect = function (list, name, id) {
            var select = $('<select>').attr({ 'id': id, 'tabindex': 1 }).on('change', function () {
                model.set(name, this.value);
            });
            _.map(list, function (option) {
                var o = $('<option>').attr({ value: option.value}).text(option.label);
                return select.append(o);
            });
            select.val(model.get(name));
            return select;
        },

        defaultDisplayName = '',

        AccountDetailView = Backbone.View.extend({
            tagName: 'div',
            initialize: function () {

                //check if login and mailaddress are synced
                this.inSync = false;

                // use mail display name?
                var personal = this.model.get('personal');
                if (!personal) {
                    this.model.set('personal', defaultDisplayName);
                } else if (personal === ' ') {
                    this.model.set('personal', '');
                }

                oldModel = _.copy(this.model.attributes, true);
                // forceUpdate needed otherwise model is always valid even if inputfields contain wrong values
                Backbone.Validation.bind(this, { selector: 'data-property', forceUpdate: true });
            },
            render: function () {
                var self = this;                    // hideAccountDetails = self.model.isHidden();
                model = self.model;
                self.$el.empty().append(
                    $('<div>').addClass('settings-detail-pane').append(
                        $('<div>').addClass('io-ox-account-settings')
                    )
                );

                ext.point(POINT + '/pane').invoke('draw', self.$el.find('.io-ox-account-settings'));

                var pop3nodes = self.$el.find('.control-group.pop3');

                //check if pop3 refresh rate needs to be displayed
                if (self.model.get('mail_protocol') !== 'pop3') {
                    pop3nodes.hide();
                }

                function syncLogin(model, value) {
                    model.set('login', value, {validate: true});
                }

                if (self.model.get('id') !== 0) {//check for primary account

                    //refreshrate field needs to be toggled
                    self.model.on('change:mail_protocol', function (model, value) {
                        if (value !== 'pop3') {
                            pop3nodes.hide();
                        } else {
                            //conditional defaults
                            _.each(defaults.pop3, function (value, key) {
                                if (!model.has(key))
                                    model.set(key, value);
                            });
                            pop3nodes.show();
                        }
                    });

                    //login for server should be email-address by default;
                    if (self.model.get('login') === undefined && self.model.get('primary_address') !== '') {
                        self.model.set('login', self.model.get('primary_address'), {validate: true});
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
                    self.$el.find('input, select').not('#personal, [data-property="unified_inbox_enabled"]').prop('disabled', true);
                    self.$el.find('button.btn.folderselect').hide();
                }
                //disable folderselect if no account is defined
                if (self.model.get('id') === undefined) {
                    self.$el.find('button.btn.folderselect').hide();
                }

                return self;
            },
            events: {
                'save': 'onSave',
                'click .folderselect': 'onFolderSelect'
            },

            onSave: function () {
                var self = this,
                    list = ['name', 'personal', 'unified_inbox_enabled'],
                    differences = returnDifferences(this.model.attributes, oldModel);

                function returnDifferences(a, b) {
                    var array = [];
                    _.each(a, function (single, key) {
                        if (b[key] !== single) {
                            array.push(key);
                        }
                    });
                    return array;
                }

                function needToValidate(list, differences) {
                    var result = false;
                    _.each(differences, function (value) {
                        if (_.indexOf(list, value) === -1) {
                            result = true;
                        }
                    });
                    return result;
                }

                function saveAccount() {
                    if (!self.model.isNew()) {
                        // updating account, since we save on close of the dialog,
                        // dialog is already gone, tell the user that something is happening
                        notifications.yell('busy', gt('Updating account data. This might take a few seconds.'));
                    }

                    // revert default display name
                    var personal = self.model.get('personal');
                    if (personal === defaultDisplayName) {
                        self.model.set('personal', null, { silent: true }); // empty!
                    } else if ($.trim(personal) === '') {
                        self.model.set('personal', ' ', { silent: true }); // yep, one space!
                    }

                    self.model.save().then(
                        function success(data) {
                            self.dialog.close();
                            if (self.collection) {
                                self.collection.add([data]);
                            }
                            if (self.model.isNew()) {
                                self.success();
                            } else {
                                notifications.yell('success', gt('Account updated'));
                            }
                        },
                        function fail(data) {
                            if (data.code === 'ACC-0004' && data.error_params[0].substring(8, 13) === 'login') {//string comparison is ugly, maybe backend has a translated version of this
                                notifications.yell('error', gt('Username must not be empty.'));
                            } else if (data.code === 'SVL-0002') {
                                notifications.yell('error',
                                   //#. %1$s the missing request parameter
                                   //#, c-format
                                   gt('Please enter the following data: %1$s', _.noI18n(data.error_params[0])));
                            } else {
                                notifications.yell('error', _.noI18n(data.error));
                            }
                            self.dialog.idle();
                        }
                    );
                }

                if (needToValidate(list, differences)) {
                    validationCheck(this.model.attributes).done(function (response, warnings) {
                        if (response) {
                            saveAccount();
                        } else {
                            if (warnings && warnings.error) {
                                notifications.yell('error', _.noI18n(warnings.error));
                            } else {
                                notifications.yell('error', gt('This account cannot be validated'));
                            }
                            self.dialog.idle();
                        }
                    });
                } else {
                    saveAccount();
                }

            },

            onFolderSelect: function (e) {

                var self = this;
                self.dialog.getPopup().hide();

                if (self.model.get('id') !== 0) {
                    var property = $(e.currentTarget).prev().attr('data-property'),
                        id = self.model.get(property);
                    require(['io.ox/core/tk/dialogs', 'io.ox/core/tk/folderviews'], function (dialogs, views) {

                        var label = gt('Select folder'),
                            dialog = new dialogs.ModalDialog()
                            .header($('<h4>').text(label))
                            .addPrimaryButton('select', label, 'select', {'tabIndex': '1'})
                            .addButton('cancel', gt('Cancel'), 'cancel', {'tabIndex': '1'});
                        dialog.getBody().css({ height: '250px' });
                        var tree = new views.FolderTree(dialog.getBody(), {
                                type: 'mail',
                                tabindex: 1,
                                rootFolderId: 'default' + self.model.get('id')
                            });
                        dialog.show(function () {
                            tree.paint().done(function () {
                                tree.select(id).done(function () {
                                    tree.selection.updateIndex();
                                    dialog.getBody().focus();
                                });
                            });
                        })
                        .done(function (action) {
                            if (action === 'select') {
                                var target = _(tree.selection.get()).first();
                                self.model.set(property, target, {validate: true});
                                self.$el.find('input[data-property="' + property + '"]').val(target);
                            }
                            tree.destroy().done(function () {
                                tree = dialog = null;
                            });
                            self.dialog.getPopup().show();
                        });
                    });
                }
            }
        });

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'header',
        draw: function () {

            var formBlocks = [],

                serverSettingsInTitle = $('<legend>').addClass('sectiontitle').text(gt('Server settings')),
                serverSettingsInBlock = $('<div>').addClass('form-horizontal').append(
                    $('<div>').addClass('control-group').append(
                        $('<label>').attr({ 'for': 'mail_protocol' }).addClass('control-label').text(gt('Server type')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('select').append(
                                buildOptionsSelect(optionsServerType, 'mail_protocol', 'mail_protocol')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group').append(
                        $('<label>').addClass('control-label'),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('checkbox').text(gt('Use SSL connection')).append(
                                buildCheckbox('mail_secure')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group').append(
                        $('<label>').attr({ 'for': 'mail_server' }).addClass('control-label').text(gt('Server name')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('text').append(
                                buildInputText('mail_server')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group').append(
                        $('<label>').attr({ 'for': 'mail_port' }).addClass('control-label').text(gt('Server port')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('text').append(
                                buildInputText('mail_port')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group').append(
                        $('<label>').attr({ 'for': 'login' }).addClass('control-label').text(gt('Username')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('text').append(
                                buildInputText('login')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group').append(
                        $('<label>').attr({ 'for': 'password' }).addClass('control-label').text(gt('Password')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('text').append(
                                buildInputText('password')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group pop3').append(
                        $('<label>').attr({ 'for': 'pop3_refresh_rate' }).text(gt('Refresh rate in minutes:')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('select').append(
                                buildOptionsSelect(optionsRefreshRatePop, 'pop3_refresh_rate', 'pop3_refresh_rate')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group pop3').append(
                        $('<label>').addClass('control-label'),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('checkbox').text(gt('Remove copy from server after retrieving a message')).append(
                                buildCheckbox('pop3_expunge_on_quit')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group pop3').append(
                        $('<label>').addClass('control-label'),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('checkbox').text(gt('Deleting messages on local storage also deletes them on server')).append(
                                buildCheckbox('pop3_delete_write_through')
                            )
                        )
                    )
                ),

                serverSettingsOutTitle = $('<legend>').addClass('sectiontitle').text(gt('Outgoing server settings (SMTP)')),

                serverSettingsOutBlock = $('<div>').addClass('form-horizontal').append(
                    $('<div>').addClass('control-group').append(
                        $('<label>').addClass('control-label'),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('checkbox').text(gt('Use SSL connection')).append(
                                buildCheckbox('transport_secure')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group').append(
                        $('<label>').attr({ 'for':  'transport_server'}).addClass('control-label').text(gt('Server name')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('text').append(
                                buildInputText('transport_server')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group').append(
                        $('<label>').attr({ 'for':  'transport_port'}).addClass('control-label').text(gt('Server port')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('text').append(
                                buildInputText('transport_port')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group').append(
                        $('<label>').addClass('control-label'),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('checkbox').text(gt('Use username and password')).append(
                                buildCheckbox('mail-common-selectfirst')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group').append(
                        $('<label>').attr({ 'for':  'transport_login'}).addClass('control-label').text(gt('Username')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('text').append(
                                buildInputText('transport_login')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group').append(
                        $('<label>').attr({ 'for':  'transport_password'}).addClass('control-label').text(gt('Password')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('text').append(
                                buildInputText('transport_password')
                            )
                        )
                    )
                ),
                serverSettingsFolderTitle = $('<legend>').addClass('sectiontitle').text(gt('Folder settings')),
                serverSettingsFolderBlock = $('<div>').addClass('form-horizontal').append(
                    $('<div>').addClass('control-group').append(
                        $('<label>').attr({ 'for':  'sent_fullname'}).addClass('control-label').text(gt('Sent folder')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('text').append(
                                buildInputText('sent_fullname').attr({ 'disabled': 'disabled' }),
                                $('<button>').attr({ 'type': 'button', 'tabindex': '1' }).addClass('btn folderselect').text(gt('Select'))
                            )
                        ),
                        $('<label>').attr({ 'for':  'trash_fullname'}).addClass('control-label').text(gt('Trash folder')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('text').append(
                                buildInputText('trash_fullname').attr({ 'disabled': 'disabled' }),
                                $('<button>').attr({ 'type': 'button', 'tabindex': '1' }).addClass('btn folderselect').text(gt('Select'))
                            )
                        ),
                        $('<label>').attr({ 'for':  'drafts_fullname'}).addClass('control-label').text(gt('Drafts folder')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('text').append(
                                buildInputText('drafts_fullname').attr({ 'disabled': 'disabled' }),
                                $('<button>').attr({ 'type': 'button', 'tabindex': '1' }).addClass('btn folderselect').text(gt('Select'))
                            )
                        ),
                        $('<label>').attr({ 'for':  'spam_fullname'}).addClass('control-label').text(gt('Spam folder')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('text').append(
                                buildInputText('spam_fullname').attr({ 'disabled': 'disabled' }),
                                $('<button>').attr({ 'type': 'button', 'tabindex': '1' }).addClass('btn folderselect').text(gt('Select'))
                            )
                        )
                    )
                );

            if (!model.isHidden()) {
                formBlocks.push(serverSettingsInTitle, serverSettingsInBlock, serverSettingsOutTitle, serverSettingsOutBlock, serverSettingsFolderTitle, serverSettingsFolderBlock);
            }

            this.append(
                $('<legend>').addClass('sectiontitle').text(gt('Account settings')),
                $('<div>').addClass('form-horizontal').append(
                    $('<div>').addClass('control-group').append(
                        $('<label>').attr({ 'for': 'name'}).addClass('control-label').text(gt('Account name')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('text').append(
                                buildInputText('name')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group').append(
                        $('<label>').attr({ 'for': 'personal'}).addClass('control-label').text(gt('Your name')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('text').append(
                                buildInputText('personal')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group').append(
                        $('<label>').attr({ 'for': 'primary_address'}).addClass('control-label').text(gt('Email address')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('text').append(
                                buildInputText('primary_address')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group').append(
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('checkbox').text(gt('Use unified mail for this account')).append(
                                buildCheckbox('unified_inbox_enabled')
                            )
                        )
                    ),
                    formBlocks

                )

            );
        }
    });

    return accountAPI.getDefaultDisplayName().then(function (name) {
        defaultDisplayName = name;
        return AccountDetailView;
    });
});
