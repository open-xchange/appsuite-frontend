/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Olena Stute <olena.stute@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('Portal');

Before(async (users) => {
    await users.create();
});
After(async (users) => {
    await users.removeAll();
});

Scenario('[C7497] Daytime within Greeting', async (I, topbar) => {

    const moment = require('moment');
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    await I.haveSetting('io.ox/core//showDesktopNotifications', false);

    let currentHour = moment().hour(),
        counter = 0;
    const timeZones = ['America/Vancouver', 'Antarctica/Mawson', 'America/Barbados',
        'Asia/Tomsk', 'America/Havana', 'Asia/Tokyo'];

    function checkTime() {
        if (currentHour >= 4 && currentHour <= 11) {
            I.see('Good morning', '.greeting-phrase');
        } else if (currentHour >= 18 && currentHour <= 23) {
            I.see('Good evening', '.greeting-phrase');
        } else {
            I.see('Hello', '.greeting-phrase');
        }
    }
    function changeTimezoneAndGoToPortal(timezone) {
        topbar.settings();
        I.waitForText('Time zone');
        I.selectOption('Time zone', timezone); // -7
        I.waitForVisible('.io-ox-alert');
        I.openApp('Portal');
        I.refreshPage();
        I.waitForVisible('.greeting-phrase');
    }
    async function updateCurrentTime() {
        return await I.executeScript(function () {
            return moment().hour();
        });
    }

    I.login('app=io.ox/portal');
    I.waitForVisible('.io-ox-portal');
    I.waitForVisible('.greeting-phrase');

    checkTime();

    while (counter < timeZones.length) {
        changeTimezoneAndGoToPortal(timeZones[counter]);
        currentHour = await updateCurrentTime();
        checkTime();
        counter++;
    }

});

