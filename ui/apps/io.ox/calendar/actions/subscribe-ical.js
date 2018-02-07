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

    function iCalProbe(model) {
        var config = model.toJSON();
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
            var guid = _.uniqueId('form-control-label-');
            this.$body.append(
                $('<div class="credential-wrapper">').hide().append(
                    $('<div class="alert alert-warning">').text(
                        gt('Authentication failed. Please fill in login and password.')
                    ),
                    $('<div class="form-group">').append(
                        mini.getInputWithLabel('login', gt('Login'), this.model)
                    ),
                    $('<div class="form-group">').append(
                        $('<label>').attr('for', guid).text(gt('Password')),
                        new mini.PasswordView({ name: 'password', model: this.model, id: guid }).render().$el
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
            var self = this;
            iCalProbe(this.model).then(function (data) {
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
