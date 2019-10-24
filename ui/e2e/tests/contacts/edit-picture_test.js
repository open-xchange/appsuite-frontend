/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Contacts > Image');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Contact starts with no picture', async function (I, contacts) {
    const FIRST = 'Jeff', LAST = 'Winger', DISPLAYNAME = `${LAST}, ${FIRST}`,
        W = require('./edit-picture_commands')(I, DISPLAYNAME);
    let image;

    await I.haveContact({
        display_name: DISPLAYNAME,
        first_name: FIRST,
        last_name: LAST,
        folder_id: await I.grabDefaultFolder('contacts')
    });

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.selectContact(DISPLAYNAME);

    // list and detail view
    image = await I.grabCssPropertyFrom('.vgrid-scrollpane-container .contact-photo', 'backgroundImage');
    if (typeof image === 'undefined') image = 'none';
    expect(Array.isArray(image) ? image[0] : image).is.equal('none');
    image = await I.grabCssPropertyFrom('.contact-detail .contact-photo', 'backgroundImage');
    if (typeof image === 'undefined') image = 'none';
    expect(Array.isArray(image) ? image[0] : image).is.equal('none');

    // edit contact data
    W.contactData('edit');
    image = await I.grabCssPropertyFrom('.contact-edit .contact-photo', 'backgroundImage');
    if (typeof image === 'undefined') image = 'none';
    expect(Array.isArray(image) ? image[0] : image).is.equal('none');

    // edit picture
    W.EditPicture('open');
    W.EditPicture('check:empty-state');
    W.EditPicture('cancel');
    W.contactData('discard');
    // do not show "do you really want to discard" modal cause nothing changed
    I.waitForDetached(locate('.modal-dialog').as('"Dialog: Do you really want to discard?"'), 1);
});

Scenario.skip('Contact can upload and remove a picture', async function (I, contacts) {
    const FIRST = 'Britta', LAST = 'Perry', DISPLAYNAME = `${LAST}, ${FIRST}`,
        W = require('./edit-picture_commands')(I, DISPLAYNAME);
    let image;

    await I.haveContact({
        display_name: DISPLAYNAME,
        first_name: FIRST,
        last_name: LAST,
        folder_id: await I.grabDefaultFolder('contacts')
    });

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.selectContact(DISPLAYNAME);

    image = await I.grabCssPropertyFrom('.vgrid-scrollpane-container .contact-photo', 'backgroundImage');
    if (typeof image === 'undefined') image = 'none';
    expect(Array.isArray(image) ? image[0] : image).is.equal('none');
    image = await I.grabCssPropertyFrom('.contact-detail .contact-photo', 'backgroundImage');
    if (typeof image === 'undefined') image = 'none';
    expect(Array.isArray(image) ? image[0] : image).is.equal('none');

    // edit contact data
    W.contactData('edit');
    image = await I.grabCssPropertyFrom('.contact-edit .contact-photo', 'backgroundImage');
    if (typeof image === 'undefined') image = 'none';
    expect(Array.isArray(image) ? image[0] : image).is.equal('none');

    // edit picture
    W.EditPicture('open');
    W.EditPicture('check:empty-state');
    W.EditPicture('upload');
    W.EditPicture('check:not:empty-state');
    W.EditPicture('ok');

    // picture-uploader
    W.contactData('check:not:empty-state');
    W.contactData('save');
    I.waitForVisible('.contact-picture');

    // list and detail view
    W.contactData('select');
    image = await I.grabCssPropertyFrom('.vgrid-scrollpane-container .contact-photo', 'backgroundImage');
    if (typeof image === 'undefined') image = 'none';
    expect(Array.isArray(image) ? image[0] : image).is.not.equal('none', 'List view photo missing');
    image = await I.grabCssPropertyFrom('.contact-detail .contact-photo', 'backgroundImage');
    if (typeof image === 'undefined') image = 'none';
    expect(Array.isArray(image) ? image[0] : image).is.not.equal('none', 'Detail view photo missing');

    W.contactData('edit');
    W.EditPicture('open');
    W.EditPicture('remove-image');
    W.EditPicture('ok');
    W.contactData('save');
    // user image in toolbar?
    I.waitForDetached('.vgrid-scrollpane-container .contact-photo:not(.empty)', 2);
    image = await I.grabCssPropertyFrom('.vgrid-scrollpane-container .contact-photo', 'backgroundImage');
    if (typeof image === 'undefined') image = 'none';
    expect(Array.isArray(image) ? image[0] : image).is.equal('none', 'Edit view photo still present');
    I.waitForDetached('.contact-detail .contact-photo:not(.empty)', 2);
    image = await I.grabCssPropertyFrom('.contact-detail .contact-photo', 'backgroundImage');
    if (typeof image === 'undefined') image = 'none';
    expect(Array.isArray(image) ? image[0] : image).is.equal('none', 'Edit picture view photo still present');

    // check again
    W.contactData('edit');
    W.EditPicture('open');
    W.EditPicture('check:empty-state');
    W.EditPicture('cancel');
    W.contactData('discard');
});

Scenario.skip('User can rotate a contact picture', async function (I, contacts) {
    const W = require('./edit-picture_commands')(I);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    // user image in toolbar?
    let image = await I.grabCssPropertyFrom('#io-ox-topbar-dropdown-icon .contact-picture', 'backgroundImage');
    expect(Array.isArray(image) ? image[0] : image).is.equal('none');

    // open and check empty-state
    W.myContactData('open');
    W.EditPicture('open');
    W.EditPicture('upload');
    W.EditPicture('check:not:empty-state');

    // rotate (portrait to landscape)
    let [height] = await I.grabAttributeFrom('.cr-image', 'height');
    I.click('.inline-actions button[data-action="rotate-right"]');
    let [width] = await I.grabAttributeFrom('.cr-image', 'width');
    expect(height).to.be.equal(width);
    W.EditPicture('check:not:empty-state');
    W.EditPicture('ok');

    //picture-uploader
    W.myContactData('discard');
    W.myContactData('discard-confirm');
});
