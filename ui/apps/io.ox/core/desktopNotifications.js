/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/desktopNotifications', [
    'settings!io.ox/core',
    'io.ox/core/tk/visibility-api-util'
], function (settings, visibilityApi) {
    //see http://www.w3.org/TR/notifications for information

    'use strict';

    var desktopNotifications,
        // no support for smartphones
        supported = _.device('smartphone') ? false : !!window.Notification;

    //actually draws the message
    function draw(message) {
        //only show if page is hidden (minimized etc)
        //no need to show them otherwise
        //if visibility api is not supported, we always show desktop notifications because we cannot be sure
        if (!visibilityApi.isHidden && !message.ignoreVisibility && !message.forceDisplay) {
            return;
        }
        //defaults
        message = _.extend({
            title: '',
            body: '',
            duration: '4000'
        }, message);

        var title = message.title,
            duration = message.duration,
            notification,
            //yes the web notification standard events are not in camel case
            onclose = message.onclose, onshow = message.onshow, onclick = message.onclick, onerror = message.onerror;
        message = _(message).omit('title duration ignoreVisibility onclick onclose onshow onerror');

        notification = new Notification(title, message);
        //assign events
        if (onclose) { notification.onclose = onclose; }
        if (onshow) { notification.onshow = onshow; }
        if (onclick) { notification.onclick = onclick; }
        if (onerror) { notification.onerror = onerror; }

        if (duration) {
            //firefox closes notifications automatically after 4s so there is no need to do this manually then
            //see https://bugzilla.mozilla.org/show_bug.cgi?id=875114
            if (!(_.device('firefox') && duration >= 4000)) {
                //use timeout on show to start timeout when the notification is actually shown (might be in waiting queue)
                notification.onshow = function () {
                    setTimeout(function () {
                        $(notification).trigger('close');
                    }, duration);
                    //call given onshow if there is one
                    if (onshow) {
                        onshow.call(arguments, this);
                    }
                };
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
                // https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-powerful-features-on-insecure-origins
                Notification.requestPermission(callback);
            } else {
                callback('unsupported');
            }
        },

        /*shows desktop notifications if supported and user permission was granted
        supports 4 types of parameter configurations for maximum compatibility:

        messageObject e.g. {title: 'abc', body: 'hey', icon: ...}
        title, options e.g. 'abc', {body: 'hey', icon: ...} (standard w3c parameter list)
        title, body e.g. 'abc', 'hey'
        title e.g. 'abc' */
        show: function (message) {
            //if desktop notifications aren't supported or not wanted stop here
            if (!message || !supported || !settings.get('showDesktopNotifications', true)) {
                return;
            }

            //check parameter configurations
            if (arguments.length === 2) {
                if (_.isString(arguments[0]) && _.isString(arguments[1])) {
                    //title, body
                    message = { title: message, body: arguments[1] };
                } else {
                    //title, options
                    arguments[1].title = message;
                    message = arguments[1];
                }
            } else if (_.isString(message)) {
                //only title is given
                message = { title: message };
            }

            //get current permission status
            //only save locally because a user might have changed it in the meantime
            var permission = this.getPermissionStatus();

            if (permission === 'granted') {
                draw(message);
            }
            // code is used to automatically ask for permission, was removed in US 97886096
            /* else if (permission === 'default') {
                //default means we haven't asked yet
                this.requestPermission(function (result) {
                    if (result === 'granted') {
                        draw(message);
                    }
                });
            }*/
        }
    };

    return desktopNotifications;
});
