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
    ['io.ox/core/notifications',
     'io.ox/core/api/account',
     'settings!io.ox/mail',
     'gettext!io.ox/settings/settings',
     'io.ox/core/extensions',
     'io.ox/backbone/mini-views'
    ], function (notifications, accountAPI, settings, gt, ext, mini) {

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
                pop3_refresh_rate: optionsRefreshRatePop[0].value,
                pop3_delete_write_through: false,
                pop3_expunge_on_quit: false
            }
        },

        oldModel,

        //customize mini views: suppress validate onChange (validated when user hits save)
        custom = {
            onChange: function () {
                this.model.set(this.name, this.$el.val(), { validate: false });
            }
        },
        InputView = mini.InputView.extend(custom),
        PasswordView = mini.PasswordView.extend(custom),

        validationCheck = function (data) {

            data = _.extend({
                unified_inbox_enabled: false,
                transport_credentials: false
            }, data);

            data.name = data.personal = data.primary_address;

            return accountAPI.validate(data);
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
                Backbone.Validation.bind(this, { selector: 'name', forceUpdate: true });
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

                var pop3nodes = self.$el.find('.form-group.pop3');

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
                    self.$el.find('input, select').not('#personal, [name="unified_inbox_enabled"]').prop('disabled', true);

                    self.$el.find('.variable_size').removeClass('col-sm-6').addClass('col-sm-8');

                    self.$el.find('button.btn.folderselect').hide();
                }
                //disable folderselect if no account is defined
                if (self.model.get('id') === undefined) {
                    self.$el.find('button.btn.folderselect').prop('disabled', true);
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
                    validationCheck(this.model.attributes).done(function (response, error) {
                        //an undefined response variable implies an error (f.e. category 'USER_INPUT')
                        var hasError = _.isUndefined(response) || (error ? [].concat(error.categories || []).indexOf('ERROR') > -1 : false),
                            hasWarning = error && error.warnings;

                        if (hasError) {
                            //on error yell
                            notifications.yell(error);
                            self.dialog.idle();
                        } else if (hasWarning) {
                            //on warning ask user
                            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                                var messages = _.map([].concat(error.warnings), function (warn) {
                                    return $('<div>')
                                            .addClass('alert alert-warning')
                                            .css('margin', '10px')
                                            .text(warn.error);
                                });

                                new dialogs.ModalDialog()
                                    .header(
                                        $('<h4>').text(gt('Warnings'))
                                    )
                                    .build(function () {
                                        this.getContentNode().append(messages);
                                    })
                                    .addPrimaryButton('proceed', gt('Ignore Warnings'))
                                    .addButton('cancel', gt('Cancel'))
                                    .show()
                                    .done(function (action) {
                                        if (action === 'proceed') {
                                            saveAccount();
                                        } else {
                                            self.dialog.idle();
                                        }
                                    });
                            });
                        } else {
                            //on success save
                            saveAccount();
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
                    var property = $(e.currentTarget).prev().attr('name'),
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
                                self.$el.find('input[name="' + property + '"]').val(target);
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

                serverSettingsIn = $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle').text(gt('Server settings')),
                    $('<div>').addClass('form-horizontal').append(
                        $('<div>').addClass('form-group').append(
                            $('<label>').attr({ 'for': 'mail_protocol' }).addClass('control-label col-sm-3').text(gt('Server type')),
                            $('<div>').addClass('col-sm-4').append(
                                new mini.SelectView({ list: optionsServerType, name: 'mail_protocol', model: model, id: 'mail_protocol', className: 'form-control'}).render().$el
                            )
                        ),
                        $('<div>').addClass('form-group').append(
                            $('<div>').addClass('col-sm-offset-3 col-sm-8').append(
                                $('<div>').addClass('checkbox').append(
                                    $('<label>').addClass('control-label').text(gt('Use SSL connection')).prepend(
                                        new mini.CheckboxView({ name: 'mail_secure', model: model }).render().$el
                                    )
                                )
                            )
                        ),
                        $('<div>').addClass('form-group').append(
                            $('<label>').attr({ 'for': 'mail_server' }).addClass('control-label col-sm-3').text(gt('Server name')),
                            $('<div>').addClass('col-sm-8').append(
                                new InputView({ name: 'mail_server', model: model, id: 'mail_server', className: 'form-control' }).render().$el
                            )
                        ),
                        $('<div>').addClass('form-group').append(
                            $('<label>').attr({ 'for': 'mail_port' }).addClass('control-label col-sm-3').text(gt('Server port')),
                            $('<div>').addClass('col-sm-8').append(
                                new InputView({ name: 'mail_port', model: model, id: 'mail_port', className: 'form-control' }).render().$el
                            )
                        ),
                        $('<div>').addClass('form-group').append(
                            $('<label>').attr({ 'for': 'login' }).addClass('control-label col-sm-3').text(gt('Username')),
                            $('<div>').addClass('col-sm-8').append(
                                new InputView({ name: 'login', model: model, id: 'login', className: 'form-control' }).render().$el
                            )
                        ),
                        $('<div>').addClass('form-group').append(
                            $('<label>').attr({ 'for': 'password' }).addClass('control-label col-sm-3').text(gt('Password')),
                            $('<div>').addClass('col-sm-8').append(
                                new PasswordView({ name: 'password', model: model, id: 'password', className: 'form-control' }).render().$el
                            )
                        ),
                        $('<div>').addClass('form-group pop3').append(
                            $('<label>').attr({ 'for': 'pop3_refresh_rate' }).addClass('control-label col-sm-3').text(gt('Refresh rate in minutes:')),
                            $('<div>').addClass('col-sm-4').append(
                                new mini.SelectView({ list: optionsRefreshRatePop, name: 'pop3_refresh_rate', model: model, id: 'pop3_refresh_rate', className: 'form-control' }).render().$el
                            )
                        ),
                        $('<div>').addClass('form-group pop3').append(
                            $('<div>').addClass('col-sm-offset-3 col-sm-8').append(
                                $('<div>').addClass('checkbox').append(
                                    $('<label>').addClass('control-label').text(gt('Remove copy from server after retrieving a message')).prepend(
                                        new mini.CheckboxView({ name: 'pop3_expunge_on_quit', model: model}).render().$el
                                    )
                                )
                            )
                        ),
                        $('<div>').addClass('form-group pop3').append(
                            $('<div>').addClass('col-sm-offset-3 col-sm-8').append(
                                $('<div>').addClass('checkbox').append(
                                    $('<label>').addClass('control-label').text(gt('Deleting messages on local storage also deletes them on server')).prepend(
                                        new mini.CheckboxView({ name: 'pop3_delete_write_through', model: model}).render().$el
                                    )
                                )
                            )
                        )
                    )
                ),

                serverSettingsOut = $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle').text(gt('Outgoing server settings (SMTP)')),
                    $('<div>').addClass('form-horizontal').append(
                        $('<div>').addClass('form-group').append(
                            $('<div>').addClass('col-sm-offset-3 col-sm-8').append(
                                $('<div>').addClass('checkbox').append(
                                    $('<label>').addClass('control-label').text(gt('Use SSL connection')).prepend(
                                        new mini.CheckboxView({ name: 'transport_secure', model: model}).render().$el
                                    )
                                )
                            )
                        ),

                        $('<div>').addClass('form-group').append(
                            $('<label>').attr({ 'for':  'transport_server'}).addClass('control-label col-sm-3').text(gt('Server name')),
                            $('<div>').addClass('col-sm-8').append(
                                new InputView({ name: 'transport_server', model: model, id: 'transport_server' }).render().$el
                            )
                        ),
                        $('<div>').addClass('form-group').append(
                            $('<label>').attr({ 'for':  'transport_port'}).addClass('control-label col-sm-3').text(gt('Server port')),
                            $('<div>').addClass('col-sm-8').append(
                                new InputView({ name: 'transport_port', model: model, id: 'transport_port', className: 'form-control' }).render().$el
                            )
                        ),
                        $('<div>').addClass('form-group').append(
                            $('<label>').attr({ 'for':  'transport_login'}).addClass('control-label col-sm-3').text(gt('Username')),
                            $('<div>').addClass('col-sm-8').append(
                                new InputView({ name: 'transport_login', model: model, id: 'transport_login' }).render().$el
                            )
                        ),
                        $('<div>').addClass('form-group').append(
                            $('<label>').attr({ 'for':  'transport_password'}).addClass('control-label col-sm-3').text(gt('Password')),
                            $('<div>').addClass('col-sm-8').append(
                                new PasswordView({ name: 'transport_password', model: model, id: 'transport_password' }).render().$el
                            )
                        )
                    )
                ),

                serverSettingsFolder = $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle').text(gt('Folder settings')),
                    $('<div>').addClass('form-horizontal').append(
                        $('<div>').addClass('form-group').append(
                            $('<label>').attr({ 'for':  'sent_fullname'}).addClass('control-label col-sm-3').text(gt('Sent folder')),
                            $('<div>').addClass('col-sm-6 variable_size').append(
                                new InputView({ name: 'sent_fullname', model: model, id: 'sent_fullname' }).render().$el.attr({ 'disabled': 'disabled' })
                            ),
                            $('<div>').addClass('col-sm-1').append(
                                $('<button>').attr({ 'type': 'button', 'tabindex': '1' }).addClass('btn folderselect').text(gt('Select'))
                            ),
                            $('<label>').attr({ 'for':  'trash_fullname'}).addClass('control-label col-sm-3').text(gt('Trash folder')),
                            $('<div>').addClass('col-sm-6 variable_size').append(
                                new InputView({ name: 'trash_fullname', model: model, id: 'trash_fullname' }).render().$el.attr({ 'disabled': 'disabled' })
                            ),
                            $('<div>').addClass('col-sm-1').append(
                                $('<button>').attr({ 'type': 'button', 'tabindex': '1' }).addClass('btn folderselect').text(gt('Select'))
                            ),
                            $('<label>').attr({ 'for':  'drafts_fullname'}).addClass('control-label col-sm-3').text(gt('Drafts folder')),
                            $('<div>').addClass('col-sm-6 variable_size').append(
                                new InputView({ name: 'drafts_fullname', model: model, id: 'drafts_fullname' }).render().$el.attr({ 'disabled': 'disabled' })
                            ),
                            $('<div>').addClass('col-sm-1').append(
                                $('<button>').attr({ 'type': 'button', 'tabindex': '1' }).addClass('btn folderselect').text(gt('Select'))
                            ),
                            $('<label>').attr({ 'for':  'spam_fullname'}).addClass('control-label col-sm-3').text(gt('Spam folder')),
                            $('<div>').addClass('col-sm-6 variable_size').append(
                                new InputView({ name: 'spam_fullname', model: model, id: 'spam_fullname' }).render().$el.attr({ 'disabled': 'disabled' })
                            ),
                            $('<div>').addClass('col-sm-1').append(
                                $('<button>').attr({ 'type': 'button', 'tabindex': '1' }).addClass('btn folderselect').text(gt('Select'))
                            )
                        )
                    )
                );

            if (!model.isHidden()) {
                formBlocks.push(serverSettingsIn, serverSettingsOut, serverSettingsFolder);
            }

            this.append(
                $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle').text(gt('Account settings')),
                    $('<div>').addClass('form-horizontal').append(
                        $('<div>').addClass('form-group').append(
                            $('<label>').attr({ 'for': 'name'}).addClass('control-label col-sm-3').text(gt('Account name')),
                            $('<div>').addClass('col-sm-8').append(
                                new InputView({ name: 'name', model: model, id: 'name', className: 'form-control' }).render().$el
                            )
                        ),
                        $('<div>').addClass('form-group').append(
                            $('<label>').attr({ 'for': 'personal'}).addClass('control-label col-sm-3').text(gt('Your name')),
                            $('<div>').addClass('col-sm-8').append(
                                new InputView({ name: 'personal', model: model, id: 'personal', className: 'form-control' }).render().$el
                            )
                        ),
                        $('<div>').addClass('form-group').append(
                            $('<label>').attr({ 'for': 'primary_address'}).addClass('control-label col-sm-3').text(gt('Email address')),
                            $('<div>').addClass('col-sm-8').append(
                                new InputView({ name: 'primary_address', model: model, id: 'primary_address', className: 'form-control' }).render().$el
                            )
                        ),
                        $('<div>').addClass('form-group').append(
                            $('<div>').addClass('col-sm-offset-3 col-sm-8').append(
                                $('<div>').addClass('checkbox').append(
                                    $('<label>').text(gt('Use unified mail for this account')).prepend(
                                        new mini.CheckboxView({ name: 'unified_inbox_enabled', model: model }).render().$el
                                    )
                                )
                            )
                        )
                    )
                ),
                formBlocks
            );
        }
    });

    return accountAPI.getDefaultDisplayName().then(function (name) {
        defaultDisplayName = name;
        return AccountDetailView;
    });
});
