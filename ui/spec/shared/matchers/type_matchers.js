/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
if (jasmine) {

    var matchers = {

        //arrays
        toBeArray: function () {
            return this.actual instanceof Array;
        },
        toBeArrayOfSize: function (size) {
            return matchers.toBeArray.call(this) && this.actual.length === size;
        },

        //functions
        toBeFunction: function () {
            return this.actual instanceof Function;
        }
    };

    beforeEach(function () {
        this.addMatchers(matchers);
    });
};
