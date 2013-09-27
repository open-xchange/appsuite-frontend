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

define('io.ox/office/tk/control/spinfield',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/keycodes',
     'io.ox/office/tk/control/textfield'
    ], function (Utils, KeyCodes, TextField) {

    'use strict';

    // class SpinField ========================================================

    /**
     * Creates a numeric field control with additional controls used to spin
     * (decrease and increase) the value.
     *
     * @constructor
     *
     * @extends TextField
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the control. Supports all
     *  options of the TextField base class. If the option 'options.validator'
     *  exists, it MUST be an instance of TextField.NumberValidator (or a sub
     *  class). Alternatively, the options supported by the constructor of the
     *  class TextField.NumberValidator can be passed. In this case, a new
     *  instance of TextField.NumberValidator will be created automatically
     *  based on these options. Additionally, the following options are
     *  supported:
     *  @param {Number} [smallStep=1]
     *      The distance of small steps that will be used to increase or
     *      decrease the current value of the spin field when using the spin
     *      buttons or the cursor keys.
     *  @param {Number} [largeStep=10]
     *      The distance of large steps that will be used to increase or
     *      decrease the current value of the spin field when using the PAGEUP
     *      or PAGEPOWN key.
     *  @param {Boolean} [roundStep=false]
     *      If set to true, and the current value of the spin field will be
     *      changed, the value will be rounded to entire multiples of the step
     *      distance. Otherwise, the fractional part will remain in the value.
     */
    function SpinField(options) {

        var // self reference
            self = this,

            // the number validator of this spin field
            validator = Utils.getObjectOption(options, 'validator') || new TextField.NumberValidator(options),

            // the distance for small steps
            smallStep = Utils.getNumberOption(options, 'smallStep', 1, 0),

            // the distance for large steps
            largeStep = Utils.getNumberOption(options, 'largeStep', 10, 0),

            // whether to round while applying steps
            roundStep = Utils.getBooleanOption(options, 'roundStep', false);

        // base constructors --------------------------------------------------

        TextField.call(this, Utils.extendOptions({ keyboard: 'number' }, options, { validator: validator }));

        // private methods ----------------------------------------------------

        /**
         * Changes the current value of the spin field, according to the passed
         * step and the rounding mode passed to the constructor.
         */
        function changeValue(step) {

            var // the current value of the spin field
                oldValue = self.getFieldValue(),
                // the current value, rounded to the previous/next border
                roundedValue = (step < 0) ? Utils.roundDown(oldValue, -step) : Utils.roundUp(oldValue, step),
                // the new value, depending on rounding mode
                newValue = (!roundStep || (oldValue === roundedValue)) ? (oldValue + step) : roundedValue;

            // set new value, after restricting to minimum/maximum
            newValue = validator.restrictValue(newValue);
            self.setValue(newValue);
        }

        /**
         * Creates and returns a spin button. Initializes tracking used to
         * change the current value.
         */
        function createSpinButton(increase) {

            var // the CSS class for the button node and the icon
                classes = increase ? 'up' : 'down',
                // create the spin button element
                spinButton = Utils.createButton({ icon: 'docs-caret ' + classes }).addClass('spin-button ' + classes);

            // enables or disables node tracking according to own enabled state
            function initializeTracking() {
                if (self.isEnabled()) {
                    spinButton.enableTracking({ autoRepeat: true });
                } else {
                    spinButton.disableTracking();
                }
            }

            // enable/disable node tracking according to own enabled state
            self.on('group:enable', initializeTracking);
            initializeTracking();

            // register tracking event listeners to change the current value
            spinButton.on({
                'tracking:start tracking:repeat': function () { changeValue(increase ? smallStep : -smallStep); },
                'tracking:end tracking:cancel': function () { self.getTextFieldNode().focus(); }
            });

            // enable/disable the button according to the current value
            self.registerUpdateHandler(function (value) {
                var enabled = increase ? (value < validator.getMax()) : (value > validator.getMin());
                spinButton.toggleClass(Utils.DISABLED_CLASS, !enabled);
            });

            return spinButton;
        }

        /**
         * Handles keyboard events in the text field.
         */
        function textFieldKeyHandler(event) {

            function applyStep(step) {
                if ((event.type === 'keydown') && KeyCodes.matchModifierKeys(event)) {
                    changeValue(step);
                    return false;
                }
            }

            switch (event.keyCode) {
            case KeyCodes.UP_ARROW:
                return applyStep(smallStep);
            case KeyCodes.DOWN_ARROW:
                return applyStep(-smallStep);
            case KeyCodes.PAGE_UP:
                return applyStep(largeStep);
            case KeyCodes.PAGE_DOWN:
                return applyStep(-largeStep);
            }
        }

        // initialization -----------------------------------------------------

        // add special marker class used to adjust formatting, add spin buttons
        this.getNode().addClass('spin-field').append(
            $('<div>').append(createSpinButton(true), createSpinButton(false))
        );

        // register event handlers
        this.getTextFieldNode().on('keydown keypress keyup', textFieldKeyHandler);

    } // class SpinField

    // exports ================================================================

    // derive this class from class TextField
    return TextField.extend({ constructor: SpinField });

});
