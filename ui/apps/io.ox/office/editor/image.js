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
     'io.ox/office/editor/oxopam',
     'io.ox/office/editor/dialog/error'], function (Utils, DOM, Position, OXOPaM, ErrorDialogs) {

    'use strict';

    /**
     * Predefined image attributes for supported image float modes.
     */
    var FLOAT_MODE_ATTRIBUTES = {
            inline:       { inline: true },
            leftFloated:  { inline: false, anchorhbase: 'column', anchorhalign: 'left', textwrapmode: 'square', textwrapside: 'right' },
            rightFloated: { inline: false, anchorhbase: 'column', anchorhalign: 'right', textwrapmode: 'square', textwrapside: 'left' },
            noneFloated:  { inline: false, anchorhbase: 'column', anchorhalign: 'center', textwrapmode: 'none' }
        };

    // static class Image =====================================================

    /**
     * Provides static helper methods for manipulation and calculation
     * of image nodes.
     */
    var Image = {};

    // static functions =======================================================

    /**
     * Returns the images attributes that are needed to represent the passed
     * image float mode as used in the GUI.
     *
     * @param {String} floatMode
     *  The GUI image float mode.
     *
     * @returns {Object}
     *  A map with image attributes, as name/value pairs.
     */
    Image.getAttributesFromFloatMode = function (floatMode) {
        return (floatMode in FLOAT_MODE_ATTRIBUTES) ? FLOAT_MODE_ATTRIBUTES[floatMode] : null;
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
        if (attributes.margint) {
            attributes['margin-top'] = attributes.margint / 100 + 'mm';  // converting to mm
        }
        if (attributes.marginr) {
            attributes['margin-right'] = attributes.marginr / 100 + 'mm';  // converting to mm
        }
        if (attributes.marginb) {
            attributes['margin-bottom'] = attributes.marginb / 100 + 'mm';  // converting to mm
        }
        if (attributes.marginl) {
            attributes['margin-left'] = attributes.marginl / 100 + 'mm';  // converting to mm
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

        var fullLeftMargin = '0mm',
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

        return {
            standardLeftMargin: standardLeftMargin,
            standardRightMargin: standardRightMargin,
            fullLeftMargin: fullLeftMargin,
            fullRightMargin: fullRightMargin
        };
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
                                  'marginl',
                                  'margint',
                                  'marginr',
                                  'marginb',
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
                                while (((Utils.getNodeName(insertNode) === 'div') && $(insertNode).hasClass('float')) || (Utils.getNodeName(insertNode) === 'img')) { insertNode = insertNode.nextSibling; }

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
                        var divNode = imageNode.parentNode.firstChild;
                        while ((Utils.getNodeName(divNode) === 'div') && $(divNode).hasClass('float')) {
                            if ($(divNode).data('divID') === $(imageNode).data('imageID')) {
                                $(divNode).css('float', attributes.float);
                                break;
                            } else {
                                divNode = divNode.nextSibling;
                            }
                        }
                    }
                }
            }
        }

        return {imageFloatMode: imageFloatMode, startPosition: localStart};
    };

    /**
     * Handles the insertion of the file into the document
     *
     * @param  app the current application
     * @param  showErrorUI indicating if an alert box is shown in case of an error
     * @param  imageFile the image file to be inserted
     *
     * @param  imageFile
     */
    Image.insertFile = function (app, imageFile, showErrorUI) {
        if (app && app.getEditor() && imageFile && window.FileReader) {
            var fileReader = new window.FileReader();

            fileReader.onload = function (e) {
                if (e.target.result) {
                    $.ajax({
                        type: 'POST',
                        url: app.getDocumentFilterUrl('addfile', { add_filename: imageFile.name}),
                        dataType: 'json',
                        data: { image_data: e.target.result },
                        beforeSend: function (xhr) {
                            if (xhr && xhr.overrideMimeType) {
                                xhr.overrideMimeType('application/j-son;charset=UTF-8');
                            }
                        }
                    })
                    .done(function (response) {
                        if (response && response.data) {

                            // if added_fragment is set to a valid name,
                            // the insertioin of the image was successful
                            if (response.data.added_fragment && response.data.added_fragment.length > 0) {

                                // set version of FileDescriptor to version that is returned in response
                                app.getFileDescriptor().version = response.data.version;

                                // create an InsertImage operation with the newly added fragment
                                app.getEditor().insertImageFile(response.data.added_fragment);
                            }
                            else if (showErrorUI) {
                                ErrorDialogs.insertImageError();
                            }
                        }
                    })
                    .fail(function (response) {
                        if (showErrorUI) {
                            ErrorDialogs.insertImageError();
                        }
                    });
                }
            };

            fileReader.onerror = function (e) {
                if (showErrorUI) {
                    ErrorDialogs.insertImageError();
                }
            };

            fileReader.readAsDataURL(imageFile);
        }
    };

    /**
     * Handles the insertion of the image URL into the document
     *
     * @param  app the current application
     * @param  showErrorUI indicating if an alert box is shown in case of an error
     * @param  imageURL the imageURL to be inserted
     */
    Image.insertURL = function (app, imageURL, showErrorUI) {
        if (app && app.getEditor() && imageURL && (imageURL.search("://") !== - 1)) {
            app.getEditor().insertImageURL(imageURL);
        }
        else if (showErrorUI) {
            ErrorDialogs.insertImageError();
        }
    };

    // exports ================================================================

    return Image;

});
