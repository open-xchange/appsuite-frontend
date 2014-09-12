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

//contains matchers for comparing numbers
if (jasmine) {
    var mathMatchers = {
            //used to compare to numbers
            toBeGreaterOrEqualTo: function (number) {
                var notText = this.isNot ? ' not' : '';
                this.message = function () { return 'Expected ' + JSON.stringify(this.actual) + notText + ' to be greater or equal to ' + key + ' .'; };
                return (this.actual >= number);
            },
            //used to compare to numbers
            toBeLessOrEqualTo: function (number) {
                var notText = this.isNot ? ' not' : '';
                this.message = function () { return 'Expected ' + JSON.stringify(this.actual) + notText + ' to be less or equal to ' + key + ' .'; };
                return (this.actual <= number);
            }
        };

    beforeEach(function () {
        this.addMatchers(mathMatchers);
    });
}
