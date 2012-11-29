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
         * @param {jQuery} tableNode
         *  The DOM table node referring to a table style sheet, as jQuery
         *  object.
         *
         * @param {jQuery} [cellNode]
         *  The DOM cell node corresponding to the passed attribute family that
         *  has initially requested the formatting attributes of a table style
         *  sheet, as jQuery object.
         *
         * @returns {Object}
         *  The formatting attributes extracted from the passed style sheet
         *  attributes object, as map of attribute value maps (name/value
         *  pairs), keyed by attribute family.
         */
        function resolveTableStyleAttributes(styleAttributes, tableNode, cellNode) {

            var // table size
                lastTableRow = DOM.getTableRows(tableNode).length - 1,
                lastTableCol = tableNode.find('> colgroup > col').length - 1,

                // the grid row range covered by the cell
                rowRange = (cellNode.length > 0) ? Table.getGridRowRangeOfCell(cellNode) : null,
                isFirstRow = rowRange && (rowRange.start === 0),
                isLastRow = rowRange && (rowRange.end === lastTableRow),

                // the grid grid column range covered by the cell
                colRange = (cellNode.length > 0) ? Table.getGridColumnRangeOfCell(cellNode) : null,
                isFirstCol = colRange && (colRange.start === 0),
                isLastCol = colRange && (colRange.end === lastTableCol),

                // the excluded conditional keys
                excludedConditionalKeys = StyleSheets.getExplicitAttributes(tableNode, 'table').exclude,
                firstRowIncluded = isConditionalKeyIncluded('firstRow'),
                lastRowIncluded = isConditionalKeyIncluded('lastRow'),
                firstColIncluded = isConditionalKeyIncluded('firstCol'),
                lastColIncluded = isConditionalKeyIncluded('lastCol'),

                // conditional key of the inner horizontal/vertical bands, according to cell position
                bandKey = null, bandSize = 1, bandIndex = 0,

                // the extracted style attributes according to the position of the table cell
                attributes = {};

            // whether the passed conditional key is included according to the 'exclude' attribute
            function isConditionalKeyIncluded(conditionalKey) {
                return !_.isArray(excludedConditionalKeys) || !_(excludedConditionalKeys).contains(conditionalKey);
            }

            // copies a border attribute (table or cell) to an outer cell border attribute
            function updateOuterCellBorder(sourceAttributes, outerBorderName, innerBorderName, isOuterBorder) {

                var // table and cell attributes (either may be missing)
                    tableAttributes = _.isObject(sourceAttributes.table) ? sourceAttributes.table : {},
                    cellAttributes = _.isObject(sourceAttributes.cell) ? sourceAttributes.cell : {},
                    // the source border attribute value
                    border = null;

                if (isOuterBorder) {
                    // copy outer table border to cell border if border is missing in cell attributes
                    border = _.isObject(cellAttributes[outerBorderName]) ? null : tableAttributes[outerBorderName];
                } else {
                    // copy inner table or cell border (cell border wins) to outer cell border
                    border = _.isObject(cellAttributes[innerBorderName]) ? cellAttributes[innerBorderName] : tableAttributes[innerBorderName];
                }

                // insert existing border to the specified outer cell border
                if (_.isObject(border)) {
                    (attributes.cell || (attributes.cell = {}))[outerBorderName] = border;
                }
            }

            // merges the specified conditional attributes into the 'attributes' object
            function mergeConditionalAttributes(conditionalKey, isHorizontalBand, isVerticalBand) {

                var // the attributes at the passed conditional key
                    conditionalAttributes = styleAttributes[conditionalKey];

                if (_.isObject(conditionalAttributes)) {

                    // copy all attributes from the style sheet to the result object
                    StyleSheets.extendAttributes(attributes, conditionalAttributes);

                    // copy inner borders to outer cell borders, if cell is located inside the current table area
                    updateOuterCellBorder(conditionalAttributes, 'borderTop', 'borderInsideHor', !isVerticalBand || isFirstRow);
                    updateOuterCellBorder(conditionalAttributes, 'borderBottom', 'borderInsideHor', !isVerticalBand || isLastRow);
                    updateOuterCellBorder(conditionalAttributes, 'borderLeft', 'borderInsideVert', !isHorizontalBand || isFirstCol);
                    updateOuterCellBorder(conditionalAttributes, 'borderRight', 'borderInsideVert', !isHorizontalBand || isLastCol);
                }
            }

            // wholeTable: always
            mergeConditionalAttributes('wholeTable', true, true);

            // inner horizontal bands
            if (rowRange && !(firstRowIncluded && isFirstRow) && !(lastRowIncluded && isLastRow)) {
                // size of horizontal bands, TODO: replace '1' with attribute value
                bandSize = Math.floor(Math.max(1, 1));
                // ignore first row in calculation of band index
                bandIndex = Math.floor((rowRange.start - (firstRowIncluded ? 1 : 0)) / bandSize);
                // resolve odd or even band attributes
                bandKey = ((bandIndex % 2) === 0) ? 'band1Hor' : 'band2Hor';
                if (isConditionalKeyIncluded(bandKey)) {
                    mergeConditionalAttributes(bandKey, true, false);
                }
            }

            // inner vertical bands
            if (colRange && !(firstColIncluded && isFirstCol) && !(lastColIncluded && isLastCol)) {
                // size of vertical bands, TODO: replace '1' with attribute value
                bandSize = Math.floor(Math.max(1, 1));
                // ignore first column in calculation of band index
                bandIndex = Math.floor((colRange.start - (firstColIncluded ? 1 : 0)) / bandSize);
                // resolve odd or even band attributes
                bandKey = ((bandIndex % 2) === 0) ? 'band1Vert' : 'band2Vert';
                if (isConditionalKeyIncluded(bandKey)) {
                    mergeConditionalAttributes(bandKey, false, true);
                }
            }

            // cell inside first/last row/column
            if (firstColIncluded && isFirstCol) {
                mergeConditionalAttributes('firstCol', false, true);
            }
            if (lastColIncluded && isLastCol) {
                mergeConditionalAttributes('lastCol', false, true);
            }
            if (firstRowIncluded && isFirstRow) {
                mergeConditionalAttributes('firstRow', true, false);
            }
            if (lastRowIncluded && isLastRow) {
                mergeConditionalAttributes('lastRow', true, false);
            }

            // single corner cells (only if inside active first/last row AND column areas)
            if (firstRowIncluded && firstColIncluded && isFirstRow && isFirstCol && isConditionalKeyIncluded('northWestCell')) {
                mergeConditionalAttributes('northWestCell', false, false);
            }
            if (firstRowIncluded && lastColIncluded && isFirstRow && isLastCol && isConditionalKeyIncluded('northEastCell')) {
                mergeConditionalAttributes('northEastCell', false, false);
            }
            if (lastRowIncluded && firstColIncluded && isLastRow && isFirstCol && isConditionalKeyIncluded('southWestCell')) {
                mergeConditionalAttributes('southWestCell', false, false);
            }
            if (lastRowIncluded && lastColIncluded && isLastRow && isLastCol && isConditionalKeyIncluded('southEastCell')) {
                mergeConditionalAttributes('southEastCell', false, false);
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
