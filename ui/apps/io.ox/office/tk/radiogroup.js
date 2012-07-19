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

define('io.ox/office/tk/radiogroup',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/group'
    ], function (Utils, Group) {

    'use strict';

    // class RadioGroup =======================================================

    /**
     * Creates a container element used to hold a set of radio buttons.
     *
     * @constructor
     *
     * @extends Group
     *
     * @param {String} key
     *  The unique key of the radio group. This key is shared by all buttons
     *  inserted into this group.
     */
    function RadioGroup(key) {

        var // self reference
            self = this;

        // private methods ----------------------------------------------------

        /**
         * Activates an option button in this radio group.
         *
         * @param {String|Null} value
         *  The unique value associated to the button to be activated. If set
         *  to null, does not activate any button (ambiguous state).
         */
        function updateHandler(value) {
            Utils.selectRadioButton(self.getNode().children('button'), value);
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
            var value = Utils.getButtonValue(button);
            updateHandler(value);
            return value;
        }

        // base constructor ---------------------------------------------------

        Group.call(this);

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
         * @returns {RadioGroup}
         *  A reference to this button group.
         */
        this.addButton = function (value, options) {
            var button = Utils.createButton(key, Utils.extendOptions(options, { value: value }));
            return this.addFocusableControl(button);
        };

        // initialization -----------------------------------------------------

        // register event handlers
        this.registerUpdateHandler(key, updateHandler)
            .registerActionHandler('click', 'button', clickHandler);

    } // class RadioGroup

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: RadioGroup });

});
