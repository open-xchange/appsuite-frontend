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

define('io.ox/office/tk/buttongridgroup',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/dropdowngroup'
    ], function (Utils, DropDownGroup) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // placeholder button for new cells (must contain something to get its correct height)
        placeholderButton = Utils.createButton(undefined, { label: '\xa0' });

    // class ButtonGridGroup ==================================================

    /**
     * Creates a container element with a drop-down button shown on top, and a
     * tabular drop-down menu.
     *
     * @constructor
     *
     * @param {String} key
     *  The unique key of the group. This key is shared by all controls
     *  inserted into the drop-down grid of this group.
     *
     * @param {Object} options
     *  A map of options to control the properties of the drop-down button.
     *  Supports all options of the base class (see DropDownGroup() for
     *  details). Additionally, the following options are supported:
     *  @param {Number} [options.columns=3]
     *      Number of columns used to build the drop-down grid.
     */
    function ButtonGridGroup(key, options) {

        var // self reference to be used in event handlers
            self = this,

            // the drop-down grid element
            gridNode = $('<table>'),

            // number of rows in the grid
            rows = 0,

            // number of columns in the grid
            columns = (options && _.isNumber(options.columns) && (options.columns >= 1)) ? options.columns : 3,

            // number of buttons inserted into the group
            buttonCount = 0;

        // private methods ----------------------------------------------------

        /**
         * Handles key events in the open grid element.
         */
        function gridKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown',
                // all buttons in the drop-down grid
                buttons = self.getGridButtons(),
                // index of the focused button
                index = buttons.index(event.target),
                // row index of the focused button
                row = (index >= 0) ? Math.floor(index / columns) : -1,
                // column index of the focused button
                column = (index >= 0) ? (index % columns) : -1;

            function focus(newIndex) {
                newIndex = Math.min(buttonCount - 1, newIndex);
                if ((newIndex >= 0) && (newIndex !== index)) {
                    buttons.eq(newIndex).focus();
                }
            }

            switch (event.keyCode) {
            case KeyCodes.LEFT_ARROW:
                if (keydown && (column > 0)) { focus(index - 1); }
                return false;
            case KeyCodes.UP_ARROW:
                if (row > 0) {
                    if (keydown) { focus(index - columns); }
                    return false;
                }
                break; // let event bubble up to silently close the menu
            case KeyCodes.RIGHT_ARROW:
                if (keydown && (column + 1 < columns)) { focus(index + 1); }
                return false;
            case KeyCodes.DOWN_ARROW:
                if (keydown && (row + 1 < rows)) { focus(index + columns); }
                return false;
            }
        }

        /**
         * Recalculates the width of the grid element. The width of the table
         * is restricted to the parent button group element, thus the table
         * shrinks its buttons way too much. The only way (?) to expand the
         * table to the correct width is to set its CSS 'min-width' property to
         * the calculated width of the tbody element. To do this, it is
         * required to expand the 'min-width' of the table to a large value to
         * give the tbody enough space, and then query its calculated width.
         */
        function recalcGridWidthHandler() {
            // handler may be called directly, check if grid is visible
            if (self.isMenuVisible()) {
                gridNode
                    .css('min-width', '10000px')
                    .css('min-width', gridNode.find('tbody').outerWidth() + 'px');
            }
        }

        // base constructor ---------------------------------------------------

        DropDownGroup.call(this, key, options, gridNode);

        // methods ------------------------------------------------------------

        /**
         * Returns all button elements in the drop-down grid element, as jQuery
         * collection.
         */
        this.getGridButtons = function () {
            return gridNode.find('button');
        };

        /**
         * Adds a new button to the drop-down grid.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new button. See
         *  method Utils.createButton() for details.
         *
         * @returns {jQuery}
         *  The new button, as jQuery collection.
         */
        this.addButton = function (options) {

            var // button for the button group
                button = Utils.createButton(key, options),
                // table row taking the new button
                tableRow = null,
                // column index for the new button
                column = buttonCount % columns;

            // get/create table row with empty cell from drop-down menu
            if (column === 0) {
                // create a new row in the table, and fill it with dummy buttons
                tableRow = $('<tr>').appendTo(gridNode);
                _(columns).times(function () {
                    tableRow.append($('<td>').append(placeholderButton.clone()));
                });
                rows += 1;
            } else {
                // select last table row
                tableRow = gridNode.find('tr:last-child');
            }

            // select table cell and replace the dummy button with a new real button
            tableRow.children().eq(column).empty().append(button);
            buttonCount += 1;

            return button;
        };

        // initialization -----------------------------------------------------

        // register event handlers
        this.on('menu:open', recalcGridWidthHandler)
            .on('menu:enter', function () {
            // move focus to first enabled control
            if (!Utils.containsFocusedControl(gridNode)) {
                self.getGridButtons().first().focus();
            }
        });
        gridNode.on('keydown keypress keyup', gridKeyHandler);

    } // class ButtonGridGroup

    // global initialization ==================================================

    // disable the placeholder button
    Utils.enableControls(placeholderButton, false);

    // exports ================================================================

    // derive this class from class DropDownGroup
    return DropDownGroup.extend({ constructor: ButtonGridGroup });

});
