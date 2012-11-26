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

define('io.ox/office/editor/position',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom'
    ], function (Utils, DOM) {

    'use strict';

    // static class Position ==================================================

    var Position = {};

    // static methods ---------------------------------------------------------

    /**
     * Creates a clone of the passed logical position and appends the specified
     * index. The passed array object will not be changed.
     *
     * @param {Number[]} position
     *  The initial logical position.
     *
     * @param {Number} [index=0]
     *  The value that will be appended to the new position.
     *
     * @returns {Number[]}
     *  A clone of the passed logical position, with the specified start value
     *  appended.
     */
    Position.appendNewIndex = function (position, index) {
        position = _.clone(position);
        position.push(_.isNumber(index) ? index : 0);
        return position;
    };

    /**
     * Creates a clone of the passed logical position and increases the last
     * element of the array by the specified value. The passed array object
     * will not be changed.
     *
     * @param {Number[]} position
     *  The initial logical position.
     *
     * @param {Number} [increment=1]
     *  The value that will be added to the last element of the position.
     *
     * @returns {Number[]}
     *  A clone of the passed logical position, with the last element
     *  increased.
     */
    Position.increaseLastIndex = function (position, increment) {
        position = _.clone(position);
        position[position.length - 1] += (_.isNumber(increment) ? increment : 1);
        return position;
    };

    /**
     * This function calculates the logical position from dom positions.
     * Receiving a dom position consisting of a dom node and optionally
     * an offset, it calculates the logical position (oxoPosition) that
     * is an array of integer values.
     * The offset is only used for text nodes, where the logical position
     * can be shifted with the offset.
     * So contrary to the function getTextLevelOxoPosition, this function
     * does not always return a text level oxo position (a full logical
     * position), but it can also return positions of elements like p, table,
     * tr, th and td.
     *
     * @param {jQuery} maindiv
     *  The jQuery object of a DIV node, that is the frame for the complete
     *  search and calculation process. No dom position outside of this
     *  maindiv can be calculated.
     *
     * @param {Node|jQuery} node
     *  The dom node, whose logical position will be calculated. If this object
     *  is a jQuery collection, uses the first node it contains.
     *
     * @param {Number} offset
     *  An additional offset, that can be used to modify the last position
     *  inside the logical position array. This is typically only useful
     *  for text nodes.

     * @returns {Number[]}
     *  The logical position.
     */
    Position.getOxoPosition = function (maindiv, node, offset) {

        // Helper function to calculate sum of colspans of cells
        function getColspanSum(cellSelection) {
            var sum = 0;
            cellSelection.each(function () {
                sum += Utils.getElementAttributeAsInteger(this, 'colspan', 1);
            });
            return sum;
        }

        // convert to DOM node object
        node = Utils.getDomNode(node);

        // Checking offset for text nodes
        if ((node.nodeType === 3) && !_.isNumber(offset)) {
            Utils.error('Position.getOxoPosition(): Invalid start position: text node without offset');
            return;
        }

        if (offset < 0) {
            Utils.error('Position.getOxoPosition(): Invalid DOM position. Offset < 0 : ' + offset + ' . Node: ' + node.nodeName + ',' + node.nodeType);
            return;
        }

        // Check, if the selected node is a descendant of the maindiv
        if (!Utils.containsNode(maindiv, node)) {
            Utils.error('Position.getOxoPosition(): Invalid DOM position. It is not part of the editor DIV: ! Offset : ' + offset + ' . Node: ' + node.nodeName + ',' + node.nodeType);
            return;
        }

        // always use the parent element of a text node
        if (node.nodeType === 3) {
            node = node.parentNode;
        }

        // Starting to calculate the logical position
        var oxoPosition = [],
            evaluateCharacterPosition = DOM.isTextSpan(node) || DOM.isTextComponentNode(node) || DOM.isDrawingNode(node) || $(node).is('img'),
            characterPositionEvaluated = false;

        // currently supported elements: 'div.p', 'table', 'td', 'tr'
        for (; node && (node !== maindiv.get(0)); node = node.parentNode) {
            if (DOM.isContentNode(node) || $(node).is('tr, td')) {
                // if ($(node).is('td, th')) {
                //     oxoPosition.unshift(getColspanSum($(node).prevAll()));  // zero based
                // } else {
                //     oxoPosition.unshift($(node).prevAll().length);  // zero based
                // }
                oxoPosition.unshift($(node).index());  // zero based
                evaluateCharacterPosition = false;
            }
            if (evaluateCharacterPosition) {
                // move up until we are a child node of a paragraph
                while (!DOM.isParagraphNode(node.parentNode)) {
                    offset = 0;
                    node = node.parentNode;
                }
                offset += Position.getStartOfParagraphChildNode(node);
                characterPositionEvaluated = true;
            }
        }

        if (characterPositionEvaluated) {
            oxoPosition.push(offset);
        }

        return oxoPosition;
    };

    /**
     * This function calculates the logical position from DOM positions.
     * Receiving a DOM position consisting of a DOM node and an offset, it
     * calculates the logical position that is an array of
     * integer values. The calculated logical position is always a valid text
     * level position. This means, that even if the DOM position is a DIV, a TR
     * or a similar node type, the logical position describes always the
     * position of a text node or image or field.
     *
     * @param {DOM.Point} domposition
     *  The DOM position, consisting of dom node and offset, whose logical
     *  position will be calculated.
     *
     * @param {jQuery} maindiv
     *  The jQuery object of a DIV node, that is the frame for the complete
     *  search and calculation process. No dom position outside of this
     *  maindiv can be calculated.
     *
     * @param {Boolean} isEndPoint
     *  The information, if the specified DOM position is the end point
     *  of a range. This is important for some calculations, where the
     *  DOM node is a row inside a table.
     *
     * @returns {Number[]}
     *  The calculated logical position.
     */
    Position.getTextLevelOxoPosition = function (domposition, maindiv, isEndPoint) {

        var node = domposition.node,
            offset = domposition.offset;

        isEndPoint = isEndPoint ? true : false;

        // check input values
        if (! node) {
            Utils.error('Position.getTextLevelOxoPosition(): Invalid DOM position. Node not defined');
            return;
        }

        // 1. Handling all selections, in which the node is below paragraph level

        if ((DOM.isEmptySpan(node)) || (DOM.isTextNodeInTextComponent(node))) {
            // empty spans must not have an offset (special case for spans behind tabs)
            // or text nodes of fields/tabs are embedded in <span> elements in the <div>
            offset = 0;
        } else if ((node.nodeType === 3) && (DOM.isListLabelNode(node.parentNode))) {
            node = node.parentNode.nextSibling;
            offset = 0;
        }

        if (DOM.isPageContentNode(node)) {
            // using table cell node instead of divs inside the table cell
            node = $(node).closest(DOM.PAGE_NODE_SELECTOR)[0];
        }

        if (DOM.isDrawingNode(node.parentNode)) {
            // inside the contents of a drawing
            node = node.parentNode;
        }

        if (DOM.isDrawingNode(node)) {
            offset = 0;
        }

        if (DOM.isResizeNode(node) || DOM.isCellContentNode(node)) {
            // using table cell node instead of divs inside the table cell
            node = $(node).closest('td')[0];
        }

        // 2. Handling all selections, in which the node is above paragraph level

        // Sometimes (double click in FireFox) a complete paragraph is selected with DIV + Offset 3 and DIV + Offset 4.
        // These DIVs need to be converted to the correct paragraph first.
        // Also cells in columns have to be converted at this point.
        if (DOM.isParagraphNode(node) || DOM.isPageNode(node) || $(node).is('tr, td')) {

            var newNode = Position.getTextNodeFromCurrentNode(node, offset, isEndPoint);

            if (newNode) {
                node = newNode.node;
                offset = newNode.offset;
            } else {
                Utils.error('Position.getTextLevelOxoPosition(): Failed to determine text node from node: ' + node.nodeName + " with offset: " + offset);
                return;
            }

        }

        // 4. Calculating the logical position for the specified text node, span, or image
        return Position.getOxoPosition(maindiv, node, offset);
    };

    /**
     * This function calculates a logical selection consisting of two
     * logical positions for a specified dom position. Using the boolean
     * parameter useRangeNode it is possible to switch between the
     * selection in which the endPosition describes the final character
     * of the selection (useRangeMode === false) and that selection, in
     * which the end position is a position behind the last character of
     * the selection.
     * For all nodes, that describe dom positions that are not on text level,
     * like p, table, td, ... the startposition and endposition are equal.
     *
     * @param {jQuery} maindiv
     *  The jQuery object of a DIV node, that is the frame for the complete
     *  search and calculation process. No dom position outside of this
     *  maindiv can be calculated.
     *
     * @param {Node} node
     *  The dom node, whose logical position will be calculated.
     *
     * @param {Boolean} useRangeMode
     *  A boolean value that can be used to switch the endposition between
     *  a 'range' mode (end position behind the final character) and a
     *  'position' mode (end position points to the final character).
     *
     * @returns {Object}
     *  An object containing the attribute 'start' with the logical start
     *  position, and an attribute 'end' with the logical end position of the
     *  passed node.
     */
    Position.getPositionRangeForNode = function (maindiv, node, useRangeMode) {

        var // logical start position of the passed node
            startPosition = Position.getOxoPosition(maindiv, node, 0),
            // logical end position of the passed node
            endPosition = _.clone(startPosition),
            // logical length of the node
            length = DOM.isPortionSpan(node) ? Utils.getDomNode(node).firstChild.nodeValue.length : 1,
            // open/close range offset
            offset = ((useRangeMode === undefined) || (useRangeMode !== true)) ? 1 : 0;

        endPosition[endPosition.length - 1] += (length - offset);
        return { start: startPosition, end: endPosition };
    };

    /**
     * The central function to calculate a dom position from a logical
     * position. Receiving a logical position (oxoPosition) together with
     * the start node, the current dom node and the corresponding offset
     * are determined. This information is stored in the DOM.Point object.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} oxoPosition
     *  The logical position.
     *
     * @param {Boolean} forcePositionCounting
     *  A boolean value that can be used to switch between range counting (false)
     *  and direct position counting (true).
     *
     * @returns {DOM.Point}
     *  The calculated dom position consisting of dom node and offset.
     *  Offset is only set for text nodes, otherwise it is undefined.
     */
    Position.getDOMPosition = function (startnode, oxoPosition, forcePositionCounting) {

        var oxoPos = _.copy(oxoPosition, true),
            node = startnode,
            offset = null;

        forcePositionCounting = forcePositionCounting ? true : false;

        if (!_.isArray(oxoPosition)) {
            Utils.error('Position.getDOMPosition(): invalid/missing logical position');
            return;
        }

        while (oxoPos.length > 0) {

            var returnObj = Position.getNextChildNode(node, oxoPos.shift());

            // child node of a paragraph: resolve element to DOM text node
            if (!forcePositionCounting && returnObj && returnObj.node && DOM.isParagraphNode(returnObj.node.parentNode)) {
                returnObj = Position.getTextSpanFromNode(returnObj);
            }

            if (returnObj && returnObj.node) {
                node = returnObj.node;
                if (_.isNumber(returnObj.offset)) {
                    offset = returnObj.offset;
                }
            } else {
                return;
            }
        }

        return new DOM.Point(node, offset);
    };

    /**
     * Tries to get a DOM element from the specified logical position. The
     * passed position must match the passed selector. Otherwise, a warning
     * will be printed to the debug console.
     *
     * @param {jQuery} startnode
     *  The list of top-level content nodes.
     *
     * @param {Number[]} position
     *  The logical position of the target element.
     *
     * @param {String|Function|Node|jQuery} selector
     *  A jQuery selector that will be used to match the element at the
     *  specified position. The selector will be passed to the jQuery method
     *  jQuery.is() for each node. If this selector is a function, it will be
     *  called with the current DOM node bound to the symbol 'this'. See the
     *  jQuery API documentation at http://api.jquery.com/is for details.
     *
     * @returns {HTMLElement|Null}
     *  The DOM element at the passed logical position, if it matches the
     *  passed selector, otherwise null.
     */
    Position.getSelectedElement = function (startnode, position, selector) {

        var // the DOM node located at the passed position
            domPos = Position.getDOMPosition(startnode, position, true);

        if (domPos && domPos.node && $(domPos.node).is(selector)) {
            return domPos.node;
        }

        Utils.warn('Position.getSelectedElement(): expected element not found at position ' + JSON.stringify(position) + '.');
        return null;
    };

    /**
     * Tries to get a DOM paragraph element from the specified logical
     * position. The passed position must point to a paragraph element.
     * Otherwise, a warning will be printed to the debug console.
     *
     * @param {jQuery} startnode
     *  The list of top-level content nodes.
     *
     * @param {Number[]} position
     *  The logical position of the target paragraph element.
     *
     * @returns {HTMLElement|Null}
     *  The DOM paragraph element at the passed logical position, if existing,
     *  otherwise null.
     */
    Position.getParagraphElement = function (startnode, position) {
        return Position.getSelectedElement(startnode, position, DOM.PARAGRAPH_NODE_SELECTOR);
    };

    /**
     * Tries to get a DOM table element from the specified logical position.
     * The passed position must point to a table element. Otherwise, a warning
     * will be printed to the debug console.
     *
     * @param {jQuery} startnode
     *  The list of top-level content nodes.
     *
     * @param {Number[]} position
     *  The logical position of the target table element.
     *
     * @returns {HTMLTableElement|Null}
     *  The DOM table element at the passed logical position, if existing,
     *  otherwise null.
     */
    Position.getTableElement = function (startnode, position) {
        return Position.getSelectedElement(startnode, position, DOM.TABLE_NODE_SELECTOR);
    };

    /**
     * Tries to get a DOM table row element from the specified logical
     * position. The passed position must point to a table row element.
     * Otherwise, a warning will be printed to the debug console.
     *
     * @param {jQuery} startnode
     *  The list of top-level content nodes.
     *
     * @param {Number[]} position
     *  The logical position of the target table row element.
     *
     * @returns {HTMLTableRowElement|Null}
     *  The DOM table row element at the passed logical position, if existing,
     *  otherwise null.
     */
    Position.getTableRowElement = function (startnode, position) {
        var table = Position.getTableElement(startnode, position.slice(0, -1)),
            tableRow = table && DOM.getTableRows(table).get(position[position.length - 1]);
        if (table && !tableRow) {
            Utils.warn('Position.getTableRowElement(): expected element not found at position ' + JSON.stringify(position) + '.');
        }
        return tableRow || null;
    };

    /**
     * Tries to get a DOM table cell element from the specified logical
     * position. The passed position must point to a table cell element.
     * Otherwise, a warning will be printed to the debug console.
     *
     * @param {jQuery} startnode
     *  The list of top-level content nodes.
     *
     * @param {Number[]} position
     *  The logical position of the target table cell element.
     *
     * @returns {HTMLTableCellElement|Null}
     *  The DOM table cell element at the passed logical position, if existing,
     *  otherwise null.
     */
    Position.getTableCellElement = function (startnode, position) {
        var tableRow = Position.getTableRowElement(startnode, position.slice(0, -1)),
            tableCell = tableRow && $(tableRow).children('td').get(position[position.length - 1]);
        if (tableRow && !tableCell) {
            Utils.warn('Position.getTableCellElement(): expected element not found at position ' + JSON.stringify(position) + '.');
        }
        return tableCell || null;
    };

    /**
     * Helper function for Position.getTextLevelOxoPosition. If the node is not
     * a text node, this function determines the correct text node, that
     * is used for calculation of the logical position instead of the
     * specified node. This could be a 'div.page', 'div.p', 'table', ... . It is
     * often browser dependent, which node type is used after a double
     * or a triple click.
     *
     * @param {Node} node
     *  The dom node, whose logical position will be calculated.
     *
     * @param {Number} offset
     *  The offset of the dom node, whose logical position will be
     *  calculated.
     *
     * @param {Boolean} isEndPoint
     *  The information, if the specified domposition is the end point
     *  of a range. This is important for some calculations, where the
     *  dom node is a row inside a table.
     *
     * @returns {DOM.Point}
     *  The text node, that will be used in Position.getTextLevelOxoPosition
     *  for the calculation of the logical position.
     */
    Position.getTextNodeFromCurrentNode = function (node, offset, isEndPoint) {

        var useFirstTextNode = true,  // can be false for final child in a paragraph
            usePreviousCell = false,
            foundValidNode = false,
            localNode = node.childNodes[offset], // offset can be zero for start points but too high for end points
            offsetSave = offset;

        offset = 0;

        if ((isEndPoint) && ($(node).is('tr'))) {
            usePreviousCell = true;
        }

        if ((isEndPoint) && (localNode) && DOM.isDrawingNode(localNode.previousSibling)) {
            usePreviousCell = true;
        }

        if ((! localNode) || (usePreviousCell)) {
            localNode = node.childNodes[offsetSave - 1];
            useFirstTextNode = false;
        }

        // special handling for dummy text node, use last preceding text node instead
        if (DOM.isDummyTextNode(localNode)) {
            localNode = localNode.previousSibling;
            useFirstTextNode = false;
        }

        // setting some properties for drawing nodes or text component nodes like fields
        if ((DOM.isDrawingNode(localNode)) || (DOM.isTextComponentNode(localNode))) {
            foundValidNode = true;  // drawing nodes are valid
            offset = 0;
        }

        // checking, if a valid node was already found
        if ((localNode) && (localNode.nodeType === 3)) {
            foundValidNode = true;  // text nodes are valid
        }

        var foundNode = localNode;

        if (! foundValidNode) {
            // find the first or last text node contained in the element
            if (localNode && (localNode.nodeType !== 3)) {
                if (DOM.isPortionSpan(localNode)) {
                    foundNode = Utils.findDescendantNode(localNode, function () { return DOM.isTextNodeInPortionSpan(this); }, { reverse: !useFirstTextNode });
                    if (foundNode) {
                        localNode = foundNode;
                    }
                } else {
                    foundNode = Utils.findDescendantNode(localNode, function () { return DOM.isPortionSpan(this); }, { reverse: !useFirstTextNode });
                    if (foundNode) {
                        localNode = foundNode = foundNode.firstChild;
                    }
                }
            }
        }

        if (! foundNode) {
            var nodeName = localNode ? localNode.nodeName : '';
            Utils.error('Position.getTextNodeFromCurrentNode(): Failed to determine text node from current node! (useFirstTextNode: ' + useFirstTextNode + " : " + nodeName + ')');
            return;
        }

        // getting offset for text nodes
        if (localNode.nodeType === 3) {
            offset = useFirstTextNode ? 0 : foundNode.nodeValue.length;
        }

        return new DOM.Point(foundNode, offset);
    };

    /**
     * Returns the following node and offset corresponding to the next
     * logical position. With a node and the next position index
     * the following node and in the case of a text node the offset
     * are calculated.This function does not take care of
     * ranges but only of direct positions. So [6,0] points to the first
     * character or drawing or field in the seventh paragraph, not to a
     * cursor position before.
     *
     * @param {Node} node
     *  The top level node, whose child is searched.
     *
     * @param {Number} pos
     *  The one integer number, that determines the child according to the
     *  parent position.
     *
     * @returns {DOM.Point}
     *  The child node and an offset. Offset is only set for text nodes,
     *  otherwise it is undefined.
     */
    Position.getNextChildNode = function (node, pos) {

        var childNode = null,
            offset = 0,
            lastTextSpanInfo = null;

        node = Utils.getDomNode(node);

        if (DOM.isTableNode(node)) {
            childNode = DOM.getTableRows(node).get(pos);
        } else if ($(node).is('tr')) {
            // Adding all colspans, to get the selected cell
            // Position.iterateRowChildNodes(node, function (cellNode, nodeStart, nodeColSpan) {
            //    // check if passed position points inside the current cell
            //     if (nodeStart + nodeColSpan > pos) {
            //        childNode = cellNode;
            //        return Utils.BREAK;
            //    }
            // });
            childNode = $(node).children('td').get(pos);  // this is a table cell
        } else if (DOM.isPageNode(node)) {
            childNode = DOM.getPageContentNode(node)[0].childNodes[pos];
        } else if ($(node).is('td')) {
            childNode = DOM.getCellContentNode(node)[0].childNodes[pos];
        } else if (DOM.isParagraphNode(node)) {
            Position.iterateParagraphChildNodes(node, function (_node, nodeStart, nodeLength) {

                var // offset inside the current child node
                    nodeOffset = pos - nodeStart;

                // check if passed position points inside the current node
                if ((0 <= nodeOffset) && (nodeOffset < nodeLength)) {
                    childNode = _node;
                    offset = nodeOffset;
                    return Utils.BREAK;
                }

                // store temporary text span info, will be used to find the last
                // text span for a position pointing behind the last character
                if (DOM.isTextSpan(_node)) {
                    lastTextSpanInfo = { node: _node, start: nodeStart, length: nodeLength };
                }
            }, undefined, { allNodes: true });

            // no node found that represents the passed position, try to match position after last character
            if (!childNode && lastTextSpanInfo && (lastTextSpanInfo.start + lastTextSpanInfo.length === pos)) {
                childNode = lastTextSpanInfo.node;
                offset = lastTextSpanInfo.length;
            }
        }

        return new DOM.Point(childNode, offset);
    };

    /**
     * Determining a text node for a DOM position, if this is required.
     * For drawing nodes, drawing nodes or text span nodes, it is sometimes
     * necessary to get a valid text node.
     *
     * @param {DOM.Point} domPoint
     *  The child node and the offset, which might be modified to get
     *  a valid text node.
     *
     * @returns {DOM.Point}
     *  The child node and an offset.
     */
    Position.getTextSpanFromNode = function (domPoint) {

        var // a text span corresponding to a component node
            span = null;

        function createTextPointForSpan(span, offset) {
            return new DOM.Point(span.firstChild, _.isNumber(offset) ? offset : span.firstChild.nodeValue.length);
        }

        if (!domPoint || !domPoint.node) {
            Utils.warn('Position.getTextSpanFromNode(): Parameter domPoint not set.');
            return;
        }

        // use preceding text node for all components (fields, tabs, drawings)
        if (DOM.isInlineComponentNode(domPoint.node) || DOM.isFloatingNode(domPoint.node)) {

            // go to previous inline node (must exist, must be a text span), skip floating helper nodes
            span = domPoint.node.previousSibling;
            if (DOM.isOffsetNode(span)) {
                span = span.previousSibling;
            }
            if (span) {
                return createTextPointForSpan(span);
            }

            Utils.error('Position.getTextSpanFromNode(): missing preceding text span for inline component node');
            return;
        }

        if (DOM.isPortionSpan(domPoint.node)) {

            // beginning of a text span: try to go to the end of the previous text node
            if ((domPoint.offset === 0) && DOM.isTextSpan(domPoint.node.previousSibling)) {
                return createTextPointForSpan(domPoint.node.previousSibling);
            }

            // from text span to text node
            return createTextPointForSpan(domPoint.node, domPoint.offset);
        }

        // other node types need to be handled if existing
        Utils.warn('Position.getTextSpanFromNode(): unsupported paragraph child node');
    };

    /**
     * Returns the index and the dom node of the position, at which the
     * corresponding dom node is of the specified selector.
     * Returns -1 for the index and null for the dom node, if the selector is
     * never fulfilled.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @param {String} selector
     *  The selector against which the dom node is compared.
     *
     * @returns {Object}
     */
    Position.getLastNodeInformationInPositionByNodeName = function (startnode, position, selector) {

        var index = -1,
            counter = -1,
            value = -1,
            searchedNode = null,
            oxoPos = _.copy(position, true),
            node = startnode;

        while (oxoPos.length > 0) {

            var valueSave = oxoPos.shift(),
                returnObj = Position.getNextChildNode(node, valueSave);

            counter++;

            if (returnObj) {
                if (returnObj.node) {
                    node = returnObj.node;
                    if ($(node).is(selector)) {
                        index = counter;
                        value = valueSave;
                        searchedNode = node;
                    }
                } else {
                    // index = -1;
                    // Utils.error('Position.getLastNodeInformationInPositionByNodeName(): (2) Invalid position: ' + position + ' . Failed to get node at index: ' + counter);
                    break;
                }
            } else {
                // index = -1;
                // Utils.error('Position.getLastNodeInformationInPositionByNodeName(): (1) Invalid position: ' + position + ' . Failed to get node at index: ' + counter);
                break;
            }
        }

        return {index: index, value: value, node: searchedNode};
    };

    /**
     * Returns the index of the position, at which the corresponding dom
     * node is of the specified selector. Returns -1, if the selector is
     * never fulfilled.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)

     * @param {Number[]} position
     *  The logical position.
     *
     * @param {String} selector
     *  The selector against which the dom node is compared.
     *
     * @returns {Numnber}
     *  The index in the logical position or -1, if no corresponding
     *  dom node can be found.
     *  Example: In the logical position [3,5,7,2,12] the index for a
     *  table row is 1 and for a table column it is 2.
     */
    Position.getLastIndexInPositionByNodeName = function (startnode, position, selector) {

        var index = Position.getLastNodeInformationInPositionByNodeName(startnode, position, selector).index;

        return index;
    };

    /**
     * Returns the value in the position, at which the corresponding dom
     * node is of the specified selector. Returns -1, if the selector is
     * never fulfilled.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)

     * @param {Number[]} position
     *  The logical position.
     *
     * @param {String} selector
     *  The selector against which the dom node is compared.
     *
     * @returns {Numnber}
     *  The value at the specific position in the logical position or -1,
     *  if no corresponding dom node can be found.
     *  Example: In the logical position [3,5,7,2,12] the 5 is value for a
     *  table row, the 7 the value for a table column.
     */
    Position.getLastValueFromPositionByNodeName = function (startnode, position, selector) {

        var value = Position.getLastNodeInformationInPositionByNodeName(startnode, position, selector).value;

        return value;
    };

    /**
     * Returns the dom node which is selected by the specified selector.
     * Returns null, if the selector is never fulfilled.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @param {String} selector
     *  The selector against which the dom node is compared.
     *
     * @returns {Node}
     *  The searched dom node or null, if no corresponding
     *  dom node can be found.
     */
    Position.getLastNodeFromPositionByNodeName = function (startnode, position, selector) {

        var node = Position.getLastNodeInformationInPositionByNodeName(startnode, position, selector).node;

        return node;
    };

    /**
     * Returns the logical position, at which the corresponding dom
     * node is of the specified selector. Returns -1, if the selector is
     * never fulfilled.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @param {String} selector
     *  The selector against which the dom node is compared.
     *
     * @returns {[]}
     *  The complete logical position or null, if no corresponding
     *  dom node can be found.
     */
    Position.getLastPositionFromPositionByNodeName = function (startnode, position, selector) {

        var pos = null,
            index = Position.getLastNodeInformationInPositionByNodeName(startnode, position, selector).index;

        if (index !== -1) {
            pos = [];
            for (var i = 0; i <= index; i++) {
                pos.push(position[i]);
            }
        }

        return pos;
    };

    /**
     * Returns 'true' if the logical position is a position inside a
     * table, otherwise false.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @returns {Boolean}
     *  Returns true, if the logical position is inside a table,
     *  otherwise false.
     */
    Position.isPositionInTable = function (startnode, position) {

        var positionInTable = false,
            domNode = startnode,
            localPos = _.copy(position, true);

        while (localPos.length > 0) {

            var nextChild = Position.getNextChildNode(domNode, localPos.shift());

            if (nextChild) {

                domNode = nextChild.node;

                if (DOM.isTableNode(domNode)) {
                    positionInTable = true;
                    break;
                } else if (DOM.isParagraphNode(domNode)) {
                    break;
                }
            }
        }

        return positionInTable;
    };

    /**
     * Convenience function, that returns the last table node, if available.
     * Otherwise null we be returned.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @returns {Node}
     *  Returns the last table node of the logical position if available,
     *  otherwise null.
     */
    Position.getCurrentTable = function (startnode, position) {
        return Position.getLastNodeFromPositionByNodeName(startnode, position, DOM.TABLE_NODE_SELECTOR);
    };

    /**
     * Convenience function, that returns the last paragraph node, if available.
     * Otherwise null we be returned.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @returns {Node}
     *  Returns the last paragraph node of the logical position if available,
     *  otherwise null.
     */
    Position.getCurrentParagraph = function (startnode, position) {
        return Position.getLastNodeFromPositionByNodeName(startnode, position, DOM.PARAGRAPH_NODE_SELECTOR);
    };

    /**
     * Function, that returns all adjacent paragraphs of a paragraph
     * described by the logical position. The logical position can
     * describe a paragraph or a text node inside it.
     * Otherwise null we be returned.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @returns {jQuery}
     *  Returns all adjacent paragraphs of a paragraph described by
     *  the logical position. This return value is a jQuery object.
     */
    Position.getAllAdjacentParagraphs = function (startnode, position) {

        var allParagraphs = null;

        if ((position.length === 1) || (position.length === 2)) {  // only for performance
            allParagraphs = DOM.getChildContainerNode(startnode).children();
        } else {

            var node = Position.getLastNodeFromPositionByNodeName(startnode, position, 'td');

            if (node) {
                allParagraphs = DOM.getCellContentNode(node).children();
            }
        }

        return allParagraphs;
    };

    /**
     * Determining the number of rows in a table. Returned is the last
     * index, the value is 0-based. So this is not the length.
     * Otherwise -1 we be returned.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the last row or -1, if the position
     *  is not included in a table.
     */
    Position.getLastRowIndexInTable = function (startnode, position) {

        var rowIndex = -1,
            table = Position.getLastNodeFromPositionByNodeName(startnode, position, DOM.TABLE_NODE_SELECTOR);

        if (table) {
            rowIndex = DOM.getTableRows(table).length - 1;
        }

        return rowIndex;
    };

    /**
     * Determining the number of columns in a table, respectively in
     * the first row of a table. Returned is the last index, the
     * value is 0-based. So this is not the length.
     * Otherwise -1 we be returned.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the last column of the first row of a
     *  table or -1, if the position is not included in a table.
     */
    Position.getLastColumnIndexInTable = function (startnode, position) {

        var columnIndex = -1,
            table = Position.getLastNodeFromPositionByNodeName(startnode, position, DOM.TABLE_NODE_SELECTOR);

        if (table) {
            var row = DOM.getTableRows(table).first();  // first row
            columnIndex = row.children('td').length - 1;
        }

        return columnIndex;
    };

    /**
     * Determining the maximum number of columns in a table, which
     * is the number of grids. Returned is the number of grids, the
     * value is 0-based. So this is not the length.
     * Otherwise -1 we be returned.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the last grid of a  table or -1,
     *  if the position is not included in a table.
     */
    Position.getLastGridIndexInTable = function (startnode, position) {

        var gridIndex = -1,
            table = Position.getLastNodeFromPositionByNodeName(startnode, position, DOM.TABLE_NODE_SELECTOR);

        if (table) {
            gridIndex = $(table).children('colgroup').children('col').length - 1;
        }

        return gridIndex;
    };

    /**
     * Determining the number of columns in a row specified by the
     * logical position. Returned is the last index, the
     * value is 0-based. So this is not the length.
     * Otherwise -1 we be returned.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the last column of the specified row of a
     *  table or -1, if the position is not included in a table.
     */
    Position.getLastColumnIndexInRow = function (startnode, position) {

        var columnIndex = -1,
            row = Position.getLastNodeFromPositionByNodeName(startnode, position, 'tr');

        if (row) {
            columnIndex = $(row).children('td').length - 1;
        }

        return columnIndex;
    };

    /**
     * Determining the index of the row specified by the logical position
     * inside a table. The first row has index 0, the second index 1
     * and so on. The value is 0-based.
     * If no row is found in the logical position, -1 will be
     * returned.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the row inside a table, or -1, if the
     *  logical position does not contain a row.
     */
    Position.getRowIndexInTable = function (startnode, position) {
        return Position.getLastValueFromPositionByNodeName(startnode, position, 'tr');
    };

    /**
     * Determining the index of the column/cell specified by the logical
     * position inside a row. The first column/cell has index 0, the second index 1
     * and so on. The value is 0-based.
     * If no column/cell is found in the logical position, -1 will be
     * returned.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the column/cell inside a row, or -1, if the
     *  logical position does not contain a column/cell.
     */
    Position.getColumnIndexInRow = function (startnode, position) {
        return Position.getLastValueFromPositionByNodeName(startnode, position, 'td');
    };

    /**
     * Determining the index of the paragraph specified by the logical
     * position inside the document root or inside a table cell.
     * The first paragraph has index 0, the second index 1
     * and so on. The value is 0-based.
     * If no paragraph is found in the logical position, -1 will be
     * returned.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the paragraph inside the document row
     *  or inside a table cell, or -1, if the
     *  logical position does not contain a paragraph.
     */
    Position.getParagraphIndex = function (startnode, position) {
        return Position.getLastValueFromPositionByNodeName(startnode, position, DOM.PARAGRAPH_NODE_SELECTOR);
    };

    /**
     * Determining the index of the last paragraph in a cell specified by the logical
     * position inside a row. The first cell has index 0, the second index 1
     * and so on. The value is 0-based.
     * If no cell is found in the logical position, -1 will be
     * returned.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the last cell inside a row, or -1, if the
     *  logical position does not contain a cell.
     */
    Position.getLastParaIndexInCell = function (startnode, position) {

        var lastPara = -1,
            cell = Position.getLastNodeFromPositionByNodeName(startnode, position, 'td');

        if (cell) {
            lastPara = Position.getCellContentNode(cell)[0].childNodes.length - 1;
        }

        return lastPara;
    };

    /**
     * Returns the logical length of the content nodes of the paragraph located
     * at the specified logical position. Text fields and drawing nodes have a
     * logical length of 1.
     *
     * @param {Node|jQuery} startnode
     *  The start node corresponding to the logical position. if this object is
     *  a jQuery collection, uses the first DOM node it contains.
     *
     * @param {Number[]} position
     *  The logical position of the paragraph.
     *
     * @returns {Number}
     *  The logical length of all content nodes inside the paragraph or 0, if
     *  the logical position does not point to a paragraph.
     */
    Position.getParagraphLength = function (startnode, position) {

        var // the paragraph element addressed by the passed logical position
            paragraph = Position.getLastNodeFromPositionByNodeName(startnode, position, DOM.PARAGRAPH_NODE_SELECTOR),
            // length of the paragraph contents
            length = 0;

        if (paragraph) {
            Position.iterateParagraphChildNodes(paragraph, function (node, start, nodeLength) {
                length += nodeLength;
            });
        }

        return length;
    };

    /**
     * Returns the count of previous floated images before a specified
     * logical position inside a paragraph.
     *
     * @param {Node|jQuery} startnode
     *  The start node corresponding to the logical position. if this object is
     *  a jQuery collection, uses the first DOM node it contains.
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @returns {Number}
     *  The count of previous floated images inside the paragraph.
     *  The logical length of all content nodes inside the paragraph or 0, if
     *  the logical position does not point to a paragraph.
     */
    Position.getNumberOfPrevFloatedImages = function (editdiv, position) {

        var domNode = Position.getDOMPosition(editdiv, position).node,
            counter = 0;

        if (domNode) {

            if (domNode.nodeType === 3) {
                domNode = domNode.parentNode;
            }

            while (domNode.previousSibling) {
                if (DOM.isFloatingDrawingNode(domNode.previousSibling)) {
                    counter++;
                }
                domNode = domNode.previousSibling;
            }
        }

        return counter;
    };

    /**
     * Returns the logical start index of a text component node in its parent
     * paragraph. The passed node may be any child node of a paragraph (either
     * an editable content node, or a helper node such as an offset container
     * used to position floated drawings).
     *
     * @param {HTMLElement|jQuery} node
     *  The paragraph child node, whose logical start index will be calculated.
     *  If this object is a jQuery collection, uses the first node it contains.
     *
     * @returns {Number}
     *  Returns the logical start index of the specified node in its parent
     *  paragraph element.
     */
    Position.getStartOfParagraphChildNode = function (node) {

        var // the logical start index of the passed node
            start = -1;

        // visit all content nodes of the node parent (the paragraph), and search for the node
        node = Utils.getDomNode(node);
        Position.iterateParagraphChildNodes(node.parentNode, function (childNode, nodeStart) {
            if (node === childNode) {
                start = nodeStart;
                return Utils.BREAK;
            }
        }, undefined, { allNodes: true }); // visit all child nodes of the paragraph

        return start;
    };

    /**
     * Checks, if a specified position is the first position
     * inside a text node in a cell in a table.
     *
     * @param {Number[]} pos
     *  The logical position.
     *
     * @returns {Boolean}
     *  Returns true, if the position is the first position inside
     *  a table cell, otherwise false.
     */
    Position.isFirstPositionInTableCell = function (pos) {

        var isCellStartPosition = false,
            localPos = _.copy(pos, true);

        if (localPos.pop() === 0) {   // start position
            if (localPos.pop() === 0) {   // start paragraph
                var domPos = Position.getDOMPosition(localPos);
                if ((domPos) && ($(domPos.node).is('td'))) {
                    isCellStartPosition = true;
                }
            }
        }

        return isCellStartPosition;
    };

    /**
     * Checks, if a specified position is the last position
     * inside a text node in a cell in a table.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} pos
     *  The logical position.
     *
     * @returns {Boolean}
     *  Returns true, if the position is the last position inside
     *  a table cell, otherwise false.
     */
    Position.isLastPositionInTableCell = function (startnode, pos) {
        var isCellEndPosition = false,
            localPos = _.copy(pos, true);

        var pos = localPos.pop();
        if (pos === Position.getParagraphLength(startnode, localPos)) {   // last position
            var lastPara = localPos.pop();
            if (lastPara ===  Position.getLastParaIndexInCell(startnode, localPos)) {   // last paragraph
                var domPos = Position.getDOMPosition(localPos);
                if ((domPos) && ($(domPos.node).is('td'))) {
                    isCellEndPosition = true;
                }
            }
        }

        return isCellEndPosition;
    };

    /**
     * Checks, if two logical positions of the same length
     * reference two positions inside the same table. All
     * values inside the logical position of representing the
     * table node, must be identical.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)

     * @param {Number[]} posA
     *  The logical position.
     *
     * @param {Number[]} posB
     *  The logical position.
     *
     * @returns {Boolean}
     *  Returns true, if the positions have the same length and
     *  reference positions within the same table.
     *  Otherwise false is returned.
     */
    Position.isSameTableLevel = function (startnode, posA, posB) {
        // If both position are in the same table, but in different cells (this
        // can happen in Chrome, but not in Firefox. In Firefox the complete cells
        // are selected.
        var isSameTableLevel = true;

        if (posA.length === posB.length) {
            var tableA = Position.getLastPositionFromPositionByNodeName(startnode, posA, DOM.TABLE_NODE_SELECTOR),
                tableB = Position.getLastPositionFromPositionByNodeName(startnode, posB, DOM.TABLE_NODE_SELECTOR);

            // Both have to be identical
            if (tableA.length === tableB.length) {
                var max = tableA.length - 1;
                for (var i = 0; i <= max; i++) {
                    if (tableA[i] !== tableB[i]) {
                        isSameTableLevel = false;
                        break;
                    }
                }
            } else {
                isSameTableLevel = false;
            }
        } else {
            isSameTableLevel = false;
        }

        return isSameTableLevel;
    };

    /**
     * Calculating the last logical position inside a paragraph or a
     * table. In a table the last cell can again be filled with a table.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} paragraph
     *  The logical position.
     *
     * @returns {Number[]}
     *  Returns the last logical position inside a paragraph or
     *  a table. If the parameter 'paragraph' is a logical position, that
     *  is not located inside a table or paragraph, null is returned.
     */
    Position.getLastPositionInParagraph = function (startnode, paragraph) {

        var paraPosition = Position.getLastPositionFromPositionByNodeName(startnode, paragraph, DOM.CONTENT_NODE_SELECTOR);

        if ((paraPosition) && (paraPosition.length > 0)) {

            while (DOM.isTableNode(Position.getDOMPosition(startnode, paraPosition).node)) {
                paraPosition.push(Position.getLastRowIndexInTable(startnode, paraPosition));
                paraPosition.push(Position.getLastColumnIndexInRow(startnode, paraPosition));
                paraPosition.push(Position.getLastParaIndexInCell(startnode, paraPosition));
            }

            paraPosition.push(Position.getParagraphLength(startnode, paraPosition));
        }

        return paraPosition;
    };

    /**
     * Calculating the first logical position inside a paragraph or a
     * table. In a table the first cell can again be filled with a table.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @returns {Number[]}
     *  Returns the first logical position inside a paragraph or
     *  a table. If the parameter 'paragraph' is a logical position, that
     *  is not located inside a table or paragraph, null is returned.
     */
    Position.getFirstPositionInParagraph = function (startnode, position) {

        var paraPosition = Position.getLastPositionFromPositionByNodeName(startnode, position, DOM.CONTENT_NODE_SELECTOR);

        if ((paraPosition) && (paraPosition.length > 0)) {

            while (DOM.isTableNode(Position.getDOMPosition(startnode, paraPosition).node)) {
                paraPosition.push(0);  // row
                paraPosition.push(0);  // column
                paraPosition.push(0);  // paragraph
            }

            paraPosition.push(0);
        }

        return paraPosition;
    };

    /**
     * Calculating the first logical position of a following table
     * cell. Following means, from left to right. If the last cell in
     * a row is reached, the first cell in the following row is used.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @returns {Object}
     *  Returns the first logical position inside a following cell. If the
     *  end of the table is reached, the value for 'endOfTable' is set to
     *  true. Otherwise it is false.
     */
    Position.getFirstPositionInNextCell = function (startnode, position) {

        var endOfTable = false,
            cellnode = Position.getLastNodeFromPositionByNodeName(startnode, position, 'td');

        if (cellnode) {

            if (cellnode.nextSibling) {
                position = Position.getOxoPosition(startnode, cellnode.nextSibling);
                position.push(0);
                position = Position.getFirstPositionInParagraph(startnode, position);
            } else {
                // is this already the last row?
                if (cellnode.parentNode.nextSibling) {  // -> following row
                    position = Position.getOxoPosition(startnode, cellnode.parentNode.nextSibling.firstChild);
                    position.push(0);
                    position = Position.getFirstPositionInParagraph(startnode, position);
                } else {
                    position = Position.getLastPositionFromPositionByNodeName(startnode, position, DOM.TABLE_NODE_SELECTOR);
                    endOfTable = true;
                }
            }
        }

        return {position: position, endOfTable: endOfTable};
    };

    /**
     * Calculating the last logical position of a previous table
     * cell. Previous means, from right to left. If the first cell in
     * a row is reached, the last cell in the previous row is used.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *
     * @param {Number[]} position
     *  The logical position.
     *
     * @returns {Object}
     *  Returns the last logical position inside a previous cell. If the
     *  begin of the table is reached, the value for 'beginOfTable' is set to
     *  true. Otherwise it is false.
     */
    Position.getLastPositionInPrevCell = function (startnode, position) {

        var beginOfTable = false,
            continueSearch = true,
            cellnode = Position.getLastNodeFromPositionByNodeName(startnode, position, 'td');

        while ((cellnode) && (continueSearch)) {

            if (cellnode.previousSibling) {
                position = Position.getOxoPosition(startnode, cellnode.previousSibling);
                position.push(Position.getLastParaIndexInCell(startnode, position));
                position = Position.getLastPositionInParagraph(startnode, position);
                continueSearch = false;
            } else {
                // is this already the first row?
                if (cellnode.parentNode.previousSibling) {  // -> previous row
                    position = Position.getOxoPosition(startnode, cellnode.parentNode.previousSibling.lastChild);
                    position.push(Position.getLastParaIndexInCell(startnode, position));
                    position = Position.getLastPositionInParagraph(startnode, position);
                    continueSearch = false;
                } else {
                    position = Position.getLastPositionFromPositionByNodeName(startnode, position, DOM.TABLE_NODE_SELECTOR);
                    beginOfTable = true;
                }
            }

            if (beginOfTable) {
                // There is no previous cell inside this table. So there is no previous cell
                // or the previous cell is inside an outer table.
                // Position now contains the table/paragraph selection
                cellnode = Position.getLastNodeFromPositionByNodeName(startnode, position, DOM.TABLE_NODE_SELECTOR);

                if (cellnode.previousSibling) {  // this table is not the first table/paragraph
                    beginOfTable = true;
                    continueSearch = false;  // simply jump into preceeding paragraph/table
                } else {  // this table is the first table/paragraph
                    cellnode = Position.getLastNodeFromPositionByNodeName(startnode, position, 'td');
                    if (cellnode) {
                        position = Position.getLastPositionFromPositionByNodeName(startnode, position, 'td');
                        beginOfTable = false;
                    } else {
                        continueSearch = false;
                    }
                }
            }
        }

        return {position: position, beginOfTable: beginOfTable};
    };

    /**
     * Calculating the first logical position of a table cell
     * specified by the parameter 'cellPosition'.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} cellPosition
     *  The logical position.
     *
     * @returns {Number[]}
     *  Returns the first logical position inside the specified cell.
     */
    Position.getFirstPositionInCurrentCell = function (startnode, cellPosition) {

        var position = _.copy(cellPosition, true);

        position = Position.getLastPositionFromPositionByNodeName(startnode, position, 'td');
        position.push(0);  // first paragraph or table
        position = Position.getFirstPositionInParagraph(startnode, position);

        return position;
    };

    /**
     * Calculating the last logical position of a table cell
     * specified by the parameter 'cellPosition'.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} cellPosition
     *  The logical position.
     *
     * @returns {Number[]}
     *  Returns the last logical position inside the specified cell.
     */
    Position.getLastPositionInCurrentCell = function (startnode, cellPosition) {

        var position = _.copy(cellPosition, true);

        position = Position.getLastPositionFromPositionByNodeName(startnode, position, 'td');
        position.push(Position.getLastParaIndexInCell(startnode, position));  // last paragraph or table
        position = Position.getLastPositionInParagraph(startnode, position);

        return position;
    };

    /**
     * Returns the logical offset of the first text span in a paragraph.
     *
     * @param {HTMLElement|jQuery} paragraph
     *  A paragraph node. If this object is a jQuery collection, uses the first
     *  DOM node it contains.
     *
     * @returns {Number}
     *  The start position of the first text component in the passed paragraph.
     */
    Position.getFirstTextNodePositionInParagraph = function (paragraph) {

        var offset = 0;

        Position.iterateParagraphChildNodes(paragraph, function (node, nodeStart) {
            if (DOM.isPortionSpan(node)) {
                offset = nodeStart;
                return Utils.BREAK;
            }
        }, undefined, { allNodes: true });

        return offset;
    };

    /**
     * returns the logical offset behind the last text span in a paragraph.
     *
     * @param {HTMLElement|jQuery} paragraph
     *  A paragraph node. If this object is a jQuery collection, uses the first
     *  DOM node it contains.
     *
     * @returns {Number}
     *  The position behind the last text span in the passed paragraph.
     */
    Position.getLastTextNodePositionInParagraph = function (paragraph) {

        var offset = 0;

        Position.iterateParagraphChildNodes(paragraph, function (node, nodeStart, nodeLength) {
            if (DOM.isPortionSpan(node)) {
                offset = nodeStart + nodeLength;
            }
        }, undefined, { allNodes: true });

        return offset;
    };

    /**
     * After splitting a paragraph, it might be necessary to remove
     * leading empty text spans at the beginning of the paragraph. This
     * is especially important, if there are following floated drawings.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     */
    Position.removeLeadingEmptyTextSpans = function (startnode, position) {

        var paraNode = Position.getCurrentParagraph(startnode, position);

        if ((paraNode) && ($(paraNode).children('div.float').length > 0)) {

            var child = paraNode.firstChild,
                continue_ = true;

            while ((child !== null) && (continue_)) {

                if (DOM.isEmptySpan(child)) {
                    var removeElement = child;
                    child = child.nextSibling;
                    $(removeElement).remove();
                } else if ($(child).is('div.float')) {
                    child = child.nextSibling;
                } else {
                    continue_ = false;
                }
            }
        }

    };

    /**
     * After splitting a paragraph, it might be necessary to remove leading
     * floating drawings at the beginning of the paragraph.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     */
    Position.removeLeadingImageDivs = function (startnode, position) {

        var paraNode = Position.getCurrentParagraph(startnode, position);

        if ((paraNode) && ($(paraNode).children('div.float').length > 0)) {

            var child = paraNode.firstChild;

            while (child) {

                var nextChild = child.nextSibling;

                if (DOM.isOffsetNode(child) && !DOM.isDrawingNode(nextChild)) {
                    var removeElement = child;
                    $(removeElement).remove();
                } else if (!DOM.isFloatingDrawingNode(child)) {
                    break;
                }
                child = nextChild;
            }
        }

    };

    /**
     * After splitting a paragraph, it might be necessary to remove
     * divs from images, because they no longer belong to a following
     * image.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} position
     *  The logical position.
     */
    Position.removeUnusedImageDivs = function (startnode, position) {

        var paraNode = Position.getCurrentParagraph(startnode, position);

        if ((paraNode) && ($(paraNode).children(DOM.OFFSET_NODE_SELECTOR).length > 0)) {

            var child = paraNode.firstChild;

            while (child) {

                var nextChild = child.nextSibling;

                if (DOM.isOffsetNode(child) && !DOM.isDrawingNode(nextChild)) {
                    $(child).remove();
                }

                child = nextChild;
            }
        }

    };

    // position arrays --------------------------------------------------------

    /**
     * Returns whether the passed logical positions are located in the same
     * parent component (all array elements but the last are equal).
     *
     * @param {Number[]} position1
     *  The first logical position.
     *
     * @param {Number[]} position2
     *  The second logical position.
     *
     * @param {Number} [parentLevel=1]
     *  The number of parent levels. If omitted, the direct parents of the
     *  start and end position will be checked (only the last element of each
     *  position array will be ignored). Otherwise, the specified number of
     *  trailing array elements will be ignored (for example, a value of 2
     *  checks the grand parents).
     *
     * @returns {Boolean}
     *  Whether the logical positions are located in the same parent component.
     */
    Position.hasSameParentComponent = function (position1, position2, parentLevel) {

        var index = 0, length = position1.length;

        // length of both positions must be equal
        parentLevel = _.isNumber(parentLevel) ? parentLevel : 1;
        if ((length < parentLevel) || (length !== position2.length)) { return false; }

        // compare all array elements but the last ones
        for (index = length - parentLevel - 1; index >= 0; index -= 1) {
            if (position1[index] !== position2[index]) {
                return false;
            }
        }

        return true;
    };

    // iteration --------------------------------------------------------------

    /**
     * Calls the passed iterator function for all or selected child elements in
     * a paragraph node (text spans, text fields, drawings, and other helper
     * nodes).
     *
     * @param {HTMLElement|jQuery} paragraph
     *  The paragraph element whose child nodes will be visited. If this object
     *  is a jQuery collection, uses the first DOM node it contains.
     *
     * @param {Function} iterator
     *  The iterator function that will be called for every matching node.
     *  Receives the following parameters:
     *      (1) {HTMLElement} the DOM node object,
     *      (2) {Number} the logical start index of the node in the paragraph,
     *      (3) {Number} the logical length of the node,
     *      (4) {Number} the offset of the covered part in the visited node,
     *          relative to its start,
     *      (5) {Number} the length of the covered part of the child node.
     *  The last two parameters are important if the options 'options.start'
     *  and 'options.end' will be used to iterate over a specific sub-range in
     *  the paragraph where the first and last visited text nodes may be
     *  covered only partially. Note that text components (e.g. fields or tabs)
     *  and drawing nodes have a logical length of 1, and other helper nodes
     *  that do not represent editable contents have a logical length of 0. If
     *  the iterator returns the Utils.BREAK object, the iteration process will
     *  be stopped immediately.
     *
     * @param {Object} [context]
     *  If specified, the iterator will be called with this context (the symbol
     *  'this' will be bound to the context inside the iterator function).
     *
     * @param {Object} [options]
     *  A map of options to control the iteration. Supports the following
     *  options:
     *  @param {Boolean} [options.allNodes=false]
     *      If set to true, all child nodes of the paragraph will be visited,
     *      also helper nodes that do not represent editable content and have a
     *      logical length of 0. Otherwise, only real content nodes will be
     *      visited (non-empty text portions, text fields, and drawing nodes).
     *  @param {Number} [options.start]
     *      The logical index of the first text component to be included into
     *      the iteration process. Text spans covered partly will be visited
     *      too.
     *  @param {Number} [options.end]
     *      The logical index of the last text component to be included in
     *      the iteration process (closed range). Text spans covered partly
     *      will be visited too.
     *  @param {Boolean} [options.split=false]
     *      If set to true, the first and last text span not covered completely
     *      by the specified range will be split before the iterator function
     *      will be called. The iterator function will always receive a text
     *      span that completely covers the contained text.
     *
     * @returns {Utils.BREAK|Undefined}
     *  A reference to the Utils.BREAK object, if the iterator has returned
     *  Utils.BREAK to stop the iteration process, otherwise undefined.
     */
    Position.iterateParagraphChildNodes = function (paragraph, iterator, context, options) {

        var // whether to visit all child nodes
            allNodes = Utils.getBooleanOption(options, 'allNodes', false),
            // logical index of first node to be visited
            rangeStart = Utils.getIntegerOption(options, 'start'),
            // logical index of last node to be visited
            rangeEnd = Utils.getIntegerOption(options, 'end'),
            // split partly covered text spans before visiting them
            split = Utils.getBooleanOption(options, 'split', false),
            // the logical start index of the visited content node
            nodeStart = 0,
            // result of the iteration
            result = null;

        // visit the content nodes of the specified paragraph element (only child nodes, no other descendants)
        result = Utils.iterateDescendantNodes(paragraph, function (node) {

            var // the logical length of the node
                nodeLength = 0,
                // start offset of partly covered nodes
                offsetStart = 0,
                // offset length of partly covered nodes
                offsetLength = 0,
                // whether node is a regular text span
                isTextSpan = DOM.isTextSpan(node),
                // whether node is located before the range start point
                isBeforeStart = false;

            // calculate length of the node
            if (isTextSpan) {
                // portion nodes contain regular text
                nodeLength = node.firstChild.nodeValue.length;
            } else if (DOM.isTextComponentNode(node) || DOM.isDrawingNode(node)) {
                // special text components (e.g. fields, tabs) and drawings count as one character
                nodeLength = 1;
            }

            // node starts after the specified end index (escape from iteration)
            if (_.isNumber(rangeEnd) && (rangeEnd < nodeStart)) {
                return Utils.BREAK;
            }

            // node ends before the specified start index
            isBeforeStart = _.isNumber(rangeStart) && (nodeStart + nodeLength <= rangeStart);

            // always visit non-empty nodes, but skip nodes before the start position
            if (!isBeforeStart && (allNodes || (nodeLength > 0))) {

                // calculate offset start and length of partly covered text nodes
                offsetStart = _.isNumber(rangeStart) ? Math.max(rangeStart - nodeStart, 0) : 0;
                offsetLength = (_.isNumber(rangeEnd) ? Math.min(rangeEnd - nodeStart + 1, nodeLength) : nodeLength) - offsetStart;

                // split first text span (insert new span before current span)
                if (split && isTextSpan && (offsetStart > 0)) {
                    DOM.splitTextSpan(node, offsetStart);
                    nodeStart += offsetStart;
                    nodeLength -= offsetStart;
                    offsetStart = 0;
                }

                // split last text span (insert new span before current span)
                if (split && isTextSpan && (offsetLength < nodeLength)) {
                    DOM.splitTextSpan(node, offsetLength, { append: true });
                    nodeLength = offsetLength;
                }

                // call the iterator for the current content node
                if (iterator.call(context, node, nodeStart, nodeLength, offsetStart, offsetLength) === Utils.BREAK) {
                    return Utils.BREAK;
                }
            }

            // update start index of next visited node
            nodeStart += nodeLength;

        }, undefined, { children: true });

        return result;
    };

    /**
     * Calls the passed iterator function for all or selected child elements in
     * a row node (only cell nodes, 'th# and 'td').
     *
     * @param {HTMLElement|jQuery} row
     *  The row element whose child nodes will be visited. If this object
     *  is a jQuery collection, uses the first DOM node it contains.
     *
     * @param {Function} iterator
     *  The iterator function that will be called for every matching node.
     *  Receives the DOM cell node object as first parameter, the logical start
     *  index of the node in the row as second parameter, and the logical
     *  length (colspan) of the cell as third parameter.
     *  If the iterator returns the Utils.BREAK object, the iteration process
     *   will be stopped immediately.
     *
     * @param {Object} [context]
     *  If specified, the iterator will be called with this context (the symbol
     *  'this' will be bound to the context inside the iterator function).
     *
     * @returns {Utils.BREAK|Undefined}
     *  A reference to the Utils.BREAK object, if the iterator has returned
     *  Utils.BREAK to stop the iteration process, otherwise undefined.
     */
    Position.iterateRowChildNodes = function (row, iterator, context) {

        var // the logical start index of the visited cell node
            cellNodeStart = 0,
            // result of the iteration
            result = null;

        // visit the content nodes of the specified cell element (only child nodes, no other descendants)
        result = Utils.iterateDescendantNodes(row, function (cellNode) {

            var currentColSpan = Utils.getElementAttributeAsInteger(cellNode, 'colspan', 1);

            // call the iterator for the current content node
            if (iterator.call(context, cellNode, cellNodeStart, currentColSpan) === Utils.BREAK) {
                return Utils.BREAK;
            }

            // update start index of next visited node
            cellNodeStart += currentColSpan;

        }, undefined, { children: true });

        return result;
    };

    // exports ================================================================

    return Position;

});
