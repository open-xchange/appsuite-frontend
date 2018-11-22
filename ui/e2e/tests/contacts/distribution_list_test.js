/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Björn Köster <bjoern.koester@open-xchange.com>
 */

Feature('Contacts: Distribution lists');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Add a distribution list to an existing distribution list', function (I) {

    I.login('app=io.ox/contacts');
    I.waitForVisible('[data-app-name="io.ox/contacts"]', 5);

    // create new address book
    I.waitForVisible('[data-action="add-subfolder"]', 5);
    I.click('Add new address book');
    I.waitForVisible('.modal-title', 5);
    I.fillField(locate('input').withAttr({ placeholder: 'New address book' }), 'test address book');
    I.click('Add');
    I.waitForDetached('.modal-title', 5);

    // create distribution list
    I.selectFolder('test address book');
    I.click('[data-action="create"]');
    I.waitForVisible('[data-action="io.ox/contacts/actions/distrib"]', 1);
    I.click('[data-action="io.ox/contacts/actions/distrib"]');
    I.waitForVisible('.io-ox-contacts-distrib-window', 5);
    I.fillField(locate('input').withAttr({ name: 'display_name' }), 'test distribution list one');
    I.fillField('input.add-participant.tt-input', 'testdude1@test.case');
    I.pressKey('Enter');
    I.fillField('input.add-participant.tt-input', 'testdude2@test.case');
    I.pressKey('Enter');
    I.fillField('input.add-participant.tt-input', 'testdude3@test.case');
    I.pressKey('Enter');
    I.fillField('input.add-participant.tt-input', 'testdude4@test.case');
    I.pressKey('Enter');
    I.click('[data-action="save"]');
    I.waitForDetached('.io-ox-contacts-distrib-window', 5);

    I.see('test distribution list one');

    // create second list
    I.click('[data-action="create"]');
    I.waitForVisible('[data-action="io.ox/contacts/actions/distrib"]', 1);
    I.click('[data-action="io.ox/contacts/actions/distrib"]');
    I.waitForVisible('.io-ox-contacts-distrib-window', 5);
    I.fillField(locate('input').withAttr({ name: 'display_name' }), 'test distribution list two');

    // search in address book for distribution list one
    I.click('[aria-label="Select contacts"]');
    I.waitForVisible('.modal-header input.search-field', 5);
    I.waitForEnabled('.modal-header input.search-field', 5);
    I.fillField('.modal-header input.search-field', 'test distribution list one');
    I.click(locate('strong').withText('test distribution list one'));

    I.see('4 addresses selected');
    I.see('test distribution list one', 'li.token');

    I.click('Select');
    I.waitForDetached('.modal-header input.search-field', 5);

    // add another address just for good measurement
    I.fillField('input.add-participant.tt-input', 'testdude5@test.case');
    I.pressKey('Enter');
    I.waitNumberOfVisibleElements('li.participant-wrapper.removable', 5);

    I.see('testdude1@test.case');
    I.see('testdude2@test.case');
    I.see('testdude3@test.case');
    I.see('testdude4@test.case');
    I.see('testdude5@test.case');

    I.click('[data-action="save"]');
    I.waitForDetached('.io-ox-contacts-distrib-window', 5);

    I.see('test distribution list two');

    I.logout();

});
