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
const { I, contacts } = inject();


Feature('Settings > Basic > User picture');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

const NODES = {
    TOPBAR: '#io-ox-toprightbar .contact-picture',
    DROPDOWN: '.user-picture',
    EDIT: '.contact-photo-upload .contact-photo'
};

async function getBackgroundImage(selector) {
    const image = await I.grabCssPropertyFrom(selector, 'backgroundImage');
    return Array.isArray(image) ? image[0] : image;
}

function editPhoto() {
    contacts.editMyContact();
    I.waitForElement('.contact-edit .contact-photo');
    I.click('.contact-edit .contact-photo');
    I.waitForVisible('.edit-picture');
}

function editPhotoStandalone() {
    I.waitForVisible('.dropdown-toggle[aria-label="My account"]');
    I.waitForVisible('.contact-picture');
    I.click('.contact-picture');
    I.waitForVisible('.user-picture-container');
    I.click({ css: '[data-name="user-picture"]' }, '.dropdown.open .dropdown-menu');
    I.waitForVisible('.modal.edit-picture');
}

Scenario('User starts without picture', async function (I, dialogs, contacts, mail) {
    I.login('app=io.ox/mail');
    mail.waitForApp();

    I.waitForElement(NODES.TOPBAR);
    I.waitForElement(NODES.DROPDOWN);
    expect(await getBackgroundImage(NODES.TOPBAR)).is.equal('none');
    expect(await getBackgroundImage(NODES.DROPDOWN)).is.equal('none');

    // via click on user image
    editPhotoStandalone();
    dialogs.waitForVisible();

    dialogs.clickButton('Remove photo');
    I.waitForVisible('.modal.edit-picture.empty');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal.edit-picture');

    // via "My user data"
    contacts.editMyContact();

    // check if empty
    I.seeElementInDOM('.empty');
    I.waitForText('Click to add photo', 20, '.contact-photo label');
    I.click('.contact-edit .contact-photo');
    I.waitForVisible('.edit-picture.empty');
    dialogs.clickButton('Cancel');
    I.click('Discard');
});

Scenario('User can upload/remove picture', async function (I, contacts, mail, dialogs) {
    I.login('app=io.ox/mail');
    mail.waitForApp();

    // 0. start with unset user picture
    I.waitForElement(NODES.TOPBAR);
    expect(await getBackgroundImage(NODES.TOPBAR)).is.equal('none');
    editPhoto();
    dialogs.waitForVisible();

    // 1. add user image (2.2 MB)
    I.attachFile('.contact-photo-upload form input[type="file"][name="file"]', 'e2e/media/placeholder/800x600.png');
    I.waitForInvisible('.edit-picture.empty');
    dialogs.clickButton('Apply');
    I.waitForDetached('.edit-picture');
    I.waitForInvisible('.empty', 3);
    I.click('Save');
    I.waitForDetached('.contact-edit');

    I.waitForElement(`${NODES.TOPBAR}[style]`);
    expect(await getBackgroundImage(NODES.TOPBAR)).to.have.string('uniq');

    // 2. remove user image
    editPhoto();
    // TODO: BUG
    dialogs.waitForVisible();
    dialogs.clickButton('Remove photo');
    I.waitForVisible('.edit-picture.empty');
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');
    I.click('Save');
    I.waitForDetached('.contact-edit');

    I.waitForElement(`${NODES.TOPBAR}:not([style])`);
    I.waitForElement(`${NODES.DROPDOWN}:not([style])`);
    expect(await getBackgroundImage(NODES.TOPBAR)).is.equal('none');
    expect(await getBackgroundImage(NODES.DROPDOWN)).is.equal('none');

    // 3. check edit view again
    editPhoto();
    dialogs.waitForVisible();
    I.waitForVisible('.edit-picture.in.empty');
});

