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

/**
 * This simplifies the input of mail addresses into input fields.
 * There is an array of users defined in the globals. If you want to fill in a mailadress of such a user
 * you can simply use this function.
 * @param selector {string} the selector of an editable field
 * @param userIndex {number} the users position in the global users array
 */
exports.command = function (selector, userIndex) {

    var users = this.globals.users;
    if (!users || !users.length) this.assert.fail('user not found', 'A configured user', 'Expected at least one configured user in the global array "users".');
    if (users.length < userIndex) this.assert.fail('user not found', 'A user at index ' + userIndex, 'Expected a configured user in the globals "users" array at position ' + userIndex + '.');
    var user = users[userIndex];
    if (!user.mail) this.assert.fail('user without mail', 'A configured mail address for user at index ' + userIndex, 'Expected a user with email address when calling insertMailaddress.');

    this.setValue(selector, user.mail);

    return this;

};
