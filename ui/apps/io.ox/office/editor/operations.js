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
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/editor/operations',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/position',
     'io.ox/office/editor/format/stylesheets'
    ], function (Utils, DOM, Position, StyleSheets) {

    'use strict';

    var // the exported module (forward declaration to suppress warnings in private functions)
        Operations = null;

    // static class Operations ================================================

    /**
     * Defines the names of all supported operations and static helper
     * functions to generate operations from DOM structures and selections.
     */
    var Operations = {

        SET_DOCUMENT_ATTRIBUTES: 'setDocumentAttributes',

        DELETE: 'delete',
        MOVE: 'move',

        TEXT_INSERT: 'insertText',
        TEXT_DELETE: 'deleteText',
        DRAWING_INSERT: 'insertDrawing',
        FIELD_INSERT: 'insertField',
        TAB_INSERT: 'insertTab',

        PARA_INSERT: 'insertParagraph',
        PARA_DELETE: 'deleteParagraph',
        PARA_SPLIT: 'splitParagraph',
        PARA_MERGE: 'mergeParagraph',

        TABLE_INSERT: 'insertTable',
        TABLE_DELETE: 'deleteTable',
        ROWS_INSERT: 'insertRows',
        ROWS_DELETE: 'deleteRows',
        CELLS_INSERT: 'insertCells',
        CELLS_DELETE: 'deleteCells',
        CELL_SPLIT: 'splitCell',
        CELL_MERGE: 'mergeCell',
        COLUMN_INSERT: 'insertColumn',
        COLUMNS_DELETE: 'deleteColumns',

        ATTRS_SET: 'setAttributes',
        INSERT_STYLE: 'insertStyleSheet',
        DELETE_STYLE: 'deleteStyleSheet',
        INSERT_THEME: 'insertTheme',
        INSERT_FONT_DESC: 'insertFontDescription',
        INSERT_LIST: 'insertList',
        DELETE_LIST: 'deleteList'

    };

    // class Operations.Generator =============================================

    /**
     * An instance of this class contains an operations array and provides
     * methods to generate operations for various element nodes.
     *
     * @constructor
     */
    Operations.Generator = function () {

        var // self reference
            self = this,
            // the operations buffer
            operations = [];

        // private methods ----------------------------------------------------

        /**
         * Creates and appends a new operation to the operations array.
         *
         * @param {String} name
         *  The name of the operation.
         *
         * @param {Object} [operationOptions]
         *  Additional options that will be stored in the operation.
         *
         * @returns {Object}
         *  Reference to the created operation, for later use.
         */
        function generateOperation(name, operationOptions) {
            var operation = _.extend({ name: name }, operationOptions);
            operations.push(operation);
            return operation;
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the array of operations that has been generated so far.
         */
        this.getOperations = function () {
            return operations;
        };

        /**
         * Reverses the entire operations array.
         *
         * @returns {Operations.Generator}
         *  A reference to this instance.
         */
        this.reverseOperations = function () {
            operations.reverse();
            return this;
        };

        /**
         * Creates and appends a new operation to the operations array.
         *
         * @param {String} name
         *  The name of the operation.
         *
         * @param {Object} [operationOptions]
         *  Additional options that will be stored in the operation.
         *
         * @returns {Operations.Generator}
         *  A reference to this instance.
         */
        this.generateOperation = function (name, operationOptions) {
            generateOperation(name, operationOptions);
            return this;
        };

        /**
         * Creates and appends a new operation to the operations array. Adds
         * explicit attributes of the passed node to the 'attrs' option of the
         * new operation.
         *
         * @param {HTMLElement|jQuery} node
         *  The element node that may contain explicit formatting attributes.
         *  If this object is a jQuery collection, uses the first node it
         *  contains.
         *
         * @param {String} name
         *  The name of the operation.
         *
         * @param {Object} [operationOptions]
         *  Additional options that will be stored in the operation.
         *
         * @returns {Operations.Generator}
         *  A reference to this instance.
         */
        this.generateOperationWithAttributes = function (node, name, operationOptions) {

            var // explicit attributes of the passed node
                attributes = StyleSheets.getExplicitAttributes(node);

            // add the 'attrs' entry if there are attributes, and push the operation
            if (!_.isEmpty(attributes)) {
                operationOptions = _.extend({ attrs: attributes }, operationOptions);
            }
            generateOperation(name, operationOptions);

            return this;
        };

        /**
         * Generates the 'setAttributes' operation needed to set the explicit
         * formatting attributes of the passed element node. If the passed node
         * does not contain any explicit attributes, no operation will be
         * generated.
         *
         * @param {HTMLElement|jQuery} node
         *  The element node whose formatting attributes will be converted to
         *  an operation. If this object is a jQuery collection, uses the first
         *  node it contains.
         *
         * @param {String} family
         *  The main attribute family of the style sheets referred by the
         *  passed element node.
         *
         * @param {Number[]} position
         *  The logical (start) position of the passed node.
         *
         * @param {Number[]} [endPosition]
         *  The logical end position of the passed node, if the node spans
         *  several logical components (e.g. a text portion).
         *
         * @param {Object} [options]
         *  A map with options controlling the operation generation process.
         *  Supports the following options:
         *  @param {String} [options.clear]
         *      If specified, an additional 'setAttributes' operation will be
         *      generated before the 'setAttributes' operation for the passed
         *      node, that clears all attributes of the specified attribute
         *      families.
         *
         * @returns {Operations.Generator}
         *  A reference to this instance.
         */
        this.generateSetAttributesOperation = function (node, family, position, endPosition, options) {

            var // explicit attributes of the passed node
                elementAttributes = StyleSheets.getExplicitAttributes(node),
                // the operation options
                operationOptions = { start: position, attrs: {} };

            // add optional end position
            if (_.isArray(endPosition)) {
                operationOptions.end = endPosition;
            }

            // insert null values for all attributes registered for the specified style family
            if (Utils.getOption(options, 'clear', false)) {
                operationOptions.attrs = StyleSheets.buildNullAttributes(family);
            }

            // merge the explicit attributes of the passed element
            StyleSheets.extendAttributes(operationOptions.attrs, elementAttributes);

            // no attributes, no operation
            if (!_.isEmpty(operationOptions.attrs)) {
                generateOperation(Operations.ATTRS_SET, operationOptions);
            }

            return this;
        };

        /**
         * Generates all operations needed to recreate the child nodes of the
         * passed paragraph.
         *
         * @param {HTMLElement|jQuery} paragraph
         *  The paragraph element whose content nodes will be converted to
         *  operations. If this object is a jQuery collection, uses the first
         *  node it contains.
         *
         * @param {Number[]} position
         *  The logical position of the passed paragraph node. The generated
         *  operations will contain positions starting with this address.
         *
         * @param {Object} [options]
         *  A map with options controlling the operation generation process.
         *  Supports the following options:
         *  @param {Number} [options.start]
         *      The logical index of the first character to be included into
         *      the generated operations. By default, operations will include
         *      all contents from the beginning of the paragraph.
         *  @param {Number} [options.end]
         *      The logical index of the last character to be included into the
         *      generated operations (closed range). By default, operations
         *      will include all contents up to the end of the paragraph.
         *  @param {Boolean} [options.clear]
         *      If set to true, a 'setAttributes' operation will be generated
         *      for the first 'insertText' operation that clears all character
         *      attributes of the inserted text. This prevents that applying
         *      the operations at another place in the document clones the
         *      character formatting of the target position.
         *  @param {Number} [options.targetOffset]
         *      If set to a number, the logical positions in the operations
         *      generated for the child nodes will start at this offset. If
         *      omitted, the original node offset will be used in the logical
         *      positions.
         *
         * @returns {Operations.Generator}
         *  A reference to this instance.
         */
        this.generateParagraphChildOperations = function (paragraph, position, options) {

            var // start of text range to be included in the operations
                rangeStart = Utils.getIntegerOption(options, 'start'),
                // end of text range to be included in the operations
                rangeEnd = Utils.getIntegerOption(options, 'end'),
                // start position of text nodes in the generated operations
                targetOffset = Utils.getIntegerOption(options, 'targetOffset'),

                // used to merge several text portions into the same operation
                lastTextOperation = null,
                // formatting ranges for text portions, must be applied after the contents
                attributeRanges = [],
                // attributes passed to the first insert operation to clear all formatting
                clearAttributes = null;

            // generates the specified operation, adds that attributes in clearAttributes on first call
            function generateOperationWithClearAttributes(name, operationOptions) {

                // add the character attributes that will be cleared on first insertion operation
                if (_.isObject(clearAttributes)) {
                    operationOptions.attrs = clearAttributes;
                    clearAttributes = null;
                }

                return generateOperation(name, operationOptions);
            }

            // clear all attributes of the first inserted text span
            if (Utils.getBooleanOption(options, 'clear', false)) {
                clearAttributes = StyleSheets.buildNullAttributes('character');
            }

            // process all content nodes in the paragraph and create operations
            Position.iterateParagraphChildNodes(paragraph, function (node, nodeStart, nodeLength, offsetStart, offsetLength) {

                var // logical start index of the covered part of the child node
                    startIndex = _.isNumber(targetOffset) ? targetOffset : (nodeStart + offsetStart),
                    // logical end index of the covered part of the child node (closed range)
                    endIndex = startIndex + offsetLength - 1,
                    // logical start position of the covered part of the child node
                    startPosition = Position.appendNewIndex(position, startIndex),
                    // logical end position of the covered part of the child node
                    endPosition = Position.appendNewIndex(position, endIndex),
                    // text of a portion span
                    text = null,
                    // type of the drawing
                    type = null;

                // operation to create a (non-empty) generic text portion
                if (DOM.isTextSpan(node)) {

                    // extract the text covered by the specified range
                    text = node.firstChild.nodeValue.substr(offsetStart, offsetLength);
                    // append text portions to the last 'insertText' operation
                    if (lastTextOperation) {
                        lastTextOperation.text += text;
                    } else {
                        lastTextOperation = generateOperationWithClearAttributes(Operations.TEXT_INSERT, { start: startPosition, text: text });
                    }
                    attributeRanges.push({ node: node, start: startPosition, end: (text.length > 1) ? endPosition : null });

                } else {

                    // anything else than plain text will be inserted, forget last text operation
                    lastTextOperation = null;

                    // operation to create a text field
                    // TODO: field type
                    if (DOM.isFieldNode(node)) {
                        // extract text of all embedded spans representing the field
                        text = $(node).text();
                        generateOperationWithClearAttributes(Operations.FIELD_INSERT, { start: startPosition, representation: text });
                        // attributes are contained in the embedded span elements
                        attributeRanges.push({ node: node.firstChild, start: startPosition });
                    }

                    // operation to create a tabulator
                    else if (DOM.isTabNode(node)) {
                        generateOperationWithClearAttributes(Operations.TAB_INSERT, { start: startPosition });
                        // attributes are contained in the embedded span elements
                        attributeRanges.push({ node: node.firstChild, start: startPosition });
                    }

                    // operation to create a drawing (including its attributes)
                    else if (DOM.isDrawingNode(node)) {
                        type = $(node).data('type');
                        this.generateOperationWithAttributes(node, Operations.DRAWING_INSERT, { start: startPosition, type: type });
                    }

                    else {
                        Utils.error('Operations.Generator.generateParagraphChildOperations(): unknown content node');
                        return Utils.BREAK;
                    }
                }

                // custom target offset: advance offset by covered node length
                if (_.isNumber(targetOffset)) {
                    targetOffset += offsetLength;
                }

            }, this, { start: rangeStart, end: rangeEnd });

            // Generate 'setAttribute' operations after all contents have been
            // created via 'insertText', 'insertField', etc. Otherwise, these
            // operations would clone the attributes of the last text portion
            // instead of creating a clean text node as expected in this case.
            _(attributeRanges).each(function (range) {
                this.generateSetAttributesOperation(range.node, 'character', range.start, range.end);
            }, this);

            return this;
        };

        /**
         * Generates all operations needed to recreate the passed paragraph.
         *
         * @param {HTMLElement|jQuery} paragraph
         *  The paragraph element whose contents will be converted to
         *  operations. If this object is a jQuery collection, uses the first
         *  node it contains.
         *
         * @param {Number[]} position
         *  The logical position of the passed paragraph node. The generated
         *  operations will contain positions starting with this address.
         *
         * @param {Boolean} [initialParagraph]
         *  If set to true, no 'insertParagraph' operation will be generated.
         *  The generated operations will assume that an empty (!) paragraph
         *  element exists at the passed logical position.
         *
         * @returns {Operations.Generator}
         *  A reference to this instance.
         */
        this.generateParagraphOperations = function (paragraph, position, initialParagraph) {

            // operations to create the paragraph element and formatting
            if (initialParagraph === true) {
                this.generateSetAttributesOperation(paragraph, 'paragraph', position, undefined, { clear: true });
            } else {
                this.generateOperationWithAttributes(paragraph, Operations.PARA_INSERT, { start: position });
            }

            // process all content nodes in the paragraph and create operations
            return this.generateParagraphChildOperations(paragraph, position);
        };

        /**
         * Generates all operations needed to recreate the passed table cell.
         *
         * @param {HTMLTableCellElement|jQuery} cellNode
         *  The table cell element that will be converted to operations. If
         *  this object is a jQuery collection, uses the first node it
         *  contains.
         *
         * @param {Number[]} position
         *  The logical position of the passed table cell. The generated
         *  operations will contain positions starting with this address.
         *
         * @returns {Operations.Generator}
         *  A reference to this instance.
         */
        this.generateTableCellOperations = function (cellNode, position) {

            // operation to create the table cell element
            this.generateOperationWithAttributes(cellNode, Operations.CELLS_INSERT, { start: position, count: 1 });

            // generate operations for the contents of the cell
            return this.generateContentOperations(cellNode, position);
        };

        /**
         * Generates all operations needed to recreate the passed table row.
         *
         * @param {HTMLTableRowElement|jQuery} rowNode
         *  The table row element that will be converted to operations. If this
         *  object is a jQuery collection, uses the first node it contains.
         *
         * @param {Number[]} position
         *  The logical position of the passed table row. The generated
         *  operations will contain positions starting with this address.
         *
         * @returns {Operations.Generator}
         *  A reference to this instance.
         */
        this.generateTableRowOperations = function (rowNode, position) {

            // operation to create the table row element
            this.generateOperationWithAttributes(rowNode, Operations.ROWS_INSERT, { start: position });

            // generate operations for all cells
            position = Position.appendNewIndex(position);
            Utils.iterateSelectedDescendantNodes(rowNode, 'td', function (cellNode) {
                this.generateTableCellOperations(cellNode, position);
                position = Position.increaseLastIndex(position);
            }, this, { children: true });

            return this;
        };

        /**
         * Generates all operations needed to recreate the passed table.
         *
         * @param {HTMLTableElement|jQuery} tableNode
         *  The table element that will be converted to operations. If this
         *  object is a jQuery collection, uses the first node it contains.
         *
         * @param {Number[]} position
         *  The logical position of the passed table node. The generated
         *  operations will contain positions starting with this address.
         *
         * @returns {Operations.Generator}
         *  A reference to this instance.
         */
        this.generateTableOperations = function (tableNode, position) {

            // operation to create the table element
            this.generateOperationWithAttributes(tableNode, Operations.TABLE_INSERT, { start: position });

            // generate operations for all rows
            position = Position.appendNewIndex(position);
            DOM.getTableRows(tableNode).each(function () {
                self.generateTableRowOperations(this, position);
                position = Position.increaseLastIndex(position);
            });

            return this;
        };

        /**
         * Generates all operations needed to recreate the contents of the
         * passed root node. Root nodes are container elements for text
         * paragraphs and other first-level content nodes (e.g. tables).
         * Examples for root nodes are the entire document root node, table
         * cells, or text shapes. Note that the operation to create the root
         * node itself will NOT be generated.
         *
         * @param {HTMLElement|jQuery} rootNode
         *  The root node containing the content nodes that will be converted
         *  to operations. The passed root node may contain an embedded node
         *  that serves as parent for all content nodes.  If this object is a
         *  jQuery collection, uses the first node it contains.
         *
         * @param {Number[]} position
         *  The logical position of the passed node. The generated operations
         *  will contain positions starting with this address.
         *
         * @returns {Operations.Generator}
         *  A reference to this instance.
         */
        this.generateContentOperations = function (rootNode, position) {

            var // all root elements will contain an empty paragraph after creation
                initialParagraph = true,
                // the container node (direct parent of the target content nodes)
                containerNode = DOM.getChildContainerNode(rootNode);

            // iterate all child elements of the root node and create operations
            position = Position.appendNewIndex(position);
            Utils.iterateDescendantNodes(containerNode, function (node) {

                if (DOM.isParagraphNode(node)) {
                    // operations to create a paragraph (first paragraph node exists in every root node)
                    this.generateParagraphOperations(node, position, initialParagraph);
                    initialParagraph = false;
                } else if (DOM.isTableNode(node)) {
                    // operations to create a table with its structure and contents
                    this.generateTableOperations(node, position);
                } else {
                    Utils.error('Operations.Generator.generateContentOperations(): unexpected node "' + Utils.getNodeName(node) + '" at position ' + JSON.stringify(position) + '.');
                    // continue with next child node (do not increase position)
                    return;
                }

                // increase last element of the logical position (returns a clone)
                position = Position.increaseLastIndex(position);

            }, this, { children: true });

            return this;
        };

    }; // class Operations.Generator

    // exports ================================================================

    return Operations;

});
