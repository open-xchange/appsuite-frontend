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

define('io.ox/office/editor', ['io.ox/core/event', 'io.ox/office/tk/utils'], function (Events, Utils) {

    'use strict';

    var KeyCodes = Utils.KeyCodes;

    var OP_TEXT_INSERT =  'insertText';
    var OP_TEXT_DELETE =  'deleteText';

    var OP_PARA_INSERT =  'insertParagraph';
    var OP_PARA_DELETE =  'deleteParagraph';
    var OP_PARA_SPLIT =   'splitParagraph';
    var OP_PARA_MERGE =   'mergeParagraph';

    var OP_TABLE_INSERT = 'insertTable';
    var OP_TABLE_DELETE = 'deleteTable';

    var OP_ATTR_SET =     'setAttribute';   // Should better be insertAttribute?
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
                dbgOutError("ERROR - not in undo group!");
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
                dbgOutError("ERROR - creating undo while processing undo!");
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

    }

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
     * 'Point and mark'. Represents a text position a.k.a. cursor position.
     * Member field 'para' contains the zero-based paragraph index, member
     * field 'pos' contains the zero-based character index behind the cursor
     * position.
     */
    function OXOPaM(oxoPosition) {
        this.oxoPosition = oxoPosition;

        this.toString = function () {
            return oxoPosition.toString();
        };
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

    /**
     * 'Point and mark'. Represents a text position a.k.a. cursor position.
     * Member field 'aNode' contains the selected node, member field 'aOffset'
     * contain the offset inside the node, where the selection starts.
     */
    function DOMPaM(node, offset) {
        this.node = node;
        this.offset = offset;
        this.toString = function () {
            return ("(node: " + this.node.nodeName + ", offset: " + this.offset + ")");
        };
    }

    /**
     * Represents a text range consisting of start position and end position.
     */
    function DOMSelection(start, end) {
        this.startPaM = start;
        this.endPaM = end;
        this.toString = function () {
            return ("Startpoint: " + this.startPaM.toString() + ", Endpoint: " + this.endPaM.toString());
        };
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


    function collectTextNodes(element, textNodes) {
        for (var child = element.firstChild; child !== null; child = child.nextSibling) {
            if (child.nodeType === 3)
                textNodes.push(child);
            else if (child.nodeType === 1)
                collectTextNodes(child, textNodes);
        }
    }

    function hasTextContent(element) {
        for (var child = element.firstChild; child !== null; child = child.nextSibling) {
            if (child.nodeName === 'BR') {
                if (!child.dummyBR) // regular line break is content
                    return true;
            }
            if (child.nodeType === 3) {
                if (child.nodeValue.length)
                    return true;
            }
            else if (child.nodeType === 1)
                return hasTextContent(child);
        }
        return false;
    }

    // class OXOEditor ========================================================

    /**
     * The text editor.
     *
     * Triggers the following events:
     * - 'focus': When the editor container got or lost browser focus.
     * - 'operation': When a new operation has been applied.
     * - 'modified': When the modified flag has been changed.
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

        var modified = false;
        var focused = false;

        var lastKeyDownEvent;
        var lastEventSelection;

        // list of operations
        var operations = [];

        var undomgr = new OXOUndoManager();

        var lastOperationEnd;     // Need to decide: Should the last operation modify this member, or should the selection be passed up the whole call chain?!

        var blockOperations = false;
        var blockOperationNotifications = false;

        var charcodeSPACE = 32;
        var charcodeNBSP = 160;

        // list of paragraphs as jQuery object
        var paragraphs = editdiv.children();

        var dbgoutEvents = false, dbgoutObjects = false, dbgoutInfos = true;

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
         * Returns whether the editor contains unsaved changes.
         */
        this.isModified = function () {
            return modified;
        };

        /**
         * Sets the editor to modified or unmodified state, and triggers a
         * 'modified' event, if the state has been changed.
         */
        this.setModified = function (state) {
            if (modified !== state) {
                modified = state;
                this.trigger('modified', state);
            }
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

        // OPERATIONS API

        this.clearOperations = function () {
            operations = [];
        };

        // Maybe only applyOperation_s_, where param might be operation or operation[] ?
        this.applyOperation = function (operation, bRecord, bNotify) {

            if (blockOperations) {
                // This can only happen if someone tries to apply new operation in the operation notify.
                // This is not allowed because a document manipulation method might be split into multiple operations, following operations would have invalid positions then.
                this.implDbgOutInfo('applyOperation - operations blocked');
                return;
            }

            blockOperations = true;

            // Clone operation now, because undo might manipulate it when merging with previous one...
            var notifyOperation = _.clone(operation, true);

            this.implDbgOutObject({type: 'operation', value: operation});

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
                if (undomgr.isEnabled() && !undomgr.isInUndo()) {
                    // Hack - this is not the correct Undo - but the attr toggle from the browser will have the effect we want to see ;)
                    var undoOperation = {name: OP_ATTR_SET, attr: operation.attr, value: !operation.value, start: _.copy(operation.start, true), end: _.copy(operation.end, true)};
                    undomgr.addUndo(new OXOUndoAction(undoOperation, operation));
                }
                this.implSetAttribute(operation.attr, operation.value, operation.start, operation.end);
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
                this.implInsertTable(operation.start);
            }
            else if (operation.name === OP_TABLE_DELETE) {
                if (undomgr.isEnabled() && !undomgr.isInUndo()) {
                    var undoOperation = { name: OP_TABLE_INSERT, start: _.copy(operation.start, true) };
                    undomgr.addUndo(new OXOUndoAction(undoOperation, operation));
                }
                this.implDeleteTable(operation.start);
            }
            else if (operation.name === OP_PARA_SPLIT) {
                if (undomgr.isEnabled() && !undomgr.isInUndo()) {
                    var undoOperation = { name: OP_PARA_MERGE, start: _.copy(operation.start, true) };
                    undomgr.addUndo(new OXOUndoAction(undoOperation, operation));
                }
                this.implSplitParagraph(operation.start);
            }
            else if (operation.name === OP_PARA_MERGE) {
                if (undomgr.isEnabled() && !undomgr.isInUndo()) {
                    var sel = _.copy(operation.start);
                    var paraLen = 0;
                    this.getParagraphLength(sel);
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

            // document state
            this.setModified(true);

            if (bNotify && !blockOperationNotifications) {
                // Will give everybody the same copy - how to give everybody his own copy?
                this.trigger("operation", notifyOperation);
            }

            blockOperations = false;

            // DEBUG STUFF
            if (this.getParagraphCount() !== editdiv.children().size()) {
                this.implDbgOutInfo('applyOperation - para count invalid!');
            }

        };

        this.applyOperations = function (theOperations, bRecord, notify) {

            if (_(theOperations).isArray()) {
                _(theOperations).each(function (operation, i) {
                    if (_(operation).isObject()) {
                        this.applyOperation(operation, bRecord, notify);
                    }
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

        this.implGetOXOSelection = function (domSelection) {

            function getOXOPositionFromDOMPosition(node, offset) {

                // check input values
                if (! node) {
                    this.implDbgOutInfo('getOXOPositionFromDOMPosition: Invalid DOM position. Node not defined');
                    return;
                }

                if (offset < 0) {
                    this.implDbgOutInfo('getOXOPositionFromDOMPosition: Invalid DOM position. Offset < 0 : ' + offset + ' . Node: ' + node.nodeName + ',' + node.nodeType);
                    return;
                }

                // Check, if the selected node is a descendant of "this.editdiv"
                var editorDiv = editdiv.has(node).get(0);

                if (!editorDiv) { // range not in text area
                    this.implDbgOutInfo('getOXOPositionFromDOMPosition: Invalid DOM position. It is not part of the editor DIV!');
                    return;
                }

                // Checking node in root elements
                if (paragraphs.has(node).length === 0) {
                    this.implDbgOutInfo('getOXOPositionFromDOMPosition: Invalid DOM position. It is not included in the top level elements of the editor DIV!');
                    return;
                }

                // Calculating the position inside the editdiv.
                var oxoPosition = [],
                    evaluateOffset = (node.nodeType === 3) ? true : false,  // Is evaluation of offset required?
                    offsetEvaluated = false,
                    columnBuffer = -1,
                    textLength = 0;

                // currently supported elements: 'p', 'table', 'th', 'td', 'tr'
                // Attention: Column and Row are not in the order in oxoPosition, in which they appear in html.
                // Column must be integrated after row -> a buffer is required.

                for (; node && (node !== editdiv.get(0)); node = node.parentNode) {
                    if ((node.nodeName === 'TD') ||
                        (node.nodeName === 'TH') ||
                        (node.nodeName === 'TR') ||
                        (node.nodeName === 'P') ||
                        (node.nodeName === 'TABLE')) {

                        if ((node.nodeName === 'TH') || (node.nodeName === 'TD')) {  // special handling to change order of column and row.
                            columnBuffer = $(node).prevAll().length;
                        } else {
                            oxoPosition.unshift($(node).prevAll().length);  // zero based
                            if (columnBuffer !== -1) {
                                oxoPosition.unshift(columnBuffer);
                                columnBuffer = -1;
                            }
                        }

                        evaluateOffset = false;
                    }
                    if (evaluateOffset) {
                        for (var prevNode = node; (prevNode = prevNode.previousSibling);) {
                            textLength += $(prevNode).text().length;
                        }
                        offsetEvaluated = true;
                    }
                }

                if (offsetEvaluated) {
                    oxoPosition.push(textLength + offset);
                }

                if ((node.nodeType === 3) && (! offsetEvaluated)) {
                    this.implDbgOutInfo('getOXOPositionFromDOMPosition: Warning: Offset ' + offset + ' was not evaluated, although nodeType is 3! Calculated oxoPosition: ' + oxoPosition);
                }

                // this.implDbgOutInfo('getOXOPositionFromDOMPosition: Info: Converting node: ' + node.nodeName + ',' + node.nodeType + ' and offset (optionally): ' + offset + ' to oxoPosition: ' + oxoPosition);

                return new OXOPaM(oxoPosition);
            }

            // Only supporting single selection at the moment

            var startOxoPaM,
                endOxoPaM;

            if (domSelection.startPaM.node.nodeType === 3) {
                if (! _.isNumber(domSelection.startPaM.offset)) {
                    this.implDbgOutInfo('implGetOXOSelection: Invalid start position. NodeType is 3, but offset is not defined!');
                    return;
                }
            } else {
                if (_.isNumber(domSelection.startPaM.offset)) {
                    this.implDbgOutInfo('implGetOXOSelection: Invalid start position. NodeType is: ' + domSelection.startPaM.node.nodeType + ', but offset is set: ' + domSelection.startPaM.offset + ' . Offset will be ignored!');
                }
            }

            if (domSelection.endPaM.node.nodeType === 3) {
                if (! _.isNumber(domSelection.endPaM.offset)) {
                    this.implDbgOutInfo('implGetOXOSelection: Invalid end position. NodeType is 3, but offset is not defined!');
                    return;
                }
            } else {
                if (_.isNumber(domSelection.endPaM.offset)) {
                    this.implDbgOutInfo('implGetOXOSelection: Invalid end position. NodeType is: ' + domSelection.endPaM.node.nodeType + ', but offset is set: ' + domSelection.endPaM.offset + ' . Offset will be ignored!');
                }
            }

            // Checking selection - setting a valid selection doesn't always work on para end, browser is manipulating it....
            // Assume this only happens on para end - seems we are always directly in a p-element when this error occurs.
            if (domSelection.startPaM.node.nodeType === 3) {
                startOxoPaM = getOXOPositionFromDOMPosition.call(this, domSelection.startPaM.node, domSelection.startPaM.offset);
            } else {
                // Work around browser selection bugs...
                // This will be important for the selection of cells in tables!
                var myParagraph = paragraphs.has(domSelection.startPaM.node.firstChild);
                var para = myParagraph.index();
                var nPos = 0;
                if ((domSelection.startPaM.node === domSelection.endPaM.node) && (domSelection.startPaM.offset === domSelection.endPaM.offset)) {
                    nPos = this.getParagraphLength([para]);
                }
                startOxoPaM = new OXOPaM([para, nPos]);
                // this.implDbgOutInfo('info: fixed invalid selection (start): ' + startPaM.toString());
            }

            if (domSelection.endPaM.node.nodeType === 3) {
                endOxoPaM = getOXOPositionFromDOMPosition.call(this, domSelection.endPaM.node, domSelection.endPaM.offset);
            } else {
                // Work around browser selection bugs...
                // This will be important for the selection of cells in tables!
                var myParagraph = paragraphs.has(domSelection.endPaM.node.firstChild);
                var para = myParagraph.index();
                // Special handling for triple click in Chrome, that selects the start of the following paragraph as end point
                if ((domSelection.startPaM.node.nodeType === 3) && (domSelection.endPaM.node.nodeName === 'P') && (domSelection.endPaM.offset === 0)) {
                    para--;
                }
                endOxoPaM = new OXOPaM([para, this.getParagraphLength([para])]);
                // this.implDbgOutInfo('info: fixed invalid selection (end):' + endPaM.toString());
            }

            var aOXOSelection = new OXOSelection(startOxoPaM, endOxoPaM);

            return aOXOSelection;
        };

        this.getDOMPosition = function (oxoPosition) {

            var oxoPos = _.copy(oxoPosition, true),
                localElements = paragraphs,  // starting with root elements
                calculateOffset = false,
                node = null,
                offset = null;

            if (oxoPos[0] === undefined) {
                this.implDbgOutInfo('getDOMPosition: Position is undefined!');
                return;
            }

            // Converting an oxoPosition array to a node and an offset
            // Supported html tags: '<p>', '<table>', '<tr>', '<th>', '<td>' and 'nodeType === 3'

            while (oxoPos.length > 0) {

                var currentPos = oxoPos.shift(),

                node = localElements.get(currentPos);

                var maxPara = localElements.length - 1;
                if (currentPos > maxPara) {
                    this.implDbgOutInfo('getDOMPosition: Warning: Paragraph ' + currentPos + ' is out of range. Last paragraph: ' + maxPara);
                    return;
                }

                if (oxoPos.length < 1) {
                    break;
                }

                if (node.nodeName === 'P') {
                    calculateOffset = true;
                    break;  // leaving the while-iteration
                } else if (node.nodeName === 'TABLE') {
                    // At the moment, 'column' and 'row' must be defined (cell). Selection of only one column is difficult in html.
                    var column = oxoPos.shift();
                    // How to get html description from 'column' value
                    if (oxoPos.length < 1) {
                        this.implDbgOutInfo('getDOMPosition: Illegal position: ' + oxoPosition + ' . Table requires input of column and row.');
                        return;
                        // -> In the moment, it is not possible to select one column of a table. But it would be better,
                        // to be able to select one row of a table, because this is supported by html.
                    }

                    var row =  oxoPos.shift();

                    // Selecting the correct cell in the table
                    var tablerow = $('tr', node).get(row);                          // valid for table in table ?
                    node = $('th, td', tablerow).get(column);  // this is a table cell     // valid for table in table ?

                    if (oxoPos.length < 1) {
                        break;
                    }

                    localElements = $(node).children();
                    continue;  // new iteration, should start with 'p' or 'table'

                } else {
                    this.implDbgOutInfo('getDOMPosition: Illegal position: ' + oxoPosition + ' . Node must be paragraph or table. NodeName: ' + node.nodeName);
                    return;
                }
            }

            if (calculateOffset) {

                // Node must be a paragraph
                if (node.nodeName !== 'P') {
                    this.implDbgOutInfo('getDOMPosition: Warning: Node must be a paragraph for calculing offset. But it is: ' + node.nodeName);
                    return;
                }

                // Checking if this paragraph has children
                if (! node.hasChildNodes()) {
                    this.implDbgOutInfo('getDOMPosition: Warning: Paragraph is empty');
                    return;
                }

                var pos = oxoPos.shift();

                // now oxoPos should be empty
                if (oxoPos.length > 0) {
                    this.implDbgOutInfo('getDOMPosition: Warning: Position has to many values: ' + oxoPosition + ' . Value for position (last required value): ' + pos);
                    // return;
                }

                var textLength = 0;
                var bFound = false;

                while (node.hasChildNodes()) {

                    var nodeList = node.childNodes;

                    for (var i = 0; i < nodeList.length; i++) {
                        // Searching the children
                        var currentNode = nodeList[i];
                        var currentLength = $(nodeList[i]).text().length;
                        if (textLength + currentLength >= pos) {
                            bFound = true;
                            node = currentNode;
                            break;  // leaving the for-loop
                        } else {
                            textLength += currentLength;
                        }
                    }
                }

                if (! bFound) {
                    this.implDbgOutInfo('getDOMPosition: Warning: Paragraph does not contain position: ' + pos + '. Last position: ' + textLength);
                    return;
                }

                offset = pos - textLength;
            }

            // this.implDbgOutInfo('getDOMPosition: Info: Converting position ' + oxoPosition + ' to node: ' + node.nodeName + ',' + node.nodeType + ' and offset (optionally): ' + offset);

            return new DOMPaM(node, offset);
        };

        this.getDOMSelection = function (oxoSelection) {

            // Only supporting single selection at the moment
            var startPaM = this.getDOMPosition(oxoSelection.startPaM.oxoPosition),
                endPaM = this.getDOMPosition(oxoSelection.endPaM.oxoPosition),
                domSelection = null;

            if ((startPaM) && (endPaM)) {
                domSelection = new DOMSelection(startPaM, endPaM);
            }

            return domSelection;
        };

        this.initDocument = function () {
            var newOperation = { name: 'initDocument' };
            this.applyOperation(newOperation, true, true);
        };

        this.getSelection = function () {

            // quick check - no selection.
            // TODO: Also check wether or not the selection is inside our edit div.
            var windowSel = window.getSelection();
            if (!windowSel.anchorNode)
                return;

            var domSelection = this.implGetCurrentDOMSelection();
            var selection = this.implGetOXOSelection(domSelection);
            return selection;
        };

        this.setSelection = function (oxosel) {
            var oldSelection = this.getSelection();
            var aDOMSelection = this.getDOMSelection(oxosel);
            this.implSetDOMSelection(aDOMSelection.startPaM.node, aDOMSelection.startPaM.offset, aDOMSelection.endPaM.node, aDOMSelection.endPaM.offset);
            // if (TODO: Compare Arrays oldSelection, oxosel)
            this.trigger('selectionChanged');   // when setSelection() is called, it's very likely that the selection actually did change. If it didn't - that normally shouldn't matter.
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

        this.processFocus = function (state) {
            if (focused !== state) {
                focused = state;
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
            var _this = this;
            // I Don't think we need some way to stop the timer, as the user won't be able to close this window "immediatly" after a mouse click or key press...
            window.setTimeout(function () { _this.implCheckEventSelection(); }, 10);
        };

        this.implCheckEventSelection = function () {
            var currentSelection = this.getSelection();
            if (!currentSelection || !lastEventSelection || !currentSelection.isEqual(lastEventSelection)) {
                lastEventSelection = currentSelection;
                this.trigger('selectionChanged');
                this.implDbgOutInfo('mouse selection changed');
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

            this.implDbgOutEvent(event);
            // this.implCheckSelection();

            this.implCheckEventSelection();
            lastEventSelection = this.getSelection();
            this.implStartCheckEventSelection();

            // TODO: How to strip away debug code?
            if (event.keyCode && event.shiftKey && event.ctrlKey && event.altKey) {
                var c = this.getPrintableChar(event);
                if (c === 'P') {
                    alert('#Paragraphs: ' + paragraphs.length);
                }
                if (c === 'I') {
                    this.insertParagraph([paragraphs.length]);
                }
                if (c === 'D') {
                    this.initDocument();
                    this.grabFocus(true);
                }
                if (c === 'T') {
                    this.insertTable();
                }
                if (c === '1') {
                    dbgoutEvents = !dbgoutEvents;
                    window.console.log('dbgoutEvents is now ' + dbgoutEvents);
                }
                if (c === '2') {
                    dbgoutObjects = !dbgoutObjects;
                    window.console.log('dbgoutObjects is now ' + dbgoutObjects);
                }
                if (c === '3') {
                    dbgoutInfos = !dbgoutInfos;
                    window.console.log('dbgoutInfos is now ' + dbgoutInfos);
                }
                if (c === '4') {
                    blockOperationNotifications = !blockOperationNotifications;
                    window.console.log('block operation notifications is now ' + blockOperationNotifications);
                }
            }

            var selection = this.getSelection();

            lastEventSelection = _.copy(selection, true);
            lastKeyDownEvent = event;   // For some keys we only get keyDown, not keyPressed!

            if (event.keyCode === KeyCodes.DELETE) {
                selection.adjust();
                if (selection.hasRange()) {
                    this.deleteSelected(selection);
                }
                else {
                    var lastValue = selection.startPaM.oxoPosition.length - 1;
                    var startPosition = selection.startPaM.oxoPosition;
                    var paraLen = this.getParagraphLength(startPosition);

                    if (startPosition[lastValue] < paraLen) {
                        selection.endPaM.oxoPosition[lastValue]++;
                        this.deleteText(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition);
                    }
                    else {
                        var mergeselection = _.copy(selection.startPaM.oxoPosition);
                        mergeselection.pop();
                        this.mergeParagraph(mergeselection);
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
                    else if (selection.startPaM.oxoPosition[lastValue - 1] > 0) {
                        var startPosition = _.copy(selection.startPaM.oxoPosition, true);
                        startPosition[lastValue - 1] -= 1;
                        startPosition.pop();

                        var length = this.getParagraphLength(startPosition);

                        this.mergeParagraph(startPosition);
                        selection.startPaM.oxoPosition[lastValue - 1] -= 1;
                        selection.startPaM.oxoPosition[lastValue] = length;
                    }
                }
                selection.endPaM = _.copy(selection.startPaM, true);
                event.preventDefault();
                this.setSelection(selection);
            }
            else if (event.ctrlKey) {
                var c = this.getPrintableChar(event);
                if (c === 'A') {
                    selection = new OXOSelection(new OXOPaM([0, 0]), new OXOPaM([0, 0]));

                    if (this.isPositionInTable([0])) {
                        selection.startPaM.oxoPosition = [];
                        selection.startPaM.oxoPosition.push(0);
                        selection.startPaM.oxoPosition.push(0);
                        selection.startPaM.oxoPosition.push(0);
                        selection.startPaM.oxoPosition.push(0);
                        selection.startPaM.oxoPosition.push(0);
                    }

                    var lastPara = this.getParagraphCount() - 1;

                    if (this.isPositionInTable([lastPara])) {
                        var lastRow = this.getLastRowIndexInTable([lastPara]),
                            lastColumn = this.getLastColumnIndexInTable([lastPara]),
                            lastParaInCell = this.getLastParaIndexInCell([lastPara, lastColumn, lastRow]),
                            paraLen = this.getParagraphLength([lastPara, lastColumn, lastRow, lastParaInCell]);

                        selection.endPaM.oxoPosition = [];
                        selection.endPaM.oxoPosition.push(lastPara);
                        selection.endPaM.oxoPosition.push(lastColumn);
                        selection.endPaM.oxoPosition.push(lastRow);
                        selection.endPaM.oxoPosition.push(lastParaInCell);
                        selection.endPaM.oxoPosition.push(paraLen);
                    } else {
                        selection.endPaM.oxoPosition[0] = lastPara;
                        selection.endPaM.oxoPosition[1] = this.getParagraphLength([lastPara]);
                    }
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
                    this.setAttribute('bold', !this.getAttribute('bold'));
                }
                else if (c === 'I') {
                    event.preventDefault();
                    this.setAttribute('italic', !this.getAttribute('italic'));
                }
                else if (c === 'U') {
                    event.preventDefault();
                    this.setAttribute('underline', !this.getAttribute('underline'));
                }
                else if (c === 'xxxxxxx') {
                    event.preventDefault();
                }
            }
            // DEBUG STUFF
            if (this.getParagraphCount() !== editdiv.children().size()) {
                this.implDbgOutInfo('processKeyDown - para count invalid!');
            }
        };

        this.processKeyPressed = function (event) {

            this.implDbgOutEvent(event);
            // this.implCheckSelection();

            this.implCheckEventSelection();
            lastEventSelection = this.getSelection();
            this.implStartCheckEventSelection();

            if (this.isNavigationKeyEvent(lastKeyDownEvent)) {
                // Don't block cursor navigation keys.
                // Use lastKeyDownEvent, because some browsers (eg Chrome) change keyCode to become the charCode in keyPressed
                return;
            }

            var selection = this.getSelection();

            lastEventSelection = _.copy(selection, true);

            selection.adjust();

            /*
            window.console.log('processKeyPressed: keyCode: ' + event.keyCode + ' isNavi: ' + this.isNavigationKeyEvent(event));
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
                    var startPosition = _.copy(selection.startPaM.oxoPosition, true);
                    this.splitParagraph(startPosition);
                    // TODO / TBD: Should all API / Operation calls return the new position?!
                    var lastValue = selection.startPaM.oxoPosition.length - 1;
                    selection.startPaM.oxoPosition[lastValue - 1] += 1;
                    selection.startPaM.oxoPosition[lastValue] = 0;
                    selection.endPaM = _.copy(selection.startPaM, true);
                    event.preventDefault();
                    this.setSelection(selection);
                }
            }

            // Block everything else to be on the save side....
            event.preventDefault();

            // DEBUG STUFF
            if (this.getParagraphCount() !== editdiv.children().size()) {
                this.implDbgOutInfo('processKeyPressed - para count invalid!');
            }

        };

        this.cut = function () {
            // TODO
            this.implDbgOutInfo('NIY: cut()');
        };

        this.copy = function () {
            // TODO
            this.implDbgOutInfo('NIY: copy()');
        };

        this.paste = function () {
            // TODO
            this.implDbgOutInfo('NIY: paste()');
        };

        // HIGH LEVEL EDITOR API which finally results in Operations and creates Undo Actions

        this.deleteSelected = function (_selection) {

            // this.implCheckSelection();
            var selection = _selection || this.getSelection();
            if (selection.hasRange()) {

                undomgr.startGroup();

                selection.adjust();

                var endPosition = _.copy(selection.endPaM.oxoPosition, true),
                    startposLength = selection.startPaM.oxoPosition.length - 1,
                    endposLength = selection.endPaM.oxoPosition.length - 1,
                    isTable = false;

                // 1) delete selected part or rest of para in first para (pos to end)
                if (selection.startPaM.oxoPosition[0] !== selection.endPaM.oxoPosition[0]) {
                    isTable = this.isPositionInTable(selection.startPaM.oxoPosition);
                    endPosition = _.copy(selection.startPaM.oxoPosition);
                    if (isTable) {
                        var localEndPosition = _.copy(endPosition);
                        localEndPosition.pop();
                        this.deleteFollowingParagraphsInCell(localEndPosition);
                        localEndPosition.pop();
                        this.deleteFollowingCellsInTable(localEndPosition);
                    }
                    endPosition[startposLength] = this.getParagraphLength(endPosition);
                }
                this.deleteText(selection.startPaM.oxoPosition, endPosition);


                // 2) delete completly slected paragraphs completely
                for (var i = selection.startPaM.oxoPosition[0] + 1; i < selection.endPaM.oxoPosition[0]; i++) {
                    // startPaM.oxoPosition[0]+1 instead of i, because we always remove a paragraph
                    var startPosition = [];
                    startPosition[0] = selection.startPaM.oxoPosition[0] + 1;
                    isTable = this.isPositionInTable(startPosition);
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

                    isTable = this.isPositionInTable(endPosition);

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

        this.insertParagraph = function (position) {
            var newOperation = {name: OP_PARA_INSERT, start: _.copy(position, true)};
            this.applyOperation(newOperation, true, true);
        };

        this.insertTable = function () {
            var selection = this.getSelection();
            selection.adjust();
            var position = [selection.startPaM.oxoPosition[0]];
            var newOperation = {name: OP_TABLE_INSERT, start: _.copy(position, true)};
            this.applyOperation(newOperation, true, true);
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

        this.setAttribute = function (attr, value, startPosition, endPosition) {

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

                    // 1) selected part or rest of para in first para (pos to end)
                    var startposLength = selection.startPaM.oxoPosition.length - 1,
                        endposLength = selection.endPaM.oxoPosition.length - 1,
                        localendPosition = selection.endPaM.oxoPosition,
                        isTable = this.isPositionInTable(selection.startPaM.oxoPosition);

                    if (selection.startPaM.oxoPosition[0] !== selection.endPaM.oxoPosition[0]) {
                        // TODO: This is not sufficient
                        localendPosition = _.copy(selection.startPaM.oxoPosition, true);
                        if (isTable) {
                            // Assigning attribute to all following paragraphs in this cell and to all following cells!
                            this.setAttributeToFollowingCellsInTable(attr, value, localendPosition);
                            this.setAttributeToFollowingParagraphsInCell(attr, value, localendPosition);
                        }
                        localendPosition[startposLength] = this.getParagraphLength(localendPosition);
                    }
                    this.setAttribute(attr, value, selection.startPaM.oxoPosition, localendPosition);

                    // 2) completly selected paragraphs
                    for (var i = selection.startPaM.oxoPosition[0] + 1; i < selection.endPaM.oxoPosition[0]; i++) {
                        var localstartPosition = []; //_.copy(selection.startPaM.oxoPosition, true);
                        localstartPosition[0] = i;  // Attention: localstartPosition has 5 ints,

                        isTable = this.isPositionInTable(localstartPosition);

                        if (isTable) {
                            this.setAttributeToCompleteTable(attr, value, localstartPosition);
                        } else {
                            localstartPosition[1] = 0;
                            localendPosition = _.copy(localstartPosition, true);
                            localendPosition[1] = this.getParagraphLength(localendPosition);
                            this.setAttribute(attr, value, localstartPosition, localendPosition);
                        }
                    }

                    // 3) selected part in last para
                    if (selection.startPaM.oxoPosition[startposLength - 1] !== selection.endPaM.oxoPosition[endposLength - 1]) {
                        var localstartPosition = _.copy(selection.endPaM.oxoPosition, true);
                        localstartPosition[endposLength - 1] = selection.endPaM.oxoPosition[endposLength - 1];
                        localstartPosition[endposLength] = 0;

                        isTable = this.isPositionInTable(localstartPosition);

                        if (isTable) {
                            // Assigning attribute to all previous cells and to all previous paragraphs in this cell!
                            this.setAttributeToPreviousCellsInTable(attr, value, selection.endPaM.oxoPosition);
                            this.setAttributeToPreviousParagraphsInCell(attr, value, selection.endPaM.oxoPosition);
                        }
                        this.setAttribute(attr, value, localstartPosition, selection.endPaM.oxoPosition);
                    }
                }
            }
            else {
                var newOperation = {name: OP_ATTR_SET, attr: attr, value: value, start: _.copy(startPosition, true), end: _.copy(endPosition, true)};
                this.applyOperation(newOperation, true, true);
            }
        };

        this.getAttribute = function (attr, para, start, end) {
            // TODO
            if (attr === undefined) {
                this.implDbgOutInfo('getAttribute - no attribute specified');
                return;
            }

            // TODO
            if (para === undefined) {
                // Get Attr for selection
                return document.queryCommandState(attr);
            }
            else {
                // TODO
                this.implDbgOutInfo('niy: getAttribute with selection parameter');
                // implGetAttribute( attr, para, start, end );
            }
        };

        this.getParagraphCount = function () {
            return paragraphs.size();
        };

        this.getParagraphLength = function (position) {

            var paraLen = 0,
            localPos = _.copy(position);

            var domPos = this.getDOMPosition(position);
            if (domPos) {
                var node = domPos.node;
                if (node.nodeName !== 'P') {
                    localPos.pop();
                    for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                        if (node.nodeName === 'P') {
                            break;
                        }
                    }
                }

                var paraIndex = localPos.pop();
                var paragraph = $(node.parentNode).children().get(paraIndex);

                if (paragraph) {
                    if (paragraph.hasChildNodes()) {
                        var nodeList = paragraph.childNodes;
                        for (var i = 0; i < nodeList.length; i++) {
                            paraLen += $(nodeList[i]).text().length;
                        }
                    }
                }
            }

            return paraLen;
        };

        this.getParagraphText = function (para, start, end) {

            var text = '';
            var textNodes = [];

            if (start === undefined)
                start = 0;
            if (end === undefined)
                end = 0xFFFF; // don't need correct len, just a very large value

            collectTextNodes(paragraphs[para], textNodes);
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

        // ==================================================================
        // TABLE METHODS
        // ==================================================================

        this.isPositionInTable = function (position) {
            var positionInTable = false,
                domPos = this.getDOMPosition(position);

            if (domPos) {
                var node = domPos.node;

                for (; node && (node !== editdiv.get(0)); node = node.parentNode) {
                    if (node.nodeName === 'TABLE') {
                        positionInTable = true;
                        break;
                    }
                }
            }

            return positionInTable;
        };

        this.getCurrentTable = function (position) {
            var currentTable = null,
                domPos = this.getDOMPosition(position);

            if (domPos) {
                var node = domPos.node;

                for (; node && (node !== editdiv.get(0)); node = node.parentNode) {
                    if (node.nodeName === 'TABLE') {
                        currentTable = node;
                        break;
                    }
                }
            }

            return currentTable;
        };

        this.getAllAdjacentParagraphs = function (position) {
            // position can be paragraph itself or textnode inside it.
            var allParagraphs = [];
            if ((position.length === 1) || (position.length === 2)) {  // only for performance
                allParagraphs = paragraphs;  // should be "rootElements" instead of "paragraphs"
            } else {
                var domPos = this.getDOMPosition(position);
                if (domPos) {
                    var node = domPos.node;
                    if (node.nodeName !== 'P') {
                        for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                            if (node.nodeName === 'P') {
                                break;
                            }
                        }
                    }

                    allParagraphs = $(node.parentNode).children();
                }
            }

            return allParagraphs;
        };

        this.getLastRowIndexInTable = function (position) {
            var rowIndex = null,
                table = this.getCurrentTable(position);

            if (table) {
                rowIndex = $('TR', table).length;
                rowIndex--;
            }

            return rowIndex;
        };

        this.getLastColumnIndexInTable = function (position) {
            var columnIndex = null,
                table = this.getCurrentTable(position);

            if (table) {
                var localrow = $('TR', table).get(0);  // first row
                columnIndex = $('TH, TD', localrow).length;
                columnIndex--;
            }

            return columnIndex;
        };

        this.getLastColumnIndexInRow = function (position) {
            var columnIndex = null,
                table = this.getCurrentTable(position);

            if (table) {
                var localPos = _.copy(position, true);
                var domPos = this.getDOMPosition(position);

                if (domPos) {
                    var node = domPos.node;

                    for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                        if (node.nodeName === 'TR') {
                            break;
                        } else {
                            if ((node.nodeName === 'P') || (node.nodeType === 3)) {
                                localPos.pop();
                            }
                        }
                    }

                    var row = localPos.pop();  // found the correct row
                    var localrow = $('TR', table).get(row);
                    columnIndex = $('TH, TD', localrow).length;
                    columnIndex--;
                }
            }

            return columnIndex;
        };

        this.getRowIndexInTable = function (position) {
            var rowIndex = null,
                isInTable = this.isPositionInTable(position);

            if (isInTable) {
                var localPos = _.copy(position, true);
                var domPos = this.getDOMPosition(position);

                if (domPos) {
                    var node = domPos.node;

                    for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                        if (node.nodeName === 'TR') {
                            break;
                        } else {
                            if ((node.nodeName === 'P') || (node.nodeType === 3)) {
                                localPos.pop();
                            }
                        }
                    }

                    rowIndex = localPos.pop();  // found the correct row
                }
            }

            return rowIndex;
        };

        this.getColumnIndexInRow = function (position) {
            var columnIndex = null,
                isInTable = this.isPositionInTable(position);

            if (isInTable) {
                var localPos = _.copy(position, true);
                var domPos = this.getDOMPosition(position);

                if (domPos) {
                    var node = domPos.node;

                    for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                        if (node.nodeName === 'TR') {
                            break;
                        } else {
                            if ((node.nodeName === 'P') || (node.nodeType === 3)) {
                                localPos.pop();
                            }
                        }
                    }

                    localPos.pop();  // found the correct row
                    columnIndex = localPos.pop();  // found the correct column
                }
            }

            return columnIndex;
        };

        this.getLastParaIndexInCell = function (position) {

            var lastPara = null,
                isInTable = this.isPositionInTable(position),
                foundParagraph = false,
                foundCell = false;


            if (isInTable) {
                var domPos = this.getDOMPosition(position);
                if (domPos) {
                    var node = domPos.node;
                    if (node.nodeName !== 'P') {
                        for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                            if (node.nodeName === 'P') {
                                foundParagraph = true;
                                break;
                            }
                        }
                    } else {
                        foundParagraph = true;
                    }

                    if (foundParagraph) {
                        lastPara = $(node.parentNode).children().length - 1;
                    }

                    if (! foundParagraph) {
                        node = domPos.node;
                        if ((node.nodeName !== 'TH') || (node.nodeName !== 'TD')) {
                            for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                                if ((node.nodeName !== 'TH') || (node.nodeName !== 'TD')) {
                                    foundCell = true;
                                    break;
                                }
                            }
                        } else {
                            foundCell = true;
                        }
                    }

                    if (foundCell) {
                        lastPara = $(node).children().length - 1;
                    }
                }
            }

            return lastPara;
        };

        this.getIndexOfLastParagraphInTablePosition = function (position) {
            var indexOfLastParagraph = null,
                isInTable = this.isPositionInTable(position),
                foundParagraph = false;

            if (isInTable) {
                var localPos = _.copy(position, true);
                var domPos = this.getDOMPosition(position);

                if (domPos) {
                    var node = domPos.node;

                    for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                        if (node.nodeName === 'P') {
                            foundParagraph = true;
                            break;
                        } else {
                            if (node.nodeType === 3) {
                                localPos.pop();
                            }
                        }
                    }

                    if (foundParagraph) {
                        indexOfLastParagraph = localPos.length - 1;  // found the correct paragraph
                    }
                }
            }

            return indexOfLastParagraph;
        };

        this.getIndexOfLastRowInPosition = function (position) {
            var indexOfLastRow = null,
                isInTable = this.isPositionInTable(position),
                foundRow = false;

            if (isInTable) {
                var localPos = _.copy(position, true);
                var domPos = this.getDOMPosition(position);

                if (domPos) {
                    var node = domPos.node;

                    for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                        if (node.nodeName === 'TR') {
                            foundRow = true;
                            break;
                        } else {
                            if ((node.nodeName === 'P') || (node.nodeType === 3)) {
                                localPos.pop();
                            }
                        }
                    }

                    if (foundRow) {
                        indexOfLastRow = localPos.length - 1;  // found the correct row
                    }
                }
            }

            return indexOfLastRow;
        };

        this.getIndexOfLastColumnInPosition = function (position) {
            var indexOfLastColumn = null,
                isInTable = this.isPositionInTable(position),
                foundColumn = false;

            if (isInTable) {
                var localPos = _.copy(position, true);
                var domPos = this.getDOMPosition(position);

                if (domPos) {
                    var node = domPos.node;

                    for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                        if (node.nodeName === 'TR') {
                            foundColumn = true;
                            break;
                        } else {
                            if ((node.nodeName === 'P') || (node.nodeType === 3)) {
                                localPos.pop();
                            }
                        }
                    }

                    if (foundColumn) {
                        localPos.pop();  // position of the row
                        indexOfLastColumn = localPos.length - 1;  // found the correct column
                    }
                }
            }

            return indexOfLastColumn;
        };

        this.getIndexOfLastTableInPosition = function (position) {
            var indexOfLastTable = null,
                isInTable = this.isPositionInTable(position),
                foundTable = false;

            if (isInTable) {
                var localPos = _.copy(position, true);
                var domPos = this.getDOMPosition(position);

                if (domPos) {
                    var node = domPos.node;

                    for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                        if (node.nodeName === 'TR') {
                            foundTable = true;
                            break;
                        } else {
                            if ((node.nodeName === 'P') || (node.nodeType === 3)) {
                                localPos.pop();
                            }
                        }
                    }

                    if (foundTable) {
                        localPos.pop();  // position of the row
                        localPos.pop();  // position of the column
                        indexOfLastTable = localPos.length - 1;  // found the correct table
                    }
                }
            }

            return indexOfLastTable;
        };

        this.getParagraphIndexInCell = function (position) {

            var paraIndex = null,
                isInTable = this.isPositionInTable(position),
                localPos = _.copy(position);

            if (isInTable) {
                var domPos = this.getDOMPosition(position);
                if (domPos) {
                    var node = domPos.node;
                    if (node.nodeName !== 'P') {
                        localPos.pop();
                        for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                            if (node.nodeName === 'P') {
                                break;
                            }
                        }
                    }

                    paraIndex = localPos.pop();
                }
            }

            return paraIndex;
        };

        this.getParagraphFromTableCell = function (position) {

            var paragraph = null,
                isInTable = this.isPositionInTable(position),
                localPos = _.copy(position);

            if (isInTable) {
                var domPos = this.getDOMPosition(position);
                if (domPos) {
                    var node = domPos.node;
                    if (node.nodeName !== 'P') {
                        localPos.pop();
                        for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                            if (node.nodeName === 'P') {
                                break;
                            }
                        }
                    }

                    var paraIndex = localPos.pop();
                    paragraph = $(node.parentNode).children().get(paraIndex);
                }
            }

            return paragraph;
        };

        this.getAllParagraphsFromTableCell = function (position) {
            var allParagraphs = [],
                isInTable = this.isPositionInTable(position);

            if (isInTable) {
                var domPos = this.getDOMPosition(position);
                if (domPos) {
                    var node = domPos.node;
                    if (node.nodeName !== 'P') {
                        for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                            if (node.nodeName === 'P') {
                                break;
                            }
                        }
                    }

                    allParagraphs = $(node.parentNode).children();
                }
            }

            return allParagraphs;
        };

        this.deletePreviousCellsInTable = function (position) {

            var localPos = _.copy(position, true),
                isInTable = this.isPositionInTable(localPos);

            if (isInTable) {

                var rowIndex = this.getIndexOfLastRowInPosition(localPos),
                    columnIndex = rowIndex - 1,
                    thisRow = localPos[rowIndex],
                    thisColumn = localPos[columnIndex],
                    lastColumn = this.getLastColumnIndexInTable(localPos);

                for (var j = 0; j <= thisRow; j++) {
                    var max = lastColumn;
                    if (j === thisRow) {
                        max = thisColumn - 1;
                    }
                    for (var i = 0; i <= max; i++) {
                        localPos[columnIndex] = i;  // column
                        localPos[rowIndex] = j;   // row
                        localPos[rowIndex + 1] = 0;
                        localPos[rowIndex + 2] = 0;
                        this.deleteAllParagraphsInCell(localPos);
                    }
                }
            }
        };

        this.deleteAllParagraphsInCell = function (position) {

            var localPos = _.copy(position, true),
                isInTable = this.isPositionInTable(localPos);

            if (isInTable) {

                var rowIndex = this.getIndexOfLastRowInPosition(localPos),
                    lastParaInCell = this.getLastParaIndexInCell(localPos);

                localPos[rowIndex + 1] = 0;

                for (var i = 0; i <= lastParaInCell; i++) {
                    // this.deleteParagraph(localPos);
                    this.implDeleteParagraph(localPos);
                }
            }
        };

        this.deletePreviousParagraphsInCell = function (position) {

            var localPos = _.copy(position, true),
                isInTable = this.isPositionInTable(localPos);

            if (isInTable) {

                var paraIndex = this.getIndexOfLastParagraphInTablePosition(localPos),
                    lastPara =  localPos[paraIndex];

                localPos[paraIndex] = 0; // always 0, because paragraphs are deleted

                for (var i = 0; i < lastPara; i++) {
                    // this.deleteParagraph(localPos);
                    this.implDeleteParagraph(localPos);
                }
            }
        };

        this.deleteFollowingCellsInTable = function (position) {

            var localPos = _.copy(position, true),
                isInTable = this.isPositionInTable(localPos);

            if (isInTable) {

                var rowIndex = this.getIndexOfLastRowInPosition(localPos),
                    columnIndex = rowIndex - 1,
                    thisRow = localPos[rowIndex],
                    thisColumn = localPos[columnIndex],
                    lastRow = this.getLastRowIndexInTable(position),
                    lastColumn = this.getLastColumnIndexInTable(position);

                for (var j = thisRow; j <= lastRow; j++) {
                    var min = 0;
                    if (j === thisRow) {
                        min = thisColumn + 1;
                    }

                    for (var i = min; i <= lastColumn; i++) {
                        localPos[columnIndex] = i;  // column
                        localPos[rowIndex] = j;  // row
                        // localPos[rowIndex + 1] = 0;
                        // localPos[rowIndex + 2] = 0;
                        this.deleteAllParagraphsInCell(localPos);
                    }
                }
            }
        };

        this.deleteFollowingParagraphsInCell = function (position) {

            var localPos = _.copy(position, true),
                isInTable = this.isPositionInTable(localPos);

            if (isInTable) {

                var paraIndex = this.getIndexOfLastParagraphInTablePosition(localPos),
                    startPara = localPos[paraIndex] + 1,
                    lastPara =  this.getLastParaIndexInCell(localPos);

                localPos[paraIndex] = startPara; // always 'startPara', because paragraphs are deleted

                for (var i = startPara; i <= lastPara; i++) {
                    // this.deleteParagraph(localPos);
                    this.implDeleteParagraph(localPos);
                }
            }
        };

        this.setAttributeToPreviousCellsInTable = function (attr, value, position) {

            var localPos = _.copy(position, true),
                isInTable = this.isPositionInTable(localPos);

            if (isInTable) {

                var paraIndex = this.getIndexOfLastParagraphInTablePosition(localPos),
                    rowIndex = paraIndex - 1,
                    columnIndex = rowIndex - 1,
                    thisRow = localPos[rowIndex],
                    thisColumn = localPos[columnIndex],
                    lastColumn = this.getLastColumnIndexInTable(localPos);

                for (var j = 0; j <= thisRow; j++) {
                    var max = lastColumn;
                    if (j === thisRow) {
                        max = thisColumn - 1;
                    }
                    for (var i = 0; i <= max; i++) {
                        localPos[columnIndex] = i;  // column
                        localPos[rowIndex] = j;   // row
                        localPos[paraIndex] = 0;
                        localPos[paraIndex + 1] = 0;
                        this.setAttributeToCompleteCell(attr, value, localPos);
                    }
                }
            }
        };

        this.setAttributeToFollowingCellsInTable = function (attr, value, position) {

            var localPos = _.copy(position, true),
                isInTable = this.isPositionInTable(localPos);

            if (isInTable) {
                var rowIndex = this.getIndexOfLastRowInPosition(localPos),
                columnIndex = rowIndex - 1,
                thisRow = localPos[rowIndex],
                thisColumn = localPos[rowIndex - 1],
                lastRow = this.getLastRowIndexInTable(position),
                lastColumn = this.getLastColumnIndexInTable(position);

                for (var j = thisRow; j <= lastRow; j++) {
                    var min = 0;
                    if (j === thisRow) {
                        min = thisColumn + 1;
                    }
                    for (var i = min; i <= lastColumn; i++) {
                        localPos[columnIndex] = i;  // column
                        localPos[rowIndex] = j;  // row
                        localPos[rowIndex + 1] = 0;
                        localPos[rowIndex + 2] = 0;
                        this.setAttributeToCompleteCell(attr, value, localPos);
                    }
                }
            }
        };

        this.setAttributeToPreviousParagraphsInCell = function (attr, value, position) {

            var localPos = _.copy(position, true),
                isInTable = this.isPositionInTable(localPos);

            if (isInTable) {

                var paraIndex = this.getIndexOfLastParagraphInTablePosition(localPos),
                    thisPara = localPos[paraIndex];

                for (var i = 0; i < thisPara; i++) {
                    localPos[paraIndex] = i;
                    this.setAttributeToParagraphInCell(attr, value, localPos);
                }
            }
        };

        this.setAttributeToFollowingParagraphsInCell = function (attr, value, position) {

            var localPos = _.copy(position, true),
                isInTable = this.isPositionInTable(localPos);

            if (isInTable) {

                var paraIndex = this.getIndexOfLastParagraphInTablePosition(localPos),
                    startPara = localPos[paraIndex] + 1,
                    lastPara =  this.getLastParaIndexInCell(position);

                for (var i = startPara; i <= lastPara; i++) {
                    localPos[paraIndex] = i;
                    this.setAttributeToParagraphInCell(attr, value, localPos);
                }
            }
        };

        this.setAttributeToCompleteTable = function (attr, value, position) {

            var localPos = _.copy(position),
                tableIndex = this.getIndexOfLastTableInPosition(localPos),
                localPos = [];

            for (var i = 0; i <= tableIndex; i++) {
                localPos[i] = position[i];
            }

            localPos.push(0); // column

            var columnIndex = localPos.length - 1,
                rowIndex = columnIndex + 1;

            localPos.push(0); // row
            localPos.push(0); // paragraph
            localPos.push(0); // position

            var lastRow = this.getLastRowIndexInTable(position),
                lastColumn = this.getLastColumnIndexInTable(position);

            for (var j = 0; j <= lastRow; j++) {
                for (var i = 0; i <= lastColumn; i++) {
                    localPos[columnIndex] = i;  // column
                    localPos[rowIndex] = j;  // row
                    this.setAttributeToCompleteCell(attr, value, localPos);
                }
            }
        };

        this.setAttributeToCompleteCell = function (attr, value, position) {

            var localPos = _.copy(position, true),
                isInTable = this.isPositionInTable(localPos);

            if (isInTable) {

                var paraIndex = this.getIndexOfLastParagraphInTablePosition(localPos),
                    lastPara = this.getLastParaIndexInCell(localPos);

                localPos[paraIndex + 1] = 0;

                for (var i = 0; i <= lastPara; i++) {
                    localPos[paraIndex] = i;
                    this.setAttributeToParagraphInCell(attr, value, localPos);
                }
            }
        };

        this.setAttributeToParagraphInCell = function (attr, value, position) {

            var startPosition = _.copy(position, true),
                endPosition = _.copy(position, true),
                isInTable = this.isPositionInTable(startPosition);

            if (isInTable) {
                var paraIndex = this.getIndexOfLastParagraphInTablePosition(startPosition);

                startPosition[paraIndex + 1] = 0;
                endPosition[paraIndex + 1] = this.getParagraphLength(position);

                this.setAttribute(attr, value, startPosition, endPosition);
            }
        };

        // ==================================================================
        // IMPL METHODS
        // ==================================================================

        this.implParagraphChanged = function (para) {

            // Make sure that a completly empty para has the dummy br element, and that all others don't have it anymore...

            var paragraph = null;
            if (this.isPositionInTable([para])) {
                return; // do nothing for tables
                // paragraph = this.getParagraphFromTableCell(para);
            } else {
                paragraph = paragraphs[para];
            }

            // var paragraph = paragraphs[para];

            if (!hasTextContent(paragraph)) {
                // We need an empty text node and a br
                if (!paragraph.lastChild || !paragraph.lastChild.dummyBR) {
                    paragraph.appendChild(document.createTextNode(''));
                    var dummyBR = document.createElement('br');
                    dummyBR.dummyBR = true;
                    paragraph.appendChild(dummyBR);
                }
            }
            else {
                // only keep it when inserted by the user
                if (paragraph.lastChild.dummyBR) {
                    paragraph.removeChild(paragraph.lastChild);
                }

                // Browser show multiple spaces in a row as single space, and space at paragraph end is problematic for selection...
                var textNodes = [];
                var localParagraph = null;
                if (this.isPositionInTable(para)) {
                    localParagraph = this.getParagraphFromTableCell(para);
                } else {
                    localParagraph = paragraphs[para];
                }
                collectTextNodes(localParagraph, textNodes);
                var nNode, nChar;
                var currChar = 0, prevChar = 0;
                var node, nodes = textNodes.length;
                for (nNode = 0; nNode < nodes; nNode++) {

                    node = textNodes[nNode];

                    if (!node.nodeValue.length)
                        continue;

                    // this.implDbgOutInfo(node.nodeValue, true);
                    for (nChar = 0; nChar < node.nodeValue.length; nChar++) {
                        currChar = node.nodeValue.charCodeAt(nChar);
                        if ((currChar === charcodeSPACE) && (prevChar === charcodeSPACE)) { // Space - make sure there is no space before
                            currChar = charcodeNBSP;
                            node.nodeValue = node.nodeValue.slice(0, nChar) + String.fromCharCode(currChar) + node.nodeValue.slice(nChar + 1);
                        }
                        else if ((currChar === charcodeNBSP) && (prevChar !== charcodeSPACE)) { // NBSP not needed (until we support them for doc content, then we need to flag them somehow)
                            currChar = charcodeSPACE;
                            node.nodeValue = node.nodeValue.slice(0, nChar) + String.fromCharCode(currChar) + node.nodeValue.slice(nChar + 1);
                        }
                        prevChar = currChar;
                    }
                    // this.implDbgOutInfo(node.nodeValue, true);
                }

                if (prevChar === charcodeSPACE) { // SPACE hat para end is a problem in some browsers
                    // this.implDbgOutInfo(node.nodeValue, true);
                    currChar = charcodeNBSP;
                    node.nodeValue = node.nodeValue.slice(0, node.nodeValue.length - 1) + String.fromCharCode(currChar);
                    // this.implDbgOutInfo(node.nodeValue, true);
                }

                // TODO: Adjust tabs, ...
            }

        };

        this.implSetDOMSelection = function (startnode, startpos, endnode, endpos) {
            var range = window.document.createRange();
            range.setStart(startnode, startpos);
            range.setEnd(endnode, endpos);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        };

        this.implGetCurrentDOMSelection = function () {
            // DOMSelection consists of Node and Offset for startpoint and for endpoint
            var windowSel = window.getSelection();
            var startPaM = new DOMPaM(windowSel.anchorNode, windowSel.anchorOffset);
            var endPaM = new DOMPaM(windowSel.focusNode, windowSel.focusOffset);
            var domSelection = new DOMSelection(startPaM, endPaM);

            return domSelection;
        };

        /* This didn't work - browser doesn't accept the corrected selection, is changing it again immediatly...
        this.implCheckSelection = function () {
            var node;
            var windowSel = window.getSelection();
            if ((windowSel.anchorNode.nodeType !== 3) || (windowSel.focusNode.nodeType !== 3)) {

                this.implDbgOutInfo('warning: invalid selection');

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
            this.implParagraphChanged(0);
            this.setSelection(new OXOSelection());
            lastOperationEnd = new OXOPaM([0, 0]);
            this.clearUndo();
        };

        this.implInsertText = function (text, position) {
            // -1 not allowed here - but code need to be robust
            var posLength = position.length - 1,
                para = position[posLength - 1],
                allParagraphs = this.getAllAdjacentParagraphs(position);

            if ((para < 0) || (para >= allParagraphs.size())) {
                this.implDbgOutInfo('error: invalid para pos in implInsertText (' + para + ', maximum: ' + allParagraphs.size() + ')');
                para = allParagraphs.size() - 1;
                // return;
            }

            var domPos = this.getDOMPosition(position);
            var oldText = domPos.node.nodeValue;
            var newText = oldText.slice(0, domPos.offset) + text + oldText.slice(domPos.offset);
            domPos.node.nodeValue = newText;
            var lastPos = _.copy(position);
            lastPos[posLength] = position[posLength] + text.length;
            lastOperationEnd = new OXOPaM(lastPos);
            this.implParagraphChanged(para);  // tables?
        };

        this.implSetAttribute = function (attr, value, startposition, endposition) {

            // The right thing to do is DOM manipulation, take care for correctly terminating/starting attributes.
            // See also http://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#set-the-selection%27s-value

            // Alternative: Simply span new atributes. Results in ugly HTML, but the operations that we record are correct,
            // and we don't care too much for the current/temporary HTML in this editor.
            // It will not negativly unfluence the resulting document.

            var startposLength = startposition.length - 1,
                endposLength = endposition.length - 1,
                para = startposition[startposLength - 1],
                start = startposition[startposLength],
                end = endposition[endposLength];

            if (textMode === OXOEditor.TextMode.PLAIN) {
                return;
            }
            if ((start === undefined) || (start === -1)) {
                start = 0;
            }
            if ((end === undefined) || (end === -1)) {
                end = this.getParagraphLength(startposition);
            }

            // HACK
            var oldselection = this.getSelection();
            // DR: works without focus
            //this.grabFocus(); // this is really ugly, but execCommand only works when having the focus. Can we restore the focus in case we didn't have it???
            var startPos = _.copy(startposition);
            startPos[startposLength] = start;
            var endPos = _.copy(endposition);
            endPos[endposLength] = end;
            this.setSelection(new OXOSelection(new OXOPaM(startPos), new OXOPaM(endPos)));
            // This will only work if the editor has the focus. Grabbing it would be ugly, can't restore.
            // But anyway, it's just a hack, and in the future we need to do the DOM manipulations on our own...
            // The boolean formatting attributes (e.g. bold/italic/underline) do always toggle, they
            // cannot be set or cleared explicitly. Therefore, first check if anything needs to be done.
            // Note that document.queryCommandState() returns false for mixed formatting, but execCommand()
            // will set the formatting in this case too.
            if (typeof value === 'boolean') {
                if (document.queryCommandState(attr) !== value) {
                    document.execCommand(attr, false, null);
                }
            } else {
                document.execCommand(attr, false, value);
            }

            if (oldselection !== undefined) {
                oldselection.adjust(); // FireFox can't restore selection if end < start
                this.setSelection(oldselection);
            }

            lastOperationEnd = new OXOPaM(endPos);
        };

        this.implInsertParagraph = function (position) {
            var posLength = position.length - 1,
                para = position[posLength],
                allParagraphs = this.getAllAdjacentParagraphs(position),
                isTable = this.isPositionInTable(position) ? true : false;

            var newPara = document.createElement('p');
            newPara = $(newPara);

            if (para === -1) {
                para = allParagraphs.size();
            }

            if (para > 0) {
                newPara.insertAfter(allParagraphs[para - 1]);
            }
            else {
                newPara.insertBefore(allParagraphs[0]);
            }

            if (! isTable) {
                paragraphs = editdiv.children();
            }

            var lastPos = _.copy(position);
            lastPos.push(0);
            lastOperationEnd = new OXOPaM(lastPos);
            this.implParagraphChanged(para);  // for table?
        };

        this.implInsertTable = function (position) {
            var para = position[0];
            // var newPara = document.createElement('table');
            var newPara = $('<table>');

            newPara.attr('border', '4').attr('cellspacing', '10').attr('cellpadding', '20').attr('width', '80%')
            .append($('<tbody>'))
            // .append($('<colgroup>')
            //     .append($('<col>').attr('width', '40%'))
            //     .append($('<col>').attr('width', '30%'))
            //     .append($('<col>').attr('width', '30%')))
            // .append('<colgroup><col width="40%"><col width="30%"><col width="30%"></colgroup>')

            .append($('<tr>').attr('valign', 'top')
                .append($('<td><p>&nbsp;</p></td>'))
                .append($('<td><p>&nbsp;</p></td>'))
                .append($('<td><p>&nbsp;</p></td>')))
            .append($('<tr>').attr('valign', 'top')
                .append($('<td><p>&nbsp;</p></td>'))
                .append($('<td><p>&nbsp;</p></td>'))
                .append($('<td><p>&nbsp;</p></td>')))
            .append($('<tr>').attr('valign', 'top')
                .append($('<td><p>&nbsp;</p></td>'))
                .append($('<td><p>&nbsp;</p></td>'))
                .append($('<td><p>&nbsp;</p></td>')))
            .append($('<tr>').attr('valign', 'top')
                .append($('<td><p>&nbsp;</p></td>'))
                .append($('<td><p>&nbsp;</p></td>'))
                .append($('<td><p>&nbsp;</p></td>')));

            if (para === -1) {
                para = paragraphs.size();
            }

            if (para > 0) {
                newPara.insertAfter(paragraphs[para - 1]);
            }
            else {
                newPara.insertBefore(paragraphs[0]);
            }

            paragraphs = editdiv.children();
            blockOperationNotifications = true;  // test table does not work in second editor.

            lastOperationEnd = new OXOPaM([para, 0]);  // table?

        };

        this.implSplitParagraph = function (position) {

            var posLength = position.length - 1,
                para = position[posLength - 1],
                pos = position[posLength],
                allParagraphs = this.getAllAdjacentParagraphs(position),
                isTable = this.isPositionInTable(position) ? true : false;

            var dbg_oldparacount = allParagraphs.size();
            var paraclone = $(allParagraphs[para]).clone();
            paraclone.insertAfter(allParagraphs[para]);

            // refresh
            if (! isTable) {
                paragraphs = editdiv.children();
            }

            allParagraphs = this.getAllAdjacentParagraphs(position);

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

            this.implParagraphChanged(para);  // for tables?
            this.implParagraphChanged(para + 1);  // for tables?
            lastOperationEnd = new OXOPaM(startPosition);

            // DEBUG STUFF
            if (paragraphs.size() !== (dbg_oldparacount + 1)) {
                this.implDbgOutInfo('implSplitParagraph - para count invalid!');
            }
        };

        this.implMergeParagraph = function (position) {

            var posLength = position.length - 1,
                para = position[posLength];

            position.push(0); // adding pos to position temporarely

            var allParagraphs = this.getAllAdjacentParagraphs(position);

            position.pop();

            if (para < (allParagraphs.size() - 1)) {

                var dbg_oldparacount = allParagraphs.size();

                var thisPara = allParagraphs[para];
                var nextPara = allParagraphs[para + 1];

                var oldParaLen = 0;
                oldParaLen = this.getParagraphLength(position);

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
                this.implParagraphChanged(para);   // for tables?

                // DEBUG STUFF
                if (paragraphs.size() !== (dbg_oldparacount - 1)) {
                    this.implDbgOutInfo('implMergeParagraph - para count invalid!');
                }
            }
        };

        this.implDeleteParagraph = function (position) {

            var posLength = position.length - 1,
                para = position[posLength];

            position.push(0); // adding pos to position temporarely

            var allParagraphs = this.getAllAdjacentParagraphs(position),
                isTable = this.isPositionInTable(position);

            position.pop();

            var paragraph = allParagraphs[para];
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
        };

        this.implDeleteTable = function (position) {

            var para = position[0],
                lastRow = this.getLastRowIndexInTable(position),
                lastColumn = this.getLastColumnIndexInTable(position);

            // iterating over all cells and remove all paragraphs in the cells
            for (var i = 0; i <= lastColumn; i++) {
                for (var j = 0; j <= lastRow; j++) {
                    var localPos = [];
                    localPos.push(para);
                    localPos.push(i);
                    localPos.push(j);
                    localPos.push(0);
                    localPos.push(0);
                    this.deleteAllParagraphsInCell(localPos);
                }
            }

            // Finally removing the table itself
            var paragraph = paragraphs[para];
            paragraph.parentNode.removeChild(paragraph);

            var localPos = _.copy(position, true);
            if (para > 0) {
                para -= 1;
            }
            localPos[0] = para;
            localPos.push(0); // pos not corrct, but doesn't matter. Deleting paragraphs always happens between other operations, never at the last one.
            lastOperationEnd = new OXOPaM(localPos);
            paragraphs = editdiv.children();
        };

        this.implDeleteText = function (startPosition, endPosition) {

            var lastValue = startPosition.length - 1;
            var para = startPosition[0];
            var start = startPosition[lastValue];
            var end = endPosition[lastValue];

            if (end === -1) {
                end = this.getParagraphLength(startPosition);
            }

            if (start === end) {
                return;
            }

            var textNodes = [];
            var oneParagraph = null;
            if (this.isPositionInTable(startPosition)) {
                oneParagraph = this.getParagraphFromTableCell(startPosition);
            } else {
                oneParagraph = paragraphs[para];
            }
            collectTextNodes(oneParagraph, textNodes);
            var node, nodeLen, delStart, delEnd;
            var nodes = textNodes.length;
            var nodeStart = 0;
            for (var i = 0; i < nodes; i++) {
                node = textNodes[i];
                nodeLen = node.nodeValue.length;
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
                        node.nodeValue = '';
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

            this.implParagraphChanged(para);
        };

        this.implDbgOutEvent = function (event) {

            if (!dbgoutEvents)
                return;

            var selection = this.getSelection();

            var dbg = fillstr(event.type, 10, ' ', true) + ' sel:[' + getFormattedPositionString(selection.startPaM.oxoPosition) + '/' + getFormattedPositionString(selection.endPaM.oxoPosition) + ']';

            if ((event.type === "keypress") || (event.type === "keydown")) {
                dbg += ' key:[keyCode=' + fillstr(event.keyCode.toString(), 3, '0') + ' charCode=' + fillstr(event.charCode.toString(), 3, '0') + ' shift=' + event.shiftKey + ' ctrl=' + event.ctrlKey + ' alt=' + event.altKey + ']';
            }

            window.console.log(dbg);
        };

        this.implDbgOutObject = function (obj) {

            if (!dbgoutObjects)
                return;

            var dbg = fillstr(obj.type + ': ', 10, ' ', true) + JSON.stringify(obj.value);
            window.console.log(dbg);
        };

        this.implDbgOutInfo = function (str, showStrCodePoints) {

            if (!dbgoutInfos)
                return;

            var msg = str;

            if (showStrCodePoints) {
                msg = msg + ' (' + str.length + ' code points: ';
                for (var i = 0; i < str.length; i++) {
                    msg = msg + '[' + str.charCodeAt(i) + ']';
                }
            }

            window.console.log(msg);
        };

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
            .on('contextmenu', $.proxy(this, 'processContextMenu'));

    } // end of OXOEditor()

    // static constants, used as map keys, and as CSS class names
    OXOEditor.TextMode = {
        RICH: 'rich',
        PLAIN: 'plain'
    };

    // DEBUG FUNCTIONS
    function dbgOutError(str) {

        // if (!dbgoutErrors)
        //    return;

        window.console.log(str);
    }


    // exports ================================================================

    return OXOEditor;
});
