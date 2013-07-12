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

define('io.ox/office/tk/keycodes', ['io.ox/office/tk/utils'], function (Utils) {

    'use strict';

    // static class KeyCodes ==================================================

    /**
     * A map of key codes used in 'keydown' and 'keyup' browser events.
     */
    var KeyCodes = {

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

    // methods ----------------------------------------------------------------

    /**
     * Returns whether the states of the control keys in the passed event
     * object matches the specified definition.
     *
     * @param {Event|jQuery.Event}
     *  An event object containing control key states (properties 'shiftKey',
     *  'altKey', 'ctrlKey', and 'metaKey'), either as instance of DOM Event,
     *  or as jQuery event object.
     *
     * @param {Object} [options]
     *  The expected settings of the control keys to match the passed event
     *  against. The following options are supported:
     *  @param {Boolean|Null} [options.shiftKey=false]
     *      If set to true, the 'shiftKey' property must be set in the event.
     *      If set to false (or omitted), the 'shiftKey' property must not be
     *      set. If set to null, the current state of the 'shiftKey' property
     *      will be ignored.
     *  @param {Boolean|Null} [options.altKey=false]
     *      If set to true, the 'altKey' property must be set in the event. If
     *      set to false (or omitted), the 'altKey' property must not be set.
     *      If set to null, the current state of the 'altKey' property will be
     *      ignored.
     *  @param {Boolean|Null} [options.ctrlKey=false]
     *      If set to true, the 'ctrlKey' property must be set in the event. If
     *      set to false (or omitted), the 'ctrlKey' property must not be set.
     *      If set to null, the current state of the 'ctrlKey' property will be
     *      ignored.
     *  @param {Boolean|Null} [options.metaKey=false]
     *      If set to true, the 'metaKey' property must be set in the event. If
     *      set to false (or omitted), the 'metaKey' property must not be set.
     *      If set to null, the current state of the 'metaKey' property will be
     *      ignored.
     *  @param {Boolean} [options.altOrMetaKey=false]
     *      Convenience option. If set to true, the passed event matches, if
     *      either the 'altKey' or the 'metaKey' property is set (the options
     *      'options.altKey' and 'options.metaKey' will be ignored).
     *  @param {Boolean} [options.ctrlOrMetaKey=false]
     *      Convenience option. If set to true, the passed event matches, if
     *      either the 'ctrlKey' or the 'metaKey' property is set (the options
     *      'options.ctrlKey' and 'options.metaKey' will be ignored).
     *
     * @returns {Boolean}
     *  Whether the passed event object matches the control key settings
     *  specified in the options.
     */
    KeyCodes.matchEventControlKeys = function (event, options) {

        function isMatchingControlKey(currentState, expectedState) {
            return _.isNull(expectedState) || (currentState === (_.isBoolean(expectedState) && expectedState));
        }

        // 'shiftKey' option must always match
        if (!isMatchingControlKey(event.shiftKey, Utils.getOption(options, 'shiftKey'))) {
            return false;
        }

        // when 'altOrMetaKey' is set, ignore 'altKey' and 'metaKey' options
        if (Utils.getBooleanOption(options, 'altOrMetaKey', false)) {
            return (event.altKey !== event.metaKey) && isMatchingControlKey(event.ctrlKey, Utils.getOption(options, 'ctrlKey'));
        }

        // when 'ctrlOrMetaKey' is set, ignore 'ctrlKey' and 'metaKey' options
        if (Utils.getBooleanOption(options, 'ctrlOrMetaKey', false)) {
            return (event.ctrlKey !== event.metaKey) && isMatchingControlKey(event.altKey, Utils.getOption(options, 'altKey'));
        }

        // otherwise, options 'altKey', 'ctlKey' and 'metaKey' options must match
        return isMatchingControlKey(event.altKey, Utils.getOption(options, 'altKey')) &&
            isMatchingControlKey(event.ctrlKey, Utils.getOption(options, 'ctrlKey')) &&
            isMatchingControlKey(event.metaKey, Utils.getOption(options, 'metaKey'));
    };

    /**
     * Returns whether the key code and the states of the control keys in the
     * passed keyboard event object matches the specified definition.
     *
     * @param {KeyboardEvent|jQuery.Event}
     *  A keyboard event object containing control key states (properties
     *  'shiftKey', 'altKey', 'ctrlKey', and 'metaKey'), either as instance of
     *  DOM KeyboardEvent, or as jQuery event object, received from a 'keydown'
     *  or 'keyup' browser event.
     *
     * @param {Number|String} keyCode
     *  The numeric key code, or the upper-case name of a key code, as defined
     *  in this KeyCodes class. Be careful with digit keys, for example, the
     *  number 9 matches the TAB key (KeyCodes.TAB), but the string '9' matches
     *  the digit '9' key (KeyCodes['9'] with the key code 57).
     *
     * @param {Object} [options]
     *  The expected settings of the control keys to match the passed event
     *  against. See method KeyCodes.matchEventControlKeys() for details.
     *
     * @returns {Boolean}
     *  Whether the passed event object matches the key code and the control
     *  key settings specified in the options.
     */
    KeyCodes.matchKeyboardEvent = function (event, keyCode, options) {
        return (event.keyCode === (_.isString(keyCode) ? KeyCodes[keyCode] : keyCode)) && KeyCodes.matchEventControlKeys(event, options);
    };

    // exports ================================================================

    return KeyCodes;

});
