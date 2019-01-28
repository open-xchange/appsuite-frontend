/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 */
/// <reference path="../../../../steps.d.ts" />

Feature('testrail - drive - antivirus');

Before(async function (users) {
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});


Scenario('C273809 - Download infected file', function (I) {
    //define testrail ID
    it('(C273809) Download infected file');
    // Login
    I.login('app=io.ox/files');
    //Go to Drive
    I.waitForVisible('*[data-app-name="io.ox/files"]');
    I.waitForVisible('.classic-toolbar [data-action]');
    //Upload the attached file (eicar.txt)
    //Download the file
    //Hit 'Cancel'
    //Download the file again
    //Hit 'Download infected file'
    //Download and verify the file
    I.logout();
});
