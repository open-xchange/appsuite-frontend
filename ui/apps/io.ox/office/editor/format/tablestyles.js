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

define('io.ox/office/editor/format/tablestyles',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/table',
     'io.ox/office/editor/format/stylesheets'
    ], function (Utils, DOM, Table, StyleSheets) {

    'use strict';

    var // definitions for table attributes
        definitions = {

            /**
             * Width of the table, as number in 1/100 of millimeters.
             */
            width: {
                def: 0,
                set: function (element, width) {
                    if (width === 0) {
                        element.css('width', '100%');
                    } else {
                        element.css('width', Utils.convertHmmToCssLength(width, 'px', 0));
                    }
                }
            },

            /**
             * Grid width of columns in relative units. It is an array of numbers
             */
            tablegrid: { def: [] }
        };

    // private global functions ===============================================

    /**
     * Will be called for every table element whose attributes have been
     * changed. Repositions and reformats the table according to the passed
     * attributes.
     *
     * @param {jQuery} table
     *  The <table> element whose table attributes have been changed, as jQuery
     *  object.
     *
     * @param {Object} attributes
     *  A map of all attributes (name/value pairs), containing the effective
     *  attribute values merged from style sheets and explicit attributes.
     */
    function updateTableFormatting(table, attributes) {

        Table.updateColGroup(table, attributes.tablegrid);

    }

    // class TableStyles ======================================================

    /**
     * Contains the style sheets for table formatting attributes. The CSS
     * formatting will be read from and written to <table> elements.
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
    function TableStyles(rootNode, documentStyles) {

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, 'table', definitions, documentStyles, {
            globalSetHandler: updateTableFormatting
        });

        // methods ------------------------------------------------------------

        /**
         * Iterates over all table elements covered by the passed DOM ranges
         * for read-only access and calls the passed iterator function.
         */
        this.iterateReadOnly = function (ranges, iterator, context) {
            // DOM.iterateAncestorNodesInRanges() passes the current element to
            // the passed iterator function exactly as expected
            return DOM.iterateAncestorNodesInRanges(ranges, rootNode, 'table', iterator, context);
        };

        /**
         * Iterates over all table elements covered by the passed DOM ranges
         * for read/write access and calls the passed iterator function.
         */
        this.iterateReadWrite = this.iterateReadOnly;

    } // class TableStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: TableStyles });

});
