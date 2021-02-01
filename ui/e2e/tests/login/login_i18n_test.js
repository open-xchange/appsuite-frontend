/// <reference path="../../steps.d.ts" />

Feature('Login > Switch translations');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7338] on form login page', function ({ I }) {
    I.amOnPage('ui');
    I.setCookie({ name: 'locale', value: 'en_US' });
    I.refreshPage();
    I.waitForFocus('#io-ox-login-username', 30);
    I.click('English');
    I.click('Italiano');
    I.waitForText('Nome utente');
});

Scenario('[OXUI-700] for guest users with password', async ({ I, users, dialogs }) => {
    await users.create();
    I.login('app=io.ox/files');
    const myfiles = locate('.folder-tree .folder-label').withText('My files');
    I.waitForElement(myfiles);
    I.selectFolder('Music');
    I.clickToolbar('Share');
    I.click('Create sharing link');
    dialogs.waitForVisible();
    I.waitForText('Sharing link created for folder');
    I.click('Password required');
    I.seeCheckboxIsChecked('Password required');
    I.fillField('Enter Password', 'CorrectHorseBatteryStaple');
    let url = await I.grabValueFrom('.share-wizard input[type="text"]');
    url = Array.isArray(url) ? url[0] : url;
    dialogs.clickButton('Close');
    I.waitForDetached('.modal-dialog');
    I.logout();
    I.amOnPage(url.replace(/^https?:\/\/[^/]+\//, '../'));
    I.waitForFocus('#io-ox-login-password');
    I.click('#io-ox-languages .dropdown > a');
    I.click('Deutsch (Deutschland)');
    I.waitForText('hat Ordner "Musik" für Sie freigegeben', 5);
    I.click('#io-ox-languages .dropdown > a');
    I.click('English (United States)');
    I.waitForText('has shared the folder "Music" with you', 5);
});
