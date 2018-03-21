/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 *
 */

define('io.ox/calendar/actions/subscribe-ical', [
    'io.ox/core/notifications',
    'io.ox/core/extensions',
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/http',
    'io.ox/core/folder/api',
    'gettext!io.ox/calendar'
], function (notifications, ext, ModalDialog, mini, http, folderAPI, gt) {

    'use strict';

    function iCalProbe(model, sendCredentials) {
        var config = { uri: model.get('uri') };
        if (sendCredentials && model.get('ical-user')) config.login = model.get('ical-user');
        if (sendCredentials && model.get('ical-pw')) config.password = model.get('ical-pw');
        return http.PUT({
            module: 'chronos/account',
            params: {
                action: 'probe'
            },
            data: {
                'com.openexchange.calendar.provider': 'ical',
                'com.openexchange.calendar.config': config
            }
        });
    }

    ext.point('io.ox/calendar/subscribe/ical').extend({
        id: 'input',
        index: 100,
        render: function () {
            this.$body.append(
                $('<div class="form-group">').append(
                    mini.getInputWithLabel('uri', gt('iCal URL'), this.model)
                )
            );
        }
    });

    ext.point('io.ox/calendar/subscribe/ical').extend({
        id: 'credentials',
        index: 200,
        render: function () {
            var guid;
            this.$body.append(
                $('<form class="credential-wrapper" autocomplete="off">').hide().append(
                    // prepend these to inputs to capture autofill in most browsers if the user has saved his credentials
                    $('<input type="text">').hide(),
                    $('<input type="password">').hide(),
                    $('<div class="alert alert-warning">').text(
                        gt('Authentication failed. Please fill in login and password.')
                    ),
                    $('<div class="form-group">').append(
                        $('<label>').attr('for', guid = _.uniqueId('form-control-label-')).text(gt('Login')),
                        new mini.InputView({ name: 'ical-user', model: this.model, id: guid, autocomplete: false }).render().$el
                    ),
                    $('<div class="form-group">').append(
                        $('<label>').attr('for', guid = _.uniqueId('form-control-label-')).text(gt('Password')),
                        new mini.PasswordView({ name: 'ical-pw', model: this.model, id: guid, autocomplete: false }).render().$el
                    )
                )
            );
        }
    });

    return function () {
        new ModalDialog({
            title: gt('Subscribe to iCal feed'),
            point: 'io.ox/calendar/subscribe/ical',
            model: new Backbone.Model(),
            async: true,
            width: 500
        })
        .addCancelButton()
        .addButton({ label: 'Subscribe', action: 'subscribe' })
        .on('subscribe', function () {
            var self = this,
                sendCredentials = self.$('.credential-wrapper').is(':visible');
            iCalProbe(this.model, sendCredentials).then(function (data) {
                data.module = 'event';
                return folderAPI.create('1', data);
            }).then(function () {
                notifications.yell('success', gt('iCal-feed has been imported successfully'));
                self.close();
            })['catch'](function (err) {
                if (err.code === 'CAL-4010') self.$('.credential-wrapper').show();
                else notifications.yell(err);
                self.idle();
            });
        })
        .open();
    };

});
