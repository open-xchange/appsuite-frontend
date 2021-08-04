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

/// <reference path="../../../steps.d.ts" />

Feature('Settings > Mail');

Before(async ({ users }) => {
    var user = users.getRandom();
    user.aliases = [`${user.name}@${user.domain}`, 'foo@ox.io'];
    await users.create(user);
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7781] Default sender address', async ({ I, users, mail }) => {
    const user = users[0];

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);
    await I.haveAnAlias('urbi@orbi.it', { user });
    I.login('app=io.ox/mail');
    mail.newMail();
    I.click(`<${user.get('primaryEmail')}>`, '.mail-input');
    I.retry(5).click('Show names');
    I.see('foo@ox.io');
    I.clickDropdown('urbi@orbi.it');
    I.waitForVisible('.token-input.tt-input');
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Richtig gutes Zeug');
    mail.send();
    I.triggerRefresh();
    mail.selectMail('Richtig gutes Zeug');
    I.waitForText('urbi@orbi.it', 30);
});
