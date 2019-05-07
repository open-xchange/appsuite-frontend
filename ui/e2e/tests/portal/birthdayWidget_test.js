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

Feature('Portal');

Before(async (users) => {
    await users.create();
});
After(async (users) => {
    await users.removeAll();
});

Scenario('[C7492] Birthday', async (I) => {

    // Create a contact with birthday
    const contactFolderID = await I.grabDefaultFolder('contacts');

    const contactDisplayNamePiff = 'First Piff';
    const contactDisplayNamePaff = 'Second Paff';
    const contactDisplayNamePuff = 'Third Puff';

    await I.haveContact({
        folder_id: contactFolderID,
        first_name: 'First',
        last_name: 'Piff',
        display_name: contactDisplayNamePiff,
        birthday: moment().add(2, 'days').valueOf()
    });
    await I.haveContact({
        folder_id: contactFolderID,
        first_name: 'Second',
        last_name: 'Paff',
        display_name: contactDisplayNamePaff,
        birthday: moment().add(3, 'days').valueOf()
    });
    await I.haveContact({
        folder_id: contactFolderID,
        first_name: 'Third',
        last_name: 'Puff',
        display_name: contactDisplayNamePuff,
        birthday: moment().add(30, 'days').valueOf()
    });

    // clear the portal settings
    await I.haveSetting('io.ox/portal//widgets/user', '{}');

    //Add Birthday widget to Portal
    I.login('app=io.ox/portal');
    I.waitForVisible('.io-ox-portal');
    I.click('Add widget');
    I.waitForVisible('.io-ox-portal-settings-dropdown');
    I.click('Birthdays');

    //Verify contacts displays with the most recent birthday date first
    I.waitForElement('~Birthdays');
    I.waitForElement('.widget[aria-label="Birthdays"] ul li');
    I.see('Piff, First', '.widget[aria-label="Birthdays"] ul li:nth-child(1)');
    I.see('Paff, Second', '.widget[aria-label="Birthdays"] ul li:nth-child(2)');
    I.see('Puff, Third', '.widget[aria-label="Birthdays"] ul li:nth-child(3)');

    //Display list of birthdays and contact
    I.click('~Birthdays');
    I.waitForVisible('.io-ox-sidepopup .io-ox-portal-birthdays');
    I.seeElement('.picture', locate('.io-ox-sidepopup .io-ox-portal-birthdays .birthday').withText('Piff, First'));
    I.seeElement('.picture', locate('.io-ox-sidepopup .io-ox-portal-birthdays .birthday').withText('Paff, Second'));
    I.seeElement('.picture', locate('.io-ox-sidepopup .io-ox-portal-birthdays .birthday').withText('Puff, Third'));

    I.see('Piff, First', '.io-ox-sidepopup .io-ox-portal-birthdays');
    I.see('Paff, Second', '.io-ox-sidepopup .io-ox-portal-birthdays');
    I.see('Puff, Third', '.io-ox-sidepopup .io-ox-portal-birthdays');

    //Check Contack popup
    I.click(locate('.io-ox-sidepopup .io-ox-portal-birthdays .birthday').withText('Piff, First'));
    I.waitForVisible('~Contact Details');
    I.waitForVisible('.inline-toolbar', 10, '.io-ox-sidepopup .io-ox-sidepopup-pane .contact-detail');
    I.waitForVisible('.picture', 10, '.io-ox-sidepopup .io-ox-sidepopup-pane .contact-detail');
    I.see('Piff', '.io-ox-sidepopup .io-ox-sidepopup-pane .contact-detail');
    I.see('First', '.io-ox-sidepopup .io-ox-sidepopup-pane .contact-detail');
    I.see('Date of birth', '.io-ox-sidepopup .io-ox-sidepopup-pane .contact-detail');
    I.seeElement('.close', locate('.io-ox-sidepopup').withChild('.contact-detail'));
    I.click('.close', locate('.io-ox-sidepopup').withText('Date of birth'));
    I.waitForDetached('~Contact Details');

    I.click(locate('.io-ox-sidepopup .io-ox-portal-birthdays .birthday').withText('Paff, Second'));
    I.waitForVisible('~Contact Details');
    I.waitForVisible('.inline-toolbar', 10, '.io-ox-sidepopup .io-ox-sidepopup-pane .contact-detail');
    I.waitForVisible('.picture', 10, '.io-ox-sidepopup .io-ox-sidepopup-pane .contact-detail');
    I.see('Paff', '.io-ox-sidepopup .io-ox-sidepopup-pane .contact-detail');
    I.see('Second', '.io-ox-sidepopup .io-ox-sidepopup-pane .contact-detail');
    I.see('Date of birth', '.io-ox-sidepopup .io-ox-sidepopup-pane .contact-detail');
    I.seeElement('.close', locate('.io-ox-sidepopup').withChild('.contact-detail'));
    I.click('.close', locate('.io-ox-sidepopup').withText('Date of birth'));
    I.waitForDetached('~Contact Details');

    I.click(locate('.io-ox-sidepopup .io-ox-portal-birthdays .birthday').withText('Puff, Third'));
    I.waitForVisible('~Contact Details');
    I.waitForVisible('.inline-toolbar', 10, '.io-ox-sidepopup .io-ox-sidepopup-pane .contact-detail');
    I.waitForVisible('.picture', 10, '.io-ox-sidepopup .io-ox-sidepopup-pane .contact-detail');
    I.see('Puff', '.io-ox-sidepopup .io-ox-sidepopup-pane .contact-detail');
    I.see('Third', '.io-ox-sidepopup .io-ox-sidepopup-pane .contact-detail');
    I.see('Date of birth', '.io-ox-sidepopup .io-ox-sidepopup-pane .contact-detail');
    I.seeElement('.close', locate('.io-ox-sidepopup').withChild('.contact-detail'));
    I.click('.close', locate('.io-ox-sidepopup').withText('Date of birth'));
    I.waitForDetached('~Contact Details');

    I.click('.close', locate('.io-ox-sidepopup').withText('Birthdays'));
});
