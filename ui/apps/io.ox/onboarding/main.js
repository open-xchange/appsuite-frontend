/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Maik Schäfer <maik.schaefer@open-xchange.com>
 */

define('io.ox/onboarding/main', [
    'io.ox/core/extensions',
    'io.ox/core/tk/wizard',
    'gettext!io.ox/core/onboarding',
    'less!io.ox/onboarding/style'
], function (ext, Wizard, gt) {
    'use strict';

    var title = gt('Connect your device'),
        platforms = ['Desktop', 'MacOs', 'Android', 'iPhone'],
        wizard;

    var ConnectDeviceView = Backbone.View.extend({

        initialize: function () {

            var options = {
                id: 'connect-wizard',
                title: title
            };
            Wizard.registry.add(options, this.render.bind(this));
            Wizard.registry.run(options.id);
        },

        // draw basic scaffold and containers for the wizard
        drawScaffold: function () {
            this.$('.wizard-title').text(title);
            this.$('.wizard-content').append($('<div class="progress-container">'));
            this.$('.wizard-footer').append($('<button type="button" class="btn-default close" data-action="close">'));
        },

        // draw and update progress steps
        // TODO: active Step detection, text updates
        drawProgress: function () {
            this.$('.progress-container').empty()
                .append($('<ul class="progress-steps">')
                    .append(
                        $('<li class="progress-step-one">').text('1').append($('<p class="progress-description">').text(gt('Platform'))),
                        $('<li class="progress-step-two">').text('2').append($('<p class="progress-description">').text(gt('App'))),
                        $('<li class="progress-step-three">').text('3').append($('<p class="progress-description">').text(gt('Setup')))
                    ));
        },

        render: function () {
            var connectTour = new Wizard(),
                self = this;

            connectTour.step({
                id: 'platform',
                back: false,
                next: false,
                minWidth: '600px'
            })
            .on('before:show', function () {
                this.$('.wizard-content').empty();
                self.drawScaffold.bind(this)();
                self.drawProgress.bind(this)();

                this.$('.wizard-content')
                    .append(
                        $('<div class="description">')
                        .append(
                            $('<p class="info">').text(gt('This wizard helps you to use App Suite on other devices.')),
                            $('<p class="prompt">').text(gt('Which device do you want to configure?'))
                        ),
                        $('<ul class="content-list">').append(
                            function () {
                                return platforms.map(
                                    function (plat) {
                                        return $('<li class="platform">')
                                            .attr('data-value', plat)
                                            .text(plat);
                                    }
                                );
                            }
                        )
                    );
            });

            connectTour.start();
        }
    });

    ext.point('io.ox/onboarding/main').extend({
        id: 'connect-wizard',
        index: 10
    });


    wizard = {
        run: function () {
            console.log(title);
            return new ConnectDeviceView();
        }
    };
    return wizard;

});
