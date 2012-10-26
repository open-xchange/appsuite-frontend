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

        // always use the parent element of a text node
        if (node.nodeType === 3) {
            node = node.parentNode;
        }

        // Starting to calculate the logical position
        var oxoPosition = [],
            evaluateCharacterPosition = DOM.isTextSpan(node) || DOM.isFieldNode(node) || DOM.isObjectNode(node) || $(node).is('img'),
            characterPositionEvaluated = false;

        // currently supported elements: 'div.p', 'table', 'th', 'td', 'tr'
        for (; node && (node !== maindiv.get(0)); node = node.parentNode) {
            if (DOM.isContentNode(node) || $(node).is('tr, td')) {
                oxoPosition.unshift($(node).prevAll().length);  // zero based
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

        isEndPoint = isEndPoint ? true : false;

        // check input values
        if (! node) {
            Utils.error('Position.getTextLevelOxoPosition(): Invalid DOM position. Node not defined');
            return;
        }

        // 1. Handling all selections, in which the node is below paragraph level

        if ((node.nodeType === 3) && (DOM.isListLabelNode(node.parentNode))) {
            node = node.parentNode.nextSibling;
            offset = 0;
            checkImageFloatMode = false;
        }

        // text nodes of fields are embedded in <span> elements in the field <div>
        if (DOM.isFieldTextNode(node)) {
            offset = 0;
            checkImageFloatMode = false;
        }

        if (DOM.isObjectNode(node.parentNode)) {  // inside the contents of an object
            node = node.parentNode;
        }

        if (DOM.isObjectNode(node)) {
            offset = 0;
            if (DOM.isImageNode(node)) {
                imageFloatMode = $(node).data('mode');
                checkImageFloatMode = false;
            }
        }

        // 2. Handling all selections, in which the node is above paragraph level

        // Sometimes (double click in FireFox) a complete paragraph is selected with DIV + Offset 3 and DIV + Offset 4.
        // These DIVs need to be converted to the correct paragraph first.
        // Also cells in columns have to be converted at this point.
        if (DOM.isParagraphNode(node) || DOM.isPageNode(node) || $(node).is('tr, td, th')) {

            var returnObj = Position.getTextNodeFromCurrentNode(node, offset, isEndPoint);

            if (! returnObj) {
                Utils.error('Position.getTextLevelOxoPosition(): Failed to determine text node from node: ' + node.nodeName + " with offset: " + offset);
                return;
            }

            var newNode = returnObj.domPoint;

            imageFloatMode = returnObj.imageFloatMode;
            checkImageFloatMode = false;

            if (newNode) {
                node = newNode.node;
                offset = newNode.offset;
            } else {
                Utils.error('Position.getTextLevelOxoPosition(): Failed to determine text node from node: ' + node.nodeName + " with offset: " + offset);
                return;
            }

        }

        // 3. Special handling to enable image selection, if the following position is an image
        if (checkImageFloatMode) {
            var localNode = node;
            if (localNode.nodeType === 3) {
                localNode = localNode.parentNode;
            }
            if ($(localNode).is('span')) {
                if ($(localNode).text().length === offset) {
                    // Checking if an inline image follows
                    if (DOM.isImageNode(localNode.nextSibling)) {
                        imageFloatMode = $(localNode.nextSibling).data('mode'); // must be 'inline' mode
                    }
                }
            }
        }

        // 4. Calculating the logical position for the specified text node, span, or image
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

        if ($(node).is('img')) {
            characterPositionOffset = 1;
        } else if (DOM.isObjectNode(node)) {
            characterPositionOffset = 1;
        } else if (DOM.isFieldNode(node)) {
            characterPositionOffset = 1;
        } else if ((node.nodeType === 3) && DOM.isFieldNode(node.parentNode.parentNode)) {
            characterPositionOffset = 1;
        } else if (DOM.isPortionSpan(node)) {
            characterPositionOffset = node.firstChild.nodeValue.length;
        } else if (DOM.isPortionTextNode(node)) {
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
     * @param {Boolean} useObjectNode
     *  A boolean value, that needs to be set to 'true' in the special case,
     *  that an image node shall be returned instead of a text node. Typically
     *  previous or following siblings are returned, instead of image nodes.
     *
     * @returns {DOM.Point}
     *  The calculated dom position consisting of dom node and offset.
     *  Offset is only set for text nodes, otherwise it is undefined.
     */
    Position.getDOMPosition = function (startnode, oxoPosition, useObjectNode, forcePositionCounting) {

        var oxoPos = _.copy(oxoPosition, true),
            node = startnode,
            offset = null;

        useObjectNode = useObjectNode ? true : false;
        forcePositionCounting = forcePositionCounting ? true : false;

        if ((oxoPosition === undefined) || (oxoPosition === null)) {
            // Utils.error('Position.getDOMPosition(): oxoPosition is undefined!');
            return;
        }

        if (oxoPos[0] === undefined) {
            // Utils.error('Position.getDOMPosition(): Position is undefined!');
            return;
        }

        while (oxoPos.length > 0) {

            var returnObj = null;

            if (forcePositionCounting) {
                returnObj = Position.getNextChildNodePositionCounting(node, oxoPos.shift());
            } else {
                returnObj = Position.getNextChildNode(node, oxoPos.shift(), useObjectNode);
            }

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
     * Returning the node when interpreting the oxo Position as "real position"
     * and not as start or end point of a range. So [6,0] points to the first
     * character, image or whatever in the seventh paragraph. It is NOT
     * interpreted as cursor position left of the first character. The latter
     * is done in function 'getDOMPosition' and 'getNextChildNode'.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {OXOPaM.oxoPosition} position
     *  The logical position.
     *
     */
    Position.getDOMNodeAtPosition = function (startnode, oxoPosition) {

        var forcePositionCounting = true;
        return Position.getDOMPosition(startnode, oxoPosition, undefined, forcePositionCounting);
    };

    /**
     * Tries to get a DOM element from the specified logical position. The
     * passed position must match the passed selector. Otherwise, a warning
     * will be printed to the debug console.
     *
     * @param {jQuery} paragraphs
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
    Position.getSelectedElement = function (paragraphs, position, selector) {

        var // the DOM node located at the passed position
            domPos = Position.getDOMPosition(paragraphs, position);

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
     * @param {jQuery} paragraphs
     *  The list of top-level content nodes.
     *
     * @param {Number[]} position
     *  The logical position of the target paragraph element.
     *
     * @returns {HTMLElement|Null}
     *  The DOM paragraph element at the passed logical position, if existing,
     *  otherwise null.
     */
    Position.getParagraphElement = function (paragraphs, position) {
        return Position.getSelectedElement(paragraphs, position, DOM.PARAGRAPH_NODE_SELECTOR);
    };

    /**
     * Tries to get a DOM table element from the specified logical position.
     * The passed position must point to a table element. Otherwise, a warning
     * will be printed to the debug console.
     *
     * @param {jQuery} paragraphs
     *  The list of top-level content nodes.
     *
     * @param {Number[]} position
     *  The logical position of the target table element.
     *
     * @returns {HTMLTableElement|Null}
     *  The DOM table element at the passed logical position, if existing,
     *  otherwise null.
     */
    Position.getTableElement = function (paragraphs, position) {
        return Position.getSelectedElement(paragraphs, position, DOM.TABLE_NODE_SELECTOR);
    };

    /**
     * Tries to get a DOM table row element from the specified logical
     * position. The passed position must point to a table row element.
     * Otherwise, a warning will be printed to the debug console.
     *
     * @param {jQuery} paragraphs
     *  The list of top-level content nodes.
     *
     * @param {Number[]} position
     *  The logical position of the target table row element.
     *
     * @returns {HTMLTableRowElement|Null}
     *  The DOM table row element at the passed logical position, if existing,
     *  otherwise null.
     */
    Position.getTableRowElement = function (paragraphs, position) {
        var table = Position.getTableElement(paragraphs, position.slice(0, -1)),
            tableRow = table && $(table).find('> * > tr').get(position[position.length - 1]);
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
     * @param {jQuery} paragraphs
     *  The list of top-level content nodes.
     *
     * @param {Number[]} position
     *  The logical position of the target table cell element.
     *
     * @returns {HTMLTableCellElement|Null}
     *  The DOM table cell element at the passed logical position, if existing,
     *  otherwise null.
     */
    Position.getTableCellElement = function (paragraphs, position) {
        var tableRow = Position.getTableRowElement(paragraphs, position.slice(0, -1)),
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

        if ((isEndPoint) && ($(node).is('tr'))) {
            usePreviousCell = true;
        }

        if ((isEndPoint) && (localNode) && DOM.isObjectNode(localNode.previousSibling)) {
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

        // setting some properties for image nodes
        if (DOM.isImageNode(localNode)) {
            imageFloatMode = $(localNode).data('mode');
            foundValidNode = true;  // image nodes are valid
            offset = isEndPoint ? 1 : 0;
        }

        // checking, if a valid node was already found
        if ((localNode) && (localNode.nodeType === 3)) {
            foundValidNode = true;  // text nodes are valid
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
     * are calculated. Contrary to the function 'getNextChildNode' this
     * function 'getNextChildNodePositionCounting' does not take care of
     * ranges but only of direct positions. So [6,0] points to the first
     * character or image or field in the seventh paragraph, not to a
     * cursor position before.
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
    Position.getNextChildNodePositionCounting = function (node, pos) {

        var childNode,
            offset;

        if (node instanceof $) {  // true for jQuery objects
            if (pos > node.length - 1) {
                // Utils.warn('Position.getNextChildNode(): Array ' + pos + ' is out of range. Last paragraph: ' + (node.length - 1));
                return;
            }
            childNode = node.get(pos);
        } else if (DOM.isTableNode(node)) {
            childNode = $('> * > tr', node).get(pos);
        } else if ($(node).is('tr')) {
            childNode = $('> th, > td', node).get(pos);  // this is a table cell
        } else if (DOM.isPageNode(node) || $(node).is('th, td')) {
            childNode = node.childNodes[pos];
        } else if (DOM.isParagraphNode(node)) {
            Position.iterateParagraphChildNodes(node, function (_node, nodeStart, nodeLength, offsetStart) {
                // first matching node is the requested node, store data and escape from iteration
                childNode = _node;
                offset = offsetStart;
                return Utils.BREAK;
            }, undefined, { start: pos });
        }

        return new DOM.Point(childNode, offset);
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
     * @param {Boolean} useObjectNode
     *  Typically (in the case of a full complete logical position)
     *  text nodes and the corresponding offset are returned. But there are
     *  some cases, in which not the text node, but the image or div, that
     *  can also be located inside a 'div.p', shall be returned. In this cases
     *  useObjectNode has to be set to 'true'. The default is 'false', so
     *  that text nodes are returned.
     *
     * @returns {Node | Number}
     *  The child node and an offset. Offset is only set for text nodes,
     *  otherwise it is undefined.
     */
    Position.getNextChildNode = function (node, pos, useObjectNode) {

        var childNode,
            offset;

        useObjectNode = useObjectNode ? true : false;

        if (node instanceof $) {  // true for jQuery objects
            if (pos > node.length - 1) {
                // Utils.warn('Position.getNextChildNode(): Array ' + pos + ' is out of range. Last paragraph: ' + (node.length - 1));
                return;
            }
            childNode = node.get(pos);
        } else if (DOM.isTableNode(node)) {
            childNode = $('> * > tr', node).get(pos);
        } else if ($(node).is('tr')) {
            childNode = $('> th, > td', node).get(pos);  // this is a table cell
        } else if (DOM.isPageNode(node) || $(node).is('th, td')) {
            childNode = node.childNodes[pos];
        } else if (DOM.isParagraphNode(node)) {
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

                    if (DOM.isObjectNode(currentNode)) {
                        currentLength = 1;
                        isImage = true;
                    } else if (DOM.isFieldNode(currentNode)) {
                        currentLength = 1;
                        isField = true;
                    } else if (DOM.isPortionSpan(currentNode)) {
                        currentLength = $(currentNode).text().length;
                        isImage = false;
                        isField = false;
                    } else {
                        // ignoring for example spans that exist only for positioning image
                        continue;
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
            if ((useObjectNode) && (exactSum)) {  // special handling for images, that exactly fit the position

                var nextNode = node.nextSibling;

                if (DOM.isObjectNode(nextNode)) {  // if the next node is an object, this should be preferred
                    node = nextNode;
                    isImage = true;
                } else if (DOM.isOffsetNode(nextNode) && DOM.isObjectNode(nextNode.nextSibling)) {
                    node = nextNode.nextSibling;
                    isImage = true;
                } else if (DOM.isFieldNode(nextNode)) {  // also preferring following fields
                    node = nextNode;
                    isField = true;
                }
            }

            if ((isImage) || (isField)) {
                if (! useObjectNode) {  // this can lead to to dom positions, that do not fit to the oxo position
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
     * @param {Boolean} useObjectNode
     *  If set to false, only text nodes shall be returned for 'complete'
     *  logical positions. If set to true, it is allowed to return nodes, that
     *  are also described by a 'complete' logical positio, like images or
     *  fields.
     *
     * @returns {DOM.Range}
     *  The calculated selection (DOM.Range) consisting of two dom points (DOM.Point).
     */
    Position.getDOMSelection = function (startnode, oxoSelection, useObjectNode) {

        useObjectNode = useObjectNode ? true : false;

        // Only supporting single selection at the moment
        var start = Position.getDOMPosition(startnode, oxoSelection.startPaM.oxoPosition, useObjectNode),
            endSelection = _.copy(oxoSelection.endPaM.oxoPosition, true);

        if ((useObjectNode) && (start) &&
            (DOM.isObjectNode(start.node)) &&
            (start.offset === 0) &&
            (Position.isOneCharacterSelection(oxoSelection.startPaM.oxoPosition, oxoSelection.endPaM.oxoPosition))) {
            endSelection = _.copy(oxoSelection.startPaM.oxoPosition, true);  // end position is copy of start position, so that end will be start
        }

        var end = Position.getDOMPosition(startnode, endSelection, useObjectNode);

        if (useObjectNode) {

            // if ((start === end) && (start.node.nodeType === 1)) {
            if ((start.node.nodeType === 1) && (start.node.nodeType === 1)) {  // Todo: Clarification
                start = DOM.Point.createPointForNode(start.node);
                end = DOM.Point.createPointForNode(end.node);
            }

        }

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
     * @param {OXOPam.oxoPosition} position
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
     * @param {OXOPam.oxoPosition} position
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

            var node = Position.getLastNodeFromPositionByNodeName(startnode, position, 'th, td');

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
        node = Position.getLastNodeFromPositionByNodeName(startnode, position, DOM.CONTENT_NODE_SELECTOR);

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
            cell = Position.getLastNodeFromPositionByNodeName(startnode, position, 'th, td');

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
            table = Position.getLastNodeFromPositionByNodeName(startnode, position, DOM.TABLE_NODE_SELECTOR);

        if (table) {
            rowIndex = $('> * > tr', table).length;
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
            table = Position.getLastNodeFromPositionByNodeName(startnode, position, DOM.TABLE_NODE_SELECTOR);

        if (table) {
            var row = $('> * > tr', table).get(0);  // first row
            columnIndex = $('> th, > td', row).length - 1;
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
     * @param {OXOPam.oxoPosition} position
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
            columnIndex = $('> th, > td', row).length - 1;
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
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the column/cell inside a row, or -1, if the
     *  logical position does not contain a column/cell.
     */
    Position.getColumnIndexInRow = function (startnode, position) {
        return Position.getLastValueFromPositionByNodeName(startnode, position, 'th, td');
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
     * @param {OXOPam.oxoPosition} position
     *  The logical position.
     *
     * @returns {Number}
     *  Returns the index of the last cell inside a row, or -1, if the
     *  logical position does not contain a cell.
     */
    Position.getLastParaIndexInCell = function (startnode, position) {

        var lastPara = -1,
            cell = Position.getLastNodeFromPositionByNodeName(startnode, position, 'th, td');

        if (cell) {
            lastPara = $(cell).children().length - 1;
        }

        return lastPara;
    };

    /**
     * Returns the logical length of the content nodes of the paragraph located
     * at the specified logical position. Text fields and object nodes have a
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
     * Returns the logical start index of a paragraph child node in its
     * paragraph. The passed node may be any child node of a paragraph (either
     * an editable content node, or a helper node such as an offset container
     * used to position floated objects).
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
                if ((domPos) && ($(domPos.node).is('th, td'))) {
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
                if ((domPos) && ($(domPos.node).is('th, td'))) {
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
     * @param {OXOPaM.oxoPosition} paragraph
     *  The logical position.
     *
     * @returns {OXOPaM.oxoPosition}
     *  Returns the first logical position inside a paragraph or
     *  a table. If the parameter 'paragraph' is a logical position, that
     *  is not located inside a table or paragraph, null is returned.
     */
    Position.getFirstPositionInParagraph = function (startnode, paragraph) {

        var paraPosition = Position.getLastPositionFromPositionByNodeName(startnode, paragraph, DOM.CONTENT_NODE_SELECTOR);

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

        paragraph = Position.getLastPositionFromPositionByNodeName(startnode, paragraph, 'th, td');

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

        paragraph = Position.getLastPositionFromPositionByNodeName(startnode, paragraph, 'th, td');

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
                    var localParagraph = Position.getLastPositionFromPositionByNodeName(startnode, paragraph, 'th, td');
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

        position = Position.getLastPositionFromPositionByNodeName(startnode, position, 'th, td');
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

        position = Position.getLastPositionFromPositionByNodeName(startnode, position, 'th, td');
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
            assignedPos = (DOM.isParagraphNode(node)) ? position : Position.getLastPositionFromPositionByNodeName(startnode, position, DOM.PARAGRAPH_NODE_SELECTOR);
            break;
        case 'table':
            assignedPos = (DOM.isTableNode(node)) ? position : Position.getLastPositionFromPositionByNodeName(startnode, position, DOM.TABLE_NODE_SELECTOR);
            break;
        case 'tablerow':
            assignedPos = ($(node).is('tr')) ? position : Position.getLastPositionFromPositionByNodeName(startnode, position, 'tr');
            break;
        case 'tablecell':
            assignedPos = ($(node).is('th, td')) ? position : Position.getLastPositionFromPositionByNodeName(startnode, position, 'th, td');
            break;
        default:
            Utils.error('Position.getFamilyAssignedPosition(): Invalid family type: ' + family);
        }

        return assignedPos;
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
     * Calculating the first text node position in a paragraph.
     *
     * @param {HTMLElement|jQuery} paragraph
     *  A paragraph node. If this object is a jQuery collection, uses the first
     *  DOM node it contains.
     *
     * @returns {Number}
     *  The position of the first text node in the passed paragraph.
     */
    Position.getFirstTextNodePositionInParagraph = function (paragraph) {

        var counter = 0;

        Utils.iterateDescendantNodes(paragraph, function (node) {
            if (DOM.isFloatingObjectNode(node)) {
                counter += 1;
            } else if (DOM.isPortionSpan(node)) {
                return Utils.BREAK;
            }
        }, undefined, { children: true });

        return counter;
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
     * floating objects at the beginning of the paragraph.
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

        if ((paraNode) && ($(paraNode).children('div.float').length > 0)) {

            var child = paraNode.firstChild;

            while (child) {

                var nextChild = child.nextSibling;

                if (DOM.isOffsetNode(child) && !DOM.isObjectNode(nextChild)) {
                    var removeElement = child;
                    $(removeElement).remove();
                } else if (!DOM.isFloatingObjectNode(child)) {
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
     * @param {OXOPaM.oxoPosition} position
     *  The logical position.
     */
    Position.removeUnusedImageDivs = function (startnode, position) {

        var paraNode = Position.getCurrentParagraph(startnode, position);

        if ((paraNode) && ($(paraNode).children(DOM.OFFSET_NODE_SELECTOR).length > 0)) {

            var child = paraNode.firstChild;

            while (child) {

                var nextChild = child.nextSibling;

                if (DOM.isOffsetNode(child) && !DOM.isObjectNode(nextChild)) {
                    $(child).remove();
                }

                child = nextChild;
            }
        }

    };

    /**
     * Checking, if two logical positions have a difference of one
     * in the final position and are equal in all other positions.
     *
     * @param {OXOPaM.oxoPosition} pos1
     *  The first logical position.
     *
     * @param {OXOPaM.oxoPosition} pos2
     *  The second logical position.
     *
     * @returns {Boolean}
     *  Returns true, if pos2 is directly following pos1 with a
     *  difference of 1.
     */
    Position.isOneCharacterSelection = function (_pos1, _pos2) {

        var pos1 = _.copy(_pos1, true),
            pos2 = _.copy(_pos2, true),
            lastPos1 = pos1.pop(),
            lastPos2 = pos2.pop();

        return (_.isEqual(pos1, pos2)) && (lastPos2 === lastPos1 + 1);
    };

    // iteration --------------------------------------------------------------

    /**
     * Calls the passed iterator function for all or selected child elements in
     * a paragraph node (text spans, text fields, objects, and other helper
     * nodes).
     *
     * @param {HTMLElement|jQuery} paragraph
     *  The paragraph element whose child nodes will be visited. If this object
     *  is a jQuery collection, uses the first DOM node it contains.
     *
     * @param {Function} iterator
     *  The iterator function that will be called for every matching node.
     *  Receives the DOM node object as first parameter, the logical start
     *  index of the node in the paragraph as second parameter, the logical
     *  length of the node as third parameter, the relative start offset of the
     *  covered part in the child node as fourth parameter, and the offset
     *  length of the covered part of the child node as fifth parameter. The
     *  last two parameters are important if the options 'options.start' and
     *  'options.end' will be used to iterate over a specific sub-range in the
     *  paragraph where the first and last visited text nodes may be covered
     *  only partly. Note that text fields and object nodes have a logical
     *  length of 1, and other helper nodes that do not represent editable
     *  contents have a logical length of 0. If the iterator returns the
     *  Utils.BREAK object, the iteration process will be stopped immediately.
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
     *      visited (non-empty text portions, text fields, and object nodes).
     *  @param {Number} [options.start=0]
     *      The logical index of the first node to be included into the
     *      iteration process. Text spans covered partly will be visited too.
     *  @param {Number} [options.end=0x7FFFFFFF]
     *      The logical index of the last node to be included in the iteration
     *      process. Text spans covered partly will be visited too. Note that
     *      this index is considered inclusive (NOT a half-open range).
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
            nodeStart = 0;

        // visit the content nodes of the specified paragraph element (only child nodes, no other descendants)
        return Utils.iterateDescendantNodes(paragraph, function (node) {

            var // the logical length of the node
                nodeLength = 0,
                // start offset of partly covered nodes
                offsetStart = 0,
                // offset length of partly covered nodes
                offsetLength = 0,
                // whether node is a regular text span
                isTextSpan = DOM.isTextSpan(node);

            // calculate length of the node
            if (isTextSpan) {
                // portion nodes contain regular text
                nodeLength = node.firstChild.nodeValue.length;
            } else if (DOM.isFieldNode(node) || DOM.isObjectNode(node)) {
                // text fields and objects count as one character
                nodeLength = 1;
            }

            // node ends before the specified start index (continue with next node)
            if (_.isNumber(rangeStart) && (nodeStart + nodeLength <= rangeStart)) {
                nodeStart += nodeLength;
                return;
            }
            // node starts after the specified end index (escape from iteration)
            if (_.isNumber(rangeEnd) && (rangeEnd < nodeStart)) {
                return Utils.BREAK;
            }

            // always visit non-empty nodes
            if (allNodes || (nodeLength > 0)) {

                // calculate offset start and length of partly covered text nodes
                offsetStart = Math.max(rangeStart - nodeStart, 0);
                offsetLength = Math.min(rangeEnd - nodeStart + 1, nodeLength) - offsetStart;

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
    };

    // position ---------------------------------------------------------------

    /**
     * Returns the DOM node that corresponds to the specified logical position,
     * relative to a root node that contains top-level content nodes (e.g.
     * paragraphs and tables). Nodes that may cover several logical positions
     * (e.g. text spans) will be found even if their actual start position does
     * not match the passed position.
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing top-level content nodes. If this object is a
     *  jQuery collection, uses the first node it contains.
     *
     * @param {Number[]} position
     *  The logical position of the node to be returned.
     *
     * @param {Object} [options]
     *  A map with additional options to control the behavior of this method.
     *  The following options are supported:
     *  @param {Number} [options.arrayIndex=0]
     *      If specified, the 'position' array will be evaluated starting at
     *      the element with this array index. By default, evaluation will
     *      start at the beginning of the position array.
     *
     * @returns {Object}
     *  An object that contains the DOM node in the 'node' attribute, the
     *  logical start index of this node in the 'start' attribute (usually
     *  equal to the last element of the 'position' array, but may differ when
     *  addressing a sub component in a node containing multiple sub
     *  components, such as characters in a text span), and the relative offset
     *  of the sub component addressed by the 'position' array (usually 0,
     *  except for nodes containing multiple sub components) in the 'offset'
     *  attribute.
     */
    Position.getNodeInfoAtPosition = function (rootNode, position, options) {

        var // index of current element in the 'position' array
            arrayIndex = Utils.getIntegerOption(options, 'arrayIndex', 0),
            // the result object to be returned
            nodeInfo = { node: null, offset: 0 },
            // temprary storage for current paragraph
            paragraph = null;

        // increases array index and returns whether it is still valid
        function nextArrayIndex() {
            arrayIndex += 1;
            return arrayIndex < position.length;
        }

        // check input parameters
        if ((arrayIndex < 0) || (arrayIndex >= position.length)) {
            Utils.warn('Position.getNodeInfoAtPosition(): invalid array index');
            return nodeInfo;
        }

        // resolve the top-level content node
        // for performance, root nodes MUST NOT contain anything else than content nodes
        nodeInfo.node = Utils.getDomNode(rootNode).childNodes[position[arrayIndex]];
        if (!nodeInfo.node) {
            Utils.warn('Position.getNodeInfoAtPosition(): invalid index of content node: ' + position[arrayIndex]);
            return nodeInfo;
        }
        if (!nextArrayIndex()) { return nodeInfo; }

        // paragraph: resolve paragraph child node
        if (DOM.isParagraphNode(nodeInfo.node)) {

            // get child node in paragraph (first reset nodeInfo.node to catch invalid position)
            paragraph = nodeInfo.node;
            nodeInfo.node = null;
            Position.iterateParagraphChildNodes(paragraph, function (node, nodeStart, nodeLength, offsetStart) {
                // first matching node is the requested node, store data and escape from iteration
                nodeInfo = { node: node, offset: offsetStart };
                return Utils.BREAK;
            }, undefined, { start: position[arrayIndex] });

            if (!nodeInfo.node) {
                Utils.warn('Position.getNodeInfoAtPosition(): invalid index of paragraph child node: ' + position[arrayIndex]);
                return nodeInfo;
            }

            // there cannot be more nested nodes
            if (nextArrayIndex()) { Utils.warn('Position.getNodeInfoAtPosition(): too many values in position'); }
            return nodeInfo;
        }

        // table: resolve rows, cells, and cell contents
        if (DOM.isTableNode(nodeInfo.node)) {

            // get table row
            nodeInfo.node = $(nodeInfo.node).find('> tbody > tr').get(position[arrayIndex]);
            if (!nodeInfo.node) {
                Utils.warn('Position.getNodeInfoAtPosition(): invalid index for table row: ' + position[arrayIndex]);
                return nodeInfo;
            }
            if (!nextArrayIndex()) { return nodeInfo; }

            // get table cell
            nodeInfo.node = $(nodeInfo.node).children('td').get(position[arrayIndex]);
            if (!nodeInfo.node) {
                Utils.warn('Position.getNodeInfoAtPosition(): invalid index for table cell: ' + position[arrayIndex]);
                return nodeInfo;
            }
            if (!nextArrayIndex()) { return nodeInfo; }

            // find a node inside table cell
            return Position.getNodeInfoAtPosition(nodeInfo.node, position, { arrayIndex: arrayIndex });
        }

        Utils.error('Position.getNodeInfoAtPosition(): unknown content node');
        nodeInfo.node = null;
        return nodeInfo;
    };

    // exports ================================================================

    return Position;

});
