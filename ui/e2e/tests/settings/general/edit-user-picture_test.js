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

const expect = require('chai').expect;

Feature('Settings > Basic > User picture');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('User start with no picture', async function ({ I, contacts, mail }) {
    I.login('app=io.ox/mail');
    mail.waitForApp();

    // toolbar
    const image = await I.grabCssPropertyFrom('#io-ox-topbar-dropdown-icon .contact-picture', 'backgroundImage');
    expect(Array.isArray(image) ? image[0] : image).is.equal('none');

    // edit contact data
    contacts.editMyContact();

    // check if empty
    I.seeElementInDOM('.empty');
    I.waitForText('Click to add photo', 20, '.contact-photo label');

    I.click('.contact-edit .contact-photo');
    I.waitForVisible('.edit-picture');
    I.seeElementInDOM('.edit-picture.empty');
    I.click('Cancel');
    I.click('Discard');
});

Scenario('User can upload and remove a picture', async function ({ I, contacts, mail, dialogs }) {
    I.login('app=io.ox/mail');
    mail.waitForApp();

    // user image in toolbar?
    const image1 = await I.grabCssPropertyFrom('#io-ox-topbar-dropdown-icon .contact-picture', 'backgroundImage');
    expect(Array.isArray(image1) ? image1[0] : image1).is.equal('none');

    // open and check empty-state
    contacts.editMyContactPhoto();
    dialogs.waitForVisible();

    // upload image (2.2 MB)
    I.attachFile('.contact-photo-upload form input[type="file"][name="file"]', 'e2e/media/placeholder/800x600.png');

    I.waitForInvisible('.edit-picture.empty');
    dialogs.clickButton('Apply');
    I.waitForDetached('.edit-picture');

    // picture-uploader
    I.waitForInvisible('.empty', 3);

    let listenerID = I.registerNodeRemovalListener('#io-ox-topbar-dropdown-icon .contact-picture');
    I.click('Save');
    I.waitForDetached('.contact-edit');
    I.waitForNodeRemoval(listenerID);
    I.waitForElement('.contact-picture');

    const image2 = await I.grabCssPropertyFrom('#io-ox-topbar-dropdown-icon .contact-picture', 'backgroundImage');
    expect(Array.isArray(image2) ? image2[0] : image2).to.not.be.empty;

    contacts.editMyContactPhoto();

    // TODO: BUG
    // There are likely to be accessibility issues due to mishandled focus
    dialogs.waitForVisible();
    dialogs.clickButton('Remove photo');


    I.waitForVisible('.edit-picture.empty');
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');

    let listenerID2 = I.registerNodeRemovalListener('#io-ox-topbar-dropdown-icon .contact-picture');
    I.click('Save');
    I.waitForDetached('.contact-edit');
    I.waitForNodeRemoval(listenerID2);
    I.waitForElement('.contact-picture');

    // check again
    contacts.editMyContactPhoto();
    dialogs.waitForVisible();
    I.waitForVisible('.edit-picture.in.empty');
});

Scenario('User can rotate her/his picture', async function ({ I, contacts, mail, dialogs }) {
    let image;

    I.login('app=io.ox/mail');
    mail.waitForApp();

    // user image in toolbar?
    image = await I.grabCssPropertyFrom('#io-ox-topbar-dropdown-icon .contact-picture', 'backgroundImage');
    expect(Array.isArray(image) ? image[0] : image).is.equal('none');

    // open and check empty-state
    contacts.editMyContactPhoto();
    dialogs.waitForVisible();

    I.attachFile('.contact-photo-upload form input[type="file"][name="file"]', 'e2e/media/placeholder/800x600.png');
    I.waitForInvisible('.edit-picture.empty');
    image = await I.grabCssPropertyFrom('.contact-photo-upload .contact-photo', 'backgroundImage');
    expect(Array.isArray(image) ? image[0] : image).to.not.be.empty;
    I.wait(0.2);
    // rotate (portrait to landscape)
    const height = await I.grabAttributeFrom('.cr-image', 'height');
    I.click('.inline-actions button[data-action="rotate-right"]');
    const width = await I.grabAttributeFrom('.cr-image', 'width');
    expect(Array.isArray(height) ? height[0] : height).to.be.equal(Array.isArray(width) ? width[0] : width);

    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');
    I.waitForInvisible('.edit-picture');

    //picture-uploader
    I.click('Discard');
    dialogs.waitForVisible();
    dialogs.clickButton('Discard changes');
});
