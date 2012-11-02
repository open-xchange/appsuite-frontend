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
                def: 0,
                set: function (element, height) {
                    if (height !== 0) {
                        element.css('height', Utils.convertHmmToCssLength(height, 'px', 0));
                    }
                }
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

        // Table.updateTableRows(table, attributes);

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

        StyleSheets.call(this, documentStyles, 'row', 'tr', DEFINITIONS);

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateTableRowFormatting);

    } // class TableRowStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: TableRowStyles });

});
