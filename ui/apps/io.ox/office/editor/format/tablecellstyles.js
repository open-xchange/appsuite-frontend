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
            gridspan: {
                def: 1,
                set: function (element, gridspan) {
                    element.attr('colspan', gridspan);
                }
            },

            /**
             * Fill color of the table cell.
             */
            fillcolor: {
                def: Color.AUTO,
                set: function (element, color) {
                    element.css('background-color', this.getCssColor(color, 'fill'));
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

            // must get the table attributes
            // getElementAttributes from table
            // getExplicitAttributes from cell (static!)

            var table = cell.closest(DOM.TABLE_NODE_SELECTOR),
                // the table styles/formatter
                tableStyles = self.getDocumentStyles().getStyleSheets('table'),
                // table attributes
                tableAttributes = tableStyles.getElementAttributes(table, { sourceNode: cell }),
                // explicitly set cell attributes (that must not be overridden)
                cellAttributes = StyleSheets.getExplicitAttributes(cell),
                // setting some cell position information
                cellOrientation = DOM.evaluateCellOrientationInTable(cell);

            // _.each(tableAttributes, function (val, key) {
            //     if (_.isObject(val)) { val = JSON.stringify(val); }
            //     window.console.log("Table: " + key + " : " + val);
            // });

            // _.each(cellAttributes, function (val, key) {
            //     if (_.isObject(val)) { val = JSON.stringify(val); }
            //     window.console.log("Cell: " + key + " : " + val);
            // });

            // fillcolor
            if ((_.isUndefined(cellAttributes.fillcolor)) && (! _.isUndefined(tableAttributes.fillcolor))) {
                cell.css('background-color', this.getCssColor(tableAttributes.fillcolor, 'fill'));
            }

            // borderleft
            if ((_.isUndefined(cellAttributes.borderleft)) && (cellOrientation.firstcol) && (! _.isUndefined(tableAttributes.borderleft))) {
                cell.css('border-left', this.getCssBorder(tableAttributes.borderleft));
            }

            // borderright
            if ((_.isUndefined(cellAttributes.borderright)) && (cellOrientation.lastcol) && (! _.isUndefined(tableAttributes.borderright))) {
                cell.css('border-right', this.getCssBorder(tableAttributes.borderright));
            }

            // bordertop
            if ((_.isUndefined(cellAttributes.bordertop)) && (cellOrientation.firstrow) && (! _.isUndefined(tableAttributes.bordertop))) {
                cell.css('border-top', this.getCssBorder(tableAttributes.bordertop));
            }

            // borderbottom
            if ((_.isUndefined(cellAttributes.borderbottom)) && (cellOrientation.lastrow) && (! _.isUndefined(tableAttributes.borderbottom))) {
                cell.css('border-bottom', this.getCssBorder(tableAttributes.borderbottom));
            }

            // borderinsideh
            if ((_.isUndefined(cellAttributes.bordertop)) && (! cellOrientation.firstrow) && (! _.isUndefined(tableAttributes.borderinsideh))) {
                cell.css('border-top', this.getCssBorder(tableAttributes.borderinsideh));
            }

            // borderinsidev
            if ((_.isUndefined(cellAttributes.borderleft)) && (! cellOrientation.firstcol) && (! _.isUndefined(tableAttributes.borderinsidev))) {
                cell.css('border-left', this.getCssBorder(tableAttributes.borderinsidev));
            }

            // TODO: taking care of further optional attributes

        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, 'tablecell', 'td', DEFINITIONS);

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateTableCellFormatting);

    } // class TableCellStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: TableCellStyles });

});
