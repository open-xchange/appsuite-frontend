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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/onboarding/clients/view', [
    'io.ox/core/tk/wizard',
    'gettext!io.ox/core/onboarding',
    'less!io.ox/onboarding/clients/style'
], function (Wizard, gt) {

    'use strict';

    //
    // Helper: draw options
    //

    function drawOptions(type, collection) {
        return $('<ul class="onboarding-options">').append(function () {
            return collection.map(function (model) {
                return $('<li>').append(
                    $('<a href="#" tabindex="1">')
                        .attr('data-' + type, model.get('id'))
                        .addClass(model.get('enabled') ? '' : 'disabled' )
                        .append(
                            $('<i class="icon fa">').addClass(model.get('icon') || 'fa-circle'),
                            $('<div class="title">').text(model.get('title') || '\xa0')
                        ),
                    $('<div class="description">').text(model.get('description') || model.get('id') || '\xa0')
                );
            });
        });
    }

    //
    // Platform
    //

    function onSelectPlatform(e) {
        e.preventDefault();
        var platform = $(e.currentTarget).data('platform');
        this.getModel().set('platform', platform);
        this.trigger('next');
    }

    function drawPlatforms() {
        var list = this.getModel().get('platforms'),
            teaser = this.getModel().get('teaser');

        this.$('.wizard-title').css('white-space', 'pre').text(
            teaser.platform.replace(/!\s/, '!\n')
        );
        this.$('.wizard-content').addClass('onboarding-platform').empty().append(
            $('<p class="onboarding-teaser">').text(gt('Select the platform of your device:')),
            drawOptions('platform', list)
            .on('click', 'a', onSelectPlatform.bind(this))
        );
    }

    //
    // Device
    //

    function onSelectDevice(e) {
        e.preventDefault();
        var device = $(e.currentTarget).data('device');
        this.getModel().set('device', device);
        this.trigger('next');
    }

    function drawDevices() {
        var platform = this.getModel().get('platform');
        var list = this.getModel().getDevicesFor(platform);
        var teaser = this.getModel().get('teaser');
        this.$('.wizard-title').text(teaser.device);
        this.$('.wizard-content').empty().append(
            drawOptions('device', list)
            .on('click', 'a', onSelectDevice.bind(this))
        );
    }

    //
    // Module
    //

    function onSelectModule(e) {
        e.preventDefault();
        var module = $(e.currentTarget).data('module');
        this.getModel().set('module', module);
        this.trigger('next');
    }

    function drawModules() {
        var list = this.getModel().get('modules');
        var teaser = this.getModel().get('teaser');
        this.$('.wizard-title').text(teaser.module);
        this.$('.wizard-content').empty().append(
            drawOptions('module', list)
            .on('click', 'a', onSelectModule.bind(this))
        );
    }

    //
    // Selection
    //

    function onSelectSelection(e) {
        e.preventDefault();
        var selection = $(e.currentTarget).data('selection');
        this.getModel().set('selection', selection);
        this.trigger('next');
    }

    function drawSelections() {
        var device = this.getModel().get('device');
        var module = this.getModel().get('module');
        var list = this.getModel().getSelectionsFor(device, module);
        var teaser = this.getModel().get('teaser');
        this.$('.wizard-title').text(teaser.selection);
        this.$('.wizard-content').empty().append(
            drawOptions('selection', list)
            .on('click', 'a', onSelectSelection.bind(this))
        );
    }

    var OnboardingView = Backbone.View.extend({

        initialize: function (model, options) {
            var opt = _.extend({
                id:  'client-onboarding',
                title: gt('Client onboarding'),
                type: 'onboarding'
            }, options);
            // you can store any data you want; only 'id' is mandatory
            Wizard.registry.add(opt, this.render.bind(this));
            // init model
            this.model = model;
            this.opt = opt;
        },

        run: function () {
            Wizard.registry.run(this.opt.id);
        },

        render: function () {
            var wizard = this.wizard = new Wizard({ model: this.model }),
                self = this;
            // create wizard steps/pages
            wizard
                .step({ next: false, width: 'auto', minWidth: '504px' })
                    .on('before:show', drawPlatforms)
                    .end()
                .step({ next: false, width: 'auto', minWidth: '504px', labelBack: gt('Back to platforms') })
                    .title(gt('Select your device'))
                    .on('before:show', drawDevices)
                    .end()
                .step({ next: false, width: 'auto', minWidth: '504px', labelBack: gt('Back to devices') })
                    .on('before:show', drawModules)
                    .end()
                .step({ next: false, width: 'auto', minWidth: '504px', labelBack: gt('Back to modules') })
                    .on('before:show', drawSelections)
                    .end();
            // add some references to steps
            _.each(wizard.steps, function (step) {
                _.extend(step, {
                    view: self
                });
            });
            // render
            wizard.start();
        }

    });

    return OnboardingView;
});
