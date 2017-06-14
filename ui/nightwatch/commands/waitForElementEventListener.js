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
  * Waits for an event listener to be registered.
  * @param selector {string}
  * @param eventType {string} for example click or focus
  * @param timeout {number} optional, default is global waitForConditionTimeout setting (5000)
  */
exports.command = function (selector, eventType, timeout) {

    this.waitForStatement(function (selector, eventType) {
        var ev = $._data(document.querySelector(selector), 'events');
        return !!ev[eventType];
    }, [selector, eventType], timeout, 500, function error() {
        this.assert.fail('not found', eventType, 'Timedout while waiting for "' + selector + '" to have event type "' + eventType + '".');
    });

    return this;

};
