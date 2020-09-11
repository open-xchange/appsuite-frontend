/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

Feature('Tours > Getting started');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

// skip for now until pipeline can handle the tour plugin
Scenario('Getting started tour', async function (I, topbar) {

    I.login();
    topbar.tours();

    // test cancel mechanism
    I.click('.wizard-close');

    I.waitForText('You can restart this tour at any time by clicking on the account icon and choose "Getting started"');
    I.click({ css: '[data-action="done"]' });

    // test tour
    topbar.tours();

    I.waitForText('1/5');
    I.click({ css: '[data-action="next"]' });

    I.waitForText('2/5');
    I.click({ css: '[data-action="next"]' });

    I.waitForText('3/5');
    I.click({ css: '[data-action="next"]' });

    I.waitForText('4/5');
    I.click({ css: '[data-action="next"]' });

    I.waitForText('5/5');
    I.click({ css: '[data-action="done"]' });

    I.dontSeeElement('.wizard-container .wizard-content');
    I.dontSee('You can restart this tour at any time by clicking on the account icon and choose "Getting started"');
});
