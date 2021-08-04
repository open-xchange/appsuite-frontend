/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

Feature('Tours > Getting started');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

// skip for now until pipeline can handle the tour plugin
Scenario.skip('Getting started tour', async function ({ I, topbar }) {

    I.login();
    topbar.tours();

    // test cancel mechanism
    I.click('.wizard-close');

    I.waitForText('You can restart this tour at any time by clicking on the help icon and choose "Getting started".');
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
    I.dontSee('You can restart this tour at any time by clicking on the help icon and choose "Getting started".');
});
