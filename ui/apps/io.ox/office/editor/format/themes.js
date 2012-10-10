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
 * @author Oliver Specht <oliver.specht@open-xchange.com>
 */

define('io.ox/office/editor/format/themes',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom'
    ], function (Utils, DOM) {

    'use strict';

    // class Themes ==================================================

    /**
     * Contains the definitions of themes.
     *
     * @constructor
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing all elements formatted by the style sheets of
     *  this container. If this object is a jQuery collection, uses the first
     *  node it contains.
     *
     * @param {DocumentStyles} documentStyles
     *  Collection with the style containers of all style families.
     */
    function Themes(rootNode, documentStyles) {

        var // self reference
        self = this,

        // style sheets, mapped by identifier
        themes = [];
        // methods ------------------------------------------------------------


        /**
         * Adds a new style sheet to this container. An existing style sheet
         * with the specified identifier will be replaced.
         *
         * @param {String} name
         *  The name of of the new style theme.
         *
         * @param {Object} colorScheme
         *  The attributes of the color scheme of the theme.
         *
         * @returns {Themes}
         *  A reference to this instance.
         */
        this.addTheme = function (name, colorScheme) {

            themes[themes.length] = {};
            var theme = themes[themes.length - 1];
            theme.name = name;
            theme.colorSchemeName = colorScheme.schemeName;
            theme.dark1 = colorScheme.dark1;
            theme.dark2 = colorScheme.dark2;
            theme.light1 = colorScheme.light1;
            theme.light2 = colorScheme.light2;
            theme.text1 = colorScheme.text1;
            theme.text2 = colorScheme.text2;
            theme.background1 = colorScheme.background1;
            theme.background2 = colorScheme.background2;
            theme.accent1 = colorScheme.accent1;
            theme.accent2 = colorScheme.accent2;
            theme.accent3 = colorScheme.accent3;
            theme.accent4 = colorScheme.accent4;
            theme.accent5 = colorScheme.accent5;
            theme.accent6 = colorScheme.accent6;
            theme.hyperlink = colorScheme.hyperlink;
            theme.followedHyperlink = colorScheme.followedHyperlink;
            return this;
        };
        /**
         * Gives access to a single theme.
         *
         * @param name the name of the theme to return. If omitted the 'current' theme is returned
         * @returns {Themes}
         *  A reference to this instance.
         */
        this.getTheme = function (name) {
            if (!name) {
                return themes[0];
            } else {
                return themes[name];
            }
        };
        /**
         * Gives access to all themes.
         *
         */
        this.getThemes = function () {
            return themes;
        };
    } // class Themes
    // exports ================================================================

    return Themes;


});
