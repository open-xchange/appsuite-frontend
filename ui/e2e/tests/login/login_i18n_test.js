/// <reference path="../../steps.d.ts" />

Feature('Login > Switch translations');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C7338] on form login page', function (I) {
    I.amOnPage('ui');
    I.setCookie({ name: 'locale', value: 'en_US' });
    I.refreshPage();
    I.waitForFocus('#io-ox-login-username', 30);
    I.click('English');
    I.click('Italiano');
    I.waitForText('Nome utente');
});

Scenario('[OXUI-700] for guest users with password', async (I, users, dialogs) => {
    await users.create();
    I.login('app=io.ox/files');
    const myfiles = locate('.folder-tree .folder-label').withText('My files');
    I.waitForElement(myfiles);
    I.selectFolder('Music');
    I.clickToolbar('Share');

    dialogs.waitForVisible();
    I.selectOption('.form-group select', 'Anyone with the link and invited people');
    I.waitForText('Anyone with the link and invited people');
    I.waitForText('Copy link');
    I.wait(0.2);
    I.waitForEnabled('.settings-button');
    I.click('.settings-button');
    dialogs.waitForVisible();
    I.fillField('Password', 'CorrectHorseBatteryStaple');
    dialogs.clickButton('Save');

    I.waitForText('Copy link');
    I.click('Copy link');
    I.waitForText('The link has been copied to the clipboard', 5, '.io-ox-alert');
    let link = await I.grabValueFrom('.public-link-url-input');
    link = Array.isArray(link) ? link[0] : link;
    dialogs.clickButton('Share');
    I.waitForDetached('.modal-dialog');
    I.logout();

    I.amOnPage(link.replace(/^https?:\/\/[^/]+\//, '../'));
    I.waitForFocus('#io-ox-login-password');
    I.click('#io-ox-languages .dropdown > a');
    I.click('Deutsch (Deutschland)');
    I.waitForText('hat Ordner "Musik" für Sie freigegeben', 5);
    I.click('#io-ox-languages .dropdown > a');
    I.click('English (United States)');
    I.waitForText('has shared the folder "Music" with you', 5);
});
