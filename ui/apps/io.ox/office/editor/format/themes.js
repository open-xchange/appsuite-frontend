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

    // class Theme ============================================================

    function Theme(attributes) {

        var // the color scheme of this theme
            colorScheme = _.copy(Utils.getObjectOption(attributes, 'colorscheme', {}), true);

        // methods ------------------------------------------------------------

        /**
         * Returns the RGB color value of the specified scheme color.
         *
         * @param {String} name
         *  The name of the scheme color.
         *
         * @return {String|Null}
         *  The RGB value of the scheme color as hexadecimal string, if
         *  existing, otherwise null.
         */
        this.getSchemeColor = function (name) {
            return _.isString(colorScheme[name]) ? colorScheme[name] : null;
        };

    } // class Theme

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

            var // create a theme object with all passed attributes
                theme = new Theme(attributes);

            // store new theme in container
            themes[name] = theme;
            defaultTheme = defaultTheme || theme;

            // notify listeners
            this.trigger('change');

            return this;
        };

        /**
         * Gives access to a single theme.
         *
         * @param {String} [name]
         *  The name of the theme to return. If omitted the 'current' theme is
         *  returned.
         *
         * @returns {Theme}
         *  The specified, and the current theme.
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
