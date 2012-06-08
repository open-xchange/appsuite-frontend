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

    /**
     * Represents a text range consisting of start position and end position.
     */
    function DOMSelection(start, end) {
        this.startPaM = start;
        this.endPaM = end;
    }
    
    function OXOEditor(editdiv) {

        // key codes of navigation keys that will be passed directly to the browser
        var NAVIGATION_KEYS = _([
//              16, 17, 18, // Shift, Ctrl, Alt
//              20, // CapsLock
                33, 34, 35, 36, // PageUp, PageDown, End, Pos1
                37, 38, 39, 40, // Cursor Left, Up, Right, Down
                91, 92, // Left Windows, Right Windows
                144, 145 // NumLock, ScrollLock
            ]),

            // list of operations
            operations = [],

            // list of paragraphs as jQuery object
            paragraphs = editdiv.children();

        /**
         * Returns whether the editor contains unsaved changes.
         */
        this.isModified = function () {
            // TODO
            return true;
        };

        this.initDocument = function () {
            // TODO
        };

        // OPERATIONS API

        this.clearOperations = function () {
            operations = [];
        };

        // Maybe only applyOperation_s_, where param might be operation or operation[] ?
        this.applyOperation = function (theOperation, bRecord) {
            // TODO
            if (bRecord) {
                // this.operations.append(theOperation); // ToDo
            }
        };

        this.applyOperations = function (theOperations, bRecord) {
            // TODO
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
        
        this.getCurrentDOMSelection = function () {
            // DOMSelection consists of Node and Offset for startpoint and for endpoint
            var windowSel = window.getSelection();
            var startPaM = new DOMPaM(windowSel.anchorNode, windowSel.anchorOffset);
            var endPaM = new DOMPaM(windowSel.focusNode, windowSel.focusOffset);
            var domSelection = new DOMSelection(startPaM, endPaM);

            return domSelection;
        };
          
        this.getDOMSelection = function (OXOSelection) {
            // TODO
        };
        

        this.processKeyDown = function (event) {

            if (event.keyCode && event.shiftKey && event.ctrlKey && event.altKey) {
                var c = this.getPrintableChar(event);
                if (c === 'P') {
                    alert('#Paragraphs: ' + this.paragraphs.length);
                }
                if (c === 'S') {
                    alert('#Paragraphs: ' + this.paragraphs.length);
                }
            }
            if (!this.isNavigationKeyEvent(event)) {
                // Don't block keyDown, or we will never get keyPressed...
                // Check with different browsers...

                // event.preventDefault();
            }
        };

        this.processKeyPressed = function (event) {
            var bBlock = true,
                c,
                selection;

            if (!this.isNavigationKeyEvent(event)) {

                c = this.getPrintableChar(event);

                // TODO
                // For now (the prototype), only accept single chars, but let the browser process, so we don't need to care about DOM stuff
                // TODO: But we at least need to check if there is a selection!!!

                if (c.length === 1) {
                    this.deleteSelected();
                    var domSelection = this.getCurrentDOMSelection();
                    var selection = this.getOXOSelection(domSelection);
                    window.console.log('processKeyPressed', 'OXOSelection, start: ' + selection.startPaM.para + " : " + selection.startPaM.pos);
                    window.console.log('processKeyPressed', 'OXOSelection, end: ' + selection.endPaM.para + " : " + selection.endPaM.pos);
                    if (selection !== undefined) {
                        this.insertText(c, selection.endPaM.para, selection.endPaM.pos);
                    }
                }

                if (bBlock) {
                    event.preventDefault();
                }
            }
        };

        this.deleteSelected = function () {
            // TODO
        };

        this.insertParagraph = function (pos) {
            // TODO
        };

        // For now, only stuff that we really need, not things that a full featured API would probably offer
        // this.getParagraphCount() = function() {
        //  // TODO
        //  return 1;
        // };

        this.insertText = function (text, para, pos) {
            // TODO
            var newOperation = { name: 'insertText', text: text, para: para, pos: pos };
            this.applyOperation(newOperation, true);
        };

        this.setAttributes = function (para, pos) {
            // TODO
        };

    } // end of OXOEditor()

    return OXOEditor;
});
