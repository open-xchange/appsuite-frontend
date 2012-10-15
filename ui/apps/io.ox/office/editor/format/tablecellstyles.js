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

define('io.ox/office/editor/format/tablecellstyles',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/table',
     'io.ox/office/editor/format/color',
     'io.ox/office/editor/format/stylesheets'
    ], function (Utils, DOM, Table, Color, StyleSheets) {

    'use strict';

    var // border default
        NO_BORDER = { style: 'none' },

        // definitions for table cell attributes
        definitions = {

            /**
             * The number of grid columns spanned by the table cell.
             */
            gridspan: {
                def: 1,
                set: function (element, gridspan) {
                    element.attr('colspan', gridspan);
                }
            },

            /**
             * Style, width and color of the left table cell border.
             */
            borderleft: {
                def: NO_BORDER,
                set: function (element, border) {
                    element.css('border-left', this.getCssBorder(border));
                }
            },

            /**
             * Style, width and color of the right table cell border.
             */
            borderright: {
                def: NO_BORDER,
                set: function (element, border) {
                    element.css('border-right', this.getCssBorder(border));
                }
            },

            /**
             * Style, width and color of the top table cell border.
             */
            bordertop: {
                def: NO_BORDER,
                set: function (element, border) {
                    element.css('border-top', this.getCssBorder(border));
                }
            },

            /**
             * Style, width and color of the bottom table cell border.
             */
            borderbottom: {
                def: NO_BORDER,
                set: function (element, border) {
                    element.css('border-bottom', this.getCssBorder(border));
                }
            }

        };

    // private global functions ===============================================

    /**
     * Will be called for every table cell element whose attributes have been
     * changed. Repositions and reformats the table cell according to the
     * passed attributes.
     *
     * @param {jQuery} cell
     *  The <th> or <td> element whose table cell attributes have been changed,
     *  as jQuery object.
     *
     * @param {Object} attributes
     *  A map of all attributes (name/value pairs), containing the effective
     *  attribute values merged from style sheets and explicit attributes.
     */
    function updateTableCellFormatting(cell, attributes) {
    }

    // class TableCellStyles ======================================================

    /**
     * Contains the style sheets for table cell formatting attributes. The CSS
     * formatting will be read from and written to <th> and <td> elements.
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
    function TableCellStyles(rootNode, documentStyles) {

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, 'tablecell', definitions, documentStyles, {
            globalSetHandler: updateTableCellFormatting
        });

        // methods ------------------------------------------------------------

        /**
         * Iterates over all table cell elements covered by the passed DOM ranges
         * for read-only access and calls the passed iterator function.
         */
        this.iterateReadOnly = function (ranges, iterator, context) {
            // DOM.iterateAncestorNodesInRanges() passes the current element to
            // the passed iterator function exactly as expected
            return DOM.iterateAncestorNodesInRanges(ranges, rootNode, 'th, td', iterator, context);
        };

        /**
         * Iterates over all image elements covered by the passed DOM ranges
         * for read/write access and calls the passed iterator function.
         */
        this.iterateReadWrite = this.iterateReadOnly;

    } // class TableCellStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: TableCellStyles });

});
