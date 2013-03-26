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
     *  @param {Function} [options.equality=_.equals]
     *      A comparison function that returns whether an arbitrary value
     *      should be considered being equal to the value of the buttons in
     *      this group. If omitted, uses _.equal() which compares arrays and
     *      objects deeply.
     */
    function RadioGroup(options) {

        var // self reference
            self = this,

            // fall-back value for toggle click
            toggleValue = Utils.getOption(options, 'toggleValue'),

            // comparator for list item values
            equality = Utils.getFunctionOption(options, 'equality');

        // base constructor ---------------------------------------------------

        Group.call(this, options);

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
            Utils.selectOptionButton(getOptionButtons(), value, equality);
        }

        /**
         * Returns the value of the clicked option button, taking the option
         * 'toggleClick' into account,
         */
        function clickHandler(button) {
            var toggleClick = Utils.isButtonSelected(button) && !_.isNull(toggleValue) && !_.isUndefined(toggleValue);
            return toggleClick ? toggleValue : Utils.getControlValue(button);
        }

        // methods ------------------------------------------------------------

        /**
         * Removes all option buttons from this radio group.
         *
         * @returns {RadioGroup}
         *  A reference to this instance.
         */
        this.clearOptionButtons = function () {
            getOptionButtons().remove();
            return this;
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
         *  Supports all generic formatting options for buttons (see method
         *  Utils.createButton() for details), except 'options.value' which
         *  will be set to the 'value' parameter passed to this function.
         *  Additionally, the following options are supported:
         *  @param {String} [options.tooltip]
         *      Tool tip text shown when the mouse hovers the button.
         *
         * @returns {RadioGroup}
         *  A reference to this instance.
         */
        this.createOptionButton = function (value, options) {

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
            .registerChangeHandler('click', { selector: Utils.BUTTON_SELECTOR, valueResolver: clickHandler });

    } // class RadioGroup

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: RadioGroup });

});
