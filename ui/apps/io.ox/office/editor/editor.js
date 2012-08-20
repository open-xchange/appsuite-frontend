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
     'io.ox/office/editor/position',
     'io.ox/office/editor/format/characterstyles',
     'io.ox/office/editor/format/paragraphstyles'
    ], function (Events, Utils, DOM, OXOPaM, Position, CharacterStyles, ParagraphStyles) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    var OP_TEXT_INSERT =  'insertText';
    var OP_TEXT_DELETE =  'deleteText';

    var OP_PARA_INSERT =  'insertParagraph';
    var OP_PARA_DELETE =  'deleteParagraph';
    var OP_PARA_SPLIT =   'splitParagraph';
    var OP_PARA_MERGE =   'mergeParagraph';

    var OP_TABLE_INSERT = 'insertTable';
    var OP_TABLE_DELETE = 'deleteTable';
    var OP_CELLRANGE_DELETE = 'deleteCellRange';
    var OP_ROWS_DELETE = 'deleteRows';
    var OP_COLUMNS_DELETE = 'deleteColumns';
    var OP_ROW_COPY = 'copyRow';
    var OP_COLUMN_COPY = 'copyColumn';

    var OP_ATTR_SET =     'setAttribute';   // Should better be insertAttribute?
    var OP_ATTRS_SET =    'setAttributes';   // Should better be insertAttributes?

    var OP_IMAGE_INSERT = 'insertImage';

    //    var OP_ATTR_DELETE =  'deleteAttribute';

    function OXOUndoAction(_undoOperation, _redoOperation) {

        // Need to store as member, because of the feature to merge undos afterwards...
        this.undoOperation = _undoOperation;
        this.redoOperation = _redoOperation;

        this.undo = function (editor) {
            editor.applyOperation(this.undoOperation, true, true);  // Doc is being modified, so we need to notify/transfer/merge this operation. Is there a better way for undo?
        };

        this.redo = function (editor) {
            editor.applyOperation(this.redoOperation, true, true);
        };
    }


    function OXOUndoManager() {

        var actions = [];
        // var maxActions = 1000;   // not clear if really wanted/needed...
        var currentAction = 0;

        var groupLevel = 0;
        var currentGroupActions = [];

        var enabled = true;

        var processingUndoRedo = false;

        this.clear = function () {
            actions = [];
            currentAction = 0;
        };

        this.isEnabled = function () {
            return enabled;
        };

        this.enable = function (b) {
            enabled = b;
            if (!enabled)
                this.clear();
        };

        this.startGroup = function () {
            // I don't think we really need complex structure with nested arrays here.
            // Once we start a group, undo will allways undo everything withing
            // Just using ++/-- so other code don't needs to take care wether or not grouping is already active...
            groupLevel++;
        };

        this.endGroup = function () {

            if (!groupLevel) {
                Utils.error('OXOUndoManager.endGroup(): not in undo group!');
                return;
            }

            groupLevel--;

            if (groupLevel === 0) {
                actions.push(currentGroupActions);
                currentAction = actions.length;
                currentGroupActions = [];
            }
        };

        this.isInUndo = function () {
            return processingUndoRedo;
        };

        this.addUndo = function (oxoUndoAction) {

            if (this.isInUndo()) {
                Utils.error('OXOUndoManager.addUndo(): creating undo while processing undo!');
                return;
            }

            var tryToMerge = true;

            // remove undone actions
            if (currentAction < actions.length) {
                actions.splice(currentAction);
                tryToMerge = false;
            }

            if (groupLevel) {
                currentGroupActions.push(oxoUndoAction);
            }
            else {
                var bDone = false;
                if (tryToMerge && currentAction && oxoUndoAction.allowMerge) {
                    var prevUndo = actions[currentAction - 1];
                    if (prevUndo.allowMerge && (prevUndo.redoOperation.name === oxoUndoAction.redoOperation.name)) {
                        if (oxoUndoAction.redoOperation.name === OP_TEXT_INSERT) {
                            if (isSameParagraph(oxoUndoAction.redoOperation.start, prevUndo.redoOperation.start, false)) {
                                var nCharPosInArray = prevUndo.redoOperation.start.length - 1;
                                var prevCharEnd = prevUndo.redoOperation.start[nCharPosInArray] + prevUndo.redoOperation.text.length;
                                if (prevCharEnd === oxoUndoAction.redoOperation.start[nCharPosInArray]) {
                                    var lastChar = prevUndo.redoOperation.text[prevUndo.redoOperation.text.length - 1];     // text len can't be 0 in undo action...
                                    if (lastChar !== ' ') {
                                        // Merge Undo...
                                        prevUndo.redoOperation.text +=  oxoUndoAction.redoOperation.text;
                                        prevUndo.undoOperation.end[nCharPosInArray] += oxoUndoAction.redoOperation.text.length;
                                        bDone = true;
                                    }
                                }
                            }
                        }
                    }
                }
                if (!bDone)
                    actions.push(oxoUndoAction);
                currentAction = actions.length;
            }
        };

        this.hasUndo = function () {
            return currentAction > 0 ? true : false;
        };

        this.undo = function (editor) {

            if (!this.hasUndo())
                return;

            processingUndoRedo = true;
            var action = actions[--currentAction];
            if (_.isArray(action)) {
                for (var i = action.length; i;) {
                    action[--i].undo(editor);
                }
            }
            else {
                action.undo(editor);
            }
            processingUndoRedo = false;
        };

        this.hasRedo = function () {
            return currentAction < actions.length ? true : false;
        };

        this.redo = function (editor) {

            if (!this.hasRedo())
                return;

            processingUndoRedo = true;
            var action = actions[currentAction++];
            if (_.isArray(action)) {
                _.invoke(action, "redo", editor);
            }
            else {
                action.redo(editor);
            }
            processingUndoRedo = false;
        };

    } // class OXOUndoManager

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
     * Represents a text range consisting of start position and end position.
     */
    function OXOSelection(start, end) {
        this.startPaM = start ? _.copy(start, true) : new OXOPaM([0, 0]);
        this.endPaM = end ? _.copy(end, true) : _.copy(this.startPaM, true);
        this.hasRange = function () {
            var hasRange = false;
            if (this.startPaM.oxoPosition.length === this.endPaM.oxoPosition.length) {
                _(this.startPaM.oxoPosition).each(function (element, i) {
                    if (element !== this.endPaM.oxoPosition[i]) {
                        hasRange = true;
                    }
                }, this);
            } else {
                hasRange = true;
            }

            return hasRange;
        };
        this.adjust = function () {
            var change = false,
                minLength = 0;

            if (this.startPaM.oxoPosition.length > this.endPaM.oxoPosition.length) {
                minLength = this.endPaM.oxoPosition.length;
            } else {
                minLength = this.startPaM.oxoPosition.length;
            }

            for (var i = 0; i < minLength; i++) {
                if (this.startPaM.oxoPosition[i] > this.endPaM.oxoPosition[i]) {
                    change = true;
                    break;
                } else if (this.startPaM.oxoPosition[i] < this.endPaM.oxoPosition[i]) {
                    change = false;
                    break;
                }
            }

            if (change) {
                var tmp = _.copy(this.startPaM, true);
                this.startPaM = _.copy(this.endPaM, true);
                this.endPaM = tmp;
            }
        };

        this.isEqual = function (selection) {
            return (_.isEqual(this.startPaM.oxoPosition, selection.startPaM.oxoPosition) && _.isEqual(this.endPaM.oxoPosition, selection.endPaM.oxoPosition)) ? true : false;
        };
    }

    // private static functions ===============================================

    /**
     * Returns all text nodes contained in the specified element.
     *
     * @param {HTMLElement|jQuery} element
     *  A DOM element object whose descendant text nodes will be returned. If
     *  this object is a jQuery collection, uses the first node it contains.
     *
     * @returns {TextNode[]}
     *  An array of text nodes contained in the passed element, in the correct
     *  order.
     */
    function collectTextNodes(element) {
        var textNodes = [];
        Utils.iterateDescendantTextNodes(element, function (textNode) {
            textNodes.push(textNode);
        });
        return textNodes;
    }

    /**
     * Returns all text nodes and images contained in the specified element.
     *
     * @param {HTMLElement|jQuery} element
     *  A DOM element object whose descendant text nodes will be returned. If
     *  this object is a jQuery collection, uses the first node it contains.
     *
     * @returns {Node[]}
     *  An array of text nodes and image nodes contained in the passed element,
     *  in the correct order.
     */
    function collectTextNodesAndImages(element) {
        var nodes = [];
        Utils.iterateSelectedDescendantNodes(element, function () {
            return (this.nodeType === 3) || (Utils.getNodeName(this) === 'img');
        }, function (node) {
            nodes.push(node);
        });
        return nodes;
    }

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
            // the number of child nodes in the paragraph
            childCount = 0,
            // whether the last child node is the dummy <br> element
            lastDummy = false;

        // convert parameter to a DOM node
        paragraph = Utils.getDomNode(paragraph);

        // remove all empty text spans which have sibling text spans, and collect
        // sequences of sibling text spans (needed for white-space handling)
        $(paragraph).contents().each(function () {

            var isTextSpan = DOM.isTextSpan(this),
                isPreviousTextSpan = isTextSpan && this.previousSibling && DOM.isTextSpan(this.previousSibling),
                isNextTextSpan = isTextSpan && this.nextSibling && DOM.isTextSpan(this.nextSibling);

            if (isTextSpan) {
                if ((this.firstChild.nodeValue.length === 0) && (isPreviousTextSpan || isNextTextSpan)) {
                    $(this).remove();
                } else if (isPreviousTextSpan) {
                    _(siblingTextNodes).last().push(this.firstChild);
                } else {
                    siblingTextNodes.push([this.firstChild]);
                }
            }
        });

        // get current child count and whether last node is the dummy <br> node
        childCount = paragraph.childNodes.length;
        lastDummy = paragraph.lastChild && $(paragraph.lastChild).data('dummy');

        // insert an empty text span if there is no other content (except the dummy <br>)
        if (!paragraph.hasChildNodes() || (lastDummy && (childCount === 1))) {
            $(paragraph).prepend($('<span>').text(''));
            childCount += 1;
        }

        // append dummy <br> if the paragraph contains only an empty text span, or
        // remove the dummy <br> if there is anything but a single empty text span
        if ((childCount === 1) && DOM.isEmptyTextSpan(paragraph.firstChild)) {
            $(paragraph).append($('<br>').data('dummy', true));
        } else if (lastDummy && ((childCount > 2) || !DOM.isEmptyTextSpan(paragraph.firstChild))) {
            $(paragraph.lastChild).remove();
        }

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
        });

        // TODO: Adjust tabs, ...
    }

    function isSameParagraph(pos1, pos2, includeLastPos) {
        if (pos1.length !== pos2.length)
            return false;
        if (pos1.length < (includeLastPos ? 1 : 2))
            return false;
        var n = pos1.length - (includeLastPos ? 1 : 2);
        for (var i = 0; i <= n; i++)
            if (pos1[n] !== pos2[n])
                return false;
        return true;
    }

    // class OXOEditor ========================================================

    /**
     * The text editor.
     *
     * Triggers the following events:
     * - 'focus': When the editor container got or lost browser focus.
     * - 'operation': When a new operation has been applied.
     * - 'selectionChanged': When the selection has been changed.
     */
    function OXOEditor(editdiv, textMode) {

        // key codes of navigation keys that will be passed directly to the browser
        var NAVIGATION_KEYS = _([
//              KeyCodes.SHIFT, KeyCodes.CONTROL, KeyCodes.ALT,
//              KeyCodes.CAPS_LOCK,
                KeyCodes.PAGE_UP, KeyCodes.PAGE_DOWN, KeyCodes.END, KeyCodes.HOME,
                KeyCodes.LEFT_ARROW, KeyCodes.UP_ARROW, KeyCodes.RIGHT_ARROW, KeyCodes.DOWN_ARROW,
                KeyCodes.LEFT_WINDOWS, KeyCodes.RIGHT_WINDOWS,
                KeyCodes.NUM_LOCK, KeyCodes.SCROLL_LOCK
            ]);

        var self = this;

        var characterStyles = new CharacterStyles(editdiv);
        var paragraphStyles = new ParagraphStyles(editdiv);

        // TODO: remove these default styles (or move to a 'newDocument' operation)
        paragraphStyles
            .addStyleSheet('Standard', null, {})
            .addStyleSheet('Title', 'Standard', { alignment: 'center', fontname: 'Arial', fontsize: 18, bold: true })
            .addStyleSheet('Subtitle', 'Standard', { alignment: 'center', fontname: 'Arial', fontsize: 14, italic: true })
            .addStyleSheet('Heading 1', 'Standard', { fontname: 'Arial', fontsize: 16, bold: true })
            .addStyleSheet('Heading 2', 'Standard', { fontname: 'Arial', fontsize: 14, bold: true })
            .addStyleSheet('Heading 3', 'Standard', { fontname: 'Arial', fontsize: 13, bold: true });

        var currentDocumentURL;

        var focused = false;

        var lastKeyDownEvent;
        var lastEventSelection;

        var currentSelection;

        // list of operations
        var operations = [];

        var undomgr = new OXOUndoManager();

        var lastOperationEnd;     // Need to decide: Should the last operation modify this member, or should the selection be passed up the whole call chain?!

        var blockOperations = false;
        var blockOperationNotifications = false;

        // list of paragraphs as jQuery object
        var paragraphs = editdiv.children();

        // all DOM ranges highlighted (e.g. in quick search)
        var highlightRanges = [];

        var dbgoutEvents = false, dbgoutObjects = false;

        // add event hub
        Events.extend(this);

        // global editor settings ---------------------------------------------

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
                this.setSelection(new OXOSelection(new OXOPaM([0, 0]), new OXOPaM([0, 0])));
            }
        };

        /**
         * Destructs the editor object.
         */
        this.destroy = function () {
            this.events.destroy();
        };

        // OPERATIONS API

        this.clearOperations = function () {
            operations = [];
        };

        // Maybe only applyOperation_s_, where param might be operation or operation[] ?
        this.applyOperation = function (operation, bRecord, bNotify) {

            if (!_(operation).isObject()) {
                Utils.error('Editor.applyOperation(): expecting operation object');
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
            this.removeHighlighting();

            // Clone operation now, because undo might manipulate it when merging with previous one...
            var notifyOperation = _.clone(operation, true);

            implDbgOutObject({type: 'operation', value: operation});

            if (bRecord) {
                operations.push(operation);
            }

            if (operation.name === "initDocument") {
                this.implInitDocument();
            }
            else if (operation.name === OP_TEXT_INSERT) {
                if (undomgr.isEnabled() && !undomgr.isInUndo()) {
                    var endPos = _.clone(operation.start, true);
                    endPos[endPos.length - 1] += operation.text.length;
                    var undoOperation = { name: OP_TEXT_DELETE, start: _.copy(operation.start, true), end: endPos };
                    var undoAction = new OXOUndoAction(undoOperation, _.copy(operation, true));
                    if (operation.text.length === 1)
                        undoAction.allowMerge = true;
                    undomgr.addUndo(undoAction);
                }
                this.implInsertText(operation.text, operation.start);
            }
            else if (operation.name === OP_TEXT_DELETE) {
                if (undomgr.isEnabled() && !undomgr.isInUndo()) {
                    var undoOperation = { name: OP_TEXT_INSERT, start: _.copy(operation.start, true), text: this.getParagraphText(operation.start[0], operation.start[1], operation.end[1]) };
                    undomgr.addUndo(new OXOUndoAction(undoOperation, operation));
                }
                this.implDeleteText(operation.start, operation.end);
            }
            else if (operation.name === OP_ATTR_SET) {
                if (undomgr.isEnabled() && !undomgr.isInUndo() && _.isBoolean(operation.value)) {
                    // TODO: non-boolean attributes
                    // Hack - this is not the correct Undo - but the attr toggle from the browser will have the effect we want to see ;)
                    var undoOperation = {name: OP_ATTR_SET, attr: operation.attr, value: !operation.value, start: _.copy(operation.start, true), end: _.copy(operation.end, true)};
                    undomgr.addUndo(new OXOUndoAction(undoOperation, operation));
                }
                implSetAttributes(operation.start, operation.end, Utils.makeSimpleObject(operation.attr, operation.value));
            }
            else if (operation.name === OP_ATTRS_SET) {
                if (undomgr.isEnabled() && !undomgr.isInUndo()) {
                    // TODO!!!
                    // var undoOperation = {name: OP_ATTR_SET, attr: operation.attr, value: !operation.value, start: _.copy(operation.start, true), end: _.copy(operation.end, true)};
                    // undomgr.addUndo(new OXOUndoAction(undoOperation, operation));
                }
                implSetAttributes(operation.start, operation.end, operation.attrs);
            }
            else if (operation.name === OP_PARA_INSERT) {
                if (undomgr.isEnabled() && !undomgr.isInUndo()) {
                    var undoOperation = { name: OP_PARA_DELETE, start: _.copy(operation.start, true) };
                    undomgr.addUndo(new OXOUndoAction(undoOperation, operation));
                }
                this.implInsertParagraph(operation.start);
                if (operation.text) {
                    var startPos = _.copy(operation.start, true);
                    startPos.push(0);
                    this.implInsertText(operation.text, startPos);
                }
            }
            else if (operation.name === OP_PARA_DELETE) {
                if (undomgr.isEnabled() && !undomgr.isInUndo()) {
                    var undoOperation = { name: OP_PARA_INSERT, start: _.copy(operation.start, true), text: this.getParagraphText(operation.start[0]) }; // HACK: Text is not part of the official operation, but I need it for Undo. Can be changed once we can have multiple undos for one operation.
                    undomgr.addUndo(new OXOUndoAction(undoOperation, operation));

                }
                this.implDeleteParagraph(operation.start);
            }
            else if (operation.name === OP_TABLE_INSERT) {
                if (undomgr.isEnabled() && !undomgr.isInUndo()) {
                    var undoOperation = { name: OP_TABLE_DELETE, start: _.copy(operation.start, true) };
                    undomgr.addUndo(new OXOUndoAction(undoOperation, operation));
                }
                this.implInsertTable(operation.start, operation.rows, operation.columns);
            }
            else if (operation.name === OP_TABLE_DELETE) {
                if (undomgr.isEnabled() && !undomgr.isInUndo()) {
                    var undoOperation = { name: OP_TABLE_INSERT, start: _.copy(operation.start, true) };
                    undomgr.addUndo(new OXOUndoAction(undoOperation, operation));
                }
                this.implDeleteTable(operation.start);
            }
            else if (operation.name === OP_CELLRANGE_DELETE) {
                this.implDeleteCellRange(operation.position, operation.start, operation.end);
            }
            else if (operation.name === OP_ROWS_DELETE) {
                this.implDeleteRows(operation.position, operation.start, operation.end);
            }
            else if (operation.name === OP_COLUMNS_DELETE) {
                this.implDeleteColumns(operation.position, operation.start, operation.end);
            }
            else if (operation.name === OP_ROW_COPY) {
                this.implCopyRow(operation.position, operation.start, operation.end);
            }
            else if (operation.name === OP_COLUMN_COPY) {
                this.implCopyColumn(operation.position, operation.start, operation.end);
            }
            else if (operation.name === OP_PARA_SPLIT) {
                if (undomgr.isEnabled() && !undomgr.isInUndo()) {
                    var undoOperation = { name: OP_PARA_MERGE, start: _.copy(operation.start, true) };
                    undomgr.addUndo(new OXOUndoAction(undoOperation, operation));
                }
                this.implSplitParagraph(operation.start);
            }
            else if (operation.name === OP_IMAGE_INSERT) {
                // TODO..  now only "*" placeholders are created for images
                if (undomgr.isEnabled() && !undomgr.isInUndo()) {
                    var endPos = _.clone(operation.position, true);
                    endPos[endPos.length - 1] += 1;
                    var undoOperation = { name: OP_TEXT_DELETE, start: _.copy(operation.postition, true), end: endPos };
                    var undoAction = new OXOUndoAction(undoOperation, _.copy(operation, true));
                    undoAction.allowMerge = true;
                    undomgr.addUndo(undoAction);
                }
                var imgurl = operation.imgurl;
                if (imgurl.indexOf("://") === -1)
                    imgurl = currentDocumentURL + '&fragment=' + operation.imgurl;
                // TODO: Remove this ugly fix for Windows servers asap
                imgurl = imgurl.replace(/\\/g, "/");  // problem of Windows servers
                imgurl = imgurl.replace(/fragment=\//g, "fragment=");  // problem of Windows servers
                this.implInsertImage(imgurl, operation.position, operation.attrs);
            }
            else if (operation.name === OP_PARA_MERGE) {
                if (undomgr.isEnabled() && !undomgr.isInUndo()) {
                    var sel = _.copy(operation.start);
                    var paraLen = 0;
                    Position.getParagraphLength(paragraphs, sel);
                    sel.push(paraLen);
                    var undoOperation = { name: OP_PARA_SPLIT, start: sel };
                    undomgr.addUndo(new OXOUndoAction(undoOperation, operation));
                }
                this.implMergeParagraph(operation.start);
            }
            else if (operation.name === "xxxxxxxxxxxxxx") {
                // TODO
                if (undomgr.isEnabled() && !undomgr.isInUndo()) {
                }
            }

            if (bNotify && !blockOperationNotifications) {
                // Will give everybody the same copy - how to give everybody his own copy?
                this.trigger("operation", notifyOperation);
            }

            blockOperations = false;

            // DEBUG STUFF
            if (this.getParagraphCount() !== editdiv.children().size()) {
                Utils.warn('Editor.applyOperation(): paragraph count invalid!');
            }
        };

        this.applyOperations = function (theOperations, bRecord, notify) {

            if (_(theOperations).isArray()) {
                _(theOperations).each(function (operation) {
                    this.applyOperation(operation, bRecord, notify);
                }, this);
            }
        };

        this.getOperations = function () {
            return operations;
        };

        // GUI/EDITOR API

        /**
         * Returns true, if the passed keyboard event is a navigation event (cursor
         * traveling etc.) and will be passed directly to the browser.
         *
         * @param event
         *  A jQuery keyboard event object.
         */
        this.isNavigationKeyEvent = function (event) {
            return event && NAVIGATION_KEYS.contains(event.keyCode);
        };

        this.getPrintableChar = function (event) {
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
        };

        this.getDOMSelection = function (oxoSelection) {

            // Only supporting single selection at the moment
            var start = Position.getDOMPosition(paragraphs, oxoSelection.startPaM.oxoPosition),
                end = Position.getDOMPosition(paragraphs, oxoSelection.endPaM.oxoPosition);

            // DOM selection is always an array of text ranges
            // TODO: fallback to HOME position in document instead of empty array?
            return (start && end) ? [new DOM.Range(start, end)] : [];
        };

        this.getCellDOMSelections = function (oxoSelection) {

            var ranges = [];

            var startPos = _.copy(oxoSelection.startPaM.oxoPosition, true),
                endPos = _.copy(oxoSelection.endPaM.oxoPosition, true);

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
                    var cell = Position.getDOMPosition(paragraphs, position);
                    if (cell && $(cell.node).is('td, th')) {
                        ranges.push(DOM.Range.createRangeForNode(cell.node));
                    }
                }
            }

            return ranges;
        };

        this.initDocument = function () {
            var newOperation = { name: 'initDocument' };
            this.applyOperation(newOperation, true, true);
        };

        this.setDocumentURL = function (url) {
            currentDocumentURL = url;
        };

        this.getSelection = function (updateFromBrowser) {

            if (currentSelection && !updateFromBrowser)
                return currentSelection;

            var domSelection = DOM.getBrowserSelection(editdiv),
                domRange = null;

            if (domSelection.length) {

                // for (var i = 0; i < domSelection.length; i++) {
                //     window.console.log("Browser selection (" + i + "): " + domSelection[i].start.node.nodeName + " : " + domSelection[i].start.offset + " to " + domSelection[i].end.node.nodeName + " : " + domSelection[i].end.offset);
                // }

                domRange = _(domSelection).last();

                // allowing "special" multiselection for tables (rectangle cell selection)
                if (domRange.start.node.nodeName === 'TR') {
                    domRange.start = _(domSelection).first().start;
                }

                var isPos1Endpoint = false,
                    isPos2Endpoint = true;

                if ((domRange.start.node === domRange.end.node) && (domRange.start.offset === domRange.end.offset)) {
                    isPos2Endpoint = false;
                }

                currentSelection = new OXOSelection(Position.getOXOPosition(domRange.start, editdiv, isPos1Endpoint), Position.getOXOPosition(domRange.end, editdiv, isPos2Endpoint));

                // window.console.log("Calculated Oxo Position: " + currentSelection.startPaM.oxoPosition + " : " + currentSelection.endPaM.oxoPosition);

                // Keeping selections synchron. Without setting selection now, there are cursor travel problems in Firefox.
                this.setSelection(currentSelection);

                return  _.copy(currentSelection, true);
            }
        };

        this.setSelection = function (oxosel) {

            var ranges = [];

            currentSelection = _.copy(oxosel, true);

            // Multi selection for rectangle cell selection in Firefox.
            if (oxosel.hasRange() && (Position.isCellSelection(oxosel.startPaM, oxosel.endPaM))) {
                ranges = this.getCellDOMSelections(oxosel);
            } else {
                // var oldSelection = this.getSelection();
                ranges = this.getDOMSelection(oxosel);
            }

            if (ranges.length) {
                DOM.setBrowserSelection(ranges);
                // if (TODO: Compare Arrays oldSelection, oxosel)
                this.trigger('selectionChanged');   // when setSelection() is called, it's very likely that the selection actually did change. If it didn't - that normally shouldn't matter.
            } else {
                Utils.error('Editor.setSelection(): Failed to determine DOM Selection from OXO Selection: ' + oxosel.startPaM.oxoPosition + ' : ' + oxosel.endPaM.oxoPosition);
            }
        };

        this.clearUndo = function () {
            undomgr.clear();
        };

        this.enableUndo = function (enable) {
            undomgr.enable(enable);
        };

        this.undo = function () {
            undomgr.undo(this);
            this.setSelection(new OXOSelection(lastOperationEnd));
        };

        this.redo = function () {
            undomgr.redo(this);
            this.setSelection(new OXOSelection(lastOperationEnd));
        };

        this.hasUndo = function () {
            return undomgr.hasUndo();
        };

        this.hasRedo = function () {
            return undomgr.hasRedo();
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
                characterStyles.setRangeAttributes(highlightRanges, { highlight: false }, { special: true });
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
            Utils.iterateSelectedDescendantNodes(editdiv, 'p', function (node) {

                var // the concatenated text from all text nodes
                    elementText = $(node).text().replace(/\s/g, ' ').toLowerCase(),
                    // all matching ranges of the query text in the element text
                    offsetRanges = [], offset = 0, index = 0;

                // find all occurences of the query text in the element
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

                    // convert as many offset ranges as contained by the current text node
                    for (var offsetRange; index < offsetRanges.length; index += 1) {
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
            characterStyles.setRangeAttributes(highlightRanges, { highlight: true }, { special: true });

            // make first highlighted text node visible
            DOM.iterateTextPortionsInRanges(highlightRanges, function (textNode) {
                Utils.scrollToChildNode(editdiv.parent(), textNode.parentNode, { padding: 30 });
                return Utils.BREAK;
            }, this);

            // return whether any text in the document matches the passed query text
            return this.hasHighlighting();
        };

        this.processFocus = function (state) {
            Utils.info('Editor: received focus event: mode=' + textMode + ', state=' + state);
            if (focused !== state) {
                focused = state;
                if (focused && currentSelection) {
                    // Update Browser Selection, might got lost.
                    this.setSelection(currentSelection);
                }
                this.trigger('focus', state);
            }
        };

        this.processMouseDown = function (event) {
            this.implCheckEventSelection(); // just in case the user was faster than the timer...
            lastEventSelection = this.getSelection();
            this.implStartCheckEventSelection();
        };

        this.processMouseUp = function (event) {
            this.implCheckEventSelection();
            lastEventSelection = this.getSelection();
            this.implStartCheckEventSelection();
        };

        this.implStartCheckEventSelection = function () {
            // I Don't think we need some way to stop the timer, as the user won't be able to close this window "immediatly" after a mouse click or key press...
            window.setTimeout(function () { self.implCheckEventSelection(); }, 10);
        };

        this.implCheckEventSelection = function () {
            currentSelection = this.getSelection(true);
            if (!currentSelection || !lastEventSelection || !currentSelection.isEqual(lastEventSelection)) {
                lastEventSelection = currentSelection;
                if (currentSelection) {
                    this.trigger('selectionChanged');
                } else if (focused) {
                    // If not focused, browser selection might not be available...
                    Utils.warn('Editor.implCheckEventSelection(): missing selection!');
                }
            }
        };

        this.processDragOver = function (event) {
            event.preventDefault();
        };

        this.processDrop = function (event) {
            event.preventDefault();
        };

        this.processContextMenu = function (event) {
            event.preventDefault();
        };


        this.processKeyDown = function (event) {

            implDbgOutEvent(event);
            // this.implCheckSelection();

            this.implCheckEventSelection();

            // TODO: How to strip away debug code?
            if (event.keyCode && event.shiftKey && event.ctrlKey && event.altKey) {
                var c = this.getPrintableChar(event);
                if (c === 'P') {
                    alert('#Paragraphs: ' + paragraphs.length);
                }
                else if (c === 'I') {
                    this.insertParagraph([paragraphs.length]);
                }
                else if (c === 'D') {
                    this.initDocument();
                    this.grabFocus(true);
                }
                else if (c === 'T') {
                    this.insertTable({width: 2, height: 2});
                }
                else if (c === 'G') {
                    var selection = this.getSelection();
                    var newOperation = {name: OP_IMAGE_INSERT, position: _.copy(selection.startPaM.oxoPosition), imgurl: "Pictures/10000000000000500000005076371D39.jpg"};
                    this.applyOperation(newOperation, true, true);
                }
                else if (c === 'R') {
                    var selection = this.getSelection();
                    var newOperation = {name: OP_IMAGE_INSERT, position: _.copy(selection.startPaM.oxoPosition), imgurl: "Pictures/10000000000000500000005076371D39.jpg", attrs: {anchortype: 'ToParagraph', top: '50px', left: '100px'}};
                    this.applyOperation(newOperation, true, true);
                }
                else if (c === 'S') {
                    var selection = this.getSelection();
                    var newOperation = {name: OP_IMAGE_INSERT, position: _.copy(selection.startPaM.oxoPosition), imgurl: "Pictures/10000000000000500000005076371D39.jpg", attrs: {anchortype: 'ToCharacter', top: '50px', left: '100px'}};
                    this.applyOperation(newOperation, true, true);
                }
                else if (c === 'V') {
                    var selection = this.getSelection();
                    var newOperation = {name: OP_IMAGE_INSERT, position: _.copy(selection.startPaM.oxoPosition), imgurl: "Pictures/10000000000000500000005076371D39.jpg", attrs: {anchortype: 'ToPage', top: '50px', left: '100px'}};
                    this.applyOperation(newOperation, true, true);
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

            var selection = this.getSelection();

            lastEventSelection = _.copy(selection, true);
            lastKeyDownEvent = event;   // For some keys we only get keyDown, not keyPressed!
            this.implStartCheckEventSelection();

            if (event.keyCode === KeyCodes.DELETE) {
                selection.adjust();
                if (selection.hasRange()) {
                    this.deleteSelected(selection);
                }
                else {
                    var lastValue = selection.startPaM.oxoPosition.length - 1;
                    var startPosition = selection.startPaM.oxoPosition;
                    var paraLen = Position.getParagraphLength(paragraphs, startPosition);

                    if (startPosition[lastValue] < paraLen) {
                        selection.endPaM.oxoPosition[lastValue]++;
                        this.deleteText(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition);
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
                            if (domPos.node.nodeName === 'TABLE') {
                                nextIsTable = true;
                            }
                        } else {
                            nextParagraphPosition[lastValue] -= 1;
                            isLastParagraph = true;
                        }

                        this.mergeParagraph(mergeselection);

                        if (nextIsTable) {
                            if (characterPos === 0) {
                                // removing empty paragraph
                                var localPos = _.copy(selection.startPaM.oxoPosition, true);
                                localPos.pop();
                                this.deleteParagraph(localPos);
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
                selection.endPaM = _.copy(selection.startPaM, true);
                event.preventDefault();
                this.setSelection(selection);
            }
            else if (event.keyCode === KeyCodes.BACKSPACE) {
                selection.adjust();
                if (selection.hasRange()) {
                    this.deleteSelected(selection);
                }
                else {
                    var lastValue = selection.startPaM.oxoPosition.length - 1;
                    if (selection.startPaM.oxoPosition[lastValue] > 0) {
                        var startPosition = _.copy(selection.startPaM.oxoPosition, true);
                        var endPosition = _.copy(selection.startPaM.oxoPosition, true);
                        startPosition[lastValue] -= 1;
                        this.deleteText(startPosition, endPosition);
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
                                if (Position.getDOMPosition(paragraphs, startPosition).node.nodeName === 'TABLE') {
                                    prevIsTable = true;
                                }
                            }

                            if (startPosition[lastValue - 1] >= 0) {
                                if (! prevIsTable) {
                                    this.mergeParagraph(startPosition);
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
                selection.endPaM = _.copy(selection.startPaM, true);
                event.preventDefault();
                this.setSelection(selection);
            }
            else if (event.ctrlKey) {
                var c = this.getPrintableChar(event);
                if (c === 'A') {
                    var startPaM = new OXOPaM([0]),
                        endPaM = new OXOPaM(Position.getLastPositionInDocument(paragraphs));

                    selection = new OXOSelection(startPaM, endPaM);

                    event.preventDefault();

                    this.setSelection(selection);
                }
                else if (c === 'Z') {
                    event.preventDefault();
                    this.undo();
                }
                else if (c === 'Y') {
                    event.preventDefault();
                    this.redo();
                }
                else if (c === 'X') {
                    event.preventDefault();
                    this.cut();
                }
                else if (c === 'C') {
                    event.preventDefault();
                    this.copy();
                }
                else if (c === 'V') {
                    event.preventDefault();
                    this.paste();
                }
                else if (c === 'B') {
                    event.preventDefault();
                    this.setCharacterAttribute('bold', !this.getCharacterAttributes().bold);
                }
                else if (c === 'I') {
                    event.preventDefault();
                    this.setCharacterAttribute('italic', !this.getCharacterAttributes().italic);
                }
                else if (c === 'U') {
                    event.preventDefault();
                    this.setCharacterAttribute('underline', !this.getCharacterAttributes().underline);
                }
                else if (c === 'xxxxxxx') {
                    event.preventDefault();
                }
            }
            // DEBUG STUFF
            if (this.getParagraphCount() !== editdiv.children().size()) {
                Utils.warn('Editor.processKeyDown(): paragraph count invalid!');
            }
        };

        this.processKeyPressed = function (event) {

            implDbgOutEvent(event);

            var selection = this.getSelection();

            this.implCheckEventSelection();
            lastEventSelection = _.copy(selection, true);
            this.implStartCheckEventSelection();

            if (this.isNavigationKeyEvent(lastKeyDownEvent)) {
                // Don't block cursor navigation keys.
                // Use lastKeyDownEvent, because some browsers (eg Chrome) change keyCode to become the charCode in keyPressed
                return;
            }


            selection.adjust();

            /*
            Utils.log('processKeyPressed: keyCode: ' + event.keyCode + ' isNavi: ' + this.isNavigationKeyEvent(event));
            if (this.isNavigationKeyEvent(event)) {
                return;
            }
            */

            var c = this.getPrintableChar(event);

            // TODO
            // For now (the prototype), only accept single chars, but let the browser process, so we don't need to care about DOM stuff
            // TODO: But we at least need to check if there is a selection!!!

            if ((!event.ctrlKey) && (c.length === 1)) {

                this.deleteSelected(selection);
                // Selection was adjusted, so we need to use start, not end
                this.insertText(c, selection.startPaM.oxoPosition);
                var lastValue = selection.startPaM.oxoPosition.length - 1;
                selection.startPaM.oxoPosition[lastValue]++;
                selection.endPaM = _.copy(selection.startPaM, true);
                event.preventDefault();
                this.setSelection(selection);
            }
            else if (c.length > 1) {
                // TODO?
                event.preventDefault();
            }
            else {

                if (event.keyCode === KeyCodes.ENTER) {

                    this.deleteSelected(selection);
                    var startPosition = _.copy(selection.startPaM.oxoPosition, true),
                        lastValue = selection.startPaM.oxoPosition.length - 1;

                    if ((lastValue >= 4) &&
                        (Position.isPositionInTable(paragraphs, [0])) &&
                        _(startPosition).all(function (value) { return (value === 0); })) {
                        this.insertParagraph([0]);
                        paragraphs = editdiv.children();
                        selection.startPaM.oxoPosition = [0, 0];
                    } else {
                        this.splitParagraph(startPosition);
                        // TODO / TBD: Should all API / Operation calls return the new position?!
                        var lastValue = selection.startPaM.oxoPosition.length - 1;
                        selection.startPaM.oxoPosition[lastValue - 1] += 1;
                        selection.startPaM.oxoPosition[lastValue] = 0;
                    }
                    selection.endPaM = _.copy(selection.startPaM, true);
                    event.preventDefault();
                    this.setSelection(selection);
                }
            }

            // Block everything else to be on the save side....
            event.preventDefault();

            // DEBUG STUFF
            if (this.getParagraphCount() !== editdiv.children().size()) {
                Utils.warn('Editor.processKeyPressed(): paragraph count invalid!');
            }

        };

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

        // HIGH LEVEL EDITOR API which finally results in Operations and creates Undo Actions

        this.deleteSelected = function (_selection) {

            // this.implCheckSelection();
            var selection = _selection || this.getSelection();
            if (selection.hasRange()) {

                undomgr.startGroup();

                selection.adjust();

                if (Position.isSameParagraph(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {
                    // Only one paragraph concerned from deletion.
                    this.deleteText(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition);

                } else if (Position.isSameParagraphLevel(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {

                    // The included paragraphs are neighbours.
                    var endPosition = _.copy(selection.startPaM.oxoPosition, true),
                        startposLength = selection.startPaM.oxoPosition.length - 1,
                        endposLength = selection.endPaM.oxoPosition.length - 1;

                    // 1) delete selected part or rest of para in first para (pos to end)
                    endPosition[endposLength] = Position.getParagraphLength(paragraphs, endPosition);
                    this.deleteText(selection.startPaM.oxoPosition, endPosition);

                    // 2) delete completly selected paragraphs completely
                    for (var i = selection.startPaM.oxoPosition[startposLength - 1] + 1; i < selection.endPaM.oxoPosition[endposLength - 1]; i++) {
                        var startPosition = _.copy(selection.startPaM.oxoPosition, true);
                        startPosition[startposLength - 1] = selection.startPaM.oxoPosition[startposLength - 1] + 1;

                        // Is the new dom position a table or a paragraph or whatever? Special handling for tables required
                        startPosition.pop();
                        var isTable = Position.getDOMPosition(paragraphs, startPosition).node.nodeName === 'TABLE' ? true : false;

                        if (isTable) {
                            this.deleteTable(startPosition);
                        } else {
                            this.deleteParagraph(startPosition);
                        }
                    }

                    // 3) delete selected part in last para (start to pos) and merge first and last para
                    if (selection.startPaM.oxoPosition[startposLength - 1] !== selection.endPaM.oxoPosition[endposLength - 1]) {
                        var startPosition = _.copy(selection.endPaM.oxoPosition, true);
                        startPosition[endposLength - 1] = selection.startPaM.oxoPosition[startposLength - 1] + 1;
                        startPosition[endposLength] = 0;
                        endPosition = _.copy(startPosition, true);
                        endPosition[startposLength] = selection.endPaM.oxoPosition[endposLength];
                        this.deleteText(startPosition, endPosition);

                        var mergeselection = _.copy(selection.startPaM.oxoPosition);
                        mergeselection.pop();
                        this.mergeParagraph(mergeselection);
                    }

                } else if (Position.isCellSelection(selection.startPaM, selection.endPaM)) {
                    // This cell selection is a rectangle selection of cells in a table (only supported in Firefox).
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

                    this.deleteCellRange(startPos, [startRow, startCol], [endRow, endCol]);

                } else if (Position.isSameTableLevel(paragraphs, selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {
                    // This selection is inside a table in a browser, where no cell selection is possible (Chrome). Selected
                    // can be parts of paragraphs inside a cell and also all paragraphs in other cells. This selection is
                    // important to be able to support something similar like cell selection, that is only possible
                    // in Firefox. So changes made in Firefox tables are displayed correctly in Chrome and vice versa.
                    var startPos = _.copy(selection.startPaM.oxoPosition, true),
                        endPos = _.copy(selection.endPaM.oxoPosition, true),
                        startposLength = selection.startPaM.oxoPosition.length - 1;

                    // 1) delete selected part or rest of para in first para (pos to end)
                    var localEndPosition = _.copy(selection.startPaM.oxoPosition, true);
                    localEndPosition[startposLength] = Position.getParagraphLength(paragraphs, localEndPosition);
                    this.deleteText(selection.startPaM.oxoPosition, localEndPosition);
                    localEndPosition.pop();
                    this.deleteFollowingParagraphsInCell(localEndPosition);

                    // 2) completely selected cells
                    var rowIndex = Position.getLastIndexInPositionByNodeName(paragraphs, startPos, 'TR'),
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
                            this.deleteAllParagraphsInCell(startPos);
                        }
                    }

                    var startPosition = _.copy(selection.endPaM.oxoPosition, true),
                        endposLength = selection.endPaM.oxoPosition.length - 1;

                    startPosition[endposLength] = 0;
                    localEndPosition = _.copy(startPosition, true);
                    localEndPosition[endposLength] = selection.endPaM.oxoPosition[endposLength];

                    this.deleteText(startPosition, localEndPosition);

                    // delete all previous paragraphs in this cell!
                    localEndPosition.pop();
                    this.deletePreviousParagraphsInCell(localEndPosition);

                } else {

                    // The included paragraphs are not neighbours. For example one paragraph top level and one in table.
                    // Should this be supported? How about tables in tables?
                    // This probably works not reliable for tables in tables.

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
                            this.deleteFollowingParagraphsInCell(localEndPosition);
                            localEndPosition.pop();
                            this.deleteFollowingCellsInTable(localEndPosition);
                        }
                        endPosition[startposLength] = Position.getParagraphLength(paragraphs, endPosition);
                    }
                    this.deleteText(selection.startPaM.oxoPosition, endPosition);

                    // 2) delete completly slected paragraphs completely
                    for (var i = selection.startPaM.oxoPosition[0] + 1; i < selection.endPaM.oxoPosition[0]; i++) {
                        // startPaM.oxoPosition[0]+1 instead of i, because we always remove a paragraph
                        var startPosition = [];
                        startPosition[0] = selection.startPaM.oxoPosition[0] + 1;
                        isTable = Position.isPositionInTable(paragraphs, startPosition);
                        if (isTable) {
                            this.deleteTable(startPosition);
                        } else {
                            this.deleteParagraph(startPosition);
                        }
                    }

                    // 3) delete selected part in last para (start to pos) and merge first and last para
                    if (selection.startPaM.oxoPosition[startposLength - 1] !== selection.endPaM.oxoPosition[endposLength - 1]) {

                        var startPosition = _.copy(selection.endPaM.oxoPosition, true);
                        startPosition[0] = selection.startPaM.oxoPosition[0] + 1;
                        startPosition[endposLength] = 0;
                        endPosition = _.copy(startPosition, true);
                        endPosition[endposLength] = selection.endPaM.oxoPosition[endposLength];

                        isTable = Position.isPositionInTable(paragraphs, endPosition);

                        this.deleteText(startPosition, endPosition);

                        if (isTable) {
                            // delete all previous cells and all previous paragraphs in this cell!
                            endPosition.pop();
                            this.deletePreviousParagraphsInCell(endPosition);
                            endPosition.pop();
                            this.deletePreviousCellsInTable(endPosition);
                        }

                        if (! isTable) {
                            var mergeselection = _.copy(selection.startPaM.oxoPosition);
                            mergeselection.pop();
                            this.mergeParagraph(mergeselection);
                        }
                    }
                }

                undomgr.endGroup();
            }
        };

        this.deleteText = function (startposition, endposition) {
            if (startposition !== endposition) {
                var newOperation = { name: OP_TEXT_DELETE, start: startposition, end: endposition };
                this.applyOperation(newOperation, true, true);
            }
        };

        this.deleteParagraph = function (position) {
            var newOperation = { name: OP_PARA_DELETE, start: _.copy(position, true) };
            this.applyOperation(newOperation, true, true);
        };

        this.deleteTable = function (position) {
            var newOperation = { name: OP_TABLE_DELETE, start: _.copy(position, true) };
            this.applyOperation(newOperation, true, true);
        };

        this.deleteCellRange = function (position, start, end) {
            var newOperation = { name: OP_CELLRANGE_DELETE, position: _.copy(position, true), start: _.copy(start, true), end: _.copy(end, true) };
            this.applyOperation(newOperation, true, true);
        };

        this.deleteRows = function () {
            var selection = this.getSelection(),
                start = Position.getRowIndexInTable(paragraphs, selection.startPaM.oxoPosition),
                end = start,
                position = _.copy(selection.startPaM.oxoPosition, true);

            if (selection.hasRange()) {
                end = Position.getRowIndexInTable(paragraphs, selection.endPaM.oxoPosition);
            }

            var tablePos = Position.getLastPositionFromPositionByNodeName(paragraphs, position, 'TABLE'),
                lastRow = Position.getLastRowIndexInTable(paragraphs, position),
                isCompleteTable = ((start === 0) && (end === lastRow)) ? true : false,
                newOperation;

            if (isCompleteTable) {
                newOperation = { name: OP_TABLE_DELETE, start: _.copy(tablePos, true) };
            } else {
                newOperation = { name: OP_ROWS_DELETE, position: tablePos, start: start, end: end };
            }

            this.applyOperation(newOperation, true, true);
        };

        this.deleteColumns = function () {
            var selection = this.getSelection(),
                start = Position.getColumnIndexInRow(paragraphs, selection.startPaM.oxoPosition),
                end = start,
                position = _.copy(selection.startPaM.oxoPosition, true);

            if (selection.hasRange()) {
                end = Position.getColumnIndexInRow(paragraphs, selection.endPaM.oxoPosition);
            }

            var tablePos = Position.getLastPositionFromPositionByNodeName(paragraphs, position, 'TABLE'),
                lastColumn = Position.getLastColumnIndexInTable(paragraphs, position),
                isCompleteTable = ((start === 0) && (end === lastColumn)) ? true : false,
                newOperation;

            if (isCompleteTable) {
                newOperation = { name: OP_TABLE_DELETE, start: _.copy(tablePos, true) };
            } else {
                newOperation = { name: OP_COLUMNS_DELETE, position: tablePos, start: start, end: end };
            }

            this.applyOperation(newOperation, true, true);
        };

        this.copyRow = function () {
            var selection = this.getSelection(),
                start = Position.getRowIndexInTable(paragraphs, selection.endPaM.oxoPosition),
                end = start + 1,
                position = _.copy(selection.endPaM.oxoPosition, true);

            var tablePos = Position.getLastPositionFromPositionByNodeName(paragraphs, position, 'TABLE');

            var newOperation = { name: OP_ROW_COPY, position: tablePos, start: start, end: end };
            this.applyOperation(newOperation, true, true);
        };

        this.copyColumn = function () {
            var selection = this.getSelection(),
                start = Position.getColumnIndexInRow(paragraphs, selection.endPaM.oxoPosition),
                end = start + 1,
                position = _.copy(selection.endPaM.oxoPosition, true);

            var tablePos = Position.getLastPositionFromPositionByNodeName(paragraphs, position, 'TABLE');

            var newOperation = { name: OP_COLUMN_COPY, position: tablePos, start: start, end: end };
            this.applyOperation(newOperation, true, true);
        };

        this.insertParagraph = function (position) {
            var newOperation = {name: OP_PARA_INSERT, start: _.copy(position, true)};
            this.applyOperation(newOperation, true, true);
        };

        this.insertTable = function (size) {
            if (size) {
                var selection = this.getSelection();
                selection.adjust();
                if (selection.hasRange()) {
                    this.deleteSelected(selection);
                }

                // Splitting paragraph, if the cursor is not at the beginning of the paragraph.
                if (selection.startPaM.oxoPosition[selection.startPaM.oxoPosition.length - 1] !== 0) {
                    this.splitParagraph(selection.startPaM.oxoPosition);
                    selection.startPaM.oxoPosition[selection.startPaM.oxoPosition.length - 2] += 1;
                }

                selection.startPaM.oxoPosition.pop();
                paragraphs = editdiv.children();

                var newOperation = {name: OP_TABLE_INSERT, start: _.copy(selection.startPaM.oxoPosition, true), columns: size.width, rows: size.height};
                this.applyOperation(newOperation, true, true);
            }
        };

        this.splitParagraph = function (position) {
            var newOperation = {name: OP_PARA_SPLIT, start: _.copy(position, true)};
            this.applyOperation(newOperation, true, true);
        };

        this.mergeParagraph = function (position) {
            var newOperation = {name: OP_PARA_MERGE, start: _.copy(position)};
            this.applyOperation(newOperation, true, true);
        };

        this.insertText = function (text, position) {
            var newOperation = { name: OP_TEXT_INSERT, text: text, start: _.copy(position, true) };
            this.applyOperation(newOperation, true, true);
        };

        // character attributes -----------------------------------------------

        /**
         * Returns the character style sheet container.
         */
        this.getCharacterStyles = function () {
            return characterStyles;
        };

        /**
         * Returns the values of all character formatting attributes in the
         * current selection.
         *
         * @returns {Object}
         *  A map of character attribute name/value pairs.
         */
        this.getCharacterAttributes = function () {
            var ranges = DOM.getBrowserSelection(editdiv);
            return characterStyles.getRangeAttributes(ranges);
        };

        /**
         * Changes a single character attribute in the current selection.
         */
        this.setCharacterAttribute = function (name, value) {
            this.setCharacterAttributes(Utils.makeSimpleObject(name, value));
        };

        /**
         * Changes a multiple character attribute in the current selection.
         */
        this.setCharacterAttributes = function (attributes) {
            // !! TODO !! create operation(s), similar to old setAttributes()
            var ranges = currentSelection ? this.getDOMSelection(currentSelection) : DOM.getBrowserSelection(editdiv);
            characterStyles.setRangeAttributes(ranges, attributes);
        };

        // paragraph attributes -----------------------------------------------

        /**
         * Returns the paragraph style sheet container.
         */
        this.getParagraphStyles = function () {
            return paragraphStyles;
        };

        /**
         * Returns the values of all paragraph formatting attributes in the
         * current selection.
         *
         * @returns {Object}
         *  A map of paragraph attribute name/value pairs.
         */
        this.getParagraphAttributes = function () {
            var ranges = DOM.getBrowserSelection(editdiv);
            return paragraphStyles.getRangeAttributes(ranges);
        };

        /**
         * Changes a single paragraph attribute in the current selection.
         */
        this.setParagraphAttribute = function (name, value) {
            this.setParagraphAttributes(Utils.makeSimpleObject(name, value));
        };

        /**
         * Changes a multiple paragraph attribute in the current selection.
         */
        this.setParagraphAttributes = function (attributes) {
            // !! TODO !! create operation(s), similar to old setAttributes()
            var ranges = currentSelection ? this.getDOMSelection(currentSelection) : DOM.getBrowserSelection(editdiv);
            paragraphStyles.setRangeAttributes(ranges, attributes);
        };


        // DEPRECATED
        this.setAttributes = function (attributes, startPosition, endPosition) {

            var para,
                start,
                end;

            if ((startPosition !== undefined) && (endPosition !== undefined)) {
                var startposLength = startPosition.length - 1,
                    endposLength = endPosition.length - 1;
                para = startPosition[startposLength - 1];
                start = startPosition[startposLength];
                end = endPosition[endposLength];
            }

            // TODO
            if (para === undefined) {
                // Set attr to current selection
                var selection = this.getSelection();
                if (selection.hasRange()) {

                    selection.adjust();

                    if (Position.isSameParagraph(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {
                        // Only one paragraph concerned from attribute changes.
                        this.setAttributes(attributes, selection.startPaM.oxoPosition, selection.endPaM.oxoPosition);

                    } else if (Position.isSameParagraphLevel(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {
                        // The included paragraphs are neighbours.

                        // 1) selected part or rest of para in first para (pos to end)
                        var startposLength = selection.startPaM.oxoPosition.length - 1,
                            endposLength = selection.endPaM.oxoPosition.length - 1,
                            localendPosition = _.copy(selection.startPaM.oxoPosition, true);

                        localendPosition[startposLength] = Position.getParagraphLength(paragraphs, localendPosition);
                        this.setAttributes(attributes, selection.startPaM.oxoPosition, localendPosition);

                        // 2) completly selected paragraphs
                        for (var i = selection.startPaM.oxoPosition[startposLength - 1] + 1; i < selection.endPaM.oxoPosition[endposLength - 1]; i++) {
                            var localstartPosition = _.copy(selection.startPaM.oxoPosition, true);
                            localstartPosition[startposLength - 1] = i;
                            localstartPosition[startposLength] = 0;

                            // Is the new dom position a table or a paragraph or whatever? Special handling for tables required
                            // Removing position temporarely
                            var pos = localstartPosition.pop();
                            var isTable = Position.getDOMPosition(paragraphs, localstartPosition).node.nodeName === 'TABLE' ? true : false;

                            if (isTable) {
                                this.setAttributesToCompleteTable(attributes, localstartPosition);
                            } else {
                                localstartPosition.push(pos);
                                localendPosition = _.copy(localstartPosition, true);
                                localendPosition[startposLength] = Position.getParagraphLength(paragraphs, localendPosition);
                                this.setAttributes(attributes, localstartPosition, localendPosition);
                            }
                        }

                        // 3) selected part in last para
                        if (selection.startPaM.oxoPosition[startposLength - 1] !== selection.endPaM.oxoPosition[endposLength - 1]) {
                            var localstartPosition = _.copy(selection.endPaM.oxoPosition, true);
                            localstartPosition[endposLength - 1] = selection.endPaM.oxoPosition[endposLength - 1];
                            localstartPosition[endposLength] = 0;

                            this.setAttributes(attributes, localstartPosition, selection.endPaM.oxoPosition);
                        }

                    } else if (Position.isCellSelection(selection.startPaM, selection.endPaM)) {
                        // This cell selection is a rectangle selection of cells in a table (only supported in Firefox).
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
                                this.setAttributes(attributes, startPosition, endPosition);
                            }
                        }
                    } else if (Position.isSameTableLevel(paragraphs, selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {
                        // This selection is inside a table in a browser, where no cell selection is possible (Chrome). Selected
                        // can be parts of paragraphs inside a cell and also all paragraphs in other cells. This selection is
                        // important to be able to support something similar like cell selection, that is only possible
                        // in Firefox. So changes made in Firefox tables are displayed correctly in Chrome and vice versa.
                        var startPos = _.copy(selection.startPaM.oxoPosition, true),
                            endPos = _.copy(selection.endPaM.oxoPosition, true);

                        // 1) selected part in first cell
                        var startposLength = selection.startPaM.oxoPosition.length - 1,
                            localendPosition = _.copy(selection.startPaM.oxoPosition, true);

                        localendPosition[startposLength] = Position.getParagraphLength(paragraphs, localendPosition);
                        this.setAttributes(attributes, selection.startPaM.oxoPosition, localendPosition);
                        this.setAttributesToFollowingParagraphsInCell(attributes, localendPosition);

                        // 2) completely selected cells
                        var rowIndex = Position.getLastIndexInPositionByNodeName(paragraphs, startPos, 'TR'),
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
                                this.setAttributes(attributes, startPosition, endPosition);
                            }
                        }

                        // 3) selected part in final cell
                        var endposLength = selection.endPaM.oxoPosition.length - 1,
                            localstartPosition = _.copy(selection.endPaM.oxoPosition, true);

                        localstartPosition[endposLength - 1] = selection.endPaM.oxoPosition[endposLength - 1];
                        localstartPosition[endposLength] = 0;

                        this.setAttributesToPreviousParagraphsInCell(attributes, selection.endPaM.oxoPosition);
                        this.setAttributes(attributes, localstartPosition, selection.endPaM.oxoPosition);

                    } else {

                        // The included paragraphs are not neighbours. For example one paragraph top level and one in table.
                        // Should this be supported? How about tables in tables?
                        // This probably works not reliable for tables in tables.

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
                                this.setAttributesToFollowingCellsInTable(attributes, localendPosition);
                                this.setAttributesToFollowingParagraphsInCell(attributes, localendPosition);
                            }
                            localendPosition[startposLength] = Position.getParagraphLength(paragraphs, localendPosition);
                        }
                        this.setAttributes(attributes, selection.startPaM.oxoPosition, localendPosition);

                        // 2) completly selected paragraphs
                        for (var i = selection.startPaM.oxoPosition[0] + 1; i < selection.endPaM.oxoPosition[0]; i++) {
                            var localstartPosition = []; //_.copy(selection.startPaM.oxoPosition, true);
                            localstartPosition[0] = i;
                            localstartPosition[1] = 0;

                            isTable = Position.isPositionInTable(paragraphs, localstartPosition);

                            if (isTable) {
                                this.setAttributesToCompleteTable(attributes, localstartPosition);
                            } else {
                                localendPosition = _.copy(localstartPosition, true);
                                localendPosition[1] = Position.getParagraphLength(paragraphs, localendPosition);
                                this.setAttributes(attributes, localstartPosition, localendPosition);
                            }
                        }

                        // 3) selected part in last para
                        if (selection.startPaM.oxoPosition[startposLength - 1] !== selection.endPaM.oxoPosition[endposLength - 1]) {
                            var localstartPosition = _.copy(selection.endPaM.oxoPosition, true);
                            localstartPosition[endposLength - 1] = selection.endPaM.oxoPosition[endposLength - 1];
                            localstartPosition[endposLength] = 0;

                            isTable = Position.isPositionInTable(paragraphs, localstartPosition);

                            if (isTable) {
                                // Assigning attribute to all previous cells and to all previous paragraphs in this cell!
                                this.setAttributesToPreviousCellsInTable(attributes, selection.endPaM.oxoPosition);
                                this.setAttributesToPreviousParagraphsInCell(attributes, selection.endPaM.oxoPosition);
                            }
                            this.setAttributes(attributes, localstartPosition, selection.endPaM.oxoPosition);
                        }
                    }
                }
                // paragraph attributes also for cursor without selection
                else if (paragraphStyles.supportsAnyAttribute(attributes)) {
                    var newOperation = {name: OP_ATTRS_SET, attrs: attributes, start: _.copy(selection.startPaM.oxoPosition, true), end: _.copy(selection.endPaM.oxoPosition, true)};
                    this.applyOperation(newOperation, true, true);
                }
            }
            else {
                var newOperation = {name: OP_ATTRS_SET, attrs: attributes, start: _.copy(startPosition, true), end: _.copy(endPosition, true)};
                this.applyOperation(newOperation, true, true);
            }
        };

        this.getParagraphCount = function () {
            return paragraphs.size();
        };

        this.getParagraphText = function (para, start, end) {

            var text = '',
                textNodes = null;

            if (start === undefined)
                start = 0;
            if (end === undefined)
                end = 0x7FFFFFFF; // don't need correct len, just a very large value

            textNodes = collectTextNodes(paragraphs[para]);
            var node, nodeLen, startpos, endpos;
            var nodes = textNodes.length;
            var nodeStart = 0;
            for (var i = 0; i < nodes; i++) {
                node = textNodes[i];
                nodeLen = node.nodeValue.length;
                if ((nodeStart + nodeLen) > start) {
                    startpos = 0;
                    endpos = nodeLen;
                    if (nodeStart <= start) { // node matching startPaM
                        startpos = start - nodeStart;
                    }
                    if ((nodeStart + nodeLen) >= end) { // node matching endPaM
                        endpos = end - nodeStart;
                    }
                    text = text + node.nodeValue.slice(startpos, endpos);
                }
                nodeStart += nodeLen;
                if (nodeStart >= end)
                    break;
            }
            return text;
        };

        this.prepareNewParagraph = function (paragraph) {
            // insert an empty <span> with a text node, followed by a dummy <br>
            $(paragraph).append($('<span>').text(''), $('<br>').data('dummy', true));
        };

        // ==================================================================
        // TABLE METHODS
        // ==================================================================

        this.isPositionInTable = function () {

            var selection = this.getSelection(),
                position = null;

            if (selection) {
                position = selection.endPaM.oxoPosition;
            } else {
                return false;
            }

            return Position.isPositionInTable(paragraphs, position);
        };

        this.deletePreviousCellsInTable = function (position) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            if (isInTable) {

                var rowIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'TR'),
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
                        this.deleteAllParagraphsInCell(localPos);
                    }
                }
            }
        };

        this.deleteAllParagraphsInCell = function (position, noOPs) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            noOPs = noOPs ? true : false;

            if (isInTable) {

                var colIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'TH, TD'),
                    paraIndex = colIndex + 1,
                    lastParaInCell = Position.getLastParaIndexInCell(paragraphs, localPos);

                localPos[paraIndex] = 0;

                for (var i = 0; i <= lastParaInCell; i++) {
                    if ((localPos.length - 1) > paraIndex) {
                        localPos.pop();
                    }

                    var isTable = Position.getDOMPosition(paragraphs, localPos).node.nodeName === 'TABLE' ? true : false;

                    if (i < lastParaInCell) {
                        if (isTable) {
                            if (noOPs) {
                                this.implDeleteTable(localPos);
                            } else {
                                this.deleteTable(localPos);
                            }
                        } else {
                            if (noOPs) {
                                this.implDeleteParagraph(localPos);
                            } else {
                                this.deleteParagraph(localPos);
                            }
                        }
                    } else {
                        if (! noOPs) {
                            var startPos = _.copy(localPos, true),
                                endPos = _.copy(localPos, true);
                            startPos.push(0);
                            endPos.push(Position.getParagraphLength(paragraphs, localPos));
                            this.deleteText(startPos, endPos);
                        }
                        this.implDeleteParagraphContent(localPos);
                    }
                }
            }
        };

        this.deletePreviousParagraphsInCell = function (position) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            if (isInTable) {

                var paraIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'P'),
                    lastPara =  localPos[paraIndex],
                    paragraphPosition = [];

                localPos[paraIndex] = 0; // always 0, because paragraphs are deleted

                for (var i = 0; i <= paraIndex; i++) {
                    paragraphPosition.push(localPos[i]);
                }

                for (var i = 0; i < lastPara; i++) {
                    var isTable = Position.getDOMPosition(paragraphs, paragraphPosition).node.nodeName === 'TABLE' ? true : false;
                    if (isTable) {
                        this.deleteTable(localPos);
                    } else {
                        this.deleteParagraph(localPos);
                    }
                }
            }
        };

        this.deleteFollowingCellsInTable = function (position) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            if (isInTable) {

                var rowIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'TR'),
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
                        this.deleteAllParagraphsInCell(localPos);
                    }
                }
            }
        };

        this.deleteFollowingParagraphsInCell = function (position) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            if (isInTable) {

                var paraIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'P'),
                    startPara = localPos[paraIndex] + 1,
                    lastPara =  Position.getLastParaIndexInCell(paragraphs, localPos),
                    paragraphPosition = [];

                localPos[paraIndex] = startPara; // always 'startPara', because paragraphs are deleted

                for (var i = 0; i <= paraIndex; i++) {
                    paragraphPosition.push(localPos[i]);
                }

                for (var i = startPara; i <= lastPara; i++) {
                    var isTable = Position.getDOMPosition(paragraphs, paragraphPosition).node.nodeName === 'TABLE' ? true : false;
                    if (isTable) {
                        this.deleteTable(localPos);
                    } else {
                        this.deleteParagraph(localPos);
                    }
                }
            }
        };

        this.setAttributesToPreviousCellsInTable = function (attributes, position) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            if (isInTable) {

                var paraIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'P');

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
                            this.setAttributes(attributes, startPosition, endPosition);
                        }
                    }
                }
            }
        };

        this.setAttributesToFollowingCellsInTable = function (attributes, position) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            if (isInTable) {
                var rowIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'TR'),
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
                        this.setAttributes(attributes, startPosition, endPosition);
                    }
                }
            }
        };

        this.setAttributesToPreviousParagraphsInCell = function (attributes, position) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            if (isInTable) {

                var paraIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'P'),
                    thisPara = localPos[paraIndex],
                    paragraphPosition = [];

                for (var i = 0; i <= paraIndex; i++) {
                    paragraphPosition.push(localPos[i]);
                }

                for (var i = 0; i < thisPara; i++) {
                    localPos[paraIndex] = i;
                    paragraphPosition[paraIndex] = i;

                    // it can be a table next to a paragraph
                    if (Position.getDOMPosition(paragraphs, paragraphPosition).node.nodeName === 'TABLE') {
                        this.setAttributesToCompleteTable(attributes, localPos);
                    } else {
                        this.setAttributesToParagraphInCell(attributes, localPos);
                    }
                }
            }
        };

        this.setAttributesToFollowingParagraphsInCell = function (attributes, position) {

            var localPos = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, localPos);

            if (isInTable) {

                var paraIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'P'),
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
                    if (Position.getDOMPosition(paragraphs, paragraphPosition).node.nodeName === 'TABLE') {
                        this.setAttributesToCompleteTable(attributes, localPos);
                    } else {
                        this.setAttributesToParagraphInCell(attributes, localPos);
                    }
                }
            }
        };

        this.setAttributesToCompleteTable = function (attributes, position) {

            var localPos = _.copy(position),
                tableIndex = Position.getLastIndexInPositionByNodeName(paragraphs, localPos, 'TABLE'),
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
                    this.setAttributes(attributes, startPosition, endPosition);
                }
            }
        };

        this.setAttributesToParagraphInCell = function (attributes, position) {

            var startPosition = _.copy(position, true),
                endPosition = _.copy(position, true),
                isInTable = Position.isPositionInTable(paragraphs, startPosition);

            if (isInTable) {
                var paraIndex = Position.getLastIndexInPositionByNodeName(paragraphs, startPosition, 'P');

                startPosition[paraIndex + 1] = 0;
                endPosition[paraIndex + 1] = Position.getParagraphLength(paragraphs, position);

                this.setAttributes(attributes, startPosition, endPosition);
            }
        };

        // ==================================================================
        // IMPL METHODS
        // ==================================================================

        function implParagraphChanged(position) {

            // Make sure that a completly empty para has the dummy br element, and that all others don't have it anymore...
            var paragraph = Position.getCurrentParagraph(paragraphs, position);
            if (paragraph) {
                validateParagraphNode(paragraph);
            }
        }

        /* This didn't work - browser doesn't accept the corrected selection, is changing it again immediatly...
        this.implCheckSelection = function () {
            var node;
            var windowSel = window.getSelection();
            if ((windowSel.anchorNode.nodeType !== 3) || (windowSel.focusNode.nodeType !== 3)) {

                Utils.warn('Editor.implCheckSelection: invalid selection');

                var selection = this.getSelection();

                // var node, startnode = windowSel.anchorNode, startpos = windowSel.anchorOffset, endnode = windowSel.focusNode, endpos = windowSel.focusOffset;

                if (windowSel.anchorNode.nodeType !== 3) {
                    // Assume this only happens on para end - seems we are always directly in a p-element when this error occurs.
                    selection.startPaM.oxoPosition[1] = this.getParagraphLength(selection.startPaM.oxoPosition);
                }

                if (windowSel.focusNode.nodeType !== 3) {
                    selection.endPaM.oxoPosition[1] = this.getParagraphLength(selection.endPaM.oxoPosition);

                }

                this.setSelection(selection);
            }
        };
        */

        this.implInitDocument = function () {
            editdiv[0].innerHTML = '<html><p></p></html>';
            paragraphs = editdiv.children();
            implParagraphChanged([0]);
            this.setSelection(new OXOSelection());
            lastOperationEnd = new OXOPaM([0, 0]);
            this.clearUndo();

            // disable FireFox table manipulation handlers in edit mode
            // (the commands must be executed after the editable div is in the DOM)
            try {
                document.execCommand('enableObjectResizing', false, false);
                document.execCommand('enableInlineTableEditing', false, false);
            } catch (ex) {
            }

            // disable IE table manipulation handlers in edit mode
            Utils.getDomNode(editdiv).onresizestart = function () { return false; };
        };

        this.implInsertText = function (text, position) {
            var domPos = Position.getDOMPosition(paragraphs, position);

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
        };

        this.implInsertImage = function (url, position, attributes) {
            var domPos = Position.getDOMPosition(paragraphs, position),
                node = domPos ? domPos.node : null,
                anchorType = "AsCharacter";  // default

            if (attributes) {
                if (attributes.anchortype) {
                    anchorType = attributes.anchortype;
                }
            }

            if ((node) && (node.nodeType === 3)) {
                if (anchorType === 'AsCharacter') {
                    // prepend text before offset in a new span (also if position
                    // points to start or end of text, needed to clone formatting)
                    DOM.splitTextNode(node, domPos.offset);
                    // insert image before the parent <span> element of the text node
                    node = node.parentNode;
                    $('<img>', { src: url }).insertBefore(node);
                } else if (anchorType === 'ToPage') {
                    // TODO: This is not a good solution. Adding image to the end of the editdiv,
                    // does not produce any disorder, but images are not allowed at editdiv.
                    // A new counting for paragraphs = editdiv.children() is required.
                    $('<img>', { src: url }).appendTo(editdiv).css(attributes);
                    attributes.position = 'absolute';
                    paragraphs = editdiv.children();
                } else if (anchorType === 'ToParagraph') {
                    // insert image before the first span in the paragraph
                    node = node.parentNode.parentNode.firstChild;
                    attributes.position = 'absolute';
                    $('<img>', { src: url }).insertBefore(node).css(attributes);
                } else if (anchorType === 'ToCharacter') {
                    var textNode = DOM.splitTextNode(node, domPos.offset);
                    // Creating a new span that will include the graphic. The span must have a position.
                    // var newParent = $('<div>', { position: 'relative', display: 'inline-block' });
                    var newParent = $('<span>', { position: 'relative' });
                    newParent.insertAfter(textNode.parentNode);
                    attributes.position = 'absolute';
                    $('<img>', { src: url }).appendTo(newParent).css(attributes);
                }
            }

            var lastPos = _.copy(position);
            var posLength = position.length - 1;
            lastPos[posLength] = position[posLength] + 1;
            lastOperationEnd = new OXOPaM(lastPos);
            implParagraphChanged(position);
        };

        /**
         * Changes a specific formatting attribute of the specified text range.
         *
         * @param {Number[]} start
         *  The logical start position of the text range to be formatted.
         *
         * @param {Number[]} end
         *  The logical end position of the text range to be formatted.
         *
         * @param {Object} attributes
         *  A map with formatting attribute values, mapped by the attribute
         *  names.
         */
        function implSetAttributes(start, end, attributes) {

            var // last index in the start position array
                startLastIndex = start.length - 1,
                // last index in the end position array
                endLastIndex = end.length - 1,
                // the DOM text range to be formatted
                ranges = null;

            // build local copies of the arrays (do not change caller's data)
            start = _.copy(start);
            end = _.copy(end);

            // validate text offset
            if (!_.isFinite(start[startLastIndex]) || (start[startLastIndex] < 0)) {
                start[startLastIndex] = 0;
            }
            if (!_.isFinite(end[endLastIndex]) || (end[endLastIndex] < 0)) {
                end[endLastIndex] = Position.getParagraphLength(paragraphs, start);
            }

            // store last position
            lastOperationEnd = new OXOPaM(end);

            // build the DOM text range
            ranges = self.getDOMSelection(new OXOSelection(new OXOPaM(start), new OXOPaM(end)));

            if (textMode !== 'plain') {
                paragraphStyles.setRangeAttributes(ranges, attributes);
                characterStyles.setRangeAttributes(ranges, attributes);
            }
        }

        this.implInsertParagraph = function (position) {
            var posLength = position.length - 1,
                para = position[posLength],
                allParagraphs = Position.getAllAdjacentParagraphs(paragraphs, position);

            var newPara = $('<p>');

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
        };

        this.implInsertTable = function (position, rows, columns) {

            var // prototype elements for the table, row, cell, and paragraph
                paragraph = $('<p>'),
                cell = $('<td>').append(paragraph),
                row = $('<tr>').append(cell),
                table = $('<table>').append(row);

            // insert empty text node into the paragraph
            validateParagraphNode(paragraph);
            // clone the cells in the row element
            _.times(columns - 1, function () { row.append(cell.clone(true)); });
            // clone the rows in the table element
            _.times(rows - 1, function () { table.append(row.clone(true)); });

            // insert the table into the document
            var domParagraph = Position.getDOMPosition(paragraphs, position).node;
            table.insertBefore(domParagraph);
            paragraphs = editdiv.children();

            // Setting cursor into table (unfortunately not visible in Chrome)
            var oxoPosition = Position.getFirstPositionInParagraph(paragraphs, position);
            this.setSelection(new OXOSelection(new OXOPaM(oxoPosition), new OXOPaM(oxoPosition)));

            // lastOperationEnd = new OXOPaM([position, 0]);
        };

        this.implSplitParagraph = function (position) {

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
                this.implDeleteText(startPos, endPos);
            }
            var startPosition = _.copy(position, true);
            startPosition[posLength - 1] += 1;
            startPosition[posLength] = 0;
            var endPosition = _.copy(position, true);
            endPosition[posLength - 1] = startPosition[posLength - 1];
            this.implDeleteText(startPosition, endPosition);

            implParagraphChanged(position);
            implParagraphChanged(startPosition);
            lastOperationEnd = new OXOPaM(startPosition);

            // DEBUG STUFF
            if (paragraphs.size() !== (dbg_oldparacount + 1)) {
                Utils.warn('Editor.implSplitParagraph(): paragraph count invalid!');
            }
        };

        this.implMergeParagraph = function (position) {

            var posLength = position.length - 1,
                para = position[posLength];

            position.push(0); // adding pos to position temporarely

            var allParagraphs = Position.getAllAdjacentParagraphs(paragraphs, position);

            position.pop();

            if (para < (allParagraphs.size() - 1)) {

                var dbg_oldparacount = allParagraphs.size();

                var thisPara = allParagraphs[para];
                var nextPara = allParagraphs[para + 1];

                // Only merging, if both paragraph nodes have name 'p'. Tables cannot be merged this way, and
                // 'p' and 'table' cannot be merged either.
                if ((thisPara.nodeName === 'P') && (nextPara.nodeName === 'P')) {

                    var oldParaLen = 0;
                    oldParaLen = Position.getParagraphLength(paragraphs, position);

                    var lastCurrentChild = thisPara.lastChild;
                    if (lastCurrentChild && (lastCurrentChild.nodeName === 'BR')) {
                        thisPara.removeChild(lastCurrentChild);
                    }

                    var child = nextPara.firstChild;

                    while (child !== null) {
                        var nextChild = child.nextSibling; // saving next sibling, because it will be lost after appendChild()

                        if ((child.nodeType === 3) && (thisPara.lastChild !== null) && (thisPara.lastChild.nodeType === 3)) {
                            thisPara.lastChild.nodeValue += child.nodeValue;
                        } else {
                            thisPara.appendChild(child);
                        }

                        child = nextChild;
                    }

                    var localPosition = _.copy(position, true);
                    localPosition[posLength] += 1;  // posLength is 0 for non-tables

                    this.implDeleteParagraph(localPosition);

                    var lastPos = _.copy(position);
                    lastPos.push(oldParaLen);
                    lastOperationEnd = new OXOPaM(lastPos);
                    implParagraphChanged(position);

                    // DEBUG STUFF
                    if (paragraphs.size() !== (dbg_oldparacount - 1)) {
                        Utils.warn('Editor.implMergeParagraph(): paragraph count invalid!');
                    }
                }
            }
        };

        this.implDeleteParagraph = function (position) {

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
        };

        this.implDeleteParagraphContent = function (position) {
            var paragraph = Position.getDOMPosition(paragraphs, position).node;
            if (paragraph) {
                $(paragraph).empty();
                validateParagraphNode(paragraph);
            }
        };

        this.implDeleteCellRange = function (pos, startCell, endCell) {

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
                    this.deleteAllParagraphsInCell(position, true);
                }
            }
        };

        this.implDeleteTable = function (position) {

            var tablePosition = Position.getLastPositionFromPositionByNodeName(paragraphs, position, 'TABLE'),
                lastRow = Position.getLastRowIndexInTable(paragraphs, position),
                lastColumn = Position.getLastColumnIndexInTable(paragraphs, position);

            // iterating over all cells and remove all paragraphs in the cells
            if ((lastRow > -1) && (lastColumn > -1)) {
                this.implDeleteCellRange(tablePosition, [0, 0], [lastRow, lastColumn]);
            }

            // Finally removing the table itself
            var tableNode = Position.getDOMPosition(paragraphs, tablePosition).node;
            $(tableNode).remove();

            var para = tablePosition.pop();
            if (para > 0) {
                para -= 1;
            }
            tablePosition.push(para);
            tablePosition.push(Position.getParagraphLength(paragraphs, tablePosition));
            lastOperationEnd = new OXOPaM(tablePosition);
            this.setSelection(new OXOSelection(new OXOPaM(tablePosition), new OXOPaM(tablePosition)));
            paragraphs = editdiv.children();
        };

        this.implDeleteRows = function (pos, startRow, endRow) {

            var localPosition = _.copy(pos, true),
                lastColumn = Position.getLastColumnIndexInTable(paragraphs, localPosition);

            if (! Position.isPositionInTable(paragraphs, localPosition)) {
                return;
            }

            var table = Position.getDOMPosition(paragraphs, localPosition).node;

            // iterating over all cells and remove all paragraphs in the cells
            this.implDeleteCellRange(localPosition, [startRow, 0], [endRow, lastColumn]);

            $(table).children().children().slice(startRow, endRow + 1).remove();

            if ($(table).children().children().length === 0) {
                // This code should never be reached. If last row shall be deleted, deleteTable is called.
                this.deleteTable(localPosition);
                $(table).remove();
                paragraphs = editdiv.children();
                localPosition.push(0);
            } else {
                // Setting cursor
                var lastRow = $(table).children().children().length - 1;
                if (endRow > lastRow) {
                    endRow = lastRow;
                }
                localPosition.push(endRow);
                localPosition.push(0);
                this.setSelection(new OXOSelection(new OXOPaM(localPosition), new OXOPaM(localPosition)));
            }

        };

        this.implCopyRow = function (pos, startRow, endRow) {

            var localPosition = _.copy(pos, true),
                lastColumn = Position.getLastColumnIndexInTable(paragraphs, localPosition);

            if (! Position.isPositionInTable(paragraphs, localPosition)) {
                return;
            }

            var table = Position.getDOMPosition(paragraphs, localPosition).node,
                selectedRow = $(table).children().children().get(startRow),
                insertAfter = endRow - 1;

            $(selectedRow).clone(true).insertAfter($(table).children().children().get(insertAfter));

            // iterating over all new cells and remove all paragraphs in the cells
            this.implDeleteCellRange(localPosition, [endRow, 0], [endRow, lastColumn]);

            // Setting cursor
            localPosition.push(endRow);
            localPosition.push(0);
            this.setSelection(new OXOSelection(new OXOPaM(localPosition), new OXOPaM(localPosition)));
        };

        this.implDeleteColumns = function (pos, startCol, endCol) {

            var localPosition = _.copy(pos, true),
                lastRow = Position.getLastRowIndexInTable(paragraphs, localPosition);

            if (! Position.isPositionInTable(paragraphs, localPosition)) {
                return;
            }

            // iterating over all cells and remove all paragraphs in the cells
            this.implDeleteCellRange(localPosition, [0, startCol], [lastRow, endCol]);

            var table = Position.getDOMPosition(paragraphs, localPosition).node,
            allRows = $(table).children().children();

            allRows.each(
                function (i, elem) {
                    $(elem).children().slice(startCol, endCol + 1).remove();
                }
            );

            if ($(table).children().children().children().length === 0) {   // no more columns
                // This code should never be reached. If last column shall be deleted, deleteTable is called.
                $(table).remove();
                paragraphs = editdiv.children();
                localPosition.push(0);
            } else {
                // Setting cursor
                var lastColInFirstRow = $(table).children().children().first().children().length - 1;
                if (endCol > lastColInFirstRow) {
                    endCol = lastColInFirstRow;
                }
                localPosition.push(0);
                localPosition.push(endCol);
            }

            this.setSelection(new OXOSelection(new OXOPaM(localPosition), new OXOPaM(localPosition)));
        };

        this.implCopyColumn = function (pos, startCol, endCol) {

            var localPosition = _.copy(pos, true),
                lastRow = Position.getLastRowIndexInTable(paragraphs, localPosition);

            if (! Position.isPositionInTable(paragraphs, localPosition)) {
                return;
            }

            var table = Position.getDOMPosition(paragraphs, localPosition).node,
                allRows = $(table).children().children(),
                insertAfter = endCol - 1;

            allRows.each(
                function (i, elem) {
                    var selectedColumn = $(elem).children().get(startCol);
                    $(selectedColumn).clone(true).insertAfter($(elem).children().get(insertAfter));
                }
            );

            // iterating over all new cells and remove all paragraphs in the cells
            this.implDeleteCellRange(localPosition, [0, endCol], [lastRow, endCol]);

            // Setting cursor to first position in table
            localPosition.push(0);
            localPosition.push(endCol);
            this.setSelection(new OXOSelection(new OXOPaM(localPosition), new OXOPaM(localPosition)));
        };

        this.implDeleteText = function (startPosition, endPosition) {

            var lastValue = startPosition.length - 1;
            var start = startPosition[lastValue];
            var end = endPosition[lastValue];

            if (end === -1) {
                end = Position.getParagraphLength(paragraphs, startPosition);
            }

            if (start === end) {
                return;
            }

            var oneParagraph = Position.getCurrentParagraph(paragraphs, startPosition);
            var searchNodes = collectTextNodesAndImages(oneParagraph);
            var node, nodeLen, delStart, delEnd;
            var nodes = searchNodes.length;
            var nodeStart = 0;
            for (var i = 0; i < nodes; i++) {
                var isImage = false;
                node = searchNodes[i];
                if (node.nodeName === 'IMG') {
                    nodeLen = 1;
                    isImage = true;
                } else {
                    nodeLen = node.nodeValue.length;
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
                        // TODO: Need to take care for empty elements!
                        if (isImage) {
                            oneParagraph.removeChild(node);
                        } else {
                            node.nodeValue = '';
                        }
                    }
                    else {
                        var oldText = node.nodeValue;
                        var newText = oldText.slice(0, delStart) + oldText.slice(delEnd);
                        node.nodeValue = newText;
                    }
                }
                nodeStart += nodeLen;
                if (nodeStart >= end)
                    break;
            }

            lastOperationEnd = new OXOPaM(_.copy(startPosition, true));
            // old:  lastOperationEnd = new OXOPaM([para, start]);

            implParagraphChanged(startPosition);
        };

        function implDbgOutEvent(event) {

            if (!dbgoutEvents)
                return;

            var selection = self.getSelection();

            var dbg = fillstr(event.type, 10, ' ', true) + ' sel:[' + getFormattedPositionString(selection.startPaM.oxoPosition) + '/' + getFormattedPositionString(selection.endPaM.oxoPosition) + ']';

            if ((event.type === "keypress") || (event.type === "keydown")) {
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
            .on('focus', _.bind(this.processFocus, this, true))
            .on('blur', _.bind(this.processFocus, this, false))
            .on('keydown', $.proxy(this, 'processKeyDown'))
            .on('keypress', $.proxy(this, 'processKeyPressed'))
            .on('mousedown', $.proxy(this, 'processMouseDown'))
            .on('mouseup', $.proxy(this, 'processMouseUp'))
            .on('dragover', $.proxy(this, 'processDragOver'))
            .on('drop', $.proxy(this, 'processDrop'))
            .on('contextmenu', $.proxy(this, 'processContextMenu'))
            .on('cut paste', false);

        // this.implInitDocument(); Done in main.js - to early here for IE, div not in DOM yet.

    } // end of OXOEditor()

    // exports ================================================================

    return OXOEditor;
});
