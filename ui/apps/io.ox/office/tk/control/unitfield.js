/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Ingo Schmidt-Rosbiegal <ingo.schmidt-rosbiegal@open-xchange.com>
 */

define('io.ox/office/tk/control/unitfield',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/spinfield'
    ], function (Utils, SpinField) {

    'use strict';

    // class UnitValidator ====================================================

    /**
     * A validator for unit fields that restricts the allowed values to
     * floating-point numbers and optionally an additional unit. Supported
     * values for the unit are 'px', 'pc', 'pt', 'in', 'cm' and 'mm'. If the
     * unit cannot be matched with one unit of this list, 'mm' is used as
     * fallback unit.
     *
     * @constructor
     *
     * @extends SpinField.NumberValidator
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the validator. The
     *  following options are supported:
     *  @param {Number} [options.min]
     *      The minimum value allowed to enter. If omitted, defaults to
     *      -Number.MAX_VALUE.
     *  @param {Number} [options.max]
     *      The maximum value allowed to enter. If omitted, defaults to
     *      Number.MAX_VALUE.
     *  @param {Number} [options.precision=1]
     *      The precision used to round the current length. The length will be
     *      rounded to multiples of this value. If omitted, the default
     *      precision 1 will round to integers. Must be positive.
     */
    var UnitValidator = SpinField.NumberValidator.extend({ constructor: function (options) {

        var // the regular expression for the unit field
            regex = null,

            // the supported units
            supportedUnits = ['px', 'pc', 'pt', 'in', 'cm', 'mm'];

        // base constructor ---------------------------------------------------

        SpinField.NumberValidator.call(this, options);

        // methods ------------------------------------------------------------

        /**
         * Returning a string for the number value that can be displayed
         * in the unit field. This string always has to contain the value
         * in the unit 'mm'.
         *
         * @param {Number} value
         *  The length in 1/100 mm
         *
         * @returns {String}
         *  The calculated length in 'mm' together with the string ' mm'. If
         *  the value is invalid, an empty string is returned.
         */
        this.valueToText = function (value) {
            return _.isFinite(value) ? String(Utils.round(value, this.getPrecision()) / 100) + ' mm' : '';
        };

        /**
         * Calculating the length value from the text that was inserted into the
         * side pane. The string has to contain a number (optinally with '-' and
         * ',' or '.') and optionally a string that represents the unit. Supported
         * unit strings are 'px', 'pc', 'pt', 'in', 'cm' and 'mm'. If this unit
         * string is not defined or if it cannot be resolved to one of the listed
         * units, 'mm' is used as default, to calculate the length in 1/100 mm.
         *
         * @param {String} text
         *  The string that was inserted into the unit field.
         *
         * @returns {Number}
         *  The length in 1/100 mm or null, if the number value is invalid.
         */
        this.textToValue = function (text) {

            var matches = regex.exec(text) || [],
                value = matches[1],
                unit = (matches[3] || '').toLowerCase();

            if (_.isFinite(value)) {
                unit = _(supportedUnits).contains(unit) ? unit : 'mm';
                value = this.restrictValue(Utils.convertLengthToHmm(value, unit));
            }

            return value;
        };

        /**
         * The validation functions, that controls the input into the unit field
         * corresponding to the defined regular expression.
         *
         * @returns {Boolean}
         *  Whether the input into the unit field matches the defined regular
         *  expression.
         */
        this.validate = function (text) {
            return regex.test(text);
        };

        // initialization -----------------------------------------------------

        // the regular expression for the unit field
        regex = new RegExp('^(' + ((this.getMin() < 0) ? '-?' : '') + '[0-9]*([.,][0-9]*)?)\\s*([a-zA-Z]*)$');

    }}); // class UnitValidator

    // class UnitField ========================================================

    /**
     * A specialized spin field used to represent and input a length value
     * together with a measurement unit.
     *
     * @constructor
     *
     * @extends SpinField
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the unit field. Supports
     *  all options of the SpinField base class and the UnitValidator class (a
     *  sub class of TextField.NumberValidator), except the option
     *  'options.validator' which will be set to an instance of UnitValidator.
     */
    function UnitField(options) {

        // base constructor ---------------------------------------------------

        SpinField.call(this, Utils.extendOptions(options, { validator: new UnitValidator(options) }));

    } // class UnitField

    // exports ================================================================

    // derive this class from class SpinField
    return SpinField.extend({ constructor: UnitField });

});
