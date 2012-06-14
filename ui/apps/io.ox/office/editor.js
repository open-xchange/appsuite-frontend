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

    // TODO: namespace for helper functions/structs, or is that handle by the require struct???

    'use strict';

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
    function OXOPaM(paragraph, position) {
        this.para = paragraph;
        this.pos = position;
        this.toString = function () {
            return ("(para: " + this.para + ", pos: " + this.pos + ")");
        };
    }

    /**
     * Represents a text range consisting of start position and end position.
     */
    function OXOSelection(start, end) {
        this.startPaM = start ? _.clone(start) : new OXOPaM(0, 0);
        this.endPaM = end ? _.clone(end) : _.clone(this.startPaM);
        this.hasRange = function () {
            return ((this.startPaM.para !== this.endPaM.para) || (this.startPaM.pos !== this.endPaM.pos)) ? true : false;
        };
        this.adjust = function () {
            var tmp;
            if ((this.startPaM.para > this.endPaM.para) || ((this.startPaM.para === this.endPaM.para) && (this.startPaM.pos > this.endPaM.pos)))
            {
                tmp = _.clone(this.startPaM);
                this.startPaM = _.clone(this.endPaM);
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

        var bModified = false;

        var lastKeyDownEvent;

        // list of operations
        var operations = [];

        var blockOperations = false;
        var blockOperationNotifications = false;

        var charcodeSPACE = 32;
        var charcodeNBSP = 160;

        // list of paragraphs as jQuery object
        var paragraphs = editdiv.children();

        var dbgoutEvents = false, dbgoutObjects = false, dbgoutInfos = true;

        // add event hub
        Events.extend(this);

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
                this.implInsertText(operation.para, operation.pos, operation.text);
            }
            else if (operation.name === "deleteText") {
                this.implDeleteText(operation.para, operation.start, operation.end);
            }
            else if (operation.name === "insertParagraph") {
                this.implInsertParagraph(operation.para);
            }
            else if (operation.name === "deleteParagraph") {
                this.implDeleteParagraph(operation.para);
            }
            else if (operation.name === "splitParagraph") {
                this.implSplitParagraph(operation.para, operation.pos);
            }
            else if (operation.name === "mergeParagraph") {
                this.implMergeParagraph(operation.para);
            }
            else if (operation.name === "xxxxxxxxxxxxxx") {
                // TODO
            }

            if (bNotify && !blockOperationNotifications) {
                this.trigger("office:operation", operation);
                // TBD: Use operation directly, or copy?
            }

            blockOperations = false;
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
            if (event.which && (event.which >= 32) && (event.which <= 127)) {
                return String.fromCharCode(event.which);
            }
            // TODO: Need to handle other cases - later...
            return '';
        };

        this.hasFocus = function () {
            var bHasFocus = true;
            // TODO
            return bHasFocus;
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

                if (!editorDiv) {  // range not in text area
                    return;
                }

                var myParagraph = paragraphs.has(node);

                if (myParagraph.length === 0) {
                    return;
                }

                var para = myParagraph.index();

                // Calculating the position inside the paragraph.
                // Adding the textNodes from all siblings and parents left of the node.
                // All siblings and parents can have children.
                // Finally the offset has to be added.
                var textLength = 0;
                var nodeParagraph = myParagraph.get(0);

                for (; node && (node !== nodeParagraph); node = node.parentNode) {
                    for (var prevNode = node; (prevNode = prevNode.previousSibling);) {
                        textLength += $(prevNode).text().length;
                    }
                }

                return new OXOPaM(para, textLength + offset);
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
                    nPos = this.implGetParagraphLen(para);
                }
                startPaM = new OXOPaM(para, nPos);
                this.implDbgOutInfo('info: fixed invalid selection (start): ' + startPaM.toString());
            }

            if (domSelection.endPaM.node.nodeType === 3) {
                endPaM = getOXOPositionFromDOMPosition.call(this, domSelection.endPaM.node, domSelection.endPaM.offset);
            }
            else {
                // Work around browser selection bugs...
                var myParagraph = paragraphs.has(domSelection.endPaM.node.firstChild);
                var para = myParagraph.index();
                endPaM = new OXOPaM(para, this.implGetParagraphLen(para));
                this.implDbgOutInfo('info: fixed invalid selection (end):' + endPaM.toString());
            }

            var aOXOSelection = new OXOSelection(startPaM, endPaM);

            return aOXOSelection;
        };

        this.getDOMPosition = function (para, pos) {

            // Converting para and pos to node and offset
            // Is para an available paragraph? para starts with zero.
            var maxPara = $(paragraphs).size() - 1;
            if (para > maxPara) {
                this.implDbgOutInfo('getDOMPosition: Warning: Paragraph ' + para + ' is out of range. Last paragraph: ' + maxPara);
                return;
            }

            // Checking if this paragraph has children
            var myParagraph = $(paragraphs).get(para);
            if (! myParagraph.hasChildNodes()) {
                this.implDbgOutInfo('getDOMPosition: Warning: Paragraph is empty');
                return;
            }

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
            var startPaM = this.getDOMPosition(oxoSelection.startPaM.para, oxoSelection.startPaM.pos);
            var endPaM = this.getDOMPosition(oxoSelection.endPaM.para, oxoSelection.endPaM.pos);

            var domSelection;
            if ((startPaM) && (endPaM)) {
                domSelection = new DOMSelection(startPaM, endPaM);
            }

            return domSelection;
        };

        /**
         * Sets the browser focus into the edit text area.
         */
        this.focus = function () {
            editdiv.focus();
        };

        /**
         * Sets the cursor position after loading a document.
         */

        this.setStartSelection = function () {
            this.setSelection(new OXOSelection(new OXOPaM(0, 0), new OXOPaM(0, 0)));
        };

        /**
         * Returns whether the editor contains unsaved changes.
         */
        this.isModified = function () {
            return bModified;
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
            var range = document.createRange();
            range.setStart(aDOMSelection.startPaM.node, aDOMSelection.startPaM.offset);
            range.setEnd(aDOMSelection.endPaM.node, aDOMSelection.endPaM.offset);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
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
                    this.insertParagraph(-1);
                }
                if (c === 'D') {
                    this.initDocument();
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
                    var paraLen = this.implGetParagraphLen(selection.startPaM.para);
                    if (selection.startPaM.pos < paraLen) {
                        this.deleteText(selection.startPaM.para, selection.startPaM.pos, selection.startPaM.pos + 1);
                    }
                    else {
                        this.mergeParagraph(selection.startPaM.para);
                    }
                }
                selection.endPaM = _.clone(selection.startPaM);
                event.preventDefault();
                this.setSelection(selection);
            }
            if (event.keyCode === 8) { // BACKSPACE
                selection = this.getSelection();
                selection.adjust();
                if (selection.hasRange()) {
                    this.deleteSelected(selection);
                }
                else {
                    if (selection.startPaM.pos > 0) {
                        this.deleteText(selection.startPaM.para, selection.startPaM.pos - 1, selection.startPaM.pos);
                        selection.startPaM.pos--;
                    }
                    else if (selection.startPaM.para > 0) {
                        this.mergeParagraph(selection.startPaM.para - 1);
                        selection.startPaM.para--;
                        selection.startPaM.pos = this.implGetParagraphLen(selection.startPaM.para);
                    }
                }
                selection.endPaM = _.clone(selection.startPaM);
                event.preventDefault();
                this.setSelection(selection);
            }


            /*
            if (!this.isNavigationKeyEvent(event)) {
                // Don't block keyDown, or we will never get keyPressed...
                // Check with different browsers...
                // event.preventDefault();
            }
            */
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

            if (c.length === 1) {

                this.deleteSelected(selection);
                // Selection was adjusted, so we need to use start, not end
                this.insertText(c, selection.startPaM.para, selection.startPaM.pos);
                selection.startPaM.pos++;
                selection.endPaM = _.clone(selection.startPaM);
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
                    this.splitParagraph(selection.startPaM.para, selection.startPaM.pos);
                    // TODO / TBD: Should all API / Operation calls return the new position?!
                    selection.startPaM.para++;
                    selection.startPaM.pos = 0;
                    selection.endPaM = _.clone(selection.startPaM);
                    event.preventDefault();
                    this.setSelection(selection);
                }

            }

            // Block everything else to be on the save side....
            event.preventDefault();
        };

        this.deleteSelected = function (_selection) {
            // this.implCheckSelection();
            var i, nStartPos, nEndPos;
            var selection = _selection || this.getSelection();
            if ((selection !== undefined) && (selection.hasRange())) {

                selection.adjust();

                nStartPos = selection.startPaM.pos;
                nEndPos = selection.endPaM.pos;

                // 1) delete selected part or rest of para in first para (pos to end)
                if (selection.startPaM.para !== selection.endPaM.para) {
                    nEndPos = -1;
                }
                this.deleteText(selection.startPaM.para, nStartPos, nEndPos);

                // 2) delete completly slected paragraphs completely
                for (i = selection.startPaM.para + 1; i < selection.endPaM.para; i++)
                {
                    // startPaM.para+1 instead of i, because we allways remove a paragraph
                    this.deleteParagraph(selection.startPaM.para + 1);
                }

                // 3) delete selected part in last para (start to pos)
                if (selection.startPaM.para !== selection.endPaM.para) {
                    this.deleteText(selection.startPaM.para + 1, 0, selection.endPaM.pos);
                }

                // 4) merge first and last para
                if (selection.startPaM.para !== selection.endPaM.para) {
                    this.mergeParagraph(selection.startPaM.para);
                }
            }
        };

        this.deleteText = function (para, start, end) {
            if (start !== end) {
                var newOperation = { name: 'deleteText', para: para, start: start, end: end };
                this.applyOperation(newOperation, true, true);
            }
        };

        this.deleteParagraph = function (para) {
            var newOperation = { name: 'deleteParagraph', para: para };
            this.applyOperation(newOperation, true, true);
        };

        this.insertParagraph = function (para) {
            var newOperation = { name: 'insertParagraph', para: para };
            this.applyOperation(newOperation, true, true);
        };

        this.splitParagraph = function (para, pos) {
            var newOperation = { name: 'splitParagraph', para: para, pos: pos };
            this.applyOperation(newOperation, true, true);
        };

        this.mergeParagraph = function (para) {
            var newOperation = { name: 'mergeParagraph', para: para };
            this.applyOperation(newOperation, true, true);
        };

        // For now, only stuff that we really need, not things that a full featured API would probably offer
        // this.getParagraphCount() = function() {
        //  // TODO
        //  return 1;
        // };

        this.insertText = function (text, para, pos) {
            var newOperation = { name: 'insertText', text: text, para: para, pos: pos };
            this.applyOperation(newOperation, true, true);
        };

        this.setAttributes = function (para, pos) {
            // TODO
        };

        // ==================================================================
        // IMPL METHODS
        // ==================================================================

        this.implGetParagraphLen = function (para) {
            var textLength = 0;
            if (paragraphs[para] !== undefined) {
                var nodeList = paragraphs[para].childNodes;
                for (var i = 0; i < nodeList.length; i++) {
                    textLength += $(nodeList[i]).text().length;
                }
            }
            return textLength;
        };

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
                    selection.startPaM.pos = this.implGetParagraphLen(selection.startPaM.para);
                }

                if (windowSel.focusNode.nodeType !== 3) {
                    selection.endPaM.pos = this.implGetParagraphLen(selection.endPaM.para);

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
        };

        this.implInsertText = function (para, pos, text) {
            // -1 not allowed here - but code need to be robust
            if ((para < 0) || (para >= paragraphs.size())) {
                this.implDbgOutInfo('error: invalid para pos in implInsertText (' + para + ')');
                para = paragraphs.size() - 1;
                // return;
            }
            var domPos = this.getDOMPosition(para, pos);
            var oldText = domPos.node.nodeValue;
            var newText = oldText.slice(0, domPos.offset) + text + oldText.slice(domPos.offset);
            domPos.node.nodeValue = newText;
            this.implParagraphChanged(para);
        };

        this.implInsertParagraph = function (para) {
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
            this.implParagraphChanged(para);
        };

        this.implSplitParagraph = function (para, pos) {
            var paraclone = $(paragraphs[para]).clone();
            paraclone.insertAfter(paragraphs[para]);
            paragraphs = editdiv.children();
            if (pos !== -1)
                this.implDeleteText(para, pos, -1);
            this.implDeleteText(para + 1, 0, pos);
        };

        this.implMergeParagraph = function (para) {
            if  (para < (paragraphs.size() - 1)) {

                var thisPara = paragraphs[para];
                var nextPara = paragraphs[para + 1];

                var lastCurrentChild = thisPara.lastChild;
                if (lastCurrentChild && (lastCurrentChild.nodeName === 'BR'))
                    thisPara.removeChild(lastCurrentChild);

                for (var child = nextPara.firstChild; child !== null; child = child.nextSibling) {
                    thisPara.appendChild(child);
                }

                this.implDeleteParagraph(para + 1);

                this.implParagraphChanged(para);
            }
        };

        this.implDeleteParagraph = function (para) {
            var paragraph = paragraphs[para];
            paragraph.parentNode.removeChild(paragraph);
            paragraphs = editdiv.children();
        };

        this.implDeleteText = function (para, start, end) {

            if (end === -1) {
                end = this.implGetParagraphLen(para);
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
                    if (nodeStart <= start)  { // node matching startPaM
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
            this.implParagraphChanged(para);
        };

        this.implDbgOutEvent = function (event) {

            if (!dbgoutEvents)
                return;

            var selection = this.getSelection();

            var dbg = fillstr(event.type, 10, ' ', true) + ' sel:[' + fillstr(selection.startPaM.para.toString(), 2, '0') + ',' + fillstr(selection.startPaM.pos.toString(), 2, '0') + '/' + fillstr(selection.endPaM.para.toString(), 2, '0') + ',' + fillstr(selection.endPaM.pos.toString(), 2, '0') + ']';
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

    // export the OXOEditor class directly
    return OXOEditor;
});