Scenario('User can upload/remove picture (standalone version)', async function (I, contacts, mail, dialogs) {
    I.login('app=io.ox/mail');
    mail.waitForApp();

    // 0. start with unset user picture
    I.waitForElement(NODES.TOPBAR);
    I.waitForElement(NODES.DROPDOWN);
    expect(await getBackgroundImage(NODES.TOPBAR)).is.equal('none');
    expect(await getBackgroundImage(NODES.DROPDOWN)).is.equal('none');

    // 1. add user image (2.2 MB)
    editPhotoStandalone();
    dialogs.waitForVisible();
    I.attachFile('.contact-photo-upload form input[type="file"][name="file"]', 'e2e/media/placeholder/800x600.png');
    I.waitForInvisible('.edit-picture.empty', 3);
    dialogs.clickButton('Apply');

    I.waitForElement(`${NODES.TOPBAR}[style]`);
    I.waitForElement(`${NODES.DROPDOWN}[style]`);
    expect(await getBackgroundImage(NODES.TOPBAR)).to.have.string('uniq');
    expect(await getBackgroundImage(NODES.DROPDOWN)).to.have.string('uniq');
    let uniq = (await getBackgroundImage(NODES.TOPBAR)).slice(-15, -2);

    // 2. update user image (2.2 MB)
    editPhotoStandalone();
    dialogs.waitForVisible();
    I.attachFile('.contact-photo-upload form input[type="file"][name="file"]', 'e2e/media/placeholder/800x600-limegreen.png');
    I.waitForInvisible('.edit-picture.empty', 3);
    let listenerID = I.registerNodeRemovalListener(NODES.TOPBAR);
    dialogs.clickButton('Apply');
    I.waitForNodeRemoval(listenerID);
    I.wait(0.5);

    I.waitForElement(`${NODES.TOPBAR}[style]`);
    I.waitForElement(`${NODES.DROPDOWN}[style]`);
    expect(await getBackgroundImage(NODES.TOPBAR)).to.have.string('uniq').and.not.have.string(uniq);
    expect(await getBackgroundImage(NODES.DROPDOWN)).to.have.string('uniq').and.not.have.string(uniq);

    // 3. remove user image (but cancel)
    editPhotoStandalone();
    dialogs.waitForVisible();
    dialogs.clickButton('Remove photo');
    I.waitForVisible('.edit-picture.empty');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal.edit-picture');

    I.waitForElement(`${NODES.TOPBAR}[style]`);
    I.waitForElement(`${NODES.DROPDOWN}[style]`);
    expect(await getBackgroundImage(NODES.TOPBAR)).to.have.string('uniq');
    expect(await getBackgroundImage(NODES.DROPDOWN)).to.have.string('uniq');

    // 4. remove user image
    editPhotoStandalone();
    dialogs.waitForVisible();
    dialogs.clickButton('Remove photo');
    I.waitForVisible('.edit-picture.empty');
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal.edit-picture');

    I.waitForElement(`${NODES.TOPBAR}:not([style])`);
    I.waitForElement(`${NODES.DROPDOWN}:not([style])`);
    expect(await getBackgroundImage(NODES.TOPBAR)).is.equal('none');
    expect(await getBackgroundImage(NODES.DROPDOWN)).is.equal('none');

    // 5. check edit view again
    editPhotoStandalone();
    dialogs.waitForVisible();
    I.waitForVisible('.edit-picture.empty');
});

Scenario('User can rotate her/his picture', async function (I, contacts, mail, dialogs) {
    I.login('app=io.ox/mail');
    mail.waitForApp();

    // 0. start with unset user picture
    I.waitForElement(NODES.TOPBAR);
    expect(await getBackgroundImage(NODES.TOPBAR)).is.equal('none');
    editPhoto();
    dialogs.waitForVisible();

    // 1. add user image (2.2 MB)
    I.attachFile('.contact-photo-upload form input[type="file"][name="file"]', 'e2e/media/placeholder/800x600.png');
    I.waitForInvisible('.edit-picture.empty');
    expect(await getBackgroundImage(NODES.EDIT)).to.not.be.empty;
    // rotate (portrait to landscape)
    const height = await I.grabAttributeFrom('.cr-image', 'height');
    I.click('.inline-actions button[data-action="rotate-right"]');
    const width = await I.grabAttributeFrom('.cr-image', 'width');
    expect(Array.isArray(height) ? height[0] : height).to.be.equal(Array.isArray(width) ? width[0] : width);

    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');
    I.waitForInvisible('.edit-picture');

    // 2. Discard
    I.click('Discard');
    // "Discard change"
    dialogs.waitForVisible();
    dialogs.clickButton('Cancel');

    I.click('Save');
    I.waitForDetached('.contact-edit');
    I.waitForElement(`${NODES.TOPBAR}[style]`);
    expect(await getBackgroundImage(NODES.TOPBAR)).to.have.string('uniq');
});
