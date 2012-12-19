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

define('io.ox/office/tk/utils',
    ['io.ox/core/gettext',
     'less!io.ox/office/tk/style.css'
    ], function (gettext) {

    'use strict';

    var // the ISO code of the language used by gettext
        language = null,

        // selector for the icon <span> element in a control caption
        ICON_SELECTOR = 'span[data-role="icon"]',

        // selector for the label <span> element in a control caption
        LABEL_SELECTOR = 'span[data-role="label"]',

        // selector for <span> elements in a control caption
        CAPTION_SELECTOR = ICON_SELECTOR + ', ' + LABEL_SELECTOR;

    // static class Utils =====================================================

    var Utils = {};

    // constants --------------------------------------------------------------

    /**
     * A unique object used as return value in callback functions of iteration
     * loops to break the iteration process immediately.
     */
    Utils.BREAK = {};

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
     * @returns {Boolean}
     *  Whether all specified attributes are equal in both objects.
     */
    Utils.hasEqualAttributes = function (object1, object2, attributeNames) {

        var // loop indexes
            index = 0, length = attributeNames.length,
            // current attribute name
            attrName = '',
            // whether the objects contain the attribute
            hasAttr1 = false, hasAttr2 = false;

        for (; index < length; index += 1) {
            attrName = attributeNames[index];
            hasAttr1 = attrName in object1;
            hasAttr2 = attrName in object2;
            if ((hasAttr1 !== hasAttr2) || (hasAttr1 && hasAttr2 && !_.isEqual(object1[attrName], object2[attrName]))) {
                return false;
            }
        }
        return true;
    };

    // calculation and conversion ---------------------------------------------

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
     * @returns
     *  The value of the specified attribute, or the default value.
     */
    Utils.getStringOption = function (options, name, def) {
        var value = Utils.getOption(options, name);
        return _.isString(value) ? value : def;
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
     * @returns
     *  The value of the specified attribute, or the default value.
     */
    Utils.getArrayOption = function (options, name, def) {
        var value = Utils.getOption(options, name);
        return _.isArray(value) ? value : def;
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
     * @param {Object} [extensions]
     *  Another object whose attributes will be inserted into the former
     *  object. Will overwrite existing attributes in the clone of the passed
     *  object.
     *
     * @returns {Object}
     *  A new clone of the passed object, extended by the new attributes.
     */
    Utils.extendOptions = function (options, extensions) {

        function extend(options, extensions) {
            _(extensions).each(function (value, name) {
                if (_.isObject(value) && !_.isArray(value) && !_.isFunction(value)) {
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
        if (_.isObject(extensions)) {
            extend(options, extensions);
        }

        return options;
    };

    // generic DOM helpers ----------------------------------------------------

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

        // outer node must be an element; be sure that a node does not contain itself
        if (((outerNode.nodeType !== 1) && (outerNode.nodeType !== 9)) || (outerNode === innerNode)) {
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

        node = Utils.getDomNode(node).parentNode;
        while (node && !$(node).is(selector)) {
            node = node.parentNode;
        }

        return (node && Utils.containsNode(rootNode, node)) ? node : null;
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

    /**
     * Scrolls a specific child node of a container node into its visible area.
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
     *  @param {Boolean} [options.horizontal=false]
     *      If set to true, scrolls the element in horizontal direction.
     *      Otherwise, scrolls the element in vertical direction.
     *  @param {Number} [options.padding=0]
     *      Minimum padding between the inner border of the container node and
     *      the outer border of the child node.
     *  @param {String} [options.overflow='begin']
     *      Specifies how to position the child node if it is larger than the
     *      visible area of the container node. If omitted or set to 'begin',
     *      the top border (left border in horizontal mode) of the child node
     *      will be visible. If set to 'center', the child node will be
     *      centered in the visible area. If set to 'end', the bottom border
     *      (right border in horizontal mode) of the child node will be
     *      visible.
     */
    Utils.scrollToChildNode = (function () {

        var horizontalNames = {
                offset: 'left',
                offsetBorder: 'border-left-width',
                innerSize: 'innerWidth',
                outerSize: 'outerWidth',
                scroll: 'scrollLeft'
            },

            verticalNames = {
                offset: 'top',
                offsetBorder: 'border-top-width',
                innerSize: 'innerHeight',
                outerSize: 'outerHeight',
                scroll: 'scrollTop'
            };

        // return the actual scrollToChildNode() method
        return function (scrollableNode, childNode, options) {

            var // scroll direction
                horizontal = Utils.getBooleanOption(options, 'horizontal', false),
                // attribute and function names depending on scroll direction
                names = horizontal ? horizontalNames : verticalNames,

                // padding between scrolled element and container border
                padding = Utils.getIntegerOption(options, 'padding', 0, 0, 9999),
                // how to position an oversized child node
                overflow = Utils.getStringOption(options, 'overflow'),

                // the scrollable element, as jQuery collection
                $scrollableNode = $(scrollableNode).first(),
                // inner size of the scrollable container node
                scrollableSize = $scrollableNode[names.innerSize](),
                // border size on left/top end of the container node
                scrollableBorderSize = Utils.convertCssLength($scrollableNode.css(names.offsetBorder), 'px', 0),
                // current position of the scrollable container node (inner area, relative to browser window)
                scrollableOffset = $scrollableNode.offset()[names.offset] + scrollableBorderSize,

                // the child node, as jQuery collection
                $childNode = $(childNode).first(),
                // current position of the child node (relative to browser window)
                childOffset = $childNode.offset()[names.offset],
                // outer size of the child node
                childSize = $childNode[names.outerSize](),
                // maximum possible padding to fit child node into container node
                maxPadding = Math.min(padding, Math.max(Math.floor((scrollableSize - childSize) / 2), 0)),
                // minimum offset valid for the child node (with margin from left/top)
                minChildOffset = scrollableOffset + maxPadding,
                // maximum offset valid for the child node (with margin from right/bottom)
                maxChildOffset = scrollableOffset + scrollableSize - maxPadding - childSize,
                // new absolute offset of the child node to make it visible
                newChildOffset = 0;

            if (minChildOffset <= maxChildOffset) {
                // if there is a valid range for the child element, calculate its new position
                newChildOffset = Utils.minMax(childOffset, minChildOffset, maxChildOffset);
            } else {
                // otherwise: find position according to overflow mode
                switch (overflow) {
                case 'center':
                    newChildOffset = Math.floor((minChildOffset + maxChildOffset) / 2);
                    break;
                case 'end':
                    newChildOffset = maxChildOffset;
                    break;
                default:
                    newChildOffset = minChildOffset;
                }
            }

            // change the current scroll position of the container node by the difference of old and new child offset
            $scrollableNode[names.scroll]($scrollableNode[names.scroll]() + childOffset - newChildOffset);
        };
    }());

    // form control elements --------------------------------------------------

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
     *      A value or object that will be copied to the 'data-value' attribute
     *      of the control. Will be converted to a JSON string. Must not be
     *      null. The undefined value will be ignored.
     *  @param [options.userData]
     *      A value or object that will be copied to the 'data-userdata'
     *      attribute of the control. May contain any user-defined data.
     *  @param {Number} [options.width]
     *      The fixed total width of the control element (including padding),
     *      in pixels. If omitted, the size will be set automatically according
     *      to the contents of the control.
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
     * control in the passed jQuery collection.
     *
     * @param {jQuery} control
     *  A jQuery collection containing a control element.
     */
    Utils.getControlValue = function (control) {
        return control.first().data('value');
    };

    /**
     * Stores the passed value in the 'value' data attribute of the first
     * control in the passed jQuery collection.
     *
     * @param {jQuery} control
     *  A jQuery collection containing a control element.
     *
     * @param value
     *  A value or object that will be copied to the 'value' data attribute of
     *  the control. Must not be null. The undefined value will be ignored.
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
     * @param {Boolean} [white]
     *  If set to true, the icon will be shown in white color instead in black
     *  color.
     *
     * @returns {jQuery}
     *  The new icon element, as jQuery object.
     */
    Utils.createIcon = function (icon, white) {
        // icon class name must be first to be able to select icon subsets in CSS
        return $('<i>').addClass(icon + (/^icon-/.test(icon) ? '' : ' io-ox-office-icon') + ((white === true) ? ' icon-white' : ''));
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
     *  @param {Boolean} [options.whiteIcon=false]
     *      If set to true, the icon will be shown in light colors by adding
     *      the CSS class 'icon-white'.
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
            whiteIcon = Utils.getBooleanOption(options, 'whiteIcon'),
            label = Utils.getStringOption(options, 'label'),
            labelCss = Utils.getObjectOption(options, 'labelCss'),

            // the caption container node
            caption = null;

        // restrict to one element in the passed collection
        control = control.first();

        // create a caption container if missing
        caption = control.children('div.caption');
        if (caption.length === 0) {
            control.prepend(caption = $('<div>').addClass('caption unselectable'));
        }

        // remove the old caption spans
        caption.empty();

        // append the icon
        if (icon) {
            caption.append($('<span>')
                .attr('data-role', 'icon')
                .attr('data-icon', icon)
                .append(Utils.createIcon(icon, whiteIcon).addClass(language))
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
     * Returns the class of the caption icon of the first control in the passed
     * jQuery collection.
     *
     * @param {jQuery} control
     *  A jQuery collection containing a form control.
     *
     * @return {String|Undefined}
     *  The class of the caption icon of the control, if existing, otherwise
     *  undefined.
     */
    Utils.getControlIcon = function (control) {
        var icon = control.first().children('div.caption').children(ICON_SELECTOR);
        return icon.length ? icon.attr('data-icon') : undefined;
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

        var // create the DOM anchor element representing the button
            button = Utils.createControl('a', { tabindex: 0 }, options).addClass('button');

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
     * @returns {jQuery}
     *  The activated button, if existing, otherwise an empty jQuery object.
     */
    Utils.selectOptionButton = function (buttons, value) {

        var // find the button to be activated
            button = (_.isUndefined(value) || _.isNull(value)) ? $() : buttons.filter(function () {
                return _.isEqual(value, Utils.getControlValue($(this)));
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
     *  Supports all generic options supported by the method
     *  Utils.createControl().
     *
     * @returns {jQuery}
     *  A jQuery object containing the new text field element.
     */
    Utils.createTextField = function (options) {
        return Utils.createControl('input', { type: 'text' }, options);
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
     * @param {Object|Boolean} selection
     *  An object with the attributes 'start' and 'end' containing the start
     *  and end character offset of the new selection in the text field, or a
     *  boolean value specifying whether to select the entire text (true), or
     *  to place the cursor behind the text (false).
     */
    Utils.setTextFieldSelection = function (textField, selection) {
        var input = textField.get(0);
        if (input) {
            if (_.isObject(selection)) {
                input.selectionStart = selection.start;
                input.selectionEnd = selection.end;
            } else if (_.isBoolean(selection)) {
                input.selectionStart = selection ? 0 : textField.val().length;
                input.selectionEnd = textField.val().length;
            }
        }
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

/* enable when needed
        '0':            48,
        '1':            49,
        '2':            50,
        '3':            51,
        '4':            52,
        '5':            53,
        '6':            54,
        '7':            55,
        '8':            56,
        '9':            57,
*/

        MOZ_SEMICOLON:  59,     // Semicolon in Firefox (otherwise: 186)

/* enable when needed
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
*/
        LEFT_WINDOWS:   91,
        RIGHT_WINDOWS:  92,
        SELECT:         93,

/* enable when needed
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
        MULTIPLY:       106,
        PLUS:           107,
        MINUS:          109,
        DECIMAL_POINT:  110,
        DIVIDE:         111,
*/

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
        SCROLL_LOCK:    145

/* enable when needed
        SEMICOLON:      186,
        EQUAL_SIGN:     187,
        COMMA:          188,
        DASH:           189,    // Firefox sends 109 (NumPad MINUS)
        PERIOD:         190,
        SLASH:          191,
        GRAVE:          192,
        OPEN_BRACKET:   219,
        BACKSLASH:      220,
        CLOSE_BRACKET:  221,
        APOSTROPH:      222,
        OPEN_ANGLE:     226     // German keyboard
*/
    };

    // deferred methods container =============================================

    /**
     * @constructor
     */
    Utils.DeferredMethods = function (context) {

        var // browser timeouts, mapped by indexes of deferred methods
            timeouts = {},
            // counter for unique indexes of all deferred methods
            count = 0;

        // methods ------------------------------------------------------------

        /**
         * Creates a deferred method that can be called multiple times.
         * Execution is separated into a part that runs directly every time the
         * method is called (direct callback), and a part that runce once after
         * the current script execution ends (deferred callback).
         *
         * @param {Function} directCallback
         *  A function that will be called every time the deferred method
         *  has been called. Receives the following parameters:
         *  @param {Object} storage
         *      The storage object passed to the DeferredObjects.createObject()
         *      method. Can be used to store additional data needed across
         *      multiple calls of the direct and/or deferred callbacks.
         *
         * @param {Function} deferredCallback
         *  A function that will be called once after calling the deferred
         *  method once or multiple times during the execution of the current
         *  script. Receives the following parameters:
         *  @param {Object} storage
         *      The storage object passed to the DeferredObjects.createObject()
         *      method. Can be used to store additional data needed across
         *      multiple calls of the direct and/or deferred callbacks.
         *
         * @param {Object} [storage]
         *  An object that will be passed to all callback functions and can be
         *  used to store additional data. The storage object remains valid
         *  across all calls of the direct callback and the deferred callback.
         *
         * @returns {Function}
         *  The deferred method that can be called multiple times, and that
         *  executes the deferred callback once after execution of the current
         *  script ends. Passes all arguments to the direct callback (following
         *  the leading storage parameter if specified), and returns the result
         *  of the direct callback function.
         */
        this.createMethod = function (directCallback, deferredCallback, storage) {

            var // unique index of this deferred method
                index = count++,
                // arguments for direct callback
                args = _.isUndefined(storage) ? [] : [storage];

            // create and return the deferred method
            return function () {

                // create a timeout calling the deferred callback
                if (!(index in timeouts)) {
                    timeouts[index] = window.setTimeout(function () {
                        delete timeouts[index];
                        deferredCallback.call(context, storage);
                    }, 0);
                }

                // call the direct callback with the passed arguments
                return directCallback.apply(context, args.concat(_.toArray(arguments)));
            };
        };

        /**
         * Clears the running timeouts, without calling the pending deferred
         * callback functions.
         */
        this.destroy = function () {
            _(timeouts).each(function (timeout) {
                window.clearTimeout(timeout);
            });
            timeouts = null;
        };

    };

    // console output =========================================================

    Utils.MIN_LOG_LEVEL = 'log';

    /**
     * Writes a message to the browser output console.
     *
     * @param {String} message
     *  The message text to be written to the console.
     *
     * @param {String} [level='log']
     *  The log level of the message. The string 'log' will create a generic
     *  log message, the string 'info' will create an information, the string
     *  'warn' will create a warning message, and the string 'error' will
     *  create an error message.
     */
    Utils.log = (function () {

        var // supported log levels, sorted by severity
            LOG_LEVELS = _(['log', 'info', 'warn', 'error']);

        return function (message, level) {

            // validate passed log level and get its index
            level = LOG_LEVELS.contains(level) ? level : 'log';

            // do not log if index is less than index of configured log level
            if (LOG_LEVELS.contains(Utils.MIN_LOG_LEVEL) && (LOG_LEVELS.indexOf(Utils.MIN_LOG_LEVEL) <= LOG_LEVELS.indexOf(level))) {

                // check that the browser console supports the operation
                if (_.isFunction(window.console[level])) {
                    window.console[level](message);
                } else {
                    window.console.log(level.toUpperCase() + ': ' + message);
                }
            }
        };
    }());

    /**
     * Shortcut for Utils.log(message, 'info').
     */
    Utils.info = function (message) {
        Utils.log(message, 'info');
    };

    /**
     * Shortcut for Utils.log(message, 'warn').
     */
    Utils.warn = function (message) {
        Utils.log(message, 'warn');
    };

    /**
     * Shortcut for Utils.log(message, 'error').
     */
    Utils.error = function (message) {
        Utils.log(message, 'error');
    };

    // global initialization ==================================================

    // get current language
    gettext.language.done(function (lang) { language = lang; });

    // exports ================================================================

    return Utils;

});
