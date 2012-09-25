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

            width: {
                def: 0,
                set: function (element, width) {}
            },

            height: {
                def: 0,
                set: function (element, height) {}
            },

            marginT: {
                def: 0,
                set: function (element, margin) {}
            },

            marginB: {
                def: 0,
                set: function (element, margin) {}
            },

            marginL: {
                def: 0,
                set: function (element, margin) {}
            },

            marginR: {
                def: 0,
                set: function (element, margin) {}
            },

            inline: {
                def: true,
                set: function (element, state) {}
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

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, 'image', definitions, documentStyles);

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
