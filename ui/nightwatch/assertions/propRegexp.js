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

exports.assertion = function (selector, prop, regexp) {

    this.message = util.format('Testing if %s of <%s> equals "%s".', prop, selector, regexp.toString());

    this.expected = function () {
        return regexp.toString();
    };

    this.pass = function (value) {
        return regexp.test(value);
    };

    this.failure = function (result) {
        var failed = !result.value || !result.value.success;

        if (failed && result.value.success === false) {
            this.message += ' Element could not be found.';
        }

        return failed;
    };

    this.value = function (result) {
        if (!result.value) return null;
        return result.value.prop;
    };

    this.command = function (callback) {
        this.api.execute(function (selector, prop) {
            var elem = $(selector);
            if (!elem.length) return { success: false };
            return {
                success: true,
                prop: elem.prop(prop)
            };
        }, [selector, prop], callback);
        return this;
    };

};
