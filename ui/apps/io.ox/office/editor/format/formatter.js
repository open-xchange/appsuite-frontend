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

define('io.ox/office/editor/format/formatter', function () {

    'use strict';

    // class Formatter ========================================================

    /**
     * Converts between formatting attributes of an element's CSS and the
     * 'setAttribute' operation of the editor's Operations API.
     *
     * @constructor
     *
     * @param {Object} definitions
     *  A map that defines formatting attributes supported by this formatter.
     *  Each attribute is mapped by its name used in the Operations API, and
     *  maps an object that contains a getter and setter method. The get()
     *  method of a definition object receives the DOM element object, and
     *  returns the value of the formatting attribute from the element's CSS
     *  formatting. The set() method of a definition object receives the DOM
     *  element object and the value of the formatting attribute, and modifies
     *  the element's CSS formatting.
     */
    function Formatter(definitions) {

        // methods ------------------------------------------------------------

        /**
         * Returns whether this formatter contains a definition for the
         * specified formatting attribute.
         *
         * @param {String} name
         *  The name of the formatting attribute.
         *
         * @returns {Boolean}
         *  Whether the specified attribute is supported by this formatter.
         */
        this.supportsAttribute = function (name) {
            return name in definitions;
        };

        /**
         * Returns whether this formatter contains a definition for at least
         * one of the specified formatting attributes.
         *
         * @param {Object} attributes
         *  A map with formatting attribute values, mapped by the attribute
         *  names.
         *
         * @returns {Boolean}
         *  Whether at least one of the specified attributes is supported by
         *  this formatter.
         */
        this.supportsAnyAttribute = function (attributes) {
            return _(attributes).any(function (value, name) { return name in definitions; });
        };

        /**
         * Returns the current values of all supported formatting attributes in
         * the passed DOM element.
         *
         * @param {HTMLElement} element
         *  The DOM element object containing CSS formatting.
         *
         * @returns {Object}
         *  The current values of all supported formatting attributes, mapped
         *  by the attribute names.
         */
        this.getElementAttributes = function (element) {
            var attributes = {};
            _(definitions).each(function (definition, name) {
                attributes[name] = definition.get(element);
            });
            return attributes;
        };

        /**
         * Returns whether all supported formatting attributes in the two
         * specified elements are equal.
         *
         * @param {HTMLElement} element1
         *  The first DOM element object whose attributes will be compared.
         *
         * @param {HTMLElement} element2
         *  The second DOM element object whose attributes will be compared.
         *
         * @returns {Boolean}
         *  Whether all attribute value in the two DOM elements are equal.
         */
        this.hasEqualElementAttributes = function (element1, element2) {
            return _.isEqual(this.getElementAttributes(element1), this.getElementAttributes(element2));
        };

        /**
         * Changes the values of multiple formatting attributes in the passed
         * DOM element.
         *
         * @param {HTMLElement} element
         *  The DOM element object whose CSS formatting will be changed.
         *
         * @param {Object} attributes
         *  The new values of all formatting attributes, mapped by the
         *  attribute names.
         */
        this.setElementAttributes = function (element, attributes) {
            _(attributes).each(function (value, name) {
                if (name in definitions) {
                    definitions[name].set(element, value);
                }
            });
        };

    } // class Formatter

    // exports ================================================================

    return Formatter;

});
