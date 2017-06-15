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
 * This is a special waitForElementVisible function in case an element might be inside a shadow dom.
 * The selector should contain the ::shadow selector somewhere. If that selector fails, this function will try to find
 * the target element without the ::shadow selector
 * @param selector {string}
 * @param timeout {number} default is global waitForConditionTimeout setting (5000)
 */
exports.command = function (selector, timeout) {

    this
        .waitForStatement(function (selector) {
            var isVisible = false;
            try {
                isVisible = $(selector).is(':visible');
            } catch (e) {
                isVisible = $(selector.replace(/::shadow/g, '')).is(':visible');
            }
            return isVisible;
        }, [selector], timeout, 500, function error() {
            this.assert.fail('not visible', 'visible', 'Timedout while waiting for "' + selector + '" to to become visible.');
        });

    return this;

};
