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

define('io.ox/office/tk/dropdown/colortable',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/dropdown/scrollable'
    ], function (Utils, Scrollable) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class ColorTable =======================================================

    /**
     * Extends a Group object with a drop-down menu containing a color table.
     * Extends the Scrollable mix-in class with functionality specific to the
     * color table drop-down element.
     *
     * Note: This is a mix-in class supposed to extend an existing instance of
     * the class Group or one of its derived classes. Expects the symbol 'this'
     * to be bound to an instance of Group.
     *
     * @constructor
     *
     * @extends Scrollable
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the color table menu.
     *  Supports all options of the Scrollable base class. Additionally, the
     *  following options are supported:
     *  @param {Number} [options.columns=10]
     *      The number of color items shown in a single row.
     *  @param {Function} [options.cssColorResolver]
     *      A function that converts the user-defined values associated to
     *      color items to a CSS color string used to format the color item. If
     *      omitted, the values associated to the color items MUST be valid CSS
     *      colors (strings). Receives the value associated to a color item.
     *      Will be called in the context of this instance.
     */
    function ColorTable(options) {

        var // self reference (the Group instance)
            self = this,

            // the root container element
            rootNode = $('<div>'),

            // number of color items per table row
            columns = Utils.getIntegerOption(options, 'columns', 10, 1),

            // converts color item values to CSS color strings
            cssColorResolver = Utils.getFunctionOption(options, 'cssColorResolver', _.identity);

        // private methods ----------------------------------------------------

        /**
         * Handles key events in the open drop-down menu element.
         */
        function menuKeyHandler(event) {
/*
            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown',
                // all list items (button elements)
                buttons = self.getColorItems(),
                // index of the focused list item
                index = buttons.index(event.target);

            switch (event.keyCode) {
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

        Scrollable.call(this, rootNode, options);

        // methods ------------------------------------------------------------

        /**
         * Returns all button elements representing the color items.
         */
        this.getColorItems = function () {
            return rootNode.find('button');
        };

        /**
         * Sets the focus to the first color item in the drop-down menu.
         */
        this.grabMenuFocus = function () {
            if (!Utils.containsFocusedControl(rootNode)) {
                this.getColorItems().first().focus();
            }
            return this;
        };

        /**
         * Removes all color items and section headers from the drop-down menu.
         */
        this.clearColorTable = function () {
            rootNode.empty();
            return this;
        };

        /**
         * Adds a new section header to the drop-down menu.
         *
         * @returns {jQuery}
         *  The label element representing the section header, as jQuery
         *  object.
         */
        this.createSectionHeader = function (options) {
            return Utils.createLabel(options).appendTo(rootNode);
        };

        /**
         * Adds a new color item to the current section.
         *
         * @param value
         *  The unique value associated to the color item. Must not be null or
         *  undefined. If no CSS color resolver function has been passed to the
         *  constructor options, this value MUST be a valid CSS color string.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new color item.
         *  The following options are supported:
         *  @param {String} [options.tooltip]
         *      Tool tip text shown when the mouse hovers the color item.
         *
         * @returns {jQuery}
         *  The button element representing the new color item, as jQuery
         *  object.
         */
        this.createColorItem = function (value, options) {

            var // the table and table row elements containing the color items
                table = null, row = null,
                // create the button element representing the color item
                button = Utils.createButton({ value: value });

            // create a new table element for the item if required
            table = rootNode.children().last();
            if (!table.is('table')) {
                table = $('<table>').appendTo(rootNode);
            }

            // create a new table row element for the item if required
            row = table.find('tr').last();
            if ((row.length === 0) || (row.children().length === columns)) {
                row = $('<tr>').appendTo(table);
            }

            // initialize the button and add it to the table row
            button.append($('<div>').css('background-color', cssColorResolver.call(this, value)));
            Utils.setControlTooltip(button, Utils.getStringOption(options, 'tooltip'), 'top');
            row.append($('<td>').append(button));

            return button;
        };

        // initialization -----------------------------------------------------

        // initialize the drop-down element
        this.getMenuNode().addClass('color-table');

        // register event handlers
        rootNode.on('keydown keypress keyup', menuKeyHandler);

    } // class ColorTable

    // exports ================================================================

    // derive this class from class Scrollable
    return Scrollable.extend({ constructor: ColorTable });

});
