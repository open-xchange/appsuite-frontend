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
     *      decrease the current value of the spin field when using the cursor
     *      keys.
     *  @param {Number} [largeStep=10]
     *      The distance of large steps that will be used to increase or
     *      decrease the current value of the spin field when using the PAGEUP
     *      or PAGEPOWN key.
     *  @param {Boolean} [roundStep=false]
     *      If set to true, and the current value of the spin field is
     *      increased or decreased using the keyboard, the value will be
     *      rounded to entire multiples of the step distance. Otherwise, the
     *      fractional part will remain in the value.
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

        TextField.call(this, Utils.extendOptions(options, { validator: validator }));

        // private methods ----------------------------------------------------

        /**
         * Handles keyboard events in the text field.
         */
        function textFieldKeyHandler(event) {

            function applyStep(step) {
                var oldValue = null, newValue = null;
                if ((event.type === 'keydown') && KeyCodes.matchModifierKeys(event)) {
                    oldValue = self.getFieldValue();
                    newValue = (step < 0) ? Utils.roundDown(oldValue, -step) : Utils.roundUp(oldValue, step);
                    newValue = (!roundStep || (oldValue === newValue)) ? (oldValue + step) : newValue;
                    self.setValue(validator.restrictValue(newValue));
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

        // add special marker class used to adjust formatting
        this.getNode().addClass('spin-field').append(
            $('<div>').append(
                Utils.createButton({ icon: 'docs-caret up' }).addClass('spin-button up'),
                Utils.createButton({ icon: 'docs-caret down' }).addClass('spin-button down')
            )
        );

        // register event handlers
        this.getTextFieldNode()
            .on('keydown keypress keyup', textFieldKeyHandler);

    } // class SpinField

    // exports ================================================================

    // derive this class from class TextField
    return TextField.extend({ constructor: SpinField });

});
