/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Maik Schäfer <maik.schaefer@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail Compose Signatures');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C8825] Add and replace signatures', async function (I) {

    await I.haveSnippet({
        content: '<p>Very original and clever signature</p>',
        displayname: 'My signature',
        misc: { insertion: 'above', 'content-type': 'text/html' },
        module: 'io.ox/mail',
        type: 'signature'
    });
    await I.haveSnippet({
        content: '<p>Super original and fabulous signature</p>',
        displayname: 'Super signature',
        misc: { insertion: 'above', 'content-type': 'text/html' },
        module: 'io.ox/mail',
        type: 'signature'
    });

    I.login('app=io.ox/mail');
    I.clickToolbar('Compose');
    I.waitForFocus('input[type="email"].token-input.tt-input');
    I.click('Signatures');
    I.waitForText('My signature');
    I.click('My signature');
    within({ frame: '#mce_0_ifr' }, () => {
        I.waitForText('Very original and clever signature');
    });
    I.click('Signatures');
    I.waitForText('Super signature');
    I.click('Super signature');
    within({ frame: '#mce_0_ifr' }, () => {
        I.waitForText('Super original and fabulous signature');
        I.dontSee('Very original and clever signature');
    });
});
