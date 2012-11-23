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
                def: 'auto',
                format: function (element, width) {
                    if (width === 'auto') {
                        element.css('width', '100%');
                    } else {
                        element.css('width', Utils.convertHmmToCssLength(width, 'px', 0));
                    }
                }
            },

            /**
             * Fill color of the table.
             */
            fillColor: {
                def: Color.AUTO,
                format: function (element, color) {
                    element.css('background-color', this.getCssColor(color, 'fill'));
                }
            },

            /**
             * Grid width of columns in relative units. It is an array of numbers
             */
            tableGrid: { def: [] },

            /**
             * Array containing information, if conditional table styles shall be used. As default
             * value, all styles shall be used, so that this array can be empty.
             */
            exclude: { def: [] },

            /**
             * Left border of the table (set in tablecellstyles).
             */
            borderLeft: { def: NO_BORDER },

            /**
             * Top border of the table (set in tablecellstyles).
             */
            borderTop: { def: NO_BORDER },

            /**
             * Right border of the table (set in tablecellstyles).
             */
            borderRight: { def: NO_BORDER },

            /**
             * Bottom border of the table (set in tablecellstyles).
             */
            borderBottom: { def: NO_BORDER },

            /**
             * Horizontal borders inside the table (set in tablecellstyles).
             */
            borderInsideHor: { def: NO_BORDER },

            /**
             * Vertical borders inside the table (set in tablecellstyles).
             */
            borderInsideVert: { def: NO_BORDER }

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

            Table.updateColGroup(table, attributes.tableGrid);

            var // the table cell styles/formatter
                tableCellStyles = documentStyles.getStyleSheets('cell'),
                // the table row styles/formatter
                tableRowStyles = documentStyles.getStyleSheets('row');

            // iterating over all cells in the table to set the table attributes in the cell
            DOM.getTableRows(table).children('td').each(function () {
                tableCellStyles.updateElementFormatting(this);
            });

            // iterating over all rows in the table to set the row attributes ('height' only)
            DOM.getTableRows(table).each(function () {
                tableRowStyles.updateElementFormatting(this);
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
         * @param {jQuery} [cell]
         *  The DOM cell node corresponding to the passed attribute family that
         *  has initially requested the formatting attributes of a table style
         *  sheet, as jQuery object.
         *
         * @returns {Object}
         *  The formatting attributes of the specified family extracted from
         *  the passed styleAttributes object, as name/value pairs.
         */
        function resolveTableStyleAttributes(family, styleAttributes, table, cell) {

            var // an object containing information about the cell orientation inside the table
                cellOrientation = evaluateCellOrientationInTable(cell),
                // an object containing the attributes set at the table explicitly
                explicitTableAttributes = {},
                // an array containing the style attributes names that are excluded from style using the 'exclude' attribute
                excludedAttributes = [],
                // an object containing the style attributes defined in table styles for the specific table cell
                attributes = {},
                // an array containing the names of the optional table attributes
                // -> this is also an order of relevance from global to specific
                // -> following attribute names overwrite values of previous attribute names
                // -> firstRow overwrites lastRow, row overwrites column, ...
                tableAttributeNames = ['wholeTable',
                                       'band1Vert',
                                       'band2Vert',
                                       'band1Hor',
                                       'band2Hor',
                                       'lastCol',
                                       'firstCol',
                                       'lastRow',
                                       'firstRow',
                                       'northEastCell',
                                       'northWestCell',
                                       'southEastCell',
                                       'southWestCell'];

            // checking if special attribute names are deselected in table using
            // the 'exclude' attribute
            explicitTableAttributes = StyleSheets.getExplicitAttributes(table, 'table');

            if (_.isArray(explicitTableAttributes.exclude)) {
                excludedAttributes = explicitTableAttributes.exclude;
            }

            // evaluating attributes for all other optional attributes
            // -> overwriting values from global ('wholeTable') to specific ('southWestCell')
            _.each(tableAttributeNames, function (name) {

                if (family === 'cell') {  // table cells have to iterate over table attributes, too
                    if ((cellOrientation[name]) && (styleAttributes[name]) && (styleAttributes[name].table) && (! _.contains(excludedAttributes, name))) {
                        var tableAttributes = _.copy(styleAttributes[name].table);
                        self.extendAttributes(tableAttributes, explicitTableAttributes);
                        self.extendAttributes(attributes, resolveTableStylesWithCellPosition(cellOrientation, tableAttributes));
                    }
                }

                if ((cellOrientation[name]) && (styleAttributes[name]) && (styleAttributes[name][family]) && (! _.contains(excludedAttributes, name))) {
                    documentStyles.getStyleSheets(family).extendAttributes(attributes, styleAttributes[name][family]);
                }
            });

            return attributes;
        }

        /**
         * Switching from table attributes to table cell attributes. Later no
         * further evaluation of cell orientation is required.
         * Especially 'borderInsideHor' and 'borderInsideVert' are valid only for inner
         * table cells. And 'borderTop', 'borderBottom', ... are only valid for cells
         * that have a table border.
         *
         * @param {Object} cellOrientation
         *  An object containing information about the orientation of the
         *  cell inside the table.
         *
         * @param tableStyleAttributes
         *  The 'attributes' object of the 'table' family.
         *
         * @returns {Object} cellStyles
         *  An object containing the table cell attributes determined from the
         *  table attributes with the help of the orientation of the cell inside
         *  the table.
         */
        function resolveTableStylesWithCellPosition(cellOrientation, tableStyleAttributes) {

            var cellStyles = {};

            if ((tableStyleAttributes.borderTop) && (cellOrientation.firstRow)) {
                cellStyles.borderTop = tableStyleAttributes.borderTop;
            }

            if ((tableStyleAttributes.borderBottom) && (cellOrientation.lastRow)) {
                cellStyles.borderBottom = tableStyleAttributes.borderBottom;
            }

            if ((tableStyleAttributes.borderLeft) && (cellOrientation.firstCol)) {
                cellStyles.borderLeft = tableStyleAttributes.borderLeft;
            }

            if ((tableStyleAttributes.borderRight) && (cellOrientation.lastCol)) {
                cellStyles.borderRight = tableStyleAttributes.borderRight;
            }

            if (tableStyleAttributes.borderInsideHor) {
                if (cellOrientation.firstRow) {
                    cellStyles.borderBottom = tableStyleAttributes.borderInsideHor;
                } else if (cellOrientation.lastRow) {
                    cellStyles.borderTop = tableStyleAttributes.borderInsideHor;
                } else {
                    cellStyles.borderTop = tableStyleAttributes.borderInsideHor;
                    cellStyles.borderBottom = tableStyleAttributes.borderInsideHor;
                }
            }

            if (tableStyleAttributes.borderInsideVert) {
                if (cellOrientation.firstCol) {
                    cellStyles.borderRight = tableStyleAttributes.borderInsideVert;
                } else if (cellOrientation.lastCol) {
                    cellStyles.borderLeft = tableStyleAttributes.borderInsideVert;
                } else {
                    cellStyles.borderRight = tableStyleAttributes.borderInsideVert;
                    cellStyles.borderLeft = tableStyleAttributes.borderInsideVert;
                }
            }

            return cellStyles;
        }

        /**
         * Determines cell orientation inside a table. This includes information, if the cell is located
         * in the first row or in the last row, or if it is the first cell in a row or the last cell in
         * a row and if it is located in an even row or in an odd row.
         *
         * @param {jQuery} cell
         *  The cell node whose orientation inside the table shall be
         *  investigated.
         *
         * @returns {Object}
         *  An object containing information about the orientation of the
         *  cell inside the table.
         */
        function evaluateCellOrientationInTable(cell) {

            var cellOrientation = {};

            if (!$(cell).is('td')) { return cellOrientation; }

            var row = $(cell).parent(),
                rowCollection = row.parent().children('tr'),
                cellCollection = row.children('td');

            cellOrientation.wholeTable = true;  // the cell is located somewhere in the table
            cellOrientation.firstRow = rowCollection.index(row) === 0;
            cellOrientation.lastRow = rowCollection.index(row) === rowCollection.length - 1;
            cellOrientation.firstCol = cellCollection.index(cell) === 0;
            cellOrientation.lastCol = cellCollection.index(cell) === cellCollection.length - 1;
            cellOrientation.band1Hor = rowCollection.index(row) % 2 !== 0;
            cellOrientation.band2Hor = ! cellOrientation.band1Hor;
            cellOrientation.band1Vert = cellCollection.index(cell) % 2 !== 0;
            cellOrientation.band2Vert = ! cellOrientation.band1Vert;
            cellOrientation.northEastCell = (cellOrientation.firstRow && cellOrientation.lastCol);
            cellOrientation.northWestCell = (cellOrientation.firstRow && cellOrientation.firstCol);
            cellOrientation.southEastCell = (cellOrientation.lastRow && cellOrientation.lastCol);
            cellOrientation.southWestCell = (cellOrientation.lastRow && cellOrientation.firstCol);

            return cellOrientation;
        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, 'table', {
            styleAttributesResolver: resolveTableStyleAttributes
        });

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateTableFormatting);

    } // class TableStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: TableStyles }, { DEFINITIONS: DEFINITIONS });

});
