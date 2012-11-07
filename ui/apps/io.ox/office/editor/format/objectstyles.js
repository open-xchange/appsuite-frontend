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
 */

define('io.ox/office/editor/format/objectstyles',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/format/stylesheets'
    ], function (Utils, DOM, StyleSheets) {

    'use strict';

    var // definitions for common object attributes
        DEFINITIONS = {

            /**
             * Width of the object, as number in 1/100 of millimeters.
             */
            width: {
                def: 0,
                format: function (element, width) {
                    element.width(Utils.convertHmmToLength(width, 'px', 0));
                }
            },

            /**
             * Height of the object, as number in 1/100 of millimeters.
             */
            height: {
                def: 0,
                format: function (element, height) {
                    element.height(Utils.convertHmmToLength(height, 'px', 0));
                }
            },

            /**
             * Margin from top border of the object to text contents, in 1/100
             * of millimeters.
             */
            margint: { def: 0 },

            /**
             * Margin from bottom border of the object to text contents, in
             * 1/100 of millimeters.
             */
            marginb: { def: 0 },

            /**
             * Margin from left border of the object to text contents, in 1/100
             * of millimeters.
             */
            marginl: { def: 0 },

            /**
             * Margin from right border of the object to text contents, in
             * 1/100 of millimeters.
             */
            marginr: { def: 0 },

            /**
             * If set to true, the object is rendered as inline element ('as
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
             * Specifies how text floats around the object.
             * - 'none': Text does not float around the object.
             * - 'square': Text floats around the bounding box of the object.
             * - 'tight': Text aligns to the left/right outline of the object.
             * - 'through': Text aligns to the entire outline of the object.
             * - 'topandbottom': Text floats above and below the object only.
             */
            textwrapmode: { def: 'none' },

            /**
             * Specifies on which side text floats around the object. Effective
             * only if the attribute 'textwrapmode' is either 'square',
             * 'tight', or 'through'.
             * - 'bothsides': Text floats at the left and right side.
             * - 'left': Text floats at the left side of the object only.
             * - 'right': Text floats at the right side of the object only.
             * - 'largest': Text floats at the larger side of the object only.
             */
            textwrapside: { def: 'bothsides' }
        },

        // predefined object attributes for floating modes used in GUI
        FLOAT_MODE_ATTRIBUTES = {
            inline:       { inline: true },
            leftFloated:  { inline: false, anchorhbase: 'column', anchorhalign: 'left', textwrapmode: 'square', textwrapside: 'right' },
            rightFloated: { inline: false, anchorhbase: 'column', anchorhalign: 'right', textwrapmode: 'square', textwrapside: 'left' },
            noneFloated:  { inline: false, anchorhbase: 'column', anchorhalign: 'center', textwrapmode: 'none' }
        },

        // values for the 'textwrapmode' attribute allowing to wrap the text around the object
        WRAPPED_TEXT_VALUES = _(['square', 'tight', 'through']);

    // private global functions ===============================================

    /**
     * Returns whether the passed 'textwrapmode' attribute allows to wrap the
     * text around the object.
     */
    function isTextWrapped(textWrapMode) {
        return WRAPPED_TEXT_VALUES.contains(textWrapMode);
    }

    /**
     * Tries to find a preceding text span for the passed object. Leading
     * floating objects in a paragraph do not have a preceding text span; in
     * this case, the first text span following the object will be returned.
     */
    function findRelatedTextSpan(object) {

        var // the text span related to the object
            span = object[0].previousSibling;

        // find preceding span
        while (span && !DOM.isTextSpan(span)) {
            span = span.previousSibling;
        }

        // no preceding span found: find following span
        if (!span) {
            span = object[0].nextSibling;
            while (span && !DOM.isTextSpan(span)) {
                span = span.nextSibling;
            }
        }

        return span;
    }

    /**
     * Will be called for every object node whose attributes have been changed.
     * Repositions and reformats the object according to the passed attributes.
     *
     * @param {jQuery} object
     *  The object node whose attributes have been changed, as jQuery object.
     *
     * @param {Object} attributes
     *  A map of all attributes (name/value pairs), containing the effective
     *  attribute values merged from style sheets and explicit attributes.
     */
    function updateObjectFormatting(object, attributes) {

        var // the paragraph element containing the object node
            paragraph = object.parent(),
            // total width of the paragraph, in 1/100 mm
            paraWidth = Utils.convertLengthToHmm(paragraph.width(), 'px'),
            // preceding node used for vertical offset
            verticalOffsetNode = object.prev(DOM.OFFSET_NODE_SELECTOR),
            // text span related to inline objects
            relatedTextSpan = null,
            // current object width, in 1/100 mm
            objectWidth = Utils.convertLengthToHmm(object.width(), 'px'),
            // offset from top/left/right margin of paragraph element, in 1/100 mm
            topOffset = 0, leftOffset = 0, rightOffset = 0,
            // margins to be applied at the object
            topMargin = 0, bottomMargin = 0, leftMargin = 0, rightMargin = 0,
            // text wrapping side (left/right/none)
            wrapMode = 'none';

        // position

        if (attributes.inline) {

            // from floating mode to inline mode
            if (object.hasClass('float')) {

                // remove CSS classes used for floating mode
                object.removeClass('float left right');

                // remove leading node used for positioning
                verticalOffsetNode.remove();

                // insert an empty text span before the inline object if missing
                if (!DOM.isTextSpan(object.prev()) && (relatedTextSpan = findRelatedTextSpan(object))) {
                    DOM.splitTextSpan(relatedTextSpan, 0).insertBefore(object);
                }
            }

            // TODO: Word uses fixed predefined margins in inline mode, we too?
            object.addClass('inline').css('margin', '0 1mm');
            // ignore other attributes in inline mode

        } else {

            // from inline mode to floating mode
            if (object.hasClass('inline')) {

                // remove CSS classes used for inline mode
                object.removeClass('inline');

                // remove leading empty text span before the object
                if (DOM.isEmptySpan(object.prev())) {
                    object.prev().remove();
                }
            }

            // calculate top offset (only if object is anchored to paragraph)
            if (attributes.anchorvbase === 'paragraph') {
                if (attributes.anchorvalign === 'offset') {
                    topOffset = Math.max(attributes.anchorvoffset, 0);
                } else {
                    // TODO: automatic alignment (top/bottom/center/...)
                    topOffset = 0;
                }
            }

            // calculate top/bottom object margins
            topMargin = Utils.minMax(attributes.margint, 0, topOffset);
            bottomMargin = Math.max(attributes.marginb, 0);

            // add or remove leading offset node used for positioning
            // TODO: support for multiple objects (also overlapping) per side
            topOffset -= topMargin;
            if (topOffset < 700) {
                // offset less than 7mm: expand top margin to top of paragraph,
                // otherwise the first text line overwrites the object
                topMargin += topOffset;
                // remove offset node
                verticalOffsetNode.remove();
            } else {
                // create offset node if not existing yet
                if (verticalOffsetNode.length === 0) {
                    verticalOffsetNode = $('<div>', { contenteditable: false }).addClass('offset').width(1).insertBefore(object);
                }
                // set height of the offset node
                verticalOffsetNode.height(Utils.convertHmmToLength(topOffset, 'px', 0));
            }

            // calculate left/right offset (only if object is anchored to column)
            if (attributes.anchorhbase === 'column') {
                switch (attributes.anchorhalign) {
                case 'center':
                    leftOffset = (paraWidth - objectWidth) / 2;
                    break;
                case 'right':
                    leftOffset = paraWidth - objectWidth;
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
            rightOffset = paraWidth - leftOffset - objectWidth;

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
                    Utils.warn('updateObjectFormatting(): invalid text wrap side: ' + attributes.textwrapside);
                    wrapMode = 'none';
                }
            } else {
                // text does not float beside object
                wrapMode = 'none';
            }

            // calculate left/right object margins
            switch (wrapMode) {

            case 'left':
                // object floats at right paragraph margin
                rightMargin = rightOffset;
                leftMargin = Math.max(attributes.marginl, 0);
                // if there is less than 6mm space available for text, occupy all space (no wrapping)
                if (leftOffset - leftMargin < 600) { leftMargin = Math.max(leftOffset, 0); }
                break;

            case 'right':
                // object floats at left paragraph margin
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

            // set floating mode to object and offset node
            object.add(verticalOffsetNode)
                .removeClass('left right')
                .addClass('float ' + ((wrapMode === 'left') ? 'right' : 'left'));

            // apply CSS formatting to object node
            object.css({
                marginTop: Utils.convertHmmToCssLength(topMargin, 'px', 0),
                marginBottom: Utils.convertHmmToCssLength(bottomMargin, 'px', 0),
                marginLeft: Utils.convertHmmToCssLength(leftMargin, 'px', 0),
                marginRight: Utils.convertHmmToCssLength(rightMargin, 'px', 0)
            });
        }
    }

    // class ObjectStyles =====================================================

    /**
     * Contains the style sheets for object formatting attributes. The CSS
     * formatting will be read from and written to object elements of any type.
     *
     * @constructor
     *
     * @extends StyleSheets
     *
     * @param {DocumentStyles} documentStyles
     *  Collection with the style containers of all style families.
     */
    function ObjectStyles(documentStyles, styleFamily, definitions, options) {

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, styleFamily, _({}).extend(DEFINITIONS, definitions));

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateObjectFormatting);

    } // class ObjectStyles

    // static methods ---------------------------------------------------------

    /**
     * Returns the object attributes that are needed to represent the passed
     * GUI floating mode.
     *
     * @param {String} floatMode
     *  The GUI floating mode.
     *
     * @returns {Object}
     *  A map with object attributes, as name/value pairs.
     */
    ObjectStyles.getAttributesFromFloatMode = function (floatMode) {
        return (floatMode in FLOAT_MODE_ATTRIBUTES) ? FLOAT_MODE_ATTRIBUTES[floatMode] : {};
    };

    /**
     * Returns the object attributes that are needed to represent the passed
     * floating mode as used in the GUI.
     *
     * @param {Object} attributes
     *  A map with object attributes, as name/value pairs.
     *
     * @returns {String}
     *  The GUI floating mode.
     */
    ObjectStyles.getFloatModeFromAttributes = function (attributes) {

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
    return StyleSheets.extend({ constructor: ObjectStyles });

});
