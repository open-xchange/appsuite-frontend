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
     'io.ox/office/tk/dropdown/buttons',
     'io.ox/office/tk/dropdown/list'
    ], function (Utils, Group, Buttons, List) {

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
     *  A map of options to control the properties of the drop-down button and
     *  menu. Supports all options of the Group base class, of the Buttons
     *  mix-in class (if 'options.type' is set to 'dropdown'), and of the List
     *  mix-in class (if 'options.type' is set to 'list'). Additionally, the
     *  following options are supported:
     *  @param {String} [options.type='buttons']
     *      If set to 'buttons' or omitted, the buttons will be inserted
     *      directly into this group. If set to 'dropdown', a drop-down button
     *      will be created, showing a tabular button menu. If set to 'list', a
     *      drop-down button will be created, showing a list.
     */
    function RadioGroup(options) {

        var // self reference
            self = this,

            // display mode
            type = Utils.getStringOption(options, 'type', 'buttons');

        // private methods ----------------------------------------------------

        /**
         * Returns all option buttons as jQuery collection.
         */
        function getRadioButtons() {
            switch (type) {
            case 'dropdown':
                return self.getGridButtons();
            case 'list':
                return self.getListItems();
            }
            return self.getNode().children('button');
        }

        /**
         * Handles events after the group has been enabled or disabled. Enables
         * or disables the Bootstrap tool tips attached to the option buttons.
         */
        function enableHandler(event, enabled) {
            getRadioButtons().tooltip(enabled ? 'enable' : 'disable');
        }

        /**
         * Activates an option button in this radio group.
         *
         * @param {String|Null} value
         *  The unique value associated to the button to be activated. If set
         *  to null, does not activate any button (ambiguous state).
         */
        function updateHandler(value) {

            var // activate a radio button
                button = Utils.selectRadioButton(getRadioButtons(), value);

            // update the contents of the drop-down button (use group options if no button is active)
            if (self.hasMenu) {
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
         * @returns {String}
         *  The button value that has been passed to the addButton() method.
         */
        function clickHandler(button) {
            var value = Utils.getControlValue(button);
            updateHandler(value);
            return value;
        }

        // base constructor ---------------------------------------------------

        Group.call(this, options);
        switch (type) {
        case 'dropdown':
            Buttons.extend(this, options);
            break;
        case 'list':
            List.extend(this, options);
            break;
        default:
            type = 'buttons';
        }

        // methods ------------------------------------------------------------

        /**
         * Adds a new option button to this radio group.
         *
         * @param {String} value
         *  The unique value associated to the button.
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

            // insert the button depending on the display mode
            switch (type) {
            case 'dropdown':
                button = this.createGridButton(buttonOptions);
                break;
            case 'list':
                button = this.createListItem(buttonOptions);
                break;
            default:
                this.addFocusableControl(button = Utils.createButton(buttonOptions));
            }

            // add tool tip
            Utils.setControlTooltip(button, Utils.getStringOption(options, 'tooltip'), 'bottom');

            return this;
        };

        // initialization -----------------------------------------------------

        // register event handlers
        this.on('enable', enableHandler)
            .registerUpdateHandler(updateHandler)
            .registerActionHandler(this.hasMenu ? this.getMenuNode() : this.getNode(), 'click', 'button', clickHandler);

    } // class RadioGroup

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: RadioGroup });

});
