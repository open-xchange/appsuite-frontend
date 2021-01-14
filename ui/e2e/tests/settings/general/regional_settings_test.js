
/// <reference path="../../../steps.d.ts" />

Feature('Settings > Basic');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

const moment = require('moment');
const expect = require('chai').expect;

Scenario.skip('[C287824] Regional settings', async ({ I, dialogs }) => {

    // #1 #2 - login, open basic settings
    I.login('app=io.ox/settings', 'folder=virtual/settings/');
    I.waitForText('Basic settings');

    // #3 open more regional settings and verify available options
    I.waitForText('More regional settings ...');
    I.click('More regional settings ...');
    dialogs.waitForVisible();
    I.see('Time format');
    I.see('Date format');
    I.see('Number format');
    I.see('First day of the week');
    I.see('First week of the year');

    // #4 change the values of each field,
    I.selectOption('Time format', 'HH.mm.ss');
    I.selectOption('Date format', 'yyyy-MM-dd');
    I.selectOption('Number format', '1234,56');
    I.selectOption('First day of the week', 'saturday');
    I.selectOption('First week of the year', '4'); //Week that contains January 4th (e.g. Europe, ISO-8601)

    // #5 + #6 save the cahnges and refresh
    dialogs.clickButton('Save');
    I.wait(5);
    I.refreshPage();
    // #7 verify the changes (The test states to verify the changes by going through each app)
    // We will verify those changes by checking the string below the "regional settings" button
    const today = moment().format('dddd, YYYY-MM-DD');
    const regex = today + '\\s*[0-9]{2}.[0-9]{2}\\s* 1234\\,56\\s*First day of the week: Saturday';

    expect(await I.grabTextFrom('.locale-example')).to.match(
        new RegExp(regex)
    );

});
