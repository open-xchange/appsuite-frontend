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
     'io.ox/office/tk/keycodes',
     'io.ox/office/tk/control/group'
    ], function (Utils, KeyCodes, Group) {

    'use strict';

    var // default validator without any restrictions on the field text
        defaultValidator = null;

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
     *  all options of the Group base class, and all generic formatting options
     *  of input fields (see method Utils.createTextField() for details).
     *  Additionally, the following options are supported:
     *  @param {Boolean} [options.select=false]
     *      If set to true, the entire text will be selected after the text
     *      field has been clicked. Note that the text will always be selected
     *      independent from this option, if the text field gets focus via
     *      keyboard navigation.
     *  @param {TextField.Validator} [options.validator]
     *      A text validator that will be used to convert the values from
     *      'update' events to the text representation used in this text field,
     *      to validate the text while typing in the text field, and to convert
     *      the entered text to the value returned by the action handler. If no
     *      validator has been specified, a default validator will be used that
     *      does not perform any conversions.
     */
    function TextField(options) {

        var // self reference
            self = this,

            // create the input field control (width has to be set at the wrapper node)
            fieldNode = Utils.createTextField(Utils.extendOptions(options, { width: undefined })).addClass(Utils.FOCUSABLE_CLASS),

            // create the wrapper node for the input field (IE renders input fields with padding wrong)
            wrapperNode = $('<div>').addClass('input-wrapper').width(Utils.getOption(options, 'width', '')).append(fieldNode),

            // whether to select the entire text on click
            select = Utils.getBooleanOption(options, 'select', false),

            // the validator used to convert and validate values
            validator = Utils.getObjectOption(options, 'validator', defaultValidator),

            // saved state of the text field, used to restore while validating
            fieldState = null,

            // initial value of text field when focused, needed for ESCAPE key handling
            initialText = null,

            // whether the group is focused (needed to detect whether to restore selection)
            focused = false;

        // base constructor ---------------------------------------------------

        Group.call(this, options);

        // private methods ----------------------------------------------------

        /**
         * Saves the current value and selection of the text field node.
         */
        function saveFieldState() {
            fieldState = Utils.getTextFieldSelection(fieldNode);
            fieldState.value = fieldNode.val();
        }

        /**
         * Restores the current value and selection of the text field.
         */
        function restoreFieldState() {
            fieldNode.val(fieldState.value);
            Utils.setTextFieldSelection(fieldNode, fieldState.start, fieldState.end);
        }

        /**
         * The update handler for this text field.
         */
        function updateHandler(value) {
            value = (_.isUndefined(value) || _.isNull(value)) ? '' : validator.valueToText(value);
            fieldNode.val(value);
            self.getNode().attr('data-value', value);
            saveFieldState();
        }

        /**
         * Returns the current value associated to the text field.
         */
        function resolveValueHandler() {
            return self.getFieldValue();
        }

        /**
         * Handles all focus events of the text field.
         */
        function focusHandler(event) {
            switch (event.type) {
            case 'group:focus':
                // save current value, if this group receives initial focus
                initialText = fieldState.value = fieldNode.val();
                break;
            case 'focus':
                if (focused) {
                    // focused again (e.g. from drop-down menu): restore selection
                    restoreFieldState();
                } else if (select) {
                    // select entire text on mouse click when specified via option
                    fieldNode.select().one('mouseup', false);
                }
                saveFieldState();
                // IE9 does not trigger 'input' events when deleting characters
                // or pasting text, use a timer interval as a workaround
                if (Utils.IE9) {
                    fieldNode.data('update-timer', window.setInterval(fieldInputHandler, 250));
                }
                focused = true;
                break;
            case 'focus:key':
                // always select entire text when reaching the field with keyboard
                fieldNode.select().off('mouseup');
                saveFieldState();
                break;
            case 'beforedeactivate':
                // Bug 27912: IE keeps text selection visible when losing focus (text
                // is still highlighted although the control is not focused anymore).
                // The 'beforedeactivate' event is triggered by IE only, before the
                // focus leaves the text field. Do not interfere with focus handling
                // in 'blur' events, e.g. Chrome gets confused when changing browser
                // text selection while it currently changes the focus node.
                if (_.browser.IE) {
                    saveFieldState();
                    Utils.setTextFieldSelection(fieldNode, 0);
                }
                break;
            case 'blur':
                fieldNode.off('mouseup');
                // save field state to be able to restore selection (but not in
                // IE, see 'beforedeactivate' event handler above)
                if (!_.browser.IE) {
                    saveFieldState();
                }
                // IE9 does not trigger 'input' events when deleting characters or pasting
                // text, remove the timer interval that has been started as a workaround
                if (Utils.IE9) {
                    window.clearInterval(fieldNode.data('update-timer'));
                    fieldNode.data('update-timer', null);
                }
                break;
            case 'group:blur':
                // Bug 27175: always commit value when losing focus
                if (_.isString(initialText) && (initialText !== fieldNode.val())) {
                    // pass preserveFocus option to not interfere with current focus handling
                    self.triggerChange(fieldNode, { preserveFocus: true });
                }
                initialText = null;
                focused = false;
                break;
            }
        }

        /**
         * Handles enable/disable events of the group.
         */
        function enableHandler(event, state) {
            if (state) {
                fieldNode.removeAttr('readonly');
            } else {
                fieldNode.attr('readonly', 'readonly');
            }
        }

        /**
         * Handles keyboard events.
         */
        function fieldKeyHandler(event) {
            switch (event.keyCode) {
            case KeyCodes.ENTER:
                if (event.type === 'keyup') {
                    self.triggerChange(fieldNode);
                    // prevent another trigger from group:blur handler
                    initialText = null;
                }
                return false;
            case KeyCodes.ESCAPE:
                if (event.type === 'keydown') {
                    fieldNode.val(initialText);
                }
            }
        }

        /**
         * Handles input events triggered when the text changes while typing.
         * Performs live validation with the current validator.
         */
        function fieldInputHandler() {

            var // current value of the text field
                value = fieldNode.val(),
                // original field state
                oldFieldState = null,
                // result of the text field validation
                result = null;

            // do not perform validation if nothing has changed
            if (value === fieldState.value) { return; }

            // save old field state, validate the current field text
            oldFieldState = _.clone(fieldState);
            result = validator.validate(value);

            // update the text field according to the validation result
            if (result === false) {
                // false: restore the old field state stored in validationFieldState
                restoreFieldState();
            } else if (_.isString(result) && (result !== value)) {
                // insert the validation result and restore the old selection
                fieldState.value = result;
                restoreFieldState();
            }

            // trigger 'textfield:validated' event to all listeners, pass old field state
            self.trigger('textfield:validated', oldFieldState);

            // update current state of the text field
            saveFieldState();
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the text control element, as jQuery object.
         */
        this.getTextFieldNode = function () {
            return fieldNode;
        };

        /**
         * Returns the value represented by the text in the text control.
         */
        this.getFieldValue = function () {
            return validator.textToValue(fieldNode.val());
        };

        /**
         * Converts the passed value to a text using the current validator.
         */
        this.valueToText = function (value) {
            return validator.valueToText(value);
        };

        /**
         * Converts the passed text to a value using the current validator.
         */
        this.textToValue = function (text) {
            return validator.textToValue(text);
        };

        // initialization -----------------------------------------------------

        // add special marker class used to adjust formatting
        this.getNode().addClass('text-field');

        // insert the text field into this group, and register event handlers
        this.addChildNodes(wrapperNode)
            .registerUpdateHandler(updateHandler)
            .registerChangeHandler(null, { node: fieldNode, valueResolver: resolveValueHandler })
            .on({
                'group:focus group:blur': focusHandler,
                'group:enable': enableHandler
            });

        fieldNode.on({
            'focus focus:key beforedeactivate blur:key blur': focusHandler,
            'keydown keypress keyup': fieldKeyHandler,
            'input': fieldInputHandler
        });

        // forward clicks on the wrapper node (left/right padding beside the input field)
        wrapperNode.on('click', function (event) {
            if (self.isEnabled() && wrapperNode.is(event.target)) {
                fieldNode.focus();
            }
        });

    } // class TextField

    // class TextField.Validator ==============================================

    /**
     * Base class for text field validators used to convert between values and
     * field texts, and to validate the text field while editing. Provides a
     * default implementation of all methods that do not restrict editing.
     *
     * @constructor
     */
    TextField.Validator = _.makeExtendable(function () {

        // methods ------------------------------------------------------------

        /**
         * Converts the passed value to a text string to be inserted into a
         * text field. Intended to be overwritten by derived classes. This
         * default implementation returns the passed value, if it is a string,
         * otherwise an empty string.
         *
         * @param {Any} value
         *  The value to be converted to a text.
         *
         * @returns {String}
         *  The text converted from the passed value, or an empty string, if
         *  the passed value cannot be converted to text.
         *
         */
        this.valueToText = function (value) {
            return _.isString(value) ? value : '';
        };

        /**
         * Converts the passed text to a value that will be passed to all event
         * listeners of a text field. Intended to be overwritten by derived
         * classes. This default implementation returns the unmodified text.
         *
         * @param {String} text
         *  The text to be converted to a value.
         *
         * @returns {Any}
         *  The value converted from the passed text. The value null indicates
         *  that the text cannot be converted to a valid value.
         */
        this.textToValue = function (text) {
            return text;
        };

        /**
         * Validates the passed text that has been changed while editing a text
         * field. It is possible to return a new string value that will be
         * inserted into the text field, or a boolean value indicating whether
         * to restore the old state of the text field. Intended to be
         * overwritten by derived classes. This default implementation does not
         * change the text field.
         *
         * @param {String} text
         *  The current contents of the text field to be validated.
         *
         * @returns {String|Boolean}
         *  When returning a string, the text field will be updated to contain
         *  the returned value while restoring its selection (browsers may
         *  destroy the selection when changing the text). When returning the
         *  boolean value false, the previous state of the text field (as it
         *  was after the last validation) will be restored. Otherwise, the
         *  value of the text field is considered to be valid and will not be
         *  modified.
         */
        this.validate = $.noop;

    }); // class TextField.Validator

    // global instance of the default validator
    defaultValidator = new TextField.Validator();

    // class TextField.TextValidator ==========================================

    /**
     * A validator for text fields that restricts the allowed values according
     * to the passed options.
     *
     * @constructor
     *
     * @extends TextField.Validator
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the text validator. The
     *  following options are supported:
     *  @param {Number} [options.maxLength=0x7FFFFFFF]
     *      The maximum number of characters to be inserted into the text
     *      field. All attempts to insert more characters will be rejected.
     */
    TextField.TextValidator = TextField.Validator.extend({ constructor: function (options) {

        var // maximum length
            maxLength = Utils.getIntegerOption(options, 'maxLength', 0x7FFFFFFF, 0, 0x7FFFFFFF);

        // base constructor ---------------------------------------------------

        TextField.Validator.call(this);

        // methods ------------------------------------------------------------

        this.valueToText = function (value) {
            return _.isString(value) ? value.substr(0, maxLength) : '';
        };

        this.validate = function (text) {
            return text.length <= maxLength;
        };

    }}); // class TextField.TextValidator

    // class TextField.NumberValidator ========================================

    /**
     * A validator for text fields that restricts the allowed values to
     * floating-point numbers.
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
     *  @param {Number} [options.precision=1]
     *      The precision used to round the current number. The number will be
     *      rounded to multiples of this value. If omitted, the default
     *      precision 1 will round to integers. Must be positive.
     */
    TextField.NumberValidator = TextField.Validator.extend({ constructor: function (options) {

        var // minimum, maximum, and precision
            min = Utils.getNumberOption(options, 'min', -Number.MAX_VALUE, -Number.MAX_VALUE, Number.MAX_VALUE),
            max = Utils.getNumberOption(options, 'max', Number.MAX_VALUE, min, Number.MAX_VALUE),
            precision = Utils.getNumberOption(options, 'precision', 1, 0),
            regex = new RegExp('^' + ((min < 0) ? '-?' : '') + '[0-9]*' + ((precision !== Math.round(precision)) ? '([.,][0-9]*)?' : '') + '$');

        // base constructor ---------------------------------------------------

        TextField.Validator.call(this);

        // methods ------------------------------------------------------------

        this.valueToText = function (value) {
            // TODO L10N of decimal separator
            return _.isFinite(value) ? String(Utils.round(value, precision)) : '';
        };

        this.textToValue = function (text) {
            var value = parseFloat(text.replace(/,/g, '.'));
            return (_.isFinite(value) && (min <= value) && (value <= max)) ? Utils.round(value, precision) : null;
        };

        this.validate = function (text) {
            return regex.test(text);
        };

        this.getMin = function () {
            return min;
        };

        this.getMax = function () {
            return max;
        };

        this.getPrecision = function () {
            return precision;
        };

        this.restrictValue = function (value) {
            return _.isFinite(value) ? Utils.minMax(value, min, max) : value;
        };

    }}); // class TextField.NumberValidator

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: TextField });

});
