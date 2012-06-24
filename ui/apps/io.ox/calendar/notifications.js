/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
define('io.ox/calendar/notifications',
      ['io.ox/core/notifications/main',
       'io.ox/calendar/api',
       'io.ox/calendar/util',
       'io.ox/calendar/view-notifications'], function (notificationService, calApi, util, NotificationView) {

    'use strict';

    function register() {
        var notifications = notificationService.get('io.ox/calendar', NotificationView);
        calApi.on('invites', function (e, invites) {
            notifications.collection.reset([]);
            _(invites).each(function (invite) {
                notifications.collection.unshift({
                    title: invite.location,
                    subject: invite.title,
                    data: invite
                });
            });
        });
    }

    return {
        register: register
    };
});

