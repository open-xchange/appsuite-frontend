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
     'io.ox/office/editor/format/stylesheets'
    ], function (Utils, DOM, StyleSheets) {

    'use strict';

    var // definitions for image attributes
        definitions = {

            /**
             * Width of the image, as number in 1/100 of millimeters.
             */
            width: {
                def: 0,
                set: function (element, width) {
                    width = (width > 0) ? Utils.convertHmmToCssLength(width, 'px', 0) : 'auto';
                    element.css('width', width);
                }
            },

            /**
             * Height of the image, as number in 1/100 of millimeters.
             */
            height: {
                def: 0,
                set: function (element, height) {
                    height = (height > 0) ? Utils.convertHmmToCssLength(height, 'px', 0) : 'auto';
                    element.css('height', height);
                }
            },

            /**
             * Margin from top border of the image to text contents, in 1/100
             * of millimeters.
             */
            margint: {
                def: 0
            },

            /**
             * Margin from bottom border of the image to text contents, in
             * 1/100 of millimeters.
             */
            marginb: {
                def: 0
            },

            /**
             * Margin from left border of the image to text contents, in 1/100
             * of millimeters.
             */
            marginl: {
                def: 0
            },

            /**
             * Margin from right border of the image to text contents, in 1/100
             * of millimeters.
             */
            marginr: {
                def: 0
            },

            /**
             * If set to true, the image is rendered as inline element ('as
             * character'), otherwise it is anchorered relative to another
             * element (page, paragraph, table cell, ...).
             */
            inline: {
                def: true
            },

            anchorhbase: {
                def: 'margin'
            },

            anchorhalign: {
                def: 'left'
            },

            anchorhoffset: {
                def: 0
            },

            anchorvbase: {
                def: 'margin'
            },

            anchorvalign: {
                def: 'top'
            },

            anchorvoffset: {
                def: 0
            },

            /**
             * Specifies how text floats around the image.
             * - 'none': Text does not float around the image.
             * - 'square': Text floats around the bounding box of the image.
             * - 'tight': Text flows around a complex outline area.
             * - 'through': Text floats through the entire image.
             * - 'topandbottom': Text floats above and below the image only.
             */
            textwrapmode: {
                def: 'none'
            },

            /**
             * Specifies on which side text floats around the image. Effective
             * only if the attribute 'textwrapmode' is either 'square' or
             * 'tight'.
             * - 'bothsides': Text floats at the left and right side.
             * - 'left': Text floats at the left side of the image only.
             * - 'right': Text floats at the right side of the image only.
             * - 'largest': Text floats at the larger side of the image only.
             */
            textwrapside: {
                def: 'bothsides'
            }
        };

    // class ImageStyles ======================================================

    /**
     * Contains the style sheets for image formatting attributes. The CSS
     * formatting will be read from and written to <img> elements.
     *
     * @constructor
     *
     * @extends StyleSheets
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

        // private methods ----------------------------------------------------

        /**
         * Global setter handler that will be called for every image element
         * whose attributes have been changed. Repositions and reformats the
         * image according to the passed attributes.
         *
         * @param {jQuery} element
         *  The <img> element whose image attributes have been changed, as
         *  jQuery object.
         *
         * @param {Object} attributes
         *  A map of all attributes (name/value pairs), containing the
         *  effective attribute values merged from style sheets and explicit
         *  attributes.
         */
        function globalSetHandler(element, attributes) {
        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, 'image', definitions, documentStyles, {
            globalSetHandler: globalSetHandler
        });

        // methods ------------------------------------------------------------

        /**
         * Iterates over all image elements covered by the passed DOM ranges
         * for read-only access and calls the passed iterator function.
         */
        this.iterateReadOnly = function (ranges, iterator, context) {
            // DOM.iterateAncestorNodesInRanges() passes the current element to
            // the passed iterator function exactly as expected
            return DOM.iterateAncestorNodesInRanges(ranges, rootNode, 'img', iterator, context);
        };

        /**
         * Iterates over all image elements covered by the passed DOM ranges
         * for read/write access and calls the passed iterator function.
         */
        this.iterateReadWrite = this.iterateReadOnly;

    } // class ParagraphStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: ImageStyles });

});
