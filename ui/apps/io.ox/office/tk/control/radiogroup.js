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
     'io.ox/office/tk/dropdown/buttons'
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
     * @param {String} key
     *  The unique key of this group. Will be passed to change events, after
     *  an option button has been clicked.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the drop-down button and
     *  menu. Supports all options of the Buttons mix-in class (if options.type
     *  is set to 'dropdown') and all options of the List mix-in class (if
     *  options.type is set to 'list'). Additionally, the following options are
     *  supported:
     *  @param {String} [options.type='buttons']
     *      If set to 'buttons' or omitted, the buttons will be inserted
     *      directly into this group. If set to 'dropdown', a drop-down button
     *      will be created, showing a tabular button menu. If set to 'list', a
     *      drop-down button will be created, showing a list.
     */
    function RadioGroup(key, options) {

        var // self reference
            self = this,

            // display mode
            type = Utils.getBooleanOption(options, 'type', 'buttons');

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
         * Activates an option button in this radio group.
         *
         * @param {String|Null} value
         *  The unique value associated to the button to be activated. If set
         *  to null, does not activate any button (ambiguous state).
         */
        function updateHandler(value) {

            var // all option buttons in this radio group
                buttons = getRadioButtons(),
                // the activated radio button
                button = Utils.selectRadioButton(buttons, value);

            // update the contents of the drop-down button (use first button if no button is active)
            if (type !== 'buttons') {
                Utils.cloneControlCaption(self.getMenuButton(), (button.length ? button : buttons).first());
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
            var value = Utils.getButtonValue(button);
            updateHandler(value);
            return value;
        }

        // base constructor ---------------------------------------------------

        Group.call(this, key);
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
         *  A map of options to control the properties of the new button. See
         *  method Utils.createButton() for details.
         *
         * @returns {RadioGroup}
         *  A reference to this button group.
         */
        this.addButton = function (value, options) {

            var // options for the new button
                buttonOptions = Utils.extendOptions(options, { value: value });

            // insert the button depending on the display mode
            switch (type) {
            case 'dropdown':
                this.addGridButton(Utils.createButton(buttonOptions));
                break;
            case 'list':
                this.addListItem(value, options);
                break;
            default:
                this.addFocusableControl(Utils.createButton(buttonOptions));
            }

            // insert contents of first inserted button into the drop-down button
            if ((type !== 'buttons') && (getRadioButtons().length === 1)) {
                Utils.setControlCaption(this.getMenuButton(), options);
            }

            return this;
        };

        // initialization -----------------------------------------------------

        // register event handlers
        this.registerUpdateHandler(updateHandler)
            .registerActionHandler('click', 'button', clickHandler);

    } // class RadioGroup

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: RadioGroup });

});
