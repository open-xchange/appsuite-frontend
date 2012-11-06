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
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/position'
    ], function (Utils, DOM, Position) {

    'use strict';

    // class Selection ========================================================

    /**
     * An instance of this class represents a selection in the edited document,
     * consisting of a logical start and end position representing a half-open
     * text range, or a rectangular table cell range (FireFox only).
     *
     * @constructor
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node of the document. If this object is a jQuery collection,
     *  uses the first node it contains.
     *
     * @param {Number[]} startPosition
     *  The logical position of the first component in the selected range.
     *
     * @param {Number[]} endPosition
     *  The logical position following the last component in the selected range
     *  (half-open range).
     */
    function Selection(rootNode, startPosition, endPosition) {

        this.startPaM = new Position(_.isArray(startPosition) ? startPosition : [0, 0]);
        this.endPaM = new Position(_.isArray(endPosition) ? endPosition : this.startPaM.oxoPosition);

        // methods ------------------------------------------------------------

        this.adjust = function () {
            if (Utils.compareNumberArrays(this.startPaM.oxoPosition, this.endPaM.oxoPosition) > 0) {
                var tmp = this.startPaM;
                this.startPaM = this.endPaM;
                this.endPaM = tmp;
            }
        };

        this.isTextCursor = function () {
            return !this.isTableCellSelection() && _.isEqual(this.startPaM.oxoPosition, this.endPaM.oxoPosition);
        };

        this.hasRange = function () {
            return !_.isEqual(this.startPaM.oxoPosition, this.endPaM.oxoPosition);
        };

        /**
         * Returns whether this selection object represents a rectangular cell
         * selection in a table element.
         */
        this.isTableCellSelection = function () {
            return (this.startPaM.selectedNodeName === 'TR') && (this.endPaM.selectedNodeName === 'TR');
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
            return Position.hasSameParentComponent(this.startPaM.oxoPosition, this.endPaM.oxoPosition, parentLevel);
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
            return this.hasSameParentComponent() && (_.last(this.startPaM.oxoPosition) === _.last(this.endPaM.oxoPosition) - 1);
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

            var index = 0, length = Math.min(this.startPaM.oxoPosition.length, this.endPaM.oxoPosition.length);

            // compare all array elements but the last ones
            while ((index < length) && (this.startPaM.oxoPosition[index] === this.endPaM.oxoPosition[index])) {
                index += 1;
            }

            return this.startPaM.oxoPosition.slice(0, index);
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
         * Converts this selection to an array of DOM.Range objects suitable
         * for the internal browser selection.
         *
         * @returns {DOM.Range[]}
         *  The DOM ranges representing the current text selection.
         */
        this.getTextSelectionRanges = function () {

            var startPoint = Position.getDOMPosition(rootNode, this.startPaM.oxoPosition),
                endPoint = Position.getDOMPosition(rootNode, this.endPaM.oxoPosition);

            // DOM selection is always an array of text ranges
            // TODO: fallback to HOME position in document instead of empty array?
            return (startPoint && endPoint) ? [new DOM.Range(startPoint, endPoint)] : [];
        };

        /**
         * Converts this table cell selection to an array of DOM.Range objects
         * suitable for the internal browser selection.
         *
         * @returns {DOM.Range[]}
         *  The DOM ranges representing the current table cell selection.
         */
        this.getCellSelectionRanges = function () {

            var ranges = [];

            // visit each cell and create a DOM.Range instance
            this.iterateTableCells(function (cell) {
                ranges.push(DOM.Range.createRangeForNode(cell));
            });

            return ranges;
        };

        /**
         * Calls the passed iterator function for each table cell, if this
         * selection instance represents a rectangular table cell selection.
         * Does nothing, if this selection is not a table cell selection.
         *
         * @param {Function} iterator
         *  The iterator function that will be called for every table cell node
         *  covered by this selection. Receives the DOM cell node as first
         *  parameter, and its logical start position as second parameter. If
         *  the iterator returns the Utils.BREAK object, the iteration process
         *  will be stopped immediately.
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

            // do nothing, if the passed selection is not a rectangular cell selection
            if (!this.isTableCellSelection()) { return; }

            var // position of top-left and bottom-right cell
                firstPosition = _.clone(this.startPaM.oxoPosition),
                lastPosition = _.clone(this.endPaM.oxoPosition),
                // the DOM cells
                firstCell = null, lastCell = null,
                // row and column indexes
                firstRow = 0, lastRow = 0, row = 0, firstCol = 0, lastCol = 0, col = 0,
                // current cell, and its logical position
                cellInfo = null, cellPosition = null;

            // if the first content node of a cell is a sub-table instead of a
            // paragraph, selection of this cell points into this sub-table
            // -> go back to the outer cell
            while (firstPosition.length > lastPosition.length) { firstPosition.pop(); }
            while (firstPosition.length < lastPosition.length) { lastPosition.pop(); }

            // resolve position to closest table cell
            firstCell = Position.getLastNodeFromPositionByNodeName(rootNode, firstPosition, 'td');
            lastCell = Position.getLastNodeFromPositionByNodeName(rootNode, lastPosition, 'td');
            if (!firstCell || !lastCell) {
                Utils.warn('Selection.iterateTableCells(): no table cells found for passed selection');
                return;
            }

            // get logical positions of the cells, and their row/column indexes
            firstPosition = Position.getOxoPosition(rootNode, firstCell);
            lastPosition = Position.getOxoPosition(rootNode, lastCell);
            firstCol = firstPosition.pop();
            firstRow = firstPosition.pop();
            lastCol = lastPosition.pop();
            lastRow = lastPosition.pop();

            // cells must be located in the same table
            if (!_.isEqual(firstPosition, lastPosition)) {
                Utils.warn('Selection.iterateTableCells(): top-left cell and bottom-right cell in different tables');
                return;
            }

            // visit all cells
            for (row = firstRow; row <= lastRow; row += 1) {
                for (col = firstCol; col <= lastCol; col += 1) {
                    cellPosition = firstPosition.concat([row, col]);
                    cellInfo = Position.getDOMPosition(rootNode, cellPosition);
                    if (cellInfo && $(cellInfo.node).is('td')) {
                        if (iterator.call(context, cellInfo.node, cellPosition) === Utils.BREAK) { return Utils.BREAK; }
                    } else {
                        Utils.warn('Selection.iterateTableCells(): cannot find cell at position ' + JSON.stringify(cellPosition));
                        return;
                    }
                }
            }
        };

        /**
         * Calls the passed iterator function for specific content nodes
         * (tables and paragraphs) selected by this selection instance. It is
         * possible to visit all paragraphs embedded in all covered tables and
         * nested tables, or to iterate on the 'shortest path' by visiting
         * tables exactly once if they are covered completely by the selection
         * range and skipping the embedded paragraphs and sub tables.
         *
         * @param {Function} iterator
         *  The iterator function that will be called for every content node
         *  (paragraphs and tables) covered by this selection. Receives the DOM
         *  node object as first parameter, its logical position as second
         *  parameter, the logical index of the first text component covered by
         *  the first paragraph in the selection as third parameter (undefined
         *  for all other component nodes but the first paragraph, may point
         *  after the last existing child text component, if the selection
         *  starts at the very end of a paragraph), and the logical index of
         *  the last child text component covered by the last paragraph in the
         *  selection as fourth parameter (closed range, undefined for all
         *  other component nodes but the last paragraph, may be -1, if the
         *  selection ends at the very beginning of a paragraph). If the
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

            var // the logical start position in the passed selection
                startPosition = this.startPaM.oxoPosition,
                // the logical end position in the passed selection
                endPosition = this.endPaM.oxoPosition,

                // start node and offset (pass true to NOT resolve text spans to text nodes)
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
                    // end text offset in last paragraph (from half-open range to closed range)
                    endOffset = (contentNode === lastParagraph) ? (_.last(endPosition) - 1) : undefined;

                // visit the content node
                return iterator.call(context, contentNode, position, startOffset, endOffset);
            }

            // find the next content node in DOM tree (either table or embedded paragraph depending on shortest-path option)
            function findNextContentNode(rootNode, contentNode, lastParagraph) {

                // find next content node in DOM tree (searches in siblings of the own
                // parent, AND in other nodes following the parent node, e.g. the next
                // table cell, or paragraphs following the containing table, etc.)
                contentNode = Utils.findNextNode(rootNode, contentNode, DOM.CONTENT_NODE_SELECTOR);

                // iterate into a table, if shortest-path option is off, or the end paragraph is inside the table
                while (DOM.isTableNode(contentNode) && (!shortestPath || (lastParagraph && contentNode.contains(lastParagraph)))) {
                    contentNode = Utils.findDescendantNode(contentNode, DOM.CONTENT_NODE_SELECTOR);
                }

                return contentNode;
            }

            // check validity of passed positions
            if (!startInfo || !startInfo.node || !endInfo || !endInfo.node) {
                Utils.warn('Selection.iterateContentNodes(): invalid selection');
                return;
            }

            // TODO! entire table selected

            // table cell selection (FireFox only): visit all table cells
            if (this.isTableCellSelection()) {
                return this.iterateTableCells(function (cell) {

                    // iterate all content nodes according to 'shortest-path' option
                    contentNode = Utils.findDescendantNode(cell, DOM.CONTENT_NODE_SELECTOR, { children: true });
                    while (contentNode) {

                        // visit current content node
                        if (visitContentNode(contentNode) === Utils.BREAK) { return Utils.BREAK; }

                        // iterate as long as there are more content nodes in the cell
                        contentNode = findNextContentNode(cell, contentNode);
                    }
                }, this);
            }

            // find first and last paragraph node
            firstParagraph = startInfo.node.parentNode;
            lastParagraph = endInfo.node.parentNode;
            if (!DOM.isParagraphNode(firstParagraph) || !DOM.isParagraphNode(lastParagraph)) {
                Utils.warn('Selection.iterateContentNodes(): text selection expected');
                return;
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

                // in a valid DOM tree, there must always be valid content nodes until end paragraph has been reached
                if (!contentNode) {
                    Utils.error('Selection.iterateContentNodes(): iteration exceeded selection');
                }
            }

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
         *  this selection. Receives the DOM node object as first parameter,
         *  its logical start position as second parameter, and the logical
         *  length of the element as third parameter. Position and length will
         *  cover only a part of a text span element, if the text span is
         *  partly covered by the start or end position of the selection. If
         *  the iterator returns the Utils.BREAK object, the iteration process
         *  will be stopped immediately.
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
                startPosition = null, startInfo = null;

            // special case 'simple cursor': visit the text span
            if (this.isTextCursor()) {

                // clone cursor position (iterator is allowed to change it)
                startPosition = _.clone(this.startPaM.oxoPosition);

                // start node and offset (pass true to NOT resolve text spans to text nodes)
                startInfo = Position.getDOMPosition(rootNode, startPosition, true);
                if (!startInfo || !startInfo.node) {
                    Utils.warn('Selection.iterateNodes(): invalid selection');
                    return;
                }

                // if located at the beginning of a component: use end of preceding text span if available
                if ((startInfo.offset === 0) && DOM.isPortionSpan(startInfo.node.previousSibling)) {
                    startInfo.node = startInfo.node.previousSibling;
                }

                // visit the text component node
                return iterator.call(context, startInfo.node, startPosition, 0);
            }

            // iterate the content nodes (paragraphs and tables) covered by the selection
            return this.iterateContentNodes(function (contentNode, position, startOffset, endOffset) {

                var // single-component selection
                    singleComponent = false,
                    // text span at the very beginning or end of a paragraph
                    textSpan = null;

                // visit fully covered content node in 'shortest-path' mode
                if (shortestPath && !_.isNumber(startOffset) && !_.isNumber(endOffset)) {
                    return iterator.call(context, contentNode, position, 1);
                }

                // if selection starts after the last character in a paragraph, visit the last text span
                if (_.isNumber(startOffset) && (startOffset >= Position.getLastTextNodePositionInParagraph(contentNode))) {
                    textSpan = DOM.findLastPortionSpan(contentNode);
                    return textSpan ? iterator.call(context, textSpan, position.concat([startOffset]), 0) : undefined;
                }

                // if selection ends before the first character in a paragraph, visit the first text span
                if (_.isNumber(endOffset) && (endOffset < Position.getFirstTextNodePositionInParagraph(contentNode))) {
                    textSpan = DOM.findFirstPortionSpan(contentNode);
                    return textSpan ? iterator.call(context, textSpan, position.concat([endOffset + 1]), 0) : undefined;
                }

                // visit covered text components in the paragraph
                singleComponent = _.isNumber(startOffset) && _.isNumber(endOffset) && (startOffset === endOffset);
                return Position.iterateParagraphChildNodes(contentNode, function (node, nodeStart, nodeLength, nodeOffset, offsetLength) {

                    // skip floating objects (unless they are selected directly) and helper nodes
                    if (DOM.isTextSpan(node) || DOM.isTextComponentNode(node) || DOM.isInlineObjectNode(node) || (singleComponent && DOM.isFloatingObjectNode(node))) {
                        // create local copy of position, iterator is allowed to change the array
                        return iterator.call(context, node, position.concat([nodeStart + nodeOffset]), offsetLength);
                    }

                // options for Position.iterateParagraphChildNodes(): visit empty text spans
                }, this, { allNodes: true, start: startOffset, end: endOffset, split: split });

            // options for Selection.iterateContentNodes()
            }, this, { shortestPath: shortestPath });

        };

    } // class Selection

    // export =================================================================

    return Selection;

});
