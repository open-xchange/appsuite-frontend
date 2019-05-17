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

module.exports = function (I) {

    // topbar > contact image > my contact data
    function myContactData(op) {
        switch (op) {
            case 'open':
                I.click('.contact-picture');
                I.waitForVisible('.dropdown.open a[data-name="my-contact-data"]');
                I.click('My contact data');
                I.waitForVisible('.io-ox-contacts-edit-window');
                break;
            case 'discard':
                I.click('Discard');
                break;
            case 'save':
                I.click('Save');
                I.waitForInvisible('.edit-contact');
                break;
            case 'remove-image':
                I.click('button.reset.close');
                break;
            case 'discard-confirm':
                I.waitForVisible('.modal-footer [data-action="delete"]');
                I.click('.modal-footer [data-action="delete"]');
                break;
            case 'check:empty-state':
                I.seeElementInDOM('.add-img-text');
                break;
            case 'check:not:empty-state':
                I.waitForInvisible('.add-img-text');
                break;
            default:
                assert.fail('W.myContactData: unsupported command', op);
                break;
        }
    }

    // my contact data > image
    function EditPicture(op) {
        switch (op) {
            case 'open':
                I.click('.contact-picture-upload');
                I.waitForVisible('.edit-picture');
                break;
            case 'cancel':
                I.click('Cancel');
                break;
            case 'ok':
                I.click('Ok');
                break;
            case 'upload':
                // upload image (2.2 MB)
                I.attachFile('.picture-upload-view input[type="file"][name="file"]', 'e2e/media/placeholder/800x600.png');
                break;
            case 'check:empty-state':
                I.seeElementInDOM('.empty-state');
                break;
            case 'check:not:empty-state':
                I.waitForInvisible('.empty-state');
                break;
            default:
                assert.fail('W.EditPicture: unsupported command', op);
                break;
        }
    }

    return {
        myContactData: myContactData,
        EditPicture: EditPicture
    };
};
