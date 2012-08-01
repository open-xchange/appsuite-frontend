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

        // if 'node' is located before the position node, it is always considered 'before'
        if (Utils.isNodeBeforeNode(node, position.node)) {
            return true;
        }

        switch (position.node.nodeType) {
        case 1:
            // position is element node: 'node' must be contained, index of its
            // ancestor node must be less than the position's offset
            if (!position.node.contains(node)) { return false; }
            // travel up until we are a direct child of position.node
            while (node.parentNode !== position.node) {
                node = node.parentNode;
            }
            // check own index in all siblings
            return $(node).index() < position.offset;
        case 3:
            // position is text node: include it in the set of valid nodes
            return node === position.node;
        }

        window.console.log('Selection.isNodeBeforeTextPosition(): unexpected node type');
        return false;
    };

    /**
     * Iterates over all DOM nodes contained in the specified DOM text range.
     *
     * @param {Object[]|Object} ranges
     *  The DOM text ranges whose text nodes will be iterated. May be an array
     *  of DOM text range objects, or a single DOM text range object.
     *
     * @param {Function} iterator
     *  The iterator function that will be called for every node. Receives the
     *  DOM node object as first parameter. If the iterator returns the boolean
     *  value false, iteration process will be stopped immediately.
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

        var // the start and end position of the current text range
            startPos = null, endPos = null,
            // the current node in the current text range
            node = null;

        // convert parameter to an array
        ranges = _.getArray(ranges);
        for (var index = 0; index < ranges.length; index += 1) {

            // adjust start/end by node DOM position
            if (Utils.isNodeBeforeNode(ranges[index].end.node, ranges[index].start.node)) {
                startPos = ranges[index].end;
                endPos = ranges[index].start;
            } else {
                startPos = ranges[index].start;
                endPos = ranges[index].end;
            }

            // get first node in text range
            node = startPos.node;
            if (node.nodeType === 1) {
                // element/child node position, go to child node described by offset
                node = node.childNodes[startPos.offset];
            } else if ((node.nodeType === 3) && (startPos.offset === node.nodeValue.length) && (node !== endPos.node)) {
                // ignore first text node, if text range starts directly at its end and is not a simple cursor
                // TODO: is this the desired behavior?
                node = Utils.getNextNodeInTree(node);
            }

            // iterate as long as the end of the range has not been reached
            while (node && Selection.isNodeBeforeTextPosition(node, endPos)) {
                // call iterator for the node, return if iterator returns false
                if (iterator.call(context, node) === false) { return false; }
                // find next node
                node = Utils.getNextNodeInTree(node);
            }
        }
    };

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
            range = null;

        // convert parameter to DOM element
        rootNode = Utils.getDomNode(rootNode);

        // build an array of text range objects holding start and end nodes/offsets
        for (var index = 0; index < selection.rangeCount; index += 1) {

            // get the native selection Range object
            range = selection.getRangeAt(index);

            // translate to the internal text range representation
            range = {
                start: { node: range.startContainer, offset: range.startOffset },
                end: { node: range.endContainer, offset: range.endOffset }
            };

            // check that the nodes are inside the editor
            if (rootNode.contains(range.start.node) && rootNode.contains(range.end.node)) {
                ranges.push(range);
            }
        }

        return ranges;
    };

    // exports ================================================================

    return Selection;

});
