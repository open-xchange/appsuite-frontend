/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
* © 2019 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Francisco Laguna <francisco.laguna@open-xchange.com>
*/

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Compose');

Before(async (users) => {
    await users.create();
});
After(async (users) => {
    await users.removeAll();
});

Scenario('[C85622] Address Book Popup', async (I) => {
    I.login();
    I.logout();
});
