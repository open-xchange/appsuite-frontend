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
    function OXOPaM(para, pos) {
        this.para = para;
        this.pos = pos;
    }

    /**
     * Represents a text range consisting of start position and end position.
     */
    function OXOSelection(start, end) {
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

        this.getLogicalSelection = function (domSelection) {
            // TODO
        };

        this.getDOMSelection = function (logicalSelection) {
            // TODO
        };

        this.getOXOSelection = function () {
            // Returns an object of type OXOSelection
            // with a start point and an end point of type OXOPaM.
            // OXOPaM has the logical member nPara and nPos. These
            // have to be calculated from the domSelection with the
            // function getLogicalSelection .

            // 1. Getting the domSelection for Start and End Point

            var allRanges = this.updateRanges();
            _(allRanges).each(function (range, i) {
            });

            // 2. Calculating the logical selection from the domSelection

            // 3. Returning start and end point of the logical selection.


//          if ( windowSel.isCollapsed ) {
//              window.alert('Collapsed');
//          } else {
//              window.alert(windowSel);
//          }

            // Returning a dummy object for OXOSelection

            var startPaM = new OXOPaM(1, 3);
            var endPaM = new OXOPaM(1, 5);
            var selection = new OXOSelection(startPaM, endPaM);

            return selection;
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
                    selection = this.getOXOSelection();
                    this.insertText(c, selection.endPaM.para, selection.endPaM.pos);
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

        /**
         * Reads the browser selection and translates it into the internal selection
         * representation. If the selection has changed, all registered event listeners
         * will be notified.
         */
        this.updateRanges = function () {
            var paraConts = $('div.para-cont', this.editdiv);
            // this.paragraphs = this.editdiv.getElementsByTagName('p');
            // var allParagraphs = $('p', this.editdiv);

            // Textnode + Länge des Textnodes abfragen

            var ranges = [];

            /**
             * Calculates and returns the text position according to the passed DOM
             * node and offset. If the node is an HTML element, the offset specifies
             * the index of its child element. If the node is a text node, the offset
             * specifies the character index. Returns an array of node indexes starting
             * with the paragraph index (across all pages) and ending with the passed
             * offset in the passed node.
             *
             * Example: Text position is the second character of a span being the third
             * child node in the fifth paragraph. In this case, the parameter 'node'
             * points to the (sole) text node of the span, and parameter 'offset'
             * contains 1 (second character). This function will return the array
             * [4, 2, 0, 1]. This means:
             *  4 = the fifth paragraph (counted across all pages),
             *  2 = the paragraph's third child (the span),
             *  0 = the span's first child (text node),
             *  1 = the second character in the span's text node.
             */
            function getTextPositionFromAnchor(node, offset) {
                var textPos = [];

                // check input values
                if (!node || (offset < 0)) {
                    return textPos;
                }

                // check that the node is a descendant of a paragraph container
                var paraCont = paraConts.has(node).get(0);
                if (!paraCont) {
                    return textPos;
                }

                // collect node indexes from passed node up to but excluding the paragraph container
                for (; node && (node !== paraCont); node = node.parentNode) {
                    // Find the index of the node in the list of all child nodes of its
                    // parent node. jQuery's index() function skips text nodes if the node
                    // is an element node, and vice versa.
                    var i = 0;
                    for (var prevNode = node; (prevNode = prevNode.previousSibling); ++i) {}
                    textPos.unshift(i);
                }

                // now, first array element is the paragraph's index in its own page, add number of preceding paragraphs
                var prevContainers = $(paraCont).parent().parent().prevAll().children().children();
                textPos[0] += prevContainers.contents().length;

                // append the passed offset
                textPos.push(offset);

                return textPos;
            }

            // convert window selection to local array of TextRange object
            for (var i = 0, windowSel = window.getSelection(); i < windowSel.rangeCount; ++i) {

                var range = windowSel.getRangeAt(i);
                var startPos = getTextPositionFromAnchor(range.startContainer, range.startOffset);
                var endPos = getTextPositionFromAnchor(range.endContainer, range.endOffset);
                // check if selection is inside text area
                if (startPos.length && endPos.length) {
                    ranges.push({ start: startPos, end: endPos });
                }
            }

            // selection outside text area: ignore
            if (!ranges.length) {
                return;
            }

            return ranges;
        };

    } // end of OXOEditor()

    return OXOEditor;
});
