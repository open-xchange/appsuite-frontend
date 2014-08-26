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
     'io.ox/backbone/mini-views',
     'io.ox/core/folder/picker'
    ], function (notifications, accountAPI, settings, gt, ext, mini, picker) {

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

        portDefaults = {
            mail_port: '143',
            transport_port: '587'
        },

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

            data = _.extend({ unified_inbox_enabled: false /*, transport_auth: true */ }, data);
            data.name = data.personal = data.primary_address;
            return accountAPI.validate(data);
        },

        returnPortMail = function () {
            var secure = model.get('mail_secure'),
                protocol = model.get('mail_protocol') || 'imap';

            if (protocol === 'imap') {
                return secure ? '993' : '143';
            } else {
                return secure ? '995' : '110';
            }
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

                var pop3nodes = self.$el.find('.form-group.pop3'),
                    dropdown = self.$el.find('#mail_protocol');

                //check if pop3 refresh rate needs to be displayed
                if (self.model.get('mail_protocol') !== 'pop3') {
                    pop3nodes.hide();
                }

                if (self.model.get('id')) {
                    dropdown.prop('disabled', true);
                }

                //setting port defefaults
                if (self.model.get('id') === undefined) {
                    _.each(portDefaults, function (value, key) {
                        model.set(key, value);
                    });
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
                'click .folderselect': 'onFolderSelect',
                'change [name="mail_protocol"]': 'onMailProtocolChange',
                'change [name="mail_secure"]': 'onMailSecureChange',
                'change [name="transport_secure"]': 'onTransportSecureChange'
            },

            onMailProtocolChange: function () {
                if (this.model.id) return;
                model.set('mail_port', returnPortMail());
            },

            onMailSecureChange: function () {
                if (this.model.id) return;
                model.set('mail_port', returnPortMail());
            },

            onTransportSecureChange: function () {
                if (this.model.id) return;
                var value = this.model.get('transport_secure') ? '465' : '587';
                this.model.set('transport_port', value);
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

                if (this.model.get('id') === 0) return;

                this.dialog.getPopup().hide();

                var accountId = 'default' + this.model.get('id'),
                    property = $(e.target).attr('data-property'),
                    id = this.model.get(property),
                    self = this;

                picker({
                    context: 'account',
                    done: function (target) {
                        self.model.set(property, target, { validate: true });
                        self.$el.find('input[name="' + property + '"]').val(target);
                    },
                    close: function () {
                        self.dialog.getPopup().show();
                    },
                    folder: id,
                    module: 'mail',
                    root: accountId,
                    tr: { 'default0/INBOX': 'virtual/default0' }
                });
            }
        });

    // utility functions
    function group() {
        var args = _(arguments).toArray();
        return $('<div class="form-group">').append(args);
    }

    function label(id, text) {
        return $('<label class="control-label col-sm-3">').attr('for', id).text(text);
    }

    function div() {
        var args = _(arguments).toArray();
        return $('<div class="col-sm-8">').append(args);
    }

    function checkbox(text) {
        var args = _(arguments).toArray();
        return $('<div class="col-sm-offset-3 col-sm-8">').append(
            $('<div class="checkbox">').append(
                $('<label class="control-label">').text(text).prepend(args.slice(1))
            )
        );
    }

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'header',
        draw: function () {

            var formBlocks = [],

                //
                // Incoming (IMAP/POP3)
                //
                serverSettingsIn = $('<fieldset>').append(
                    $('<legend class="sectiontitle">').text(gt('Server settings')),
                    $('<form class="form-horizontal" role="form">').append(
                        // server type
                        group(
                            label('mail_protocol', gt('Server type')),
                            $('<div class="col-sm-4">').append(
                                new mini.SelectView({ list: optionsServerType, model: model, id: 'mail_protocol' }).render().$el
                            )
                        ),
                        // ssl connection
                        group(
                            checkbox(
                                gt('Use SSL connection'),
                                new mini.CheckboxView({ name: 'mail_secure', model: model }).render().$el
                            )
                        ),
                        // mail_server
                        group(
                            label('mail_server', gt('Server name')),
                            div(
                                new InputView({ model: model, id: 'mail_server' }).render().$el
                            )
                        ),
                        // mail_port
                        group(
                            label('mail_port', gt('Server port')),
                            div(
                                new InputView({ model: model, id: 'mail_port' }).render().$el
                            )
                        ),
                        // login
                        group(
                            label('login', gt('Username')),
                            div(
                                new InputView({ model: model, id: 'login' }).render().$el
                            )
                        ),
                        // password
                        group(
                            label('password', gt('Password')),
                            div(
                                new PasswordView({ model: model, id: 'password' }).render().$el
                            )
                        ),
                        // refresh rate (pop3 only)
                        group(
                            label('pop3_refresh_rate', gt('Refresh rate in minutes')),
                            div(
                                new mini.SelectView({ list: optionsRefreshRatePop, model: model, id: 'pop3_refresh_rate' }).render().$el
                            )
                        )
                        .addClass('pop3'),
                        // expunge (pop3 only)
                        group(
                            checkbox(
                                gt('Remove copy from server after retrieving a message'),
                                new mini.CheckboxView({ name: 'pop3_expunge_on_quit', model: model }).render().$el
                            )
                        )
                        .addClass('pop3'),
                        // delete write-through (pop3)
                        group(
                            checkbox(
                                gt('Deleting messages on local storage also deletes them on server'),
                                new mini.CheckboxView({ name: 'pop3_delete_write_through', model: model }).render().$el
                            )
                        )
                        .addClass('pop3')
                    )
                ),

                serverSettingsOut = $('<fieldset>').append(
                    $('<legend class="sectiontitle">').text(gt('Outgoing server settings (SMTP)')),
                    $('<form class="form-horizontal" role="form">').append(
                        // secure
                        group(
                            checkbox(
                                gt('Use SSL connection'),
                                new mini.CheckboxView({ name: 'transport_secure', model: model}).render().$el
                            )
                        ),
                        // server
                        group(
                            label('transport_server', gt('Server name')),
                            div(
                                new InputView({ model: model, id: 'transport_server' }).render().$el
                            )
                        ),
                        // port
                        group(
                            label('transport_port', gt('Server port')),
                            div(
                                new InputView({ model: model, id: 'transport_port' }).render().$el
                            )
                        ),
                        // login
                        group(
                            label('transport_login', gt('Username')),
                            div(
                                new InputView({ model: model, id: 'transport_login' }).render().$el
                            )
                        ),
                        // password
                        group(
                            label('transport_password', gt('Password')),
                            div(
                                new PasswordView({ model: model, id: 'transport_password' }).render().$el
                            )
                        )
                    )
                ),

                folderLabels = { sent: gt('Sent folder'), trash: gt('Trash folder'), drafts: gt('Drafts folder'), spam: gt('Spam folder') },

                serverSettingsFolder = $('<fieldset>').append(
                    $('<legend class="sectiontitle">').text(gt('Folder settings')),
                    $('<form class="form-horizontal" role="form">').append(
                        // add four input fields
                        _('sent trash drafts spam'.split(' ')).map(function (id) {

                            var label = folderLabels[id];
                            id = id + '_fullname';

                            return $('<div class="form-group">').append(
                                $('<label class="control-label col-sm-3">').attr({ 'for': id }).text(label),
                                $('<div class="col-sm-6 variable_size">').append(
                                    new InputView({ name: id, model: model, id: id }).render().$el.prop('disabled', true)
                                ),
                                $('<div class="col-sm-1">').append(
                                    $('<button type="button" class="btn btn-default folderselect" tabindex="1">')
                                    .attr('data-property', id).text(gt('Select'))
                                )
                            );
                        })
                    )
                );

            if (!model.isHidden()) {
                formBlocks.push(serverSettingsIn, serverSettingsOut);
            }

            // don't show folder settings if this is a new account
            if (model.get('id') !== undefined) {
                formBlocks.push(serverSettingsFolder);
            }

            this.append(
                $('<fieldset>').append(
                    $('<legend class="sectiontitle">').text(gt('Account settings')),
                    $('<form class="form-horizontal" role="form">').append(
                        // account name
                        group(
                            label('name', gt('Account name')),
                            div(
                                new InputView({ model: model, id: 'name' }).render().$el
                            )
                        ),
                        // personal
                        group(
                            label('personal', gt('Your name')),
                            div(
                                new InputView({ model: model, id: 'personal' }).render().$el
                            )
                        ),
                        // primary address
                        group(
                            label('primary_address', gt('Email address')),
                            div(
                                new InputView({ model: model, id: 'primary_address' }).render().$el
                            )
                        ),
                        // unified inbox
                        group(
                            checkbox(
                                gt('Use unified mail for this account'),
                                new mini.CheckboxView({ name: 'unified_inbox_enabled', model: model }).render().$el
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
