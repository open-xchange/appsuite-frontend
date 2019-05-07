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

Scenario('[C7497] Daytime within Greeting', async (I) => {

    const expect = require('chai').expect;
    const moment = require('moment');

    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    await I.haveSetting('io.ox/core//showDesktopNotifications', false);

    I.login('app=io.ox/portal');
    I.waitForVisible('.io-ox-portal');
    I.waitForVisible('.greeting-phrase');

    //Get greeting
    const greeting = await I.grabTextFrom('.greeting-phrase');
    const currenttime =  moment().format('HHmmss');

    if (currenttime >= 180000 && currenttime < 230000) {
        //23:00-24:00 stimmt nicht
        expect(greeting).to.have.string('Good evening');
        // Change time zone to -07:00
        I.click('#io-ox-topbar-dropdown-icon');
        I.waitForVisible('#topbar-settings-dropdown');
        I.click('#topbar-settings-dropdown a[data-name="io.ox/settings"]');
        I.waitForText('Basic settings');
        I.waitForText('Time zone');
        I.selectOption('select[name="timezone"]', 'US/Pacific'); // -7
        I.waitForVisible('.io-ox-alert');
        I.logout();
        I.login();
        I.openApp('Portal');
        I.waitForVisible('.greeting-phrase');

        //Verify greeting
        const updated_greeting_7 = await I.grabTextFrom('.greeting-phrase');
        expect(updated_greeting_7).to.have.string('Hello');

        // Change time zone to +05:00
        I.click('#io-ox-topbar-dropdown-icon');
        I.waitForVisible('#topbar-settings-dropdown');
        I.click('#topbar-settings-dropdown a[data-name="io.ox/settings"]');
        I.waitForText('Basic settings');
        I.waitForText('Time zone');
        I.selectOption('select[name="timezone"]', 'Antarctica/Mawson'); // +5
        I.waitForVisible('.io-ox-alert');
        I.logout();
        I.login();
        I.openApp('Portal');
        I.waitForVisible('.greeting-phrase');

        //Verify greeting
        const updated_greeting_5 = await I.grabTextFrom('.greeting-phrase');
        expect(updated_greeting_5).to.have.string('Hello');
    } else if (currenttime >= 230000 || currenttime < 40000) {

        expect(greeting).to.have.string('Hello');
        // Change time zone to -04:00
        I.click('#io-ox-topbar-dropdown-icon');
        I.waitForVisible('#topbar-settings-dropdown');
        I.click('#topbar-settings-dropdown a[data-name="io.ox/settings"]');
        I.waitForText('Basic settings');
        I.waitForText('Time zone');
        I.selectOption('select[name="timezone"]', 'America/Aruba'); //-4
        I.waitForVisible('.io-ox-alert');
        I.logout();
        I.login();
        I.openApp('Portal');
        I.waitForVisible('.greeting-phrase');

        //Verify greeting
        const updated_greeting_7 = await I.grabTextFrom('.greeting-phrase');
        expect(updated_greeting_7).to.have.string('Good evening');

        // Change time zone to +07:00
        I.click('#io-ox-topbar-dropdown-icon');
        I.waitForVisible('#topbar-settings-dropdown');
        I.click('#topbar-settings-dropdown a[data-name="io.ox/settings"]');
        I.waitForText('Basic settings');
        I.waitForText('Time zone');
        I.selectOption('select[name="timezone"]', 'Asia/Tomsk'); // +7
        I.waitForVisible('.io-ox-alert');
        I.logout();
        I.login();
        I.openApp('Portal');
        I.waitForVisible('.greeting-phrase');

        //Verify greeting
        const updated_greeting_5 = await I.grabTextFrom('.greeting-phrase');
        expect(updated_greeting_5).to.have.string('Good morning');
    } else if (currenttime >= 40000 && currenttime < 60000) {
        expect(greeting).to.have.string('Good morning');

        // Change time zone to -04:00
        I.click('#io-ox-topbar-dropdown-icon');
        I.waitForVisible('#topbar-settings-dropdown');
        I.click('#topbar-settings-dropdown a[data-name="io.ox/settings"]');
        I.waitForText('Basic settings');
        I.waitForText('Time zone');
        I.selectOption('select[name="timezone"]', 'Cuba'); // -4
        I.waitForVisible('.io-ox-alert');
        I.logout();
        I.login();
        I.openApp('Portal');
        I.waitForVisible('.greeting-phrase');

        //Verify greeting
        const updated_greeting_4 = await I.grabTextFrom('.greeting-phrase');
        expect(updated_greeting_4).to.have.string('Hello');

        // Change time zone to +09:00
        I.click('#io-ox-topbar-dropdown-icon');
        I.waitForVisible('#topbar-settings-dropdown');
        I.click('#topbar-settings-dropdown a[data-name="io.ox/settings"]');
        I.waitForText('Basic settings');
        I.waitForText('Time zone');
        I.selectOption('select[name="timezone"]', 'Japan'); // +9
        I.waitForVisible('.io-ox-alert');
        I.logout();
        I.login();
        I.openApp('Portal');
        I.waitForVisible('.greeting-phrase');

        //Verify greeting
        const updated_greeting_9 = await I.grabTextFrom('.greeting-phrase');
        expect(updated_greeting_9).to.have.string('Hello');

    } else if (currenttime >= 60000 && currenttime < 110000) {

        expect(greeting).to.have.string('Good morning');
        // Change time zone to -07:00
        I.click('#io-ox-topbar-dropdown-icon');
        I.waitForVisible('#topbar-settings-dropdown');
        I.click('#topbar-settings-dropdown a[data-name="io.ox/settings"]');
        I.waitForText('Basic settings');
        I.waitForText('Time zone');
        I.selectOption('select[name="timezone"]', 'US/Pacific'); // -7
        I.waitForVisible('.io-ox-alert');
        I.logout();
        I.login();
        I.openApp('Portal');
        I.waitForVisible('.greeting-phrase');

        //Verify greeting
        const updated_greeting_9 = await I.grabTextFrom('.greeting-phrase');
        expect(updated_greeting_9).to.have.string('Hello');

        // Change time zone to +05:00
        I.click('#io-ox-topbar-dropdown-icon');
        I.waitForVisible('#topbar-settings-dropdown');
        I.click('#topbar-settings-dropdown a[data-name="io.ox/settings"]');
        I.waitForText('Basic settings');
        I.waitForText('Time zone');
        I.selectOption('select[name="timezone"]', 'Antarctica/Mawson'); // +5
        I.waitForVisible('.io-ox-alert');
        I.logout();
        I.login();
        I.openApp('Portal');
        I.waitForVisible('.greeting-phrase');

        //Verify greeting
        const updated_greeting_5 = await I.grabTextFrom('.greeting-phrase');
        expect(updated_greeting_5).to.have.string('Hello');

    } else if (currenttime >= 110000 && currenttime < 160000) {

        expect(greeting).to.have.string('Hello');

        // Change time zone to -07:00
        I.click('#io-ox-topbar-dropdown-icon');
        I.waitForVisible('#topbar-settings-dropdown');
        I.click('#topbar-settings-dropdown a[data-name="io.ox/settings"]');
        I.waitForText('Basic settings');
        I.waitForText('Time zone');
        I.selectOption('select[name="timezone"]', 'US/Pacific'); // -7
        I.waitForVisible('.io-ox-alert');
        I.logout();
        I.login();
        I.openApp('Portal');
        I.waitForVisible('.greeting-phrase');

        //Verify greeting
        const updated_greeting_7 = await I.grabTextFrom('.greeting-phrase');
        expect(updated_greeting_7).to.have.string('Good morning');
        // Change time zone to +09:00
        I.click('#io-ox-topbar-dropdown-icon');
        I.waitForVisible('#topbar-settings-dropdown');
        I.click('#topbar-settings-dropdown a[data-name="io.ox/settings"]');
        I.waitForText('Basic settings');
        I.waitForText('Time zone');
        I.selectOption('select[name="timezone"]', 'Japan'); // +9
        I.waitForVisible('.io-ox-alert');
        I.logout();
        I.login();
        I.openApp('Portal');
        I.waitForVisible('.greeting-phrase');

        //Verify greeting
        const updated_greeting_9 = await I.grabTextFrom('.greeting-phrase');
        expect(updated_greeting_9).to.have.string('Good evening');

    } else {
        expect(greeting).to.have.string('Hello');

        // Change time zone to -09:00
        I.click('#io-ox-topbar-dropdown-icon');
        I.waitForVisible('#topbar-settings-dropdown');
        I.click('#topbar-settings-dropdown a[data-name="io.ox/settings"]');
        I.waitForText('Basic settings');
        I.waitForText('Time zone');
        I.selectOption('select[name="timezone"]', 'America/Atka'); // -9
        I.waitForVisible('.io-ox-alert');
        I.logout();
        I.login();
        I.openApp('Portal');
        I.waitForVisible('.greeting-phrase');

        //Verify greeting
        const updated_greeting_9 = await I.grabTextFrom('.greeting-phrase');
        expect(updated_greeting_9).to.have.string('Good morning');

        // Change time zone to +05:00
        I.click('#io-ox-topbar-dropdown-icon');
        I.waitForVisible('#topbar-settings-dropdown');
        I.click('#topbar-settings-dropdown a[data-name="io.ox/settings"]');
        I.waitForText('Basic settings');
        I.waitForText('Time zone');
        I.selectOption('select[name="timezone"]', 'Antarctica/Mawson'); // +5
        I.waitForVisible('.io-ox-alert');
        I.logout();
        I.login();
        I.openApp('Portal');
        I.waitForVisible('.greeting-phrase');

        //Verify greeting
        const updated_greeting_5 = await I.grabTextFrom('.greeting-phrase');
        expect(updated_greeting_5).to.have.string('Good evening');
    }
});

