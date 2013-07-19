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
     */
    function SpinField(options) {

        // base constructors --------------------------------------------------

        TextField.call(this, Utils.extendOptions(options, { validator: new TextField.NumberValidator(options) }));

        // private methods ----------------------------------------------------

        /**
         * Handles keyboard events in the text field.
         */
        function textFieldKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown';
/*
            switch (event.keyCode) {
            case KeyCodes.UP_ARROW:
                if (keydown) {}
                return false;
            case KeyCodes.DOWN_ARROW:
                if (keydown) {}
                return false;
            case KeyCodes.PAGE_UP:
                if (keydown) {}
                return false;
            case KeyCodes.PAGE_DOWN:
                if (keydown) {}
                return false;
            }
*/
        }

        // initialization -----------------------------------------------------

        // add special marker class used to adjust formatting
        this.getNode().addClass('spin-field');
//            .append(
//                Utils.createButton().addClass('spin-button up'),
//                Utils.createButton().addClass('spin-button down')
//            );

        // register event handlers
        this.getTextFieldNode()
            .on('keydown keypress keyup', textFieldKeyHandler);

    } // class SpinField

    // exports ================================================================

    // derive this class from class TextField
    return TextField.extend({ constructor: SpinField });

});
