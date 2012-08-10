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

    /**
     * Debug output info
     *
     * @param {String} str
     *  The string to be displayed in the console.
     */
    function implDbgOutInfo(str) {

        // if (!dbgoutInfos)
        //     return;

        var msg = str;

        msg = msg + ' (' + str.length + ' code points: ';
        for (var i = 0; i < str.length; i++) {
            msg = msg + '[' + str.charCodeAt(i) + ']';
        }

        window.console.log(msg);
    }

    // static class Position =======================================================

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
     * are calculated. For performance reasons, the node can be an
     * jQuery object, so that the start position can be determined from
     * the 'paragraphs' object.
     *
     * @param {Node} node
     *  The node, whose child is searched. For performance reasons, an
     *  jQuery object is also supported. The jQuery object 'paragraphs'
     *  from the editor can be used instead of the main DIV for the editor.
     *
     * @param {Number} pos
     *  The one integer number, that determines the child according to the parent position.
     *
     * @returns {Node | Number}
     *  The child node and an offset. Offset is only required for text nodes.
     */
    Position.getNextChildNode = function (node, pos) {

        var childNode,
            offset;

        if (node instanceof $) {  // true for jQuery objects
            if (pos > node.length - 1) {
                this.implDbgOutInfo('getNextChildNode: Warning: Array ' + pos + ' is out of range. Last paragraph: ' + node.length - 1);
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
                this.implDbgOutInfo('getNextChildNode: Warning: Paragraph is empty');
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
                this.implDbgOutInfo('getNextChildNode: Warning: Paragraph does not contain position: ' + pos + '. Last position: ' + textLength);
                return;
            }

            childNode = node;
            offset = pos - textLength;

        } else {
            this.implDbgOutInfo('getNextChildNode: Warning: Unknown node: ' + node.nodeName);
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
     *  (can be an jQuery object for performance reasons.)
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
            searchedNode = null,
            oxoPos = _.copy(position, true),
            node = startnode;

        while (oxoPos.length > 0) {

            counter++;

            var returnObj = this.getNextChildNode(node, oxoPos.shift());

            if (returnObj) {
                if (returnObj.node) {
                    node = returnObj.node;
                    if ($(node).is(selector)) {
                        index = counter;
                        searchedNode = node;
                    }
                } else {
                    // index = -1;
                    this.implDbgOutInfo('getLastNodeInformationInPositionByNodeName (2): Error: Invalid position: ' + position + ' . Failed to get node at index: ' + counter);
                    break;
                }
            } else {
                // index = -1;
                this.implDbgOutInfo('getLastNodeInformationInPositionByNodeName (1): Error: Invalid position: ' + position + ' . Failed to get node at index: ' + counter);
                break;
            }
        }

        return {index: index, node: searchedNode};
    };

    /**
     * Returns the index of the position, at which the corresponding dom
     * node is of the specified selector. Returns -1, if the selector is
     * never fulfilled.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (can be an jQuery object for performance reasons.)

     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @param {String} selector
     *  The selector against which the dom node is compared.
     *
     * @returns {Numnber}
     *  The index in the logical position or -1, if no corresponding
     *  dom node can be found.
     */
    Position.getLastIndexInPositionByNodeName = function (startnode, position, selector) {

        var index = Position.getLastNodeInformationInPositionByNodeName(startnode, position, selector).index;

        return index;
    };

    /**
     * Returns the dom node which is selected by the specified selector.
     * Returns null, if the selector is never fulfilled.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (can be an jQuery object for performance reasons.)
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
     *  (can be an jQuery object for performance reasons.)
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

    return Position;

});
