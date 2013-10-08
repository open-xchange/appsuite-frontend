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

define('io.ox/office/tk/dropdown/grid',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/keycodes',
     'io.ox/office/tk/control/group',
     'io.ox/office/tk/dropdown/items'
    ], function (Utils, KeyCodes, Group, Items) {

    'use strict';

    // class Grid =============================================================

    /**
     * Extends a Group object with a drop-down button and a drop-down menu
     * containing a grid of items. Extends the DropDown mix-in class with
     * functionality specific to the grid drop-down element.
     *
     * Note: This is a mix-in class supposed to extend an existing instance of
     * the class Group or one of its derived classes. Expects the symbol 'this'
     * to be bound to an instance of Group.
     *
     * @constructor
     *
     * @extends Items
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the grid. Supports all
     *  options of the Items base class. Additionally, the following options
     *  are supported:
     *  @param {Number} [options.itemColumns=10]
     *      The number of columns in the grid layout.
     */
    function Grid(options) {

        var // self reference (the Group instance)
            self = this,

            // number of items per row
            columns = Utils.getIntegerOption(options, 'itemColumns', 10, 1);

        // base constructor ---------------------------------------------------

        Items.call(this, Utils.extendOptions(options, { itemInserter: itemGridInserter }));

        // private methods ----------------------------------------------------

        /**
         * Inserts the passed item button into the grid.
         */
        function itemGridInserter(sectionNode, button, index) {

            var // the table element containing the grid items
                tableNode = null,
                // the last table row
                rowNode = null,
                // the existing item buttons
                buttons = null;

            // create a new table element for the button if required
            tableNode = sectionNode.children('table');
            if (tableNode.length === 0) {
                tableNode = $('<table>').attr('role', 'grid').appendTo(sectionNode);
            }

            // create a new table row element for the button if required
            rowNode = tableNode.find('> tbody > tr').last();
            if ((rowNode.length === 0) || (rowNode.children().length === columns)) {
                rowNode = $('<tr>').attr('role', 'row').appendTo(tableNode);
            }

            // insert the new button into the array, and reinsert all buttons into the table
            buttons = tableNode.find(Utils.BUTTON_SELECTOR).get();
            buttons.splice(index, 0, button);
            rowNode.append($('<td>').attr('role', 'gridcell'));
            tableNode.find('> tbody > tr > td').each(function (index) {
                $(this).append(buttons[index]);
            });
        }

        /**
         * Handles key events in the open drop-down grid menu element.
         */
        function menuKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown',
                // all list items (button elements)
                buttons = self.getItems(),
                // index of the focused list item
                index = buttons.index(event.target);

            switch (event.keyCode) {
            case KeyCodes.LEFT_ARROW:
                if (keydown && (index > 0)) {
                    buttons.eq(index - 1).focus();
                }
                return false;
            case KeyCodes.RIGHT_ARROW:
                if (keydown && (index >= 0) && (index + 1 < buttons.length)) {
                    buttons.eq(index + 1).focus();
                }
                return false;
            case KeyCodes.UP_ARROW:
                if (keydown && (index >= 0) && (buttons.length > 0)) {
                    buttons.eq(calcNewIndex(buttons, event.target, index, true)).focus();
                }
                return false;
            case KeyCodes.DOWN_ARROW:
                if (keydown && (index >= 0) && (buttons.length > 0)) {
                    buttons.eq(calcNewIndex(buttons, event.target, index, false)).focus();
                }
                return false;
            }
        }

        /**
         * Calculates the previous/next button index dependent on the direction
         * of movement.
         *
         * @param {Number} currIndex
         *  The index of the current button.
         *
         * @param {Boolean} up
         *  The movement direction. True means up otherwise down.
         *
         * @returns {Number}
         *  The index of the button which should get the focus. If no previous
         *  or next button could be found, currIndex is returned. The algorithm
         *  tries to find the nearest button in the previous/next row. Nearest
         *  means the minimal distance graphic wise.
         */
        function calcNewIndex(buttons, focusNode, currIndex, up) {
            var // index
                i,
                // current td element
                currTD = $(focusNode).closest('td'),
                // position of current td element
                pos = currTD.position(),
                // next position
                nextPos,
                // the current index/resulting index
                index = currIndex,
                // table of the current element
                table,
                // tables inside the grid
                tables,
                // table index of the current element
                tableIndex,
                // check previous/next table for next element
                findNextTable = false,
                // row index of the current element
                rowIndex,
                // rows inside the current table
                rows,
                // all td elements inside the row
                rowElements,
                // distance between two td elements
                distance = 1000000.0,
                // current distance between two td elements
                currDistance = distance;

            // find out current table, row & rowIndex
            table = currTD.closest('table');
            rows = table.find('tbody > tr');
            rowIndex = rows.index(currTD.closest('tr'));

            // try to find previous/next button in current table
            if (up) {
                if (rowIndex > 0) {
                    rowIndex--;
                } else {
                    findNextTable = true;
                }
            } else {
                if (rowIndex < rows.length - 1) {
                    rowIndex++;
                } else {
                    findNextTable = true;
                }
            }

            if (findNextTable) {
                // try find previous/next table in the grid
                tables = self.getMenuNode().find('table');
                tableIndex = tables.index(table);
                if (up && (tableIndex > 0)) {
                    table = tables.eq(tableIndex - 1);
                    rows = table.find('> tbody > tr');
                    rowIndex = rows.length - 1;
                } else if (!up && (tableIndex < tables.length - 1)) {
                    table = tables.eq(tableIndex + 1);
                    rows = table.find('> tbody > tr');
                    rowIndex = 0;
                } else {
                    // NO next/previous table
                    return index;
                }
            }

            // calculate the best button index in the previous/next row
            rowElements = rows.eq(rowIndex).find('td');
            for (i = 0; i < rowElements.length; i++) {
                nextPos = rowElements.eq(i).position();
                currDistance = Math.sqrt(Math.pow(nextPos.top - pos.top, 2) +
                                         Math.pow(nextPos.left - pos.left, 2));
                if (currDistance < distance) {
                    distance = currDistance;
                    index = i;
                }
            }

            // find out index of the new button element
            index = buttons.index(rowElements.eq(index).find(Utils.BUTTON_SELECTOR));

            return index;
        }

        // initialization -----------------------------------------------------

        // additional formatting for grid layout
        this.getMenuNode().addClass('layout-grid');

        // register event handlers
        this.getMenuNode().on('keydown keypress keyup', menuKeyHandler);

    } // class Grid

    // exports ================================================================

    // derive this class from class Items
    return Items.extend({ constructor: Grid });

});
