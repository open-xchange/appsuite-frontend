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
     'io.ox/office/editor/dom',
     'io.ox/office/editor/oxopam'], function (Utils, DOM, OXOPaM) {

    'use strict';

    // static class Position ==================================================

    /**
     * Provides static helper methods for manipulation and calculation
     * of logical positions and to access dom positions and dom nodes
     * from logical position.
     */
    var Position = {};

    // static functions =======================================================

    /**
     * The central function to calculate logical position from dom positions.
     * Receiving a dom position consisting of a dom node and an offset, it
     * calculates the logical position (oxoPosition) that is an array of
     * integer values. This logical position is saved together with the
     * property nodeName of the dom node in the OXOPaM object, that is
     * the return value of this function.
     *
     * @param {DOM.Point} domposition
     *  The dom position, consisting of dom node and offset, whose logical
     *  position will be calculated.
     *
     * @param {jQuery} maindiv
     *  The jQuery object of a DIV node, that is the frame for the complete
     *  search and calculation process. No dom position outside of this
     *  maindiv can be calculated.
     *
     * @param {Boolean} isEndPoint
     *  The information, if the specified domposition is the end point
     *  of a range. This is important for some calculations, where the
     *  dom node is a row inside a table.
     *
     * @returns {OXOPaM}
     *  The calculated logical position (OXOPaM.oxoPosition) together with
     *  the property nodeName of the dom node parameter.
     */
    Position.getOXOPosition = function (domposition, maindiv, isEndPoint) {

        var node = domposition.node,
            offset = domposition.offset,
            selectedNodeName = node.nodeName;

        isEndPoint = isEndPoint ? true : false;

        // check input values
        if (! node) {
            Utils.error('Position.getOXOPosition(): Invalid DOM position. Node not defined');
            return;
        }

        // Sometimes (double click in FireFox) a complete paragraph is selected with DIV + Offset 3 and DIV + Offset 4.
        // These DIVs need to be converted to the correct paragraph first.
        // Also cells in columns have to be converted at this point.
        if ($(node).is('DIV, P, TR, TD, TH, IMG')) {
            var newNode = Position.getTextNodeFromCurrentNode(node, offset, isEndPoint);
            if (newNode) {
                node = newNode.node;
                offset = newNode.offset;
            } else {
                Utils.error('Position.getOXOPosition(): Failed to determine text node from node: ' + node.nodeName + " with offset: " + offset);
                return;
            }
        }

        // Checking offset for text nodes
        if ((node.nodeType === 3) && !_.isNumber(offset)) {
            Utils.error('Position.getOXOPosition(): Invalid start position: text node without offset');
            return;
        }

        if (offset < 0) {
            Utils.error('Position.getOXOPosition(): Invalid DOM position. Offset < 0 : ' + offset + ' . Node: ' + node.nodeName + ',' + node.nodeType);
            return;
        }

        // Check, if the selected node is a descendant of the maindiv
        if (!maindiv.get(0).contains(node)) { // range not in text area
            Utils.error('Position.getOXOPosition(): Invalid DOM position. It is not part of the editor DIV: ! Offset : ' + offset + ' . Node: ' + node.nodeName + ',' + node.nodeType);
            return;
        }

        // Calculating the position inside the editor div.
        var oxoPosition = [],
            evaluateOffset = (node.nodeType === 3) ? true : false,  // Is evaluation of offset required?
            offsetEvaluated = false,
            textLength = 0;

        // currently supported elements: 'p', 'table', 'th', 'td', 'tr'
        // Attention: Column and Row are not in the order in oxoPosition, in which they appear in html.
        // Column must be integrated after row -> a buffer is required.

        for (; node && (node !== maindiv.get(0)); node = node.parentNode) {
            if ($(node).is('TABLE, P, TR, TH, TD')) {
                oxoPosition.unshift($(node).prevAll().length);  // zero based
                evaluateOffset = false;
            }
            if (evaluateOffset) {
                for (var prevNode = node; (prevNode = prevNode.previousSibling);) {
                    textLength += $(prevNode).text().length;
                    if (prevNode.nodeName === 'IMG') {
                        textLength++;
                    }
                    // textLength += $('IMG', prevNode).length;  // TODO: if IMGs are allowed in spans, ...
                }
                offsetEvaluated = true;
            }
        }

        if (offsetEvaluated) {
            oxoPosition.push(textLength + offset);
        }

        if ((node.nodeType === 3) && (! offsetEvaluated)) {
            Utils.warn('Position.getOXOPosition(): Offset ' + offset + ' was not evaluated, although nodeType is 3! Calculated oxoPosition: ' + oxoPosition);
        }

        return new OXOPaM(oxoPosition, selectedNodeName);
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
     * @param {OXOPaM.oxoPosition} oxoPosition
     *  The logical position.
     *
     * @returns {DOM.Point}
     *  The calculated dom position consisting of dom node and offset.
     *  Offset is only set for text nodes, otherwise it is undefined.
     */
    Position.getDOMPosition = function (startnode, oxoPosition) {

        var oxoPos = _.copy(oxoPosition, true),
            node = startnode,
            offset = null;

        if (oxoPosition === undefined) {
            // Utils.error('Position.getDOMPosition(): oxoPosition is undefined!');
            return;
        }

        if (oxoPos[0] === undefined) {
            // Utils.error('Position.getDOMPosition(): Position is undefined!');
            return;
        }

        while (oxoPos.length > 0) {

            var returnObj = Position.getNextChildNode(node, oxoPos.shift());

            if (returnObj) {
                if (returnObj.node) {
                    node = returnObj.node;
                    if (returnObj.offset) {
                        offset = returnObj.offset;
                    }
                } else {
                    Utils.warn('Position.getDOMPosition(): Failed to determine child node for node: ' + node.nodeName);
                    return;
                }
            } else {
                Utils.warn('Position.getDOMPosition(): Failed to determine child node for node: ' + node.nodeName);
                return;
            }
        }

        return new DOM.Point(node, offset);
    };

    /**
     * Helper function for Position.getOxoPosition. If the node is not
     * a text node, this function determines the correct text node, that
     * is used for calculation of the logical position instead of the
     * specified node. This could be a 'DIV', 'TABLE', 'P', ... . It is
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
     *  The text node, that will be used in Position.getOxoPosition
     *  for the calculation of the logical position.
     */
    Position.getTextNodeFromCurrentNode = function (node, offset, isEndPoint) {

        var useFirstTextNode = true,  // can be false for final child in a paragraph
            usePreviousCell = false;

        if (Utils.getNodeName(node) === 'img') {
            node = node.nextSibling;  // useless to look for text nodes inside image nodes (must be a span)
            // node = node.previousSibling;
            offset = 0;
        }

        var localNode = node.childNodes[offset]; // offset can be zero for start points but too high for end points

        if ((Utils.getNodeName(node) === 'tr') && (isEndPoint)) {
            usePreviousCell = true;
        }

        if ((! localNode) || (usePreviousCell)) {
            localNode = node.childNodes[offset - 1];
            useFirstTextNode = false;
        }

        // special handling for <br>, use last preceding text node instead
        if (localNode && (Utils.getNodeName(localNode) === 'br')) {
            localNode = localNode.previousSibling;
            useFirstTextNode = false;
        }

        // special handling for images, use first following text node instead
        if (localNode && (Utils.getNodeName(localNode) === 'img')) {
            // localNode = localNode.nextSibling;
            localNode = localNode.previousSibling; // allows text input at the beginning of the paragraph. (7,0) must return a text node.
            useFirstTextNode = true;
        }

        // find the first or last text node contained in the element
        var textNode = localNode;
        if (localNode && (localNode.nodeType !== 3)) {
            textNode = useFirstTextNode ? Utils.findFirstTextNode(localNode) : Utils.findLastTextNode(localNode);
        }

        if (! textNode) {
            var nodeName = localNode ? localNode.nodeName : '';
            Utils.error('Position.getTextNodeFromCurrentNode(): Failed to determine text node from current node! (useFirstTextNode: ' + useFirstTextNode + " : " + nodeName + ')');
            return;
        }

        var offset = useFirstTextNode ? 0 : textNode.nodeValue.length;

        return new DOM.Point(textNode, offset);
    };

    /**
     * Returns the following node and offset corresponding to the next
     * logical position. With a node and the next position index
     * the following node and in the case of a text node the offset
     * are calculated. For performance reasons, the node can be a
     * jQuery object, so that the start position can be determined from
     * the 'paragraphs' object.
     *
     * @param {Node} node
     *  The node, whose child is searched. For performance reasons, a
     *  jQuery object is also supported. The jQuery object 'paragraphs'
     *  from the editor can be used instead of the main DIV for the editor.
     *
     * @param {Number} pos
     *  The one integer number, that determines the child according to the
     *  parent position.
     *
     * @returns {Node | Number}
     *  The child node and an offset. Offset is only set for text nodes,
     *  otherwise it is undefined.
     */
    Position.getNextChildNode = function (node, pos) {

        var childNode,
            offset;

        if (node instanceof $) {  // true for jQuery objects
            if (pos > node.length - 1) {
                Utils.warn('Position.getNextChildNode(): Array ' + pos + ' is out of range. Last paragraph: ' + node.length - 1);
                return;
            }
            childNode = node.get(pos);
        } else if (node.nodeName === 'TABLE') {
            childNode = $('> TBODY > TR, > THEAD > TR', node).get(pos);
        } else if (node.nodeName === 'TR') {
            childNode = $('> TH, > TD', node).get(pos);  // this is a table cell
        } else if ((node.nodeName === 'TH') || (node.nodeName === 'TD') || (node.nodeName === 'DIV')) {
            childNode = $(node).children().get(pos);
        } else if (node.nodeName === 'P') {
            var textLength = 0,
                bFound = false,
                isImage = false;

            // Checking if this paragraph has children
            if (! node.hasChildNodes()) {
                Utils.warn('Position.getNextChildNode(): paragraph is empty');
                return;
            }

            while (node.hasChildNodes()) {

                var nodeList = node.childNodes;

                for (var i = 0; i < nodeList.length; i++) {

                    // Searching the children
                    var currentLength = 0,
                        currentNode = nodeList[i];

                    if (nodeList[i].nodeName === 'IMG') {
                        // if ((nodeList[i].nodeName === 'IMG') || ($('IMG', nodeList[i]).length > 0)) {  // TODO: if IMGs are allowed in spans, ...
                        currentLength = 1;
                        isImage = true;
                    } else {
                        currentLength = $(nodeList[i]).text().length;
                        isImage = false;
                    }

                    if (textLength + currentLength >= pos) {
                        bFound = true;
                        node = currentNode;
                        break;  // leaving the for-loop
                    } else {
                        textLength += currentLength;
                    }
                }
            }

            if (! bFound) {
                Utils.warn('Position.getNextChildNode(): Paragraph does not contain position: ' + pos + '. Last position: ' + textLength);
                return;
            }

            childNode = node;

            if (! isImage) {
                offset = pos - textLength;
            } else {
                offset = 0;
            }

        } else {
            Utils.warn('Position.getNextChildNode(): Unknown node: ' + node.nodeName);
            return;
        }

        return new DOM.Point(childNode, offset);
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
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @param {String} selector
     *  The selector against which the dom node is compared.
     *
     * @returns {Numnber | Node}
     *  The index in the logical position or -1, if no corresponding
     *  dom node can be found.
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
                    Utils.error('Position.getLastNodeInformationInPositionByNodeName(): (2) Invalid position: ' + position + ' . Failed to get node at index: ' + counter);
                    break;
                }
            } else {
                // index = -1;
                Utils.error('Position.getLastNodeInformationInPositionByNodeName(): (1) Invalid position: ' + position + ' . Failed to get node at index: ' + counter);
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

     * @param {OXOPam.oxoPosition} position
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

     * @param {OXOPam.oxoPosition} position
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
     * @param {OXOPam.oxoPosition} position
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
     * @param {OXOPam.oxoPosition} position
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
     * Returns if the logical position is a position inside a table.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOPam.oxoPosition} position
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

            domNode = Position.getNextChildNode(domNode, localPos.shift()).node;

            if (domNode) {
                if (domNode.nodeName === 'TABLE') {
                    positionInTable = true;
                    break;
                } else if (domNode.nodeName === 'P') {
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
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @returns {Node}
     *  Returns the last table node of the logical position if available,
     *  otherwise null.
     */
    Position.getCurrentTable = function (startnode, position) {
        return Position.getLastNodeFromPositionByNodeName(startnode, position, 'TABLE');
    };

    /**
     * Convenience function, that returns the last paragraph node, if available.
     * Otherwise null we be returned.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @returns {Node}
     *  Returns the last paragraph node of the logical position if available,
     *  otherwise null.
     */
    Position.getCurrentParagraph = function (startnode, position) {
        return Position.getLastNodeFromPositionByNodeName(startnode, position, 'P');
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
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @returns {jQuery}
     *  Returns all adjacent paragraphs of a paragraph described by
     *  the logical position. This return value is a jQuery object.
     */
    Position.getAllAdjacentParagraphs = function (startnode, position) {

        var allParagraphs = null;

        if ((position.length === 1) || (position.length === 2)) {  // only for performance
            allParagraphs = startnode;
        } else {
            var node = Position.getLastNodeFromPositionByNodeName(startnode, position, 'P');

            if (node) {
                allParagraphs = $(node.parentNode).children();
            }
        }

        return allParagraphs;
    };

    /**
     * Collecting all paragraphs inside a table cell that is described
     * by the logical position. If no table cell is found in the logical
     * position, null will be returned.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @returns {jQuery}
     *  Returns all paragraphs inside the cell. This return value is a
     *  jQuery object. If no cell is found, null will be returned.
     */
    Position.getAllParagraphsFromTableCell = function (startnode, position) {

        var allParagraphs = null,
            cell = Position.getLastNodeFromPositionByNodeName(startnode, position, 'TH, TD');

        if (cell) {
            allParagraphs = $(cell).children();
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
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the last row or -1, if the position
     *  is not included in a table.
     */
    Position.getLastRowIndexInTable = function (startnode, position) {

        var rowIndex = -1,
            table = Position.getLastNodeFromPositionByNodeName(startnode, position, 'TABLE');

        if (table) {
            rowIndex = $('> TBODY > TR, > THEAD > TR', table).length;
            rowIndex--;
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
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the last column of the first row of a
     *  table or -1, if the position is not included in a table.
     */
    Position.getLastColumnIndexInTable = function (startnode, position) {

        var columnIndex = -1,
            table = Position.getLastNodeFromPositionByNodeName(startnode, position, 'TABLE');

        if (table) {
            var row = $('> TBODY > TR, > THEAD > TR', table).get(0);  // first row
            columnIndex = $('> TH, > TD', row).length - 1;
        }

        return columnIndex;
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
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the last column of the specified row of a
     *  table or -1, if the position is not included in a table.
     */
    Position.getLastColumnIndexInRow = function (startnode, position) {

        var columnIndex = -1,
            row = Position.getLastNodeFromPositionByNodeName(startnode, position, 'TR');

        if (row) {
            columnIndex = $('> TH, > TD', row).length - 1;
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
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the row inside a table, or -1, if the
     *  logical position does not contain a row.
     */
    Position.getRowIndexInTable = function (startnode, position) {
        return Position.getLastValueFromPositionByNodeName(startnode, position, 'TR');
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
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the column/cell inside a row, or -1, if the
     *  logical position does not contain a column/cell.
     */
    Position.getColumnIndexInRow = function (startnode, position) {
        return Position.getLastValueFromPositionByNodeName(startnode, position, 'TH, TD');
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
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the paragraph inside the document row
     *  or inside a table cell, or -1, if the
     *  logical position does not contain a paragraph.
     */
    Position.getParagraphIndex = function (startnode, position) {
        return Position.getLastValueFromPositionByNodeName(startnode, position, 'P');
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
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the last cell inside a row, or -1, if the
     *  logical position does not contain a cell.
     */
    Position.getLastParaIndexInCell = function (startnode, position) {

        var lastPara = -1,
            cell = Position.getLastNodeFromPositionByNodeName(startnode, position, 'TH, TD');

        if (cell) {
            lastPara = $(cell).children().length - 1;
        }

        return lastPara;
    };

    /**
     * Determining the length of the text nodes of the current paragraph
     * specified by the logical position inside a row.
     * If no paragraph is defined by the logical position, 0 is returned.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the length of all text nodes inside the paragraph or 0,
     *  if the logical position does not contain a paragraph.
     */
    Position.getParagraphLength = function (startnode, position) {

        var paraLen = 0,
            paragraph = Position.getLastNodeFromPositionByNodeName(startnode, position, 'P');

        if (paragraph) {
            if (paragraph.hasChildNodes()) {
                var nodeList = paragraph.childNodes;
                for (var i = 0; i < nodeList.length; i++) {
                    paraLen += $(nodeList[i]).text().length;
                    if (nodeList[i].nodeName === 'IMG') {
                        paraLen++;
                    }
                    // paraLen += $('IMG', nodeList[i]).length;  // TODO: if IMGs are allowed in spans, ...
                }
            }
        }

        return paraLen;
    };

    /**
     * Checks, if a specified position is the first position
     * inside a text node in a cell in a table.
     *
     * @param {OXOPam.oxoPosition} pos
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
                if ((domPos) && (domPos.node.nodeName === 'TD' || domPos.node.nodeName === 'TH')) {
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
     * @param {OXOPam.oxoPosition} pos
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
                if ((domPos) && (domPos.node.nodeName === 'TD' || domPos.node.nodeName === 'TH')) {
                    isCellEndPosition = true;
                }
            }
        }

        return isCellEndPosition;
    };

    /**
     * Checks, if two logical positions reference a position
     * inside the same paragraph. Both logical positions must
     * be 'complete'. They must contain the character position
     * as last value. Only this value can be different.
     *
     * @param {OXOPam.oxoPosition} posA
     *  The logical position.
     *
     * @param {OXOPam.oxoPosition} posB
     *  The logical position.
     *
     * @returns {Boolean}
     *  Returns true, if both positions reference a position within
     *  the same paragraph. Otherwise false is returned.
     */
    Position.isSameParagraph = function (posA, posB) {
        // Assuming that the position is complete, only the last parameter
        // is allowed to be different.

        var isSamePara = true;

        if (posA.length === posB.length) {
            var max = posA.length - 1;  // excluding position
            for (var i = 0; i < max; i++) {
                if (posA[i] !== posB[i]) {
                    isSamePara = false;
                    break;
                }
            }
        } else {
            isSamePara = false;
        }

        return isSamePara;
    };

    /**
     * Checks, if two logical positions reference two positions
     * inside two adjacent paragraphs. Both logical positions must
     * be 'complete'. They must contain the character position
     * as last value. Only the last two values in the array
     * representing the paragraph and the character position
     * can be different.
     *
     * @param {OXOPam.oxoPosition} posA
     *  The logical position.
     *
     * @param {OXOPam.oxoPosition} posB
     *  The logical position.
     *
     * @returns {Boolean}
     *  Returns true, if the positions reference positions within
     *  two adjacent paragraphs. Otherwise false is returned.
     */
    Position.isSameParagraphLevel = function (posA, posB) {
        // Assuming that the position is complete, only the two last parameters
        // are allowed to be different.
        var isSameLevel = true;

        if (posA.length === posB.length) {
            var max = posA.length - 2;  // excluding position and paragraph
            for (var i = 0; i < max; i++) {
                if (posA[i] !== posB[i]) {
                    isSameLevel = false;
                    break;
                }
            }
        } else {
            isSameLevel = false;
        }

        return isSameLevel;
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

     * @param {OXOPam.oxoPosition} posA
     *  The logical position.
     *
     * @param {OXOPam.oxoPosition} posB
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
            var tableA = Position.getLastPositionFromPositionByNodeName(startnode, posA, 'TABLE'),
                tableB = Position.getLastPositionFromPositionByNodeName(startnode, posB, 'TABLE');

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
     * Checks, if two logical positions represent a cell selection.
     * This means, that the logical position was calculated from a
     * dom node, that was a table row. Therefore 'selectedNodeName'
     * is saved in the OXOPaM object next to OXOPaM.oxoPosition.
     * selectedNodeName === 'TR' is at the moment only supported
     * from Firefox.
     *
     * @param {OXOPam} startPaM
     *  The OXOPaM object containing the logical position.
     *
     * @param {OXOPam} endPaM
     *  The OXOPaM object containing the logical position.
     *
     * @returns {Boolean}
     *  Returns true, if both positions were calculated from dom
     *  nodes with the nodeName property set to 'TR'.
     *  Otherwise false is returned.
     */
    Position.isCellSelection = function (startPaM, endPaM) {
        // If cells in a table are selected, both positions must have the selectedNodeName 'tr'.
        // This is valid only in Firefox.
        return (startPaM.selectedNodeName === 'TR' && endPaM.selectedNodeName === 'TR');
    };

    /**
     * Checks, if two logical positions represent an image selection.
     * This means, that the logical position was calculated from a
     * dom node, that was an image. Therefore 'selectedNodeName'
     * is saved in the OXOPaM object next to OXOPaM.oxoPosition.
     *
     * @param {OXOPam} startPaM
     *  The OXOPaM object containing the logical position.
     *
     * @param {OXOPam} endPaM
     *  The OXOPaM object containing the logical position.
     *
     * @returns {Boolean}
     *  Returns true, if both positions were calculated from dom
     *  nodes with the nodeName property set to 'IMG'.
     *  Otherwise false is returned.
     */
    Position.isImageSelection = function (startPaM, endPaM) {
        return (startPaM.selectedNodeName === 'IMG' && endPaM.selectedNodeName === 'IMG');
    };

    /**
     * Calculating the last logical position inside a paragraph or a
     * table. In a table the last cell can again be filled with a table.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOPaM.oxoPosition} paragraph
     *  The logical position.
     *
     * @returns {OXOPaM.oxoPosition}
     *  Returns the last logical position inside a paragraph or
     *  a table. If the parameter 'paragraph' is a logical position, that
     *  is not located inside a table or paragraph, null is returned.
     */
    Position.getLastPositionInParagraph = function (startnode, paragraph) {

        var paraPosition = Position.getLastPositionFromPositionByNodeName(startnode, paragraph, 'P, TABLE');

        if ((paraPosition) && (paraPosition.length > 0)) {

            while (Position.getDOMPosition(startnode, paraPosition).node.nodeName === 'TABLE') {
                paraPosition.push(Position.getLastRowIndexInTable(startnode, paraPosition));
                paraPosition.push(Position.getLastColumnIndexInTable(startnode, paraPosition));
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
     * @param {OXOPaM.oxoPosition} paragraph
     *  The logical position.
     *
     * @returns {OXOPaM.oxoPosition}
     *  Returns the first logical position inside a paragraph or
     *  a table. If the parameter 'paragraph' is a logical position, that
     *  is not located inside a table or paragraph, null is returned.
     */
    Position.getFirstPositionInParagraph = function (startnode, paragraph) {

        var paraPosition = Position.getLastPositionFromPositionByNodeName(startnode, paragraph, 'P, TABLE');

        if ((paraPosition) && (paraPosition.length > 0)) {

            while (Position.getDOMPosition(startnode, paraPosition).node.nodeName === 'TABLE') {
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
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOPaM.oxoPosition} paragraph
     *  The logical position.
     *
     * @returns {OXOPaM.oxoPosition, Boolean}
     *  Returns the first logical position inside a following cell. If the
     *  end of the table is reached, the value for 'endOfTable' is set to
     *  true. Otherwise it is false.
     */
    Position.getFirstPositionInNextCell = function (startnode, paragraph) {

        var paragraph = Position.getLastPositionFromPositionByNodeName(startnode, paragraph, 'TH, TD'),
            endOfTable = false;

        if ((paragraph) && (paragraph.length > 0)) {

            var column = paragraph.pop(),
                row = paragraph.pop(),
                lastRow = Position.getLastRowIndexInTable(startnode, paragraph),
                lastColumn = Position.getLastColumnIndexInTable(startnode, paragraph);

            if (column < lastColumn) {
                column += 1;
            } else {
                if (row < lastRow) {
                    row += 1;
                    column = 0;
                } else {
                    endOfTable = true;
                }
            }

            if (! endOfTable) {
                paragraph.push(row);
                paragraph.push(column);
                paragraph.push(0);  // first paragraph
                paragraph = Position.getFirstPositionInParagraph(startnode, paragraph);
            }
        }

        return {position: paragraph, endOfTable: endOfTable};
    };

    /**
     * Calculating the last logical position of a previous table
     * cell. Previous means, from right to left. If the first cell in
     * a row is reached, the last cell in the previous row is used.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOPaM.oxoPosition} paragraph
     *  The logical position.
     *
     * @returns {OXOPaM.oxoPosition, Boolean}
     *  Returns the last logical position inside a previous cell. If the
     *  begin of the table is reached, the value for 'beginOfTable' is set to
     *  true. Otherwise it is false.
     */
    Position.getLastPositionInPrevCell = function (startnode, paragraph) {

        var paragraph = Position.getLastPositionFromPositionByNodeName(startnode, paragraph, 'TH, TD'),
            beginOfTable = false;

        if ((paragraph) && (paragraph.length > 0)) {

            var column = paragraph.pop(),
                row = paragraph.pop(),
                lastColumn = Position.getLastColumnIndexInTable(startnode, paragraph);

            if (column > 0) {
                column -= 1;
            } else {
                if (row > 0) {
                    row -= 1;
                    column = lastColumn;
                } else {
                    beginOfTable = true;
                }
            }

            if (! beginOfTable) {
                paragraph.push(row);
                paragraph.push(column);
                paragraph.push(Position.getLastParaIndexInCell(startnode, paragraph));  // last paragraph
                paragraph = Position.getLastPositionInParagraph(startnode, paragraph);
            }
        }

        return {position: paragraph, beginOfTable: beginOfTable};
    };

    /**
     * Calculating the first logical position of a table cell
     * specified by the parameter 'cellPosition'.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOPaM.oxoPosition} cellPosition
     *  The logical position.
     *
     * @returns {OXOPaM.oxoPosition}
     *  Returns the first logical position inside the specified cell.
     */
    Position.getFirstPositionInCurrentCell = function (startnode, cellPosition) {

        var position = _.copy(cellPosition, true);

        position = Position.getLastPositionFromPositionByNodeName(startnode, position, 'TH, TD');
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
     * @param {OXOPaM.oxoPosition} cellPosition
     *  The logical position.
     *
     * @returns {OXOPaM.oxoPosition}
     *  Returns the last logical position inside the specified cell.
     */
    Position.getLastPositionInCurrentCell = function (startnode, cellPosition) {

        var position = _.copy(cellPosition, true);

        position = Position.getLastPositionFromPositionByNodeName(startnode, position, 'TH, TD');
        position.push(Position.getLastParaIndexInCell(startnode, position));  // last paragraph or table
        position = Position.getLastPositionInParagraph(startnode, position);

        return position;
    };

    /**
     * Calculating the last logical position of the document.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @returns {OXOPaM.oxoPosition}
     *  Returns the last logical position inside the document.
     */
    Position.getLastPositionInDocument = function (startnode) {

        var lastPara = startnode.length - 1,
            oxoPosition = Position.getLastPositionInParagraph(startnode, [lastPara]);

        return oxoPosition;
    };


    return Position;

});
