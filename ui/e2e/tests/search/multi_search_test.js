/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Ejaz Ahmed <ejaz.ahmed@open-xchange.com>
 *
 */
/// <reference path="../../steps.d.ts" />

Feature('Mail > Search');

Before(async ({ users }) => {
    await users.create();
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('Supports delayed autoselect', async function ({ I, mail, search }) {

    I.login('app=io.ox/mail');
    mail.waitForApp();
    var query = 'my-input';

    I.say('enter query');
    I.click(search.locators.box);
    I.waitForVisible(search.locators.field);
    I.fillField(search.locators.field, query);

    I.dontSeeElement('.autocomplete-item');
    I.pressKey('Enter');

    I.say('check created token');
    I.waitForText(query, 2, '.token-label');
});
