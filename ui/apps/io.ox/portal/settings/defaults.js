/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Markus Bode <markus.bode@open-xchange.com>
 */

define('io.ox/portal/settings/defaults', [], function () {

    'use strict';

    var settingsDefaults = {
        widgets: {
            user: {
                mail_0: {
                    plugin: 'plugins/portal/mail/register',
                    color: 'blue',
                    index: 1
                },
                calendar_0: {
                    plugin: 'plugins/portal/calendar/register',
                    color: 'red',
                    index: 2
                },
                tasks_0: {
                    plugin: 'plugins/portal/tasks/register',
                    color: 'green',
                    index: 3
                },
                birthdays_0: {
                    plugin: 'plugins/portal/birthdays/register',
                    color: 'lightblue',
                    index: 4
                },
                facebook_0: {
                    plugin: 'plugins/portal/facebook/register',
                    color: 'blue',
                    index: 4
                },
                twitter_0: {
                    plugin: 'plugins/portal/twitter/register',
                    color: 'pink',
                    index: 5
                }
            }
        }
    };

    return settingsDefaults;
});
