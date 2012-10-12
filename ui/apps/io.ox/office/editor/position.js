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
     'io.ox/office/editor/oxopam',
     'io.ox/office/editor/oxoselection'
    ], function (Utils, DOM, OXOPaM, OXOSelection) {

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
     * @param {Node} node
     *  The dom node, whose logical position will be calculated.
     *
     * @param {Number} offset
     *  An additional offset, that can be used to modify the last position
     *  inside the logical position array. This is typically only useful
     *  for text nodes.

     * @returns {OXOPaM.oxoPosition} oxoPosition
     *  The logical position.
     */
    Position.getOxoPosition = function (maindiv, node, offset) {

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
        if (!maindiv.get(0).contains(node)) { // range not in text area
            Utils.error('Position.getOxoPosition(): Invalid DOM position. It is not part of the editor DIV: ! Offset : ' + offset + ' . Node: ' + node.nodeName + ',' + node.nodeType);
            return;
        }

        // Starting to calculate the logical position
        var oxoPosition = [],
            evaluateCharacterPosition = ((node.nodeType === 3) || (Utils.getNodeName(node) === 'span') || (Utils.getNodeName(node) === 'img')) ? true : false,  // Is evaluation of offset required?
            characterPositionEvaluated = false,
            textLength = 0;

        // currently supported elements: 'p', 'table', 'th', 'td', 'tr'
        for (; node && (node !== maindiv.get(0)); node = node.parentNode) {
            if ($(node).is('TABLE, P, TR, TH, TD')) {
                oxoPosition.unshift($(node).prevAll().length);  // zero based
                evaluateCharacterPosition = false;
            }
            if (evaluateCharacterPosition) {
                for (var prevNode = node; (prevNode = prevNode.previousSibling);) {
                    if ((DOM.isFieldSpan(prevNode)) || (DOM.isImageSpan(prevNode))) {
                        textLength += 1;  // images and fields are counted as single character
                    } else {
                        textLength += $(prevNode).text().length;
                    }
                }
                characterPositionEvaluated = true;
            }
        }

        if (characterPositionEvaluated) {
            oxoPosition.push(textLength + offset);
        }

        return oxoPosition;
    };

    /**
     * This function calculates the logical position from dom positions.
     * Receiving a dom position consisting of a dom node and an offset, it
     * calculates the logical position (oxoPosition) that is an array of
     * integer values. This logical position is saved together with the
     * property nodeName of the dom node in the OXOPaM object, that is
     * the return value of this function. The calculated logical position
     * is always a valid text level position. This means, that even if the
     * dom position is a DIV, a TR or a similar node type, the logical position
     * describes always the position of a text node or image or field.
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
    Position.getTextLevelOxoPosition = function (domposition, maindiv, isEndPoint) {

        var node = domposition.node,
            offset = domposition.offset,
            selectedNodeName = node.nodeName,
            imageFloatMode = null,
            checkImageFloatMode = true;

        if (DOM.isFieldSpan(node.parentNode)) {
            offset = 0;
            checkImageFloatMode = false;
        }

        if (DOM.isImageSpan(node)) {
            offset = 0;
            imageFloatMode = $(node).data('mode');
            checkImageFloatMode = false;
        }

        isEndPoint = isEndPoint ? true : false;

        // check input values
        if (! node) {
            Utils.error('Position.getTextLevelOxoPosition(): Invalid DOM position. Node not defined');
            return;
        }

        // Sometimes (double click in FireFox) a complete paragraph is selected with DIV + Offset 3 and DIV + Offset 4.
        // These DIVs need to be converted to the correct paragraph first.
        // Also cells in columns have to be converted at this point.
        if ($(node).is('DIV, P, TR, TD, TH')) {

            var returnObj = Position.getTextNodeFromCurrentNode(node, offset, isEndPoint);

            if (! returnObj) {
                Utils.error('Position.getTextLevelOxoPosition(): Failed to determine text node from node: ' + node.nodeName + " with offset: " + offset);
                return;
            }

            var newNode = returnObj.domPoint;

            imageFloatMode = returnObj.imageFloatMode;

            if (newNode) {
                node = newNode.node;
                offset = newNode.offset;
            } else {
                Utils.error('Position.getTextLevelOxoPosition(): Failed to determine text node from node: ' + node.nodeName + " with offset: " + offset);
                return;
            }

        } else {

            if (checkImageFloatMode) {
                var localNode = node;
                if (localNode.nodeType === 3) {
                    localNode = localNode.parentNode;
                }
                if (Utils.getNodeName(localNode) === 'span') {
                    if ($(localNode).text().length === offset) {
                        // Checking if an inline image follows
                        if ((localNode.nextSibling) && (DOM.isImageSpan(localNode.nextSibling))) {
                            imageFloatMode = $(localNode.nextSibling).data('mode'); // must be 'inline' mode
                        }
                    }
                }
            }

        }

        // calculating the logical position for the specified text node, span, or image
        var oxoPosition = Position.getOxoPosition(maindiv, node, offset);

        return new OXOPaM(oxoPosition, selectedNodeName, imageFloatMode);
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
     * @returns {OXOSelection} oxoSelection
     *  The selection consisting of start and end point.
     */
    Position.getOxoSelectionForNode = function (maindiv, node, useRangeMode) {

        var offset = 0,
            startPosition = Position.getOxoPosition(maindiv, node, offset),
            endPosition = _.copy(startPosition),
            characterPositionOffset = 0;

        // if node is a text node, a span or an image, then startposition and
        // endposition are not equal.

        if (Utils.getNodeName(node) === 'img') {
            characterPositionOffset = 1;
        } else if (DOM.isImageSpan(node)) {
            characterPositionOffset = 1;
        } else if (DOM.isFieldSpan(node)) {
            characterPositionOffset = 1;
        } else if (Utils.getNodeName(node) === 'span') {
            characterPositionOffset = $(node).text().length;
        } else if ((node.nodeType === 3) && DOM.isFieldSpan(node.parentNode)) {
            characterPositionOffset = 1;
        } else if (node.nodeType === 3) {
            characterPositionOffset = node.nodeValue.length;
        }

        if ((!useRangeMode) && (characterPositionOffset > 0)) {
            characterPositionOffset -= 1;
        }

        if (characterPositionOffset > 0) {
            endPosition[endPosition.length - 1] += characterPositionOffset;
        }

        return new OXOSelection(new OXOPaM(startPosition), new OXOPaM(endPosition));
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
     * @param {Boolean} returnImageNode
     *  A boolean value, that needs to be set to 'true' in the special case,
     *  that an image node shall be returned instead of a text node. Typically
     *  previous or following siblings are returned, instead of image nodes.
     *
     * @returns {DOM.Point}
     *  The calculated dom position consisting of dom node and offset.
     *  Offset is only set for text nodes, otherwise it is undefined.
     */
    Position.getDOMPosition = function (startnode, oxoPosition, returnImageNode) {

        var oxoPos = _.copy(oxoPosition, true),
            node = startnode,
            offset = null;

        returnImageNode = returnImageNode ? true : false;

        if ((oxoPosition === undefined) || (oxoPosition === null)) {
            // Utils.error('Position.getDOMPosition(): oxoPosition is undefined!');
            return;
        }

        if (oxoPos[0] === undefined) {
            // Utils.error('Position.getDOMPosition(): Position is undefined!');
            return;
        }

        while (oxoPos.length > 0) {

            var returnObj = Position.getNextChildNode(node, oxoPos.shift(), returnImageNode);

            if (returnObj) {
                if (returnObj.node) {
                    node = returnObj.node;
                    if (_(returnObj.offset).isNumber()) {
                        offset = returnObj.offset;
                    }
                } else {
                    // Utils.warn('Position.getDOMPosition() (1): Failed to determine node for position: ' + oxoPosition);
                    return;
                }
            } else {
                // Utils.warn('Position.getDOMPosition() (2): Failed to determine node for position: ' + oxoPosition);
                return;
            }
        }

        return new DOM.Point(node, offset);
    };

    /**
     * Helper function for Position.getTextLevelOxoPosition. If the node is not
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
     * @returns {Object}
     *  The text node, that will be used in Position.getTextLevelOxoPosition
     *  for the calculation of the logical position.
     *  And additionally some information about the floating state of an
     *  image, if the position describes an image.
     */
    Position.getTextNodeFromCurrentNode = function (node, offset, isEndPoint) {

        var useFirstTextNode = true,  // can be false for final child in a paragraph
            usePreviousCell = false,
            foundValidNode = false,
            localNode = node.childNodes[offset], // offset can be zero for start points but too high for end points
            imageFloatMode = null,
            offsetSave = offset;

        offset = 0;

        if ((Utils.getNodeName(node) === 'tr') && (isEndPoint)) {
            usePreviousCell = true;
        }

        if ((! localNode) || (usePreviousCell)) {
            localNode = node.childNodes[offsetSave - 1];
            useFirstTextNode = false;
        }

        // special handling for <br>, use last preceding text node instead
        if (localNode && (Utils.getNodeName(localNode) === 'br')) {
            localNode = localNode.previousSibling;
            useFirstTextNode = false;
        }

        // setting some properties for image nodes
        if (localNode && (DOM.isImageSpan(localNode))) {
            imageFloatMode = $(localNode).data('mode');
            foundValidNode = true;
            offset = 0;
        }

        // checking, if a valid node was already found
        if ((localNode) && (localNode.nodeType === 3)) {
            foundValidNode = true;
        }

        var foundNode = localNode;

        if (! foundValidNode) {
            // find the first or last text node contained in the element
            if (localNode && (localNode.nodeType !== 3)) {
                foundNode = useFirstTextNode ? Utils.findFirstTextNode(localNode) : Utils.findLastTextNode(localNode);
                if (foundNode) {
                    localNode = foundNode;
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

        return {domPoint: new DOM.Point(foundNode, offset), imageFloatMode: imageFloatMode};
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
     * @param {Boolean} returnImageNode
     *  Typically (in the case of a full complete logical position)
     *  text nodes and the corresponding offset are returned. But there are
     *  some cases, in which not the text node, but the image or div, that
     *  can also be located inside a 'p', shall be returned. In this cases
     *  returnImageNode has to be set to 'true'. The default is 'false', so
     *  that text nodes are returned.
     *
     * @returns {Node | Number}
     *  The child node and an offset. Offset is only set for text nodes,
     *  otherwise it is undefined.
     */
    Position.getNextChildNode = function (node, pos, returnImageNode) {

        var childNode,
            offset;

        returnImageNode = returnImageNode ? true : false;

        if (node instanceof $) {  // true for jQuery objects
            if (pos > node.length - 1) {
                // Utils.warn('Position.getNextChildNode(): Array ' + pos + ' is out of range. Last paragraph: ' + (node.length - 1));
                return;
            }
            childNode = node.get(pos);
        } else if (node.nodeName === 'TABLE') {
            childNode = $('> TBODY > TR, > THEAD > TR', node).get(pos);
        } else if (node.nodeName === 'TR') {
            childNode = $('> TH, > TD', node).get(pos);  // this is a table cell
        } else if ((node.nodeName === 'TH') || (node.nodeName === 'TD') || ((node.nodeName === 'DIV') && !$(node).hasClass('float'))) {
            childNode = $(node).children().get(pos);
        } else if (node.nodeName === 'P') {
            var textLength = 0,
                bFound = false,
                isImage = false,
                isField = false,
                exactSum = false;

            // Checking if this paragraph has children
            if (! node.hasChildNodes()) {
                Utils.warn('Position.getNextChildNode(): paragraph is empty');
                return;
            }

            while ((node.hasChildNodes()) && (! bFound)) {

                var nodeList = node.childNodes,
                    lastChild = false;

                for (var i = 0; i < nodeList.length; i++) {

                    // Searching the children
                    var currentLength = 0,
                        currentNode = nodeList[i];

                    if (i === (nodeList.length - 1)) {
                        lastChild = true;
                    }

                    if ((Utils.getNodeName(currentNode) === 'div') && $(currentNode).hasClass('float')) {
                        // ignoring spans that exist only for positioning image
                        continue;
                    } else if (DOM.isImageSpan(currentNode)) {
                        currentLength = 1;
                        isImage = true;
                    } else if (DOM.isFieldSpan(currentNode)) {
                        currentLength = 1;
                        isField = true;
                    } else {  // this is a span. it can contain text node or image node
                        currentLength = $(currentNode).text().length;
                        isImage = false;
                        isField = false;
                    }

                    if (textLength + currentLength >= pos) {

                        if (textLength + currentLength === pos) {
                            exactSum = true;
                        }

                        bFound = true;
                        node = currentNode;
                        break;  // leaving the for-loop

                    } else {
                        textLength += currentLength;
                    }
                }

                if ((! bFound) && (lastChild)) {
                    break; // avoiding endless loop
                }
            }

            if (! bFound) {
                Utils.warn('Position.getNextChildNode(): Paragraph does not contain position: ' + pos + '. Last position: ' + textLength);
                return;
            }

            // which node shall be returned, if the position is at the border between two nodes?
            if ((returnImageNode) && (exactSum)) {  // special handling for images, that exactly fit the position

                var nextNode = node.nextSibling;

                if ((nextNode) && (DOM.isImageSpan(nextNode))) {  // if the next node is an image span, this should be preferred
                    node = nextNode;
                    isImage = true;
                } else if ((nextNode) && (Utils.getNodeName(nextNode) === 'div') && (nextNode.nextSibling) && (DOM.isImageSpan(nextNode.nextSibling))) {
                    node = nextNode.nextSibling;
                    isImage = true;
                } else if ((nextNode) && (DOM.isFieldSpan(nextNode))) {  // also preferring following fields
                    node = nextNode;
                    isField = true;
                }
            }

            if ((isImage) || (isField)) {
                if (! returnImageNode) {  // this can lead to to dom positions, that do not fit to the oxo position
                    // if the position is an image or field, the dom position shall be the following text node
                    if (isImage) {
                        childNode = Utils.findNextNodeInTree(node, Utils.JQ_TEXTNODE_SELECTOR); // can be more in a row without text span between them
                        offset = 0;
                    } else if (isField) {
                        childNode = node.nextSibling.firstChild; // following the div field must be a text span (like inline images)
                        offset = 0;
                    }
                } else {
                    childNode = node;
                    offset = pos - textLength;  // offset might be'1', if (textLength + currentLength) > pos . It is always '0', if exactSum is 'true'.
                }
            } else {
                childNode = node;
                if (childNode.nodeType !== 3) {
                    childNode = childNode.firstChild;  // using text node instead of span node
                }
                offset = pos - textLength;
            }

        } else {
            Utils.warn('Position.getNextChildNode(): Unknown node: ' + node.nodeName);
            return;
        }

        return new DOM.Point(childNode, offset);
    };

    /**
     * Converts a selection consisting of two logical positions to a selection
     * (range) consisting of two dom nodes and the corresponding offsets (DOM.Point).
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOSelection} oxoSelection
     *  The logical selection consisting of two logical positions.
     *
     * @param {Boolean} useNonTextNode
     *  If set to false, only text nodes shall be returned for 'complete'
     *  logical positions. If set to true, it is allowed to return nodes, that
     *  are also described by a 'complete' logical positio, like images or
     *  fields.
     *
     * @returns {DOM.Range}
     *  The calculated selection (DOM.Range) consisting of two dom points (DOM.Point).
     */
    Position.getDOMSelection = function (startnode, oxoSelection, useNonTextNode) {

        useNonTextNode = useNonTextNode ? true : false;

        // Only supporting single selection at the moment
        var start = Position.getDOMPosition(startnode, oxoSelection.startPaM.oxoPosition, useNonTextNode),
            end = Position.getDOMPosition(startnode, oxoSelection.endPaM.oxoPosition, useNonTextNode);

        // if ((start === end) && (start.node.nodeType === 1)) {
        //     start = DOM.Point.createPointForNode(start.node);
        //     end = DOM.Point.createPointForNode(end.node);
        //     end.offset += 1;
        // }

        // DOM selection is always an array of text ranges
        // TODO: fallback to HOME position in document instead of empty array?
        return (start && end) ? [new DOM.Range(start, end)] : [];
    };

    /**
     * This function is only used for the multi selection for rectangle
     * cell selection that is only possible in Firefox. It converts a given
     * logical selection that describe a rectangle of cells inside a table
     * to an array of ranges. In this array every range describes a table
     * cell selection. This multi selection is only supported by the
     * Firefox browser.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOSelection} oxoSelection
     *  The logical selection consisting of two logical positions.
     *
     * @returns {[DOM.Range]} ranges
     *  The calculated selections (array of ranges DOM.Range) each
     *  consisting of two dom points (DOM.Point).
     */
    Position.getCellDOMSelections = function (startnode, oxoSelection) {

        var ranges = [];

        var startPos = _.copy(oxoSelection.startPaM.oxoPosition, true),
            endPos = _.copy(oxoSelection.endPaM.oxoPosition, true);

        startPos.pop();
        startPos.pop();
        endPos.pop();
        endPos.pop();

        var startCol = startPos.pop(),
            startRow = startPos.pop(),
            endCol = endPos.pop(),
            endRow = endPos.pop();

        for (var i = startRow; i <= endRow; i++) {
            for (var j = startCol; j <= endCol; j++) {
                var position = _.copy(startPos, true);
                position.push(i);
                position.push(j);
                var cell = Position.getDOMPosition(startnode, position);
                if (cell && $(cell.node).is('td, th')) {
                    ranges.push(DOM.Range.createRangeForNode(cell.node));
                }
            }
        }

        return ranges;
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
     * Returns 'true' if the logical position is a position inside a
     * table, otherwise false.
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

            var nextChild = Position.getNextChildNode(domNode, localPos.shift());

            if (nextChild) {

                domNode = nextChild.node;

                if (domNode) {
                    if (domNode.nodeName === 'TABLE') {
                        positionInTable = true;
                        break;
                    } else if (domNode.nodeName === 'P') {
                        break;
                    }
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

            var node = Position.getLastNodeFromPositionByNodeName(startnode, position, 'TH, TD');

            if (node) {
                allParagraphs = $(node).children();
            }
        }

        return allParagraphs;
    };

    /**
     * Function, that returns the count of all adjacent paragraphs
     * or tables of a paragraph or table described by the logical
     * position. The logical position can describe a paragraph (table)
     * or a text node inside it. If no node is found, '-1' will be
     *  returned.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the count of all adjacent paragraphs or tables of
     *  a paragraph(table) described by the logical position.
     *  Of no paragraph/table is found, -1 will be returned.
     */
    Position.getCountOfAdjacentParagraphsAndTables = function (startnode, position) {

        var lastIndex = -1,
        node = Position.getLastNodeFromPositionByNodeName(startnode, position, 'P, TABLE');

        if (node) {
            lastIndex = $(node.parentNode).children().length - 1;
        }

        return lastIndex;
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
     * Determining the maximum number of columns in a table, which
     * is the number of grids. Returned is the number of grids, the
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
     *  Returns the index of the last grid of a  table or -1,
     *  if the position is not included in a table.
     */
    Position.getLastGridIndexInTable = function (startnode, position) {

        var gridIndex = -1,
            table = Position.getLastNodeFromPositionByNodeName(startnode, position, 'TABLE');

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
                    if ((DOM.isImageSpan(nodeList[i])) || (DOM.isFieldSpan(nodeList[i]))) {
                        paraLen++;
                    } else {
                        paraLen += $(nodeList[i]).text().length;
                    }
                }
            }
        }

        return paraLen;
    };

    /**
     * Returning the text content of the text nodes of the current
     * paragraph specified by the logical position.
     * If no paragraph is defined by the logical position, an empty
     * string is returned.
     * If the optional parameter start end end are defined, a
     * substring is returned. The position 'end' is not included
     * into the substring.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @param {Number} start (optional)
     *  An integer value for the start of an substring.
     *
     * @param {Number} end (optional)
     *  An integer value for the end of an substring. The character
     *  at this position is not included into the substring.
     *
     * @returns {String}
     *  Returns the text of all text nodes inside the paragraph or
     *  empty string, if the logical position does not contain a
     *  paragraph.
     */
    Position.getParagraphText = function (startnode, position, start, end) {

        var paraText = '',
            paragraph = Position.getLastNodeFromPositionByNodeName(startnode, position, 'P');

        if (paragraph) {
            if (paragraph.hasChildNodes()) {
                var nodeList = paragraph.childNodes;
                for (var i = 0; i < nodeList.length; i++) {
                    if (DOM.isImageSpan(nodeList[i])) {
                        paraText += 'I';  // placeholder for an image
                    } else {
                        paraText += $(nodeList[i]).text();
                    }
                }
            }
        }

        if ((paraText !== '') && _.isNumber(start) && _.isNumber(end)) {
            paraText = paraText.substring(start, end);
        }

        return paraText;
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

        var endOfTable = false;

        paragraph = Position.getLastPositionFromPositionByNodeName(startnode, paragraph, 'TH, TD');

        if ((paragraph) && (paragraph.length > 0)) {

            var column = paragraph.pop(),
                lastColumn = Position.getLastColumnIndexInRow(startnode, paragraph),
                row = paragraph.pop(),
                lastRow = Position.getLastRowIndexInTable(startnode, paragraph);

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

        var beginOfTable = false,
            continueSearch = true;

        paragraph = Position.getLastPositionFromPositionByNodeName(startnode, paragraph, 'TH, TD');

        while ((paragraph) && (paragraph.length > 0) && (continueSearch)) {

            var column = paragraph.pop(),
                row = paragraph.pop();

            if (column > 0) {
                column -= 1;
            } else {
                if (row > 0) {
                    row -= 1;
                    var localRow = _.copy(paragraph, true);
                    localRow.push(row);
                    column = Position.getLastColumnIndexInRow(startnode, row);
                } else {
                    beginOfTable = true;
                }
            }

            if (! beginOfTable) {
                paragraph.push(row);
                paragraph.push(column);
                paragraph.push(Position.getLastParaIndexInCell(startnode, paragraph));  // last paragraph
                paragraph = Position.getLastPositionInParagraph(startnode, paragraph);
                continueSearch = false;
            } else {
                // column and row are 0. So there is no previous cell,
                // or the previous cell is inside an outer table.

                // is there a paragraph/table directly before this first cell?
                if (paragraph[paragraph.length - 1] === 0) {  // <- this is the first paragraph/table
                    var localParagraph = Position.getLastPositionFromPositionByNodeName(startnode, paragraph, 'TH, TD');
                    if ((localParagraph) && (localParagraph.length > 0)) {
                        paragraph = localParagraph;
                        beginOfTable = false;
                    } else {
                        continueSearch = false;
                    }
                } else {
                    // simply jump into preceeding paragraph/table
                    beginOfTable = true;
                    continueSearch = false;
                }
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

    /**
     * Calculating the correct logical position that fits to the
     * family. Allowed values for family are 'paragraph' and
     * 'character'. So the logical position has to describe
     * the position of a paragraph or character.
     *
     * @param {String} family
     *  The string describing the 'family'.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOPaM.oxoPosition} position
     *  The logical position.
     *
     * @returns {OXOPaM.oxoPosition}
     *  Returns the logical position inside the document or null,
     *  if no correct assignment can be made
     */
    Position.getFamilyAssignedPosition = function (family, startnode, position) {

        var assignedPos = null,
            node = Position.getDOMPosition(startnode, position).node;

        switch (family) {
        case 'character':
            assignedPos = (node.nodeType === 3) ? position : null;
            break;
        case 'paragraph':
            assignedPos = (Utils.getNodeName(node) === 'p') ? position : Position.getLastPositionFromPositionByNodeName(startnode, position, 'P');
            break;
        case 'table':
            assignedPos = (Utils.getNodeName(node) === 'table') ? position : Position.getLastPositionFromPositionByNodeName(startnode, position, 'TABLE');
            break;
        case 'tablerow':
            assignedPos = (Utils.getNodeName(node) === 'tr') ? position : Position.getLastPositionFromPositionByNodeName(startnode, position, 'TR');
            break;
        case 'tablecell':
            assignedPos = ((Utils.getNodeName(node) === 'th') || (Utils.getNodeName(node) === 'td')) ? position : Position.getLastPositionFromPositionByNodeName(startnode, position, 'TH, TD');
            break;
        default:
            Utils.error('Position.getFamilyAssignedPosition(): Invalid family type: ' + family);
        }

        return assignedPos;
    };

    /**
     * Calculating the correct family that fits to the logical
     * position. Allowed values for family are 'paragraph', 'image' and
     * 'character'. So the family has to fit to the node, that
     * is described by the logical position.
     *
     * @param {String} family
     *  The string describing the 'family'.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOPaM.oxoPosition} position
     *  The logical position.
     *
     * @returns {String}
     *  Returns the family that fits to the logical position or null,
     *  if no correct assignment can be made
     */
    Position.getPositionAssignedFamily = function (startnode, startposition, isImageAttribute) {

        var family = null,
            returnImageNode = isImageAttribute ? true : false,
            domPos = Position.getDOMPosition(startnode, startposition, returnImageNode);

        if (domPos) {
            var node = domPos.node;

            if (node.nodeType === 3) {
                family = 'character';
            } else if (Utils.getNodeName(node) === 'p') {
                family = 'paragraph';
            } else if ((Utils.getNodeName(node) === 'img') || (DOM.isImageSpan(node))) {
                family = 'image';
            } else if (Utils.getNodeName(node) === 'table') {
                family = 'table';
            } else if (Utils.getNodeName(node) === 'tr') {
                family = 'tablerow';
            } else if ((Utils.getNodeName(node) === 'th') || (Utils.getNodeName(node) === 'td')) {
                family = 'tablecell';
            } else {
                Utils.error('Position.getPositionAssignedFamily(): Cannot determine family from position: ' + startposition);
            }
        }

        return family;
    };

    /**
     * Calculating the logical position of a character in a text node
     * that preceds the logical position of the input parameter.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {jQuery} maindiv
     *  The jQuery object of a DIV node, that is the frame for the complete
     *  search and calculation process. No dom position outside of this
     *  maindiv can be calculated.
     *
     * @param {OXOPaM.oxoPosition} position
     *  The logical position. It must be the position of a character in
     *  a textnode.
     *
     * @returns {OXOPaM.oxoPosition}
     *  Returns the preceding position. If there is no paragraph preceding
     *  the paragraph of the input position, the input position itself is
     *  returned. This can be expanded to tables in the future.
     */
    Position.getPreviousTextNodePosition = function (startnode, maindiv, position) {

        var precedingPos = _.copy(position, true),
            foundPos = false,
            characterVal = precedingPos.pop();

        if (characterVal > 0) {
            characterVal -= 1;
            precedingPos.push(characterVal);
            foundPos = true;
        } else {
            var node = Position.getDOMPosition(startnode, precedingPos).node,
                textNode = Utils.findPreviousNodeInTree(node, Utils.JQ_TEXTNODE_SELECTOR),
                offset = textNode.nodeValue.length;

            if (maindiv.get(0).contains(textNode)) {
                precedingPos = Position.getTextLevelOxoPosition(new DOM.Point(textNode, offset), maindiv).oxoPosition;
                foundPos = true;
            }
        }

        if (! foundPos) {
            precedingPos = _.copy(position, true);
        }

        return precedingPos;
    };

    /**
     * Calculating the logical position of a character in a text node
     * that follows the logical position of the input parameter.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {jQuery} maindiv
     *  The jQuery object of a DIV node, that is the frame for the complete
     *  search and calculation process. No dom position outside of this
     *  maindiv can be calculated.
     *
     * @param {OXOPaM.oxoPosition} position
     *  The logical position. It must be the position of a character in
     *  a textnode.
     *
     * @returns {OXOPaM.oxoPosition}
     *  Returns the preceding position. If there is no paragraph preceding
     *  the paragraph of the input position, the input position itself is
     *  returned. This can be expanded to tables in the future.
     */
    Position.getFollowingTextNodePosition = function (startnode, maindiv, position) {

        var followingPos = _.copy(position, true),
            foundPos = false,
            maxLength = Position.getDOMPosition(startnode, followingPos).node.nodeValue.length,
            characterVal = followingPos.pop();

        if (characterVal < maxLength) {
            characterVal += 1;
            followingPos.push(characterVal);
            foundPos = true;
        } else {
            followingPos.push(characterVal);

            var node = Position.getDOMPosition(startnode, followingPos).node,
                textNode = Utils.findNextNodeInTree(node, Utils.JQ_TEXTNODE_SELECTOR),
                offset = 0;

            if (maindiv.get(0).contains(textNode)) {
                followingPos = Position.getTextLevelOxoPosition(new DOM.Point(textNode, offset), maindiv).oxoPosition;
                foundPos = true;
            }
        }

        if (! foundPos) {
            followingPos = _.copy(position, true);
        }

        return followingPos;
    };

    /**
     * Checks if a specified node has the data property 'mode' set to 'leftFloated'
     * or 'rightFloated' or 'noneFloated'.
     *
     * @param {HTMLElement|jQuery} node
     *  A DOM element object or jQuery element, that is checked, if it contains
     *  the data property 'mode' set to 'leftFloated' or 'rightFloated' or 'noneFloated'.
     *  If it is a DOM element, it is jQuerified first.
     *
     * @returns {Boolean}
     *  A boolean containing the information, if the specified node has the data
     *  property 'mode' set to 'leftFloated' or 'rightFloated' or 'noneFloated'.
     */
    Position.hasFloatProperty = function (node) {
        var floatMode = $(node).data('mode');
        return _(['leftFloated', 'rightFloated', 'noneFloated']).contains(floatMode);
    };


    /**
     * Checks if a specified node has the data property 'mode' set to 'inline'.
     * This are typically Images that are inline.
     *
     * @param {HTMLElement|jQuery} node
     *  A DOM element object or jQuery element, that is checked.
     *  If it is a DOM element, it is jQuerified first.
     *
     * @returns {Boolean}
     *  A boolean containing the information, if the specified node has the data
     *  property 'mode' set to inline.
     */
    Position.hasInlineFloatProperty = function (node) {
        return $(node).data('mode') === 'inline';
    };

    /**
     * Counting the number of floated elements at the beginning of a paragraph.
     * Typically the floated elements are images.
     *
     * @param {HTMLElement} node
     *  A DOM element object.
     *
     * @returns {Number}
     *  The number of the floated elements, that are children of parameter 'node'
     *  and that are the first children of 'node'.
     */
    Position.getNumberOfFloatedImagesInParagraph = function (node) {

        var counter = 0,
            child = node.firstChild,
            continue_ = true;

        while ((child !== null) && (continue_)) {

            if ((DOM.isImageSpan(child)) && ($(child).hasClass('float'))) {
                counter++;
                child = child.nextSibling;
            } else if ((Utils.getNodeName(child) === 'div') && ($(child).hasClass('float'))) {
                // ignoring divs that exist only for positioning image
                child = child.nextSibling;
            } else {
                continue_ = false;
            }
        }

        // return $(node).find('img.float').length;  // to be used in the future

        return counter;
    };

    /**
     * Determining the position of a node (for example an image)
     * in a paragraph.
     *
     * @param Node paragraph
     *  The paragraph node, in which the node (second parameter) is
     *  searched.
     *
     * @param Node node
     *  The node (for example an image), whose position shall be found.
     *
     * @returns Number
     *  Returns the integer value representing the position of the
     *  searched node in the paragraph. Returns '-1', if the node cannot
     *  be found inside the paragraph.
     */
    Position.getObjectPositionInParagraph = function (paragraph, node) {

        var position = 0,
            found = false;

        if (paragraph) {
            if (paragraph.hasChildNodes()) {
                var nodeList = paragraph.childNodes;
                for (var i = 0; i < nodeList.length; i++) {
                    if (nodeList[i] === node) {
                        found = true;
                        break;
                    }
                    if ((DOM.isImageSpan(nodeList[i])) || (DOM.isFieldSpan(nodeList[i]))) {
                        position++;
                    } else {
                        position += $(nodeList[i]).text().length;
                    }
                }
            }
        }

        if (! found) {
            position = -1;
        }

        return position;
    };

    /**
     * After splitting a paragraph, it might be necessary to remove
     * leading empty text spans at the beginning of the paragraph. This
     * is especially important, if there are following floated images.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOPaM.oxoPosition} position
     *  The logical position.
     */
    Position.removeLeadingEmptyTextSpans = function (startnode, position) {

        var paraNode = Position.getCurrentParagraph(startnode, position);

        if ((paraNode) && ($(paraNode).find('div.float').length > 0)) {

            var child = paraNode.firstChild,
                continue_ = true;

            while ((child !== null) && (continue_)) {

                if (DOM.isEmptySpan(child)) {
                    var removeElement = child;
                    child = child.nextSibling;
                    $(removeElement).remove();
                } else if ((Utils.getNodeName(child) === 'div') && ($(child).hasClass('float'))) {
                    child = child.nextSibling;
                } else {
                    continue_ = false;
                }
            }
        }

    };

    /**
     * After splitting a paragraph, it might be necessary to remove
     * leading divs belonging to floated images at the beginning of
     * the paragraph.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOPaM.oxoPosition} position
     *  The logical position.
     */
    Position.removeLeadingImageDivs = function (startnode, position) {

        var paraNode = Position.getCurrentParagraph(startnode, position);

        if ((paraNode) && ($(paraNode).find('div.float').length > 0)) {

            var child = paraNode.firstChild,
                continue_ = true;

            while ((child !== null) && (continue_)) {

                var nextChild = child.nextSibling;

                if ((Utils.getNodeName(child) === 'div') && ($(child).hasClass('float')) && (! DOM.isImageSpan(nextChild))) {
                    var removeElement = child;
                    child = child.nextSibling;
                    $(removeElement).remove();
                } else if ((DOM.isImageSpan(child)) && ($(child).hasClass('float'))) {
                    child = child.nextSibling;
                } else {
                    continue_ = false;
                }
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
     * @param {OXOPaM.oxoPosition} position
     *  The logical position.
     */
    Position.removeUnusedImageDivs = function (startnode, position) {

        var paraNode = Position.getCurrentParagraph(startnode, position);

        if ((paraNode) && ($(paraNode).find('div.float').length > 0)) {

            var child = paraNode.firstChild;

            while (child !== null) {

                var nextChild = child.nextSibling;

                if ((Utils.getNodeName(child) === 'div') && ($(child).hasClass('float')) && (! DOM.isImageSpan(nextChild))) {
                    var removeElement = child;
                    $(removeElement).remove();
                }

                child = nextChild;
            }
        }

    };

    /**
     * Checking, if two logical positions are equal. Returns true,
     * if the positions are equal, otherwise false.
     *
     * @param {OXOPaM.oxoPosition} pos1
     *  The first logical position.
     *
     * @param {OXOPaM.oxoPosition} pos2
     *  The second logical position.
     *
     * @returns {Boolean}
     *  Returns true, if the positions are equal, otherwise false.
     */
    Position.positionsAreEqual = function (pos1, pos2) {
        return (_.copy(pos1).join('') === _.copy(pos2).join(''));
    };

    return Position;

});
