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
 * @author Carsten Driesner <carsten.driesner@open-xchange.com>
 * @author Oliver Specht <oliver.specht@open-xchange.com>
 */

define('io.ox/office/editor/editor',
    ['io.ox/core/event',
     'io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/selection',
     'io.ox/office/editor/table',
     'io.ox/office/editor/image',
     'io.ox/office/editor/hyperlink',
     'io.ox/office/editor/operations',
     'io.ox/office/editor/position',
     'io.ox/office/editor/undo',
     'io.ox/office/editor/format/stylesheets',
     'io.ox/office/editor/format/characterstyles',
     'io.ox/office/editor/format/documentstyles',
     'io.ox/office/editor/format/lineheight',
     'io.ox/office/editor/format/color',
     'io.ox/office/tk/alert',
     'gettext!io.ox/office/main'
    ], function (Events, Utils, DOM, Selection, Table, Image, Hyperlink, Operations, Position, UndoManager, StyleSheets, CharacterStyles, DocumentStyles, LineHeight, Color, Alert, gt) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // key codes of keys that change the text cursor position backwards
        BACKWARD_CURSOR_KEYS = _([ KeyCodes.PAGE_UP, KeyCodes.HOME, KeyCodes.LEFT_ARROW, KeyCodes.UP_ARROW ]),

        // key codes of keys that change the text cursor position forwards
        FORWARD_CURSOR_KEYS = _([ KeyCodes.PAGE_DOWN, KeyCodes.END, KeyCodes.RIGHT_ARROW, KeyCodes.DOWN_ARROW ]),

        // key codes of keys that will be passed directly to the browser
        IGNORABLE_KEYS = _([
            KeyCodes.SHIFT, KeyCodes.CONTROL, KeyCodes.ALT, KeyCodes.BREAK,
            KeyCodes.CAPS_LOCK, KeyCodes.PRINT, KeyCodes.SELECT,
            KeyCodes.LEFT_WINDOWS, KeyCodes.RIGHT_WINDOWS,
            KeyCodes.NUM_LOCK, KeyCodes.SCROLL_LOCK,
            KeyCodes.F5
        ]),

        // style attributes for heading 1 -6 based on latent styles
        HEADINGS_CHARATTRIBUTES = [
            { color: { type: 'scheme', value: 'accent1', transformations: [{ type: 'shade', value: 74902 }]}, bold: true, fontsize: 14 },
            { color: { type: 'scheme', value: 'accent1'}, bold: true, fontsize: 13 },
            { color: { type: 'scheme', value: 'accent1'}, bold: true },
            { color: { type: 'scheme', value: 'accent1'}, bold: true, italic: true },
            { color: { type: 'scheme', value: 'accent1', transformations: [{ type: 'shade', value: 49804 }]} },
            { color: { type: 'scheme', value: 'accent1', transformations: [{ type: 'shade', value: 49804 }]}, italic: true }
        ],

        DEFAULT_PARAGRAPH_DEFINTIONS = { 'default': true, styleid: 'Standard', stylename: 'Normal' },

        // style attributes for lateral table style
        DEFAULT_LATERAL_TABLE_DEFINITIONS = { 'default': true, styleid: 'TableGrid', stylename: 'Table Grid', uipriority: 59 },
        DEFAULT_LATERAL_TABLE_ATTRIBUTES =
        {
            wholetable: {
                paragraph: { lineheight: { type: 'percent', value: 100 }},
                table:
                {
                    bordertop:     { color: Color.AUTO, width: 17, style: 'single' },
                    borderbottom:  { color: Color.AUTO, width: 17, style: 'single' },
                    borderinsideh: { color: Color.AUTO, width: 17, style: 'single' },
                    borderinsidev: { color: Color.AUTO, width: 17, style: 'single' },
                    borderleft:    { color: Color.AUTO, width: 17, style: 'single' },
                    borderright:   { color: Color.AUTO, width: 17, style: 'single' }
                }
            }
        },

        DEFAULT_HYPERLINK_DEFINTIONS = { 'default': false, styleid: 'Hyperlink', stylename: 'Hyperlink', uipriority: 99 },
        DEFAULT_HYPERLINK_CHARATTRIBUTES = { color: { type: 'scheme', value: 'hyperlink' }, underline: true };

    // private global functions ===============================================

    /**
     * Returns whether the passed key code is a cursor navigation key that
     * moves the cursor backwards in the document.
     */
    function isBackwardCursorKey(keyCode) {
        return BACKWARD_CURSOR_KEYS.contains(keyCode);
    }

    /**
     * Returns whether the passed key code is a cursor navigation key that
     * moves the cursor forwards in the document.
     */
    function isForwardCursorKey(keyCode) {
        return FORWARD_CURSOR_KEYS.contains(keyCode);
    }

    /**
     * Returns true, if the passed keyboard event is an event that moves the
     * text cursor.
     *
     * @param event
     *  A jQuery keyboard event object.
     */
    function isCursorKeyEvent(event) {
        return event && (isBackwardCursorKey(event.keyCode) || isForwardCursorKey(event.keyCode));
    }

    /**
     * Returns true, if the passed keyboard event must be ignored and passed
     * directly to the browser.
     *
     * @param event
     *  A jQuery keyboard event object.
     */
    function isIgnorableKeyEvent(event) {
        return event && IGNORABLE_KEYS.contains(event.keyCode);
    }

    /**
     * Returns true, if the passed keyboard event is ctrl+v or meta+v.
     *
     * @param event
     *  A jQuery keyboard event object.
     */
    function isPasteKeyEvent(event) {
        return ((event.metaKey || event.ctrlKey) && !event.altKey && (event.charCode === 118 || event.keyCode === 86));
    }

    /**
     * Returns true, if the passed keyboard event is ctrl+c or meta+c.
     *
     * @param event
     *  A jQuery keyboard event object.
     */
    function isCopyKeyEvent(event) {
        return ((event.metaKey || event.ctrlKey) && !event.altKey && (event.charCode === 99 || event.keyCode === 67));
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

    // class Editor ===========================================================

    /**
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

            // the root element for the document contents
            editdiv = DOM.createPageNode().attr('contenteditable', true).addClass('user-select-text'),

            // deferred methods that will be executed in a browser timeout
            deferredMethods = new Utils.DeferredMethods(this),

            // the logical selection, synchronizes with browser DOM selection
            selection = new Selection(editdiv),

            // maps all operation handler functions to the operation names
            operationHandlers = {},

            // list of operations
            operations = [],

            //undo manager collection undo and redo operations
            undoManager = new UndoManager(this),

            // internal clipboard
            clipboardOperations = [],

            // container for all style sheets of all attribute families
            documentStyles = new DocumentStyles(editdiv),

            // shortcuts for style sheet containers
            characterStyles = documentStyles.getStyleSheets('character'),
            paragraphStyles = documentStyles.getStyleSheets('paragraph'),
            tableStyles = documentStyles.getStyleSheets('table'),
            tableRowStyles = documentStyles.getStyleSheets('row'),
            tableCellStyles = documentStyles.getStyleSheets('cell'),
            drawingStyles = documentStyles.getStyleSheets('drawing'),
            pageStyles = documentStyles.getStyleSheets('page'),
            lists = documentStyles.getLists(),

            // attributes that were set without a selection and are only set for a single character
            preselectedAttributes = {},

            // all text spans that are highlighted (for quick removal)
            highlightedSpans = [],

            focused = false,

            lastKeyDownEvent,

            lastOperationEnd,     // Need to decide: Should the last operation modify this member, or should the selection be passed up the whole call chain?!

            blockOperations = false,

            // set document into write protected mode
            // can be null, false and true
            // init with null for 'read only' and mode not yet determined by the server
            editMode = null,

            // name of the user that currently has the edit rigths
            editUser = '',

            dbgoutEvents = false;

        // private methods ----------------------------------------------------

        // methods ------------------------------------------------------------

        /**
         * Returns the root DOM element representing this editor.
         */
        this.getNode = function () {
            return editdiv;
        };

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
                selection.selectTopPosition();
            }
        };

        /**
         * Destroys the editor object.
         */
        this.destroy = function () {
            this.events.destroy();
            deferredMethods.destroy();
            selection.destroy();
            documentStyles.destroy();
            // remove root node from DOM, this unbinds all event handlers (also of descendant nodes)
            editdiv.remove();
            deferredMethods = selection = documentStyles = null;
        };

        // undo/redo ----------------------------------------------------------

        this.enableUndo = function (enable) {
            undoManager.enable(enable);
        };

        this.undoAvailable = function () {
            return undoManager.undoAvailable();
        };

        this.undo = function (count) {
            undoManager.undo(count);
            selection.setTextSelection(lastOperationEnd);
        };

        this.redoAvailable = function () {
            return undoManager.redoAvailable();
        };

        this.redo = function (count) {
            undoManager.redo(count);
            selection.setTextSelection(lastOperationEnd);
        };

        // operations API -----------------------------------------------------

        this.clearOperations = function () {
            operations = [];
        };

        this.getOperations = function () {
            return operations;
        };

        /**
         * Central dispatcher function for operations.
         *
         * @param {Array} operations
         *  An array with operation to be applied.
         *
         * @param {Object} [options]
         *  A map with options to control the behavior of this method. The
         *  following options are supported:
         *  @param {Boolean} [options.silent=false]
         *      If set to true, the operation will be applied silently: No undo
         *      action will be generated, and no operation listeners will be
         *      notified.
         */
        this.applyOperations = function (operations, options) {
            _(operations).each(function (operation) {
                applyOperation(operation, options);
            });
        };

        /**
         * Copies the current selection into the internal clipboard and deletes
         * the selection.
         */
        this.cut = function () {

            // copy current selection to clipboard
            this.copy();

            // delete current selection
            this.deleteSelected();
        };

        /**
         * Generates operations needed to copy the current text selection to
         * the internal clipboard.
         *
         * @returns {Array}
         *  The operations array that represents the current selection.
         */
        function copyTextSelection() {

            var // the operations generator
                generator = new Operations.Generator(),
                // zero-based index of the current content node
                targetPosition = 0,
                // result of the iteration process
                result = null;

            // visit the paragraphs and tables covered by the text selection
            result = selection.iterateContentNodes(function (contentNode, position, startOffset, endOffset) {

                // paragraphs may be covered partly
                if (DOM.isParagraphNode(contentNode)) {

                    // first or last paragraph: generate operations for covered text components
                    if (_.isNumber(startOffset) || _.isNumber(endOffset)) {

                        // generate a splitParagraph and setAttributes operation for
                        // contents of first paragraph (but for multiple-paragraph
                        // selections only)
                        if (!_.isNumber(endOffset)) {
                            generator.generateOperation(Operations.PARA_SPLIT, { start: [targetPosition, 0] });
                            generator.generateOperation(Operations.ATTRS_CLEAR, [targetPosition]);
                            generator.generateSetAttributesOperation(contentNode, [targetPosition]);
                        }

                        // operations for the text contents covered by the selection
                        generator.generateParagraphChildOperations(contentNode, [targetPosition], { start: startOffset, end: endOffset, targetOffset: 0, clear: true });

                    } else {
                        // generate operations for entire paragraph
                        generator.generateParagraphOperations(contentNode, [targetPosition]);
                    }

                // entire table: generate complete operations array for the table
                } else if (DOM.isTableNode(contentNode)) {
                    generator.generateTableOperations(contentNode, [targetPosition]);

                } else {
                    Utils.error('Editor.copyTextSelection(): unknown content node "' + Utils.getNodeName(contentNode) + '" at position ' + JSON.stringify(position));
                    return Utils.BREAK;
                }

                targetPosition += 1;

            }, this, { shortestPath: true });

            // return operations, if iteration has not stopped on error
            return (result === Utils.BREAK) ? [] : generator.getOperations();
        }

        /**
         * Generates operations needed to copy the current cell range selection
         * to the internal clipboard.
         *
         * @returns {Array}
         *  The operations array that represents the current selection.
         */
        function copyCellRangeSelection() {

            var // the operations generator
                generator = new Operations.Generator(),
                // information about the cell range
                cellRangeInfo = selection.getSelectedCellRange(),
                // explicit table attributes
                tableAttributes = null,
                // all rows in the table
                tableRowNodes = null,
                // relative row offset of last visited cell
                lastRow = -1,
                // result of the iteration process
                result = null;

            // generates operations for missing rows and cells, according to lastRow/lastCol
            function generateMissingRowsAndCells(row, col) {

                // generate new rows (repeatedly, a row may be covered completely by merged cells)
                while (lastRow < row) {
                    lastRow += 1;
                    generator.generateOperationWithAttributes(tableRowNodes[lastRow], Operations.ROW_INSERT, { position: [1, lastRow], count: 1, insertdefaultcells: false });
                }

                // TODO: detect missing cells, which are covered by merged cells outside of the cell range
                // (but do not generate cells covered by merged cells INSIDE the cell range)
            }

            if (!cellRangeInfo) {
                Utils.error('Editor.copyCellRangeSelection(): invalid cell range selection');
                return [];
            }

            // split the paragraph to insert the new table between the text portions
            generator.generateOperation(Operations.PARA_SPLIT, { start: [0, 0] });

            // generate the operation to create the new table
            tableAttributes = StyleSheets.getExplicitAttributes(cellRangeInfo.tableNode);
            tableAttributes.tablegrid = tableStyles.getElementAttributes(cellRangeInfo.tableNode).tablegrid.slice(cellRangeInfo.firstCellPosition[1], cellRangeInfo.lastCellPosition[1] + 1);
            generator.generateOperation(Operations.TABLE_INSERT, { position: [1], attrs: tableAttributes });

            // all covered rows in the table
            tableRowNodes = DOM.getTableRows(cellRangeInfo.tableNode).slice(cellRangeInfo.firstCellPosition[0], cellRangeInfo.lastCellPosition[0] + 1);

            // visit the cell nodes covered by the selection
            result = selection.iterateTableCells(function (cellNode, position, row, col) {

                // generate operations for new rows, and for cells covered by merged cells outside the range
                generateMissingRowsAndCells(row, col);

                // generate operations for the cell
                generator.generateTableCellOperations(cellNode, [1, row, col]);
            });

            // missing rows at bottom of range, covered completely by merged cells
            generateMissingRowsAndCells(cellRangeInfo.lastCellPosition[0], cellRangeInfo.lastCellPosition[1] + 1);

            // return operations, if iteration has not stopped on error
            return (result === Utils.BREAK) ? [] : generator.getOperations();
        }

        /**
         * Copies the current selection into the internal clipboard.
         */
        this.copy = function () {

            switch (selection.getSelectionType()) {

            case 'text':
            case 'drawing':
                clipboardOperations = copyTextSelection();
                break;

            case 'cell':
                clipboardOperations = copyCellRangeSelection();
                break;

            default:
                Utils.error('Editor.copy(): unsupported selection type: ' + selection.getSelectionType());
            }
        };

        /**
         * Returns whether the internal clipboard contains operations.
         */
        this.hasInternalClipboard = function () {
            return clipboardOperations.length > 0;
        };

        /**
         * Deletes the current selection and pastes the internal clipboard to
         * the resulting cursor position.
         */
        this.pasteInternalClipboard = function () {

            // check if clipboard contains something
            if (!this.hasInternalClipboard()) { return; }

            // group all executed operations into a single undo action
            undoManager.enterGroup(function () {

                var // target position to paste the clipboard contents to
                    anchorPosition = null,
                    // the generated paste operations with transformed positions
                    operations = null;

                // transforms a position being relative to [0,0] to a position relative to anchorPosition
                function transformPosition(position) {

                    var // the resulting position
                        resultPosition = null;

                    if ((position[0] === 0) && (position.length === 2)) {
                        // adjust text offset for first paragraph
                        resultPosition = anchorPosition.slice(0, -1);
                        resultPosition.push(_.last(anchorPosition) + position[1]);
                    } else {
                        // adjust paragraph offset for following paragraphs
                        resultPosition = anchorPosition.slice(0, -2);
                        resultPosition.push(anchorPosition[anchorPosition.length - 2] + position[0]);
                        resultPosition = resultPosition.concat(position.slice(1));
                    }

                    return resultPosition;
                }

                // transforms the passed operation relative to anchorPosition
                function transformOperation(operation) {

                    // clone the operation to transform the positions (no deep clone,
                    // as the position arrays will be recreated, not modified inplace)
                    operation = _.clone(operation);

                    // transform position of operation
                    // TODO: need reliable way to get the position attributes
                    if (_.isArray(operation.position)) {
                        operation.position = transformPosition(operation.position);
                    } else if (_.isArray(operation.start)) {
                        // ignore 'start' when 'position' exists, start may exist but is relative to position then
                        operation.start = transformPosition(operation.start);
                        // attribute 'end' only with attribute 'start'
                        if (_.isArray(operation.end)) {
                            operation.end = transformPosition(operation.end);
                        }
                    }

                    var text = '  name="' + operation.name + '", attrs=';
                    var op = _.clone(operation);
                    delete op.name;
                    Utils.log(text + JSON.stringify(op));

                    return operation;
                }

                // delete current selection
                this.deleteSelected();

                // paste clipboard to current cursor position
                anchorPosition = selection.getStartPosition();
                if (anchorPosition.length >= 2) {
                    Utils.info('Editor.pasteInternalClipboard()');
                    operations = _(clipboardOperations).map(transformOperation);
                    this.applyOperations(operations);
                } else {
                    Utils.warn('Editor.pasteInternalClipboard(): invalid cursor position');
                }

            }, this);
        };

        this.paste = function (event) {

            var clipboard,
                items = event && event.originalEvent && event.originalEvent.clipboardData && event.originalEvent.clipboardData.items,
                reader,
                eventHasImageData = false;

            // handles the result of reading file data from the file blob received from the clipboard data api
            function onLoadHandler(evt) {
                var data = evt && evt.target && evt.target.result;

                if (data) {
                    createOperationsFromTextClipboard([{operation: Operations.DRAWING_INSERT, data: data, depth: 0}]);
                }
            }

            // Chrome doesn't paste images into a (content editable) div, but supports a clipboard data api
            // check if the event has clipboardData with images
            _.each(items, function (item) {
                // look for image items
                if (item.type.indexOf('image') !== -1) {
                    var file = item.getAsFile();
                    eventHasImageData = true;

                    reader = new FileReader();
                    reader.onload = onLoadHandler;
                    reader.readAsDataURL(file);
                }
            }, self);

            // if the image data could be read from the event data, don't paste into the clipboard div
            if (eventHasImageData) {
                // prevent default paste handling of the browser
                event.preventDefault();
                return;
            }

            // append the clipboard div to the body and place the cursor into it
            clipboard = $('<div>', { contenteditable: true }).addClass('io-ox-office-clipboard user-select-text');
            $('body').append(clipboard);

            // focus and select the clipboard container node
            clipboard.focus();
            DOM.setBrowserSelection(DOM.Range.createRange(clipboard, 0));

            // read pasted data
            _.delay(function () {

                var clipboardData = parseClipboard(clipboard);

                // restore browser selection and remove the clipboard container node
                selection.restoreBrowserSelection();
                clipboard.remove();

                createOperationsFromTextClipboard(clipboardData);

            }, 0, clipboard, selection);
        };

        // ==================================================================
        // HIGH LEVEL EDITOR API which finally results in Operations
        // and creates Undo Actions.
        // Public functions, that are called from outside the editor
        // and generate operations.
        // ==================================================================

        this.initDocument = function () {
            var newOperation = { name: 'initDocument' };
            applyOperation(newOperation);
        };

        /**
         * Returns whether the document contains any highlighted ranges.
         */
        this.hasHighlighting = function () {
            return highlightedSpans.length > 0;
        };

        /**
         * Removes all highlighting (e.g. from quick-search) from the document.
         */
        this.removeHighlighting = function () {

            // remove highlighting and merge sibling text spans
            _(highlightedSpans).each(function (span) {
                characterStyles.setElementAttributes(span, { highlight: null }, { special: true });
                CharacterStyles.mergeSiblingTextSpans(span);
                CharacterStyles.mergeSiblingTextSpans(span, true);
            });
            highlightedSpans = [];

            // fade in entire document
            editdiv.removeClass('highlight');
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
            if (!_.isString(query) || (query.length === 0)) {
                return false;
            }
            query = query.toLowerCase();

            // search in all paragraph nodes (also embedded in tables etc.)
            Utils.iterateSelectedDescendantNodes(editdiv, DOM.PARAGRAPH_NODE_SELECTOR, function (paragraph) {

                var // all text spans in the paragraph, as array
                    textSpans = [],
                    // the concatenated text from all text spans
                    elementText = '',
                    // all matching ranges of the query text in the complete paragraph text
                    matchingRanges = [], start = 0,
                    // information about a text span while iterating matching ranges
                    spanInfo = { index: 0, start: 0 };

                // adds information of the text span located at 'spanInfo.index' in the 'textSpans' array to 'spanInfo'
                function getTextSpanInfo() {
                    spanInfo.span = textSpans[spanInfo.index];
                    spanInfo.length = spanInfo.span ? spanInfo.span.firstChild.nodeValue.length : 0;
                }

                // goes to the next text span in the 'textSpans' array and updates all information in 'spanInfo'
                function getNextTextSpanInfo() {
                    spanInfo.index += 1;
                    spanInfo.start += spanInfo.length;
                    getTextSpanInfo();
                }

                // collect all non-empty text spans in the paragraph
                Position.iterateParagraphChildNodes(paragraph, function (node) {
                    // DOM.iterateTextSpans() skips drawing nodes
                    DOM.iterateTextSpans(node, function (span) {
                        textSpans.push(span);
                        elementText += span.firstChild.nodeValue;
                    }, this);
                }, this, { allNodes: true });

                // replace all whitespace characters, and convert to lower case
                // for case-insensitive matching
                elementText = elementText.replace(/\s/g, ' ').toLowerCase();

                // find all occurrences of the query text in the paragraph text
                while ((start = elementText.indexOf(query, start)) >= 0) {
                    // try to merge with last offset range
                    if ((matchingRanges.length > 0) && (_(matchingRanges).last().end >= start)) {
                        _(matchingRanges).last().end = start + query.length;
                    } else {
                        matchingRanges.push({ start: start, end: start + query.length });
                    }
                    // continue at next character (occurrences of the query text may overlap)
                    start += 1;
                }

                // set highlighting to all occurrences
                getTextSpanInfo();
                _(matchingRanges).each(function (range) {

                    // find first text span that contains text from current matching range
                    while (spanInfo.start + spanInfo.length <= range.start) {
                        getNextTextSpanInfo();
                    }

                    // process all text spans covered by the current matching range
                    while (spanInfo.start < range.end) {

                        // split beginning of text span not covered by the range
                        if (spanInfo.start < range.start) {
                            DOM.splitTextSpan(spanInfo.span, range.start - spanInfo.start);
                            // update spanInfo
                            spanInfo.length -= (range.start - spanInfo.start);
                            spanInfo.start = range.start;
                        }

                        // split end of text span NOT covered by the range
                        if (range.end < spanInfo.start + spanInfo.length) {
                            var newSpan = DOM.splitTextSpan(spanInfo.span, range.end - spanInfo.start, { append: true });
                            // insert the new span into textSpans after the current span
                            textSpans.splice(spanInfo.index + 1, 0, newSpan[0]);
                            // update spanInfo
                            spanInfo.length = range.end - spanInfo.start;
                        }

                        // set highlighting to resulting text span and store it in the global list
                        characterStyles.setElementAttributes(spanInfo.span, { highlight: true }, { special: true });
                        highlightedSpans.push(spanInfo.span);

                        // go to next text span
                        getNextTextSpanInfo();
                    }

                }, this);

                // exit at a certain number of found ranges (for performance)
                if (highlightedSpans.length >= 100) {
                    return Utils.BREAK;
                }

            }, this);

            if (highlightedSpans.length > 0) {
                // fade out entire document
                editdiv.addClass('highlight');
                // make first highlighted text node visible
                Utils.scrollToChildNode(editdiv.parent(), highlightedSpans[0], { padding: 30 });
            }

            // return whether any text in the document matches the passed query text
            return this.hasHighlighting();
        };

        /**
         * Generates the operations that will delete the current selection, and
         * executes the operations.
         */
        this.deleteSelected = function () {

            if (!selection.hasRange()) { return; }

            undoManager.enterGroup(function () {

                var // the operations generator
                    generator = new Operations.Generator(),
                    // the position of the first and last partially covered paragraph
                    firstPosition = null, lastPosition = null;

                // visit all content nodes (tables, paragraphs) in the selection
                selection.iterateContentNodes(function (node, position, startOffset, endOffset, parentCovered) {

                    var // whether the node is the last child of its parent
                        isLastChild = node === node.parentNode.lastChild;

                    if (DOM.isParagraphNode(node)) {

                        // remember first and last paragraph
                        if (!firstPosition) { firstPosition = position; }
                        lastPosition = position;

                        // do not delete the paragraph node, if it is only covered partially;
                        // or if it is the last paragraph when the parent container is cleared completely
                        if (parentCovered ? isLastChild : (_.isNumber(startOffset) || _.isNumber(endOffset))) {

                            // 'deleteText' operation needs valid start and end position
                            startOffset = _.isNumber(startOffset) ? startOffset : 0;
                            endOffset = _.isNumber(endOffset) ? endOffset : (Position.getParagraphLength(editdiv, position) - 1);

                            // delete the covered part of the paragraph
                            if (startOffset <= endOffset) {
                                generator.generateOperation(Operations.TEXT_DELETE, { start: position.concat([startOffset]), end: position.concat([endOffset]) });
                            }
                        } else {
                            generator.generateOperation(Operations.PARA_DELETE, { start: position });
                        }

                    } else if (DOM.isTableNode(node)) {
                        // delete entire table
                        generator.generateOperation(Operations.TABLE_DELETE, { start: position });
                    } else {
                        Utils.error('Editor.deleteSelected(): unsupported content node');
                        return Utils.BREAK;
                    }

                }, this, { shortestPath: true });

                // operations MUST be executed in reverse order to preserve the positions
                generator.reverseOperations();

                // generate a final 'mergeParagraph' operation for the first paragraph
                // which will be merged with the remaining part of the last paragraph
                // but only, if paragraphs are different but in the same parent container
                if (firstPosition && lastPosition && Position.hasSameParentComponent(firstPosition, lastPosition) && (_.last(firstPosition) !== _.last(lastPosition))) {
                    generator.generateOperation(Operations.PARA_MERGE, { start: firstPosition });
                }

                // apply the operations
                this.applyOperations(generator.getOperations());

            }, this);
        };

        this.deleteText = function (startposition, endposition) {
            if (startposition !== endposition) {

                var _endPosition = _.copy(endposition, true);
                if (_endPosition[_endPosition.length - 1] > 0) {
                    _endPosition[_endPosition.length - 1] -= 1;  // switching from range mode to operation mode
                }

                var newOperation = { name: Operations.TEXT_DELETE, start: startposition, end: _endPosition };
                // var newOperation = { name: Operations.TEXT_DELETE, start: startposition, end: endposition };
                applyOperation(newOperation);
                // setting the cursor position
                selection.setTextSelection(lastOperationEnd);
            }
        };

        this.deleteParagraph = function (position) {
            applyOperation({ name: Operations.PARA_DELETE, start: _.clone(position) });
        };

        this.deleteTable = function (position) {
            applyOperation({ name: Operations.TABLE_DELETE, start: _.clone(position) });

            // setting the cursor position
            selection.setTextSelection(lastOperationEnd);
        };

        this.deleteRows = function () {
            var position = selection.getStartPosition(),
                start = Position.getRowIndexInTable(editdiv, position),
                end = start;

            if (selection.hasRange()) {
                end = Position.getRowIndexInTable(editdiv, selection.getEndPosition());
            }

            var tablePos = Position.getLastPositionFromPositionByNodeName(editdiv, position, DOM.TABLE_NODE_SELECTOR),
                lastRow = Position.getLastRowIndexInTable(editdiv, position),
                isCompleteTable = ((start === 0) && (end === lastRow)) ? true : false,
                newOperation;

            if (isCompleteTable) {
                newOperation = { name: Operations.TABLE_DELETE, start: _.copy(tablePos, true) };
            } else {
                newOperation = { name: Operations.ROWS_DELETE, position: tablePos, start: start, end: end };
            }

            applyOperation(newOperation);

            // setting the cursor position
            selection.setTextSelection(lastOperationEnd);
        };

        this.deleteCells = function () {

            var isCellSelection = selection.getSelectionType() === 'cell',
                startPos = selection.getStartPosition(),
                endPos = selection.getEndPosition();

            startPos.pop();  // removing character position and paragraph
            startPos.pop();
            endPos.pop();
            endPos.pop();

            var startCol = startPos.pop(),
                endCol = endPos.pop(),
                startRow = startPos.pop(),
                endRow = endPos.pop(),
                tablePos = _.copy(startPos, true);

            undoManager.startGroup();  // starting to group operations for undoing

            for (var i = endRow; i >= startRow; i--) {

                var rowPosition = _.copy(tablePos, true);
                rowPosition.push(i);

                var localStartCol = startCol,
                    localEndCol = endCol;

                if ((! isCellSelection) && (i < endRow) && (i > startCol))  {
                    // removing complete rows
                    localStartCol = 0;
                    localEndCol = Position.getLastColumnIndexInRow(editdiv, rowPosition);
                }

                var newOperation = {name: Operations.CELLS_DELETE, position: rowPosition, start: localStartCol, end: localEndCol};
                applyOperation(newOperation);

                // removing empty row
                var rowNode = Position.getDOMPosition(editdiv, rowPosition).node;
                if ($(rowNode).children().length === 0) {
                    newOperation = { name: Operations.ROWS_DELETE, position: _.copy(tablePos, true), start: i, end: i };
                    applyOperation(newOperation);
                }

                // checking if the table is empty
                var tableNode = Position.getDOMPosition(editdiv, tablePos).node;
                if (DOM.getTableRows(tableNode).length === 0) {
                    newOperation = { name: Operations.TABLE_DELETE, start: _.copy(tablePos, true) };
                    applyOperation(newOperation);
                }

            }

            undoManager.endGroup();

            // setting the cursor position
            selection.setTextSelection(lastOperationEnd);
        };

        this.mergeCells = function () {

            var isCellSelection = selection.getSelectionType() === 'cell',
                startPos = selection.getStartPosition(),
                endPos = selection.getEndPosition();

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

                undoManager.startGroup();  // starting to group operations for undoing

                var endPosition = null;

                for (var i = endRow; i >= startRow; i--) {  // merging for each row

                    var rowPosition = _.copy(tablePos, true);
                    rowPosition.push(i);

                    var localStartCol = startCol,
                        localEndCol = endCol;

                    if ((! isCellSelection) && (i < endRow) && (i > startCol))  {
                        // merging complete rows
                        localStartCol = 0;
                        localEndCol = Position.getLastColumnIndexInRow(editdiv, rowPosition);
                    }

                    var count = localEndCol - localStartCol,
                        cellPosition = _.copy(rowPosition, true);
                    cellPosition.push(localStartCol);
                    var newOperation = {name: Operations.CELL_MERGE, position: cellPosition, count: count};
                    applyOperation(newOperation);

                    endPosition = _.copy(cellPosition, true);
                }

                undoManager.endGroup();

                endPosition.push(0);
                endPosition.push(0);

                // setting the cursor position
                selection.setTextSelection(endPosition);
            }
        };

        this.insertCell = function () {

            var isCellSelection = selection.getSelectionType() === 'cell',
                startPos = selection.getStartPosition(),
                endPos = selection.getEndPosition(),
                count = 1;  // default, adding one cell in each row

            undoManager.startGroup();  // starting to group operations for undoing

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
                    localEndCol = Position.getLastColumnIndexInRow(editdiv, rowPosition);
                }

                localEndCol++;  // adding new cell behind existing cell
                var cellPosition = _.copy(rowPosition, true);
                cellPosition.push(localEndCol);
                attrs.gridspan = 1;  // only 1 grid for the new cell
                var newOperation = {name: Operations.CELL_INSERT, position: cellPosition, count: count, attrs: attrs};
                applyOperation(newOperation);

                // Applying new tablegrid, if the current tablegrid is not sufficient
                var tableDomPoint = Position.getDOMPosition(editdiv, tablePos),
                    rowDomPoint = Position.getDOMPosition(editdiv, rowPosition);

                if (tableDomPoint && DOM.isTableNode(tableDomPoint.node)) {

                    var tableGridCount = StyleSheets.getExplicitAttributes(tableDomPoint.node).tablegrid.length,
                        rowGridCount = Table.getColSpanSum($(rowDomPoint.node).children());

                    if (rowGridCount > tableGridCount) {

                        localEndCol--;  // behind is evaluated in getTableGridWithNewColumn
                        var insertmode = 'behind',
                            tablegrid = Table.getTableGridWithNewColumn(editdiv, tablePos, localEndCol, insertmode);

                        // Setting new table grid attribute to table
                        newOperation = { name: Operations.ATTRS_SET, attrs: { 'tablegrid' : tablegrid }, start: _.copy(tablePos, true), end: _.copy(tablePos, true) };
                        applyOperation(newOperation);
                    }

                }

                endPosition = _.copy(cellPosition, true);
            }

            undoManager.endGroup();

            endPosition.push(0);
            endPosition.push(0);

            // setting the cursor position
            selection.setTextSelection(endPosition);
        };

        this.deleteColumns = function () {

            var position = selection.getStartPosition(),
                tablePos = Position.getLastPositionFromPositionByNodeName(editdiv, position, DOM.TABLE_NODE_SELECTOR),
                tableNode = Position.getDOMPosition(editdiv, tablePos).node,
                maxGrid = $(tableNode).children('colgroup').children('col').length - 1,
                rowNode = Position.getLastNodeFromPositionByNodeName(editdiv, position, 'tr'),
                startColIndex = Position.getColumnIndexInRow(editdiv, position),
                endColIndex = startColIndex,
                returnObj = Table.getGridPositionFromCellPosition(rowNode, startColIndex),
                startGrid = returnObj.start,
                endGrid = returnObj.end;

            if (selection.hasRange()) {
                endColIndex = Position.getColumnIndexInRow(editdiv, selection.getEndPosition());
                endGrid = Table.getGridPositionFromCellPosition(rowNode, endColIndex).end;
            }

            var isCompleteTable = ((startGrid === 0) && (endGrid === maxGrid)) ? true : false,
                newOperation;

            undoManager.enterGroup(function () {

                if (isCompleteTable) {
                    newOperation = { name: Operations.TABLE_DELETE, start: _.copy(tablePos, true) };
                    applyOperation(newOperation);
                } else {
                    newOperation = { name: Operations.COLUMNS_DELETE, position: tablePos, startgrid: startGrid, endgrid: endGrid };
                    applyOperation(newOperation);

                    // Checking, if there are empty rows
                    var maxRow = DOM.getTableRows(tableNode).length - 1,
                        deletedAllRows = true;

                    for (var i = maxRow; i >= 0; i--) {
                        var rowPos = _.copy(tablePos, true);
                        rowPos.push(i);
                        var currentRowNode = Position.getDOMPosition(editdiv, rowPos).node;

                        if ($(currentRowNode).children().length === 0) {
                            newOperation = {  name: Operations.ROWS_DELETE, position: _.copy(tablePos, true), start: i, end: i };
                            applyOperation(newOperation);
                        } else {
                            deletedAllRows = false;
                        }
                    }

                    // Checking, if now the complete table is empty
                    if (deletedAllRows) {
                        newOperation = { name: Operations.TABLE_DELETE, start: _.copy(tablePos, true) };
                        applyOperation(newOperation);
                    }

                    // Setting new table grid attribute to table
                    if (! deletedAllRows) {
                        var // StyleSheets.getExplicitAttributes() returns deep copy of the table attributes
                            tablegrid = StyleSheets.getExplicitAttributes(tableNode).tablegrid;
                        tablegrid.splice(startGrid, endGrid - startGrid + 1);  // removing column(s) in tablegrid (automatically updated in table node)
                        newOperation = { name: Operations.ATTRS_SET, attrs: { 'tablegrid' : tablegrid }, start: _.copy(tablePos, true), end: _.copy(tablePos, true) };
                        applyOperation(newOperation);
                    }

                }

            }); // undoManager.enterGroup();

            // setting the cursor position
            selection.setTextSelection(lastOperationEnd);
        };

        this.insertRow = function () {
            var // start = Position.getRowIndexInTable(editdiv, selection.endPaM.oxoPosition),
                count = 1,  // inserting only one row
                insertdefaultcells = false,
                position = selection.getEndPosition();

            var rowPos = Position.getLastPositionFromPositionByNodeName(editdiv, position, 'tr');

            if (rowPos !== null) {

                var referenceRow = rowPos[rowPos.length - 1];

                rowPos[rowPos.length - 1] += 1;

                var newOperation = { name: Operations.ROW_INSERT, position: rowPos, count: count, insertdefaultcells: insertdefaultcells, referencerow: referenceRow };
                applyOperation(newOperation);
            }

            // setting the cursor position
            selection.setTextSelection(lastOperationEnd);
        };

        this.insertColumn = function () {
            var position = selection.getEndPosition(),
                cellPosition = Position.getColumnIndexInRow(editdiv, position),
                tablePos = Position.getLastPositionFromPositionByNodeName(editdiv, position, DOM.TABLE_NODE_SELECTOR),
                rowNode = Position.getLastNodeFromPositionByNodeName(editdiv, position, 'tr'),
                insertmode = 'behind',
                gridPosition = Table.getGridPositionFromCellPosition(rowNode, cellPosition).start,
                tablegrid = Table.getTableGridWithNewColumn(editdiv, tablePos, gridPosition, insertmode);

            undoManager.enterGroup(function () {

                var newOperation = { name: Operations.COLUMN_INSERT, position: tablePos, tablegrid: tablegrid, gridposition: gridPosition, insertmode: insertmode };
                applyOperation(newOperation);

                // Setting new table grid attribute to table
                newOperation = { name: Operations.ATTRS_SET, attrs: { 'tablegrid' : tablegrid }, start: _.clone(tablePos), end: _.clone(tablePos) };
                applyOperation(newOperation);

            }, this);

            // setting the cursor position
            selection.setTextSelection(lastOperationEnd);
        };

        this.insertParagraph = function (position) {
            var newOperation = {name: Operations.PARA_INSERT, start: _.clone(position)};
            applyOperation(newOperation);
        };

        this.insertTable = function (size) {
            if (!_.isObject(size)) { return; }

            undoManager.enterGroup(function () {

                var // cursor position used to split the paragraph
                    startPosition = null,
                    // paragraph to be split for the new table, and its position
                    paragraph = null, position = null,
                    // text offset in paragraph, first and last text position in paragraph
                    offset = 0, startOffset = 0, endOffset = 0,
                    // table attributes
                    attributes = { tablegrid: [], width: 0 },
                    // default table style
                    tableStyleId = self.getDefaultUITableStylesheet(),
                    // operations generator
                    generator = new Operations.Generator();

                this.deleteSelected();
                startPosition = selection.getStartPosition();
                position = startPosition.slice(0, -1);
                paragraph = Position.getParagraphElement(editdiv, position);
                if (!paragraph) { return; }

                // split paragraph, if the cursor is between two characters,
                // or if the paragraph is the very last in the container node
                offset = _.last(startPosition);
                startOffset = Position.getFirstTextNodePositionInParagraph(paragraph);
                endOffset = Position.getLastTextNodePositionInParagraph(paragraph);
                if (!paragraph.nextSibling || ((startOffset < offset) && (offset < endOffset))) {
                    this.splitParagraph(startPosition);
                    position = Position.increaseLastIndex(position);
                } else if (offset === endOffset) {
                    // cursor at the end of the paragrah: insert before next content node
                    position = Position.increaseLastIndex(position);
                }

                // prepare table column widths (values are relative to each other)
                _(size.width).times(function () { attributes.tablegrid.push(1000); });

                // set default table style
                if (_.isString(tableStyleId)) {

                    // insert pending table style to document
                    if (tableStyles.isDirty(tableStyleId)) {
                        generator.generateOperation(Operations.INSERT_STYLE, {
                            attrs: tableStyles.getStyleSheetAttributeMap(tableStyleId),
                            type: 'table',
                            styleid: tableStyleId,
                            stylename: tableStyles.getName(tableStyleId),
                            parent: tableStyles.getParentId(tableStyleId),
                            uipriority: tableStyles.getUIPriority(tableStyleId)
                        });
                        tableStyles.setDirty(tableStyleId, false);
                    }

                    // add table style name to attributes
                    attributes.style = tableStyleId;
                }

                // insert the table, and add empty rows
                generator.generateOperation(Operations.TABLE_INSERT, { position: _.clone(position), attrs: attributes });
                generator.generateOperation(Operations.ROW_INSERT, { position: Position.appendNewIndex(position, 0), count: size.height, insertdefaultcells: true });

                // apply all collected operations
                self.applyOperations(generator.getOperations());

                // set the cursor to first paragraph in first table cell
                selection.setTextSelection(position.concat([0, 0, 0, 0]));

            }, this); // undoManager.enterGroup()
        };

        this.insertImageFile = function (imageFragment) {

            var position = selection.getStartPosition(),
                newOperation = {
                    name: Operations.DRAWING_INSERT,
                    position: position,
                    type: 'image',
                    attrs: { imgurl: imageFragment }
                };

            applyOperation(newOperation);

            sendImageSize(position);

            // setting the cursor position
            selection.setTextSelection(lastOperationEnd);
        };

        this.insertImageURL = function (imageURL) {

            var position = selection.getStartPosition(),
                newOperation = {
                    name: Operations.DRAWING_INSERT,
                    position: position,
                    type: 'image',
                    attrs: { imgurl: imageURL }
                };

            applyOperation(newOperation);

            sendImageSize(position);

            // setting the cursor position
            selection.setTextSelection(lastOperationEnd);
        };

        this.insertImageData = function (imageData) {

            var position = selection.getStartPosition(),
                newOperation = {
                    name: Operations.DRAWING_INSERT,
                    position: position,
                    type: 'image',
                    attrs: { imgdata: imageData }
                };

            applyOperation(newOperation);

            sendImageSize(position);

            // setting the cursor position
            selection.setTextSelection(lastOperationEnd);
        };

        this.insertHyperlink = function () {
            var generator = new Operations.Generator(),
                text = '', url = '',
                startPos = null,
                start = selection.getStartPosition(),
                end = selection.getEndPosition();

            if (!selection.hasRange()) {
                var newSelection = Hyperlink.findSelectionRange(this, selection);
                if (newSelection.start !== null && newSelection.end !== null) {
                    startPos = selection.getStartPosition();
                    start[start.length - 1] = newSelection.start;
                    end[end.length - 1] = newSelection.end;
                    selection.setTextSelection(start, end);
                }
            }

            if (selection.getEnclosingParagraph()) {
                // use range to retrieve text and possible url
                if (selection.hasRange()) {

                    // Find out the text/url of the selected text to provide them to the
                    // hyperlink dialog
                    selection.iterateNodes(function (node, pos, start, length) {
                        if ((start >= 0) && (length >= 0) && DOM.isTextSpan(node)) {
                            var nodeText = $(node).text();
                            if (nodeText) {
                                text = text.concat(nodeText.slice(start, start + length));
                            }
                            if (url.length === 0) {
                                var styles = characterStyles.getElementAttributes(node);
                                if (styles.url && styles.url.length > 0)
                                    url = styles.url;
                            }
                        }
                    });
                }

                // show hyperlink dialog
                Hyperlink.showDialog(text, url).done(function (data) {
                    // set url to selected text
                    var hyperlinkStyleId = self.getDefaultUIHyperlinkStylesheet(),
                        url = data.url;

                    undoManager.enterGroup(function () {

                        if (data.url === null && data.text === null) {
                            // remove hyperlink
                            // setAttribute uses a closed range therefore -1
                            end[end.length - 1] -= 1;
                            generator.generateOperation(Operations.ATTRS_SET, {
                                attrs: { url: '', style: null },
                                start: _.copy(start, true),
                                end: _.copy(end, true)
                            });
                        }
                        else {
                            // insert/change hyperlink
                            if (data.text !== text) {

                                // text has been changed
                                if (selection.hasRange()) {
                                    self.deleteSelected();
                                }

                                // insert new text
                                var newOperation = { name: Operations.TEXT_INSERT, text: data.text, start: _.clone(start) };
                                applyOperation(newOperation);

                                // Calculate end position of new text
                                // will be used for setAttributes operation
                                end = _.clone(start);
                                end[end.length - 1] += data.text.length;
                            }
                            else {
                                end[end.length - 1] -= 1;
                            }

                            if (characterStyles.isDirty(hyperlinkStyleId)) {
                                // insert hyperlink style to document
                                generator.generateOperation(Operations.INSERT_STYLE, {
                                    attrs: characterStyles.getStyleSheetAttributeMap(hyperlinkStyleId),
                                    type: 'character',
                                    styleid: hyperlinkStyleId,
                                    stylename: characterStyles.getName(hyperlinkStyleId),
                                    parent: characterStyles.getParentId(hyperlinkStyleId),
                                    uipriority: characterStyles.getUIPriority(hyperlinkStyleId)
                                });
                                characterStyles.setDirty(hyperlinkStyleId, false);
                            }

                            generator.generateOperation(Operations.ATTRS_SET, {
                                attrs: { url: url, style: hyperlinkStyleId },
                                start: _.clone(start),
                                end: _.clone(end)
                            });
                        }

                        // apply all collected operations
                        self.applyOperations(generator.getOperations());

                        window.setTimeout(function () {
                            app.getController().cancel();
                            if (startPos)
                                selection.setTextSelection(startPos, startPos);
                        }, 0);
                    }, self);
                }).fail(function (data) {
                    window.setTimeout(function () {
                        app.getController().cancel();
                        if (startPos)
                            selection.setTextSelection(startPos, startPos);
                    }, 0);
                });
            }
        };

        this.removeHyperlink = function () {
            var generator = new Operations.Generator(),
                startPos = null,
                start = selection.getStartPosition(),
                end = selection.getEndPosition();

            if (!selection.hasRange()) {
                var newSelection = Hyperlink.findSelectionRange(this, selection);
                if (newSelection.start !== null && newSelection.end !== null) {
                    startPos = selection.getStartPosition();
                    start[start.length - 1] = newSelection.start;
                    end[end.length - 1] = newSelection.end;
                    selection.setTextSelection(start, end);
                }
            }

            if (selection.hasRange() && selection.getEnclosingParagraph()) {
                undoManager.enterGroup(function () {

                    // remove hyperlink
                    // setAttribute uses a closed range therefore -1
                    end[end.length - 1] -= 1;
                    generator.generateOperation(Operations.ATTRS_SET, {
                        attrs: { url: null, style: null },
                        start: _.copy(start, true),
                        end: _.copy(end, true)
                    });

                    // apply all collected operations
                    self.applyOperations(generator.getOperations());

                    window.setTimeout(function () {
                        app.getController().cancel();
                        if (startPos)
                            selection.setTextSelection(startPos, startPos);
                    }, 0);
                }, self);
            }
        };

        this.insertTab = function () {
            undoManager.enterGroup(function () {
                this.deleteSelected();
                applyOperation({ name: Operations.TAB_INSERT, position: selection.getStartPosition() });
            }, this);

            // setting the cursor position
            selection.setTextSelection(lastOperationEnd);
        };

        this.splitParagraph = function (position) {
            var newOperation = {name: Operations.PARA_SPLIT, start: _.clone(position)};
            applyOperation(newOperation);
        };

        this.mergeParagraph = function (position) {
            var newOperation = {name: Operations.PARA_MERGE, start: _.clone(position)};
            applyOperation(newOperation);
        };

        this.insertText = function (text, position) {
            var newOperation = { name: Operations.TEXT_INSERT, text: text, start: _.clone(position) };
            applyOperation(newOperation);
        };

        /**
         * creates a default list either with decimal numbers or bullets
         * @param type {String} 'numbering' or 'bullet'
         */
        this.createDefaultList = function (type) {
            var defNumId = lists.getDefaultNumId(type);
            undoManager.enterGroup(function () {
                if (defNumId === undefined) {
                    var listOperation = lists.getDefaultListOperation(type);
                    applyOperation(listOperation);
                    defNumId = listOperation.listname;
                }
                this.setAttributes('paragraph', { numId: defNumId, ilvl: 0 });
            }, this);
        };

        this.createList = function (type, options) {
            var defNumId = (!options || (!options.symbol && !options.levelstart)) ? lists.getDefaultNumId(type) : undefined;
            if (defNumId === undefined) {
                var listOperation = lists.getDefaultListOperation(type, options);
                applyOperation(listOperation);
                defNumId = listOperation.listname;
            }
            if (options && options.startPosition) {
                var start = [];
                var length = options.startPosition.length;
                var index = 0;
                for (; index < length - 1; ++index) {
                    start[index] = options.startPosition[index];
                }
                var newOperation = {name: Operations.ATTRS_SET, attrs: { numId: defNumId, ilvl: 0}, start: start, end: start };
                applyOperation(newOperation);
                start[start.length - 1] += 1;
                newOperation.start = start;
                newOperation.end = newOperation.start;
                applyOperation(newOperation);
            } else {
                this.setAttributes('paragraph', { numId: defNumId, ilvl: 0 });
            }

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
            return lists;
        };

        /**
         * Returns the document attributes.
         */
        this.getDocumentAttributes = function () {
            return documentStyles.getAttributes();
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

            var // whether the selection is a simple cursor
                isCursor = selection.isTextCursor(),
                // table or drawing element contained by the selection
                element = null,
                // resulting merged attributes
                attributes = {};

            // merges the passed element attributes into the resulting attributes
            function mergeElementAttributes(elementAttributes) {

                var // whether any attribute is still unambiguous
                    hasNonNull = false;

                // process all passed element attributes
                _(elementAttributes).each(function (value, name) {

                    if (!(name in attributes)) {
                        // initial iteration: store value
                        attributes[name] = value;
                    } else if (!_.isEqual(value, attributes[name])) {
                        // value differs from previous value: ambiguous state
                        attributes[name] = null;
                    }
                    hasNonNull = hasNonNull || !_.isNull(attributes[name]);
                });

                // stop iteration, if all attributes are ambiguous
                return hasNonNull ? undefined : Utils.BREAK;
            }

            switch (family) {

            case 'character':
                selection.iterateNodes(function (node) {
                    return DOM.iterateTextSpans(node, function (span) {
                        // ignore empty text spans (they cannot be formatted via operations),
                        // but get formatting of an empty span selected by a text cursor
                        if (isCursor || (span.firstChild.nodeValue.length > 0)) {
                            return mergeElementAttributes(characterStyles.getElementAttributes(span));
                        }
                    });
                });
                if (isCursor) {
                    // add preselected attributes (text cursor selection cannot result in ambiguous attributes)
                    characterStyles.extendAttributes(attributes, preselectedAttributes);
                }
                break;

            case 'paragraph':
                selection.iterateContentNodes(function (paragraph) {
                    return mergeElementAttributes(paragraphStyles.getElementAttributes(paragraph));
                });
                break;

            case 'table':
                if ((element = selection.getEnclosingTable())) {
                    mergeElementAttributes(tableStyles.getElementAttributes(element));
                }
                break;

            case 'drawing':
                // TODO: needs change when multiple drawings can be selected
                if ((element = selection.getSelectedDrawing()[0]) && DOM.isDrawingNode(element)) {
                    mergeElementAttributes(drawingStyles.getElementAttributes(element));
                }
                break;

            default:
                Utils.error('Editor.getAttributes(): missing implementation for family "' + family + '"');
            }

            return attributes;
        };

        /**
         * Changes a single attribute of the specified attribute family in the
         * current selection.
         *
         * @param {String} family
         *  The name of the attribute family containing the specified
         *  attribute.
         *
         * @param {Object} [options]
         *  A map with additional options controlling the opration. The
         *  following options are supported:
         *  @param {Boolean} [options.clear=false]
         *      If set to true, all existing explicit attributes will be
         *      removed from the selection, before applying the new attributes.
         */
        this.setAttribute = function (family, name, value, options) {
            this.setAttributes(family, Utils.makeSimpleObject(name, value), options);
        };

        /**
         * Changes multiple attributes of the specified attribute family in the
         * current selection.
         *
         * @param {String} family
         *  The name of the attribute family containing the passed attributes.
         *
         * @param {Object} attributes
         *  A map with formatting attribute values, mapped by the attribute
         *  names.
         *
         * @param {Object} [options]
         *  A map with additional options controlling the opration. The
         *  following options are supported:
         *  @param {Boolean} [options.clear=false]
         *      If set to true, all existing explicit attributes will be
         *      removed from the selection, before applying the new attributes.
         */
        this.setAttributes = function (family, attributes, options) {

            // Create an undo group that collects all undo operations generated
            // in the local setAttributes() method (it calls itself recursively
            // with smaller parts of the current selection).
            undoManager.enterGroup(function () {

                var // table or drawing element contained by the selection
                    element = null,
                    // operations generator
                    generator = new Operations.Generator(),
                    // the style sheet container
                    styleSheets = this.getStyleSheets(family),
                    // whether to generate 'clearAttributes' operations
                    clear = Utils.getBooleanOption(options, 'clear', false);

                // generates a 'setAttributes' or 'clearAttributes' operation
                function generateAttributeOperation(startPosition, endPosition) {

                    var // the options for the operation
                        operationOptions = { start: startPosition };

                    if (_.isArray(endPosition)) {
                        operationOptions.end = endPosition;
                    }
                    if (clear) {
                        generator.generateOperation(Operations.ATTRS_CLEAR, operationOptions);
                    }
                    if (!_.isEmpty(attributes)) {
                        generator.generateOperation(Operations.ATTRS_SET, _({ attrs: attributes }).extend(operationOptions));
                    }
                }

                // register pending style sheet via 'insertStylesheet' operation
                if (_.isString(attributes.style) && styleSheets.isDirty(attributes.style)) {

                    generator.generateOperation(Operations.INSERT_STYLE, {
                        attrs: styleSheets.getStyleSheetAttributeMap(attributes.style),
                        type: family,
                        styleid: attributes.style,
                        stylename: styleSheets.getName(attributes.style),
                        parent: styleSheets.getParentId(attributes.style),
                        uipriority: styleSheets.getUIPriority(attributes.style)
                    });

                    // remove the dirty flag
                    styleSheets.setDirty(attributes.style, false);
                }

                // generate 'setAttribute' operations
                switch (family) {

                case 'character':
                    if (selection.hasRange()) {
                        selection.iterateContentNodes(function (paragraph, position, startOffset, endOffset) {
                            // validate start offset (iterator passes 'undefined' for fully covered paragraphs)
                            if (!_.isNumber(startOffset)) {
                                startOffset = 0;
                            }
                            // validate end offset (iterator passes 'undefined' for fully covered paragraphs)
                            if (!_.isNumber(endOffset)) {
                                endOffset = Position.getParagraphLength(editdiv, position) - 1;
                            }
                            // set the attributes at the covered text range
                            // TODO: currently, no way to set character attributes at empty paragraphs via operation...
                            if (startOffset <= endOffset) {
                                generateAttributeOperation(position.concat([startOffset]), position.concat([endOffset]));
                            }
                        });
                    } else {
                        characterStyles.extendAttributes(preselectedAttributes, attributes);
                    }
                    break;

                case 'paragraph':
                    selection.iterateContentNodes(function (paragraph, position) {
                        generateAttributeOperation(position);
                    });
                    break;

                case 'cell':
                    selection.iterateTableCells(function (cell, position) {
                        generateAttributeOperation(position);
                    });
                    break;

                case 'table':
                    if ((element = selection.getEnclosingTable())) {
                        generateAttributeOperation(Position.getOxoPosition(editdiv, element, 0));
                    }
                    break;

                case 'drawing':
                    // TODO: needs change when multiple drawings can be selected
                    if ((element = selection.getSelectedDrawing()[0]) && DOM.isDrawingNode(element)) {
                        generateAttributeOperation(Position.getOxoPosition(editdiv, element, 0));
                    }
                    break;

                default:
                    Utils.error('Editor.setAttributes(): missing implementation for family "' + family + '"');
                }

                // apply all collected operations
                this.applyOperations(generator.getOperations());

            }, this);
        };

        this.setEditMode = function (state) {
            var showReadOnlyInfo = ox.online && state === false && editMode !== false,
                showEditModeInfo = ox.online && state === true && editMode === false;

            editMode = state;
            editdiv.toggleClass('io-ox-office-edit-mode', !!editMode);

            // disable resize handlers etc. everytime the edit mode has been changed
            try {
                // disable FireFox table manipulation handlers
                document.execCommand('enableObjectResizing', false, false);
                document.execCommand('enableInlineTableEditing', false, false);
            } catch (ex) {
            }

            // disable IE table manipulation handlers in edit mode
            Utils.getDomNode(editdiv).onresizestart = function () { return false; };

            if (editMode) {
                // focus back to editor
                this.grabFocus(true);
            }

            if (showReadOnlyInfo) {
                Alert.showReadOnlyWarning(app.getView().getToolPane().getNode(), app.getController(), editUser);
            } else if (showEditModeInfo) {
                Alert.showEditModeSuccess(app.getView().getToolPane().getNode(), app.getController());
            }
        };

        this.isEditMode = function () {
            return editMode;
        };

        this.setEditUser = function (user) {
            editUser = user || '';
        };

        this.getEditUser = function () {
            return editUser;
        };

        /**
         * Returns whether the current selection selects any text. This
         * includes the rectangular table cell selection mode.
         */
        this.isTextSelected = function () {
            return selection.getSelectionType() !== 'drawing';
        };

        /**
         * Returns whether the editor contains a selection range (text,
         * drawings, or table cells) instead of a simple text cursor.
         */
        this.hasSelectedRange = function () {
            return !selection.isTextCursor();
        };

        /**
         * Returns whether the editor contains a selection within a
         * single paragraph or not.
         */
        this.selectionEnclosingParagraph = function () {
            return (selection.getEnclosingParagraph() !== null);
        };

        // PUBLIC TABLE METHODS

        this.isPositionInTable = function () {
            return !_.isNull(selection.getEnclosingTable());
        };

        // PUBLIC DRAWING METHODS

        /**
         * Returns whether the current selection selects one or more drawings.
         */
        this.isDrawingSelected = function () {
            return selection.getSelectionType() === 'drawing';
        };

        /**
         * Returns the default lateral heading character styles
         */
        this.getDefaultHeadingCharacterStyles = function () {
            return HEADINGS_CHARATTRIBUTES;
        };

        /**
         * Returns the default lateral paragraph style
         */
        this.getDefaultParagraphStyleDefinition = function () {
            return DEFAULT_PARAGRAPH_DEFINTIONS;
        };

        /**
         * Returns the default lateral table definiton
         */
        this.getDefaultLateralTableDefinition = function () {
            return DEFAULT_LATERAL_TABLE_DEFINITIONS;
        };

        /**
         * Returns the default lateral table attributes
         */
        this.getDefaultLateralTableAttributes = function () {
            return DEFAULT_LATERAL_TABLE_ATTRIBUTES;
        };

        this.getDefaultLateralHyperlinkDefinition = function () {
            return DEFAULT_HYPERLINK_DEFINTIONS;
        };

        this.getDefaultLateralHyperlinkAttributes = function () {
            return DEFAULT_HYPERLINK_CHARATTRIBUTES;
        };

        /**
         * Returns the document default table stylesheet id
         * which can be used to set attributes for a new
         * table.
         */
        this.getDefaultUITableStylesheet = function () {
            var styleNames = tableStyles.getStyleSheetNames(),
                highestUIPriority = 99,
                tableStyleId = null;

            _(styleNames).each(function (name, id) {
                var uiPriority = tableStyles.getUIPriority(id);

                if (uiPriority && (uiPriority < highestUIPriority)) {
                    tableStyleId = id;
                    highestUIPriority = uiPriority;
                }
            });

            return tableStyleId;
        };

        /**
         * Returns the document default hyperlink stylesheet id
         */
        this.getDefaultUIHyperlinkStylesheet = function () {
            var styleNames = characterStyles.getStyleSheetNames(),
                hyperlinkId = null;

            _(styleNames).each(function (name, id) {
                var lowerName = name.toLowerCase();
                if (lowerName.indexOf('hyperlink') >= 0)
                    hyperlinkId = id;
            });

            return hyperlinkId;
        };

         /**
         * Called when all initial document operations have been processed.
         * Can be used to start post-processing tasks which need a fully
         * processed document.
         */
        this.documentLoaded = function () {
            var postProcessingTasks = [insertHyperlinkPopup, insertMissingCharacterStyles, insertMissingParagraphStyles, insertMissingTableStyle];

            _(postProcessingTasks).each(function (task) {
                task.call(self);
            });
        };

        // ==================================================================
        // END of Editor API
        // ==================================================================

        // ==================================================================
        // Private functions for document post-processing
        // ==================================================================

        /**
         * Inserts a hyperlink popup div into the DOM which is used to show
         * hyperlink information and change/remove functions.
         */
        function insertHyperlinkPopup() {
            var hyperlinkPopup = $('<div>', { contenteditable: false }).addClass('io-ox-office-hyperlink-popup').css({display: 'none'})
                .append(
                    $('<a>').attr({ href: '', rel: 'noreferrer', target: '_blank' }),
                    $('<span>').text(' | '),
                    $('<span>').addClass('io-ox-office-hyperlink-popup-links').text(gt('Edit')).click(function () { self.insertHyperlink(); }),
                    $('<span>').text(' - '),
                    $('<span>').addClass('io-ox-office-hyperlink-popup-links').text(gt('Remove')).click(function () { self.removeHyperlink(); })
                ),
                page = $(self.getNode().parent()).first();

            if (hyperlinkPopup[0]) {
                var found = page.children(".io-ox-office-hyperlink-popup");
                if (!found[0]) {
                    page.append(hyperlinkPopup);
                    selection.on('change', function () {
                        var url = Hyperlink.getURLFromPosition(self, selection);
                        if (url) {
                            var link = $('a', hyperlinkPopup[0]),
                                urlSelection = selection.getStartPosition(),
                                obj = Position.getDOMPosition(self.getNode(), urlSelection);

                            if (obj && obj.node && DOM.isTextSpan(obj.node.parentNode)) {
                                var pos = urlSelection[urlSelection.length - 1],
                                    startEndPos = Hyperlink.findURLSelection(self, obj.node.parentNode, pos, url),
                                    left, top, height, width;

                                if (pos !== startEndPos.end) {
                                    // find out position of the first span of our selection
                                    urlSelection[urlSelection.length - 1] = startEndPos.start;
                                    obj = Position.getDOMPosition(self.getNode(), urlSelection, true);
                                    left = $(obj.node).offset().left;

                                    // find out position of the last span of our selection
                                    urlSelection[urlSelection.length - 1] = startEndPos.end - 1;
                                    obj = Position.getDOMPosition(self.getNode(), urlSelection, true);
                                    top = $(obj.node).offset().top;
                                    height = $(obj.node).height();

                                    // calculate position relative to the application pane
                                    var parent = app.getView().getApplicationPane().getNode(),
                                        parentLeft = parent.offset().left,
                                        parentTop = parent.offset().top,
                                        parentWidth = parent.width(),
                                        scrollLeft = parent.scrollLeft(),
                                        scrollTop = parent.scrollTop();

                                    left = (left + scrollLeft) - parentLeft;
                                    top = (top + scrollTop + height) - parentTop;

                                    link.text(url);
                                    link.attr({href: url});
                                    hyperlinkPopup.show();
                                    hyperlinkPopup.css({left: left, top: top});
                                    width = hyperlinkPopup.width();
                                    if ((left + width) > parentWidth) {
                                        left -= (((left + width) - parentWidth) + parentLeft);
                                        hyperlinkPopup.css({left: left});
                                    }
                                    if (pos === startEndPos.start) {
                                        // special case: at the start of a hyperlink we want to
                                        // write with normal style
                                        preselectedAttributes = { style: null, url: null };
                                    }
                                }
                                else {
                                    // special case: at the end of a hyperlink we want to
                                    // write with normal style and we don't show the popup
                                    preselectedAttributes = { style: null, url: null };
                                    hyperlinkPopup.hide();
                                }
                            }
                        }
                        else {
                            hyperlinkPopup.hide();
                        }
                    });
                }
            }
        }

        /**
         * Checks stored character styles of a document and adds "missing"
         * character styles (e.g. hyperlink).
         */
        function insertMissingCharacterStyles() {
            var styleNames = characterStyles.getStyleSheetNames(),
                parentId = characterStyles.getDefaultStyleSheetId(),
                hyperlinkMissing = true;

            _(styleNames).each(function (name, id) {
                var lowerName = name.toLowerCase();
                if (lowerName.indexOf('hyperlink') >= 0)
                    hyperlinkMissing = false;
            });

            if (hyperlinkMissing) {
                var hyperlinkAttr = { character: self.getDefaultLateralHyperlinkAttributes() },
                    hyperlinkDef = self.getDefaultLateralHyperlinkDefinition();
                characterStyles.addStyleSheet(
                        hyperlinkDef.styleid, hyperlinkDef.stylename,
                        parentId, hyperlinkAttr,
                        { hidden: false, priority: hyperlinkDef['default'], defStyle: false, dirty: true });
            }
        }

        /**
         * Check the stored paragraph styles of a document and adds "missing"
         * heading / default paragraph styles.
         */
        function insertMissingParagraphStyles() {
            var headings = [0, 1, 2, 3, 4, 5],
                styleNames = paragraphStyles.getStyleSheetNames(),
                parentId = paragraphStyles.getDefaultStyleSheetId(),
                hasDefaultStyle = _.isString(parentId) && (parentId.length > 0);

            if (!hasDefaultStyle) {
                // add a missing default paragraph style
                var defParaDef = self.getDefaultParagraphStyleDefinition();
                paragraphStyles.addStyleSheet(defParaDef.styleid, defParaDef.stylename, null, null,
                        { hidden: false, priority: 1, defStyle: defParaDef['default'], dirty: true });
                parentId = defParaDef.styleid;
            }

            // find out which outline level paragraph styles are missing
            _(styleNames).each(function (name, id) {
                var styleAttributes = paragraphStyles.getStyleSheetAttributes(id),
                    outlineLvl = styleAttributes.outlinelvl;
                if (_.isNumber(outlineLvl) && (outlineLvl >= 0 && outlineLvl < 6)) {
                    headings = _(headings).without(outlineLvl);
                }
            });

            // add the missing paragraph styles using predefined values
            if (headings.length > 0) {
                var defaultCharStyles = self.getDefaultHeadingCharacterStyles();
                _(headings).each(function (level) {
                    var attr = {},
                        charAttr = defaultCharStyles[level];
                    attr.character = charAttr;
                    attr.paragraph = { outlinelvl: level };
                    attr.next = parentId;
                    paragraphStyles.addStyleSheet("heading " + (level + 1), "heading " + (level + 1),
                            parentId, attr, { hidden: false, priority: 9, defStyle: false, dirty: true });
                });
            }
        }

        /**
         * Check the stored table styles of a document and adds a "missing"
         * default table style. This ensures that we can insert tables that
         * are based on a reasonable default style.
         */
        function insertMissingTableStyle() {
            var styleNames = tableStyles.getStyleSheetNames(),
                parentId = tableStyles.getDefaultStyleSheetId(),
                hasDefaultStyle = _.isString(parentId) && (parentId.length > 0),
                defTableDef = self.getDefaultLateralTableDefinition(),
                defTableAttr = self.getDefaultLateralTableAttributes();

            if (!hasDefaultStyle) {
                // Add a missing default table style
                var attr = _.copy(defTableAttr);
                attr.next = null;
                tableStyles.addStyleSheet(defTableDef.styleid, defTableDef.stylename, null, attr,
                        { hidden: false, priority: 59, defStyle: defTableDef['default'], dirty: true });
            }
            else {
                // Search for a style defined in the document that can be used for tables
                // If we cannot find it we have to add it.
                var lowestUIPriority = 99,
                    tableStyleId = null;
                _(styleNames).each(function (name, id) {
                    var uiPriority = tableStyles.getUIPriority(id);

                    if (uiPriority && (uiPriority < lowestUIPriority)) {
                        tableStyleId = id;
                        lowestUIPriority = uiPriority;
                    }
                });

                if ((!tableStyleId) || ((tableStyleId === tableStyles.getDefaultStyleSheetId()) && (lowestUIPriority === 99))) {
                    // OOXML uses a default table style which contains no border
                    // definitions. Therfore we add our own default table style
                    // if we only find the default style with uipriority 99
                    var attr = _.copy(defTableAttr);
                    attr.next = parentId;
                    tableStyles.addStyleSheet(defTableDef.styleid, defTableDef.stylename, parentId, attr,
                            { hidden: false, priority: 59, defStyle: false, dirty: true });
                }
            }
        }

        // ====================================================================
        // Private functions for the hybrid edit mode
        // ====================================================================

        function processFocus(state) {
            if (focused !== state) {
                focused = state;
                // selection is invalid until document has been initialized
                if (focused && selection.isValid()) {
                    selection.restoreBrowserSelection();
                }
                self.trigger('focus', state);
            }
        }

        function processMouseDown(event) {

            // in read only mode allow text selection only
            if (!editMode) {
                updateSelection();
                return;
            }

            var // drawing start and end position for selection
                startPosition = null, endPosition = null,
                // mouse click on a drawing node
                drawing = $(event.target).closest(DOM.DRAWING_NODE_SELECTOR),
                isDrawingNode = false,
                isResizeNode = false;

            if (drawing.length > 0) {
                isDrawingNode = true;
            } else {
                // mouse click on a table resize node
                drawing = $(event.target).closest(DOM.RESIZE_NODE_SELECTOR);
                if (drawing.length > 0) {
                    isResizeNode = true;
                }
            }

            preselectedAttributes = {};

            // click on drawing node: set browser selection to drawing node, draw selection
            if ((drawing.length > 0) && (editdiv[0].contains(drawing[0]))) {

                // prevent default click handling of the browser
                event.preventDefault();
                // set focus to the document container (may be located in GUI edit fields)
                self.grabFocus();

                // checking if the drawing already has a selection (nothing to do here)
                if (DOM.hasDrawingSelection(drawing)) {
                    return;
                }

                if (isDrawingNode) {
                    // select the drawing
                    startPosition = Position.getOxoPosition(editdiv, drawing[0], 0);
                    endPosition = Position.getOxoPosition(editdiv, drawing[0], 1);
                    selection.setTextSelection(startPosition, endPosition);
                    drawDrawingSelection(drawing);
                }

                if (isResizeNode) {
                    drawTableCellResizeSelection(drawing);
                }

                // send initial mouse down event to the handlers registered in drawDrawingSelection()
                drawing.triggerHandler('mousedown', event);

            } else {
                // clicked somewhere else: calculate logical selection from browser selection,
                // after browser has processed the mouse event
                updateSelection();
            }

        }

        function processMouseUp(event) {

            // handle mouse events in edit mode only
            if (!editMode) {
                event.preventDefault();
                return;
            }

            // mouse up while drawing selected: selection does not change
            if (selection.getSelectionType() !== 'drawing') {
                // calculate logical selection from browser selection, after
                // browser has processed the mouse event
                updateSelection();
            }
        }

        function processKeyDown(event) {

            lastKeyDownEvent = event;   // for some keys we only get keyDown, not keyPressed!

            if (isIgnorableKeyEvent(event)) {
                return;
            }

            implDbgOutEvent(event);

            if (isCursorKeyEvent(event)) {

                // any navigation key: change drawing selection to text selection before
                selection.selectDrawingAsText();

                // let browser process the key event, select a drawing that has been covered exactly
                updateSelection(isForwardCursorKey(event.keyCode)).done(function () {
                    // draw selection box for selected drawings
                    if (event.shiftKey) {
                        drawDrawingSelection(selection.getSelectedDrawing());
                    }
                });

                preselectedAttributes = {};

                return;
            }

            // handle just cursor and copy events if in read only mode
            if (!editMode && !isCursorKeyEvent(event) && !isCopyKeyEvent(event)) {
                event.preventDefault();
                return;
            }

            // TODO: How to strip away debug code?
            if (event.keyCode && event.shiftKey && event.ctrlKey && event.altKey) {
                event.preventDefault();
                var c = getPrintableChar(event);
                if (c === 'P') {
                    alert('#Paragraphs: ' + DOM.getPageContentNode(editdiv).children().length);
                }
                else if (c === 'I') {
                    self.insertParagraph([DOM.getPageContentNode(editdiv).children().length]);
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
                else if (c === 'F') {
                    var newOperation = {name: Operations.FIELD_INSERT, position: selection.getStartPosition(), type: ' DATE \\* MERGEFORMAT ', representation: '07.09.2012'};
                    applyOperation(newOperation);
                }
                else if (c === '1') {
                    dbgoutEvents = !dbgoutEvents;
                    Utils.log('dbgoutEvents is now ' + dbgoutEvents);
                }
                else if (c === '2') {
                    Utils.MIN_LOG_LEVEL = Utils.MIN_LOG_LEVEL ? undefined : 'log';
                    window.console.log('logging is now ' + (Utils.MIN_LOG_LEVEL ? 'on' : 'off'));
                }
            }

            if (event.keyCode === KeyCodes.DELETE) {
                event.preventDefault();
                preselectedAttributes = {};
                if (selection.hasRange()) {
                    self.deleteSelected();
                }
                else {
                    var lastValue = selection.startPaM.oxoPosition.length - 1,
                        startPosition = selection.startPaM.oxoPosition,
                        paraLen = Position.getParagraphLength(editdiv, startPosition);

                    // skipping floated drawings
                    while (selection.startPaM.oxoPosition[lastValue] < paraLen) {

                        var testPosition = _.clone(selection.startPaM.oxoPosition),
                            node = Position.getDOMPosition(editdiv, testPosition, true).node;

                        // is the node at testPosition a floated drawing?
                        if ((node) && (DOM.isFloatingDrawingNode(node))) {
                            selection.startPaM.oxoPosition[lastValue] += 1;
                            selection.endPaM.oxoPosition[lastValue] += 1;
                        } else {
                            break;
                        }
                    }

                    if (startPosition[lastValue] < paraLen) {
                        selection.endPaM.oxoPosition[lastValue]++;
                        self.deleteText(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition);
                    } else {
                        var mergeselection = _.clone(selection.startPaM.oxoPosition),
                            characterPos = mergeselection.pop();

                        var nextParagraphPosition = _.copy(mergeselection),
                            lastValue = nextParagraphPosition.length - 1;

                        nextParagraphPosition[lastValue] += 1;

                        var domPos = Position.getDOMPosition(editdiv, nextParagraphPosition),
                            nextIsTable = false,
                            isLastParagraph = false;

                        if (domPos) {
                            if (DOM.isTableNode(domPos.node)) {
                                nextIsTable = true;
                            }
                        } else {
                            nextParagraphPosition[lastValue] -= 1;
                            isLastParagraph = true;
                        }

                        self.mergeParagraph(mergeselection);

                        if (nextIsTable) {
                            if (characterPos === 0) {
                                // removing empty paragraph
                                var localPos = _.clone(selection.startPaM.oxoPosition);
                                localPos.pop();
                                self.deleteParagraph(localPos);
                                nextParagraphPosition[lastValue] -= 1;
                            }
                            selection.startPaM.oxoPosition = Position.getFirstPositionInParagraph(editdiv, nextParagraphPosition);
                        } else if (isLastParagraph) {
                            if (Position.isPositionInTable(editdiv, nextParagraphPosition)) {
                                var returnObj = Position.getFirstPositionInNextCell(editdiv, nextParagraphPosition);
                                selection.startPaM.oxoPosition = returnObj.position;
                                var endOfTable = returnObj.endOfTable;
                                if (endOfTable) {
                                    var lastVal = selection.startPaM.oxoPosition.length - 1;
                                    selection.startPaM.oxoPosition[lastVal] += 1;
                                    selection.startPaM.oxoPosition = Position.getFirstPositionInParagraph(editdiv, selection.startPaM.oxoPosition);
                                }
                            }
                        }
                    }
                }

                selection.setTextSelection(selection.startPaM.oxoPosition);
            }
            else if (event.keyCode === KeyCodes.BACKSPACE) {
                event.preventDefault();
                preselectedAttributes = {};
                if (selection.hasRange()) {
                    self.deleteSelected();
                }
                else {
                    var lastValue = selection.startPaM.oxoPosition.length - 1;

                    // skipping floated drawings
                    while (selection.startPaM.oxoPosition[lastValue] > 0) {

                        var testPosition = _.clone(selection.startPaM.oxoPosition);
                        testPosition[lastValue] -= 1;
                        var node = Position.getDOMPosition(editdiv, testPosition, true).node;

                        // is the node at testPosition a floated drawing?
                        if ((node) && (DOM.isFloatingDrawingNode(node))) {
                            selection.startPaM.oxoPosition[lastValue] -= 1;
                        } else {
                            break;
                        }
                    }

                    if (selection.startPaM.oxoPosition[lastValue] > 0) {

                        var startPosition = _.copy(selection.startPaM.oxoPosition, true),
                            endPosition = _.copy(selection.startPaM.oxoPosition, true);
                        startPosition[lastValue] -= 1;
                        self.deleteText(startPosition, endPosition);

                    } else if (selection.startPaM.oxoPosition[lastValue - 1] >= 0) {

                        var startPosition = _.copy(selection.startPaM.oxoPosition, true);

                        if (! _(startPosition).all(function (value) { return (value === 0); })) {

                            startPosition[lastValue - 1] -= 1;
                            startPosition.pop();

                            var length = Position.getParagraphLength(editdiv, startPosition),
                                domPos = Position.getDOMPosition(editdiv, startPosition),
                                prevIsTable = false;

                            if (domPos) {
                                if (DOM.isTableNode(Position.getDOMPosition(editdiv, startPosition).node)) {
                                    prevIsTable = true;
                                }
                            }

                            if (startPosition[lastValue - 1] >= 0) {
                                if (! prevIsTable) {
                                    self.mergeParagraph(startPosition);
                                }
                                selection.startPaM.oxoPosition[lastValue - 1] -= 1;
                                selection.startPaM.oxoPosition.pop();
                            }

                            if (prevIsTable) {
                                selection.startPaM.oxoPosition = Position.getLastPositionInParagraph(editdiv, selection.startPaM.oxoPosition);
                            } else {
                                var isFirstPosition = (startPosition[lastValue - 1] < 0) ? true : false;
                                if (isFirstPosition) {
                                    if (Position.isPositionInTable(editdiv, startPosition)) {
                                        var returnObj = Position.getLastPositionInPrevCell(editdiv, startPosition);
                                        selection.startPaM.oxoPosition = returnObj.position;
                                        var beginOfTable = returnObj.beginOfTable;
                                        if (beginOfTable) {
                                            var lastVal = selection.startPaM.oxoPosition.length - 1;
                                            selection.startPaM.oxoPosition[lastVal] -= 1;
                                            selection.startPaM.oxoPosition = Position.getLastPositionInParagraph(editdiv, selection.startPaM.oxoPosition);
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

                selection.setTextSelection(selection.startPaM.oxoPosition);
            }
            else if (event.ctrlKey && !event.altKey) {

                // don't catch ctrl+v and meta+v to make the browser send the 'paste' event
                if (!isPasteKeyEvent(event)) {
                    event.preventDefault();
                }

                preselectedAttributes = {};
                var c = getPrintableChar(event);
                if (c === 'A') {
                    selection.selectAll();
                }
                else if (c === 'Z') {
                    self.undo();
                }
                else if (c === 'Y') {
                    self.redo();
                }
                else if (c === 'X') {
                    self.cut();
                }
                else if (c === 'C') {
                    self.copy();
                }
//                else if (c === 'V') {
//                    self.paste();
//                }
                else if (c === 'B') {
                    self.setAttribute('character', 'bold', !self.getAttributes('character').bold);
                }
                else if (c === 'I') {
                    self.setAttribute('character', 'italic', !self.getAttributes('character').italic);
                }
                else if (c === 'U') {
                    self.setAttribute('character', 'underline', !self.getAttributes('character').underline);
                }
            } else if (event.keyCode === KeyCodes.TAB && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                preselectedAttributes = {};
                // (shift)Tab: Change list indent (if in list) when selection is at first position in paragraph
                var paragraph = Position.getLastNodeFromPositionByNodeName(editdiv, selection.getStartPosition(), DOM.PARAGRAPH_NODE_SELECTOR),
                    mustInsertTab = !event.shiftKey;
                if (!selection.hasRange() &&
                        _.last(selection.getStartPosition()) === Position.getFirstTextNodePositionInParagraph(paragraph)) {
                    var ilvl = paragraphStyles.getElementAttributes(paragraph).ilvl;
                    if (ilvl !== -1) {
                        mustInsertTab = false;
                        if (!event.shiftKey && ilvl < 8) {
                            ilvl += 1;
                            self.setAttribute('paragraph', 'ilvl', ilvl);
                        } else if (event.shiftKey && ilvl > 0) {
                            ilvl -= 1;
                            self.setAttribute('paragraph', 'ilvl', ilvl);
                        }
                    }
                }
                if (mustInsertTab) {
                    self.insertTab();
                }
            }
        }

        function processKeyPressed(event) {

            if (isIgnorableKeyEvent(lastKeyDownEvent)) {
                return;
            }

            if (isCursorKeyEvent(lastKeyDownEvent)) {
                preselectedAttributes = {};
                return;
            }

            // handle just cursor and copy events if in read only mode
            if (!editMode && !isCursorKeyEvent(event) && !isCopyKeyEvent(event)) {
                event.preventDefault();
                return;
            }

            implDbgOutEvent(event);

            // prevent browser from evaluating the key event, but allow copy and pate events
            if (!isPasteKeyEvent(event) && !isCopyKeyEvent(event)) {
                event.preventDefault();
            }

            var c = getPrintableChar(event);

            // TODO
            // For now (the prototype), only accept single chars, but let the browser process, so we don't need to care about DOM stuff
            // TODO: But we at least need to check if there is a selection!!!

            if ((!event.ctrlKey || (event.ctrlKey && event.altKey && !event.shiftKey)) && !event.metaKey && (c.length === 1)) {

                var startPosition = selection.getStartPosition(),
                    endPosition = _.clone(startPosition);
                endPosition[endPosition.length - 1]++;

                self.deleteSelected();
                // Selection was adjusted, so we need to use start, not end
                self.insertText(c, startPosition);

                if (! _.isEmpty(preselectedAttributes)) {
                    // setting selection
                    selection.setTextSelection(startPosition, endPosition);
                    self.setAttributes('character', preselectedAttributes);
                    preselectedAttributes = {};
                }

                // set cursor behind character
                selection.setTextSelection(endPosition);
            }
            else if (c.length > 1) {
                preselectedAttributes = {};
                // TODO?
            }
            else {

                preselectedAttributes = {};

                if (event.keyCode === KeyCodes.ENTER) {
                    var hasSelection = selection.hasRange();
                    self.deleteSelected();
                    var startPosition = selection.getStartPosition(),
                        lastValue = startPosition.length - 1;

                    //at first check if a paragraph has to be inserted before the current table
                    if ((lastValue >= 4) &&
                        (Position.isPositionInTable(editdiv, [0])) &&
                        _(startPosition).all(function (value) { return (value === 0); })) {
                        self.insertParagraph([0]);
                        selection.startPaM.oxoPosition = [0, 0];
                    } else {
                        // demote or end numbering instead of creating a new paragraph
                        var // the paragraph element addressed by the
                            // passed logical position
                            paragraph = Position.getLastNodeFromPositionByNodeName(editdiv, selection.startPaM.oxoPosition, DOM.PARAGRAPH_NODE_SELECTOR);
                        var ilvl = paragraphStyles.getElementAttributes(paragraph).ilvl;
                        var split = true;
                        var paragraphLength = Position.getParagraphLength(editdiv, selection.startPaM.oxoPosition);
                        if (!hasSelection && ilvl >= 0 && paragraphLength === 0) {
                            ilvl--;
                            self.setAttribute('paragraph', 'ilvl', ilvl);
                            if (ilvl < 0) {
                                //remove list-label and update paragraph
                                $(paragraph).children(DOM.LIST_LABEL_NODE_SELECTOR).remove();
                                implParagraphChanged(paragraph);
                            }
                            split = false;
                        }
                        var numAutoCorrect = {};
                        if (!hasSelection && ilvl < 0 && paragraphLength > 3) {
                            // detect Numbering/Bullet labels at paragraph
                            // start

                            if (paragraph !== undefined) {
                                var paraText = paragraph.textContent,
                                labelText = paraText.split(' ')[0];
                                numAutoCorrect.listDetection = lists.detectListSymbol(labelText);
                                if (numAutoCorrect.listDetection.numberformat !== undefined) {
                                    numAutoCorrect.startPosition = _.copy(selection.startPaM.oxoPosition, true);
                                    numAutoCorrect.startPosition[numAutoCorrect.startPosition.length - 1] = 0;
                                    numAutoCorrect.endPosition = _.copy(selection.endPaM.oxoPosition, true);
                                    numAutoCorrect.endPosition[numAutoCorrect.endPosition.length - 1] = labelText.length + 1;
                                }
                            }
                        }
                        if (split === true) {
                            self.splitParagraph(startPosition);
                            // now apply 'AutoCorrection'
                            if (numAutoCorrect.listDetection && numAutoCorrect.listDetection.numberformat !== undefined) {
                                undoManager.enterGroup(function () {
                                    self.deleteText(numAutoCorrect.startPosition, numAutoCorrect.endPosition);
                                    self.createList(numAutoCorrect.listDetection.numberformat === 'bullet' ? 'bullet' : 'numbering',
                                            {levelstart: numAutoCorrect.listDetection.levelstart, symbol: numAutoCorrect.listDetection.symbol,
                                             startPosition: numAutoCorrect.startPosition,
                                             numberformat: numAutoCorrect.listDetection.numberformat
                                            });
                                });
                            }
                            // TODO / TBD: Should all API / Operation calls return the new position?!
                            var lastValue = selection.startPaM.oxoPosition.length - 1;
                            selection.startPaM.oxoPosition[lastValue - 1] += 1;
                            selection.startPaM.oxoPosition[lastValue] = 0;
                        }
                    }
                    selection.setTextSelection(selection.startPaM.oxoPosition);
                }
            }
        }

        /**
         * Parses the clipboard div for pasted text content
         * @param {jQuery} clipboard
         * @returns {Array} the clipboard data to create operations from
         */
        function parseClipboard(clipboard) {

            var result = [];

            (function findTextNodes(current, depth) {

                for (var i = 0; i < current.childNodes.length; i++) {
                    var child = current.childNodes[i],
                        nextLevel = true;

                    if (child.nodeType === 3) {
                        // handle non-whitespace characters and non-breaking spaces only
                        if (/\S|\u00a0/.test(child.nodeValue)) {
                            // replace '\r' and '\n' with space to fix pastes from aoo
                            var splitted, text = child.nodeValue.replace(/[\r\n]/g, ' ');
                            splitted = text.match(/[^\t]+|\t/g);
                            for (var j = 0; j < splitted.length; j++) {
                                if (splitted[j] === '\t') {
                                    // tab
                                    result.push({operation: Operations.TAB_INSERT, depth: depth});
                                } else {
                                    // text
                                    result.push({operation: Operations.TEXT_INSERT, data: splitted[j], depth: depth});
                                }
                            }
                        }
                    } else {
                        // insert paragraph for p, div and br, create only one paragraph if br is nested inside a div
                        if ($(child).is('p, div') || $(child).is('br') && (!$(child.parentNode).is('p, div') || $(child.parentNode).hasClass('io-ox-office-clipboard'))) {
                            result.push({operation: Operations.PARA_INSERT, depth: depth});
                        } else if ($(child).is('img')) {
                            result.push({operation: Operations.DRAWING_INSERT, data: child.src, depth: depth});
                        } else if ($(child).is('style')) {
                            nextLevel = false;
                        }

                        if (nextLevel) {
                            findTextNodes(child, depth + 1);
                        }
                    }
                }
            } (clipboard.get(0), 0));

            return result;
        }

        /**
         * Creates operations from the clipboard data returned by parseClipboard(...)
         * @param {Array} clipboardData
         * @param {Selection} [sel]
         */
        function createOperationsFromTextClipboard(clipboardData) {

            var lastPos = selection.startPaM.oxoPosition.length - 1;
//                currentDepth = clipboardData[0] && clipboardData[0].depth;

            if (selection.hasRange()) {
                self.deleteSelected();
            }

            // to paste at the cursor position don't create a paragraph as first operation
            if (clipboardData.length > 1 && clipboardData[0].operation === Operations.PARA_INSERT) {
                clipboardData.shift();
            }

            undoManager.enterGroup(function () {

                _.each(clipboardData, function (entry) {

                    switch (entry.operation) {

                    case Operations.PARA_INSERT:
                        self.splitParagraph(selection.startPaM.oxoPosition);
                        selection.startPaM.oxoPosition[lastPos - 1] ++;
                        selection.startPaM.oxoPosition[lastPos] = 0;
                        selection.setTextSelection(selection.startPaM.oxoPosition);
                        break;

                    case Operations.TEXT_INSERT:
                        self.insertText(entry.data, selection.startPaM.oxoPosition);
                        selection.startPaM.oxoPosition[lastPos] += entry.data.length;
                        selection.setTextSelection(selection.startPaM.oxoPosition);
                        break;

                    case Operations.TAB_INSERT:
                        self.insertTab();
                        break;

                    case Operations.DRAWING_INSERT:
                        if (_.isString(entry.data)) {
                            if (entry.data.substring(0, 10) === 'data:image') {
                                // base64 image data
                                self.insertImageData(entry.data);
                            } else {
                                // image url
                                self.insertImageURL(entry.data);
                            }
                        }
                        break;

                    default:
                        Utils.log('createOperationsFromTextClipboard(...) - unhandled operation: ' + entry.operation);
                        break;
                    }

                }, self);

            }); // undoManager.enterGroup
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

        operationHandlers[Operations.INIT_DOCUMENT] = function (operation) {
            implInitDocument();
        };

        operationHandlers[Operations.SET_DOCUMENT_ATTRIBUTES] = function (operation) {

            var // document proerties container
                documentAttributes = self.getDocumentAttributes(),
                // passed properties from operation
                properties = _.isObject(operation.attrs) ? operation.attrs : {};

            // read various document properties and set it at the document styles
            if (properties.defaulttabstop) {
                documentAttributes.defaulttabstop = properties.defaulttabstop;
            }
            if (properties.zoom) {
                documentAttributes.zoom = properties.zoom;
            }
        };

        operationHandlers[Operations.TEXT_INSERT] = function (operation) {
            if (undoManager.isEnabled()) {
                var endPos = _.clone(operation.start, true);
                endPos[endPos.length - 1] += operation.text.length;
                endPos[endPos.length - 1] -= 1;    // switching from range mode to operation mode
                var undoOperation = { name: Operations.TEXT_DELETE, start: operation.start, end: endPos };
                undoManager.addUndo(undoOperation, operation);
            }
            implInsertText(operation.text, operation.start);
        };

        operationHandlers[Operations.TAB_INSERT] = function (operation) {
            if (implInsertTab(operation.position)) {
                if (undoManager.isEnabled()) {
                    var undoOperation = { name: Operations.TEXT_DELETE, start: operation.position, end: operation.position };
                    undoManager.addUndo(undoOperation, operation);
                }
            }
        };

/*
        operationHandlers[Operations.DELETE] = function (operation) { // this shall be the only delete operation
            if (undoManager.isEnabled()) {
                var localStart = _.copy(operation.start, true),
                    localEnd = _.copy(operation.end, true),
                    startLastVal = localStart.pop(),
                    endLastVal = localEnd.pop(),
                    undoOperation = { name: Operations.TEXT_INSERT, start: operation.start, text: Position.getParagraphText(editdiv, localStart, startLastVal, endLastVal) };
                undoManager.addUndo(undoOperation, operation);
            }
            implDelete(operation.start, operation.end);
        };
*/

        operationHandlers[Operations.MOVE] = function (operation) {
            if (undoManager.isEnabled()) {
                var undoOperation = { name: Operations.MOVE, start: operation.end, end: operation.start };
                undoManager.addUndo(undoOperation, operation);
            }
            implMove(operation.start, operation.end);
        };

        operationHandlers[Operations.TEXT_DELETE] = function (operation) {
            if (undoManager.isEnabled()) {
                var position = operation.start.slice(0, -1),
                    paragraph = Position.getCurrentParagraph(editdiv, position),
                    start = operation.start[operation.start.length - 1],
                    end = operation.end[operation.end.length - 1],
                    generator = new Operations.Generator();

                generator.generateParagraphChildOperations(paragraph, position, { start: start, end: end, clear: true });
                undoManager.addUndo(generator.getOperations(), operation);
            }
            implDeleteText(operation.start, operation.end);
        };

        operationHandlers[Operations.INSERT_STYLE] = function (operation) {

            var // target style sheet container
                styleSheets = self.getStyleSheets(operation.type),
                // passed attributes from operation
                attributes = _.isObject(operation.attrs) ? operation.attrs : {};

            if (!styleSheets) {
                Utils.warn('Editor.insertStylesheet(): invalid style family: ' + operation.type);
                return;
            }

            if (undoManager.isEnabled()) {
                // TODO!!!
            }

            if (operation.pooldefault === true) {
                styleSheets.setAttributeDefaults(attributes[operation.type]);
            } else {
                styleSheets.addStyleSheet(operation.styleid, operation.stylename, operation.parent, attributes,
                    { hidden: operation.hidden, priority: operation.uipriority, defStyle: operation['default'] });
            }
        };

        operationHandlers[Operations.INSERT_THEME] = function (operation) {

            if (undoManager.isEnabled()) {
                // TODO!!!
            }

            self.getThemes().addTheme(operation.themename, operation.attrs);
        };

        operationHandlers[Operations.INSERT_FONT_DESC] = function (operation) {
            // TODO!
        };

        operationHandlers[Operations.INSERT_LIST] = function (operation) {
            undoManager.addUndo({ name: Operations.DELETE_LIST, listname: operation.listname }, operation);
            lists.addList(operation.listname, operation.listdefinition);
        };

        operationHandlers[Operations.DELETE_LIST] = function (operation) {
            // no Undo, cannot be removed by UI
            lists.deleteList(operation.listname);
        };

        operationHandlers[Operations.ATTRS_SET] = function (operation) {
            // undo/redo generation is done inside implSetAttributes()
            implSetAttributes(operation.start, operation.end, operation.attrs);
        };

        operationHandlers[Operations.ATTRS_CLEAR] = function (operation) {
            // undo/redo generation is done inside implSetAttributes()
            implSetAttributes(operation.start, operation.end, null);
        };

        operationHandlers[Operations.PARA_INSERT] = function (operation) {

            var // the new paragraph
                paragraph = DOM.createParagraphNode(),
                // insert the paragraph into the DOM tree
                inserted = insertContentNode(operation.start, paragraph),
                // text position at the beginning of the paragraph
                startPosition = null;

            // insertContentNode() writes warning to console
            if (!inserted) { return; }

            // insert required helper nodes
            validateParagraphNode(paragraph);
            startPosition = Position.appendNewIndex(operation.start);

            // generate undo/redo operations
            if (undoManager.isEnabled()) {
                undoManager.addUndo({ name: Operations.PARA_DELETE, start: operation.start }, operation);
            }

            // insert text into the new paragraph if specified (no seperate
            // undo needed because this is covered by the deleteParagraph operation)
            if (_.isString(operation.text) && (operation.text.length > 0)) {
                implInsertText(operation.text, startPosition);
            }

            // set cursor to beginning of the new paragraph
            lastOperationEnd = startPosition;

            // the paragraph can be part of a list, update all lists
            implUpdateLists();
        };

        operationHandlers[Operations.PARA_DELETE] = function (operation) {

            var // node info about the paragraph to be deleted
                nodeInfo = Position.getDOMPosition(editdiv, operation.start, true),
                // the undo/redo operations
                generator = undoManager.isEnabled() ? new Operations.Generator() : null;

            // get current paragraph
            if (!nodeInfo || !DOM.isParagraphNode(nodeInfo.node)) {
                Utils.warn('Editor.deleteParagraph(): no paragraph found at position ' + JSON.stringify(operation.start));
                return;
            }

            // generate undo/redo operations
            if (generator) {
                generator.generateParagraphOperations(nodeInfo.node, operation.start);
                undoManager.addUndo(generator.getOperations(), operation);
            }

            // remove the paragraph from the DOM
            $(nodeInfo.node).remove();
        };

        operationHandlers[Operations.PARA_SPLIT] = function (operation) {
            if (undoManager.isEnabled()) {
                var localStart = _.copy(operation.start, true);
                localStart.pop();
                var undoOperation = { name: Operations.PARA_MERGE, start: localStart };
                undoManager.addUndo(undoOperation, operation);
            }
            implSplitParagraph(operation.start);
        };

        operationHandlers[Operations.PARA_MERGE] = function (operation) {

            var // the paragraph that will be merged with its next sibling
                paragraphInfo = Position.getDOMPosition(editdiv, operation.start, true),
                // current and next paragraph, as jQuery objects
                thisParagraph = null, nextParagraph = null,
                // text position at end of current paragraph, logical position of next paragraph
                paraEndPosition = null, nextParaPosition = null,
                // first child node of next paragraph
                firstChildNode = null,
                // the undo/redo operations
                generator = undoManager.isEnabled() ? new Operations.Generator() : null;

            // get current paragraph
            if (!paragraphInfo || !DOM.isParagraphNode(paragraphInfo.node)) {
                Utils.warn('Editor.mergeParagraph(): no paragraph found at position ' + JSON.stringify(operation.start));
                return;
            }
            thisParagraph = $(paragraphInfo.node);
            paraEndPosition = Position.appendNewIndex(operation.start, Position.getParagraphLength(editdiv, operation.start));

            // get next paragraph
            nextParagraph = thisParagraph.next();
            if (!DOM.isParagraphNode(nextParagraph)) {
                Utils.warn('Editor.mergeParagraph(): no paragraph found after position ' + JSON.stringify(operation.start));
                return;
            }
            nextParaPosition = Position.increaseLastIndex(operation.start);

            // generate undo/redo operations
            if (generator) {
                generator.generateOperation(Operations.PARA_SPLIT, { start: paraEndPosition });
                generator.generateOperation(Operations.ATTRS_CLEAR, { start: nextParaPosition });
                generator.generateSetAttributesOperation(nextParagraph, nextParaPosition);
                undoManager.addUndo(generator.getOperations(), operation);
            }

            // remove dummy text node from current paragraph
            if (DOM.isDummyTextNode(thisParagraph[0].lastChild)) {
                $(thisParagraph[0].lastChild).remove();
            }

            // remove list label node from next paragraph
            nextParagraph.children(DOM.LIST_LABEL_NODE_SELECTOR).remove();

            // append all children of the next paragraph to the current paragraph, delete the next paragraph
            firstChildNode = nextParagraph[0].firstChild;
            thisParagraph.append(nextParagraph.children());
            nextParagraph.remove();

            // remove one of the sibling text spans at the concatenation point,
            // if one is empty; otherwise try to merge equally formatted text spans
            if (DOM.isTextSpan(firstChildNode) && DOM.isTextSpan(firstChildNode.previousSibling)) {
                if (DOM.isEmptySpan(firstChildNode)) {
                    $(firstChildNode).remove();
                } else if (DOM.isEmptySpan(firstChildNode.previousSibling)) {
                    $(firstChildNode.previousSibling).remove();
                } else {
                    CharacterStyles.mergeSiblingTextSpans(firstChildNode);
                }
            }

            // refresh DOM
            implParagraphChanged(thisParagraph);
            implUpdateLists();

            // new cursor position at merge position
            lastOperationEnd = _.clone(paraEndPosition);
        };

        operationHandlers[Operations.TABLE_INSERT] = function (operation) {

            var // the new table
                table = $('<table>').append($('<colgroup>')),
                // insert the table into the DOM tree
                inserted = insertContentNode(operation.position, table);

            // insertContentNode() writes warning to console
            if (!inserted) { return; }

            // generate undo/redo operations
            if (undoManager.isEnabled()) {
                undoManager.addUndo({ name: Operations.TABLE_DELETE, start: operation.position }, operation);
            }

            // apply the passed table attributes
            if (_.isObject(operation.attrs) && !_.isEmpty(operation.attrs)) {
                tableStyles.setElementAttributes(table, operation.attrs);
            }
        };

        operationHandlers[Operations.TABLE_DELETE] = function (operation) {
            var table = Position.getTableElement(editdiv, operation.start);
            if (table) {
                if (undoManager.isEnabled()) {
                    // generate undo operations for the entire table
                    var generator = new Operations.Generator();
                    generator.generateTableOperations(table, operation.start);
                    undoManager.addUndo(generator.getOperations(), operation);
                }
                implDeleteTable(operation.start);
            }
        };

        operationHandlers[Operations.CELLS_DELETE] = function (operation) {
            var tableRow = Position.getTableRowElement(editdiv, operation.position);
            if (tableRow) {
                if (undoManager.isEnabled()) {
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
                    undoManager.addUndo(generator.getOperations(), operation);
                }
                implDeleteCells(operation.position, operation.start, operation.end);
            }
        };

        operationHandlers[Operations.ROWS_DELETE] = function (operation) {
            if (undoManager.isEnabled()) {
                var start = operation.start,
                    end = operation.end || start,
                    generator = new Operations.Generator();

                for (var i = start; i <= end; i += 1) {
                    var localPos = operation.position.concat([i]),
                        tableRow = Position.getTableRowElement(editdiv, localPos);
                    if (tableRow) {
                        generator.generateTableRowOperations(tableRow, localPos);
                    }
                }
                undoManager.addUndo(generator.getOperations(), operation);
            }
            implDeleteRows(operation.position, operation.start, operation.end);
        };

        operationHandlers[Operations.COLUMNS_DELETE] = function (operation) {
            var table = Position.getTableElement(editdiv, operation.position);
            if (table) {
                if (undoManager.isEnabled()) {

                    var allRows = DOM.getTableRows(table),
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
                    undoManager.addUndo(generator.getOperations(), operation);
                }
                implDeleteColumns(operation.position, operation.startgrid, operation.endgrid);
            }
        };

        operationHandlers[Operations.CELL_MERGE] = function (operation) {
            if (undoManager.isEnabled()) {
                var content = null,
                    gridspan = null,
                    undoOperation = { name: Operations.CELL_SPLIT, position: operation.position, content: content, gridspan: gridspan };
                undoManager.addUndo(undoOperation, operation);
            }
            implMergeCell(_.copy(operation.position, true), operation.count);
        };

        operationHandlers[Operations.CELL_INSERT] = function (operation) {
            if (undoManager.isEnabled()) {
                var pos = _.copy(operation.position, true),
                    start = pos.pop(),
                    count = operation.count || 1,
                    end = start + count - 1,
                    undoOperation = { name: Operations.CELLS_DELETE, position: pos, start: start, end: end };
                undoManager.addUndo(undoOperation, operation);
            }
            implInsertCell(_.copy(operation.position, true), operation.count, operation.attrs);
        };

        operationHandlers[Operations.ROW_INSERT] = function (operation) {
            if (undoManager.isEnabled()) {
                var pos = _.copy(operation.position, true),
                    start = pos.pop(),
                    end = start,
                    undoOperation = { name: Operations.ROWS_DELETE, position: pos, start: start, end: end };
                undoManager.addUndo(undoOperation, operation);
            }
            implInsertRow(operation.position, operation.count, operation.insertdefaultcells, operation.referencerow, operation.attrs);
        };

        operationHandlers[Operations.COLUMN_INSERT] = function (operation) {
            if (undoManager.isEnabled()) {
                undoManager.startGroup();
                // COLUMNS_DELETE cannot be the answer to COLUMN_INSERT, because the cells of the new column may be inserted
                // at very different grid positions. It is only possible to remove the new cells with deleteCells operation.
                var localPos = _.copy(operation.position, true),
                    table = Position.getDOMPosition(editdiv, localPos).node,  // -> this is already the new grid with the new column!
                    allRows = DOM.getTableRows(table),
                    allCellInsertPositions = Table.getAllInsertPositions(allRows, operation.gridposition, operation.insertmode);

                for (var i = (allCellInsertPositions.length - 1); i >= 0; i--) {
                    var rowPos = _.copy(localPos, true),
                        start = allCellInsertPositions[i],
                        end = start;  // only one cell within each operation
                    rowPos.push(i);
                    var undoOperation = { name: Operations.CELLS_DELETE, position: rowPos, start: start, end: end };
                    undoManager.addUndo(undoOperation);
                }

                undoManager.addUndo(null, operation);  // only one redo operation

                undoManager.endGroup();
            }
            implInsertColumn(operation.position, operation.gridposition, operation.tablegrid, operation.insertmode);
        };

        operationHandlers[Operations.DRAWING_INSERT] = function (operation) {
            if (implInsertDrawing(operation.type, operation.position, operation.attrs)) {
                if (undoManager.isEnabled()) {
                    var undoOperation = { name: Operations.TEXT_DELETE, start: operation.position, end: operation.position };
                    undoManager.addUndo(undoOperation, operation);
                }
            }
        };

        operationHandlers[Operations.FIELD_INSERT] = function (operation) {
            if (implInsertField(operation.position, operation.type, operation.representation)) {
                if (undoManager.isEnabled()) {
                    var undoOperation = { name: Operations.TEXT_DELETE, start: operation.position, end: operation.position };
                    undoManager.addUndo(undoOperation, operation);
                }
            }
        };

        /**
         * Central dispatcher function for operations.
         *
         * @param {Object} [options]
         *  A map with options to control the behavior of this method. The
         *  following options are supported:
         *  @param {Boolean} [options.silent=false]
         *      If set to true, the operation will be applied silently: No undo
         *      action will be generated, and no operation listeners will be
         *      notified.
         */
        function applyOperation(operation, options) {

            var // the function that executes the operation
                operationHandler = null,
                // silent mode
                silent = Utils.getBooleanOption(options, 'silent', false),
                // deep copy of the operation, for notification (undo manager may modify operations)
                notifyOperation = _.copy(operation, true);

            if (!_.isObject(operation)) {
                Utils.error('Editor.applyOperation(): expecting operation object');
                return;
            }

            // get and check operation handler
            operationHandler = operationHandlers[operation.name];
            if (!_.isFunction(operationHandler)) {
                Utils.warn('Editor.applyOperation(): invalid operation name "' + operation.name + '".');
                return;
            }

            if (blockOperations) {
                // This can only happen if someone tries to apply new operation in the operation notify.
                // This is not allowed because a document manipulation method might be split into multiple operations, following operations would have invalid positions then.
                Utils.warn('Editor.applyOperation(): operations blocked');
                return;
            }

            blockOperations = true;

            // remove highlighting before changing the DOM which invalidates the positions in highlightRanges
            self.removeHighlighting();

            // store operation in internal operations list
            if (!silent) {
                operations.push(operation);
            }

            // execute the operation handler (set function context to editor instance)
            operationHandler.call(self, operation);

            if (!silent) {
                // Will give everybody the same copy - how to give everybody his own copy?
                self.trigger('operation', notifyOperation);
            }

            blockOperations = false;
        }

        // ==================================================================
        // Private selection functions
        // ==================================================================

        function updateSelection(backwards) {

            var // deferred return value
                def = $.Deferred();

            if (focused) {
                // browser needs to process pending events before its selection can be querried
                window.setTimeout(function () {
                    selection.updateFromBrowserSelection(backwards);
                    def.resolve();
                }, 0);
            } else {
                def.reject();
            }

            return def.promise();
        }

        /**
         * Draws a selection box for the specified drawing node and registers
         * mouse handlers for moving and resizing.
         *
         * @param {HTMLElement|jQuery} drawing
         *  The drawing node to be selected. If this value is a jQuery
         *  collection, uses the first DOM node it contains.
         */
        function drawDrawingSelection(drawing) {

            var startX = 0,
                startY = 0,
                currentX = 0,
                currentY = 0,
                shiftX = 0,
                shiftY = 0,
                finalWidth = 0,
                finalHeight = 0,
                nodeOptions = {},
                moveable = true,
                sizeable = true,
                // all available cursor styles
                cursorstyles = {
                    tl: 'nw-resize',
                    t : 'n-resize',
                    tr: 'ne-resize',
                    r : 'e-resize',
                    br: 'se-resize',
                    b : 's-resize',
                    bl: 'sw-resize',
                    l : 'w-resize'
                };

            function mouseDownOnDrawing(event, drawingNode, pos) {
                // mouse down event handler
                startX = event.pageX;
                startY = event.pageY;

                // storing old height and width of drawing
                nodeOptions.oldWidth = $(drawingNode).width();
                nodeOptions.oldHeight = $(drawingNode).height();
                nodeOptions.isInline = $(drawingNode).hasClass('inline');
                nodeOptions.isRightFloated = $(drawingNode).hasClass('float') && $(drawingNode).hasClass('right');

                if (pos) {
                    // collecting information about the handle node
                    nodeOptions.useX = (_.contains(['tl', 'tr', 'r', 'br', 'bl', 'l'], pos));
                    nodeOptions.useY = (_.contains(['tl', 't', 'tr', 'br', 'b', 'bl'], pos));
                    nodeOptions.topSelection = (_.contains(['tl', 't', 'tr'], pos));
                    nodeOptions.rightSelection = (_.contains(['tr', 'r', 'br'], pos));
                    nodeOptions.bottomSelection = (_.contains(['br', 'b', 'bl'], pos));
                    nodeOptions.leftSelection = (_.contains(['tl', 'bl', 'l'], pos));

                    nodeOptions.cursorStyle = cursorstyles[pos];  // resizing drawing

                    nodeOptions.isResizeEvent = true;
                    nodeOptions.isMoveEvent = false;
                } else {
                    nodeOptions.cursorStyle = 'move';  // moving drawing

                    nodeOptions.isResizeEvent = false;
                    nodeOptions.isMoveEvent = true;
                }

                // setting cursor
                editdiv.css('cursor', nodeOptions.cursorStyle);  // setting cursor for increasing drawing
                $('div.selection', editdiv).css('cursor', nodeOptions.cursorStyle); // setting cursor for decreasing drawing
                $('div.move', editdiv).css('cursor', nodeOptions.cursorStyle); // setting cursor for flexible move node
            }

            function mouseMoveOnDrawing(event, moveBoxNode) {
                // mouse move event handler
                moveBoxNode.css('border-width', '2px');  // making move box visible

                currentX = event.pageX;
                currentY = event.pageY;

                if (nodeOptions.isResizeEvent) {

                    // resetting values used in mouse up handler
                    finalWidth = 0;
                    finalHeight = 0;

                    var deltaX = 0,
                        deltaY = 0,
                        leftShift = 0,
                        topShift = 0,
                        newWidth = 0,
                        newHeight = 0,
                        borderwidth = 3;

                    if (nodeOptions.useX) { deltaX = currentX - startX; }
                    if (nodeOptions.useY) { deltaY = currentY - startY; }

                    if ((deltaX !== 0) || (deltaY !== 0)) {

                        if ((deltaX !== 0) && (nodeOptions.leftSelection)) {
                            leftShift = deltaX;
                            deltaX = - deltaX;
                        }

                        if ((deltaY !== 0) && (nodeOptions.topSelection)) {
                            topShift = deltaY;
                            deltaY = - deltaY;
                        }

                        newWidth = nodeOptions.oldWidth + deltaX;
                        newHeight = nodeOptions.oldHeight + deltaY;

                        if ((newWidth > 0) && (newHeight > 0)) {

                            finalWidth = newWidth;
                            finalHeight = newHeight;

                            finalWidth -= borderwidth;   // taking care of border width
                            finalHeight -= borderwidth;  // taking care of border width

                            moveBoxNode.css({ width: finalWidth, height: finalHeight, left: leftShift, top: topShift });
                        }
                    }
                } else if (nodeOptions.isMoveEvent) {

                    shiftX = currentX - startX;
                    shiftY = currentY - startY;

                    if ((_.isNumber(shiftX)) && (_.isNumber(shiftY)) && (shiftX !== 0) || (shiftY !== 0)) {
                        moveBoxNode.css({ 'left': shiftX, 'top': shiftY, 'width': nodeOptions.oldWidth, 'height': nodeOptions.oldHeight });
                    }
                }
            }

            function mouseUpOnDrawing(event, drawingNode, moveBoxNode) {
                // mouse up handler
                moveBoxNode.css({'border-width': 0, 'left': 0, 'top': 0});  // making move box invisible and shifting it back into drawing

                if (nodeOptions.isResizeEvent) {

                    if ((finalWidth > 0) && (finalHeight > 0)) {

                        var width = Utils.convertLengthToHmm(finalWidth, 'px'),
                            height = Utils.convertLengthToHmm(finalHeight, 'px'),
                            updatePosition = Position.getOxoPosition(editdiv, drawingNode, 0),
                            newOperation = { name: Operations.ATTRS_SET, attrs: {width: width, height: height}, start: updatePosition };

                        applyOperation(newOperation);
                    }
                } else if (nodeOptions.isMoveEvent) {

                    if ((_.isNumber(shiftX)) && (_.isNumber(shiftY)) && (shiftX !== 0) || (shiftY !== 0)) {

                        var moveX = Utils.convertLengthToHmm(shiftX, 'px'),
                            moveY = Utils.convertLengthToHmm(shiftY, 'px'),
                            updatePosition = Position.getOxoPosition(editdiv, drawingNode, 0),
                            newOperation = null,
                            anchorhoffset = 0,
                            anchorvoffset = 0,
                            oldanchorhoffset = StyleSheets.getExplicitAttributes(drawingNode).anchorhoffset,
                            oldanchorvoffset = StyleSheets.getExplicitAttributes(drawingNode).anchorvoffset ? StyleSheets.getExplicitAttributes(drawingNode).anchorvoffset : 0,
                            anchorhbase = StyleSheets.getExplicitAttributes(drawingNode).anchorhbase,
                            anchorvbase = StyleSheets.getExplicitAttributes(drawingNode).anchorvbase,
                            anchorhalign = StyleSheets.getExplicitAttributes(drawingNode).anchorhalign,
                            anchorvalign = StyleSheets.getExplicitAttributes(drawingNode).anchorvalign,
                            // current drawing width, in 1/100 mm
                            drawingWidth = Utils.convertLengthToHmm($(drawingNode).width(), 'px'),
                            // the paragraph element containing the drawing node
                            paragraph = $(drawingNode).parent(),
                            // total width of the paragraph, in 1/100 mm
                            paraWidth = Utils.convertLengthToHmm(paragraph.width(), 'px');

                        if (oldanchorhoffset === undefined) {
                            // anchorhoffset has to be calculated corresponding to the left paragraph border
                            if (anchorhalign === 'right') {
                                oldanchorhoffset = paraWidth - drawingWidth;
                            } else if (anchorhalign === 'center') {
                                oldanchorhoffset = (paraWidth - drawingWidth) / 2;
                            } else {
                                oldanchorhoffset = 0;
                            }
                        }

                        if (moveX !== 0) {
                            anchorhoffset = oldanchorhoffset + moveX;
                            anchorhalign = 'offset';
                            anchorhbase = 'column';
                            if (anchorhoffset < 0) { anchorhoffset = 0; }
                            else if (anchorhoffset > (paraWidth - drawingWidth)) { anchorhoffset = paraWidth - drawingWidth; }
                        }

                        if (moveY !== 0) {
                            anchorvoffset = oldanchorvoffset + moveY;
                            anchorvalign = 'offset';
                            anchorvbase = 'paragraph';
                            if (anchorvoffset < 0) { anchorvoffset = 0; }
                        }

                        if ((anchorhoffset !== oldanchorhoffset) || (anchorvoffset !== oldanchorvoffset)) {

                            newOperation = { name: Operations.ATTRS_SET, attrs: {anchorhoffset: anchorhoffset, anchorvoffset: anchorvoffset, anchorhalign: anchorhalign, anchorvalign: anchorvalign, anchorhbase: anchorhbase, anchorvbase: anchorvbase}, start: updatePosition };

                            applyOperation(newOperation);
                        }
                    }
                }

                // Resetting shiftX and shiftY, for new mouseup events without mousemove
                shiftX = 0;
                shiftY = 0;
                nodeOptions = {};

                // Resetting cursor, using css file again
                editdiv.css('cursor', '');
                $('div.selection', editdiv).css('cursor', '');
                $('div.move', editdiv).css('cursor', '');
            }

            // inline drawings are currently not moveable
            if (DOM.isInlineDrawingNode(drawing)) {
                moveable = false;
            }

            // draw the selection box into the passed drawings
            DOM.drawDrawingSelection(drawing, { moveable: moveable, sizeable: sizeable }, mouseDownOnDrawing, mouseMoveOnDrawing, mouseUpOnDrawing, self);
        }

        /**
         * Draws a selection box for the specified resize node and registers
         * mouse handlers for moving.
         *
         * @param {HTMLElement|jQuery} resizeObject
         *  The drawing node to be selected. If this value is a jQuery
         *  collection, uses the first DOM node it contains.
         */
        function drawTableCellResizeSelection(resizeObject) {

            var startX = 0,
                startY = 0,
                currentX = 0,
                currentY = 0,
                shiftX = 0,
                shiftY = 0,
                // verticalResize is true, if the column width will be modified
                verticalResize = false,
                // horizontalResize is true, if the row height will be modified
                horizontalResize = false,
                // the window, to which the resize line will be appended temporarely
                officemaindiv = app.getWindow().nodes.main,
                // the container element used to visualize the resizing
                resizeLine = $('<div>').addClass('resizeline'),
                // the distance from body element to 'officemaindiv' in pixel
                topDistance = officemaindiv.offset().top,
                // the cell node for the selected resize node
                cellNode = null,
                // the row node for the selected resize node
                rowNode =  null,
                // the table node for the selected resize node
                tableNode = null,
                // the maximum table width
                maxTableWidth = 0,
                // is the selected cell the last cell in its row
                lastCell = false,
                // logical position of the selected node
                tablePosition = [],
                // table grid before shifting column
                oldTableGrid = [],
                // table width after shifting column
                newTableWidth = 0,
                // table width before shifting column
                oldTableWidth = 0,
                // table grid, containing relative widths
                tableGrid = [],
                // table grid, containing calculated pixel widhts
                pixelGrid = [],
                // sum of all grid values, will not be modified
                gridSum = 0,
                // the number of the grid count, that will be modified
                shiftedGrid = 0,
                // maximum shift to the left
                maxLeftShift = 0,
                // maximum shift to the right
                maxRightShift = 0,
                // maximum shift to the top
                maxTopShift = 0,
                // maximum right value of shift position
                maxRightValue = 0,
                // minimum left value of shift position
                minLeftValue = 0,
                // minimum width of a column in px
                minColumnWidth = 10;

            function mouseDownOnResizeNode(event, resizeNode) {
                // mouse down event handler
                startX = event.pageX;
                startY = event.pageY - topDistance;

                if ($(resizeNode).is('div.rightborder')) {
                    verticalResize = true;
                } else if ($(resizeNode).is('div.bottomborder')) {
                    horizontalResize = true;
                }

                // calculating maximum resize values
                cellNode = $(resizeNode).closest('td, th');
                rowNode =  $(resizeNode).closest('tr');
                tableNode = $(resizeNode).closest('table');

                if (verticalResize) {
                    $(resizeLine).css({ width: '1px', height: '100%', left: startX, top: '0px' });
                    officemaindiv.append(resizeLine);

                    // calculating maxLeftShift and maxRightShift
                    lastCell = cellNode[0].nextSibling ? false : true;
                    tablePosition = Position.getOxoPosition(editdiv, tableNode.get(0), 0);
                    oldTableGrid = StyleSheets.getExplicitAttributes(tableNode).tablegrid;
                    oldTableWidth = StyleSheets.getExplicitAttributes(tableNode).width;
                    maxTableWidth = tableNode.parent().width();

                    if (oldTableWidth === 0) { oldTableWidth = tableNode.outerWidth(); }
                    else { oldTableWidth = Utils.convertHmmToLength(oldTableWidth, 'px', 0); }

                    // converting from relational grid to pixel grid
                    for (var i = 0; i < oldTableGrid.length; i++) { gridSum += oldTableGrid[i]; }
                    for (var i = 0; i < oldTableGrid.length; i++) { pixelGrid.push(Utils.roundDigits(oldTableGrid[i] * oldTableWidth / gridSum, 0)); }

                    // which border was shifted?
                    shiftedGrid = Table.getGridPositionFromCellPosition(rowNode, cellNode.prevAll().length).end;

                    maxLeftShift = pixelGrid[shiftedGrid];
                    if (! lastCell) { maxRightShift = pixelGrid[shiftedGrid + 1]; }
                    else { maxRightShift = maxTableWidth - oldTableWidth; }

                } else if (horizontalResize) {
                    $(resizeLine).css({ width: '100%', height: '1px', left: '0px', top: startY});
                    officemaindiv.append(resizeLine);
                    // calculating maxTopShift (for bottom shift there is no limit)
                    maxTopShift = cellNode.outerHeight();
                }

                editdiv.css('cursor', $(resizeNode).css('cursor'));  // setting cursor for increasing drawing
                $(resizeLine).css('cursor', $(resizeNode).css('cursor'));  // setting cursor for increasing drawing
            }

            function mouseMoveOnResizeNode(event, resizeNode) {

                // mouse move event handler
                currentX = event.pageX;
                currentY = event.pageY - topDistance;

                if (verticalResize) {

                    maxRightValue = startX + maxRightShift;
                    minLeftValue = startX - maxLeftShift + minColumnWidth;
                    if (! lastCell) { maxRightValue -= minColumnWidth; }

                    shiftX = currentX;
                    shiftY = 0;

                    if (shiftX >= maxRightValue) {
                        shiftX = maxRightValue;
                    } else if (shiftX <= minLeftValue) {
                        shiftX = minLeftValue;
                    }

                } else if (horizontalResize) {
                    shiftX = 0;
                    shiftY = currentY;

                    if ((shiftY - startY) <= - maxTopShift) {
                        shiftY = startY - maxTopShift;
                    }
                }

                if ((_.isNumber(shiftX)) && (_.isNumber(shiftY))) {
                    $(resizeLine).css({'left': shiftX, 'top': shiftY});
                }
            }

            function mouseUpOnResizeNode(event, resizeNode) {
                // mouse up event handler
                currentX = event.pageX;
                currentY = event.pageY - topDistance;

                // removing the resize line
                officemaindiv.children('div.resizeline').remove();

                // Resetting cursor, using css file again
                editdiv.css('cursor', '');

                if (verticalResize) {

                    if ((_.isNumber(currentX)) && (currentX !== startX)) {

                        maxRightValue = startX + maxRightShift;
                        minLeftValue = startX - maxLeftShift + minColumnWidth;
                        if (! lastCell) { maxRightValue -= minColumnWidth; }

                        if (currentX >= maxRightValue) {
                            currentX = maxRightValue;
                        } else if (currentX <= minLeftValue) {
                            currentX = minLeftValue;
                        }

                        shiftX = currentX - startX;

                        newTableWidth = lastCell ? (oldTableWidth + shiftX) : oldTableWidth;

                        // -> shifting the border
                        pixelGrid[shiftedGrid] += shiftX;
                        if (! lastCell) { pixelGrid[shiftedGrid + 1] -= shiftX; }

                        // converting modified pixel grid to new relation table grid
                        for (var i = 0; i < pixelGrid.length; i++) {
                            tableGrid.push(Utils.roundDigits(gridSum * pixelGrid[i] / newTableWidth, 0));  // only ints
                        }

                        if ((! lastCell) && (StyleSheets.getExplicitAttributes(tableNode).width === 0)) { newTableWidth = 0; }
                        else { newTableWidth = Utils.convertLengthToHmm(newTableWidth, 'px'); }

                        var newOperation = {name: Operations.ATTRS_SET, attrs: {'tablegrid': tableGrid, 'width': newTableWidth}, start: tablePosition};
                        applyOperation(newOperation);
                    }
                } else if (horizontalResize) {

                    if ((_.isNumber(currentY)) && (currentY !== startY)) {

                        var rowHeight = rowNode.outerHeight() + currentY - startY;

                        if (rowHeight < 0) { rowHeight = 0; }

                        var newRowHeight = Utils.convertLengthToHmm(rowHeight, 'px'),
                            rowPosition = Position.getOxoPosition(editdiv, rowNode.get(0), 0),
                            newOperation = { name: Operations.ATTRS_SET, attrs: {height: newRowHeight}, start: rowPosition };

                        applyOperation(newOperation);
                    }
                }

                // deregister event handler
                // removing mouse event handler (mouseup and mousemove) from page div
                $(document).off('mouseup mousemove');
                $(resizeNode).off('mousedown');
            }

            // draw the resize line at the position of the passed resize node
            DOM.drawTablecellResizeLine(resizeObject, mouseDownOnResizeNode, mouseMoveOnResizeNode, mouseUpOnResizeNode, self);
        }

        // End of private selection functions

        /**
         * Removes empty text nodes from the passed paragraph, checks whether
         * it needs a dummy text node, and converts consecutive white-space
         * characters.
         *
         * @param {HTMLElement|jQuery} paragraph
         *  The paragraph element to be validated. If this object is a jQuery
         *  collection, uses the first DOM node it contains.
         */
        function validateParagraphNode(paragraph) {

            var // current sequence of sibling text nodes
                siblingTextNodes = [],
                // array of arrays collecting all sequences of sibling text nodes
                allSiblingTextNodes = [siblingTextNodes],
                // whether the paragraph contains any text
                hasText = false,
                // whether the last child node is the dummy element
                hasLastDummy = false;

            // convert parameter to a DOM node
            paragraph = Utils.getDomNode(paragraph);

            // whether last node is the dummy node
            hasLastDummy = DOM.isDummyTextNode(paragraph.lastChild);

            // remove all empty text spans which have sibling text spans, and collect
            // sequences of sibling text spans (needed for white-space handling)
            Position.iterateParagraphChildNodes(paragraph, function (node) {

                // visit all text spans embedded in text container nodes (fields, tabs, numbering labels, ...)
                if (DOM.isTextSpan(node) || DOM.isTextSpanContainerNode(node)) {
                    DOM.iterateTextSpans(node, function (span) {

                        if (DOM.isEmptySpan(span)) {
                            // remove this span, if it is an empty portion and has a sibling text portion
                            if (DOM.isTextSpan(span.previousSibling) || DOM.isTextSpan(span.nextSibling)) {
                                $(span).remove();
                            }
                            // otherwise simply ignore the empty span
                        } else {
                            // append text node to current sequence
                            siblingTextNodes.push(span.firstChild);
                        }
                    });

                // anything else (no text span or text container node): start a new sequence of text nodes
                } else {
                    allSiblingTextNodes.push(siblingTextNodes = []);
                }

            }, undefined, { allNodes: true });

            // Convert consecutive white-space characters to sequences of SPACE/NBSP
            // pairs. We cannot use the CSS attribute white-space:pre-wrap, because
            // it breaks the paragraph's CSS attribute text-align:justify. Process
            // each sequence of sibling text nodes for its own (the text node
            // sequences may be interrupted by other elements such as hard line
            // breaks, drawings, or other objects).
            // TODO: handle explicit NBSP inserted by the user (when supported)
            _(allSiblingTextNodes).each(function (siblingTextNodes) {

                var // the complete text of all sibling text nodes
                    text = '',
                    // offset for final text distribution
                    offset = 0;

                // collect the complete text in all text nodes
                _(siblingTextNodes).each(function (textNode) { text += textNode.nodeValue; });

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
                    _(siblingTextNodes).each(function (textNode) {
                        var length = textNode.nodeValue.length;
                        textNode.nodeValue = text.substr(offset, length);
                        offset += length;
                    });
                }
            });

            // insert an empty text span if there is no other content (except the dummy node)
            if (!paragraph.hasChildNodes() || (hasLastDummy && (paragraph.childNodes.length === 1))) {
                $(paragraph).prepend(DOM.createTextSpan());
            }

            // append dummy text node if the paragraph contains no text,
            // or remove it if there is any text
            if (!hasText && !hasLastDummy) {
                $(paragraph).append(DOM.createDummyTextNode());
            } else if (hasText && hasLastDummy) {
                $(paragraph.lastChild).remove();
            }

            // initialize paragraph and character formatting from current paragraph style
            paragraphStyles.updateElementFormatting(paragraph);

            // adjust tabulator positions
            adjustTabsOfParagraph(paragraph);
        }

        /**
         * Private helper function to update all tabs inside a paragraph. This
         * function uses both the default tab size and existing paragraph tab
         * stop definitions. Tab fill characters are also supported.
         *
         * Currently only left aligned tabs are supported!
         *
         * @param {HTMLElement|jQuery} paragraph
         *  The paragraph element to be adjusted. If this object is a jQuery
         *  collection, uses the first DOM node it contains.
         */
        function adjustTabsOfParagraph(paragraph) {
            var allTabNodes = [];

            Position.iterateParagraphChildNodes(paragraph, function (node) {
                if (DOM.isTabNode(node)) {
                    allTabNodes.push(node);
                }
            });

            if (allTabNodes.length > 0) {

                var defaultTabstop = self.getDocumentAttributes().defaulttabstop,
                    paraStyles = paragraphStyles.getElementAttributes(paragraph),
                    paraTabstops = [];

                // paragraph tab stop definitions
                if (paraStyles && paraStyles.tabstops) {
                    paraTabstops = paraStyles.tabstops;
                }

                var marginLeft = Utils.convertLengthToHmm(parseFloat($(paragraph).css('margin-left')), 'px');
                _(allTabNodes).each(function (tabNode) {
                    var pos = $(tabNode).position();
                    if (pos) {
                        var leftHMM = marginLeft + Utils.convertLengthToHmm(pos.left, "px"),
                            width = 0,
                            fillChar = null,
                            tabSpan = tabNode.firstChild;

                        // Paragraph tab stops. Only paragraph tab stop can have a leader and
                        // define a new alignment
                        if (paraTabstops && paraTabstops.length > 0) {
                            var tabstop = _.find(paraTabstops, function (tab) { return (leftHMM + 1) < tab.pos; });
                            if (tabstop && tabSpan) {
                                // tabsize calculation based on the paragraph defined tabstop
                                width = Math.max(0, tabstop.pos - (leftHMM % tabstop.pos));
                                if (tabstop.leader) {
                                    switch (tabstop.leader) {
                                    case 'dot':
                                        fillChar = '.';
                                        break;
                                    case 'hyphen':
                                        fillChar = '-';
                                        break;
                                    case 'underscore':
                                        fillChar = '_';
                                        break;
                                    }
                                    if (fillChar)
                                        $(tabSpan).text(createTabFillCharString(tabSpan, width, fillChar));
                                }
                            }
                        }

                        if (width <= 1) {
                            // tabsize calculation based on default tabstop
                            width = Math.max(0, defaultTabstop - (leftHMM % defaultTabstop));
                            width = (width <= 1) ? defaultTabstop : width; // no 0 tab size allowed, check for <= 1 to prevent rounding errors
                            // reset possible fill character
                            if (tabSpan)
                                $(tabSpan).text('');
                        }
                        $(tabNode).css('width', (width / 100) + 'mm');
                    }
                });
            }
        }

        /**
         * Private helper to create a string with a sufficient number
         * of a provided fill character.
         *
         * @param {HTMLElement|jQuery} paragraph
         *  The element to be used for the width calculation.
         *
         * @param {Number} maxWidth
         *  The maximal width in 1/100th mm to be filled
         *
         * @param {String} fillChar
         *  A string with a single character to used to fill the
         *  string.
         *
         * @returns {String}
         *  A string which contains a number of fill chars
         *  where the width is smaller or equal to maxWidth.
         */
        function createTabFillCharString(element, maxWidth, fillChar) {
            var charWidth = 0, numChars;

            charWidth = Utils.convertLengthToHmm($(element).text(fillChar).width(), 'px');
            numChars = Math.floor(maxWidth / charWidth);

            if (numChars > 0)
                return (new Array(numChars + 1)).join(fillChar);
            else
                return '';
        }

        // ==================================================================
        // Private image methods
        // ==================================================================

        function sendImageSize(position) {

            // sending size of image to the server in an operation -> necessary after loading the image
            var imagePos = Position.getDOMPosition(editdiv, _.copy(position), true);

            if (imagePos && DOM.isImageNode(imagePos.node)) {

                $('img', imagePos.node).one('load', function () {

                    var width, height, para, maxWidth, factor, updatePosition, newOperation;

                    // Workaround for a strange Chrome behavior, even if we use .one() Chrome fires the 'load' event twice.
                    // One time for the image node rendered and the other time for a not rendered image node.
                    // We check for the rendered image node
                    if (editdiv[0].contains(this)) {
                        width = Utils.convertLengthToHmm($(this).width(), 'px');
                        height = Utils.convertLengthToHmm($(this).height(), 'px');

                        // maybe the paragraph is not so big
                        para = imagePos.node.parentNode;
                        maxWidth = Utils.convertLengthToHmm($(para).outerWidth(), 'px');

                        if (width > maxWidth) {
                            factor = Utils.roundDigits(maxWidth / width, 2);
                            width = maxWidth;
                            height = Utils.roundDigits(height * factor, 0);
                        }

                        // updating the logical position of the image div, maybe it changed in the meantime while loading the image
                        updatePosition = Position.getOxoPosition(editdiv, this, 0);
                        newOperation = { name: Operations.ATTRS_SET, attrs: {width: width, height: height}, start: updatePosition };

                        applyOperation(newOperation);
                    }
                });
            }
        }

        // ====================================================================
        //  IMPLEMENTATION FUNCTIONS
        // Private functions, that are called from function 'applyOperation'.
        // The operations itself are never generated inside an impl*-function.
        // ====================================================================

        /**
         * Has to be called every time after changing the structure of a
         * paragraph node.
         *
         * @param {HTMLElement|jQuery|Number[]} paragraph
         *  The paragraph element as DOM node or jQuery object, or the logical
         *  position of the paragraph or any of its child components.
         */
        var implParagraphChanged = deferredMethods.createMethod(

            // direct callback: called every time when implParagraphChanged() has been called
            function registerParagraph(storage, paragraph) {
                if (_.isArray(paragraph)) {
                    paragraph = Position.getCurrentParagraph(editdiv, paragraph);
                }
                // store the new paragraph in the collection (jQuery keeps the collection unique)
                if (paragraph) {
                    storage.paragraphs = storage.paragraphs.add(paragraph);
                }
            },

            // deferred callback: called once, after current script ends
            function updateParagraphs(storage) {
                storage.paragraphs.each(function () {
                    // the paragraph may have been removed from the DOM in the meantime
                    if (editdiv[0].contains(this)) {
                        validateParagraphNode(this);
                    }
                });
                storage.paragraphs = $();
                // paragraph validation changes the DOM, restore selection
                selection.restoreBrowserSelection();
            },

            // storage object passed to all callbacks
            { paragraphs: $() }

        ); // implParagraphChanged()

        /**
         * Has to be called every time after changing the cell structure of a
         * table. It recalculates the position of each cell in the table and
         * sets the corresponding attributes. This can be set for the first or
         * last column or row, or even only for the south east cell.
         *
         * @param {HTMLTableElement|jQuery} table
         *  The table element whose structure has been changed. If this object
         *  is a jQuery collection, uses the first node it contains.
         */
        var implTableChanged = deferredMethods.createMethod(

            // direct callback: called every time when implTableChanged() has been called
            function registerTable(storage, table) {
                // store the new table in the collection (jQuery keeps the collection unique)
                storage.tables = storage.tables.add(table);
            },

            // deferred callback: called once, after current script ends
            function updateTables(storage) {
                storage.tables.each(function () {
                    // the table may have been removed from the DOM in the meantime
                    if (editdiv[0].contains(this)) {
                        tableStyles.updateElementFormatting(this);
                    }
                });
                storage.tables = $();
            },

            // storage object passed to all callbacks
            { tables: $() }

        ); // implTableChanged()

        /**
         * Has to be called for the initialization of a new document.
         */
        function implInitDocument() {

            var // container for the top-level paragraphs
                pageContentNode = DOM.getPageContentNode(editdiv),
                // the initial paragraph node in an empty document
                paragraph = DOM.createParagraphNode();

            // create empty page with single paragraph
            pageContentNode.empty().append(paragraph);
            validateParagraphNode(paragraph);

            // initialize default page formatting
            pageStyles.updateElementFormatting(editdiv);

            // Special handling for first paragraph, that has been inserted
            // above and thus exists already before any style sheets have been
            // inserted into the document. It may still refer implicitly to the
            // default paragraph style, therefore its CSS formatting must be
            // updated after the document has been loaded.
            // TODO: better solution needed when style cheets may change at runtime
            paragraphStyles.one('change', function () {
                var firstParagraph = pageContentNode[0].firstChild;
                if (DOM.isParagraphNode(firstParagraph)) {
                    paragraphStyles.updateElementFormatting(firstParagraph);
                }
            });

            // set initial selection
            selection.selectTopPosition();
            lastOperationEnd = selection.getStartPosition();

            undoManager.clear();
            self.setEditMode(null); // set null for 'read-only' and not yet determined edit status by the server
        }

        /**
         * Returns a text span and its internal offset for the specified
         * logical position.
         *
         * @param {Number[]} position
         *  The logical text position.
         *
         * @returns {Object|Null}
         *  An object with the attributes 'node' pointing to the text span DOM
         *  node, and an attribute 'offset' containing the internal character
         *  offset in the text span. Returns null, if the passed logical
         *  position is invalid.
         */
        function getTextSpanInfo(position) {

            var // node info at passed position (DOM text node level)
                nodeInfo = Position.getDOMPosition(editdiv, position),
                // the parent text span
                span = (nodeInfo && nodeInfo.node) ? nodeInfo.node.parentNode : null;

            if (!DOM.isPortionSpan(span)) {
                Utils.warn('Editor.getTextSpanInfo(): expecting text span at position ' + JSON.stringify(position));
                return null;
            }

            return { node: span, offset: nodeInfo.offset };
        }

        function implInsertText(text, position) {

            var // text span and internal offset
                spanInfo = getTextSpanInfo(position),
                // the text node in the text span
                textNode = null;

            if (!spanInfo) { return false; }

            // manipulate the existing DOM text node
            textNode = spanInfo.node.firstChild;

            // insert the new text into the text node
            textNode.nodeValue = textNode.nodeValue.slice(0, spanInfo.offset) + text + textNode.nodeValue.slice(spanInfo.offset);

            // validate paragraph, store new cursor position
            implParagraphChanged(spanInfo.node.parentNode);
            lastOperationEnd = Position.increaseLastIndex(position, text.length);
            return true;
        }

        /**
         * Splits the text span at the specified position, if splitting is
         * required. Always splits the span, if the position points between two
         * characters of the span. Additionally splits the span, if there is no
         * previous sibling text span while the position points to the
         * beginning of the span, or if there is no next text span while the
         * position points to the end of the span.
         *
         * @param {Number[]} position
         *  The logical text position.
         *
         * @returns {HTMLSpanElement|Null}
         *  The text span that precedes the passed offset. Will be the leading
         *  part of the original text span addressed by the passed position, if
         *  it has been split, or the previous sibling text span, if the passed
         *  position points to the beginning of the span, or the entire text
         *  span, if the passed position points to the end of a text span and
         *  there is a following text span available. Returns null, if the
         *  passed logical position is invalid.
         */
        function getPreparedTextSpan(position) {

            var // resolve position to text span and offset
                spanInfo = getTextSpanInfo(position);

            if (!spanInfo) { return null; }

            // do not split at beginning with existing preceding text span
            if ((spanInfo.offset === 0) && DOM.isTextSpan(spanInfo.node.previousSibling)) {
                return spanInfo.node.previousSibling;
            }

            // return following span, if offset points to end of span
            if ((spanInfo.offset === spanInfo.node.firstChild.nodeValue.length) && DOM.isTextSpan(spanInfo.node.nextSibling)) {
                return spanInfo.node;
            }

            // otherwise, split the span
            return DOM.splitTextSpan(spanInfo.node, spanInfo.offset)[0];
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

            var // text span that will precede the field
                span = getPreparedTextSpan(position),
                // new text span for the field node
                fieldSpan = null;

            if (!span) { return false; }

            // split the text span again to get initial character formatting
            // for the field, and insert the field representation text
            fieldSpan = DOM.splitTextSpan(span, 0).text(representation);

            // insert a new text field before the addressed text node, move
            // the field span element into the field node
            DOM.createFieldNode().append(fieldSpan).insertAfter(span);

            // validate paragraph, store new cursor position
            implParagraphChanged(span.parentNode);
            lastOperationEnd = Position.increaseLastIndex(position);
            return true;
        }

        function implInsertTab(position) {

            var // text span that will precede the field
                span = getPreparedTextSpan(position),
                // new text span for the tabulator node
                tabSpan = null;

            if (!span) { return false; }

            // split the text span to get initial character formatting for the tab
            tabSpan = DOM.splitTextSpan(span, 0);

            // insert a tab container node before the addressed text node, move
            // the tab span element into the tab container node
            DOM.createTabNode().append(tabSpan).insertAfter(span);

            // validate paragraph, store new cursor position
            implParagraphChanged(span.parentNode);
            lastOperationEnd = Position.increaseLastIndex(position);
            return true;
        }

        function implInsertDrawing(type, position, attributes) {

            var // text span that will precede the field
                span = getPreparedTextSpan(position),
                // new drawing node
                drawingNode = null,
                // URL from attributes, and absolute URL
                url = null, absUrl = null;

            if (!span) { return false; }

            // insert the drawing with default settings (inline) between the two text nodes (store original URL for later use)
            drawingNode = $('<div>', { contenteditable: false })
               .addClass('drawing inline')
               .data('type', type)
               .append($('<div>').addClass('content'))
               .insertAfter(span);

            if (type === 'image') {
                // saving the absolute image url as data object at content node
                url = attributes.imgurl;
                absUrl = /:\/\//.test(url) ? url : getDocumentUrl({ get_filename: url });
                drawingNode.data('absoluteURL', absUrl);
            }

            // apply the passed drawing attributes
            drawingStyles.setElementAttributes(drawingNode, attributes);

            // validate paragraph, store new cursor position
            implParagraphChanged(span.parentNode);
            lastOperationEnd = Position.increaseLastIndex(position);
            return true;
        }

        /**
         * Returns the family of the attributes supported by the passed DOM
         * element.
         *
         * @param {HTMLElement|jQuery} element
         *  The DOM element whose associated attribute family will be returned.
         *  If this object is a jQuery collection, returns its first node.
         */
        function resolveElementFamily(element) {

            var // the element, as jQuery object
                $element = $(element),
                // the resulting style family
                family = null;

            if (DOM.isTextSpan($element) || DOM.isTextSpanContainerNode($element)) {
                family = 'character';
            } else if (DOM.isParagraphNode($element)) {
                family = 'paragraph';
            } else if (DOM.isTableNode($element)) {
                family = 'table';
            } else if ($element.is('tr')) {
                family = 'row';
            } else if ($element.is('td')) {
                family = 'cell';
            } else if (DOM.isDrawingNode($element)) {
                family = 'drawing';
            } else {
                Utils.warn('Editor.resolveElementFamily(): unsupported element');
            }

            return family;
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
         * @param {Number[]} [end]
         *  The logical end position of the element or text range to be
         *  formatted.
         *
         * @param {Object|Null} attributes
         *  A map with formatting attribute values, mapped by the attribute
         *  names. If the value null is passed, all exlicit attributes will be
         *  cleared from the selection.
         */
        function implSetAttributes(start, end, attributes) {

            var // setting or clearing attributes
                clear = _.isNull(attributes),
                // node info for start/end position
                startInfo = null, endInfo = null,
                // the style sheet container of the specified attribute family
                styleSheets = null,
                // options for StyleSheets method calls
                options = null,
                // the last text span visited by the character formatter
                lastTextSpan = null,
                // undo operations going into a single action
                undoOperations = [],
                // redo operation
                redoOperation = null;

            // sets or clears the attributes using the current style sheet container
            function setElementAttributes(element) {
                // set or clear the attributes at the element
                if (clear) {
                    styleSheets.clearElementAttributes(element, undefined, options);
                } else {
                    styleSheets.setElementAttributes(element, attributes, options);
                }
            }

            // change listener used to build the undo operations
            function changeListener(element, oldAttributes, newAttributes) {

                var // selection object representing the passed element
                    range = Position.getPositionRangeForNode(editdiv, element),
                    // the operation used to undo the attribute changes
                    undoOperation = _({ name: Operations.ATTRS_SET, attrs: {} }).extend(range),
                    // last undo operation (used to merge sibling character undos)
                    lastUndoOperation = ((undoOperations.length > 0) && (startInfo.family === 'character')) ? _.last(undoOperations) : null;

                // find all old attributes that have been changed or cleared
                _(oldAttributes).each(function (value, name) {
                    if (!_.isEqual(value, newAttributes[name])) {
                        undoOperation.attrs[name] = value;
                    }
                });

                // find all newly added attributes
                _(newAttributes).each(function (value, name) {
                    if (!(name in oldAttributes)) {
                        undoOperation.attrs[name] = null;
                    }
                });

                // try to merge 'character' undo operation with last array entry, otherwise add operation to array
                if (lastUndoOperation && (_.last(lastUndoOperation.end) + 1 === _.last(undoOperation.start)) && _.isEqual(lastUndoOperation.attrs, undoOperation.attrs)) {
                    lastUndoOperation.end = undoOperation.end;
                } else {
                    undoOperations.push(undoOperation);
                }
            }

            // resolve start and end position
            if (!_.isArray(start)) {
                Utils.warn('Editor.implSetAttributes(): missing start position');
                return;
            }
            startInfo = Position.getDOMPosition(editdiv, start, true);
            if (!startInfo || !startInfo.node) {
                Utils.warn('Editor.implSetAttributes(): invalid start position: ' + JSON.stringify(start));
                return;
            }
            endInfo = _.isArray(end) ? Position.getDOMPosition(editdiv, end, true) : startInfo;
            if (!endInfo || !endInfo.node) {
                Utils.warn('Editor.implSetAttributes(): invalid end position: ' + JSON.stringify(end));
                return;
            }
            end = end || start;

            // get attribute family of start and end node
            startInfo.family = resolveElementFamily(startInfo.node);
            endInfo.family = resolveElementFamily(endInfo.node);
            if (!startInfo.family || !endInfo.family) { return; }

            // options for the StyleSheets method calls (build undo operations while formatting)
            options = undoManager.isEnabled() ? { changeListener: changeListener } : null;

            // characters (start or end may point to a drawing node, ignore that but format as
            // characters if the start objects is different from the end object)
            if ((startInfo.family === 'character') || (endInfo.family === 'character') ||
                    ((startInfo.node !== endInfo.node) && DOM.isDrawingNode(startInfo.node) && DOM.isDrawingNode(endInfo.node))) {

                // check that start and end are located in the same paragraph
                if (startInfo.node.parentNode !== endInfo.node.parentNode) {
                    Utils.warn('Editor.implSetAttributes(): end position in different paragraph');
                    return;
                }

                // visit all text span elements covered by the passed range
                // (not only the direct children of the paragraph, but also
                // text spans embedded in component nodes such as fields and tabs)
                styleSheets = characterStyles;
                Position.iterateParagraphChildNodes(startInfo.node.parentNode, function (node) {

                    // DOM.iterateTextSpans() visits the node itself if it is a
                    // text span, otherwise it visits all descendant text spans
                    // contained in the node except for drawings which will be
                    // skipped (they may contain their own paragraphs).
                    DOM.iterateTextSpans(node, function (span) {
                        setElementAttributes(span);
                        // try to merge with the preceding text span
                        CharacterStyles.mergeSiblingTextSpans(span, false);
                        // remember span (last visited span will be merged with its next sibling)
                        lastTextSpan = span;
                    });

                }, undefined, {
                    // options for Position.iterateParagraphChildNodes()
                    allNodes: true,
                    start: _(start).last(),
                    end: _(end).last(),
                    split: true
                });

                // try to merge last text span in the range with its next sibling
                if (lastTextSpan) {
                    CharacterStyles.mergeSiblingTextSpans(lastTextSpan, true);
                }

            // otherwise: only single components allowed at this time
            } else {

                // check that start and end point to the same element
                if (startInfo.node !== endInfo.node) {
                    Utils.warn('Editor.implSetAttributes(): no ranges supported for attribute family "' + startInfo.family + '"');
                    return;
                }

                // format the (single) element
                styleSheets = self.getStyleSheets(startInfo.family);
                setElementAttributes(startInfo.node);
            }

            // create the undo action
            if (undoManager.isEnabled()) {
                redoOperation = clear ? { name: Operations.ATTRS_CLEAR } : { name: Operations.ATTRS_SET, attrs: attributes };
                _(redoOperation).extend({ start: start, end: end });
                undoManager.addUndo(undoOperations, redoOperation);
            }

            // update numberings and bullets (attributes may be null if called from clearAttributes operation)
            if ((startInfo.family === 'paragraph') && (clear || ('style' in attributes) || ('ilvl' in attributes) || ('numId' in attributes))) {
                implUpdateLists();
            }

            // adjust tab sizes
            var paragraph = null;
            if (DOM.isParagraphNode(startInfo.node))
                paragraph = startInfo.node;
            else if (DOM.isParagraphNode(startInfo.node.parentNode))
                paragraph = startInfo.node.parentNode;
            if (paragraph) {
                adjustTabsOfParagraph(paragraph);
            }
        }

        /**
         * Inserts the passed content node at the specified logical position.
         *
         * @param {Number[]} position
         *  The logical position of the new content node.
         *
         * @param {HTMLElement|jQuery} node
         *  The new content node. If this object is a jQuery collection, uses
         *  the first node it contains.
         *
         * @returns {Boolean}
         *  Whether the content node has been inserted successfully.
         */
        function insertContentNode(position, node) {

            var // target index of the new node
                index = _.last(position),
                // logical position of the paragraph container node
                parentPosition = position.slice(0, -1),
                // the container node for the paragraph
                containerInfo = Position.getDOMPosition(editdiv, parentPosition, true),
                // the parent container node
                containerNode = null;

            // check that parent container node exists
            if (!containerInfo || !containerInfo.node) {
                Utils.warn('Editor.insertContentNode(): cannot find container root node');
                return false;
            }

            // resolve component node to the correct node that contains the
            // child content nodes (e.g. resolve table cell elements to the
            // embedded div.cellcontent elements, or drawing elements to the
            // embedded div.content elements)
            containerNode = DOM.getChildContainerNode(containerInfo.node)[0];
            if (!containerNode) {
                Utils.warn('Editor.insertContentNode(): cannot find content node for container');
                return false;
            }

            // index -1 has special menaing of appending the new content node
            // TODO: is this feature still used somewhere?
            if (index === -1) {
                index = containerNode.childNodes.length;
            }

            // check that the index is valid
            if ((index < 0) || (index > containerNode.childNodes.length)) {
                Utils.warn('Editor.insertContentNode(): invalid insertion index for new content node');
                return false;
            }

            // insert the content node into the DOM tree
            if (index < containerNode.childNodes.length) {
                $(node).first().insertBefore(containerNode.childNodes[index]);
            } else {
                $(node).first().appendTo(containerNode);
            }

            return true;
        }

        function implSplitParagraph(position) {

            var posLength = position.length - 1,
                para = position[posLength - 1],
                pos = position[posLength],
                allParagraphs = Position.getAllAdjacentParagraphs(editdiv, position),
                originalpara = allParagraphs[para],
                paraclone = $(originalpara).clone(true);

            paraclone.insertAfter(allParagraphs[para]);

            allParagraphs = Position.getAllAdjacentParagraphs(editdiv, position);

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
                Position.removeUnusedImageDivs(editdiv, localStartPos);
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
            // TODO: implDeleteText() should have done this already
            Position.removeUnusedImageDivs(editdiv, startPosition.slice(0, -1));

            implParagraphChanged(position);
            implParagraphChanged(Position.increaseLastIndex(position));
            lastOperationEnd = startPosition;

            implUpdateLists();
        }

        function implDeleteTable(position) {

            var tablePosition = Position.getLastPositionFromPositionByNodeName(editdiv, position, DOM.TABLE_NODE_SELECTOR);

            var tableNode = Position.getTableElement(editdiv, tablePosition);
            if (tableNode) {
                $(tableNode).remove();

                var para = tablePosition.pop();
                if (para > 0) {
                    para -= 1;
                }
                tablePosition.push(para);
                tablePosition.push(Position.getParagraphLength(editdiv, tablePosition));

                lastOperationEnd = tablePosition;
            }
        }

        function implDeleteRows(pos, startRow, endRow) {

            var localPosition = _.copy(pos, true);

            if (! Position.isPositionInTable(editdiv, localPosition)) {
                return;
            }

            var table = Position.getDOMPosition(editdiv, localPosition).node;
            DOM.getTableRows(table).slice(startRow, endRow + 1).remove();

            if (DOM.getTableRows(table).length === 0) {
                // This code should never be reached. If last row shall be deleted, deleteTable is called.
                self.deleteTable(localPosition);
                $(table).remove();
                localPosition.push(0);
            } else {
                // Setting cursor
                var lastRow = DOM.getTableRows(table).length - 1;
                if (endRow > lastRow) {
                    endRow = lastRow;
                }
                localPosition.push(endRow);
                localPosition.push(0);
                localPosition.push(0);
                localPosition.push(0);
            }

            // recalculating the attributes of the table cells
            implTableChanged(table);

            lastOperationEnd = localPosition;
        }

        /**
         * Removes all contents of the cell, but preserves the formatting of
         * the last paragraph node.
         */
        function implClearCell(cellNode) {

            var // the container for the content nodes
                container = DOM.getCellContentNode(cellNode),
                // the last paragraph in the cell
                paragraph = container[0].lastChild;

            if (DOM.isParagraphNode(paragraph)) {
                container.children().slice(0, -1).remove();
                $(paragraph).empty();
            } else {
                Utils.warning('Editor.implClearCell(): invalid cell contents');
                paragraph = DOM.createParagraphNode();
                container.empty().append(paragraph);
            }

            // validate the paragraph (add the dummy node)
            validateParagraphNode(paragraph);
        }

        function implInsertRow(pos, count, insertdefaultcells, referencerow, attrs) {

            var localPosition = _.copy(pos, true),
                useReferenceRow = _.isNumber(referencerow) ? true : false;

            if (! Position.isPositionInTable(editdiv, localPosition)) {
                return;
            }

            insertdefaultcells = insertdefaultcells ? true : false;

            if (!_.isNumber(count)) {
                count = 1; // setting default for number of rows
            }

            var tablePos = _.copy(localPosition, true);
            tablePos.pop();

            var table = Position.getDOMPosition(editdiv, tablePos).node,
                tableRowDomPos = Position.getDOMPosition(editdiv, localPosition),
                tableRowNode = null,
                row = null,
                cellsInserted = false;

            if (tableRowDomPos) {
                tableRowNode = tableRowDomPos.node;
            }

            if (useReferenceRow) {

                row = DOM.getTableRows(table).eq(referencerow).clone(true);

                // clear the cell contents in the cloned row
                row.children('td').each(function () { implClearCell(this); });

                cellsInserted = true;

            } else if (insertdefaultcells) {

                var columnCount = $(table).children('colgroup').children().length,
                    // prototype elements for row, cell, and paragraph
                    paragraph = DOM.createParagraphNode(),
                    cell = DOM.createTableCellNode(paragraph);

                // insert empty text node into the paragraph
                validateParagraphNode(paragraph);

                row = $('<tr>');

                // clone the cells in the row element
                _.times(columnCount, function () { row.append(cell.clone(true)); });

                cellsInserted = true;

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

            // recalculating the attributes of the table cells
            if (cellsInserted) {
                implTableChanged(table);
            }

            // Setting cursor
            if ((insertdefaultcells) || (useReferenceRow)) {
                localPosition.push(0);
                localPosition.push(0);
                localPosition.push(0);

                lastOperationEnd = localPosition;
            }
        }

        function implInsertCell(pos, count, attrs) {

            var localPosition = _.clone(pos),
                tableNode = Position.getLastNodeFromPositionByNodeName(editdiv, pos, DOM.TABLE_NODE_SELECTOR);

            if (!tableNode) {
                return;
            }

            if (!_.isNumber(count)) {
                count = 1; // setting default for number of rows
            }

            var tableCellDomPos = Position.getDOMPosition(editdiv, localPosition),
                tableCellNode = null;

            if (tableCellDomPos) {
                tableCellNode = tableCellDomPos.node;
            }

            // prototype elements for row, cell, and paragraph
            var paragraph = DOM.createParagraphNode(),
                cell = DOM.createTableCellNode(paragraph);

            // apply the passed table attributes
            tableCellStyles.setElementAttributes(cell, attrs);

            // insert empty text node into the paragraph
            validateParagraphNode(paragraph);

            if (tableCellNode) {
                _.times(count, function () { $(tableCellNode).before(cell.clone(true)); });
            } else {
                var rowPos = _.copy(localPosition, true);
                rowPos.pop();
                var row = Position.getDOMPosition(editdiv, rowPos).node;
                _.times(count, function () { $(row).append(cell.clone(true)); });
            }

            // recalculating the attributes of the table cells
            implTableChanged(tableNode);
        }

        function implDeleteCells(pos, start, end) {

            var localPosition = _.copy(pos, true);

            if (! Position.isPositionInTable(editdiv, localPosition)) {
                return;
            }

            var tableRowDomPos = Position.getDOMPosition(editdiv, localPosition),
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

            if (row) {
                var table = $(row).closest('table');
                implTableChanged(table);
            }

            lastOperationEnd = localPosition;
        }

        function implDeleteColumns(pos, startGrid, endGrid) {

            var localPosition = _.copy(pos, true);

            if (! Position.isPositionInTable(editdiv, localPosition)) {
                return;
            }

            var table = Position.getDOMPosition(editdiv, localPosition).node,
                allRows = DOM.getTableRows(table),
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

            if (DOM.getTableRows(table).children('td').length === 0) {   // no more columns
                // This code should never be reached. If last column shall be deleted, deleteTable is called.
                $(table).remove();
                localPosition.push(0);
            } else {
                // Setting cursor
                var lastColInFirstRow = DOM.getTableRows(table).first().children().length - 1;
                if ((endColInFirstRow > lastColInFirstRow) || (endColInFirstRow === -1)) {
                    endColInFirstRow = lastColInFirstRow;
                }
                localPosition.push(0);
                localPosition.push(endColInFirstRow);
                localPosition.push(0);
                localPosition.push(0);
            }

            // recalculating the attributes of the table cells
            implTableChanged(table);

            lastOperationEnd = localPosition;
        }

        function implInsertColumn(pos, gridposition, tablegrid, insertmode) {

            var localPosition = _.copy(pos, true);

            if (! Position.isPositionInTable(editdiv, localPosition)) {
                return;
            }

            var table = Position.getDOMPosition(editdiv, localPosition).node,
                allRows = DOM.getTableRows(table),
                // prototype elements for cell and paragraph
                paragraph = DOM.createParagraphNode(),
                cell = DOM.createTableCellNode(paragraph);

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

            // recalculating the attributes of the table cells
            implTableChanged(table);

            // Setting cursor to first position in table
            localPosition.push(0);
            localPosition.push(gridposition);
            localPosition.push(0);
            localPosition.push(0);

            lastOperationEnd = localPosition;
        }

        function implDeleteText(startPosition, endPosition) {

            var // info about the parent paragraph node
                paragraphPosition = null, nodeInfo = null,
                // last index in start and end position
                startOffset = 0, endOffset = 0,
                // next sibling text span of last visited child node
                nextTextSpan = null;

            // get paragraph node from start position
            if (!_.isArray(startPosition)) {
                Utils.warn('Editor.implDeleteText(): missing start position');
                return false;
            }
            paragraphPosition = startPosition.slice(0, -1);
            nodeInfo = Position.getDOMPosition(editdiv, paragraphPosition, true);
            if (!nodeInfo || !DOM.isParagraphNode(nodeInfo.node)) {
                Utils.warn('Editor.implDeleteText(): no paragraph found at position ' + JSON.stringify(paragraphPosition));
                return false;
            }

            // validate end position
            if (_.isArray(endPosition) && !Position.hasSameParentComponent(startPosition, endPosition)) {
                Utils.warn('Editor.implDeleteText(): range not in same paragraph');
                return false;
            }

            // start and end offset in paragraph
            startOffset = _.last(startPosition);
            endOffset = _.isArray(endPosition) ? _.last(endPosition) : startOffset;
            if (endOffset === -1) { endOffset = undefined; }

            // visit all covered child nodes (iterator allows to remove the visited node)
            Position.iterateParagraphChildNodes(nodeInfo.node, function (node) {

                var // previous text span of current node
                    prevTextSpan = null;

                // remove preceding position offset node of floating drawing objects
                if (DOM.isFloatingDrawingNode(node)) {
                    $(node).prev(DOM.OFFSET_NODE_SELECTOR).remove();
                }

                // get sibling text spans
                prevTextSpan = DOM.isTextSpan(node.previousSibling) ? node.previousSibling : null;
                nextTextSpan = DOM.isTextSpan(node.nextSibling) ? node.nextSibling : null;

                // clear text in text spans
                if (DOM.isTextSpan(node)) {

                    // only remove the text span, if it has a sibling text span
                    // (otherwise, it separates other component nodes)
                    if (prevTextSpan || nextTextSpan) {
                        $(node).remove();
                    } else {
                        // remove text, but keep text span element
                        node.firstChild.nodeValue = '';
                    }
                    return;
                }

                // other component nodes (drawings or text components)
                if (DOM.isTextComponentNode(node) || DOM.isDrawingNode(node)) {

                    // remove preceding empty sibling text span
                    if (DOM.isEmptySpan(prevTextSpan) && nextTextSpan) {
                        $(prevTextSpan).remove();
                    }
                    $(node).remove();
                    return;
                }

                Utils.error('Editor.implDeleteText(): unknown paragraph child node');
                return Utils.BREAK;

            }, undefined, { start: startOffset, end: endOffset, split: true });

            // remove next sibling text span after deleted range, if empty,
            // otherwise try to merge with equally formatted preceding text span
            if (nextTextSpan && DOM.isTextSpan(nextTextSpan.previousSibling)) {
                if (DOM.isEmptySpan(nextTextSpan)) {
                    $(nextTextSpan).remove();
                } else {
                    CharacterStyles.mergeSiblingTextSpans(nextTextSpan);
                }
            }

            // validate paragraph node, store operation position for cursor position
            implParagraphChanged(paragraphPosition);
            lastOperationEnd = _.clone(startPosition);
        }

        function implMove(_source, _dest) {

            var source = _.copy(_source, true),
                dest = _.copy(_dest, true),
                sourcePos = Position.getDOMPosition(editdiv, source, true),
                destPos = Position.getDOMPosition(editdiv, dest, true),
                insertBefore = true,
                splitNode = false;

            if (destPos.offset === 0) {
                insertBefore = true;
            } else if ((destPos.node.length) && (destPos.offset === (destPos.node.length - 1))) {
                insertBefore = false;
            } else if ((DOM.isDrawingNode(destPos.node)) && (destPos.offset === 1)) {
                insertBefore = false;
            } else {
                splitNode = true;  // splitting node is required
                insertBefore = false;  // inserting after new created text node
            }

            if ((sourcePos) && (destPos)) {

                var sourceNode = sourcePos.node,
                    destNode = destPos.node,
                    useOffsetDiv = true,
                    offsetDiv = sourceNode.previousSibling,
                    doMove = true;

                if ((sourceNode) && (destNode)) {

                    if (! DOM.isDrawingNode(sourceNode)) {
                        doMove = false; // supporting only drawings at the moment
                        Utils.warn('Editor.implMove(): moved  node is not a drawing: ' + Utils.getNodeName(sourceNode));
                    } else {
                        // also move the offset divs
                        if (!DOM.isOffsetNode(offsetDiv)) {
                            useOffsetDiv = false; // should never be reached
                        }
                    }

                    if (doMove) {

                        if (splitNode) {
                            destNode = DOM.splitTextSpan(destNode.parentNode, destPos.offset + 1)[0];
                        } else {
                            if (destNode.nodeType === 3) {
                                destNode = destNode.parentNode;
                            }
                        }

                        // there can be empty text spans before the destination node
                        if (DOM.isTextSpan(destNode)) {
                            while (DOM.isEmptySpan(destNode.previousSibling)) {
                                destNode = destNode.previousSibling;
                            }
                        }

                        if (insertBefore) {
                            $(sourceNode).insertBefore(destNode);
                        } else {
                            $(sourceNode).insertAfter(destNode);
                        }

                        // moving also the corresponding div before the moved drawing
                        if (useOffsetDiv) {
                            $(offsetDiv).insertBefore(sourceNode);
                        }

                        implParagraphChanged(dest);
                    }
                }
            }
        }

        function implMergeCell(cellposition, count) {

            var rowPosition = _.copy(cellposition, true),
                localStartCol = rowPosition.pop(),
                localEndCol = localStartCol + count,
                // Counting the colSpan off all cells in the range
                row = Position.getDOMPosition(editdiv, rowPosition).node,
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

        /**
         * iterate over _all_ paragraphs and update numbering symbols and index
         */
        var implUpdateLists = deferredMethods.createMethod(

            // direct callback: called every time when implUpdateLists() has been called
            $.noop,

            // deferred callback: called once, after current script ends
            function updateLists() {
                var listItemCounter = [];
                Utils.iterateSelectedDescendantNodes(editdiv, DOM.PARAGRAPH_NODE_SELECTOR, function (para) {
                    // always remove an existing label
                    var paraAttributes = paragraphStyles.getElementAttributes(para),
                    oldLabel = $(para).children(DOM.LIST_LABEL_NODE_SELECTOR);
                    var updateParaTabstops = oldLabel.length > 0;
                    oldLabel.remove();
                    var numId = paraAttributes.numId;
                    if (numId  !== -1) {
                        var ilvl = paraAttributes.ilvl;
                        if (ilvl < 0) {
                            // is a numbering level assigned to the current paragraph style?
                            ilvl = lists.findIlvl(numId, paraAttributes.style);
                        }
                        if (ilvl !== -1 && ilvl < 9) {
                            updateParaTabstops = true;
                            if (!listItemCounter[paraAttributes.numId])
                                listItemCounter[paraAttributes.numId] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
                            listItemCounter[paraAttributes.numId][ilvl]++;
                            // TODO: reset sub-levels depending on their 'levelRestartValue' attribute
                            var subLevelIdx = ilvl + 1;
                            for (; subLevelIdx < 9; subLevelIdx++)
                                listItemCounter[paraAttributes.numId][subLevelIdx] = 0;
                            // fix level counts of non-existing upper levels
                            subLevelIdx = ilvl - 1;
                            for (; subLevelIdx >= 0; subLevelIdx--)
                                if (listItemCounter[paraAttributes.numId][subLevelIdx] === 0)
                                    listItemCounter[paraAttributes.numId][subLevelIdx] = 1;

                            var listObject = lists.formatNumber(paraAttributes.numId, ilvl,
                                    listItemCounter[paraAttributes.numId]);
                            var tab = !listObject.suff || listObject.suff === 'tab';
                            if (!tab && (listObject.suff === 'space')) {
                                listObject.text += String.fromCharCode(0x00a0);//add non breaking space
                            }

                            var numberingElement = DOM.createListLabelNode(listObject.text);

                            var span = DOM.findFirstPortionSpan(para);
                            var charAttributes = characterStyles.getElementAttributes(span);
                            if (listObject.imgsrc) {
                                var absUrl = getDocumentUrl({ get_filename: listObject.imgsrc });
                                var image = $('<div>', { contenteditable: false })
                                .addClass('drawing inline')
                                .data('url', listObject.imgsrc)
                                .append($('<div>').addClass('content')
                                        .append($('<img>', { src: absUrl }).css('width', charAttributes.fontsize + 'pt'))
                                        );

                                LineHeight.updateElementLineHeight(image, paraAttributes.lineheight);
                                $(image).css('height', charAttributes.fontsize + 'pt');
                                $(image).css('width', charAttributes.fontsize + 'pt');
                                numberingElement.prepend(image);

                            }
                            var listSpan = numberingElement.children('span');
                            listSpan.css('font-size', charAttributes.fontsize + 'pt');
                            if (listObject.color) {
                                Color.setElementTextColor(listSpan, documentStyles.getCurrentTheme(), listObject, paraAttributes);
                            }
                            LineHeight.updateElementLineHeight(numberingElement, paraAttributes.lineheight);
                            var minWidth = 0,
                                isNegativeIndent = listObject.firstLine < listObject.indent;

                            if (isNegativeIndent) {
                                var labelWidth = listObject.indent - listObject.firstLine;
                                if (tab)
                                    minWidth = labelWidth;
                                numberingElement.css('margin-left', (-listObject.indent + listObject.firstLine) / 100 + 'mm');
                            } else {
                                numberingElement.css('margin-left', (listObject.firstLine - listObject.indent) / 100 + 'mm');
                            }
                            numberingElement.css('min-width', minWidth / 100 + 'mm');
                            $(para).prepend(numberingElement);
                            if (tab) {
                                var minTabPos = listObject.firstLine;
                                var maxTabPos = listObject.tabpos ? listObject.tabpos : 999999;
                                if (isNegativeIndent) {
                                    minTabPos = listObject.tabpos && listObject.tabpos < listObject.indent ? listObject.tabpos : listObject.firstLine;
                                    maxTabPos = listObject.indent;
                                }

                                var numWidth = $(numberingElement).width();
                                if (numWidth > minTabPos)
                                    minTabPos = numWidth;


                                var defaultTabstop = self.getDocumentAttributes().defaulttabstop,
                                paraStyles = paragraphStyles.getElementAttributes(para),
                                paraTabstops = [];
                                // paragraph tab stop definitions
                                if (paraStyles && paraStyles.tabstops) {
                                    paraTabstops = paraStyles.tabstops;
                                }

                                var width = 0;

                                if (paraTabstops && paraTabstops.length > 0) {
                                    var tabstop = _.find(paraTabstops, function (tab) { return (minTabPos + 1) < tab.pos && tab.pos < maxTabPos; });
                                    if (tabstop)
                                        width = Math.max(0, tabstop.pos - (minTabPos % tabstop.pos));
                                }

                                if (width <= 1 && (!isNegativeIndent && !listObject.tabpos)) {
                                    // tabsize calculation based on default tabstop
                                    width = Math.max(0, defaultTabstop - (minTabPos % defaultTabstop));
                                    width = (width <= 1) ? defaultTabstop : width; // no 0 tab size allowed, check for <= 1 to prevent rounding errors
                                }
                                if (width <= 1) {
                                    width = isNegativeIndent ?
                                            listObject.indent - listObject.firstLine  :
                                                listObject.tabpos ? (listObject.tabpos - listObject.firstLine) : minTabPos;
                                }
                                numberingElement.css('min-width', (width / 100) + 'mm');

                            }
                        }
                        if (updateParaTabstops)
                            adjustTabsOfParagraph(para);
                    }
                });
            }

        ); // implUpdateLists()

        function implDbgOutEvent(event) {
            if (dbgoutEvents) {
                Utils.log('type=' + event.type + ' keyCode=' + event.keyCode + ' charCode=' + event.charCode + ' shift=' + event.shiftKey + ' ctrl=' + event.ctrlKey + ' alt=' + event.altKey);
            }
        }

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

        // forward selection change events to own listeners
        selection.on('change', function () { self.trigger('selection', selection); });

        // hybrid edit mode
        editdiv
            .on('focus', function () { processFocus(true); })
            .on('blur', function () { processFocus(false); })
            .on('keydown', processKeyDown)
            .on('keypress', processKeyPressed)
            .on('mousedown', processMouseDown)
            .on('mouseup', processMouseUp)
            .on('dragstart dragover drop contextmenu cut', false)
            .on('paste', _.bind(this.paste, this));

    } // class Editor

    // exports ================================================================

    return Editor;
});
