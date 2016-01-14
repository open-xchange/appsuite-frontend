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
        titleLabel = gt('Take %1$s with you! Stay up-to-date on your favorite devices.', ox.serverConfig.productName),
        initiate, wizard;

    function drawOptions(type, list) {

        function addIcons(icon) {
            var list = [].concat(icon);
            return _.map(list, function (name) {
                return $('<i class="icon fa">').addClass(name);
            });
        }

        var backlabels = {
            'device': true,
            'scenario': true
        };

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
                                    .append(
                                        $('<div class="icon-list">').append(addIcons(obj.icon)),
                                        $('<div class="title">').text(obj.title || obj.name || obj.id || '\xa0')
                                    )
                        );
                    });
                })
                // back button
                .prepend(
                    backlabels[type] ?
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
            type = this.$el.attr('data-type');

        // back button
        if (value === 'back') return this.parent.back();

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
            container = node.closest('[data-type]'),
            type = container.attr('data-type'),
            value = node.closest('[data-value]').attr('data-value');
        // back
        if (value === 'back') return data.wizard.back();
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
        ext.point(POINT).invoke('draw', container, { scenarios: list, config: config });
        // max width: supress resizing in case description is quite long
        var space = ((list.length + 1) * 160) + 32;
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
            return this;
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
                    back: false,
                    next: false,
                    width: 'auto',
                    minWidth: '504px'
                })
                .setSkippable(function () { return self.skip(this); })
                .on('before:show', drawDevices)
                .end()
                // scenarios
                .step({
                    attributes: { 'data-type': 'scenario', 'data-mode': 'simple' },
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

        render: function () {
            return new OnboardingView(config).run();
        },

        run: function () {
            return wizard.load().then(wizard.render);
        }
    };

    return wizard;
});
