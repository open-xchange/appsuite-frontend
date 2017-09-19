/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/chronos/settings/defaults', ['settings!io.ox/calendar'], function (calendarSettings) {

    'use strict';

    // use calendar settings as default then apply the needed changes for the chronos api
    // this way we can automatically convert old calendar settings to chronos settings
    var settingsDefaults = calendarSettings.get(),
        alarmTime = settingsDefaults.defaultReminder,
        alarmUnit = 'M';

    if (isNaN(parseInt(alarmTime, 10))) {
        var hasReminderWithTrigger = settingsDefaults.defaultReminder &&
            settingsDefaults.defaultReminder.length > 0 &&
            settingsDefaults.defaultReminder[0].trigger;
        settingsDefaults.defaultReminder = hasReminderWithTrigger ? settingsDefaults.defaultReminder : [];
    } else {

        if (alarmTime >= 10080) {
            alarmTime = alarmTime / 10080;
            alarmUnit = 'W';
        } else if (alarmTime >= 1440) {
            alarmTime = alarmTime / 1440;
            alarmUnit = 'D';
        } else if (alarmTime >= 60) {
            alarmTime = alarmTime / 60;
            alarmUnit = 'H';
        }

        settingsDefaults.defaultReminder = [{
            action: 'DISPLAY',
            description: '',
            trigger: { duration: '-PT' + alarmTime + alarmUnit, related: 'START' }
        }];
    }

    return settingsDefaults;
});
