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
     'io.ox/office/editor/selection',
     'io.ox/office/editor/attributes'
    ], function (Events, Utils, Selection, Attributes) {

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

    function hasTextNode(element) {
        for (var child = element.firstChild; child !== null; child = child.nextSibling) {
            if (child.nodeType === 3) {
                return true;
            }
            else if (child.nodeType === 1)
                return hasTextNode(child);
        }
        return false;
    }

    function getFirstTextNode(element) {
        if (element) {
            for (var child = element.firstChild; child !== null; child = child.nextSibling) {
                if (child.nodeType === 3) {
                    return child;
                }
                else if (hasTextNode(child)) {
                    return getFirstTextNode(child);
                }
            }
        }
        return element;
    }

    function getLastTextNode(element) {
        if (element) {
            for (var child = element.lastChild; child !== null; child = child.previousSibling) {
                if (child.nodeType === 3) {
                    return child;
                }
                else if (hasTextNode(child)) {
                    return getLastTextNode(child);
                }
            }
        }
        return element;
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
                implSetAttribute(operation.attr, operation.value, operation.start, operation.end);
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

        this.getTextNodeFromCurrentNode = function (node, offset) {

            var useFirstTextNode = true,  // can be false for final child in a paragraph
                localNode = node.childNodes[offset]; // offset can be zero for start points but too high for end points

            if (! localNode) {
                localNode = node.childNodes[offset - 1];
                useFirstTextNode = false;
            }

            var textNode = useFirstTextNode ? getFirstTextNode(localNode) : getLastTextNode(localNode);

            if (! textNode) {
                dbgOutError("ERROR: Failed to determine text node from current node! (useFirstTextNode: " + useFirstTextNode + ")");
                return;
            }

            if (textNode.nodeType !== 3) {
                if (textNode.nodeName === 'BR') {
                    textNode = textNode.previousSibling;  // Special handling for <BR> in empty paragraphs.
                }
                if ((! textNode) || (textNode.nodeType !== 3)) {
                    dbgOutError("ERROR: Failed to determine text node from current node! NodeType must be 3, but it is: " + textNode.nodeType + "(" + textNode.nodeName + ")");
                    return;
                }
            }

            var offset = useFirstTextNode ? 0 : textNode.nodeValue.length;

            return {node: textNode, offset: offset};
        };

        this.getOXOPosition = function (position) {

            var node = position.node,
                offset = position.offset;

            // check input values
            if (! node) {
                this.implDbgOutInfo('getOXOPosition: Invalid DOM position. Node not defined');
                return;
            }

            // Sometimes (double click in FireFox) a complete paragraph is selected with DIV + Offset 3 and DIV + Offset 4.
            // These DIVs need to be converted to the correct paragraph first.
            // Also cells in columns have to be converted at this point.
            if ((node.nodeName === 'DIV') || (node.nodeName === 'P') || (node.nodeName === 'TR') || (node.nodeName === 'TD') || (node.nodeName === 'TH')) {

                var newNode = this.getTextNodeFromCurrentNode(node, offset);
                if (newNode) {
                    node = newNode.node;
                    offset = newNode.offset;
                } else {
                    this.implDbgOutInfo('getOXOPosition: Failed to determine text node from node: ' + node.nodeName + " with offset: " + offset);
                    return;
                }
            }

            // Checking offset for text nodes
            if (node.nodeType === 3) {
                if (! _.isNumber(offset)) {
                    this.implDbgOutInfo('getOXOPosition: Invalid start position. NodeType is 3, but offset is not defined!');
                    return;
                }
            }

            if (offset < 0) {
                this.implDbgOutInfo('getOXOPosition: Invalid DOM position. Offset < 0 : ' + offset + ' . Node: ' + node.nodeName + ',' + node.nodeType);
                return;
            }

            // Check, if the selected node is a descendant of "this.editdiv"
            var editorDiv = editdiv.has(node).get(0);

            if (!editorDiv) { // range not in text area
                this.implDbgOutInfo('getOXOPosition: Invalid DOM position. It is not part of the editor DIV: !' + ' Offset : ' + offset + ' . Node: ' + node.nodeName + ',' + node.nodeType);
                return;
            }

            // Checking node in root elements
            if (paragraphs.has(node).length === 0) {
                this.implDbgOutInfo('getOXOPosition: Invalid DOM position. It is not included in the top level elements of the editor DIV!' + ' Offset : ' + offset + ' . Node: ' + node.nodeName + ',' + node.nodeType);
                return;
            }

            // Calculating the position inside the editdiv.
            var oxoPosition = [],
                evaluateOffset = (node.nodeType === 3) ? true : false,  // Is evaluation of offset required?
                offsetEvaluated = false,
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
                    oxoPosition.unshift($(node).prevAll().length);  // zero based
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
                this.implDbgOutInfo('getOXOPosition: Warning: Offset ' + offset + ' was not evaluated, although nodeType is 3! Calculated oxoPosition: ' + oxoPosition);
            }

            return new OXOPaM(oxoPosition);
        };

        this.getDOMPosition = function (oxoPosition) {

            var oxoPos = _.copy(oxoPosition, true),
            node = null,
            offset = null;

            if (oxoPosition === undefined) {
                // this.implDbgOutInfo('getDOMPosition: oxoPosition is undefined!');
                return;
            }

            if (oxoPos[0] === undefined) {
                // this.implDbgOutInfo('getDOMPosition: Position is undefined!');
                return;
            }

            while (oxoPos.length > 0) {

                var returnObj = this.getNextChildNode(node, oxoPos.shift());

                if (returnObj.node) {
                    node = returnObj.node;
                    if (returnObj.offset) {
                        offset = returnObj.offset;
                    }
                } else {
                    this.implDbgOutInfo('getDOMPosition: Warning: Failed to determine child node for node: ' + node.nodeName);
                    return;
                }
            }

            return { node: node, offset: offset };
        };

        this.getNextChildNode = function (node, pos) {

            var childNode,
                offset;

            if (! node) {
                if (pos > paragraphs.length - 1) {
                    this.implDbgOutInfo('getNextChildNode: Warning: Paragraph ' + pos + ' is out of range. Last paragraph: ' + paragraphs.length - 1);
                    return;
                }
                childNode = paragraphs.get(pos);
            } else if (node.nodeName === 'TABLE') {
                childNode = $('> TBODY > TR, > THEAD > TR', node).get(pos);
            } else if (node.nodeName === 'TR') {
                childNode = $('> TH, > TD', node).get(pos);  // this is a table cell
            } else if ((node.nodeName === 'TH') || (node.nodeName === 'TD')) {
                childNode = $(node).children().get(pos);
            } else if (node.nodeName === 'P') {
                var textLength = 0;
                var bFound = false;

                // Checking if this paragraph has children
                if (! node.hasChildNodes()) {
                    this.implDbgOutInfo('getNextChildNode: Warning: Paragraph is empty');
                    return;
                }

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
                    this.implDbgOutInfo('getNextChildNode: Warning: Paragraph does not contain position: ' + pos + '. Last position: ' + textLength);
                    return;
                }

                childNode = node;
                offset = pos - textLength;

            } else {
                this.implDbgOutInfo('getNextChildNode: Warning: Unknown node: ' + node.nodeName);
                return;
            }

            return { node: childNode, offset: offset };
        };

        this.getDOMSelection = function (oxoSelection) {

            // Only supporting single selection at the moment
            var start = this.getDOMPosition(oxoSelection.startPaM.oxoPosition),
                end = this.getDOMPosition(oxoSelection.endPaM.oxoPosition);

            // DOM selection is always an array of text ranges
            // TODO: fallback to HOME position in document instead of empty array?
            return (start && end) ? [{ start: start, end: end }] : [];
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
                    var cell = this.getDOMPosition(position);
                    if (cell && ((cell.node.nodeName === 'TD') || (cell.node.nodeName === 'TH'))) {
                        var node = cell.node.parentNode;
                        var offset = $(cell.node).prevAll().length;
                        ranges.push({ start: { node: node, offset: offset }, end: { node: node, offset: offset + 1 } });
                    }
                }
            }

            return ranges;
        };

        this.initDocument = function () {
            var newOperation = { name: 'initDocument' };
            this.applyOperation(newOperation, true, true);
        };

        this.getSelection = function (updateFromBrowser) {

            if (currentSelection && !updateFromBrowser)
                return currentSelection;

            var domSelection = Selection.getBrowserSelection(editdiv),
                domRange = null;

            if (domSelection.length) {
                domRange = _(domSelection).last();

                // allowing "special" multiselection for tables (rectangle cell selection)
                if (domRange.start.node.nodeName === 'TR') {
                    domRange.start = _(domSelection).first().start;
                }

                currentSelection = new OXOSelection(this.getOXOPosition(domRange.start), this.getOXOPosition(domRange.end));

                // this selection need to be changed for some browsers to set selection into end of text node instead
                // of start of following text node.
                if ((! currentSelection.hasRange()) && (domRange.start.node.nodeType === 3) && (domRange.start.offset === 0)) {
                    this.setSelection(currentSelection);
                }

                return  _.copy(currentSelection, true);
            }
        };

        this.setSelection = function (oxosel) {

            if (oxosel.hasRange() && (this.isFirstPositionInTableCell(oxosel.endPaM.oxoPosition))) {
                oxosel.endPaM.oxoPosition.pop();
                var returnObj = this.getLastPositionInPrevCell(oxosel.endPaM.oxoPosition);
                oxosel.endPaM.oxoPosition = returnObj.position;
            }

            var ranges = [];

            currentSelection = _.copy(oxosel, true);

            // Multi selection for rectangle cell selection in Firefox.
            if (oxosel.hasRange() && (this.isCellSelection(oxosel.startPaM.oxoPosition, oxosel.endPaM.oxoPosition))) {
                ranges = this.getCellDOMSelections(oxosel);
            } else {
                // var oldSelection = this.getSelection();
                ranges = this.getDOMSelection(oxosel);
            }

            if (ranges.length) {
                Selection.setBrowserSelection(ranges);
                // if (TODO: Compare Arrays oldSelection, oxosel)
                this.trigger('selectionChanged');   // when setSelection() is called, it's very likely that the selection actually did change. If it didn't - that normally shouldn't matter.
            } else {
                dbgOutError("ERROR: Failed to determine DOM Selection from OXO Selection: " + oxosel.startPaM.oxoPosition + " : " + oxosel.endPaM.oxoPosition);
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
         * Searches the passed text in the entire document, and selects the
         * first occurence.
         *
         * @param {String} query
         *  The text that will be searched in the document.
         */
        this.search = function (query) {

            // check input parameter
            if (!_.isString(query) || !query.length) {
                return;
            }

            // Search in all paragraphs (also in tables, TODO: other elements, e.g. headers, ...?).
            // _.find() exits if the callback function returns true, use this to escape from the loop.
            _(editdiv.find('p')).find(function (element) {

                var // the concatenated text from all text nodes
                    elementText = $(element).text().replace(/\s/g, ' ').toLowerCase(),
                    // first index of query text
                    textPos = elementText.indexOf(query.toLowerCase()),
                    // the DOM text range containing the query text
                    range = {};

                // non-negative position: query text exists in the element
                if (textPos >= 0) {

                    // visit all text nodes in the element
                    Utils.iterateDescendantNodes(element, function (node) {

                        var // the text in the current text node
                            text = null;

                        // filter text nodes
                        if (node.nodeType === 3) {
                            text = node.nodeValue;

                            // test if text node contains the first character of the query text
                            if ((0 <= textPos) && (textPos < text.length)) {
                                range.start = { node: node, offset: textPos };
                            }

                            // test if text node contains the last character of the query text
                            if (textPos + query.length <= text.length) {
                                range.end = { node: node, offset: textPos + query.length };
                                return false;
                            }

                            // skip this text node
                            textPos -= text.length;
                        }
                    }, this);

                    // position found, select it
                    if (range.start && range.end) {
                        this.grabFocus();
                        Selection.setBrowserSelection(range);
                        currentSelection = null;
                        this.implStartCheckEventSelection();
                    }

                    // return true to exit the outer _.find() loop iterating over all paragraphs
                    return true;
                }
            }, this);
        };

        this.processFocus = function (state) {
            window.console.log('Editor focus: mode=' + textMode + ', state=' + state);
            if (focused !== state) {
                focused = state;
                if (focused && currentSelection)
                    this.setSelection(currentSelection); // Update Browser Selection, might got lost.
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
                    window.console.log('Editor.implCheckEventSelection(): missing selection!');
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

            this.implDbgOutEvent(event);
            // this.implCheckSelection();

            this.implCheckEventSelection();

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
                    this.insertTable({width: 2, height: 2});
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
            this.implStartCheckEventSelection();

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
                        var mergeselection = _.copy(selection.startPaM.oxoPosition),
                            characterPos = mergeselection.pop();

                        var nextParagraphPosition = _.copy(mergeselection),
                            lastValue = nextParagraphPosition.length - 1;

                        nextParagraphPosition[lastValue] += 1;

                        var domPos = this.getDOMPosition(nextParagraphPosition),
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
                            selection.startPaM.oxoPosition = this.getFirstPositionInParagraph(nextParagraphPosition);
                        } else if (isLastParagraph) {
                            if (this.isPositionInTable(nextParagraphPosition)) {
                                var returnObj = this.getFirstPositionInNextCell(nextParagraphPosition);
                                selection.startPaM.oxoPosition = returnObj.position;
                                var endOfTable = returnObj.endOfTable;
                                if (endOfTable) {
                                    var lastVal = selection.startPaM.oxoPosition.length - 1;
                                    selection.startPaM.oxoPosition[lastVal] += 1;
                                    selection.startPaM.oxoPosition = this.getFirstPositionInParagraph(selection.startPaM.oxoPosition);
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
                        startPosition[lastValue - 1] -= 1;
                        startPosition.pop();

                        var length = this.getParagraphLength(startPosition),
                            domPos = this.getDOMPosition(startPosition),
                            prevIsTable = false;

                        if (domPos) {
                            if (this.getDOMPosition(startPosition).node.nodeName === 'TABLE') {
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
                            selection.startPaM.oxoPosition = this.getLastPositionInParagraph(selection.startPaM.oxoPosition);
                        } else {
                            var isFirstPosition = (startPosition[lastValue - 1] < 0) ? true : false;
                            if (isFirstPosition) {
                                if (this.isPositionInTable(startPosition)) {
                                    var returnObj = this.getLastPositionInPrevCell(startPosition);
                                    selection.startPaM.oxoPosition = returnObj.position;
                                    var beginOfTable = returnObj.beginOfTable;
                                    if (beginOfTable) {
                                        var lastVal = selection.startPaM.oxoPosition.length - 1;
                                        selection.startPaM.oxoPosition[lastVal] -= 1;
                                        selection.startPaM.oxoPosition = this.getLastPositionInParagraph(selection.startPaM.oxoPosition);
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
                selection.endPaM = _.copy(selection.startPaM, true);
                event.preventDefault();
                this.setSelection(selection);
            }
            else if (event.ctrlKey) {
                var c = this.getPrintableChar(event);
                if (c === 'A') {
                    var startPaM = new OXOPaM([0]),
                        endPaM = new OXOPaM(this.getLastPositionInDocument());

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
                    var startPosition = _.copy(selection.startPaM.oxoPosition, true),
                        lastValue = selection.startPaM.oxoPosition.length - 1;

                    if ((lastValue >= 4) &&
                        (this.isPositionInTable([0])) &&
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

                // Is the end position the starting point of a table cell ?
                // Then the endpoint of the previous cell need to be used.
                // This has to be done before adjust is called! adjust is problematic for tables.
                if (this.isFirstPositionInTableCell(selection.endPaM.oxoPosition)) {
                    selection.endPaM.oxoPosition.pop();
                    var returnObj = this.getLastPositionInPrevCell(selection.endPaM.oxoPosition);
                    selection.endPaM.oxoPosition = returnObj.position;
                }

                undomgr.startGroup();

                selection.adjust();

                if (this.isSameParagraph(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {
                    // Only one paragraph concerned from deletion.
                    this.deleteText(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition);

                } else if (this.isSameParagraphLevel(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {

                    // The included paragraphs are neighbours.
                    var endPosition = _.copy(selection.startPaM.oxoPosition, true),
                        startposLength = selection.startPaM.oxoPosition.length - 1,
                        endposLength = selection.endPaM.oxoPosition.length - 1;

                    // 1) delete selected part or rest of para in first para (pos to end)
                    endPosition[endposLength] = this.getParagraphLength(endPosition);
                    this.deleteText(selection.startPaM.oxoPosition, endPosition);

                    // 2) delete completly selected paragraphs completely
                    for (var i = selection.startPaM.oxoPosition[startposLength - 1] + 1; i < selection.endPaM.oxoPosition[endposLength - 1]; i++) {
                        var startPosition = _.copy(selection.startPaM.oxoPosition, true);
                        startPosition[startposLength - 1] = selection.startPaM.oxoPosition[startposLength - 1] + 1;

                        // Is the new dom position a table or a paragraph or whatever? Special handling for tables required
                        startPosition.pop();
                        var isTable = this.getDOMPosition(startPosition).node.nodeName === 'TABLE' ? true : false;

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

                } else if (this.isCellSelection(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {
                    // This cell selection is a rectangle selection of cells in a table.
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
                            this.deleteAllParagraphsInCell(position);
                        }
                    }

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

        /**
         * Returns the values of all paragraph formatting attribute in the
         * current browser selection.
         */
        this.getParagraphAttributes = function () {
            var ranges = Selection.getBrowserSelection(editdiv);
            return Attributes.getParagraphAttributes(ranges);
        };

        /**
         * Returns the values of all character formatting attribute in the
         * current browser selection.
         */
        this.getCharacterAttributes = function () {
            var ranges = Selection.getBrowserSelection(editdiv);
            return Attributes.getCharacterAttributes(ranges);
        };

        /**
         * Returns the value of a specific formatting attribute in the current
         * browser selection.
         */
        this.getAttribute = function (attrName) {

            var // the resulting attributes
                attributes = null;

            if (Attributes.isParagraphAttribute(attrName)) {
                attributes = this.getParagraphAttributes();
            } else if (Attributes.isCharacterAttribute(attrName)) {
                attributes = this.getCharacterAttributes();
            } else {
                self.implDbgOutInfo('Editor.getAttribute() - no valid attribute specified');
            }

            return attributes[attrName];
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

                    // Is the end position the starting point of a table cell ?
                    // Then the endpoint of the previous cell need to be used.
                    // This has to be done before adjust is called! adjust is problematic for tables.
                    if (this.isFirstPositionInTableCell(selection.endPaM.oxoPosition)) {
                        selection.endPaM.oxoPosition.pop();
                        var returnObj = this.getLastPositionInPrevCell(selection.endPaM.oxoPosition);
                        selection.endPaM.oxoPosition = returnObj.position;
                    }

                    selection.adjust();

                    if (this.isSameParagraph(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {
                        // Only one paragraph concerned from attribute changes.
                        this.setAttribute(attr, value, selection.startPaM.oxoPosition, selection.endPaM.oxoPosition);

                    } else if (this.isSameParagraphLevel(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {
                        // The included paragraphs are neighbours.

                        // 1) selected part or rest of para in first para (pos to end)
                        var startposLength = selection.startPaM.oxoPosition.length - 1,
                            endposLength = selection.endPaM.oxoPosition.length - 1,
                            localendPosition = _.copy(selection.startPaM.oxoPosition, true);

                        localendPosition[startposLength] = this.getParagraphLength(localendPosition);
                        this.setAttribute(attr, value, selection.startPaM.oxoPosition, localendPosition);

                        // 2) completly selected paragraphs
                        for (var i = selection.startPaM.oxoPosition[startposLength - 1] + 1; i < selection.endPaM.oxoPosition[endposLength - 1]; i++) {
                            var localstartPosition = _.copy(selection.startPaM.oxoPosition, true);
                            localstartPosition[startposLength - 1] = i;
                            localstartPosition[startposLength] = 0;

                            // Is the new dom position a table or a paragraph or whatever? Special handling for tables required
                            // Removing position temporarely
                            var pos = localstartPosition.pop();
                            var isTable = this.getDOMPosition(localstartPosition).node.nodeName === 'TABLE' ? true : false;

                            if (isTable) {
                                this.setAttributeToCompleteTable(attr, value, localstartPosition);
                            } else {
                                localstartPosition.push(pos);
                                localendPosition = _.copy(localstartPosition, true);
                                localendPosition[startposLength] = this.getParagraphLength(localendPosition);
                                this.setAttribute(attr, value, localstartPosition, localendPosition);
                            }
                        }

                        // 3) selected part in last para
                        if (selection.startPaM.oxoPosition[startposLength - 1] !== selection.endPaM.oxoPosition[endposLength - 1]) {
                            var localstartPosition = _.copy(selection.endPaM.oxoPosition, true);
                            localstartPosition[endposLength - 1] = selection.endPaM.oxoPosition[endposLength - 1];
                            localstartPosition[endposLength] = 0;

                            this.setAttribute(attr, value, localstartPosition, selection.endPaM.oxoPosition);
                        }

                    } else if (this.isCellSelection(selection.startPaM.oxoPosition, selection.endPaM.oxoPosition)) {
                        // This cell selection is a rectangle selection of cells in a table.
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
                                position.push(0);
                                this.setAttributeToCompleteCell(attr, value, position);
                            }
                        }

                    } else {

                        // The included paragraphs are not neighbours. For example one paragraph top level and one in table.
                        // Should this be supported? How about tables in tables?
                        // This probably works not reliable for tables in tables.

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
                            localstartPosition[0] = i;
                            localstartPosition[1] = 0;

                            isTable = this.isPositionInTable(localstartPosition);

                            if (isTable) {
                                this.setAttributeToCompleteTable(attr, value, localstartPosition);
                            } else {
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
                // paragraph attributes also for cursor without selection
                else if (Attributes.isParagraphAttribute(attr)) {
                    var newOperation = {name: OP_ATTR_SET, attr: attr, value: value, start: _.copy(selection.startPaM.oxoPosition, true), end: _.copy(selection.endPaM.oxoPosition, true)};
                    this.applyOperation(newOperation, true, true);
                }
            }
            else {
                var newOperation = {name: OP_ATTR_SET, attr: attr, value: value, start: _.copy(startPosition, true), end: _.copy(endPosition, true)};
                this.applyOperation(newOperation, true, true);
            }
        };

        this.getParagraphCount = function () {
            return paragraphs.size();
        };

        this.getParagraphLength = function (position) {

            var paraLen = 0,
            localPos = _.copy(position),
            foundParagraph = false;

            var domPos = this.getDOMPosition(position);
            if (domPos && domPos.node) {
                var node = domPos.node;
                if (node.nodeName !== 'P') {
                    localPos.pop();
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
            }

            return paraLen;
        };

        this.getParagraphText = function (para, start, end) {

            var text = '',
                textNodes = null;

            if (start === undefined)
                start = 0;
            if (end === undefined)
                end = 0xFFFF; // don't need correct len, just a very large value

            textNodes = Utils.collectTextNodes(paragraphs[para]);
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

        this.isSameParagraph = function (posA, posB) {
            // Assuming that the position is complete, only the last parameter
            // is allowed to be different.

            var isSamePara = true;

            if (posA.length === posB.length) {
                var max = posA.length - 1;  // excluding position
                for (var i = 0; i < max; i++) {
                    if (posA[i] !== posB[i]) {
                        isSamePara = false;
                        break;
                    }
                }
            } else {
                isSamePara = false;
            }

            return isSamePara;
        };

        this.isSameParagraphLevel = function (posA, posB) {
            // Assuming that the position is complete, only the two last parameters
            // are allowed to be different.
            var isSameLevel = true;

            if (posA.length === posB.length) {
                var max = posA.length - 2;  // excluding position and paragraph
                for (var i = 0; i < max; i++) {
                    if (posA[i] !== posB[i]) {
                        isSameLevel = false;
                        break;
                    }
                }
            } else {
                isSameLevel = false;
            }

            return isSameLevel;
        };

        this.isCellSelection = function (posA, posB) {
            // If cells in a table are selected, posA must be the start position of a cell and posB
            // must be the last position of a cell
            return (this.isFirstPositionInTableCell(posA) && this.isLastPositionInTableCell(posB));
        };

        this.isFirstPositionInTableCell = function (pos) {
            // In Chrome, a triple click on the last paragraph of a cell, selects the start position of the following cell
            // as end position. In this case, the last position of the cell containing the selection should be the end position.
            var isCellStartPosition = false,
                localPos = _.copy(pos, true);

            if (localPos.pop() === 0) {   // start position
                if (localPos.pop() === 0) {   // start paragraph
                    var domPos = this.getDOMPosition(localPos);
                    if ((domPos) && (domPos.node.nodeName === 'TD' || domPos.node.nodeName === 'TH')) {
                        isCellStartPosition = true;
                    }
                }
            }

            return isCellStartPosition;
        };

        this.isLastPositionInTableCell = function (pos) {
            var isCellEndPosition = false,
                localPos = _.copy(pos, true);

            var pos = localPos.pop();
            if (pos === this.getParagraphLength(localPos)) {   // last position
                var lastPara = localPos.pop();
                if (lastPara ===  this.getLastParaIndexInCell(localPos)) {   // last paragraph
                    var domPos = this.getDOMPosition(localPos);
                    if ((domPos) && (domPos.node.nodeName === 'TD' || domPos.node.nodeName === 'TH')) {
                        isCellEndPosition = true;
                    }
                }
            }

            return isCellEndPosition;
        };

        this.prepareNewParagraph = function (paragraph) {
            paragraph.appendChild(document.createTextNode(''));
            var dummyBR = document.createElement('br');
            dummyBR.dummyBR = true;
            paragraph.appendChild(dummyBR);
        };

        this.getLastPositionInParagraph = function (paragraph) {

            // paragraph must be a position, representing a 'p' or a 'table' node

            var isTableNode = this.getDOMPosition(paragraph).node.nodeName === 'TABLE' ? true : false;

            if (isTableNode) {
                var lastRow = this.getLastRowIndexInTable(paragraph),
                    lastColumn = this.getLastColumnIndexInTable(paragraph);

                paragraph.push(lastRow);
                paragraph.push(lastColumn);

                var lastParaInCell = this.getLastParaIndexInCell(paragraph);

                paragraph.push(lastParaInCell);
            }

            paragraph.push(this.getParagraphLength(paragraph));

            return paragraph;
        };

        this.getFirstPositionInParagraph = function (paragraph) {

            // paragraph must be a position, representing a 'p' or a 'table' node

            var domPos = this.getDOMPosition(paragraph);

            if (domPos) {
                var isTableNode = domPos.node.nodeName === 'TABLE' ? true : false;

                while (isTableNode) {
                    paragraph.push(0);  // row
                    paragraph.push(0);  // column
                    paragraph.push(0);  // paragraph

                    domPos = this.getDOMPosition(paragraph);
                    isTableNode = domPos.node.nodeName === 'TABLE' ? true : false;
                }

                paragraph.push(0);
            }

            return paragraph;
        };

        this.getFirstPositionInNextCell = function (paragraph) {
            paragraph.pop(); // removing paragraph
            var column = paragraph.pop(),
                row = paragraph.pop(),
                endOfTable = false,
                lastRow = this.getLastRowIndexInTable(paragraph),
                lastColumn = this.getLastColumnIndexInTable(paragraph);

            if (column < lastColumn) {
                column += 1;
            } else {
                if (row < lastRow) {
                    row += 1;
                    column = 0;
                } else {
                    endOfTable = true;
                }
            }

            if (! endOfTable) {
                paragraph.push(row);
                paragraph.push(column);
                paragraph.push(0);  // first paragraph
                paragraph.push(0);  // first position
            }

            return {position: paragraph, endOfTable: endOfTable};
        };

        this.getLastPositionInPrevCell = function (paragraph) {
            paragraph.pop(); // removing paragraph
            var column = paragraph.pop(),
                row = paragraph.pop(),
                beginOfTable = false,
                lastColumn = this.getLastColumnIndexInTable(paragraph);

            if (column > 0) {
                column -= 1;
            } else {
                if (row > 0) {
                    row -= 1;
                    column = lastColumn;
                } else {
                    beginOfTable = true;
                }
            }

            if (! beginOfTable) {
                paragraph.push(row);
                paragraph.push(column);
                paragraph.push(this.getLastParaIndexInCell(paragraph));  // last paragraph
                paragraph.push(this.getParagraphLength(paragraph));  // last position
            }

            return {position: paragraph, beginOfTable: beginOfTable};
        };

        this.getLastPositionInDocument = function () {

            var lastPara = this.getParagraphCount() - 1,
                oxoPosition = this.getLastPositionInParagraph([lastPara]);

            return oxoPosition;
        };

        // ==================================================================
        // TABLE METHODS
        // ==================================================================

        this.isPositionInTable = function (position) {
            var positionInTable = false;

            if (! position) {
                var selection = this.getSelection();
                if (selection) {
                    position = selection.endPaM.oxoPosition;
                } else {
                    return false;
                }
            }

            var domNode = null,
                localPos = _.copy(position, true);

            while (localPos.length > 0) {

                domNode = this.getNextChildNode(domNode, localPos.shift()).node;

                if (domNode) {
                    if (domNode.nodeName === 'TABLE') {
                        positionInTable = true;
                        break;
                    } else if (domNode.nodeName === 'P') {
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

        this.getCurrentParagraph = function (position) {

            var paragraph = null,
                foundParagraph = false;

            var domPos = this.getDOMPosition(position);

            if (domPos) {
                var node = domPos.node;
                if (node.nodeName !== 'P') {
                    for (; node && (node !== editdiv.get(0)); node = node.parentNode) {
                        if (node.nodeName === 'P') {
                            foundParagraph = true;
                            break;
                        }
                    }
                } else {
                    foundParagraph = true;
                }

                if (foundParagraph) {
                    paragraph = node;
                }
            }

            return paragraph;
        };

        this.getAllAdjacentParagraphs = function (position) {
            // position can be paragraph itself or textnode inside it.
            var allParagraphs = [],
                foundParagraphNode = false;

            if ((position.length === 1) || (position.length === 2)) {  // only for performance
                allParagraphs = paragraphs;  // should be "rootElements" instead of "paragraphs"
            } else {
                var domPos = this.getDOMPosition(position);
                if (domPos) {
                    var node = domPos.node;
                    if (node.nodeName !== 'P') {
                        for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                            if (node.nodeName === 'P') {
                                foundParagraphNode = true;
                                break;
                            }
                        }
                    } else {
                        foundParagraphNode = true;
                    }

                    if (foundParagraphNode) {
                        allParagraphs = $(node.parentNode).children();
                    }
                }
            }

            return allParagraphs;
        };

        this.getLastRowIndexInTable = function (position) {
            var rowIndex = null,
                table = this.getCurrentTable(position);

            if (table) {
                rowIndex = $('> TBODY > TR, > THEAD > TR', table).length;
                rowIndex--;
            }

            return rowIndex;
        };

        this.getLastColumnIndexInTable = function (position) {
            var columnIndex = null,
                table = this.getCurrentTable(position);

            if (table) {
                var localrow = $('> TBODY > TR, > THEAD > TR', table).get(0);  // first row
                columnIndex = $('> TH, > TD', localrow).length;
                columnIndex--;
            }

            return columnIndex;
        };

        this.getLastColumnIndexInRow = function (position) {
            var columnIndex = null,
                table = this.getCurrentTable(position),
                foundRow = false;

            if (table) {
                var localPos = _.copy(position, true);
                var domPos = this.getDOMPosition(position);

                if (domPos) {
                    var node = domPos.node;

                    for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                        if (node.nodeName === 'TR') {
                            foundRow = true;
                            break;
                        } else {
                            if ((node.nodeName === 'P') || (node.nodeName === 'TH') || (node.nodeName === 'TD') || (node.nodeType === 3)) {
                                localPos.pop();
                            }
                        }
                    }

                    if (foundRow) {
                        var row = localPos.pop();  // found the correct row
                        var localrow = $('> TBODY > TR, > THEAD > TR', table).get(row);
                        columnIndex = $('> TH, > TD', localrow).length;
                        columnIndex--;
                    }
                }
            }

            return columnIndex;
        };

        this.getRowIndexInTable = function (position) {
            var rowIndex = null,
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
                            if ((node.nodeName === 'P') || (node.nodeName === 'TH') || (node.nodeName === 'TD') || (node.nodeType === 3)) {
                                localPos.pop();
                            }
                        }
                    }

                    if (foundRow) {
                        rowIndex = localPos.pop();  // found the correct row
                    }
                }
            }

            return rowIndex;
        };

        this.getColumnIndexInRow = function (position) {
            var columnIndex = null,
                isInTable = this.isPositionInTable(position),
                foundColumn = false;

            if (isInTable) {
                var localPos = _.copy(position, true);
                var domPos = this.getDOMPosition(position);

                if (domPos) {
                    var node = domPos.node;

                    for (; node && (node.nodeName !== 'TABLE') && (node !== editdiv.get(0)); node = node.parentNode) {
                        if ((node.nodeName === 'TH') || (node.nodeName === 'TH')) {
                            foundColumn = true;
                            break;
                        } else {
                            if ((node.nodeName === 'P') || (node.nodeType === 3)) {
                                localPos.pop();
                            }
                        }
                    }

                    if (foundColumn) {
                        columnIndex = localPos.pop();  // found the correct column
                    }
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
                            if ((node.nodeName === 'P') || (node.nodeName === 'TH') || (node.nodeName === 'TD') || (node.nodeType === 3)) {
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
                        if ((node.nodeName === 'TH') || (node.nodeName === 'TD')) {
                            foundColumn = true;
                            break;
                        } else {
                            if ((node.nodeName === 'P') || (node.nodeType === 3)) {
                                localPos.pop();
                            }
                        }
                    }

                    if (foundColumn) {
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

                    for (; node && (node !== editdiv.get(0)); node = node.parentNode) {
                        if (node.nodeName === 'TABLE') {
                            foundTable = true;
                            break;
                        } else {
                            if ((node.nodeName === 'P') ||
                                (node.nodeName === 'TD') ||
                                (node.nodeName === 'TH') ||
                                (node.nodeName === 'TR') ||
                                (node.nodeType === 3)) {
                                localPos.pop();
                            }
                        }
                    }

                    if (foundTable) {
                        indexOfLastTable = localPos.length - 1;  // found the correct table
                    }
                }
            }

            return indexOfLastTable;
        };

        this.getParagraphIndexInCell = function (position) {

            var paraIndex = null,
                isInTable = this.isPositionInTable(position),
                localPos = _.copy(position),
                foundParagraph = false;

            if (isInTable) {
                var domPos = this.getDOMPosition(position);
                if (domPos) {
                    var node = domPos.node;
                    if (node.nodeName !== 'P') {
                        localPos.pop();
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
                        paraIndex = localPos.pop();
                    }
                }
            }

            return paraIndex;
        };

        this.getAllParagraphsFromTableCell = function (position) {
            var allParagraphs = [],
                isInTable = this.isPositionInTable(position),
                foundParagraph = false;

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
                        allParagraphs = $(node.parentNode).children();
                    }
                }
            }

            return allParagraphs;
        };

        this.deletePreviousCellsInTable = function (position) {

            var localPos = _.copy(position, true),
                isInTable = this.isPositionInTable(localPos);

            if (isInTable) {

                var rowIndex = this.getIndexOfLastRowInPosition(localPos),
                    columnIndex = rowIndex + 1,
                    thisRow = localPos[rowIndex],
                    thisColumn = localPos[columnIndex],
                    lastColumn = this.getLastColumnIndexInTable(localPos);

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

        this.deleteAllParagraphsInCell = function (position) {

            var localPos = _.copy(position, true),
                isInTable = this.isPositionInTable(localPos);

            if (isInTable) {

                var columnIndex = this.getIndexOfLastColumnInPosition(localPos),
                    paraIndex = columnIndex + 1,
                    lastParaInCell = this.getLastParaIndexInCell(localPos);

                localPos[paraIndex] = 0;

                for (var i = 0; i <= lastParaInCell; i++) {
                    // this.deleteParagraph(localPos);
                    if (i < lastParaInCell) {
                        this.implDeleteParagraph(localPos);
                    } else {
                        if ((localPos.length - 1) > paraIndex) {
                            localPos.pop();
                        }
                        this.implDeleteParagraphContent(localPos);
                    }
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
                    columnIndex = rowIndex + 1,
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
                        localPos[rowIndex] = j;  // row
                        localPos[columnIndex] = i;  // column
                        // localPos[columnIndex + 1] = 0;
                        // localPos[columnIndex + 2] = 0;
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
                    columnIndex = paraIndex - 1,
                    rowIndex = columnIndex - 1,
                    thisRow = localPos[rowIndex],
                    thisColumn = localPos[columnIndex],
                    lastColumn = this.getLastColumnIndexInTable(localPos);

                for (var j = 0; j <= thisRow; j++) {
                    var max = lastColumn;
                    if (j === thisRow) {
                        max = thisColumn - 1;
                    }
                    for (var i = 0; i <= max; i++) {
                        localPos[rowIndex] = j;   // row
                        localPos[columnIndex] = i;  // column
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
                columnIndex = rowIndex + 1,
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
                        localPos[rowIndex] = i;  // row
                        localPos[columnIndex] = j;  // column
                        localPos[columnIndex + 1] = 0;
                        localPos[columnIndex + 2] = 0;
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

            localPos.push(0); // row

            var rowIndex = localPos.length - 1,
                columnIndex = rowIndex + 1;

            localPos.push(0); // column
            localPos.push(0); // paragraph
            localPos.push(0); // position

            var lastRow = this.getLastRowIndexInTable(position),
                lastColumn = this.getLastColumnIndexInTable(position);

            for (var j = 0; j <= lastRow; j++) {
                for (var i = 0; i <= lastColumn; i++) {
                    localPos[rowIndex] = j;  // row
                    localPos[columnIndex] = i;  // column
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

        this.insertTableRow = function () {
        };

        this.insertTableColumn = function () {
        };

        this.deleteTableRow = function () {
        };

        this.deleteTableColumn = function () {
        };

        // ==================================================================
        // IMPL METHODS
        // ==================================================================

        this.implParagraphChanged = function (position) {

            // Make sure that a completly empty para has the dummy br element, and that all others don't have it anymore...

            var paragraph = this.getCurrentParagraph(position);

            if (paragraph) {

                if (!hasTextContent(paragraph)) {
                    // We need an empty text node and a br
                    if (!paragraph.lastChild || !paragraph.lastChild.dummyBR) {
                        this.prepareNewParagraph(paragraph);
                    }
                }
                else {
                    // only keep it when inserted by the user
                    if (paragraph.lastChild.dummyBR) {
                        paragraph.removeChild(paragraph.lastChild);
                    }

                    // Browser show multiple spaces in a row as single space, and space at paragraph end is problematic for selection...
                    var textNodes = Utils.collectTextNodes(paragraph);
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
            }
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
            this.implParagraphChanged([0]);
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
            editdiv.get(0).onresizestart = function () { return false; };
        };

        this.implInsertText = function (text, position) {
            // -1 not allowed here - but code need to be robust
            var domPos = this.getDOMPosition(position);
            var oldText = domPos.node.nodeValue;
            var newText = oldText.slice(0, domPos.offset) + text + oldText.slice(domPos.offset);
            domPos.node.nodeValue = newText;
            var lastPos = _.copy(position);
            var posLength = position.length - 1;
            lastPos[posLength] = position[posLength] + text.length;
            lastOperationEnd = new OXOPaM(lastPos);
            this.implParagraphChanged(position);
        };

        /**
         * Changes a specific formatting attribute of the specified text range.
         *
         * @param {String} attrName
         *  The name of the formatting attribute.
         *
         * @param value
         *  The new value of the formatting attribute.
         *
         * @param {Number[]} start
         *  The logical start position of the text range to be formatted.
         *
         * @param {Number[]} end
         *  The logical end position of the text range to be formatted.
         */
        function implSetAttribute(attrName, value, start, end) {

            var // last index in the start position array
                startLastIndex = start.length - 1,
                // last index in the end position array
                endLastIndex = end.length - 1,
                // the DOM text range to be formatted
                ranges = null,
                // prepare an attribute map containing the passed single attribute
                attributes = Utils.makeSingleOption(attrName, value);

            // build local copies of the arrays (do not change caller's data)
            start = _.copy(start);
            end = _.copy(end);

            // validate text offset
            if (!_.isFinite(start[startLastIndex]) || (start[startLastIndex] < 0)) {
                start[startLastIndex] = 0;
            }
            if (!_.isFinite(end[endLastIndex]) || (end[endLastIndex] < 0)) {
                end[endLastIndex] = self.getParagraphLength(start);
            }

            // build the DOM text range
            ranges = self.getDOMSelection(new OXOSelection(new OXOPaM(start), new OXOPaM(end)));

            if (Attributes.isParagraphAttribute(attrName)) {
                Attributes.setParagraphAttributes(ranges, editdiv, attributes);
            } else if (Attributes.isCharacterAttribute(attrName)) {
                if (textMode !== OXOEditor.TextMode.PLAIN) {
                    Attributes.setCharacterAttributes(ranges, attributes);
                }
            } else {
                self.implDbgOutInfo('implSetAttribute() - no valid attribute specified');
            }

            lastOperationEnd = new OXOPaM(end);
        }

        this.implInsertParagraph = function (position) {
            var posLength = position.length - 1,
                para = position[posLength],
                allParagraphs = this.getAllAdjacentParagraphs(position);

            var newPara = document.createElement('p');
            newPara = $(newPara);

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

            this.implParagraphChanged(position);
        };

        this.implInsertTable = function (position, rows, columns) {

            var localPosition = _.copy(position),
                newTable = $('<table>');

            for (var i = 1; i <= rows; i++) {
                var newRow = ($('<tr>').attr('valign', 'top'));

                for (var j = 1; j <= columns; j++) {
                    newRow.append($('<td><p></p></td>'));
                }

                newTable.append(newRow);
            }

            var domParagraph = this.getDOMPosition(localPosition).node;
            newTable.insertBefore(domParagraph);
            paragraphs = editdiv.children();

            // Filling empty paragraphs in table cells with minimal content.
            // We need an empty text node and a <br>.

            for (var i = 0; i < rows; i++) {
                for (var j = 0; j < columns; j++) {
                    var pos = _.copy(localPosition, true);
                    pos.push(i);
                    pos.push(j);
                    pos.push(0); // first paragraph

                    var paragraph = this.getCurrentParagraph(pos);

                    this.prepareNewParagraph(paragraph);
                }
            }

            // Setting cursor into table (unfortunately not visible in Firefox)
            // var oxoPosition = this.getFirstPositionInParagraph(localPosition);
            // var selection = new OXOSelection(new OXOPaM(oxoPosition), new OXOPaM(oxoPosition));
            // this.setSelection(selection);

            // lastOperationEnd = new OXOPaM([position, 0]);
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

            this.implParagraphChanged(position);
            this.implParagraphChanged(startPosition);
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

                // Only merging, if both paragraph nodes have name 'p'. Tables cannot be merged this way, and
                // 'p' and 'table' cannot be merged either.
                if ((thisPara.nodeName === 'P') && (nextPara.nodeName === 'P')) {

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
                    this.implParagraphChanged(position);

                    // DEBUG STUFF
                    if (paragraphs.size() !== (dbg_oldparacount - 1)) {
                        this.implDbgOutInfo('implMergeParagraph - para count invalid!');
                    }
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
            var paragraph = this.getDOMPosition(position).node;
            if (paragraph) {
                $(paragraph).empty();  // removes the content of the paragraph
                this.prepareNewParagraph(paragraph);
            }
        };

        this.implDeleteTable = function (position) {

            var localPositon = _.copy(position, true),
                lastRow = this.getLastRowIndexInTable(position),
                lastColumn = this.getLastColumnIndexInTable(position);

            // iterating over all cells and remove all paragraphs in the cells
            for (var i = 0; i <= lastColumn; i++) {
                for (var j = 0; j <= lastRow; j++) {
                    var localPos = _.copy(localPositon, true);
                    localPos.push(j);
                    localPos.push(i);
                    localPos.push(0);
                    localPos.push(0);
                    this.deleteAllParagraphsInCell(localPos);
                }
            }

            // Finally removing the table itself
            // var paragraph = paragraphs[para];
            var paragraph = this.getDOMPosition(localPositon).node;
            paragraph.parentNode.removeChild(paragraph);

            var localPos = _.copy(localPositon, true);
            var para = localPos.pop();
            if (para > 0) {
                para -= 1;
            }
            localPos.push(para);
            localPos.push(0); // pos not corrct, but doesn't matter. Deleting paragraphs always happens between other operations, never at the last one.
            lastOperationEnd = new OXOPaM(localPos);
            paragraphs = editdiv.children();
        };

        this.implDeleteText = function (startPosition, endPosition) {

            var lastValue = startPosition.length - 1;
            var start = startPosition[lastValue];
            var end = endPosition[lastValue];

            if (end === -1) {
                end = this.getParagraphLength(startPosition);
            }

            if (start === end) {
                return;
            }

            var oneParagraph = this.getCurrentParagraph(startPosition);
            var textNodes = Utils.collectTextNodes(oneParagraph);
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

            this.implParagraphChanged(startPosition);
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

        // this.implInitDocument(); Done in main.js - to early here for IE, div not in DOM yet.

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
