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

exports.assertion = function (selector, expected) {

    this.message = util.format('Testing if text of <%s> equals "%s".', selector, expected);

    this.expected = function () {
        return expected;
    };

    this.pass = function (value) {
        return value === expected;
    };

    this.value = function (result) {
        return result.value;
    };

    this.command = function (callback) {
        this.api.execute(function (selector) {
            try {
                return $(selector).text();
            } catch (e) {
                return $(selector.replace(/::shadow/g, '')).text();
            }
        }, [selector], callback);
        return this;
    };

};
