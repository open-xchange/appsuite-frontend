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
     'io.ox/office/tk/application',
     'io.ox/office/tk/view/alert',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/selection',
     'io.ox/office/editor/table',
     'io.ox/office/editor/image',
     'io.ox/office/editor/hyperlink',
     'io.ox/office/editor/operations',
     'io.ox/office/editor/position',
     'io.ox/office/editor/drawingResize',
     'io.ox/office/editor/tableResize',
     'io.ox/office/editor/undo',
     'io.ox/office/editor/format/stylesheets',
     'io.ox/office/editor/format/characterstyles',
     'io.ox/office/editor/format/paragraphstyles',
     'io.ox/office/editor/format/documentstyles',
     'io.ox/office/editor/format/lineheight',
     'io.ox/office/editor/format/color',
     'gettext!io.ox/office/main'
    ], function (Events, Utils, Application, Alert, DOM, Selection, Table, Image, Hyperlink, Operations, Position, DrawingResize, TableResize, UndoManager, StyleSheets, CharacterStyles, ParagraphStyles, DocumentStyles, LineHeight, Color, gt) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // style attributes for heading 1 -6 based on latent styles
        HEADINGS_CHARATTRIBUTES = [
            { color: { type: 'scheme', value: 'accent1', transformations: [{ type: 'shade', value: 74902 }], fallbackValue: '376092' }, bold: true, fontSize: 14 },
            { color: { type: 'scheme', value: 'accent1', fallbackValue: '4F81BD' }, bold: true, fontSize: 13 },
            { color: { type: 'scheme', value: 'accent1', fallbackValue: '4F81BD' }, bold: true },
            { color: { type: 'scheme', value: 'accent1', fallbackValue: '4F81BD' }, bold: true, italic: true },
            { color: { type: 'scheme', value: 'accent1', transformations: [{ type: 'shade', value: 49804 }], fallbackValue: '244061' } },
            { color: { type: 'scheme', value: 'accent1', transformations: [{ type: 'shade', value: 49804 }], fallbackValue: '244061' }, italic: true }
        ],

        DEFAULT_PARAGRAPH_DEFINTIONS = { 'default': true, styleId: 'Standard', styleName: 'Normal' },

        // style attributes for lateral table style
        DEFAULT_LATERAL_TABLE_DEFINITIONS = { 'default': true, styleId: 'TableGrid', styleName: 'Table Grid', uiPriority: 59 },
        DEFAULT_LATERAL_TABLE_ATTRIBUTES =
        {
            wholeTable: {
                paragraph: { lineHeight: { type: 'percent', value: 100 }},
                table:
                {
                    borderTop:        { color: Color.AUTO, width: 17, style: 'single' },
                    borderBottom:     { color: Color.AUTO, width: 17, style: 'single' },
                    borderInsideHor:  { color: Color.AUTO, width: 17, style: 'single' },
                    borderInsideVert: { color: Color.AUTO, width: 17, style: 'single' },
                    borderLeft:       { color: Color.AUTO, width: 17, style: 'single' },
                    borderRight:      { color: Color.AUTO, width: 17, style: 'single' }
                }
            }
        },

        DEFAULT_HYPERLINK_DEFINTIONS = { 'default': false, styleId: 'Hyperlink', styleName: 'Hyperlink', uiPriority: 99 },
        DEFAULT_HYPERLINK_CHARATTRIBUTES = { color: { type: 'scheme', value: 'hyperlink', fallbackValue: '0080C0' }, underline: true },

        // internal clipboard
        clipboardOperations = [];

    // private global functions ===============================================

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

    /**
     * Returns true, if the passed keyboard event is ctrl+x or meta+x.
     *
     * @param event
     *  A jQuery keyboard event object.
     */
    function isCutKeyEvent(event) {
        return ((event.metaKey || event.ctrlKey) && !event.altKey && (event.charCode === 120 || event.keyCode === 88));
    }

    function getPrintableChar(event) {

        if (event.keyCode === KeyCodes.ENTER) {
            return '';  // in IE 9 event.char is '\n'
        }
        // event.char preferred. DL2, but nyi in most browsers:(
        if (_.isString(event.char)) {
            return event.char;
        }
        if (_.isNumber(event.charCode) && (event.CharCode >= 32)) {
            return String.fromCharCode(event.charCode);
        }
        if (_.isNumber(event.which) && (event.which >= 32)) {
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

            // counting the operations
            operationsCounter = 0,

            //undo manager collection undo and redo operations
            undoManager = new UndoManager(this),

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
            preselectedAttributes = null,

            // all text spans that are highlighted (for quick removal)
            highlightedSpans = [],

            lastKeyDownEvent,

            lastOperationEnd,     // Need to decide: Should the last operation modify this member, or should the selection be passed up the whole call chain?!

            blockOperations = false,

            // set document into write protected mode
            // can be null, false and true
            // init with null for 'read only' and mode not yet determined by the server
            editMode = null,

            // init with false for 'write permission'
            writeProtected = false,

            // name of the user that currently has the edit rigths
            editUser = '',

            dbgoutEvents = false;

        // private methods ----------------------------------------------------

        /**
         * Returns the scrollable application root node containing this editor.
         */
        function getApplicationNode() {
            return app.getView().getApplicationNode();
        }

        /**
         * Scrolls the application root node to make the passed document node
         * visible.
         */
        function scrollToNode(node) {
            Utils.scrollToChildNode(getApplicationNode(), node, { padding: 30 });
        }

        /**
         * Returns the current scroll position of the application root node.
         */
        function getScrollPosition() {
            var appNode = getApplicationNode();
            return { top: appNode.scrollTop(), left: appNode.scrollLeft() };
        }

        /**
         * Sets a new scroll position at the application root node.
         */
        function setScrollPosition(position) {
            var appNode = getApplicationNode();
            appNode.scrollTop(position.top);
            appNode.scrollLeft(position.left);
        }

        // methods ------------------------------------------------------------

        /**
         * Sets the preselected attributes.
         *
         * Please always use this function
         * to set the preselected attributes, instead of changing the
         * attributes directly.
         *
         * @param {Object} attributes
         *  A object containing attributes to be used for the next printable
         *  character.
         */
        this.setPreselectedAttributes = function (attributes) {
            preselectedAttributes = attributes;
            // update view (mutually exclusive buttons may switch state)
            this.trigger('selection', selection);
        };

        /**
         * Clears the preselected attributes.
         */
        this.clearPreselectedAttributes = function () {
            preselectedAttributes = null;
        };

        /**
         * Returns the current preselected attributes.
         */
        this.getPreselectedAttributes = function () {
            return preselectedAttributes;
        };

        /**
         * Returns the root DOM element representing this editor.
         */
        this.getNode = function () {
            return editdiv;
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

        // style getter ------------------------------------------------------

        this.getDrawingStyles = function () {
            return drawingStyles;
        };

        this.getTableStyles = function () {
            return tableStyles;
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

        this.getUndoManager = function () {
            return undoManager;
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
            var proceed = true,
                message = null;

            /**
             * Shows an error box if a document could not be loaded completely without error.
             */
            function insertLoadError() {
                alert(gt("Sorry, failed to load the document successfully."));
            }


            _(operations).each(function (operation) {
                if (proceed) {
                    operationsCounter++;
                    try {
                        applyOperation(operation, options);
                    } catch (ex) {
                        proceed = false;
                        message = "ERROR: Stop applying operations: " + ex;
                        Utils.error(message);
                        message = "Failed operation (" + operationsCounter + ") : " + JSON.stringify(operation);
                        Utils.error(message);
                        insertLoadError();
                    }
                }
            });
        };

        /**
         * Copies the current selection into the internal clipboard and deletes
         * the selection.
         */
        this.cut = function (event) {

            var // the clipboard div
                clipboard,
                // the clipboard event data
                clipboardData = event && event.originalEvent && event.originalEvent.clipboardData;

            // set the internal clipboard data and
            // add the data to the clipboard event if the browser supports the clipboard api
            this.copy(event);

            // if the browser supports the clipboard api, use the copy function to add data to the clipboard
            if (clipboardData) {

                // prevent default cut handling of the browser
                event.preventDefault();

                // delete current selection
                this.deleteSelected();

            } else {

                // copy the currently selected nodes to the clipboard div and append it to the body
                clipboard = $('<div>', { contenteditable: true }).addClass('io-ox-office-clipboard user-select-text');
                clipboard.append(DOM.getHtmlFromBrowserSelection);
                $('body').append(clipboard);

                // focus the clipboard node and select all of it's child nodes
                clipboard.focus();
                DOM.setBrowserSelection(DOM.Range.createRange(clipboard, 0, clipboard, clipboard.contents().length));

                _.delay(function () {

                    // restore browser selection
                    selection.restoreBrowserSelection();
                    // remove the clipboard node
                    clipboard.remove();
                    // delete restored selection
                    self.deleteSelected();

                }, 0, clipboard, selection);
            }
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
                            generator.generateSetAttributesOperation(contentNode, 'paragraph', [targetPosition], undefined, { clear: true });
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
                // merged attributes of the old table
                oldTableAttributes = null,
                // explicit attributes for the new table
                newTableAttributes = null,
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
                    generator.generateOperationWithAttributes(tableRowNodes[lastRow], Operations.ROWS_INSERT, { start: [1, lastRow], count: 1, insertDefaultCells: false });
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
            oldTableAttributes = tableStyles.getElementAttributes(cellRangeInfo.tableNode);
            newTableAttributes = StyleSheets.getExplicitAttributes(cellRangeInfo.tableNode);
            newTableAttributes.table = newTableAttributes.table || {};
            newTableAttributes.table.tableGrid = oldTableAttributes.table.tableGrid.slice(cellRangeInfo.firstCellPosition[1], cellRangeInfo.lastCellPosition[1] + 1);
            generator.generateOperation(Operations.TABLE_INSERT, { start: [1], attrs: newTableAttributes });

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
         * Copies the current selection into the internal clipboard and
         * attaches the clipboard data to the copy event if the browser
         * supports the clipboard api.
         */
        this.copy = function (event) {

            var clipboardData = event && event.originalEvent && event.originalEvent.clipboardData;

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

            // if browser supports clipboard api add data to the event
            if (clipboardData) {
                // add operation data
                clipboardData.setData('text/ox-operations', JSON.stringify(clipboardOperations));
                // add plain text and html of the current browser selection
                clipboardData.setData('text/plain', DOM.getTextFromBrowserSelection());
                clipboardData.setData('text/html', DOM.getHtmlFromBrowserSelection());
                // prevent default copy handling of the browser
                event.preventDefault();
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
                    if (_.isArray(operation.start)) {
                        // start may exist but is relative to position then
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

            var // the clipboard div
                clipboard,
                // the clipboard event data
                clipboardData = event && event.originalEvent && event.originalEvent.clipboardData,
                // the list items of the clipboard event data
                items = clipboardData && clipboardData.items,
                // the operation data from the internal clipboard
                eventData,
                // the file reader
                reader,
                // indicates if the event contains image data to be read by the file reader
                eventHasImageData = false;

            // handles the result of reading file data from the file blob received from the clipboard data api
            function onLoadHandler(evt) {
                var data = evt && evt.target && evt.target.result;

                if (data) {
                    createOperationsFromExternalClipboard([{operation: Operations.DRAWING_INSERT, data: data, depth: 0}]);
                }
            }

            // if the browser supports the clipboard api, look for operation data
            // from the internal clipboard to handle as internal paste.
            if (clipboardData) {
                eventData = clipboardData.getData('text/ox-operations');
                if (eventData) {
                    // prevent default paste handling of the browser
                    event.preventDefault();

                    // set the operations from the event to be used for the paste
                    clipboardOperations = (eventData.length > 0) ? JSON.parse(eventData) : [];
                    self.pasteInternalClipboard();
                    return;
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

                createOperationsFromExternalClipboard(clipboardData);

            }, 0, clipboard, selection);
        };

        this.initDocument = function () {

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
                characterStyles.setElementAttributes(span, { character: { highlight: null } }, { special: true });
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
                        characterStyles.setElementAttributes(spanInfo.span, { character: { highlight: true } }, { special: true });
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
                scrollToNode(highlightedSpans[0]);
            }

            // return whether any text in the document matches the passed query text
            return this.hasHighlighting();
        };

        // ==================================================================
        // HIGH LEVEL EDITOR API which finally results in Operations
        // and creates Undo Actions.
        // Public functions, that are called from outside the editor
        // and generate operations.
        // ==================================================================

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
                            // endOffset = _.isNumber(endOffset) ? endOffset : (Position.getParagraphLength(editdiv, position) - 1);
                            endOffset = _.isNumber(endOffset) ? endOffset : (Position.getParagraphLength(editdiv, position));

                            // delete the covered part of the paragraph
                            if (startOffset <= endOffset) {
                                // generator.generateOperation(Operations.TEXT_DELETE, { start: position.concat([startOffset]), end: position.concat([endOffset]) });
                                generator.generateOperation(Operations.DELETE, { start: position.concat([startOffset]), end: position.concat([endOffset]) });
                            }
                        } else {
                            generator.generateOperation(Operations.DELETE, { start: position });
                        }

                    } else if (DOM.isTableNode(node)) {
                        // delete entire table
                        generator.generateOperation(Operations.DELETE, { start: position });
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

                // collapse selection to old range start
                selection.setTextSelection(selection.getStartPosition());

            }, this);
        };

        /**
         * Editor API function to generate 'delete' operations. The name of this API function
         * should be 'delete' instead of 'deleteRange', but unfortunately 'delete' is already
         * reserved in JavaScript language.
         * This is a generic function, that can be used to delete any component (text, paragraph,
         * cell, row, table, ...). Deleting columns is not supported, because columns cannot
         * be described with a logical position.
         * The parameter 'start' and 'end' are used to specify the position of the components that
         * shall be deleted. For all components except 'text' the 'end' position will be ignored.
         * For paragraphs, cells, ... only one specific component can be deleted within this
         * operation. Only on text level a complete range can be deleted.
         *
         * @param {Number[]} start
         *  The logical start position.
         *
         * @param {Number[]} [end]
         *  The logical end position (optional). This can be different from 'start' only for text ranges
         *  inside one paragraph. A text range can include characters, fields, and drawing objects,
         *  but must be contained in a single paragraph.
         */
        this.deleteRange = function (start, end) {
            end = end || _.clone(start);
            // Using end as it is, not subtracting '1' like in 'deleteText'
            var newOperation = { name: Operations.DELETE, start: _.clone(start), end: _.clone(end) };
            applyOperation(newOperation);

            // setting the cursor position
            selection.setTextSelection(lastOperationEnd);
        };

        this.deleteRows = function () {
            var position = selection.getStartPosition(),
                start = Position.getRowIndexInTable(editdiv, position),
                end = start,
                rowPosition = null;

            if (selection.hasRange()) {
                end = Position.getRowIndexInTable(editdiv, selection.getEndPosition());
            }

            var tablePos = Position.getLastPositionFromPositionByNodeName(editdiv, position, DOM.TABLE_NODE_SELECTOR),
                lastRow = Position.getLastRowIndexInTable(editdiv, position),
                isCompleteTable = ((start === 0) && (end === lastRow)) ? true : false,
                newOperation = null;

            if (isCompleteTable) {
                newOperation = { name: Operations.DELETE, start: _.copy(tablePos, true) };
                applyOperation(newOperation);
            } else {
                undoManager.enterGroup(function () {
                    for (var i = end; i >= start; i--) {
                        rowPosition = _.clone(tablePos);
                        rowPosition.push(i);
                        newOperation = { name: Operations.DELETE, start: rowPosition };
                        applyOperation(newOperation);
                    }
                });
            }

            // setting the cursor position
            selection.setTextSelection(lastOperationEnd);
        };

        this.deleteCells = function () {

            var isCellSelection = selection.getSelectionType() === 'cell',
                startPos = selection.getStartPosition(),
                endPos = selection.getEndPosition(),
                localPos = null,
                newOperation = null;

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

                for (var j = localEndCol; j >= localStartCol; j--) {
                    localPos = _.clone(rowPosition);
                    localPos.push(j);
                    newOperation = { name: Operations.DELETE, start: localPos };
                    applyOperation(newOperation);
                }

                // removing empty row
                var rowNode = Position.getDOMPosition(editdiv, rowPosition).node;
                if ($(rowNode).children().length === 0) {
                    localPos = _.clone(tablePos);
                    localPos.push(i);
                    newOperation = { name: Operations.DELETE, start: localPos };
                    applyOperation(newOperation);
                }

                // checking if the table is empty
                var tableNode = Position.getDOMPosition(editdiv, tablePos).node;
                if (DOM.getTableRows(tableNode).length === 0) {
                    newOperation = { name: Operations.DELETE, start: _.copy(tablePos, true) };
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
                    var newOperation = {name: Operations.CELL_MERGE, start: cellPosition, count: count};
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
                attrs = { cell: {} };

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
                attrs.cell.gridSpan = 1;  // only 1 grid for the new cell
                var newOperation = { name: Operations.CELLS_INSERT, start: cellPosition, count: count, attrs: attrs };
                applyOperation(newOperation);

                // Applying new tableGrid, if the current tableGrid is not sufficient
                var tableDomPoint = Position.getDOMPosition(editdiv, tablePos),
                    rowDomPoint = Position.getDOMPosition(editdiv, rowPosition);

                if (tableDomPoint && DOM.isTableNode(tableDomPoint.node)) {

                    var tableGridCount = tableStyles.getElementAttributes(tableDomPoint.node).table.tableGrid.length,
                        rowGridCount = Table.getColSpanSum($(rowDomPoint.node).children());

                    if (rowGridCount > tableGridCount) {

                        localEndCol--;  // behind is evaluated in getTableGridWithNewColumn
                        var insertmode = 'behind',
                            tableGrid = Table.getTableGridWithNewColumn(editdiv, tablePos, localEndCol, insertmode);

                        // Setting new table grid attribute to table
                        newOperation = { name: Operations.ATTRS_SET, attrs: { table: { tableGrid: tableGrid } }, start: _.clone(tablePos) };
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
                    newOperation = { name: Operations.DELETE, start: _.copy(tablePos, true) };
                    applyOperation(newOperation);
                } else {
                    newOperation = { name: Operations.COLUMNS_DELETE, start: tablePos, startGrid: startGrid, endGrid: endGrid };
                    applyOperation(newOperation);

                    // Checking, if there are empty rows
                    var maxRow = DOM.getTableRows(tableNode).length - 1,
                        deletedAllRows = true;

                    for (var i = maxRow; i >= 0; i--) {
                        var rowPos = _.clone(tablePos);
                        rowPos.push(i);
                        var currentRowNode = Position.getDOMPosition(editdiv, rowPos).node;
                        if ($(currentRowNode).children().length === 0) {
                            newOperation = {  name: Operations.DELETE, start: rowPos };
                            applyOperation(newOperation);
                        } else {
                            deletedAllRows = false;
                        }
                    }

                    // Checking, if now the complete table is empty
                    if (deletedAllRows) {
                        newOperation = { name: Operations.DELETE, start: _.copy(tablePos, true) };
                        applyOperation(newOperation);
                    }

                    // Setting new table grid attribute to table
                    if (! deletedAllRows) {
                        var tableGrid = _.clone(tableStyles.getElementAttributes(tableNode).table.tableGrid);

                        tableGrid.splice(startGrid, endGrid - startGrid + 1);  // removing column(s) in tableGrid (automatically updated in table node)
                        newOperation = { name: Operations.ATTRS_SET, attrs: { table: { tableGrid: tableGrid } }, start: _.clone(tablePos) };
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
                insertDefaultCells = false,
                position = selection.getEndPosition();

            var rowPos = Position.getLastPositionFromPositionByNodeName(editdiv, position, 'tr');

            if (rowPos !== null) {

                var referenceRow = rowPos[rowPos.length - 1];

                rowPos[rowPos.length - 1] += 1;

                var newOperation = { name: Operations.ROWS_INSERT, start: rowPos, count: count, insertDefaultCells: insertDefaultCells, referenceRow: referenceRow };
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
                insertMode = 'behind',
                gridPosition = Table.getGridPositionFromCellPosition(rowNode, cellPosition).start,
                tableGrid = Table.getTableGridWithNewColumn(editdiv, tablePos, gridPosition, insertMode);

            undoManager.enterGroup(function () {

                var newOperation = { name: Operations.COLUMN_INSERT, start: tablePos, tableGrid: tableGrid, gridPosition: gridPosition, insertMode: insertMode };
                applyOperation(newOperation);

                // Setting new table grid attribute to table
                newOperation = { name: Operations.ATTRS_SET, attrs: { table: { tableGrid: tableGrid } }, start: _.clone(tablePos) };
                applyOperation(newOperation);

            }, this);

            // setting the cursor position
            selection.setTextSelection(lastOperationEnd);
        };

        this.insertParagraph = function (start) {
            var newOperation = {name: Operations.PARA_INSERT, start: _.clone(start)};
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
                    attributes = { table: { tableGrid: [], width: 'auto' } },
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
                _(size.width).times(function () { attributes.table.tableGrid.push(1000); });

                // set default table style
                if (_.isString(tableStyleId)) {

                    // insert pending table style to document
                    if (tableStyles.isDirty(tableStyleId)) {
                        generator.generateOperation(Operations.INSERT_STYLE, {
                            attrs: tableStyles.getStyleSheetAttributeMap(tableStyleId),
                            type: 'table',
                            styleId: tableStyleId,
                            styleName: tableStyles.getName(tableStyleId),
                            parent: tableStyles.getParentId(tableStyleId),
                            uiPriority: tableStyles.getUIPriority(tableStyleId)
                        });
                        tableStyles.setDirty(tableStyleId, false);
                    }

                    // add table style name to attributes
                    attributes.table.style = tableStyleId;
                }

                // insert the table, and add empty rows
                generator.generateOperation(Operations.TABLE_INSERT, { start: _.clone(position), attrs: attributes });
                generator.generateOperation(Operations.ROWS_INSERT, { start: Position.appendNewIndex(position, 0), count: size.height, insertDefaultCells: true });

                // apply all collected operations
                self.applyOperations(generator.getOperations());

                // set the cursor to first paragraph in first table cell
                selection.setTextSelection(position.concat([0, 0, 0, 0]));

            }, this); // undoManager.enterGroup()
        };

        this.insertImageFile = function (imageFragment) {

            var start = selection.getStartPosition(),
                newOperation = {
                    name: Operations.DRAWING_INSERT,
                    start: start,
                    type: 'image',
                    attrs: { drawing: { imageUrl: imageFragment } }
                };

            applyOperation(newOperation);

            sendImageSize(start);

            // setting the cursor position
            selection.setTextSelection(lastOperationEnd);
        };

        this.insertImageURL = function (imageURL) {

            var start = selection.getStartPosition(),
                newOperation = {
                    name: Operations.DRAWING_INSERT,
                    start: start,
                    type: 'image',
                    attrs: { drawing: { imageUrl: imageURL } }
                };

            applyOperation(newOperation);

            sendImageSize(start);

            // setting the cursor position
            selection.setTextSelection(lastOperationEnd);
        };

        this.insertImageData = function (imageData) {

            var start = selection.getStartPosition(),
                newOperation = {
                    name: Operations.DRAWING_INSERT,
                    start: start,
                    type: 'image',
                    attrs: { drawing: { imageData: imageData } }
                };

            applyOperation(newOperation);

            sendImageSize(start);

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
                                var charAttributes = characterStyles.getElementAttributes(node).character;
                                if (charAttributes.url && charAttributes.url.length > 0)
                                    url = charAttributes.url;
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
                                attrs: { character: { url: null, style: null } },
                                start: _.clone(start),
                                end: _.clone(end)
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
                                    styleId: hyperlinkStyleId,
                                    styleName: characterStyles.getName(hyperlinkStyleId),
                                    parent: characterStyles.getParentId(hyperlinkStyleId),
                                    uiPriority: characterStyles.getUIPriority(hyperlinkStyleId)
                                });
                                characterStyles.setDirty(hyperlinkStyleId, false);
                            }

                            generator.generateOperation(Operations.ATTRS_SET, {
                                attrs: { character: { url: url, style: hyperlinkStyleId } },
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
                        attrs: { character: { url: null, style: null } },
                        start: _.clone(start),
                        end: _.clone(end)
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

        this.insertTab = function (attrs) {
            undoManager.enterGroup(function () {
                this.deleteSelected();
                applyOperation({ name: Operations.TAB_INSERT, start: selection.getStartPosition() });
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

        this.insertText = function (text, position, attrs) {
            var newOperation = { name: Operations.TEXT_INSERT, text: text, start: _.clone(position) };
            if (_.isObject(attrs)) { newOperation.attrs = attrs; }
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
                    defNumId = listOperation.listName;
                }
                this.setAttributes('paragraph', { paragraph: { numId: defNumId, indentLevel: 0 } });
            }, this);
        };

        this.createList = function (type, options) {
            var defNumId = (!options || (!options.symbol && !options.levelStart)) ? lists.getDefaultNumId(type) : undefined;
            if (defNumId === undefined) {
                var listOperation = lists.getDefaultListOperation(type, options);
                applyOperation(listOperation);
                defNumId = listOperation.listName;
            }
            if (options && options.startPosition) {
                var start = [];
                var length = options.startPosition.length;
                var index = 0;
                for (; index < length - 1; ++index) {
                    start[index] = options.startPosition[index];
                }
                var newOperation = {name: Operations.ATTRS_SET, attrs: { paragraph: { numId: defNumId, indentLevel: 0 } }, start: start, end: start };
                applyOperation(newOperation);
                start[start.length - 1] += 1;
                newOperation.start = start;
                newOperation.end = newOperation.start;
                applyOperation(newOperation);
            } else {
                this.setAttributes('paragraph', { pragraph: { numId: defNumId, indentLevel: 0 } });
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
         * Returns the values of all formatting attributes of the elements in
         * the current selection associated to the specified attribute family.
         *
         * @param {String} family
         *  The name of the attribute family used to select specific elements
         *  in the current selection:
         *  - 'character': all text spans (text portions, text components),
         *  - 'paragraph': all paragraph nodes,
         *  - 'table': all table nodes,
         *  - 'drawing': all drawing object nodes.
         *
         * @returns {Object}
         *  A map of attribute value maps (name/value pairs), keyed by
         *  attribute family.
         */
        this.getAttributes = function (family) {

            var // whether the selection is a simple cursor
                isCursor = selection.isTextCursor(),
                // table or drawing element contained by the selection
                element = null,
                // resulting merged attributes
                mergedAttributes = null;

            // merges the passed element attributes into the resulting attributes
            function mergeElementAttributes(elementAttributes) {

                var // whether any attribute is still unambiguous
                    hasNonNull = false;

                // initial iteration: store attributes and return
                if (!mergedAttributes) {
                    mergedAttributes = elementAttributes;
                    return;
                }

                // process all passed element attributes
                _(elementAttributes).each(function (attributeValues, family) {

                    var // target attribute values
                        mergedAttributeValues = mergedAttributes[family];

                    _(attributeValues).each(function (value, name) {

                        if (!(name in mergedAttributeValues)) {
                            // initial iteration: store value
                            mergedAttributeValues[name] = value;
                        } else if (!_.isEqual(value, mergedAttributeValues[name])) {
                            // value differs from previous value: ambiguous state
                            mergedAttributeValues[name] = null;
                        }
                        hasNonNull = hasNonNull || !_.isNull(mergedAttributeValues[name]);
                    });
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
                if (isCursor && self.getPreselectedAttributes()) {
                    // add preselected attributes (text cursor selection cannot result in ambiguous attributes)
                    StyleSheets.extendAttributes(mergedAttributes, self.getPreselectedAttributes());
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

            return mergedAttributes || {};
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
            this.setAttributes(family, Utils.makeSimpleObject(family, Utils.makeSimpleObject(name, value)), options);
        };

        /**
         * Changes multiple attributes of the specified attribute family in the
         * current selection.
         *
         * @param {String} family
         *  The name of the attribute family containing the passed attributes.
         *
         * @param {Object} attributes
         *  A map of attribute value maps (name/value pairs), keyed by
         *  attribute families.
         *
         * @param {Object} [options]
         *  A map with additional options controlling the opration. The
         *  following options are supported:
         *  @param {Boolean} [options.clear=false]
         *      If set to true, all existing explicit attributes will be
         *      removed from the selection while applying the new attributes.
         */
        this.setAttributes = function (family, attributes, options) {

            // Create an undo group that collects all undo operations generated
            // in the local setAttributes() method (it calls itself recursively
            // with smaller parts of the current selection).
            undoManager.enterGroup(function () {

                var // table or drawing element contained by the selection
                    element = null,
                    // new style identifier
                    styleId =  _.isObject(attributes[family]) ? attributes[family].style : undefined,
                    // operations generator
                    generator = new Operations.Generator(),
                    // the style sheet container
                    styleSheets = this.getStyleSheets(family),
                    // logical position
                    localPosition = null,
                    // another logical position
                    localDestPosition = null,
                    // the length of the paragraph
                    paragraphLength = null,
                    // an additional operation
                    newOperation = null;

                // generates a 'setAttributes' operation with the correct attributes
                function generateSetAttributeOperation(startPosition, endPosition) {

                    var // the options for the operation
                        operationOptions = { start: startPosition, attrs: attributes };

                    // add end position if specified
                    if (_.isArray(endPosition)) {
                        operationOptions.end = endPosition;
                    }

                    // generate the 'setAttributes' operation
                    generator.generateOperation(Operations.ATTRS_SET, operationOptions);
                }

                // add all attributes to be cleared
                if (Utils.getBooleanOption(options, 'clear', false)) {
                    attributes = StyleSheets.extendAttributes(StyleSheets.buildNullAttributes(family), attributes);
                }

                // nothig to do if no attributes will be changed
                if (_.isEmpty(attributes)) { return; }

                // register pending style sheet via 'insertStyleSheet' operation
                if (_.isString(styleId) && styleSheets.isDirty(styleId)) {

                    generator.generateOperation(Operations.INSERT_STYLE, {
                        attrs: styleSheets.getStyleSheetAttributeMap(styleId),
                        type: family,
                        styleId: styleId,
                        styleName: styleSheets.getName(styleId),
                        parent: styleSheets.getParentId(styleId),
                        uiPriority: styleSheets.getUIPriority(styleId)
                    });

                    // remove the dirty flag
                    styleSheets.setDirty(styleId, false);
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
                                generateSetAttributeOperation(position.concat([startOffset]), position.concat([endOffset]));
                            }
                        });
                    } else {
                        self.setPreselectedAttributes(self.getPreselectedAttributes() || {});
                        StyleSheets.extendAttributes(self.getPreselectedAttributes(), attributes);
                    }
                    break;

                case 'paragraph':
                    selection.iterateContentNodes(function (paragraph, position) {
                        generateSetAttributeOperation(position);
                    });
                    break;

                case 'cell':
                    selection.iterateTableCells(function (cell, position) {
                        generateSetAttributeOperation(position);
                    });
                    break;

                case 'table':
                    if ((element = selection.getEnclosingTable())) {
                        generateSetAttributeOperation(Position.getOxoPosition(editdiv, element, 0));
                    }
                    break;

                case 'drawing':
                    // TODO: needs change when multiple drawings can be selected
                    // TODO: this fails if a drawing style sheet changes the inline/floating mode instead of explicit attributes
                    if ((element = selection.getSelectedDrawing()[0]) && DOM.isDrawingNode(element) && _.isObject(attributes.drawing)) {

                        localPosition = Position.getOxoPosition(editdiv, element, 0);

                        // when switching from inline to floated, saving current position in the drawing, so that it can
                        // be set correctly when switching back to inline.
                        // This is only necessary, if the drawing was moved in that way, that implMove needed to be called.
                        if ((attributes.drawing.inline === false) && (DOM.isInlineDrawingNode(element))) {
                            $(element).data('inlinePosition', localPosition[localPosition.length - 1]);
                        }

                        // when switching from floated to inline, a move of the drawing might be necessary
                        if ((attributes.drawing.inline === true) && (DOM.isFloatingDrawingNode(element)) && ($(element).data('inlinePosition'))) {

                            localDestPosition = _.clone(localPosition);
                            paragraphLength = Position.getParagraphLength(editdiv, localDestPosition);
                            if ((paragraphLength - 1) < $(element).data('inlinePosition')) {  // -> is this position still valid?
                                localDestPosition[localDestPosition.length - 1] = paragraphLength - 1;
                            } else {
                                localDestPosition[localDestPosition.length - 1] = $(element).data('inlinePosition');
                            }
                            if (! _.isEqual(localPosition, localDestPosition)) {
                                newOperation = { name: Operations.MOVE, start: localPosition, end: localPosition, to: localDestPosition };
                                applyOperation(newOperation);
                                localPosition = _.clone(localDestPosition);
                            }
                        }

                        generateSetAttributeOperation(localPosition);

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

        this.setWriteProtected = function () {
            if (!writeProtected) {
                writeProtected = true;

                Alert.showWriteProtectedWarning(app.getView().getToolPane().getNode(), app.getController());
            }
        };

        this.isEditMode = function () {
            return editMode;
        };

        this.isWriteProtected = function () {
            return writeProtected;
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

            _(styleNames).find(function (name, id) {
                var lowerName = name.toLowerCase();
                if (lowerName.indexOf('hyperlink') >= 0) {
                    hyperlinkId = id;
                    return true;
                }
                return false;
            });

            return hyperlinkId;
        };

         /**
         * Called when all initial document operations have been processed.
         * Can be used to start post-processing tasks which need a fully
         * processed document.
         */
        this.documentLoaded = function () {
            insertHyperlinkPopup();
            insertMissingCharacterStyles();
            insertMissingParagraphStyles();
            insertMissingTableStyles();

            window.setTimeout(function () {
                Utils.info('Edtor.documentLoaded(): ' + editdiv.find('span').filter(function () { return DOM.isPortionSpan(this) || DOM.isTextComponentNode(this.parentNode); }).length + ' text spans in ' + editdiv.find(DOM.PARAGRAPH_NODE_SELECTOR).length + ' paragraphs');
                Utils.info('Edtor.documentLoaded(): ' + editdiv.find('td').length + ' cells in ' + editdiv.find(DOM.TABLE_NODE_SELECTOR).length + ' tables');
                Utils.info('Edtor.validateParagraphNode(): called ' + (validateParagraphNode.DBG_COUNT || 0) + ' times');
                Utils.info('Edtor.adjustTabsOfParagraph(): called ' + (adjustTabsOfParagraph.DBG_COUNT || 0) + ' times');
                Utils.info('CharacterStyles.updateElementFormatting(): called ' + (characterStyles.DBG_COUNT || 0) + ' times');
                Utils.info('ParagraphStyles.updateElementFormatting(): called ' + (paragraphStyles.DBG_COUNT || 0) + ' times');
                Utils.info('TableCellStyles.updateElementFormatting(): called ' + (tableCellStyles.DBG_COUNT || 0) + ' times');
                Utils.info('TableStyles.updateElementFormatting(): called ' + (tableStyles.DBG_COUNT || 0) + ' times');
            }, 0);
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
            var hyperlinkPopup = $('<div>', { contenteditable: false }).addClass('hyperlink-popup').css({display: 'none'})
                .append(
                    $('<a>').addClass('textwrap').attr({ href: '', rel: 'noreferrer', target: '_blank' }),
                    $('<span>').text(' | '),
                    $('<span>').addClass('link').text(gt('Edit')).click(function () { self.insertHyperlink(); }),
                    $('<span>').text(' | '),
                    $('<span>').addClass('link').text(gt('Remove')).click(function () { self.removeHyperlink(); })
                ),
                page = $(self.getNode().parent()).first();

            if (hyperlinkPopup[0]) {
                var found = page.children('.hyperlink-popup');
                if (!found[0]) {
                    page.append(hyperlinkPopup);
                    selection.on('change', function () {
                        var result = Hyperlink.getURLFromPosition(self, selection);
                        if (result.url) {
                            var link = $('a', hyperlinkPopup[0]),
                                urlSelection = selection.getStartPosition(),
                                obj = null;

                            if (result.beforeHyperlink) {
                                urlSelection[urlSelection.length - 1] += 1;
                            }
                            obj = Position.getDOMPosition(self.getNode(), urlSelection);
                            if (obj && obj.node && DOM.isTextSpan(obj.node.parentNode)) {
                                var pos = urlSelection[urlSelection.length - 1],
                                    startEndPos = Hyperlink.findURLSelection(self, urlSelection, result.url),
                                    left, top, height, width;

                                if (pos !== startEndPos.end || result.beforeHyperlink) {
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
                                    var parent = getApplicationNode(),
                                        parentLeft = parent.offset().left,
                                        parentTop = parent.offset().top,
                                        parentWidth = parent.width(),
                                        scrollPos = getScrollPosition();

                                    left = (left + scrollPos.left) - parentLeft;
                                    top = (top + scrollPos.top + height) - parentTop;

                                    link.text(Hyperlink.limitHyperlinkText(result.url));
                                    link.attr({href: result.url});
                                    hyperlinkPopup.show();
                                    hyperlinkPopup.css({left: left, top: top, width: ''});
                                    width = hyperlinkPopup.width();
                                    if ((left + width) > parentWidth) {
                                        left -= (((left + width) - parentWidth) + parentLeft);
                                        left = Math.max(0, left);
                                        width = Math.min(width, parentWidth);
                                        hyperlinkPopup.css({left: left, width: width});
                                    }
                                    if (pos === startEndPos.start || result.beforeHyperlink) {
                                        // special case: at the start of a hyperlink we want to
                                        // write with normal style
                                        self.setPreselectedAttributes({ character: { style: null, url: null } });
                                    }
                                }
                                else {
                                    // special case: at the end of a hyperlink we want to
                                    // write with normal style and we don't show the popup
                                    self.setPreselectedAttributes({ character: { style: null, url: null } });
                                    hyperlinkPopup.hide();
                                }
                            }
                        }
                        else {
                            hyperlinkPopup.hide();
                            if (result.setPreselectedAttributes)
                                self.setPreselectedAttributes({ character: { style: null, url: null } });
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

            _(styleNames).find(function (name, id) {
                var lowerName = name.toLowerCase();
                if (lowerName.indexOf('hyperlink') >= 0) {
                    hyperlinkMissing = false;
                    return true;
                }
                return false;
            });

            if (hyperlinkMissing) {
                var hyperlinkAttr = { character: self.getDefaultLateralHyperlinkAttributes() },
                    hyperlinkDef = self.getDefaultLateralHyperlinkDefinition();
                characterStyles.addStyleSheet(
                        hyperlinkDef.styleId, hyperlinkDef.styleName,
                        parentId, hyperlinkAttr,
                        { hidden: false, priority: hyperlinkDef.uiPriority, defStyle: false, dirty: true });
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
                paragraphStyles.addStyleSheet(defParaDef.styleId, defParaDef.styleName, null, null,
                        { hidden: false, priority: 1, defStyle: defParaDef['default'], dirty: true });
                parentId = defParaDef.styleId;
            }

            // find out which outline level paragraph styles are missing
            _(styleNames).each(function (name, id) {
                var styleAttributes = paragraphStyles.getStyleSheetAttributes(id).paragraph,
                    outlineLvl = styleAttributes.outlineLevel;
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
                    attr.paragraph = { outlineLevel: level };
                    attr.next = parentId;
                    paragraphStyles.addStyleSheet('heading ' + (level + 1), gt('Heading') + ' ' + (level + 1),
                            parentId, attr, { hidden: false, priority: 9, defStyle: false, dirty: true });
                });
            }
        }

        /**
         * Check the stored table styles of a document and adds a "missing"
         * default table style. This ensures that we can insert tables that
         * are based on a reasonable default style.
         */
        function insertMissingTableStyles() {
            var styleNames = tableStyles.getStyleSheetNames(),
                parentId = tableStyles.getDefaultStyleSheetId(),
                hasDefaultStyle = _.isString(parentId) && (parentId.length > 0),
                defTableDef = self.getDefaultLateralTableDefinition(),
                defTableAttr = self.getDefaultLateralTableAttributes();

            if (!hasDefaultStyle) {
                // Add a missing default table style
                var attr = _.copy(defTableAttr);
                attr.next = null;
                tableStyles.addStyleSheet(defTableDef.styleId, defTableDef.styleName, null, attr,
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
                    // if we only find the default style with uiPriority 99
                    var attr = _.copy(defTableAttr);
                    attr.next = parentId;
                    tableStyles.addStyleSheet(defTableDef.styleId, defTableDef.styleName, parentId, attr,
                            { hidden: false, priority: 59, defStyle: false, dirty: true });
                }
            }
        }

        // ====================================================================
        // Private functions for the hybrid edit mode
        // ====================================================================

        /**
         * Processes a focus event for the editor root node.
         *
         * @param {jQuery.Event} event
         *  The jQuery event object.
         */
        var processFocus = (function () {

            var // current focus state
                isFocused = false,
                // current scroll position
                scrollPosition = null;

            // return the actual processFocus() method
            return function (event) {

                var // the new focus state
                    gotFocus = event.type === 'focus';

                // do nothing for repeated calls without changed state
                if (isFocused === gotFocus) { return; }
                isFocused = gotFocus;

                // the view is still missing if called from its own constructor
                if (isFocused && app.getView()) {
                    // store current scroll positions
                    scrollPosition = getScrollPosition();
                    // Chrome sets a default text cursor at the top position
                    // while processing the focus event, if the editor does
                    // not contain a valid browser selection, e.g. when a
                    // drawing object is selected. Thus, selection needs to
                    // be restored in a timeout handler.
                    window.setTimeout(function () {
                        // restore current scroll positions
                        setScrollPosition(scrollPosition);
                        // selection is invalid until document has been initialized
                        if (selection.isValid()) {
                            selection.restoreBrowserSelection();
                        }
                    });
                }

                // notify listeners
                self.trigger('focus', isFocused);
            };
        }());

        function processMouseDown(event) {

            // in read only mode allow text selection only
            if (!editMode) {
                selection.processBrowserEvent(event);
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

            self.clearPreselectedAttributes();

            // click on drawing node: set browser selection to drawing node, draw selection
            if ((drawing.length > 0) && Utils.containsNode(editdiv, drawing)) {

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
                    endPosition = Position.increaseLastIndex(startPosition);
                    selection.setTextSelection(startPosition, endPosition);
                    DrawingResize.drawDrawingSelection(self, drawing);
                }

                if (isResizeNode) {
                    TableResize.drawTableCellResizeSelection(self, app.getWindow().nodes.main, drawing);
                    // TableResize.drawTableCellResizeSelection(self, app.getView().getApplicationNode(), drawing);
                }

                // send initial mouse down event to the handlers registered in drawDrawingSelection()
                drawing.triggerHandler(event.type, event);

            } else {
                // clicked somewhere else: calculate logical selection from browser selection,
                // after browser has processed the mouse event
                selection.processBrowserEvent(event);
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
                selection.processBrowserEvent(event);
            }
        }

        function processKeyDown(event) {

            lastKeyDownEvent = event;   // for some keys we only get keyDown, not keyPressed!

            if (DOM.isIgnorableKey(event.keyCode)) {
                return;
            }

            implDbgOutEvent(event);

            if (DOM.isCursorKey(event.keyCode)) {

                // Clear preselected attributes. Attention: must be cleared before
                // selection.processBrowserEvent is called. We have listener which
                // could set the preselected attributes for special cases, e.g. start/end of
                // hyperlink we want to write with normal attributes.
                self.clearPreselectedAttributes();

                // any navigation key: change drawing selection to text selection before
                selection.selectDrawingAsText();

                // let browser process the key event, select a drawing that has been covered exactly
                selection.processBrowserEvent(event).done(function () {
                    // draw selection box for selected drawings
                    if (event.shiftKey) {
                        DrawingResize.drawDrawingSelection(self, selection.getSelectedDrawing());
                    }
                });

                return;
            }

            // handle just cursor and copy events if in read only mode
            if (!editMode && !isCopyKeyEvent(event)) {
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
                    var newOperation = {name: Operations.FIELD_INSERT, start: selection.getStartPosition(), type: ' DATE \\* MERGEFORMAT ', representation: '07.09.2012'};
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
                self.clearPreselectedAttributes();
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
                        self.deleteRange(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition);
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
                                self.deleteRange(localPos);
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
                self.clearPreselectedAttributes();
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
                        endPosition[lastValue] -= 1;
                        self.deleteRange(startPosition, endPosition);

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

                // prevent browser from evaluating the key event, but allow cut, copy and paste events
                if (!isPasteKeyEvent(event) && !isCopyKeyEvent(event) && !isCutKeyEvent(event)) {
                    event.preventDefault();
                }

                self.clearPreselectedAttributes();
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
                else if (c === 'B') {
                    self.setAttribute('character', 'bold', !self.getAttributes('character').character.bold);
                }
                else if (c === 'I') {
                    self.setAttribute('character', 'italic', !self.getAttributes('character').character.italic);
                }
                else if (c === 'U') {
                    self.setAttribute('character', 'underline', !self.getAttributes('character').character.underline);
                }
            } else if (event.keyCode === KeyCodes.TAB && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                self.clearPreselectedAttributes();
                // (shift)Tab: Change list indent (if in list) when selection is at first position in paragraph
                var paragraph = Position.getLastNodeFromPositionByNodeName(editdiv, selection.getStartPosition(), DOM.PARAGRAPH_NODE_SELECTOR),
                    mustInsertTab = !event.shiftKey;
                if (!selection.hasRange() &&
                        _.last(selection.getStartPosition()) === Position.getFirstTextNodePositionInParagraph(paragraph)) {
                    var paraAttributes = paragraphStyles.getElementAttributes(paragraph).paragraph,
                        indentLevel = paraAttributes.indentLevel,
                        styleAttributes = paragraphStyles.getStyleSheetAttributes(paraAttributes.style).paragraph;

                    if (paraAttributes.numId !== -1) {
                        mustInsertTab = false;
                        var fromStyle = indentLevel === -1 || paraAttributes.numId === styleAttributes.numId;
                        if (indentLevel === -1) {
                            indentLevel = paraAttributes.indentLevel;
                        }
                        if (indentLevel !== -1) {

                            if (!fromStyle) {
                                if (!event.shiftKey && indentLevel < 8) {
                                    indentLevel += 1;
                                    self.setAttribute('paragraph', 'indentLevel', indentLevel);
                                } else if (event.shiftKey && indentLevel > 0) {
                                    indentLevel -= 1;
                                    self.setAttribute('paragraph', 'indentLevel', indentLevel);
                                }
                            } else {
                                // numbering via paragraph style (e.g. outline numbering)
                                var style = lists.findPrevNextStyle(paraAttributes.numId, paraAttributes.style, event.shiftKey);
                                if (style && style.length)
                                    self.setAttribute('paragraph', 'style', style);
                            }
                        }
                    }
                }
                if (mustInsertTab) {
                    self.insertTab();
                }
            }
        }

        function processKeyPressed(event) {

            if (lastKeyDownEvent && DOM.isIgnorableKey(lastKeyDownEvent.keyCode)) {
                return;
            }

            if (lastKeyDownEvent && DOM.isCursorKey(lastKeyDownEvent.keyCode)) {
                return;
            }

            // handle just cursor and copy events if in read only mode
            if (!editMode && !isCopyKeyEvent(event)) {
                event.preventDefault();
                return;
            }

            implDbgOutEvent(event);

            // prevent browser from evaluating the key event, but allow cut, copy and paste events
            if (!isPasteKeyEvent(event) && !isCopyKeyEvent(event) && !isCutKeyEvent(event)) {
                event.preventDefault();
            }

            var c = getPrintableChar(event);

            // TODO
            // For now (the prototype), only accept single chars, but let the browser process, so we don't need to care about DOM stuff
            // TODO: But we at least need to check if there is a selection!!!

            if ((!event.ctrlKey || (event.ctrlKey && event.altKey && !event.shiftKey)) && !event.metaKey && (c.length === 1)) {

                var hyperlinkSelection = null;

                undoManager.enterGroup(function () {

                    var startPosition = null;

                    self.deleteSelected();
                    startPosition = selection.getStartPosition();

                    if (((event.keyCode === KeyCodes.SPACE) || (event.charCode === KeyCodes.SPACE)) && !selection.hasRange()) {
                        // check left text to support hyperlink auto correction
                        hyperlinkSelection = Hyperlink.checkForHyperlinkText(selection.getEnclosingParagraph(), startPosition);
                    }

                    self.insertText(c, startPosition, self.getPreselectedAttributes());
                    self.clearPreselectedAttributes();

                    // set cursor behind character
                    selection.setTextSelection(Position.increaseLastIndex(startPosition, c.length));

                }, this);

                if (hyperlinkSelection !== null) {
                    Hyperlink.insertHyperlink(self,
                                              hyperlinkSelection.start,
                                              hyperlinkSelection.end,
                                              (hyperlinkSelection.url === null) ? hyperlinkSelection.text : hyperlinkSelection.url);
                    self.setPreselectedAttributes({ character: { style: null, url: null } });
                }
            }
            else if (c.length > 1) {
                self.clearPreselectedAttributes();
                // TODO?
            }
            else {

                self.clearPreselectedAttributes();

                if (event.keyCode === KeyCodes.ENTER) {
                    var hasSelection = selection.hasRange();
                    self.deleteSelected();
                    var startPosition = selection.getStartPosition(),
                        lastValue = startPosition.length - 1,
                        newPosition = _.clone(startPosition),
                        hyperlinkSelection = null;

                    // check for a possible hyperlink text
                    if (!hasSelection) {
                        hyperlinkSelection = Hyperlink.checkForHyperlinkText(
                            selection.getEnclosingParagraph(), selection.getStartPosition());
                    }

                    //at first check if a paragraph has to be inserted before the current table
                    if ((lastValue >= 4) &&
                        (Position.isPositionInTable(editdiv, [0])) &&
                        _(startPosition).all(function (value) { return (value === 0); })) {
                        self.insertParagraph([0]);
                        selection.startPaM.oxoPosition = [0, 0];
                        newPosition = _.clone(selection.startPaM.oxoPosition);
                    } else {
                        // demote or end numbering instead of creating a new paragraph
                        var // the paragraph element addressed by the
                            // passed logical position
                            paragraph = Position.getLastNodeFromPositionByNodeName(editdiv, selection.startPaM.oxoPosition, DOM.PARAGRAPH_NODE_SELECTOR);
                        var indentLevel = paragraphStyles.getElementAttributes(paragraph).paragraph.indentLevel;
                        var split = true;
                        var paragraphLength = Position.getParagraphLength(editdiv, selection.startPaM.oxoPosition),
                            endOfParagraph = paragraphLength ===  selection.startPaM.oxoPosition[selection.startPaM.oxoPosition.length - 1];
                        if (!hasSelection && indentLevel >= 0 && paragraphLength === 0) {
                            indentLevel--;
                            self.setAttribute('paragraph', 'indentLevel', indentLevel);
                            if (indentLevel < 0) {
                                //remove list-label and update paragraph
                                $(paragraph).children(DOM.LIST_LABEL_NODE_SELECTOR).remove();
                                implParagraphChanged(paragraph);
                            }
                            split = false;
                        }
                        var numAutoCorrect = {};
                        if (!hasSelection && indentLevel < 0 && paragraphLength > 3) {
                            // detect Numbering/Bullet labels at paragraph
                            // start

                            if (paragraph !== undefined) {
                                var paraText = paragraph.textContent,
                                labelText = paraText.split(' ')[0];
                                numAutoCorrect.listDetection = lists.detectListSymbol(labelText);
                                if (numAutoCorrect.listDetection.numberFormat !== undefined) {
                                    numAutoCorrect.startPosition = _.copy(selection.startPaM.oxoPosition, true);
                                    numAutoCorrect.startPosition[numAutoCorrect.startPosition.length - 1] = 0;
                                    numAutoCorrect.endPosition = _.copy(selection.endPaM.oxoPosition, true);
                                    numAutoCorrect.endPosition[numAutoCorrect.endPosition.length - 1] = labelText.length + 1;
                                }
                            }
                        }
                        if (split === true) {
                            newPosition[lastValue - 1] += 1;
                            newPosition[lastValue] = 0;

                            undoManager.enterGroup(function () {
                                self.splitParagraph(startPosition);
                                if (endOfParagraph) {
                                    var paraAttributes = paragraphStyles.getElementAttributes(paragraph).paragraph,
                                        styleAttributes = paragraphStyles.getStyleSheetAttributeMap(paraAttributes.style, 'paragraph');
                                    if (styleAttributes.next !== paraAttributes.style) {
                                        selection.setTextSelection(newPosition);
                                        self.setAttribute('paragraph', 'style', styleAttributes.next);
                                        selection.setTextSelection(startPosition);
                                    }
                                }
                            });

                            // now apply 'AutoCorrection'
                            if (numAutoCorrect.listDetection && numAutoCorrect.listDetection.numberFormat !== undefined) {
                                undoManager.enterGroup(function () {
                                    self.deleteRange(numAutoCorrect.startPosition, numAutoCorrect.endPosition);
                                    self.createList(numAutoCorrect.listDetection.numberFormat === 'bullet' ? 'bullet' : 'numbering',
                                            {levelStart: numAutoCorrect.listDetection.levelStart, symbol: numAutoCorrect.listDetection.symbol,
                                             startPosition: numAutoCorrect.startPosition,
                                             numberFormat: numAutoCorrect.listDetection.numberFormat
                                            });
                                });
                            }

                        }
                    }

                    // set hyperlink style and url attribute
                    if (hyperlinkSelection !== null) {
                        Hyperlink.insertHyperlink(self, hyperlinkSelection.start, hyperlinkSelection.end, hyperlinkSelection.text);
                    }
                    selection.setTextSelection(newPosition);
                }
            }
        }

        function processDroppedImages(event) {

            event.preventDefault();
            if (!editMode) {
                return;
            }

            var images = event.originalEvent.dataTransfer.files;

            //checks if files were dropped from the browser or the file system
            if (images.length === 0) {
                self.insertImageURL(event.originalEvent.dataTransfer.getData("text"));
                return;
            } else {
                for (var i = 0; i < images.length; i++) {
                    var img = images[i];
                    var imgType = /image.*/;

                    //cancels insertion if the file is not an image
                    if (!img.type.match(imgType)) {
                        continue;
                    }

                    Application.readFileAsDataUrl(img)
                    .done(self.insertImageData);
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

                var // the length (of chars, tabs, drawings...) to be added to the oxo position
                    insertLength = 0,
                    // the current child node
                    child,
                    // determins if the node gets parsed recursively or is skipped
                    nextLevel;

                for (var i = 0; i < current.childNodes.length; i++) {
                    child = current.childNodes[i];
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
                                    insertLength ++;
                                } else {
                                    // text
                                    insertLength += splitted[j].length;
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
                            insertLength ++;
                        } else if ($(child).is('style')) {
                            // don't parse <style> elements
                            nextLevel = false;
                        }  else if ($(child).is('a')) {
                            // before we can add the operation for inserting the hyperlink we need to add the insertText operation
                            // so we first parse the next recursion level
                            var len = findTextNodes(child, depth + 1);
                            // and then add the hyperlink
                            result.push({operation: 'insertHyperlink', data: child.href, length: len, depth: depth});
                            // we already traversed the tree, so don't do it again
                            nextLevel = false;
                        }

                        if (nextLevel) {
                            findTextNodes(child, depth + 1);
                        }
                    }
                }

                return insertLength;

            } (clipboard.get(0), 0));

            return result;
        }

        /**
         * Creates operations from the clipboard data returned by parseClipboard(...)
         * @param {Array} clipboardData
         * @param {Selection} [sel]
         */
        function createOperationsFromExternalClipboard(clipboardData) {

            var lastPos = selection.startPaM.oxoPosition.length - 1,
                hyperLinkInserted = false;
//                currentDepth = clipboardData[0] && clipboardData[0].depth;


            // the operation after insertHyperlink needs to remove the hyperlink style again
            function removeHyperLinkStyle(startPosition, endPosition) {
                if (hyperLinkInserted) {
                    Hyperlink.removeHyperlink(self, startPosition, endPosition);
                    hyperLinkInserted = false;
                }
            }


            // delete current selection
            self.deleteSelected();

            // to paste at the cursor position don't create a paragraph as first operation
            if (clipboardData.length > 1 && clipboardData[0].operation === Operations.PARA_INSERT) {
                clipboardData.shift();
            }

            undoManager.enterGroup(function () {

                _.each(clipboardData, function (entry) {

                    var start = _.copy(selection.startPaM.oxoPosition, true),
                        end = _.copy(selection.startPaM.oxoPosition, true);

                    switch (entry.operation) {

                    case Operations.PARA_INSERT:
                        self.splitParagraph(start);
                        end[lastPos - 1] ++;
                        end[lastPos] = 0;
                        selection.setTextSelection(end);
                        break;

                    case Operations.TEXT_INSERT:
                        self.insertText(entry.data, start);
                        end[lastPos] += entry.data.length;
                        removeHyperLinkStyle(start, end);
                        selection.setTextSelection(end);
                        break;

                    case Operations.TAB_INSERT:
                        self.insertTab();
                        end[lastPos] ++;
                        removeHyperLinkStyle(start, end);
                        selection.setTextSelection(end);
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
                            end[lastPos] ++;
                            removeHyperLinkStyle(start, end);
                            selection.setTextSelection(end);
                        }
                        break;

                    case 'insertHyperlink':
                        if (entry.data && _.isNumber(entry.length)) {
                            // the text for the hyperlink has already been inserted and the current selection is right after this text,
                            // so the start for the hyperlink attribute is the current selection minus the text length
                            start[lastPos] -= entry.length;
                            if (start[lastPos] < 0) {
                                start[lastPos] = 0;
                            }

                            Hyperlink.insertHyperlink(self, start, end, entry.data);
                            hyperLinkInserted = true;
                        }
                        break;

                    default:
                        Utils.log('createOperationsFromExternalClipboard(...) - unhandled operation: ' + entry.operation);
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

        operationHandlers[Operations.SET_DOCUMENT_ATTRIBUTES] = function (operation) {

            var // passed attributes from operation
                attributes = _.isObject(operation.attrs) ? operation.attrs : {};

            // global document attributes
            documentStyles.setAttributes(attributes.document);

            // default attribute values of other style families
            _(attributes).each(function (defaultValues, family) {
                var styleSheets = documentStyles.getStyleSheets(family);
                if (styleSheets) {
                    styleSheets.setAttributeDefaultValues(defaultValues);
                }
            });

            // setting default attributes is not undoable
        };

        operationHandlers[Operations.DELETE] = function (operation) {
            var // node info about the paragraph to be deleted
                nodeInfo = null,
                // attribute type of the start node
                type = null,
                // generator for the undo/redo operations
                generator = undoManager.isEnabled() ? new Operations.Generator() : null;

            // undo/redo generation
            if (generator) {

                nodeInfo = Position.getDOMPosition(editdiv, operation.start, true);
                type = resolveElementType(nodeInfo.node);

                switch (type) {

                case 'text':
                    var position = operation.start.slice(0, -1),
                        paragraph = Position.getCurrentParagraph(editdiv, position),
                        start = operation.start[operation.start.length - 1],
                        end = operation.end[operation.end.length - 1];

                    generator.generateParagraphChildOperations(paragraph, position, { start: start, end: end, clear: true });
                    undoManager.addUndo(generator.getOperations(), operation);
                    break;

                case 'paragraph':
                    generator.generateParagraphOperations(nodeInfo.node, operation.start);
                    undoManager.addUndo(generator.getOperations(), operation);
                    break;

                case 'cell':
                    generator.generateTableCellOperations(nodeInfo.node, operation.start);
                    undoManager.addUndo(generator.getOperations(), operation);
                    break;

                case 'row':
                    generator.generateTableRowOperations(nodeInfo.node, operation.start);
                    undoManager.addUndo(generator.getOperations(), operation);
                    break;

                case 'table':
                    generator.generateTableOperations(nodeInfo.node, operation.start); // generate undo operations for the entire table
                    undoManager.addUndo(generator.getOperations(), operation);
                    break;
                }
            }

            // finally calling the implementation function to delete the content
            implDelete(operation.start, operation.end);
        };

        operationHandlers[Operations.MOVE] = function (operation) {
            if (undoManager.isEnabled()) {
                // Todo: Ignoring 'end', only 'start' === 'end' is supported
                var undoOperation = { name: Operations.MOVE, start: operation.to, end: operation.to, to: operation.start };
                undoManager.addUndo(undoOperation, operation);
            }
            implMove(operation.start, operation.end, operation.to);
        };

        operationHandlers[Operations.TEXT_INSERT] = function (operation) {
            if (implInsertText(operation.start, operation.text, operation.attrs)) {
                if (undoManager.isEnabled()) {
                    var end = Position.increaseLastIndex(operation.start, operation.text.length),
                        undoOperation = { name: Operations.DELETE, start: operation.start, end: end };
                    undoManager.addUndo(undoOperation, operation);
                }
            }
        };

        operationHandlers[Operations.FIELD_INSERT] = function (operation) {
            if (implInsertField(operation.start, operation.type, operation.representation, operation.attrs)) {
                if (undoManager.isEnabled()) {
                    var undoOperation = { name: Operations.DELETE, start: operation.start, end: operation.start };
                    undoManager.addUndo(undoOperation, operation);
                }
            }
        };

        operationHandlers[Operations.TAB_INSERT] = function (operation) {
            if (implInsertTab(operation.start, operation.attrs)) {
                if (undoManager.isEnabled()) {
                    var undoOperation = { name: Operations.DELETE, start: operation.start, end: operation.start };
                    undoManager.addUndo(undoOperation, operation);
                }
            }
        };

        operationHandlers[Operations.DRAWING_INSERT] = function (operation) {
            if (implInsertDrawing(operation.type, operation.start, operation.attrs)) {
                if (undoManager.isEnabled()) {
                    var undoOperation = { name: Operations.DELETE, start: operation.start, end: operation.start };
                    undoManager.addUndo(undoOperation, operation);
                }
            }
        };

        operationHandlers[Operations.INSERT_STYLE] = function (operation) {

            var // target style sheet container
                styleSheets = self.getStyleSheets(operation.type),
                // passed attributes from operation
                attributes = _.isObject(operation.attrs) ? operation.attrs : {};

            if (!styleSheets) {
                Utils.warn('Editor.insertStyleSheet(): invalid style family: ' + operation.type);
                return;
            }

            if (undoManager.isEnabled()) {
                undoManager.addUndo({ name: Operations.DELETE_STYLE, type: operation.type, styleId: operation.styleId }, operation);
            }

            styleSheets.addStyleSheet(operation.styleId, operation.styleName, operation.parent, attributes,
                { hidden: operation.hidden, priority: operation.uiPriority, defStyle: operation['default'] });
        };

        operationHandlers[Operations.INSERT_THEME] = function (operation) {

            if (undoManager.isEnabled()) {
                // TODO!!!
            }

            self.getThemes().addTheme(operation.themeName, operation.attrs);
        };

        operationHandlers[Operations.INSERT_FONT_DESC] = function (operation) {
            // TODO!
        };

        operationHandlers[Operations.INSERT_LIST] = function (operation) {
            undoManager.addUndo({ name: Operations.DELETE_LIST, listName: operation.listName }, operation);
            lists.addList(operation.listName, operation.listDefinition);
        };

        operationHandlers[Operations.DELETE_LIST] = function (operation) {
            // no Undo, cannot be removed by UI
            lists.deleteList(operation.listName);
        };

        operationHandlers[Operations.ATTRS_SET] = function (operation) {
            // undo/redo generation is done inside implSetAttributes()
            implSetAttributes(operation.start, operation.end, operation.attrs);
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
                undoManager.addUndo({ name: Operations.DELETE, start: operation.start }, operation);
            }

            // apply the passed paragraph attributes
            if (_.isObject(operation.attrs)) {
                paragraphStyles.setElementAttributes(paragraph, operation.attrs);
            }

            // set cursor to beginning of the new paragraph
            lastOperationEnd = startPosition;

            // the paragraph can be part of a list, update all lists
            implUpdateLists();
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
                generator.generateSetAttributesOperation(nextParagraph, 'paragraph', nextParaPosition, undefined, { clear: true });
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
                inserted = insertContentNode(operation.start, table),
                styleId;

            // insertContentNode() writes warning to console
            if (!inserted) { return; }

            // generate undo/redo operations
            if (undoManager.isEnabled()) {
                undoManager.addUndo({ name: Operations.DELETE, start: operation.start }, operation);
            }

            // apply the passed table attributes
            if (_.isObject(operation.attrs)) {
                styleId = operation.attrs.style;

                // check if the table style is available and if not use the default style
                if (styleId) {
                    if (!tableStyles.containsStyleSheet(styleId)) {
                        styleId = self.getDefaultUITableStylesheet();
                    }
                    Table.checkForLateralTableStyle(self, styleId);
                    operation.attrs.style = styleId;
                }

                tableStyles.setElementAttributes(table, operation.attrs);
            }
        };

        operationHandlers[Operations.COLUMNS_DELETE] = function (operation) {
            var table = Position.getTableElement(editdiv, operation.start);
            if (table) {
                if (undoManager.isEnabled()) {

                    var allRows = DOM.getTableRows(table),
                        allCellRemovePositions = Table.getAllRemovePositions(allRows, operation.startGrid, operation.endGrid),
                        generator = new Operations.Generator();

                    allRows.each(function (index) {

                        var rowPos = operation.start.concat([index]),
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
                implDeleteColumns(operation.start, operation.startGrid, operation.endGrid);
            }
        };

        operationHandlers[Operations.CELL_MERGE] = function (operation) {
            if (undoManager.isEnabled()) {
                var content = null,
                    gridSpan = null,
                    undoOperation = { name: Operations.CELL_SPLIT, start: operation.start, content: content, gridSpan: gridSpan };
                undoManager.addUndo(undoOperation, operation);
            }
            implMergeCell(_.copy(operation.start, true), operation.count);
        };

        operationHandlers[Operations.CELLS_INSERT] = function (operation) {
            if (undoManager.isEnabled()) {
                var pos = _.copy(operation.start, true),
                    start = pos.pop(),
                    count = operation.count || 1,
                    end = start + count - 1,
                    localStart = null,
                    undoOperation = null;

                for (var i = start; i <= end; i++) {
                    localStart = _.clone(pos);
                    localStart.push(i);
                    undoOperation = { name: Operations.DELETE, start: localStart };
                    undoManager.addUndo(undoOperation, operation);
                }
            }
            implInsertCells(_.copy(operation.start, true), operation.count, operation.attrs);
        };

        operationHandlers[Operations.ROWS_INSERT] = function (operation) {
            if (undoManager.isEnabled()) {
                var pos = _.copy(operation.start, true),
                    start = pos.pop(),
                    end = start,
                    undoOperation = null,
                    rowPosition = null;

                for (var i = start; i <= end; i++) {
                    rowPosition = _.clone(pos);
                    rowPosition.push(i);
                    undoOperation = { name: Operations.DELETE, start: rowPosition };
                    undoManager.addUndo(undoOperation, operation);
                }
            }
            implInsertRows(operation.start, operation.count, operation.insertDefaultCells, operation.referenceRow, operation.attrs);
        };

        operationHandlers[Operations.COLUMN_INSERT] = function (operation) {
            if (undoManager.isEnabled()) {
                undoManager.startGroup();
                // COLUMNS_DELETE cannot be the answer to COLUMN_INSERT, because the cells of the new column may be inserted
                // at very different grid positions. It is only possible to remove the new cells with deleteCells operation.
                var localPos = _.clone(operation.start),
                    table = Position.getDOMPosition(editdiv, localPos).node,  // -> this is already the new grid with the new column!
                    allRows = DOM.getTableRows(table),
                    allCellInsertPositions = Table.getAllInsertPositions(allRows, operation.gridPosition, operation.insertMode),
                    undoOperation = null,
                    cellPosition = null;

                for (var i = (allCellInsertPositions.length - 1); i >= 0; i--) {
                    cellPosition = _.clone(localPos);
                    cellPosition.push(i);
                    cellPosition.push(allCellInsertPositions[i]);
                    undoOperation = { name: Operations.DELETE, start: cellPosition };
                    undoManager.addUndo(undoOperation);
                }

                undoManager.addUndo(null, operation);  // only one redo operation

                undoManager.endGroup();
            }
            implInsertColumn(operation.start, operation.gridPosition, operation.insertMode);
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

            validateParagraphNode.DBG_COUNT = (validateParagraphNode.DBG_COUNT || 0) + 1;

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
                            // remove this span, if it is an empty portion and has a sibling text portion (should not happen anymore)
                            if (DOM.isTextSpan(span.previousSibling) || DOM.isTextSpan(span.nextSibling)) {
                                Utils.warn('Editor.validateParagraphNode(): empty text span with sibling text span found');
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

            // Special case for hyperlink formatting and empty paragraph (just one empty textspan)
            // Here we always don't want to have the hyperlink formatting, we hardly reset these attributes
            if (DOM.isTextSpan(paragraph.firstElementChild) && (paragraph.children.length === 1) &&
                (paragraph.firstElementChild.textContent.length === 0)) {
                var url = characterStyles.getElementAttributes(paragraph.firstElementChild).character.url;
                if ((url !== null) && (url.length > 0)) {
                    characterStyles.setElementAttributes(paragraph.firstElementChild, { character: { url: null, style: null } });
                }
            }

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

            adjustTabsOfParagraph.DBG_COUNT = (adjustTabsOfParagraph.DBG_COUNT || 0) + 1;

            Position.iterateParagraphChildNodes(paragraph, function (node) {
                if (DOM.isTabNode(node)) {
                    allTabNodes.push(node);
                }
            });

            if (allTabNodes.length > 0) {

                var defaultTabstop = documentStyles.getAttributes().defaultTabStop,
                    paraAttributes = paragraphStyles.getElementAttributes(paragraph).paragraph,
                    paraTabstops = [];

                // paragraph tab stop definitions
                if (paraAttributes && paraAttributes.tabStops) {
                    paraTabstops = paraAttributes.tabStops;
                }

                var marginLeft = Utils.convertLengthToHmm(parseFloat($(paragraph).css('margin-left')), 'px');
                _(allTabNodes).each(function (tabNode) {
                    var pos = $(tabNode).position();
                    if (pos) {
                        var leftHMM = marginLeft + Utils.convertLengthToHmm(pos.left, "px"),
                            width = 0,
                            fillChar = null,
                            tabSpan = tabNode.firstChild;

                        // Paragraph tab stops. Only paragraph tab stop can have a fill character and
                        // define a new alignment
                        if (paraTabstops && paraTabstops.length > 0) {
                            var tabstop = _.find(paraTabstops, function (tab) { return (leftHMM + 1) < tab.pos; });
                            if (tabstop && tabSpan) {
                                // tabsize calculation based on the paragraph defined tabstop
                                width = Math.max(0, tabstop.pos - (leftHMM % tabstop.pos));
                                if (tabstop.fillChar) {
                                    switch (tabstop.fillChar) {
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
            var charWidth = 0, numChars, string = '', width = 0,
                checkString = (new Array(5 + 1)).join(fillChar).toString();

            // Try to calculate the average char width using 5 chars string
            charWidth = Utils.convertLengthToHmm($(element).text(checkString).width(), 'px') / 5;
            numChars = Math.floor(maxWidth / charWidth);

            if (numChars > 0) {
                string = (new Array(numChars + 1)).join(fillChar).toString();

                width = Utils.convertLengthToHmm($(element).text(string).width(), 'px');
                if (width >= maxWidth)
                    string = string.slice(0, string.length);
            }

            return string;
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
                    if (Utils.containsNode(editdiv, this)) {
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
                        newOperation = { name: Operations.ATTRS_SET, attrs: { drawing: { width: width, height: height } }, start: updatePosition };

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
                    if (Utils.containsNode(editdiv, this)) {
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
                    if (Utils.containsNode(editdiv, this)) {
                        tableStyles.updateElementFormatting(this);
                    }
                });
                storage.tables = $();
            },

            // storage object passed to all callbacks
            { tables: $() }

        ); // implTableChanged()

        /**
         * Prepares the text span at the specified logical position for
         * insertion of a new text component or character. Splits the text span
         * at the position, if splitting is required. Always splits the span,
         * if the position points between two characters of the span.
         * Additionally splits the span, if there is no previous sibling text
         * span while the position points to the beginning of the span, or if
         * there is no next text span while the position points to the end of
         * the span.
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
        function prepareTextSpanForInsertion(position) {

            var // node info at passed position (DOM text node level)
                nodeInfo = Position.getDOMPosition(editdiv, position);

            // check that the parent is a text span
            if (!nodeInfo || !nodeInfo.node || !DOM.isPortionSpan(nodeInfo.node.parentNode)) {
                Utils.warn('Editor.prepareTextSpanForInsertion(): expecting text span at position ' + JSON.stringify(position));
                return null;
            }
            nodeInfo.node = nodeInfo.node.parentNode;

            // do not split at beginning with existing preceding text span
            if ((nodeInfo.offset === 0) && DOM.isTextSpan(nodeInfo.node.previousSibling)) {
                return nodeInfo.node.previousSibling;
            }

            // return current span, if offset points to its end with following text span
            if ((nodeInfo.offset === nodeInfo.node.firstChild.nodeValue.length) && DOM.isTextSpan(nodeInfo.node.nextSibling)) {
                return nodeInfo.node;
            }

            // otherwise, split the span
            return DOM.splitTextSpan(nodeInfo.node, nodeInfo.offset)[0];
        }

        /**
         * Inserts a simple text portion into the document DOM.
         *
         * @param {Number[]} start
         *  The logical start position for the new text portion.
         *
         * @param {String} text
         *  The text to be inserted.
         *
         * @param {Object} [attrs]
         *  Attributes to be applied at the new text portion, as map of
         *  attribute maps (name/value pairs), keyed by attribute family.
         *
         * @returns {Boolean}
         *  Whether the text portion has been inserted successfully.
         */
        function implInsertText(start, text, attrs) {

            var // text span that will precede the field
                span = prepareTextSpanForInsertion(start),
                // new new text span
                newSpan = null;

            if (!span) { return false; }

            // split the text span again to get actual character formatting for
            // the span, and insert the text
            newSpan = DOM.splitTextSpan(span, span.firstChild.nodeValue.length, { append: true }).text(text);

            // apply the passed text attributes
            if (_.isObject(attrs)) {
                characterStyles.setElementAttributes(newSpan, attrs);
            }

            // try to merge with preceding and following span
            CharacterStyles.mergeSiblingTextSpans(newSpan, true);
            CharacterStyles.mergeSiblingTextSpans(newSpan);

            // validate paragraph, store new cursor position
            implParagraphChanged(newSpan.parent());
            lastOperationEnd = Position.increaseLastIndex(start, text.length);
            return true;
        }

        /**
         * Inserts a text field component into the document DOM.
         *
         * @param {Number[]} start
         *  The logical start position for the new text field.
         *
         * @param {String} type
         *  A property describing the field type.
         *
         * @param {String} representation
         *  A fallback value, if the placeholder cannot be substituted with a
         *  reasonable value.
         *
         * @param {Object} [attrs]
         *  Attributes to be applied at the new text field, as map of attribute
         *  maps (name/value pairs), keyed by attribute family.
         *
         * @returns {Boolean}
         *  Whether the text field has been inserted successfully.
         */
        function implInsertField(start, type, representation, attrs) {

            var // text span that will precede the field
                span = prepareTextSpanForInsertion(start),
                // new text span for the field node
                fieldSpan = null;

            if (!span) { return false; }

            // split the text span again to get initial character formatting
            // for the field, and insert the field representation text
            fieldSpan = DOM.splitTextSpan(span, 0).text(representation);

            // insert a new text field before the addressed text node, move
            // the field span element into the field node
            DOM.createFieldNode().append(fieldSpan).insertAfter(span);

            // apply the passed field attributes
            if (_.isObject(attrs)) {
                characterStyles.setElementAttributes(fieldSpan, attrs);
            }

            // validate paragraph, store new cursor position
            implParagraphChanged(span.parentNode);
            lastOperationEnd = Position.increaseLastIndex(start);
            return true;
        }

        /**
         * Inserts a horizontal tabulator component into the document DOM.
         *
         * @param {Number[]} start
         *  The logical start position for the new tabulator.
         *
         * @param {Object} [attrs]
         *  Attributes to be applied at the new tabulator component, as map of
         *  attribute maps (name/value pairs), keyed by attribute family.
         *
         * @returns {Boolean}
         *  Whether the tabulator has been inserted successfully.
         */
        function implInsertTab(start, attrs) {

            var // text span that will precede the field
                span = prepareTextSpanForInsertion(start),
                // new text span for the tabulator node
                tabSpan = null;

            if (!span) { return false; }

            // split the text span to get initial character formatting for the tab
            tabSpan = DOM.splitTextSpan(span, 0);

            // insert a tab container node before the addressed text node, move
            // the tab span element into the tab container node
            DOM.createTabNode().append(tabSpan).insertAfter(span);

            // apply the passed tab attributes
            if (_.isObject(attrs)) {
                characterStyles.setElementAttributes(tabSpan, attrs);
            }

            // validate paragraph, store new cursor position
            implParagraphChanged(span.parentNode);
            lastOperationEnd = Position.increaseLastIndex(start);
            return true;
        }

        function implInsertDrawing(type, start, attributes) {

            var // text span that will precede the field
                span = prepareTextSpanForInsertion(start),
                // drawing attributes from attribute object
                drawingAttrs = (_.isObject(attributes) && _.isObject(attributes.drawing)) ? attributes.drawing : {},
                // new drawing node
                drawingNode = null,
                // URL from attributes, and absolute URL
                url = null, absUrl = null;

            if (!span) { return false; }

            // insert the drawing with default settings between the two text nodes (store original URL for later use)
            drawingNode = $('<div>', { contenteditable: false })
               .addClass('drawing')
               .data('type', type)
               .append($('<div>').addClass('content'))
               .insertAfter(span);

            if (type === 'image') {
                // saving the absolute image url as data object at content node
                url = drawingAttrs.imageUrl;
                absUrl = /:\/\//.test(url) ? url : getDocumentUrl({ get_filename: url });
                drawingNode.data('absoluteURL', absUrl);
            }

            // apply the passed drawing attributes
            if (_.isObject(attributes)) {
                drawingStyles.setElementAttributes(drawingNode, attributes);
            }

            // validate paragraph, store new cursor position
            implParagraphChanged(span.parentNode);
            lastOperationEnd = Position.increaseLastIndex(start);
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
         * Returns the type of the attributes supported by the passed DOM
         * element.
         *
         * @param {HTMLElement|jQuery} element
         *  The DOM element whose associated attribute type will be returned.
         *  If this object is a jQuery collection, returns its first node.
         */
        function resolveElementType(element) {

            var // the element, as jQuery object
                $element = $(element),
                // the resulting style type
                type = null;

            if (DOM.isTextSpan($element) || DOM.isTextSpanContainerNode($element) || DOM.isDrawingNode($element)) {
                type = 'text';
            } else if (DOM.isParagraphNode($element)) {
                type = 'paragraph';
            } else if (DOM.isTableNode($element)) {
                type = 'table';
            } else if ($element.is('tr')) {
                type = 'row';
            } else if ($element.is('td')) {
                type = 'cell';
            } else {
                Utils.warn('Editor.resolveElementType(): unsupported element');
            }

            return type;
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
         * @param {Object} attributes
         *  A map with formatting attribute values, mapped by the attribute
         *  names, and by attribute family names.
         */
        function implSetAttributes(start, end, attributes) {

            var // node info for start/end position
                startInfo = null, endInfo = null,
                // the main attribute family of the target components
                styleFamily = null,
                // the style sheet container for the target components
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
                styleSheets.setElementAttributes(element, attributes, options);
            }

            // change listener used to build the undo operations
            function changeListener(element, oldAttributes, newAttributes) {

                var // selection object representing the passed element
                    range = Position.getPositionRangeForNode(editdiv, element),
                    // the attributes of the current family for the undo operation
                    undoAttributes = {},
                    // the operation used to undo the attribute changes
                    undoOperation = { name: Operations.ATTRS_SET, start: range.start, end: range.end, attrs: undoAttributes },
                    // last undo operation (used to merge character attributes of sibling text spans)
                    lastUndoOperation = ((undoOperations.length > 0) && (styleFamily === 'character')) ? _.last(undoOperations) : null;

                function insertUndoAttribute(family, name, value) {
                    undoAttributes[family] = undoAttributes[family] || {};
                    undoAttributes[family][name] = value;
                }

                // find all old attributes that have been changed or cleared
                _(oldAttributes).each(function (attributeValues, family) {
                    _(attributeValues).each(function (value, name) {
                        if (!(family in newAttributes) || !_.isEqual(value, newAttributes[family][name])) {
                            insertUndoAttribute(family, name, value);
                        }
                    });
                });

                // find all newly added attributes
                _(newAttributes).each(function (attributeValues, family) {
                    _(attributeValues).each(function (value, name) {
                        if (!(family in oldAttributes) || !(name in oldAttributes[family])) {
                            insertUndoAttribute(family, name, null);
                        }
                    });
                });

                // try to merge 'character' undo operation with last array entry, otherwise add operation to array
                if (lastUndoOperation && (_.last(lastUndoOperation.end) + 1 === _.last(undoOperation.start)) && _.isEqual(lastUndoOperation.attrs, undoOperation.attrs)) {
                    lastUndoOperation.end = undoOperation.end;
                } else {
                    undoOperations.push(undoOperation);
                }
            }

            // do nothing if no attribute object has been passed
            if (!_.isObject(attributes) || _.isEmpty(attributes)) {
                return;
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
                styleFamily = 'character';
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
                styleFamily = startInfo.family;
                styleSheets = self.getStyleSheets(styleFamily);
                setElementAttributes(startInfo.node);
            }

            // create the undo action
            if (undoManager.isEnabled()) {
                redoOperation = { name: Operations.ATTRS_SET, start: start, end: end, attrs: attributes };
                undoManager.addUndo(undoOperations, redoOperation);
            }

            // update numberings and bullets
            if ((startInfo.family === 'paragraph') && _.isObject(attributes.paragraph) && (('style' in attributes.paragraph) || ('indentLevel' in attributes.paragraph) || ('numId' in attributes.paragraph))) {
                implUpdateLists();
            }

            // adjust tab sizes
            var paragraph = null;
            if (DOM.isParagraphNode(startInfo.node)) {
                paragraph = startInfo.node;
            } else if (DOM.isParagraphNode(startInfo.node.parentNode)) {
                paragraph = startInfo.node.parentNode;
            }
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

            // taking care of floated images at the beginning of the paragraph
            if (pos > 0) {
                if (Position.getNumberOfPrevFloatedImages(editdiv, position) === pos) {
                    pos = 0;
                    position[posLength] = 0;
                }
            }

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
                // This code should never be reached. If last row shall be deleted, deleteRange is called.
                self.deleteRange(localPosition);
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

        function implInsertRows(start, count, insertDefaultCells, referenceRow, attrs) {

            var localPosition = _.copy(start, true),
                useReferenceRow = _.isNumber(referenceRow) ? true : false;

            if (! Position.isPositionInTable(editdiv, localPosition)) {
                return;
            }

            insertDefaultCells = insertDefaultCells ? true : false;

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

                row = DOM.getTableRows(table).eq(referenceRow).clone(true);

                // clear the cell contents in the cloned row
                row.children('td').each(function () { implClearCell(this); });

                cellsInserted = true;

            } else if (insertDefaultCells) {

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
                if (_.isObject(attrs)) {
                    tableRowStyles.setElementAttributes(newRow, attrs);
                }
            });

            // recalculating the attributes of the table cells
            if (cellsInserted) {
                implTableChanged(table);
            }

            // Setting cursor
            if ((insertDefaultCells) || (useReferenceRow)) {
                localPosition.push(0);
                localPosition.push(0);
                localPosition.push(0);

                lastOperationEnd = localPosition;
            }
        }

        function implInsertCells(start, count, attrs) {

            var localPosition = _.clone(start),
                tableNode = Position.getLastNodeFromPositionByNodeName(editdiv, start, DOM.TABLE_NODE_SELECTOR),
                tableCellDomPos = null,
                tableCellNode = null,
                paragraph = null,
                cell = null;

            if (!tableNode) {
                return;
            }

            if (!_.isNumber(count)) {
                count = 1; // setting default for number of rows
            }

            tableCellDomPos = Position.getDOMPosition(editdiv, localPosition);

            if (tableCellDomPos) {
                tableCellNode = tableCellDomPos.node;
            }

            // prototype elements for row, cell, and paragraph
            paragraph = DOM.createParagraphNode();

            // insert empty text node into the paragraph
            validateParagraphNode(paragraph);

            cell = DOM.createTableCellNode(paragraph);

            // apply the passed table cell attributes
            if (_.isObject(attrs)) {
                tableCellStyles.setElementAttributes(cell, attrs);
            }

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

        function implDeleteColumns(start, startGrid, endGrid) {

            var localPosition = _.copy(start, true);

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
                // This code should never be reached. If last column shall be deleted, deleteRange is called.
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

        function implInsertColumn(start, gridPosition, insertMode) {

            var localPosition = _.copy(start, true);

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
                        cellPosition = Table.getCellPositionFromGridPosition(row, gridPosition);
                    if (insertMode === 'behind') {
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
            localPosition.push(gridPosition);
            localPosition.push(0);
            localPosition.push(0);

            lastOperationEnd = localPosition;
        }

        function implDeleteText(startPosition, endPosition) {

            var // info about the parent paragraph node
                position = null, paragraph = null,
                // last index in start and end position
                startOffset = 0, endOffset = 0,
                // next sibling text span of last visited child node
                nextTextSpan = null;

            // get paragraph node from start position
            if (!_.isArray(startPosition) || (startPosition.length === 0)) {
                Utils.warn('Editor.implDeleteText(): missing start position');
                return false;
            }
            position = startPosition.slice(0, -1);
            paragraph = Position.getParagraphElement(editdiv, position);
            if (!paragraph) {
                Utils.warn('Editor.implDeleteText(): no paragraph found at position ' + JSON.stringify(position));
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
            Position.iterateParagraphChildNodes(paragraph, function (node) {

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

                    // remove the visited node
                    $(node).remove();

                    // remove previous empty sibling text span (not next sibling which would break iteration)
                    if (DOM.isEmptySpan(prevTextSpan) && nextTextSpan) {
                        $(prevTextSpan).remove();
                    }
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
            implParagraphChanged(paragraph);
            lastOperationEnd = _.clone(startPosition);
        }

        /**
         * Removes a specified element or a text range. The type of the element
         * will be determined from the parameters start and end.
         * specified range. Currently, only single components can be deleted,
         * except for text ranges in a paragraph. A text range can include
         * characters, fields, and drawing objects, but must be contained in a
         * single paragraph.
         *
         * @param {Number[]} start
         *  The logical start position of the element or text range to be
         *  deleted.
         *
         * @param {Number[]} [end]
         *  The logical end position of the element or text range to be
         *  deleted. Can be omitted, if the end position is equal to the start
         *  position (single component)
         */
        function implDelete(start, end) {

            var // node info for start/end position
                startInfo = null, endInfo = null,
                // position description for cells
                rowPosition, startCell, endCell,
                // position description for rows
                tablePosition, startRow, endRow;

            // resolve start and end position
            if (!_.isArray(start)) {
                Utils.warn('Editor.implDelete(): missing start position');
                return;
            }
            startInfo = Position.getDOMPosition(editdiv, start, true);
            if (!startInfo || !startInfo.node) {
                Utils.warn('Editor.implDelete(): invalid start position: ' + JSON.stringify(start));
                return;
            }
            endInfo = _.isArray(end) ? Position.getDOMPosition(editdiv, end, true) : startInfo;
            if (!endInfo || !endInfo.node) {
                Utils.warn('Editor.implDelete(): invalid end position: ' + JSON.stringify(end));
                return;
            }

            end = end || start;

            // get attribute type of start and end node
            startInfo.type = resolveElementType(startInfo.node);
            endInfo.type = resolveElementType(endInfo.node);

            // check that start and end point to the same element type
            if ((!startInfo.type || !endInfo.type) || (startInfo.type !== endInfo.type)) {
                Utils.warn('Editor.implDelete(): problem with node types: ' + startInfo.type + ' and ' + endInfo.type);
                return;
            }

            // check that start and end point to the same element for non text types (only one cell, row, paragraph, ...)
            if ((startInfo.type !== 'text') && (startInfo.node !== endInfo.node)) {
                Utils.warn('Editor.implDelete(): no ranges supported for node type "' + startInfo.type + '"');
                return;
            }

            // check that for text nodes start and end point have the same parent
            if ((startInfo.type === 'text') && (startInfo.node.parentNode !== endInfo.node.parentNode)) {
                Utils.warn('Editor.implDelete(): deleting range only supported inside one paragraph.');
                return;
            }

            // deleting the different types:
            switch (startInfo.type) {

            case 'text':
                implDeleteText(start, end);
                break;

            case 'paragraph':
                $(startInfo.node).remove(); // remove the paragraph from the DOM
                break;

            case 'cell':
                rowPosition = _.clone(start);
                startCell = rowPosition.pop();
                endCell = startCell;
                implDeleteCells(rowPosition, startCell, endCell);
                break;

            case 'row':
                tablePosition = _.clone(start);
                startRow = tablePosition.pop();
                endRow = startRow;
                implDeleteRows(tablePosition, startRow, endRow);
                break;

            case 'table':
                implDeleteTable(start);
                break;

            default:
                Utils.error('Editor.implDelete(): unsupported node type: ' + startInfo.type);
            }

        }

        function implMove(_start, _end, _to) {

            var start = _.copy(_start, true),
                to = _.copy(_to, true),
                sourcePos = Position.getDOMPosition(editdiv, start, true),
                destPos = Position.getDOMPosition(editdiv, to, true),
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
                        if ((!offsetDiv) || (!DOM.isOffsetNode(offsetDiv))) {
                            useOffsetDiv = false;
                        }
                    }

                    if (doMove) {

                        if (splitNode) {
                            destNode = DOM.splitTextSpan(destNode, destPos.offset)[0];
                        } else {
                            if (destNode.nodeType === 3) {
                                destNode = destNode.parentNode;
                            }
                        }

                        // using empty span as reference for inserting new components
                        if ((DOM.isDrawingNode(destNode)) && (DOM.isOffsetNode(destNode.previousSibling))) {
                            destNode = destNode.previousSibling;  // switching temporary to offset
                        }

                        // there can be empty text spans before the destination node
                        if ((DOM.isTextSpan(destNode)) || (DOM.isDrawingNode(destNode)) || (DOM.isOffsetNode(destNode))) {
                            while (DOM.isEmptySpan(destNode.previousSibling)) {
                                destNode = destNode.previousSibling;
                            }
                        }

                        if ((insertBefore) && (DOM.isTextSpan(destNode))) {
                            destNode = DOM.splitTextSpan(destNode, 0)[0]; // taking care of empty text span before drawing
                            insertBefore = false;  // insert drawing behind new empty text span

                        }

                        // removing empty text spans behind or after the source node
                        if ((sourceNode.previousSibling) && (sourceNode.nextSibling)) {
                            if ((DOM.isTextSpan(sourceNode.previousSibling)) && (DOM.isEmptySpan(sourceNode.nextSibling))) {
                                $(sourceNode.nextSibling).remove();
                            } else if ((DOM.isEmptySpan(sourceNode.previousSibling)) && (DOM.isTextSpan(sourceNode.nextSibling))) {
                                $(sourceNode.previousSibling).remove();
                            }
                        }

                        if ((sourceNode.previousSibling) && (sourceNode.previousSibling.previousSibling) && (sourceNode.nextSibling) && (DOM.isOffsetNode(sourceNode.previousSibling))) {
                            if ((DOM.isTextSpan(sourceNode.previousSibling.previousSibling)) && (DOM.isEmptySpan(sourceNode.nextSibling))) {
                                $(sourceNode.nextSibling).remove();
                            } else if ((DOM.isEmptySpan(sourceNode.previousSibling.previousSibling)) && (DOM.isTextSpan(sourceNode.nextSibling))) {
                                $(sourceNode.previousSibling.previousSibling).remove();
                            }
                        }

                        // moving the drawing
                        if (insertBefore) {
                            $(sourceNode).insertBefore(destNode);
                        } else {
                            $(sourceNode).insertAfter(destNode);
                        }

                        // moving also the corresponding div before the moved drawing
                        if (useOffsetDiv) {
                            $(offsetDiv).insertBefore(sourceNode);
                        }

                        implParagraphChanged(to);
                    }
                }
            }
        }

        function implMergeCell(start, count) {

            var rowPosition = _.copy(start, true),
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

            // apply the passed table cell attributes
            tableCellStyles.setElementAttributes(targetCell, { cell: { gridSpan: colSpanSum } });
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
                    var paraAttributes = paragraphStyles.getElementAttributes(para).paragraph,
                    oldLabel = $(para).children(DOM.LIST_LABEL_NODE_SELECTOR);
                    var updateParaTabstops = oldLabel.length > 0;
                    oldLabel.remove();
                    var numId = paraAttributes.numId;
                    if (numId  !== -1) {
                        var indentLevel = paraAttributes.indentLevel;
                        if (indentLevel < 0) {
                            // is a numbering level assigned to the current paragraph style?
                            indentLevel = lists.findIlvl(numId, paraAttributes.style);
                        }
                        if (indentLevel !== -1 && indentLevel < 9) {
                            updateParaTabstops = true;
                            if (!listItemCounter[paraAttributes.numId])
                                listItemCounter[paraAttributes.numId] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
                            listItemCounter[paraAttributes.numId][indentLevel]++;
                            // TODO: reset sub-levels depending on their 'levelRestartValue' attribute
                            var subLevelIdx = indentLevel + 1;
                            for (; subLevelIdx < 9; subLevelIdx++)
                                listItemCounter[paraAttributes.numId][subLevelIdx] = 0;
                            // fix level counts of non-existing upper levels
                            subLevelIdx = indentLevel - 1;
                            for (; subLevelIdx >= 0; subLevelIdx--)
                                if (listItemCounter[paraAttributes.numId][subLevelIdx] === 0)
                                    listItemCounter[paraAttributes.numId][subLevelIdx] = 1;

                            var listObject = lists.formatNumber(paraAttributes.numId, indentLevel,
                                    listItemCounter[paraAttributes.numId]);
                            var tab = !listObject.suff || listObject.suff === 'tab';
                            if (!tab && (listObject.suff === 'space')) {
                                listObject.text += String.fromCharCode(0x00a0);//add non breaking space
                            }

                            var numberingElement = DOM.createListLabelNode(listObject.text);

                            var span = DOM.findFirstPortionSpan(para);
                            var charAttributes = characterStyles.getElementAttributes(span).character;
                            if (listObject.imgsrc) {
                                var absUrl = getDocumentUrl({ get_filename: listObject.imgsrc });
                                var image = $('<div>', { contenteditable: false })
                                .addClass('drawing')
                                .data('url', listObject.imgsrc)
                                .append($('<div>').addClass('content')
                                        .append($('<img>', { src: absUrl }).css('width', charAttributes.fontSize + 'pt'))
                                        );

                                LineHeight.updateElementLineHeight(image, paraAttributes.lineHeight);
                                $(image).css('height', charAttributes.fontSize + 'pt');
                                $(image).css('width', charAttributes.fontSize + 'pt');
                                numberingElement.prepend(image);

                            }
                            var listSpan = numberingElement.children('span');
                            listSpan.css('font-size', charAttributes.fontSize + 'pt');
                            if (listObject.color) {
                                Color.setElementTextColor(listSpan, documentStyles.getCurrentTheme(), listObject, paraAttributes);
                            }
                            LineHeight.updateElementLineHeight(numberingElement, paraAttributes.lineHeight);
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


                                var defaultTabstop = documentStyles.getAttributes().defaultTabStop,
                                paraAttributes = paragraphStyles.getElementAttributes(para).paragraph,
                                paraTabstops = [];
                                // paragraph tab stop definitions
                                if (paraAttributes && paraAttributes.tabStops) {
                                    paraTabstops = paraAttributes.tabStops;
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
                        if (updateParaTabstops) {
                            adjustTabsOfParagraph(para);
                        }
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
            .on('focus blur', processFocus)
            .on('keydown', processKeyDown)
            .on('keypress', processKeyPressed)
            .on('mousedown', processMouseDown)
            .on('mouseup', processMouseUp)
            .on('drop', processDroppedImages)
            .on('dragstart dragover contextmenu', false)
            .on('cut', _.bind(this.cut, this))
            .on('copy', _.bind(this.copy, this))
            .on('paste', _.bind(this.paste, this));

    } // class Editor

    // exports ================================================================

    return Editor;
});
