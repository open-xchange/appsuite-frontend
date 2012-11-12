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
define('io.ox/office/editor/selection',
    ['io.ox/core/event',
     'io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/position'
    ], function (Events, Utils, DOM, Position) {

    'use strict';

    // class Selection ========================================================

    /**
     * An instance of this class represents a selection in the edited document,
     * consisting of a logical start and end position representing a half-open
     * text range, or a rectangular table cell range.
     *
     * @constructor
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node of the document. If this object is a jQuery collection,
     *  uses the first node it contains.
     */
    function Selection(rootNode) {

        var // self reference
            self = this,

            // logical start position
            startPosition = [],

            // logical end position (half-open range)
            endPosition = [],

            // whether the current text range has been selected backwards
            backwards = false,

            // object node currently selected, as jQuery collection
            selectedObject = $(),

            // whether this selection represents a rectangular table cell range
            cellRangeSelected = false,

            // whether the cell range selection covers the entire table
            tableSelected = false;

        // TODO: convert editor code to use methods instead of member access
        // (especially, do not modify these arrays from outside...)
        this.startPaM = { oxoPosition: startPosition };
        this.endPaM = { oxoPosition: endPosition };

        // private methods ----------------------------------------------------

        /**
         * Returns the first logical text position in the document.
         */
        function getFirstTextPosition() {
            var firstSpan = Utils.findDescendantNode(rootNode, function () { return DOM.isPortionSpan(this); });
            return Position.getOxoPosition(rootNode, firstSpan, 0);
        }

        /**
         * Returns the last logical text position in the document.
         */
        function getLastTextPosition() {
            var lastSpan = Utils.findDescendantNode(rootNode, function () { return DOM.isPortionSpan(this); }, { reverse: true });
            return Position.getOxoPosition(rootNode, lastSpan, lastSpan.firstChild.nodeValue.length);
        }

        /**
         * Converts the passed logical text position to a valid DOM point as
         * used by the internal browser selection.
         *
         * @param {Number[]} position
         *  The logical position of the target node. Must be the position of a
         *  paragraph child node, either a text span, a text component (fields,
         *  tabs), or an object node.
         *
         * @returns {DOM.Point|Null}
         *  The DOM-Point object representing the passed logical position, or
         *  null, if the passed position is invalid.
         */
        function getPointForTextPosition(position) {

            var // resolve position to DOM element
                nodeInfo = Position.getDOMPosition(rootNode, position, true);

            // check that the position selects a paragraph child node
            if (nodeInfo && nodeInfo.node && DOM.isParagraphNode(nodeInfo.node.parentNode)) {

                // convert to a valid DOM point: text spans to text nodes with offset,
                // otherwise DOM element point, consisting of parent node and own sibling index
                return DOM.isTextSpan(nodeInfo.node) ?
                    new DOM.Point(nodeInfo.node.firstChild, nodeInfo.offset) :
                    DOM.Point.createPointForNode(nodeInfo.node);
            }

            return null;
        }

        /**
         * Initializes this selection with the passed start and end points, and
         * validates the browser selection by moving the start and end points
         * to editable nodes.
         *
         * @param {DOM.Point} anchorPoint
         *  The DOM anchor point of a selected range. This is the side of the
         *  range where selecting with mouse or keyboard has been started.
         *
         * @param {DOM.Point} focusPoint
         *  The DOM focus point of a selected range. This is the side of the
         *  range that will be extended when selection will be changed while
         *  dragging the mouse with pressed button, or with cursor keys while
         *  holding the SHIFT key. May be located before the passed anchor
         *  position.
         *
         * @param {Boolean} [forwardCursor]
         *  If set to true, the new browser selection originates from a cursor
         *  navigation key that moves the cursor forwards in the document.
         */
        function applyBrowserSelection(browserSelection, forwardCursor) {

            var // active range from selection, preserving direction
                anchorPoint = browserSelection.active.start,
                focusPoint = browserSelection.active.end,
                // adjusted points (start before end)
                startPoint = null, endPoint = null,
                // whether position is a single cursor
                isCursor = false,
                // table containing the selection
                tableNode = null,
                // selected object node
                objectInfo = null;

            // check for cell range selection (must be in the same table)
            cellRangeSelected = $(anchorPoint.node).is('tr') && $(focusPoint.node).is('tr') && (anchorPoint.node.parentNode === focusPoint.node.parentNode);
            if (cellRangeSelected) {

                // cell range selection is always ordered, no need to check for direction
                backwards = false;

                // convert multi-selection for cells to rectangular cell selection
                startPoint = _(browserSelection.ranges).first().start;
                endPoint = _(browserSelection.ranges).last().end;

                // entire table selected, if number of cell range objects in selection is equal to number of table cells
                tableNode = Utils.findClosestParent(rootNode, focusPoint.node, 'table');
                tableSelected = browserSelection.ranges.length === DOM.getTableRows(tableNode).children('td').length;

            } else {

                // get range direction (check for real range, DOM.Point.comparePoints() is expensive)
                isCursor = browserSelection.active.isCollapsed();
                backwards = !isCursor && (DOM.Point.comparePoints(anchorPoint, focusPoint) > 0);
                tableSelected = false;

                // adjust start and end position
                startPoint = backwards ? focusPoint : anchorPoint;
                endPoint = backwards ? anchorPoint : focusPoint;
            }

            // calculate start and end position (always text positions, also in cell range mode)
            self.startPaM.oxoPosition = startPosition = Position.getTextLevelOxoPosition(startPoint, rootNode, false, forwardCursor);
            self.endPaM.oxoPosition = endPosition = isCursor ? _.clone(startPosition) : Position.getTextLevelOxoPosition(endPoint, rootNode, true, forwardCursor);

            // check for object selection
            DOM.clearObjectSelection(selectedObject);
            selectedObject = $();
            if (!cellRangeSelected && self.isSingleComponentSelection()) {
                objectInfo = Position.getDOMPosition(rootNode, startPosition, true);
                if (objectInfo && DOM.isObjectNode(objectInfo.node)) {
                    selectedObject = $(objectInfo.node);
                    // TODO: move call to DOM.drawObjectSelection() to here once
                    // editor code becomes independent from explicit mouse handlers
                }
            }

            // draw correct browser selection
            self.restoreBrowserSelection();

            // notify listeners
            self.trigger('change');
        }

        // methods ------------------------------------------------------------

        /**
         * Returns whether this selection contains a valid start and end
         * position.
         */
        this.isValid = function () {
            return (startPosition.length > 0) && (endPosition.length > 0);
        };

        /**
         * Returns the current logical start position.
         *
         * @returns {Number[]}
         *  The logical start position of this selection.
         */
        this.getStartPosition = function () {
            return _.clone(startPosition);
        };

        /**
         * Returns the current logical end position.
         *
         * @returns {Number[]}
         *  The logical end position of this selection.
         */
        this.getEndPosition = function () {
            return _.clone(endPosition);
        };

        /**
         * Returns whether this selection represents a simple text cursor.
         *
         * @returns {Boolean}
         *  True, if this selection represents a simple text cursor.
         */
        this.isTextCursor = function () {
            return !cellRangeSelected && _.isEqual(startPosition, endPosition);
        };

        /**
         * Returns whether this selection represents a range that covers some
         * document contents. The result is the exact opposite of the method
         * Selection.isTextCursor().
         *
         * @returns {Boolean}
         *  True, if this selection represents a range in the document.
         */
        this.hasRange = function () {
            return !this.isTextCursor();
        };

        /**
         * Returns whether this selection has been created while selecting the
         * document contents backwards (by cursor keys or by mouse).
         *
         * @returns {Boolean}
         *  True, if the selection has been created backwards.
         */
        this.isBackwards = function () {
            return backwards;
        };

        /**
         * Returns the type of this selection as string.
         *
         * @returns {String}
         *  Returns 'text' for a text range or text cursor, or 'cell' for a
         *  rectangular cell range in a table, or 'object' for an object
         *  selection.
         */
        this.getSelectionType = function () {
            return cellRangeSelected ? 'cell' : (selectedObject.length > 0) ? 'object' : 'text';
        };

        /**
         * Returns whether the start and end position of this selection are
         * located in the same parent component (all array elements but the
         * last are equal).
         *
         * @param {Number} [parentLevel=1]
         *  The number of parent levels. If omitted, the direct parents of the
         *  start and end position will be checked (only the last element of
         *  the position array will be ignored). Otherwise, the specified
         *  number of trailing array elements will be ignored (for example, a
         *  value of 2 checks the grand parents).
         *
         * @returns {Boolean}
         *  Whether the start and end position are located in the same parent
         *  component.
         */
        this.hasSameParentComponent = function (parentLevel) {
            return Position.hasSameParentComponent(startPosition, endPosition, parentLevel);
        };

        /**
         * Returns whether this selection covers exactly one component.
         *
         * @returns {Boolean}
         *  Returns whether the selection is covering a single component. The
         *  start and end position must refer to the same parent component, and
         *  the last array element of the end position must be the last array
         *  element of the start position increased by the value 1.
         */
        this.isSingleComponentSelection = function () {
            return this.hasSameParentComponent() && (_.last(startPosition) === _.last(endPosition) - 1);
        };

        /**
         * Returns the logical position of the closest common component
         * containing all nodes covered by this selection (the leading array
         * elements that are equal in the start and end position arrays).
         *
         * @returns {Number[]}
         *  The logical position of the closest common component containing
         *  this selection. May be the empty array if the positions already
         *  differ in their first element.
         */
        this.getClosestCommonPosition = function () {

            var index = 0, length = Math.min(startPosition.length, endPosition.length);

            // compare all array elements but the last ones
            while ((index < length) && (startPosition[index] === endPosition[index])) {
                index += 1;
            }

            return startPosition.slice(0, index);
        };

        /**
         * Returns the closest paragraph that contains all nodes of this
         * selection completely.
         *
         * @returns {HTMLElement|Null}
         *  The closest paragraph containing this selection; or null, if the
         *  selection is not contained in a single paragraph.
         */
        this.getEnclosingParagraph = function () {

            var // position of closest common parent component containing the selection
                commonPosition = this.getClosestCommonPosition();

            // the closest paragraph containing the common parent component
            return (commonPosition.length > 0) ? Position.getCurrentParagraph(rootNode, commonPosition) : null;
        };

        /**
         * Returns the closest table that contains all nodes of this selection
         * completely.
         *
         * @returns {HTMLTableElement|Null}
         *  The closest table containing this selection; or null, if the
         *  selection is not contained in a single table.
         */
        this.getEnclosingTable = function () {

            var // position of closest common parent component containing the selection
                commonPosition = this.getClosestCommonPosition();

            // the closest table containing the common parent component
            return (commonPosition.length > 0) ? Position.getCurrentTable(rootNode, commonPosition) : null;
        };

        /**
         * Returns an object describing the table cell range that is currently
         * selected.
         *
         * @returns {Object|Null}
         *  If this selection is contained completely inside a table, returns
         *  an object containing the following attributes:
         *  - {HTMLTableElement} tableNode: the table element containing the
         *      selection,
         *  - {Number[]} tablePosition: the logical position of the table,
         *  - {Number[]} firstCellPosition: the logical position of the first
         *      cell, relative to the table (contains exactly two elements:
         *      row, column),
         *  - {Number[]} lastCellPosition: the logical position of the last
         *      cell, relative to the table (contains exactly two elements:
         *      row, column),
         *  - {Number} width: the number of columns covered by the cell range,
         *  - {Number} height: the number of rows covered by the cell range.
         *  Otherwise, this method returns null.
         */
        this.getSelectedCellRange = function () {

            var // the result object containing all info about the cell range
                result = { tableNode: this.getEnclosingTable() };

            if (!result.tableNode) {
                return null;
            }

            // logical position of the table
            result.tablePosition = Position.getOxoPosition(rootNode, result.tableNode, 0);

            // convert selection positions to cell positions relative to table
            if ((startPosition.length < result.tablePosition.length + 2) || (endPosition.length < result.tablePosition.length + 2)) {
                Utils.error('Selection.getSelectedCellRange(): invalid start or end position');
                return null;
            }
            result.firstCellPosition = startPosition.slice(result.tablePosition.length, result.tablePosition.length + 2);
            result.lastCellPosition = endPosition.slice(result.tablePosition.length, result.tablePosition.length + 2);

            // width and height of the range for convenience
            result.width = result.lastCellPosition[1] - result.firstCellPosition[1] + 1;
            result.height = result.lastCellPosition[0] - result.firstCellPosition[0] + 1;

            return result;
        };

        /**
         * Returns the object node currently selected.
         *
         * @returns {jQuery}
         *  A jQuery collection containing the currently selected object, if
         *  existing; otherwise an empty jQuery collection.
         */
        this.getSelectedObject = function () {
            return selectedObject;
        };

        // selection manipulation ---------------------------------------------

        /**
         * Restores the browser selection according to the current logical
         * selection represented by this instance.
         *
         * @returns {Selection}
         *  A reference to this instance.
         */
        this.restoreBrowserSelection = function () {

            var // the DOM ranges representing the logical selection
                ranges = [],
                // start and end DOM point for text selection
                startPoint = null, endPoint = null;

            switch (this.getSelectionType()) {

            // text selection: select text range
            case 'text':
                startPoint = Position.getDOMPosition(rootNode, startPosition);
                endPoint = Position.getDOMPosition(rootNode, endPosition);
                if (startPoint && endPoint) {
                    ranges.push(new DOM.Range(backwards ? endPoint : startPoint, backwards ? startPoint : endPoint));
                } else {
                    Utils.error('Selection.restoreBrowserSelection(): missing text selection range');
                }
                break;

            // cell selection: iterate all cells
            case 'cell':
                this.iterateTableCells(function (cell) {
                    ranges.push(DOM.Range.createRangeForNode(cell));
                });
                break;

            // do not set any browser selection in object selection mode
            case 'object':
                break;

            default:
                Utils.error('Selection.restoreBrowserSelection(): unknown selection type');
            }

            DOM.setBrowserSelection(ranges);
            return this;
        };

        /**
         * Calculates the own logical selection according to the current
         * browser selection.
         *
         * @param {Boolean} [forwardCursor]
         *  If set to true, the new browser selection originates from a cursor
         *  navigation key that moves the cursor forwards in the document.
         */
        this.updateFromBrowserSelection = function (forwardCursor) {

            var // the current browser selection
                browserSelection = DOM.getBrowserSelection(rootNode);

            if (browserSelection.active) {
                applyBrowserSelection(browserSelection, forwardCursor);
            } else if (selectedObject.length === 0) {
                Utils.warn('Selection.updateFromBrowserSelection(): missing valid browser selection');
            }

            return this;
        };

        /**
         * Selects the passed logical text range in the document.
         *
         * @param {Number[} newStartPosition
         *  The logical position of the first text component in the selection.
         *  Must be the position of a paragraph child node, either a text span,
         *  a text component (fields, tabs), or an object node.
         *
         * @param {Number[]} [newEndPosition]
         *  The logical position behind the last text component in the
         *  selection (half-open range). Must be the position of a paragraph
         *  child node, either a text span, a text component (fields, tabs), or
         *  an object node. If omitted, sets a text cursor according to the
         *  passed start position.
         *
         * @returns {Selection}
         *  A reference to this instance.
         */
        this.setTextSelection = function (newStartPosition, newEndPosition) {

            var // DOM points for start and end position
                startPoint = _.isArray(newStartPosition) ? getPointForTextPosition(newStartPosition) : null,
                endPoint = _.isArray(newEndPosition) ? getPointForTextPosition(newEndPosition) : startPoint,

                // create a browser selection object, as returned by DOM.getBrowserSelection()
                browserSelection = null;

            if (startPoint && endPoint) {

                // add the ranges member representing the multi-selection ranges
                browserSelection = { active: new DOM.Range(startPoint, endPoint) };
                browserSelection.ranges = [browserSelection.active];

                // apply the constructed browser selection
                applyBrowserSelection(browserSelection);

            } else {
                Utils.warn('Selection.setTextSelection(): expecting text positions, start=' + JSON.stringify(newStartPosition) + ', end=' + JSON.stringify(newEndPosition));
            }

            return this;
        };

        /**
         * Sets the text cursor to the first available cursor position in the
         * document. Skips leading floating objects in the first paragraph. If
         * the first content node is a table, selects its first available
         * cell paragraph (may be located in a sub table in the first outer
         * cell).
         *
         * @returns {Selection}
         *  A reference to this instance.
         */
        this.selectTopPosition = function () {
            return this.setTextSelection(getFirstTextPosition());
        };

        /**
         * Selects the entire document.
         *
         * @returns {Selection}
         *  A reference to this instance.
         */
        this.selectAll = function () {
            return this.setTextSelection(getFirstTextPosition(), getLastTextPosition());
        };

        /**
         * If this selection selects an object node, changes the browser
         * selection to a range that starts directly before that object node,
         * and ends directly after that object.
         *
         * @returns {Selection}
         *  A reference to this instance.
         */
        this.selectObjectAsText = function () {

            var // whether the object is in inline mode
                inline = DOM.isInlineObjectNode(selectedObject),
                // previous text span of the object node
                prevTextSpan = inline ? selectedObject[0].previousSibling : null,
                // next text span of the object node (skip following floating objects)
                nextTextSpan = Utils.findNextSiblingNode(selectedObject, function () { return DOM.isPortionSpan(this); }),
                // DOM points representing the text selection over the object
                startPoint = null, endPoint = null;

            if (selectedObject.length > 0) {

                // remove object selection boxes
                DOM.clearObjectSelection(selectedObject);

                // start point after the last character preceding the object
                if (DOM.isPortionSpan(prevTextSpan)) {
                    startPoint = new DOM.Point(prevTextSpan.firstChild, prevTextSpan.firstChild.nodeValue.length);
                }
                // end point before the first character following the object
                if (DOM.isPortionSpan(nextTextSpan)) {
                    endPoint = new DOM.Point(nextTextSpan.firstChild, 0);
                }

                // set browser selection (do nothing if no start and no end point
                // have been found - but that should never happen)
                if (startPoint || endPoint) {
                    if (backwards) {
                        DOM.setBrowserSelection(new DOM.Range(endPoint || startPoint, startPoint || endPoint));
                    } else {
                        DOM.setBrowserSelection(new DOM.Range(startPoint || endPoint, endPoint || startPoint));
                    }
                }
            }

            return this;
        };

        // iterators ----------------------------------------------------------

        /**
         * Calls the passed iterator function for each table cell, if this
         * selection is located inside a table. Processes a rectangular cell
         * selection (if supported by the browser), otherwise a row-oriented
         * text selection inside a table.
         *
         * @param {Function} iterator
         *  The iterator function that will be called for every table cell node
         *  covered by this selection. Receives the following parameters:
         *      (1) {HTMLTableCellElement} the visited DOM cell element,
         *      (2) {Number[]} its logical position (the last two elements in
         *          this array represent the row and column index of the cell),
         *      (3) {Number|Undefined} the row offset, relative to the first
         *          row in the rectangular cell range,
         *      (4) {Number|Undefined} the column offset, relative to the first
         *          column in the rectangular cell range.
         *  The last two parameters will be undefined, if the current selection
         *  is a text range in a table. If the iterator returns the Utils.BREAK
         *  object, the iteration process will be stopped immediately.
         *
         * @param {Object} [context]
         *  If specified, the iterator will be called with this context (the
         *  symbol 'this' will be bound to the context inside the iterator
         *  function).
         *
         * @returns {Utils.BREAK|Undefined}
         *  A reference to the Utils.BREAK object, if the iterator has returned
         *  Utils.BREAK to stop the iteration process, otherwise undefined.
         */
        this.iterateTableCells = function (iterator, context) {

            var // information about the cell range and containing table
                cellRangeInfo = this.getSelectedCellRange(),

                // the DOM cells
                firstCellInfo = null, lastCellInfo = null,
                // current cell, and its logical position
                cellInfo = null, cellNode = null, cellPosition = null,

                // row/column indexes for loops
                row = 0, col = 0;

            // check enclosing table, get its position
            if (!cellRangeInfo) {
                Utils.warn('Selection.iterateTableCells(): selection not contained in a single table');
                return Utils.BREAK;
            }

            // resolve position to closest table cell
            firstCellInfo = Position.getDOMPosition(cellRangeInfo.tableNode, cellRangeInfo.firstCellPosition, true);
            lastCellInfo = Position.getDOMPosition(cellRangeInfo.tableNode, cellRangeInfo.lastCellPosition, true);
            if (!firstCellInfo || !$(firstCellInfo.node).is('td') || !lastCellInfo || !$(lastCellInfo.node).is('td')) {
                Utils.error('Selection.iterateTableCells(): no table cells found for cell positions');
                return Utils.BREAK;
            }

            // visit all cells for rectangular cell selection mode
            if (cellRangeSelected) {

                // loop over all cells in the range
                for (row = 0; row < cellRangeInfo.height; row += 1) {
                    for (col = 0; col < cellRangeInfo.width; col += 1) {

                        // cell position relative to table
                        cellPosition = [cellRangeInfo.firstCellPosition[0] + row, cellRangeInfo.firstCellPosition[1] + col];
                        cellInfo = Position.getDOMPosition(cellRangeInfo.tableNode, cellPosition);

                        // cellInfo will be undefined, if current position is covered by a merged cell
                        if (cellInfo && $(cellInfo.node).is('td')) {
                            cellPosition = cellRangeInfo.tablePosition.concat(cellPosition);
                            if (iterator.call(context, cellInfo.node, cellPosition, row, col) === Utils.BREAK) {
                                return Utils.BREAK;
                            }
                        }
                    }
                }

            // otherwise: visit all cells row-by-row (text selection mode)
            } else {

                cellNode = firstCellInfo.node;
                while (cellNode) {

                    // visit current cell
                    cellPosition = Position.getOxoPosition(cellRangeInfo.tableNode, cellNode, 0);
                    cellPosition = cellRangeInfo.tablePosition.concat(cellPosition);
                    if (iterator.call(context, cellNode, cellPosition) === Utils.BREAK) { return Utils.BREAK; }

                    // last cell reached
                    if (cellNode === lastCellInfo.node) { return; }

                    // find next cell node (either next sibling, or first child
                    // of next row, but skip embedded tables)
                    cellNode = Utils.findNextNode(cellRangeInfo.tableNode, cellNode, 'td', DOM.TABLE_NODE_SELECTOR);
                }

                // in a valid DOM tree, there must always be valid cell nodes until
                // the last cell has been reached, so this point should never be reached
                Utils.error('Selection.iterateTableCells(): iteration exceeded end of selection');
                return Utils.BREAK;
            }
        };

        /**
         * Calls the passed iterator function for specific content nodes
         * (tables and paragraphs) selected by this selection instance. It is
         * possible to visit all paragraphs embedded in all covered tables and
         * nested tables, or to iterate on the 'shortest path' by visiting
         * tables exactly once if they are covered completely by the selection
         * range and skipping the embedded paragraphs and sub tables. If the
         * selection range end at the very beginning of a paragraph (before the
         * first character), this paragraph is not considered to be included in
         * the selected range.
         *
         * @param {Function} iterator
         *  The iterator function that will be called for every content node
         *  (paragraphs and tables) covered by this selection. Receives the
         *  following parameters:
         *      (1) {HTMLElement} the visited content node,
         *      (2) {Number[]} its logical position,
         *      (3) {Number|Undefined} the logical index of the first text
         *          component covered by the FIRST paragraph; undefined for
         *          all other paragraphs and tables (may point after the last
         *          existing child text component, if the selection starts at
         *          the very end of a paragraph),
         *      (4) {Number|Undefined} the logical index of the last child text
         *          component covered by the LAST paragraph (closed range);
         *          undefined for all other paragraphs and tables.
         *  If the selection represents a text cursor, the start position will
         *  exceed the end position by 1. Thus, a text cursor in an empty
         *  paragraph will be represented by the text range [0, -1]. If the
         *  iterator returns the Utils.BREAK object, the iteration process will
         *  be stopped immediately.
         *
         * @param {Object} [context]
         *  If specified, the iterator will be called with this context (the
         *  symbol 'this' will be bound to the context inside the iterator
         *  function).
         *
         * @param {Object} [options]
         *  A map of options to control the iteration. Supports the following
         *  options:
         *  @param {Boolean} [options.shortestPath=false]
         *      If set to true, tables that are covered completely by this
         *      selection will be visited, but their descendant components
         *      (paragraphs and embedded tables) will be skipped in the
         *      iteration process. By default, this method visits all
         *      paragraphs embedded in all tables and their sub tables, but
         *      does not visit the table objects. Has no effect for tables that
         *      contain the end paragraph, because these tables are not fully
         *      covered by the selection. Tables that contain the start
         *      paragraph will never be visited, because they start before the
         *      selection.
         *
         * @returns {Utils.BREAK|Undefined}
         *  A reference to the Utils.BREAK object, if the iterator has returned
         *  Utils.BREAK to stop the iteration process, otherwise undefined.
         */
        this.iterateContentNodes = function (iterator, context, options) {

            var // start node and offset (pass true to NOT resolve text spans to text nodes)
                startInfo = Position.getDOMPosition(rootNode, startPosition, true),
                // end node and offset (pass true to NOT resolve text spans to text nodes)
                endInfo = Position.getDOMPosition(rootNode, endPosition, true),

                // whether to iterate on shortest path (do not traverse into completely covered tables)
                shortestPath = Utils.getBooleanOption(options, 'shortestPath', false),

                // paragraph nodes containing the passed start and end positions
                firstParagraph = null, lastParagraph = null,
                // current content node while iterating
                contentNode = null;

            // visit the passed content node (paragraph or table); or table child nodes, if not in shortest-path mode
            function visitContentNode(contentNode) {

                var // each call of the iterator get its own position array (iterator is allowed to modify it)
                    position = Position.getOxoPosition(rootNode, contentNode),
                    // start text offset in first paragraph
                    startOffset = (contentNode === firstParagraph) ? _.last(startPosition) : undefined,
                    // end text offset in last paragraph (convert half-open range to closed range)
                    endOffset = (contentNode === lastParagraph) ? (_.last(endPosition) - 1) : undefined;

                // visit the content node, but not the last paragraph, if selection
                // does not start in that paragraph and ends before its beginning
                // (otherwise, it's a cursor in an empty paragraph)
                if ((contentNode === firstParagraph) || (contentNode !== lastParagraph) || (endOffset >= Position.getFirstTextNodePositionInParagraph(contentNode))) {
                    return iterator.call(context, contentNode, position, startOffset, endOffset);
                }
            }

            // find the first content node in passed root node (either table or embedded paragraph depending on shortest-path option)
            function findFirstContentNode(rootNode) {

                // in shortest-path mode, use first table or paragraph in cell,
                // otherwise find first paragraph which may be embedded in a sub table)
                return Utils.findDescendantNode(rootNode, shortestPath ? DOM.CONTENT_NODE_SELECTOR : DOM.PARAGRAPH_NODE_SELECTOR);
            }

            // find the next content node in DOM tree (either table or embedded paragraph depending on shortest-path option)
            function findNextContentNode(rootNode, contentNode, lastParagraph) {

                // find next content node in DOM tree (searches in own siblings, AND in other nodes
                // following the parent node, e.g. the next table cell, or paragraphs following the
                // containing table, etc.; but skips object nodes that may contain their own paragraphs)
                contentNode = Utils.findNextNode(rootNode, contentNode, DOM.CONTENT_NODE_SELECTOR, DOM.OBJECT_NODE_SELECTOR);

                // iterate into a table, if shortest-path option is off, or the end paragraph is inside the table
                while (DOM.isTableNode(contentNode) && (!shortestPath || (lastParagraph && contentNode.contains(lastParagraph)))) {
                    contentNode = Utils.findDescendantNode(contentNode, DOM.CONTENT_NODE_SELECTOR);
                }

                return contentNode;
            }

            // check validity of passed positions
            if (!startInfo || !startInfo.node || !endInfo || !endInfo.node) {
                Utils.error('Selection.iterateContentNodes(): invalid selection, cannot find first or last DOM node');
                return Utils.BREAK;
            }

            // find first and last paragraph node (also in table cell selection mode)
            firstParagraph = Utils.findClosestParent(rootNode, startInfo.node, DOM.PARAGRAPH_NODE_SELECTOR);
            lastParagraph = Utils.findClosestParent(rootNode, endInfo.node, DOM.PARAGRAPH_NODE_SELECTOR);
            if (!firstParagraph || !lastParagraph) {
                Utils.error('Selection.iterateContentNodes(): invalid selection, cannot find containing paragraph nodes');
                return Utils.BREAK;
            }

            // rectangular cell range selection
            if (cellRangeSelected) {

                // entire table selected
                if (shortestPath && tableSelected) {
                    return visitContentNode(this.getEnclosingTable());
                }

                // visit all table cells, iterate all content nodes according to 'shortest-path' option
                return this.iterateTableCells(function (cell) {
                    for (contentNode = findFirstContentNode(cell); contentNode; contentNode = findNextContentNode(cell, contentNode)) {
                        if (visitContentNode(contentNode) === Utils.BREAK) { return Utils.BREAK; }
                    }
                }, this);
            }

            // iterate through all paragraphs and tables until the end paragraph has been reached
            contentNode = firstParagraph;
            while (contentNode) {

                // visit current content node
                if (visitContentNode(contentNode) === Utils.BREAK) { return Utils.BREAK; }

                // end of selection reached
                if (contentNode === lastParagraph) { return; }

                // find next content node in DOM tree (next sibling paragraph or
                // table, or first node in next cell, or out of last table cell...)
                contentNode = findNextContentNode(rootNode, contentNode, lastParagraph);
            }

            // in a valid DOM tree, there must always be valid content nodes until end
            // paragraph has been reached, so this point should never be reached
            Utils.error('Selection.iterateContentNodes(): iteration exceeded end of selection');
            return Utils.BREAK;
        };

        /**
         * Calls the passed iterator function for specific nodes selected by
         * this selection instance. It is possible to visit all child nodes
         * embedded in all covered paragraphs (also inside tables and nested
         * tables), or to iterate on the 'shortest path' by visiting content
         * nodes (paragraphs or tables) exactly once if they are covered
         * completely by this selection and skipping the embedded paragraphs,
         * sub tables, and text contents.
         *
         * @param {Function} iterator
         *  The iterator function that will be called for every node covered by
         *  this selection. Receives the following parameters:
         *      (1) {HTMLElement} the visited DOM node object,
         *      (2) {Number[]} the logical start position of the visited node
         *          (if the node is a partially covered text span, this is the
         *          logical position of the first character covered by the
         *          selection, NOT the start position of the span itself),
         *      (3) {Number} the relative start offset inside the visited node
         *          (usually 0; if the visited node is a partially covered text
         *          span, this offset is relative to the first character in the
         *          span covered by the selection),
         *      (4) {Number} the logical length of the visited node (1 for
         *          content nodes, character count of the covered part of text
         *          spans).
         *  If the iterator returns the Utils.BREAK object, the iteration
         *  process will be stopped immediately.
         *
         * @param {Object} [context]
         *  If specified, the iterator will be called with this context (the
         *  symbol 'this' will be bound to the context inside the iterator
         *  function).
         *
         * @param {Object} [options]
         *  A map of options to control the iteration. Supports the following
         *  options:
         *  @param {Boolean} [options.shortestPath=false]
         *      If set to true, tables and paragraphs that are covered
         *      completely by this selection will be visited directly and once,
         *      and their descendant components will be skipped in the
         *      iteration process. By default, this method visits the child
         *      nodes of all paragraphs and tables embedded in tables. Has no
         *      effect for tables that contain the end paragraph, because these
         *      tables are not fully covered by the selection. Tables that
         *      contain the start paragraph will never be visited, because they
         *      start before the selection.
         *  @param {Boolean} [options.split=false]
         *      If set to true, the first and last text span not covered
         *      completely by this selection will be split before the iterator
         *      function will be called. The iterator function will always
         *      receive a text span that covers the contained text completely.
         *
         * @returns {Utils.BREAK|Undefined}
         *  A reference to the Utils.BREAK object, if the iterator has returned
         *  Utils.BREAK to stop the iteration process, otherwise undefined.
         */
        this.iterateNodes = function (iterator, context, options) {

            var // whether to iterate on shortest path (do not traverse into completely covered content nodes)
                shortestPath = Utils.getBooleanOption(options, 'shortestPath', false),
                // split partly covered text spans before visiting them
                split = Utils.getBooleanOption(options, 'split', false),

                // start node and offset
                startInfo = null;

            // special case 'simple cursor': visit the text span
            if (this.isTextCursor()) {

                // start node and offset (pass true to NOT resolve text spans to text nodes)
                startInfo = Position.getDOMPosition(rootNode, startPosition, true);
                if (!startInfo || !startInfo.node) {
                    Utils.error('Selection.iterateNodes(): invalid selection, cannot find DOM node at start position ' + JSON.stringify(startPosition));
                    return Utils.BREAK;
                }

                // if located at the beginning of a component: use end of preceding text span if available
                if ((startInfo.offset === 0) && DOM.isPortionSpan(startInfo.node.previousSibling)) {
                    startInfo.node = startInfo.node.previousSibling;
                    startInfo.offset = startInfo.node.firstChild.nodeValue.length;
                }

                // visit the text component node (clone, because iterator is allowed to change passed position)
                return iterator.call(context, startInfo.node, _.clone(startPosition), startInfo.offset, 0);
            }

            // iterate the content nodes (paragraphs and tables) covered by the selection
            return this.iterateContentNodes(function (contentNode, position, startOffset, endOffset) {

                var // single-component selection
                    singleComponent = false,
                    // text span at the very beginning or end of a paragraph
                    textSpan = null;

                // visit fully covered content node in 'shortest-path' mode
                if (shortestPath && !_.isNumber(startOffset) && !_.isNumber(endOffset)) {
                    return iterator.call(context, contentNode, position, 0, 1);
                }

                // if selection starts after the last character in a paragraph, visit the last text span
                if (_.isNumber(startOffset) && (startOffset >= Position.getLastTextNodePositionInParagraph(contentNode))) {
                    if ((textSpan = DOM.findLastPortionSpan(contentNode))) {
                        return iterator.call(context, textSpan, position.concat([startOffset]), textSpan.firstChild.nodeValue.length, 0);
                    }
                    Utils.error('Selection.iterateNodes(): cannot find last text span in paragraph at position ' + JSON.stringify(position));
                    return Utils.BREAK;
                }

                // visit covered text components in the paragraph
                singleComponent = _.isNumber(startOffset) && _.isNumber(endOffset) && (startOffset === endOffset);
                return Position.iterateParagraphChildNodes(contentNode, function (node, nodeStart, nodeLength, nodeOffset, offsetLength) {

                    // skip floating objects (unless they are selected directly) and helper nodes
                    if (DOM.isTextSpan(node) || DOM.isTextComponentNode(node) || DOM.isInlineObjectNode(node) || (singleComponent && DOM.isFloatingObjectNode(node))) {
                        // create local copy of position, iterator is allowed to change the array
                        return iterator.call(context, node, position.concat([nodeStart + nodeOffset]), nodeOffset, offsetLength);
                    }

                // options for Position.iterateParagraphChildNodes(): visit empty text spans
                }, this, { allNodes: true, start: startOffset, end: endOffset, split: split });

            // options for Selection.iterateContentNodes()
            }, this, { shortestPath: shortestPath });

        };

        this.destroy = function () {
            this.events.destroy();
        };

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

    } // class Selection

    // export =================================================================

    return Selection;

});
