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
    ['io.ox/core/event',
     'io.ox/office/tk/utils',
     'io.ox/office/editor/dom'
    ], function (Events, Utils, DOM) {

    'use strict';

    // class Themes ===========================================================

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

        var // themes, mapped by identifier
            themes = {},

            // default theme (first inserted theme)
            defaultTheme = null;

        // methods ------------------------------------------------------------

        /**
         * Adds a new style sheet to this container. An existing style sheet
         * with the specified identifier will be replaced.
         *
         * @param {String} name
         *  The name of of the new style theme.
         *
         * @param {Object} attributes
         *  The formatting attributes of the theme.
         *
         * @returns {Themes}
         *  A reference to this instance.
         */
        this.addTheme = function (name, attributes) {

            var // the color scheme of the theme
                colorscheme = Utils.getObjectOption(attributes, 'colorscheme', {}),
                // create a theme object with all colors of the passed scheme
                theme = { colorscheme: _.copy(colorscheme, true) };

            themes[name] = theme;

            if (!defaultTheme) {
                defaultTheme = theme;
            }

            // notify listeners
            this.trigger('change');

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
            return (name in themes) ? themes[name] : defaultTheme;
        };

        this.destroy = function () {
            this.events.destroy();
        };

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

    } // class Themes

    // exports ================================================================

    return Themes;


});
