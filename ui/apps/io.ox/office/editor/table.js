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
 * @author Ingo Schmidt-Rosbiegal <ingo.schmidt-rosbiegal@open-xchange.com>
 */

define('io.ox/office/editor/table',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/position',
     'io.ox/office/editor/oxopam'], function (Utils, DOM, Position, OXOPaM) {

    'use strict';

    // static class Table =====================================================

    /**
     * Provides static helper methods for manipulation and calculation
     * of table nodes and its children.
     */
    var Table = {};

    // static functions =======================================================

    /**
     * Creating the grid of widths for all grid positions in a table.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} tablePos
     *  The logical position of the table element
     *
     * @returns {Number[]}
     *  Array of grid widths of the table in 1/100 mm
     */
    Table.getTableGrid = function (startnode, tablePos) {

        var tablegrid = [],
            tablePosition = Position.getDOMPosition(startnode, tablePos);

        if (tablePosition) {

            var tableNode = tablePosition.node,
                validTableGrid = false;

            if ($(tableNode).data('grid')) {

                tablegrid = $(tableNode).data('grid');

                if (tablegrid.length > 0) {
                    validTableGrid = true;
                }

                for (var i = 0; i < tablegrid.length; i++) {
                    if ((! _.isNumber(tablegrid[i])) || (tablegrid[i] + '' === 'NaN'))  {  // NaN returns true in _.isNumber check
                        validTableGrid = false;
                        break;
                    }
                }
            }

            if (! validTableGrid) {

                tablegrid = [];

                var allCols = $(tableNode).children('colgroup').children('col');

                allCols.each(function (index) {
                    var width = Utils.convertLengthToHmm($(this).width(), 'px');
                    tablegrid.push(width);
                });
            }
        }

        return tablegrid;
    };

    /**
     * Calculation the width of a table as the some of the width of all
     * grid positions.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} tablePos
     *  The logical position of the table element
     *
     * @returns {Number}
     *  The width of the table in 1/100 mm
     */
    Table.getTableWidth = function (startnode, tablePos) {

        var width = 0,
            tablePosition = Position.getDOMPosition(startnode, tablePos),
            tableDataRead = false;

        if (tablePosition) {

            var tableNode = tablePosition.node;

            if ($(tableNode).data('width')) {

                width = $(tableNode).data('width');
                tableDataRead = true;

            }
        }

        if (! tableDataRead) {

            var tablegrid = Table.getTableGrid(startnode, tablePos);

            if (tablegrid) {
                for (var i = 0; i < tablegrid.length; i++) {
                    width += tablegrid[i];
                }
            }
        }

        return width;
    };

    /**
     * Recalculating the grid widths of a table, if a new column is inserted.
     * Assuming that the width of the complete table does not change.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} tablePos
     *  The logical position of the table element
     *
     * @param {Number} gridPosition
     *  The grid number that is the basis for the new grid
     *
     * @param {Boolean} insertmode
     *  The insertmode can be 'before' or 'behind'. This is relevant for
     *  the position of the added column.
     *
     * @returns {Number[]}
     *  Array of grid widths of the table in 1/100 mm
     */
    Table.getTableGridWithNewColumn = function (startnode, tablePos, gridPosition, insertmode) {

        var tableGrid = Table.getTableGrid(startnode, tablePos),
            tableWidth = 0;

        if (! tableGrid) {
            Utils.error('Table.getTableGridWithNewColumn(): Unable to get existing table grid');
            return;
        }

        for (var i = 0; i < tableGrid.length; i++) {
            tableWidth += tableGrid[i];
        }

        var additionalWidth = tableGrid[gridPosition],
            completeWidth = tableWidth + additionalWidth,
            factor = Utils.roundDigits(tableWidth / completeWidth, 2);

        var insertPos = gridPosition;
        if (insertmode === 'behind') {
            insertPos++;
        }
        tableGrid.splice(insertPos, 0, additionalWidth);  // ignoring insertmode !?

        for (var i = 0; i < tableGrid.length; i++) {
            tableGrid[i] = Utils.roundDigits(factor * tableGrid[i], 2);
        }

        return tableGrid;

    };

    /**
     * Calculating the grid position of a selected cell. The attribute
     * 'colspan' of all previous cells in the row have to be added.
     * The return value is 0-based. The first cell in a row always has
     * grid position 0.
     *
     * @param {Number[]} rowNode
     *  The dom position of the row element
     *
     * @param {Number} cellPosition
     *  The cell number inside the row
     *
     * @returns {Number} gridPosition
     *  A number representing the grid position of the selected cell
     */
    Table.getGridPositionFromCellPosition = function (rowNode, cellPosition) {

        var gridPosition = 0,
            allCells = $(rowNode).children();

        allCells.each(function (index) {

            if (index < cellPosition) {
                var colSpan = 1;
                if ($(this).attr('colspan')) {
                    colSpan = parseInt($(this).attr('colspan'), 10);
                }
                gridPosition += colSpan;
            } else {
                return false; // leaving the each-loop
            }
        });

        return gridPosition;
    };

    /**
     * Calculating the cell node in a row that fits to the specified
     * grid position. The attribute 'colspan' of all previous cells in
     * the row have to be added.
     *
     * @param {Node} rowNode
     *  The dom node of the row element
     *
     * @param {Number} gridPosition
     *  The grid number that is the basis for the new grid
     *
     * @param {Boolean} defaultToLastCell
     *  This boolean specifies, if the position of the last cell shall be returned,
     *  if no cell is found corresponding to the grid position. This can happen, if
     *  there is a short row between longer rows. In insertColumn a new cell shall
     *  always be added behind the last cell in this short row. In deleteColumns
     *  the last column of the short row shall not be deleted, if the gridposition
     *  is not valid.
     *
     * @returns {Number} cellPosition
     *  The cell position that corresponds to the grid position. If no cell has
     *  the specified grid position, the last cell position is returned.
     */
    Table.getCellPositionFromGridPosition = function (rowNode, gridPosition, defaultToLastCell) {

        var cellPosition = 0,
            allCells = $(rowNode).children(),
            gridSum = 0,
            foundCell = true,
            colSpanTarget = gridPosition + 1; // grid position is 0-based

        if (defaultToLastCell !== false) {
            defaultToLastCell = true;  // no explicit setting required for 'true'
        }

        allCells.each(function (index) {
            cellPosition = index;
            if (gridSum < colSpanTarget) {
                var colSpan = 1;
                if ($(this).attr('colspan')) {
                    colSpan = parseInt($(this).attr('colspan'), 10);
                }

                gridSum += colSpan;

                if (gridSum >= colSpanTarget) {
                    return false; // leaving the each-loop
                }

            } else {
                return false; // leaving the each-loop
            }
        });

        if (gridSum < colSpanTarget) {
            // maybe there are not enough cells in this row
            foundCell = false;
        }

        // In deleteColumns, cells shall only be deleted, if there is a cell
        // with the specified grid position.
        // In insertColumn, cells shall always be added.

        if ((! foundCell) && (! defaultToLastCell)) {
            cellPosition = -1;
        }

        return cellPosition;

    };

    // exports ================================================================

    return Table;

});
