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

        // generates a readable description of the passed node and offset
        function getNodeName(node, offset) {

            var // full string representation of this DOM Point
                result = node.nodeName.toLowerCase();

            if ((node.nodeType === 1) && (node.className.length > 0)) {
                // add class names of an element
                result += '.' + node.className.replace(/ /g, '.');
            } else if (node.nodeType === 3) {
                // add some text of a text node
                result += '"' + node.nodeValue.substr(0, 10) + ((node.nodeValue.length > 10) ? '\u2026' : '') + '"';
            }

            if (_.isNumber(offset)) {
                result += ':' + offset;
            }

            return result;
        }

        return getNodeName(this.node.parentNode, $(this.node).index()) + '>' + getNodeName(this.node, this.offset);
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
     * Returns the collection of table rows from the passed table element.
     *
     * @param {HTMLTableElement|jQuery} tableNode
     *  The table DOM node. If this object is a jQuery collection, uses the
     *  first DOM node it contains.
     *
     * @returns {jQuery}
     *  A jQuery collection containing all rows of the specified table.
     */
    DOM.getTableRows = function (tableNode) {
        return $(tableNode).find('> tbody > tr');
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

    /**
     * Creates a new table cell element.
     *
     * @param {jQuery} paragraph
     *  A paragraph node that is inserted into the cellcontent div of the new
     *  table cell.
     *
     * @returns {jQuery}
     *  A table cell element, as jQuery object.
     */
    DOM.createTableCellNode = function (paragraph) {
        return $('<td>').append($('<div>').addClass('cell')
                .append($('<div>').addClass('bottomborder resize'))
                .append($('<div>').addClass('rightborder resize'))
                .append($('<div>').addClass('cellcontent').append(paragraph)));
    };

    /**
     * Returns the container node of a table cell that contains all top-level
     * content nodes (paragraphs and tables).
     *
     * @param {HTMLTableCellElement|jQuery} cellNode
     *  The table cell DOM node. If this object is a jQuery collection, uses
     *  the first DOM node it contains.
     *
     * @returns {jQuery}
     *  The container DOM node from the passed table cell that contains all
     *  top-level content nodes (paragraphs and tables).
     */
    DOM.getCellContentNode = function (cellNode) {
        return $(cellNode).find('div.cellcontent');
    };

    /**
     * A jQuery selector that matches elements representing a resize node.
     */
    DOM.RESIZE_NODE_SELECTOR = 'div.resize';

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

    // manipulate and iterate text spans --------------------------------------

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

    // browser selection ======================================================

    /**
     * Returns an array of DOM ranges representing the current browser
     * selection.
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The container element the returned selection will be restricted to.
     *  Only ranges inside this root element will be included in the array.
     *
     * @returns {Object}
     *  An object that contains an attribute 'active' with a DOM.Range object
     *  containing the current anchor point in its 'start' attribute, and the
     *  focus point in its 'end' attribute. The focus point may precede the
     *  anchor point if selecting backwards with mouse or keyboard. The
     *  returned object contains another attribute 'ranges' which is an array
     *  of DOM.Range objects representing all ranges currently selected. Start
     *  and end points of these ranges are already adjusted so that each start
     *  point precedes the end point.
     */
    DOM.getBrowserSelection = function (rootNode) {

        var // the browser selection
            selection = window.getSelection(),
            // the result object
            result = { active: null, ranges: [] },
            // a single range object
            range = null,
            // the limiting point for valid ranges (next sibling of root node)
            globalEndPos = null;

        // creates a DOM.Range object
        function createRange(startNode, startOffset, endNode, endOffset) {

            var // the range to be pushed into the array
                range = DOM.Range.createRange(startNode, startOffset, endNode, endOffset),
                // check that the nodes are inside the root node (with adjusted clone of the range)
                adjustedRange = range.clone().adjust();

            return rootNode.contains(adjustedRange.start.node) && (DOM.Point.comparePoints(adjustedRange.end, globalEndPos) <= 0) ? range : null;
        }

        Utils.info('DOM.getBrowserSelection(): reading browser selection...');

        // convert parameter to DOM element
        rootNode = Utils.getDomNode(rootNode);

        // end position if the range selects the entire root node
        globalEndPos = DOM.Point.createPointForNode(rootNode);
        globalEndPos.offset += 1;

        // get anchor range which preserves direction of selection (focus node
        // may be located before anchor node)
        if (selection.rangeCount >= 1) {
            result.active = createRange(selection.anchorNode, selection.anchorOffset, selection.focusNode, selection.focusOffset);
            Utils.log('  anchor=' + result.active);
        }

        // read all selection ranges
        for (var index = 0; index < selection.rangeCount; index += 1) {
            // get the native selection Range object
            range = selection.getRangeAt(index);
            // translate to the internal text range representation
            range = createRange(range.startContainer, range.startOffset, range.endContainer, range.endOffset);
            // push, if range is valid
            if (range) {
                Utils.log('  ' + result.ranges.length + '=' + range);
                result.ranges.push(range.adjust());
            }
        }

        return result;
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

        Utils.info('DOM.setBrowserSelection(): writing browser selection...');

        // clear the old browser selection
        selection.removeAllRanges();

        // convert to array
        ranges = _.getArray(ranges);

        // single range: use attributes of the Selection object (anchor/focus)
        // directly to preserve direction of selection when selecting backwards
        if ((ranges.length === 1) && !$(ranges[0].start.node).is('tr')) {
            Utils.log('  0=' + ranges[0]);
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
        _(ranges).each(function (range, index) {

            var docRange = null;

            Utils.log('  ' + index + '=' + range);
            try {
                docRange = window.document.createRange();
                docRange.setStart(range.start.node, range.start.offset);
                docRange.setEnd(range.end.node, range.end.offset);
                selection.addRange(docRange);
            } catch (ex) {
                Utils.warn('DOM.setBrowserSelection(): failed to add range to selection; ' + ex);
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
     * @param {Object} options
     *  A map of options to control the appearance of the selection box.
     *  Supports the following options:
     *  @param {Boolean} [options.moveable]
     *      If set to true, the mouse pointer will change to a move pointer
     *      when the mouse hovers the selected element.
     *  @param {Boolean} [options.sizeable]
     *      If set to true, the mouse pointer will change to a specific resize
     *      pointer when the mouse hovers the corner handles of the selected
     *      element.
     *
     * @param {Function} mousedownhandler
     *  Callback function for mouse down event.
     *
     * @param {Function} mousemovehandler
     *  Callback function for mouse move event.
     *
     * @param {Function} mouseuphandler
     *  Callback function for mouse up event.
     *
     * @param {Object} context
     *  The context object that is required in the callback function calls.
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

    /**
     * Inserts a new resize line at the position of the specified object node.
     *
     * @param {HTMLElement|jQuery} objects
     *  The object node for which a resize line will be inserted.
     *
     * @param {Function} mousedownhandler
     *  Callback function for mouse down event.
     *
     * @param {Function} mousemovehandler
     *  Callback function for mouse move event.
     *
     * @param {Function} mouseuphandler
     *  Callback function for mouse up event.
     *
     * @param {Object} context
     *  The context object that is required in the callback function calls.
     */
    DOM.drawTablecellResizeLine = function (objects, mousedownhandler, mousemovehandler, mouseuphandler, context) {

        $(objects).each(function () {

            var // whether mousedown is a current event
                mousedownevent = false,
                // saving the selected object node
                resizeNode = this;

            // moving the object
            $(this).mousedown(function (e1, e2) {
                if (mousedownevent === true) { return; }
                var e = e1.pageX ? e1 : e2;  // from triggerHandler in editor only e2 can be used
                mousedownevent = true;
                mousedownhandler.call(context, e, resizeNode);
            });

            // mousemove and mouseup events can be anywhere on the page -> binding to $(document)
            $(document)
            .mousemove(function (e) {
                if (! mousedownevent) return;
                mousemovehandler.call(context, e, resizeNode);
            })
            .mouseup(function (e) {
                if (mousedownevent === true) {
                    mouseuphandler.call(context, e, resizeNode);
                    mousedownevent = false;
                }
            });
        });

    };

    // exports ================================================================

    return DOM;

});
