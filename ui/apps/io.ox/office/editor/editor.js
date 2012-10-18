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
 * @author Malte Timmermann <malte.timmermann@open-xchange.com>
 * @author Ingo Schmidt-Rosbiegal <ingo.schmidt-rosbiegal@open-xchange.com>
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/editor/editor',
    ['io.ox/core/event',
     'io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/oxopam',
     'io.ox/office/editor/oxoselection',
     'io.ox/office/editor/table',
     'io.ox/office/editor/image',
     'io.ox/office/editor/operations',
     'io.ox/office/editor/position',
     'io.ox/office/editor/undo',
     'io.ox/office/editor/format/stylesheets',
     'io.ox/office/editor/format/documentstyles',
     'io.ox/office/tk/alert',
     'gettext!io.ox/office/main'
    ], function (Events, Utils, DOM, OXOPaM, OXOSelection, Table, Image, Operations, Position, UndoManager, StyleSheets, DocumentStyles, Alert, gt) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // key codes of navigation keys that will be passed directly to the browser
        NAVIGATION_KEYS = _([
            // KeyCodes.SHIFT, KeyCodes.CONTROL, KeyCodes.ALT,
            // KeyCodes.CAPS_LOCK,
            KeyCodes.PAGE_UP, KeyCodes.PAGE_DOWN, KeyCodes.END, KeyCodes.HOME,
            KeyCodes.LEFT_ARROW, KeyCodes.UP_ARROW, KeyCodes.RIGHT_ARROW, KeyCodes.DOWN_ARROW,
            KeyCodes.LEFT_WINDOWS, KeyCodes.RIGHT_WINDOWS,
            KeyCodes.NUM_LOCK, KeyCodes.SCROLL_LOCK
        ]);

    // class Editor ===========================================================

    /**'io.ox/office/editor/position',
     * The text editor.
     *
     * Triggers the following events:
     * - 'focus': When the editor container got or lost browser focus.
     * - 'operation': When a new operation has been applied.
     * - 'selection': When the selection has been changed.
     */
    function Editor(app) {

        var // self reference for local functions
            self = this,

            // the container element for the document contents
            editdiv = $('<div>', { contenteditable: true }).addClass('page user-select-text'),

            // container for all style sheets of all attribute families
            documentStyles = new DocumentStyles(editdiv),

            // shortcuts for style sheet containers
            characterStyles = documentStyles.getStyleSheets('character'),
            paragraphStyles = documentStyles.getStyleSheets('paragraph'),
            imageStyles = documentStyles.getStyleSheets('image'),
            tableStyles = documentStyles.getStyleSheets('table'),
            tableRowStyles = documentStyles.getStyleSheets('tablerow'),
            tableCellStyles = documentStyles.getStyleSheets('tablecell'),
            pageStyles = documentStyles.getStyleSheets('page'),

            // all highlighted DOM ranges (e.g. in quick search)
            highlightRanges = [],

            // list of operations
            operations = [],

            focused = false,

            lastKeyDownEvent,

            // current selection as OXOSelection instance
            currentSelection = null,
            // all selected object nodes, as jQuery collection
            selectedObjects = $(),

            undomgr = new UndoManager(this),

            // maps all operation handler functions to the operation names
            operationHandlers = {},

            lastOperationEnd,     // Need to decide: Should the last operation modify this member, or should the selection be passed up the whole call chain?!

            blockOperations = false,
            blockOperationNotifications = false,

            // list of paragraphs as jQuery object
            // TODO: remove this (for performance), always access child elements on demand
            paragraphs = editdiv.children(),

            // set document into write protected mode
            // can be null, false and true
            // init with null for 'read only' and mode not yet determined by the server
            editMode = null,

            dbgoutEvents = false, dbgoutObjects = false;

        // add event hub
        Events.extend(this);

        // ==================================================================
        // Public editor functions
        // ==================================================================

        /**
         * Returns whether the editor is currently focused.
         */
        this.hasFocus = function () {
            return focused;
        };

        /**
         * Sets the browser focus into the edit text area, and triggers a
         * 'focus' event, if the state has been changed.
         */
        this.grabFocus = function (initSelection) {
            editdiv.focus();
            if (initSelection) {
                // TODO: find first text position (instead of [0,0])
                // there may be a floated image in the first paragraph, or a leading table
                setSelection(new OXOSelection(new OXOPaM([0, 0]), new OXOPaM([0, 0])));
            }
        };

        /**
         * Destructs the editor object.
         */
        this.destroy = function () {
            this.events.destroy();
            documentStyles.destroy();
            documentStyles = characterStyles = paragraphStyles = imageStyles = tableStyles = tableRowStyles = tableCellStyles = null;
        };

        // OPERATIONS API

        this.clearOperations = function () {
            operations = [];
        };

        this.getOperations = function () {
            return operations;
        };

        // Cut, copy, paste

        this.cut = function () {
            // TODO
            Utils.warn('Editor.cut(): not yet implemented');
        };

        this.copy = function () {
            // TODO
            Utils.warn('Editor.copy(): not yet implemented');
        };

        this.paste = function () {
            // TODO
            Utils.warn('Editor.paste(): not yet implemented');
        };

        // ==================================================================
        // HIGH LEVEL EDITOR API which finally results in Operations
        // and creates Undo Actions.
        // Public functions, that are called from outside the editor
        // and generate operations.
        // ==================================================================

        /**
         * Returns the root DOM element representing this editor.
         */
        this.getNode = function () {
            return editdiv;
        };

        this.applyOperation = function (operation, record, notify) {
            applyOperation(operation, record, notify);
        };

        this.applyOperations = function (operations, record, notify) {
            _(operations).each(function (operation) {
                applyOperation(operation, record, notify);
            });
        };

        this.initDocument = function () {
            var newOperation = { name: 'initDocument' };
            applyOperation(newOperation, true, true);
        };

        this.clearUndo = function () {
            undomgr.clear();
        };

        this.enableUndo = function (enable) {
            undomgr.enable(enable);
        };

        this.undoAvailable = function () {
            return undomgr.undoAvailable();
        };

        this.undo = function (count) {
            undomgr.undo(count);
            setSelection(new OXOSelection(lastOperationEnd));
        };

        this.redoAvailable = function () {
            return undomgr.redoAvailable();
        };

        this.redo = function (count) {
            undomgr.redo(count);
            setSelection(new OXOSelection(lastOperationEnd));
        };

        /**
         * Returns whether the document contains any highlighted ranges.
         */
        this.hasHighlighting = function () {
            return highlightRanges.length > 0;
        };

        /**
         * Removes all highlighting (e.g. from quick-search) from the document.
         */
        this.removeHighlighting = function () {
            if (highlightRanges.length) {
                characterStyles.setAttributesInRanges(highlightRanges, { highlight: null }, { special: true });
                editdiv.removeClass('highlight');
            }
            highlightRanges = [];
        };

        /**
         * Searches and highlights the passed text in the entire document.
         *
         * @param {String} query
         *  The text that will be searched in the document.
         *
         * @returns {Boolean}
         *  Whether the passed text has been found in the document.
         */
        this.quickSearch = function (query) {

            // remove old highlighting
            this.removeHighlighting();

            // check input parameter
            if (!_.isString(query) || !query.length) {
                return false;
            }
            query = query.toLowerCase();

            // search in all paragraphs (TODO: other elements, e.g. headers, ...?)
            Utils.iterateSelectedDescendantNodes(editdiv, 'div.p', function (node) {

                var // the concatenated text from all text nodes
                    elementText = $(node).text().replace(/\s/g, ' ').toLowerCase(),
                    // all matching ranges of the query text in the element text
                    offsetRanges = [], offset = 0, index = 0;

                // find all occurrences of the query text in the element
                while ((offset = elementText.indexOf(query, offset)) >= 0) {
                    // try to merge with last offset range
                    if (offsetRanges.length && (_(offsetRanges).last().end >= offset)) {
                        _(offsetRanges).last().end = offset + query.length;
                    } else {
                        offsetRanges.push({ start: offset, end: offset + query.length });
                    }
                    // continue at next character (occurences of the query text may overlap)
                    offset += 1;
                }

                // translate offset ranges to DOM ranges
                offset = 0;
                index = 0;
                Utils.iterateDescendantTextNodes(node, function (textNode) {

                    var // do not declare in the for-loop header, this makes uglify.js very sad...
                        offsetRange = null;

                    // convert as many offset ranges as contained by the current text node
                    for (; index < offsetRanges.length; index += 1) {
                        offsetRange = offsetRanges[index];

                        // start point may have been converted in the previous text node
                        if ((offset <= offsetRange.start) && (offsetRange.start < offset + textNode.length)) {
                            highlightRanges.push(new DOM.Range.createRange(textNode, offsetRange.start - offset));
                        }

                        // try to convert end point (
                        if (offsetRange.end <= offset + textNode.length) {
                            _(highlightRanges).last().end = new DOM.Point(textNode, offsetRange.end - offset);
                        } else {
                            break; // escape from loop without updating 'index'
                        }
                    }

                    // escape if all offset ranges have been translated
                    if (index >= offsetRanges.length) { return Utils.BREAK; }

                    // update offset of next text node
                    offset += textNode.length;

                }, this);

                // exit at a certain number of found ranges (for performance)
                if (highlightRanges.length >= 100) {
                    return Utils.BREAK;
                }

            }, this);

            // set the highlighting
            if (highlightRanges.length) {
                editdiv.addClass('highlight');
                characterStyles.setAttributesInRanges(highlightRanges, { highlight: true }, { special: true });

                // make first highlighted text node visible
                DOM.iterateTextPortionsInRanges(highlightRanges, function (textNode) {
                    Utils.scrollToChildNode(editdiv.parent(), textNode.parentNode, { padding: 30 });
                    return Utils.BREAK;
                }, this);
            }

            // return whether any text in the document matches the passed query text
            return this.hasHighlighting();
        };

        this.deleteSelected = function (_selection) {

            // implCheckSelection();
            var buttonEvent = _selection ? false : true,
                selection = _selection || getSelection();

            if (selection.hasRange()) {

                undomgr.startGroup();

                selection.adjust();

                if (Position.isSameParagraph(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {
                    // Only one paragraph concerned from deletion.
                    this.deleteText(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition);

                } else if (Position.isSameParagraphLevel(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {
                    // More than one paragraph concerned from deletion, but in same level in document or table cell.
                    deleteSelectedInSameParagraphLevel(selection);

                } else if (Position.isCellSelection(selection.startPaM, selection.endPaM)) {
                    // This cell selection is a rectangle selection of cells in a table (only supported in Firefox).
                    deleteSelectedInCellSelection(selection);

                } else if (Position.isSameTableLevel(paragraphs, selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {
                    // This selection is inside a table in a browser, where no cell selection is possible (Chrome). Selected
                    // can be parts of paragraphs inside a cell and also all paragraphs in other cells. This selection is
                    // important to be able to support something similar like cell selection, that is only possible
                    // in Firefox. So changes made in Firefox tables are displayed correctly in Chrome and vice versa.
                    deleteSelectedInSameTableLevel(selection);

                } else {
                    // The included paragraphs are not neighbours. For example one paragraph top level and one in table.
                    // Should this be supported? How about tables in tables?
                    // This probably works not reliable for tables in tables.
                    deleteSelectedInDifferentParagraphLevels(selection);

                }

                undomgr.endGroup();
            }
            else if ((selection.endPaM.imageFloatMode !== null) && (buttonEvent)) {

                // deleting images without selection (only workaround until image selection with mouse is possible)
                // This deleting of images is only possible with the button, not with an key down event.
                deleteSelectedImage(selection);
            }
        };

        this.deleteText = function (startposition, endposition) {
            if (startposition !== endposition) {

                var _endPosition = _.copy(endposition, true);
                if (_endPosition[_endPosition.length - 1] > 0) {
                    _endPosition[_endPosition.length - 1] -= 1;  // switching from range mode to operation mode
                }

                var newOperation = { name: Operations.TEXT_DELETE, start: startposition, end: _endPosition };
                // var newOperation = { name: Operations.TEXT_DELETE, start: startposition, end: endposition };
                applyOperation(newOperation, true, true);
                // setting the cursor position
                setSelection(new OXOSelection(lastOperationEnd));
            }
        };

        this.deleteParagraph = function (position) {
            var newOperation = { name: Operations.PARA_DELETE, start: _.copy(position, true) };
            applyOperation(newOperation, true, true);
        };

        this.deleteTable = function (position) {
            var newOperation = { name: Operations.TABLE_DELETE, start: _.copy(position, true) };
            applyOperation(newOperation, true, true);

            // setting the cursor position
            setSelection(new OXOSelection(lastOperationEnd));
        };

        this.deleteCellRange = function (position, start, end) {
            var newOperation = { name: Operations.CELLRANGE_DELETE, position: _.copy(position, true), start: _.copy(start, true), end: _.copy(end, true) };
            applyOperation(newOperation, true, true);
        };

        this.deleteRows = function () {
            var selection = getSelection(),
                start = Position.getRowIndexInTable(paragraphs, selection.startPaM.oxoPosition),
                end = start,
                position = _.copy(selection.startPaM.oxoPosition, true);

            if (selection.hasRange()) {
                end = Position.getRowIndexInTable(paragraphs, selection.endPaM.oxoPosition);
            }

            var tablePos = Position.getLastPositionFromPositionByNodeName(paragraphs, position, 'table'),
                lastRow = Position.getLastRowIndexInTable(paragraphs, position),
                isCompleteTable = ((start === 0) && (end === lastRow)) ? true : false,
                newOperation;

            if (isCompleteTable) {
                newOperation = { name: Operations.TABLE_DELETE, start: _.copy(tablePos, true) };
            } else {
                newOperation = { name: Operations.ROWS_DELETE, position: tablePos, start: start, end: end };
            }

            applyOperation(newOperation, true, true);

            // setting the cursor position
            setSelection(new OXOSelection(lastOperationEnd));
        };

        this.deleteCells = function () {

            var selection = getSelection();

            selection.adjust();

            var isCellSelection = Position.isCellSelection(selection.startPaM, selection.endPaM),
                startPos = _.copy(selection.startPaM.oxoPosition, true),
                endPos = _.copy(selection.endPaM.oxoPosition, true);

            startPos.pop();  // removing character position and paragraph
            startPos.pop();
            endPos.pop();
            endPos.pop();

            var startCol = startPos.pop(),
                endCol = endPos.pop(),
                startRow = startPos.pop(),
                endRow = endPos.pop(),
                tablePos = _.copy(startPos, true);

            undomgr.startGroup();  // starting to group operations for undoing

            for (var i = endRow; i >= startRow; i--) {

                var rowPosition = _.copy(tablePos, true);
                rowPosition.push(i);

                var localStartCol = startCol,
                    localEndCol = endCol;

                if ((! isCellSelection) && (i < endRow) && (i > startCol))  {
                    // removing complete rows
                    localStartCol = 0;
                    localEndCol = Position.getLastColumnIndexInRow(paragraphs, rowPosition);
                }

                var newOperation = {name: Operations.CELLS_DELETE, position: rowPosition, start: localStartCol, end: localEndCol};
                applyOperation(newOperation, true, true);

                // removing empty row
                var rowNode = Position.getDOMPosition(paragraphs, rowPosition).node;
                if ($(rowNode).children().length === 0) {
                    newOperation = { name: Operations.ROWS_DELETE, position: _.copy(tablePos, true), start: i, end: i };
                    applyOperation(newOperation, true, true);
                }

                // checking if the table is empty
                var tableNode = Position.getDOMPosition(paragraphs, tablePos).node;
                if ($(tableNode).children('tbody, thead').children().length === 0) {
                    newOperation = { name: Operations.TABLE_DELETE, start: _.copy(tablePos, true) };
                    applyOperation(newOperation, true, true);
                }

            }

            undomgr.endGroup();

            // setting the cursor position
            setSelection(new OXOSelection(lastOperationEnd));
        };

        this.mergeCells = function () {

            var selection = getSelection();

            selection.adjust();

            var isCellSelection = Position.isCellSelection(selection.startPaM, selection.endPaM),
                startPos = _.copy(selection.startPaM.oxoPosition, true),
                endPos = _.copy(selection.endPaM.oxoPosition, true);

            startPos.pop();  // removing character position and paragraph
            startPos.pop();
            endPos.pop();
            endPos.pop();

            var startCol = startPos.pop(),
                endCol = endPos.pop(),
                startRow = startPos.pop(),
                endRow = endPos.pop(),
                tablePos = _.copy(startPos, true);

            if (endCol > startCol) {

                undomgr.startGroup();  // starting to group operations for undoing

                var endPosition = null;

                for (var i = endRow; i >= startRow; i--) {  // merging for each row

                    var rowPosition = _.copy(tablePos, true);
                    rowPosition.push(i);

                    var localStartCol = startCol,
                        localEndCol = endCol;

                    if ((! isCellSelection) && (i < endRow) && (i > startCol))  {
                        // merging complete rows
                        localStartCol = 0;
                        localEndCol = Position.getLastColumnIndexInRow(paragraphs, rowPosition);
                    }

                    var count = localEndCol - localStartCol,
                        cellPosition = _.copy(rowPosition, true);
                    cellPosition.push(localStartCol);
                    var newOperation = {name: Operations.CELL_MERGE, position: cellPosition, count: count};
                    applyOperation(newOperation, true, true);

                    endPosition = _.copy(cellPosition, true);
                }

                undomgr.endGroup();

                endPosition.push(0);
                endPosition.push(0);

                // setting the cursor position
                setSelection(new OXOSelection(new OXOPaM(endPosition)));
            }
        };

        this.insertCell = function () {

            var selection = getSelection();

            selection.adjust();

            var isCellSelection = Position.isCellSelection(selection.startPaM, selection.endPaM),
                startPos = _.copy(selection.startPaM.oxoPosition, true),
                endPos = _.copy(selection.endPaM.oxoPosition, true),
                count = 1;  // default, adding one cell in each row

            undomgr.startGroup();  // starting to group operations for undoing

            selection.adjust();

            startPos.pop();  // removing character position and paragraph
            startPos.pop();
            endPos.pop();
            endPos.pop();

            var startCol = startPos.pop(),
                endCol = endPos.pop(),
                startRow = startPos.pop(),
                endRow = endPos.pop(),
                tablePos = _.copy(startPos, true),
                endPosition = null,
                attrs = {};

            for (var i = endRow; i >= startRow; i--) {

                var rowPosition = _.copy(tablePos, true);
                rowPosition.push(i);

                var localEndCol = endCol;

                if ((! isCellSelection) && (i < endRow) && (i > startCol))  {
                    // removing complete rows
                    localEndCol = Position.getLastColumnIndexInRow(paragraphs, rowPosition);
                }

                localEndCol++;  // adding new cell behind existing cell
                var cellPosition = _.copy(rowPosition, true);
                cellPosition.push(localEndCol);
                attrs.gridspan = 1;  // only 1 grid for the new cell
                var newOperation = {name: Operations.CELL_INSERT, position: cellPosition, count: count, attrs: attrs};
                applyOperation(newOperation, true, true);

                // Applying new tablegrid, if the current tablegrid is not sufficient
                var tableDomPoint = Position.getDOMPosition(paragraphs, tablePos),
                    rowDomPoint = Position.getDOMPosition(paragraphs, rowPosition);

                if ((tableDomPoint) && (tableDomPoint.node) && (Utils.getNodeName(tableDomPoint.node) === 'table')) {

                    var tableGridCount = StyleSheets.getExplicitAttributes(tableDomPoint.node).tablegrid.length,
                        rowGridCount = Table.getColSpanSum($(rowDomPoint.node).children());

                    if (rowGridCount > tableGridCount) {

                        localEndCol--;  // behind is evaluated in getTableGridWithNewColumn
                        var insertmode = 'behind',
                            tablegrid = Table.getTableGridWithNewColumn(paragraphs, tablePos, localEndCol, insertmode);

                        // Setting new table grid attribute to table
                        newOperation = { name: Operations.ATTRS_SET, attrs: { 'tablegrid' : tablegrid }, start: _.copy(tablePos, true), end: _.copy(tablePos, true) };
                        applyOperation(newOperation, true, true);
                    }

                }

                endPosition = _.copy(cellPosition, true);
            }

            undomgr.endGroup();

            endPosition.push(0);
            endPosition.push(0);

            // setting the cursor position
            setSelection(new OXOSelection(new OXOPaM(endPosition)));
        };

        this.deleteColumns = function () {

            var selection = getSelection(),
                position = _.copy(selection.startPaM.oxoPosition, true),
                tablePos = Position.getLastPositionFromPositionByNodeName(paragraphs, position, 'table'),
                tableNode = Position.getDOMPosition(paragraphs, tablePos).node,
                maxGrid = $(tableNode).children('colgroup').children('col').length - 1,
                rowNode = Position.getLastNodeFromPositionByNodeName(paragraphs, position, 'tr'),
                startColIndex = Position.getColumnIndexInRow(paragraphs, selection.startPaM.oxoPosition),
                endColIndex = startColIndex,
                returnObj = Table.getGridPositionFromCellPosition(rowNode, startColIndex),
                startGrid = returnObj.start,
                endGrid = returnObj.end;

            if (selection.hasRange()) {
                endColIndex = Position.getColumnIndexInRow(paragraphs, selection.endPaM.oxoPosition);
                endGrid = Table.getGridPositionFromCellPosition(rowNode, endColIndex).end;
            }

            var isCompleteTable = ((startGrid === 0) && (endGrid === maxGrid)) ? true : false,
                newOperation;

            undomgr.enterGroup(function () {

                if (isCompleteTable) {
                    newOperation = { name: Operations.TABLE_DELETE, start: _.copy(tablePos, true) };
                    applyOperation(newOperation, true, true);
                } else {
                    newOperation = { name: Operations.COLUMNS_DELETE, position: tablePos, startgrid: startGrid, endgrid: endGrid };
                    applyOperation(newOperation, true, true);

                    // Checking, if there are empty rows
                    var maxRow = $(tableNode).children('tbody, thead').children().length - 1,
                        deletedAllRows = true;

                    for (var i = maxRow; i >= 0; i--) {
                        var rowPos = _.copy(tablePos, true);
                        rowPos.push(i);
                        var currentRowNode = Position.getDOMPosition(paragraphs, rowPos).node;

                        if ($(currentRowNode).children().length === 0) {
                            newOperation = {  name: Operations.ROWS_DELETE, position: _.copy(tablePos, true), start: i, end: i };
                            applyOperation(newOperation, true, true);
                        } else {
                            deletedAllRows = false;
                        }
                    }

                    // Checking, if now the complete table is empty
                    if (deletedAllRows) {
                        newOperation = { name: Operations.TABLE_DELETE, start: _.copy(tablePos, true) };
                        applyOperation(newOperation, true, true);
                    }

                    // Setting new table grid attribute to table
                    if (! deletedAllRows) {
                        var // StyleSheets.getExplicitAttributes() returns deep copy of the table attributes
                            tablegrid = StyleSheets.getExplicitAttributes(tableNode).tablegrid;
                        tablegrid.splice(startGrid, endGrid - startGrid + 1);  // removing column(s) in tablegrid (automatically updated in table node)
                        newOperation = { name: Operations.ATTRS_SET, attrs: { 'tablegrid' : tablegrid }, start: _.copy(tablePos, true), end: _.copy(tablePos, true) };
                        applyOperation(newOperation, true, true);
                    }

                }

            }); // undomgr.enterGroup();

            // setting the cursor position
            setSelection(new OXOSelection(lastOperationEnd));
        };

        this.insertRow = function () {
            var selection = getSelection(),
                // start = Position.getRowIndexInTable(paragraphs, selection.endPaM.oxoPosition),
                count = 1,  // inserting only one row
                insertdefaultcells = false,
                position = _.copy(selection.endPaM.oxoPosition, true);

            var rowPos = Position.getLastPositionFromPositionByNodeName(paragraphs, position, 'tr');

            if (rowPos !== null) {

                var referenceRow = rowPos[rowPos.length - 1];

                rowPos[rowPos.length - 1] += 1;

                var newOperation = { name: Operations.ROW_INSERT, position: rowPos, count: count, insertdefaultcells: insertdefaultcells, referencerow: referenceRow };
                applyOperation(newOperation, true, true);
            }

            // setting the cursor position
            setSelection(new OXOSelection(lastOperationEnd));
        };

        this.insertColumn = function () {
            var selection = getSelection(),
                cellPosition = Position.getColumnIndexInRow(paragraphs, selection.endPaM.oxoPosition),
                position = _.copy(selection.endPaM.oxoPosition, true),
                tablePos = Position.getLastPositionFromPositionByNodeName(paragraphs, position, 'table'),
                rowNode = Position.getLastNodeFromPositionByNodeName(paragraphs, position, 'tr'),
                insertmode = 'behind',
                gridPosition = Table.getGridPositionFromCellPosition(rowNode, cellPosition).start,
                tablegrid = Table.getTableGridWithNewColumn(paragraphs, tablePos, gridPosition, insertmode);


            undomgr.enterGroup(function () {

                var newOperation = { name: Operations.COLUMN_INSERT, position: tablePos, tablegrid: tablegrid, gridposition: gridPosition, insertmode: insertmode };
                applyOperation(newOperation, true, true);

                // Setting new table grid attribute to table
                newOperation = { name: Operations.ATTRS_SET, attrs: { 'tablegrid' : tablegrid }, start: _.copy(tablePos, true), end: _.copy(tablePos, true) };
                applyOperation(newOperation, true, true);

            }, this);

            // setting the cursor position
            setSelection(new OXOSelection(lastOperationEnd));
        };

        this.insertParagraph = function (position) {
            var newOperation = {name: Operations.PARA_INSERT, start: _.copy(position, true)};
            applyOperation(newOperation, true, true);
        };

        this.insertTable = function (size) {
            if (size) {

                undomgr.startGroup();  // necessary because of paragraph split

                var selection = getSelection(),
                    lastPos = selection.startPaM.oxoPosition.length - 1,
                    deleteTempParagraph = false;

                selection.adjust();
                if (selection.hasRange()) {
                    this.deleteSelected(selection);
                }

                var length = Position.getParagraphLength(paragraphs, selection.startPaM.oxoPosition);

                // Splitting paragraph, if the cursor is not at the beginning or at the end of the paragraph.
                if ((selection.startPaM.oxoPosition[lastPos] !== 0) &&
                    (selection.startPaM.oxoPosition[lastPos] !== length)) {
                    this.splitParagraph(selection.startPaM.oxoPosition);
                    selection.startPaM.oxoPosition[lastPos - 1] += 1;
                }

                // Splitting paragraph, if the cursor is at the end of an non empty paragraph and this paragraph is
                // the last from all .
                if ((selection.startPaM.oxoPosition[lastPos] !== 0) &&
                    (selection.startPaM.oxoPosition[lastPos] === length)) {

                    var maxIndex = Position.getCountOfAdjacentParagraphsAndTables(paragraphs, selection.startPaM.oxoPosition);
                    // Is this a position after the final character in the final paragraph?
                    // -> then the splitting of the paragraph is required, not only temporarely.
                    if ((selection.startPaM.oxoPosition[lastPos - 1]) === maxIndex) {
                        this.splitParagraph(selection.startPaM.oxoPosition);
                        selection.startPaM.oxoPosition[lastPos - 1] += 1;
                        deleteTempParagraph = false;
                    } else {
                        implSplitParagraph(selection.startPaM.oxoPosition);  // creating temporarely, to be deleted after table is inserted
                        selection.startPaM.oxoPosition[lastPos - 1] += 1;
                        deleteTempParagraph = true;
                    }
                }

                selection.startPaM.oxoPosition.pop();
                paragraphs = editdiv.children();

                var tableGrid = [],
                    width = 0;  // defaulting to 'auto'

                for (var i = 0; i < size.width; i++) {
                    tableGrid.push(Utils.roundDigits(1 / size.width, 2));
                }

                var newOperation = {name: Operations.TABLE_INSERT, position: _.copy(selection.startPaM.oxoPosition, true), attrs: {'tablegrid': tableGrid, 'width': width}};
                applyOperation(newOperation, true, true);

                paragraphs = editdiv.children();

                // adding rows
                var localPos = _.copy(selection.startPaM.oxoPosition, true);
                localPos.push(0);

                newOperation = {name: Operations.ROW_INSERT, position: localPos, count: size.height, insertdefaultcells: true};
                applyOperation(newOperation, true, true);

                if (deleteTempParagraph) {
                    selection.startPaM.oxoPosition[lastPos - 1] += 1;  // the position of the new temporary empty paragraph
                    implDeleteParagraph(selection.startPaM.oxoPosition);
                    paragraphs = editdiv.children();
                }

                // setting the cursor position
                setSelection(new OXOSelection(lastOperationEnd));

                undomgr.endGroup();  // necessary because of paragraph split
            }
        };

        this.insertImageFile = function (imageFragment) {
            var selection = getSelection(),
                newOperation = {
                    name: Operations.IMAGE_INSERT,
                    position: _.copy(selection.startPaM.oxoPosition),
                    imgurl: imageFragment
                };

            applyOperation(newOperation, true, true);

            sendImageSize(_.copy(selection.startPaM.oxoPosition));

            // setting the cursor position
            setSelection(new OXOSelection(lastOperationEnd));
        };

        this.insertImageURL = function (imageURL) {
            var selection = getSelection(),
                newOperation = {
                    name: Operations.IMAGE_INSERT,
                    position: _.copy(selection.startPaM.oxoPosition),
                    imgurl: imageURL
                };

            applyOperation(newOperation, true, true);

            sendImageSize(_.copy(selection.startPaM.oxoPosition));

            // setting the cursor position
            setSelection(new OXOSelection(lastOperationEnd));
        };

        this.splitParagraph = function (position) {
            var newOperation = {name: Operations.PARA_SPLIT, start: _.copy(position, true)};
            applyOperation(newOperation, true, true);
        };

        this.mergeParagraph = function (position) {

            var imageShift = null;

            undomgr.enterGroup(function () {

                var newOperation = {name: Operations.PARA_MERGE, start: _.copy(position)};
                applyOperation(newOperation, true, true);

                imageShift = moveFloatedImages(position);

            }, this);

            return imageShift;
        };

        this.insertText = function (text, position) {
            var newOperation = { name: Operations.TEXT_INSERT, text: text, start: _.copy(position, true) };
            applyOperation(newOperation, true, true);
        };

        // style sheets and formatting attributes -----------------------------

        /**
         * Returns the style sheet container for the specified attribute
         * family.
         *
         * @param {String} family
         *  The name of the attribute family.
         */
        this.getStyleSheets = function (family) {
            return documentStyles.getStyleSheets(family);
        };

        /**
         * Returns the themes container.
         */
        this.getThemes = function () {
            return documentStyles.getThemes();
        };

        /**
         * Returns the lists container.
         */
        this.getLists = function () {
            return documentStyles.getLists();
        };

        /**
         * Returns the values of all formatting attributes of the specified
         * attribute family in the current selection.
         *
         * @param {String} family
         *  The name of the attribute family containing all attributes that
         *  will be collected and returned.
         *
         * @returns {Object}
         *  A map of paragraph attribute name/value pairs.
         */
        this.getAttributes = function (family) {
            var styleSheets = this.getStyleSheets(family),
                ranges = DOM.getBrowserSelection(editdiv);
            return styleSheets ? styleSheets.getAttributesInRanges(ranges) : {};
        };

        /**
         * Changes a single attribute of the specified attribute family in the
         * current selection.
         *
         * @param {String} family
         *  The name of the attribute family containing the specified
         *  attribute.
         */
        this.setAttribute = function (family, name, value) {
            this.setAttributes(family, Utils.makeSimpleObject(name, value));
        };

        /**
         * Changes multiple attributes of the specified attribute family in the
         * current selection.
         *
         * @param {String} family
         *  The name of the attribute family containing the passed attributes.
         */
        this.setAttributes = function (family, attributes) {

            var // whether undo is enabled
                createUndo = undomgr.isEnabled();

            // Create an undo group that collects all undo operations generated
            // in the local setAttributes() method (it calls itself recursively
            // with smaller parts of the current selection).
            if (createUndo) { undomgr.startGroup(); }
            setAttributes(family, attributes);
            if (createUndo) { undomgr.endGroup(); }
        };

        this.getParagraphCount = function () {
            return paragraphs.size();
        };

        this.prepareNewParagraph = function (paragraph) {
            // insert an empty <span> with a text node, followed by a dummy <br>
            $(paragraph).append($('<span>').text(''), $('<br>').data('dummy', true));
        };

        this.setEditMode = function (state) {
            var showReadOnlyInfo = ox.online && state === false && editMode !== false,
                showEditModeInfo = ox.online && state === true && editMode === false;

            editMode = state;
            editdiv.toggleClass('user-select-text', !!editMode).attr('contenteditable', !!editMode);

            // disable resize handlers etc. everytime the edit mode has been enabled
            if (editMode) {
                // disable FireFox table manipulation handlers in edit mode
                // (the commands must be executed after the editable div is in the DOM)
                try {
                    document.execCommand('enableObjectResizing', false, false);
                    document.execCommand('enableInlineTableEditing', false, false);
                } catch (ex) {
                }

                // disable IE table manipulation handlers in edit mode
                Utils.getDomNode(editdiv).onresizestart = function () { return false; };
            }

            if (showReadOnlyInfo) {
                Alert.showWarning(gt('Read Only Mode'),
                        gt('Another user is currently editing this document.'),
                        editdiv.parent(),
                        -1,
                        {label: gt('Acquire Edit Rights'), key: 'file/editrights', controller: app.getController()}
                    );
            } else if (showEditModeInfo) {
                Alert.showSuccess(gt('Edit Mode'), gt('You have edit rights.'), editdiv.parent(), 5000);
            }
        };

        this.isEditMode = function () {
            return editMode;
        };

        /**
         * Returns whether the current selection selects any text.
         */
        this.isTextSelected = function () {
            return selectedObjects.length === 0;
        };

        // PUBLIC TABLE METHODS

        this.isPositionInTable = function () {

            var selection = getSelection(),
                position = null;

            if (selection) {
                position = selection.endPaM.oxoPosition;
            } else {
                return false;
            }

            return Position.isPositionInTable(paragraphs, position);
        };

        // PUBLIC OBJECT METHODS

        /**
         * Returns whether the current selection selects one or more objects.
         */
        this.isObjectSelected = function () {
            return selectedObjects.length > 0;
        };

        /**
         * Returns whether the current selection selects one or more image
         * objects. Returns also true, if the object selection contains other
         * objects too.
         */
        this.isImageSelected = function () {
            return _(selectedObjects.get()).any(function (object) { return DOM.isImageNode(object); });
        };

        /**
         * Returns whether the current selection selects a single image.
         */
        this.getImageFloatMode = function () {
            var selection = getSelection();
            return selection ? selection.endPaM.imageFloatMode : null;
        };

        // ==================================================================
        // END of Editor API
        // ==================================================================

        // ====================================================================
        // Private functions for the hybrid edit mode
        // ====================================================================

        function processFocus(state) {
            if (focused !== state) {
                focused = state;
                if (focused && currentSelection) {
                    // Update Browser Selection, might got lost.
                    setSelection(currentSelection);
                }
                self.trigger('focus', state);
            }
        }

        function processMouseDown(event) {

            var // mouse click on an object node
                object = $(event.target).closest('div.object');

            // click on object node: set browser selection to object node, draw selection
            if ((object.length > 0) && (editdiv[0].contains(object[0]))) {
                // prevent default click handling of the browser
                event.preventDefault();
                // but set focus to the document container (may be loacted in GUI edit fields)
                self.grabFocus();
                // select single objects only (multi selection not supported yet)
                selectObjects(object, false);
            } else {
                deselectAllObjects();
            }

            // calculate logical selection from browser selection
            updateSelection();
        }

        function processMouseUp() {
            updateSelection();
        }

        /**
         * Deselects all selected object nodes and destroys the browser
         * selection that represents the selected objects.
         */
        function deselectAllObjects() {
            // remove the selection boxes
            DOM.clearObjectSelection(selectedObjects);
            // clear collection of selected objects
            selectedObjects = $();
        }

        /**
         * Selects the specified object node and updates the browser selection
         * that represents the selected objects.
         *
         * @param {HTMLElement|jQuery} objectNode
         *  The root node of the object to be selected. If the passed value is
         *  a jQuery collection, all contained objects will be selected.
         */
        function selectObjects(objects, extend) {

            var // the browser sleection representing all selected ojects
                browserSelection = [];

            // remove old object selection, unless selection will be extended
            if (extend !== true) {
                deselectAllObjects();
            }

            // collect selected objects
            selectedObjects = selectedObjects.add(objects);
            // draw the selection box into the passed objects
            DOM.drawObjectSelection(objects, { moveable: false, sizeable: false });

            // build browser selection from objects
            selectedObjects.each(function () {
                browserSelection.push(new DOM.Range(DOM.Point.createPointForNode(this)));
            });
            DOM.setBrowserSelection(browserSelection);
        }

        function processKeyDown(event) {

            implDbgOutEvent(event);

            if (((event.keyCode === KeyCodes.LEFT_ARROW) || (event.keyCode === KeyCodes.UP_ARROW)) && (event.shiftKey)) {
                // Do absolutely nothing for cursor navigation keys with pressed shift key.
                // Do nothing in processKeyDown and not in the following processKeyPressed.
                // Use lastKeyDownEvent, because some browsers (eg Chrome) change keyCode to become the charCode in keyPressed.
                lastKeyDownEvent = event;
                return;
            }

            // TODO: How to strip away debug code?
            if (event.keyCode && event.shiftKey && event.ctrlKey && event.altKey) {
                var c = getPrintableChar(event);
                if (c === 'P') {
                    alert('#Paragraphs: ' + paragraphs.length);
                }
                else if (c === 'I') {
                    self.insertParagraph([paragraphs.length]);
                }
                else if (c === 'D') {
                    self.initDocument();
                    self.grabFocus(true);
                }
                else if (c === 'T') {
                    self.insertTable({width: 2, height: 4});
                }
                else if (c === 'C') {
                    self.deleteCells();
                }
                else if (c === 'M') {
                    self.mergeCells();
                }
                else if (c === 'N') {
                    self.insertCell();
                }
                else if (c === 'G') {
                    var selection = getSelection();
                    var newOperation = {name: Operations.IMAGE_INSERT, position: _.copy(selection.startPaM.oxoPosition), imgurl: 'Pictures/10000000000000500000005076371D39.jpg', attrs: {anchortype: 'AsCharacter', inline: true}};
                    applyOperation(newOperation, true, true);
                }
                else if (c === 'R') {
                    var selection = getSelection();
                    var newOperation = {name: Operations.IMAGE_INSERT, position: _.copy(selection.startPaM.oxoPosition), imgurl: 'Pictures/10000000000000500000005076371D39.jpg', attrs: {anchortype: 'ToParagraph', top: '50px', left: '100px', inline: false}};
                    applyOperation(newOperation, true, true);
                }
                else if (c === 'S') {
                    var selection = getSelection();
                    var newOperation = {name: Operations.IMAGE_INSERT, position: _.copy(selection.startPaM.oxoPosition), imgurl: 'Pictures/10000000000000500000005076371D39.jpg', attrs: {anchortype: 'ToCharacter', top: '50px', left: '100px', inline: false}};
                    applyOperation(newOperation, true, true);
                }
                else if (c === 'V') {
                    var selection = getSelection();
                    var newOperation = {name: Operations.IMAGE_INSERT, position: _.copy(selection.startPaM.oxoPosition), imgurl: 'Pictures/10000000000000500000005076371D39.jpg', attrs: {anchortype: 'ToPage', top: '50px', left: '100px', inline: false}};
                    applyOperation(newOperation, true, true);
                }
                else if (c === 'F') {
                    var selection = getSelection();
                    // {'type':' DATE \\* MERGEFORMAT ','name':'insertField','position':[0,24],'representation':'05.09.2012'}
                    var newOperation = {name: Operations.FIELD_INSERT, position: _.copy(selection.startPaM.oxoPosition), type: ' DATE \\* MERGEFORMAT ', representation: '07.09.2012'};
                    applyOperation(newOperation, true, true);
                }
                else if (c === '1') {
                    dbgoutEvents = !dbgoutEvents;
                    Utils.log('dbgoutEvents is now ' + dbgoutEvents);
                }
                else if (c === '2') {
                    dbgoutObjects = !dbgoutObjects;
                    Utils.log('dbgoutObjects is now ' + dbgoutObjects);
                }
                else if (c === '3') {
                    Utils.MIN_LOG_LEVEL = Utils.MIN_LOG_LEVEL ? undefined : 'log';
                    window.console.log('logging is now ' + (Utils.MIN_LOG_LEVEL ? 'on' : 'off'));
                }
                else if (c === '4') {
                    blockOperationNotifications = !blockOperationNotifications;
                    Utils.log('block operation notifications is now ' + blockOperationNotifications);
                }
            }

            var selection = getSelection();

            lastKeyDownEvent = event;   // for some keys we only get keyDown, not keyPressed!
            updateSelection();

            if (event.keyCode === KeyCodes.DELETE) {
                var imageShift = 0;
                selection.adjust();
                if (selection.hasRange()) {
                    self.deleteSelected(selection);
                }
                else {
                    var lastValue = selection.startPaM.oxoPosition.length - 1;
                    var startPosition = selection.startPaM.oxoPosition;
                    var paraLen = Position.getParagraphLength(paragraphs, startPosition);

                    if (startPosition[lastValue] < paraLen) {
                        var localPos = _.copy(selection.startPaM.oxoPosition, true),
                            minDeletePos = 0,
                            domPos;

                        // Getting the first position, that is not a floated image,
                        // because DELETE has to ignore floated images.
                        localPos.pop();
                        domPos = Position.getDOMPosition(paragraphs, localPos);

                        if (domPos) {
                            minDeletePos = Position.getNumberOfFloatedImagesInParagraph(domPos.node);
                        }

                        if (selection.startPaM.oxoPosition[lastValue] < minDeletePos) {
                            selection.startPaM.oxoPosition[lastValue] = minDeletePos;
                            selection.endPaM.oxoPosition[lastValue] = minDeletePos;
                        }

                        selection.endPaM.oxoPosition[lastValue]++;
                        self.deleteText(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition);
                    }
                    else {
                        var mergeselection = _.copy(selection.startPaM.oxoPosition),
                            characterPos = mergeselection.pop();

                        var nextParagraphPosition = _.copy(mergeselection),
                            lastValue = nextParagraphPosition.length - 1;

                        nextParagraphPosition[lastValue] += 1;

                        var domPos = Position.getDOMPosition(paragraphs, nextParagraphPosition),
                            nextIsTable = false,
                            isLastParagraph = false;

                        if (domPos) {
                            if ($(domPos.node).is('table')) {
                                nextIsTable = true;
                            }
                        } else {
                            nextParagraphPosition[lastValue] -= 1;
                            isLastParagraph = true;
                        }

                        imageShift = self.mergeParagraph(mergeselection);

                        if (nextIsTable) {
                            if (characterPos === 0) {
                                // removing empty paragraph
                                var localPos = _.copy(selection.startPaM.oxoPosition, true);
                                localPos.pop();
                                self.deleteParagraph(localPos);
                                nextParagraphPosition[lastValue] -= 1;
                            }
                            selection.startPaM.oxoPosition = Position.getFirstPositionInParagraph(paragraphs, nextParagraphPosition);
                        } else if (isLastParagraph) {
                            if (Position.isPositionInTable(paragraphs, nextParagraphPosition)) {
                                var returnObj = Position.getFirstPositionInNextCell(paragraphs, nextParagraphPosition);
                                selection.startPaM.oxoPosition = returnObj.position;
                                var endOfTable = returnObj.endOfTable;
                                if (endOfTable) {
                                    var lastVal = selection.startPaM.oxoPosition.length - 1;
                                    selection.startPaM.oxoPosition[lastVal] += 1;
                                    selection.startPaM.oxoPosition = Position.getFirstPositionInParagraph(paragraphs, selection.startPaM.oxoPosition);
                                }
                            }
                        }
                    }
                }

                if (imageShift > 0) {
                    selection.startPaM.oxoPosition[selection.startPaM.oxoPosition.length - 1] += imageShift;
                }
                selection.endPaM = _.copy(selection.startPaM, true);
                event.preventDefault();
                setSelection(selection);
            }
            else if (event.keyCode === KeyCodes.BACKSPACE) {
                var backspacePos = 0,
                    paragraphsMerged = false;

                selection.adjust();
                if (selection.hasRange()) {
                    self.deleteSelected(selection);
                }
                else {
                    var lastValue = selection.startPaM.oxoPosition.length - 1,
                        localPos = _.copy(selection.startPaM.oxoPosition, true);

                    localPos.pop();
                    // Getting the first position, that is not a floated image,
                    // because BACKSPACE has to ignore floated images.
                    var domPos = Position.getDOMPosition(paragraphs, localPos);

                    if (domPos) {
                        backspacePos = Position.getNumberOfFloatedImagesInParagraph(domPos.node);
                    }

                    if (selection.startPaM.oxoPosition[lastValue] > backspacePos) {
                        var startPosition = _.copy(selection.startPaM.oxoPosition, true);
                        var endPosition = _.copy(selection.startPaM.oxoPosition, true);
                        startPosition[lastValue] -= 1;
                        self.deleteText(startPosition, endPosition);
                        selection.startPaM.oxoPosition[lastValue] -= 1;
                    }
                    else if (selection.startPaM.oxoPosition[lastValue - 1] >= 0) {
                        var startPosition = _.copy(selection.startPaM.oxoPosition, true);

                        if (! _(startPosition).all(function (value) { return (value === 0); })) {

                            startPosition[lastValue - 1] -= 1;
                            startPosition.pop();

                            var length = Position.getParagraphLength(paragraphs, startPosition),
                                domPos = Position.getDOMPosition(paragraphs, startPosition),
                                prevIsTable = false;

                            if (domPos) {
                                if ($(Position.getDOMPosition(paragraphs, startPosition).node).is('table')) {
                                    prevIsTable = true;
                                }
                            }

                            if (startPosition[lastValue - 1] >= 0) {
                                if (! prevIsTable) {
                                    self.mergeParagraph(startPosition);
                                    paragraphsMerged = true;
                                }
                                selection.startPaM.oxoPosition[lastValue - 1] -= 1;
                                selection.startPaM.oxoPosition.pop();
                            }

                            if (prevIsTable) {
                                selection.startPaM.oxoPosition = Position.getLastPositionInParagraph(paragraphs, selection.startPaM.oxoPosition);
                            } else {
                                var isFirstPosition = (startPosition[lastValue - 1] < 0) ? true : false;
                                if (isFirstPosition) {
                                    if (Position.isPositionInTable(paragraphs, startPosition)) {
                                        var returnObj = Position.getLastPositionInPrevCell(paragraphs, startPosition);
                                        selection.startPaM.oxoPosition = returnObj.position;
                                        var beginOfTable = returnObj.beginOfTable;
                                        if (beginOfTable) {
                                            var lastVal = selection.startPaM.oxoPosition.length - 1;
                                            selection.startPaM.oxoPosition[lastVal] -= 1;
                                            selection.startPaM.oxoPosition = Position.getLastPositionInParagraph(paragraphs, selection.startPaM.oxoPosition);
                                        }
                                    } else {
                                        selection.startPaM.oxoPosition.push(length);
                                    }
                                } else {
                                    selection.startPaM.oxoPosition.push(length);
                                }
                            }
                        }
                    }
                }

                if ((backspacePos > 0) && (paragraphsMerged)) {
                    selection.startPaM.oxoPosition[selection.startPaM.oxoPosition.length - 1] += backspacePos;
                }

                selection.endPaM = _.copy(selection.startPaM, true);
                event.preventDefault();
                setSelection(selection);
            }
            else if (event.ctrlKey) {
                var c = getPrintableChar(event);
                if (c === 'A') {
                    var startPaM = new OXOPaM([0]),
                        endPaM = new OXOPaM(Position.getLastPositionInDocument(paragraphs));

                    selection = new OXOSelection(startPaM, endPaM);

                    event.preventDefault();

                    setSelection(selection);
                }
                else if (c === 'Z') {
                    event.preventDefault();
                    self.undo();
                }
                else if (c === 'Y') {
                    event.preventDefault();
                    self.redo();
                }
                else if (c === 'X') {
                    event.preventDefault();
                    self.cut();
                }
                else if (c === 'C') {
                    event.preventDefault();
                    self.copy();
                }
                else if (c === 'V') {
                    event.preventDefault();
                    self.paste();
                }
                else if (c === 'B') {
                    event.preventDefault();
                    self.setAttribute('character', 'bold', !self.getAttributes('character').bold);
                }
                else if (c === 'I') {
                    event.preventDefault();
                    self.setAttribute('character', 'italic', !self.getAttributes('character').italic);
                }
                else if (c === 'U') {
                    event.preventDefault();
                    self.setAttribute('character', 'underline', !self.getAttributes('character').underline);
                }
                else if (c === 'xxxxxxx') {
                    event.preventDefault();
                }
            }
            // DEBUG STUFF
            if (self.getParagraphCount() !== editdiv.children().size()) {
                Utils.warn('Editor.processKeyDown(): paragraph count invalid!');
            }
        }

        function processKeyPressed(event) {

            implDbgOutEvent(event);

            updateSelection();

            if (((event.keyCode === KeyCodes.LEFT_ARROW) || (event.keyCode === KeyCodes.UP_ARROW)) && (event.shiftKey)) {
                // Do absolutely nothing for cursor navigation keys with pressed shift key.
                return;
            }

            if (isNavigationKeyEvent(lastKeyDownEvent)) {
                // Don't block cursor navigation keys.
                // Use lastKeyDownEvent, because some browsers (eg Chrome) change keyCode to become the charCode in keyPressed.
                // Some adjustments in getSelection/setSelection are also necessary for cursor navigation keys. Therefore this
                // 'return' must be behind getSelection() .
                return;
            }

            var selection = getSelection();
            if (selection) {
                selection.adjust();
            }

            /*
            Utils.log('processKeyPressed: keyCode: ' + event.keyCode + ' isNavi: ' + isNavigationKeyEvent(event));
            if (isNavigationKeyEvent(event)) {
                return;
            }
            */

            var c = getPrintableChar(event);

            // TODO
            // For now (the prototype), only accept single chars, but let the browser process, so we don't need to care about DOM stuff
            // TODO: But we at least need to check if there is a selection!!!

            if ((!event.ctrlKey) && (c.length === 1)) {

                self.deleteSelected(selection);
                // Selection was adjusted, so we need to use start, not end
                self.insertText(c, selection.startPaM.oxoPosition);
                var lastValue = selection.startPaM.oxoPosition.length - 1;
                selection.startPaM.oxoPosition[lastValue]++;
                selection.endPaM = _.copy(selection.startPaM, true);
                event.preventDefault();
                setSelection(selection);
            }
            else if (c.length > 1) {
                // TODO?
                event.preventDefault();
            }
            else {

                if (event.keyCode === KeyCodes.ENTER) {

                    self.deleteSelected(selection);
                    var startPosition = _.copy(selection.startPaM.oxoPosition, true),
                        lastValue = selection.startPaM.oxoPosition.length - 1;

                    if ((lastValue >= 4) &&
                        (Position.isPositionInTable(paragraphs, [0])) &&
                        _(startPosition).all(function (value) { return (value === 0); })) {
                        self.insertParagraph([0]);
                        paragraphs = editdiv.children();
                        selection.startPaM.oxoPosition = [0, 0];
                    } else {
                        self.splitParagraph(startPosition);
                        // TODO / TBD: Should all API / Operation calls return the new position?!
                        var lastValue = selection.startPaM.oxoPosition.length - 1;
                        selection.startPaM.oxoPosition[lastValue - 1] += 1;
                        selection.startPaM.oxoPosition[lastValue] = 0;
                    }
                    selection.endPaM = _.copy(selection.startPaM, true);
                    event.preventDefault();
                    setSelection(selection);
                }
            }

            // Block everything else to be on the save side....
            event.preventDefault();

            // DEBUG STUFF
            if (self.getParagraphCount() !== editdiv.children().size()) {
                Utils.warn('Editor.processKeyPressed(): paragraph count invalid!');
            }

        }

        // ==================================================================
        // Private functions
        // ==================================================================

        /**
         * Returns the current document URL that will be used to access the
         * source document in the database.
         *
         * @param {Object} [options]
         *  Additional options that affect the creation of the URL. Each option
         *  will be inserted into the URL as name/value pair separated by an
         *  equality sign. The different options are separated by ampersand
         *  characters.
         */
        function getDocumentUrl(options) {
            // do not cache the URL, it may change during runtime (versions etc)
            return app.getDocumentFilterUrl('getfile', options);
        }

        function getPrintableChar(event) {
            // event.char preferred. DL2, but nyi in most browsers:(
            if (event.char) {
                return String.fromCharCode(event.char);
            }
            // event.which deprecated, but seems to work well
            if (event.which && (event.which >= 32) /* && (event.which <= 255)*/) {
                return String.fromCharCode(event.which);
            }
            // TODO: Need to handle other cases - later...
            return '';
        }

        function updateSelection() {
            window.setTimeout(function () {
                currentSelection = getSelection(true);
                if (currentSelection) {
                    self.trigger('selection', currentSelection);
                } else if (focused && editMode) {
                    // if not focused, browser selection might not be available...
                    Utils.warn('Editor.updateSelection(): missing selection!');
                }
            }, 0);
        }

        /**
         * Returns true, if the passed keyboard event is a navigation event (cursor
         * traveling etc.) and will be passed directly to the browser.
         *
         * @param event
         *  A jQuery keyboard event object.
         */
        function isNavigationKeyEvent(event) {
            return event && NAVIGATION_KEYS.contains(event.keyCode);
        }

        /**
         * Selects the specified object node.
         *
         * @param {HTMLElement|jQuery} objectNode
         *  The root node of the object to be selected. If the passed value is
         *  a jQuery collection, uses the first DOM node it contains.
         */
        function selectObject(objectNode) {

            // draw the object selection box
            DOM.addObjectSelection(objectNode, { moveable: false, sizeable: false });

            // set the browser selection
            DOM.setBrowserSelection(DOM.Range.createRangeForNode(objectNode));
        }

        operationHandlers[Operations.INIT_DOCUMENT] = function (operation) {
            implInitDocument();
        };

        operationHandlers[Operations.TEXT_INSERT] = function (operation) {
            if (undomgr.isEnabled()) {
                var endPos = _.clone(operation.start, true);
                endPos[endPos.length - 1] += operation.text.length;
                endPos[endPos.length - 1] -= 1;    // switching from range mode to operation mode
                var undoOperation = { name: Operations.TEXT_DELETE, start: operation.start, end: endPos };
                undomgr.addUndo(undoOperation, operation);
            }
            implInsertText(operation.text, operation.start);
        };

/*
        operationHandlers[Operations.DELETE] = function (operation) { // this shall be the only delete operation
            if (undomgr.isEnabled()) {
                var localStart = _.copy(operation.start, true),
                    localEnd = _.copy(operation.end, true),
                    startLastVal = localStart.pop(),
                    endLastVal = localEnd.pop(),
                    undoOperation = { name: Operations.TEXT_INSERT, start: operation.start, text: Position.getParagraphText(paragraphs, localStart, startLastVal, endLastVal) };
                undomgr.addUndo(undoOperation, operation);
            }
            implDelete(operation.start, operation.end);
        };
*/

        operationHandlers[Operations.MOVE] = function (operation) {
            if (undomgr.isEnabled()) {
                var undoOperation = { name: Operations.MOVE, start: operation.end, end: operation.start };
                undomgr.addUndo(undoOperation, operation);
            }
            implMove(operation.start, operation.end);
        };

        operationHandlers[Operations.TEXT_DELETE] = function (operation) {
            if (undomgr.isEnabled()) {
                var localStart = _.clone(operation.start),
                    localEnd = _.clone(operation.end),
                    startLastVal = localStart.pop(),
                    endLastVal = localEnd.pop() + 1, // switching operation mode from TEXT_DELETE
                    undoOperation = { name: Operations.TEXT_INSERT, start: operation.start, text: Position.getParagraphText(paragraphs, localStart, startLastVal, endLastVal) };
                undomgr.addUndo(undoOperation, operation);
            }
            implDeleteText(operation.start, operation.end);
        };

        operationHandlers[Operations.INSERT_STYLE] = function (operation) {
            if (undomgr.isEnabled()) {
                // TODO!!!
            }
            implInsertStyleSheet(operation.type, operation.styleid, operation.stylename, operation.parent, operation.attrs, operation.hidden, operation.uipriority, operation['default'], operation.pooldefault);
        };

        operationHandlers[Operations.INSERT_THEME] = function (operation) {
            if (undomgr.isEnabled()) {
                // TODO!!!
            }
            implInsertTheme(operation.themename, operation.attrs);
        };

        operationHandlers[Operations.INSERT_LIST] = function (operation) {
            if (undomgr.isEnabled()) {
                // TODO!!!
            }
            implInsertList(operation.listName, operation.listDefinition);
        };

        operationHandlers[Operations.ATTRS_SET] = function (operation) {
            // undo/redo is done inside implSetAttributes()
            implSetAttributes(operation.start, operation.end, operation.attrs);
        };

        operationHandlers[Operations.PARA_INSERT] = function (operation) {
            if (undomgr.isEnabled()) {
                var undoOperation = { name: Operations.PARA_DELETE, start: operation.start };
                undomgr.addUndo(undoOperation, operation);
            }
            implInsertParagraph(operation.start);
            if (operation.text) {
                var startPos = _.copy(operation.start, true);
                startPos.push(0);
                implInsertText(operation.text, startPos);
            }
        };

        operationHandlers[Operations.PARA_DELETE] = function (operation) {
            if (undomgr.isEnabled()) {
                var undoOperation = { name: Operations.PARA_INSERT, start: operation.start, text: Position.getParagraphText(paragraphs, operation.start) };
                undomgr.addUndo(undoOperation, operation);
            }
            implDeleteParagraph(operation.start);
        };

        operationHandlers[Operations.TABLE_INSERT] = function (operation) {
            if (undomgr.isEnabled()) {
                var undoOperation = { name: Operations.TABLE_DELETE, start: operation.position };
                undomgr.addUndo(undoOperation, operation);
            }
            implInsertTable(operation.position, operation.attrs);
        };

        operationHandlers[Operations.TABLE_DELETE] = function (operation) {
            var table = Position.getTableElement(paragraphs, operation.start);
            if (table) {
                if (undomgr.isEnabled()) {
                    // generate undo operations for the entire table
                    var generator = new Operations.Generator();
                    generator.generateTableOperations(table, operation.start);
                    undomgr.addUndo(generator.getOperations(), operation);
                }
                implDeleteTable(operation.start);
            }
        };

        operationHandlers[Operations.CELLRANGE_DELETE] = function (operation) {
            implDeleteCellRange(operation.position, operation.start, operation.end);
        };

        operationHandlers[Operations.CELLS_DELETE] = function (operation) {
            var tableRow = Position.getTableRowElement(paragraphs, operation.position);
            if (tableRow) {
                if (undomgr.isEnabled()) {
                    var cells = $(tableRow).children(),
                        start = operation.start,
                        end = operation.end || start,
                        generator = new Operations.Generator();

                    if ((start <= 0) && (end + 1 >= cells.length)) {
                        // deleting the entire row element
                        generator.generateTableRowOperations(tableRow, operation.position);
                    } else {
                        // deleting a few cells in the row
                        cells.slice(start, end + 1).each(function (index) {
                            generator.generateTableCellOperations(this, operation.position.concat([start + index]));
                        });
                    }
                    undomgr.addUndo(generator.getOperations(), operation);
                }
                implDeleteCells(operation.position, operation.start, operation.end);
            }
        };

        operationHandlers[Operations.ROWS_DELETE] = function (operation) {
            if (undomgr.isEnabled()) {
                var start = operation.start,
                    end = operation.end || start,
                    generator = new Operations.Generator();

                for (var i = start; i <= end; i += 1) {
                    var localPos = operation.position.concat([i]),
                        tableRow = Position.getTableRowElement(paragraphs, localPos);
                    if (tableRow) {
                        generator.generateTableRowOperations(tableRow, localPos);
                    }
                }
                undomgr.addUndo(generator.getOperations(), operation);
            }
            implDeleteRows(operation.position, operation.start, operation.end);
        };

        operationHandlers[Operations.COLUMNS_DELETE] = function (operation) {
            var table = Position.getTableElement(paragraphs, operation.position);
            if (table) {
                if (undomgr.isEnabled()) {

                    var allRows = $(table).find('> tbody > tr'),
                        allCellRemovePositions = Table.getAllRemovePositions(allRows, operation.startgrid, operation.endgrid),
                        generator = new Operations.Generator();

                    allRows.each(function (index) {

                        var rowPos = operation.position.concat([index]),
                            cells = $(this).children(),
                            oneRowCellArray =  allCellRemovePositions[index],
                            end = oneRowCellArray.pop(),
                            start = oneRowCellArray.pop();  // more than one cell might be deleted in a row

                        // start<0: no cell will be removed in this row
                        if (start >= 0) {

                            if (end < 0) {
                                // remove all cells until end of row
                                end = cells.length;
                            } else {
                                // closed range to half-open range
                                end = Math.min(end + 1, cells.length);
                            }

                            // generate operations for all covered cells
                            cells.slice(start, end).each(function (index) {
                                generator.generateTableCellOperations(this, rowPos.concat([start + index]));
                            });
                        }
                    });
                    undomgr.addUndo(generator.getOperations(), operation);
                }
                implDeleteColumns(operation.position, operation.startgrid, operation.endgrid);
            }
        };

        operationHandlers[Operations.CELL_MERGE] = function (operation) {
            if (undomgr.isEnabled()) {
                var content = null,
                    gridspan = null,
                    undoOperation = { name: Operations.CELL_SPLIT, position: operation.position, content: content, gridspan: gridspan };
                undomgr.addUndo(undoOperation, operation);
            }
            implMergeCell(_.copy(operation.position, true), operation.count);
        };

        operationHandlers[Operations.CELL_INSERT] = function (operation) {
            if (undomgr.isEnabled()) {
                var pos = _.copy(operation.position, true),
                    start = pos.pop(),
                    count = operation.count || 1,
                    end = start + count - 1,
                    undoOperation = { name: Operations.CELLS_DELETE, position: pos, start: start, end: end };
                undomgr.addUndo(undoOperation, operation);
            }
            implInsertCell(_.copy(operation.position, true), operation.count, operation.attrs);
        };

        operationHandlers[Operations.ROW_INSERT] = function (operation) {
            if (undomgr.isEnabled()) {
                var pos = _.copy(operation.position, true),
                    start = pos.pop(),
                    end = start,
                    undoOperation = { name: Operations.ROWS_DELETE, position: pos, start: start, end: end };
                undomgr.addUndo(undoOperation, operation);
            }
            implInsertRow(operation.position, operation.count, operation.insertdefaultcells, operation.referencerow, operation.attrs);
        };

        operationHandlers[Operations.COLUMN_INSERT] = function (operation) {
            if (undomgr.isEnabled()) {
                undomgr.startGroup();
                // COLUMNS_DELETE cannot be the answer to COLUMN_INSERT, because the cells of the new column may be inserted
                // at very different grid positions. It is only possible to remove the new cells with deleteCells operation.
                var localPos = _.copy(operation.position, true),
                    table = Position.getDOMPosition(paragraphs, localPos).node,  // -> this is already the new grid with the new column!
                    allRows = $(table).children('tbody, thead').children(),
                    allCellInsertPositions = Table.getAllInsertPositions(allRows, operation.gridposition, operation.insertmode);

                for (var i = (allCellInsertPositions.length - 1); i >= 0; i--) {
                    var rowPos = _.copy(localPos, true),
                        start = allCellInsertPositions[i],
                        end = start;  // only one cell within each operation
                    rowPos.push(i);
                    var undoOperation = { name: Operations.CELLS_DELETE, position: rowPos, start: start, end: end };
                    undomgr.addUndo(undoOperation);
                }

                undomgr.addUndo(null, operation);  // only one redo operation

                undomgr.endGroup();
            }
            implInsertColumn(operation.position, operation.gridposition, operation.tablegrid, operation.insertmode);
        };

        operationHandlers[Operations.PARA_SPLIT] = function (operation) {
            if (undomgr.isEnabled()) {
                var localStart = _.copy(operation.start, true);
                localStart.pop();
                var undoOperation = { name: Operations.PARA_MERGE, start: localStart };
                undomgr.addUndo(undoOperation, operation);
            }
            implSplitParagraph(operation.start);
        };

        operationHandlers[Operations.IMAGE_INSERT] = function (operation) {
            if (implInsertImage(operation.imgurl, operation.position, operation.attrs)) {
                if (undomgr.isEnabled()) {
                    var undoOperation = { name: Operations.TEXT_DELETE, start: operation.position, end: operation.position };
                    undomgr.addUndo(undoOperation, operation);
                }
            }
        };

        operationHandlers[Operations.FIELD_INSERT] = function (operation) {
            if (implInsertField(operation.position, operation.type, operation.representation)) {
                if (undomgr.isEnabled()) {
                    var undoOperation = { name: Operations.TEXT_DELETE, start: operation.position, end: operation.position };
                    undomgr.addUndo(undoOperation, operation);
                }
            }
        };

        operationHandlers[Operations.PARA_MERGE] = function (operation) {
            if (undomgr.isEnabled()) {
                var sel = _.clone(operation.start),
                    paraLen = Position.getParagraphLength(paragraphs, sel);

                sel.push(paraLen);
                var undoOperation = { name: Operations.PARA_SPLIT, start: sel };
                undomgr.addUndo(undoOperation, operation);
            }
            implMergeParagraph(operation.start);
        };

        /**
         * Central dispatcher function for operations.
         */
        function applyOperation(operation, record, notify) {

            var // the function that executes the operation
                operationHandler = null;

            if (!_.isObject(operation)) {
                Utils.error('Editor.applyOperation(): expecting operation object');
                return;
            }

            // get and check operation handler
            operationHandler = operationHandlers[operation.name];
            if (!_.isFunction(operationHandler)) {
                Utils.warning('Editor.applyOperation(): invalid operation name "' + operation.name + '".');
                return;
            }

            if (blockOperations) {
                // This can only happen if someone tries to apply new operation in the operation notify.
                // This is not allowed because a document manipulation method might be split into multiple operations, following operations would have invalid positions then.
                Utils.info('Editor.applyOperation(): operations blocked');
                return;
            }

            blockOperations = true;

            // remove highlighting before changing the DOM which invalidates the positions in highlightRanges
            self.removeHighlighting();

            // Copy operation now, because undo might manipulate it when merging with previous one...
            var notifyOperation = _.copy(operation, true);

            implDbgOutObject({type: 'operation', value: operation});

            if (record) {
                operations.push(operation);
            }

            // execute the operation handler (set function context to editor instance)
            operationHandler.call(self, operation);

            if (notify && !blockOperationNotifications) {
                // Will give everybody the same copy - how to give everybody his own copy?
                self.trigger('operation', notifyOperation);
            }

            blockOperations = false;

            // DEBUG STUFF
            if (self.getParagraphCount() !== editdiv.children().size()) {
                Utils.warn('Editor.applyOperation(): paragraph count invalid!');
            }
        }

        // ==================================================================
        // Private selection functions
        // ==================================================================

        function getSelection(updateFromBrowser) {

            if (currentSelection && !updateFromBrowser)
                return currentSelection;

            var domSelection = DOM.getBrowserSelection(editdiv),
                domRange = null;

            if (domSelection.length) {

                _(domSelection).each(function (range, index) {
                    Utils.log('getSelection(): range[' + index + '], start=' + range.start.node.nodeName + ':' + range.start.offset + ', end=' + range.end.node.nodeName + ':' + range.end.offset);
                });

                domRange = _(domSelection).last();

                // allowing 'special' multiselection for tables (rectangle cell selection)
                if ($(domRange.start.node).is('tr')) {
                    domRange.start = _(domSelection).first().start;
                }

                var isPos1Endpoint = false,
                    isPos2Endpoint = true;

                if ((domRange.start.node === domRange.end.node) && (domRange.start.offset === domRange.end.offset)) {
                    isPos2Endpoint = false;
                }

                var startPaM = Position.getTextLevelOxoPosition(domRange.start, editdiv, isPos1Endpoint),
                    endPaM = Position.getTextLevelOxoPosition(domRange.end, editdiv, isPos2Endpoint);

                currentSelection = new OXOSelection(startPaM, endPaM);
                Utils.log('getSelection(): logical position: start=[' + currentSelection.startPaM.oxoPosition + '], end=[' + currentSelection.endPaM.oxoPosition + '],' +
                          ' start: ' + currentSelection.startPaM.selectedNodeName + ' (image float mode: ' + currentSelection.startPaM.imageFloatMode + '),' +
                          ' end: ' + currentSelection.endPaM.selectedNodeName + ' (image float mode: ' + currentSelection.endPaM.imageFloatMode + ')');

                // Keeping selections synchronuous. Without setting selection now, there are cursor travel problems in Firefox.
                // -> too many problems. It is not a good idea to call setSelection() inside getSelection() !
                // setSelection(currentSelection);

                return  _.copy(currentSelection, true);
            }
        }

        function setSelection(oxosel) {

            var ranges = [];

            // window.console.log('setSelection: Input of Oxo Selection: ' + oxosel.startPaM.oxoPosition + ' : ' + oxosel.endPaM.oxoPosition);

            currentSelection = _.copy(oxosel, true);

            // Multi selection for rectangle cell selection in Firefox.
            if (oxosel.hasRange() && (Position.isCellSelection(oxosel.startPaM, oxosel.endPaM))) {
                ranges = Position.getCellDOMSelections(paragraphs, oxosel);
            } else {
                var useObjectNode = (selectedObjects.length > 0);
                ranges = Position.getDOMSelection(paragraphs, oxosel, useObjectNode);
            }

            // for (var i = 0; i < ranges.length; i++) {
            //     window.console.log('setSelection: Calculated browser selection (' + i + '): ' + ranges[i].start.node.nodeName + ' : ' + ranges[i].start.offset + ' to ' + ranges[i].end.node.nodeName + ' : ' + ranges[i].end.offset);
            // }

            if (ranges.length) {
                DOM.setBrowserSelection(ranges);
                // if (TODO: Compare Arrays oldSelection, oxosel)
                self.trigger('selection', currentSelection);
            } else {
                Utils.error('Editor.setSelection(): Failed to determine DOM Selection from OXO Selection: ' + oxosel.startPaM.oxoPosition + ' : ' + oxosel.endPaM.oxoPosition);
            }
        }

        // End of private selection functions

        /**
         * Removes empty text nodes from the passed paragraph, checks whether it
         * needs a trailing <br> element, and converts consecutive white-space
         * characters.
         *
         * @param {HTMLParagraphElement|jQuery} paragraph
         *  The paragraph element to be validated. If this object is a jQuery
         *  collection, uses the first DOM node it contains.
         */
        function validateParagraphNode(paragraph) {

            var // array of arrays collecting all sequences of sibling text nodes
                siblingTextNodes = [],
                // whether the paragraph contains any text
                hasText = false,
                // whether the last child node is the dummy <br> element
                lastDummy = false;

            // convert parameter to a DOM node
            paragraph = Utils.getDomNode(paragraph);

            // whether last node is the dummy <br> node
            lastDummy = paragraph.lastChild && $(paragraph.lastChild).data('dummy');

            // remove all empty text spans which have sibling text spans, and collect
            // sequences of sibling text spans (needed for white-space handling)
            $(paragraph).contents().each(function () {

                // check if current node is a text span (portion or field)
                if (DOM.isTextSpan(this)) {

                    if (DOM.isEmptySpan(this) && ((this.previousSibling && DOM.isPortionSpan(this.previousSibling)) || (this.nextSibling && DOM.isPortionSpan(this.nextSibling)))) {
                        // remove this span, if it is an empty portion and has a sibling text portion
                        $(this).remove();
                    } else if (this.previousSibling && DOM.isTextSpan(this.previousSibling)) {
                        // append to array that contains the previous text node (portion or field)
                        _(siblingTextNodes).last().push(this.firstChild);
                    } else {
                        // start a new sequence of text nodes
                        siblingTextNodes.push([this.firstChild]);
                    }
                }
            });

            // Convert consecutive white-space characters to sequences of SPACE/NBSP
            // pairs. We cannot use the CSS attribute white-space:pre-wrap, because
            // it breaks the paragraph's CSS attribute text-align:justify. Process
            // each sequence of sibling text nodes for its own (the text node
            // sequences may be interrupted by other elements such as hard line
            // breaks, images, or other objects).
            // TODO: handle explicit NBSP inserted by the user (when supported)
            _(siblingTextNodes).each(function (textNodes) {

                var // the complete text of all sibling text nodes
                    text = '',
                    // offset for final text distribution
                    offset = 0;

                // collect the complete text in all text nodes
                _(textNodes).each(function (textNode) { text += textNode.nodeValue; });

                // ignore empty sequences
                if (text.length > 0) {
                    hasText = true;

                    // process all white-space contained in the text nodes
                    text = text
                        // normalize white-space (convert to SPACE characters)
                        .replace(/\s/g, ' ')
                        // text in the node sequence cannot start with a SPACE character
                        .replace(/^ /, '\xa0')
                        // convert SPACE/SPACE pairs to SPACE/NBSP pairs
                        .replace(/ {2}/g, ' \xa0')
                        // text in the node sequence cannot end with a SPACE character
                        .replace(/ $/, '\xa0');

                    // distribute converted text to the text nodes
                    _(textNodes).each(function (textNode) {
                        var length = textNode.nodeValue.length;
                        textNode.nodeValue = text.substr(offset, length);
                        offset += length;
                    });
                }
            });

            // insert an empty text span if there is no other content (except the dummy <br>)
            if (!paragraph.hasChildNodes() || (lastDummy && (paragraph.childNodes.length === 1))) {
                $(paragraph).prepend($('<span>').text(''));
                // initialize paragraph and character formatting from current paragraph style
                paragraphStyles.updateElementFormatting(paragraph);
            }

            // append dummy <br> if the paragraph contains no text, or remove
            // the dummy <br> if there is any text
            if (!hasText && !lastDummy) {
                $(paragraph).append($('<br>').data('dummy', true));
            } else if (hasText && lastDummy) {
                $(paragraph.lastChild).remove();
            }

            // TODO: Adjust tabs, ...
        }

        // ==================================================================
        // Private helper method for setting attributes. Only called from
        // function 'setAttribute'.
        // ==================================================================

        /**
         * Changes multiple attributes of the specified attribute family in the
         * current selection.
         *
         * @param {String} family
         *  The name of the attribute family containing the specified
         *  attribute.
         */
        function setAttributes(family, attributes, startPosition, endPosition) {

            var para,
                start,
                end,
                buttonEvent = (startPosition === undefined) && (endPosition === undefined);

            if ((startPosition !== undefined) && (endPosition !== undefined)) {
                var startposLength = startPosition.length - 1,
                    endposLength = endPosition.length - 1;
                para = startPosition[startposLength - 1];
                start = startPosition[startposLength];
                end = endPosition[endposLength];
            }

            // TODO: adjust position according to passed attribute family
            if (para === undefined) {
                // Set attr to current selection
                var updateFromBrowser = false,
                    selection = getSelection(updateFromBrowser);

                if (selection.hasRange()) {

                    selection.adjust();

                    if (Position.isSameParagraph(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {
                        // Only one paragraph concerned from attribute changes.
                        setAttributes(family, attributes, selection.startPaM.oxoPosition, selection.endPaM.oxoPosition);

                    } else if (Position.isSameParagraphLevel(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {
                        // The included paragraphs are neighbours.
                        setAttributesInSameParagraphLevel(selection, family, attributes);

                    } else if (Position.isCellSelection(selection.startPaM, selection.endPaM)) {
                        // This cell selection is a rectangle selection of cells in a table (only supported in Firefox).
                        setAttributesInCellSelection(selection, family, attributes);

                    } else if (Position.isSameTableLevel(paragraphs, selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {
                        // This selection is inside a table in a browser, where no cell selection is possible (Chrome). Selected
                        // can be parts of paragraphs inside a cell and also all paragraphs in other cells. This selection is
                        // important to be able to support something similar like cell selection, that is only possible
                        // in Firefox. So changes made in Firefox tables are displayed correctly in Chrome and vice versa.
                        setAttributesInSameTableLevel(selection, family, attributes);

                    } else {
                        // The included paragraphs are not neighbours. For example one paragraph top level and one in table.
                        // Should this be supported? How about tables in tables?
                        // This probably works not reliable for tables in tables.
                        setAttributesInDifferentParagraphLevels(selection, family, attributes);
                    }
                }
                else if ((selection.endPaM.imageFloatMode !== null) && (buttonEvent)) {

                    setAttributesToSelectedImage(selection, attributes);
                }
                // paragraph attributes also for cursor without selection (// if (selection.hasRange()))
                else if (family === 'paragraph') {
                    startPosition = Position.getFamilyAssignedPosition(family, paragraphs, selection.startPaM.oxoPosition);
                    endPosition = Position.getFamilyAssignedPosition(family, paragraphs, selection.endPaM.oxoPosition);
                    var newOperation = {name: Operations.ATTRS_SET, attrs: attributes, start: startPosition, end: endPosition};
                    applyOperation(newOperation, true, true);
                }
            }
            else {
                startPosition = Position.getFamilyAssignedPosition(family, paragraphs, startPosition);
                endPosition = Position.getFamilyAssignedPosition(family, paragraphs, endPosition);

                var _endPosition = _.copy(endPosition, true);
                if ((family === 'character') && (_endPosition[_endPosition.length - 1] > 0)) {
                    _endPosition[_endPosition.length - 1] -= 1;  // switching from range mode to operation mode
                }

                var newOperation = {name: Operations.ATTRS_SET, attrs: attributes, start: startPosition, end: _endPosition};
                // var newOperation = {name: Operations.ATTRS_SET, attrs: attributes, start: startPosition, end: endPosition};
                applyOperation(newOperation, true, true);
            }
        }

        // ==================================================================
        // Private image methods
        // ==================================================================

        function sendImageSize(position) {

            // sending size of image to the server in an operation -> necessary after loading the image
            var useObjectNode = true,
                imagePos = Position.getDOMPosition(paragraphs, _.copy(position), useObjectNode);

            if ((imagePos) && (imagePos.node) && (DOM.isImageNode(imagePos.node))) {

                $('img', imagePos.node).one('load', function () {
                    var width = Utils.convertLengthToHmm($(this).width(), 'px'),
                        height = Utils.convertLengthToHmm($(this).height(), 'px'),
                        // updating the logical position of the image div, maybe it changed in the meantime while loading the image
                        updatePosition = Position.getOxoPosition(editdiv, this, 0),
                        newOperation = { name: Operations.ATTRS_SET, attrs: {width: width, height: height}, start: updatePosition };

                    applyOperation(newOperation, true, true);
                });
            }
        }

        // ==================================================================
        // Private table methods
        // ==================================================================

        function deletePreviousCellsInTable(position) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            if (isInTable) {

                var rowIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'tr'),
                    columnIndex = rowIndex + 1,
                    thisRow = localPos[rowIndex],
                    thisColumn = localPos[columnIndex],
                    lastColumn = Position.getLastColumnIndexInTable(paragraphs, localPos);

                for (var j = 0; j <= thisRow; j++) {
                    var max = lastColumn;
                    if (j === thisRow) {
                        max = thisColumn - 1;
                    }
                    for (var i = 0; i <= max; i++) {
                        localPos[rowIndex] = j;  // row
                        localPos[columnIndex] = i;   // column
                        localPos[columnIndex + 1] = 0;
                        localPos[columnIndex + 2] = 0;
                        deleteAllParagraphsInCell(localPos);
                    }
                }
            }
        }

        function deleteAllParagraphsInCell(position, noOPs) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            noOPs = noOPs ? true : false;

            if (isInTable) {

                var colIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'th, td'),
                    paraIndex = colIndex + 1,
                    lastParaInCell = Position.getLastParaIndexInCell(paragraphs, localPos);

                localPos[paraIndex] = 0;

                for (var i = 0; i <= lastParaInCell; i++) {
                    if ((localPos.length - 1) > paraIndex) {
                        localPos.pop();
                    }

                    var isTable = $(Position.getDOMPosition(paragraphs, localPos).node).is('table');

                    if (i < lastParaInCell) {
                        if (isTable) {
                            if (noOPs) {
                                implDeleteTable(localPos);
                            } else {
                                self.deleteTable(localPos);
                            }
                        } else {
                            if (noOPs) {
                                implDeleteParagraph(localPos);
                            } else {
                                self.deleteParagraph(localPos);
                            }
                        }
                    } else {
                        if (! noOPs) {
                            var startPos = _.copy(localPos, true),
                                endPos = _.copy(localPos, true);
                            startPos.push(0);
                            endPos.push(Position.getParagraphLength(paragraphs, localPos));
                            self.deleteText(startPos, endPos);
                        }
                        implDeleteParagraphContent(localPos);
                    }
                }
            }
        }

        function deletePreviousParagraphsInCell(position) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            if (isInTable) {

                var paraIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'div.p'),
                    lastPara =  localPos[paraIndex],
                    paragraphPosition = [];

                localPos[paraIndex] = 0; // always 0, because paragraphs are deleted

                for (var i = 0; i <= paraIndex; i++) {
                    paragraphPosition.push(localPos[i]);
                }

                for (var i = 0; i < lastPara; i++) {
                    var isTable = $(Position.getDOMPosition(paragraphs, paragraphPosition).node).is('table');
                    if (isTable) {
                        self.deleteTable(localPos);
                    } else {
                        self.deleteParagraph(localPos);
                    }
                }
            }
        }

        function deleteFollowingCellsInTable(position) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            if (isInTable) {

                var rowIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'tr'),
                    columnIndex = rowIndex + 1,
                    thisRow = localPos[rowIndex],
                    thisColumn = localPos[columnIndex],
                    lastRow = Position.getLastRowIndexInTable(paragraphs, position),
                    lastColumn = Position.getLastColumnIndexInTable(paragraphs, position);

                for (var j = thisRow; j <= lastRow; j++) {
                    var min = 0;
                    if (j === thisRow) {
                        min = thisColumn + 1;
                    }

                    for (var i = min; i <= lastColumn; i++) {
                        localPos[rowIndex] = j;  // row
                        localPos[columnIndex] = i;  // column
                        deleteAllParagraphsInCell(localPos);
                    }
                }
            }
        }

        function deleteFollowingParagraphsInCell(position) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            if (isInTable) {

                var paraIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'div.p'),
                    startPara = localPos[paraIndex] + 1,
                    lastPara =  Position.getLastParaIndexInCell(paragraphs, localPos),
                    paragraphPosition = [];

                localPos[paraIndex] = startPara; // always 'startPara', because paragraphs are deleted

                for (var i = 0; i <= paraIndex; i++) {
                    paragraphPosition.push(localPos[i]);
                }

                for (var i = startPara; i <= lastPara; i++) {
                    var isTable = $(Position.getDOMPosition(paragraphs, paragraphPosition).node).is('table');
                    if (isTable) {
                        self.deleteTable(localPos);
                    } else {
                        self.deleteParagraph(localPos);
                    }
                }
            }
        }

        function setAttributesToPreviousCellsInTable(family, attributes, position) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            if (isInTable) {

                var paraIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'div.p');

                if (paraIndex !== -1) {

                    var columnIndex = paraIndex - 1,
                        rowIndex = columnIndex - 1,
                        thisRow = localPos[rowIndex],
                        thisColumn = localPos[columnIndex],
                        lastColumn = Position.getLastColumnIndexInTable(paragraphs, localPos),
                        lastIndex = localPos.length - 1;

                    while (lastIndex > columnIndex) {
                        localPos.pop();  // Removing position and paragraph optionally
                        lastIndex = localPos.length - 1;
                    }

                    for (var j = 0; j <= thisRow; j++) {
                        var max = lastColumn;
                        if (j === thisRow) {
                            max = thisColumn - 1;
                        }
                        for (var i = 0; i <= max; i++) {
                            localPos[rowIndex] = j;   // row
                            localPos[columnIndex] = i;  // column
                            var startPosition = Position.getFirstPositionInCurrentCell(paragraphs, localPos);
                            var endPosition = Position.getLastPositionInCurrentCell(paragraphs, localPos);
                            setAttributes(family, attributes, startPosition, endPosition);
                        }
                    }
                }
            }
        }

        function setAttributesToFollowingCellsInTable(family, attributes, position) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            if (isInTable) {
                var rowIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'tr'),
                columnIndex = rowIndex + 1,
                thisRow = localPos[rowIndex],
                thisColumn = localPos[columnIndex],
                lastRow = Position.getLastRowIndexInTable(paragraphs, position),
                lastColumn = Position.getLastColumnIndexInTable(paragraphs, position);

                while (localPos.length > columnIndex) {
                    localPos.pop();  // Removing position and paragraph optionally
                }

                for (var j = thisRow; j <= lastRow; j++) {
                    var min = 0;
                    if (j === thisRow) {
                        min = thisColumn + 1;
                    }
                    for (var i = min; i <= lastColumn; i++) {
                        localPos[rowIndex] = j;  // row
                        localPos[columnIndex] = i;  // column
                        var startPosition = Position.getFirstPositionInCurrentCell(paragraphs, localPos);
                        var endPosition = Position.getLastPositionInCurrentCell(paragraphs, localPos);
                        setAttributes(family, attributes, startPosition, endPosition);
                    }
                }
            }
        }

        function setAttributesToPreviousParagraphsInCell(family, attributes, position) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            if (isInTable) {

                var paraIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'div.p'),
                    thisPara = localPos[paraIndex],
                    paragraphPosition = [];

                for (var i = 0; i <= paraIndex; i++) {
                    paragraphPosition.push(localPos[i]);
                }

                for (var i = 0; i < thisPara; i++) {
                    localPos[paraIndex] = i;
                    paragraphPosition[paraIndex] = i;

                    // it can be a table next to a paragraph
                    if ($(Position.getDOMPosition(paragraphs, paragraphPosition).node).is('table')) {
                        setAttributesToCompleteTable(family, attributes, localPos);
                    } else {
                        setAttributesToParagraphInCell(family, attributes, localPos);
                    }
                }
            }
        }

        function setAttributesToFollowingParagraphsInCell(family, attributes, position) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            if (isInTable) {

                var paraIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'div.p'),
                    startPara = localPos[paraIndex] + 1,
                    lastPara =  Position.getLastParaIndexInCell(paragraphs, position),
                    paragraphPosition = [];

                for (var i = 0; i <= paraIndex; i++) {
                    paragraphPosition.push(localPos[i]);
                }

                for (var i = startPara; i <= lastPara; i++) {
                    localPos[paraIndex] = i;
                    paragraphPosition[paraIndex] = i;

                    // it can be a table next to a paragraph
                    if ($(Position.getDOMPosition(paragraphs, paragraphPosition).node).is('table')) {
                        setAttributesToCompleteTable(family, attributes, localPos);
                    } else {
                        setAttributesToParagraphInCell(family, attributes, localPos);
                    }
                }
            }
        }

        function setAttributesToCompleteTable(family, attributes, position) {

            var localPos = _.copy(position),
                tableIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'table'),
                localPos = [];

            for (var i = 0; i <= tableIndex; i++) {
                localPos[i] = position[i];
            }

            localPos.push(0); // row

            var rowIndex = localPos.length - 1,
                columnIndex = rowIndex + 1;

            localPos.push(0); // column

            var lastRow = Position.getLastRowIndexInTable(paragraphs, position),
                lastColumn = Position.getLastColumnIndexInTable(paragraphs, position);


            for (var j = 0; j <= lastRow; j++) {
                for (var i = 0; i <= lastColumn; i++) {
                    localPos[rowIndex] = j;  // row
                    localPos[columnIndex] = i;  // column
                    var startPosition = Position.getFirstPositionInCurrentCell(paragraphs, localPos);
                    var endPosition = Position.getLastPositionInCurrentCell(paragraphs, localPos);
                    setAttributes(family, attributes, startPosition, endPosition);
                }
            }
        }

        function setAttributesToParagraphInCell(family, attributes, position) {

            var startPosition = _.copy(position, true),
                endPosition = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, startPosition);

            if (isInTable) {
                var paraIndex = Position.getLastIndexInPositionByNodeName(paragraphs, startPosition, 'div.p');

                startPosition[paraIndex + 1] = 0;
                endPosition[paraIndex + 1] = Position.getParagraphLength(paragraphs, position);

                setAttributes(family, attributes, startPosition, endPosition);
            }
        }

        // ====================================================================
        // Private helper functions
        // ====================================================================

        function fillstr(str, len, fill, right) {
            while (str.length < len) {
                if (right)
                    str = str + fill;
                else
                    str = fill + str;
            }
            return str;
        }

        function getFormattedPositionString(position) {
            var str = '';

            for (var i = 0; i < position.length; i++) {
                str += fillstr(position[i].toString(), 2, '0');
                if (i !== position.length - 1) {
                    str += ',';
                }
            }

            return str;
        }

        /**
         * After merging two paragraphs, it can be necessary to move floated images
         * of the second paragraph to the beginning of the first paragraph. This can
         * done using this function 'moveFloatedImages', that generates 'move'
         * operations for moving the images.
         *
         * @param {OXOPaM.oxoPosition} position
         *  The logical position describing the paragraph.
         */
        function moveFloatedImages(position) {

            var domPos = Position.getDOMPosition(paragraphs, position),
                imageShift = 0;

            if ((domPos) && (domPos.node) && (DOM.isParagraphNode(domPos.node))) {

                var para = domPos.node,
                    counter = Position.getNumberOfFloatedImagesInParagraph(para),  // counting number of floated images at begin of paragraph
                    child = para.firstChild;

                while (child !== null) {
                    var nextChild = child.nextSibling; // saving next sibling, because it will be lost after appendChild()

                    if ((DOM.isImageNode(child)) && ($(child).data('mode') !== 'inline')) {

                        var localPos = Position.getObjectPositionInParagraph(para, child),
                            source = _.copy(position, true),
                            dest = _.copy(position, true);

                        if (localPos > (counter - 1)) {  // only shifting images, that are not already at the beginning of the paragraph
                            source.push(localPos);
                            dest.push(counter);  // there might be floated images already in the first paragraph
                            imageShift++;

                            // moving floated images with operation
                            var newOperation = {name: Operations.MOVE, start: _.copy(source, true), end: _.copy(dest, true)};
                            applyOperation(newOperation, true, true);
                        }

                        counter++;
                    }

                    child = nextChild;
                }

                // finally delete all empty text spans in this paragraph, that are located before floated images
                Position.removeLeadingEmptyTextSpans(paragraphs, _.copy(position));

            }

            return imageShift;
        }

        function deleteSelectedInSameParagraphLevel(selection) {
            // The included paragraphs are neighbours.
            var endPosition = _.copy(selection.startPaM.oxoPosition, true),
                startposLength = selection.startPaM.oxoPosition.length - 1,
                endposLength = selection.endPaM.oxoPosition.length - 1;

            // 1) delete selected part or rest of para in first para (pos to end)
            endPosition[endposLength] = Position.getParagraphLength(paragraphs, endPosition);
            self.deleteText(selection.startPaM.oxoPosition, endPosition);

            // 2) delete completly selected paragraphs completely
            for (var i = selection.startPaM.oxoPosition[startposLength - 1] + 1; i < selection.endPaM.oxoPosition[endposLength - 1]; i++) {
                var startPosition = _.copy(selection.startPaM.oxoPosition, true);
                startPosition[startposLength - 1] = selection.startPaM.oxoPosition[startposLength - 1] + 1;

                // Is the new dom position a table or a paragraph or whatever? Special handling for tables required
                startPosition.pop();
                var isTable = $(Position.getDOMPosition(paragraphs, startPosition).node).is('table');

                if (isTable) {
                    self.deleteTable(startPosition);
                } else {
                    self.deleteParagraph(startPosition);
                }
            }

            // 3) delete selected part in last para (start to pos) and merge first and last para
            if (selection.startPaM.oxoPosition[startposLength - 1] !== selection.endPaM.oxoPosition[endposLength - 1]) {
                var startPosition = _.copy(selection.endPaM.oxoPosition, true);
                startPosition[endposLength - 1] = selection.startPaM.oxoPosition[startposLength - 1] + 1;
                startPosition[endposLength] = 0;
                endPosition = _.copy(startPosition, true);
                endPosition[startposLength] = selection.endPaM.oxoPosition[endposLength];
                self.deleteText(startPosition, endPosition);

                var mergeselection = _.copy(selection.startPaM.oxoPosition);
                mergeselection.pop();
                self.mergeParagraph(mergeselection);
            }
        }

        function deleteSelectedInCellSelection(selection) {

            var startPos = _.copy(selection.startPaM.oxoPosition, true),
                endPos = _.copy(selection.endPaM.oxoPosition, true);

            startPos.pop();
            startPos.pop();
            endPos.pop();
            endPos.pop();

            var startCol = startPos.pop(),
                startRow = startPos.pop(),
                endCol = endPos.pop(),
                endRow = endPos.pop();

            self.deleteCellRange(startPos, [startRow, startCol], [endRow, endCol]);
        }

        function deleteSelectedInSameTableLevel(selection) {

            var startPos = _.copy(selection.startPaM.oxoPosition, true),
                endPos = _.copy(selection.endPaM.oxoPosition, true),
                startposLength = selection.startPaM.oxoPosition.length - 1;

            // 1) delete selected part or rest of para in first para (pos to end)
            var localEndPosition = _.copy(selection.startPaM.oxoPosition, true);
            localEndPosition[startposLength] = Position.getParagraphLength(paragraphs, localEndPosition);
            self.deleteText(selection.startPaM.oxoPosition, localEndPosition);
            localEndPosition.pop();
            deleteFollowingParagraphsInCell(localEndPosition);

            // 2) completely selected cells
            var rowIndex = Position.getLastIndexInPositionByNodeName(paragraphs, startPos, 'tr'),
                columnIndex = rowIndex + 1,
                startRow = startPos[rowIndex],
                startColumn = startPos[columnIndex],
                endRow = endPos[rowIndex],
                endColumn = endPos[columnIndex],
                lastColumn = Position.getLastColumnIndexInTable(paragraphs, startPos);

            for (var j = startRow; j <= endRow; j++) {
                var startCol = (j === startRow) ? startColumn + 1 : 0;
                var endCol =  (j === endRow) ? endColumn - 1 : lastColumn;

                for (var i = startCol; i <= endCol; i++) {
                    startPos[rowIndex] = j;  // row
                    startPos[columnIndex] = i;  // column
                    startPos[columnIndex + 1] = 0;
                    startPos[columnIndex + 2] = 0;
                    deleteAllParagraphsInCell(startPos);
                }
            }

            var startPosition = _.copy(selection.endPaM.oxoPosition, true),
                endposLength = selection.endPaM.oxoPosition.length - 1;

            startPosition[endposLength] = 0;
            localEndPosition = _.copy(startPosition, true);
            localEndPosition[endposLength] = selection.endPaM.oxoPosition[endposLength];

            self.deleteText(startPosition, localEndPosition);

            // delete all previous paragraphs in this cell!
            localEndPosition.pop();
            deletePreviousParagraphsInCell(localEndPosition);
        }

        function deleteSelectedInDifferentParagraphLevels(selection) {

            var endPosition = _.copy(selection.endPaM.oxoPosition, true),
                startposLength = selection.startPaM.oxoPosition.length - 1,
                endposLength = selection.endPaM.oxoPosition.length - 1,
                isTable = false;

            // 1) delete selected part or rest of para in first para (pos to end)
            if (selection.startPaM.oxoPosition[0] !== selection.endPaM.oxoPosition[0]) {
                isTable = Position.isPositionInTable(paragraphs, selection.startPaM.oxoPosition);
                endPosition = _.copy(selection.startPaM.oxoPosition);
                if (isTable) {
                    var localEndPosition = _.copy(endPosition);
                    localEndPosition.pop();
                    deleteFollowingParagraphsInCell(localEndPosition);
                    localEndPosition.pop();
                    deleteFollowingCellsInTable(localEndPosition);
                }
                endPosition[startposLength] = Position.getParagraphLength(paragraphs, endPosition);
            }
            self.deleteText(selection.startPaM.oxoPosition, endPosition);

            // 2) delete completly slected paragraphs completely
            for (var i = selection.startPaM.oxoPosition[0] + 1; i < selection.endPaM.oxoPosition[0]; i++) {
                // startPaM.oxoPosition[0]+1 instead of i, because we always remove a paragraph
                var startPosition = [];
                startPosition[0] = selection.startPaM.oxoPosition[0] + 1;
                isTable = Position.isPositionInTable(paragraphs, startPosition);
                if (isTable) {
                    self.deleteTable(startPosition);
                } else {
                    self.deleteParagraph(startPosition);
                }
            }

            // 3) delete selected part in last para (start to pos) and merge first and last para
            if (selection.startPaM.oxoPosition[0] !== selection.endPaM.oxoPosition[0]) {

                var startPosition = _.copy(selection.endPaM.oxoPosition, true);
                startPosition[0] = selection.startPaM.oxoPosition[0] + 1;
                startPosition[endposLength] = 0;
                endPosition = _.copy(startPosition, true);
                endPosition[endposLength] = selection.endPaM.oxoPosition[endposLength];

                isTable = Position.isPositionInTable(paragraphs, endPosition);

                self.deleteText(startPosition, endPosition);

                if (isTable) {
                    // delete all previous cells and all previous paragraphs in this cell!
                    endPosition.pop();
                    deletePreviousParagraphsInCell(endPosition);
                    endPosition.pop();
                    deletePreviousCellsInTable(endPosition);
                }

                if (! isTable) {
                    var mergeselection = _.copy(selection.startPaM.oxoPosition);
                    mergeselection.pop();
                    self.mergeParagraph(mergeselection);
                }
            }

        }

        function deleteSelectedImage(selection) {
            var imageStartPosition = _.copy(selection.startPaM.oxoPosition, true),
                useObjectNode = true,
                imageDivNode = Position.getDOMPosition(paragraphs, imageStartPosition, useObjectNode).node;

            // only delete, if imageStartPosition is really an image position
            if (DOM.isImageNode(imageDivNode)) {
                // delete an corresponding div
                var divNode = imageDivNode.previousSibling;
                if ($(divNode).is('div.float')) {
                    // removing position div node
                    $(divNode).remove();
                }

                var imageEndPosition = _.copy(imageStartPosition, true);
                imageEndPosition[imageEndPosition.length - 1] += 1;  // creating a range, should be superfluous in the future
                // deleting the image with an operation
                self.deleteText(imageStartPosition, imageEndPosition);
            }
        }

        function setAttributesInSameParagraphLevel(selection, family, attributes) {

            // 1) selected part or rest of para in first para (pos to end)
            var startposLength = selection.startPaM.oxoPosition.length - 1,
                endposLength = selection.endPaM.oxoPosition.length - 1,
                localendPosition = _.copy(selection.startPaM.oxoPosition, true);

            localendPosition[startposLength] = Position.getParagraphLength(paragraphs, localendPosition);
            setAttributes(family, attributes, selection.startPaM.oxoPosition, localendPosition);

            // 2) completly selected paragraphs
            for (var i = selection.startPaM.oxoPosition[startposLength - 1] + 1; i < selection.endPaM.oxoPosition[endposLength - 1]; i++) {
                var localstartPosition = _.copy(selection.startPaM.oxoPosition, true);
                localstartPosition[startposLength - 1] = i;
                localstartPosition[startposLength] = 0;

                // Is the new dom position a table or a paragraph or whatever? Special handling for tables required
                // Removing position temporarely
                var pos = localstartPosition.pop();
                var isTable = $(Position.getDOMPosition(paragraphs, localstartPosition).node).is('table');

                if (isTable) {
                    setAttributesToCompleteTable(family, attributes, localstartPosition);
                } else {
                    localstartPosition.push(pos);
                    localendPosition = _.copy(localstartPosition, true);
                    localendPosition[startposLength] = Position.getParagraphLength(paragraphs, localendPosition);
                    setAttributes(family, attributes, localstartPosition, localendPosition);
                }
            }

            // 3) selected part in last para
            if (selection.startPaM.oxoPosition[startposLength - 1] !== selection.endPaM.oxoPosition[endposLength - 1]) {
                var localstartPosition = _.copy(selection.endPaM.oxoPosition, true);
                localstartPosition[endposLength - 1] = selection.endPaM.oxoPosition[endposLength - 1];
                localstartPosition[endposLength] = 0;

                setAttributes(family, attributes, localstartPosition, selection.endPaM.oxoPosition);
            }
        }

        function setAttributesInCellSelection(selection, family, attributes) {

            var startPos = _.copy(selection.startPaM.oxoPosition, true),
                endPos = _.copy(selection.endPaM.oxoPosition, true);

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
                    var startPosition = Position.getFirstPositionInCurrentCell(paragraphs, position);
                    var endPosition = Position.getLastPositionInCurrentCell(paragraphs, position);
                    setAttributes(family, attributes, startPosition, endPosition);
                }
            }
        }

        function setAttributesInSameTableLevel(selection, family, attributes) {

            var startPos = _.copy(selection.startPaM.oxoPosition, true),
                endPos = _.copy(selection.endPaM.oxoPosition, true);

            // 1) selected part in first cell
            var startposLength = selection.startPaM.oxoPosition.length - 1,
                localendPosition = _.copy(selection.startPaM.oxoPosition, true);

            localendPosition[startposLength] = Position.getParagraphLength(paragraphs, localendPosition);
            setAttributes(family, attributes, selection.startPaM.oxoPosition, localendPosition);
            setAttributesToFollowingParagraphsInCell(family, attributes, localendPosition);

            // 2) completely selected cells
            var rowIndex = Position.getLastIndexInPositionByNodeName(paragraphs, startPos, 'tr'),
                columnIndex = rowIndex + 1,
                startRow = startPos[rowIndex],
                startColumn = startPos[columnIndex],
                endRow = endPos[rowIndex],
                endColumn = endPos[columnIndex],
                lastColumn = Position.getLastColumnIndexInTable(paragraphs, startPos);

            while (startPos.length > columnIndex) {
                startPos.pop();  // Removing position and paragraph optionally
            }


            for (var j = startRow; j <= endRow; j++) {
                var startCol = (j === startRow) ? startColumn + 1 : 0;
                var endCol =  (j === endRow) ? endColumn - 1 : lastColumn;

                for (var i = startCol; i <= endCol; i++) {
                    startPos[rowIndex] = j;  // row
                    startPos[columnIndex] = i;  // column
                    var startPosition = Position.getFirstPositionInCurrentCell(paragraphs, startPos);
                    var endPosition = Position.getLastPositionInCurrentCell(paragraphs, startPos);
                    setAttributes(family, attributes, startPosition, endPosition);
                }
            }

            // 3) selected part in final cell
            var endposLength = selection.endPaM.oxoPosition.length - 1,
                localstartPosition = _.copy(selection.endPaM.oxoPosition, true);

            localstartPosition[endposLength - 1] = selection.endPaM.oxoPosition[endposLength - 1];
            localstartPosition[endposLength] = 0;

            setAttributesToPreviousParagraphsInCell(family, attributes, selection.endPaM.oxoPosition);
            setAttributes(family, attributes, localstartPosition, selection.endPaM.oxoPosition);
        }

        function setAttributesInDifferentParagraphLevels(selection, family, attributes) {

            // 1) selected part or rest of para in first para (pos to end)
            var startposLength = selection.startPaM.oxoPosition.length - 1,
                endposLength = selection.endPaM.oxoPosition.length - 1,
                localendPosition = selection.endPaM.oxoPosition,
                isTable = Position.isPositionInTable(paragraphs, selection.startPaM.oxoPosition);

            if (selection.startPaM.oxoPosition[0] !== selection.endPaM.oxoPosition[0]) {
                // TODO: This is not sufficient
                localendPosition = _.copy(selection.startPaM.oxoPosition, true);
                if (isTable) {
                    // Assigning attribute to all following paragraphs in this cell and to all following cells!
                    setAttributesToFollowingCellsInTable(family, attributes, localendPosition);
                    setAttributesToFollowingParagraphsInCell(family, attributes, localendPosition);
                }
                localendPosition[startposLength] = Position.getParagraphLength(paragraphs, localendPosition);
            }
            setAttributes(family, attributes, selection.startPaM.oxoPosition, localendPosition);

            // 2) completly selected paragraphs
            for (var i = selection.startPaM.oxoPosition[0] + 1; i < selection.endPaM.oxoPosition[0]; i++) {
                var localstartPosition = []; //_.copy(selection.startPaM.oxoPosition, true);
                localstartPosition[0] = i;
                localstartPosition[1] = 0;

                isTable = Position.isPositionInTable(paragraphs, localstartPosition);

                if (isTable) {
                    setAttributesToCompleteTable(family, attributes, localstartPosition);
                } else {
                    localendPosition = _.copy(localstartPosition, true);
                    localendPosition[1] = Position.getParagraphLength(paragraphs, localendPosition);
                    setAttributes(family, attributes, localstartPosition, localendPosition);
                }
            }

            // 3) selected part in last para
            if (selection.startPaM.oxoPosition[0] !== selection.endPaM.oxoPosition[0]) {
                var localstartPosition = _.copy(selection.endPaM.oxoPosition, true);
                localstartPosition[endposLength] = 0;

                isTable = Position.isPositionInTable(paragraphs, localstartPosition);

                if (isTable) {
                    // Assigning attribute to all previous cells and to all previous paragraphs in this cell!
                    setAttributesToPreviousCellsInTable(family, attributes, selection.endPaM.oxoPosition);
                    setAttributesToPreviousParagraphsInCell(family, attributes, selection.endPaM.oxoPosition);
                }
                setAttributes(family, attributes, localstartPosition, selection.endPaM.oxoPosition);
            }
        }

        function setAttributesToSelectedImage(selection, attributes) {
            var imageStartPosition = _.copy(selection.startPaM.oxoPosition, true),
                imageEndPosition = _.copy(imageStartPosition, true),
                newOperation = { name: Operations.ATTRS_SET, attrs: attributes, start: imageStartPosition, end: imageEndPosition };

            if (imageStartPosition && imageEndPosition) {
                applyOperation(newOperation, true, true);
            }

            // setting the cursor position
            if (lastOperationEnd) {
                setSelection(new OXOSelection(lastOperationEnd));
            }
        }

        // ====================================================================
        //  IMPLEMENTATION FUNCTIONS
        // Private functions, that are called from function 'applyOperation'.
        // The operations itself are never generated inside an impl*-function.
        // ====================================================================

        function implParagraphChanged(position) {

            // Make sure that a completly empty para has the dummy br element, and that all others don't have it anymore...
            var paragraph = Position.getCurrentParagraph(paragraphs, position);
            if (paragraph) {
                validateParagraphNode(paragraph);
            }
        }

        function implInitDocument() {

            // create empty page with single paragraph
            editdiv.empty().append(DOM.createParagraphNode());
            pageStyles.updateElementFormatting(editdiv);

            // update the new paragraph
            paragraphs = editdiv.children();
            implParagraphChanged([0]);
            // Special handling for first paragraph, that has been inserted
            // above and thus exists already before any style sheets have been
            // inserted into the document. It may still refer implicitly to the
            // default paragraph style, therefore its CSS formatting must be
            // updated after the document has been loaded.
            // TODO: better solution needed when style cheets may change at runtime
            paragraphStyles.one('change', function () {
                paragraphStyles.updateElementFormatting(editdiv.children('div.p').first());
            });

            // set initial selection
            setSelection(new OXOSelection());
            lastOperationEnd = new OXOPaM([0, 0]);

            self.clearUndo();
            self.setEditMode(null); // set null for 'read-only' and not yet determined edit status by the server
        }

        function implInsertText(text, position) {
            var domPos = Position.getDOMPosition(paragraphs, position);

            if ((domPos) && (domPos.node)) {
                var oldText = domPos.node.nodeValue;
                if (oldText !== null) {
                    var newText = oldText.slice(0, domPos.offset) + text + oldText.slice(domPos.offset);
                    domPos.node.nodeValue = newText;
                    var lastPos = _.copy(position);
                    var posLength = position.length - 1;
                    lastPos[posLength] = position[posLength] + text.length;
                    lastOperationEnd = new OXOPaM(lastPos);
                    implParagraphChanged(position);
                }
            }
        }

        function implInsertImage(url, position, attributes) {

            var domPos = Position.getDOMPosition(paragraphs, position),
                node = domPos ? domPos.node : null,
                absUrl = /:\/\//.test(url) ? url : getDocumentUrl({ get_filename: url }),
                image = null;

            // check position
            if (!node || (node.nodeType !== 3)) {
                Utils.error('Editor.implInsertImage(): expecting text position to insert image.');
                return false;
            }

            // prepend text before offset in a new span (also if position
            // points to start or end of text, needed to clone formatting)
            DOM.splitTextNode(node, domPos.offset);

            // insert the image with default settings (inline) between the two text nodes (store original URL for later use)
            image = $('<div>', { contenteditable: false })
                .addClass('object inline')
                .data('url', url)
                .append($('<div>').addClass('content').append($('<img>', { src: absUrl })))
                .insertBefore(node.parentNode);

            // apply the passed image attributes
            imageStyles.setElementAttributes(image, attributes);

            var lastPos = _.copy(position);
            var posLength = position.length - 1;
            lastPos[posLength] = position[posLength] + 1;
            lastOperationEnd = new OXOPaM(lastPos);

            implParagraphChanged(position);
            return true;
        }

        /**
         * Implementation function for inserting fields.
         *
         * @param {Number[]} position
         *  The logical position for the new text field.
         *
         * @param {String} type
         *  A property describing the field type.
         *
         * @param {String} representation
         *  A fallback value, if the placeholder cannot be substituted with a
         *  reasonable value.
         */
        function implInsertField(position, type, representation) {

            var domPos = Position.getDOMPosition(paragraphs, position),
                node = domPos ? domPos.node : null;

            // check position
            if (!node || (node.nodeType !== 3)) {
                Utils.error('Editor.implInsertField(): expecting text position to insert field.');
                return false;
            }

            // split the text node at the specified position
            DOM.splitTextNode(node, domPos.offset);

            // insert a new text field between the text nodes
            node = DOM.splitTextNode(node, 0);
            $(node.parentNode).addClass('field');
            node.nodeValue = representation;

            implParagraphChanged(position);
            return true;
        }

        /**
         * Inserts a new style sheet into the document.
         *
         * @param {String} family
         *  The name of the attribute family the new style sheet is related to.
         *
         * @param {String} id
         *  The unique identifier of of the new style sheet.
         *
         * @param {String} name
         *  The user-defined name of of the new style sheet.
         *
         * @param {String|Null} parentId
         *  The identifier of of the parent style sheet the new style sheet
         *  will derive undefined attributes from.
         *
         * @param {Object} attributes
         *  The formatting attributes contained in the new style sheet, as map
         *  of name/value pairs.
         *
         * @param {Boolean} [hidden]
         *  Optional property that determines if the style should be displayed
         *  in the GUI.
         *
         * @param {Number} [uiPriority=0]
         *  Optional property that describes the priority of the style (the
         *  lower the value the higher the priority).
         *
         * @param {Boolean} [defStyle]
         *  True, if the new style sheet is the default style sheet of the
         *  attribute family (will be used for elements without explicit style
         *  sheet).
         *
         * @param {Boolean} [poolDefault]
         *  True, if the style sheet contains pool default settings for the
         *  attribute family.
         */
        function implInsertStyleSheet(family, id, name, parentId, attributes, hidden, uiPriority, defStyle, poolDefault) {

            var // the style sheet container
                styleSheets = self.getStyleSheets(family);

            if (styleSheets) {
                if (poolDefault === true) {
                    styleSheets.setAttributeDefaults(attributes[family]);
                } else {
                    styleSheets.addStyleSheet(id, name, parentId, attributes, { hidden: hidden, priority: uiPriority, defStyle: defStyle });
                }
            }
        }

        /**
         * Inserts a new theme into the document.
         *
         * @param {String} themeName
         *  The name of the theme.
         *
         * @param {Object} attributes
         *  The formatting settings of the theme.
         */
        function implInsertTheme(themeName, attributes) {
            self.getThemes().addTheme(themeName, attributes);
        }

        /**
         * Inserts a new theme into the document.
         *
         * @param {String} themeName
         *  The name of the scheme.
         *
         * @param {String} colorScheme
         *  The attributes of the scheme.
         */
        function implInsertList(listName, listDefinition) {

            var // the themes container
                lists = self.getLists();

            if (lists) {
                lists.addList(listName, listDefinition);
            }
        }

        /**
         * Changes a specific formatting attribute of the specified element or
         * text range. The type of the attributes will be determined from the
         * specified range.
         *
         * @param {Number[]} start
         *  The logical start position of the element or text range to be
         *  formatted.
         *
         * @param {Number[]} end
         *  The logical end position of the element or text range to be
         *  formatted.
         *
         * @param {Object} attributes
         *  A map with formatting attribute values, mapped by the attribute
         *  names.
         */
        function implSetAttributes(start, end, attributes) {

            var // undo and redo operations going into one action
                undoOperations = [], redoOperations = [];

            // change listener used to build the undo operations
            function changeListener(element, oldAttributes, newAttributes) {

                var // selection object representing the passed element
                    selection = Position.getOxoSelectionForNode(editdiv, element, false),
                    // the operational address of the passed element
                    range = { start: selection.startPaM.oxoPosition, end: selection.endPaM.oxoPosition },
                    // the operation used to undo the attribute changes
                    undoOperation = _({ name: Operations.ATTRS_SET, attrs: {} }).extend(range),
                    // the operation used to redo the attribute changes
                    redoOperation = _({ name: Operations.ATTRS_SET, attrs: {} }).extend(range);

                // find all old attributes that have been changed or cleared
                _(oldAttributes).each(function (value, name) {
                    if (!_.isEqual(value, newAttributes[name])) {
                        undoOperation.attrs[name] = value;
                        redoOperation.attrs[name] = (name in newAttributes) ? newAttributes[name] : null;
                    }
                });

                // find all newly added attributes
                _(newAttributes).each(function (value, name) {
                    if (!(name in oldAttributes)) {
                        undoOperation.attrs[name] = null;
                        redoOperation.attrs[name] = value;
                    }
                });

                // add operations to arrays
                undoOperations.push(undoOperation);
                redoOperations.push(redoOperation);
            }

            var // last index in the start/end position arrays
                startLastIndex = 0, endLastIndex = 0,
                // the DOM text range to be formatted
                ranges = null,
                // the attribute family according to the passed range address
                family = null,
                // the style sheet container of the specified attribute family
                styleSheets = null,
                // options for StyleSheets.setAttributesInRanges() method calls
                setAttributesOptions = undomgr.isEnabled() ? { changeListener: changeListener } : undefined;

            if (start === null) { return; }

            // build local copies of the arrays (do not change caller's data)
            start = _.clone(start);
            end = _.isArray(end) ? _.clone(end) : _.clone(start);
            startLastIndex = start.length - 1;
            endLastIndex = end.length - 1;

            // TODO: remove when object selection engine exists
            var containsImageAttribute = Image.containsImageAttributes(attributes);

            // get attribute family according to position
            family = Position.getPositionAssignedFamily(paragraphs, start, containsImageAttribute);

            if (family === null) {
                Utils.error('Editor.implSetAttributes(): Failed to get family from position: ' + start);
            }

            if (family === 'character') {
                end[end.length - 1] += 1; // Switching from operation mode to range mode
            }

            // validate text offset
            if (!_.isFinite(start[startLastIndex]) || (start[startLastIndex] < 0)) {
                start[startLastIndex] = 0;
            }
            if (!_.isFinite(end[endLastIndex]) || (end[endLastIndex] < 0)) {
                end[endLastIndex] = Position.getParagraphLength(paragraphs, start);
            }

            // store last position
            lastOperationEnd = new OXOPaM(end);

            // build the DOM text range, set the formatting attributes, create undo operations
            styleSheets = self.getStyleSheets(family);
            if (styleSheets) {

                ranges = Position.getDOMSelection(paragraphs, new OXOSelection(new OXOPaM(start), new OXOPaM(end)), family === 'image');
                // change attributes in document and store the undo/redo action
                styleSheets.setAttributesInRanges(ranges, attributes, setAttributesOptions);
                undomgr.addUndo(undoOperations, redoOperations);
            }
        }

        function implInsertParagraph(position) {
            var posLength = position.length - 1,
                para = position[posLength],
                allParagraphs = Position.getAllAdjacentParagraphs(paragraphs, position);

            if (! allParagraphs) {
                var pos = _.copy(position, true);
                pos[pos.length - 1] -= 1; // decreasing last value by 1, if new paragraphs are inserted
                allParagraphs = Position.getAllAdjacentParagraphs(paragraphs, pos);
            }

            var newPara = DOM.createParagraphNode();

            if (para === -1) {
                para = allParagraphs.size();
                position[posLength] = para;
            }

            if (para > 0) {
                newPara.insertAfter(allParagraphs[para - 1]);
            }
            else {
                newPara.insertBefore(allParagraphs[0]);
            }

            paragraphs = editdiv.children();

            var lastPos = _.copy(position);
            lastPos.push(0);
            lastOperationEnd = new OXOPaM(lastPos);

            implParagraphChanged(position);
        }

        function implInsertTable(pos, attrs) {

            var position = _.copy(pos, true);

            // insert the table into the document
            var table = $('<table>').append($('<colgroup>')),
                domPosition = Position.getDOMPosition(paragraphs, position),
                domParagraph = null,
                insertBefore = true;

            if (domPosition) {
                domParagraph = domPosition.node;
            } else {
                position[position.length - 1] -= 1; // inserting table at the end
                domPosition = Position.getDOMPosition(paragraphs, position);

                if (domPosition) {
                    domParagraph = domPosition.node;
                    if (domParagraph.parentNode.childNodes.length === position[position.length - 1] + 1) {
                        insertBefore = false;  // inserting after the last paragraph/table
                    }
                }
            }

            if (domParagraph !== null) {
                if (insertBefore) {
                    table.insertBefore(domParagraph);
                } else {
                    table.insertAfter(domParagraph);
                }

                paragraphs = editdiv.children();
            }

            // apply the passed table attributes
            tableStyles.setElementAttributes(table, attrs);
        }

        function implSplitParagraph(position) {

            var posLength = position.length - 1,
                para = position[posLength - 1],
                pos = position[posLength],
                allParagraphs = Position.getAllAdjacentParagraphs(paragraphs, position),
                isTable = Position.isPositionInTable(paragraphs, position) ? true : false;

            var dbg_oldparacount = allParagraphs.size();
            var paraclone = $(allParagraphs[para]).clone(true);
            paraclone.insertAfter(allParagraphs[para]);

            // refresh
            if (! isTable) {
                paragraphs = editdiv.children();
            }

            allParagraphs = Position.getAllAdjacentParagraphs(paragraphs, position);

            if (pos !== -1) {
                var startPos = _.copy(position, true);
                var endPos = _.copy(position, true);
                endPos[posLength] = -1;
                if (endPos[posLength] > 0) {
                    endPos[posLength] -= 1;  // using operation mode when calling implDeleteText directly
                }

                implDeleteText(startPos, endPos);

                // delete all image divs that are no longer associated with following floated images
                var localStartPos = _.copy(startPos);
                localStartPos.pop();
                Position.removeUnusedImageDivs(paragraphs, localStartPos);
            }
            var startPosition = _.copy(position, true);
            startPosition[posLength - 1] += 1;
            startPosition[posLength] = 0;
            var endPosition = _.copy(position, true);
            endPosition[posLength - 1] = startPosition[posLength - 1];
            endPosition[posLength] -= 1;  // using operation mode when calling implDeleteText directly

            if (endPosition[posLength] > -1) {
                implDeleteText(startPosition, endPosition);
            }

            // delete all empty text spans in cloned paragraph before floated images
            var localPos = _.copy(startPosition);
            localPos.pop();
            Position.removeLeadingEmptyTextSpans(paragraphs, localPos);
            Position.removeUnusedImageDivs(paragraphs, localPos);

            implParagraphChanged(position);
            implParagraphChanged(startPosition);
            lastOperationEnd = new OXOPaM(startPosition);

            // DEBUG STUFF
            if (paragraphs.size() !== (dbg_oldparacount + 1)) {
                Utils.warn('Editor.implSplitParagraph(): paragraph count invalid!');
            }
        }

        function implMergeParagraph(position) {

            var posLength = position.length - 1,
                para = position[posLength];

            position.push(0); // adding pos to position temporarely

            var allParagraphs = Position.getAllAdjacentParagraphs(paragraphs, position);

            position.pop();

            if (para < (allParagraphs.size() - 1)) {

                var dbg_oldparacount = allParagraphs.size();

                var thisPara = allParagraphs[para];
                var nextPara = allParagraphs[para + 1];

                // Only merging, if both nodes are paragraph nodes. Tables cannot be merged this way, and
                // paragraphs and 'table' cannot be merged either.
                if ((DOM.isParagraphNode(thisPara)) && (DOM.isParagraphNode(nextPara))) {

                    var oldParaLen = 0;
                    var imageCounter = 0;
                    oldParaLen = Position.getParagraphLength(paragraphs, position);

                    var lastCurrentChild = thisPara.lastChild;
                    if (lastCurrentChild && ($(lastCurrentChild).is('br'))) {
                        thisPara.removeChild(lastCurrentChild);
                    }

                    var child = nextPara.firstChild;

                    while (child !== null) {
                        var nextChild = child.nextSibling; // saving next sibling, because it will be lost after appendChild()

                        if ((child.nodeType === 3) && (thisPara.lastChild !== null) && (thisPara.lastChild.nodeType === 3)) {
                            thisPara.lastChild.nodeValue += child.nodeValue;
                        } else {

                            if ((DOM.isImageNode(child)) && ($(child).data('mode') !== 'inline')) {
                                imageCounter++; // counting all floated images in the added paragraph (required for cursor setting)
                            }

                            thisPara.appendChild(child);
                        }

                        child = nextChild;
                    }

                    // delete all empty text spans in merged paragraph before floated images
                    Position.removeLeadingEmptyTextSpans(paragraphs, _.copy(position, true));

                    var localPosition = _.copy(position, true);
                    localPosition[posLength] += 1;  // posLength is 0 for non-tables

                    implDeleteParagraph(localPosition);

                    var lastPos = _.copy(position);
                    oldParaLen += imageCounter;
                    lastPos.push(oldParaLen);
                    lastOperationEnd = new OXOPaM(lastPos);
                    implParagraphChanged(position);

                    // DEBUG STUFF
                    if (paragraphs.size() !== (dbg_oldparacount - 1)) {
                        Utils.warn('Editor.implMergeParagraph(): paragraph count invalid!');
                    }
                }
            }

        }

        function implDeleteParagraph(position) {

            var posLength = position.length - 1,
                para = position[posLength];

            position.push(0); // adding pos to position temporarely

            var allParagraphs = Position.getAllAdjacentParagraphs(paragraphs, position),
                isTable = Position.isPositionInTable(paragraphs, position);

            position.pop();

            var paragraph = allParagraphs[para];

            if (paragraph) {
                paragraph.parentNode.removeChild(paragraph);

                var localPos = _.copy(position, true);
                if (para > 0) {
                    para -= 1;
                }
                localPos[posLength] = para;
                localPos.push(0); // pos not corrct, but doesn't matter. Deleting paragraphs always happens between other operations, never at the last one.
                lastOperationEnd = new OXOPaM(localPos);
                if (! isTable) {
                    paragraphs = editdiv.children();
                }
            }
        }

        function implDeleteParagraphContent(position) {
            var paragraph = Position.getDOMPosition(paragraphs, position).node;
            if (paragraph) {
                $(paragraph).empty();
                validateParagraphNode(paragraph);
            }
        }

        function implDeleteCellRange(pos, startCell, endCell) {

            var startRow = startCell[0],
                startCol = startCell[1],
                endRow = endCell[0],
                endCol = endCell[1];

            for (var i = startRow; i <= endRow; i++) {
                for (var j = startCol; j <= endCol; j++) {
                    var position = _.copy(pos, true);
                    position.push(i);
                    position.push(j);
                    // second parameter TRUE, so that no further
                    // operations are created.
                    deleteAllParagraphsInCell(position, true);
                }
            }
        }

        function implDeleteTable(position) {

            var tablePosition = Position.getLastPositionFromPositionByNodeName(paragraphs, position, 'table'),
                lastRow = Position.getLastRowIndexInTable(paragraphs, position),
                lastColumn = Position.getLastColumnIndexInTable(paragraphs, position);

            // iterating over all cells and remove all paragraphs in the cells
            if ((lastRow > -1) && (lastColumn > -1)) {
                implDeleteCellRange(tablePosition, [0, 0], [lastRow, lastColumn]);
            }

            // Finally removing the table itself
            var tableNode = Position.getTableElement(paragraphs, tablePosition);
            if (tableNode) {
                $(tableNode).remove();

                var para = tablePosition.pop();
                if (para > 0) {
                    para -= 1;
                }
                tablePosition.push(para);
                tablePosition.push(Position.getParagraphLength(paragraphs, tablePosition));

                lastOperationEnd = new OXOPaM(tablePosition);

                paragraphs = editdiv.children();
            }
        }

        function implDeleteRows(pos, startRow, endRow) {

            var localPosition = _.copy(pos, true),
                lastColumn = Position.getLastColumnIndexInTable(paragraphs, localPosition);

            if (! Position.isPositionInTable(paragraphs, localPosition)) {
                return;
            }

            var table = Position.getDOMPosition(paragraphs, localPosition).node;

            // iterating over all cells and remove all paragraphs in the cells
            implDeleteCellRange(localPosition, [startRow, 0], [endRow, lastColumn]);

            $(table).children('tbody, thead').children().slice(startRow, endRow + 1).remove();

            if ($(table).children('tbody, thead').children().length === 0) {
                // This code should never be reached. If last row shall be deleted, deleteTable is called.
                self.deleteTable(localPosition);
                $(table).remove();
                paragraphs = editdiv.children();
                localPosition.push(0);
            } else {
                // Setting cursor
                var lastRow = $(table).children('tbody, thead').children().length - 1;
                if (endRow > lastRow) {
                    endRow = lastRow;
                }
                localPosition.push(endRow);
                localPosition.push(0);
                localPosition.push(0);
                localPosition.push(0);
            }

            lastOperationEnd = new OXOPaM(localPosition);
        }

        function implInsertRow(pos, count, insertdefaultcells, referencerow, attrs) {

            var localPosition = _.copy(pos, true),
                useReferenceRow = _.isNumber(referencerow) ? true : false;

            if (! Position.isPositionInTable(paragraphs, localPosition)) {
                return;
            }

            insertdefaultcells = insertdefaultcells ? true : false;

            if (!_.isNumber(count)) {
                count = 1; // setting default for number of rows
            }

            var tablePos = _.copy(localPosition, true);
            tablePos.pop();

            var table = Position.getDOMPosition(paragraphs, tablePos).node,
                tableRowDomPos = Position.getDOMPosition(paragraphs, localPosition),
                tableRowNode = null,
                row = null;

            if (tableRowDomPos) {
                tableRowNode = tableRowDomPos.node;
            }

            if (useReferenceRow) {

                row = $(table).children('tbody, thead').children().eq(referencerow);

            } else if (insertdefaultcells) {

                var columnCount = $(table).children('colgroup').children().length,
                    // prototype elements for row, cell, and paragraph
                    paragraph = DOM.createParagraphNode(),
                    cell = $('<td>').append(paragraph);

                // insert empty text node into the paragraph
                validateParagraphNode(paragraph);

                row = $('<tr>');

                // clone the cells in the row element
                _.times(columnCount, function () { row.append(cell.clone(true)); });

            } else {
                row = $('<tr>');
            }

            _.times(count, function () {
                var newRow = row.clone(true);
                if (tableRowNode) {
                    // insert the new row before the existing row at the specified position
                    $(tableRowNode).before(newRow);
                } else {
                    // append the new row to the table
                    $(table).append(newRow);
                }
                // apply the passed attributes
                tableRowStyles.setElementAttributes(newRow, attrs);
            });

            // removing content, if the row was cloned from a reference row
            if (useReferenceRow) {
                // iterating over all new cells and remove all paragraphs in the cells
                implDeleteCellRange(tablePos, [referencerow + 1, 0], [referencerow + count, row.children().length - 1]);
            }

            // Setting cursor
            if ((insertdefaultcells) || (useReferenceRow)) {
                localPosition.push(0);
                localPosition.push(0);
                localPosition.push(0);

                lastOperationEnd = new OXOPaM(localPosition);
            }
        }

        function implInsertCell(pos, count, attrs) {

            var localPosition = _.copy(pos, true);

            if (! Position.isPositionInTable(paragraphs, localPosition)) {
                return;
            }

            if (!_.isNumber(count)) {
                count = 1; // setting default for number of rows
            }

            var tableCellDomPos = Position.getDOMPosition(paragraphs, localPosition),
                tableCellNode = null;

            if (tableCellDomPos) {
                tableCellNode = tableCellDomPos.node;
            }

            // prototype elements for row, cell, and paragraph
            var paragraph = DOM.createParagraphNode(),
                cell = $('<td>').append(paragraph);

            // apply the passed table attributes
            tableCellStyles.setElementAttributes(cell, attrs);

            // insert empty text node into the paragraph
            validateParagraphNode(paragraph);

            if (tableCellNode) {
                _.times(count, function () { $(tableCellNode).before(cell.clone(true)); });
            } else {
                var rowPos = _.copy(localPosition, true);
                rowPos.pop();
                var row = Position.getDOMPosition(paragraphs, rowPos).node;
                _.times(count, function () { $(row).append(cell.clone(true)); });
            }

        }

        function implDeleteCells(pos, start, end) {

            var localPosition = _.copy(pos, true);

            if (! Position.isPositionInTable(paragraphs, localPosition)) {
                return;
            }

            var tableRowDomPos = Position.getDOMPosition(paragraphs, localPosition),
                removedRow = false,
                row = null;

            if (tableRowDomPos) {
                row = tableRowDomPos.node;
            }

            if (row) {

                var maxCell = $(row).children().length - 1;

                if (start <= maxCell) {

                    if (end > maxCell) {
                        $(row).children().slice(start).remove(); // removing all following cells
                    } else {
                        $(row).children().slice(start, end + 1).remove();
                    }
                }
            }

            // setting cursor position
            if (removedRow) {
                var rowCount = localPosition.pop();
                if (rowCount > 0) {
                    rowCount--;
                }
                localPosition.push(rowCount);

            } else {
                localPosition.push(0);
                localPosition.push(0);
                localPosition.push(0);
            }

            lastOperationEnd = new OXOPaM(localPosition);
        }

        function implDeleteColumns(pos, startGrid, endGrid) {

            var localPosition = _.copy(pos, true);

            if (! Position.isPositionInTable(paragraphs, localPosition)) {
                return;
            }

            var table = Position.getDOMPosition(paragraphs, localPosition).node,
                allRows = $(table).children('tbody, thead').children(),
                endColInFirstRow = -1;

            allRows.each(
                function (i, row) {
                    var startCol = Table.getCellPositionFromGridPosition(row, startGrid, false),
                        endCol = Table.getCellPositionFromGridPosition(row, endGrid, false);

                    if ((i === 0) && (endCol !== -1)) {
                        endColInFirstRow = endCol;
                    }

                    if (startCol !== -1) {  // do nothing if startCol is out of range for this row

                        if (endCol === -1) {
                            $(row).children().slice(startCol).remove(); // removing all following cells
                        } else {
                            $(row).children().slice(startCol, endCol + 1).remove();
                        }
                    }
                }
            );

            if ($(table).children('tbody, thead').children().children().length === 0) {   // no more columns
                // This code should never be reached. If last column shall be deleted, deleteTable is called.
                $(table).remove();
                paragraphs = editdiv.children();
                localPosition.push(0);
            } else {
                // Setting cursor
                var lastColInFirstRow = $(table).children('tbody, thead').children().first().children().length - 1;
                if ((endColInFirstRow > lastColInFirstRow) || (endColInFirstRow === -1)) {
                    endColInFirstRow = lastColInFirstRow;
                }
                localPosition.push(0);
                localPosition.push(endColInFirstRow);
                localPosition.push(0);
                localPosition.push(0);
            }

            lastOperationEnd = new OXOPaM(localPosition);
        }

        function implInsertColumn(pos, gridposition, tablegrid, insertmode) {

            var localPosition = _.copy(pos, true);

            if (! Position.isPositionInTable(paragraphs, localPosition)) {
                return;
            }

            var table = Position.getDOMPosition(paragraphs, localPosition).node,
                allRows = $(table).children('tbody, thead').children(),
                // prototype elements for cell and paragraph
                paragraph = DOM.createParagraphNode(),
                cell = $('<td>').append(paragraph);

            // insert empty text node into the paragraph
            validateParagraphNode(paragraph);

            allRows.each(
                function (i, row) {
                    var cellClone = cell.clone(true),
                        cellPosition = Table.getCellPositionFromGridPosition(row, gridposition);
                    if (insertmode === 'behind') {
                        cellClone.insertAfter($(row).children().get(cellPosition));
                    } else {
                        cellClone.insertBefore($(row).children().get(cellPosition));
                    }
                }
            );

            // Setting cursor to first position in table
            localPosition.push(0);
            localPosition.push(gridposition);
            localPosition.push(0);
            localPosition.push(0);

            lastOperationEnd = new OXOPaM(localPosition);
        }

        function implDeleteText(startPosition, endPosition) {

            if (! endPosition) {  // operation.end is optional
                endPosition = _.copy(startPosition, true);
            }

            var lastValue = startPosition.length - 1,
                start = startPosition[lastValue],
                end = endPosition[lastValue];

            if (end === -1) {
                end = Position.getParagraphLength(paragraphs, startPosition);
            }

            end += 1; // switching from operation mode to range mode

            if (start === end) {
                return;
            }

            var paragraph = Position.getCurrentParagraph(paragraphs, startPosition);
            var searchNodes = $(paragraph).children('span, div.object').get();
            var node, nodeLen, delStart, delEnd;
            var nodes = searchNodes.length;
            var nodeStart = 0;
            for (var i = 0; i < nodes; i++) {
                var isImage = false,
                    isField = false,
                    text = '';
                node = searchNodes[i];
                if (DOM.isImageNode(node)) {
                    nodeLen = 1;
                    isImage = true;
                } else if (DOM.isFieldSpan(node)) {
                    nodeLen = 1;
                    isField = true;
                } else if (DOM.isPortionSpan(node)) {
                    text = $(node).text();
                    nodeLen = text.length;
                } else {
                    Utils.warn('Editor.implDeleteText(): unexpected node in paragraph');
                    nodeLen = 0;
                }
                if ((nodeStart + nodeLen) > start) {
                    delStart = 0;
                    delEnd = nodeLen;
                    if (nodeStart <= start) { // node matching startPaM
                        delStart = start - nodeStart;
                    }
                    if ((nodeStart + nodeLen) >= end) { // node matching endPaM
                        delEnd = end - nodeStart;
                    }
                    if ((delEnd - delStart) === nodeLen) {
                        // remove element completely.
                        if (isImage || isField) {
                            paragraph.removeChild(node);
                        } else {
                            // clear simple text span but do not remove it from the DOM
                            $(node).text('');
                        }
                    }
                    else {
                        text = text.slice(0, delStart) + text.slice(delEnd);
                        $(node).text(text);
                    }
                }
                nodeStart += nodeLen;
                if (nodeStart >= end)
                    break;
            }

            lastOperationEnd = new OXOPaM(_.copy(startPosition, true));
            // old:  lastOperationEnd = new OXOPaM([para, start]);

            implParagraphChanged(startPosition);
        }

        function implMove(_source, _dest) {

            var source = _.copy(_source, true),
                dest = _.copy(_dest, true),
                useObjectNode = true,
                sourcePos = Position.getDOMPosition(paragraphs, source, useObjectNode),
                destPos = Position.getDOMPosition(paragraphs, dest, useObjectNode),
                insertBefore = true,
                splitNode = false;

            if (destPos.offset === 0) {
                insertBefore = true;
            } else if ((destPos.node.length) && (destPos.offset === (destPos.node.length - 1))) {
                insertBefore = false;
            } else if ((DOM.isImageNode(destPos.node)) && (destPos.offset === 1)) {
                insertBefore = false;
            } else {
                splitNode = true;  // splitting node is required
                insertBefore = false;  // inserting after new created text node
            }

            if ((sourcePos) && (destPos)) {

                var sourceNode = sourcePos.node,
                    destNode = destPos.node,
                    useImageDiv = true,
                    imagePosDiv = sourceNode.previousSibling,
                    doMove = true;

                if ((sourceNode) && (destNode)) {

                    if (! DOM.isImageNode(sourceNode)) {
                        doMove = false; // supporting only images at the moment
                        Utils.warn('Editor.implMove(): moved object is not an image div: ' + Utils.getNodeName(sourceNode));
                    } else {
                        // moving also the divs belonging to images
                        if ((! imagePosDiv) || (! DOM.isOffsetNode(imagePosDiv))) {
                            imagePosDiv = false; // should never be reached
                        }
                    }

                    if (doMove) {

                        if (splitNode) {
                            var newTextNode = DOM.splitTextNode(destNode, destPos.offset + 1);
                            destNode = newTextNode.parentNode;
                        } else {
                            if (destNode.nodeType === 3) {
                                destNode = destNode.parentNode;
                            }
                        }

                        // there can be empty text spans before the destination node
                        if (DOM.isTextSpan(destNode)) {
                            while (destNode.previousSibling && DOM.isEmptySpan(destNode.previousSibling)) {
                                destNode = destNode.previousSibling;
                            }
                        }

                        if (insertBefore) {
                            $(sourceNode).insertBefore(destNode);
                        } else {
                            $(sourceNode).insertAfter(destNode);
                        }

                        // moving also the corresponding div before the moved image
                        if (useImageDiv) {
                            $(imagePosDiv).insertBefore(sourceNode);
                        }
                    }
                }
            }
        }

        function implMergeCell(cellposition, count) {

            var rowPosition = _.copy(cellposition, true),
                localStartCol = rowPosition.pop(),
                localEndCol = localStartCol + count,
                // Counting the colSpan off all cells in the range
                row = Position.getDOMPosition(paragraphs, rowPosition).node,
                allSelectedCells = $(row).children().slice(localStartCol, localEndCol + 1),
                colSpanSum = Table.getColSpanSum(allSelectedCells),
                // Shifting the content of all following cells to the first cell
                targetCell = $(row).children().slice(localStartCol, localStartCol + 1),
                sourceCells = $(row).children().slice(localStartCol + 1, localEndCol + 1);

            Table.shiftCellContent(targetCell, sourceCells);

            sourceCells.remove();

            // apply the passed table attributes
            tableCellStyles.setElementAttributes(targetCell, { 'gridspan' : colSpanSum });
        }

        function implDbgOutEvent(event) {

            if (!dbgoutEvents)
                return;

            var selection = getSelection();

            var dbg = fillstr(event.type, 10, ' ', true) + ' sel:[' + getFormattedPositionString(selection.startPaM.oxoPosition) + '/' + getFormattedPositionString(selection.endPaM.oxoPosition) + ']';

            if ((event.type === 'keypress') || (event.type === 'keydown')) {
                dbg += ' key:[keyCode=' + fillstr(event.keyCode.toString(), 3, '0') + ' charCode=' + fillstr(event.charCode.toString(), 3, '0') + ' shift=' + event.shiftKey + ' ctrl=' + event.ctrlKey + ' alt=' + event.altKey + ']';
            }

            window.console.log(dbg);
        }

        function implDbgOutObject(obj) {

            if (!dbgoutObjects)
                return;

            var dbg = fillstr(obj.type + ': ', 10, ' ', true) + JSON.stringify(obj.value);
            window.console.log(dbg);
        }

        // hybrid edit mode
        editdiv
            .on('focus', function () { processFocus(true); })
            .on('blur', function () { processFocus(false); })
            .on('keydown', processKeyDown)
            .on('keypress', processKeyPressed)
            .on('mousedown', processMouseDown)
            .on('mouseup', processMouseUp)
            .on('dragstart dragover drop contextmenu cut paste', false);

    } // class Editor

    // exports ================================================================

    return Editor;
});
