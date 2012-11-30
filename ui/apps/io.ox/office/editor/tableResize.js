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

define('io.ox/office/editor/tableResize',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/operations',
     'io.ox/office/editor/position',
     'io.ox/office/editor/table'
    ], function (Utils, DOM, Operations, Position, Table) {

    'use strict';

    // static class TableResize ==================================================

    var TableResize = {};

    // static methods ---------------------------------------------------------

    /**
     * Draws a selection box for the specified resize node and registers
     * mouse handlers for moving.
     *
     * @param {Editor} editor
     *  The editor instance to use.
     *
     * @param {jQuery} officemaindiv
     *  The main window in which the resize node will be displayed temporarely
     *
     * @param {TableStyles} tableStyles
     *  The object containing the table styles.
     *
     * @param {HTMLElement|jQuery} resizeObject
     *  The drawing node to be selected. If this value is a jQuery
     *  collection, uses the first DOM node it contains.
     */
    TableResize.drawTableCellResizeSelection = function (editor, officemaindiv, tableStyles, resizeObject) {

        var startX = 0,
            startY = 0,
            currentX = 0,
            currentY = 0,
            shiftX = 0,
            shiftY = 0,
            // verticalResize is true, if the column width will be modified
            verticalResize = false,
            // horizontalResize is true, if the row height will be modified
            horizontalResize = false,
            // the container element used to visualize the resizing
            resizeLine = $('<div>').addClass('resizeline'),
            // the distance from body element to 'officemaindiv' in pixel
            topDistance = officemaindiv.offset().top,
            // the cell node for the selected resize node
            cellNode = null,
            // the row node for the selected resize node
            rowNode =  null,
            // the table node for the selected resize node
            tableNode = null,
            // the table node attributes object for the selected resize node
            tableNodeAttrs = null,
            // the maximum table width
            maxTableWidth = 0,
            // is the selected cell the last cell in its row
            lastCell = false,
            // logical position of the selected node
            tablePosition = [],
            // table grid before shifting column
            oldTableGrid = [],
            // table width after shifting column
            newTableWidth = 0,
            // table width before shifting column
            oldTableWidth = 'auto',
            // table grid, containing relative widths
            tableGrid = [],
            // table grid, containing calculated pixel widhts
            pixelGrid = [],
            // sum of all grid values, will not be modified
            gridSum = 0,
            // the number of the grid count, that will be modified
            shiftedGrid = 0,
            // maximum shift to the left
            maxLeftShift = 0,
            // maximum shift to the right
            maxRightShift = 0,
            // maximum shift to the top
            maxTopShift = 0,
            // maximum right value of shift position
            maxRightValue = 0,
            // minimum left value of shift position
            minLeftValue = 0,
            // minimum width of a column in px
            minColumnWidth = 10,
            // one node from parameter resizeObject
            resizeNode = null,
            // value indicating, that a valid mouse down event occurred
            mousedownevent = false;

        /**
         * Calculates the required data, when mouse down happens on resize node.
         *
         * @param {Event} event
         *  The event object.
         *
         * @param {HTMLElement} resizeNode
         *  The resize node, that will be displayed temporarely
         *
         */
        function mouseDownOnResizeNode(event, resizeNode) {
            // mouse down event handler
            startX = event.pageX;
            startY = event.pageY - topDistance;

            if ($(resizeNode).is('div.rightborder')) {
                verticalResize = true;
            } else if ($(resizeNode).is('div.bottomborder')) {
                horizontalResize = true;
            }

            // calculating maximum resize values
            cellNode = $(resizeNode).closest('td, th');
            rowNode =  $(resizeNode).closest('tr');
            tableNode = $(resizeNode).closest('table');

            if (verticalResize) {
                $(resizeLine).css({ width: '1px', height: '100%', left: startX, top: '0px' });
                officemaindiv.append(resizeLine);

                // calculating maxLeftShift and maxRightShift
                lastCell = cellNode[0].nextSibling ? false : true;
                tablePosition = Position.getOxoPosition(editor.getNode(), tableNode.get(0), 0);
                tableNodeAttrs = tableStyles.getElementAttributes(tableNode).table;
                oldTableGrid = tableNodeAttrs.tableGrid;
                oldTableWidth = tableNodeAttrs.width;
                maxTableWidth = tableNode.parent().width();

                if (oldTableWidth === 'auto') { oldTableWidth = tableNode.outerWidth(); }
                else { oldTableWidth = Utils.convertHmmToLength(oldTableWidth, 'px', 0); }

                // converting from relational grid to pixel grid
                for (var i = 0; i < oldTableGrid.length; i++) { gridSum += oldTableGrid[i]; }
                for (var i = 0; i < oldTableGrid.length; i++) { pixelGrid.push(Utils.roundDigits(oldTableGrid[i] * oldTableWidth / gridSum, 0)); }

                // which border was shifted?
                shiftedGrid = Table.getGridPositionFromCellPosition(rowNode, cellNode.prevAll().length).end;

                maxLeftShift = pixelGrid[shiftedGrid];
                if (! lastCell) { maxRightShift = pixelGrid[shiftedGrid + 1]; }
                else { maxRightShift = maxTableWidth - oldTableWidth; }

            } else if (horizontalResize) {
                $(resizeLine).css({ width: '100%', height: '1px', left: '0px', top: startY});
                officemaindiv.append(resizeLine);
                // calculating maxTopShift (for bottom shift there is no limit)
                maxTopShift = cellNode.outerHeight();
            }

            editor.getNode().css('cursor', $(resizeNode).css('cursor'));  // setting cursor for increasing drawing
            $(resizeLine).css('cursor', $(resizeNode).css('cursor'));  // setting cursor for increasing drawing
        }

        /**
         * Calculates the required data, when mouse move happens.
         *
         * @param {Event} event
         *  The event object.
         *
         * @param {HTMLElement} resizeNode
         *  The resize node, that will be displayed temporarely
         *
         */
        function mouseMoveOnResizeNode(event, resizeNode) {

            // mouse move event handler
            currentX = event.pageX;
            currentY = event.pageY - topDistance;

            if (verticalResize) {

                maxRightValue = startX + maxRightShift;
                minLeftValue = startX - maxLeftShift + minColumnWidth;
                if (! lastCell) { maxRightValue -= minColumnWidth; }

                shiftX = currentX;
                shiftY = 0;

                if (shiftX >= maxRightValue) {
                    shiftX = maxRightValue;
                } else if (shiftX <= minLeftValue) {
                    shiftX = minLeftValue;
                }

            } else if (horizontalResize) {
                shiftX = 0;
                shiftY = currentY;

                if ((shiftY - startY) <= - maxTopShift) {
                    shiftY = startY - maxTopShift;
                }
            }

            if ((_.isNumber(shiftX)) && (_.isNumber(shiftY))) {
                $(resizeLine).css({'left': shiftX, 'top': shiftY});
            }
        }

        /**
         * Calculates the required data, when mouse up happens and generates
         * operations.
         *
         * @param {Event} event
         *  The event object.
         *
         * @param {HTMLElement} resizeNode
         *  The resize node, that will be displayed temporarely
         *
         */
        function mouseUpOnResizeNode(event, resizeNode) {

            var generator = new Operations.Generator(),
                rowPosition = null,
                rowHeight = 0,
                newRowHeight = 0;

            // mouse up event handler
            currentX = event.pageX;
            currentY = event.pageY - topDistance;

            // removing the resize line
            officemaindiv.children('div.resizeline').remove();

            // Resetting cursor, using css file again
            editor.getNode().css('cursor', '');

            if (verticalResize) {

                if ((_.isNumber(currentX)) && (currentX !== startX)) {

                    maxRightValue = startX + maxRightShift;
                    minLeftValue = startX - maxLeftShift + minColumnWidth;
                    if (! lastCell) { maxRightValue -= minColumnWidth; }

                    if (currentX >= maxRightValue) {
                        currentX = maxRightValue;
                    } else if (currentX <= minLeftValue) {
                        currentX = minLeftValue;
                    }

                    shiftX = currentX - startX;

                    newTableWidth = lastCell ? (oldTableWidth + shiftX) : oldTableWidth;

                    // -> shifting the border
                    pixelGrid[shiftedGrid] += shiftX;
                    if (! lastCell) { pixelGrid[shiftedGrid + 1] -= shiftX; }

                    // converting modified pixel grid to new relation table grid
                    for (var i = 0; i < pixelGrid.length; i++) {
                        tableGrid.push(Utils.roundDigits(gridSum * pixelGrid[i] / newTableWidth, 0));  // only ints
                    }

                    if ((! lastCell) && (tableStyles.getElementAttributes(tableNode).table.width === 'auto')) { newTableWidth = 'auto'; }
                    else { newTableWidth = Utils.convertLengthToHmm(newTableWidth, 'px'); }

                    generator.generateOperation(Operations.ATTRS_SET, {
                        attrs: { table: { tableGrid: tableGrid, width: newTableWidth } },
                        start: tablePosition
                    });

                    editor.applyOperations(generator.getOperations());
                }

            } else if (horizontalResize) {

                if ((_.isNumber(currentY)) && (currentY !== startY)) {

                    rowHeight = rowNode.outerHeight() + currentY - startY;

                    if (rowHeight < 0) { rowHeight = 0; }

                    newRowHeight = Utils.convertLengthToHmm(rowHeight, 'px');
                    rowPosition = Position.getOxoPosition(editor.getNode(), rowNode.get(0), 0);

                    generator.generateOperation(Operations.ATTRS_SET, {
                        attrs: { row: { height: newRowHeight } },
                        start: rowPosition
                    });

                    editor.applyOperations(generator.getOperations());
                }
            }

            // deregister event handler
            // removing mouse event handler (mouseup and mousemove) from page div
            $(document).off('mouseup', mouseUpOnResizeNodeHandler);
            $(document).off('mousemove', mouseMoveOnResizeNodeHandler);
            $(resizeNode).off('mousedown', mouseDownOnResizeNodeHandler);
        }

        /**
         * Handler function for mouse down events. This function
         * is bound to 'mousedown'.
         *
         * @param {Event} e1
         *  The event object.
         *
         * @param {Event} e2
         *  The event object, generated by triggerHandler in editor.
         *
         */
        function mouseDownOnResizeNodeHandler(e1, e2) {
            if (mousedownevent === true) { return; }
            var e = e1.pageX ? e1 : e2;  // from triggerHandler in editor only e2 can be used
            mousedownevent = true;
            mouseDownOnResizeNode(e, resizeNode);
        }

        /**
         * Handler function for mouse move events. This function
         * is bound to 'mousemove'.
         *
         * @param {Event} e
         *  The event object.
         *
         */
        function mouseMoveOnResizeNodeHandler(e) {
            if (! mousedownevent) return;
            mouseMoveOnResizeNode(e, resizeNode);
        }

        /**
         * Handler function for mouse up events. This function
         * is bound to 'mouseup'.
         *
         * @param {Event} e
         *  The event object.
         *
         */
        function mouseUpOnResizeNodeHandler(e) {
            if (mousedownevent === true) {
                mouseUpOnResizeNode(e, resizeNode);
                mousedownevent = false;
            }
        }

        $(resizeObject).each(function () {
            // whether mousedown is a current event
            mousedownevent = false;
            // saving the selected resize node
            resizeNode = this;
            // moving the resize node
            $(this).on('mousedown', mouseDownOnResizeNodeHandler);
            // mousemove and mouseup events can be anywhere on the page -> binding to $(document)
            $(document).on({'mousemove': mouseMoveOnResizeNodeHandler, 'mouseup': mouseUpOnResizeNodeHandler});
        });

    };

    // exports ================================================================

    return TableResize;

});
