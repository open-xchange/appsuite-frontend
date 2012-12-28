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

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class ComboField =======================================================

    /**
     * Creates a text field control with attached drop-down list showing
     * predefined values for the text field.
     *
     * @constructor
     *
     * @extends TextField
     * @extends List
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
         * Scrolls the drop-down menu to make the specified list item visible.
         */
        function scrollToListItem(button) {
            if (button.length && self.isMenuVisible()) {
                Utils.scrollToChildNode(self.getMenuNode(), button);
            }
        }

        /**
         * Handles 'menuopen' events and moves the focus to the text field.
         */
        function menuOpenHandler() {
            if (!self.isReadOnly()) {
                self.getTextFieldNode().focus();
            }
            scrollToListItem(Utils.getSelectedButtons(self.getListItems()));
        }

        /**
         * Update handler that activates a list item.
         */
        function updateHandler(value) {

            var // activate a button representing a list item
                button = Utils.selectOptionButton(self.getListItems(), value);

            // scroll to make the element visible
            scrollToListItem(button);
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
         * Handles keyboard events in the text field. Moves the active list
         * entry according to cursor keys.
         */
        function textFieldKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown';

            function moveListItem(delta, page) {

                var // all list items (button elements)
                    buttons = self.getListItems(),
                    // index of the active list item
                    index = buttons.index(Utils.getSelectedButtons(buttons));

                // first show the menu to be able to calculate the items-per-page value
                self.showMenu();
                // calculate new index, if old index is valid
                if (index >= 0) {
                    index += delta * (page ? self.getItemCountPerPage() : 1);
                }
                index = Utils.minMax(index, 0, buttons.length - 1);
                // call the update handler to update the text field and list selection
                self.update(Utils.getControlValue(buttons.eq(index)));
                Utils.setTextFieldSelection(self.getTextFieldNode(), true);
            }

            switch (event.keyCode) {
            case KeyCodes.UP_ARROW:
                if (keydown) { moveListItem(-1, false); }
                return false;
            case KeyCodes.DOWN_ARROW:
                if (keydown) { moveListItem(1, false); }
                return false;
            case KeyCodes.PAGE_UP:
                if (keydown) { moveListItem(-1, true); }
                return false;
            case KeyCodes.PAGE_DOWN:
                if (keydown) { moveListItem(1, true); }
                return false;
            }
        }

        /**
         * Handler that will be called after the read-only state of the text
         * field has been changed. Will enable to toggle the drop-down menu
         * with a mouse click in read-only mode.
         */
        function textFieldReadOnlyHandler() {
            if (self.isReadOnly()) {
                self.getTextFieldNode()
                    .off('mousedown') // prevent 'cancel' event generated by TextField
                    .on('mousedown', function (event) { event.preventDefault(); })
                    .css('cursor', 'pointer');
                self.addMenuToggleControls(self.getTextFieldNode());
            } else {
                self.getTextFieldNode().css('cursor', '');
                self.removeMenuToggleControls(self.getTextFieldNode());
            }
        }

        /**
         * Handler that will be called after the text field has been validated
         * while editing. Will try to insert auto-completion text according to
         * existing entries in the drop-down list.
         */
        function textFieldValidationHandler(event, oldFieldState) {

            var // the text field element
                textField = self.getTextFieldNode(),
                // current text of the text field
                value = textField.val(),
                // current selection of the text field
                selection = Utils.getTextFieldSelection(textField),
                // the list item button containing the text of the text field
                button = $();

            // show the drop-down menu when the text has been changed
            if (typeAhead && (value !== oldFieldState.value)) {
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
            if (typeAhead && button.length && (selection.start === value.length) && (oldFieldState.start < selection.start) &&
                    (oldFieldState.value.substr(0, oldFieldState.start) === value.substr(0, oldFieldState.start))) {
                textField.val(Utils.getControlLabel(button));
                Utils.setTextFieldSelection(textField, { start: value.length, end: textField.val().length });
            }

            // update selection in drop-down list
            updateHandler((button.length && (textField.val() === Utils.getControlLabel(button))) ? Utils.getControlValue(button) : null);
        }

        // base constructors --------------------------------------------------

        TextField.call(this, options);
        // no caption for the drop-down button
        List.call(this, Utils.extendOptions(options, { plainCaret: true }));

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
            // the inserted list item may match the value in the text field
            updateHandler(this.getFieldValue());
            return this;
        };

        // initialization -----------------------------------------------------

        // prepare group and register event handlers
        this.on('menuopen', menuOpenHandler)
            .registerUpdateHandler(updateHandler)
            .registerActionHandler(this.getMenuNode(), 'click', Utils.BUTTON_SELECTOR, clickHandler);
        this.getTextFieldNode()
            .css('padding-right', 0)
            .on('keydown keypress keyup', textFieldKeyHandler)
            .on('readonly', textFieldReadOnlyHandler)
            .on('validated', textFieldValidationHandler);

        // initialize read-only mode
        textFieldReadOnlyHandler();

    } // class ComboField

    // exports ================================================================

    // derive this class from class TextField
    return TextField.extend({ constructor: ComboField });

});
