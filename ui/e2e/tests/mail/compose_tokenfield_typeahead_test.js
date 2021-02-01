/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('Mail Compose > Tokenfield/Typeahed');

Before(async function ({ I, users }) {
    await users.create();
    const user = users[0];
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);
    await I.haveContact({
        first_name: 'Sister',
        last_name: user.get('sur_name'),
        email1: user.get('primaryEmail').replace('user', 'sister'),
        display_name: user.get('display_name').replace('user', 'sister'),
        folder_id: await I.grabDefaultFolder('contacts')
    });
    await I.haveContact({
        first_name: 'Brother',
        last_name: user.get('sur_name'),
        email1: user.get('primaryEmail').replace('user', 'brother'),
        display_name: user.get('display_name').replace('user', 'brother'),
        folder_id: await I.grabDefaultFolder('contacts')
    });
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('Add without typeahead', async ({ I, mail }) => {
    I.login('app=io.ox/mail');
    mail.newMail();

    await addToken('pierce@ox-e2e-backend.novalocal', 'Enter', 'pierce@ox-e2e-backend.novalocal');

    async function addToken(query, key, result) {
        // enter term, wait for typeahead and hit key
        I.fillField('To', query);
        I.pressKey(key);
        I.waitForText(result, 2, '.tokenfield.to');
        I.pressKey(['Command', 'a']);
        I.pressKey('Backspace');
    }
});

Scenario('Add typeahed suggestion via autoselect', async ({ I, users, mail }) => {
    const [user] = users;
    const firstname = user.get('display_name');
    const surname = user.get('sur_name');
    const email = user.get('primaryEmail');
    const label = `User ${surname}`;

    const field = locate({ css: '.tokenfield.to' }).as('To field');
    const suggestions = locate({ css: '.tt-dropdown-menu' }).as('Suggestion dropdown');

    I.login('app=io.ox/mail');
    mail.newMail();

    I.say('fully matches mail address');
    await addToken(email, 'Enter', label);
    await addToken(email, 'Tab', label);

    I.say('fully matches label');
    await addToken(label.slice(0, 10), 'Enter', label);
    await addToken(label.slice(0, 10), 'Tab', label);

    I.say('startsWith: label');
    await addToken(firstname, 'Enter', label);
    await addToken(firstname, 'Tab', label);

    I.say('startsWith: mail address');
    await addToken(email.slice(0, 10), 'Enter', label);
    await addToken(email.slice(0, 10), 'Tab', label);

    async function addToken(query, key, result) {
        // enter term, wait for typeahead and hit key
        I.fillField('To', query);
        // hack: simulate hover
        I.waitForElement(suggestions.find({ css: '.tt-suggestion:nth-of-type(1)' }).as('First suggestion'));
        I.waitForElement(suggestions.find({ css: '.tt-suggestion .participant-name' }).as('First suggestion with a name'));
        await I.executeScript(async () => {
            $('.tt-dropdown-menu .tt-suggestion:last').addClass('tt-cursor');
        });
        I.waitForElement(suggestions.find({ css: '.tt-suggestion:nth-of-type(1)' }).as('First suggestion'));
        I.waitForElement(suggestions.find({ css: '.tt-suggestion .participant-name' }).as('First suggestion with a name'));
        I.waitForElement(suggestions.find({ css: '.tt-cursor' }).as('Last suggestion'), 10);
        // create and check token
        I.pressKey(key);
        I.waitForText(result, 10, field);
        I.waitForInvisible(suggestions);
        I.dontSee('Sister', field);
        I.dontSee('Brother', field);
        // reset
        I.pressKey(['Command', 'a']);
        I.pressKey('Backspace');
    }
});

// see bug 65012 for details and why this test still breaks
// Scenario('Add typeahed suggestion via autoselect (ignoring mouse hovered item)', async (I, users) => {
//     const [user] = users;
//     const surname = user.get('sur_name');
//     const label = `User ${surname}`;

//     I.login('app=io.ox/mail');

//     I.waitForText('Compose');
//     I.click('Compose');
//     I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
//     I.wait(1);

//     // startsWith: surname (3 suggestions)
//     await addToken(surname, 'Enter', label);
//     await addToken(surname, 'Tab', label);

//     async function addToken(query, key, result) {
//         // enter term, wait for typeahead and hit key
//         I.fillField('To', query);
//         I.waitForElement('.tt-dropdown-menu .tt-suggestion .participant-name');
//         // hack: simulate hover
//         await I.executeScript(async () => { $('.tt-dropdown-menu .tt-suggestion:last').addClass('tt-cursor'); });
//         I.waitForElement('.tt-dropdown-menu .tt-cursor', 3);
//         // create and check token
//         I.pressKey(key);
//         I.waitForText(result, 2, '.tokenfield.to');
//         I.waitForInvisible('.tt-dropdown-menu');
//         I.dontSee('Sister', '.tokenfield.to');
//         I.dontSee('Brother', '.tokenfield.to');
//         // reset
//         I.pressKey(['Command', 'a']);
//         I.pressKey('Backspace');
//     }
// });

Scenario('Add typeahead suggestion via keyboard', async ({ I, users, mail }) => {
    const [user] = users;
    const suggestions = locate({ css: '.tt-dropdown-menu' }).as('Suggestion dropdown');

    I.login('app=io.ox/mail');
    mail.newMail();

    let displayName = user.get('display_name'),
        partialName = displayName.substring(0, displayName.length - 1),
        name = user.get('sur_name');

    // autocomplete via autocomplete hint
    await addToken(partialName, 'Tab', name, { hover: true });
    await addToken(partialName, 'Enter', name, { hover: true });
    await addToken(partialName, 'Space', name, { hover: true });

    // autocomplete via select second suggestion
    // Workaround: using 'ister' cause sometimes a "mail address token" and not a "label" token get's created
    await addToken(name, 'ArrowDown,ArrowDown,ArrowDown,Tab', 'ister', { hover: false });
    await addToken(name, 'ArrowDown,ArrowDown,ArrowDown,Enter', 'ister', { hover: false });
    await addToken(name, 'ArrowDown,ArrowDown,ArrowDown,Space', 'ister', { hover: false });

    async function addToken(query, keys, result, options) {
        // enter term, wait for typeahead and hit key
        I.fillField('To', query);
        // hack: simulate hover
        I.waitForElement(suggestions.find({ css: '.tt-suggestion:nth-of-type(1)' }).as('First suggestion'));
        I.waitForElement(suggestions.find({ css: '.tt-suggestion .participant-name' }).as('First suggestion with a name'));
        if (options.hover) {
            await I.executeScript(async () => {
                $('.tt-dropdown-menu .tt-suggestion:last').addClass('tt-cursor');
            });
            I.waitForElement(suggestions.find({ css: '.tt-suggestion:nth-of-type(1)' }).as('First suggestion'));
            I.waitForElement(suggestions.find({ css: '.tt-suggestion .participant-name' }).as('First suggestion with a name'));
            I.waitForElement(suggestions.find({ css: '.tt-cursor' }).as('Last suggestion'), 10);
        }

        keys.split(',').forEach((key) => { I.pressKey(key.trim()); });
        I.waitForText(result, 2, '.tokenfield.to');
        I.pressKey(['Command', 'a']);
        I.pressKey('Backspace');
    }
});

Scenario('Add typeahead suggestion via mouse', async ({ I, users, mail }) => {
    const [user] = users;

    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.newMail();

    let name = user.get('sur_name'),
        target = 'Sister ' + name;

    // autocomplete via select second suggestion
    I.fillField('To', name);
    I.waitForElement('.tt-dropdown-menu', 3);
    I.waitForText(target, 2, '.tt-dropdown-menu');
    // hack: simulate hover
    await I.executeScript(async () => { $('.tt-dropdown-menu .tt-suggestion:first').addClass('tt-cursor'); });
    I.waitForElement('.tt-dropdown-menu .tt-cursor', 3);
    // create and check token
    I.click('.tt-suggestion:last-child', '.tt-dropdown-menu');
    I.waitForText(target, 2, '.tokenfield.to');
    I.pressKey(['Command', 'a']);
    I.pressKey('Backspace');
});
