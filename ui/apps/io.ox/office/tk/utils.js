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
     *
     * @constant
     */
    Utils.BREAK = {};

    /**
     * The full identifier of the current locale, with leading lower-case
     * language identifier, and trailing upper-case country identifier,
     * separated by an underscore character, e.g. 'en_US'.
     *
     * @constant
     */
    Utils.LOCALE = '';

    /**
     * The lower-case language identifier of the current locale, e.g. 'en'.
     *
     * @constant
     */
    Utils.LANGUAGE = '';

    /**
     * The upper-case country identifier of the current locale, e.g. 'US'.
     *
     * @constant
     */
    Utils.COUNTRY = '';

    /**
     * CSS class for button elements.
     *
     * @constant
     */
    Utils.BUTTON_CLASS = 'button';

    /**
     * CSS selector for button elements.
     *
     * @constant
     */
    Utils.BUTTON_SELECTOR = '.' + Utils.BUTTON_CLASS;

    /**
     * CSS class for hidden elements.
     */
    Utils.HIDDEN_CLASS = 'hidden';

    /**
     * CSS selector for visible elements.
     */
    Utils.VISIBLE_SELECTOR = ':not(.' + Utils.HIDDEN_CLASS + ')';

    /**
     * jQuery selector for elements that are effectively visible.
     *
     * @constant
     */
    Utils.REALLY_VISIBLE_SELECTOR = ':visible';

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
     * CSS class for selected (active) buttons or tabs.
     *
     * @constant
     */
    Utils.SELECTED_CLASS = 'selected';

    /**
     * CSS selector for selected (active) buttons or tabs.
     *
     * @constant
     */
    Utils.SELECTED_SELECTOR = '.' + Utils.SELECTED_CLASS;

    /**
     * CSS class for elements that contain the focused node.
     *
     * @constant
     */
    Utils.FOCUSED_CLASS = 'focused';

    /**
     * CSS class for focusable control elements.
     *
     * @constant
     */
    Utils.FOCUSABLE_CLASS = 'focusable';

    /**
     * CSS selector for focusable control elements.
     *
     * @constant
     */
    Utils.FOCUSABLE_SELECTOR = '.' + Utils.FOCUSABLE_CLASS;

    /**
     * A Boolean flag specifying whether the current display is a retina
     * display.
     *
     * @constant
     */
    Utils.RETINA = _.device('retina');

    /**
     * A Boolean flag specifying whether the Internet Explorer 9 is running.
     *
     * @constant
     */
    Utils.IE9 = _.isNumber(_.browser.IE) && (_.browser.IE < 10);

    /**
     * The maximum explicit size of single DOM nodes, in pixels. The size is
     * limited by browsers; by using larger sizes the elements may collapse to
     * zero size.
     * - IE limits this to 1,533,917 (2^31/1400) in both directions.
     * - Firefox limits this to 17,895,696 (0x1111110) in both directions.
     * - Chrome limits this to 33,554,428 (0x1FFFFFC) in both directions.
     *
     * @constant
     */
    Utils.MAX_NODE_SIZE = _.browser.IE ? 1.5e6 : _.browser.WebKit ? 33.5e6 : 17.8e6;

    /**
     * The maximum width of a container node that can be reached by inserting
     * multiple child nodes, in pixels. The width is limited by browsers; by
     * inserting more nodes the width of the container node becomes incorrect
     * or collapses to zero.
     * - IE limits this to 10,737,418 (2^31/200) pixels.
     * - Firefox and Chrome do not allow to extend the container node beyond
     *   the explicit size limits of a single node (see comment for the
     *   Utils.MAX_NODE_SIZE constant above).
     */
    Utils.MAX_CONTAINER_WIDTH = _.browser.IE ? 10.7e7 : Utils.MAX_NODE_SIZE;

    /**
     * The maximum height of a container node that can be reached by inserting
     * multiple child nodes, in pixels. The height is limited by browsers; by
     * inserting more nodes the height of the container node becomes incorrect
     * or collapses to zero.
     * - IE limits this to 21,474,836 (2^31/100) pixels.
     * - Firefox and Chrome do not allow to extend the container node beyond
     *   the explicit size limits of a single node (see comment for the
     *   Utils.MAX_NODE_SIZE constant above).
     */
    Utils.MAX_CONTAINER_HEIGHT = _.browser.IE ? 21.4e6 : Utils.MAX_NODE_SIZE;

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

    /**
     * Finds the last element in the passed array, that passed a truth test.
     *
     * @param {Array} array
     *  The array to be searched for a matching element.
     *
     * @param {Function} iterator
     *  The iterator implementing the truth test. Receives the array element,
     *  the element index, and the complete array. The method iterates
     *  backwards through the array, and returns the first array element that
     *  passes the truth test.
     *
     * @param {Object} [context]
     *  If specified, the iterator will be called with this context (the symbol
     *  'this' will be bound to the context inside the iterator function).
     *
     * @returns {Any}
     *  The last matching element in the array; or undefined, if no element
     *  passes the truth test.
     */
    Utils.findLast = function (array, iterator, context) {
        for (var index = array.length - 1; index >= 0; index -= 1) {
            if (iterator.call(context, array[index], index, array)) {
                return array[index];
            }
        }
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
     * Rounds the passed floating-point number to the nearest multiple of the
     * specified precision.
     *
     * @param {Number} value
     *  The floating-point number to be rounded.
     *
     * @param {Number} precision
     *  The precision used to round the number. The value 1 will round to
     *  integers (exactly like the Math.round() method). Must be positive.
     *
     * @returns {Number}
     *  The rounded number.
     */
    Utils.round = function (value, precision) {
        value = Math.round(value / precision);
        // Multiplication with small value may result in rounding errors (e.g.,
        // 227*0.1 results in 22.700000000000003), division by inverse value
        // works as expected (e.g. 227/(1/0.1) results in 22.7).
        return (precision < 1) ? (value / (1 / precision)) : (value * precision);
    };

    /**
     * Rounds the passed floating-point number down to the nearest multiple of
     * the specified precision.
     *
     * @param {Number} value
     *  The floating-point number to be rounded.
     *
     * @param {Number} precision
     *  The precision used to round the number. The value 1 will round down to
     *  integers (exactly like the Math.floor() method). Must be positive.
     *
     * @returns {Number}
     *  The rounded number.
     */
    Utils.roundDown = function (value, precision) {
        value = Math.floor(value / precision);
        // see comment in Utils.round()
        return (precision < 1) ? (value / (1 / precision)) : (value * precision);
    };

    /**
     * Rounds the passed floating-point number up to the nearest multiple of
     * the specified precision.
     *
     * @param {Number} value
     *  The floating-point number to be rounded.
     *
     * @param {Number} precision
     *  The precision used to round the number. The value 1 will round up to
     *  integers (exactly like the Math.ceil() method). Must be positive.
     *
     * @returns {Number}
     *  The rounded number.
     */
    Utils.roundUp = function (value, precision) {
        value = Math.ceil(value / precision);
        // see comment in Utils.round()
        return (precision < 1) ? (value / (1 / precision)) : (value * precision);
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
        return Utils.round(value / pow10, Math.pow(10, digits - 1)) * pow10;
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
     *  @param {Number} [options.step=1]
     *      If specified, the current value will be increased or decreased by
     *      this amount.
     *
     * @returns {Utils.BREAK|Undefined}
     *  A reference to the Utils.BREAK object, if the iterator has returned
     *  Utils.BREAK to stop the iteration process, otherwise undefined.
     */
    Utils.iterateRange = function (begin, end, iterator, options) {

        var // context for iterator function
            context = Utils.getOption(options, 'context'),
            // step value
            step = Utils.getNumberOption(options, 'step', 1),
            // the current value
            value = begin;

        while ((step > 0) ? (value < end) : (value > end)) {
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
     * @param {Number} [precision]
     *  If specified, the resulting length will be rounded to the nearest
     *  multiple of this value. Must be positive.
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

        return function (value, fromUnit, toUnit, precision) {
            value *= (FACTORS[fromUnit] || 1) / (FACTORS[toUnit] || 1);
            return _.isFinite(precision) ? Utils.round(value, precision) : value;
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
     * @param {Number} [precision]
     *  If specified, the resulting length will be rounded to the nearest
     *  multiple of this value. Must be positive.
     *
     * @returns {Number}
     *  The length value converted to the target measurement unit, as
     *  floating-point number.
     */
    Utils.convertHmmToLength = function (value, toUnit, precision) {
        return Utils.convertLength(value / 100, 'mm', toUnit, precision);
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
     * @param {Number} [precision]
     *  If specified, the resulting length will be rounded to the nearest
     *  multiple of this value. Must be positive.
     *
     * @returns {Number}
     *  The length value converted to the target measurement unit, as
     *  floating-point number.
     */
    Utils.convertCssLength = function (valueAndUnit, toUnit, precision) {
        var value = parseFloat(valueAndUnit);
        if (!_.isFinite(value)) {
            value = 0;
        }
        if (value && (valueAndUnit.length > 2)) {
            value = Utils.convertLength(value, valueAndUnit.substr(-2), toUnit, precision);
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
     * @param {Number} [precision]
     *  If specified, the resulting length will be rounded to the nearest
     *  multiple of this value. Must be positive.
     *
     * @returns {String}
     *  The length value converted to the target measurement unit, followed by
     *  the unit name.
     */
    Utils.convertHmmToCssLength = function (value, toUnit, precision) {
        return Utils.convertHmmToLength(value, toUnit, precision) + toUnit;
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
        return text.replace(/^[\x00-\x1f\s]+|[\x00-\x1f\s]+$/g, '');
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
     * quotes, and apostrophes) in the passed text.
     *
     * @param {String} text
     *  The text containing special HTML mark-up characters.
     *
     * @returns {String}
     *  The passed text with all mark-up characters escaped.
     */
    Utils.escapeHTML = function (text) {
        return Utils.cleanString(text)
            // replace the ampersand with the text &amp; (must be done first!)
            .replace(/&/g, '&amp;')
            // replace the left angle bracket with the text &lt;
            .replace(/</g, '&lt;')
            // replace the right angle bracket with the text &gt;
            .replace(/>/g, '&gt;')
            // replace the double quote character with the text &quot;
            .replace(/"/g, '&quot;')
            // replace the apostrophe with the text &#39; (&apos; is not an HTML entity!)
            .replace(/'/g, '&#39;');
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
     * @param [precision]
     *  If specified, the resulting number will be rounded to the nearest
     *  multiple of this value. Must be positive.
     *
     * @returns
     *  The value of the specified attribute, or the default value, rounded
     *  down to an integer.
     */
    Utils.getNumberOption = function (options, name, def, min, max, precision) {
        var value = Utils.getOption(options, name);
        value = _.isFinite(value) ? value : def;
        if (_.isFinite(value)) {
            if (_.isFinite(min) && (value < min)) { value = min; }
            if (_.isFinite(max) && (value > max)) { value = max; }
            return _.isFinite(precision) ? Utils.round(value, precision) : value;
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
        return Utils.getNumberOption(options, name, def, min, max, 1);
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
     * Creates and returns a merged options map from the passed objects. Unlike
     * Underscore's extend() method, does not modify the passed objects, but
     * creates and returns a clone. Additionally, extends embedded plain JS
     * objects deeply instead of replacing them, for example, extending the
     * objects {a:{b:1}} and {a:{c:2}} will result in {a:{b:1,c:2}}.
     *
     * @param {Object} [...]
     *  Other objects whose attributes will be inserted into the former object.
     *  Will overwrite existing attributes in the clone of the passed object.
     *
     * @returns {Object}
     *  A new clone of the passed object, extended by the new attributes.
     */
    Utils.extendOptions = function () {

        var // the resulting options
            options = {};

        function isPlainObject(value) {
            return _.isObject(value) && (value.constructor === Object);
        }

        function extend(options, extensions) {
            _(extensions).each(function (value, name) {
                if (isPlainObject(value)) {
                    // extension value is a plain object: ensure that the options map contains an embedded object
                    if (!isPlainObject(options[name])) {
                        options[name] = {};
                    }
                    extend(options[name], value);
                } else {
                    // extension value is not a plain object: clear old value, even if it was an object
                    options[name] = value;
                }
            });
        }

        // add all objects to the clone
        for (var index = 0; index < arguments.length; index += 1) {
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
        var props = {};
        _(['-webkit-', '-moz-', '-ms-', '-o-', '']).each(function (prefix) {
            props[prefix + name] = value;
        });
        $(node).css(props);
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
     *  @param {Boolean} [options.children=false]
     *      If set to true, only direct child nodes will be visited.
     *  @param {Boolean} [options.reverse=false]
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
     * Returns the position and size of the specified node inside the entire
     * document page. This includes the distances of all four borders of the
     * node to the borders of the document.
     *
     * @param {HTMLElement|jQuery} node
     *  The DOM element whose position relative to the document page will be
     *  calculated. If this object is a jQuery collection, uses the first node
     *  it contains.
     *
     * @returns {Object}
     *  An object with numeric properties representing the position and size of
     *  the node relative to the document page, in pixels:
     *  - {Number} left
     *      The distance of the left border of the node to the left border of
     *      the document page.
     *  - {Number} top
     *      The distance of the top border of the node to the top border of the
     *      document page.
     *  - {Number} right
     *      The distance of the right border of the node to the right border of
     *      the document page.
     *  - {Number} bottom
     *      The distance of the bottom border of the node to the bottom border
     *      of the document page.
     *  - {Number} width
     *      The outer width of the node (including its borders).
     *  - {Number} height
     *      The outer height of the node (including its borders).
     */
    Utils.getNodePositionInPage = function (node) {

        var // the passed node, as jQuery object
            $node = $(node),
            // the offset of the node, relative to the browser window
            position = $node.offset();

        position.width = $node.outerWidth();
        position.height = $node.outerHeight();
        position.right = document.body.clientWidth - position.left - position.width;
        position.bottom = document.body.clientHeight - position.top - position.height;

        return position;
    };

    /**
     * Returns the position of the visible area of the passed container node.
     * This includes the size of the visible area without scroll bars (if
     * shown), and the distances of all four borders of the visible area to the
     * borders of the entire scroll area.
     *
     * @param {HTMLElement|jQuery} containerNode
     *  The DOM container element. If this object is a jQuery collection, uses
     *  the first node it contains.
     *
     * @returns {Object}
     *  An object with numeric properties representing the position and size of
     *  the visible area relative to the entire scroll area of the container
     *  node in pixels:
     *  - {Number} left
     *      The distance of the left border of the visible area to the left
     *      border of the entire scroll area.
     *  - {Number} top
     *      The distance of the top border of the visible area to the top
     *      border of the entire scroll area.
     *  - {Number} right
     *      The distance of the right border of the visible area (without
     *      scroll bar) to the right border of the entire scroll area.
     *  - {Number} bottom
     *      The distance of the bottom border of the visible area (without
     *      scroll bar) to the bottom border of the entire scroll area.
     *  - {Number} width
     *      The width of the visible area (without scroll bar).
     *  - {Number} height
     *      The height of the visible area (without scroll bar).
     */
    Utils.getVisibleAreaPosition = function (containerNode) {
        containerNode = Utils.getDomNode(containerNode);
        return {
            left: containerNode.scrollLeft,
            top: containerNode.scrollTop,
            right: containerNode.scrollWidth - containerNode.clientWidth - containerNode.scrollLeft,
            bottom: containerNode.scrollHeight - containerNode.clientHeight - containerNode.scrollTop,
            width: containerNode.clientWidth,
            height: containerNode.clientHeight
        };
    };

    /**
     * Returns the position and size of the specified document page rectangle
     * inside the passed DOM container node. This includes the size of the
     * rectangle as specified, and the distances of all four borders of the
     * rectangle to the borders of the visible area or entire scroll area of
     * the container node.
     *
     * @param {HTMLElement|jQuery} containerNode
     *  The container DOM element. If this object is a jQuery collection, uses
     *  the first node it contains.
     *
     * @param {Object} pageRect
     *  The document page rectangle whose position will be converted relatively
     *  to the position of the container node. Must provide the properties
     *  'left', 'top', 'width', and 'height' in pixels. The properties 'left'
     *  and 'top' are interpreted relatively to the entire document page.
     *
     * @param {Object} [options]
     *  A map of options to control the calculation. Supports the following
     *  options:
     *  @param {Boolean} [options.visibleArea=false]
     *      If set to true, calculates the distances of the rectangle to the
     *      visible area of the container node. Otherwise, calculates the
     *      distances of the rectangle to the entire scroll area of the
     *      container node.
     *
     * @returns {Object}
     *  An object with numeric properties representing the position and size of
     *  the page rectangle relative to the entire scroll area or visible area
     *  of the container node, in pixels:
     *  - {Number} left
     *      The distance of the left border of the rectangle to the left border
     *      of the container node.
     *  - {Number} top
     *      The distance of the top border of the rectangle to the top border
     *      of the container node.
     *  - {Number} right
     *      The distance of the right border of the rectangle to the right
     *      border of the container node.
     *  - {Number} bottom
     *      The distance of the bottom border of the rectangle to the bottom
     *      border of the container node.
     *  - {Number} width
     *      The width of the rectangle, as passed.
     *  - {Number} height
     *      The height of the rectangle, as passed.
     */
    Utils.getRectanglePositionInNode = function (containerNode, pageRect, options) {

        var // the passed container node, as jQuery object
            $containerNode = $(containerNode),
            // the offset of the container node, relative to the document body
            containerOffset = containerNode.offset(),
            // the width of the left and top border of the scrollable node, in pixels
            leftBorderWidth = Utils.convertCssLength($containerNode.css('borderLeftWidth'), 'px'),
            topBorderWidth = Utils.convertCssLength($containerNode.css('borderTopWidth'), 'px'),
            // position and size of the visible area of the container node
            visiblePosition = Utils.getVisibleAreaPosition(containerNode),

            // the position and size, relative to the visible area of the container node
            position = {
                left: pageRect.left + leftBorderWidth - containerOffset.left,
                top: pageRect.top + topBorderWidth - containerOffset.top,
                width: pageRect.width,
                height: pageRect.height
            };

        // add right and bottom distance of child node to visible area
        position.right = visiblePosition.width - position.left - position.width;
        position.bottom = visiblePosition.height - position.top - position.height;

        // add distances to entire scroll area, if option 'visibleArea' is not set
        if (!Utils.getBooleanOption(options, 'visibleArea', false)) {
            _(['left', 'top', 'right', 'bottom']).each(function (border) {
                position[border] += visiblePosition[border];
            });
        }

        return position;
    };

    /**
     * Returns the position and size of the specified child node inside its
     * ancestor container node. This includes the outer size of the child node,
     * and the distances of all four borders of the child node to the borders
     * of the visible area or entire scroll area of the container node.
     *
     * @param {HTMLElement|jQuery} containerNode
     *  The DOM container element. If this object is a jQuery collection, uses
     *  the first node it contains.
     *
     * @param {HTMLElement|jQuery} childNode
     *  The DOM element whose dimensions will be calculated. Must be contained
     *  in the specified container element. If this object is a jQuery
     *  collection, uses the first node it contains.
     *
     * @param {Object} [options]
     *  A map of options to control the calculation. Supports the following
     *  options:
     *  @param {Boolean} [options.visibleArea=false]
     *      If set to true, calculates the distances of the child node to the
     *      visible area of the container node. Otherwise, calculates the
     *      distances of the child node to the entire scroll area of the
     *      container node.
     *
     * @returns {Object}
     *  An object with numeric properties representing the position and size of
     *  the child node relative to the entire scroll area or visible area of
     *  the container node, in pixels:
     *  - {Number} left
     *      The distance of the left border of the child node to the left
     *      border of the container node.
     *  - {Number} top
     *      The distance of the top border of the child node to the top border
     *      of the container node.
     *  - {Number} right
     *      The distance of the right border of the child node to the right
     *      border of the container node.
     *  - {Number} bottom
     *      The distance of the bottom border of the child node to the bottom
     *      border of the container node.
     *  - {Number} width
     *      The outer width of the child node (including its borders).
     *  - {Number} height
     *      The outer height of the child node (including its borders).
     */
    Utils.getChildNodePositionInNode = function (containerNode, childNode, options) {
        var pageRect = Utils.getNodePositionInPage(childNode);
        return Utils.getRectanglePositionInNode(containerNode, pageRect, options);
    };

    /**
     * Scrolls the passed page rectangle into the visible area of the specified
     * container node.
     *
     * @param {HTMLElement|jQuery} containerNode
     *  The DOM container element. If this object is a jQuery collection, uses
     *  the first node it contains. This method works independent from the
     *  current overflow mode of the container node.
     *
     * @param {Object} pageRect
     *  The document page rectangle that will be made visible by scrolling the
     *  container node. Must provide the properties 'left', 'top', 'width', and
     *  'height' in pixels. The properties 'left' and 'top' are interpreted
     *  relatively to the entire document page.
     *
     * @param {Object} [options]
     *  A map of options to control the scroll action. Supports the following
     *  options:
     *  @param {Number} [options.padding=0]
     *      Minimum distance between the borders of the visible area in the
     *      container node, and the rectangle scrolled into the visible area.
     */
    Utils.scrollToPageRectangle = function (containerNode, pageRect, options) {

        var // dimensions of the rectangle in the visible area of the scrollable node
            position = Utils.getRectanglePositionInNode(containerNode, pageRect, { visibleArea: true }),
            // padding between scrolled element and border of visible area
            padding = Utils.getIntegerOption(options, 'padding', 0, 0);

        function updateScrollPosition(leadingChildOffset, trailingChildOffset, scrollAttributeName) {

            var maxPadding = Utils.minMax((leadingChildOffset + trailingChildOffset) / 2, 0, padding),
                offset = Math.max(leadingChildOffset - Math.max(maxPadding - trailingChildOffset, 0), maxPadding);

            Utils.getDomNode(containerNode)[scrollAttributeName] -= (offset - leadingChildOffset);
        }

        updateScrollPosition(position.left, position.right, 'scrollLeft');
        updateScrollPosition(position.top, position.bottom, 'scrollTop');
    };

    /**
     * Scrolls the passed child node into the visible area of the specified DOM
     * container node.
     *
     * @param {HTMLElement|jQuery} containerNode
     *  The DOM container element that contains the specified child node. If
     *  this object is a jQuery collection, uses the first node it contains.
     *
     * @param {HTMLElement|jQuery} childNode
     *  The DOM element that will be made visible by scrolling the specified
     *  container element. If this object is a jQuery collection, uses the
     *  first node it contains.
     *
     * @param {Object} [options]
     *  A map of options to control the scroll action. Supports the following
     *  options:
     *  @param {Number} [options.padding=0]
     *      Minimum distance between the borders of the visible area and the
     *      child node.
     */
    Utils.scrollToChildNode = function (containerNode, childNode, options) {
        var pageRect = Utils.getNodePositionInPage(childNode);
        Utils.scrollToPageRectangle(containerNode, pageRect, options);
    };

    /**
     * Sets the size of the passed DOM nodes. As a workaround for IE which
     * restricts the explicit size of single nodes to ~1.5m pixels (see comment
     * for the Utils.MAX_NODE_SIZE constant), descendant nodes will be inserted
     * whose sizes add up to the specified total node size. The total size of
     * the node will still be restricted depending on the browser (see comment
     * for the Utils.MAX_CONTAINER_WIDTH and Utils.MAX_CONTAINER_HEIGHT
     * constants).
     *
     * @param {HTMLElement|jQuery} containerNode
     *  The DOM container element that will be resized. If this object is a
     *  jQuery collection, resizes all node it contains.
     *
     * @param {Number} width
     *  The new total width of the node. The resulting width will not exceed
     *  the value of Utils.MAX_CONTAINER_WIDTH, depending on the current
     *  browser.
     *
     * @param {Number} height
     *  The new total height of the node. The resulting height will not exceed
     *  the value of Utils.MAX_CONTAINER_HEIGHT, depending on the current
     *  browser.
     */
    Utils.setContainerNodeSize = function (containerNode, width, height) {
        containerNode = $(containerNode);

        // restrict to maximum allowed node size
        width = Utils.minMax(width, 0, Utils.MAX_CONTAINER_WIDTH);
        height = Utils.minMax(height, 0, Utils.MAX_CONTAINER_HEIGHT);

        // if node is small enough, set its size directly
        if ((width <= Utils.MAX_NODE_SIZE) && (height <= Utils.MAX_NODE_SIZE)) {
            containerNode.empty().css({ width: width, height: height });
            return;
        }

        // IE: insert embedded nodes to expand the container node beyond the limits of a single node
        if ((width !== containerNode.width()) || (height !== containerNode.height())) {

            // generate the mark-up for the embedded horizontal sizer nodes
            var markup = Utils.repeatString('<div style="width:' + Utils.MAX_NODE_SIZE + 'px;"></div>', Math.floor(width / Utils.MAX_NODE_SIZE));
            width %= Utils.MAX_NODE_SIZE;
            if (width > 0) { markup += '<div style="width:' + width + 'px;"></div>'; }

            // generate the mark-up for the vertical sizer nodes
            markup = '<div style="height:' + Math.min(height, Utils.MAX_NODE_SIZE) + 'px;">' + markup + '</div>';
            height = Math.max(0, height - Utils.MAX_NODE_SIZE);
            markup += Utils.repeatString('<div style="height:' + Utils.MAX_NODE_SIZE + 'px;"></div>', Math.floor(height / Utils.MAX_NODE_SIZE));
            height %= Utils.MAX_NODE_SIZE;
            if (height > 0) { markup += '<div style="height:' + height + 'px;"></div>'; }

            // insert entire HTML mark-up into the container node
            containerNode.css({ width: 'auto', height: 'auto' }).addClass('ie-node-size-container').html(markup);
        }
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
     *  @param {Any} [options.value]
     *      A value, object, or function that will be copied to the attribute
     *      'data-value' of the control. Must not be null or undefined.
     *  @param {String} [options.dataValue]
     *      A string that will be inserted into the 'data-value' attribute of
     *      the control. If omitted, the JSON string representation of the
     *      'options.value' option will be used instead (all double-quote
     *      characters will be removed from the string though), unless the
     *      passed value is a function.
     *  @param {Any} [options.userData]
     *      A value or object that will be copied to the attribute
     *      'data-userdata' of the control. May contain any user-defined data.
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

        Utils.setControlValue(control, Utils.getOption(options, 'value'), Utils.getStringOption(options, 'dataValue'));
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
     * @param {Any} value
     *  A value, object, or function that will be copied to the 'value' data
     *  attribute of the control. Must not be null or undefined.
     *
     * @param {String} [dataValue]
     *  A string value that will be inserted into the 'data-value' attribute of
     *  the control. If omitted, the JSON string representation of the passed
     *  value will be used instead (all double-quote characters will be removed
     *  from the string though), unless the passed value is a function.
     */
    Utils.setControlValue = function (control, value, dataValue) {
        if (!_.isUndefined(value) && !_.isNull(value)) {
            control.data('value', value);
            // set the data-value attribute
            if (!_.isString(dataValue) && !_.isFunction(value)) {
                dataValue = JSON.stringify(value).replace(/"/g, '');
            }
            if (dataValue) {
                control.attr('data-value', dataValue);
            }
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
     * is currently focused.
     *
     * @param {jQuery} control
     *  A jQuery collection containing a form control.
     *
     * @returns {Boolean}
     *  True, if the form control is focused.
     */
    Utils.isControlFocused = function (control) {
        return control.first().is(':focus');
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
        return controls.filter(':focus');
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
        return node.find(':focus').length !== 0;
    };

    // control captions -------------------------------------------------------

    /**
     * Create and the HTML markup of an <i> DOM element representing an icon.
     *
     * @param {String} icon
     *  The CSS class name of the icon.
     *
     * @returns {String}
     *  The HTML markup of the icon element, as string.
     */
    Utils.createIconMarkup = function (icon) {
        return '<i class="' + icon + ' ' + localeIconClasses + (Utils.RETINA ? ' retina' : '') + '"></i>';
    };

    /**
     * Create and returns a new <i> DOM element representing an icon.
     *
     * @param {String} icon
     *  The CSS class name of the icon. Will be set at the created element.
     *
     * @returns {jQuery}
     *  The new icon element, as jQuery object.
     */
    Utils.createIcon = function (icon) {
        return $(Utils.createIconMarkup(icon));
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
     * Creates the HTML markup of an icon and a text label for a form control.
     *
     * @param {Object} [options]
     *  A map of options with the properties of the caption. The following
     *  options are supported:
     *  @param {String} [options.icon]
     *      The full name of the Bootstrap or OX Documents icon class. If
     *      omitted, no icon will be shown.
     *  @param {String} [options.label]
     *      The text label. Will follow an icon. If omitted, no text will be
     *      shown.
     *
     * @returns {String}
     *  The HTML markup of the caption element, as string.
     */
    Utils.createControlCaptionMarkup = function (options) {

        var // option values
            icon = Utils.getStringOption(options, 'icon'),
            label = Utils.getStringOption(options, 'label'),
            // the caption markup
            markup = '';

        // append the icon
        if (icon) {
            markup += '<span data-role="icon" data-icon="' + icon + '">' + Utils.createIconMarkup(icon) + '</span>';
        }

        // append the label
        if (_.isString(label)) {
            markup += '<span data-role="label">' + Utils.escapeHTML(label) + '</span>';
        }

        // embed in the caption container if any markup is present
        return (markup.length > 0) ? ('<div class="caption">' + markup + '</div>') : '';
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
     *      The full name of the Bootstrap or OX Documents icon class. If
     *      omitted, no icon will be shown.
     *  @param {String} [options.label]
     *      The text label. Will follow an icon. If omitted, no text will be
     *      shown.
     *  @param {Object} [options.labelCss]
     *      A map with CSS formatting attributes to be added to the label span.
     *      Does not have any effect, if no label has been specified.
     */
    Utils.setControlCaption = function (control, options) {

        var // the caption container node
            caption = $(Utils.createControlCaptionMarkup(options)),
            // the label CSS attributes
            labelCss = Utils.getObjectOption(options, 'labelCss', {});

        // restrict to one element in the passed collection
        control = control.first();

        // add CSS attributes
        if (!_.isEmpty(labelCss)) {
            caption.children(LABEL_SELECTOR).css(labelCss);
        }

        // remove the old caption, insert new caption
        control.children('div.caption').remove();
        control.prepend(caption);
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
        if (tooltip) {
            control.first().attr('title', tooltip);
        } else {
            control.first().removeAttr('title');
        }
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
     * Creates and returns the HTML markup of a button element.
     *
     * @param {String} [innerMarkup='']
     *  The HTML markup that will be inserted into the button element, right
     *  after the button caption element as specified by the passed options.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new button. Supports
     *  all generic options supported by the method Utils.setControlLabel().
     *  Additionally, the following options are supported:
     *  @param {Boolean} [focusable=false]
     *      If set to true, a CSS marker class will be added marking the button
     *      to be focusable.
     *  @param {Number} [tabIndex=1]
     *      The tab index set as 'tabindex' attribute at the button element.
     *
     * @returns {String}
     *  The HTML markup of the button element, as string. The button element
     *  will be represented by an <a> DOM element due to rendering bugs in
     *  FireFox with <button> elements.
     */
    Utils.createButtonMarkup = function (innerMarkup, options) {

        var // whether the button will be focusable
            focusable = Utils.getBooleanOption(options, 'focusable', false),
            // the tab index
            tabIndex = Utils.getIntegerOption(options, 'tabIndex', 1),
            // the HTML mark-up of the caption icon and label
            captionMarkup = Utils.createControlCaptionMarkup(options);

        innerMarkup = (innerMarkup || '') + captionMarkup;
        return '<a class="' + Utils.BUTTON_CLASS + (focusable ? (' ' + Utils.FOCUSABLE_CLASS) : '') + '" href="#" tabindex="' + tabIndex + '">' + innerMarkup + '</a>';
    };

    /**
     * Creates and returns a new button element.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new button. Supports
     *  all generic options supported by the method Utils.createControl(), and
     *  all caption options supported by the method Utils.setControlLabel().
     *  Additionally, the following options are supported:
     *  @param {Number} [tabIndex=1]
     *      The tab index set as 'tabindex' attribute at the button element.
     *
     * @returns {jQuery}
     *  A jQuery object containing the new button element. The button element
     *  will be represented by an <a> DOM element due to rendering bugs in
     *  FireFox with <button> elements.
     */
    Utils.createButton = function (options) {

        var // the tab index
            tabIndex = Utils.getIntegerOption(options, 'tabIndex', 1),
            // Create the DOM anchor element representing the button (href='#' is
            // essential for tab traveling). Do NOT use <button> elements, Firefox has
            // problems with text clipping and correct padding of the <button> contents.
            button = Utils.createControl('a', { href: '#', tabindex: tabIndex }, options).addClass(Utils.BUTTON_CLASS);

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
        return buttons.filter(Utils.SELECTED_SELECTOR);
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
     * Creates and returns a new text <input> field.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new text input field.
     *  Supports all generic options supported by the Utils.createControl()
     *  method. Additionally, the following options are supported:
     *  @param {String} [options.placeholder='']
     *      A place holder text that will be shown in an empty text field.
     *  @param {String} [options.keyboard='text']
     *      Specifies which virtual keyboard should occur on touch devices.
     *      Supported types are 'text' (default) for a generic text field with
     *      alphanumeric keyboard, 'number' for floating-point numbers with
     *      numeric keyboard, 'url' for an alphanumeric keyboard with additions
     *      for entering URLs, or 'email' for an alphanumeric keyboard with
     *      additions for entering e-mail addresses.
     *
     * @returns {jQuery}
     *  A jQuery object containing the new text field element.
     */
    Utils.createTextField = function (options) {
        var type = Modernizr.touch ? Utils.getStringOption(options, 'keyboard', 'text') : 'text',
            textField = Utils.createControl('input', { type: type, tabindex: 1 }, options);
        return textField.attr('placeholder', Utils.getStringOption(options, 'placeholder', ''));
    };

    /**
     * Creates and returns a new <textarea> element.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new text area.
     *  Supports all generic options supported by the Utils.createControl()
     *  method. Additionally, the following options are supported:
     *  @param {String} [options.placeholder='']
     *      A place holder text that will be shown in an empty text area.
     *
     * @returns {jQuery}
     *  A jQuery object containing the new text area element.
     */
    Utils.createTextArea = function (options) {
        var textArea = Utils.createControl('textarea', undefined, options);
        return textArea.attr('placeholder', Utils.getStringOption(options, 'placeholder', ''));
    };

    /**
     * Returns the current selection in the passed text field.
     *
     * @param {HTMLElement|jQuery} textField
     *  A text field element (an HTML <input> or <textarea> element). If this
     *  object is a jQuery collection, used the first DOM node it contains.
     *
     * @returns {Object}
     *  An object with the attributes 'start' and 'end' containing the start
     *  and end character offset of the selection in the text field.
     */
    Utils.getTextFieldSelection = function (textField) {
        var node = Utils.getDomNode(textField);
        return { start: node.selectionStart, end: node.selectionEnd };
    };

    /**
     * Changes the current selection in the passed text field.
     *
     * @param {HTMLElement|jQuery} textField
     *  A text field element (an HTML <input> or <textarea> element). If this
     *  object is a jQuery collection, used the first DOM node it contains.
     *
     * @param {Number} start
     *  The start character offset of the new selection in the text field.
     *
     * @param {Number} [end=start]
     *  The end character offset of the new selection in the text field. If
     *  omitted, sets a text cursor according to the passed start position.
     */
    Utils.setTextFieldSelection = function (textField, start, end) {
        var node = Utils.getDomNode(textField);
        node.selectionStart = start;
        node.selectionEnd = _.isNumber(end) ? end : start;
    };

    /**
     * Replaces the current selection of the text field with the specified
     * text, and places a simple text cursor behind the new text.
     *
     * @param {HTMLElement|jQuery} textField
     *  A text field element (an HTML <input> or <textarea> element). If this
     *  object is a jQuery collection, used the first DOM node it contains.
     *
     * @param {String} [text='']
     *  The text used to replace the selected text in the text field. If
     *  omitted, the selection will simply be deleted.
     */
    Utils.replaceTextInTextFieldSelection = function (textField, text) {
        var node = Utils.getDomNode(textField), start = node.selectionStart;
        text = _.isString(text) ? text : '';
        node.value = node.value.substring(0, start) + text + node.value.substring(node.selectionEnd);
        node.selectionStart = node.selectionEnd = start + text.length;
    };

    // global timer -----------------------------------------------------------

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
    Utils.takeTime = (function () {
        var indent = '', INDENT_PIECE = '\xa0 ';
        return function (message, callback, context) {
            var t0 = _.now();
            try {
                Utils.log(indent + '=> ' + message);
                indent += INDENT_PIECE;
                return callback.call(context);
            } finally {
                indent = indent.substring(INDENT_PIECE.length);
                Utils.log(indent + '<= ' + (_.now() - t0) + 'ms');
            }
        };
    }());

    // global initialization ==================================================

    // forward console output into a fixed DOM node on touch devices
/*
    (function () {
        if (Config.isDebug() && Modernizr.touch) {
            var ICONS = { info: 'icon-info-sign', warn: 'icon-warning-sign', error: 'icon-remove-sign' },
                consoleNode = $('<div>', { id: 'io-ox-office-console' }).appendTo('body'),
                outputNode = $('<div>').addClass('output').appendTo(consoleNode),
                clearButton = $('<button>').text('Clear').appendTo(consoleNode);
            clearButton.on('click', function () { outputNode.empty(); return false; });
            consoleNode.on('click', function () { consoleNode.toggleClass('collapsed'); });
            _(['log', 'info', 'warn', 'error']).each(function (methodName) {
                var origMethod = _.bind(window.console[methodName], window.console);
                window.console[methodName] = function (msg) {
                    outputNode.append($('<p>').addClass(methodName).append(
                        (methodName in ICONS) ? Utils.createIcon(ICONS[methodName]) : $(),
                        $('<span>').text(msg)));
                    outputNode.scrollTop(outputNode[0].scrollHeight);
                    return origMethod(msg);
                };
            });
        }
    }());
*/

    // global focus log
//    $(document).on('focusin focusout', function (event) {
//        Utils.log(event.type + ': ' + event.target.nodeName + '.' + (event.target.className || '').replace(/ /g, '.'));
//    });

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
