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
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/editor/dom', ['io.ox/office/tk/utils'], function (Utils) {

    'use strict';

    // static class DOM =======================================================

    /**
     * Provides classes representing DOM points (DOM.Point) and ranges
     * (DOM.Range), and static helper methods for basic editor DOM
     * manipulation, and access the browser selection.
     */
    var DOM = {};

    // class DOM.Point ========================================================

    /**
     * A DOM text point contains a 'node' attribute referring to a DOM node,
     * and an 'offset' attribute containing an integer offset specifying the
     * position in the contents of the node.
     *
     * @param {Node|jQuery} node
     *  The DOM node selected by this DOM.Point instance. If this object is a
     *  jQuery collection, uses the first DOM node it contains.
     *
     * @param {Number} [offset]
     *  An integer offset relative to the DOM node specifying the position in
     *  the node's contents. If the node is a text node, the offset represents
     *  the character position in the node text. If the node is an element
     *  node, the offset specifies the index of a child node of this node. The
     *  value of the offset may be equal to the text length respectively the
     *  number of child nodes, in this case the DOM point refers to the
     *  position directly after the node's contents. If omitted, this DOM.Point
     *  instance refers to the start of the entire node, instead of specific
     *  contents.
     */
    DOM.Point = function (node, offset) {

        // fields -------------------------------------------------------------

        this.node = Utils.getDomNode(node);
        this.offset = offset;

        // methods ------------------------------------------------------------

        /**
         * Returns a new clone of this DOM point.
         */
        this.clone = function () {
            return new DOM.Point(this.node, this.offset);
        };

        /**
         * Validates this instance. Restricts the offset to the available index
         * range according to the node's contents, or initializes the offset,
         * if it is missing.
         *
         * If this instance points to a text node, the offset will be
         * restricted to the text in the node, or set to zero if missing.
         *
         * If this instance points to an element node, the offset will be
         * restricted to the number of child nodes in the node. If the offset
         * is missing, it will be set to the index of the node in its siblings,
         * and the node will be replaced by its parent node.
         *
         * @returns {DOM.Point}
         *  A reference to this instance.
         */
        this.validate = function () {

            // element: if offset is missing, take own index and refer to the parent node
            if (Utils.isElementNode(this.node)) {
                if (_.isNumber(this.offset)) {
                    this.offset = Math.min(Math.max(this.offset, 0), this.node.childNodes.length);
                } else {
                    this.offset = $(this.node).index();
                    this.node = this.node.parentNode;
                }

            // text node: if offset is missing, use zero
            } else if (Utils.isTextNode(this.node)) {
                if (_.isNumber(this.offset)) {
                    this.offset = Math.min(Math.max(this.offset, 0), this.node.nodeValue.length);
                } else {
                    this.offset = 0;
                }
            }

            return this;
        };

    }; // class DOM.Point

    /**
     * Returns whether the two passed DOM points are equal.
     *
     * @param {DOM.Point} point1
     *  The first DOM point. Must be valid (see DOM.Point.validate() method for
     *  details).
     *
     * @param {DOM.Point} point2
     *  The second DOM point. Must be valid (see DOM.Point.validate() method
     *  for details).
     *
     * @returns {Boolean}
     *  Whether the DOM points are equal.
     */
    DOM.equalPoints = function (point1, point2) {
        return (point1.node === point2.node) && (point1.offset === point2.offset);
    };

    /**
     * Returns an integer indicating how the two text points are located to
     * each other.
     *
     * @param {DOM.Point} point1
     *  The first DOM point. Must be valid (see DOM.Point.validate() method for
     *  details).
     *
     * @param {DOM.Point} point2
     *  The second DOM point. Must be valid (see DOM.Point.validate() method
     *  for details).
     *
     * @returns {Number}
     *  The value zero, if the DOM points are equal, a negative number, if
     *  point1 precedes point2, or a positive number, if point1 follows point2.
     */
    DOM.comparePoints = function (point1, point2) {

        // Returns the index of the inner node's ancestor in the outer node's
        // children list. 'outerNode' MUST contain 'innerNode'.
        function calculateOffsetInOuterNode(outerNode, innerNode) {
            while (innerNode.parentNode !== outerNode) {
                innerNode = innerNode.parentNode;
            }
            return $(innerNode).index();
        }

        // equal nodes: compare by offset
        if (point1.node === point2.node) {
            return point1.offset - point2.offset;
        }

        // Node in point1 contains the node in point2: point1 is before point2,
        // if offset of point1 (index of its child node) is less than or equal
        // to the offset of point2's ancestor node in the children of point1's
        // node. If offsets are equal, point2 is a descendant of the child node
        // pointed to by point1 and therefore located after point1.
        if (point1.node.contains(point2.node)) {
            return (point1.offset <= calculateOffsetInOuterNode(point1.node, point2.node)) ? -1 : 1;
        }

        // Node in point2 contains the node in point1: see above, reversed.
        if (point2.node.contains(point1.node)) {
            return (calculateOffsetInOuterNode(point2.node, point1.node) < point2.offset) ? -1 : 1;
        }

        // Neither node contains the other: compare nodes regardless of offset.
        return Utils.isNodeBeforeNode(point1.node, point2.node) ? -1 : 1;
    };

    // class DOM.Range ========================================================

    DOM.Range = function (start, end) {

        // fields -------------------------------------------------------------

        this.start = start;
        this.end = _.isObject(end) ? end : _.clone(start);

        // methods ------------------------------------------------------------

        /**
         * Returns a new clone of this DOM range.
         */
        this.clone = function () {
            return new DOM.Range(this.start.clone(), this.end.clone());
        };

        this.validate = function () {
            this.start.validate();
            this.end.validate();
            return this;
        };

        this.adjust = function () {
            if (DOM.comparePoints(this.start, this.end) > 0) {
                var tmp = this.start;
                this.start = this.end;
                this.end = tmp;
            }
            return this;
        };

        this.isCollapsed = function () {
            return DOM.equalPoints(this.start, this.end);
        };

    }; // class DOM.Range

    DOM.makeRange = function (startNode, startOffset, endNode, endOffset) {
        return new DOM.Range(new DOM.Point(startNode, startOffset), _.isObject(endNode) ? new DOM.Point(endNode, endOffset) : undefined);
    };

    // static functions =======================================================

    // text node manipulation -------------------------------------------------

    /**
     * Ensures that the passed text node is embedded in its own <span> element.
     * If the <span> element is missing, it will be inserted into the DOM.
     *
     * @param {Text} textNode
     *  The DOM text node to be embedded in a <span> element.
     *
     * @returns {HTMLElement}
     *  The parent <span> element (already existing or just created) of the
     *  text node.
     */
    DOM.wrapTextNode = function (textNode) {

        var // parent element of the text node
            parent = textNode.parentNode;

        if (Utils.getNodeName(parent) !== 'span') {

            // put text node into a span element, if not existing
            $(textNode).wrap('<span>');
            parent = textNode.parentNode;

            // Copy the paragraph's font-size to the span, and reset the
            // font-size of the paragraph, otherwise CSS defines a lower limit
            // for the line-height of all spans according to the parent
            // paragraph's font-size.
            $(parent).css('font-size', $(parent.parentNode).css('font-size'));
            $(parent.parentNode).css('font-size', '0');
        }

        return parent;
    };

    /**
     * Splits the passed text node into two text nodes. Additionally ensures
     * that the text nodes are embedded in their own <span> elements.
     *
     * @param {Text} textNode
     *  The DOM text node to be split.
     *
     * @param {Number} offset
     *  The character position the text node will be split. If this position is
     *  at the start or end of the text of the node, an empty text node may be
     *  inserted if needed (see the 'options.createEmpty' option below).
     *
     * @param {Object} [options]
     *  A map of options to control the split operation. Supports the following
     *  options:
     *  @param {Boolean} [options.append]
     *      If set to true, the right part of the text will be inserted after
     *      the passed text node; otherwise the left part of the text will be
     *      inserted before the passed text node. May be important when
     *      iterating and manipulating a range of DOM nodes.
     *  @param {Boolean} [options.createEmpty]
     *      If set to true, creates new text nodes also if the offset points to
     *      the start or end of the text. The new text node will be empty.
     *      Otherwise, no new text node will be created in this case, and the
     *      method returns null.
     *
     * @returns {Text|Null}
     *  The newly created text node. Will be located before or after the passed
     *  text node, depending on the 'append' parameter. If no text node has
     *  been created (see the 'options.createEmpty' option above), returns
     *  null.
     */
    DOM.splitTextNode = function (textNode, offset, options) {

        var // put text node into a span element, if not existing
            span = DOM.wrapTextNode(textNode),
            // the new span for the split text portion, as jQuery object
            newSpan = null,
            // text for the left span
            leftText = textNode.nodeValue.substr(0, offset),
            // text for the right span
            rightText = textNode.nodeValue.substr(offset);

        // check if a new text node has to be created
        if (Utils.getBooleanOption(options, 'createEmpty') || (leftText.length && rightText.length)) {
            // create the new span
            newSpan = $(span).clone();
            // insert the span and update the text nodes
            if (Utils.getBooleanOption(options, 'append')) {
                newSpan.insertAfter(span);
                textNode.nodeValue = leftText;
                newSpan.text(rightText);
            } else {
                newSpan.insertBefore(span);
                newSpan.text(leftText);
                textNode.nodeValue = rightText;
            }
        }

        // return the new text node
        return newSpan ? newSpan[0].firstChild : null;
    };

    // range iteration --------------------------------------------------------

    /**
     * Iterates over all DOM nodes contained in the specified DOM text ranges.
     *
     * @param {DOM.Range[]|DOM.Range} ranges
     *  The DOM ranges whose text nodes will be iterated. May be an array of
     *  DOM range objects, or a single DOM range object.
     *
     * @param {Function} iterator
     *  The iterator function that will be called for every node. Receives the
     *  DOM node object as first parameter, and the current DOM range object as
     *  second parameter. If the iterator returns the Utils.BREAK object, the
     *  iteration process will be stopped immediately.
     *
     * @param {Object} [context]
     *  If specified, the iterator will be called with this context (the symbol
     *  'this' will be bound to the context inside the iterator function).
     *
     * @returns {Utils.BREAK|Undefined}
     *  A reference to the Utils.BREAK object, if the iterator has returned
     *  Utils.BREAK to stop the iteration process, otherwise undefined.
     */
    DOM.iterateNodesInRanges = function (ranges, iterator, context) {

        // returns whether the passed node is before the DOM point and will be iterated
        function isNodeBeforePoint(node, point) {
            // visit a text node that
            return point.isBehindNode(node);
        }

        // convert parameter to an array, clone and adjust ranges, and sort the ranges in DOM order
        ranges = _.chain(ranges).getArray().map(function (range) { return range.clone(); }).invoke('adjust').value();
        ranges.sort(function (range1, range2) { return DOM.comparePoints(range1.start, range2.start); });

        for (var index = 0, range, node; index < ranges.length; index += 1) {
            range = ranges[index];

            // merge following overlapping ranges
            while ((index + 1 < ranges.length) && (DOM.comparePoints(range.end, ranges[index + 1].start) >= 0)) {
                range.end = ranges[index + 1].end;
                ranges.splice(index + 1, 1);
            }

            // get first node in DOM range
            node = range.start.node;
            if (node.nodeType === 1) {
                // element/child node position, go to child node described by offset
                node = node.childNodes[range.start.offset];
            }

            // always visit the node if selected by a cursor
            if (node && range.isCollapsed()) {
                // call iterator for the node, return if iterator returns Utils.BREAK
                if (iterator.call(context, node, range) === Utils.BREAK) { return Utils.BREAK; }
                continue;
            }

            // skip first text node, if DOM range starts directly at its end
            // TODO: is this the desired behavior?
            if (node && (node.nodeType === 3) && (range.start.offset >= node.nodeValue.length)) {
                node = Utils.getNextNodeInTree(node);
            }

            // iterate as long as the end of the range has not been reached
            while (node && (DOM.comparePoints(new DOM.Point(node).validate(), range.end) < 0)) {
                // call iterator for the node, return if iterator returns Utils.BREAK
                if (iterator.call(context, node, range) === Utils.BREAK) { return Utils.BREAK; }
                // find next node
                node = Utils.getNextNodeInTree(node);
            }
        }
    };

    /**
     * Iterates over specific ancestor element nodes of the nodes contained in
     * the specified DOM ranges that match the passed jQuery selector. Each
     * ancestor node is visited exactly once even if it is the ancestor of
     * multiple nodes covered in the passed selection.
     *
     * @param {DOM.Range[]|DOM.Range} ranges
     *  The DOM ranges whose nodes will be iterated. May be an array of DOM
     *  range objects, or a single DOM range object.
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing the DOM ranges. While searching for ancestor
     *  nodes, this root node will never be left, but it may be selected as
     *  ancestor node by itself. If this object is a jQuery collection, uses
     *  the first node it contains.
     *
     * @param {String} selector
     *  A jQuery selector that will be used to find an element while traversing
     *  the chain of parents of the node currently iterated.
     *
     * @param {Function} iterator
     *  The iterator function that will be called for every found ancestor
     *  node. Receives the DOM node object as first parameter, and the current
     *  DOM range as second parameter. If the iterator returns the Utils.BREAK
     *  object, the iteration process will be stopped immediately.
     *
     * @param {Object} [context]
     *  If specified, the iterator will be called with this context (the symbol
     *  'this' will be bound to the context inside the iterator function).
     *
     * @returns {Utils.BREAK|Undefined}
     *  A reference to the Utils.BREAK object, if the iterator has returned
     *  Utils.BREAK to stop the iteration process, otherwise undefined.
     */
    DOM.iterateAncestorNodesInRanges = function (ranges, rootNode, selector, iterator, context) {

        var // all matching nodes the iterator has been called for
            matchingNodes = [];

        rootNode = Utils.getDomNode(rootNode);

        // iterate over all nodes, and try to find the specified parent nodes
        return DOM.iterateNodesInRanges(ranges, function (node, range) {

            // try to find a matching element inside the root node
            while (node) {
                if ($(node).is(selector)) {
                    // skip node if it has been found before
                    if (!_(matchingNodes).contains(node)) {
                        matchingNodes.push(node);
                        if (iterator.call(context, node, range) === Utils.BREAK) { return Utils.BREAK; }
                    }
                    return;
                }
                if (node === rootNode) { return; }
                node = node.parentNode;
            }
        });
    };

    /**
     * Iterates over all text nodes contained in the specified DOM ranges. The
     * iterator function will receive the text node and the character range in
     * its text contents that is covered by the specified DOM ranges.
     *
     * @param {DOM.Range[]|DOM.Range} ranges
     *  The DOM ranges whose text nodes will be iterated. May be an array of
     *  DOM range objects, or a single DOM range object.
     *
     * @param {Function} iterator
     *  The iterator function that will be called for every text node. Receives
     *  the DOM text node object as first parameter, the offset of the first
     *  character as second parameter, the offset after the last character as
     *  third parameter, and the current DOM range as fourth parameter. If the
     *  iterator returns the Utils.BREAK object, the iteration process will be
     *  stopped immediately.
     *
     * @param {Object} [context]
     *  If specified, the iterator will be called with this context (the symbol
     *  'this' will be bound to the context inside the iterator function).
     *
     * @returns {Utils.BREAK|Undefined}
     *  A reference to the Utils.BREAK object, if the iterator has returned
     *  Utils.BREAK to stop the iteration process, otherwise undefined.
     */
    DOM.iterateTextPortionsInRanges = function (ranges, iterator, context) {

        // iterate over all nodes, and process the text nodes
        return DOM.iterateNodesInRanges(ranges, function (node, range) {

            var // cursor instead of selection
                isCursor = range.isCollapsed(),
                // start and end offset of covered text in text node
                start = 0, end = 0;

            // call passed iterator for all text nodes, but skip empty text nodes
            // unless the entire text range consists of this empty text node
            if ((node.nodeType === 3) && (isCursor || node.nodeValue.length)) {
                start = (node === range.start.node) ? Math.min(Math.max(range.start.offset, 0), node.nodeValue.length) : 0;
                end = (node === range.end.node) ? Math.min(Math.max(range.end.offset, start), node.nodeValue.length) : node.nodeValue.length;
                // call iterator for the text node, return if iterator returns Utils.BREAK
                if (iterator.call(context, node, start, end, range) === Utils.BREAK) { return Utils.BREAK; }
            } else if (isCursor && (Utils.getNodeName(node) === 'br')) {
                // cursor selects a single <br> element, visit last preceding text node instead
                node = node.previousSibling;
                if (node && !Utils.isTextNode(node)) {
                    node = Utils.findDescendantNode(node, Utils.isTextNode, this, { reverse: true });
                }
                if (node) {
                    // prepare start, end, and range object
                    start = range.start.offset = end = range.end.offset = node.nodeValue.length;
                    range.start.node = range.end.node = node;
                    // call iterator for the text node, return if iterator returns Utils.BREAK
                    if (iterator.call(context, node, start, end, range) === Utils.BREAK) { return Utils.BREAK; }
                }
            }
        });
    };

    // browser selection ------------------------------------------------------

    /**
     * Returns an array of DOM ranges representing the current browser
     * selection.
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The container element the returned selection will be restricted to.
     *  Only ranges inside this root element will be included in the array.
     *
     * @returns {DOM.Range[]}
     *  The DOM ranges representing the current browser selection.
     */
    DOM.getBrowserSelection = function (rootNode) {

        var // the browser selection
            selection = window.getSelection(),
            // an array of all text ranges
            ranges = [],
            // a single range object
            range = null,
            // the limiting point for valid ranges (next sibling of root node)
            globalEndPos = null;

        // convert parameter to DOM element
        rootNode = Utils.getDomNode(rootNode);

        // end position if the range selects the entire root node
        globalEndPos = new DOM.Point(rootNode).validate();
        globalEndPos.offset += 1;

        // build an array of text range objects holding start and end nodes/offsets
        for (var index = 0; index < selection.rangeCount; index += 1) {

            // get the native selection Range object
            range = selection.getRangeAt(index);

            // translate to the internal text range representation
            range = DOM.makeRange(range.startContainer, range.startOffset, range.endContainer, range.endOffset);

            // check that the nodes are inside the root node
            if (rootNode.contains(range.start.node) && (DOM.comparePoints(range.end, globalEndPos) <= 0)) {
                ranges.push(range);
            }
        }

        return ranges;
    };

    /**
     * Sets the browser selection to the passed DOM ranges.
     *
     * @param {DOM.Range[]|DOM.Range} ranges
     *  The DOM ranges representing the new browser selection. May be an array
     *  of DOM range objects, or a single DOM range object.
     */
    DOM.setBrowserSelection = function (ranges) {

        var // the browser selection
            selection = window.getSelection();

        // process all passed text ranges
        selection.removeAllRanges();
        _.chain(ranges).getArray().each(function (range) {
            try {
                var docRange = window.document.createRange();
                docRange.setStart(range.start.node, range.start.offset);
                docRange.setEnd(range.end.node, range.end.offset);
                selection.addRange(docRange);
            } catch (ex) {
                window.console.log('DOM.setBrowserSelection(): failed to add range to selection');
            }
        });
    };

    // exports ================================================================

    return DOM;

});
