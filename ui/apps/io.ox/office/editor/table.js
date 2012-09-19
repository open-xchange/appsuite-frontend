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
     'io.ox/office/editor/oxopam',
     'io.ox/office/dialog/error'], function (Utils, DOM, Position, OXOPaM, ErrorDialogs) {

    'use strict';

    // static class Image ==================================================

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

            var tableNode = tablePosition.node;

            if ($(tableNode).data('grid')) {

                tablegrid = $(tableNode).data('grid');

            } else {

                var allCols = $(tableNode).children('colgroup').children('col');

                allCols.each(function (index) {
                    var width = $(this).css('width');
                    if (width) {
                        var localWidth = parseFloat(width.substring(0, width.length - 2));
                        // converting from px to 1/100 mm again
                        localWidth = Utils.roundDigits(Utils.convertLength(localWidth, 'px', 'mm', 2), 2) * 100;
                        // localWidth *= 100; // 1/100 mm
                        tablegrid.push(localWidth);
                    } else {
                        tablegrid.push(0);
                    }
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

    return Table;

});