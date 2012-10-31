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
     'io.ox/office/editor/format/color',
     'io.ox/office/editor/format/stylesheets'
    ], function (Utils, DOM, Table, Color, StyleSheets) {

    'use strict';

    var // border default
        NO_BORDER = { style: 'none' },

        // definitions for table attributes
        DEFINITIONS = {

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
             * Fill color of the table.
             */
            fillcolor: {
                def: Color.AUTO,
                set: function (element, color) {
                    element.css('background-color', this.getCssColor(color, 'fill'));
                }
            },

            /**
             * Grid width of columns in relative units. It is an array of numbers
             */
            tablegrid: { def: [] },

            /**
             * Array containing information, if conditional table styles shall be used. As default
             * value, all styles shall be used, so that this array can be empty.
             */
            look: { def: [] },

            /**
             * Left border of the table (set in tablecellstyles).
             */
            borderleft: { def: NO_BORDER },

            /**
             * Top border of the table (set in tablecellstyles).
             */
            bordertop: { def: NO_BORDER },

            /**
             * Right border of the table (set in tablecellstyles).
             */
            borderright: { def: NO_BORDER },

            /**
             * Bottom border of the table (set in tablecellstyles).
             */
            borderbottom: { def: NO_BORDER },

            /**
             * Horizontal borders inside the table (set in tablecellstyles).
             */
            borderinsideh: { def: NO_BORDER },

            /**
             * Vertical borders inside the table (set in tablecellstyles).
             */
            borderinsidev: { def: NO_BORDER }

        };

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

        var // self reference
            self = this;

        // private methods ----------------------------------------------------

        /**
         * Will be called for every table element whose attributes have been
         * changed. Repositions and reformats the table according to the passed
         * attributes.
         *
         * @param {jQuery} table
         *  The <table> element whose table attributes have been changed, as
         *  jQuery object.
         *
         * @param {Object} attributes
         *  A map of all attributes (name/value pairs), containing the
         *  effective attribute values merged from style sheets and explicit
         *  attributes.
         */
        function updateTableFormatting(table, attributes) {

            Table.updateColGroup(table, attributes.tablegrid);

            var // the table cell styles/formatter
                tableCellStyles = self.getDocumentStyles().getStyleSheets('tablecell');

            // iterating over all cells in the table to set the table attributes in the cell
            table.find('> tbody > tr > td').each(function () {
                tableCellStyles.updateElementFormatting(this);
            });

        }

        /**
         * Returns the attributes of the specified attribute family contained
         * in table style sheets. Resolves the conditional attributes that
         * match the position of the passed source element.
         *
         * @param {String} family
         *  The family of the attributes to be returned from the
         *  styleAttributes object passed to this method.
         *
         * @param {Object} styleAttributes
         *  The complete 'attributes' object of a table style sheet.
         *
         * @param {jQuery} sourceNode
         *  The source node corresponding to the passed attribute family that
         *  has initially requested the formatting attributes of a table style
         *  sheet, as jQuery object.
         *
         * @returns {Object}
         *  The formatting attributes of the specified family extracted from
         *  the passed styleAttributes object, as name/value pairs.
         */
        function resolveTableStyleAttributes(family, styleAttributes, sourceNode) {

            var // the cell element (source node may be a paragraph or text span)
                cell = sourceNode.closest('td'),
                // the table row containing the cell
                row = cell.parent(),
                // whether cell is in first row
                isFirstRow = (cell.length > 0) && (row.index() === 0),
                // whether cell is in last row (jQuery.siblings() excludes the own row!)
                isLastRow = (cell.length > 0) && (row.index() === row.siblings('tr').length);

            // evaluating optional table attributes
            // family must be table, styleAttributes is the complete attr-object from
            // insertStyleSheet and sourceNode is the cell
            if (family === 'table') {

                // taking only care of 'wholetable' -> needs to be expanded
                if ((styleAttributes.wholetable) && (styleAttributes.wholetable.table)) {
                    return styleAttributes.wholetable.table;
                }

            }

            // TODO: collect attributes from the 'attributes' parameter according to the cell position

            return {};
        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, 'table', DOM.TABLE_NODE_SELECTOR, DEFINITIONS, {
            styleAttributesResolver: resolveTableStyleAttributes
        });

        // methods ------------------------------------------------------------

        /**
         * Iterates over all table elements covered by the passed DOM ranges
         * for read-only access and calls the passed iterator function.
         */
        this.iterateReadOnly = function (ranges, iterator, context) {
            // DOM.iterateAncestorNodesInRanges() passes the current element to
            // the passed iterator function exactly as expected
            return DOM.iterateAncestorNodesInRanges(ranges, rootNode, DOM.TABLE_NODE_SELECTOR, iterator, context);
        };

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateTableFormatting);

    } // class TableStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: TableStyles });

});
