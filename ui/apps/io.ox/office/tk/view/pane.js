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

define('io.ox/office/tk/view/pane', ['io.ox/office/tk/utils'], function (Utils) {

    'use strict';

    // class Pane =============================================================

    /**
     * Represents a container element attached to a specific border of the
     * application window.
     *
     * @constructor
     *
     * @param {Application} app
     *  The application containing this pane element.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new view component.
     *  The following options are supported:
     *  @param {String} [options.classes]
     *      Additional CSS classes that will be set at the root DOM node of
     *      this instance.
     */
    function Pane(app, options) {

        var // the container element representing the pane
            node = $('<div>').addClass('io-ox-pane'),

            // view components contained in this pane
            components = [];

        // methods ------------------------------------------------------------

        /**
         * Returns the root element representing this pane as jQuery object.
         */
        this.getNode = function () {
            return node;
        };

        /**
         * Adds the passed view component into this pane.
         *
         * @param {Component} component
         *  The view component to be added to this pane.
         *
         * @returns {Pane}
         *  A reference to this instance.
         */
        this.addViewComponent = function (component) {
            components.push(component);
            node.append(component.getNode());
            return this;
        };

        this.destroy = function () {
            _(components).invoke('destroy');
            node = components = null;
        };

        // initialization -----------------------------------------------------

        // additional CSS classes
        node.addClass(Utils.getStringOption(options, 'classes', ''));

    } // class Pane

    // exports ================================================================

    return _.makeExtendable(Pane);

});
