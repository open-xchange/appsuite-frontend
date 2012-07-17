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

define('io.ox/office/tk/radiochooser',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/buttonchooser'
    ], function (Utils, ButtonChooser) {

    'use strict';

    // class RadioChooser =====================================================

    /**
     * Creates a drop-down control used to hold a set of radio buttons.
     *
     * @constructor
     *
     * @extends ButtonChooser
     *
     * @param {String} key
     *  The unique key of the radio chooser. This key is shared by all buttons
     *  inserted into the drop-down menu.
     *
     * @param {Object} options
     *  A map of options to control the properties of the radio chooser.
     *  Supports all options of the ButtonChooser() base class constructor,
     *  except the options.split value, which will be set to false.
     */
    function RadioChooser(key, options) {

        var // self reference
            self = this;

        // private methods ----------------------------------------------------

        /**
         * Activates an option button in this radio group.
         *
         * @param {String|Null} [value]
         *  The unique value associated to the button to be activated. If
         *  omitted or set to null, does not activate any button (ambiguous
         *  state).
         */
        function updateHandler(value) {

            var // find all option buttons
                buttons = self.getGridButtons(),
                // find the button to activate
                button = _.isNull(value) ? $() : buttons.filter('[data-value="' + value + '"]');

            if (!_.isUndefined(value)) {
                // remove highlighting from all buttons, highlight active button
                Utils.toggleButtons(buttons, false);
                // update the contents of the drop-down button (use first button if no button is active)
                self.replaceButtonContents((button.length ? button : buttons).first().contents().clone());
                // highlight active button
                Utils.toggleButtons(button, true);
            }
        }

        /**
         * Click handler for an option button in this radio group. Will
         * activate the clicked button, and return its value.
         *
         * @param {jQuery} button
         *  The clicked button, as jQuery object.
         *
         * @returns {String}
         *  The button value that has been passed to the addButton() method.
         */
        function clickHandler(button) {
            var value = button.attr('data-value');
            updateHandler(value);
            return value;
        }

        // base constructor ---------------------------------------------------

        ButtonChooser.call(this, key, Utils.extendOptions(options, { split: false }));

        // methods ------------------------------------------------------------

        /**
         * Adds a new option button to this radio group.
         *
         * @param {String} value
         *  The unique value associated to the button.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new button. See
         *  method Utils.createButton() for details.
         *
         * @returns {RadioChooser}
         *  A reference to this button group.
         */
        this.addButton = function (value, options) {
            this.createGridButton(options).attr('data-value', value);
            updateHandler();
            return this;
        };

        // initialization -----------------------------------------------------

        // register event handlers
        this.registerUpdateHandler(key, updateHandler)
            .registerActionHandler('click', 'button', clickHandler);

    } // class RadioChooser

    // exports ================================================================

    // derive this class from class ButtonChooser
    return ButtonChooser.extend({ constructor: RadioChooser });

});
