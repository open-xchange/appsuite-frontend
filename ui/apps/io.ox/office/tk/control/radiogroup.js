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
     'io.ox/office/tk/control/group',
     'io.ox/office/tk/dropdown/list'
    ], function (Utils, Group, List) {

    'use strict';

    // class RadioGroup =======================================================

    /**
     * Creates a container element used to hold a set of radio buttons.
     *
     * @constructor
     *
     * @extends Group
     * @extends List
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the drop-down button and
     *  menu. Supports all options of the Group base class, and of the List
     *  mix-in class. Additionally, the following options are supported:
     *  @param {String} [options.dropDown=false]
     *      If set to true, a drop-down button will be created, showing a list
     *      with all option buttons when opened. Otherwise, the option buttons
     *      will be inserted directly into this group.
     */
    function RadioGroup(options) {

        var // self reference
            self = this;

        // private methods ----------------------------------------------------

        /**
         * Returns all option buttons as jQuery collection.
         */
        function getOptionButtons() {
            return self.hasDropDown ? self.getListItems() : self.getNode().children('button');
        }

        /**
         * Handles events after the group has been enabled or disabled. Enables
         * or disables the Bootstrap tool tips attached to the option buttons.
         */
        function enableHandler(event, enabled) {
            getOptionButtons().tooltip(enabled ? 'enable' : 'disable');
        }

        /**
         * Activates an option button in this radio group.
         *
         * @param value
         *  The value associated to the button to be activated. If set to null,
         *  does not activate any button (ambiguous state).
         */
        function updateHandler(value) {

            var // activate a radio button
                button = Utils.selectOptionButton(getOptionButtons(), value);

            // update the contents of the drop-down button (use group options if no button is active)
            if (self.hasDropDown) {
                if (button.length) {
                    Utils.cloneControlCaption(self.getMenuButton(), button.first());
                } else {
                    Utils.setControlCaption(self.getMenuButton(), options);
                }
            }
        }

        /**
         * Click handler for an option button in this radio group. Will
         * activate the clicked button, and return its value.
         *
         * @param {jQuery} button
         *  The clicked button, as jQuery object.
         *
         * @returns
         *  The button value that has been passed to the addButton() method.
         */
        function clickHandler(button) {
            var value = Utils.getControlValue(button);
            updateHandler(value);
            return value;
        }

        // base constructor ---------------------------------------------------

        Group.call(this, options);
        // add drop-down list if specified
        if (Utils.getBooleanOption(options, 'dropDown')) {
            List.call(this, options);
        }

        // methods ------------------------------------------------------------

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
         *  A reference to this button group.
         */
        this.addButton = function (value, options) {

            var // options for the new button, including the passed value
                buttonOptions = Utils.extendOptions(options, { value: value }),
                // the new button
                button = null;

            // insert the button depending on the drop-down mode
            if (this.hasDropDown) {
                button = this.createListItem(buttonOptions);
            } else {
                button = Utils.createButton(buttonOptions);
                this.addFocusableControl(button);
            }

            // add tool tip
            Utils.setControlTooltip(button, Utils.getStringOption(options, 'tooltip'), 'bottom');

            return this;
        };

        // initialization -----------------------------------------------------

        // register event handlers
        this.on('enable', enableHandler)
            .registerUpdateHandler(updateHandler)
            .registerActionHandler(this.hasDropDown ? this.getMenuNode() : this.getNode(), 'click', 'button', clickHandler);

    } // class RadioGroup

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: RadioGroup });

});
