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
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 * @author Ingo Schmidt-Rosbiegal <ingo.schmidt-rosbiegal@open-xchange.com>
 */

define('io.ox/office/editor/format/drawingstyles',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/format/stylesheets'
    ], function (Utils, DOM, StyleSheets) {

    'use strict';

    var // definitions for common drawing attributes
        DEFINITIONS = {

            /**
             * Width of the drawing, as number in 1/100 of millimeters.
             */
            width: {
                def: 0,
                format: function (element, width) {
                    element.width(Utils.convertHmmToLength(width, 'px', 0));
                }
            },

            /**
             * Height of the drawing, as number in 1/100 of millimeters.
             */
            height: {
                def: 0,
                format: function (element, height) {
                    element.height(Utils.convertHmmToLength(height, 'px', 0));
                }
            },

            /**
             * Margin from top border of the drawing to text contents, in 1/100
             * of millimeters.
             */
            margint: { def: 0 },

            /**
             * Margin from bottom border of the drawing to text contents, in
             * 1/100 of millimeters.
             */
            marginb: { def: 0 },

            /**
             * Margin from left border of the drawing to text contents, in 1/100
             * of millimeters.
             */
            marginl: { def: 0 },

            /**
             * Margin from right border of the drawing to text contents, in
             * 1/100 of millimeters.
             */
            marginr: { def: 0 },

            /**
             * If set to true, the drawing is rendered as inline element ('as
             * character'), otherwise it is anchored relative to another
             * element (page, paragraph, table cell, ...).
             */
            inline: { def: true },

            anchorhbase: { def: 'margin' },

            anchorhalign: { def: 'left' },

            anchorhoffset: { def: 0 },

            anchorvbase: { def: 'margin' },

            anchorvalign: { def: 'top' },

            anchorvoffset: { def: 0 },

            /**
             * Specifies how text floats around the drawing.
             * - 'none': Text does not float around the drawing.
             * - 'square': Text floats around the bounding box of the drawing.
             * - 'tight': Text aligns to the left/right outline of the drawing.
             * - 'through': Text aligns to the entire outline of the drawing.
             * - 'topandbottom': Text floats above and below the drawing only.
             */
            textwrapmode: { def: 'none' },

            /**
             * Specifies on which side text floats around the drawing. Effective
             * only if the attribute 'textwrapmode' is either 'square',
             * 'tight', or 'through'.
             * - 'bothsides': Text floats at the left and right side.
             * - 'left': Text floats at the left side of the drawing only.
             * - 'right': Text floats at the right side of the drawing only.
             * - 'largest': Text floats at the larger side of the drawing only.
             */
            textwrapside: { def: 'bothsides' },

            /**
             * Image Data. The string contains either base64 image data, or svg.
             * If base64 encoded image data is used, the string begins with "data:"
             * otherwise if svg is used it begins with "<svg"
             */
            replacementdata: { def: ''},

            // Image specific attributes

            /**
             * URL pointing to the image data. If the image was embedded in the
             * document archive, the URL will be relativ to the document (image specific style).
             */
            imgurl: { def: ''},

            /**
             * Image data (image specific style).
             */
            imgdata: { def: ''},

            /**
             * Amount of left part of the image cropped outside the object
             * border, in percent (image specific style).
             */
            cropl: { def: 0 },

            /**
             * Amount of right part of the image cropped outside the object
             * border, in percent (image specific style).
             */
            cropr: { def: 0 },

            /**
             * Amount of top part of the image cropped outside the object
             * border, in percent (image specific style).
             */
            cropt: { def: 0 },

            /**
             * Amount of bottom part of the image cropped outside the object
             * border, in percent (image specific style).
             */
            cropb: { def: 0 }

        },

        // predefined drawing attributes for floating modes used in GUI
        FLOAT_MODE_ATTRIBUTES = {
            inline:       { inline: true },
            leftFloated:  { inline: false, anchorhbase: 'column', anchorhalign: 'left', textwrapmode: 'square', textwrapside: 'right', anchorhoffset: undefined },
            rightFloated: { inline: false, anchorhbase: 'column', anchorhalign: 'right', textwrapmode: 'square', textwrapside: 'left', anchorhoffset: undefined },
            noneFloated:  { inline: false, anchorhbase: 'column', anchorhalign: 'center', textwrapmode: 'none', anchorhoffset: undefined }
        },

        // values for the 'textwrapmode' attribute allowing to wrap the text around the drawing
        WRAPPED_TEXT_VALUES = _(['square', 'tight', 'through']);

    // private global functions ===============================================

    /**
     * Returns whether the passed 'textwrapmode' attribute allows to wrap the
     * text around the drawing.
     */
    function isTextWrapped(textWrapMode) {
        return WRAPPED_TEXT_VALUES.contains(textWrapMode);
    }

    /**
     * Tries to find a preceding text span for the passed drawing. Leading
     * floating drawings in a paragraph do not have a preceding text span; in
     * this case, the first text span following the drawing will be returned.
     */
    function findRelatedTextSpan(drawing) {

        var // the closest preceding text span
            span = Utils.findPreviousSiblingNode(drawing, function () { return DOM.isTextSpan(this); });

        // no preceding span found: find following span
        if (!span) {
            span = Utils.findNextSiblingTextSpan(drawing, function () { return DOM.isTextSpan(this); });
        }

        return span;
    }

    /**
     * Calculates the offset and size of the bitmap in an image object for one
     * dimension (either horizontally or vertically), according to the passed
     * cropping settings.
     *
     * @param {Number} objectSize
     *  With/height of the object node, in 1/100 of millimeters.
     *
     * @param {Number} leadingCrop
     *  The leading cropping value (left/top), in percent.
     *
     * @param {Number} trailingCrop
     *  The trailing cropping value (right/bottom), in percent.
     *
     * @returns {Object}
     *  An object containing 'offset' and 'size' CSS attributes specifying how
     *  to format the bitmap (in pixels with 'px' unit name).
     */
    function calculateBitmapSettings(objectSize, leadingCrop, trailingCrop) {

        var // sum of leading and trailing cropping (must not exceed a specific amount)
            totalCrop = leadingCrop + trailingCrop,
            // resulting settings for the bitmap
            size = 0, offset = 0;

        // do not crop more than 90% of the bitmap
        if (totalCrop > 90) {
            leadingCrop *= (90 / totalCrop);
            trailingCrop *= (90 / totalCrop);
        }

        // bitmap size and offset, according to object size and cropping
        size = objectSize * 100 / (100 - leadingCrop - trailingCrop);
        offset = (size * leadingCrop) / 100;

        // convert to CSS pixels
        return {
            offset: Utils.convertHmmToCssLength(-offset, 'px', 0),
            size: Utils.convertHmmToCssLength(size, 'px', 0)
        };
    }

    /**
     * Will be called for every drawing node whose attributes have been changed.
     * Repositions and reformats the drawing according to the passed attributes.
     *
     * @param {jQuery} drawing
     *  The drawing node whose attributes have been changed, as jQuery object.
     *
     * @param {Object} attributes
     *  A map of all attributes (name/value pairs), containing the effective
     *  attribute values merged from style sheets and explicit attributes.
     */
    function updateDrawingFormatting(drawing, attributes) {

        var // the paragraph element containing the drawing node
            paragraph = drawing.parent(),
            // total width of the paragraph, in 1/100 mm
            paraWidth = Utils.convertLengthToHmm(paragraph.width(), 'px'),
            // preceding node used for vertical offset
            verticalOffsetNode = drawing.prev(DOM.OFFSET_NODE_SELECTOR),
            // text span related to inline drawings
            relatedTextSpan = null,
            // current drawing width, in 1/100 mm
            drawingWidth = Utils.convertLengthToHmm(drawing.width(), 'px'),
            // current drawing height, in 1/100 mm
            drawingHeight = Utils.convertLengthToHmm(drawing.height(), 'px'),
            // offset from top/left/right margin of paragraph element, in 1/100 mm
            topOffset = 0, leftOffset = 0, rightOffset = 0,
            // margins to be applied at the drawing
            topMargin = 0, bottomMargin = 0, leftMargin = 0, rightMargin = 0,
            // text wrapping side (left/right/none)
            wrapMode = 'none',
            // type of the drawing: 'image', ...
            type = drawing.data('type'),
            // the content node inside the drawing
            contentNode = DOM.getDrawingContentNode(drawing),
            // image data string. if base64 image, string starts with 'data:'
            base64String = 'data:',
            // image data string. if svg image, string starts with '<svg'
            svgString = '<svg';

        // position

        if (attributes.inline) {

            // from floating mode to inline mode
            if (drawing.hasClass('float')) {

                // remove CSS classes used for floating mode
                drawing.removeClass('float left right');

                // remove leading node used for positioning
                verticalOffsetNode.remove();

                // insert an empty text span before the inline drawing if missing
                if (!DOM.isTextSpan(drawing.prev()) && (relatedTextSpan = findRelatedTextSpan(drawing))) {
                    DOM.splitTextSpan(relatedTextSpan, 0).insertBefore(drawing);
                }
            }

            // TODO: Word uses fixed predefined margins in inline mode, we too?
            drawing.addClass('inline').css('margin', '0 1mm');
            // ignore other attributes in inline mode

        } else {

            // from inline mode to floating mode
            if (drawing.hasClass('inline')) {

                // remove CSS classes used for inline mode
                drawing.removeClass('inline');

                // remove leading empty text span before the drawing
                if (DOM.isEmptySpan(drawing.prev())) {
                    drawing.prev().remove();
                }
            }

            // calculate top offset (only if drawing is anchored to paragraph)
            if (attributes.anchorvbase === 'paragraph') {
                if (attributes.anchorvalign === 'offset') {
                    topOffset = Math.max(attributes.anchorvoffset, 0);
                } else {
                    // TODO: automatic alignment (top/bottom/center/...)
                    topOffset = 0;
                }
            }

            // calculate top/bottom drawing margins
            topMargin = Utils.minMax(attributes.margint, 0, topOffset);
            bottomMargin = Math.max(attributes.marginb, 0);

            // add or remove leading offset node used for positioning
            // TODO: support for multiple drawings (also overlapping) per side
            topOffset -= topMargin;
            if (topOffset < 700) {
                // offset less than 7mm: expand top margin to top of paragraph,
                // otherwise the first text line overwrites the drawing
                topMargin += topOffset;
                // remove offset node
                verticalOffsetNode.remove();
            } else {
                // create offset node if not existing yet
                if (verticalOffsetNode.length === 0) {
                    verticalOffsetNode = $('<div>', { contenteditable: false }).addClass('offset').width(1).insertBefore(drawing);
                }
                // set height of the offset node
                verticalOffsetNode.height(Utils.convertHmmToLength(topOffset, 'px', 0));
            }

            // calculate left/right offset (only if drawing is anchored to column)
            if (attributes.anchorhbase === 'column') {
                switch (attributes.anchorhalign) {
                case 'center':
                    leftOffset = (paraWidth - drawingWidth) / 2;
                    break;
                case 'right':
                    leftOffset = paraWidth - drawingWidth;
                    break;
                case 'offset':
                    leftOffset = attributes.anchorhoffset;
                    break;
                default:
                    leftOffset = 0;
                }
            } else {
                // TODO: other anchor bases (page/character/margins/...)
                leftOffset = 0;
            }
            rightOffset = paraWidth - leftOffset - drawingWidth;

            // determine text wrapping side
            if (isTextWrapped(attributes.textwrapmode)) {
                switch (attributes.textwrapside) {
                case 'left':
                    wrapMode = 'left';
                    break;
                case 'right':
                    wrapMode = 'right';
                    break;
                case 'bothsides':
                case 'largest':
                    // no support for 'wrap both sides' in CSS, default to 'largest'
                    wrapMode = (leftOffset > rightOffset) ? 'left' : 'right';
                    break;
                default:
                    Utils.warn('updateDrawingFormatting(): invalid text wrap side: ' + attributes.textwrapside);
                    wrapMode = 'none';
                }
            } else {
                // text does not float beside drawing
                wrapMode = 'none';
            }

            // calculate left/right drawing margins
            switch (wrapMode) {

            case 'left':
                // drawing floats at right paragraph margin
                rightMargin = rightOffset;
                leftMargin = Math.max(attributes.marginl, 0);
                // if there is less than 6mm space available for text, occupy all space (no wrapping)
                if (leftOffset - leftMargin < 600) { leftMargin = Math.max(leftOffset, 0); }
                break;

            case 'right':
                // drawing floats at left paragraph margin
                leftMargin = leftOffset;
                rightMargin = Math.max(attributes.marginr, 0);
                // if there is less than 6mm space available for text, occupy all space (no wrapping)
                if (rightOffset - rightMargin < 600) { rightMargin = Math.max(rightOffset, 0); }
                break;

            default:
                // no wrapping: will be modeled by left-floated with large CSS margins
                wrapMode = 'right';
                leftMargin = leftOffset;
                rightMargin = Math.max(rightOffset, 0);
            }

            // set floating mode to drawing and offset node
            drawing.add(verticalOffsetNode)
                .removeClass('left right')
                .addClass('float ' + ((wrapMode === 'left') ? 'right' : 'left'));

            // apply CSS formatting to drawing node
            drawing.css({
                marginTop: Utils.convertHmmToCssLength(topMargin, 'px', 0),
                marginBottom: Utils.convertHmmToCssLength(bottomMargin, 'px', 0),
                marginLeft: Utils.convertHmmToCssLength(leftMargin, 'px', 0),
                marginRight: Utils.convertHmmToCssLength(rightMargin, 'px', 0)
            });
        }

        // using replacement data, if available (valid for all drawing types)
        if (attributes.replacementdata && attributes.replacementdata.length) {
            if (attributes.replacementdata.indexOf(base64String) === 0) {
                imageNode = $('<img>', { src: attributes.replacementdata });
                contentNode.append(imageNode);
            } else if (attributes.replacementdata.indexOf(svgString) === 0) {
                contentNode[0].appendChild($(attributes.replacementdata).get(0));  // do not use jQuery for this!
            }
        }

        // some attributes are specific to the drawing type
        if (type === 'image') {

            var // horizontal offset/size of the bitmap, as CSS attributes
                horizontalSettings = null,
                // vertical offset/size of the bitmap, as CSS attributes
                verticalSettings = null,
                // the image node inside the drawing node
                imageNode = contentNode.find('img'),
                // the source data or url for the image
                imgSrc = null,
                // an <img> node can be used for urls or image sources starting with 'data:'
                useImageNode = false,
                // an <svg> node can be used directly for image sources starting with '<svg'
                useSvgNode = false;

            if (! imageNode.length) {
                // inserting the image
                if (attributes.imgdata && attributes.imgdata.length) {
                    imgSrc = attributes.imgdata;
                    if (imgSrc.indexOf(base64String) === 0) {
                        useImageNode = true;
                    } else if (imgSrc.indexOf(svgString) === 0) {
                        useSvgNode = true;
                    }
                } else {
                    imgSrc = drawing.data('absoluteURL');
                    useImageNode = true;
                }

                if (useImageNode) {
                    imageNode = $('<img>', { src: imgSrc });
                    contentNode.append(imageNode);
                } else if (useSvgNode) {
                    contentNode[0].appendChild($(imgSrc).get(0));  // do not use jQuery for this!
                }
            }

            if (drawingWidth !== 0) {
                horizontalSettings = calculateBitmapSettings(drawingWidth, attributes.cropl, attributes.cropr);
                verticalSettings = calculateBitmapSettings(drawingHeight, attributes.cropt, attributes.cropb);

                // set CSS formatting at the <img> element
                imageNode.css({
                    left: horizontalSettings.offset,
                    top: verticalSettings.offset,
                    width: horizontalSettings.size,
                    height: verticalSettings.size
                });
            }
        }

    }

    // class DrawingStyles =====================================================

    /**
     * Contains the style sheets for drawing formatting attributes. The CSS
     * formatting will be read from and written to drawing elements of any type.
     *
     * @constructor
     *
     * @extends StyleSheets
     *
     * @param {DocumentStyles} documentStyles
     *  Collection with the style containers of all style families.
     */
    function DrawingStyles(rootNode, documentStyles) {

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, 'drawing', DEFINITIONS);

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateDrawingFormatting);

    } // class ImageStyles

    // static methods ---------------------------------------------------------

    /**
     * Returns the drawing attributes that are needed to represent the passed
     * GUI floating mode.
     *
     * @param {String} floatMode
     *  The GUI floating mode.
     *
     * @returns {Object}
     *  A map with drawing attributes, as name/value pairs.
     */
    DrawingStyles.getAttributesFromFloatMode = function (floatMode) {
        return (floatMode in FLOAT_MODE_ATTRIBUTES) ? FLOAT_MODE_ATTRIBUTES[floatMode] : {};
    };

    /**
     * Returns the drawing attributes that are needed to represent the passed
     * floating mode as used in the GUI.
     *
     * @param {Object} attributes
     *  A map with drawing attributes, as name/value pairs.
     *
     * @returns {String}
     *  The GUI floating mode.
     */
    DrawingStyles.getFloatModeFromAttributes = function (attributes) {

        // inline mode overrules floating attributes
        if (attributes.inline) {
            return 'inline';
        }

        // only paragraph anchor supported
        if ((attributes.anchorhbase !== 'column') || (attributes.anchorvbase !== 'paragraph')) {
            return null;
        }

        // floating mode depends on text wrapping side
        if (isTextWrapped(attributes.textwrapmode)) {
            switch (attributes.textwrapside) {
            case 'left':
                return 'rightFloated';
            case 'right':
                return 'leftFloated';
            default:
                return null;
            }
        }
        return 'noneFloated';
    };

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: DrawingStyles });

});
