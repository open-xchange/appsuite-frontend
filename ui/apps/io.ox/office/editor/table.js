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
     'io.ox/office/editor/format/stylesheets',
     'io.ox/office/editor/operations'
    ], function (Utils, DOM, Position, StyleSheets, Operations) {

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
     *  Array of grid widths of the table as relative values.
     */
    Table.getTableGrid = function (startnode, tablePos) {

        var tablePosition = Position.getDOMPosition(startnode, tablePos),
            tableGrid = null;

        if (tablePosition) {
            tableGrid = StyleSheets.getExplicitAttributes(tablePosition.node, 'table').tableGrid;
        }

        return tableGrid || [];
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

        var tableWidth = null,
            tablePosition = Position.getDOMPosition(startnode, tablePos);

        if (tablePosition) {

            var tableNode = tablePosition.node;

            if ($(tableNode).css('width')) {
                tableWidth = $(tableNode).css('width');
            }
        }

        return tableWidth;
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
     * @param {String} insertmode
     *  The insert mode can be 'before' or 'behind'. This is relevant for
     *  the position of the added column.
     *
     * @returns {[]}
     *  Array of grid widths of the table in 1/100 mm
     */
    Table.getTableGridWithNewColumn = function (startnode, tablePos, gridPosition, insertmode) {

        var tableGrid = _.copy(Table.getTableGrid(startnode, tablePos), true),
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
            tableGrid[i] = Utils.roundDigits(factor * tableGrid[i], 0);  // only ints
        }

        return tableGrid;

    };

    /**
     * Calculates the grid row range of the specified cell.
     *
     * @param {HTMLTableCellElement|jQuery} cellNode
     *  The table cell element. If this object is a jQuery collection, uses the
     *  first node it contains.
     *
     * @returns {Object}
     *  An object with 'start' and 'end' integer attributes representing the
     *  grid row range of the selected cell (zero-based, closed range). If
     *  the cell has a height of one grid row, start and end will be equal.
     */
    Table.getGridRowRangeOfCell = function (cellNode) {

        var // the parent row node of the cell
            rowNode = $(cellNode).parent(),
            // the start grid row index of the cell
            start = rowNode.parent().children('tr').index(rowNode);

        // find end grid row index of the cell, and return the result
        return {
            start: start,
            end: start + Utils.getElementAttributeAsInteger(cellNode, 'rowspan', 1) - 1
        };
    };

    /**
     * Calculates the grid column range of the specified cell.
     *
     * @param {HTMLTableCellElement|jQuery} cellNode
     *  The table cell element. If this object is a jQuery collection, uses the
     *  first node it contains.
     *
     * @returns {Object}
     *  An object with 'start' and 'end' integer attributes representing the
     *  grid column range of the selected cell (zero-based, closed range). If
     *  the cell has a width of one grid column, start and end will be equal.
     */
    Table.getGridColumnRangeOfCell = function (cellNode) {

        var // the start grid column index of the cell
            start = 0;

        // find start index of the cell by adding the colspans of all previous cells
        $(cellNode).prevAll('td').each(function () {
            start += Utils.getElementAttributeAsInteger(this, 'colspan', 1);
        });

        // find end grid column index of the cell, and return the result
        return {
            start: start,
            end: start + Utils.getElementAttributeAsInteger(cellNode, 'colspan', 1) - 1
        };
    };

    /**
     * Calculating the grid position of a selected cell. The attribute
     * 'colspan' of all previous cells in the row have to be added.
     * The return value is 0-based. The first cell in a row always has
     * grid position 0.
     *
     * @param {HTMLTableRowElement|jQuery} rowNode
     *  The table row element. If this object is a jQuery collection, uses the
     *  first node it contains.
     *
     * @param {Number} cellIndex
     *  The DOM child index of the cell inside the row node.
     *
     * @returns {Object}
     *  An object with 'start' and 'end' integer attributes representing the
     *  grid range of the selected cell (closed range). If the cell has a width
     *  of one grid position, start and end will be equal.
     */
    Table.getGridPositionFromCellPosition = function (rowNode, cellIndex) {
        return Table.getGridColumnRangeOfCell($(rowNode).children('td').eq(cellIndex));
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
                var colSpan = Utils.getElementAttributeAsInteger(this, 'colspan', 1);

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

    /**
     * Calculating the sum of all colspans from a selection of cells.
     *
     * @param {jQuery} cellSelection
     *  The jQuery selection of cell element(s).
     *
     * @returns {Number} sum
     *  The sum of all col spans in the selection of cells.
     */
    Table.getColSpanSum = function (cellSelection) {

        var sum = 0;

        cellSelection.each(function () {
            sum += Utils.getElementAttributeAsInteger(this, 'colspan', 1);
        });

        return sum;
    };

    /**
     * Shifting the content of table cells from one or more cells to one
     * target cell.
     *
     * @param {jQuery} targetCell
     *  The jQuery selection containing a cell element in which the content
     *  of the other cells shall be included.
     *
     * @param {jQuery} sourceCells
     *  The jQuery selection of cell element(s), whose content shall be
     *  added to another cell.
     */
    Table.shiftCellContent = function (targetCell, sourceCells) {

        sourceCells.each(function (index) {
            targetCell.append($(this).children());
        });
    };

    /**
     * Collecting for a collection of rows the cell positions that correspond
     * to a specific grid position.
     *
     * @param {jQuery} allRows
     *  The jQuery collection containing row elements, whose cell positions
     *  corresponding to a specific grid position shall be collected in an array.
     *
     * @param {Number} gridposition
     *  The integer grid position.
     *
     * @param {String} insertmode
     *  The calculated cell position depends from the insert mode concerning
     *  the grid position. Allowed values are 'behind' and 'before'.
     *
     * @return {any[]} allInsertPositions
     *  An array, that contains the integer insert positions for each row in the
     *  correct order.
     */
    Table.getAllInsertPositions = function (allRows, gridposition, insertmode) {

        var allInsertPositions = [];

        allRows.each(function (index) {

            var insertPosition = Table.getCellPositionFromGridPosition(this, gridposition);

            if (insertmode === 'behind') {
                insertPosition++;
            }

            allInsertPositions.push(insertPosition);
        });

        return allInsertPositions;
    };

    /**
     * Collecting for a collection of rows the cell positions that correspond
     * to specified grid start position and grid end position. For each row
     * an array with two integer values is returned, representing the start
     * and the end position of the cells. If no cells correspond to the specified
     * grid position end can be '-1' or even start and end can be '-1'. This
     * happens for example if startgrid and endgrid have high numbers, but the
     * currently investigated row is very short. In the case of removal of cells,
     * no cell is removed from such a cell.
     *
     * @param {jQuery} allRows
     *  The jQuery collection containing row elements, whose cell positions
     *  corresponding to the specified grid positions shall be collected in an array.
     *
     * @param {Number} startgrid
     *  The integer start grid position.
     *
     * @param {Number} endgrid
     *  The integer end grid position.
     *
     * @return {any[]} allRemovePositions
     *  An array, that contains for each row an array with two integer values
     *  for start and end position of the cells. If no cells correspond to the
     *  specified grid position end can be '-1' or even start and end can be '-1'.
     */
    Table.getAllRemovePositions = function (allRows, startgrid, endgrid) {

        var allRemovePositions = [];

        allRows.each(function (index) {

            var removeRangeInOneRow = [],  // an array collecting the start and end position (integer) of the cells to be removed
                startCol = Table.getCellPositionFromGridPosition(this, startgrid, false),
                endCol = Table.getCellPositionFromGridPosition(this, endgrid, false);

            // startCol and endCol might be '-1', if the grid positions are out of range. In this case, no cells are deleted
            removeRangeInOneRow.push(startCol);
            removeRangeInOneRow.push(endCol);

            allRemovePositions.push(removeRangeInOneRow);
        });

        return allRemovePositions;
    };

    /**
     * Calculating the relative width of one grid column in relation to the
     * width of the table. The result is the percentage.
     *
     * @param {Number[]} tablegrid
     *  The grid array.
     *
     * @param {Number} width
     *  The relative width of one column of the grid array.
     *
     * @return {Number} percentage
     *  The percentage of the one specified grid width in relation to the
     *  complete grid array.
     */
    Table.getGridWidthPercentage = function (tablegrid, width) {

        var fullWidth = 0,
            percentage = 0;

        _(tablegrid).each(function (gridWidth) { fullWidth += gridWidth; });

        percentage = Utils.roundDigits(width * 100 / fullWidth, 1);

        return percentage;
    };

    /**
     * Updating the column group elements in a table element. This is necessary
     * after inserting or deleting columns or cells.
     *
     * @param {jQuery} table
     *  The <table> element whose table attributes have been changed, as jQuery
     *  object.
     *
     * @param {Number[]} tablegrid
     *  The grid array.
     */
    Table.updateColGroup = function (table, tablegrid) {

        var colgroup = table.children('colgroup'),
            gridsum = 0;

        colgroup.children('col').remove(); // removing all col entries

        // check if tablegrid contains valid values -> workaround for tablegrids containing only '0'.
        for (var i = 0; i < tablegrid.length; i++) { gridsum += tablegrid[i]; }
        if (gridsum === 0) {
            for (var i = 0; i < tablegrid.length; i++) { tablegrid[i] += 1000; }
        }


        for (var i = 0; i < tablegrid.length; i++) {
            var oneGridWidth = Table.getGridWidthPercentage(tablegrid, tablegrid[i])  + '%';  // converting to %
            colgroup.append($('<col>').css('width', oneGridWidth));
        }

    };

    /**
     * Checks if the table style is dirty and
     * if yes, insert it into the document styles.
     *
     * @param editor {Editor}
     *  The editor instance to use.
     *
     * @param tableStyleId {String}
     *  The table style id
     */
    Table.checkForLateralTableStyle = function (editor, tableStyleId) {

        var generator = new Operations.Generator(),
            tableStyles = editor.getStyleSheets('table');

        if (_.isString(tableStyleId)) {
            // insert pending table style to document
            if (tableStyles.isDirty(tableStyleId)) {
                generator.generateOperation(Operations.INSERT_STYLE, {
                    attrs: tableStyles.getStyleSheetAttributeMap(tableStyleId),
                    type: 'table',
                    styleId: tableStyleId,
                    styleName: tableStyles.getName(tableStyleId),
                    parent: tableStyles.getParentId(tableStyleId),
                    uiPriority: tableStyles.getUIPriority(tableStyleId)
                });
                tableStyles.setDirty(tableStyleId, false);
            }
        }
    };


    // exports ================================================================

    return Table;

});
