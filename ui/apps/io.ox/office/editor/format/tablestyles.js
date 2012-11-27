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
             * Array containing information, if conditional attributes will be
             * used. As default value, all styles will be used, so that this
             * array can be empty.
             */
            exclude: { def: [] },

            /**
             * Left border of the table (will be set in the table cells).
             */
            borderLeft: { def: NO_BORDER },

            /**
             * Top border of the table (will be set in the table cells).
             */
            borderTop: { def: NO_BORDER },

            /**
             * Right border of the table (will be set in the table cells).
             */
            borderRight: { def: NO_BORDER },

            /**
             * Bottom border of the table (will be set in the table cells).
             */
            borderBottom: { def: NO_BORDER },

            /**
             * Inner horizontal borders inside the table (will be set in the
             * table cells).
             */
            borderInsideHor: { def: NO_BORDER },

            /**
             * Inner vertical borders inside the table (will be set in the
             * table cells).
             */
            borderInsideVert: { def: NO_BORDER }

        };

    // class TableStyles ======================================================

    /**
     * Contains the style sheets for table formatting attributes. The CSS
     * formatting will be written to table elements and their rows and cells.
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

        // private methods ----------------------------------------------------

        /**
         * Returns the attributes of the specified attribute family contained
         * in table style sheets. Resolves the conditional attributes that
         * match the position of the passed source element.
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
         *  The formatting attributes extracted from the passed style sheet
         *  attributes object, as map of attribute value maps (name/value
         *  pairs), keyed by attribute family.
         */
        function resolveTableStyleAttributes(styleAttributes, table, cell) {

            var // information about the cell position
                cellInfo = $(cell).is('td') ? DOM.getCellPositionInfo(cell) : null,
                // the explicit table attributes
                explicitTableAttributes = StyleSheets.getExplicitAttributes(table, 'table'),
                // the active conditional keys, according to cell position and the 'exclude' table attribute
                activeConditionalKeys = ['wholeTable'],
                // the extracted style attributes according to the position of the table cell
                attributes = {};

            // pushes the passed conditional key to the array, if it is active
            function pushConditionalKey(conditionalKey, active) {
                if (active) { activeConditionalKeys.push(conditionalKey); }
            }

            // copies a global table border attribute (either outer or inner) to a cell attribute
            function updateCellBorder(borderName, innerBorderName, isOuterCell) {
                var tableBorder = attributes.table[isOuterCell ? borderName : innerBorderName];
                if (_.isObject(tableBorder) && !(borderName in attributes.cell)) {
                    attributes.cell[borderName] = tableBorder;
                }
            }

            // get conditional keys that match the position of the passed cell
            if (cellInfo) {
                pushConditionalKey('firstRow',      cellInfo.firstRow);
                pushConditionalKey('lastRow',       cellInfo.lastRow);
                pushConditionalKey('firstCol',      cellInfo.firstCol);
                pushConditionalKey('lastCol',       cellInfo.lastCol);
                pushConditionalKey('band1Hor',      !cellInfo.firstRow && !cellInfo.lastRow && (cellInfo.rowIndex % 2 !== 0)); // first row band *after* the header row
                pushConditionalKey('band2Hor',      !cellInfo.firstRow && !cellInfo.lastRow && (cellInfo.rowIndex % 2 === 0));
                pushConditionalKey('band1Vert',     !cellInfo.firstCol && !cellInfo.lastCol && (cellInfo.colIndex % 2 !== 0)); // first column band *after* the left column
                pushConditionalKey('band2Vert',     !cellInfo.firstCol && !cellInfo.lastCol && (cellInfo.colIndex % 2 === 0));
                pushConditionalKey('northEastCell', cellInfo.firstRow && cellInfo.lastCol);
                pushConditionalKey('northWestCell', cellInfo.firstRow && cellInfo.firstCol);
                pushConditionalKey('southEastCell', cellInfo.lastRow && cellInfo.lastCol);
                pushConditionalKey('southWestCell', cellInfo.lastRow && cellInfo.firstCol);
            }

            // remove conditional keys excluded by the table using the 'exclude' attribute
            if (_.isArray(explicitTableAttributes.exclude)) {
                activeConditionalKeys = _(activeConditionalKeys).without(explicitTableAttributes.exclude);
            }

            // collect attributes for all remaining active conditional keys
            _(activeConditionalKeys).each(function (conditionalKey) {
                if (_.isObject(styleAttributes[conditionalKey])) {
                    StyleSheets.extendAttributes(attributes, styleAttributes[conditionalKey]);
                }
            });

            // copy global table borders to cell attributes according to the current cell position
            if (cellInfo && _.isObject(attributes.table)) {
                attributes.cell = attributes.cell || {};
                updateCellBorder('borderTop', 'borderInsideHor', cellInfo.firstRow);
                updateCellBorder('borderBottom', 'borderInsideHor', cellInfo.lastRow);
                updateCellBorder('borderLeft', 'borderInsideVert', cellInfo.firstCol);
                updateCellBorder('borderRight', 'borderInsideVert', cellInfo.lastCol);
                if (_.isEmpty(attributes.cell)) { delete attributes.cell; }
            }

            return attributes;
        }

        /**
         * Will be called for every table element whose attributes have been
         * changed. Repositions and reformats the table according to the passed
         * attributes.
         *
         * @param {jQuery} table
         *  The <table> element whose table attributes have been changed, as
         *  jQuery object.
         *
         * @param {Object} mergedAttributes
         *  A map of attribute value maps (name/value pairs), keyed by
         *  attribute family, containing the effective attribute values merged
         *  from style sheets and explicit attributes.
         */
        function updateTableFormatting(table, mergedAttributes) {

            var // the table row styles/formatter
                tableRowStyles = documentStyles.getStyleSheets('row'),
                // the table cell styles/formatter
                tableCellStyles = documentStyles.getStyleSheets('cell');

            // update column widths
            Table.updateColGroup(table, mergedAttributes.table.tableGrid);

            // iterate over all rows in the table to set the row and cell attributes
            DOM.getTableRows(table).each(function () {

                // update table rows
                tableRowStyles.updateElementFormatting(this);

                // update table cells
                $(this).children('td').each(function () {
                    tableCellStyles.updateElementFormatting(this);
                });
            });
        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, { updateHandler: updateTableFormatting, styleAttributesResolver: resolveTableStyleAttributes });

    } // class TableStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend(TableStyles, 'table', DEFINITIONS);

});
