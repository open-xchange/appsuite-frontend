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

define.async('io.ox/mail/accounts/view-form', [
    'io.ox/core/notifications',
    'io.ox/core/api/account',
    'settings!io.ox/mail',
    'gettext!io.ox/settings',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/core/folder/picker',
    'io.ox/core/capabilities'
], function (notifications, accountAPI, settings, gt, ext, mini, picker, capabilities) {

    'use strict';

    var POINT = 'io.ox/settings/accounts/mail/settings/detail',
        model,

        optionsServerType = [
            { label: gt.noI18n('IMAP'), value: 'imap' },
            { label: gt.noI18n('POP3'), value: 'pop3' }
        ],

        serverTypePorts = {
            'imap': { common: '143', secure: '993' },
            'pop3': { common: '110', secure: '995' }
        },

        optionsRefreshRatePop = [
            { label: gt.noI18n('3'), value: '3' },
            { label: gt.noI18n('5'), value: '5' },
            { label: gt.noI18n('10'), value: '10' },
            { label: gt.noI18n('15'), value: '15' },
            { label: gt.noI18n('30'), value: '30' },
            { label: gt.noI18n('60'), value: '60' },
            { label: gt.noI18n('360'), value: '360' }
        ],

        optionsAuthType = [
            //#. Auth type. Short for "Use same credentials as incoming mail server"
            { value: 'mail', label: gt('As incoming mail server') },
            //#. Auth type. Use separate username and password
            { value: 'custom', label: gt('Use separate username and password') },
            //#. Auth type. None. No authentication
            { value: 'none', label: gt('None') }
        ],

        // already for 7.8.0
        // optionsConnectionSecurity = [
        //     //#. Connection security. None.
        //     { value: 'none',     label: gt('None') },
        //     //#. Connection security. StartTLS.
        //     { value: 'starttls', label: gt('StartTLS') },
        //     //#. Connection security. SSL/TLS.
        //     { value: 'ssl',      label: gt('SSL/TLS') },
        // ],

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

        originalModel,

        //customize mini views: suppress validate onChange (validated when user hits save)
        custom = {
            onChange: function () {
                this.model.set(this.name, this.$el.val(), { validate: false });
            }
        },
        InputView = mini.InputView.extend(custom),
        PasswordView = mini.PasswordView.extend(custom),

        returnPortMail = function () {

            var secure = model.get('mail_secure'),
                protocol = model.get('mail_protocol') || 'imap';
            return serverTypePorts[protocol][secure ? 'secure' : 'common'];
        },

        defaultDisplayName = '',

        AccountDetailView = Backbone.View.extend({
            tagName: 'div',
            initialize: function () {
                //if the server has no pop3 support and this account is a new one, remove the pop3 option from the selection box
                //we leave it in with existing accounts to display them correctly even if they have pop3 protocol (we deny protocol changing when editing accounts anyway)
                if (!capabilities.has('pop3') && !this.model.get('id')) {
                    optionsServerType = [ { label: gt.noI18n('IMAP'), value: 'imap' } ];
                }

                //check if login and mailaddress are synced
                this.inSync = false;

                // use mail display name?
                var personal = this.model.get('personal');
                if (!personal) {
                    this.model.set('personal', defaultDisplayName);
                } else if (personal === ' ') {
                    this.model.set('personal', '');
                }

                // store original model to determine changes
                originalModel = _.copy(this.model.toJSON(), true);

                // forceUpdate needed otherwise model is always valid even if inputfields contain wrong values
                Backbone.Validation.bind(this, { selector: 'name', forceUpdate: true });
            },
            render: function () {
                var self = this;
                model = self.model;
                self.$el.empty().append(
                    $('<div>').addClass('settings-detail-pane').append(
                        $('<div>').addClass('io-ox-account-settings')
                    )
                );

                ext.point(POINT + '/pane').invoke('draw', self.$el.find('.io-ox-account-settings'), this);

                var pop3nodes = self.$el.find('.form-group.pop3'),
                    dropdown = self.$el.find('#mail_protocol');

                //check if pop3 refresh rate needs to be displayed
                if (self.model.get('mail_protocol') !== 'pop3') {
                    pop3nodes.hide();
                }

                //no need to edit it with only one option or when editing an account(causes server errors)
                if (self.model.get('id') || !capabilities.has('pop3')) {
                    dropdown.prop('disabled', true);
                }

                // setting port defaults
                if (self.model.get('id') === undefined) {
                    _.each(portDefaults, function (value, key) {
                        model.set(key, value);
                    });
                }

                function syncLogin(model, value) {
                    model.set('login', value, { validate: true });
                }

                //check for primary account
                if (self.model.get('id') !== 0) {

                    //refreshrate field needs to be toggled
                    self.model.on('change:mail_protocol', function (model, value) {
                        if (value !== 'pop3') {
                            pop3nodes.hide();
                        } else {
                            //conditional defaults
                            _.each(defaults.pop3, function (value, key) {
                                if (!model.has(key)) {
                                    model.set(key, value);
                                }
                            });
                            pop3nodes.show();
                        }
                    });

                    //login for server should be email-address by default;
                    if (self.model.get('login') === undefined && self.model.get('primary_address') !== '') {
                        self.model.set('login', self.model.get('primary_address'), { validate: true });
                    }

                    //if login and mailadress are the same change login if mailadress changes
                    if (self.model.get('primary_address') === self.model.get('login') && !self.inSync) {
                        self.model.on('change:primary_address', syncLogin);
                        self.inSync = true;
                    }

                    //react to loginchange
                    self.model.on('change:login', function (model, value) {
                        if (value === model.get('primary_address')) {
                            //no need to sync if its allready synced...would cause multiple events to be triggerd
                            if (!self.inSync) {
                                self.model.on('change:primary_address', syncLogin);
                                self.inSync = true;
                            }
                        } else {
                            self.model.off('change:primary_address', syncLogin);
                            self.inSync = false;
                        }
                    });
                } else {

                    //primary account does not allow editing besides display name and unified mail
                    self.$el.find('input, select').not('#personal, [name="unified_inbox_enabled"]').prop('disabled', true);
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
                model.set('mail_port', returnPortMail());
            },

            onMailSecureChange: function () {
                model.set('mail_port', returnPortMail());
            },

            onTransportSecureChange: function () {
                var value = this.model.get('transport_secure') ? '465' : '587';
                this.model.set('transport_port', value);
            },

            onSave: function () {

                var self = this,
                    list = ['name', 'personal', 'unified_inbox_enabled', 'password', 'transport_password'],
                    differences = returnDifferences(this.model.attributes, originalModel);

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
                    if (!capabilities.has('multiple_mail_accounts')) return false;
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
                        // empty!
                        self.model.set('personal', null, { silent: true });
                    } else if ($.trim(personal) === '') {
                        // yep, one space!
                        self.model.set('personal', ' ', { silent: true });
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
                            //string comparison is ugly, maybe backend has a translated version of this
                            if (data.code === 'ACC-0004' && data.error_params[0].substring(8, 13) === 'login') {
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
                    this.model.validationCheck().done(function (response, error) {
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
                    property = $(e.currentTarget).attr('data-property'),
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
                    root: accountId
                });
            }
        });

    // utility functions
    function group() {
        var args = _(arguments).toArray();
        return $('<div class="form-group">').append(args);
    }

    function label(id, text) {
        return $('<label class="control-label col-sm-4">').attr('for', id).text(text);
    }

    function div() {
        var args = _(arguments).toArray();
        return $('<div class="col-sm-7">').append(args);
    }

    function checkbox(text) {
        var args = _(arguments).toArray();
        return $('<div class="col-sm-offset-4 col-sm-7">').append(
            $('<div class="checkbox">').append(
                $('<label class="control-label">').text(text).prepend(args.slice(1))
            )
        );
    }

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'header',
        draw: function (view) {

            //
            // Incoming (IMAP/POP3)
            //
            var serverSettingsIn = $('<fieldset>').append(
                $('<legend class="sectiontitle">').text(gt('Incoming server')),
                $('<form class="form-horizontal" role="form">').append(
                    // server type
                    group(
                        label('mail_protocol', gt('Server type')),
                        $('<div class="col-sm-3">').append(
                            new mini.SelectView({ list: optionsServerType, model: model, id: 'mail_protocol' }).render().$el
                        )
                    ),
                    // secure
                    group(
                        checkbox(
                            gt('Use SSL connection'),
                            new mini.CheckboxView({ id: 'mail_secure', model: model }).render().$el
                        )
                    ),
                    // mail_server
                    group(
                        label('mail_server', gt('Server name')),
                        div(
                            new InputView({ model: model, id: 'mail_server' }).render().$el
                        )
                    ),
                    // secure - for 7.8.0
                    // group(
                    //     label('mail_secure', gt('Connection security')),
                    //     $('<div class="col-sm-3">').append(
                    //         new mini.SelectView({ list: optionsConnectionSecurity, model: model, id: 'mail_secure' }).render().$el
                    //     )
                    // ),
                    // mail_port
                    group(
                        label('mail_port', gt('Server port')),
                        $('<div class="col-sm-3">').append(
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
            );

            var serverSettingsOut = $('<fieldset>').append(
                $('<legend class="sectiontitle">').text(gt('Outgoing server (SMTP)')),
                $('<form class="form-horizontal" role="form">').append(
                    // secure
                    group(
                        checkbox(
                            gt('Use SSL connection'),
                            new mini.CheckboxView({ id: 'transport_secure', model: model }).render().$el
                        )
                    ),
                    // server
                    group(
                        label('transport_server', gt('Server name')),
                        div(
                            new InputView({ model: model, id: 'transport_server' }).render().$el
                        )
                    ),
                    // secure - for 7.8.0
                    // group(
                    //     label('transport_secure', gt('Connection security')),
                    //     $('<div class="col-sm-3">').append(
                    //         new mini.SelectView({ list: optionsConnectionSecurity, model: model, id: 'transport_secure' }).render().$el
                    //     )
                    // ),
                    // port
                    group(
                        label('transport_port', gt('Server port')),
                        $('<div class="col-sm-3">').append(
                            new InputView({ model: model, id: 'transport_port' }).render().$el
                        )
                    ),
                    // Auth type
                    group(
                        label('transport_auth', gt('Authentication')),
                        div(
                            new mini.SelectView({ list: optionsAuthType, model: model, id: 'transport_auth' }).render().$el
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
            );

            var folderLabels = {
                //#. Sent folder
                sent:    gt.pgettext('folder', 'Sent messages'),
                //#. Trash folder
                trash:   gt.pgettext('folder', 'Deleted messages'),
                //#. Drafts folder
                drafts:  gt.pgettext('folder', 'Drafts'),
                //#. Spam folder
                spam:    gt.pgettext('folder', 'Spam'),
                //#. Archive folder
                archive: gt.pgettext('folder', 'Archive')
            };

            var serverSettingsFolder = $('<fieldset>').append(
                $('<legend class="sectiontitle">').text(gt('Standard folders')),
                $('<form class="form-horizontal" role="form">').append(
                    // add four input fields
                    _('sent trash drafts spam archive'.split(' ')).map(function (folder) {

                        // skip archive if capability is missing
                        if (folder === 'archive' && !capabilities.has('archive_emails')) return;

                        // neither 0 nor undefined
                        var text = folderLabels[folder], id = model.get('id'), enabled = !!id;
                        folder = folder + '_fullname';

                        return group(
                            label(folder, text),
                            $('<div class="col-sm-7">').append(
                                enabled ?
                                // show controls
                                $('<div class="input-group folderselect enabled">').attr('data-property', folder).append(
                                    new InputView({ model: model, id: folder }).render().$el.prop('disabled', true),
                                    $('<span class="input-group-btn">').append(
                                        $('<button type="button" class="btn btn-default" tabindex="1">').text(gt('Select'))
                                    )
                                ) :
                                // just show path
                                $('<input type="text" class="form-control" disabled="disabled">')
                                .val($.trim(model.get(folder)).replace(/^default\d+\D/, ''))
                            )
                        );
                    })
                )
            );

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
                        capabilities.has('!multiple_mail_accounts') || capabilities.has('!unified-mailbox') ?
                        $() :
                        group(
                            checkbox(
                                gt('Use unified mail for this account'),
                                new mini.CheckboxView({ id: 'unified_inbox_enabled', model: model }).render().$el
                            )
                        )
                    )
                )
            );

            function adoptCredentials() {
                if (this.model.get('transport_auth') === 'mail') {
                    this.model.set({
                        transport_login: model.get('login'),
                        transport_password: null
                    });
                }
            }

            function changeTransportAuth() {
                var type = this.model.get('transport_auth');
                this.$el.find('#transport_login, #transport_password').prop('disabled', type !== 'custom');
                if (type === 'mail') {
                    adoptCredentials.call(this);
                } else {
                    this.model.set({ transport_login: '', transport_password: '' });
                }
            }

            if (!model.isHidden()) {
                this.append(serverSettingsIn, serverSettingsOut);
                view.listenTo(model, 'change:transport_auth', changeTransportAuth);
                view.listenTo(model, 'change:login', adoptCredentials);
                changeTransportAuth.call(view);
            }

            // don't show folder settings if this is a new account
            if (model.get('id') !== undefined) {
                this.append(serverSettingsFolder);
            }
        }
    });

    return accountAPI.getDefaultDisplayName().then(function (name) {
        defaultDisplayName = name;
        return AccountDetailView;
    });
});
