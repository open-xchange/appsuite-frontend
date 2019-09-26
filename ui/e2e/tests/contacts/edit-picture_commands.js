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

let assert = require('assert');

module.exports = function (I, DISPLAYNAME) {

    // topbar > contact image > my contact data
    function myContactData(op) {
        switch (op) {
            case 'open':
                I.waitForVisible('.contact-picture');
                I.retry(5).click('.contact-picture');
                I.waitForText('My contact data', '.smart-dropdown-container');
                I.click('My contact data', '.smart-dropdown-container');
                I.waitForVisible('.io-ox-contacts-edit-window');
                break;
            case 'discard':
                I.click('Discard');
                break;
            case 'save':
                I.click('Save');
                I.waitForInvisible('.contact-edit');
                break;
            case 'discard-confirm':
                I.waitForVisible('.modal-footer [data-action="delete"]');
                I.click('.modal-footer [data-action="delete"]');
                break;
            case 'check:empty-state':
                I.seeElementInDOM('.empty');
                I.waitForText('Click to add photo', 20, '.contact-photo label');
                break;
            case 'check:not:empty-state':
                I.dontSeeElement('.empty');
                break;
            default:
                assert.fail('W.myContactData: unsupported command', op);
                break;
        }
    }

    // contacts > select contact > edit
    function contactData(op) {
        switch (op) {
            case 'select':
                I.click(locate('.contact').withText(DISPLAYNAME).inside('.vgrid-scrollpane-container'));
                I.waitForText(DISPLAYNAME, 3, '.contact-detail');
                break;
            case 'edit':
                I.clickToolbar('Edit');
                I.waitForVisible('.io-ox-contacts-edit-window');
                break;
            case 'discard':
                I.click('Discard');
                break;
            case 'save':
                I.click('Save');
                I.waitForInvisible('.contact-edit');
                break;
            case 'discard-confirm':
                I.waitForVisible('.modal-footer [data-action="delete"]');
                I.click('.modal-footer [data-action="delete"]');
                break;
            case 'check:empty-state':
                I.seeElement('.contact-edit .empty');
                //I.waitForText('Click to add photo', 20, '.contact-photo label');
                break;
            case 'check:not:empty-state':
                I.dontSeeElement('.contact-edit .empty');
                break;
            default:
                assert.fail('W.ContactData: unsupported command', op);
                break;
        }
    }

    // my contact data > image
    function EditPicture(op) {
        switch (op) {
            case 'open':
                I.click('.contact-edit .contact-photo');
                I.waitForVisible('.edit-picture');
                break;
            case 'cancel':
                I.click('Cancel');
                break;
            case 'ok':
                I.click('Apply');
                I.waitForInvisible('.edit-picture');
                break;
            case 'upload':
                // upload image (2.2 MB)
                I.attachFile('.contact-photo-upload form input[type="file"][name="file"]', 'e2e/media/placeholder/800x600.png');
                break;
            case 'remove-image':
                I.click('Remove photo');
                I.wait(0.5);
                break;
            case 'check:empty-state':
                I.seeElementInDOM('.edit-picture.empty');
                break;
            case 'check:not:empty-state':
                I.waitForInvisible('.edit-picture.empty');
                break;
            default:
                assert.fail('W.EditPicture: unsupported command', op);
                break;
        }
    }

    return {
        myContactData: myContactData,
        contactData: contactData,
        EditPicture: EditPicture
    };
};
