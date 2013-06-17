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
     'io.ox/office/tk/control/textfield'
    ], function (Utils, TextField) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // default validator without any restrictions on the field text
        defaultValidator = null;

    // class UnitField ========================================================

    /**
     * Creates a container element used to hold an input field for length and
     * length unit.
     *
     * @constructor
     *
     * @extends TextField
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the unit field. Supports
     *  all options of the Group base class, generic caption options (see
     *  Utils.setControlCaption() for details), and all generic formatting
     *  options of input fields (see method Utils.createTextField() for
     *  details). Additionally, the following options are supported:
     *  @param {Boolean} [options.readOnly=false]
     *      If set to true, the text in the unit field cannot be edited.
     *  @param {Boolean} [options.select=false]
     *      If set to true, the entire text will be selected after the text
     *      field has been clicked. Note that the text will always be selected
     *      independent from this option, if the unit field gets focus via
     *      keyboard navigation.
     *  @param {UnitField.LengthUnitValidator} [options.validator]
     *      A validator that will be used to convert the values from 'update'
     *      events to the text representation used in this unit field, to
     *      validate the text while typing in the unit field, and to convert
     *      the entered text to the value returned by the action handler. If no
     *      validator has been specified, a default validator will be used.
     */
    function UnitField(options) {

        var // self reference
            self = this;

        // base constructor ---------------------------------------------------

        TextField.call(this, Utils.extendOptions({validator: defaultValidator}, options));

        // private methods ----------------------------------------------------

        // methods ------------------------------------------------------------

        // initialization -----------------------------------------------------

    } // class UnitField

    // class UnitField.LengthUnitValidator ========================================

    /**
     * A validator for unit fields that restricts the allowed values to
     * floating-point numbers and optionally an additional unit. Supported
     * values for the unit are 'px', 'pc', 'pt', 'in', 'cm' and 'mm'. If the
     * unit cannot be matched with one unit of this list, 'mm' is used as
     * fallback unit.
     *
     * @constructor
     *
     * @extends TextField.Validator
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
     *  @param {Number} [options.digits=2]
     *      The number of digits after the decimal point. If omitted, defaults
     *      to 2.
     */
    UnitField.LengthUnitValidator = TextField.Validator.extend({ constructor: function (options) {

        var // minimum and maximum
            min = Utils.getNumberOption(options, 'min', -Number.MAX_VALUE, -Number.MAX_VALUE, Number.MAX_VALUE),
            max = Utils.getNumberOption(options, 'max', Number.MAX_VALUE, min, Number.MAX_VALUE),
            // the number of digits after the decimal point.
            digits = Utils.getIntegerOption(options, 'digits', 2, 0, 10),
            // the regular expression for the unit field
            regex = new RegExp('^' + ((min < 0) ? '(-?' : '(') + '[0-9]*' + ((digits > 0) ? '[.|,]?' : '') + '[0-9]*)\\s*([a-zA-Z]*)?' + '$'),
            // the supported units
            supportedUnits = ['px', 'pc', 'pt', 'in', 'cm', 'mm'];

        // base constructor ---------------------------------------------------

        TextField.Validator.call(this);

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
            return _.isFinite(value) ? String(Utils.roundDigits(value / 100, digits)) + ' mm' : '';
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
            var a = regex.exec(text),
                value = a[1],
                unit = a[2];

            value = (_.isFinite(value) && (min <= value) && (value <= max)) ? Utils.roundDigits(value, digits) : null;

            if (value !== null) {
                unit = (_.contains(supportedUnits, unit)) ? unit : 'mm';
                value = Utils.convertLengthToHmm(value, unit);
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
            var check = regex.test(text);
            return check;
        };

    }}); // class UnitField.LengthUnitValidator

    // global instance of the default validator for unit fields
    // that supports only positive lengths with two digits after
    // the decimal point
    defaultValidator = new UnitField.LengthUnitValidator({min: 0});

    // exports ================================================================

    // derive this class from class TextField
    return TextField.extend({ constructor: UnitField });

});
