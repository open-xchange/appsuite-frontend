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
    'gettext!io.ox/calendar',
    'settings!io.ox/calendar'
], function (notifications, ext, ModalDialog, mini, http, folderAPI, gt, settings) {

    'use strict';

    function iCalProbe(model) {
        var config = { uri: model.get('uri') };
        if (model.get('ical-user')) config.login = model.get('ical-user');
        if (model.get('ical-pw')) config.password = model.get('ical-pw');
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
        id: 'hidden',
        index: 200,
        render: function () {
            this.$body.append(
                // prepend these to inputs to capture autofill in most browsers if the user has saved his credentials
                $('<input type="text">').hide(),
                $('<input type="password">').hide()
            );
        }
    });

    ext.point('io.ox/calendar/subscribe/ical').extend({
        id: 'alert',
        index: 300,
        render: function (baton) {
            if (!baton.data.type) return;
            if (!baton.data.text) return;

            this.$body.append(
                $('<div class="alert">').addClass('alert-' + baton.data.type).text(
                    baton.data.text
                )
            );
        }
    });

    ext.point('io.ox/calendar/subscribe/ical').extend({
        id: 'login',
        index: 400,
        render: function (baton) {
            if (!baton.data.showLogin) return;

            var guid = _.uniqueId('form-control-label-');
            this.$body.append(
                $('<div class="form-group">').append(
                    $('<label>').attr('for', guid).text(gt('Login')),
                    new mini.InputView({ name: 'ical-user', model: this.model, id: guid, autocomplete: false }).render().$el
                )
            );
        }
    });

    ext.point('io.ox/calendar/subscribe/ical').extend({
        id: 'password',
        index: 500,
        render: function (baton) {
            if (!baton.data.showPassword) return;

            var guid = _.uniqueId('form-control-label-');
            this.$body.append(
                $('<div class="form-group">').append(
                    $('<label>').attr('for', guid).text(gt('Password')),
                    new mini.PasswordView({ name: 'ical-pw', model: this.model, id: guid, autocomplete: false }).render().$el
                )
            );
        }
    });

    ext.point('io.ox/calendar/subscribe/ical').extend({
        id: 'alarms',
        index: 600,
        render: function () {
            this.$body.append(
                $('<div class="alert alert-info">').text(gt('Your default reminders will be applied to this calendar.'))
            );
        }
    });

    return function () {
        new ModalDialog({
            title: gt('Subscribe to iCal feed'),
            point: 'io.ox/calendar/subscribe/ical',
            help: 'ox.appsuite.user.sect.calendar.folder.subscribe.html',
            model: new Backbone.Model(),
            focus: 'input',
            async: true,
            width: 500
        })
        .addCancelButton()
        .addButton({ label: gt('Subscribe'), action: 'subscribe' })
        .on('subscribe', function () {
            var self = this;
            iCalProbe(this.model).then(function (data) {
                data.module = 'event';
                // apply default alarms
                data['com.openexchange.calendar.config'] = _.extend({}, data['com.openexchange.calendar.config'], {
                    defaultAlarmDate: settings.get('chronos/defaultAlarmDate', []),
                    defaultAlarmDateTime: settings.get('chronos/defaultAlarmDateTime', [])
                });

                return folderAPI.create('1', data);
            }).then(function () {
                notifications.yell('success', gt('iCal feed has been imported successfully'));
                self.close();
            }).catch(function (err) {
                if (/^ICAL-PROV-401(0|1|2|3)$/.test(err.code)) {
                    // trigger rerendering
                    var data = {
                            text: err.error,
                            type: /^ICAL-PROV-401(0|2)$/.test(err.code) ? 'warning' : 'danger',
                            showLogin: /^ICAL-PROV-401(0|1)$/.test(err.code),
                            showPassword: true
                        },
                        baton = new ext.Baton({ view: self, model: self.model, data: data });
                    self.$body.empty();
                    self.point.invoke('render', self, baton);
                } else {
                    notifications.yell(err);
                }
                self.idle();
            });
        })
        .open();
    };

});
