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

define('io.ox/onboarding/clients/wizard', [
    'io.ox/core/tk/wizard',
    'io.ox/onboarding/clients/config',
    'io.ox/onboarding/clients/api',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'gettext!io.ox/core/onboarding',
    'io.ox/onboarding/clients/views',
    'less!io.ox/onboarding/clients/style'
], function (Wizard, config, api, ext, capabilities, gt) {

    'use strict';

    var POINT = 'io.ox/onboarding/clients/views',
        titleLabel = gt('Take %1$s with you! Stay up-to-date on your favorite devices.', ox.serverConfig.productName),
        initiate, wizard;

    function drawOptions(type, list) {

        function addIcons(icon) {
            var list = [].concat(icon);
            return _.map(list, function (name) {
                return $('<i class="icon fa">').addClass(name);
            });
        }

        return $('<ul class="options" role="navigation">')
                .append(function () {
                    return _.map(list, function (obj) {
                        return $('<li class="option">')
                                .attr({
                                    'data-value': obj.id
                                })
                                .append(
                                    $('<a href="#" tabindex="1" class="link box">')
                                    // apply disabled style?
                                    .addClass(obj.enabled ? '' : 'disabled')
                                    .append(obj.enabled ? '' : $('<div class="premium">').text(gt('Premium')))
                                    .append(
                                        $('<div class="icon-list">').append(addIcons(obj.icon)),
                                        $('<div class="title">').text(obj.title || obj.name || obj.id || '\xa0')
                                    )
                        );
                    });
                })
                // back button
                .prepend(
                    _.contains(['device', 'scenario'], type) ?
                    $('<li class="option centered">')
                        .attr({
                            'data-value': 'back'
                        })
                        .append(
                            $('<a href="#" tabindex="1" class="link box">')
                            // apply disabled style?
                            .append(
                                $('<div class="icon-list">').append(addIcons('fa-angle-left')),
                                $('<div class="title">').text('\u00A0')
                            )
                        )
                    : ''
                );
    }

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
        this.trigger('next');
    }

    function drawPlatforms() {
        var config = this.parent.config;
        // title
        this.$('.wizard-title').text(gt('Please select the platform of your device.'));
        // content
        this.$('.wizard-content').empty()
            .addClass('onboarding-platform')
            .append(
                $('<p class="teaser">').text(titleLabel),
                drawOptions('platform', config.getPlatforms())
                .on('click', 'a', onSelect.bind(this))
            );
    }

    function drawDevices() {
        var config = this.parent.config,
            list = config.getDevices();
        // title
        this.$('.wizard-title').text(gt('Which device do you want to configure?'));
        // content
        this.$('.wizard-content').empty()
            .append(
                //$('<p class="teaser">').text),
                drawOptions('device', list)
                .on('click', 'a', onSelect.bind(this))
            );
    }

    //
    // Scenario
    //

    function select(e) {
        var node = $(e.target),
            data = e.data,
            wizard = data.wizard,
            container = node.closest('[data-type]'),
            type = container.attr('data-type'),
            value = node.closest('[data-value]').attr('data-value');
        // back
        if (value === 'back') {
            // remove value set within previous step
            wizard.model.unset('device');
            wizard.model.unset('scenario');
            return wizard.trigger('step:back');
        }
        data.wizard.trigger('selected', { type: type, value: value });
    }

    function drawScenarios() {
        var config = this.parent.config,
            list = config.getScenarios(),
            wizard = this.parent,
            container = this.$('.wizard-content').empty();
        // title and teaser
        this.$('.wizard-title').text(gt('What do you want to use?'));
        container.append(
            //$('<p class="teaser">').text()
        );
        // content
        container.append(
            drawOptions('scenario', list)
            .on('click', 'a', { wizard: this.parent }, select)
        );
        // description
        container.append(
            $('<ul class="descriptions">').append(function () {
                return _.map(list, function (obj) {
                    return $('<li class="description hidden">').attr('data-parent', obj.id).append(
                        $('<div class="description">').text(obj.description || obj.id || '\xa0')
                    );
                });
            })
        );
        // actions
        ext.point(POINT).invoke('draw', container, { $step: this.$el, scenarios: list, config: config });
        // max width: supress resizing in case description is quite long
        var space = ((list.length + 1) * 160) + 32;
        this.$('.wizard-content').css('max-width', space > 560 ? space : 560);
        // autoselect first
        var id = config.model.get('scenario');
        if (!id) { config.model.set('scenario', id = _.first(list).id); }
        wizard.trigger('selected', { type: 'scenario', value: id });
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
            this.model.set(opt.data);
            // register render
            Wizard.registry.add(opt, this.render.bind(this));
        },

        run: function () {
            if (capabilities.has('!client-onboarding')) return;
            // wrapper for wizard registry
            Wizard.registry.run(this.opt.id);
            return this;
        },

        _onStepBeforeShow: function () {
            // update this.$el reference
            var id = this.wizard.currentStep,
                node = (this.wizard.steps[id]);
            this.setElement(node.$el);
            // TODO: doesn't work as expected
            this.$el.find('.wizard-close').attr('tabindex', '2');
        },

        _onChange: function (type, model, value) {
            // autoselect when only one option available
            if (!value) return;
            var data = {};
            switch (type) {
                case 'platform':
                    data.target = 'device';
                    data.list = this.config.getDevices();
                    break;
                case 'device':
                    data.target = 'scenario';
                    data.list = this.config.getScenarios();
                    break;
                default:
            }
            if (data.list.length > 1) return;
            this.model.set(data.target, _.first(data.list).id);
        },

        _reset: function () {
            var model = this.model;
            _.each(['platform', 'device', 'scenario'], function (key) {
                model.unset(key);
            });
        },

        register: function () {
            this.model.on('change:platform', this._onChange.bind(this, 'platform'));
            this.model.on('change:device', this._onChange.bind(this, 'device'));

            // set max width of description block
            this.wizard.on({
                // step:before:show, step:ready, step:show, step:next, step:before:hide, step:hide, change:step,
                //'all': this._inspect,
                'before:stop': _.bind(this._reset, this),
                'step:before:show': _.bind(this._onStepBeforeShow, this)
            });

            this.wizard.on('selected', function (data) {
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

            }.bind(this));
        },

        render: function () {
            var wizard = this.wizard = new Wizard({ model: this.model }),
                self = this;
            // add references
            wizard.config = this.config;
            wizard.model = this.model;
            // create wizard steps/pages
            wizard
                // platform
                .step({
                    attributes: { 'data-type': 'platform' },
                    id: 'platform',
                    back: false,
                    next: false,
                    width: 'auto',
                    minWidth: '504px'
                })
                .on('before:show', drawPlatforms)
                .end()
                // device
                .step({
                    attributes: { 'data-type': 'device' },
                    id: 'device',
                    back: false,
                    next: false,
                    width: 'auto',
                    minWidth: '504px'
                })
                .on('before:show', drawDevices)
                .end()
                // scenarios
                .step({
                    attributes: { 'data-type': 'scenario', 'data-mode': 'simple' },
                    id: 'scenario',
                    back: false,
                    next: false,
                    width: 'auto',
                    minWidth: '504px'
                })
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
        },

        getCurrent: function () {
            return this.wizard.getCurrentStep();
        }

    });

    wizard = {

        load: function () {
            if (!initiate) initiate = config.load().promise();
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
