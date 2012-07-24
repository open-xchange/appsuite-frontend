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

define('io.ox/office/tk/control/combofield',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/textfield',
     'io.ox/office/tk/dropdown/list'
    ], function (Utils, TextField, List) {

    'use strict';

    // class ComboField =======================================================

    /**
     * Creates a text field control with attached drop-down list showing
     * predefined values for the text field.
     *
     * @constructor
     *
     * @extends TextField
     *
     * @param {Object} options
     *  A map of options to control the properties of the control. Supports all
     *  options of the TextField base class, and the List mix-in class.
     */
    function ComboField(options) {

        var // self reference
            self = this;

        // private methods ----------------------------------------------------

        /**
         * Activates a font in this font chooser control.
         *
         * @param {String|Null} value
         *  The name of the font to be activated. If set to null, does not
         *  activate any font (ambiguous state).
         */
        function updateHandler(value) {
            var button = Utils.selectRadioButton(self.getListItems(), value);
            if (!button.length || (Utils.getControlValue(button) !== value)) {
                Utils.selectRadioButton(self.getListItems(), null);
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

        TextField.call(this, options);
        // no caption for the drop-down button
        List.extend(this, Utils.extendOptions(options, { icon: undefined, label: undefined }));

        // methods ------------------------------------------------------------

        /**
         * Adds a new string entry to the drop-down list.
         *
         * @param {String} value
         *  The string value to be shown in the drop-down list.
         *
         * @param {Object} [options]
         *  Additional options for the list entry. Supports all button
         *  formatting options (see method Utils.createButton() for details),
         *  except 'options.value' and 'options.label' which will both be set
         *  to the 'value' parameter passed to this function.
         */
        this.addListEntry = function (value, options) {
            this.createListItem(Utils.extendOptions(options, { value: value, label: value }));
            return this;
        };

        // initialization -----------------------------------------------------

        // register event handlers
        this.registerUpdateHandler(updateHandler)
            .registerActionHandler(this.getMenuNode(), 'click', 'button', clickHandler);

    } // class ComboField

    // exports ================================================================

    // derive this class from class TextField
    return TextField.extend({ constructor: ComboField });

});
