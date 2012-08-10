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

define('io.ox/office/editor/position', ['io.ox/office/tk/utils', 'io.ox/office/editor/dom'], function (Utils, DOM) {

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
            var textLength = 0;
            var bFound = false;

            // Checking if this paragraph has children
            if (! node.hasChildNodes()) {
                Utils.warn('Position.getNextChildNode(): paragraph is empty');
                return;
            }

            while (node.hasChildNodes()) {

                var nodeList = node.childNodes;

                for (var i = 0; i < nodeList.length; i++) {
                    // Searching the children
                    var currentNode = nodeList[i];
                    var currentLength = $(nodeList[i]).text().length;
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
            offset = pos - textLength;

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
                returnObj = this.getNextChildNode(node, valueSave);

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
                }
            }
        }

        return paraLen;
    };


    return Position;

});
