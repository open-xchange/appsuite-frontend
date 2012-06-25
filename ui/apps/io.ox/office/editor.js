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

define('io.ox/office/editor', ['io.ox/core/event'], function (Events) {

    'use strict';

    function OXOUndoAction(undoOperation, redoOperation) {

        this.undo = function (editor) {
            editor.applyOperation(undoOperation, true, true);  // Doc is being modified, so we need to notify/transfer/merge this operation. Is there a better way for undo?
        };

        this.redo = function (editor) {
            editor.applyOperation(redoOperation, true, true);
        };
    }


    function OXOUndoManager() {

        var actions = [];
        // var maxActions = 1000;   // not clear if really wanted/needed...
        var currentAction = 0;

        var groupLevel = 0;
        var currentGroupActions = [];

        var processingUndoRedo = false;

        this.clear = function () {
            actions = [];
            currentAction = 0;
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

            // remove undone actions
            if (currentAction < actions.length)
                actions.splice(currentAction);

            if (groupLevel) {
                currentGroupActions.push(oxoUndoAction);
            }
            else {
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
            currentAction--;
            var action = actions[currentAction];
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
            var action = actions[currentAction];
            if (_.isArray(action)) {
                _.invoke(action, "redo", editor);
            }
            else {
                action.redo(editor);
            }
            currentAction++;
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
            var tmp;
            var startPara = this.startPaM.oxoPosition[0];
            var endPara = this.endPaM.oxoPosition[0];
            var startPos = this.startPaM.oxoPosition[1]; // invalid for tables!
            var endPos = this.endPaM.oxoPosition[1]; // invalid for tables!
            if ((startPara > endPara) || ((startPara === endPara) && (startPos > endPos))) { // invalid for tables
                tmp = _.copy(this.startPaM, true);
                this.startPaM = _.copy(this.endPaM, true);
                this.endPaM = tmp;
            }
        };
        this.toString = function () {
            return ("Startpoint: " + this.startPaM.toString() + ", Endpoint: " + this.endPaM.toString());
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
     */
    function OXOEditor(editdiv, textMode) {

        // key codes of navigation keys that will be passed directly to the browser
        var NAVIGATION_KEYS = _([
//              16, 17, 18, // Shift, Ctrl, Alt
//              20, // CapsLock
                33, 34, 35, 36, // PageUp, PageDown, End, Pos1
                37, 38, 39, 40, // Cursor Left, Up, Right, Down
                91, 92, // Left Windows, Right Windows
                144, 145 // NumLock, ScrollLock
            ]);

        var modified = false;
        var focused = false;

        var lastKeyDownEvent;

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

            this.implDbgOutObject({type: 'operation', value: operation});

            if (bRecord) {
                operations.push(operation);
            }

            if (operation.name === "initDocument") {
                this.implInitDocument();
            }
            else if (operation.name === "insertText") {
                this.implInsertText(operation.text, operation.start);
            }
            else if (operation.name === "deleteText") {
                this.implDeleteText(operation.start, operation.end);
            }
            else if (operation.name === "setAttribute") {
                this.implSetAttribute(operation.attr, operation.value, operation.start, operation.end);
            }
            else if (operation.name === "insertParagraph") {
                this.implInsertParagraph(operation.start);
                if (operation.text)
                    this.implInsertText(operation.text, [operation.start[0], 0]);
            }
            else if (operation.name === "deleteParagraph") {
                this.implDeleteParagraph(operation.start);
            }
            else if (operation.name === "splitParagraph") {
                this.implSplitParagraph(operation.start);
            }
            else if (operation.name === "mergeParagraph") {
                this.implMergeParagraph(operation.start);
            }
            else if (operation.name === "xxxxxxxxxxxxxx") {
                // TODO
            }

            // document state
            this.setModified(true);

            if (bNotify && !blockOperationNotifications) {
                this.trigger("operation", operation);
                // TBD: Use operation directly, or copy?
            }

            blockOperations = false;

            // DEBUG STUFF
            if (this.getParagraphCount() !== editdiv.children().size()) {
                this.implDbgOutInfo('applyOperation - para count invalid!');
                debugger;
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
            return NAVIGATION_KEYS.contains(event.keyCode);
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
                if (!node || (offset < 0)) {
                    return;
                }

                // Check, if the selected node is a descendant of "this.editdiv"
                // Converting jQuery object to DOMNode using get(0)
                // Attention: In the future "this.editdiv" is already a jQuery object.
                var editorDiv = editdiv.has(node).get(0);

                if (!editorDiv) { // range not in text area
                    return;
                }

                var myParagraph = paragraphs.has(node);

                if (myParagraph.length === 0) {
                    return;
                }

                // Calculating the position inside the paragraph.
                // Adding the textNodes from all siblings and parents left of the node.
                // All siblings and parents can have children.
                // Finally the offset has to be added.
                var para = myParagraph.index();
                var textLength = 0;
                var column;
                var row;
                var cellpara;
                var countTextLength = true;

                var nodeParagraph = myParagraph.get(0);

                for (; node && (node !== nodeParagraph); node = node.parentNode) {
                    if ((node.nodeName === 'TD') || (node.nodeName === 'TH')) {
                        column = $(node).prevAll().length; // zero based
                    }
                    if (node.nodeName === 'TR') {
                        row = $(node).prevAll().length; // zero based
                    }
                    if (node.nodeName === 'P') {
                        cellpara = $(node).prevAll().length; // zero based
                        countTextLength = false;
                    }
                    if (countTextLength) {
                        for (var prevNode = node; (prevNode = prevNode.previousSibling);) {
                            textLength += $(prevNode).text().length;
                        }
                    }
                }

                // Filling content into the oxoPosition array
                var oxoPosition = [];
                oxoPosition.push(para);

                if ((column !== undefined) && (row !== undefined) && (cellpara !== undefined)) {
                    oxoPosition.push([column, row]);
                    oxoPosition.push(cellpara);
                }

                oxoPosition.push(textLength + offset);

                return new OXOPaM(oxoPosition);
            }

            // Only supporting single selection at the moment

            var startPaM, endPaM;

            // Checking selection - setting a valid selection doesn't always work on para end, browser is manipulating it....
            // Assume this only happens on para end - seems we are always directly in a p-element when this error occurs.
            if (domSelection.startPaM.node.nodeType === 3) {
                startPaM = getOXOPositionFromDOMPosition.call(this, domSelection.startPaM.node, domSelection.startPaM.offset);
            }
            else {
                // Work around browser selection bugs...
                var myParagraph = paragraphs.has(domSelection.startPaM.node.firstChild);
                var para = myParagraph.index();
                var nPos = 0;
                if ((domSelection.startPaM.node === domSelection.endPaM.node) && (domSelection.startPaM.offset === domSelection.endPaM.offset)) {
                    nPos = this.getParagraphLen(para);
                }
                startPaM = new OXOPaM([para, nPos]);
                // this.implDbgOutInfo('info: fixed invalid selection (start): ' + startPaM.toString());
            }

            if (domSelection.endPaM.node.nodeType === 3) {
                endPaM = getOXOPositionFromDOMPosition.call(this, domSelection.endPaM.node, domSelection.endPaM.offset);
            }
            else {
                // Work around browser selection bugs...
                var myParagraph = paragraphs.has(domSelection.endPaM.node.firstChild);
                var para = myParagraph.index();
                // Special handling for triple click in Chrome, that selects the start of the following paragraph as end point
                if ((domSelection.startPaM.node.nodeType === 3) && (domSelection.endPaM.node.nodeName === 'P') && (domSelection.endPaM.offset === 0)) {
                    para--;
                }
                endPaM = new OXOPaM([para, this.getParagraphLen(para)]);
                // this.implDbgOutInfo('info: fixed invalid selection (end):' + endPaM.toString());
            }

            var aOXOSelection = new OXOSelection(startPaM, endPaM);

            return aOXOSelection;
        };

        this.getDOMPosition = function (oxoPosition) {

            var oxoPos = _.copy(oxoPosition, true);

            // Converting an oxoPosition array to node and offset
            var maxPara = $(paragraphs).size() - 1;
            var para = oxoPos.shift();
            if (para > maxPara) {
                this.implDbgOutInfo('getDOMPosition: Warning: Paragraph ' + para + ' is out of range. Last paragraph: ' + maxPara);
                return;
            }
            if (oxoPos[0] === undefined) {
                this.implDbgOutInfo('getDOMPosition: position is undefined!');
                return;
            }

            var myParagraph = $(paragraphs).get(para);

            if (_(oxoPos[0]).isArray()) {

                var tableCell = oxoPos.shift();
                var column = tableCell[0];
                var row = tableCell[1];
                var cellpara = oxoPos.shift();

                // In tables it is necessary, to find the correct
                // paragraph inside the table
                if ((column !== undefined) && (row !== undefined) && (cellpara !== undefined)) {
                    var tablerow = $('tr', myParagraph).get(row);
                    var tablecell = $('th, td', tablerow).get(column);
                    myParagraph = $(tablecell).children().get(cellpara);
                    // $(myParagraph).css('background-color', 'red');
                }
            }

            // Checking if this paragraph has children
            if (!myParagraph.hasChildNodes()) {
                this.implDbgOutInfo('getDOMPosition: Warning: Paragraph is empty');
                return;
            }

            var pos = oxoPos.shift();
            var textLength = 0;
            var nodeList = myParagraph.childNodes;
            var currentNode = nodeList.firstChild;
            var bFound = false;

            while (myParagraph.hasChildNodes()) {

                nodeList = myParagraph.childNodes;

                for (var i = 0; i < nodeList.length; i++) {
                    // Searching the children
                    currentNode = nodeList[i];
                    var currentLength = $(nodeList[i]).text().length;
                    if (textLength + currentLength >= pos) {
                        bFound = true;
                        myParagraph = currentNode;
                        break;  // leaving the for-loop
                    } else {
                        textLength += currentLength;
                    }
                }
            }

            if (!bFound) {
                this.implDbgOutInfo('getDOMPosition: Warning: Paragraph does not contain position: ' + pos + '. Last position: ' + textLength);
                return;
            }

            var offset = pos - textLength;
            return new DOMPaM(currentNode, offset);
        };

        this.getDOMSelection = function (oxoSelection) {

            // Only supporting single selection at the moment
            var startPaM = this.getDOMPosition(oxoSelection.startPaM.oxoPosition);
            var endPaM = this.getDOMPosition(oxoSelection.endPaM.oxoPosition);

            var domSelection;
            if ((startPaM) && (endPaM)) {
                domSelection = new DOMSelection(startPaM, endPaM);
            }

            return domSelection;
        };

        this.addExampleTable = function () {
            // build table for testing reasons

            window.console.log("Number of children of editdiv before inserting table: " + paragraphs.length);

            editdiv
                .append($('<table>').attr('border', '4').attr('cellspacing', '10').attr('cellpadding', '20').attr('width', '80%')
                    .append('<colgroup><col width="40%"><col width="30%"><col width="30%"></colgroup>')
                    .append($('<tr>').attr('valign', 'top')
                        .append('<td><p id="1_1_1">This is paragraph 1 in row 1 and column 1.</p><p id="1_1_2">Second paragraph.</p><p id="1_1_3">Third paragraph.</p></td>')
                        .append('<td><p id="1_2_1">This is paragraph 1 in row 1 and column 2.</p><p id="1_2_2">Second paragraph.</p><p id="1_2_3">Third paragraph.</p></td>')
                        .append('<td><p id="1_3_1">This is paragraph 1 in row 1 and column 3.</p><p id="1_3_2">Second paragraph.</p><p id="1_3_3">Third paragraph.</p></td>'))
                    .append($('<tr>').attr('valign', 'top')
                        .append('<td><p id="2_1_1">This is paragraph 1 in row 2 and column 1.</p><p id="2_1_2">Second paragraph.</p><p id="2_1_3">Third paragraph.</p></td>')
                        .append('<td><p id="2_2_1">This is a paragraph in row 2 and column 2.</p><p id="2_2_2">Second paragraph.</p><p id="2_2_3">Third paragraph.</p></td>')
                        .append('<td><p id="2_3_1">This is a paragraph in row 2 and column 3.</p><p id="2_3_2">Second paragraph.</p><p id="2_3_3">Third paragraph.</p></td>'))
                    .append($('<tr>').attr('valign', 'top')
                        .append('<td><p id="3_1_1">This is paragraph 1 in row 3 and column 1.</p><p id="3_1_2">Second paragraph.</p><p id="3_1_3">Third paragraph.</p></td>')
                        .append('<td><p id="3_2_1">This is a paragraph in row 3 and column 2.</p><p id="3_2_2">Second paragraph.</p><p id="3_2_3">Third paragraph.</p></td>')
                        .append('<td><p id="3_3_1">This is a paragraph in row 3 and column 3.</p><p id="3_3_2">Second paragraph.</p><p id="3_3_3">Third paragraph.</p></td>'))
                    .append($('<tr>').attr('valign', 'top')
                        .append('<td><p id="4_1_1">This is paragraph 1 in row 4 and column 1.</p><p id="4_1_2">Second paragraph.</p><p id="4_1_3">Third paragraph.</p></td>')
                        .append('<td><p id="4_2_1">This is a paragraph in row 4 and column 2.</p><p id="4_2_2">Second paragraph.</p><p id="4_2_3">Third paragraph.</p></td>')
                        .append('<td><p id="4_3_1">This is a paragraph in row 4 and column 3.</p><p id="4_3_2">Second paragraph.</p><p id="4_3_3">Third paragraph.</p></td>')));

            paragraphs = editdiv.children();

            window.console.log("Number of children of editdiv after inserting table: " + paragraphs.length);
        };

        this.initDocument = function () {
            var newOperation = { name: 'initDocument' };
            this.applyOperation(newOperation, true, true);
        };

        this.getSelection = function () {
            var domSelection = this.implGetCurrentDOMSelection();
            var selection = this.implGetOXOSelection(domSelection);
            return selection;
        };

        this.setSelection = function (oxosel) {
            var aDOMSelection = this.getDOMSelection(oxosel);
            this.implSetDOMSelection(aDOMSelection.startPaM.node, aDOMSelection.startPaM.offset, aDOMSelection.endPaM.node, aDOMSelection.endPaM.offset);
        };

        this.clearUndo = function () {
            undomgr.clear();
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
            return undomgr.hasUndo();
        };

        this.processFocus = function (state) {
            if (focused !== state) {
                focused = state;
                this.trigger('focus', state);
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
            lastKeyDownEvent = event;
            // this.implCheckSelection();

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
                    this.insertParagraph([paragraphs.length]);
                    this.addExampleTable();
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

            // For some keys we only get keyDown, not keyPressed!

            var selection; // only get when really needed...

            if (event.keyCode === 46) { // DELETE
                selection = this.getSelection();
                selection.adjust();
                if (selection.hasRange()) {
                    this.deleteSelected(selection);
                }
                else {
                    var paraLen = this.getParagraphLen(selection.startPaM.oxoPosition[0]);
                    if (selection.startPaM.oxoPosition[1] < paraLen) { // invalid for tables
                        selection.endPaM.oxoPosition[1]++;
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
            else if (event.keyCode === 8) { // BACKSPACE
                selection = this.getSelection();
                selection.adjust();
                if (selection.hasRange()) {
                    this.deleteSelected(selection);
                }
                else {
                    if (selection.startPaM.oxoPosition[1] > 0) { // invalid for tables
                        var startPosition = _.copy(selection.startPaM.oxoPosition, true);
                        var endPosition = _.copy(selection.startPaM.oxoPosition, true);
                        startPosition[1] -= 1;
                        this.deleteText(startPosition, endPosition);
                        selection.startPaM.oxoPosition[1] -= 1;
                    }
                    else if (selection.startPaM.oxoPosition[0] > 0) {
                        var startPosition = _.copy(selection.startPaM.oxoPosition, true);
                        startPosition[0] -= 1;
                        startPosition.pop();
                        var length = this.getParagraphLen(startPosition[0]);
                        this.mergeParagraph(startPosition);
                        selection.startPaM.oxoPosition[0] -= 1;
                        selection.startPaM.oxoPosition[1] = length;
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
                    var lastPara = this.getParagraphCount() - 1;
                    selection.endPaM.oxoPosition[0] = lastPara;
                    selection.endPaM.oxoPosition[1] = this.getParagraphLen(lastPara); // invalid for tables
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
                debugger;
            }
        };

        this.processKeyPressed = function (event) {

            this.implDbgOutEvent(event);
            // this.implCheckSelection();

            if (this.isNavigationKeyEvent(lastKeyDownEvent)) {
                // Don't block cursor navigation keys.
                // Use lastKeyDownEvent, because some browsers (eg Chrome) change keyCode to become the charCode in keyPressed
                return;
            }

            var selection = this.getSelection();

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
                selection.startPaM.oxoPosition[1]++; // invalid for tables
                selection.endPaM = _.copy(selection.startPaM, true);
                event.preventDefault();
                this.setSelection(selection);
            }
            else if (c.length > 1) {
                // TODO?
                event.preventDefault();
            }
            else {

                if (event.keyCode === 13) { // RETURN
                    this.deleteSelected(selection);
                    var startPosition = _.copy(selection.startPaM.oxoPosition, true);
                    this.splitParagraph(startPosition);
                    // TODO / TBD: Should all API / Operation calls return the new position?!
                    selection.startPaM.oxoPosition[0] += 1;
                    selection.startPaM.oxoPosition[1] = 0; // invalid for tables
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
                debugger;
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

                var endPosition = _.copy(selection.endPaM.oxoPosition, true);
                // 1) delete selected part or rest of para in first para (pos to end)
                if (selection.startPaM.oxoPosition[0] !== selection.endPaM.oxoPosition[0]) {
                    endPosition[0] = selection.startPaM.oxoPosition[0];
                    endPosition[1] = this.getParagraphLen(endPosition[0]);  // invalid for tables
                }
                this.deleteText(selection.startPaM.oxoPosition, endPosition);

                // 2) delete completly slected paragraphs completely
                for (var i = selection.startPaM.oxoPosition[0] + 1; i < selection.endPaM.oxoPosition[0]; i++) {
                    // startPaM.oxoPosition[0]+1 instead of i, because we always remove a paragraph
                    var startPosition = _.copy(selection.startPaM.oxoPosition, true);
                    startPosition[0] += 1;
                    startPosition.pop();    // don't pass char pos
                    this.deleteParagraph(startPosition);
                }

                // 3) delete selected part in last para (start to pos) and merge first and last para
                if (selection.startPaM.oxoPosition[0] !== selection.endPaM.oxoPosition[0]) {
                    var startPosition = _.copy(selection.startPaM.oxoPosition, true);
                    startPosition[0] += 1;
                    startPosition[1] = 0;
                    var endPosition = _.copy(startPosition, true);
                    endPosition[1] = selection.endPaM.oxoPosition[1];
                    this.deleteText(startPosition, endPosition);
                    var mergeselection = _.copy(selection.startPaM.oxoPosition);
                    mergeselection.pop();
                    this.mergeParagraph(mergeselection);
                }

                undomgr.endGroup();
            }
        };

        this.deleteText = function (startposition, endposition) {
            if (startposition !== endposition) {
                var newOperation = { name: 'deleteText', start: startposition, end: endposition };
                // Hack for now. Might span multiple elements later, and we also need to keep attributes!
                // Right now, dleteText is only valid for single paragraphs...
                var undoOperation = { name: 'insertText', start: _.copy(startposition, true), text: this.getParagraphText(startposition[0], startposition[1], endposition[1]) };
                undomgr.addUndo(new OXOUndoAction(undoOperation, newOperation));
                this.applyOperation(newOperation, true, true);
            }
        };

        this.deleteParagraph = function (position) {
            var newOperation = { name: 'deleteParagraph', start: _.copy(position, true) };
            var undoOperation = { name: 'insertParagraph', start: _.copy(position, true), text: this.getParagraphText(position[0]) }; // HACK: Text is not part of the official operation, but I need it for Undo. Can be changed once we can have multiple undos for one operation.
            undomgr.addUndo(new OXOUndoAction(undoOperation, newOperation));
            this.applyOperation(newOperation, true, true);
        };

        this.insertParagraph = function (position) {
            var newOperation = {name: 'insertParagraph', start: _.copy(position, true)};
            var undoOperation = { name: 'deleteParagraph', start: _.copy(position, true) };
            undomgr.addUndo(new OXOUndoAction(undoOperation, newOperation));
            this.applyOperation(newOperation, true, true);
        };

        this.splitParagraph = function (position) {
            var newOperation = {name: 'splitParagraph', start: _.copy(position, true)};
            var undoOperation = { name: 'mergeParagraph', start: _.copy(position, true) };
            undomgr.addUndo(new OXOUndoAction(undoOperation, newOperation));
            this.applyOperation(newOperation, true, true);
        };

        this.mergeParagraph = function (position) {
            var newOperation = {name: 'mergeParagraph', start: _.copy(position)};
            var sel = _.copy(position);
            sel.push(this.getParagraphLen(sel[0]));
            var undoOperation = { name: 'splitParagraph', start: sel };
            undomgr.addUndo(new OXOUndoAction(undoOperation, newOperation));
            this.applyOperation(newOperation, true, true);
        };

        this.insertText = function (text, position) {
            var newOperation = { name: 'insertText', text: text, start: _.copy(position, true) };
            var undoOperation = { name: 'deleteText', start: _.copy(position, true), end: [position[0], position[1] + text.length] };
            undomgr.addUndo(new OXOUndoAction(undoOperation, newOperation));
            this.applyOperation(newOperation, true, true);
        };

        this.setAttribute = function (attr, value, startPosition, endPosition) {

            var para;
            var start;
            var end;

            if ((startPosition !== undefined) && (endPosition !== undefined)) {
                para = startPosition[0];
                start = startPosition[1]; // invalid for tables
                end = endPosition[1]; // invalid for tables
            }

            // TODO
            if (para === undefined) {
                // Set attr to current selection
                var selection = this.getSelection();
                if (selection.hasRange()) {

                    selection.adjust();

                    // 1) selected part or rest of para in first para (pos to end)
                    var endPosition = selection.endPaM.oxoPosition;
                    if (selection.startPaM.oxoPosition[0] !== selection.endPaM.oxoPosition[0]) {
                        endPosition = _.copy(selection.endPaM.oxoPosition, true);
                        endPosition[0] = selection.startPaM.oxoPosition[0]; // invalid for tables
                        endPosition[1] = this.getParagraphLen(endPosition[0]); // invalid for tables
                    }
                    this.setAttribute(attr, value, selection.startPaM.oxoPosition, endPosition);

                    // 2) completly slected paragraphs
                    for (var i = selection.startPaM.oxoPosition[0] + 1; i < selection.endPaM.oxoPosition[0]; i++) {
                        var startPosition = _.copy(selection.startPaM.oxoPosition, true);
                        startPosition[0] = i;
                        startPosition[1] = 0; // invalid for tables
                        var endPosition = _.copy(selection.endPaM.oxoPosition, true);
                        endPosition[0] = i;
                        endPosition[1] = this.getParagraphLen(endPosition[0]); // invalid for tables
                        this.setAttribute(attr, value, startPosition, endPosition);
                    }

                    // 3) selected part in last para
                    if (selection.startPaM.oxoPosition[0] !== selection.endPaM.oxoPosition[0]) {
                        var startPosition = _.copy(selection.endPaM.oxoPosition, true);
                        startPosition[0] = selection.endPaM.oxoPosition[0];
                        startPosition[1] = 0; // invalid for tables
                        this.setAttribute(attr, value, startPosition, selection.endPaM.oxoPosition);
                    }
                }
            }
            else {
                var newOperation = {name: 'setAttribute', attr: attr, value: value, start: _.copy(startPosition, true), end: _.copy(endPosition, true)};
                // Hack - this is not the correct Undo - but the attr toggle from the browser will have the effect we want to see ;)
                var undoOperation = {name: 'setAttribute', attr: attr, value: !value, start: _.copy(startPosition, true), end: _.copy(endPosition, true)};
                undomgr.addUndo(new OXOUndoAction(undoOperation, newOperation));
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

        this.getParagraphLen = function (para) {
            var textLength = 0;
            if (paragraphs[para] !== undefined) {
                var nodeList = paragraphs[para].childNodes;
                for (var i = 0; i < nodeList.length; i++) {
                    textLength += $(nodeList[i]).text().length;
                }
            }
            return textLength;
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
        // IMPL METHODS
        // ==================================================================

        this.implParagraphChanged = function (para) {

            // Make sure that a completly empty para has the dummy br element, and that all others don't have it anymore...
            var paragraph = paragraphs[para];

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
                collectTextNodes(paragraphs[para], textNodes);
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
                    selection.startPaM.oxoPosition[1] = this.getParagraphLen(selection.startPaM.oxoPosition[0]);
                }

                if (windowSel.focusNode.nodeType !== 3) {
                    selection.endPaM.oxoPosition[1] = this.getParagraphLen(selection.endPaM.oxoPosition[0]);

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
            var para = position[0];
            if ((para < 0) || (para >= paragraphs.size())) {
                this.implDbgOutInfo('error: invalid para pos in implInsertText (' + para + ')');
                para = paragraphs.size() - 1;
                // return;
            }

            var domPos = this.getDOMPosition(position);
            var oldText = domPos.node.nodeValue;
            var newText = oldText.slice(0, domPos.offset) + text + oldText.slice(domPos.offset);
            domPos.node.nodeValue = newText;
            lastOperationEnd = new OXOPaM([position[0], position[1] + text.length]);
            this.implParagraphChanged(para);
        };

        this.implSetAttribute = function (attr, value, startposition, endposition) {

            // The right thing to do is DOM manipulation, take care for correctly terminating/starting attributes.
            // See also http://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#set-the-selection%27s-value

            // Alternative: Simply span new atributes. Results in ugly HTML, but the operations that we record are correct,
            // and we don't care too much for the current/temporary HTML in this editor.
            // It will not negativly unfluence the resulting document.

            var para = startposition[0];
            var start = startposition[1]; // invalid for tables
            var end = endposition[1]; // invalid for tables

            if (textMode === OXOEditor.TextMode.PLAIN) {
                return;
            }
            if ((start === undefined) || (start === -1)) {
                start = 0;
            }
            if ((end === undefined) || (end === -1)) {
                end = this.getParagraphLen(para);
            }
            // HACK
            var oldselection = this.getSelection();
            // DR: works without focus
            //this.grabFocus(); // this is really ugly, but execCommand only works when having the focus. Can we restore the focus in case we didn't have it???
            this.setSelection(new OXOSelection(new OXOPaM([para, start]), new OXOPaM([para, end])));
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
            oldselection.adjust(); // FireFox can'r restore selection if end < start
            this.setSelection(oldselection);

            lastOperationEnd = new OXOPaM([para, end]);
        };

        this.implInsertParagraph = function (position) {
            var para = position[0];
            var newPara = document.createElement('p');
            newPara = $(newPara);

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

            lastOperationEnd = new OXOPaM([para, 0]);
            this.implParagraphChanged(para);
        };

        this.implSplitParagraph = function (position) {
            var dbg_oldparacount = paragraphs.size();
            var para = position[0];
            var pos = position[1]; // invalid for tables!
            var paraclone = $(paragraphs[para]).clone();
            paraclone.insertAfter(paragraphs[para]);
            paragraphs = editdiv.children();
            if (pos !== -1) {
                var startPos = _.copy(position, true);
                var endPos = _.copy(position, true);
                endPos[1] = -1;
                this.implDeleteText(startPos, endPos);
            }
            var startPosition = _.copy(position, true);
            startPosition[0] += 1;
            startPosition[1] = 0;
            var endPosition = _.copy(position, true);
            endPosition[0] = startPosition[0];
            this.implDeleteText(startPosition, endPosition);

            this.implParagraphChanged(para);
            this.implParagraphChanged(para + 1);
            lastOperationEnd = new OXOPaM(startPosition);

            // DEBUG STUFF
            if (paragraphs.size() !== (dbg_oldparacount + 1)) {
                this.implDbgOutInfo('implSplitParagraph - para count invalid!');
                debugger;
            }
        };

        this.implMergeParagraph = function (position) {
            var para = position[0];
            if (para < (paragraphs.size() - 1)) {

                var dbg_oldparacount = paragraphs.size();

                var thisPara = paragraphs[para];
                var nextPara = paragraphs[para + 1];

                var oldParaLen = this.getParagraphLen(para);

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
                localPosition[0] += 1;

                this.implDeleteParagraph(localPosition);

                lastOperationEnd = new OXOPaM([para, oldParaLen]);
                this.implParagraphChanged(para);

                // DEBUG STUFF
                if (paragraphs.size() !== (dbg_oldparacount - 1)) {
                    this.implDbgOutInfo('implMergeParagraph - para count invalid!');
                    debugger;
                }
            }

        };

        this.implDeleteParagraph = function (position) {
            var para = position[0];
            var paragraph = paragraphs[para];
            paragraph.parentNode.removeChild(paragraph);
            paragraphs = editdiv.children();
            lastOperationEnd = new OXOPaM([para ? para - 1 : 0, 0]);    // pos not corrct, but doesn't matter. Deleting paragraphs always happens between other operations, never at the last one.
        };

        this.implDeleteText = function (startPosition, endPosition) {

            var para = startPosition[0];
            var start = startPosition[1]; // invalid for tables
            var end = endPosition[1]; // invalid for tables

            if (end === -1) {
                end = this.getParagraphLen(para);
            }

            if (start === end) {
                return;
            }

            var textNodes = [];
            collectTextNodes(paragraphs[para], textNodes);
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

            lastOperationEnd = new OXOPaM([para, start]);
            this.implParagraphChanged(para);
        };

        this.implDbgOutEvent = function (event) {

            if (!dbgoutEvents)
                return;

            var selection = this.getSelection();

            var dbg = fillstr(event.type, 10, ' ', true) + ' sel:[' + fillstr(selection.startPaM.oxoPosition[0].toString(), 2, '0') + ',' + fillstr(selection.startPaM.oxoPosition[1].toString(), 2, '0') + '/' + fillstr(selection.endPaM.oxoPosition[0].toString(), 2, '0') + ',' + fillstr(selection.endPaM.oxoPosition[1].toString(), 2, '0') + ']';
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
