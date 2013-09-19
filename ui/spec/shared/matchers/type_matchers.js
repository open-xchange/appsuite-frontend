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

    var typeMatchers = {
            //simples
            toBeEmpty: function () {
                //defined and empty
                var val = this.actual,
                    emp = !(_.isNull(val) || _.isUndefined(val) || _.isNaN(val)) && _.isEmpty(val);
                //return (this.isNot ? !empty : empty)
                expect(emp).toBeTruthy();
                return true;
            },

            toBeString: function () {
                return typeof this.actual === 'string';
            },

            toBeBoolean: function () {
                return this.actual === true || this.actual === false;
            },

            //arrays
            toBeArray: function () {
                return this.actual instanceof Array;
            },
            toBeArrayOfSize: function (size) {
                return typeMatchers.toBeArray.call(this) && this.actual.length === size;
            },

            //functions
            toBeFunction: function () {
                return this.actual instanceof Function;
            },

            //special: Modernizr
            toBeModernizrString: function () {
                return !this.actual || this.actual === '' ||  this.actual === 'maybe' ||  this.actual === 'probably';
            },

            //special: jQuery
            toBeJquery: function () {
                var result = this.actual instanceof $;
                expect(this.isNot ? !result : result).toBeTruthy();
                return true;
            },
            toBeEmptyJquery: function () {
                var result = this.actual && this.actual.length === 0;
                expect(this.isNot ? !result : result).toBeTruthy();
                return true;
            },

            //speical: check list of results
            eachToEqual: function (value) {
                var list = _.filter([].concat(this.actual), function (test) {
                    return test !== value;
                });
                return list.length === 0;
            }
        };

    beforeEach(function () {
        this.addMatchers(typeMatchers);
    });
}
