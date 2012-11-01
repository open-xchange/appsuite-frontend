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

    /**
     * Converts this DOM point to a human readable string representation.
     */
    DOM.Point.prototype.toString = function () {

        var // full string representation of this DOM Point
            result = this.node.nodeName.toLowerCase();

        if ((this.node.nodeType === 1) && (this.node.className.length > 0)) {
            // add class names of an element
            result += '.' + this.node.className.replace(/ /g, '.');
        } else if (this.node.nodeType === 3) {
            // add some text of a text node
            result += '"' + this.node.nodeValue.substr(0, 10) + ((this.node.nodeValue.length > 10) ? '...' : '') + '"';
        }

        if (_.isNumber(this.offset)) {
            result += ':' + this.offset;
        }

        return result;
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

    /**
     * Converts this DOM range to a human readable string representation.
     */
    DOM.Range.prototype.toString = function () {
        return '[start=' + this.start + ', end=' + this.end + ']';
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

    // pages ==================================================================

    /**
     * A jQuery selector that matches elements representing a page.
     */
    DOM.PAGE_NODE_SELECTOR = 'div.page';

    /**
     * Returns whether the passed node is a page element.
     *
     * @param {Node|jQuery} node
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains.
     *
     * @returns {Boolean}
     *  Whether the passed node is a page element.
     */
    DOM.isPageNode = function (node) {
        return $(node).is(DOM.PAGE_NODE_SELECTOR);
    };

    // paragraphs and tables ==================================================

    /**
     * A jQuery selector that matches elements representing a paragraph.
     */
    DOM.PARAGRAPH_NODE_SELECTOR = 'div.p';

    /**
     * Returns whether the passed node is a paragraph element.
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a paragraph element.
     */
    DOM.isParagraphNode = function (node) {
        return $(node).is(DOM.PARAGRAPH_NODE_SELECTOR);
    };

    /**
     * Creates a new paragraph element.
     *
     * @returns {jQuery}
     *  A paragraph element, as jQuery object.
     */
    DOM.createParagraphNode = function () {
        return $('<div>').addClass('p');
    };

    /**
     * A jQuery selector that matches elements representing a table.
     */
    DOM.TABLE_NODE_SELECTOR = 'table';

    /**
     * Returns whether the passed node is a table element.
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a table element.
     */
    DOM.isTableNode = function (node) {
        return $(node).is(DOM.TABLE_NODE_SELECTOR);
    };

    /**
     * A jQuery selector that matches elements representing a top-level content
     * node (e.g. paragraphs or tables).
     */
    DOM.CONTENT_NODE_SELECTOR = DOM.PARAGRAPH_NODE_SELECTOR + ', ' + DOM.TABLE_NODE_SELECTOR;

    /**
     * Returns whether the passed node is a top-level content node (e.g.
     * paragraphs or tables).
     *
     * @param {Node|jQuery} node
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains.
     *
     * @returns {Boolean}
     *  Whether the passed node is a top-level content node.
     */
    DOM.isContentNode = function (node) {
        return $(node).is(DOM.CONTENT_NODE_SELECTOR);
    };

    // text spans, text nodes, text components ================================

    // text spans -------------------------------------------------------------

    /**
     * Returns a new empty text span element with a single child text node.
     *
     * @returns {jQuery}
     *  The empty text span element, as jQuery object.
     */
    DOM.createTextSpan = function () {
        return $('<span>').text('');
    };

    /**
     * Returns whether the passed node is a <span> element containing a single
     * text node.
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a span element with a text node.
     */
    DOM.isTextSpan = function (node) {
        var contents = $(node).contents();
        return $(node).is('span') && (contents.length === 1) && (contents[0].nodeType === 3);
    };

    /**
     * Returns whether the passed node is a <span> element containing an empty
     * text node.
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a span element with an empty text node.
     */
    DOM.isEmptySpan = function (node) {
        return DOM.isTextSpan(node) && ($(node).text().length === 0);
    };

    /**
     * Returns whether the passed node is a <span> element representing a text
     * portion (a child element of a paragraph node).
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a text portion span element.
     */
    DOM.isPortionSpan = function (node) {
        return DOM.isTextSpan(node) && DOM.isParagraphNode(Utils.getDomNode(node).parentNode);
    };

    /**
     * Returns whether the passed node is a text node embedded in a text
     * portion span (see DOM.isPortionSpan() method).
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a text node in a portion span element.
     */
    DOM.isTextNodeInPortionSpan = function (node) {
        node = node && Utils.getDomNode(node);
        return node && (node.nodeType === 3) && DOM.isPortionSpan(node.parentNode);
    };

    DOM.findFirstPortionSpan = function (paragraph) {
        return Utils.findDescendantNode(paragraph, function () { return DOM.isTextSpan(this); }, { children: true });
    };

    DOM.findLastPortionSpan = function (paragraph) {
        return Utils.findDescendantNode(paragraph, function () { return DOM.isTextSpan(this); }, { children: true, reverse: true });
    };

    /**
     * Determines cell orientation inside a table. This includes information, if the cell is located
     * in the first row or in the last row, or if it is the first cell in a row or the last cell in
     * a row and if it is located in an even row or in an odd row.
     *
     * @param {jQuery} cell
     *  The cell node whose orientation inside the table shall be
     *  investigated.
     *
     * @returns {Object}
     *  An object containing information about the orientation of the
     *  cell inside the table.
     */
    DOM.evaluateCellOrientationInTable = function (cell) {

        var cellOrientation = {},
            row = null;

        if (!((cell) && (cell.get(0)) && (cell.get(0).nodeName) && (((Utils.getNodeName(cell) === 'td') || (Utils.getNodeName(cell) === 'th'))))) { return cellOrientation; }
        // if ((Utils.getNodeName(cell) !== 'td') && (Utils.getNodeName(cell) !== 'th')) { return; }

        row = cell.parent();

        cellOrientation.wholetable = true;  // the cell is located somewhere in the table
        cellOrientation.firstrow = ($('> tr', row.parent()).index(row) === 0);
        cellOrientation.lastrow = ($('> tr', row.parent()).index(row) === $('> tr', row.parent()).length - 1);
        cellOrientation.firstcol = ($('> th, > td', row).index(cell) === 0);
        cellOrientation.lastcol = ($('> th, > td', row).index(cell) === $('> th, > td', row).length - 1);
        cellOrientation.band1horz = ($('> tr', row.parent()).index(row) % 2 !== 0);
        cellOrientation.band2horz = ! cellOrientation.band1horz;
        cellOrientation.necell = (cellOrientation.firstrow && cellOrientation.lastcol);
        cellOrientation.nwcell = (cellOrientation.firstrow && cellOrientation.firstcol);
        cellOrientation.secell = (cellOrientation.lastrow && cellOrientation.lastcol);
        cellOrientation.swcell = (cellOrientation.lastrow && cellOrientation.firstcol);

        // still missing band1vert and band2vert

        return cellOrientation;
    };

    // text components: fields, tabs ------------------------------------------

    /**
     * A jQuery selector that matches elements representing a text field.
     */
    DOM.FIELD_NODE_SELECTOR = 'div.field';

    /**
     * Returns whether the passed node is an element representing a text field.
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is an element representing a text field.
     */
    DOM.isFieldNode = function (node) {
        return $(node).is(DOM.FIELD_NODE_SELECTOR);
    };

    /**
     * Returns a new empty text field element.
     *
     * @returns {jQuery}
     *  A new empty text field element, as jQuery object.
     */
    DOM.createFieldNode = function (text) {
        return $('<div>').addClass('component field');
    };

    /**
     * A jQuery selector that matches elements representing a tab.
     */
    DOM.TAB_NODE_SELECTOR = 'div.tab';

    /**
     * Returns whether the passed node is a tab element
     * (see DOM.isTabNode() method).
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a text node in a text field element.
     */
    DOM.isTabNode = function (node) {
        return $(node).is(DOM.TAB_NODE_SELECTOR);
    };

    /**
     * Returns a new tab element.
     *
     * @returns {jQuery}
     *  A new tab element, as jQuery object.
     */
    DOM.createTabNode = function () {
        return $('<div>', { contenteditable: false }).addClass('tab component');
    };

    /**
     * Returns whether the passed node is a <div> container with embedded text
     * spans, used as root elements for special text components in a paragraph.
     * Does NOT return true for helper nodes that do not represent editable
     * contents of a paragraph (e.g. numbering labels). To check for all helper
     * nodes that contain text spans (also non-editable elements such as
     * numbering labels), use the method DOM.isTextSpanContainerNode() instead.
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a <div> element representing an editable
     *  text component in a paragraph.
     */
    DOM.isTextComponentNode = function (node) {
        return $(node).is('div.component');
    };

    /**
     * Returns whether the passed node is a <div> container with embedded text
     * spans, used as root elements for special text components in a paragraph.
     * Does NOT return true for text nodes contained in helper nodes that do
     * not represent editable contents of a paragraph (e.g. numbering labels).
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a DOM text node contained in a <div> element
     *  representing an editable text component in a paragraph.
     */
    DOM.isTextNodeInTextComponent = function (node) {
        node = node ? Utils.getDomNode(node) : null;
        return node && DOM.isTextSpan(node.parentNode) && DOM.isTextComponentNode(node.parentNode.parentNode);
    };

    // paragraph helper nodes -------------------------------------------------

    /**
     * Returns whether the passed node is a <div> container with embedded text
     * spans, used as root elements for special text elements in a paragraph.
     * Returns also true for helper nodes that do NOT represent editable
     * contents of a paragraph (e.g. numbering labels). To check for container
     * nodes that represent editable components in a paragraph only, use the
     * method DOM.isTextComponentNode() instead.
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a <div> element containing text spans.
     */
    DOM.isTextSpanContainerNode = function (node) {
        node = node ? Utils.getDomNode(node) : null;
        return $(node).is('div') && DOM.isParagraphNode(node.parentNode) && DOM.isTextSpan(node.firstChild);
    };

    /**
     * A jQuery selector that matches elements representing a list label.
     */
    DOM.LIST_LABEL_NODE_SELECTOR = 'div.list-label';

    /**
     * Returns whether the passed node is an element representing a list label.
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a list label element.
     */
    DOM.isListLabelNode = function (node) {
        return $(node).is(DOM.LIST_LABEL_NODE_SELECTOR);
    };

    /**
     * Creates a new element representing a list label.
     *
     * @param {String} [text]
     *  The text contents of the list label node.
     *
     * @returns
     *  A new list label node, as jQuery object.
     */
    DOM.createListLabelNode = function (text) {
        text = _.isString(text) ? text : '';
        return $('<div>', { contenteditable: false })
            .addClass('list-label')
            .append(DOM.createTextSpan().text(text));
    };

    /**
     * Returns whether the passed node is a dummy text node that is used in
     * empty paragraphs to preserve an initial element height according to the
     * current font size.
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a dummy text node.
     */
    DOM.isDummyTextNode = function (node) {
        return $(node).data('dummy') === true;
    };

    /**
     * Creates a dummy text node that is used in empty paragraphs to preserve
     * an initial element height according to the current font size.
     *
     * @returns {jQuery}
     *  A dummy text node, as jQuery object.
     */
    DOM.createDummyTextNode = function () {
        // TODO: create correct element for current browser
        return $('<br>').data('dummy', true);
    };

    // object nodes -----------------------------------------------------------

    /**
     * A jQuery selector that matches elements representing an object.
     */
    DOM.OBJECT_NODE_SELECTOR = 'div.object';

    /**
     * Returns whether the passed node is a <div> element wrapping an object.
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a div element wrapping an object.
     */
    DOM.isObjectNode = function (node) {
        return $(node).is(DOM.OBJECT_NODE_SELECTOR);
    };

    /**
     * Returns whether the passed node is a <div> element wrapping an object
     * in inline mode.
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a div element wrapping an object and is
     *  rendered inlined.
     */
    DOM.isInlineObjectNode = function (node) {
        return DOM.isObjectNode(node) && $(node).hasClass('inline');
    };

    /**
     * Returns whether the passed node is a <div> element wrapping an object
     * in floating mode.
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a div element wrapping an object and is
     *  rendered floated.
     */
    DOM.isFloatingObjectNode = function (node) {
        return DOM.isObjectNode(node) && $(node).hasClass('float');
    };

    /**
     * Returns whether the passed node is a <div> element wrapping an image.
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a div element wrapping an image.
     */
    DOM.isImageNode = function (node) {
        // object div contains another div (class content) that contains an image
        return DOM.isObjectNode(node) && ($(node).find('img').length > 0);
    };

    /**
     * A jQuery selector that matches elements representing an object offset
     * helper node.
     */
    DOM.OFFSET_NODE_SELECTOR = 'div.offset';

    /**
     * Returns whether the passed node is a <div> element for positioning
     * an object with a vertical or horizontal offset.
     *
     * @param {Node|jQuery|Null} [node]
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains. If missing or null, returns false.
     *
     * @returns {Boolean}
     *  Whether the passed node is a div element wrapping an object.
     */
    DOM.isOffsetNode = function (node) {
        return $(node).is(DOM.OFFSET_NODE_SELECTOR);
    };

    // find, manipulate, and iterate text spans -------------------------------

    /**
     * Searches a text span element in the previous siblings of the passed
     * node.
     *
     * @param {HTMLElement|jQuery} node
     *  The node whose previous siblings will be searched for a text span
     *  element. If this object is a jQuery collection, uses the first DOM node
     *  it contains.
     *
     * @returns {HTMLElement|Null}
     *  The closest text span preceding the specified node, or null.
     */
    DOM.findPreviousTextSpan = function (node) {
        node = Utils.getDomNode(node);
        while (node && !DOM.isTextSpan(node)) {
            node = node.previousSibling;
        }
        return node;
    };

    /**
     * Searches a text span element in the next siblings of the passed node.
     *
     * @param {HTMLElement|jQuery} node
     *  The node whose next siblings will be searched for a text span element.
     *  If this object is a jQuery collection, uses the first DOM node it
     *  contains.
     *
     * @returns {HTMLElement|Null}
     *  The closest text span following the specified node, or null.
     */
    DOM.findNextTextSpan = function (node) {
        node = Utils.getDomNode(node);
        while (node && !DOM.isTextSpan(node)) {
            node = node.nextSibling;
        }
        return node;
    };

    /**
     * Returns the closest text span in the previous siblings of the passed
     * node. If there is no such text span, tries to find the closest text span
     * in the following siblings.
     *
     * @param {HTMLElement|jQuery} node
     *  The node whose siblings will be searched for a text span element. If
     *  this object is a jQuery collection, uses the first DOM node it
     *  contains.
     *
     * @returns {HTMLElement|Null}
     *  The closest text span in the siblings of the specified node, or null.
     */
    DOM.findRelatedTextSpan = function (node) {
        return DOM.findPreviousTextSpan(node) || DOM.findNextTextSpan(node);
    };

    /**
     * Splits the passed text span element into two text span elements. Clones
     * all formatting to the new span element.
     *
     * @param {HTMLSpanElement|jQuery} span
     *  The text span to be split. If this object is a jQuery collection, uses
     *  the first DOM node it contains.
     *
     * @param {Number} offset
     *  The character position where the text span will be split. If this
     *  position is at the start or end of the text in the span, an empty text
     *  span will be inserted.
     *
     * @param {Object} [options]
     *  A map of options to control the split operation. Supports the following
     *  options:
     *  @param {Boolean} [options.append]
     *      If set to true, the right part of the text will be inserted after
     *      the passed text span; otherwise the left part of the text will be
     *      inserted before the passed text span. The position of the new text
     *      span may be important when iterating and manipulating a range of
     *      DOM nodes.
     *
     * @returns {jQuery}
     *  The newly created text span element, as jQuery object. Will be located
     *  before or after the passed text span, depending on the 'options.append'
     *  option.
     */
    DOM.splitTextSpan = function (span, offset, options) {

        var // the new span for the split text portion, as jQuery object
            newSpan = $(span).clone(true),
            // the existing text node (must not be invalidated, e.g. by using jQuery.text())
            textNode = Utils.getDomNode(span).firstChild,
            // text for the left span
            leftText = textNode.nodeValue.substr(0, offset),
            // text for the right span
            rightText = textNode.nodeValue.substr(offset);

        // insert the span and update the text nodes
        if (Utils.getBooleanOption(options, 'append', false)) {
            newSpan.insertAfter(span);
            // no jQuery.text() here (that would kill the existing text node)
            textNode.nodeValue = leftText;
            newSpan.text(rightText);
        } else {
            newSpan.insertBefore(span);
            newSpan.text(leftText);
            // no jQuery.text() here (that would kill the existing text node)
            textNode.nodeValue = rightText;
        }

        // return the new text span
        return newSpan;
    };

    /**
     * Calls the passed iterator function for all descendant text span elements
     * in a the passed node. As a special case, if the passed node is a text
     * span by itself, it will be visited directly. Text spans can be direct
     * children of a paragraph node (regular editable text portions), or
     * children of other nodes such as text fields or list label nodes.
     *
     * @param {HTMLElement|jQuery} node
     *  The DOM node whose descendant text spans will be visited (or which will
     *  be visited by itself if it is a text span). If this object is a jQuery
     *  collection, uses the first DOM node it contains.
     *
     * @param {Function} iterator
     *  The iterator function that will be called for every text span. Receives
     *  the DOM span element as first parameter. If the iterator returns the
     *  Utils.BREAK object, the iteration process will be stopped immediately.
     *
     * @param {Object} [context]
     *  If specified, the iterator will be called with this context (the symbol
     *  'this' will be bound to the context inside the iterator function).
     *
     * @returns {Utils.BREAK|Undefined}
     *  A reference to the Utils.BREAK object, if the iterator has returned
     *  Utils.BREAK to stop the iteration process, otherwise undefined.
     */
    DOM.iterateTextSpans = function (node, iterator, context) {

        // visit passed text span directly
        if (DOM.isTextSpan(node)) {
            return iterator.call(context, Utils.getDomNode(node));
        }

        // do not iterate into objects, they may contain their own paragraphs
        if (!DOM.isObjectNode(node)) {
            return Utils.iterateSelectedDescendantNodes(node, function () { return DOM.isTextSpan(this); }, iterator, context);
        }
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
     * @param {HTMLElement|jQuery} rootNode
     *  The DOM root node containing the elements covered by the passed ranges.
     *  If this object is a jQuery collection, uses the first node it contains.
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
    DOM.iterateNodesInRanges = function (ranges, rootNode, iterator, context) {

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
                node = Utils.getNextNodeInTree(rootNode, node);
            }

            // iterate as long as the end of the range has not been reached
            while (node && (DOM.Point.comparePoints(DOM.Point.createPointForNode(node), range.end) < 0)) {
                // call iterator for the node, return if iterator returns Utils.BREAK
                if (callIterator() === Utils.BREAK) { return Utils.BREAK; }
                // find next node
                node = Utils.getNextNodeInTree(rootNode, node);
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
        return DOM.iterateNodesInRanges(ranges, rootNode, function (node, range, index, ranges) {

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
            // the limiting point for valid ranges (next sibling of root node)
            globalEndPos = null;

        // creates a DOM.Range object and pushes it into the result array if it is inside the root node
        function pushRange(startNode, startOffset, endNode, endOffset) {

            var // the range to be pushed into the array
                range = DOM.Range.createRange(startNode, startOffset, endNode, endOffset),
                // check that the nodes are inside the root node (with adjusted clone of the range)
                adjustedRange = range.clone().adjust();

            if (rootNode.contains(adjustedRange.start.node) && (DOM.Point.comparePoints(adjustedRange.end, globalEndPos) <= 0)) {
                ranges.push(range);
            }
        }

        // convert parameter to DOM element
        rootNode = Utils.getDomNode(rootNode);

        // end position if the range selects the entire root node
        globalEndPos = DOM.Point.createPointForNode(rootNode);
        globalEndPos.offset += 1;

        // single range: use attributes of the Selection object (anchor/focus)
        // directly to preserve direction of selection when selecting backwards
        // (range objects received by the Selection.getRangeAt() method are
        // adjusted already)
        if (selection.rangeCount === 1) {

            // 'anchor' always points to selection start point, 'focus' always
            // points to current cursor position (may precede anchor when
            // selecting backwards with mouse or keyboard)
            pushRange(selection.anchorNode, selection.anchorOffset, selection.focusNode, selection.focusOffset);

        } else if (selection.rangeCount > 1) {

            // get all ranges of a multi-selection
            for (var index = 0; index < selection.rangeCount; index += 1) {
                // get the native selection Range object
                range = selection.getRangeAt(index);
                // translate to the internal text range representation
                pushRange(range.startContainer, range.startOffset, range.endContainer, range.endOffset);
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

        // clear the old browser selection
        selection.removeAllRanges();

        // convert to array
        ranges = _.getArray(ranges);

        // single range: use attributes of the Selection object (anchor/focus)
        // directly to preserve direction of selection when selecting backwards
        if ((ranges.length === 1) && !$(ranges[0].start.node).is('tr')) {
            try {
                selection.collapse(ranges[0].start.node, ranges[0].start.offset);
                selection.extend(ranges[0].end.node, ranges[0].end.offset);
                return;
            } catch (ex) {
                Utils.warn('DOM.setBrowserSelection(): failed to collapse/expand range to selection: ' + ex);
                // retry with regular code below
                selection.removeAllRanges();
            }
        }

        // create a multi-selection
        _(ranges).each(function (range) {

            var docRange = null;
            try {
                docRange = window.document.createRange();
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
     * Returns whether the passed node is a <div> element that contains a
     * selection. The selection is represented by a <div> element with class
     * 'selection'.
     *
     * @param {Node|jQuery} node
     *  The DOM node to be checked. If this object is a jQuery collection, uses
     *  the first DOM node it contains.
     *
     * @returns {Boolean}
     *  Whether the passed node contains a div element with class selection.
     */
    DOM.hasObjectSelection = function (node) {
        return DOM.isObjectNode(node) && ($(node).children('div.selection').length > 0);
    };

    /**
     * Inserts a new selection box into the specified object node, or modifies
     * an existing selector box according to the passed options.
     *
     * @param {HTMLElement|jQuery} objects
     *  The object node for which a selection box will be inserted. If the
     *  passed value is a jQuery collection, draws selection boxes for all
     *  contained objects.
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
    DOM.drawObjectSelection = function (objects, options, mousedownhandler, mousemovehandler, mouseuphandler, context) {

        $(objects).each(function () {

            var // the container element used to visualize the selection
                selectionBox = $(this).children('div.selection'),
                // the container element used to visualize the movement and resizing
                moveBox = $(this).children('div.move'),
                // whether object is moveable
                moveable = Utils.getBooleanOption(options, 'moveable', false),
                // whether object is sizeable
                sizeable = Utils.getBooleanOption(options, 'sizeable', false),
                // whether mousedown is a current event
                mousedownevent = false,
                // saving the selected object node
                objectNode = this;

            // create a new selection box and a move box if missing
            if (selectionBox.length === 0) {
                $(this).append(selectionBox = $('<div>').addClass('selection')).append(moveBox = $('<div>').addClass('move'));

                if (sizeable) {
                    // add resize handles
                    _(['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l']).each(function (pos) {
                        var handleDiv = $('<div>')
                        .mousedown(function (e1, e2) {
                            if (mousedownevent === true) { return; }
                            var event = e1.pageX ? e1 : e2;  // from triggerHandler in editor only e2 can be used
                            mousedownevent = true;
                            mousedownhandler.call(context, event, objectNode, pos);
                        });
                        selectionBox.append(handleDiv.addClass('handle ' + pos));
                    });
                }

                if (moveable) {
                    // moving the object
                    $(this).mousedown(function (e1, e2) {
                        if ((! moveable) || (mousedownevent === true)) { return; }
                        var event = e1.pageX ? e1 : e2;  // from triggerHandler in editor only e2 can be used
                        mousedownevent = true;
                        mousedownhandler.call(context, event, objectNode, undefined);
                    });
                }

                // mousemove and mouseup events can be anywhere on the page -> binding to $(document)
                $(document)
                .mousemove(function (e) {
                    if (! mousedownevent) return;
                    mousemovehandler.call(context, e, moveBox);
                })
                .mouseup(function (e) {
                    if (mousedownevent === true) {
                        mouseuphandler.call(context, e, objectNode, moveBox);
                        mousedownevent = false;
                    }
                });

                // set classes according to passed options, and resize handles
                moveBox.toggleClass('moveable', moveable).toggleClass('sizeable', sizeable);
                selectionBox.toggleClass('moveable', moveable).toggleClass('sizeable', sizeable);
            }
        });
    };

    /**
     * Removes the selection box from the specified object node.
     *
     * @param {HTMLElement|jQuery} objects
     *  The object node whose selection box will be removed. If the passed
     *  value is a jQuery collection, removes the selection boxes from all
     *  contained objects.
     */
    DOM.clearObjectSelection = function (objects) {
        $(objects).children('div.selection').remove();
        $(objects).children('div.move').remove();
        // removing mouse event handler (mouseup and mousemove) from page div
        $(document).off('mouseup mousemove');
        $(objects).off('mousedown');
    };

    // exports ================================================================

    return DOM;

});
