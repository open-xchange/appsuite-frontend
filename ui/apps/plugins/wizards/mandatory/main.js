/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define.async('plugins/wizards/mandatory/main', [
    'io.ox/core/extensions',
    'io.ox/core/tk/wizard',
    'io.ox/backbone/mini-views/common',
    'io.ox/backbone/mini-views/timezonepicker',
    'io.ox/core/api/user',
    'settings!io.ox/core',
    'gettext!io.ox/wizards/firstStart'
], function (ext, Tour, mini, TimezonePicker, userAPI, settings, gt) {

    'use strict';

    return userAPI.getCurrentUser().then(function (user) {

        ext.point('io.ox/firstStartWizard').extend({
            id: 'intialize',
            index: 'first',
            setup: function () {
                Tour.registry.add({
                    id: 'firstStartWizard'
                }, function () {

                    var tour = new Tour(),
                        def = $.Deferred(),
                        baton = ext.Baton.ensure(tour);

                    baton.tour = tour;
                    ext.point('io.ox/firstStartWizard/steps').invoke('setup', tour, baton);

                    tour.on('stop', function (reason) {
                        if (reason && reason.cancel) {
                            def.reject();
                        } else {
                            user.save();
                            settings.save();
                            // normally this could cause problems but at this early stage no app is loaded, so it should work
                            moment.tz.setDefault(settings.get('timezone'));
                            def.resolve();
                        }
                    });
                    return def;
                });
            }
        });

        ext.point('io.ox/firstStartWizard/steps').extend({
            id: 'welcome',
            index: 100,
            setup: function () {
                var tour = this;
                this.step()
                    .mandatory()
                    .title(gt('Welcome to %s', ox.serverConfig.productName))
                    .content(gt('Before you can continue using the product, you have to enter some basic information. It will take less than a minute.'))
                    .beforeShow(function () {
                        var step = this;
                        step.footer($('<button type="button" class="btn pull-left">')
                            .text(gt('Back to sign in'))
                            .on('click', function () {
                                tour.trigger('stop', { cancel: true });
                            })
                        );
                    })
                    .end();
            }
        });

        ext.point('io.ox/firstStartWizard/steps').extend({
            id: 'your_name',
            index: 200,
            setup: function () {
                this.step()
                    .mandatory()
                    .title(gt('Your name'))
                    .content($('<form class="form-horizontal" />').append(
                        $('<div class="control-group" />').append(
                            $('<label class="control-label" for="first_name" />').text(gt('First name')),
                            $('<div class="controls" />').append(
                                new mini.InputView({ name: 'first_name', model: user }).render().$el
                            )
                        ),
                        $('<div class="control-group" />').append(
                            $('<label class="control-label" for="last_name" />').text(gt('Last name')),
                            $('<div class="controls" />').append(
                                new mini.InputView({ name: 'last_name', model: user }).render().$el
                            )
                        )
                    ))
                    .beforeShow(function () {
                        var step = this;
                        //reset name, because we want to start without any previous data
                        user.set('first_name');
                        user.set('last_name');
                        step.toggleNext(false);
                        step.parent.options.model.set('paused', [1]);
                        user.on('change', function () {
                            var isComplete = !_.isEmpty($.trim(user.get('first_name'))) && !_.isEmpty($.trim(user.get('last_name')));
                            if (isComplete && _.device('smartphone')) {
                                step.parent.options.model.set('paused', []);
                                return;
                            }
                            step.toggleNext(isComplete);
                        });
                    })
                    .on('show', function () {
                        this.$el.find('input:first').focus();
                    })
                    .end();
            }
        });

        ext.point('io.ox/firstStartWizard/steps').extend({
            id: 'timezone',
            index: 300,
            setup: function () {
                this.step()
                    .mandatory()
                    .title(gt('Your timezone'))
                    .content(new TimezonePicker({ name: 'timezone', model: settings }).render().$el)
                    .end();
            }
        });

        ext.point('io.ox/firstStartWizard/steps').extend({
            id: 'start_tour',
            index: 'last',
            setup: function () {
                this.start();
            }
        });
        ext.point('io.ox/firstStartWizard').invoke('setup');
    });

});
