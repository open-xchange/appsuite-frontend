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

define('io.ox/office/editor/format/tablerowstyles',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/table',
     'io.ox/office/editor/format/stylesheets'
    ], function (Utils, DOM, Table, StyleSheets) {

    'use strict';

    var // definitions for table row attributes
        DEFINITIONS = {

            /**
             * The height of the table row. If zero then the row is auto sized.
             */
            height: {
                def: 0
            }

        };

    // private global functions ===============================================

    /**
     * Will be called for every table row element whose attributes have been
     * changed. Repositions and reformats the table row according to the passed
     * attributes.
     *
     * @param {jQuery} row
     *  The <tr> element whose table row attributes have been changed,
     *  as jQuery object.
     *
     * @param {Object} attributes
     *  A map of all attributes (name/value pairs), containing the effective
     *  attribute values merged from style sheets and explicit attributes.
     */
    function updateTableRowFormatting(row, attributes) {

        if (($.browser.webkit) && (attributes.height === 0)) {
            // Chrome requires that every cell has a defined height. Otherwise the resize-div
            // will not be shifted to the bottom of the cell, if a neighbour cell increases in
            // height.
            attributes.height = Utils.convertLengthToHmm(parseInt(row.css('height'), 10), 'px');
        }

        if (attributes.height !== 0) {
            if ($.browser.webkit) {
                // Chrome requires row height at the cells, setting height at <tr> is ignored.
                var rowHeight = Utils.convertHmmToLength(attributes.height, 'px', 0);
                row.children('th, td').each(function () {
                    var cellHeight = rowHeight -
                                     Utils.convertCssLength($(this).css('padding-top'), 'px', 0) -
                                     Utils.convertCssLength($(this).css('padding-bottom'), 'px', 0) -
                                     Utils.convertCssLength($(this).css('border-bottom-width'), 'px', 0) +
                                     'px';
                    $(this).css('height', cellHeight);
                });
            } else {
                // FireFox requires row height at the rows. Setting height at cells, makes
                // height of cells unchanged, even if text leaves the cell.
                row.css('height', Utils.convertHmmToCssLength(attributes.height, 'px', 0));
            }
        }

    }

    // class TableRowStyles ======================================================

    /**
     * Contains the style sheets for table row formatting attributes. The CSS
     * formatting will be read from and written to <tr> elements.
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
    function TableRowStyles(rootNode, documentStyles) {

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, 'row', DEFINITIONS);

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateTableRowFormatting);

    } // class TableRowStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: TableRowStyles });

});
