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

define('io.ox/office/tk/control/colorchooser',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/group',
     'io.ox/office/tk/dropdown/dropdown'
    ], function (Utils, Group, DropDown) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class ColorChooser =====================================================

    /**
     * Creates a control with a drop-down menu used to choose an RGB color from
     * a set of color items.
     *
     * @constructor
     *
     * @extends Group
     * @extends DropDown
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the drop-down button and
     *  menu. Supports all options of the Group base class, and of the
     *  DropDown mix-in class. Additionally, the following options are
     *  supported:
     *  @param {Number} [options.columns=10]
     *      The number of color buttons shown in a single row.
     *  @param {Function} [options.cssColorResolver]
     *      A function that converts the user-defined values associated to
     *      color buttons to a CSS color string used to format the color
     *      button. If omitted, the values associated to the color buttons MUST
     *      be valid CSS colors (strings). Receives the value associated to a
     *      color button. Will be called in the context of this group instance.
     */
    function ColorChooser(options) {

        var // the color table control in the drop-down menu
            colorGroup = new Group(options),

            // the color box in the drop-down button
            colorBox = $('<div>').addClass('color-box'),

            // number of color buttons per table row
            columns = Utils.getIntegerOption(options, 'columns', 10, 1),

            // converts color button values to CSS color strings
            cssColorResolver = Utils.getFunctionOption(options, 'cssColorResolver', _.identity);

        // private methods ----------------------------------------------------

        /**
         * Creates a color button element with the passed value and options.
         */
        function createColorButton(value, options) {

            var // create the button element
                button = Utils.createButton(Utils.extendOptions(options, { value: value })).addClass(Group.FOCUSABLE_CLASS);

            // add the colored box and the tool tip
            button.prepend($('<div>').addClass('color-button').css('background-color', cssColorResolver.call(this, value)));
            Utils.setControlTooltip(button, Utils.getStringOption(options, 'tooltip'), 'top');

            return button;
        }

        /**
         * Returns all color button elements.
         */
        function getColorButtons() {
            return colorGroup.getNode().find(Utils.BUTTON_SELECTOR);
        }

        /**
         * Activates a color button in the color table of this control.
         *
         * @param value
         *  The value associated to the color button to be activated. If set to
         *  null, does not activate any color button (ambiguous state).
         */
        function updateHandler(value) {

            // activate a color button
            Utils.selectOptionButton(getColorButtons(), value);

            // set color to the color box in the menu button
            colorBox.css('background-color', (_.isUndefined(value) || _.isNull(value)) ? 'transparent' : cssColorResolver.call(this, value));
        }

        /**
         * Click handler for a color button in this control. Will activate the
         * clicked color button, and return its associated value.
         *
         * @param {jQuery} button
         *  The clicked button, as jQuery object.
         *
         * @returns
         *  The button value that has been passed to the method
         *  ColorChooser.addColorButton().
         */
        function clickHandler(button) {
            var value = Utils.getControlValue(button);
            updateHandler(value);
            return value;
        }

        /**
         * Handles key events in the open drop-down menu element.
         */
        function menuKeyHandler(event) {
/*
            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown',
                // the focused button element
                button = $(event.target),
                // button is in a table row
                inTable = button.parent().is('td'),
                // table cell containing the focused button
                cell = inTable ? button.parent() : $(),
                // table row containing the focused button
                row = cell.parent(),
                // current table column index
                index = inTable ? cell.index() : 0;

            switch (event.keyCode) {
            case KeyCodes.LEFT_ARROW:
                if (keydown && (index > 0)) { row.find('> td > button').eq(index - 1).focus(); }
                return false;
            case KeyCodes.RIGHT_ARROW:
                if (keydown && (index + 1 < row.children().length)) { row.find('> td > button').eq(index + 1).focus(); }
                return false;
            case KeyCodes.UP_ARROW:
                if (index <= 0) { break; } // let key bubble up to hide the menu
                if (keydown) { buttons.eq(index - 1).focus(); }
                return false;
            case KeyCodes.DOWN_ARROW:
                if (keydown && (index >= 0) && (index + 1 < buttons.length)) { buttons.eq(index + 1).focus(); }
                return false;
            case KeyCodes.PAGE_UP:
                if (keydown) { buttons.eq(Math.max(0, index - this.getItemCountPerPage())).focus(); }
                return false;
            case KeyCodes.PAGE_DOWN:
                if (keydown) { buttons.eq(Math.min(buttons.length - 1, index + this.getItemCountPerPage())).focus(); }
                return false;
            case KeyCodes.HOME:
                if (keydown) { buttons.first().focus(); }
                return false;
            case KeyCodes.END:
                if (keydown) { buttons.last().focus(); }
                return false;
            }
*/
        }

        // base constructor ---------------------------------------------------

        Group.call(this, options);
        DropDown.call(this, Utils.extendOptions(options, { autoLayout: true }));

        // methods ------------------------------------------------------------

        /**
         * Removes all color buttons and section headers from the drop-down
         * menu.
         *
         * @returns {ColorChooser}
         *  A reference to this instance.
         */
        this.clearColorTable = function () {
            colorGroup.getNode().empty();
            return this;
        };

        /**
         * Adds a new section header to the drop-down menu.
         *
         * @returns {ColorChooser}
         *  A reference to this instance.
         */
        this.addSectionHeader = function (options) {
            return Utils.createLabel(options).appendTo(colorGroup.getNode());
        };

        /**
         * Adds a new color button to the current section. The color button
         * will take the full width of the color chooser control.
         *
         * @param value
         *  The unique value associated to the color button. Must not be null
         *  or undefined. If no CSS color resolver function has been passed to
         *  the constructor options, this value MUST be a valid CSS color
         *  string.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new color button.
         *  The following options are supported:
         *  @param {String} [options.tooltip]
         *      Tool tip text shown when the mouse hovers the color button.
         *
         * @returns {ColorChooser}
         *  A reference to this instance.
         */
        this.addWideColorButton = function (value, options) {

            var // create the button element
                button = createColorButton(value, options);

            // add the button in its own node to the color table
            colorGroup.getNode().append($('<div>').append(button));

            return this;
        };

        /**
         * Adds a new color button to the current section.
         *
         * @param value
         *  The unique value associated to the color button. Must not be null
         *  or undefined. If no CSS color resolver function has been passed to
         *  the constructor options, this value MUST be a valid CSS color
         *  string.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new color button.
         *  The following options are supported:
         *  @param {String} [options.tooltip]
         *      Tool tip text shown when the mouse hovers the color button.
         *
         * @returns {ColorChooser}
         *  A reference to this instance.
         */
        this.addColorButton = function (value, options) {

            var // the table elements containing the color buttons
                table = null, row = null,
                // create the button element
                button = createColorButton(value, { tooltip: Utils.getStringOption(options, 'tooltip') });

            // create a new table element for the button if required
            table = colorGroup.getNode().children().last();
            if (!table.is('table')) {
                table = $('<table>').appendTo(colorGroup.getNode());
            }

            // create a new table row element for the button if required
            row = table.find('tr').last();
            if ((row.length === 0) || (row.children().length === columns)) {
                row = $('<tr>').appendTo(table);
            }

            // add the button to the table row
            row.append($('<td>').append(button));

            return this;
        };

        // initialization -----------------------------------------------------

        // add the color picker control to the drop-down view component
        this.addPrivateMenuGroup(colorGroup);

        // register event handlers
        colorGroup.getNode()
            .addClass('color-chooser')
            .on('keydown keypress keyup', menuKeyHandler);

        // add the color preview box to the menu button
        this.getMenuButton().append(colorBox);

        // register event handlers
        this.registerUpdateHandler(updateHandler)
            .registerActionHandler(colorGroup.getNode(), 'click', Utils.BUTTON_SELECTOR, clickHandler);

    } // class ColorChooser

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: ColorChooser });

});
