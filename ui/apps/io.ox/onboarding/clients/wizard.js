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
    'gettext!io.ox/core/onboarding',
    'io.ox/onboarding/clients/views',
    'less!io.ox/onboarding/clients/style'
], function (Wizard, config, api, ext, gt) {

    'use strict';

    var POINT = 'io.ox/onboarding/clients/views',
        titleLabel = gt('Take %1$s with you! Stay up-to-date on your favorite devices.', ox.serverConfig.productName);

    function drawOptions(type, list) {
        return $('<ul class="options" role="navigation">')
                .append(function () {
                    return _.map(list, function (obj) {
                        return $('<li>')
                                .attr({
                                    'data-value': obj.id
                                })
                                .append(
                                    $('<a href="#" tabindex="1" class="box">')
                                    // apply disabled style?
                                    .addClass(obj.enabled ? '' : 'disabled')
                                    .append(
                                        $('<i class="icon fa">').addClass(obj.icon || 'fa-circle'),
                                        $('<div class="title">').text(obj.title || obj.name || obj.id || '\xa0')
                                    )
                        );
                    });
                });
    }

    //
    // Platform & device
    //

    function onSelect(e) {
        e.preventDefault();
        var value = $(e.currentTarget).closest('li').attr('data-value'),
            type = this.$el.attr('data-type');
        // update model
        this.parent.model.set(type, value);
        this.trigger('next');
    }

    function drawPlatforms() {
        var config = this.parent.config;
        // title
        this.$('.wizard-title').text(titleLabel);
        // content
        this.$('.wizard-content').empty()
            .addClass('onboarding-platform')
            .append(
                $('<p class="teaser">').text(gt('Please select the platform of your device.')),
                drawOptions('platform', config.getPlatforms())
                .on('click', 'a', onSelect.bind(this))
            );
    }

    function drawDevices() {
        var config = this.parent.config,
            list = config.getDevices();
        // title
        this.$('.wizard-title').text(titleLabel);
        // content
        this.$('.wizard-content').empty()
            .append(
                $('<p class="teaser">').text(gt('Which device do you want to configure?')),
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
            container = node.closest('[data-type]'),
            type = container.attr('data-type'),
            value = node.closest('[data-value]').attr('data-value');
        data.wizard.trigger('selected', { type: type, value: value });
    }

    function drawScenarios() {
        var config = this.parent.config,
            list = config.getScenarios(),
            wizard = this.parent,
            container = this.$('.wizard-content').empty();
        // title and teaser
        this.$('.wizard-title').text(titleLabel);
        container.append(
            $('<p class="teaser">').text(gt('What service do you want to use?'))
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
                    return $('<li class="hidden">').attr('data-parent', obj.id).append(
                        $('<div class="description">').text(obj.description || obj.id || '\xa0')
                    );
                });
            })
        );
        // actions
        ext.point(POINT).invoke('draw', container, { scenarios: list, config: config });
        // max width: supress resizing in case description is quite long
        var space = (list.length * 160) + 32;
        this.$('.wizard-content').css('max-width', space > 560 ? space : 560);

        // preselect
        var preselected = _.first(list);
        config.model.set('scenario', preselected.id);
        wizard.trigger('selected', { type: 'scenario', value: preselected.id });
    }

    var OnboardingView = Backbone.View.extend({

        initialize: function (config, options) {
            // wizard options (you can store any data you want; only 'id' is mandatory)
            var opt = _.extend({
                id:  'client-onboarding',
                title: gt('Client onboarding'),
                type: 'onboarding'
            }, options);
            // store model and options
            this.config = config;
            this.model = config.model;
            this.opt = opt;
            // register render
            Wizard.registry.add(opt, this.render.bind(this));
        },

        run: function () {
            // wrapper for wizard registry
            Wizard.registry.run(this.opt.id);
        },

        _onStepBeforeShow: function () {
            // update this.$el reference
            var id = this.wizard.currentStep,
                node = (this.wizard.steps[id]);
            this.setElement(node.$el);
        },

        // _inspect: function (eventname) {
        //     if (ox.debug) console.log('%c' + eventname, 'color: white; background-color: blue');
        // },

        _reset: function (index) {
            var step = this.wizard.get(index),
                type = step.$el.attr('data-type');
            this.model.set(type, undefined);
        },

        register: function () {
            // set max width of description block
            this.wizard.on({
                // step:before:show, step:ready, step:show, step:next, step:before:hide, step:hide, change:step,
                //'all': this._inspect,
                'step:back': _.bind(this._reset, this),
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

        skip: function (step) {
            var type = step.$el.attr('data-type'),
                devices = this.config.getDevices(),
                doSkip = devices.length === 1;
            if (doSkip) {
                this.config.model.set(type, devices[0].id);
            }
            return doSkip;
        },

        render: function () {
            var wizard = this.wizard = new Wizard(),
                self = this;
            // add references
            wizard.config = this.config;
            wizard.model = this.model;
            // create wizard steps/pages
            wizard
                // platform
                .step({
                    attributes: { 'data-type': 'platform' },
                    next: false,
                    width: 'auto',
                    minWidth: '504px'
                })
                .on('before:show', drawPlatforms)
                .end()
                // device
                .step({
                    attributes: { 'data-type': 'device' },
                    labelBack: gt('Back to platforms'),
                    next: false,
                    width: 'auto',
                    minWidth: '504px'
                })
                .setSkippable(function () { return self.skip(this); })
                .on('before:show', drawDevices)
                .end()
                // scenarios
                .step({
                    attributes: { 'data-type': 'scenario' },
                    next: false,
                    width: 'auto',
                    minWidth: '504px',
                    labelBack: gt('Back to devices')
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

    config.load().then(function () {
        new OnboardingView(config).run();
    });
});
