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
 * @author Ingo Schmidt-Rosbiegal <ingo.schmidt-rosbiegal@open-xchange.com>
 */

define('io.ox/office/editor/drawingResize',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/operations',
     'io.ox/office/editor/position',
     'io.ox/office/editor/table'
    ], function (Utils, DOM, Operations, Position, Table) {

    'use strict';

    // static class DrawingResize ==================================================

    var DrawingResize = {};

    // static methods ---------------------------------------------------------

    /**
     * Draws a selection box for the specified drawing node and registers
     * mouse handlers for moving and resizing.
     *
     * @param {Editor} editor
     *  The editor instance to use.
     *
     * @param {HTMLElement|jQuery} drawing
     *  The drawing node to be selected. If this value is a jQuery
     *  collection, uses the first DOM node it contains.
     */
    DrawingResize.drawDrawingSelection = function (editor, drawing) {

        var startX = 0,
            startY = 0,
            currentX = 0,
            currentY = 0,
            shiftX = 0,
            shiftY = 0,
            finalWidth = 0,
            finalHeight = 0,
            nodeOptions = {},
            // object containing information about moveable and sizeable
            options = { moveable: true, sizeable: true },  // -> parameter?
            // left distance from drawing to event point (in px)
            leftDrawingDistance = 0,
            // top distance from drawing to event point (in px)
            topDrawingDistance = 0,
            // whether mousedown is a current event
            mousedownevent = false,
            // saving the selected drawing node
            drawingNode = null,
            // the container element used to visualize the selection
            selectionBox = null,
            // the container element used to visualize the movement and resizing
            moveBox = null,
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

                leftDrawingDistance = startX - $(drawingNode).offset().left;
                topDrawingDistance = startY - $(drawingNode).offset().top;
            }

            // setting cursor
            editor.getNode().css('cursor', nodeOptions.cursorStyle);  // setting cursor for increasing drawing
            $('div.selection', editor.getNode()).css('cursor', nodeOptions.cursorStyle); // setting cursor for decreasing drawing
            $('div.move', editor.getNode()).css('cursor', nodeOptions.cursorStyle); // setting cursor for flexible move node
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
            var generator = new Operations.Generator(),
                moveX = 0,
                moveY = 0,
                width = 0,
                height = 0,
                updatePosition = null,
                anchorHorOffset = 0,
                anchorVertOffset = 0,
                drawingNodeAttrs = null,
                oldAnchorHorOffset = 0,
                oldAnchorVertOffset = 0,
                anchorHorBase = 0,
                anchorVertBase = 0,
                anchorHorAlign = 0,
                anchorVertAlign = 0,
                // the logical destination for moved images
                destPosition = null,
                // current drawing width, in 1/100 mm
                drawingWidth = 0,
                // the paragraph element containing the drawing node
                paragraph = null,
                // total width of the paragraph, in 1/100 mm
                paraWidth = 0,
                // the maximum shift inside a paragraph to the top
                maxTopShift = 0,
                // is it necessary to move the image?
                moveImage = false,
                // special handling for shifts of drawings behind the last paragraph
                isLastParagraph = false,
                // special handling for shifts of drawings behind the last paragraph -> expanding last paragraph
                expandLastParagraph = false,
                // position of the mouse up event shifted into the document borders
                trimmedPosition = null;

            function adaptPositionIntoDocument(doc, posX, posY) {

                var pageContent = DOM.getPageContentNode(doc),
                    minLeftPosition = Math.round(pageContent.offset().left),
                    maxRightPosition = minLeftPosition + Math.round(pageContent.width()),
                    minTopPosition = Math.round(pageContent.offset().top),
                    maxBottomPosition = minTopPosition + Math.round(pageContent.height()),
                    isBehindLastParagraph = false;

                if (posX < minLeftPosition) { posX = minLeftPosition; }
                if (posX > maxRightPosition) { posX = maxRightPosition; }
                if (posY < minTopPosition) { posY = minTopPosition; }
                if (posY > maxBottomPosition) { isBehindLastParagraph = true; }

                return { posX: posX, posY: posY, isBehindLastParagraph: isBehindLastParagraph };
            }

            function isPositionInsideNode(node, posX, posY) {

                if (! (node instanceof $)) { node = $(node); }

                return ((Math.round(node.offset().left) <= posX) && (posX <= Math.round(node.offset().left + node.outerWidth())) &&
                        (Math.round(node.offset().top) <= posY) && (posY <= Math.round(node.offset().top + node.outerHeight())));
            }

            function iterateSelectorNodes(topNode, currentNode, posX, posY, selector, skipSelector, options) {

                var selectorNode = null,
                    reverse = Utils.getBooleanOption(options, 'reverse', false);

                while (currentNode) {

                    if (isPositionInsideNode(currentNode, posX, posY)) {
                        selectorNode = currentNode;
                        break;
                    }

                    if (reverse) {
                        currentNode = Utils.findPreviousNode(topNode, currentNode, selector, skipSelector);
                    } else {
                        currentNode = Utils.findNextNode(topNode, currentNode, selector, skipSelector);
                    }
                }

                return selectorNode;
            }

            function getParagraphAtPosition(topNode, startNode, shiftX, shiftY, posX, posY, isBehindLastParagraph) {

                var searchPrevious = true,
                    searchFollowing = true,
                    paragraph = null,
                    tableCell = null,
                    nextParagraph = null;

                if ((shiftX > 0) && (shiftY > 0)) { searchPrevious = false; }
                if ((shiftX < 0) && (shiftY < 0)) { searchFollowing = false; }

                if (isBehindLastParagraph) {
                    // -> special handling for shifts behind the last paragraph
                    nextParagraph = Utils.getDomNode(startNode);
                    while (nextParagraph) {
                        paragraph = nextParagraph;
                        nextParagraph = Utils.findNextNode(topNode, nextParagraph, DOM.PARAGRAPH_NODE_SELECTOR, DOM.DRAWING_NODE_SELECTOR);
                    }
                }

                if (paragraph) { searchFollowing = false; }

                if (searchFollowing) {
                    paragraph = iterateSelectorNodes(topNode, Utils.getDomNode(startNode), posX, posY, DOM.PARAGRAPH_NODE_SELECTOR, DOM.DRAWING_NODE_SELECTOR, {'reverse': false});
                }

                if (paragraph) { searchPrevious = false; }
                else { searchPrevious = true; }

                if (searchPrevious) {
                    paragraph = iterateSelectorNodes(topNode, Utils.getDomNode(startNode), posX, posY, DOM.PARAGRAPH_NODE_SELECTOR, DOM.DRAWING_NODE_SELECTOR, {'reverse': true});
                }

                // maybe the paragraph is in a table cell with a cell neighbour that is much higher -> use last paragraph in this cell
                if (! paragraph) {
                    tableCell = iterateSelectorNodes(topNode, Utils.getDomNode(startNode), posX, posY, DOM.TABLE_CELLNODE_SELECTOR, DOM.DRAWING_NODE_SELECTOR, {'reverse': false});

                    if (! tableCell) {
                        tableCell = iterateSelectorNodes(topNode, Utils.getDomNode(startNode), posX, posY, DOM.TABLE_CELLNODE_SELECTOR, DOM.DRAWING_NODE_SELECTOR, {'reverse': true});
                    }

                    if ((tableCell) && (DOM.isTableCellNode(tableCell))) {
                        paragraph = DOM.getCellContentNode(tableCell)[0].lastChild;  // the last paragraph of the cell content
                    }
                }

                if (paragraph) { paragraph = $(paragraph); }

                return paragraph;
            }

            moveBoxNode.css({'border-width': 0, 'left': 0, 'top': 0});  // making move box invisible and shifting it back into drawing

            if (nodeOptions.isResizeEvent) {

                if ((finalWidth > 0) && (finalHeight > 0)) {

                    width = Utils.convertLengthToHmm(finalWidth, 'px');
                    height = Utils.convertLengthToHmm(finalHeight, 'px');
                    updatePosition = Position.getOxoPosition(editor.getNode(), drawingNode, 0);

                    generator.generateOperation(Operations.ATTRS_SET, {
                        attrs: { drawing: { width: width, height: height } },
                        start: updatePosition
                    });

                    editor.applyOperations(generator.getOperations());
                }

            } else if (nodeOptions.isMoveEvent) {

                currentX = event.pageX;
                currentY = event.pageY;

                // shifting currentX and curentY to position inside the document
                trimmedPosition = adaptPositionIntoDocument(editor.getNode(), currentX, currentY);
                currentX = trimmedPosition.posX;
                currentY = trimmedPosition.posY;

                shiftX = currentX - startX;
                shiftY = currentY - startY;

                if ((_.isNumber(shiftX)) && (_.isNumber(shiftY)) && ((shiftX !== 0) || (shiftY !== 0))) {

                    moveX = Utils.convertLengthToHmm(shiftX, 'px');
                    moveY = Utils.convertLengthToHmm(shiftY, 'px');
                    updatePosition = Position.getOxoPosition(editor.getNode(), drawingNode, 0);
                    drawingWidth = Utils.convertLengthToHmm($(drawingNode).width(), 'px');
                    paragraph = $(drawingNode).parent();
                    drawingNodeAttrs = editor.getDrawingStyles().getElementAttributes(drawingNode).drawing;
                    oldAnchorHorOffset = drawingNodeAttrs.anchorHorOffset;
                    oldAnchorVertOffset = drawingNodeAttrs.anchorVertOffset ? drawingNodeAttrs.anchorVertOffset : 0;
                    anchorHorBase = drawingNodeAttrs.anchorHorBase;
                    anchorVertBase = drawingNodeAttrs.anchorVertBase;
                    anchorHorAlign = drawingNodeAttrs.anchorHorAlign;
                    anchorVertAlign = drawingNodeAttrs.anchorVertAlign;
                    paraWidth = Utils.convertLengthToHmm(paragraph.width(), 'px');

                    if (oldAnchorHorOffset === undefined) {
                        // anchorHorOffset has to be calculated corresponding to the left paragraph border
                        if (anchorHorAlign === 'right') {
                            oldAnchorHorOffset = paraWidth - drawingWidth;
                        } else if (anchorHorAlign === 'center') {
                            oldAnchorHorOffset = (paraWidth - drawingWidth) / 2;
                        } else {
                            oldAnchorHorOffset = 0;
                        }
                    }

                    anchorHorOffset = oldAnchorHorOffset;
                    anchorVertOffset = oldAnchorVertOffset;

                    // check, if paragraph is already the last paragraph. Required for moves behind the last paragraph
                    if (! Utils.findNextNode(editor.getNode(), paragraph, DOM.PARAGRAPH_NODE_SELECTOR, DOM.DRAWING_NODE_SELECTOR)) { isLastParagraph = true; }
                    if (isLastParagraph && trimmedPosition.isBehindLastParagraph) { expandLastParagraph = true; }

                    // checking position of mouse up event
                    if (isPositionInsideNode(paragraph, currentX, currentY) || expandLastParagraph) {  // -> new position is in the same paragraph (or it is the last paragraph in the document)

                        if (moveX !== 0) {
                            anchorHorOffset = oldAnchorHorOffset + moveX;
                            anchorHorAlign = 'offset';
                            anchorHorBase = 'column';
                            if (anchorHorOffset < 0) { anchorHorOffset = 0; }
                            else if (anchorHorOffset > (paraWidth - drawingWidth)) { anchorHorOffset = paraWidth - drawingWidth; }
                        }

                        if (moveY !== 0) {
                            anchorVertOffset = oldAnchorVertOffset + moveY;
                            anchorVertAlign = 'offset';
                            anchorVertBase = 'paragraph';

                            if (anchorVertOffset < 0) { // moving image to the top of the paragraph is required
                                maxTopShift = $(drawingNode).offset().top - paragraph.offset().top;  // distance from top drawing border to top paragraph border
                                // moving the image inside the paragraph to the beginning of the paragraph
                                maxTopShift = Utils.convertLengthToHmm(maxTopShift, 'px') - oldAnchorVertOffset;
                                // calculating the new vertical offset (anchorvoffset is < 0)
                                anchorVertOffset = maxTopShift + anchorVertOffset;
                                // anchorVertOffset always has to be >= 0, not leaving the paragraph ('< 0' should never happen here)
                                if (anchorVertOffset < 0) { anchorVertOffset = 0; }
                                // moving the drawing to the beginning of the paragraph
                                destPosition = _.clone(updatePosition);
                                destPosition[destPosition.length - 1] = 0;
                                moveImage = true;
                            }
                        }

                    } else {   // -> new position is in another paragraph

                        // paragraph has to be determined from the coordinates (currentX, currentY)
                        // -> moving operation for the drawing is always required

                        paragraph = getParagraphAtPosition(editor.getNode(), paragraph, shiftX, shiftY, currentX, currentY, trimmedPosition.isBehindLastParagraph);

                        if (paragraph) {
                            paraWidth = Utils.convertLengthToHmm(paragraph.width(), 'px');

                            anchorVertAlign = 'offset';
                            anchorVertBase = 'paragraph';
                            if (shiftY > 0) { topDrawingDistance = 0; }
                            anchorVertOffset = Utils.convertLengthToHmm((currentY - paragraph.offset().top - topDrawingDistance), 'px');
                            anchorHorAlign = 'offset';
                            anchorHorBase = 'column';
                            anchorHorOffset = Utils.convertLengthToHmm((currentX - paragraph.offset().left - leftDrawingDistance), 'px');

                            destPosition = Position.getOxoPosition(editor.getNode(), paragraph, 0);
                            destPosition.push(0);

                            moveImage = true;
                        } else {
                            // do not call set Attributes and not moveImage
                            moveImage = false;
                            anchorHorOffset = oldAnchorHorOffset;
                            anchorVertOffset = oldAnchorVertOffset;
                        }
                    }

                    if ((moveImage) && (! _.isEqual(updatePosition, destPosition))) {

                        generator.generateOperation(Operations.MOVE, {
                            start: updatePosition,
                            end: updatePosition,
                            to: destPosition
                        });

                        updatePosition = destPosition; // for setting attributes required
                    }

                    if ((anchorHorOffset !== oldAnchorHorOffset) || (anchorVertOffset !== oldAnchorVertOffset)) {

                        generator.generateOperation(Operations.ATTRS_SET, {
                            attrs: { drawing: { anchorHorOffset: anchorHorOffset, anchorVertOffset: anchorVertOffset, anchorHorAlign: anchorHorAlign, anchorVertAlign: anchorVertAlign, anchorHorBase: anchorHorBase, anchorVertBase: anchorVertBase } },
                            start: updatePosition
                        });

                    }

                    editor.applyOperations(generator.getOperations());

                }
            }

            // Resetting shiftX and shiftY, for new mouseup events without mousemove
            shiftX = 0;
            shiftY = 0;
            nodeOptions = {};

            // Resetting cursor, using css file again
            editor.getNode().css('cursor', '');
            $('div.selection', editor.getNode()).css('cursor', '');
            $('div.move', editor.getNode()).css('cursor', '');
        }

        /**
         * Handler function for mouse down events on resize handles. This function
         * is bound to 'mousedown'.
         *
         * @param {Event} e1
         *  The event object.
         *
         * @param {Event} e2
         *  The event object, generated by triggerHandler in editor.
         *
         */
        function mouseDownOnResizeHandler(e1, e2) {
            if (mousedownevent === true) { return; }
            var event = e1.pageX ? e1 : e2;  // from triggerHandler in editor only e2 can be used
            mousedownevent = true;
            mouseDownOnDrawing(event, drawingNode, event.data.pos);
        }

        /**
         * Handler function for mouse down events on moveable handles. This function
         * is bound to 'mousedown'.
         *
         * @param {Event} e1
         *  The event object.
         *
         * @param {Event} e2
         *  The event object, generated by triggerHandler in editor.
         *
         */
        function mouseDownOnMoveableHandler(e1, e2) {
            if ((! options.moveable) || (mousedownevent === true)) { return; }
            var event = e1.pageX ? e1 : e2;  // from triggerHandler in editor only e2 can be used
            mousedownevent = true;
            mouseDownOnDrawing(event, drawingNode, undefined);
        }

        /**
         * Handler function for mouse move events. This function
         * is bound to 'mousemove'.
         *
         * @param {Event} e
         *  The event object.
         *
         */
        function mouseMoveOnDrawingHandler(e) {
            if (! mousedownevent) return;
            mouseMoveOnDrawing(e, moveBox);
        }

        /**
         * Handler function for mouse up events. This function
         * is bound to 'mouseup'.
         *
         * @param {Event} e
         *  The event object.
         *
         */
        function mouseUpOnDrawingHandler(e) {
            if (mousedownevent === true) {
                mousedownevent = false;
                mouseUpOnDrawing(e, drawingNode, moveBox);
            }
        }

        // inline drawings are not moveable
        if (DOM.isInlineDrawingNode(drawing)) {
            options.moveable = false;
        } else if (DOM.isFloatingDrawingNode(drawing)) {
            options.moveable = true;
        }

        $(drawing).each(function () {

            // the container element used to visualize the selection
            selectionBox = $(this).children('div.selection');
            // the container element used to visualize the movement and resizing
            moveBox = $(this).children('div.move');

            mousedownevent = false;
            drawingNode = this;

            // create a new selection box and a move box if missing
            if (selectionBox.length === 0) {
                $(this).append(selectionBox = $('<div>').addClass('selection')).append(moveBox = $('<div>').addClass('move'));

                if (options.sizeable) {
                    // add resize handles
                    _(['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l']).each(function (pos) {
                        var handleDiv = null;
                        handleDiv = $('<div>').on('mousedown', {pos: pos}, mouseDownOnResizeHandler);
                        selectionBox.append(handleDiv.addClass('handle ' + pos));
                    });
                }

                if (options.moveable) {
                    // moving the drawing
                    $(this).on('mousedown', mouseDownOnMoveableHandler);
                }

                // mousemove and mouseup events can be anywhere on the page -> binding to $(document)
                $(document).on({'mousemove': mouseMoveOnDrawingHandler, 'mouseup': mouseUpOnDrawingHandler});

                // set classes according to passed options, and resize handles
                moveBox.toggleClass('moveable', options.moveable).toggleClass('sizeable', options.sizeable);
                selectionBox.toggleClass('moveable', options.moveable).toggleClass('sizeable', options.sizeable);
            }

            // saving the selection parameter at the drawing object to reuse them
            // when switching from 'floated' to 'inline' and vice versa
            $(this).data('drawingSelection', {editor: editor, options: options, mousedownhandler: mouseDownOnMoveableHandler, mousemovehandler: mouseMoveOnDrawingHandler, mouseuphandler: mouseUpOnDrawingHandler});
        });

    };

    /**
     * Removes the selection box from the specified drawing node.
     *
     * @param {HTMLElement|jQuery} drawings
     *  The drawings node whose selection box will be removed. If the passed
     *  value is a jQuery collection, removes the selection boxes from all
     *  contained drawings.
     */
    DrawingResize.clearDrawingSelection = function (drawings) {

        var drawingSelParams = $(drawings).data('drawingSelection');

        if (drawingSelParams) {
            $(drawings).children('div.selection').remove();
            $(drawings).children('div.move').remove();

            // removing mouseup and mousemove event handler from document and mousedown event handler from drawing
            $(document).off('mouseup', drawingSelParams.mouseuphandler);
            $(document).off('mousemove', drawingSelParams.mousemovehandler);
            $(drawings).off('mousedown', drawingSelParams.mousedownhandler);

            // removing the complete content in 'drawingSelection'
            $(drawings).data('drawingSelection', null);
        }
    };

    /**
     * Repaints the selection box from the specified drawing node.
     *
     * @param {HTMLElement|jQuery} drawings
     *  The drawings node whose selection box will be repainted. This is
     *  necessary if the drawing is switched from 'floated' to 'inline' or
     *  vice versa, because floated drawings are moveable and inline
     *  drawings are not moveable.
     */
    DrawingResize.repaintDrawingSelection = function (drawing) {

        var drawingSelParams = drawing.data('drawingSelection');

        if (drawingSelParams) {
            DrawingResize.clearDrawingSelection(drawing);
            DrawingResize.drawDrawingSelection(drawingSelParams.editor, drawing);
        }
    };

    // exports ================================================================

    return DrawingResize;

});
