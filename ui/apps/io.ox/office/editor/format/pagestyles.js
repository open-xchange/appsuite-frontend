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

define('io.ox/office/editor/format/pagestyles',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/format/stylesheets'
    ], function (Utils, DOM, StyleSheets) {

    'use strict';

    var // definitions for page attributes
        DEFINITIONS = {

            /**
             * Total width of a single page, in 1/100 of millimeters.
             */
            width: { def: 21000 },

            /**
             * Total height of a single page, in 1/100 of millimeters.
             */
            height: { def: 29700 },

            /**
             * Margin between left page border and editing area, in 1/100 of
             * millimeters.
             */
            marginl: { def: 1500 },

            /**
             * Margin between right page border and editing area, in 1/100 of
             * millimeters.
             */
            marginr: { def: 1500 },

            /**
             * Margin between top page border and editing area, in 1/100 of
             * millimeters.
             */
            margint: { def: 1500 },

            /**
             * Margin between bottom page border and editing area, in 1/100 of
             * millimeters.
             */
            marginb: { def: 1500 }

        };

    // private global functions ===============================================

    /**
     * Will be called for every page whose attributes have been changed.
     *
     * @param {jQuery} page
     *  The page container element whose character attributes have been
     *  changed, as jQuery object.
     *
     * @param {Object} attributes
     *  A map of all attributes (name/value pairs), containing the effective
     *  attribute values merged from style sheets and explicit attributes.
     */
    function updatePageFormatting(page, attributes) {

        var // effective page width (at least 2cm)
            pageWidth = Math.max(attributes.width, 2000),
            // effective page height (at least 2cm)
            pageHeight = Math.max(attributes.height, 2000),
            // left page margin
            leftMargin = Math.max(attributes.marginl, 0),
            // right page margin
            rightMargin = Math.max(attributes.marginr, 0),
            // total horizontal margin
            horizontalMargin = leftMargin + rightMargin,
            // top page margin
            topMargin = Math.max(attributes.margint, 0),
            // bottom page margin
            bottomMargin = Math.max(attributes.marginb, 0),
            // total vertical margin
            verticalMargin = topMargin + bottomMargin;

        // restrict left/right margin to keep an editing area of at least 1cm
        if ((horizontalMargin > 0) && (pageWidth - horizontalMargin < 1000)) {
            // Change margins according to ratio of original left/right margins
            // (e.g. keep left margin twice as big as right margin, if
            // specified in the original attribute values).
            leftMargin = (pageWidth - 1000) * (leftMargin / horizontalMargin);
            rightMargin = (pageWidth - 1000) * (rightMargin / horizontalMargin);
        }

        // restrict top/bottom margin to keep an editing area of at least 1cm
        if ((verticalMargin > 0) && (pageHeight - verticalMargin < 1000)) {
            // Change margins according to ratio of original top/bottom margins
            // (e.g. keep top margin twice as big as bottom margin, if
            // specified in the original attribute values).
            topMargin = (pageHeight - 1000) * (topMargin / verticalMargin);
            bottomMargin = (pageHeight - 1000) * (bottomMargin / verticalMargin);
        }

        page.css({
            width: Utils.convertHmmToCssLength(pageWidth, 'mm', 1),
            // TODO: change to 'height' when page layout is supported
            minHeight: Utils.convertHmmToCssLength(pageHeight, 'mm', 1),
            paddingLeft: Utils.convertHmmToCssLength(leftMargin, 'mm', 1),
            paddingRight: Utils.convertHmmToCssLength(rightMargin, 'mm', 1),
            paddingTop: Utils.convertHmmToCssLength(topMargin, 'mm', 1),
            paddingBottom: Utils.convertHmmToCssLength(bottomMargin, 'mm', 1)
        });
    }

    // class PageStyles =======================================================

    /**
     * Contains the style sheets for page formatting attributes. The CSS
     * formatting will be read from and written to the page container elements.
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
    function PageStyles(rootNode, documentStyles) {

        var // self reference
            self = this;

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, 'page', DEFINITIONS);

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updatePageFormatting);

        // for now, update the root node after every change event
        // TODO: page layout, update entire document formatting
        this.on('change:direct', function () { self.updateElementFormatting(rootNode); });

    } // class PageStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: PageStyles });

});
