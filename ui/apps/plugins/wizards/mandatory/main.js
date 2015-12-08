/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define.async('plugins/wizards/mandatory/main', [
    'io.ox/core/tk/wizard',
    'io.ox/backbone/mini-views/common',
    'io.ox/backbone/mini-views/timezonepicker',
    'io.ox/core/api/user',
    'settings!io.ox/core',
    'gettext!io.ox/wizards/firstStart'
], function (Tour, mini, TimezonePicker, userAPI, settings, gt) {

    'use strict';

    return userAPI.getCurrentUser().then(function (user) {

        Tour.registry.add({
            id: 'firstStartWizard'
        }, function () {

            //reset name, because we want to start without any previous data
            user.set('first_name');
            user.set('last_name');

            var tour = new Tour(),
                def = $.Deferred(),
                tzModel = settings.createModel(Backbone.Model);

            tour.on('stop', function (reason) {
                if (reason && reason.cancel) {
                    def.reject();
                } else {
                    user.save();
                    settings.save();
                    def.resolve();
                }
            });

            tour
            .step()
                .mandatory()
                .title(gt.format(gt('Welcome to %s'), ox.serverConfig.productName))
                .content(gt('Before you can continue using the product, you have to enter some basic information. It will take less than a minute.'))
                .footer($('<button class="btn wizard-close pull-left" tabindex="1">')
                    .text(gt('Back to sign in'))
                    .on('click', function () {
                        def.reject();
                        tour.stop();
                    })
                )
                .end()
            .step()
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
                    step.toggleNext(false);
                    user.on('change', function () {
                        step.toggleNext(!_.isEmpty($.trim(user.get('first_name'))) && !_.isEmpty($.trim(user.get('last_name'))));
                    });
                })
                .on('show', function () {
                    this.$el.find('input:first').focus();
                })
                .end()
            .step()
                .mandatory()
                .title(gt('Your timezone'))
                .content(new TimezonePicker({ name: 'timezone', model: tzModel }).render().$el)
                .end()
            .start();

            return def;
        });
    });

});
