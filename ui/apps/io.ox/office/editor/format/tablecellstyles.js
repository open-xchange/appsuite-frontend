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
        DEFINITIONS = {

            /**
             * The number of grid columns spanned by the table cell.
             */
            gridSpan: {
                def: 1,
                format: function (element, gridSpan) {
                    element.attr('colspan', gridSpan);
                }
            },

            /**
             * Fill color of the table cell.
             */
            fillColor: { def: Color.AUTO },

            /**
             * Style, width and color of the left table cell border.
             */
            borderLeft: { def: NO_BORDER },

            /**
             * Style, width and color of the right table cell border.
             */
            borderRight: { def: NO_BORDER },

            /**
             * Style, width and color of the top table cell border.
             */
            borderTop: { def: NO_BORDER },

            /**
             * Style, width and color of the bottom table cell border.
             */
            borderBottom: { def: NO_BORDER }

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

        var // self reference
            self = this;

        // private methods ----------------------------------------------------

        /**
         * Will be called for every table cell element whose attributes have been
         * changed. Repositions and reformats the table cell according to the
         * passed attributes.
         *
         * @param {jQuery} cell
         *  The <td> element whose table cell attributes have been changed, as
         *  jQuery object.
         *
         * @param {Object} attributes
         *  A map of all attributes (name/value pairs), containing the effective
         *  attribute values merged from style sheets and explicit attributes.
         */
        function updateTableCellFormatting(cell, attributes) {

            var cellAttributes = StyleSheets.getExplicitAttributes(cell);

            // fillColor
            if (! _.isUndefined(cellAttributes.fillColor)) {
                cell.css('background-color', this.getCssColor(cellAttributes.fillColor, 'fill'));
                // cell.css('background-color', Color.getCssColor(cellAttributes.fillColor, 'fill', documentStyles.getCurrentTheme()));
            } else if (! _.isUndefined(attributes.fillColor)) {
                cell.css('background-color', this.getCssColor(attributes.fillColor, 'fill'));
                // cell.css('background-color', Color.getCssColor(attributes.fillColor, 'fill', documentStyles.getCurrentTheme()));
            }

            // borderLeft
            if (! _.isUndefined(cellAttributes.borderLeft)) {
                cell.css('border-left', this.getCssBorder(cellAttributes.borderLeft));
            } else if (! _.isUndefined(attributes.borderLeft)) {
                cell.css('border-left', this.getCssBorder(attributes.borderLeft));
            }

            // borderRight
            if (! _.isUndefined(cellAttributes.borderRight)) {
                cell.css('border-right', this.getCssBorder(cellAttributes.borderRight));
            } else if (! _.isUndefined(attributes.borderRight)) {
                cell.css('border-right', this.getCssBorder(attributes.borderRight));
            }

            // borderTop
            if (! _.isUndefined(cellAttributes.borderTop)) {
                cell.css('border-top', this.getCssBorder(cellAttributes.borderTop));
            } else if (! _.isUndefined(attributes.borderTop)) {
                cell.css('border-top', this.getCssBorder(attributes.borderTop));
            }

            // borderBottom
            if (! _.isUndefined(cellAttributes.borderBottom)) {
                cell.css('border-bottom', this.getCssBorder(cellAttributes.borderBottom));
            } else if (! _.isUndefined(attributes.borderBottom)) {
                cell.css('border-bottom', this.getCssBorder(attributes.borderBottom));
            }

        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, 'cell');

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateTableCellFormatting);
        this.registerParentStyleFamily('table', function (cell) { return cell.closest(DOM.TABLE_NODE_SELECTOR); });

    } // class TableCellStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: TableCellStyles }, { DEFINITIONS: DEFINITIONS });

});
