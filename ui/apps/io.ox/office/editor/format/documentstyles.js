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
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/editor/format/documentstyles',
    ['io.ox/office/editor/format/characterstyles',
     'io.ox/office/editor/format/paragraphstyles',
     'io.ox/office/editor/format/drawingstyles',
     'io.ox/office/editor/format/tablestyles',
     'io.ox/office/editor/format/tablerowstyles',
     'io.ox/office/editor/format/tablecellstyles',
     'io.ox/office/editor/format/pagestyles',
     'io.ox/office/editor/format/themes',
     'io.ox/office/editor/format/lists'
    ], function (CharacterStyles, ParagraphStyles, DrawingStyles, TableStyles, TableRowStyles, TableCellStyles, PageStyles, Themes, Lists) {

    'use strict';

    // class DocumentStyles ===================================================

    /**
     * Provides the style sheet containers for all attribute families used in a
     * document.
     *
     * @constructor
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing all elements formatted by the style sheet
     *  containers. If this object is a jQuery collection, uses the first node
     *  it contains.
     */
    function DocumentStyles(rootNode) {

        var // style sheet containers mapped by attribute family
            containers = {},
            // document themes
            themes = {},
            // list definitions
            lists = {},

            // global document attributes
            documentAttributes = {
                defaultTabStop: 1270,   // default tab width: 0.5 inch
                zoom: { value: 100 }    // default zoom: 100%
            };

        // methods ------------------------------------------------------------

        /**
         * Returns the style sheet container for the specified attribute
         * family.
         *
         * @param {String} family
         *  The name of the attribute family.
         */
        this.getStyleSheets = function (family) {
            return (family in containers) ? containers[family] : null;
        };

        /**
         * Returns the themes container.
         */
        this.getThemes = function () {
            return themes;
        };

        /**
         * Returns the current theme.
         */
        this.getCurrentTheme = function () {
            return themes.getTheme();
        };
        /** Returns the lists container.
        *
        */
        this.getLists = function () {
            return lists;
        };

        /**
         * Returns the global attributes of the document.
         *
         * @param {Object}
         *  A deep clone of the global document attributes.
         */
        this.getAttributes = function () {
            return _.copy(documentAttributes, true);
        };

        /**
         * Changes the global attributes of the document.
         *
         * @param {Object} attributes
         *  The new document attributes.
         *
         * @returns {DocumentStyles}
         *  A reference to this instance.
         */
        this.setAttributes = function (attributes) {
            _(documentAttributes).extend(attributes);
            return this;
        };

        this.destroy = function () {
            _(lists).invoke('destroy');
            _(themes).invoke('destroy');
            _(containers).invoke('destroy');
            containers = themes = lists = null;
        };

        // initialization -----------------------------------------------------

        containers.character = new CharacterStyles(rootNode, this);
        containers.paragraph = new ParagraphStyles(rootNode, this);
        containers.drawing = new DrawingStyles(rootNode, this);
        containers.table = new TableStyles(rootNode, this);
        containers.row = new TableRowStyles(rootNode, this);
        containers.cell = new TableCellStyles(rootNode, this);
        containers.page = new PageStyles(rootNode, this);

        themes = new Themes(this);
        lists = new Lists(this);

    } // class DocumentStyles

    // exports ================================================================

    return DocumentStyles;

});
