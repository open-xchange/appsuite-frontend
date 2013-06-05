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
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define.async('io.ox/office/tk/utils',
    ['io.ox/office/tk/config',
     'io.ox/core/gettext'
    ], function (Config, gettext) {

    'use strict';

    var // the Deferred object that will be resolved with the Utils class
        def = $.Deferred(),

        // the CSS classes added to localized icons
        localeIconClasses = null,

        // a global timer that can be used for performance debugging
        globalTimer = null,

        // selector for the icon <span> element in a control caption
        ICON_SELECTOR = 'span[data-role="icon"]',

        // selector for the label <span> element in a control caption
        LABEL_SELECTOR = 'span[data-role="label"]';

    // private global functions ===============================================

    /**
     * Writes a message to the browser output console.
     *
     * @param {String} message
     *  The message text to be written to the console.
     *
     * @param {String} [level='log']
     *  The log level of the message. The string 'log' will create a
     *  generic log message, the string 'info' will create an information,
     *  the string 'warn' will create a warning message, and the string
     *  'error' will create an error message.
     */
    function log(message, level) {
        // check that the browser console supports the operation
        if (_.isFunction(window.console[level])) {
            window.console[level](message);
        } else {
            window.console.log(level.toUpperCase() + ': ' + message);
        }
    }

    // static class Utils =====================================================

    var Utils = {};

    // constants --------------------------------------------------------------

    /**
     * A unique object used as return value in callback functions of iteration
     * loops to break the iteration process immediately.
     */
    Utils.BREAK = {};

    /**
     * The full identifier of the current locale, with leading lower-case
     * language identifier, and trailing upper-case country identifier,
     * separated by an underscore character, e.g. 'en_US'.
     */
    Utils.LOCALE = '';

    /**
     * The lower-case language identifier of the current locale, e.g. 'en'.
     */
    Utils.LANGUAGE = '';

    /**
     * The upper-case country identifier of the current locale, e.g. 'US'.
     */
    Utils.COUNTRY = '';

    /**
     * CSS selector for button elements.
     *
     * @constant
     */
    Utils.BUTTON_SELECTOR = '.button';

    /**
     * CSS class for disabled controls.
     *
     * @constant
     */
    Utils.DISABLED_CLASS = 'disabled';

    /**
     * CSS selector for enabled controls.
     *
     * @constant
     */
    Utils.ENABLED_SELECTOR = ':not(.' + Utils.DISABLED_CLASS + ')';

    /**
     * CSS selector for focused controls.
     *
     * @constant
     */
    Utils.FOCUSED_SELECTOR = ':focus';

    /**
     * CSS class for selected (active) buttons or tabs.
     *
     * @constant
     */
    Utils.SELECTED_CLASS = 'selected';

    // generic JS object helpers ----------------------------------------------

    /**
     * Returns a new object containing a single attribute with the specified
     * value.
     *
     * @param {String} key
     *  The name of the attribute to be inserted into the returned object.
     *
     * @param value
     *  The value of the attribute to be inserted into the returned object.
     *
     * @returns {Object}
     *  A new object with a single attribute.
     */
    Utils.makeSimpleObject = function (key, value) {
        var object = {};
        object[key] = value;
        return object;
    };

    /**
     * Compares the two passed numeric arrays lexicographically.
     *
     * @param {Number[]} array1
     *  The first array that will be compared to the second array.
     *
     * @param {Number[]} array2
     *  The second array that will be compared to the first array.
     *
     * returns {Number}
     *  A negative value, if array1 is lexicographically less than array2; a
     *  positive value, if array1 is lexicographically greater than array2; or
     *  zero, if both arrays are equal.
     */
    Utils.compareNumberArrays = function (array1, array2) {

        var // minimum length of both arrays
            length = Math.min(array1.length, array2.length),
            // loop index
            index = 0;

        // compare all array elements
        for (index = 0; index < length; index += 1) {
            if (array1[index] !== array2[index]) {
                return array1[index] - array2[index];
            }
        }

        // leading parts of both arrays are equal, compare array lengths
        return array1.length - array2.length;
    };

    /**
     * Returns whether specific attributes of the passed objects are equal,
     * while ignoring all other attributes. If an attribute is missing in both
     * objects, it is considered to be equal. Uses the Underscore method
     * _.isEqual() to compare the attribute values.
     *
     * @param {Object} object1
     *  The first object to be compared to the other.
     *
     * @param {Object} object2
     *  The second object to be compared to the other.
     *
     * @param {String[]} attributeNames
     *  The names of all attributes of the objects that will be compared.
     *
     * @param {Function} [comparator=_.isEqual]
     *  A binary predicate function that returns true if the passed attribute
     *  values are considered being equal. Will be called, if both objects
     *  passed to this method contain a specific attribute, and receives the
     *  attribute values from both objects.
     *
     * @returns {Boolean}
     *  Whether all specified attributes are equal in both objects.
     */
    Utils.hasEqualAttributes = function (object1, object2, attributeNames, comparator) {

        // default to the _isEqual() method to compare attribute values
        comparator = _.isFunction(comparator) ? comparator : _.isEqual;

        // process all specified attributes
        return _(attributeNames).all(function (attrName) {
            var hasAttr1 = attrName in object1,
                hasAttr2 = attrName in object2;
            return (hasAttr1 === hasAttr2) && (!hasAttr1 || comparator(object1[attrName], object2[attrName]));
        });
    };

    // calculation, conversion, string manipulation ---------------------------

    /**
     * Restricts the passed value to the specified numeric range.
     *
     * @param {Number} value
     *  The value to be restricted to the given range.
     *
     * @param {Number} min
     *  The lower border of the range.
     *
     * @param {Number} max
     *  The upper border of the range.
     *
     * @returns {Number}
     *  The passed value, if inside the given range, otherwise either the lower
     *  or upper border.
     */
    Utils.minMax = function (value, min, max) {
        return Math.min(Math.max(value, min), max);
    };

    /**
     * Rounds the passed floating-point number to the specified number of
     * digits after the decimal point.
     *
     * @param {Number} value
     *  The value to be rounded.
     *
     * @param {Number} digits
     *  The number of digits after the decimal point.
     */
    Utils.roundDigits = function (value, digits) {
        var pow10 = Math.pow(10, digits);
        return _.isFinite(value) ? (Math.round(value * pow10) / pow10) : value;
    };

    /**
     * Rounds the passed floating-point number to the specified number of
     * significant digits, independent from the number of digits before and
     * after the decimal point.
     *
     * @param {Number} value
     *  The value to be rounded.
     *
     * @param {Number} digits
     *  The number of significant digits. Must be positive.
     */
    Utils.roundSignificantDigits = function (value, digits) {
        var pow10 = Math.pow(10, Math.floor(Math.log(value) / Math.log(10)));
        return Utils.roundDigits(value / pow10, digits - 1) * pow10;
    };

    /**
     * Iterates through a range of numbers, without creating a temporary array.
     *
     * @param {Number} begin
     *  The iteration will be started with this value.
     *
     * @param {Number} end
     *  The iteration will be stopped before this value will be reached
     *  (half-open range).
     *
     * @param {Function} iterator
     *  The iterator function that will be called for every value. Receives the
     *  current value as first parameter. If the iterator returns the
     *  Utils.BREAK object, the iteration process will be stopped immediately.
     *
     * @param {Object} [options]
     *  A map of options to control the iteration. Supports the following
     *  options:
     *  @param {Object} [options.context]
     *      If specified, the iterator will be called with this context (the
     *      symbol 'this' will be bound to the context inside the iterator
     *      function).
     *  @param {Number} [options.step]
     *      If specified, the current value will be increased or decreased by
     *      this amount. If omitted, 'step' defaults to 1, if parameter 'begin'
     *      is less then parameter 'end', otherwise 'step' defaults to -1.
     *
     * @returns {Utils.BREAK|Undefined}
     *  A reference to the Utils.BREAK object, if the iterator has returned
     *  Utils.BREAK to stop the iteration process, otherwise undefined.
     */
    Utils.iterateRange = function (begin, end, iterator, options) {

        var // context for iterator function
            context = Utils.getOption(options, 'context'),
            // step value
            step = Utils.getNumberOption(options, 'step', (begin <= end) ? 1 : -1),
            // the current value
            value = begin;

        while ((begin <= end) ? (value < end) : (value > end)) {
            if (iterator.call(context, value) === Utils.BREAK) { return Utils.BREAK; }
            value += step;
        }
    };

    /**
     * Converts a length value from an absolute CSS measurement unit into
     * another absolute CSS measurement unit.
     *
     * @param {Number} value
     *  The length value to convert, as floating-point number.
     *
     * @param {String} fromUnit
     *  The CSS measurement unit of the passed value, as string. Supported
     *  units are 'px' (pixels), 'pc' (picas), 'pt' (points), 'in' (inches),
     *  'cm' (centimeters), and 'mm' (millimeters).
     *
     * @param {String} toUnit
     *  The target measurement unit.
     *
     * @param {Number} [digits]
     *  If specified, the number of digits after the decimal point to round the
     *  result to.
     *
     * @returns {Number}
     *  The length value converted to the target measurement unit, as
     *  floating-point number.
     */
    Utils.convertLength = (function () {

        var // the conversion factors between pixels and other units
            FACTORS = {
                'px': 1,
                'pc': 1 / 9,
                'pt': 4 / 3,
                'in': 96,
                'cm': 96 / 2.54,
                'mm': 96 / 25.4
            };

        return function (value, fromUnit, toUnit, digits) {
            value *= (FACTORS[fromUnit] || 1) / (FACTORS[toUnit] || 1);
            return _.isFinite(digits) ? Utils.roundDigits(value, digits) : value;
        };
    }());

    /**
     * Converts a length value from an absolute CSS measurement unit into 1/100
     * of millimeters.
     *
     * @param {Number} value
     *  The length value to convert, as floating-point number.
     *
     * @param {String} fromUnit
     *  The CSS measurement unit of the passed value, as string. See method
     *  Utils.convertLength() for a list of supported units.
     *
     * @returns {Number}
     *  The length value converted to 1/100 of millimeters, as integer.
     */
    Utils.convertLengthToHmm = function (value, fromUnit) {
        return Math.round(Utils.convertLength(value, fromUnit, 'mm') * 100);
    };

    /**
     * Converts a length value from 1/100 of millimeters into an absolute CSS
     * measurement unit.
     *
     * @param {Number} value
     *  The length value in 1/100 of millimeters to convert, as integer.
     *
     * @param {String} toUnit
     *  The target measurement unit. See method Utils.convertLength() for a
     *  list of supported units.
     *
     * @param {Number} [digits]
     *  If specified, the number of digits after the decimal point to round the
     *  result to.
     *
     * @returns {Number}
     *  The length value converted to the target measurement unit, as
     *  floating-point number.
     */
    Utils.convertHmmToLength = function (value, toUnit, digits) {
        return Utils.convertLength(value / 100, 'mm', toUnit, digits);
    };

    /**
     * Converts a CSS length value with measurement unit into a value of
     * another absolute CSS measurement unit.
     *
     * @param {String} valueAndUnit
     *  The value with its measurement unit to be converted, as string.
     *
     * @param {String} toUnit
     *  The target CSS measurement unit. See method Utils.convertLength() for
     *  a list of supported units.
     *
     * @param {Number} [digits]
     *  If specified, the number of digits after the decimal point to round the
     *  result to.
     *
     * @returns {Number}
     *  The length value converted to the target measurement unit, as
     *  floating-point number.
     */
    Utils.convertCssLength = function (valueAndUnit, toUnit, digits) {
        var value = parseFloat(valueAndUnit);
        if (!_.isFinite(value)) {
            value = 0;
        }
        if (value && (valueAndUnit.length > 2)) {
            value = Utils.convertLength(value, valueAndUnit.substr(-2), toUnit, digits);
        }
        return value;
    };

    /**
     * Converts a CSS length value with measurement unit into 1/100 of
     * millimeters.
     *
     * @param {String} valueAndUnit
     *  The value with its measurement unit to be converted, as string.
     *
     * @returns {Number}
     *  The length value converted to 1/100 of millimeters, as integer.
     */
    Utils.convertCssLengthToHmm = function (valueAndUnit) {
        return Math.round(Utils.convertCssLength(valueAndUnit, 'mm') * 100);
    };

    /**
     * Converts a length value from 1/100 of millimeters into an absolute CSS
     * measurement unit and returns the CSS length with its unit as string.
     *
     * @param {Number} value
     *  The length value in 1/100 of millimeters to convert, as integer.
     *
     * @param {String} toUnit
     *  The target measurement unit. See method Utils.convertLength() for a
     *  list of supported units.
     *
     * @param {Number} [digits]
     *  If specified, the number of digits after the decimal point to round the
     *  result to.
     *
     * @returns {String}
     *  The length value converted to the target measurement unit, followed by
     *  the unit name.
     */
    Utils.convertHmmToCssLength = function (value, toUnit, digits) {
        return Utils.convertHmmToLength(value, toUnit, digits) + toUnit;
    };

    /**
     * Returns whether the passed space-separated token list contains the
     * specified token.
     *
     * @param {String} list
     *  Space-separated list of tokens.
     *
     * @param {String} token
     *  The token to look up in the token list.
     *
     * @returns {Boolean}
     *  Whether the token is contained in the token list.
     */
    Utils.containsToken = function (list, token) {
        return _(list.split(/\s+/)).contains(token);
    };

    /**
     * Inserts the specified token into a space-separated token list. The token
     * will not be inserted if it is already contained in the list.
     *
     * @param {String} list
     *  Space-separated list of tokens.
     *
     * @param {String} token
     *  The token to be inserted into the token list.
     *
     * @param {String} [nothing]
     *  If specified, the name of a token that represents a special 'nothing'
     *  or 'empty' state. If this token is contained in the passed token list,
     *  it will be removed.
     *
     * @returns {String}
     *  The new token list containing the specified token.
     */
    Utils.addToken = function (list, token, nothing) {
        var tokens = list.split(/\s+/);
        if (_.isString(nothing)) {
            tokens = _(tokens).without(nothing);
        }
        if (!_(tokens).contains(token)) {
            tokens.push(token);
        }
        return tokens.join(' ');
    };

    /**
     * Removes the specified token from a space-separated token list.
     *
     * @param {String} list
     *  Space-separated list of tokens.
     *
     * @param {String} token
     *  The token to be removed from the token list.
     *
     * @param {String} [nothing]
     *  If specified, the name of a token that represents a special 'nothing'
     *  or 'empty' state. If the resulting token list is empty, this token will
     *  be inserted instead.
     *
     * @returns {String}
     *  The new token list without the specified token.
     */
    Utils.removeToken = function (list, token, nothing) {
        var tokens = _(list.split(/\s+/)).without(token);
        if (!tokens.length && _.isString(nothing)) {
            tokens.push(nothing);
        }
        return tokens.join(' ');
    };

    /**
     * Inserts a token into or removes a token from the specified
     * space-separated token list.
     *
     * @param {String} list
     *  Space-separated list of tokens.
     *
     * @param {String} token
     *  The token to be inserted into or removed from the token list.
     *
     * @param {Boolean} state
     *  If set to true, the token will be inserted into the token list,
     *  otherwise removed from the token list.
     *
     * @param {String} [nothing]
     *  If specified, the name of a token that represents a special 'nothing'
     *  or 'empty' state.
     *
     * @returns {String}
     *  The new token list.
     */
    Utils.toggleToken = function (list, token, state, nothing) {
        return Utils[state ? 'addToken' : 'removeToken'](list, token, nothing);
    };

    /**
     * Repeats the passed string.
     *
     * @param {String} text
     *  The text to be repeated.
     *
     * @param {Number} count
     *  The number of repetitions.
     *
     * @returns {String}
     *  The generated string.
     */
    Utils.repeatString = function (text, count) {
        var result = null;
        switch (count) {
        case 0:
            return '';
        case 1:
            return text;
        }
        result = Utils.repeatString(text, Math.floor(count / 2));
        result += result;
        if (count % 2) {
            result += text;
        }
        return result;
    };

    /**
     * Trims non-printable characters and white-spaces at the beginning and end
     * of the passed string.
     *
     * @param {String} text
     *  The text to be trimmed.
     *
     * @returns {String}
     *  The trimmed text.
     */
    Utils.trimString = function (text) {
        return text.replace(/^[\x00-\x1f\s]+(.*?)[\x00-\x1f\s]+$/, '$1');
    };

    /**
     * Replaces all non-printable characters (ASCII 0x00-0x1F) in the passed
     * string with space characters.
     *
     * @param {String} text
     *  The text to be cleaned from non-printable characters.
     *
     * @returns {String}
     *  The new text without non-printable characters.
     */
    Utils.cleanString = function (text) {
        return text.replace(/[\x00-\x1f]/g, ' ');
    };

    /**
     * Trims non-printable characters and white-spaces at the beginning and end
     * of the passed string, and replaces all embedded non-printable characters
     * (ASCII 0x00-0x1F) with space characters.
     *
     * @param {String} text
     *  The text to be trimmed and cleaned from non-printable characters.
     *
     * @returns {String}
     *  The new trimmed text without non-printable characters.
     */
    Utils.trimAndCleanString = function (text) {
        return Utils.cleanString(Utils.trimString(text));
    };

    /**
     * Returns the passed text with a capitalized first character.
     *
     * @param {String} text
     *  The text to be converted.
     *
     * @returns {String}
     *  The passed text with a capitalized first character.
     */
    Utils.capitalize = function (text) {
        return (text.length > 0) ? (text[0].toUpperCase() + text.slice(1)) : '';
    };

    /**
     * Returns the passed text with capitalized words.
     *
     * @param {String} text
     *  The text to be converted.
     *
     * @returns {String}
     *  The passed text with capitalized words.
     */
    Utils.capitalizeWords = function (text) {
        return _(text.split(' ')).map(Utils.capitalize).join(' ');
    };

    /**
     * Escapes HTML mark-up characters (angle brackets, ampersand, double
     * quotes, and apostrophs) in the passed text.
     *
     * @param {String} text
     *  The text containing special HTML mark-up characters.
     *
     * @returns {String}
     *  The passed text with all mark-up characters escaped.
     */
    Utils.escapeHTML = function (text) {
        return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    };

    // options object ---------------------------------------------------------

    /**
     * Extracts an attribute value from the passed object. If the attribute
     * does not exist, returns the specified default value.
     *
     * @param {Object|Undefined} options
     *  An object containing some attribute values. May be undefined.
     *
     * @param {String} name
     *  The name of the attribute to be returned.
     *
     * @param [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified attribute.
     *
     * @returns
     *  The value of the specified attribute, or the default value.
     */
    Utils.getOption = function (options, name, def) {
        return (_.isObject(options) && (name in options)) ? options[name] : def;
    };

    /**
     * Extracts a string attribute from the passed object. If the attribute
     * does not exist, or is not a string, returns the specified default value.
     *
     * @param {Object|Undefined} options
     *  An object containing some attribute values. May be undefined.
     *
     * @param {String} name
     *  The name of the string attribute to be returned.
     *
     * @param [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified attribute, or if the attribute
     *  is not a string. May be any value (not only strings).
     *
     * @param {Boolean} [nonEmpty=false]
     *  If set to true, only non-empty strings will be returned from the
     *  options object. Empty strings will be replaced with the specified
     *  default value.
     *
     * @returns
     *  The value of the specified attribute, or the default value.
     */
    Utils.getStringOption = function (options, name, def, nonEmpty) {
        var value = Utils.getOption(options, name);
        return (_.isString(value) && (!nonEmpty || (value.length > 0))) ? value : def;
    };

    /**
     * Extracts a boolean attribute from the passed object. If the attribute
     * does not exist, or is not a boolean value, returns the specified default
     * value.
     *
     * @param {Object|Undefined} options
     *  An object containing some attribute values. May be undefined.
     *
     * @param {String} name
     *  The name of the boolean attribute to be returned.
     *
     * @param [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified attribute, or if the attribute
     *  is not a boolean value. May be any value (not only booleans).
     *
     * @returns
     *  The value of the specified attribute, or the default value.
     */
    Utils.getBooleanOption = function (options, name, def) {
        var value = Utils.getOption(options, name);
        return _.isBoolean(value) ? value : def;
    };

    /**
     * Extracts a floating-point attribute from the passed object. If the
     * attribute does not exist, or is not a number, returns the specified
     * default value.
     *
     * @param {Object|Undefined} options
     *  An object containing some attribute values. May be undefined.
     *
     * @param {String} name
     *  The name of the floating-point attribute to be returned.
     *
     * @param [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified attribute, or if the attribute
     *  is not a number. May be any value (not only numbers).
     *
     * @param [min]
     *  If specified and a number, set a lower bound for the returned value. Is
     *  not used, if neither the attribute nor the passed default are numbers.
     *
     * @param [max]
     *  If specified and a number, set an upper bound for the returned value.
     *  Is not used, if neither the attribute nor the passed default are
     *  numbers.
     *
     * @param [digits]
     *  If specified, the number of digits after the decimal point to round the
     *  attribute value to.
     *
     * @returns
     *  The value of the specified attribute, or the default value, rounded
     *  down to an integer.
     */
    Utils.getNumberOption = function (options, name, def, min, max, digits) {
        var value = Utils.getOption(options, name);
        value = _.isFinite(value) ? value : def;
        if (_.isFinite(value)) {
            if (_.isFinite(min) && (value < min)) { value = min; }
            if (_.isFinite(max) && (value > max)) { value = max; }
            return _.isFinite(digits) ? Utils.roundDigits(value, digits) : value;
        }
        return value;
    };

    /**
     * Extracts an integer attribute from the passed object. If the attribute
     * does not exist, or is not a number, returns the specified default value.
     *
     * @param {Object|Undefined} options
     *  An object containing some attribute values. May be undefined.
     *
     * @param {String} name
     *  The name of the integer attribute to be returned.
     *
     * @param [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified attribute, or if the attribute
     *  is not a number. May be any value (not only numbers).
     *
     * @param [min]
     *  If specified and a number, set a lower bound for the returned value. Is
     *  not used, if neither the attribute nor the passed default are numbers.
     *
     * @param [max]
     *  If specified and a number, set an upper bound for the returned value.
     *  Is not used, if neither the attribute nor the passed default are
     *  numbers.
     *
     * @returns
     *  The value of the specified attribute, or the default value, rounded
     *  down to an integer.
     */
    Utils.getIntegerOption = function (options, name, def, min, max) {
        return Utils.getNumberOption(options, name, def, min, max, 0);
    };

    /**
     * Extracts an object attribute from the passed object. If the attribute
     * does not exist, or is not an object, returns the specified default
     * value.
     *
     * @param {Object|Undefined} options
     *  An object containing some attribute values. May be undefined.
     *
     * @param {String} name
     *  The name of the attribute to be returned.
     *
     * @param [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified attribute, or if the attribute
     *  is not an object. May be any value (not only objects).
     *
     * @returns
     *  The value of the specified attribute, or the default value.
     */
    Utils.getObjectOption = function (options, name, def) {
        var value = Utils.getOption(options, name);
        return (_.isObject(value) && !_.isFunction(value) && !_.isArray(value)) ? value : def;
    };

    /**
     * Extracts a function from the passed object. If the attribute does not
     * exist, or is not a function, returns the specified default value.
     *
     * @param {Object|Undefined} options
     *  An object containing some attribute values. May be undefined.
     *
     * @param {String} name
     *  The name of the attribute to be returned.
     *
     * @param [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified attribute, or if the attribute
     *  is not an object. May be any value (not only functions).
     *
     * @returns
     *  The value of the specified attribute, or the default value.
     */
    Utils.getFunctionOption = function (options, name, def) {
        var value = Utils.getOption(options, name);
        return _.isFunction(value) ? value : def;
    };

    /**
     * Extracts a array from the passed object. If the attribute does not
     * exist, or is not an array, returns the specified default value.
     *
     * @param {Object|Undefined} options
     *  An object containing some attribute values. May be undefined.
     *
     * @param {String} name
     *  The name of the attribute to be returned.
     *
     * @param [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified attribute, or if the attribute
     *  is not an array. May be any value.
     *
     * @param {Boolean} [nonEmpty=false]
     *  If set to true, only non-empty arrays will be returned from the options
     *  object. Empty arrays will be replaced with the specified default value.
     *
     * @returns
     *  The value of the specified attribute, or the default value.
     */
    Utils.getArrayOption = function (options, name, def, nonEmpty) {
        var value = Utils.getOption(options, name);
        return (_.isArray(value) && (!nonEmpty || (value.length > 0))) ? value : def;
    };

    /**
     * Extends the passed object with the specified attributes. Unlike
     * underscore's extend() method, does not modify the passed object, but
     * creates and returns a clone. Additionally, extends embedded objects
     * deeply instead of replacing them.
     *
     * @param {Object} [options]
     *  An object containing some attribute values. If undefined, creates and
     *  extends a new empty object.
     *
     * @param {Object} [...]
     *  Other objects whose attributes will be inserted into the former object.
     *  Will overwrite existing attributes in the clone of the passed object.
     *
     * @returns {Object}
     *  A new clone of the passed object, extended by the new attributes.
     */
    Utils.extendOptions = function (options) {

        function extend(options, extensions) {
            _(extensions).each(function (value, name) {
                if (_.isObject(value) && !_.isArray(value) && !_.isFunction(value) && !(value instanceof $)) {
                    // extension value is an object: ensure that the options map contains an embedded object
                    if (!_.isObject(options[name])) {
                        options[name] = {};
                    }
                    extend(options[name], value);
                } else {
                    // extension value is not an object: clear old value, even if it was an object
                    options[name] = value;
                }
            });
        }

        // create a deep copy of the passed options, or an empty object
        options = _.isObject(options) ? _.copy(options, true) : {};

        // add all extensions to the clone
        for (var index = 1; index < arguments.length; index += 1) {
            if (_.isObject(arguments[index])) {
                extend(options, arguments[index]);
            }
        }

        return options;
    };

    // generic DOM/CSS helpers ------------------------------------------------

    /**
     * A jQuery selector that returns true if the DOM node bound to the 'this'
     * symbol is a text node. Can be used in all helper functions that expect a
     * jQuery selector.
     *
     * @constant
     */
    Utils.JQ_TEXTNODE_SELECTOR = function () { return this.nodeType === 3; };

    /**
     * Converts the passed object to a DOM node object.
     *
     * @param {Node|jQuery} node
     *  If the object is a DOM node object, returns it unmodified. If the
     *  object is a jQuery collection, returns its first node.
     *
     * @returns {Node}
     *  The DOM node object.
     */
    Utils.getDomNode = function (node) {
        return (node instanceof $) ? node.get(0) : node;
    };

    /**
     * Returns whether the passed node is a specific DOM element node.
     *
     * @param {Node|jQuery|Null|Undefined} node
     *  The DOM node to be checked. May be null or undefined.
     *
     * @param {String|Function|Node|jQuery} [selector]
     *  A jQuery selector that can be used to check the passed node for a
     *  specific type etc. The selector will be passed to the jQuery method
     *  jQuery.is(). If this selector is a function, it will be called with the
     *  DOM node bound to the symbol 'this'. See the jQuery API documentation
     *  at http://api.jquery.com/is for details.
     *
     * @returns {Boolean}
     *  Whether the passed node is an element node that matches the passed
     *  selector.
     */
    Utils.isElementNode = function (node, selector) {
        if (!node) { return false; }
        return (Utils.getDomNode(node).nodeType === 1) && (!selector || $(node).is(selector));
    };

    /**
     * Returns the lower-case name of a DOM node object.
     *
     * @param {Node|jQuery} node
     *  The DOM node whose name will be returned. If this object is a jQuery
     *  collection, uses the first node it contains.
     *
     * @returns {String}
     *  The lower-case name of the DOM node object. If the node is a text node,
     *  the string '#text' will be returned.
     */
    Utils.getNodeName = function (node) {
        return Utils.getDomNode(node).nodeName.toLowerCase();
    };

    /**
     * Returns whether the passed outer node contains the passed inner node.
     *
     * @param {Node|jQuery} outerNode
     *  The outer DOM node. If this object is a jQuery collection, uses the
     *  first node it contains.
     *
     * @param {Node|jQuery} innerNode
     *  The inner DOM node. If this object is a jQuery collection, uses the
     *  first node it contains.
     *
     * @returns {Boolean}
     *  Whether the inner node is a descendant of the outer node.
     */
    Utils.containsNode = function (outerNode, innerNode) {

        // convert nodes to DOM node object
        outerNode = Utils.getDomNode(outerNode);
        innerNode = Utils.getDomNode(innerNode);

        // IE does not support contains() method at document
        if (outerNode === document) {
            outerNode = document.body;
            if (innerNode === outerNode) {
                return true;
            }
        }

        // outer node must be an element; be sure that a node does not contain itself
        if ((outerNode.nodeType !== 1) || (outerNode === innerNode)) {
            return false;
        }

        // IE does not accept a DOM text node as parameter for the Node.contains() method
        if (innerNode.nodeType !== 1) {
            innerNode = innerNode.parentNode;
            // check if the parent of the inner text node is the outer node
            if (outerNode === innerNode) {
                return true;
            }
        }

        // Internet Explorer has no 'contains' at svg elements (26172)
        if (! _.isFunction(outerNode.contains)) {
            return $(innerNode).closest(outerNode).length > 0;
        }

        // use the native Node.contains() method
        return outerNode.contains(innerNode);
    };

    /**
     * Returns an integer attribute of the passed element.
     *
     * @param {HTMLElement|jQuery} node
     *  The DOM element whose attribute will be returned. If this object is a
     *  jQuery collection, uses the first node it contains.
     *
     * @param {String} name
     *  The name of the element attribute.
     *
     * @param {Number} def
     *  A default value in case the element does not contain the specified
     *  attribute.
     *
     * @returns {Number}
     *  The attribute value parsed as integer, or the default value.
     */
    Utils.getElementAttributeAsInteger = function (node, name, def) {
        var attr = $(node).attr(name);
        return _.isString(attr) ? parseInt(attr, 10) : def;
    };

    /**
     * Returns whether the passed CSS border position is oriented vertically
     * (either 'top' or 'bottom').
     *
     * @param {String} position
     *  The CSS position, one of 'top', 'bottom', 'left', or 'right'.
     *
     * @returns {Boolean}
     *  Whether the passed position is either 'top' or 'bottom'.
     */
    Utils.isVerticalPosition = function (position) {
        return (position === 'top') || (position === 'bottom');
    };

    /**
     * Returns whether the passed CSS border position is the leading side
     * (either 'top' or 'left').
     *
     * @param {String} position
     *  The CSS position, one of 'top', 'bottom', 'left', or 'right'.
     *
     * @returns {Boolean}
     *  Whether the passed position is either 'top' or 'left'.
     */
    Utils.isLeadingPosition = function (position) {
        return (position === 'top') || (position === 'left');
    };

    /**
     * Sets a CSS formatting attribute with all browser-specific prefixes at
     * the passed element.
     *
     * @param {HTMLElement|jQuery} node
     *  The DOM element whose CSS attribute will be changed. If this object is
     *  a jQuery collection, changes all contained nodes.
     *
     * @param {String} name
     *  The base name of the CSS attribute.
     *
     * @param {Any} value
     *  The new value of the CSS attribute.
     */
    Utils.setCssAttributeWithPrefixes = function (node, name, value) {
        node = $(node);
        _(['-webkit-', '-moz-', '-ms-', '-o-', '']).each(function (prefix) {
            node.css(prefix + name, value);
        });
    };

    /**
     * Returns an integer indicating how the two passed nodes are located to
     * each other.
     *
     * @param {Node|jQuery} node1
     *  The first DOM node tested if it is located before the second node. If
     *  this object is a jQuery collection, uses the first node it contains.
     *
     * @param {Node|jQuery} node2
     *  The second DOM node. If this object is a jQuery collection, uses the
     *  first node it contains.
     *
     * @returns {Number}
     *  The value zero, if the nodes are equal, a negative number, if node1
     *  precedes or contains node2, or a positive number, if node2 precedes or
     *  contains node1.
     */
    Utils.compareNodes = function (node1, node2) {
        node1 = Utils.getDomNode(node1);
        node2 = Utils.getDomNode(node2);
        return (node1 === node2) ? 0 : ((node1.compareDocumentPosition(node2) & 4) === 4) ? -1 : 1;
    };

    /**
     * Iterates over all descendant DOM nodes of the specified element.
     *
     * @param {HTMLElement|jQuery} element
     *  A DOM element object whose descendant nodes will be iterated. If this
     *  object is a jQuery collection, uses the first node it contains.
     *
     * @param {Function} iterator
     *  The iterator function that will be called for every node. Receives the
     *  DOM node as first parameter. If the iterator returns the Utils.BREAK
     *  object, the iteration process will be stopped immediately. The iterator
     *  can remove the visited node descendants from the DOM. It is also
     *  allowed to remove any siblings of the visited node, as long as the
     *  visited node will not be removed itself.
     *
     * @param {Object} [context]
     *  If specified, the iterator will be called with this context (the symbol
     *  'this' will be bound to the context inside the iterator function).
     *
     * @param {Object} [options]
     *  A map of options to control the iteration. Supports the following
     *  options:
     *  @param {Boolean} [options.children]
     *      If set to true, only direct child nodes will be visited.
     *  @param {Boolean} [options.reverse]
     *      If set to true, the descendant nodes are visited in reversed order.
     *
     * @returns {Utils.BREAK|Undefined}
     *  A reference to the Utils.BREAK object, if the iterator has returned
     *  Utils.BREAK to stop the iteration process, otherwise undefined.
     */
    Utils.iterateDescendantNodes = function (element, iterator, context, options) {

        var // only child nodes
            childrenOnly = Utils.getBooleanOption(options, 'children', false),
            // iteration direction
            reverse = Utils.getBooleanOption(options, 'reverse', false),
            // visited node, and the next or previous sibling of the visited node
            childNode = null, nextSibling = null;

        // visit all child nodes
        element = Utils.getDomNode(element);
        for (childNode = reverse ? element.lastChild : element.firstChild; childNode; childNode = nextSibling) {

            // get next/previous sibling in case the iterator removes the node
            nextSibling = reverse ? childNode.previousSibling : childNode.nextSibling;

            // call iterator for child node; if it returns Utils.BREAK, exit loop and return too
            if (iterator.call(context, childNode) === Utils.BREAK) { return Utils.BREAK; }

            // iterate grand child nodes (only if the iterator did not remove the node from the DOM)
            if (Utils.containsNode(element, childNode)) {

                // refresh next sibling (iterator may have removed the old one, or may have inserted another one)
                nextSibling = reverse ? childNode.previousSibling : childNode.nextSibling;

                // if iterator for any descendant node returns Utils.BREAK, return too
                if (!childrenOnly && (childNode.nodeType === 1) && (Utils.iterateDescendantNodes(childNode, iterator, context, options) === Utils.BREAK)) {
                    return Utils.BREAK;
                }
            }
        }
    };

    /**
     * Iterates over selected descendant DOM nodes of the specified element.
     *
     * @param {HTMLElement|jQuery} element
     *  A DOM element object whose descendant nodes will be iterated. If this
     *  object is a jQuery collection, uses the first node it contains.
     *
     * @param {String|Function|Node|jQuery} selector
     *  A jQuery selector that will be used to decide whether to call the
     *  iterator function for the current DOM node. The selector will be passed
     *  to the jQuery method jQuery.is() for each node. If this selector is a
     *  function, it will be called with the current DOM node bound to the
     *  symbol 'this'. See the jQuery API documentation at
     *  http://api.jquery.com/is for details.
     *
     * @param {Function} iterator
     *  The iterator function that will be called for every matching node.
     *  Receives the DOM node as first parameter. If the iterator returns the
     *  Utils.BREAK object, the iteration process will be stopped immediately.
     *  The iterator can remove visited nodes from the DOM.
     *
     * @param {Object} [context]
     *  If specified, the iterator will be called with this context (the symbol
     *  'this' will be bound to the context inside the iterator function).
     *
     * @param {Object} [options]
     *  A map of options to control the iteration. Supports all options that
     *  are supported by the method Utils.iterateDescendantNodes().
     *
     * @returns {Utils.BREAK|Undefined}
     *  A reference to the Utils.BREAK object, if the iterator has returned
     *  Utils.BREAK to stop the iteration process, otherwise undefined.
     */
    Utils.iterateSelectedDescendantNodes = function (element, selector, iterator, context, options) {

        return Utils.iterateDescendantNodes(element, function (node) {
            if ($(node).is(selector) && (iterator.call(context, node) === Utils.BREAK)) {
                return Utils.BREAK;
            }
        }, context, options);
    };

    /**
     * Returns the first descendant DOM node in the specified element that
     * passes a truth test using the specified jQuery selector.
     *
     * @param {HTMLElement|jQuery} element
     *  A DOM element object whose descendant nodes will be searched. If this
     *  object is a jQuery collection, uses the first node it contains.
     *
     * @param {String|Function|Node|jQuery} selector
     *  A jQuery selector that will be used to find the DOM node. The selector
     *  will be passed to the jQuery method jQuery.is() for each node. If this
     *  selector is a function, it will be called with the current DOM node
     *  bound to the symbol 'this'. See the jQuery API documentation at
     *  http://api.jquery.com/is for details.
     *
     * @param {Object} [options]
     *  A map of options to control the iteration. Supports all options that
     *  are supported by the method Utils.iterateDescendantNodes().
     *
     * @returns {Node|Null}
     *  The first descendant DOM node that matches the passed selector. If no
     *  matching node has been found, returns null.
     */
    Utils.findDescendantNode = function (element, selector, options) {

        var // the node to be returned
            resultNode = null;

        // find the first node passing the iterator test
        Utils.iterateSelectedDescendantNodes(element, selector, function (node) {
            resultNode = node;
            return Utils.BREAK;
        }, undefined, options);

        return resultNode;
    };

    /**
     * Returns a child node of the passed node, that is at a specific index in
     * the array of all matching child nodes.
     *
     * @param {HTMLElement|jQuery} element
     *  A DOM element object whose child nodes will be visited. If this object
     *  is a jQuery collection, uses the first node it contains.
     *
     * @param {String|Function|Node|jQuery} selector
     *  A jQuery selector that will be used to decide which child nodes are
     *  matching while searching to the specified index. The selector will be
     *  passed to the jQuery method jQuery.is() for each node. If this selector
     *  is a function, it will be called with the current DOM node bound to the
     *  symbol 'this'. See the jQuery API documentation at
     *  http://api.jquery.com/is for details.
     *
     * @param {Number} index
     *  The zero-based index of the child node in the set of child nodes
     *  matching the selector that will be returned.
     *
     * @returns {Node|Null}
     *  The 'index'-th child node that matches the selector; or null, if the
     *  index is outside the valid range.
     */
    Utils.getSelectedChildNodeByIndex = function (element, selector, index) {

        var // the node to be returned
            resultNode = null;

        // find the 'index'-th matching child node
        Utils.iterateSelectedDescendantNodes(element, selector, function (node) {
            // node found: store and escape from loop
            if (index === 0) {
                resultNode = node;
                return Utils.BREAK;
            }
            index -= 1;
        }, undefined, { children: true });

        return resultNode;
    };

    /**
     * Finds the closest ancestor of the passed node that matches the specified
     * jQuery selector. In difference to the jQuery method jQuery.closest(),
     * the passed node selector can be a function, and the found parent can be
     * the root node itself.
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The DOM root node that will not be left while searching for an ancestor
     *  node. If this object is a jQuery collection, uses the first node it
     *  contains.
     *
     * @param {Node|jQuery} node
     *  The DOM node whose chain of ancestors will be searched for a matching
     *  node. Must be a descendant of the passed root node. If this object is a
     *  jQuery collection, uses the first node it contains.
     *
     * @param {String|Function|Node|jQuery} selector
     *  A jQuery selector that will be used to find the ancestor DOM node. The
     *  selector will be passed to the jQuery method jQuery.is() for each node.
     *  If this selector is a function, it will be called with the current DOM
     *  node bound to the symbol 'this'. See the jQuery API documentation at
     *  http://api.jquery.com/is for details.
     *
     * @returns {Node|Null}
     *  The first ancestor node that matches the passed selector, and is
     *  contained in or equal to the root node; or null, no node has been
     *  found.
     */
    Utils.findClosestParent = function (rootNode, node, selector) {

        rootNode = Utils.getDomNode(rootNode);
        node = Utils.getDomNode(node).parentNode;
        while (node && !$(node).is(selector)) {
            node = node.parentNode;
        }

        return (node && ((rootNode === node) || Utils.containsNode(rootNode, node))) ? node : null;
    };

    /**
     * Finds the closest previous sibling node of the passed node that matches
     * a jQuery selector.
     *
     * @param {Node|jQuery} node
     *  The DOM node whose previous matching sibling will be returned. If this
     *  object is a jQuery collection, uses the first node it contains.
     *
     * @param {String|Function|Node|jQuery} [selector]
     *  A jQuery selector that will be used to find a matching sibling. The
     *  selector will be passed to the jQuery method jQuery.is() for each node.
     *  If this selector is a function, it will be called with the current DOM
     *  node bound to the symbol 'this'. See the jQuery API documentation at
     *  http://api.jquery.com/is for details. If omitted, this method returns
     *  the direct previous sibling of the passed node.
     *
     * @returns {Node|Null}
     *  The previous matching sibling of the passed node; or null, no previous
     *  sibling node has been found.
     */
    Utils.findPreviousSiblingNode = function (node, selector) {
        node = Utils.getDomNode(node).previousSibling;
        if (!_.isUndefined(selector)) {
            while (node && !$(node).is(selector)) {
                node = node.previousSibling;
            }
        }
        return node;
    };

    /**
     * Finds the closest next sibling node of the passed node that matches a
     * jQuery selector.
     *
     * @param {Node|jQuery} node
     *  The DOM node whose next matching sibling will be returned. If this
     *  object is a jQuery collection, uses the first node it contains.
     *
     * @param {String|Function|Node|jQuery} [selector]
     *  A jQuery selector that will be used to find a matching sibling. The
     *  selector will be passed to the jQuery method jQuery.is() for each node.
     *  If this selector is a function, it will be called with the current DOM
     *  node bound to the symbol 'this'. See the jQuery API documentation at
     *  http://api.jquery.com/is for details. If omitted, this method returns
     *  the direct next sibling of the passed node.
     *
     * @returns {Node|Null}
     *  The next matching sibling of the passed node; or null, no next sibling
     *  node has been found.
     */
    Utils.findNextSiblingNode = function (node, selector) {
        node = Utils.getDomNode(node).nextSibling;
        if (!_.isUndefined(selector)) {
            while (node && !$(node).is(selector)) {
                node = node.nextSibling;
            }
        }
        return node;
    };

    /**
     * Finds a previous sibling node of the passed node in the DOM tree. If the
     * node is the first child of its parent, bubbles up the chain of parent
     * nodes and continues with the previous sibling of the first ancestor that
     * has more siblings. An optional jQuery selector can be specified to
     * search through the previous siblings until a matching node has been
     * found.
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The DOM root node whose sub node tree will not be left when searching
     *  for the previous sibling node. If this object is a jQuery collection,
     *  uses the first node it contains.
     *
     * @param {Node|jQuery} node
     *  The DOM node whose previous sibling will be returned. Must be a
     *  descendant of the passed root node. If this object is a jQuery
     *  collection, uses the first node it contains.
     *
     * @param {String|Function|Node|jQuery} [selector]
     *  A jQuery selector that will be used to find a DOM node. The selector
     *  will be passed to the jQuery method jQuery.is() for each node. If this
     *  selector is a function, it will be called with the current DOM node
     *  bound to the symbol 'this'. See the jQuery API documentation at
     *  http://api.jquery.com/is for details. If omitted, this method returns
     *  the direct next sibling of the passed node.
     *
     * @param {String|Function|Node|jQuery} [skipSiblingsSelector]
     *  A jQuery selector that will be used to to identify DOM nodes whose
     *  siblings will be ignored completely, even if they match the specified
     *  selector. If omitted, this method visits all descendant nodes of all
     *  siblings while searching for a matching node.
     *
     * @returns {Node|Null}
     *  The previous sibling of the passed node in the DOM sub tree of the root
     *  node; or null, no node has been found.
     */
    Utils.findPreviousNode = function (rootNode, node, selector, skipSiblingsSelector) {

        // set 'node' to the previous sibling (of itself or one of its parents)
        function previousNode() {

            // go to previous sibling if existing
            if (node && node.previousSibling) {
                node = node.previousSibling;

                // start with deepest last descendant node in the previous sibling
                while (node && (_.isUndefined(skipSiblingsSelector) || !$(node).is(skipSiblingsSelector)) && node.lastChild) {
                    node = node.lastChild;
                }
            } else {
                // otherwise, go to parent, but do not leave the root node
                node = (node.parentNode === rootNode) ? null : node.parentNode;
            }
        }

        rootNode = Utils.getDomNode(rootNode);
        node = Utils.getDomNode(node);

        previousNode();
        if (!_.isUndefined(selector)) {
            while (node && !$(node).is(selector)) { previousNode(); }
        }

        return node;
    };

    /**
     * Finds a next sibling node of the passed node in the DOM tree. If the
     * node is the last child of its parent, bubbles up the chain of parent
     * nodes and continues with the next sibling of the first ancestor that has
     * more siblings. An optional jQuery selector can be specified to search
     * through the next siblings until a matching node has been found.
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The DOM root node whose sub node tree will not be left when searching
     *  for the next sibling node. If this object is a jQuery collection, uses
     *  the first node it contains.
     *
     * @param {Node|jQuery} node
     *  The DOM node whose next sibling will be returned. Must be a descendant
     *  of the passed root node. If this object is a jQuery collection, uses
     *  the first node it contains.
     *
     * @param {String|Function|Node|jQuery} [selector]
     *  A jQuery selector that will be used to find a DOM node. The selector
     *  will be passed to the jQuery method jQuery.is() for each node. If this
     *  selector is a function, it will be called with the current DOM node
     *  bound to the symbol 'this'. See the jQuery API documentation at
     *  http://api.jquery.com/is for details. If omitted, this method returns
     *  the direct next sibling of the passed node.
     *
     * @param {String|Function|Node|jQuery} [skipSiblingsSelector]
     *  A jQuery selector that will be used to to identify DOM nodes whose
     *  siblings will be ignored completely, even if they match the specified
     *  selector. If omitted, this method visits all descendant nodes of all
     *  siblings while searching for a matching node.
     *
     * @returns {Node|Null}
     *  The next sibling of the passed node in the DOM sub tree of the root
     *  node; or null, no node has been found.
     */
    Utils.findNextNode = function (rootNode, node, selector, skipSiblingsSelector) {

        var // visit descendant nodes
            visitDescendants = false;

        // set 'node' to the next sibling (of itself or one of its parents)
        function nextNode() {

            // visit descendant nodes if specified
            if (visitDescendants && node && (_.isUndefined(skipSiblingsSelector) || !$(node).is(skipSiblingsSelector)) && node.firstChild) {
                node = node.firstChild;
                return;
            }

            // for next call: always visit descendant nodes of own or parent siblings
            visitDescendants = true;

            // find first node up the tree that has a next sibling
            while (node && !node.nextSibling) {
                // do not leave the root node
                node = (node.parentNode === rootNode) ? null : node.parentNode;
            }

            // go to that next sibling
            node = node && node.nextSibling;
        }

        rootNode = Utils.getDomNode(rootNode);
        node = Utils.getDomNode(node);

        nextNode();
        if (!_.isUndefined(selector)) {
            while (node && !$(node).is(selector)) { nextNode(); }
        }

        return node;
    };

    // positioning and scrolling ----------------------------------------------

    // calculate size of system scroll bars
    (function () {

        var // dummy container used to calculate the scroll bar sizes
            node = $('<div>').css({ width: '100px', height: '100px', overflow: 'scroll' });

        $('body').append(node);
        Utils.SCROLLBAR_WIDTH = node.width() - node[0].clientWidth;
        Utils.SCROLLBAR_HEIGHT = node.height() - node[0].clientHeight;
        node.remove();
    }());

    /**
     * Returns whether the passed DOM element contains a visible vertical
     * scroll bar.
     *
     * @param {HTMLElement|jQuery} node
     *  The DOM element. If this object is a jQuery collection, uses the first
     *  node it contains.
     *
     * @returns {Boolean}
     *  Whether the DOM element contains a visible vertical scroll bar.
     */
    Utils.hasVerticalScrollBar = function (node) {
        return $(node).width() > Utils.getDomNode(node).clientWidth;
    };

    /**
     * Returns whether the passed DOM element contains a visible horizontal
     * scroll bar.
     *
     * @param {HTMLElement|jQuery} node
     *  The DOM element. If this object is a jQuery collection, uses the first
     *  node it contains.
     *
     * @returns {Boolean}
     *  Whether the DOM element contains a visible horizontal scroll bar.
     */
    Utils.hasHorizontalScrollBar = function (node) {
        return $(node).height() > Utils.getDomNode(node).clientHeight;
    };

    /**
     * Returns the position and size of the specified node inside visible area
     * of the browser window. This includes the distances of all four borders
     * of the node to the borders of the browser window.
     *
     * @param {HTMLElement|jQuery} node
     *  The DOM element whose position relative to the browser window will be
     *  calculated. If this object is a jQuery collection, uses the first node
     *  it contains.
     *
     * @returns {Object}
     *  An object with numeric attributes representing the position and size of
     *  the node relative to the browser window in pixels:
     *  - 'left': the distance of the left border of the node to the left
     *      border of the browser window,
     *  - 'top': the distance of the top border of the node to the top border
     *      of the browser window,
     *  - 'right': the distance of the right border of the node to the right
     *      border of the browser window,
     *  - 'bottom': the distance of the bottom border of the node to the bottom
     *      border of the browser window,
     *  - 'width': the outer width of the node (including its borders),
     *  - 'height': the outer height of the node (including its borders).
     */
    Utils.getNodePositionInWindow = function (node) {

        var // the passed node, as jQuery object
            $node = $(node),
            // the offset of the node, relative to the browser window
            position = $node.offset();

        // add size and right/bottom distances
        position.width = $node.outerWidth();
        position.height = $node.outerHeight();
        position.right = window.innerWidth - position.left - position.width;
        position.bottom = window.innerHeight - position.top - position.height;

        return position;
    };

    /**
     * Returns the position of the visible area of the passed scrollable node.
     * This includes the size of the visible area without scroll bars (if
     * shown), and the distances of all four borders of the visible area to the
     * borders of the entire scroll area.
     *
     * @param {HTMLElement|jQuery} node
     *  The scrollable DOM element. If this object is a jQuery collection, uses
     *  the first node it contains.
     *
     * @returns {Object}
     *  An object with numeric attributes representing the position and size of
     *  the visible area relative to the entire scroll area of the node in
     *  pixels:
     *  - 'left': the distance of the left border of the visible area to the
     *      left border of the entire scroll area,
     *  - 'top': the distance of the top border of the visible area to the top
     *      border of the entire scroll area,
     *  - 'right': the distance of the right border of the visible area
     *      (without scroll bar) to the right border of the entire scroll area,
     *  - 'bottom': the distance of the bottom border of the visible area
     *      (without scroll bar) to the bottom border of the entire scroll
     *      area,
     *  - 'width': the width of the visible area (without scroll bar),
     *  - 'height': the height of the visible area (without scroll bar).
     */
    Utils.getVisibleAreaPosition = function (node) {
        node = Utils.getDomNode(node);
        return {
            left: node.scrollLeft,
            top: node.scrollTop,
            right: node.scrollWidth - node.clientWidth - node.scrollLeft,
            bottom: node.scrollHeight - node.clientHeight - node.scrollTop,
            width: node.clientWidth,
            height: node.clientHeight
        };
    };

    /**
     * Returns the position and size of the specified window rectangle inside
     * the passed scrollable node. This includes the size of the rectangle as
     * specified, and the distances of all four borders of the rectangle to the
     * borders of the visible area or entire scroll area of the scrollable
     * node.
     *
     * @param {HTMLElement|jQuery} scrollableNode
     *  The scrollable DOM element. If this object is a jQuery collection, uses
     *  the first node it contains.
     *
     * @param {Object} windowRect
     *  The rectangle whose position and size relative to the scrollable node
     *  will be calculated. Must provide the attributes 'left', 'top', 'width',
     *  and 'height' in pixels. The attributes 'left' and 'top' are interpreted
     *  relatively to the browser window.
     *
     * @param {Object} [options]
     *  A map of options to control the calculation. Supports the following
     *  options:
     *  @param {Boolean} [options.visibleArea=false]
     *      If set to true, calculates the distances of the window rectangle to
     *      the visible area of the scrollable node. Otherwise, returns the
     *      top and left position and the size of the window rectangle
     *      unmodified, and adds the distance of its right and bottom borders
     *      to the right and bottom borders of the entire scroll area of the
     *      scrollable node.
     *
     * @returns {Object}
     *  An object with numeric attributes representing the position and size of
     *  the window rectangle relative to the entire scroll area or visible area
     *  of the scrollable node in pixels:
     *  - 'left': the distance of the left border of the window rectangle to
     *      the left border of the scrollable node,
     *  - 'top': the distance of the top border of the window rectangle to the
     *      top border of the scrollable node,
     *  - 'right': the distance of the right border of the window rectangle to
     *      the right border of the scrollable node,
     *  - 'bottom': the distance of the bottom border of the window rectangle
     *      to the bottom border of the scrollable node,
     *  - 'width': the width of the window rectangle, as passed,
     *  - 'height': the height of the window rectangle, as passed.
     */
    Utils.getRectanglePositionInNode = function (scrollableNode, windowRect, options) {

        var // the passed scrollable node, as jQuery object
            $scrollableNode = $(scrollableNode),
            // the offset of the scrollable node, relative to the browser window
            scrollableOffset = $scrollableNode.offset(),
            // the width of the left and top border of the scrollable node, in pixels
            leftBorderWidth = Utils.convertCssLength($scrollableNode.css('borderLeftWidth'), 'px'),
            topBorderWidth = Utils.convertCssLength($scrollableNode.css('borderTopWidth'), 'px'),
            // dimensions of the visible area of the scrollable node
            visiblePosition = Utils.getVisibleAreaPosition(scrollableNode),

            // the dimensions of the window rectangle, relative to the visible area of the scrollable node
            dimensions = {
                left: windowRect.left + leftBorderWidth - scrollableOffset.left,
                top: windowRect.top + topBorderWidth - scrollableOffset.top,
                width: windowRect.width,
                height: windowRect.height
            };

        // add right and bottom distance of child node to visible area
        dimensions.right = visiblePosition.width - dimensions.left - dimensions.width;
        dimensions.bottom = visiblePosition.height - dimensions.top - dimensions.height;

        // add distances to entire scroll area, if option 'visibleArea' is not set
        if (!Utils.getBooleanOption(options, 'visibleArea', false)) {
            _(['left', 'top', 'right', 'bottom']).each(function (border) {
                dimensions[border] += visiblePosition[border];
            });
        }

        return dimensions;
    };

    /**
     * Returns the dimensions of the specified child node inside its scrollable
     * ancestor node. This includes the size of the child node, and the
     * distances of all four borders of the child node to the borders of the
     * visible area or entire scroll area of the scrollable node.
     *
     * @param {HTMLElement|jQuery} scrollableNode
     *  The scrollable DOM element. If this object is a jQuery collection, uses
     *  the first node it contains.
     *
     * @param {HTMLElement|jQuery} childNode
     *  The DOM element whose dimensions will be calculated. Must be contained
     *  in the specified scrollable element. If this object is a jQuery
     *  collection, uses the first node it contains.
     *
     * @param {Object} [options]
     *  A map of options to control the calculation. Supports the following
     *  options:
     *  @param {Boolean} [options.visibleArea=false]
     *      If set to true, calculates the distances of the child node to the
     *      visible area of the scrollable node. Otherwise, calculates the
     *      distances of the child node to the entire scroll area of the
     *      scrollable node.
     *
     * @returns {Object}
     *  An object with numeric attributes representing the position and size of
     *  the child node relative to the entire scroll area or visible area of
     *  the scrollable node in pixels:
     *  - 'left': the distance of the left border of the child node to the
     *      left border of the scrollable node,
     *  - 'top': the distance of the top border of the child node to the top
     *      border of the scrollable node,
     *  - 'right': the distance of the right border of the child node to the
     *      right border of the scrollable node,
     *  - 'bottom': the distance of the bottom border of the child node to the
     *      bottom border of the scrollable node,
     *  - 'width': the outer width of the child node (including its borders),
     *  - 'height': the outer height of the child node (including its borders).
     */
    Utils.getChildNodePositionInNode = function (scrollableNode, childNode, options) {
        var windowPosition = Utils.getNodePositionInWindow(childNode);
        return Utils.getRectanglePositionInNode(scrollableNode, windowPosition, options);
    };

    /**
     * Scrolls the passed window rectangle into the visible area of the
     * specified scrollable node.
     *
     * @param {HTMLElement|jQuery} scrollableNode
     *  The scrollable DOM element. If this object is a jQuery collection, uses
     *  the first node it contains.
     *
     * @param {Object} windowRect
     *  The rectangle of the browser window that will be made visible by
     *  scrolling the scrollable node. Must provide the attributes 'left',
     *  'top', 'width', and 'height' in pixels. The attributes 'left' and 'top'
     *  are interpreted relatively to the browser window.
     *
     * @param {Object} [options]
     *  A map of options to control the scroll action. Supports the following
     *  options:
     *  @param {Number} [options.padding=0]
     *      Minimum distance between the borders of the visible area and the
     *      rectangle.
     */
    Utils.scrollToWindowRectangle = function (scrollableNode, windowRect, options) {

        var // dimensions of the rectangle in the visible area of the scrollable node
            position = Utils.getRectanglePositionInNode(scrollableNode, windowRect, { visibleArea: true }),
            // padding between scrolled element and border of visible area
            padding = Utils.getIntegerOption(options, 'padding', 0, 0);

        function updateScrollPosition(leadingChildOffset, trailingChildOffset, scrollAttributeName) {

            var maxPadding = Utils.minMax((leadingChildOffset + trailingChildOffset) / 2, 0, padding),
                offset = Math.max(leadingChildOffset - Math.max(maxPadding - trailingChildOffset, 0), maxPadding);

            Utils.getDomNode(scrollableNode)[scrollAttributeName] -= (offset - leadingChildOffset);
        }

        updateScrollPosition(position.left, position.right, 'scrollLeft');
        updateScrollPosition(position.top, position.bottom, 'scrollTop');
    };

    /**
     * Scrolls the passed child node into the visible area of the specified
     * scrollable container node.
     *
     * @param {HTMLElement|jQuery} scrollableNode
     *  The scrollable DOM element that contains the specified child node. If
     *  this object is a jQuery collection, uses the first node it contains.
     *
     * @param {HTMLElement|jQuery} childNode
     *  The DOM element that will be made visible by scrolling the specified
     *  scrollable container element. If this object is a jQuery collection,
     *  uses the first node it contains.
     *
     * @param {Object} [options]
     *  A map of options to control the scroll action. Supports the following
     *  options:
     *  @param {Number} [options.padding=0]
     *      Minimum distance between the borders of the visible area and the
     *      child node.
     */
    Utils.scrollToChildNode = function (scrollableNode, childNode, options) {
        var windowPosition = Utils.getNodePositionInWindow(childNode);
        Utils.scrollToWindowRectangle(scrollableNode, windowPosition, options);
    };

    // form control elements --------------------------------------------------

    /**
     * Creates and returns a new <div> container element.
     *
     * @param {String} className
     *  CSS class name set at the container element.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new element. The
     *  following options are supported:
     *  @param {String} [options.classes]
     *      A space-separated list of CSS classes to be added to the element.
     *  @param {Object} [options.css]
     *      A map with CSS formatting attributes to be added to the element.
     *
     * @returns {jQuery}
     *  A jQuery object containing the new container element.
     */
    Utils.createContainerNode = function (className, options) {
        return $('<div>')
            .addClass(className)
            .addClass(Utils.getStringOption(options, 'classes', ''))
            .css(Utils.getObjectOption(options, 'css', {}));
    };

    /**
     * Creates and returns a new form control element.
     *
     * @param {String} elementName
     *  The tag name of the DOM element to be created.
     *
     * @param {Object} [attributes]
     *  A map of attributes to be passed to the element constructor.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new element. The
     *  following options are supported:
     *  @param [options.value]
     *      A value, object, or function that will be copied to the
     *      'data-value' attribute of the control. Must not be null or
     *      undefined.
     *  @param [options.userData]
     *      A value or object that will be copied to the 'data-userdata'
     *      attribute of the control. May contain any user-defined data.
     *  @param {Number|String} [options.width]
     *      The total width of the control element (including padding). If
     *      omitted, the size will be set automatically according to the
     *      contents of the control.
     *  @param {Object} [options.css]
     *      A map with CSS formatting attributes to be added to the control.
     *
     * @returns {jQuery}
     *  A jQuery object containing the new control element.
     */
    Utils.createControl = function (elementName, attributes, options) {

        var // create the DOM element
            control = $('<' + elementName + '>', attributes);

        control
            .width(Utils.getOption(options, 'width', ''))
            .css(Utils.getObjectOption(options, 'css', {}));

        Utils.setControlValue(control, Utils.getOption(options, 'value'));
        Utils.setControlUserData(control, Utils.getOption(options, 'userData'));

        return control;
    };

    /**
     * Returns the value stored in the 'value' data attribute of the first
     * control in the passed jQuery collection. If the stored value is a
     * function, calls that function and returns its result.
     *
     * @param {jQuery} control
     *  A jQuery collection containing a control element.
     */
    Utils.getControlValue = function (control) {
        var value = control.first().data('value');
        return _.isFunction(value) ? value() : value;
    };

    /**
     * Stores the passed value in the 'value' data attribute of the first
     * control in the passed jQuery collection.
     *
     * @param {jQuery} control
     *  A jQuery collection containing a control element.
     *
     * @param value
     *  A value, object, or function that will be copied to the 'value' data
     *  attribute of the control. Must not be null or undefined.
     */
    Utils.setControlValue = function (control, value) {
        if (!_.isUndefined(value) && !_.isNull(value)) {
            control.data('value', value);
        }
    };

    /**
     * Returns the value stored in the 'userdata' data attribute of the first
     * control in the passed jQuery collection.
     *
     * @param {jQuery} control
     *  A jQuery collection containing a control element.
     */
    Utils.getControlUserData = function (control) {
        return control.first().data('userdata');
    };

    /**
     * Stores the passed value in the 'userdata' data attribute of the first
     * control in the passed jQuery collection.
     *
     * @param {jQuery} control
     *  A jQuery collection containing a control element.
     *
     * @param value
     *  A value or object that will be copied to the 'userdata' data attribute
     *  of the control.
     */
    Utils.setControlUserData = function (control, value) {
        control.data('userdata', value);
    };

    /**
     * Returns whether the first form control in the passed jQuery collection
     * is enabled.
     *
     * @param {jQuery} control
     *  A jQuery collection containing a form control.
     *
     * @returns {Boolean}
     *  True, if the form control is enabled.
     */
    Utils.isControlEnabled = function (control) {
        return control.first().is(Utils.ENABLED_SELECTOR);
    };

    /**
     * Enables or disables all form controls in the passed jQuery collection.
     *
     * @param {jQuery} controls
     *  A jQuery collection containing one or more form controls.
     *
     * @param {Boolean} [state]
     *  If omitted or set to true, all form controls in the passed collection
     *  will be enabled. Otherwise, all controls will be disabled.
     *
     * @returns {Boolean}
     *  The effective state (whether the controls are enabled or disabled now).
     */
    Utils.enableControls = function (controls, state) {
        var enabled = _.isUndefined(state) || (state === true);
        controls.toggleClass(Utils.DISABLED_CLASS, !enabled);
        return enabled;
    };

    /**
     * Returns whether the first form control in the passed jQuery collection
     * is currently focused.
     *
     * @param {jQuery} control
     *  A jQuery collection containing a form control.
     *
     * @returns {Boolean}
     *  True, if the form control is focused.
     */
    Utils.isControlFocused = function (control) {
        return control.first().is(Utils.FOCUSED_SELECTOR);
    };

    /**
     * Returns the form control from the passed jQuery collection, if it is
     * currently focused.
     *
     * @param {jQuery} controls
     *  A jQuery collection containing form controls.
     *
     * @returns {jQuery}
     *  The focused control, as new jQuery collection. Will be empty, if the
     *  passed collection does not contain a focused control.
     */
    Utils.getFocusedControl = function (controls) {
        return controls.filter(Utils.FOCUSED_SELECTOR);
    };

    /**
     * Returns whether the passed jQuery collection contains a focused control.
     *
     * @param {jQuery} controls
     *  A jQuery collection containing form controls.
     *
     * @returns {Boolean}
     *  True, if one of the elements in the passed jQuery collection is
     *  focused.
     */
    Utils.hasFocusedControl = function (controls) {
        return Utils.getFocusedControl(controls).length !== 0;
    };

    /**
     * Returns whether one of the elements in the passed jQuery collection
     * contains a control that is focused.
     *
     * @param {jQuery} node
     *  A jQuery collection with container elements that contain different form
     *  controls.
     *
     * @returns {Boolean}
     *  True, if one of the container elements contains a focused form control.
     */
    Utils.containsFocusedControl = function (node) {
        return node.find(Utils.FOCUSED_SELECTOR).length !== 0;
    };

    // control captions -------------------------------------------------------

    /**
     * Create and returns a new <i> DOM element representing an icon.
     *
     * @param {String} icon
     *  The CSS class name of the icon. Will be set at the created element.
     *
     * @returns {jQuery}
     *  The new icon element, as jQuery object.
     */
    Utils.createIcon = function (icon, white) {
        return $('<i>').addClass(icon + ' ' + localeIconClasses).toggleClass('retina', _.device('retina'));
    };

    /**
     * Returns whether the passed form control contains an icon and/or a text
     * label.
     *
     * @param {jQuery} control
     *  The control, as jQuery collection.
     */
    Utils.hasControlCaption = function (control) {
        return control.first().children('div.caption').length > 0;
    };

    /**
     * Inserts an icon and a text label into the passed form control.
     *
     * @param {jQuery} control
     *  The control to be manipulated, as jQuery collection.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the caption. The
     *  following options are supported:
     *  @param {String} [options.icon]
     *      The full name of the Bootstrap or OX icon class. If omitted, no
     *      icon will be shown.
     *  @param {String} [options.label]
     *      The text label. Will follow an icon. If omitted, no text will be
     *      shown.
     *  @param {Object} [options.labelCss]
     *      A map with CSS formatting attributes to be added to the label span.
     *      Does not have any effect, if no label has been specified.
     */
    Utils.setControlCaption = function (control, options) {

        var // option values
            icon = Utils.getStringOption(options, 'icon'),
            label = Utils.getStringOption(options, 'label'),
            labelCss = Utils.getObjectOption(options, 'labelCss'),

            // the caption container node
            caption = null;

        // restrict to one element in the passed collection
        control = control.first();

        // create a caption container if missing
        caption = control.children('div.caption');
        if (caption.length === 0) {
            control.prepend(caption = $('<div>').addClass('caption'));
        }

        // remove the old caption spans
        caption.empty();

        // append the icon
        if (icon) {
            caption.append($('<span>')
                .attr('data-role', 'icon')
                .attr('data-icon', icon)
                .append(Utils.createIcon(icon))
            );
        }

        // append the label
        if (_.isString(label)) {
            caption.append($('<span>')
                .attr('data-role', 'label')
                .text(label || '')
                .css(labelCss || {}));
        }

        // remove the caption from the control if it is empty
        if (caption.children().length === 0) {
            caption.remove();
        }
    };

    /**
     * Returns the text label of the first control in the passed jQuery
     * collection.
     *
     * @param {jQuery} control
     *  A jQuery collection containing a form control.
     *
     * @return {String|Undefined}
     *  The text label of the control, if existing, otherwise undefined.
     */
    Utils.getControlLabel = function (control) {
        var label = control.first().children('div.caption').children(LABEL_SELECTOR);
        return label.length ? label.text() : undefined;
    };

    /**
     * Adds a tool tip box to the specified control.
     *
     * @param {jQuery} control
     *  A jQuery collection containing a form control.
     *
     * @param {String} [tooltip]
     *  Tool tip text shown when the mouse hovers the control. If omitted, the
     *  control will not show a tool tip.
     *
     * @param {String} [placement='top']
     *  Placement of the tool tip box. Allowed values are 'top', 'bottom',
     *  'left', and 'right'.
     */
    Utils.setControlTooltip = function (control, tooltip, placement) {
        control.first().attr('title', tooltip || '');
    };

    // label elements ---------------------------------------------------------

    /**
     * Creates and returns a new label element.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new label. Supports
     *  all generic options supported by the methods Utils.createControl() and
     *  Utils.setControlLabel().
     *
     * @returns {jQuery}
     *  A jQuery object containing the new label element.
     */
    Utils.createLabel = function (options) {

        var // create the DOM label element
            label = Utils.createControl('label', undefined, options);

        Utils.setControlCaption(label, options);
        // must catch mouse events, otherwise IE9 enlarges width of labels to window size...
        label.on('mousedown mouseup', false);
        return label;
    };

    // button elements --------------------------------------------------------

    /**
     * Creates and returns a new button element.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new button. Supports
     *  all generic options supported by the method Utils.createControl(), and
     *  all caption options supported by the method Utils.setControlLabel().
     *
     * @returns {jQuery}
     *  A jQuery object containing the new button element. The button element
     *  will be represented by an <a> DOM element due to rendering bugs in
     *  FireFox with <button> elements.
     */
    Utils.createButton = function (options) {

        var // Create the DOM anchor element representing the button (href='#' is
            // essential for tab traveling). Do NOT use <button> elements, Firefox has
            // problems with text clipping and correct padding of the <button> contents.
            button = Utils.createControl('a', { href: '#', tabindex: 0 }, options).addClass('button');

        Utils.setControlCaption(button, options);
        return button;
    };

    /**
     * Returns whether the first button control in the passed jQuery collection
     * is in selected state.
     *
     * @param {jQuery} button
     *  A jQuery collection containing a button element.
     *
     * @returns {Boolean}
     *  True, if the button is selected.
     */
    Utils.isButtonSelected = function (button) {
        return button.first().hasClass(Utils.SELECTED_CLASS);
    };

    /**
     * Returns the selected button controls from the passed jQuery collection.
     *
     * @param {jQuery} buttons
     *  A jQuery collection containing button elements.
     *
     * @returns {jQuery}
     *  A jQuery collection with all selected buttons.
     */
    Utils.getSelectedButtons = function (buttons) {
        return buttons.filter('.' + Utils.SELECTED_CLASS);
    };

    /**
     * Selects, deselects, or toggles the passed button or collection of
     * buttons.
     *
     * @param {jQuery} buttons
     *  A jQuery collection containing one or more button elements.
     *
     * @param {Boolean} [state]
     *  If omitted, toggles the selection state of all buttons. Otherwise,
     *  selects or deselects all buttons.
     */
    Utils.toggleButtons = function (buttons, state) {
        buttons.toggleClass(Utils.SELECTED_CLASS, state);
    };

    /**
     * Activates a single button from the passed collection of buttons, after
     * deactivating all buttons in the collection.
     *
     * @param {jQuery} buttons
     *  A jQuery collection containing one or more button elements.
     *
     * @param value
     *  The value of the button to be activated. If set to null, or if no
     *  button with the specified value has been found, deactivates all buttons
     *  and does not activate a button.
     *
     * @param {Function} [equality=_.isEqual]
     *  A comparison function that returns whether the specified value should
     *  be considered being equal to the values of the buttons in the passed
     *  button collection. If omitted, uses _.isEqual() which compares arrays
     *  and objects deeply.
     *
     * @returns {jQuery}
     *  The activated button, if existing, otherwise an empty jQuery object.
     */
    Utils.selectOptionButton = function (buttons, value, equality) {

        var // the predicate function to use for comparison
            equals = _.isFunction(equality) ? equality : _.isEqual,
            // find the button to be activated
            button = (_.isUndefined(value) || _.isNull(value)) ? $() : buttons.filter(function () {
                return equals(value, Utils.getControlValue($(this)));
            });

        // remove highlighting from all buttons, highlight active button
        Utils.toggleButtons(buttons, false);
        Utils.toggleButtons(button, true);
        return button;
    };

    // text field elements ----------------------------------------------------

    /**
     * Creates and returns a new text input field.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new text input field.
     *  Supports all generic options supported by the Utils.createControl()
     *  method. Additionally, the following options are supported:
     *  @param {String} [options.placeholder='']
     *      A place holder text that will be shown in an empty text field.
     *
     * @returns {jQuery}
     *  A jQuery object containing the new text field element.
     */
    Utils.createTextField = function (options) {
        var textField = Utils.createControl('input', { type: 'text' }, options);
        return textField.attr('placeholder', Utils.getStringOption(options, 'placeholder', ''));
    };

    /**
     * Returns the current selection in the passed text field.
     *
     * @param {jQuery} textField
     *  A jQuery object containing a text field element.
     *
     * @returns {Object}
     *  An object with the attributes 'start' and 'end' containing the start
     *  and end character offset of the selection in the text field.
     */
    Utils.getTextFieldSelection = function (textField) {
        var input = textField.get(0);
        return input ? { start: input.selectionStart, end: input.selectionEnd } : undefined;
    };

    /**
     * Changes the current selection in the passed text field.
     *
     * @param {jQuery} textField
     *  A jQuery object containing a text field element.
     *
     * @param {Number} start
     *  The start character offset of the new selection in the text field.
     *
     * @param {Number} [end=start]
     *  The end character offset of the new selection in the text field. If
     *  omitted, sets a text cursor according to the passed start position.
     */
    Utils.setTextFieldSelection = function (textField, start, end) {
        var input = textField.get(0);
        if (input) {
            input.selectionStart = start;
            input.selectionEnd = _.isNumber(end) ? end : start;
        }
    };

    // functions for the global timer ----------------------------------------------------

    /**
     * Starting the global timer.
     *
     * @param {String} message
     *  A message that is displayed in the console, when the timer starts.
     */
    Utils.startGlobalTimer = function (message) {
        Utils.log(message);
        globalTimer = _.now();
    };

    /**
     * Logging info from the global timer.
     *
     * @param {String} message
     *  A message that is displayed in the console, if the timer runs.
     */
    Utils.logGlobalTimer  = function (message) {
        if (globalTimer) {
            Utils.log(message + ' (' + (_.now() - globalTimer) + 'ms)');
        }
    };

    /**
     * Stopping the global timer.
     *
     * @param {String} message
     *  A message that is displayed in the console, when the timer is stopped.
     */
    Utils.stopGlobalTimer = function (message) {
        if (globalTimer) {
            Utils.log(message + ' (' + (_.now() - globalTimer) + 'ms)');
            globalTimer = null;
        }
    };

    /**
     * Checking if the global timer is already running.
     *
     * @returns {Boolean}
     *  Whether the global timer is running.
     */
    Utils.isGlobalTimerRunning = function () {
        return globalTimer !== null;
    };

    // key codes --------------------------------------------------------------

    /**
     * A map of key codes that will be passed to keyboard events.
     */
    Utils.KeyCodes = {

        BACKSPACE:      8,
        TAB:            9,
        ENTER:          13,
        SHIFT:          16,
        CONTROL:        17,
        ALT:            18,
        BREAK:          19,
        CAPS_LOCK:      20,
        ESCAPE:         27,
        SPACE:          32,
        PAGE_UP:        33,
        PAGE_DOWN:      34,
        END:            35,
        HOME:           36,
        LEFT_ARROW:     37,
        UP_ARROW:       38,
        RIGHT_ARROW:    39,
        DOWN_ARROW:     40,
        PRINT:          44,
        INSERT:         45,
        DELETE:         46,

        0:              48,
        1:              49,
        2:              50,
        3:              51,
        4:              52,
        5:              53,
        6:              54,
        7:              55,
        8:              56,
        9:              57,

        MOZ_SEMICOLON:  59,     // Semicolon in Firefox (otherwise: 186 SEMICOLON)
        MOZ_OPEN_ANGLE: 60,     // Open angle in Firefox, German keyboard (otherwise: 226 OPEN_ANGLE)
        MOZ_EQUAL_SIGN: 61,     // Equal sign in Firefox (otherwise: 187 EQUAL_SIGN)

        A:              65,
        B:              66,
        C:              67,
        D:              68,
        E:              69,
        F:              70,
        G:              71,
        H:              72,
        I:              73,
        J:              74,
        K:              75,
        L:              76,
        M:              77,
        N:              78,
        O:              79,
        P:              80,
        Q:              81,
        R:              82,
        S:              83,
        T:              84,
        U:              85,
        V:              86,
        W:              87,
        X:              88,
        Y:              89,
        Z:              90,

        LEFT_WINDOWS:   91,
        RIGHT_WINDOWS:  92,
        SELECT:         93,

        NUM_0:          96,     // attention: numpad keys totally broken in Opera
        NUM_1:          97,
        NUM_2:          98,
        NUM_3:          99,
        NUM_4:          100,
        NUM_5:          101,
        NUM_6:          102,
        NUM_7:          103,
        NUM_8:          104,
        NUM_9:          105,

        NUM_MULTIPLY:   106,
        NUM_PLUS:       107,
        NUM_MINUS:      109,
        NUM_POINT:      110,
        NUM_DIVIDE:     111,

        F1:             112,
        F2:             113,
        F3:             114,
        F4:             115,
        F5:             116,
        F6:             117,
        F7:             118,
        F8:             119,
        F9:             120,
        F10:            121,
        F11:            122,
        F12:            123,

        NUM_LOCK:       144,
        SCROLL_LOCK:    145,

        IME_INPUT:      229     // indicates an IME input session

/* enable when needed
        MOZ_HASH:       163,    // Hash sign in Firefox, German keyboard (otherwise: 191 SLASH)
        MOZ_PLUS:       171,    // Plus sign in Firefox, German keyboard (otherwise: 187 EQUAL_SIGN)
        MOZ_DASH:       173,    // Dash sign in Firefox (otherwise: 189 DASH)

        SEMICOLON:      186,    // (but Firefox: 59 MOZ_SEMICOLON)
        EQUAL_SIGN:     187,    // (but Firefox: 61 MOZ_EQUAL_SIGN)
        COMMA:          188,
        DASH:           189,    // (but Firefox: 173 MOZ_DASH)
        PERIOD:         190,
        SLASH:          191,
        GRAVE:          192,
        OPEN_BRACKET:   219,
        BACKSLASH:      220,
        CLOSE_BRACKET:  221,
        APOSTROPH:      222,
        OPEN_ANGLE:     226     // Open angle, German keyboard (but Firefox: 60 MOZ_OPEN_ANGLE)
*/
    };

    // console output =========================================================

    /**
     * Writes a log message to the browser output console, if debug mode is
     * enabled in the global configuration.
     *
     * @param {String} message
     *  The message text to be written to the console.
     */
    Utils.log = Config.isDebug() ? function (message) { log(message, 'log'); } : $.noop;

    /**
     * Writes an info message to the browser output console, if debug mode is
     * enabled in the global configuration.
     *
     * @param {String} message
     *  The message text to be written to the console.
     */
    Utils.info = Config.isDebug() ? function (message) { log(message, 'info'); } : $.noop;

    /**
     * Writes a warning message to the browser output console, if debug mode is
     * enabled in the global configuration.
     *
     * @param {String} message
     *  The message text to be written to the console.
     */
    Utils.warn = Config.isDebug() ? function (message) { log(message, 'warn'); } : $.noop;

    /**
     * Writes an error message to the browser output console, if debug mode is
     * enabled in the global configuration.
     *
     * @param {String} message
     *  The message text to be written to the console.
     */
    Utils.error = Config.isDebug() ? function (message) { log(message, 'error'); } : $.noop;

    /**
     * Writes an error message to the browser output console describing the
     * passed exception object, if debug mode is enabled in the global
     * configuration.
     *
     * @param {Any} exception
     *  The exception as caught in a try/catch.
     */
    Utils.exception = Config.isDebug() ? function (exception) {

        var // the stacktrace of the exception object
            stacktrace = _.isObject(exception) && (exception.stack || exception.stacktrace);

        log('Exception caught: ' + exception, 'error');
        if (stacktrace) {
            log('Stack trace: ' + stacktrace, 'error');
        }

    } : $.noop;

    /**
     * Executes the passed callback function and writes a message to the
     * browser console containing the execution time of the callback.
     *
     * @param {String} message
     *  The message that will be printed to the browser console. The execution
     *  time will be appended to that message.
     *
     * @param {Function} callback
     *  The callback function to be executed.
     *
     * @param {Object} [context]
     *  The context to be bound to the callback function.
     */
    Utils.takeTime = function (message, callback, context) {
        var t0 = _.now();
        try {
            return callback.call(context);
        } finally {
            Utils.log(message + ' (' + (_.now() - t0) + 'ms)');
        }
    };

    // global initialization ==================================================

    // deferred initialization of class members according to current language
    gettext.language.done(function (language) {

        var // extract language and country identifier
            matches = /^([a-z]+)(_([A-Z]+))?/.exec(language);

        Utils.LOCALE = language;
        if (_.isArray(matches)) {
            Utils.LANGUAGE = matches[1] || '';
            Utils.COUNTRY = matches[3] || '';
        }

        localeIconClasses = 'lc-' + language;
        if ((Utils.LANGUAGE !== '') && (Utils.COUNTRY !== '')) {
            localeIconClasses += ' lc-' + Utils.LANGUAGE;
        }

        // resolve the exported Deferred with the complete Utils class
        def.resolve(Utils);
    });

    // exports ================================================================

    return def;

});
