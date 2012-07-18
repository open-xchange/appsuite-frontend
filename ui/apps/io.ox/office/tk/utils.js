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
        value = _.isNumber(value) ? value : def;
        if (_.isNumber(value)) {
            if (_.isNumber(min) && (value < min)) { value = min; }
            if (_.isNumber(max) && (value > max)) { value = max; }
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
     * Extends the passed object with the specified attributes.
     *
     * @param {Object|Undefined} options
     *  An object containing some attribute values. May be undefined.
     *
     * @param {Object} extensions
     *  Another object whose attributes will be inserted into the former
     *  object. Will overwrite existing attributes.
     *
     * @returns {Object}
     *  An object containing the attributes of the objects passed to both
     *  parameters.
     */
    Utils.extendOptions = function (options, extensions) {
        return _(_.isObject(options) ? options : {}).extend(extensions);
    };

    // form control elements --------------------------------------------------

    /**
     * Creates and returns a new form control element.
     *
     * @param {String} element
     *  The tag name of the DOM element to be created.
     *
     * @param {String} key
     *  The key associated to the control element. Will be stored in its
     *  'data-key' attribute.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new element. The
     *  following options are supported:
     *  @param {String} [options.classes]
     *      The CSS class names to be added to the element. If omitted, no
     *      classes will be added.
     *  @param {Object} [options.css]
     *      A map with CSS formatting attributes to be added to the element.
     *  @param {String} [options.tooltip]
     *      Tool tip text shown when the mouse hovers the control. If omitted,
     *      the control will not show a tool tip.
     *
     * @returns {jQuery}
     *  A jQuery object containing the new control element.
     */
    Utils.createControl = function (element, key, options) {

        var // create the DOM element
            control = $('<' + element + '>'),

            // option values
            classes = Utils.getStringOption(options, 'classes'),
            css = Utils.getObjectOption(options, 'css'),
            tooltip = Utils.getStringOption(options, 'tooltip');

        // add the key as data attribute
        if (_.isString(key)) {
            control.attr('data-key', key);
        }

        // add optional formatting
        if (classes) {
            control.addClass(classes);
        }
        if (css) {
            control.css(css);
        }
        if (tooltip) {
            control.tooltip({ title: tooltip, placement: 'top', animation: false });
        }

        return control;
    };

    /**
     * Inserts an icon and a text label to the existing contents of the passed
     * form control.
     *
     * @param {jQuery} control
     *  The control to be manipulated, as jQuery collection.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new label. Supports
     *  all generic options (see method Utils.createControl() for details).
     *  Additionally, the following options are supported:
     *  @param {String} [options.icon]
     *      The full name of the Bootstrap or OX icon class. If omitted, no
     *      icon will be shown.
     *  @param {String} [options.label]
     *      The text label. Will follow an icon. If omitted, no text will be
     *      shown.
     *
     * @returns {jQuery}
     *  A jQuery object containing the new label element.
     */
    Utils.setControlCaption = function (control, options) {

        var // the caption element
            caption = control.children('span.caption').empty(),

            // option values
            icon = Utils.getStringOption(options, 'icon'),
            label = Utils.getStringOption(options, 'label');

        // remove the old
        // add icon in an i element
        if (icon) {
            caption.append($('<i>').addClass(icon + ' ' + language));
        }
        // add text label, separate it from the icon
        if (label) {
            caption.append($('<span>').text(label));
        }
    };

    Utils.cloneControlCaption = function (control, source) {

        var // the caption area of the target control(s)
            targetCaption = control.children('span.caption').empty(),
            // the caption area of the source control
            sourceCaption = source.first().children('span.caption');

        targetCaption.append(sourceCaption.contents().clone());
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
     */
    Utils.enableControls = function (controls, state) {
        var enabled = _.isUndefined(state) || (state === true);
        controls.toggleClass(Utils.DISABLED_CLASS, !enabled);
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

    // label elements ---------------------------------------------------------

    /**
     * Creates and returns a new label element.
     *
     * @param {String} key
     *  The key associated to this label element. Will be stored in the
     *  'data-key' attribute of the label.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new label. Supports
     *  all generic options (see method Utils.createControl() for details).
     *  Additionally, the following options are supported:
     *  @param {String} [options.icon]
     *      The full name of the Bootstrap or OX icon class. If omitted, no
     *      icon will be shown.
     *  @param {String} [options.label]
     *      The text label. Will follow an icon. If omitted, no text will be
     *      shown.
     *
     * @returns {jQuery}
     *  A jQuery object containing the new label element.
     */
    Utils.createLabel = function (key, options) {

        var // create the DOM label element
            label = Utils.createControl('label', key, options).append($('<span>').addClass('caption'));

        Utils.setControlCaption(label, options);
        return label;
    };

    // button elements --------------------------------------------------------

    /**
     * Creates and returns a new button element.
     *
     * @param {String} key
     *  The key associated to this button element. Will be stored in the
     *  'data-key' attribute of the button.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new button. Supports
     *  all generic options (see method Utils.createControl() for details).
     *  Additionally, the following options are supported:
     *  @param {String} [options.icon]
     *      The full name of the Bootstrap or OX icon class. If omitted, no
     *      icon will be shown.
     *  @param {String} [options.label]
     *      The text label of the button. Will follow an icon. If omitted, no
     *      label will be shown.
     *
     * @returns {jQuery}
     *  A jQuery object containing the new button element.
     */
    Utils.createButton = function (key, options) {

        var // create the DOM button element
            button = Utils.createControl('button', key, options).append($('<span>').addClass('caption'));

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

    // other useful functions -------------------------------------------------

    /**
     * Wraps the passed function, protecting it from being called
     * recursively.
     *
     * @param {Function} func
     *  The original function that needs to be protected against recursive
     *  calls.
     *
     * @param {Object} [context]
     *  The calling context used to invoke the wapped function.
     *
     * @returns {Function}
     *  A wrapper function that initially calls the wrapped function and
     *  returns its value. When called recursively while running (directly
     *  or indirectly in the same call stack, or even asynchronously), it
     *  simply returns undefined instead of calling the wrapped function
     *  again.
     */
    Utils.makeNoRecursionGuard = function (func, context) {
        var running = false;
        return function () {
            if (!running) {
                try {
                    running = true;
                    return func.apply(context, arguments);
                } finally {
                    running = false;
                }
            }
        };
    };

    // global initialization ==================================================

    // get current language: TODO review
    gettext.language.done(function (lang) { language = lang; });

    // exports ================================================================

    return Utils;

});
