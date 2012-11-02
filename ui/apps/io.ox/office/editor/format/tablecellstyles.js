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
    ], function (Utils, DOM, Table, Color, StyleSheets) {  // AAA remove position

    'use strict';

    var // border default
        NO_BORDER = { style: 'none' },

        // definitions for table cell attributes
        DEFINITIONS = {

            /**
             * The number of grid columns spanned by the table cell.
             */
            gridspan: {
                def: 1,
                format: function (element, gridspan) {
                    element.attr('colspan', gridspan);
                }
            },

            /**
             * Fill color of the table cell.
             */
            fillcolor: { def: Color.AUTO },

            /**
             * Style, width and color of the left table cell border.
             */
            borderleft: { def: NO_BORDER },

            /**
             * Style, width and color of the right table cell border.
             */
            borderright: { def: NO_BORDER },

            /**
             * Style, width and color of the top table cell border.
             */
            bordertop: { def: NO_BORDER },

            /**
             * Style, width and color of the bottom table cell border.
             */
            borderbottom: { def: NO_BORDER }

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

            // fillcolor
            if (! _.isUndefined(cellAttributes.fillcolor)) {
                cell.css('background-color', this.getCssColor(cellAttributes.fillcolor, 'fill'));
                // cell.css('background-color', Color.getCssColor(cellAttributes.fillcolor, 'fill', documentStyles.getCurrentTheme()));
            } else if (! _.isUndefined(attributes.fillcolor)) {
                cell.css('background-color', this.getCssColor(attributes.fillcolor, 'fill'));
                // cell.css('background-color', Color.getCssColor(attributes.fillcolor, 'fill', documentStyles.getCurrentTheme()));
            }

            // borderleft
            if (! _.isUndefined(cellAttributes.borderleft)) {
                cell.css('border-left', this.getCssBorder(cellAttributes.borderleft));
            } else if (! _.isUndefined(attributes.borderleft)) {
                cell.css('border-left', this.getCssBorder(attributes.borderleft));
            }

            // borderright
            if (! _.isUndefined(cellAttributes.borderright)) {
                cell.css('border-right', this.getCssBorder(cellAttributes.borderright));
            } else if (! _.isUndefined(attributes.borderright)) {
                cell.css('border-right', this.getCssBorder(attributes.borderright));
            }

            // bordertop
            if (! _.isUndefined(cellAttributes.bordertop)) {
                cell.css('border-top', this.getCssBorder(cellAttributes.bordertop));
            } else if (! _.isUndefined(attributes.bordertop)) {
                cell.css('border-top', this.getCssBorder(attributes.bordertop));
            }

            // borderbottom
            if (! _.isUndefined(cellAttributes.borderbottom)) {
                cell.css('border-bottom', this.getCssBorder(cellAttributes.borderbottom));
            } else if (! _.isUndefined(attributes.borderbottom)) {
                cell.css('border-bottom', this.getCssBorder(attributes.borderbottom));
            }

        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, 'cell', 'td', DEFINITIONS, {
            parentStyleFamily: 'table'
        });

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateTableCellFormatting);

    } // class TableCellStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: TableCellStyles });

});
