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
     * @constructor
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
        this.node = Utils.getDomNode(node);
        this.offset = offset;
    };

    // methods ----------------------------------------------------------------

    /**
     * Returns a new clone of this DOM point.
     */
    DOM.Point.prototype.clone = function () {
        return new DOM.Point(this.node, this.offset);
    };

    /**
     * Validates the offset of this DOM point. Restricts the offset to the
     * available index range according to the node's contents, or
     * initializes the offset, if it is missing.
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
    DOM.Point.prototype.validate = function () {

        // element: if offset is missing, take own index and refer to the parent node
        if (this.node.nodeType === 1) {
            if (_.isNumber(this.offset)) {
                this.offset = Utils.minMax(this.offset, 0, this.node.childNodes.length);
            } else {
                this.offset = $(this.node).index();
                this.node = this.node.parentNode;
            }

        // text node: if offset is missing, use zero
        } else if (this.node.nodeType === 3) {
            if (_.isNumber(this.offset)) {
                this.offset = Utils.minMax(this.offset, 0, this.node.nodeValue.length);
            } else {
                this.offset = 0;
            }
        }

        return this;
    };

    // static methods ---------------------------------------------------------

    /**
     * Creates and returns a valid DOM.Point instance for the passed DOM node.
     * If the passed node is a text node, the DOM point will refer to its first
     * character, otherwise the DOM point will contain the parent node and the
     * child index of the passed node as offset.
     *
     * @param {Node|jQuery} node
     *  The DOM node selected by the created DOM.Point instance. If this object
     *  is a jQuery collection, uses the first DOM node it contains.
     *
     * @returns {DOM.Point}
     *  A new DOM.Point instance referring to the passed node.
     */
    DOM.Point.createPointForNode = function (node) {
        return new DOM.Point(node).validate();
    };

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
    DOM.Point.equalPoints = function (point1, point2) {
        return (point1.node === point2.node) && (point1.offset === point2.offset);
    };

    /**
     * Returns an integer indicating how the two DOM points are located to each
     * other.
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
    DOM.Point.comparePoints = function (point1, point2) {

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
        return Utils.compareNodes(point1.node, point2.node);
    };

    // class DOM.Range ========================================================

    /**
     * A DOM text range represents a half-open range in the DOM tree. It
     * contains 'start' and 'end' attributes referring to DOM point objects.
     *
     * @constructor
     *
     * @param {DOM.Point} start
     *  The DOM point where the range starts.
     *
     * @param {DOM.Point} [end]
     *  The DOM point where the range ends. If omitted, uses the start position
     *  to construct a collapsed range (a simple 'cursor').
     */
    DOM.Range = function (start, end) {
        this.start = start;
        this.end = _.isObject(end) ? end : _.clone(start);
    };

    // methods ----------------------------------------------------------------

    /**
     * Returns a new clone of this DOM range.
     */
    DOM.Range.prototype.clone = function () {
        return new DOM.Range(this.start.clone(), this.end.clone());
    };

    /**
     * Validates the start and end position of this DOM range. See method
     * DOM.Point.validate() for details.
     */
    DOM.Range.prototype.validate = function () {
        this.start.validate();
        this.end.validate();
        return this;
    };

    /**
     * Swaps start and end position, if the start position is located after
     * the end position in the DOM tree.
     */
    DOM.Range.prototype.adjust = function () {
        if (DOM.Point.comparePoints(this.start, this.end) > 0) {
            var tmp = this.start;
            this.start = this.end;
            this.end = tmp;
        }
        return this;
    };

    /**
     * Returns whether the DOM range is collapsed, i.e. start position and
     * end position are equal.
     *
     * @returns {Boolean}
     *  Whether this DOM range is collapsed.
     */
    DOM.Range.prototype.isCollapsed = function () {
        return DOM.Point.equalPoints(this.start, this.end);
    };

    // static methods ---------------------------------------------------------

    /**
     * Creates a new DOM.Range instance from the passed nodes and offsets.
     *
     * @param {Node|jQuery} startNode
     *  The DOM node used for the start point of the created range. If this
     *  object is a jQuery collection, uses the first DOM node it contains.
     *
     * @param {Number} [startOffset]
     *  The offset for the start point of the created range.
     *
     * @param {Node|jQuery} [endNode]
     *  The DOM node used for the end point of the created range. If this
     *  object is a jQuery collection, uses the first DOM node it contains. If
     *  omitted, creates a collapsed range by cloning the start position.
     *
     * @param {Number} [endOffset]
     *  The offset for the end point of the created range. Not used, if endNode
     *  has been omitted.
     *
     * @returns {DOM.Range}
     *  The new DOM range object.
     */
    DOM.Range.createRange = function (startNode, startOffset, endNode, endOffset) {
        return new DOM.Range(new DOM.Point(startNode, startOffset), _.isObject(endNode) ? new DOM.Point(endNode, endOffset) : undefined);
    };

    /**
     * Creates and returns a valid DOM.Range instance for the passed DOM node.
     * If the passed node is a text node, the DOM range will select its entire
     * text, otherwise the DOM range will contain the parent node and the
     * child index of the passed node as start offset, and the next child index
     * as end offset, effectively selecting the entire node.
     *
     * @param {Node|jQuery} node
     *  The DOM node selected by the created DOM.Range instance. If this object
     *  is a jQuery collection, uses the first DOM node it contains.
     *
     * @returns {DOM.Range}
     *  A new DOM.Range instance referring to the passed node.
     */
    DOM.Range.createRangeForNode = function (node) {
        var range = new DOM.Range(DOM.Point.createPointForNode(node));
        if (range.end.node.nodeType === 1) {
            range.end.offset += 1;
        } else if (range.end.node.nodeType === 3) {
            range.end.offset = range.end.node.nodeValue.length;
        }
        return range;
    };

    // spans and text nodes ===================================================

    /**
     * Returns whether the passed node is a <span> element containing a single
     * text node. The <span> element may represent regular text portions, an
     * empty text span, or a text field.
     *
     * @param {Node|jQuery} node
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains.
     *
     * @returns {Boolean}
     *  Whether the passed node is a span element with a text node.
     */
    DOM.isTextSpan = function (node) {
        var childNodes = Utils.getDomNode(node).childNodes;
        return (Utils.getNodeName(node) === 'span') && (childNodes.length === 1) && (childNodes[0].nodeType === 3);
    };

    /**
     * Returns whether the passed node is a <span> element representing a
     * regular text portion, or an empty text span.
     *
     * @param {Node|jQuery} node
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains.
     *
     * @returns {Boolean}
     *  Whether the passed node is a span element representing a text field.
     */
    DOM.isPortionSpan = function (node) {
        return DOM.isTextSpan(node) && !$(node).hasClass('field');
    };

    /**
     * Returns whether the passed node is a <span> element containing an empty
     * text portion. Does NOT return true for text fields with an empty
     * representation text.
     *
     * @param {Node|jQuery} node
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains.
     *
     * @returns {Boolean}
     *  Whether the passed node is a span element with an empty text node.
     */
    DOM.isEmptySpan = function (node) {
        return DOM.isPortionSpan(node) && (node.firstChild.nodeValue.length === 0);
    };

    /**
     * Returns whether the passed node is a <span> element representing a text
     * field.
     *
     * @param {Node|jQuery} node
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains.
     *
     * @returns {Boolean}
     *  Whether the passed node is a span element representing a text field.
     */
    DOM.isFieldSpan = function (node) {
        return DOM.isTextSpan(node) && $(node).hasClass('field');
    };

    /**
     * Returns whether the passed node is a <span> element wrapping an object.
     *
     * @param {Node|jQuery} node
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains.
     *
     * @returns {Boolean}
     *  Whether the passed node is a span element wrapping an object.
     */
    DOM.isObjectSpan = function (node) {
        var childNodes = Utils.getDomNode(node).childNodes;
        // the span may contain other nodes beside the object, e.g. a selection
        // frame, but the first node is always the object itself
        return (Utils.getNodeName(node) === 'span') && (childNodes.length > 0) && (childNodes[0].nodeType === 1);
    };

    /**
     * Returns whether the passed node is a <span> element wrapping an object
     * in inline mode.
     *
     * @param {Node|jQuery} node
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains.
     *
     * @returns {Boolean}
     *  Whether the passed node is a span element wrapping an object and is
     *  rendered inlined.
     */
    DOM.isInlineObjectSpan = function (node) {
        return DOM.isObjectSpan(node) && node.hasClass('inline');
    };

    /**
     * Returns whether the passed node is a <span> element wrapping an image.
     *
     * @param {Node|jQuery} node
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains.
     *
     * @returns {Boolean}
     *  Whether the passed node is a span element wrapping an image.
     */
    DOM.isImageSpan = function (node) {
        // object spans contain the object element as first child
        return DOM.isObjectSpan(node) && (Utils.getNodeName(node.firstChild) === 'div') && (Utils.getNodeName(node.firstChild.firstChild) === 'img');
    };

    /**
     * A jQuery selector that matches <span> elements containing an image.
     */
    DOM.IMAGE_SPAN_SELECTOR = function () { return DOM.isImageSpan(this); };

    /**
     * Splits the passed text node into two text nodes.
     *
     * @param {Text} textNode
     *  The DOM text node to be split.
     *
     * @param {Number} offset
     *  The character position where the text node will be split. If this
     *  position is at the start or end of the text of the node, an empty text
     *  node may be inserted if required (see the 'options.createEmpty' option
     *  below).
     *
     * @param {Object} [options]
     *  A map of options to control the split operation. Supports the following
     *  options:
     *  @param {Boolean} [options.append]
     *      If set to true, the right part of the text will be inserted after
     *      the passed text node; otherwise the left part of the text will be
     *      inserted before the passed text node. The position of the new text
     *      node may be important when iterating and manipulating a range of
     *      DOM nodes.
     *
     * @returns {Text}
     *  The newly created text node. Will be located before or after the passed
     *  text node, depending on the 'options.append' option.
     */
    DOM.splitTextNode = function (textNode, offset, options) {

        var // parent <span> element of the text node
            span = textNode.parentNode,
            // the new span for the split text portion, as jQuery object
            newSpan = $(span).clone(true),
            // text for the left span
            leftText = textNode.nodeValue.substr(0, offset),
            // text for the right span
            rightText = textNode.nodeValue.substr(offset);

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

        // return the new text node
        return newSpan[0].firstChild;
    };

    /**
     * Returns the text node of the next or previous sibling of the passed
     * node. Checks that the sibling node is a span element, and contains
     * exactly one text node. Works for regular text portions, empty text
     * spans, and text fields.
     *
     * @param {Node|jQuery} node
     *  The original DOM node. If this node is a text node, checks that it is
     *  contained in its own <span> element and traverses to the next or
     *  previous sibling of that span. Otherwise, directly traverses to the
     *  next or previous sibling of the passed element node. If this object is
     *  a jQuery collection, uses the first DOM node it contains.
     *
     * @param {Boolean} next
     *  If set to true, searches for the next sibling text node, otherwise
     *  searches for the previous sibling text node.
     *
     * @returns {Text|Null}
     *  The sibling text node if existing, otherwise null.
     */
    DOM.getSiblingTextNode = function (node, next) {

        // if the passed node is a text node, get its <span> parent element
        node = Utils.getDomNode(node);
        if (node.nodeType === 3) {
            node = DOM.isTextSpan(node.parentNode) ? node.parentNode : null;
        }

        // go to next or previous sibling of the element
        if (node && (node.nodeType === 1)) {
            node = next ? node.nextSibling : node.previousSibling;
        }

        // extract the text node from the sibling element
        return (node && DOM.isTextSpan(node)) ? node.firstChild : null;
    };

    // range iteration ========================================================

    /**
     * Validates, sorts, and merges the passed array of DOM ranges. First, the
     * methods DOM.Range.validate() and DOM.Range.adjust() will be called for
     * all ranges to update the offsets of the DOM points in the ranges, and to
     * sort start and end point of each range. Next, all ranges in the array
     * will be sorted by their start point (DOM order). Last, overlapping
     * ranges will be merged.
     *
     * @param {DOM.Range[]} ranges
     *  (in/out) The array of ranges to be validated and sorted. All changes
     *  will be performed inplace.
     */
    DOM.validateAndSortRanges = function (ranges) {

        // validate all ranges, adjust start/end points
        _.chain(ranges).invoke('validate').invoke('adjust');

        // sort the ranges by start point in DOM order
        ranges.sort(function (range1, range2) {
            return DOM.Point.comparePoints(range1.start, range2.start);
        });

        // merge ranges with their next siblings, if they overlap
        for (var index = 0; index < ranges.length; index += 1) {
            while ((index + 1 < ranges.length) && (DOM.Point.comparePoints(ranges[index].end, ranges[index + 1].start) >= 0)) {
                if (DOM.Point.comparePoints(ranges[index].end, ranges[index + 1].end) < 0) {
                    ranges[index].end = ranges[index + 1].end;
                }
                ranges.splice(index + 1, 1);
            }
        }
    };

    /**
     * Iterates over all DOM nodes contained in the specified DOM text ranges.
     *
     * @param {DOM.Range[]} ranges
     *  (in/out) The DOM ranges whose nodes will be iterated. Before iteration
     *  starts, the array will be validated and sorted (see method
     *  DOM.validateAndSortRanges() for details). The iterator function may
     *  further manipulate this array while iterating, see the comments in the
     *  description of the parameter 'iterator' for details.
     *
     * @param {Function} iterator
     *  The iterator function that will be called for every node. Receives the
     *  DOM node object as first parameter, the current DOM range as second
     *  parameter, its index in the sorted array of DOM ranges as third
     *  parameter, and the entire sorted array of DOM ranges as fourth
     *  parameter. If the iterator returns the Utils.BREAK object, the
     *  iteration process will be stopped immediately. The iterator may
     *  manipulate the end point of the current DOM range, or the DOM ranges in
     *  the array following the current DOM range, which will affect the
     *  iteration process accordingly. Changing the starting point of the
     *  current DOM range, or anything in the preceding DOM ranges in the array
     *  will not have any effect. If the iterator modifies the DOM tree, it
     *  MUST ensure that following DOM ranges in the array that refer to
     *  deleted nodes or their descendants, or depend on any other DOM tree
     *  change, will be updated accordingly.
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

        var // loop variables
            index = 0, range = null, node = null;

        // shortcut for call to iterator function
        function callIterator() { return iterator.call(context, node, range, index, ranges); }

        // adjust start/end points of all ranges, sort the ranges in DOM order, merge overlapping ranges
        DOM.validateAndSortRanges(ranges);

        for (index = 0; index < ranges.length; index += 1) {
            range = ranges[index];

            // get first node in DOM range
            node = range.start.node;
            if (node.nodeType === 1) {
                // element/child node position, go to child node described by offset
                node = node.childNodes[range.start.offset];
            }

            // always visit the node if selected by a cursor
            if (node && range.isCollapsed()) {
                // call iterator for the node, return if iterator returns Utils.BREAK
                if (callIterator() === Utils.BREAK) { return Utils.BREAK; }
                continue;
            }

            // skip first text node, if DOM range starts directly at its end
            // TODO: is this the desired behavior?
            if (node && (node.nodeType === 3) && (range.start.offset >= node.nodeValue.length)) {
                node = Utils.getNextNodeInTree(node);
            }

            // iterate as long as the end of the range has not been reached
            while (node && (DOM.Point.comparePoints(DOM.Point.createPointForNode(node), range.end) < 0)) {
                // call iterator for the node, return if iterator returns Utils.BREAK
                if (callIterator() === Utils.BREAK) { return Utils.BREAK; }
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
     * @param {DOM.Range[]} ranges
     *  (in/out) The DOM ranges whose nodes will be iterated. The array will be
     *  validated and sorted before iteration starts (see method
     *  DOM.iterateNodesInRanges() for details).
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing the DOM ranges. While searching for ancestor
     *  nodes, this root node will never be left, but it may be selected as
     *  ancestor node by itself. If this object is a jQuery collection, uses
     *  the first node it contains.
     *
     * @param {String|Function|Node|jQuery} selector
     *  A jQuery selector that will be used to find an element while traversing
     *  the chain of parents of the node currently iterated. The selector will
     *  be passed to the jQuery method jQuery.is() for each node. If this
     *  selector is a function, it will be called with the current DOM node
     *  bound to the symbol 'this'. See the jQuery API documentation at
     *  http://api.jquery.com/is for details.
     *
     * @param {Function} iterator
     *  The iterator function that will be called for every found ancestor
     *  node. Receives the DOM node object as first parameter, the current DOM
     *  range as second parameter, its index in the sorted array of DOM ranges
     *  as third parameter, and the entire sorted array of DOM ranges as fourth
     *  parameter. If the iterator returns the Utils.BREAK object, the
     *  iteration process will be stopped immediately. See the comments for the
     *  method DOM.iterateNodesInRanges() for details about manipulation of the
     *  array of DOM ranges and the DOM tree.
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
        return DOM.iterateNodesInRanges(ranges, function (node, range, index, ranges) {

            // shortcut for call to iterator function
            function callIterator() { return iterator.call(context, node, range, index, ranges); }

            // try to find a matching element inside the root node
            while (node) {
                if ($(node).is(selector)) {
                    // skip node if it has been found before
                    if (!_(matchingNodes).contains(node)) {
                        matchingNodes.push(node);
                        if (callIterator() === Utils.BREAK) { return Utils.BREAK; }
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
     * @param {DOM.Range[]} ranges
     *  (in/out) The DOM ranges whose text nodes will be iterated. The array
     *  will be validated and sorted before iteration starts (see method
     *  DOM.iterateNodesInRanges() for details).
     *
     * @param {Function} iterator
     *  The iterator function that will be called for every text node. Receives
     *  the DOM text node object as first parameter, the offset of the first
     *  character as second parameter, the offset after the last character as
     *  third parameter, the current DOM range as fourth parameter, its index
     *  in the sorted array of DOM ranges as fifth parameter, and the entire
     *  sorted array of DOM ranges as sixth parameter. If the iterator returns
     *  the Utils.BREAK object, the iteration process will be stopped
     *  immediately. See the comments for the method DOM.iterateNodesInRanges()
     *  for details about manipulation of the array of DOM ranges and the DOM
     *  tree.
     *
     * @param {Object} [context]
     *  If specified, the iterator will be called with this context (the symbol
     *  'this' will be bound to the context inside the iterator function).
     *
     * @param {Object} [options]
     *  A map of options to control the iteration process. Supports the
     *  following options:
     *  @param {Boolean} [options.split]
     *      If set to true, text nodes that are not covered completely by a DOM
     *      range will be split before the iterator function will be called.
     *      The iterator function will always receive a text node and a
     *      character range that covers the text of that node completely.
     *  @param {Function} [options.merge]
     *      If set to a function, the visited text node may be merged with one
     *      or both of its sibling text nodes after the iterator function
     *      returns. The function attached to this option will be called once
     *      or twice, always receiving exactly two DOM text nodes. It must
     *      return whether these two text nodes can be merged to one text node.
     *      It will be called once for the previous sibling of the visited text
     *      node, and once for its next sibling (only if these sibling text
     *      nodes exist).
     *
     * @returns {Utils.BREAK|Undefined}
     *  A reference to the Utils.BREAK object, if the iterator has returned
     *  Utils.BREAK to stop the iteration process, otherwise undefined.
     */
    DOM.iterateTextPortionsInRanges = function (ranges, iterator, context, options) {

        var // split partly covered the text nodes before visiting them
            split = Utils.getBooleanOption(options, 'split', false),
            // predicate whether to merge sibling text nodes after visiting them
            merge = Utils.getFunctionOption(options, 'merge');

        function replaceTextNodeInRanges(ranges, index, next, oldTextNode, newTextNode, offsetDiff) {

            for (var range = null; next ? (index < ranges.length) : (0 <= index); next ? (index += 1) : (index -= 1)) {
                range = ranges[index];

                // update start point
                if (range.start.node === oldTextNode) {
                    range.start.node = newTextNode;
                    range.start.offset += offsetDiff;
                }

                // update end point
                if (range.end.node === oldTextNode) {
                    range.end.node = newTextNode;
                    range.end.offset += offsetDiff;
                }
            }
        }

        // Split the passed text node if it is not covered completely.
        function splitTextNode(textNode, start, end, ranges, index) {

            var // following text node when splitting this text node
                newTextNode = null;

            // split text node to move the portion before start into its own span
            if (start > 0) {
                newTextNode = DOM.splitTextNode(textNode, start);
                // adjust offsets of all following DOM ranges that refer to the text node
                replaceTextNodeInRanges(ranges, index, true, textNode, textNode, -start);
                // new end position in shortened text node
                end -= start;
            }

            // split text node to move the portion after end into its own span
            if (end < textNode.nodeValue.length) {
                newTextNode = DOM.splitTextNode(textNode, end, { append: true });
                // adjust all following DOM ranges that refer now to the new following text node
                replaceTextNodeInRanges(ranges, index + 1, true, textNode, newTextNode, -end);
            }
        }

        // Tries to merge the passed text node with its next or previous sibling.
        function mergeSiblingTextNode(textNode, next, ranges, index) {

            var // the sibling text node, depending on the passed direction
                siblingTextNode = DOM.getSiblingTextNode(textNode, next),
                // text in the passed and in the sibling node
                text = null, siblingText = null;

            // check preconditions
            if (!siblingTextNode ||
                    // do not mix portion spans and field spans
                    (DOM.isPortionSpan(textNode.parentNode) !== DOM.isPortionSpan(siblingTextNode.parentNode)) ||
                    // do not merge with next text node, if it is contained in the current range,
                    // this prevents unnecessary merge/split (merge will be done in next iteration step)
                    (next && (DOM.Point.comparePoints(DOM.Point.createPointForNode(siblingTextNode), ranges[index].end) < 0)) ||
                    // ask callback whether to merge text nodes
                    !merge.call(context, textNode, siblingTextNode)) {
                return;
            }

            // add text of the sibling text node to the passed text node, and update DOM ranges
            text = textNode.nodeValue;
            siblingText = siblingTextNode.nodeValue;
            if (next) {
                textNode.nodeValue = text + siblingText;
                replaceTextNodeInRanges(ranges, index, true, siblingTextNode, textNode, text.length);
            } else {
                textNode.nodeValue = siblingText + text;
                replaceTextNodeInRanges(ranges, index, true, textNode, textNode, siblingText.length);
                replaceTextNodeInRanges(ranges, index, false, siblingTextNode, textNode, 0, false);
            }
            // remove the entire sibling span element
            $(siblingTextNode.parentNode).remove();
        }

        // iterate over all nodes, and process the text nodes
        return DOM.iterateNodesInRanges(ranges, function (node, range, index, ranges) {

            var // start and end offset of covered text in the text node
                start = 0, end = 0;

            // Splits text node, calls iterator function, merges text node.
            function callIterator() {

                var // the result of the iterator call
                    result = null,
                    // whether to merge with previous or next node
                    mergePrevious = false, mergeNext = false;

                // split text node if specified
                if (split) {
                    splitTextNode(node, start, end, ranges, index);
                    start = 0;
                    end = node.nodeValue.length;
                }

                // check whether to merge, before iterator is called
                mergePrevious = start === 0;
                mergeNext = end === node.nodeValue.length;

                // call iterator function
                result = iterator.call(context, node, start, end, range, index, ranges);

                // merge text node if specified
                if ((result !== Utils.BREAK) && _.isFunction(merge)) {
                    if (mergePrevious) {
                        mergeSiblingTextNode(node, false, ranges, index);
                    }
                    if (mergeNext) {
                        mergeSiblingTextNode(node, true, ranges, index);
                    }
                }

                return result;
            }

            // call passed iterator for all text nodes in span elements
            if ((node.nodeType === 3) && (Utils.getNodeName(node.parentNode) === 'span')) {
                // calculate/validate start/end offset in the text node
                start = (node === range.start.node) ? Utils.minMax(range.start.offset, 0, node.nodeValue.length) : 0;
                end = (node === range.end.node) ? Utils.minMax(range.end.offset, start, node.nodeValue.length) : node.nodeValue.length;
                // call iterator for the text node, return if iterator returns Utils.BREAK
                if (callIterator() === Utils.BREAK) { return Utils.BREAK; }

            // cursor selects a single <br> element, visit last preceding text node instead
            } else if (range.isCollapsed() && (Utils.getNodeName(node) === 'br') && (node = DOM.getSiblingTextNode(node, false))) {
                // prepare start, end, and current DOM range object
                start = range.start.offset = end = range.end.offset = node.nodeValue.length;
                range.start.node = range.end.node = node;
                // call iterator for the text node, return if iterator returns Utils.BREAK
                if (callIterator() === Utils.BREAK) { return Utils.BREAK; }
            }
        });
    };

    // browser selection ======================================================

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
            // an adjusted clone of the range
            adjustedRange = null,
            // the limiting point for valid ranges (next sibling of root node)
            globalEndPos = null;

        // convert parameter to DOM element
        rootNode = Utils.getDomNode(rootNode);

        // end position if the range selects the entire root node
        globalEndPos = DOM.Point.createPointForNode(rootNode);
        globalEndPos.offset += 1;

        // build an array of text range objects holding start and end nodes/offsets
        for (var index = 0; index < selection.rangeCount; index += 1) {

            // get the native selection Range object
            range = selection.getRangeAt(index);

            // translate to the internal text range representation
            range = DOM.Range.createRange(range.startContainer, range.startOffset, range.endContainer, range.endOffset);

            // check that the nodes are inside the root node (with adjusted clone of the range)
            adjustedRange = range.clone().adjust();
            if (rootNode.contains(adjustedRange.start.node) && (DOM.Point.comparePoints(adjustedRange.end, globalEndPos) <= 0)) {
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
                Utils.warn('DOM.setBrowserSelection(): failed to add range to selection');
            }
        });
    };

    // object selection =======================================================

    /**
     * Adds a new selection box for the specified object node.
     *
     * @param {HTMLElement|jQuery} object
     *  The object node for which a new selection box will be inserted.
     *
     * @param {Object} [options]
     *  A map of options to control the appearance of the selection box.
     *  Supports the following options:
     *  @param {Boolean} [options.moveable]
     *      If set to true, the mouse pointer will change to a move pointer
     *      when the mouse hovers the selected element.
     *  @param {Boolean} [options.sizeable]
     *      If set to true, the mouse pointer will change to a specific resize
     *      pointer when the mouse hovers the corner handles of the selected
     *      element.
     */
    DOM.addObjectSelection = function (object, options) {

        var // the container element used to visualize the selection
            selectorBox = $('<div>').addClass('selection');

        // add classes according to passed options, and resize handles
        selectorBox
            .toggleClass('moveable', Utils.getBooleanOption(options, 'moveable', false))
            .toggleClass('sizeable', Utils.getBooleanOption(options, 'sizeable', false));

        // add resize handles
        _(['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l']).each(function (pos) {
            selectorBox.append($('<div>').addClass('handle ' + pos));
        });

        // insert selector box into the object container
        DOM.removeObjectSelection(object);
        $(object).first().append(selectorBox);
    };

    /**
     * Removes the selection box from the specified object node.
     *
     * @param {HTMLElement|jQuery} object
     *  The object node whose selection box will be removed.
     */
    DOM.removeObjectSelection = function (object) {
        $(object).first().children('div.selection').remove();
    };

    // exports ================================================================

    return DOM;

});
