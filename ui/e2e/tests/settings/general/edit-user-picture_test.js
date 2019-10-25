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

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

function prepare(user, I) {
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
}

Scenario('User start with no picture', async function (I, users) {
    const W = require('../../contacts/edit-picture_commands')(I);
    const [user] = users;
    prepare(user, I);

    // toolbar
    let [image] = await I.grabCssPropertyFrom('#io-ox-topbar-dropdown-icon .contact-picture', 'background-image');
    expect(image).is.equal('none');
    // edit contact data
    W.myContactData('open');
    W.myContactData('check:empty-state');
    W.EditPicture('open');
    W.EditPicture('check:empty-state');
    W.EditPicture('cancel');
    W.myContactData('discard');
});

Scenario('User can upload and remove a picture', async function (I, users) {
    const W = require('../../contacts/edit-picture_commands')(I);
    const [user] = users;

    prepare(user, I);

    // user image in toolbar?
    let [image1] = await I.grabCssPropertyFrom('#io-ox-topbar-dropdown-icon .contact-picture', 'background-image');
    expect(image1).is.equal('none');

    // open and check empty-state
    W.myContactData('open');
    W.EditPicture('open');
    W.EditPicture('upload');
    W.EditPicture('check:not:empty-state');
    W.EditPicture('ok');

    // picture-uploader
    W.myContactData('check:not:empty-state');
    W.myContactData('save');
    I.waitForVisible('.contact-picture');
    let [image2] = await I.grabCssPropertyFrom('#io-ox-topbar-dropdown-icon .contact-picture', 'background-image');
    expect(image2).to.not.be.empty;

    W.myContactData('open');
    W.EditPicture('open');
    W.EditPicture('remove-image');
    W.EditPicture('ok');
    W.myContactData('save');
    // user image in toolbar?
    I.waitForVisible('.contact-picture:not([style])', 2);
    let [image3] = await I.grabCssPropertyFrom('#io-ox-topbar-dropdown-icon .contact-picture', 'background-image');
    expect(image3).is.equal('none');

    // check again
    W.myContactData('open');
    W.EditPicture('open');
    W.EditPicture('check:empty-state');
    W.EditPicture('cancel');
    W.myContactData('discard');
});

Scenario('User can rotate her/his picture', async function (I, users) {
    const W = require('../../contacts/edit-picture_commands')(I);
    const [user] = users;

    prepare(user, I);

    // user image in toolbar?
    let [image] = await I.grabCssPropertyFrom('#io-ox-topbar-dropdown-icon .contact-picture', 'background-image');
    expect(image).is.equal('none');

    // open and check empty-state
    W.myContactData('open');
    W.EditPicture('open');
    W.EditPicture('upload');
    let [image_contact] = await I.grabCssPropertyFrom('.contact-photo-upload .contact-photo', 'background-image');
    expect(image_contact).to.not.be.empty;

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
