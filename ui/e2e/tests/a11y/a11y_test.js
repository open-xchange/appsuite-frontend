/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('Accessibility');

BeforeSuite(async function (users) {
    await users.create();
});

AfterSuite(async function (users) {
    await users.removeAll();
});

require('./login');
require('./mail');
require('./contacts');
require('./calendar');
require('./drive');
require('./portal');
require('./tasks');
require('./settings');
require('./general');
require('./toolbar');
