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

define('io.ox/office/tk/control/textfield',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/group'
    ], function (Utils, Group) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // left/right padding in the text field, in pixels
        FIELD_PADDING = 4,

        // the default text validator that does not do anything
        defaultValidator = {

            // method that converts a value from an update events to field text
            valueToText: function (value) { return _.isString(value) ? value : ''; },

            // method that converts the field text to a value returned by action handlers
            textToValue: function (text) { return text; },

            // method that validates the current text while editing
            validate: function (text) { return text; }
        };

    // class TextField ========================================================

    /**
     * Creates a container element used to hold a text input field.
     *
     * @constructor
     *
     * @extends Group
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the text field. Supports
     *  all options of the Group base class, generic caption options (see
     *  Utils.setControlCaption() for details), and all generic formatting
     *  options of input fields (see method Utils.createTextField() for
     *  details). Additionally, the following options are supported:
     *  @param {Number} [options.width=200]
     *      The fixed inner width of the editing area (without any padding), in
     *      pixels.
     *  @param {Object} [validator]
     *      A text validator that will be used to convert the values from
     *      'update' events to the text representation used in this text field,
     *      to validate the text while typing in the text field, and to convert
     *      the entered text to the value returned by the action handler. If
     *      no validator is specified, a default validator will be used that
     *      does not perform any conversions.
     */
    function TextField(options) {

        var // self reference
            self = this,

            // create the text field
            textField = Utils.createTextField(options),

            // the caption (icon and text label) for the text field
            caption = Utils.createLabel(options).addClass('input-caption'),

            // the caption (icon and text label) for the text field
            background = $('<div>'),

            // the overlay container for the caption and the background
            overlay = $('<div>').addClass('input-overlay').append(caption, background),

            validator = Utils.getObjectOption(options, 'validator', defaultValidator),

            // initial value of text field when focused, needed for ESCAPE key handling
            savedValue = null;

        // private methods ----------------------------------------------------

        /**
         * Saves the current value of the text field in an internal variable,
         * to be able to restore it when editing is cancelled.
         */
        function saveValue() {
            savedValue = textField.val();
        }

        /**
         * Restores the old value saved in the last call of the method
         * saveValue().
         */
        function restoreValue() {
            if (_.isString(savedValue)) {
                textField.val(savedValue);
                savedValue = null;
            }
        }

        /**
         * Triggers a change event, if the value has been changed since the
         * last call of the method saveValue().
         */
        function commitValue() {
            if (savedValue !== textField.val()) {
                savedValue = null;
                self.trigger('change', validator.textToValue(textField.val()));
            } else {
                self.trigger('cancel');
            }
        }

        /**
         * Called when the application window will be shown for the first time.
         * Initializes the caption overlay. Needs the calculated element sizes
         * which become available when the window becomes visible and all
         * elements have been inserted into the DOM.
         */
        function initHandler() {

            var // the inner width of the editing area
                width = Utils.getIntegerOption(options, 'width', 200, 1),
                // the width including the padding of the text field
                paddedWidth = width + 2 * FIELD_PADDING,
                // the current width of the caption element
                captionWidth = caption.outerWidth();

            // expand the text field by the size of the overlay caption
            textField
                .width(captionWidth + paddedWidth + 1) // text field has box-sizing: border-box
                .css({ paddingLeft: (captionWidth - 1 + FIELD_PADDING) + 'px', paddingRight: FIELD_PADDING + 'px' });

            // set the size of the white background area
            background.width(paddedWidth).height(textField.height());
        }

        /**
         * The update handler for this text field.
         */
        function updateHandler(value) {
            textField.val(validator.valueToText(value));
        }

        function fieldFocusHandler(event) {
            switch (event.type) {
            case 'focus':
                saveValue();
                break;
            case 'focus:key':
                // select entire text when reaching the field with keyboard
                textField.get(0).selectionStart = 0;
                textField.get(0).selectionEnd = textField.val().length;
                break;
            case 'blur':
                restoreValue();
                break;
            }
        }

        /**
         * Handles keyboard events, especially the cursor keys.
         */
        function fieldKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keyup = event.type === 'keyup';

            switch (event.keyCode) {
            case KeyCodes.LEFT_ARROW:
            case KeyCodes.RIGHT_ARROW:
                // do not bubble to view component (suppress focus navigation)
                event.stopPropagation();
                // ... but let the browser perform cursor movement
                break;
            case KeyCodes.ENTER:
                if (keyup) { commitValue(); }
                return false;
            }
        }

        /**
         * Handles input events triggered when the text changes while typing.
         * Performs live validation with the current validator.
         */
        function fieldInputHandler(event) {

            var // get current value of the text field
                oldValue = textField.val(),
                // get validated value
                newValue = validator.validate(oldValue),
                // the DOM input element
                input = textField.get(0),
                // current selection
                selStart, selEnd;

            if (oldValue !== newValue) {
                // first save selection (browsers mess with selection when changing text)
                selStart = input.selectionStart;
                selEnd = input.selectionEnd;
                // set the new value
                textField.val(newValue);
                // restore selection
                input.selectionStart = Math.min(selStart, newValue.length);
                input.selectionEnd = Math.min(selEnd, newValue.length);
            }
        }

        // base constructor ---------------------------------------------------

        Group.call(this, options);

        // initialization -----------------------------------------------------

        // insert the text field into this group, and register event handlers
        this.addFocusableControl(textField)
            .addChildNodes(overlay)
            .on('init', initHandler)
            .registerUpdateHandler(updateHandler);
        textField
            .on('focus focus:key blur', fieldFocusHandler)
            .on('keydown keypress keyup', fieldKeyHandler)
            // Validation while typing. IE9 does not trigger 'input' when deleting
            // characters, use key events as a workaround. This is still not perfect,
            // as it misses cut/delete from context menu, drag&drop, etc.
            .on('input keydown keyup', fieldInputHandler);

    } // class TextField

    // class TextField.TextValidator ==========================================

    function TextValidator(options) {

        var // maximum length
            maxLength = Utils.getIntegerOption(options, 'maxLength', undefined, 0),
            // last valid value
            lastValid = '';

        // methods ------------------------------------------------------------

        this.valueToText = function (value) {
            if (_.isString(value)) {
                lastValid = _.isNumber(maxLength) ? value.substr(0, maxLength) : value;
                return this.validate(value);
            }
            return (lastValid = '');
        };

        this.textToValue = function (text) {
            return text;
        };

        this.validate = function (text) {
            return (_.isNumber(maxLength) && (text.length > maxLength)) ? lastValid : (lastValid = text);
        };

    } // class TextField.TextValidator

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: TextField }, { TextValidator: TextValidator });

});
