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

    function iCalProbe(uri) {
        return http.PUT({
            module: 'chronos/account',
            params: {
                action: 'probe'
            },
            data: {
                'com.openexchange.calendar.provider': 'ical',
                'com.openexchange.calendar.config': {
                    uri: uri
                }
            }
        });
    }

    ext.point('io.ox/calendar/subscribe/ical').extend({
        id: 'input',
        index: 100,
        render: function () {
            this.$body.append(
                mini.getInputWithLabel('ical-url', gt('iCal URL'), this.model)
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
            iCalProbe(this.model.get('ical-url')).then(function (data) {
                data.module = 'event';
                return folderAPI.create('1', data);
            }).then(function () {
                notifications.yell('success', gt('iCal-feed has been imported successfully'));
                self.close();
            })['catch'](function (err) {
                notifications.yell(err);
                self.idle();
            });
        })
        .open();
    };

});
