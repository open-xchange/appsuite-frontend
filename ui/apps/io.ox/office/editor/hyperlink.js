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
 * @author Carsten Driesner <carsten.driesner@open-xchange.com>
 */

define('io.ox/office/editor/hyperlink',
    ['io.ox/office/tk/apphelper',
     'io.ox/office/tk/dialogs',
     'io.ox/office/editor/editor',
     'io.ox/office/editor/position',
     'io.ox/office/editor/selection',
     'io.ox/office/editor/dom',
     'io.ox/office/tk/utils',
     'gettext!io.ox/office/main'
    ], function (AppHelper, Dialogs, Editor, Position, Selection, DOM, Utils, gt) {
    

    'use strict';

    // static class Image =====================================================

    /**
     * Provides static helper methods for manipulation and calculation
     * of a hyperlink.
     */
    var Hyperlink = {
        Separators : [ '!', '?', '.', ' ', '-', ':', ',' ]
    };

    // static functions =======================================================

    /**
     * Shows a hyperlink input dialog.
     *
     *  @param {String} text
     *      The optional text which represents the URL
     *  @param {String} url
     *      An optional URL which is set for the supplied text
     *
     * @returns {jQuery.Promise}
     *  The promise of a deferred object that will be resolved if the primary
     *  button has been activated, or rejected if the dialog has been canceled.
     *  The done handlers registered at the promise object will receive the
     *  entered text.
     */
    Hyperlink.showHyperlinkDialog = function (text, url) {

        return Dialogs.showHyperlinkDialog({
            title: gt('Insert/Edit Hyperlink'),
            valueURL: url,
            placeholderURL: gt('Enter URL'),
            valueText: text,
            placeholderText: gt('Enter visible text'),
            okLabel: gt('Insert')
        });
    };
    
    Hyperlink.findSelectionRange = function (editor, selection) {
        var newSelection = null;
        
        if (!selection.hasRange() && selection.getEnclosingParagraph()) {
            var paragraph = selection.getEnclosingParagraph(),
                pos = null,
                startSelection = selection.getStartPosition(),
                url = null,
                characterStyles = editor.getStyleSheets('character'),
                obj = null;
        
            // find out a possible URL set for the current position
            obj = Position.getDOMPosition(editor.getNode(), startSelection);
            if (obj && obj.node && DOM.isTextSpan(obj.node.parentNode)) {
                var styles = characterStyles.getElementAttributes(obj.node.parentNode);
                if (styles.url && styles.url.length > 0)
                    url = styles.url;
            }

            pos = startSelection[startSelection.length - 1];
            
            if (url) {
                newSelection = Hyperlink.findURLSelection(editor, characterStyles, obj.node.parentNode, pos, url);
            }
            else {
                newSelection = Hyperlink.findTextSelection(paragraph, pos);
            }
        }
        
        return newSelection;
    };
    
    /**
     * Tries to find a selection based on the provided position which includes
     * @param editor {Object}
     *  The editor instance.
     * @param characterStyles {Object}
     *  The character style sheets.
     * @param node
     *  The node which includes the position
     * @param pos
     *  The position in the paragraph
     * @param url
     *  The hyperlink URL which is set as character style at pos
     * @returns {Object}
     *  Contains start and end position of the selection where both could
     *  be null which means that there is no selection but the hyperlink
     *  should be inserted at the position.
     */
    Hyperlink.findURLSelection = function (editor, characterStyles, node, pos, url) {
        var startPos,
            endPos,
            startNode = node,
            endNode = node,
            styles = null;
        
        while (endNode && endNode.nextSibling && DOM.isTextSpan(endNode.nextSibling)) {
            styles = characterStyles.getElementAttributes(endNode.nextSibling);
            if (styles.url !== url)
                break;
            endNode = endNode.nextSibling;
        }
        
        while (startNode && startNode.previousSibling && DOM.isTextSpan(startNode.previousSibling)) {
            styles = characterStyles.getElementAttributes(startNode.previousSibling);
            if (styles.url !== url)
                break;
            startNode = startNode.previousSibling;
        }
        
        startPos = Position.getPositionRangeForNode(editor.getNode(), startNode, true);
        if (startNode !== endNode) {
            endPos = Position.getPositionRangeForNode(editor.getNode(), endNode, true);
        }
        else {
            endPos = startPos;
        }
        
        return { start: startPos.start[startPos.start.length - 1], end: endPos.end[endPos.end.length - 1] };
    };
    
    Hyperlink.findTextSelection = function (paragraph, pos) {
        var text = '',
            startFound = false,
            startPos = -1,
            endPos = pos,
            selection = { start: null, end: null };
        
        Position.iterateParagraphChildNodes(paragraph, function (node, nodeStart, nodeLength, nodeOffset, offsetLength) {
            
            if (DOM.isTextSpan(node)) {
                var str = $(node).text(), mustConcat = true;
                
                if (nodeStart <= pos) {
                    if (startPos === -1)
                        startPos = nodeStart;
                    text = text.concat(str.slice(nodeOffset, nodeOffset + offsetLength));
                    mustConcat = false;
                }
                if ((nodeStart + nodeLength) > pos) {
                    if (!startFound) {
                        var leftPos = startPos;
                        
                        startFound = true;
                        startPos = Hyperlink.findLeftWordPosition(text, leftPos, pos);
                        if (startPos === -1)
                            return Utils.Break;
                        else if (leftPos < startPos)
                            text = text.slice(startPos - leftPos, text.length);
                    }
                    if (mustConcat)
                        text = text.concat(str.slice(nodeOffset, nodeOffset + offsetLength));
                    endPos = Hyperlink.findRightWordPosition(text, startPos, pos);
                    if (endPos < (nodeStart + nodeLength)) {
                        text = text.slice(0, endPos - startPos);
                        return Utils.BREAK;
                    }
                }
            }
            else {
                if (startFound)
                    return Utils.BREAK;
                else {
                    text = '';
                    startPos = -1;
                }
            }
        });
        
        if ((startPos >= 0) && (endPos >= startPos))
            selection = { start: startPos, end: endPos };
        
        return selection;
    };
    
    Hyperlink.findLeftWordPosition = function (text, offset, pos) {
        var i = pos - offset;
        
        if (_.contains(Hyperlink.Separators, text[i]))
            return -1;
        
        while (i >= 0 && !_.contains(Hyperlink.Separators, text[i])) {
            i--;
        }
        return offset + i + 1;
    };
    
    Hyperlink.findRightWordPosition = function (text, offset, pos) {
        var i = pos - offset, length = text.length;
        
        if (_.contains(Hyperlink.Separators, text[i]))
            return -1;
        
        while (i < length && !_.contains(Hyperlink.Separators, text[i])) {
            i++;
        }
        return offset + i;
    };

    // exports ================================================================

    return Hyperlink;

});
