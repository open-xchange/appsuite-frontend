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

define('io.ox/office/editor', function () {

    'use strict';

    /**
     * 'Point and mark'. Represents a text position a.k.a. cursor position.
     * Member field 'para' contains the zero-based paragraph index, member
     * field 'pos' contains the zero-based character index behind the cursor
     * position.
     */
    function OXOPaM(paragraph, position) {
        this.para = paragraph;
        this.pos = position;
    }

    /**
     * Represents a text range consisting of start position and end position.
     */
    function OXOSelection(start, end) {
        this.startPaM = start;
        this.endPaM = end;
        this.hasRange = function () {
            return ((this.startPaM.para !== this.endPaM.para) || (this.startPaM.pos !== this.endPaM.pos)) ? true : false;
        };
        this.adjust = function () {
            var tmp;
            if ((this.startPaM.para > this.endPaM.para) || ((this.startPaM.para === this.endPaM.para) && (this.startPaM.pos > this.endPaM.pos)))
            {
                tmp = this.startPaM;
                this.startPaM = this.endPaM;
                this.endPaM = tmp;
            }
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
    }

    function collectTextNodes(element, textNodes) {
        for (var child = element.firstChild; child !== null; child = child.nextSibling) {
            if (child.nodeType === 3)
                textNodes.push(child);
            else if (child.nodeType === 1)
                collectTextNodes(child, textNodes);
        }
    }

    /**
     * Represents a text range consisting of start position and end position.
     */
    function DOMSelection(start, end) {
        this.startPaM = start;
        this.endPaM = end;
    }

    function OXOEditor(editdiv, editWindow) {

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

        // list of operations
        var operations = [];

        // list of paragraphs as jQuery object
        var paragraphs = editdiv.children();

        /**
         * Returns whether the editor contains unsaved changes.
         */
        this.isModified = function () {
            return bModified;
        };

        /**
         * Sets the browser focus into the edit text area.
         */
        this.focus = function () {
            editdiv.focus();
        };

        this.initDocument = function () {
            var newOperation = { name: 'initDocument' };
            this.applyOperation(newOperation, true);
        };

        // OPERATIONS API

        this.clearOperations = function () {
            operations = [];
        };

        // Maybe only applyOperation_s_, where param might be operation or operation[] ?
        this.applyOperation = function (operation, bRecord) {

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
                // TODO
            }
            else if (operation.name === "xxxxxxxxxxxxxx") {
                // TODO
            }
        };

        this.applyOperations = function (theOperations, bRecord) {
            // TODO
        };

        this.getOperations = function () {
            return operations;
        };

        this.setOperations = function (allOperations) {
            operations = allOperations;
        };

        // GUI/EDITOR API

        /**
         * Returns true, if the passed keyboard event is a navigation event (cursor
         * traveling etc.) and will be passed directly to the browser.
         *
         * @param event
         *  A jQuery keyboard event object.
         */
        /* DEPRECATED - keyCode handled differently in keyPressed in different browsers
        this.isNavigationKeyEvent = function (event) {
            return NAVIGATION_KEYS.contains(event.keyCode);
        };
        */

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

        this.getOXOSelection = function (domSelection) {

            function getOXOPositionFromDOMPosition(node, offset) {

                var pam;

                // check input values
                if (!node || (offset < 0)) {
                    return pam;
                }

                // Check, if the selected node is a descendant of "this.editdiv"
                // Converting jQuery object to DOMNode using get(0)
                // Attention: In the future "this.editdiv" is already a jQuery object.
                var editorDiv = editdiv.has(node).get(0);

                if (!editorDiv) {  // range not in text area
                    return pam;
                }

                var myParagraph = paragraphs.has(node);
                var paragraphCount = myParagraph.index();

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

                textLength = textLength + offset;

                if (myParagraph.length !== 0) {
                    pam = new OXOPaM(paragraphCount, textLength);
                }

                return pam;
            }

            // Only supporting single selection at the moment
            var startPaM = getOXOPositionFromDOMPosition.call(this, domSelection.startPaM.node, domSelection.startPaM.offset);
            var endPaM = getOXOPositionFromDOMPosition.call(this, domSelection.endPaM.node, domSelection.endPaM.offset);

            var aOXOSelection = new OXOSelection(startPaM, endPaM);

            return aOXOSelection;
        };

        this.getDOMPosition = function (para, pos) {

            // Converting para and pos to node and offset
            var pam;

            // Is para an available paragraph? para starts with zero.
            var maxPara = $(paragraphs).size() - 1;
            if (para > maxPara) {
                editWindow.console.log('getDOMPosition: Warning: Paragraph ' + para + ' is out of range. Last paragraph: ' + maxPara);
                return pam;
            }

            // Checking if this paragraph has children
            var myParagraph = $(paragraphs).get(para);
            if (! myParagraph.hasChildNodes()) {
                editWindow.console.log('getDOMPosition: Warning: Paragraph is empty');
                return pam;
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
                editWindow.console.log('getDOMPosition: Warning: Paragraph does not contain position: ' + pos + '. Last position: ' + textLength);
                return pam;
            }

            var node = currentNode;
            var offset = pos - textLength;

            pam = new DOMPaM();
            pam.node = node;
            pam.offset = offset;

            return pam;
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


        this.getCurrentDOMSelection = function () {
            // DOMSelection consists of Node and Offset for startpoint and for endpoint
            var windowSel = editWindow.getSelection();
            var startPaM = new DOMPaM(windowSel.anchorNode, windowSel.anchorOffset);
            var endPaM = new DOMPaM(windowSel.focusNode, windowSel.focusOffset);
            var domSelection = new DOMSelection(startPaM, endPaM);

            return domSelection;
        };

        this.setSelection = function (oxosel) {
            var aDOMSelection = this.getDOMSelection(oxosel);
            var range = editWindow.document.createRange();
            range.setStart(aDOMSelection.startPaM.node, aDOMSelection.startPaM.offset);
            range.setEnd(aDOMSelection.endPaM.node, aDOMSelection.endPaM.offset);
            var sel = editWindow.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        };

        this.processKeyDown = function (event) {

            this.implDbgOut(event);

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
            }

            // For some keys we only get keyDown, not keyPressed!

            var domSelection = this.getCurrentDOMSelection();
            var selection = this.getOXOSelection(domSelection);
            selection.adjust();

            if (event.keyCode === 46) { // DELETE
                if (selection.hasRange()) {
                    this.deleteSelected();
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
                selection.endPaM = selection.startPaM;
                event.preventDefault();
                this.setSelection(selection);
            }
            if (event.keyCode === 8) { // BACKSPACE
                if (selection.hasRange()) {
                    this.deleteSelected();
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
                selection.endPaM = selection.startPaM;
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

            this.implDbgOut(event);

            var domSelection = this.getCurrentDOMSelection();
            var selection = this.getOXOSelection(domSelection);
            selection.adjust();

            /*
            editWindow.console.log('processKeyPressed: keyCode: ' + event.keyCode + ' isNavi: ' + this.isNavigationKeyEvent(event));
            if (this.isNavigationKeyEvent(event)) {
                return;
            }
            */

            var c = this.getPrintableChar(event);

            // TODO
            // For now (the prototype), only accept single chars, but let the browser process, so we don't need to care about DOM stuff
            // TODO: But we at least need to check if there is a selection!!!

            if (c.length === 1) {

                // Demo code for calculating DOMSelection from OXOSelection
                if (0) {
                    var aOXOSelection = this.getCurrentOXOSelection();
                    var aDOMSelection = this.getDOMSelection(aOXOSelection);

                    if (aDOMSelection) {
                        editWindow.console.log('processKeyPressed: StartPaM: ' + aDOMSelection.startPaM.node + ' : ' + aDOMSelection.startPaM.offset);
                        editWindow.console.log('processKeyPressed: EndPaM: ' + aDOMSelection.endPaM.node + ' : ' + aDOMSelection.endPaM.offset);

                        var range = document.createRange();
                        range.setStart(aDOMSelection.startPaM.node, aDOMSelection.startPaM.offset);
                        range.setEnd(aDOMSelection.endPaM.node, aDOMSelection.endPaM.offset);
                        var sel = editWindow.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                }

                // Code for calculating OXOSelection from DOMSelection
                this.deleteSelected();
                // Selection was adjusted, so we need to use start, not end
                this.insertText(c, selection.startPaM.para, selection.startPaM.pos);
                selection.startPaM.pos++;
                selection.endPaM = selection.startPaM;
                event.preventDefault();
                this.setSelection(selection);
            }
            else if (c.length > 1) {
                // TODO?
                event.preventDefault();
            }
            else {

                if (event.keyCode === 13) { // RETURN
                    this.deleteSelected();
                    this.splitParagraph(selection.startPaM.para, selection.startPaM.pos);
                    // TODO / TBD: Should all API / Operation calls return the new position?!
                    selection.startPaM.para++;
                    selection.startPaM.pos = 0;
                    selection.endPaM = selection.startPaM;
                    event.preventDefault();
                    this.setSelection(selection);
                }

            }
        };

        this.deleteSelected = function () {
            var i, nStartPos, nEndPos;
            var domSelection = this.getCurrentDOMSelection();
            var selection = this.getOXOSelection(domSelection);
            if ((selection !== undefined) && (selection.hasRange())) {
                // Split into multiple operations:
                // 1) delete selected part in first para (pos to end)
                // 2) delete completly slected paragraphs completely
                // 3) delete selected part in last para (start to pos)
                selection.adjust();
                nStartPos = selection.startPaM.pos;
                nEndPos = selection.endPaM.pos;
                if (selection.startPaM.para !== selection.endPaM.para) {
                    nEndPos = 0xFFFF; // TODO: Real para end
                }
                this.deleteText(selection.startPaM.para, nStartPos, nEndPos);
                for (i = selection.startPaM.para + 1; i < selection.endPaM.para; i++)
                {
                    // startPaM.para+1 instead of i, because we allways remove a paragraph
                    this.deleteParagraph(selection.startPaM.para + 1);
                }
                if (selection.startPaM.para !== selection.endPaM.para) {
                    this.deleteText(selection.startPaM.para + 1, 0, selection.endPaM.pos);
                }
            }
        };

        this.deleteText = function (para, start, end) {
            if (start !== end) {
                var newOperation = { name: 'deleteText', para: para, start: start, end: end };
                this.applyOperation(newOperation, true);
            }
        };

        this.deleteParagraph = function (para) {
            var newOperation = { name: 'deleteParagraph', para: para };
            this.applyOperation(newOperation, true);
        };

        this.insertParagraph = function (para) {
            var newOperation = { name: 'insertParagraph', para: para };
            this.applyOperation(newOperation, true);
        };

        this.splitParagraph = function (para, pos) {
            var newOperation = { name: 'splitParagraph', para: para, pos: pos };
            this.applyOperation(newOperation, true);
        };

        this.mergeParagraph = function (para) {
            var newOperation = { name: 'mergeParagraph', para: para };
            this.applyOperation(newOperation, true);
        };

        // For now, only stuff that we really need, not things that a full featured API would probably offer
        // this.getParagraphCount() = function() {
        //  // TODO
        //  return 1;
        // };

        this.insertText = function (text, para, pos) {
            var newOperation = { name: 'insertText', text: text, para: para, pos: pos };
            this.applyOperation(newOperation, true);
        };

        this.setAttributes = function (para, pos) {
            // TODO
        };

        // ==================================================================
        // IMPL METHODS
        // ==================================================================

        this.implGetParagraphLen = function (para) {
            var textLength = 0;
            var nodeList = paragraphs[para].childNodes;
            for (var i = 0; i < nodeList.length; i++) {
                textLength += $(nodeList[i]).text().length;
            }
            return textLength;
        };


        this.implParagraphChanged = function (para) {
            // TODO
            // 1) Adjust tabs
            // 2) ???
        };

        this.implInitDocument = function () {
            editdiv.innerHTMl = '<html><p><br></p></html>';
            paragraphs = editdiv.children();
        };

        this.implInsertText = function (para, pos, text) {
            var domPos = this.getDOMPosition(para, pos);
            var oldText = domPos.node.nodeValue;
            var newText = oldText.slice(0, domPos.offset) + text + oldText.slice(domPos.offset);
            domPos.node.nodeValue = newText;
            this.implParagraphChanged(para);
        };

        this.implInsertParagraph = function (para) {
            var newPara = editWindow.document.createElement('p');
            newPara.appendChild(editWindow.document.createTextNode(''));
            newPara.appendChild(editWindow.document.createElement('br'));
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
            // TODO
        };

        this.implDeleteParagraph = function (para) {
            // TODO
        };

        this.implDeleteText = function (para, start, end) {

            if (end === -1) {
                end = this.implGetParagraphLen(para);
            }

            if (start === end) {
                return;
            }

/*
            var startPaM = this.getDOMPosition(para, start);
            var endPaM = this.getDOMPosition(para, end);

            if (startPaM.node === endPaM.node) {
                var oldText = startPaM.node.nodeValue;
                var nodeStart = start - startPaM.offset;
                var newText = oldText.slice(0, start - nodeStart) + oldText.slice(end - nodeStart);
                startPaM.node.nodeValue = newText;
            }
            else
*/
            if (1)
            {
                var textNodes = [];
                collectTextNodes(paragraphs[para], textNodes);
                var node, nodeLen, delStart, delEnd;
                var nodes = textNodes.length;
                var nodeStart = 0;
                var del = end - start;
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
                            // remove element completely. Need to take care for empty elements.
                            // HACK
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

            }
            this.implParagraphChanged(para);
        };

        this.implDbgOut = function (event) {

            function fillstr(str, len, fill, right) {
                while (str.length < len) {
                    if (right)
                        str = str + fill;
                    else
                        str = fill + str;
                }
                return str;
            }

            var domSelection = this.getCurrentDOMSelection();
            var selection = this.getOXOSelection(domSelection);

            var dbg = 'evt:' + fillstr(event.type, 10, ' ', true) + ' sel:[' + fillstr(selection.startPaM.para.toString(), 2, '0') + ',' + fillstr(selection.startPaM.pos.toString(), 2, '0') + '/' + fillstr(selection.endPaM.para.toString(), 2, '0') + ',' + fillstr(selection.endPaM.pos.toString(), 2, '0') + ']';
            if ((event.type === "keypress") || (event.type === "keydown")) {
                dbg += ' key:[keyCode=' + fillstr(event.keyCode.toString(), 3, '0') + ' charCode=' + fillstr(event.charCode.toString(), 3, '0') + ' shift=' + event.shiftKey + ' ctrl=' + event.ctrlKey + ' alt=' + event.altKey + ']';
            }

            editWindow.console.log(dbg);

        };

        // hybrid edit mode
        editdiv
            .on('keydown', $.proxy(this, 'processKeyDown'))
            .on('keypress', $.proxy(this, 'processKeyPressed'))
            // TODO
            .on('dragover drop', $.proxy(this, 'xxx'))
            .on('contextmenu', $.proxy(this, 'xxx'));

    } // end of OXOEditor()

    // export the OXOEditor class directly
    return OXOEditor;
});
