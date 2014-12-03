/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/desktopNotifications', [
], function () {

    'use strict';

    var desktopNotifications,
        supported = !!Notification;

    //actually draws the message
    function draw(message) {
        //only show if page is hidden (minimized etc)
        //no need to show them otherwise
        //DOESNT WORK YET
        if (document.hidden) {
            return;
        }
        //defaults
        message = _.extend({
            title: '',
            body: ''
        }, message);
        var title = message.title,
            duration = message.duration,
            notification;
        message = _(message).omit('title duration');

        notification = new Notification(title, message);

        if (duration) {
            //firefox closes notifications automatically after 4s so there is no need to do this manually then
            //see https://bugzilla.mozilla.org/show_bug.cgi?id=875114
            if (!(_.device('firefox') && duration >= 4000)) {
                setTimeout(function () {
                    $(notification).trigger('close');
                }, duration);
            }
        }
    }

    desktopNotifications = {
        //possible results are 'default', 'granted', 'denied', 'unsupported'
        getPermissionStatus: function () {
            return supported ? Notification.permission : 'unsupported';
        },

        //returns true if the browser supports W3C desktop notifications (all major browsers do except Internet Explorer)
        isSupported: function () {
            return supported;
        },

        //used to require permission to show desktop notifications
        //just for convenience since the show function asks automatically if desktop notifications are supported
        requestPermission: function (callback) {
            if (supported) {
                Notification.requestPermission(callback);
            }
        },

        //shows desktop notifications if supported
        //automatically asks for permission
        show: function (message) {

            //if desktop notifications aren't supported stop here
            if (!supported) {
                return;
            }

            //get current permission status
            //only save locally because a user might have changed it in the meantime
            var permission = this.getPermissionStatus();

            if (permission === 'granted') {
                setTimeout(function () {
                    draw(message);
                }, 10000);
            } else if (permission === 'default') {
                //default means we haven't asked yet
                this.requestPermission(function (result) {
                    if (result === 'granted') {
                        draw(message);
                    }
                });
            }
        }
    };

    return desktopNotifications;
});
