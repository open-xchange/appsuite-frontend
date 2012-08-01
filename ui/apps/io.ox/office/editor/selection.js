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

define('io.ox/office/editor/selection', ['io.ox/office/tk/utils'], function (Utils) {

    'use strict';

    // static class Selection =================================================

    /**
     * Provides static helper classes for low-level handling of the browser
     * selection, or other DOM text ranges and text positions.
     *
     * A DOM text position contains a 'node' attribute pointing to a DOM node,
     * and an 'offset' attribute containing an integer offset depending on the
     * position's node. If 'node' points to a text node, then 'offset'
     * specifies a character in the text node. If 'node' points to an element
     * node, than 'offset' specifies a child node of the element.
     *
     * A DOM text range is an object consisting of two DOM text position
     * objects, stored in the attributes 'start' and 'end'. Note that the end
     * point of the text range may be located before the start point in the DOM
     * tree.
     */
    var Selection = {};

    // DOM text positions and ranges ------------------------------------------

    /**
     * Returns whether the passed DOM node is located before the specified DOM
     * text position. If 'position' contains a text node, then this text node
     * itself is considered to be located before the position regardless of the
     * position's offset. If 'position' contains an element node, than the
     * specified node must be located before the element's child node specified
     * by the position's offset.
     *
     * @param {Node|jQuery} node
     *  The DOM node tested if it is located before the text position. If this
     *  object is a jQuery collection, uses the first node it contains.
     *
     * @param {Object} position
     *  The DOM text position to test the node against.
     *
     * @return {Boolean}
     *  Whether the node is located before the text position.
     */
    Selection.isNodeBeforeTextPosition = function (node, position) {

        // convert parameter to plain DOM node
        node = Utils.getDomNode(node);

        // if 'node' is located before the position node, or is equal to the
        // position node, it is always considered 'before'
        if ((node === position.node) || Utils.isNodeBeforeNode(node, position.node)) {
            return true;
        }

        // position is element node: 'node' must be contained, index of its
        // ancestor node must be less than the position's offset
        if (position.node.nodeType === 1) {
            if (!position.node.contains(node)) { return false; }
            // travel up until we are a direct child of position.node
            while (node.parentNode !== position.node) {
                node = node.parentNode;
            }
            // check own index in all siblings
            return $(node).index() < position.offset;
        }

        return false;
    };

    /**
     * Iterates over all DOM nodes contained in the specified DOM text ranges.
     *
     * @param {Object[]|Object} ranges
     *  The DOM text ranges whose text nodes will be iterated. May be an array
     *  of DOM text range objects, or a single DOM text range object.
     *
     * @param {Function} iterator
     *  The iterator function that will be called for every node. Receives the
     *  DOM node object as first parameter, and the current DOM text range
     *  object as second parameter. If the iterator returns the boolean value
     *  false, iteration process will be stopped immediately.
     *
     * @param {Object} [context]
     *  If specified, the iterator will be called with this context (the
     *  symbol 'this' will be bound to the context inside the iterator
     *  function).
     *
     * @returns {Boolean|Undefined}
     *  The boolean value false, if any iterator call has returned false to
     *  stop the iteration process, otherwise undefined.
     */
    Selection.iterateNodesInTextRanges = function (ranges, iterator, context) {

        var // copy of the current text range
            range = null,
            // the current node in the current text range
            node = null;

        // convert parameter to an array
        ranges = _.getArray(ranges);
        for (var index = 0; index < ranges.length; index += 1) {

            // adjust start/end by node DOM position
            if (Utils.isNodeBeforeNode(ranges[index].end.node, ranges[index].start.node)) {
                range = { start: ranges[index].end, end: ranges[index].start };
            } else {
                range = { start: ranges[index].start, end: ranges[index].end };
            }
            // range will be passed to callback, make deep copy
            range = _.copy(range, true);

            // get first node in text range
            node = range.start.node;
            if (node.nodeType === 1) {
                // element/child node position, go to child node described by offset
                node = node.childNodes[range.start.offset];
            } else if ((node.nodeType === 3) && (range.start.offset === node.nodeValue.length) && (node !== range.end.node)) {
                // ignore first text node, if text range starts directly at its end and is not a simple cursor
                // TODO: is this the desired behavior?
                node = Utils.getNextNodeInTree(node);
            }

            // iterate as long as the end of the range has not been reached
            while (node && Selection.isNodeBeforeTextPosition(node, range.end)) {
                // call iterator for the node, return if iterator returns false
                if (iterator.call(context, node, range) === false) { return false; }
                // find next node
                node = Utils.getNextNodeInTree(node);
            }
        }
    };

    /**
     * Iterates over all text nodes contained in the specified DOM text
     * ranges. The iterator function will receive the text node and the
     * character range in its text contents that is covered by the specified
     * DOM text ranges.
     *
     * @param {Object[]|Object} ranges
     *  The DOM text ranges whose text nodes will be iterated. May be an array
     *  of DOM text range objects, or a single DOM text range object.
     *
     * @param {Function} iterator
     *  The iterator function that will be called for every text node. Receives
     *  the DOM text node object as first parameter, the offset of the first
     *  character as second parameter, the offset after the last character as
     *  third parameter, and the current DOM text range as fourth parameter. If
     *  the iterator returns the boolean value false, iteration process will be
     *  stopped immediately.
     *
     * @param {Object} [context]
     *  If specified, the iterator will be called with this context (the
     *  symbol 'this' will be bound to the context inside the iterator
     *  function).
     *
     * @returns {Boolean|Undefined}
     *  The boolean value false, if any iterator call has returned false to
     *  stop the iteration process, otherwise undefined.
     */
    Selection.iterateTextPortionsInTextRanges = function (ranges, iterator, context) {

        // iterate over all nodes, and process the text nodes
        return Selection.iterateNodesInTextRanges(ranges, function (node, range) {

            var // start and end offset of covered text in text node
                startOffset = 0, endOffset = 0;

            // call passed iterator for all text nodes
            if (node.nodeType === 3) {
                startOffset = (node === range.start.node) ? range.start.offset : 0;
                endOffset = (node === range.end.node) ? range.end.offset : node.nodeValue.length;
                iterator.call(context, node, startOffset, endOffset, range);
            }
        });
    };

    // browser selection ------------------------------------------------------

    /**
     * Returns an array of DOM text range objects representing the current
     * browser selection.
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The container element the returned selection will be restricted to.
     *  Only text ranges inside the root element will be included in the array.
     *
     * @returns {Object[]}
     *  The DOM text ranges representing the current browser selection.
     */
    Selection.getBrowserSelection = function (rootNode) {

        var // the browser selection
            selection = window.getSelection(),
            // an array of all text ranges
            ranges = [],
            // a single range object
            range = null,
            // the limiting text position for valid ranges (next sibling of root node)
            globalEndPos = null;

        // convert parameter to DOM element
        rootNode = Utils.getDomNode(rootNode);

        // end position if the range selects the entire root node
        globalEndPos = { node: rootNode.parentNode, offset: $(rootNode).index() + 1 };

        // build an array of text range objects holding start and end nodes/offsets
        for (var index = 0; index < selection.rangeCount; index += 1) {

            // get the native selection Range object
            range = selection.getRangeAt(index);

            // translate to the internal text range representation
            range = {
                start: { node: range.startContainer, offset: range.startOffset },
                end: { node: range.endContainer, offset: range.endOffset }
            };

            // check that the nodes are inside the root node
            if (rootNode.contains(range.start.node) && (rootNode.contains(range.end.node) || _.isEqual(range.end, globalEndPos))) {
                ranges.push(range);
            }
        }

        return ranges;
    };

    /**
     * Sets the browser selection to the passed DOM text ranges.
     *
     * @param {Object[]|Object} ranges
     *  The DOM text ranges representing the new browser selection. May be an
     *  array of DOM text range objects, or a single DOM text range object.
     */
    Selection.setBrowserSelection = function (ranges) {

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
                window.console.log('Selection.setBrowserSelection(): failed to add text range to selection');
            }
        });
    };


    // exports ================================================================

    return Selection;

});
