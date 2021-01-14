/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail Compose');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C114353] Mail address parsing supports multiple delimiters', async ({ I, mail }) => {

    await I.haveSetting({ 'io.ox/mail': { 'features/registerProtocolHandler': false } });
    I.login('app=io.ox/mail');
    mail.newMail();

    // Copy multiple addresses delimited by commas into the address field
    pasteTriple('Foo Bar <foo@bar.com>, John Doe <john@doe.com>, Jane Doe <jane@doe.com>');

    // Copy multiple addresses delimited by semi-colons into the address field
    pasteTriple('Foo Bar <foo@bar.com>; John Doe <john@doe.com>; Jane Doe <jane@doe.com>');

    // Copy multiple addresses delimited by tabs into the address field
    pasteTriple('Foo Bar <foo@bar.com>\tJohn Doe <john@doe.com>\tJane Doe <jane@doe.com>');

    // Copy multiple addresses delimited by new-lines into the address field
    pasteTriple('Foo Bar <foo@bar.com>\nJohn Doe <john@doe.com>\nJane Doe <jane@doe.com>');

    // Copy a mail address containing special Latin characters into the address field
    pasteSingle('Fóó Bær <foo@bar.com>', 'Fóó Bær');

    // Copy a mail address containing the dash character into the address field
    pasteSingle('John Do-Do-Doe <john@doe.com>', 'John Do-Do-Doe');

    function pasteTriple(str) {
        paste(str);
        I.seeNumberOfElements('.mail-compose-fields .token-label', 3);
        I.waitForVisible(locate('.token-label').withText('Foo Bar'));
        I.waitForVisible(locate('.token-label').withText('John Doe'));
        I.waitForVisible(locate('.token-label').withText('Jane Doe'));
        I.pressKey('Backspace');
        I.wait(0.1);
        I.pressKey('Backspace');
        I.wait(0.1);
        I.pressKey('Backspace');
        I.wait(0.1);
        I.pressKey('Backspace');
    }

    function pasteSingle(str, text) {
        paste(str);
        I.seeNumberOfElements('.mail-compose-fields .token-label', 1);
        I.waitForVisible(locate('.token-label').withText(text));
        I.pressKey('Backspace');
        I.wait(0.1);
        I.pressKey('Backspace');
    }

    function paste(str) {
        I.fillField('To', str);
        I.pressKey('Enter');
    }
});
