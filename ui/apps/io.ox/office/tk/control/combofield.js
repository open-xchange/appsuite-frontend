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
     *  Additionally, the following options are supported:
     *  @param {Boolean} [options.typeAhead]
     *      If set to true, the label of the first list item that starts with
     *      the text currently edited will be inserted into the text field.
     *      The remaining text appended to the current text will be selected.
     */
    function ComboField(options) {

        var // self reference
            self = this,

            // search the list items and insert label into text field while editing
            typeAhead = Utils.getBooleanOption(options, 'typeAhead', false);

        // private methods ----------------------------------------------------

        /**
         * Update handler that activates a list item.
         */
        function updateHandler(value) {
            var button = Utils.selectRadioButton(self.getListItems(), value);
            if (!button.length || (Utils.getControlValue(button) !== value)) {
                Utils.selectRadioButton(self.getListItems(), null);
            }
        }

        /**
         * Click handler for a button representing a list item.
         */
        function clickHandler(button) {
            var value = Utils.getControlValue(button);
            updateHandler(value);
            return value;
        }

        /**
         * Handler that will be called after the text field has been validated
         * while editing. Will try to insert auto-completion text according to
         * existing entries in the drop-down list.
         */
        function editValidationHandler(event, textField, oldFieldState) {

            var // current text of the text field
                value = textField.val(),
                // current selection of the text field
                selection = Utils.getTextFieldSelection(textField),
                // the list item button containing the text of the text field
                button = $();

            // show the drop-down menu when the text has been changed
            if (value !== oldFieldState.value) {
                self.showMenu();
            }

            // find the first button whose label starts with the entered text
            button = self.getListItems().filter(function () {
                var label = Utils.getControlLabel($(this));
                return _.isString(label) && (label.length >= value.length) && (label.substr(0, value.length).toLowerCase() === value.toLowerCase());
            }).first();

            // try to add the remaining text of an existing list item, but only
            // if the text field does not contain a selection, and something
            // has been appended to the old text
            if (button.length && (selection.start === value.length) && (oldFieldState.start < selection.start) &&
                    (oldFieldState.value.substr(0, oldFieldState.start) === value.substr(0, oldFieldState.start))) {
                textField.val(Utils.getControlLabel(button));
                Utils.setTextFieldSelection(textField, { start: value.length, end: textField.val().length });
            }

            // update selection in drop-down list
            updateHandler((button.length && (textField.val() === Utils.getControlLabel(button))) ? Utils.getControlValue(button) : null);
        }

        // base constructor ---------------------------------------------------

        TextField.call(this, options);
        // no caption for the drop-down button
        List.extend(this, Utils.extendOptions(options, { icon: undefined, label: undefined }));

        // methods ------------------------------------------------------------

        /**
         * Adds a new string entry to the drop-down list.
         *
         * @param value
         *  The value to be shown in the drop-down list. Will be converted to
         *  a string using the current validator of the text field.
         *
         * @param {Object} [options]
         *  Additional options for the list entry. Supports all button
         *  formatting options (see method Utils.createButton() for details),
         *  except 'options.value' and 'options.label' which will both be set
         *  to the 'value' parameter passed to this function.
         */
        this.addListEntry = function (value, options) {
            this.createListItem(Utils.extendOptions(options, { value: value, label: this.valueToText(value) }));
            return this;
        };

        // initialization -----------------------------------------------------

        // register event handlers
        this.registerUpdateHandler(updateHandler)
            .registerActionHandler(this.getMenuNode(), 'click', 'button', clickHandler);

        if (typeAhead) {
            this.on('validated', editValidationHandler);
        }

    } // class ComboField

    // exports ================================================================

    // derive this class from class TextField
    return TextField.extend({ constructor: ComboField });

});
