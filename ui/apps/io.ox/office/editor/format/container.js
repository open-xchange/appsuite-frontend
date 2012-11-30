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
     'io.ox/office/editor/format/color',
     'io.ox/office/editor/format/border'
    ], function (Events, Utils, Color, Border) {

    'use strict';

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
         * Immediately triggers a 'change:direct' event for this container, and
         * prepares to trigger a deferred 'change' event that will be triggered
         * once after the current script has been executed. This method must be
         * called always after contents of this container have been changed,
         * added, or removed.
         *
         * @returns {Container}
         *  A reference to this instance.
         */
        this.triggerChangeEvent = deferredMethods.createMethod(

            // direct callback: called every time when Container.triggerChangeEvent() has been called
            function triggerDirectEvent() { self.trigger('change:direct'); return self; },

            // deferred callback: called once, after current script ends
            function triggerDeferredEvent() { self.trigger('change'); }
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
            // use the static helper function from module Color, pass current theme
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
            // use the static helper function from module Border, pass current theme
            return Border.getCssBorder(border, documentStyles.getCurrentTheme());
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
