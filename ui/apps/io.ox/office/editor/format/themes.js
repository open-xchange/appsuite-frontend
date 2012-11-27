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
     'io.ox/office/editor/format/container',
     'gettext!io.ox/office/main'
    ], function (Utils, Container, gt) {

    'use strict';

    // class Theme ============================================================

    /**
     * Contains the definitions of a single theme in a document.
     *
     * @constructor
     *
     * @param {Object} attributes
     *  The theme attributes as received from the 'insertTheme' operation.
     */
    function Theme(attributes) {

        var // the color scheme of this theme
            colorScheme = _.copy(Utils.getObjectOption(attributes, 'colorScheme', {}), true);

        // methods ------------------------------------------------------------

        this.hasSchemeColors = function () {
            return !_.isEmpty(colorScheme);
        };

        /**
         * Returns the RGB color value of the specified scheme color.
         *
         * @param {String} name
         *  The name of the scheme color.
         *
         * @returns {String|Null}
         *  The RGB value of the scheme color as hexadecimal string, if
         *  existing, otherwise null.
         */
        this.getSchemeColor = function (name) {
            return _.isString(colorScheme[name]) ? colorScheme[name] : null;
        };

    } // class Theme

    // class Themes ===========================================================

    /**
     * Contains the definitions of all themes in a document.
     *
     * @constructor
     *
     * @extends Container
     *
     * @param {DocumentStyles} documentStyles
     *  Collection with the style containers of all style families, themes and
     *  lists.
     */
    function Themes(documentStyles) {

        var // themes, mapped by identifier
            themes = {},

            // default theme (first inserted theme)
            defaultTheme = null;

        // base constructor ---------------------------------------------------

        Container.call(this, documentStyles);

        // methods ------------------------------------------------------------

        /**
         * Adds a new theme to this container. An existing theme
         * with the specified identifier will be replaced.
         *
         * @param {String} name
         *  The name of of the new theme.
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
            this.triggerChangeEvent();

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

    } // class Themes

    // exports ================================================================

    // derive this class from class Container
    return Container.extend({ constructor: Themes });

});
