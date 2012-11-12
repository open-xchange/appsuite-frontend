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

define('io.ox/office/editor/format/container',
    ['io.ox/core/event',
     'io.ox/office/tk/utils',
     'io.ox/office/editor/format/color'
    ], function (Events, Utils, Color) {

    'use strict';

    var // map operation line styles to CSS line styles (anything else maps to 'solid')
        CSS_LINE_STYLES = {
            none: 'none',
            double: 'double',
            triple: 'double',
            dashed: 'dashed',
            dashSmallGap: 'dashed',
            dotted: 'dotted',
            dotDash: 'dotted',
            dotDotDash: 'dotted',
            dashDotStroked: 'dotted'
        };

    // class Container ========================================================

    /**
     * Generic base class for style and/or formatting containers stored in an
     * instance of the DocumentStyles class. Provides helper functions and
     * event functionality useful in any derived class.
     *
     * @constructor
     *
     * @param {DocumentStyles} documentStyles
     *  Collection with the style containers of all style families.
     */
    function Container(documentStyles) {

        var // self reference
            self = this,

            // deferred methods that will be executed in a browser timeout
            deferredMethods = new Utils.DeferredMethods(this);

        // methods ------------------------------------------------------------

        /**
         * Returns the document styles.
         *
         * @returns {DocumentStyles}
         *  A document style object.
         */
        this.getDocumentStyles = function () {
            return documentStyles;
        };

        /**
         * Prepares to trigger a 'change' event for this container. Must be
         * called always after contents of this container have been changed,
         * added, or removed. Multiple calls of this method are collected, and
         * a single event will be triggered after the current script has been
         * executed.
         *
         * @returns {Container}
         *  A reference to this instance.
         */
        this.triggerChangeEvent = deferredMethods.createMethod(

            // direct callback: called every time when Container.triggerChangeEvent() has been called
            function () { return self; },

            // deferred callback: called once, after current script ends
            function triggerEvent() { self.trigger('change'); }
        );

        /**
         * Converts the passed color attribute object to a CSS color value.
         * Scheme colors will be resolved by using the current theme.
         *
         * @param {Object} color
         *  The color object as used in operations.
         *
         * @param {String} context
         *  The context needed to resolve the color type 'auto'.
         *
         * @returns {String}
         *  The CSS color value converted from the passed color object.
         */
        this.getCssColor = function (color, context) {
            // use the static helper function from module Colors, pass current theme
            return Color.getCssColor(color, context, documentStyles.getCurrentTheme());
        };

        /**
         * Converts the passed border attribute object to a CSS border value.
         * Scheme colors will be resolved by using the current theme.
         *
         * @param {Object} border
         *  The border object as used in operations.
         *
         * @returns {String}
         *  The CSS border value converted from the passed border object.
         */
        this.getCssBorder = function (border) {

            var style = Utils.getStringOption(border, 'style', 'none'),
                width = Utils.getIntegerOption(border, 'width', 0),
                color = Utils.getObjectOption(border, 'color', Color.AUTO);

            // convert operation line styles to CSS styles
            style = CSS_LINE_STYLES[style] || 'solid';

            // convert 1/100mm to pixels (at least one pixel)
            width = Utils.convertHmmToLength(width, 'px', 1);
            if (width > 0) {
                width = Math.max(width, 1) + 'px';
            }

            // convert color object to CSS color
            color = this.getCssColor(color, 'line');

            // combine the values to a single string
            return style + ' ' + width + ' ' + color;
        };

        this.destroy = function () {
            this.events.destroy();
            deferredMethods.destroy();
        };

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

    } // class Container

    // exports ================================================================

    return _.makeExtendable(Container);

});
