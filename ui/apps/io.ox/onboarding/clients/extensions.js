/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/onboarding/clients/extensions', [
    'io.ox/backbone/mini-views/common',
    'io.ox/onboarding/clients/api',
    'io.ox/core/yell',
    'io.ox/core/extensions',
    'gettext!io.ox/core/onboarding'
], function (mini, api, yell, ext, gt) {

    'use strict';

    // scenario action views

    var POINT = 'io.ox/onboarding/clients/views';

    function yellError(resp) {
        if (_.isObject(resp) && 'error' in resp) return yell(resp);
    }

    var util = {
        removeIcons: function (e) {
            var target = $(e.target);
            target.parent().find('button-clicked').remove();
        },
        addIcon: function (e) {
            var target = $(e.target);
            target.after($('<i class="fa fa-check .button-clicked"></i>'));
        },
        disable: function (e) {
            $(e.target).addClass('disabled');
        }
    };

    var ActionsView = Backbone.View.extend({

        events: {
            'click .action>legend': 'accordion',
            'click .toggle-link': 'toggleMode'
        },

        initialize: function (options) {
            _.extend(this, options);
            this.setElement($('<div class="actions">'));
        },

        $toggleMode: $('<a href="#" class="toggle-link">').text(gt('Expert user?')),

        toggleMode: function (e) {
            e.preventDefault();
            var step = this.$el.closest('.wizard-step'),
                value = step.attr('data-mode'),
                link = this.$el.find('.toggle-link');
            // simple
            if (value === 'advanced') {
                step.attr('data-mode', 'simple');
                link.text(gt('Expert user?'));
                return this.update();
            }
            // advanced
            step.attr('data-mode', 'advanced');
            link.text(gt('Hide options for expert users.'));
            // update
            this.update();
        },

        update: function () {
            var list = this.$el.find('.actions-scenario'),
                mode = this.$step.attr('data-mode');
            _.each(list, function (container) {
                container = $(container);
                // advanced: cover (hidden) actions of not selected
                // selections to be ready when users switches scenarios
                var actions = container.find(mode === 'advanced' ? '.action' : '.action:visible');
                if (actions.length <= 1) {
                    return container.addClass('single-action');
                }
                container.removeClass('single-action');
            });
        },

        render: function () {
            var scenarios = this.scenarios,
                config = this.config,
                self = this;
            _.each(scenarios, function (scenario) {
                var list = config.getActions(scenario.id),
                    node = $('<div class="actions-scenario">').attr('data-parent', scenario.id),
                    baton = ext.Baton({ data: list, config: config, model: config.model });
                // draw actions
                _.each(baton.data, function (action) {
                    node.attr('data-value', action.id);
                    var actionpoint = ext.point(POINT + '/' + action.id);
                    // TODO: remove when middleware is ready
                    if (actionpoint.list().length === 0 && ox.debug) console.error('missing view for client-onboarding action: ' + action.id);
                    actionpoint.invoke('draw', node, action, baton);
                });
                // add toggle link
                if (baton.data.length > 1) node.append(self.$toggleMode.clone());
                this.$el.append(node);
                // expand first action
                this.$el.find('.action:first').addClass('expanded');
            }.bind(this));
            // update
            this.update();
            return this;
        },

        accordion: function (e) {
            e.preventDefault();
            var target = $(e.target),
                action = target.closest('.action'),
                container = action.closest('.actions');
            if (container.find('.action:visible').length <= 1) {
                // does not collapse when only action visible
                action.addClass('expanded');
            } else {
                action.toggleClass('expanded');
            }
            // there can only be one
            action.closest('.actions-scenario').find('.action').not(action).removeClass('expanded');
        }

    });

    var DisplayActionView = Backbone.View.extend({

        labels: {
            // card
            'carddav_hostName': gt('hostname'),
            'carddav_login': gt('login'),
            // smtp
            'smtpLogin': gt('SMTP login'),
            'smtpServer': gt('SMTP server'),
            'smtpPort': gt('SMTP port'),
            'smtpSecure': gt('SMTP secure'),
            // imap
            'imapLogin': gt('IMAP login'),
            'imapServer': gt('IMAP server'),
            'imapPort': gt('IMAP port'),
            'imapSecure': gt('IMAP secure')
        },

        initialize: function (action, options) {
            _.extend(this, action);
            this.model = options.baton.model;
            this.config = options.baton.config;
            // root
            this.setElement(
                $('<fieldset class="action form-group">')
                .attr('data-action', action.id)
            );
        },

        render: function () {
            var self = this, form;
            this.$el.empty()
                .append(
                    // title
                    $('<legend class="title section-title">')
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right">'),
                            $('<i class="fa fa-fw fa-chevron-down">'),
                            $.txt(gt('Settings for advanced users'))
                        ),
                    // content
                    $('<span class="content">').append(
                        $('<div class="description">')
                            .text(gt('If you know what you are doing...just setup your account manually!')),
                        form = $('<div class="data">')
                    )
                );
            // add rows
            var list = Object.keys(this.data).sort();
            _.each(list, function (key) {
                var value = self.data[key],
                    group = $('<div class="row">');
                group.append(
                    $('<label class="control-label display-label col-sm-3">').text(self.labels[key] || key),
                    $('<div class="col-sm-9">').append(
                        $('<input class="form-control" readonly>').val(value)
                            .on('click', function () {
                                $(this).select();
                            })
                    )
                );
                form.append(group);
            });
            return this;
        }
    });

    var ShortMessageActionView = Backbone.View.extend({

        tagName: 'fieldset',
        className: 'action form-group',
        events: { 'click .btn': '_onClick' },

        initialize: function (action, options) {
            _.extend(this, action);
            this.model = options.baton.model;
            this.config = options.baton.config;
            this.$el.attr('data-action', action.id);
        },

        _input: function () {
            var value = this.model.get('sms') || this.config.getUserMobile();
            return new mini.InputView({ name: 'sms', type: 'tel', model: this.model }).render()
                    .$el
                    .removeClass('form-control')
                    .addClass('field form-control')
                    .attr('title', this.name)
                    .attr('list', 'addresses')
                    .attr('placeholder', gt('Cell phone'))
                    .val(value).trigger('change');
        },

        _select: function () {
            var select = new mini.SelectView({
                    name: 'code',
                    model: this.model,
                    list: this.config.getCodes()
                }),
                standard = 'DE';
            // adjust node
            select.render().$el
                .removeClass('form-control')
                .addClass('select form-control')
                .attr('title', this.name)
                .attr('list', 'addresses')
                .val(this.model.get('code') || this.config.getCodes(standard).value).trigger('change');
            return select;
        },

        render: function () {
            this.$el.empty()
                .append(
                    // title
                    $('<legend class="title section-title">')
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right">'),
                            $('<i class="fa fa-fw fa-chevron-down">'),
                            $.txt(gt('Automatic Configuration (via SMS)'))
                        ),
                    $('<span class="content">').append(
                        // description
                        $('<div class="description">')
                            .text(gt('Please enter your mobile phone number, and we´ll send you a link to automatically configure your iOS device! It´s that simple!')),
                        // form
                        $('<div class="interaction">').append(
                            $('<form class="form-inline">').append(
                                $('<div class="row">').append(
                                    //$('<label class="control-label">').text(gt('Phone Number')),
                                    this._select().$el,
                                    this._input(),
                                    $('<button class="btn btn-primary">').text(gt('Send'))
                                )
                            )
                        )
                    )
                );

            return this;
        },

        _onClick: function (e) {
            e.preventDefault();
            var scenario = this.config.getScenarioCID(),
                action = this.id,
                data = {
                    sms: this.model.get('sms'),
                    code: this.model.get('code')
                };
            // call
            util.disable(e);
            util.removeIcons(e);
            api.execute(scenario, action, data)
                .always(yellError)
                .always(_.partial(util.addIcon, e));
        }
    });

    var EmailActionView = Backbone.View.extend({

        events: {
            'click .btn': '_onClick'
        },

        initialize: function (action, options) {
            _.extend(this, action);
            this.model = options.baton.model;
            this.config = options.baton.config;
            // root
            this.setElement(
                $('<fieldset class="action form-group">')
                .attr('data-action', action.id)
            );
        },

        _input: function () {
            var value = this.model.get('email') || this.config.getUserMail();
            return new mini.InputView({ name: 'email', model: this.model }).render()
                .$el
                .addClass('field form-control')
                .attr('title', this.name)
                .attr('list', 'addresses')
                .val(value || '').trigger('change');
        },

        render: function () {
            this.$el.empty()
                .append(
                    // title
                    $('<legend class="title section-title">')
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right">'),
                            $('<i class="fa fa-fw fa-chevron-down">'),
                            $.txt(gt('Configuration Email'))
                        ),
                    $('<span class="content">').append(
                        // description
                        $('<div class="description">')
                            .text(gt('Get your device configured by email.')),
                        // form
                        $('<div class="interaction">').append(
                            $('<form class="form-inline">').append(
                                $('<div class="row">').append(
                                    //$('<label class="control-label">').text(gt('Email')),
                                    this._input(),
                                    // action
                                    $('<button>')
                                        .addClass('btn btn-primary')
                                        .text(gt('Send'))
                                )
                            )
                        )
                    )
                );
            return this;
        },

        _onClick: function (e) {
            e.preventDefault();
            var scenario = this.config.getScenarioCID(),
                action = this.id,
                data = {
                    email: this.model.get('email')
                };
            // call
            util.removeIcons(e);
            api.execute(scenario, action, data)
                .always(yellError)
                .always(_.partial(util.addIcon, e));
        }
    });

    var DownloadActionView = Backbone.View.extend({

        events: {
            'click .btn': '_onClick'
        },

        initialize: function (action, options) {
            _.extend(this, action);
            this.model = options.baton.model;
            this.config = options.baton.config;
            // root
            this.setElement(
                $('<fieldset class="action form-group">')
                .attr('data-action', action.id)
            );
        },

        render: function () {
            this.$el.empty()
                .append(
                    // title
                    $('<legend class="title section-title">')
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right">'),
                            $('<i class="fa fa-fw fa-chevron-down">'),
                            $.txt(gt('Automatic Configuration'))
                        ),
                    $('<span class="content">').append(
                        // description
                        $('<div class="description">')
                            .text(gt('Let´s automatically configure your device, by clicking the button below. It´s that simple!')),
                        // action
                        $('<button>')
                            .addClass('btn btn-primary')
                            .text(gt('Configure now'))
                    )
                );
            return this;
        },

        _onClick: function (e) {
            e.preventDefault();
            var url = api.getUrl(this.config.getScenarioCID(), this.id);
            require(['io.ox/core/download'], function (download) {
                download.url(url);
            });
        }
    });

    var AppActionView = Backbone.View.extend({

        events: {
            'click .btn': '_onClick',
            'click .store': '_onClick'
        },

        initialize: function (action, options) {
            _.extend(this, action);
            this.model = options.baton.model;
            this.config = options.baton.config;
            // root
            this.setElement(
                $('<fieldset class="action form-group">')
                .attr('data-action', action.id)
            );
            // device specific
            this.device = this.config.getDevice();
            this.link = action[this.device.id].link;
            this.type = action[this.device.id].type;
        },

        getLabel: function () {
            return {
                'appstore': gt('App Store'),
                'playstore': gt('Google Play')
            }[this.type];
        },

        getBadgeUrl: function () {
            var available = ['EN', 'DE', 'ES', 'FR'],
                prefix = ox.language.slice(0, 2).toUpperCase(),
                country = _.contains(available, prefix) ? prefix : 'EN',
                stores = {
                    'appstore': 'apps/themes/icons/default/appstore/App_Store_Badge_' + country + '_135x40.svg',
                    'playstore': 'apps/themes/icons/default/googleplay/google-play-badge_' + country + '.svg'
                };
            return stores[this.type];
        },

        render: function () {
            this.$el.empty()
                .append(
                    // title
                    $('<legend class="title section-title">')
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right">'),
                            $('<i class="fa fa-fw fa-chevron-down">'),
                            $.txt(gt('Installation'))
                        ),
                    $('<span class="content">').append(
                        // description
                        $('<div class="description">')
                            .text(gt('Get the App from %1$s', this.getLabel())),
                        // action
                        $('<a class="store">').append(
                            $('<img class="store-icon">').attr('src', this.getBadgeUrl())
                        )
                    )
                );
            return this;
        },

        _onClick: function (e) {
            e.preventDefault();
            window.open(this.link);
        }
    });

    return {
        ActionsView: ActionsView,
        DisplayActionView: DisplayActionView,
        ShortMessageActionView: ShortMessageActionView,
        EmailActionView: EmailActionView,
        DownloadActionView: DownloadActionView,
        AppActionView: AppActionView
    };
});
