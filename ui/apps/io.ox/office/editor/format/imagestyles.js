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

define('io.ox/office/editor/format/imagestyles',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/format/drawingstyles'
    ], function (Utils, DOM, DrawingStyles) {

    'use strict';

    var // definitions for image attributes
        DEFINITIONS = {

            /**
             * Amount of left part of the image cropped outside the object
             * border, in percent.
             */
            cropl: { def: 0 },

            /**             * Amount of right part of the image cropped outside the object
             * border, in percent.
             */
            cropr: { def: 0 },

            /**
             * Amount of top part of the image cropped outside the object
             * border, in percent.
             */
            cropt: { def: 0 },

            /**
             * Amount of bottom part of the image cropped outside the object
             * border, in percent.
             */
            cropb: { def: 0 }

        };

    // private global functions ===============================================

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
     * Will be called for every image element whose attributes have been
     * changed. Repositions and reformats the image according to the passed
     * attributes.
     *
     * @param {jQuery} object
     *  The object node containing an image whose attributes have been changed,
     *  as jQuery object.
     *
     * @param {Object} attributes
     *  A map of all attributes (name/value pairs), containing the effective
     *  attribute values merged from style sheets and explicit attributes.
     */
    function updateImageFormatting(object, attributes) {

        var // current object width, in 1/100 mm
            objectWidth = Utils.convertLengthToHmm(object.width(), 'px'),
            // current object height, in 1/100 mm
            objectHeight = Utils.convertLengthToHmm(object.height(), 'px'),
            // horizontal offset/size of the bitmap, as CSS attributes
            horizontalSettings = calculateBitmapSettings(objectWidth, attributes.cropl, attributes.cropr),
            // vertical offset/size of the bitmap, as CSS attributes
            verticalSettings = calculateBitmapSettings(objectHeight, attributes.cropt, attributes.cropb);

        // set CSS formatting at the <img> element
        object.find('img').css({
            left: horizontalSettings.offset,
            top: verticalSettings.offset,
            width: horizontalSettings.size,
            height: verticalSettings.size
        });
    }

    // class ImageStyles ======================================================

    /**
     * Contains the style sheets for image formatting attributes. The CSS
     * formatting will be read from and written to <img> elements.
     *
     * @constructor
     *
     * @extends DrawingStyles
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing all elements formatted by the style sheets of
     *  this container. If this object is a jQuery collection, uses the first
     *  node it contains.
     *
     * @param {DocumentStyles} documentStyles
     *  Collection with the style containers of all style families.
     */
    function ImageStyles(rootNode, documentStyles) {

        // base constructor ---------------------------------------------------

        DrawingStyles.call(this, documentStyles, 'image', DEFINITIONS);

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateImageFormatting);

    } // class ImageStyles

    // exports ================================================================

    // derive this class from class ObjectsStyles
    return DrawingStyles.extend({ constructor: ImageStyles });

});
