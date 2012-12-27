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

define('io.ox/office/tk/control/radiogroup',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/group'
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
     * @param {Object} [options]
     *  A map of options to control the properties of the radio group. Supports
     *  all options of the Group base class. Additionally, the following
     *  options are supported:
     *  @param [options.toggleValue]
     *      If set to a value different to null or undefined, the option button
     *      that is currently active can be clicked to be switched off. In that
     *      case, this radio group will activate the button associated to the
     *      value specified in this option, and the action handler will return
     *      this value instead of the value of the button that has been
     *      switched off.
     */
    function RadioGroup(options) {

        var // self reference
            self = this,

            // fall-back value for toggle click
            toggleValue = Utils.getOption(options, 'toggleValue');

        // private methods ----------------------------------------------------

        /**
         * Returns all option buttons as jQuery collection.
         */
        function getOptionButtons() {
            return self.getNode().children(Utils.BUTTON_SELECTOR);
        }

        /**
         * Activates an option button in this radio group.
         *
         * @param value
         *  The value associated to the button to be activated. If set to null,
         *  does not activate any button (ambiguous state).
         */
        function updateHandler(value) {
            Utils.selectOptionButton(getOptionButtons(), value);
        }

        /**
         * Click handler for an option button in this radio group. Will
         * activate the clicked button (or deactivate if clicked on an active
         * button in toggle mode), and return the value of the new active
         * option button.
         *
         * @param {jQuery} button
         *  The clicked button, as jQuery object.
         *
         * @returns
         *  The button value that has been passed to the addOptionButton()
         *  method.
         */
        function clickHandler(button) {
            var toggleClick = Utils.isButtonSelected(button) && !_.isNull(toggleValue) && !_.isUndefined(toggleValue),
                value = toggleClick ? toggleValue : Utils.getControlValue(button);
            updateHandler(value);
            return value;
        }

        // base constructor ---------------------------------------------------

        Group.call(this, options);

        // methods ------------------------------------------------------------

        /**
         * Removes all option buttons from this radio group.
         */
        this.clearOptionButtons = function () {
            getOptionButtons().remove();
        };

        /**
         * Adds a new option button to this radio group.
         *
         * @param value
         *  The unique value associated to the button. Must not be null or
         *  undefined.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new button.
         *  Supports all generic formatting options for buttons (See method
         *  Utils.createButton() for details), except 'options.value' which
         *  will be set to the 'value' parameter passed to this function.
         *  Additionally, the following options are supported:
         *  @param {String} [options.tooltip]
         *      Tool tip text shown when the mouse hovers the button.
         *
         * @returns {RadioGroup}
         *  A reference to this instance.
         */
        this.addOptionButton = function (value, options) {

            var // options for the new button, including the passed value
                buttonOptions = Utils.extendOptions(options, { value: value }),
                // the new button
                button = Utils.createButton(buttonOptions);

            // insert the button, add tool tip
            this.addFocusableControl(button);
            Utils.setControlTooltip(button, Utils.getStringOption(options, 'tooltip'), 'bottom');
            return this;
        };

        // initialization -----------------------------------------------------

        // register event handlers
        this.registerUpdateHandler(updateHandler)
            .registerActionHandler(this.getNode(), 'click', Utils.BUTTON_SELECTOR, clickHandler);

    } // class RadioGroup

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: RadioGroup });

});
