/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */


/// <reference path="../../../steps.d.ts" />

Scenario('[C7766] Create new signature', async function (I) {

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/mail/settings/signatures']);

    I.waitForText('Add new signature');
    I.click('Add new signature');

    I.waitForVisible('.modal-dialog');
    I.fillField('Signature name', 'Testsignaturename');

    I.waitForVisible('.contenteditable-editor iframe');
    within({ frame: '.contenteditable-editor iframe' }, () => {
        I.appendField('body', 'Testsignaturecontent');
    });

    I.click('Save');
    I.waitForDetached('.modal-dialog');

    // assert existance of signature
    I.waitForText('Testsignaturename');
    I.see('Testsignaturecontent');

    // disable default siganture
    I.selectOption('Default signature for new messages', 'No signature');
    I.selectOption('Default signature for replies or forwards', 'No signature');

    I.openApp('Mail');

    I.clickToolbar('Compose');
    I.waitForText('Signatures');

    I.retry(5).click('Signatures');
    I.click('Testsignaturename');

    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.see('Testsignaturecontent');
    });

});
