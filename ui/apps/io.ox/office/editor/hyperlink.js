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
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/dialogs',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/position',
     'gettext!io.ox/office/main'
    ], function (Utils, Dialogs, DOM, Position, gt) {

    'use strict';

    // static class Image =====================================================

    /**
     * Provides static helper methods for manipulation and calculation
     * of a hyperlink.
     */
    var Hyperlink = {
        Separators : [ '!', '?', '.', ' ', '-', ':', ',', '\u00a0']
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
    Hyperlink.showDialog = function (text, url) {

        return Hyperlink.showHyperlinkDialog({
            title: gt('Insert/Edit Hyperlink'),
            valueURL: url,
            placeholderURL: gt('Enter URL'),
            valueText: text,
            placeholderText: gt('Enter visible text'),
            okLabel: gt('Insert')
        });
    };

    /**
     * Provides the url of a selection without range
     *
     * @param selection {Selection}
     *  A selection object which describes the current
     *  selection.
     *
     * @returns {String}
     *  The url as string or null if no url character
     *  attribute is set at the selection.
     */
    Hyperlink.getURLFromPosition = function (editor, selection) {
        var url = null;

        if (!selection.hasRange()) {
            // find out a possible URL set for the current position
            var startPosition = selection.getStartPosition(),
                obj = Position.getDOMPosition(editor.getNode(), startPosition),
                characterStyles = editor.getStyleSheets('character');

            if (obj && obj.node && DOM.isTextSpan(obj.node.parentNode)) {
                var styles = characterStyles.getElementAttributes(obj.node.parentNode);
                if (styles.url && styles.url.length > 0) {
                    // Now we have to check some edge cases to prevent to show
                    // the popup for a paragraph which contains only an empty span
                    // having set the url attribute.
                    if ((obj.node.parentNode.innerText.length > 0) ||
                        (obj.node.parentNode.previousElementSibling !== null) ||
                        (DOM.isTextSpan(obj.node.parentNode.nextElementSibling)))
                        url = styles.url;
                }
            }
        }

        return url;
    };

    /**
     * Tries to find a selection range based on the current text cursor
     * position. The url character style is used to find a consecutive
     * @param editor
     * @param selection
     * @returns
     */
    Hyperlink.findSelectionRange = function (editor, selection) {
        var newSelection = null;

        if (!selection.hasRange() && selection.getEnclosingParagraph()) {
            var paragraph = selection.getEnclosingParagraph(),
                pos = null,
                startSelection = selection.getStartPosition(),
                url = null,
                characterStyles = editor.getStyleSheets('character'),
                obj = null;

            pos = startSelection[startSelection.length - 1];

            if (!selection.hasRange()) {
                // find out a possible URL set for the current position
                obj = Position.getDOMPosition(editor.getNode(), startSelection);
                if (obj && obj.node && DOM.isTextSpan(obj.node.parentNode)) {
                    var styles = characterStyles.getElementAttributes(obj.node.parentNode);
                    if (styles.url && styles.url.length > 0)
                        url = styles.url;
                }
            }

            if (url) {
                newSelection = Hyperlink.findURLSelection(editor, obj.node.parentNode, pos, url);
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
     * @param node {
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
    Hyperlink.findURLSelection = function (editor, node, pos, url) {
        var startPos,
            endPos,
            startNode = node,
            endNode = node,
            styles = null,
            characterStyles = editor.getStyleSheets('character');

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

    /**
     * Find a text selection based on the provided position which is limited
     * by separator characters.
     *
     * @param paragraph {HTMLElement|jQuery}
     *  The paragraph which contains the position provided as the second
     *  argument.
     * @param pos {Number}
     *  The position relative inside the paragraph
     *
     * @returns {Object}
     *  An object which contains the start and end position relative to
     *  the provided paragraph. Both can be null if there is no selection
     *  and the hyperlink should inserted at pos.
     */
    Hyperlink.findTextSelection = function (paragraph, pos) {
        var text = '',
            startFound = false,
            startPos = -1,
            endPos = -1,
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

    /**
     * Tries to find the left position of a word using a
     * predefined separator array.
     *
     * @param text {String}
     *  The text which should be parsed to find the left bound of
     *  a selection.
     *
     * @param offset {Number}
     *  An offset to be used to provide correct position data.
     *
     * @param pos {Number}
     *  The absolute position to start with (pos - offset) is
     *  the relative position in the provided text.
     *
     * @returns {Number}
     *  The absolute position of the left boundary or -1 if the
     *  current position is the boundary.
     */
    Hyperlink.findLeftWordPosition = function (text, offset, pos) {
        var i = pos - offset;

        if (_.contains(Hyperlink.Separators, text[i]))
            return -1;

        while (i >= 0 && !_.contains(Hyperlink.Separators, text[i])) {
            i--;
        }
        return offset + i + 1;
    };

    /**
     * Tries to find the right position of a word using a
     * predefined separator array.
     *
     * @param text {String}
     *  The text which should be parsed to find the right bound of
     *  a selection.
     *
     * @param offset {Number}
     *  An offset to be used to provide correct position data.
     *
     * @param pos {Number}
     *  The absolute position to start with (pos - offset) is
     *  the relative position in the provided text.
     *
     * @returns {Number}
     *  The absolute position of the right boundary or -1 if the
     *  current position is the boundary.
     */
    Hyperlink.findRightWordPosition = function (text, offset, pos) {
        var i = pos - offset, length = text.length;

        if (_.contains(Hyperlink.Separators, text[i]))
            return -1;

        while (i < length && !_.contains(Hyperlink.Separators, text[i])) {
            i++;
        }
        return offset + i;
    };

    /**
     * Checks an URL based on some basic rules. This is not a fully
     * compliant URL check.
     * @param url {String}
     *
     * @returns {boolean}
     *  true if the url seems to be correct otherwise false
     */
    Hyperlink.checkURL = function (url) {
        return (/^([a-z]([a-z]|\d|\+|-|\.)*):(\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?((\[(|(v[\da-f]{1,}\.(([a-z]|\d|-|\.|_|~)|[!\$&'\(\)\*\+,;=]|:)+))\])|((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=])*)(:\d*)?)(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*|(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)){0})(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url));
    };

    /**
     * Shows a hyperlink input dialog.
     *
     * @param {Object} [options]
     *  Additional options that control the appearance and behavior of the
     *  dialog. The following options are supported:
     *  @param {String} [options.title]
     *      If specified, the title of the dialog window that will be shown in
     *      a larger font.
     *  @param {String} [options.valueText='']
     *      The initial value of the text field.
     *  @param {String} [options.placeholderText='']
     *      The place-holder text that will be shown in the empty text field.
     *  @param {String} [options.valueURL='']
     *      The initial value of the URL field.
     *  @param {String} [options.placeholderURL='']
     *      The place-holder text that will be shown in the empty URL field.
     *  @param {String} [options.okLabel=gt('OK')]
     *      The label of the primary button that triggers the intended action
     *      by resolving the promise object returned by this method.
     *  @param {String} [options.cancelLabel=gt('Cancel')]
     *      The label of the Cancel button that rejects the promise object
     *      returned by this method.
     *
     * @returns {jQuery.Promise}
     *  The promise of a deferred object that will be resolved if the primary
     *  button or the remove button have been activated, or rejected if the
     *  dialog has been canceled.
     *  The done handlers registered at the promise object will receive a
     *  object containing the text and url entered by the user. The object
     *  contains null for text and url if remove has been clicked.
     */
    Hyperlink.showHyperlinkDialog = function (options) {

        var // the text input fields
            inputurlid = _.uniqueId('url'),
            inputtextid = _.uniqueId('text'),

            // the dialog object
            dialog = Dialogs.createDialog(options)
            .append(
                $('<div>').addClass('row-fluid').css({'margin-top': '10px'}).append(
                    $('<div>').addClass('control-group').css({'margin-bottom': '0px'}).append(
                        $('<label>').addClass('control-label').attr('for', inputtextid).text(gt('Text:')),
                        $('<div>').addClass('controls').css({'margin-right': '10px'}).append(
                            $('<input>', { value: Utils.getStringOption(options, 'valueText', ''), placeholder: Utils.getStringOption(options, 'placeholderURL', '')})
                            .addClass('nice-input')
                            .css({'width': '100%'})
                            .attr('data-property', 'text')
                            .attr('id', inputtextid))
                        )
                    )
                )
            .append(
                $('<div>').addClass('row-fluid').css({'margin-top': '10px'}).append(
                    $('<div>').addClass('control-group').css({'margin-bottom': '0px'}).append(
                        $('<label>').addClass('control-label').attr('for', inputurlid).text(gt('URL:')),
                        $('<div>').addClass('controls').css({'margin-right': '10px'}).append(
                            $('<input>', { value: Utils.getStringOption(options, 'valueURL', '')})
                            .addClass('nice-input')
                            .css({'width': '100%'})
                            .attr('data-property', 'url')
                            .attr('id', inputurlid))
                            )
                        )
                    ),

            // the result deferred
            def = $.Deferred();

        // add OK and Cancel buttons & remove button to remove hyperlink
        dialog.addButton('cancel', Utils.getStringOption(options, 'cancelLabel', gt('Cancel')));
        dialog.addPrimaryButton('ok', Utils.getStringOption(options, 'okLabel', gt('OK')));
        dialog.addDangerButton('remove', Utils.getStringOption(options, 'removeLabel', gt('Remove')));

        // show the dialog and register listeners for the results
        dialog.show(function () {
            if (Utils.getStringOption(options, 'valueText', '').length > 0)
                dialog.getBody().find('[data-property="url"]').focus();
            else
                dialog.getBody().find('[data-property="text"]').focus();
        })
        .done(function (action, data, node) {
            if (action === 'ok') {
                var text = $.trim($(node).find('[data-property="text"]').val()),
                    url = $.trim($(node).find('[data-property="url"]').val()),
                    protIndex = -1;

                // add http: as default if protocol is missing
                protIndex = url.indexOf(':');
                if (protIndex === -1) {
                    url = 'http://' + url;
                }

                def.resolve({ text: text, url: url });
            } else if (action === 'remove') {
                def.resolve({ text: null, url: null });
            } else {
                def.reject();
            }
        });

        return def.promise();
    };

    // exports ================================================================

    return Hyperlink;

});
