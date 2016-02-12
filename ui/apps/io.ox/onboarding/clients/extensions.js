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
            target.parent().find('.button-clicked').remove();
        },
        addIcon: function (e) {
            var target = $(e.target);
            util.removeIcons(e);
            target.after($('<i class="fa fa-check button-clicked"></i>'));
        },
        disable: function (e) {
            $(e.target).addClass('disabled');
        },
        enable: function (e) {
            $(e.target).removeClass('disabled');
        }
    };

    var ActionsListView = Backbone.View.extend({

        events: {
            'click .section-title': 'accordion',
            'click .toggle-link': 'toggleMode'
        },

        initialize: function (options) {
            _.extend(this, options);
            this.setElement($('<div class="actions">'));
            this.register();
        },

        register: function () {
            // metrics
            var wizard = this.wizard;
            this.$el.on('click', '.action', function (e) {
                var id = $(this).attr('data-action'),
                    target = $(e.target),
                    eventname = target.hasClass('action-call') ? 'action:execute' : 'action:select',
                    detail = target.attr('data-detail');
                wizard.trigger(eventname, id, detail);
            });
        },

        getToggleNode: function () {
            var id = _.uniqueId('description');
            return [
                $('<div class="sr-only">').attr('id', id).text(gt('Click to show or hide actions for advanced users.')),
                $('<a href="#" class="toggle-link" data-value="to-advanced" tabindex="1">').attr('aria-describedby', id).text(gt('Expert user?')),
                $('<a href="#" class="toggle-link" data-value="to-simple" tabindex="1">').attr('aria-describedby', id).text(gt('Hide options for expert users.'))
            ];
        },

        toggleMode: function (e) {
            e.preventDefault();
            var step = this.$el.closest('.wizard-step'),
                toSimple = step.attr('data-mode') === 'advanced';
            // update model and trigger event
            step.attr('data-mode', toSimple ? 'simple' : 'advanced');
            this.wizard.trigger('mode:toggle', toSimple ? 'simple' : 'advanced');
            return this.update();
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
                var list = config.getActions(scenario.id) || [],
                    node = $('<div class="actions-scenario" role="tablist">').attr('data-parent', scenario.id),
                    baton = ext.Baton({ data: list, config: config, model: config.model });
                // draw actions
                _.each(baton.data, function (action) {
                    node.attr('data-value', action.id);
                    var actiontype = action.id.split('/')[0],
                        actionpoint = ext.point(POINT + '/' + actiontype);
                    // TODO: remove when middleware is ready
                    if (actionpoint.list().length === 0 && ox.debug) console.error('missing view for client-onboarding action: ' + action.id);
                    actionpoint.invoke('draw', node, action, baton);
                });
                // add toggle link
                if (baton.data.length > 1) {
                    node.append(self.getToggleNode());
                }
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
                action.addClass('expanded').find('.section-title').attr('aria-pressed', true);
            } else {
                action.toggleClass('expanded').find('.section-title').attr('aria-pressed', action.hasClass('expanded'));
            }
            // there can only be one
            action.closest('.actions-scenario').find('.action').not(action).removeClass('expanded').find('.section-title').attr('aria-pressed', false);
        }

    });

    var DisplayActionView = Backbone.View.extend({

        labels: {
            // card
            'caldav_url': gt('CalDAV URL'),
            'caldav_login': gt('CalDAV Login'),
            'carddav_url': gt('CardDAV URL'),
            'carddav_login': gt('CardDAV Login'),
            // smtp
            'smtpServer': gt('SMTP Server'),
            'smtpPort': gt('SMTP Port'),
            'smtpLogin': gt('SMTP Login'),
            'smtpSecure': gt('SMTP Secure'),
            // imap
            'imapServer': gt('IMAP Server'),
            'imapPort': gt('IMAP Port'),
            'imapLogin': gt('IMAP Login'),
            'imapSecure': gt('IMAP Secure'),
            // eas
            'eas_url': gt('EAS URL'),
            'eas_login': gt('EAS Login')
        },

        order: (function () {
            var list = [
                // card
                'caldav_url',
                'caldav_login',
                'carddav_url',
                'carddav_login',
                // imap
                'imapServer',
                'imapPort',
                'imapLogin',
                'imapSecure',
                // smtp
                'smtpServer',
                'smtpPort',
                'smtpLogin',
                'smtpSecure',
                // eas
                'eas_url',
                'eas_login'
            ];
            return function (key) {
                return list.indexOf(key);
            };
        }()),

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
            var self = this, form,
                id = _.uniqueId('controls');
            this.$el.empty()
                .append(
                    // title
                    $('<button class="title section-title" tabindex="1" role="tab">')
                        .attr('aria-controls', id)
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right" aria-hidden="true"> '),
                            $('<i class="fa fa-fw fa-chevron-down" aria-hidden="true">'),
                            $.txt(gt('Settings for advanced users'))
                        ),
                    // content
                    $('<span class="content">')
                        .attr('id', id)
                        .append(
                            $('<div class="description">')
                                .text(gt('If you know what you are doing...just setup your account manually!')),
                            form = $('<div class="data">')
                        )
                );
            // sort
            var list = Object.keys(this.data);
            list = _.sortBy(list, this.order);
            // add rows
            _.each(list, function (key) {
                var value = self.data[key],
                    group = $('<div class="row">'),
                    id = _.uniqueId('label');
                group.append(
                    $('<label class="control-label display-label col-sm-3">')
                        .attr('id', id)
                        .text(self.labels[key] || key),
                    $('<div class="col-sm-9">').append(
                        $('<input class="form-control" readonly tabindex="1">')
                            .attr('aria-labelledby', id)
                            .val(value)
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
                standard = this['default'];
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
            var id = _.uniqueId('description');
            this.$el.empty()
                .append(
                    // title
                    $('<button class="title section-title" tabindex="1" role="tab">')
                        .attr('aria-describedby', id)
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right" aria-hidden="true"> '),
                            $('<i class="fa fa-fw fa-chevron-down" aria-hidden="true">'),
                            $.txt(gt('Automatic Configuration (via SMS)'))
                        ),
                    $('<span class="content">').append(
                        // description
                        $('<div class="description">')
                            .attr('id', id)
                            .text(gt('Please enter your mobile phone number, and we´ll send you a link to automatically configure your iOS device! It´s that simple!')),
                        // form
                        $('<div class="interaction">').append(
                            $('<form class="form-inline">').append(
                                $('<div class="row">').append(
                                    //$('<label class="control-label">').text(gt('Phone Number')),
                                    this._select().$el,
                                    this._input(),
                                    $('<button class="btn btn-primary" tabindex="1">').attr('role', 'button').text(gt('Send'))
                                )
                            )
                        )
                    )
                );

            return this;
        },

        getNumber: function () {
            var local = this.model.get('sms'),
                prefix = this.model.get('code');
            // remove everything except digits and '+'
            local = local.replace(/[^\d+]+/g, '');
            // 0049... -> +49...
            local = local.replace(/^00/, '+');
            // valid country code entered?
            if (!!this.config.find(local)) return local;
            // keep only digits
            local = local.replace(/[\D]+/g, '');
            // remove leading zero
            local = local.replace(/^0+/, '');
            return prefix + local;
        },

        _onClick: function (e) {
            e.preventDefault();
            var scenario = this.config.getScenarioCID(),
                action = this.id,
                data = {
                    sms: this.getNumber()
                };
            // call
            util.disable(e);
            api.execute(scenario, action, data)
                .always(yellError)
                .done(_.partial(util.addIcon, e))
                .fail(_.partial(util.enable, e));
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
            var id = _.uniqueId('description');
            this.$el.empty()
                .append(
                    // title
                    $('<button class="title section-title" tabindex="1" role="tab">')
                        .attr('aria-describedby', id)
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right" aria-hidden="true"> '),
                            $('<i class="fa fa-fw fa-chevron-down" aria-hidden="true">'),
                            $.txt(gt('Configuration Email'))
                        ),
                    $('<span class="content">').append(
                        // description
                        $('<div class="description">')
                            .attr('id', id)
                            .text(gt('Get your device configured by email.')),
                        // form
                        $('<div class="interaction">').append(
                            $('<form class="form-inline">').append(
                                $('<div class="row">').append(
                                    this._input(),
                                    // action
                                    $('<button class="btn btn-primary action-call" tabindex="1">')
                                        .attr('role', 'button')
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
            var ref = _.uniqueId('description-');
            this.$el.empty()
                .append(
                    // title
                    $('<button class="title section-title" tabindex="1" role="tab">')
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right" aria-hidden="true"> '),
                            $('<i class="fa fa-fw fa-chevron-down" aria-hidden="true">'),
                            $.txt(gt('Automatic Configuration'))
                        ),
                    $('<span class="content">').append(
                        // description
                        $('<div class="description">')
                            .attr('id', ref)
                            .text(gt('Let´s automatically configure your device, by clicking the button below. It´s that simple!')),
                        // action
                        $('<button class="btn btn-primary action-call" tabindex="1">')
                            .attr('role', 'button')
                            .attr('aria-describedby', ref)
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

    var ClientActionView = Backbone.View.extend({

        events: {
            'click .action-call': '_onClick'
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

        hash: {
            'macappstore': gt('Mac App Store'),
            'appstore': gt('App Store'),
            'playstore': gt('Google Play')
        },

        getLabel: function () {
            var storename = this.hash[this.type];
            //#. %1$s: app store name
            return storename ? gt('Get the App from %1$s', storename) : gt('Download the application.');
        },


        getButton: function () {
            var badgeurl = this.getBadgeUrl();
            // badge
            if (badgeurl) {
                return $('<a href="#" class="store">').append(
                    $('<img class="store-icon action-call">')
                    .attr({
                        'role': 'button',
                        'tabindex': 1,
                        'data-detail': this.hash[this.type],
                        'src': this.getBadgeUrl()
                    })
                );
            }
            // simple button
            return $('<button class="btn btn-primary action-call" tabindex="1">')
                .attr('role', 'button')
                .text(gt('Download'));
        },

        getBadgeUrl: function () {
            var available = ['EN', 'DE', 'ES', 'FR'],
                prefix = ox.language.slice(0, 2).toUpperCase(),
                country = _.contains(available, prefix) ? prefix : 'EN',
                stores = {
                    'macappstore': 'apps/themes/icons/default/appstore/Mac_App_Store_Badge_' + country + '_165x40.svg',
                    'appstore': 'apps/themes/icons/default/appstore/App_Store_Badge_' + country + '_135x40.svg',
                    'playstore': 'apps/themes/icons/default/googleplay/google-play-badge_' + country + '.svg'
                };
            return stores[this.type];
        },

        render: function () {
            var id = _.uniqueId('description');
            this.$el.empty()
                .append(
                    // title
                    $('<button class="title section-title" tabindex="1" role="tab">')
                        .attr('aria-describedby', id)
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right" aria-hidden="true"> '),
                            $('<i class="fa fa-fw fa-chevron-down" aria-hidden="true">'),
                            $.txt(gt('Installation'))
                        ),
                    $('<span class="content">').append(
                        // description
                        $('<div class="description">').attr(id, id).text(this.getLabel()),
                        this.getButton()

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
        ActionsListView: ActionsListView,
        DisplayActionView: DisplayActionView,
        ShortMessageActionView: ShortMessageActionView,
        EmailActionView: EmailActionView,
        DownloadActionView: DownloadActionView,
        ClientActionView: ClientActionView
    };
});
