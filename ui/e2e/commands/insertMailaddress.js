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
module.exports = function (selector, userIndex) {

    var users = global.users;
    if (userIndex < 0 || userIndex >= users.length) userIndex = 0;
    var user = users[userIndex];
    this.fillField(selector, user.mail);

};
