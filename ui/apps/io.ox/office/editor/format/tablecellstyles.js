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
     'io.ox/office/editor/format/border',
     'io.ox/office/editor/format/stylesheets'
    ], function (Utils, DOM, Table, Color, Border, StyleSheets) {

    'use strict';

    var // definitions for table cell attributes
        DEFINITIONS = {

            /**
             * The number of grid columns spanned by the table cell.
             */
            gridSpan: {
                def: 1,
                scope: 'element',
                format: function (element, gridSpan) {
                    element.attr('colspan', gridSpan);
                }
            },

            /**
             * Fill color of the table cell.
             */
            fillColor: {
                def: Color.AUTO,
                format: function (element, color) {
                    element.css('background-color', this.getCssColor(color, 'fill'));
                }
            },

            /**
             * Style, width and color of the left table cell border.
             */
            borderLeft: {
                def: Border.NONE,
                format: function (element, border) {
                    element.css('border-left', this.getCssBorder(border));
                }
            },

            /**
             * Style, width and color of the right table cell border.
             */
            borderRight: {
                def: Border.NONE,
                format: function (element, border) {
                    element.css('border-right', this.getCssBorder(border));
                }
            },

            /**
             * Style, width and color of the top table cell border.
             */
            borderTop: {
                def: Border.NONE,
                format: function (element, border) {
                    element.css('border-top', this.getCssBorder(border));
                }
            },

            /**
             * Style, width and color of the bottom table cell border.
             */
            borderBottom: {
                def: Border.NONE,
                format: function (element, border) {
                    element.css('border-bottom', this.getCssBorder(border));
                }
            },

            /**
             * Inner horizontal table cell borders, used in table style sheets
             * to format inner borders of specific table areas (first/last
             * column, inner vertical bands, ...).
             */
            borderInsideHor: {
                def: Border.NONE,
                scope: 'style'
            },

            /**
             * Inner vertical table cell borders, used in table style sheets to
             * format inner borders of specific table areas (first/last row,
             * inner horizontal bands, ...).
             */
            borderInsideVert: {
                def: Border.NONE,
                scope: 'style'
            }

        },

        // parent families with parent element resolver functions
        PARENT_FAMILIES = {
            table: function (cell) { return cell.closest(DOM.TABLE_NODE_SELECTOR); }
        };

    // class TableCellStyles ==================================================

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

        /**
         * Will be called for every table cell element whose attributes have
         * been changed. Reformats the table cell according to the passed
         * attributes.
         *
         * @param {jQuery} cell
         *  The table cell element whose table attributes have been changed, as
         *  jQuery object.
         *
         * @param {Object} mergedAttributes
         *  A map of attribute value maps (name/value pairs), keyed by
         *  attribute family, containing the effective attribute values merged
         *  from style sheets and explicit attributes.
         */
        function updateTableCellFormatting(cell, mergedAttributes) {

            var // the paragraph style sheet container
                paragraphStyles = documentStyles.getStyleSheets('paragraph');

            // update all paragraphs in the table cell
            Utils.iterateSelectedDescendantNodes(DOM.getCellContentNode(cell), DOM.PARAGRAPH_NODE_SELECTOR, function (paragraph) {
                paragraphStyles.updateElementFormatting(paragraph, mergedAttributes);
            }, undefined, { children: true });
        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, { updateHandler: updateTableCellFormatting });

    } // class TableCellStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend(TableCellStyles, 'cell', DEFINITIONS, { parentFamilies: PARENT_FAMILIES });

});
