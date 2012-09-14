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

define('io.ox/office/editor/image',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/position',
     'io.ox/office/editor/oxopam'], function (Utils, DOM, Position, OXOPaM) {

    'use strict';

    // static class Image ==================================================

    /**
     * Provides static helper methods for manipulation and calculation
     * of image nodes.
     */
    var Image = {};

    // static functions =======================================================

    /**
     * Defining the correct images attributes used in operations for an image.
     *
     * @param {Object} attr
     *  A map with formatting attribute values, mapped by the attribute
     *  names.
     *
     * @returns {Object} attr
     *  A map with operation specific attribute values.
     */
    Image.getImageOperationAttributesFromFloatMode = function (attributes) {

        var operationAttributes = {};

        if (attributes.imageFloatMode === 'inline') {
            operationAttributes.inline = true;
        } else if (attributes.imageFloatMode === 'leftFloated') {
            operationAttributes.anchorhalign = 'left';
            operationAttributes.textwrapmode = 'square';
            operationAttributes.textwrapside = 'right';
            operationAttributes.inline = false;
        } else if (attributes.imageFloatMode === 'rightFloated') {
            operationAttributes.anchorhalign = 'right';
            operationAttributes.textwrapmode = 'square';
            operationAttributes.textwrapside = 'left';
            operationAttributes.inline = false;
        } else if (attributes.imageFloatMode === 'noneFloated') {
            operationAttributes.textwrapmode = 'none';
            operationAttributes.inline = false;
        }

        return operationAttributes;
    };

    /**
     * Converting anchorType to floatMode.
     *
     * @param {String} anchorType
     *  The anchorType of an image.
     *
     * @returns {String} floatMode
     *  The floatMode of an image.
     */
    Image.getFloatModeFromAnchorType = function (anchorType) {

        var floatMode = null;

        if (anchorType === 'AsCharacter') {
            floatMode = 'inline';
        } else if (anchorType === 'FloatLeft') {
            floatMode = 'leftFloated';
        } else if (anchorType === 'FloatRight') {
            floatMode = 'rightFloated';
        } else if (anchorType === 'FloatNone') {
            floatMode = 'noneFloated';
        }

        return floatMode;
    };

    /**
     * Converting the attribute settings from the operations to the
     * anchorTypes supported by this client:
     * AsCharacter, FloatLeft, FloatRight, FloatNone
     *
     * @param {Object} attr
     *  A map with formatting attribute values, mapped by the attribute
     *  names.
     *
     * @returns {String} anchorType
     *  One of the anchor types supported by the client.
     */
    Image.getAnchorTypeFromAttributes = function (attributes) {

        var anchorType = null;

        if (attributes.anchortype) {
            anchorType = attributes.anchortype;  // internally already specified (via button)
        } else if ((attributes.inline !== undefined) && (attributes.inline !== false)) {
            anchorType = 'AsCharacter';
        } else {
            if (attributes.anchorhalign !== undefined) {

                if (attributes.anchorhalign === 'right')  {
                    anchorType = 'FloatRight';
                } else if (attributes.anchorhalign === 'left') {
                    anchorType = 'FloatLeft';
                } else if (attributes.anchorhalign === 'center') {
                    anchorType = 'FloatNone';
                }
            } else {
                if (attributes.textwrapmode !== undefined) {
                    if ((attributes.textwrapmode === 'topandbottom') || (attributes.textwrapmode === 'none')) {
                        anchorType = 'FloatNone';
                    } else if ((attributes.textwrapmode === 'square') || (attributes.textwrapmode === 'tight') || (attributes.textwrapmode === 'through')) {
                        if (attributes.textwrapside !== undefined) {
                            if (attributes.textwrapside === 'right')  {
                                anchorType = 'FloatLeft';
                            } else if (attributes.textwrapside === 'left') {
                                anchorType = 'FloatRight';
                            }
                        }
                    }
                }
            }
        }

        return anchorType;
    };

    /**
     * Converting the sizes inside the image attributes to 'mm'.
     * Additionally the names of the css attributes are used.
     *
     * @param {Object} attr
     *  A map with formatting attribute values, mapped by the attribute
     *  names.
     *
     * @returns {Object} attr
     *  A map with css specific formatting attribute values.
     */
    Image.convertAttributeSizes = function (attributes) {

        if (attributes.width) {
            attributes.width = attributes.width / 100 + 'mm';  // converting to mm
        }
        if (attributes.height) {
            attributes.height = attributes.height / 100 + 'mm';  // converting to mm
        }
        if (attributes.marginT) {
            attributes['margin-top'] = attributes.marginT / 100 + 'mm';  // converting to mm
        }
        if (attributes.marginR) {
            attributes['margin-right'] = attributes.marginR / 100 + 'mm';  // converting to mm
        }
        if (attributes.marginB) {
            attributes['margin-bottom'] = attributes.marginB / 100 + 'mm';  // converting to mm
        }
        if (attributes.marginL) {
            attributes['margin-left'] = attributes.marginL / 100 + 'mm';  // converting to mm
        }
        if ((attributes.anchorvbase) && (attributes.anchorvoffset)) {
            attributes.anchorvoffset = attributes.anchorvoffset / 100 + 'mm';  // converting to mm
        }
        if ((attributes.anchorhbase) && (attributes.anchorhoffset)) {
            attributes.anchorhoffset = attributes.anchorhoffset / 100 + 'mm';  // converting to mm
        }

        return attributes;
    };

    /**
     * Calculating the image margins to be able to change the text flow
     * around the image. Therefore it is necessary to set the attributes
     * attributes.fullLeftMargin and attributes.fullRightMargin now.
     *
     * @param {Object} attr
     *  A map with formatting attribute values, mapped by the attribute
     *  names.
     *
     * @returns {Object} attr
     *  A map with css specific formatting attribute values.
     */
    Image.calculateImageMargins = function (attributes) {

        var allMargins = {},
            fullLeftMargin = '0mm',
            fullRightMargin = '0mm',
            standardLeftMargin = '0mm',
            standardRightMargin = '0mm';

        if (attributes.paragraphWidth) {

            var imageWidth = 0,
                leftMarginWidth = 0,
                anchorhoffset = 0;

            if (attributes.width) {
                imageWidth = parseFloat(attributes.width.substring(0, attributes.width.length - 2));
            }
            if (attributes['margin-left']) {
                leftMarginWidth = parseFloat(attributes['margin-left'].substring(0, attributes['margin-left'].length - 2));
                standardLeftMargin = attributes['margin-left'];
            }
            if (attributes['margin-right']) {
                standardRightMargin = attributes['margin-right'];
            }

            if (attributes.anchorhoffset) {
                anchorhoffset = parseFloat(attributes.anchorhoffset.substring(0, attributes.anchorhoffset.length - 2));
                fullLeftMargin = anchorhoffset + leftMarginWidth;
                fullRightMargin = attributes.paragraphWidth - imageWidth - fullLeftMargin;
                fullLeftMargin += 'mm';
                fullRightMargin += 'mm';
            } else {
                // Centering the image
                var marginWidth = (attributes.paragraphWidth - imageWidth) / 2 + 'mm';
                fullLeftMargin = marginWidth;
                fullRightMargin = marginWidth;
            }

        }

        allMargins = {standardLeftMargin: standardLeftMargin,
                      standardRightMargin: standardRightMargin,
                      fullLeftMargin: fullLeftMargin,
                      fullRightMargin: fullRightMargin};

        return allMargins;
    };

    /**
     * Checking, if at least one property of the attributes is
     * relevant for images.
     *
     * @param {Object} attr
     *  A map with formatting attribute values, mapped by the attribute
     *  names.
     *
     * @returns {Boolean} containsImageProperty
     *  A boolean value, indicating if the properties are relevant for
     *  images.
     */
    Image.containsImageAttributes = function (attributes) {

        var allImageAttributes = ['inline',
                                  'width',
                                  'height',
                                  'marginL',
                                  'marginT',
                                  'marginR',
                                  'marginB',
                                  'anchorhbase',
                                  'anchorhalign',
                                  'anchorhoffset',
                                  'anchorvbase',
                                  'anchorvalign',
                                  'anchorvoffset',
                                  'textwrapmode',
                                  'textwrapside'];

        return _.any(allImageAttributes, function (attr) { return (attr in attributes); });
    };

    /**
     * Changes a formatting attributes of an image node.
     *
     * @param {Node} startnode
     *  The start node corresponding to the logical position.
     *  (Can be a jQuery object for performance reasons.)
     *
     * @param {Number[]} start
     *  The logical start position of the element or text range to be
     *  formatted.
     *
     * @param {Number[]} end
     *  The logical end position of the element or text range to be
     *  formatted.
     *
     * @param {Object} attributes
     *  A map with formatting attribute values, mapped by the attribute
     *  names.
     *
     * @returns {Object}
     *  The string for 'imageFloatMode' and the calculated start position,
     *  that is a local position of type {OXOPam.oxoPosition}.
     */
    Image.setImageAttributes = function (startnode, start, end, attributes) {

        var returnImageNode = true,
            localStart = _.copy(start, true),
            imagePosition = Position.getDOMPosition(startnode, localStart, returnImageNode),
            imageFloatMode = null;

        if (imagePosition) {
            var imageNode = imagePosition.node;

            if (Utils.getNodeName(imageNode) === 'img') {

                var anchorType = Image.getAnchorTypeFromAttributes(attributes);

                imageFloatMode = Image.getFloatModeFromAnchorType(anchorType);

                if (imageFloatMode !== null) {

                    var oldImageFloatMode = $(imageNode).data('mode');

                    if (imageFloatMode !== oldImageFloatMode) {

                        if (imageFloatMode === 'inline') {

                            attributes['margin-left'] = ($(imageNode).data('allMargins')).standardLeftMargin;
                            attributes['margin-right'] = ($(imageNode).data('allMargins')).standardRightMargin;

                            // If there are floated images, this inline image has to be shifted behind them. Then
                            // an empty text node has to be inserted before the image node.
                            // Alternatively: if data('previousInlinePosition') gesetzt ist, dann an vorherige Stelle einfügen.
                            var parent = imageNode.parentNode,
                                textSpanNode = Position.getFirstTextSpanInParagraph(parent),
                                newTextNode = $(textSpanNode).clone(true);

                            parent.insertBefore(imageNode, textSpanNode);

                            newTextNode.text('');
                            parent.insertBefore(newTextNode.get(0), imageNode);

                            $(imageNode).css('clear', 'none');

                            localStart = Position.getFirstPositionInParagraph(startnode, localStart);

                        } else {

                            if (imageFloatMode === 'noneFloated') {
                                attributes['margin-left'] = $(imageNode).data('allMargins').fullLeftMargin;
                                attributes['margin-right'] = $(imageNode).data('allMargins').fullRightMargin;
                            } else if (imageFloatMode === 'leftFloated') {
                                attributes['margin-left'] = 0;
                                attributes['margin-right'] = ($(imageNode).data('allMargins')).standardRightMargin;
                            } else if (imageFloatMode === 'rightFloated') {
                                attributes['margin-left'] = ($(imageNode).data('allMargins')).standardLeftMargin;
                                attributes['margin-right'] = 0;
                            }

                            if (oldImageFloatMode === 'inline') {
                                // inserting the image after all position spans and after all floated images.
                                var parent = imageNode.parentNode,
                                    insertNode = parent.firstChild;

                                $(imageNode).data('previousInlinePosition', localStart);
                                while ((Utils.getNodeName(insertNode) === 'span') && ($(insertNode).data('positionSpan')) || (Utils.getNodeName(insertNode) === 'img')) { insertNode = insertNode.nextSibling; }

                                parent.insertBefore(imageNode, insertNode);
                            }
                        }

                        // setting css float property
                        if (imageFloatMode === 'rightFloated') {
                            attributes.float = 'right';
                            attributes.clear = 'right';
                        } else if (imageFloatMode === 'leftFloated') {
                            attributes.float = 'left';
                            attributes.clear = 'left';
                        } else if (imageFloatMode === 'noneFloated') {
                            attributes.float = 'left'; // none-floating is simulated with left floating.
                            attributes.clear = 'left';
                        } else if (imageFloatMode === 'inline') {
                            attributes.float = 'none';
                            attributes.clear = 'none';
                        }

                        $(imageNode).data('mode', imageFloatMode).css(attributes);

                        // also setting float mode of a corresponding span, if exists
                        var spanNode = imageNode.parentNode.firstChild;
                        while ((Utils.getNodeName(spanNode) === 'span') && ($(spanNode).data('positionSpan'))) {
                            if ($(spanNode).data('spanID') === $(imageNode).data('imageID')) {
                                $(spanNode).css('float', attributes.float);
                                break;
                            } else {
                                spanNode = spanNode.nextSibling;
                            }
                        }
                    }
                }
            }
        }

        return {imageFloatMode: imageFloatMode, startPosition: localStart};
    };


    return Image;

});
