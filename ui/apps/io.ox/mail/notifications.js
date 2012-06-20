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
define('io.ox/mail/notifications',
      ['io.ox/core/notifications/main',
       'io.ox/mail/api',
       'io.ox/mail/util',
       'io.ox/mail/view-notifications'], function (notificationService, mailApi, util, NotificationView) {

    'use strict';

    function register() {
        var notifications = notificationService.get('io.ox/mail', NotificationView);
        notifications.collection.shadow_collection = new Backbone.Collection([]);

        window.mail_not = notifications;

        mailApi.on('new-mail', function (e, mails) {
            window.col = notifications.collection;

            notifications.collection.shadow_collection.add(_(mails).clone());

            console.log("size before splice", notifications.collection.shadow_collection.size());
            var toFetch = _(notifications.collection.shadow_collection.models.splice(0, 3)).map(function (val) {
                return val.toJSON();
            });
            console.log("size after splice", notifications.collection.shadow_collection.size());


            console.log('TO FETCH', toFetch);
            mailApi.getMailsWithOptions(toFetch, {unseen: 'true', view: 'text'})
            //$.when.apply($, mailDFs)
                .done(function (data) {
                    /*var data = _(arguments).clone();*/
                    console.log('FETCHED MAILS', data.reverse());
                    var items = notifications.collection.toJSON();

                    _(data).each(function (mail) {
                        console.log('on each', mail);
                        var f = mail.from || [['', '']];
                        items.unshift({
                            title: util.getDisplayName(f[0]),
                            subject: mail.subject,
                            content: mail.attachments[0].content,
                            data: mail
                        });
                        if (items.length > 3) {
                            items.pop();
                        }
                    });

                    console.log('REST ITEMS', items);
                    // just reset at once
                    notifications.collection.reset(items);
                    console.log('fetched mails', arguments);
                });
        });
    }

    return {
        register: register
    };
});
