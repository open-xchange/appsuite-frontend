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

const moment = require('moment');
const _ = require('underscore');

Feature('Portal');

Before(async ({ users }) => {
    await users.create();
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7492] Birthday', async ({ I }) => {

    // Create a contact with birthday
    const contactFolderID = await I.grabDefaultFolder('contacts');

    const contacts = _.each([{
        first_name: 'Third',
        last_name: 'Puff',
        birthday: moment().add(30, 'days').valueOf()
    }, {
        first_name: 'Second',
        last_name: 'Paff',
        birthday: moment().add(3, 'days').valueOf()
    }, {
        first_name: 'First',
        last_name: 'Piff',
        birthday: moment().add(2, 'days').valueOf()
    }], async function (contact) {
        contact['display_name'] = `${contact.last_name}, ${contact.first_name}`;
        await I.haveContact({
            folder_id: contactFolderID,
            first_name: contact.first_name,
            last_name: contact.last_name,
            display_name: contact.display_name,
            birthday: contact.birthday
        });
    });

    // clear the portal settings
    await I.haveSetting('io.ox/portal//widgets/user', '{}');

    //Add Birthday widget to Portal
    I.login('app=io.ox/portal');
    I.waitForVisible('.io-ox-portal');
    I.click('Add widget');
    I.waitForVisible('.io-ox-portal-settings-dropdown');
    I.click('Birthdays');

    // verify contacts displays with the most recent birthday date first
    I.waitForElement('~Birthdays');
    I.waitForElement('.widget[aria-label="Birthdays"] ul li');
    I.see('Piff, First', '.widget[aria-label="Birthdays"] ul li:nth-child(1)');
    I.see('Paff, Second', '.widget[aria-label="Birthdays"] ul li:nth-child(2)');
    I.see('Puff, Third', '.widget[aria-label="Birthdays"] ul li:nth-child(3)');

    // display list of birthdays and contact
    I.click('~Birthdays');
    I.waitForVisible('.io-ox-sidepopup .io-ox-portal-birthdays');
    I.seeElement('.picture', locate('.io-ox-sidepopup .io-ox-portal-birthdays .birthday').withText('Piff, First'));
    I.seeElement('.picture', locate('.io-ox-sidepopup .io-ox-portal-birthdays .birthday').withText('Paff, Second'));
    I.seeElement('.picture', locate('.io-ox-sidepopup .io-ox-portal-birthdays .birthday').withText('Puff, Third'));

    I.see('Piff, First', '.io-ox-sidepopup .io-ox-portal-birthdays');
    I.see('Paff, Second', '.io-ox-sidepopup .io-ox-portal-birthdays');
    I.see('Puff, Third', '.io-ox-sidepopup .io-ox-portal-birthdays');

    // check contact popup
    var detail = locate('.io-ox-sidepopup .io-ox-sidepopup-pane .contact-detail');
    _.each(contacts, function (contact) {
        I.say(contact.last_name);
        I.click(locate('.io-ox-sidepopup .io-ox-portal-birthdays .birthday').withText(contact.display_name));
        I.waitForVisible('~Contact Details');
        I.waitForVisible('.inline-toolbar', 10, detail);
        I.waitForVisible('.picture', 10, detail);
        I.see(contact.last_name, detail);
        I.see(contact.first_name, detail);
        I.see('Date of birth', detail);
        I.seeElement('.close', detail);
        var topSidepopup = locate('.window-container-center .io-ox-sidepopup').at(2);
        I.waitForText('Saved in', topSidepopup);
        I.click('.close', topSidepopup);
        I.waitForDetached('~Contact Details');
    });

    I.click('.close', locate('.io-ox-sidepopup').withText('Buy a gift'));
});
