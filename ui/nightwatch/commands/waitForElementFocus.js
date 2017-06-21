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

var util = require('util');

/**
 * Waits until an element specified by the selector has the focus
 * @param selector {string}
 * @param timeout {number} optional, the maximum time to wait for the selector to have the focus. Default is 5000
 */
exports.command = function (selector, timeout) {

    timeout = timeout || 5000;

    this.waitForStatement(function (selector) {
        return $(selector).is(':focus');
    }, [selector], timeout, 500, function error() {
        this.assert.fail('not found', 'focus', util.format('Timedout while waiting for "%s" to have focus.', selector));
    });

    return this;

};
