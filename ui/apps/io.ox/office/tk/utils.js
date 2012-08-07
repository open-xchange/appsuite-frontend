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

define('io.ox/office/tk/utils', ['io.ox/core/gettext'], function (gettext) {

    'use strict';

    var // the ISO code of the language used by gettext
        language = null;

    // static class Utils =====================================================

    var Utils = {};

    // constants --------------------------------------------------------------

    /**
     * CSS selector for visible elements.
     *
     * @constant
     */
    Utils.VISIBLE_SELECTOR = ':visible';

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

    /**
     * Attribute name for string values to be stored in the control.
     *
     * @constant
     */
    Utils.DATA_VALUE_ATTR = 'data-value';

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
        var value = Utils.getOption(options, name);
        value = _.isFinite(value) ? value : def;
        if (_.isFinite(value)) {
            if (_.isFinite(min) && (value < min)) { value = min; }
            if (_.isFinite(max) && (value > max)) { value = max; }
            return Math.floor(value);
        }
        return value;
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
        return _.isObject(value) ? value : def;
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
     *  The default value returned when the options parameter is not a
     *  function, or if it does not contain the specified attribute, or if the
     *  attribute is not an object. May be any value (not only functions).
     *
     * @returns
     *  The value of the specified attribute, or the default value.
     */
    Utils.getFunctionOption = function (options, name, def) {
        var value = Utils.getOption(options, name);
        return _.isFunction(value) ? value : def;
    };

    /**
     * Extends the passed object with the specified attributes.
     *
     * @param {Object} [options]
     *  An object containing some attribute values. May be undefined.
     *
     * @param {Object} [extensions]
     *  Another object whose attributes will be inserted into the former
     *  object. Will overwrite existing attributes.
     *
     * @returns {Object}
     *  An object containing the attributes of the objects passed to both
     *  parameters.
     */
    Utils.extendOptions = function (options, extensions) {
        return _(_.isObject(options) ? options : {}).extend(_.isObject(extensions) ? extensions : {});
    };

    Utils.makeSingleOption = function (key, value) {
        var options = {};
        options[key] = value;
        return options;
    };

    // attribute conversion ---------------------------------------------------

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
            var fromUnit = valueAndUnit.substr(valueAndUnit.length - 2);
            value = Utils.convertLength(value, fromUnit, toUnit, digits);
        }
        return value;
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

    // generic DOM helpers ----------------------------------------------------

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
     *  returns the string '#text'.
     */
    Utils.getNodeName = function (node) {
        return Utils.getDomNode(node).nodeName.toLowerCase();
    };

    /**
     * Returns whether node1 is located before node2 in the DOM. This is also
     * the case if node1 contains node2, because node1 starts before node2, but
     * a node is not located before itself.
     *
     * @param {Node|jQuery} node1
     *  The first DOM node tested if it is located before the second node. If
     *  this object is a jQuery collection, uses the first node it contains.
     *
     * @param {Node|jQuery} node2
     *  The second DOM node. If this object is a jQuery collection, uses the
     *  first node it contains.
     *
     * @returns {Boolean}
     *  Whether node1 is located before node2.
     */
    Utils.isNodeBeforeNode = function (node1, node2) {
        node1 = Utils.getDomNode(node1);
        node2 = Utils.getDomNode(node2);
        return (node1.compareDocumentPosition(node2) & 4) === 4;
    };

    /**
     * Returns the DOM node that follows the passed node in DOM tree order.
     * If the node is an element with children, returns its first child node.
     * Otherwise, tries to return the next sibling of the node. If the node is
     * the last sibling, goes up to the parent node(s) and tries to return
     * their next sibling.
     *
     * @param {Node|jQuery} node
     *  The DOM node whose successor will be returned. If this object is a
     *  jQuery collection, uses the first node it contains.
     *
     * @returns {Node|Undefined}
     *  The next node in the DOM tree, or undefined, if the passed node is the
     *  very last leaf in the DOM tree.
     */
    Utils.getNextNodeInTree = function (node) {

        // node is an element with child nodes, return its first child
        node = Utils.getDomNode(node);
        if ((node.nodeType === 1) && node.firstChild) {
            return node.firstChild;
        }

        // find first node up the tree that has a sibling, return that sibling
        while (node && !node.nextSibling) {
            node = node.parentNode;
        }
        return node && node.nextSibling;
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
     *  DOM node object as first parameter. If the iterator returns the boolean
     *  value false, the iteration process will be stopped immediately.
     *
     * @param {Object} [context]
     *  If specified, the iterator will be called with this context (the symbol
     *  'this' will be bound to the context inside the iterator function).
     *
     * @returns {Boolean|Undefined}
     *  The boolean value false, if any iterator call has returned false to
     *  stop the iteration process, otherwise undefined.
     */
    Utils.iterateDescendantNodes = function (element, iterator, context) {

        // visit all child nodes
        element = Utils.getDomNode(element);
        for (var child = element.firstChild; child; child = child.nextSibling) {

            // call iterator for child node; if it returns false, exit loop and return too
            if (iterator.call(context, child) === false) { return false; }

            // iterate child nodes; if iterator for any descendant node returns false, return false too
            if ((child.nodeType === 1) && (Utils.iterateDescendantNodes(child, iterator, context) === false)) { return false; }
        }
    };

    /**
     * Returns all text nodes contained in the specified element.
     *
     * @param {HTMLElement|jQuery} element
     *  A DOM element object whose descendant text nodes will be returned. If
     *  this object is a jQuery collection, uses the first node it contains.
     *
     * @returns {TextNode[]}
     *  An array of text nodes contained in the passed element, in the correct
     *  order.
     */
    Utils.collectTextNodes = function (element) {
        var textNodes = [];
        Utils.iterateDescendantNodes(element, function (node) {
            if (node.nodeType === 3) { textNodes.push(node); }
        });
        return textNodes;
    };

    /**
     * Scrolls a specific child node of a container node into its visible area.
     *
     * @param {jQuery} scrollableNode
     *  The container node as jQuery object that contains the specified child
     *  node.
     *
     * @param {jQuery} childNode
     *  The node as jQuery object that will be made visible by scrolling the
     *  container node.
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

        return function (scrollableNode, childNode, options) {

            var // scroll direction
                horizontal = Utils.getBooleanOption(options, 'horizontal', false),
                // attribute and function names depending on scroll direction
                names = horizontal ? horizontalNames : verticalNames,

                // padding between scrolled element and container border
                padding = Utils.getIntegerOption(options, 'padding', 0, 0, 9999),
                // how to position an oversized child node
                overflow = Utils.getStringOption(options, 'overflow'),

                // inner size of the scrollable container node
                scrollableSize = scrollableNode[names.innerSize](),
                // border size on left/top end of the container node
                scrollableBorderSize = Utils.convertCssLength(scrollableNode.css(names.offsetBorder), 'px', 0),
                // current position of the scrollable container node (inner area, relative to browser window)
                scrollableOffset = scrollableNode.offset()[names.offset] + scrollableBorderSize,

                // current position of the child node (relative to browser window)
                childOffset = childNode.offset()[names.offset],
                // outer size of the child node
                childSize = childNode[names.outerSize](),
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
                newChildOffset = Math.min(Math.max(childOffset, minChildOffset), maxChildOffset);
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
            scrollableNode[names.scroll](scrollableNode[names.scroll]() + childOffset - newChildOffset);
        };
    }());

    // form control elements --------------------------------------------------

    /**
     * Creates and returns a new form control element.
     *
     * @param {String} element
     *  The tag name of the DOM element to be created.
     *
     * @param {Object} [attribs]
     *  A map of attributes to be passed to the element constructor.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new element. The
     *  following options are supported:
     *  @param [options.value]
     *      A value or object that will be copied to the 'data-value' attribute
     *      of the control. Will be converted to a JSON string. Must not be
     *      null. The undefined value will be ignored.
     *  @param {Object} [options.css]
     *      A map with CSS formatting attributes to be added to the control.
     *
     * @returns {jQuery}
     *  A jQuery object containing the new control element.
     */
    Utils.createControl = function (element, attribs, options) {

        var // create the DOM element
            control = $('<' + element + '>', attribs),

            // CSS formatting attributes
            css = Utils.getObjectOption(options, 'css', {});

        Utils.setControlValue(control, Utils.getOption(options, 'value'));
        return control.css(css);
    };

    /**
     * Returns the value stored in the 'data-value' attribute of the first
     * control in the passed jQuery collection. Will be converted from the JSON
     * string to the original value.
     *
     * @param control
     *  A jQuery collection containing a control element.
     */
    Utils.getControlValue = function (control) {
        var value = control.first().attr(Utils.DATA_VALUE_ATTR);
        if (_.isString(value)) {
            try {
                return JSON.parse(value);
            } catch (ex) {
            }
        }
    };

    /**
     * Stores the passed value in the 'data-value' attribute of the control in
     * the passed jQuery collection, after converting it to a JSON string.
     *
     * @param control
     *  A jQuery collection containing a control element.
     *
     * @param value
     *  A value or object that will be copied to the 'data-value' attribute of
     *  the control. Will be converted to a JSON string. Must not be null. The
     *  undefined value will be ignored.
     */
    Utils.setControlValue = function (control, value) {
        if (!_.isUndefined(value) && !_.isNull(value)) {
            try {
                control.attr(Utils.DATA_VALUE_ATTR, JSON.stringify(value));
            } catch (ex) {
            }
        }
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
        controls
            .toggleClass(Utils.DISABLED_CLASS, !enabled)
            .tooltip(enabled ? 'enable' : 'disable');
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
     * Removes the icon and the text label from the passed form control.
     *
     * @param {jQuery} control
     *  The control to be manipulated, as jQuery collection.
     */
    Utils.removeControlCaption = function (control) {
        control.children('span[data-role="icon"], span[data-role="label"]').remove();
        control.addClass('narrow-padding');
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
     */
    Utils.setControlCaption = function (control, options) {

        var // option values
            icon = Utils.getStringOption(options, 'icon'),
            label = Utils.getStringOption(options, 'label'),
            labelCss = Utils.getObjectOption(options, 'labelCss', {});

        // remove the old spans
        Utils.removeControlCaption(control);

        // prepend the label
        if (label) {
            control.removeClass('narrow-padding').prepend($('<span>')
                .attr('data-role', 'label')
                .text(label)
                .css(labelCss));
        }

        // prepend the icon
        if (icon) {
            control.removeClass('narrow-padding').prepend($('<span>')
                .attr('data-role', 'icon')
                .append($('<i>').addClass(icon + ' ' + language))
            );
        }
    };

    /**
     * Clones the caption in the specified source control, and inserts it into
     * the target control(s).
     *
     * @param {jQuery} target
     *  The target control(s) that will receive a clone of the source control
     *  caption.
     *
     * @param {jQuery} source
     *  The source control containing a caption element.
     */
    Utils.cloneControlCaption = function (target, source) {

        var // clone the label and the icon from the source control
            caption = source.first().children('span[data-role="icon"], span[data-role="label"]').clone();

        // remove the old spans, and insert the new caption nodes
        Utils.removeControlCaption(target);
        target.prepend(caption).toggleClass('narrow-padding', !caption.length);
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
        var label = control.first().find('[data-role="label"]');
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
        control.tooltip({
            title: tooltip,
            placement: placement || 'top',
            animation: false
        });
    };

    // label elements ---------------------------------------------------------

    /**
     * Creates and returns a new label element.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new label. Supports
     *  all generic options supported by the method Utils.createControl(), and
     *  all caption options supported by the method Utils.setControlLabel().
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
     *  A jQuery object containing the new button element.
     */
    Utils.createButton = function (options) {

        var // create the DOM button element
            button = Utils.createControl('button', undefined, options);

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
     * Activates a button from the passed collection of buttons, after
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
    Utils.selectRadioButton = function (buttons, value) {

        var // find the button to be activated
            button = _.isNull(value) ? $() : buttons.filter(function () { return _.isEqual(value, Utils.getControlValue($(this))); });

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

    Utils.getTextFieldSelection = function (textField) {
        var input = textField.get(0);
        return input ? { start: input.selectionStart, end: input.selectionEnd } : undefined;
    };

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

    // window -----------------------------------------------------------------

    /**
     * Registers a handler at the browser window that listens to resize events.
     * The event handler will be activated when the specified application
     * window is visible, and deactivated, if the application window is hidden.
     *
     * @param {ox.ui.Window} appWindow
     *  The application window object.
     *
     * @param {Function} resizeHandler
     *  The resize handler function bound to 'resize' events of the browser
     *  window. Will be triggered once manually when the application window
     *  becomes visible.
     */
    Utils.registerWindowResizeHandler = function (appWindow, resizeHandler) {
        appWindow
            .on('show', function () {
                $(window).on('resize', resizeHandler);
                resizeHandler();
            })
            .on('hide', function () {
                $(window).off('resize', resizeHandler);
            });
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

    // global initialization ==================================================

    // get current language: TODO review
    gettext.language.done(function (lang) { language = lang; });

    // exports ================================================================

    return Utils;

});
