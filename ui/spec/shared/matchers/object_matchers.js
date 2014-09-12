/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

//contains matchers to be used with objects
if (jasmine) {
    var objectMatchers = {
            //used to see if a key is present. undefined, null or false do still pass this test
            toHaveKey: function (key) {
                var notText = this.isNot ? ' not' : '';
                this.message = function () { return 'Expected ' + JSON.stringify(this.actual) + ' to' + notText + ' contain ' + key + ' .'; };
                return key in this.actual;
            }
        };

    beforeEach(function () {
        this.addMatchers(objectMatchers);
    });
}
