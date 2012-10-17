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
     'io.ox/office/editor/format/stylesheets'
    ], function (Utils, StyleSheets) {

    'use strict';

    var // definitions for page attributes
        definitions = {

            /**
             * Top margin between page border and editing area, in 1/100 of
             * millimeters.
             */
            width: {
                def: 21000,
                set: function (element, width) {
                    element.width(Utils.convertHmmToLength(Math.max(width, 2000), 'px', 0));
                }
            },

            height: {
                def: 29700,
                set: function (element, height) {
                    // TODO: page layout
                }
            },

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
     *  A map of all attributes (name/value pairs), containing the
     *  effective attribute values merged from style sheets and explicit
     *  attributes.
     */
    function updatePageHandler(page, attributes) {

        var // effective page width, in 1/100 mm
            pageWidth = Utils.convertLengthToHmm(page.width(), 'px'),
            // effective page width, in 1/100 mm
            pageHeight = Utils.convertLengthToHmm(page.height(), 'px'),
            // left page margin
            leftMargin = Math.max(attributes.marginl, 0),
            // right page margin
            rightMargin = Math.max(attributes.marginr, 0),
            // top page margin
            topMargin = Math.max(attributes.margint, 0),
            // bottom page margin
            bottomMargin = Math.max(attributes.marginb, 0);

        // restrict left/right margin to keep an editing area of at least 1cm
        if (pageWidth - leftMargin - rightMargin < 1000) {
            leftMargin = rightMargin = (pageWidth - 1000) / 2;
        }

        // restrict top/bottom margin to keep an editing area of at least 1cm
        if (pageHeight - topMargin - bottomMargin < 1000) {
            // TODO: enable when page layout is supported
            // topMargin = bottomMargin = (pageHeight - 1000) / 2;
        }

        page.css({
            marginLeft: Utils.convertHmmToCssLength(leftMargin, 'px', 0),
            marginRight: Utils.convertHmmToCssLength(rightMargin, 'px', 0),
            marginTop: Utils.convertHmmToCssLength(topMargin, 'px', 0),
            marginBottom: Utils.convertHmmToCssLength(bottomMargin, 'px', 0)
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

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, 'page', definitions, documentStyles, {
            updateHandler: updatePageHandler
        });

        // methods ------------------------------------------------------------

        /**
         * Iterates over all page elements covered by the passed DOM ranges for
         * read-only access and calls the passed iterator function.
         */
        this.iterateReadOnly = function (ranges, iterator, context) {
            // currently, the root node IS the page (this may change in the future!)
            iterator.call(context, rootNode);
        };

        /**
         * Iterates over all page elements covered by the passed DOM ranges for
         * read/write access and calls the passed iterator function.
         */
        this.iterateReadWrite = this.iterateReadOnly;

    } // class PageStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: PageStyles });

});
