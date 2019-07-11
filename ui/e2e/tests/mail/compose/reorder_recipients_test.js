/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail Compose');

Before(async (users) => {
    await users.create(); // Sender
    await users.create(); // Recipient1
    await users.create(); // Recipient2
    await users.create(); // Recipient3
    await users.create(); // Recipient4
});

After(async (users) => {
    await users.removeAll();
});

function prepare(I) {
    // Open the mail composer
    I.retry(5).click('Compose');
    I.waitForVisible('.io-ox-mail-compose .contenteditable-editor');
    I.waitForFocus('input[placeholder="To"]');
    I.click('~Maximize');
    // Fill out to and subject
    I.click('CC');
    I.click('BCC');
}

function getDisplayName(user) {
    return `${user.get('given_name')} ${user.get('sur_name')}`;
}

function getTokenSelector(I, user) {
    return `~${getDisplayName(user)} ${user.get('primaryEmail')}. Press backspace to delete.`;
}

function addToField(I, user, field) {
    if (field === 'to') field = 'To';
    if (field === 'cc') field = 'CC';
    if (field === 'bcc') field = 'BCC';
    I.fillField(field, user.get('primaryEmail'));
    I.waitForVisible('.tt-dropdown-menu');
    I.pressKey('Enter');
    seeToken(I, user, field.toLowerCase());
}

function seeToken(I, user, field) {
    I.see(getDisplayName(user), field ? `[data-extension-id="${field}"] .token-label` : '.token-label');
}

function seeTokenAtPosition(I, user, field, position) {
    I.see(getDisplayName(user), field ? `[data-extension-id="${field}"] .token:nth-of-type(${position}) .token-label` : '.token-label');
}

function moveTo(I, user, target) {
    I.dragAndDrop(getTokenSelector(I, user), `[data-extension-id="${target}"] .token-input`);
    seeToken(I, user, target);
}

function moveBefore(I, user1, user2) {
    I.dragAndDrop(getTokenSelector(I, user1), getTokenSelector(I, user2));
    seeToken(I, user1);
    seeToken(I, user2);
}

Scenario('[C8832] Re-order recipients', async function (I, users) {

    let [sender, recipient1, recipient2, recipient3, recipient4] = users;

    const mailSubject = 'C8832 Move recipients between between field';

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    I.login('app=io.ox/mail', { user: sender });

    prepare(I);

    I.fillField('Subject', mailSubject);

    // add a recipient for all fields
    addToField(I, recipient1, 'to');
    addToField(I, recipient2, 'cc');
    addToField(I, recipient3, 'bcc');

    // move around
    addToField(I, recipient4, 'bcc');
    seeTokenAtPosition(I, recipient4, 'bcc', 2);
    moveTo(I, recipient4, 'cc');
    seeTokenAtPosition(I, recipient4, 'cc', 2);
    moveTo(I, recipient4, 'bcc');
    seeTokenAtPosition(I, recipient4, 'bcc', 2);
    moveTo(I, recipient4, 'to');
    seeTokenAtPosition(I, recipient4, 'to', 2);

    // drag to first position in field
    moveBefore(I, recipient4, recipient1);
    seeTokenAtPosition(I, recipient4, 'to', 1);

    // send the mail
    I.click('Send');

    // let's stick around a bit for sending to finish
    I.waitForDetached('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);

    // open detail view of sent mail
    I.selectFolder('Sent');
    I.waitForText(mailSubject);
    I.click(mailSubject, '.list-item.selectable');

    // check recipients
    I.click('.show-all-recipients');
    I.see(getDisplayName(recipient1), '.person-to');
    I.see(getDisplayName(recipient4), '.person-to');
    I.see(getDisplayName(recipient2), '.person-cc');
    I.see(getDisplayName(recipient3), '.person-bcc');
});
