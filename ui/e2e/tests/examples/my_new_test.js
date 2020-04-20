/// <reference path="../../steps.d.ts" />
Feature('My contact form');

Before(async (users) => {
    await users.create();
});

Scenario('[C31337] Contact form test', async (users, I, contacts, mail) => {
    I.login();
    contacts.editMyContact();
    I.waitForText('First name');
    I.fillField('First name', 'Malaclypse');
    I.click('Add personal info');
    I.click('Middle name');
    I.fillField('Middle name', 'the');
    I.fillField('Last name', 'Younger');
    I.click('Save');
    mail.newMail();
    I.click('~Save and close');
    contacts.editMyContact();
    I.click('.form-group[data-field="second_name"] button[title="Remove field"]');
    I.fillField('Last name', 'the Younger');
    I.click('Save');
    mail.newMail();
    I.click('~Save and close');
    I.logout();
    I.login();
    mail.newMail();
    I.see('Malaclypse the Younger');
    I.click('~Save and close');
    I.logout();
});

After(async (users) => {
    await users.removeAll();
});
