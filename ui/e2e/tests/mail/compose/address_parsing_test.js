/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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
