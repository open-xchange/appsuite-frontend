/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/onboarding/clients/wizard', [
    'io.ox/core/tk/wizard',
    'io.ox/onboarding/clients/config',
    'io.ox/onboarding/clients/api',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'settings!io.ox/core',
    'gettext!io.ox/core/onboarding',
    'io.ox/onboarding/clients/views',
    'less!io.ox/onboarding/clients/style'
], function (Wizard, config, api, ext, capabilities, settings, gt) {

    'use strict';

    // deeplink example:
    // &reg=client-onboarding&regopt=platform:apple,device:apple.iphone,scenario:mailappinstall

    var POINT = 'io.ox/onboarding/clients/views',
        //#. title for 1st and snd step of the client onboarding wizard
        //#. users can configure their devices to access/sync appsuites data (f.e. install ox mail app)
        //#. %1$s the product name
        //#, c-format
        titleLabel = gt('Take %1$s with you! Stay up-to-date on your favorite devices.', ox.serverConfig.productName),
        initiate, wizard;

    function yell() {
        var args = arguments;
        require(['io.ox/core/yell'], function (yell) {
            yell.apply(undefined, args);
        });
    }

    var options = {

        _getListItems: function (type, list) {
            return _.chain(list)
                    .filter(_.partial(options._getValid, _, type))
                    .map(options._getListItem)
                    .value();
        },

        _getListItem: function (obj) {
            return $('<li class="option">')
                .attr('data-value', obj.id)
                .attr('data-missing-capabilities', obj.missing_capabilities)
                .append(options._getLink(obj));
        },

        // back button
        _getListItemBack: function (type) {
            if (!_.contains(['device', 'scenario'], type)) return;
            // tabindex needed (wizard tabtrap)
            return $('<li class="option centered" data-value="back">').append(
                $('<button class="link box navigation" role="menuitem">').append(
                    $('<div class="icon-list">').append(options._getIcons('fa-angle-left')),
                    // a11y
                    options._getTitle({ title: gt('back') }).addClass('sr-only')
                )
            );
        },

        _getLink: function (obj) {
            // tabindex needed (wizard tabtrap)
            return $('<button class="link box" role="menuitem">')
                .addClass(obj.enabled ? '' : 'disabled')
                .append(
                    options._getPremium(obj),
                    options._getIcons(obj.icon),
                    options._getTitle(obj)
                );
        },

        _getPremium: function (obj) {
            if (obj.enabled) return;
            if (!settings.get('features/upsell/client.onboarding/enabled', true)) return;
            var container = $('<div class="premium-container">'), textnode, iconnode,
                color = settings.get('features/upsell/client.onboarding/color'),
                icon = settings.get('features/upsell/client.onboarding/icon') || settings.get('upsell/defaultIcon');
            // hierarchy
            container.append(
                $('<div class="premium">').append(
                    textnode = $('<span>').text(gt('Premium')),
                    iconnode = $('<i class="fa">')
                )
            );
            // custom icon/color
            if (color) textnode.css('color', color);
            if (icon) iconnode.addClass(icon);
            return container;
        },

        _getTitle: function (obj) {
            obj = obj || {};
            return $('<div class="title">').text(obj.title || obj.name || obj.id || '\xa0');
        },

        _getIcons: function (icon) {
            var list = [].concat(icon);
            return $('<div class="icon-list">')
                .append(
                    _.map(list, function (name) {
                        return $('<i class="icon fa">')
                            .attr('aria-hidden', true)
                            .addClass(name);
                    })
                );
        },

        _getValid: function (obj, type) {
            if (type !== 'device') return true;
            return obj.scenarios.length > 0;
        },

        getNode: function (type, list) {
            return $('<ul class="options" role="menu">')
                .append(
                    options._getListItemBack(type),
                    options._getListItems(type, list)
                );
        }
    };

    //
    // Platform & device
    //

    function onSelect(e) {
        e.preventDefault();
        var value = $(e.currentTarget).closest('li').attr('data-value'),
            wizard = this.parent,
            type = this.$el.attr('data-type');
        // back button
        if (value === 'back') {
            // remove value set within previous step
            wizard.model.unset('platform');
            return wizard.trigger('step:back');
        }
        // update model
        this.parent.model.set(type, value);
        wizard.trigger(type + ':select', value);
        this.trigger('next');
    }

    function focus() {
        this.$('.wizard-content').find('button[tabindex!="-1"][disabled!="disabled"]:not(.navigation):visible:first').focus();
    }

    function drawPlatforms() {
        var config = this.parent.config,
            descriptionId = _.uniqueId('description');
        // title
        this.$('.wizard-title').text(titleLabel);
        // content
        this.$('.wizard-content').empty()
            .addClass('onboarding-platform')
            .append(
                options.getNode('platform', config.getPlatforms())
                    .on('click', 'button', onSelect.bind(this)),
                //#. user can choose between windows, android, apple (usually)
                $('<p class="teaser">').attr('id', descriptionId).text(gt('Please select the platform of your device.'))
            );
        // a11y
        this.$el.attr('aria-labelledby', descriptionId + '  dialog-title');
        this.$('.link').attr('aria-describedby', descriptionId);
        this.$('.options').attr('aria-label', gt('list of available platforms'));
    }

    function drawDevices() {
        var config = this.parent.config,
            list = config.getDevices(),
            descriptionId = _.uniqueId('description');
        // title
        this.$('.wizard-title').text(titleLabel);
        // content
        this.$('.wizard-content').empty()
            .append(
                options.getNode('device', list)
                    .on('click', 'button', onSelect.bind(this)),
                //#. user can choose between smartphone, tablet and laptop/desktop (usually)
                $('<p class="teaser">').attr('id', descriptionId).text(gt('What type of device do you want to configure?'))
            );
        // a11y
        this.$el.attr('aria-labelledby', descriptionId + '  dialog-title');
        this.$('.link').attr('aria-describedby', descriptionId);
        this.$('.options').attr('aria-label', gt('list of available devices'));
        this.$('.title.sr-only').text(gt('choose a different platform'));
    }

    //
    // Scenario
    //

    function select(e) {
        e.preventDefault();
        var node = $(e.target),
            data = e.data,
            wizard = data.wizard,
            container = node.closest('[data-type]'),
            type = container.attr('data-type'),
            value = node.closest('[data-value]').attr('data-value');
        // disabled with upsell
        if (node.closest('.link').find('.premium').length) return wizard.trigger('scenario:upsell', e);
        // just disabled
        if (node.closest('.link').hasClass('disabled')) return;
        // back
        if (value === 'back') {
            // remove value set within previous step
            wizard.model.unset('device');
            wizard.model.unset('scenario');
            return wizard.trigger('step:back');
        }
        wizard.trigger('scenario:select', value);
        wizard.trigger('selected', { type: type, value: value });
    }

    function drawScenarios() {
        var config = this.parent.config,
            list = config.getScenarios(),
            wizard = this.parent,
            descriptionId = _.uniqueId('description'),
            container = this.$('.wizard-content').empty(),
            self = this;
        // title and teaser
        //#. title for 3rd step of the client onboarding wizard
        //#. user can choose between different scenarios (usually identical with our apps)
        this.$('.wizard-title').attr('id', descriptionId).text(gt('What do you want to use?'));
        // content
        container.append(
            options.
            getNode('scenario', list)
                .on('click', 'button', { wizard: this.parent }, select)
        );
        // description
        container.append(
            $('<ul class="descriptions">').append(function () {
                return _.map(list, function (obj) {
                    var descriptionId = _.uniqueId('description');
                    self.$('.option[data-value="' + obj.id + '"]>.link').attr('aria-labelledby', descriptionId);
                    return $('<li class="description hidden">')
                        .attr({
                            'data-parent': obj.id
                        })
                        .append(
                            $('<div class="">').text(obj.description || obj.id || '\xa0')
                            .attr({
                                'id': descriptionId
                            })
                        );
                });
            })
        );
        // actions
        ext.point(POINT).invoke('draw', container, { $step: this.$el, scenarios: list, config: config, wizard: wizard });
        // max width: supress resizing in case description is quite long
        var space = ((list.length + 1) * 160) + 32;
        container.find('.descriptions').css('max-width', space > 560 ? space : 560);
        // a11y
        this.$el.attr('aria-labelledby', descriptionId + '  dialog-title');
        this.$('.options').attr('aria-label', gt('list of available devices'));
        this.$('.actions-scenario').attr('aria-label', gt('list of available actions'));
        this.$('.title.sr-only').text(gt('choose a different scenario'));
        // autoselect first enabled
        var id = config.model.get('scenario'),
            enabled = _.where(list, { enabled: true });
        if (list.length === 0 || enabled.length === 0) return;
        if (!id) { config.model.set('scenario', id = _.first(enabled).id); }
        if (enabled.length) wizard.trigger('selected', { type: 'scenario', value: id });
    }

    var OnboardingView = Backbone.View.extend({

        initialize: function (config, options) {
            // wizard options (you can store any data you want; only 'id' is mandatory)
            var opt = _.extend({
                id:  'client-onboarding',
                title: gt('Client onboarding'),
                type: 'onboarding',
                data: {}
            }, options);
            // store model and options
            this.config = config;
            this.model = config.model;
            this.opt = opt;
            // apply predefined data
            this.set(opt.data);
            // register render
            Wizard.registry.add(opt, this.render.bind(this));
        },

        // set predefined selections (deep link)
        // ...&reg=client-onboarding&regopt=platform:windows,device:windows.desktop,scenario:emclientinstall
        set: function (data) {
            var props = { platform: 'platforms', device: 'devices', scenario: 'scenarios' },
                obj = {};
            // remove invalid values
            _.each(data, function (value, key) {
                var prop = props[key];
                // invalid key
                if (!prop) return;
                // invalid value
                if (!this.config.hash[prop][value]) return;
                obj[key] = value;
            }.bind(this));
            this.model.set(obj);
        },

        run: function () {
            if (capabilities.has('!client-onboarding')) return;
            if (_.device('smartphone')) {
                require(['io.ox/onboarding/clients/view-mobile'], function (dialog) {
                    dialog.get().open();
                    settings.set('features/clientOnboardingHint/remaining', 0).save();
                });
                return this;
            }
            // wrapper for wizard registry
            Wizard.registry.run(this.opt.id);
            return this;
        },

        track: function (type, value, detail) {
            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;
                if (!value) return;
                metrics.trackEvent({
                    app: 'core',
                    target: 'client-onboarding',
                    type: 'click',
                    action: type + '/' + value,
                    detail: (detail || '').toLowerCase().replace(/\s/g, '-')
                });
            });
        },

        _onStepBeforeShow: function () {
            // update this.$el reference
            var id = this.wizard.currentStep,
                node = (this.wizard.steps[id]);
            this.setElement(node.$el);
            this.$el.addClass('selectable-text');
        },

        _reset: function () {
            var model = this.model;
            _.each(['platform', 'device', 'scenario'], function (key) {
                model.unset(key);
            });
        },

        _onSelect: function (data) {
            var node = this.wizard.getCurrentStep().$el,
                options = node.find('.options');
            // update model
            this.model.set(data.type, data.value);
            // mark option
            options.find('li')
                    .removeClass('selected')
                    .filter('[data-value="' + data.value + '"]')
                    .addClass('selected');
            // show childs
            node.find('[data-parent]')
                .addClass('hidden')
                .filter('[data-parent="' + data.value + '"]')
                .removeClass('hidden');
            // show first action
            var expanded = node.find('.actions > [data-parent="' + data.value + '"] > .action').hasClass('expanded');
            if (!expanded) {
                node.find('.actions > [data-parent="' + data.value + '"] > .action')
                .first().addClass('expanded');
            }
        },

        upsell: function (e) {
            var item = $(e.target).closest('li'),
                missing = item.attr('data-missing-capabilities');
            if (!missing) return;
            require(['io.ox/core/upsell'], function (upsell) {
                if (!upsell.enabled(missing.replace(/,/g, ' '))) return;
                // TODO: without this workaround wizard step would overlay upsell dialog
                this.wizard.trigger('step:close');
                upsell.trigger({
                    type: 'custom',
                    id: item.attr('data-value'),
                    missing: missing
                });
            }.bind(this));
        },

        register: function () {
            // set max width of description block
            this.wizard.on({
                // step:before:show, step:ready, step:show, step:next, step:before:hide, step:hide, change:step,
                //'all': this._inspect,
                'step:before:show': _.bind(this._onStepBeforeShow, this),
                'selected': _.bind(this._onSelect, this),
                'before:stop': _.bind(this._reset, this),
                // metrics
                'platform:select': _.bind(this.track, this, 'platform/select'),
                'device:select': _.bind(this.track, this, 'device/select'),
                'scenario:select': _.bind(this.track, this, 'scenario/select'),
                'action:select': _.bind(this.track, this, 'action/select'),
                'action:execute': _.bind(this.track, this, 'action/execute'),
                // upsell
                'scenario:upsell': _.bind(this.upsell, this),
                'mode:toggle': _.bind(this.track, this, 'mode/toggle')
            });
        },

        render: function () {
            var wizard = this.wizard = new Wizard({ model: this.model }),
                self = this;
            // add references
            wizard.config = this.config;
            wizard.model = this.model;
            wizard.container.addClass('client-onboarding');
            // create wizard steps/pages
            wizard
                // platform
                .step({
                    attributes: { 'data-type': 'platform' },
                    id: 'platform',
                    back: false,
                    next: false,
                    minWidth: '540px'
                })
                .on('before:show', drawPlatforms)
                .on('show', focus)
                .end()
                // device
                .step({
                    attributes: { 'data-type': 'device' },
                    id: 'device',
                    back: false,
                    next: false,
                    minWidth: '540px'
                })
                .on('before:show', drawDevices)
                .on('show', focus)
                .end()
                // scenarios
                .step({
                    attributes: { 'data-type': 'scenario', 'data-mode': 'simple' },
                    id: 'scenario',
                    back: false,
                    next: false,
                    width: 'auto',
                    minWidth: '540px'
                })
                .on('show', focus)
                .on('before:show', drawScenarios)
                .end();
            // add some references to steps
            _.each(wizard.steps, function (step) {
                _.extend(step, {
                    view: self
                });
            });
            // register hanlders
            this.register();
            // render
            wizard.start();
        }

    });

    wizard = {

        load: function () {
            if (!initiate) initiate = config.load().promise();
            // generic error message
            initiate.fail(yell);
            return initiate;
        },

        render: function (config, options) {
            if (config.isIncomplete()) {
                require(['io.ox/core/yell'], function (yell) {
                    //#. error message when server returns incomplete
                    //#. configuration for client onboarding
                    yell('error', gt('Incomplete configuration.'));
                });
                return;
            }
            return new OnboardingView(config, options).run();
        },

        run: function (options) {
            // add 'options' to 'resolve' result
            var render = _.partial(wizard.render, _, options);
            return wizard.load().then(render);
        }
    };

    return wizard;
});
