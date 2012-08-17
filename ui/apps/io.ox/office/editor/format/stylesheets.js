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

define('io.ox/office/editor/format/stylesheets', ['io.ox/office/tk/utils'], function (Utils) {

    'use strict';

    // class StyleSheets ======================================================

    /**
     * Container for hierarchical style sheets of a specific attribute family.
     * Implements indirect element formatting via style sheets and direct
     * element formatting via explicit attribute maps.
     *
     * @constructor
     *
     * @param {Object} pool
     *  A map that defines default values for all formatting attributes that
     *  may occur in a style sheet.
     *
     * @param {Formatter} formatter
     *  The CSS formatter used to read CSS formatting from DOM elements and to
     *  write CSS formatting to DOM elements.
     *
     * @param {Function} iterateReadOnly
     *  A function that implements iterating the DOM elements covered by an
     *  array of DOM ranges for read-only access. The function receives the
     *  array of DOM ranges to be iterated as first parameter, an iterator
     *  function to be called for each found DOM element as second parameter,
     *  and a context object used to call the iterator function with.
     *  Compatible with the iterator functions defined in the DOM module.
     *
     * @param {Function} iterateReadWrite
     *  A function that implements iterating the DOM elements covered by an
     *  array of DOM ranges for read/write access. The function receives the
     *  array of DOM ranges to be iterated as first parameter, an iterator
     *  function to be called for each found DOM element as second parameter,
     *  and a context object used to call the iterator function with.
     *  Compatible with the iterator functions defined in the DOM module.
     */
    function StyleSheets(pool, formatter, iterateReadOnly, iterateReadWrite) {

        var // style sheets, mapped by identifier
            styleSheets = {};

        // methods ------------------------------------------------------------

        /**
         * Adds a new style sheet to this container. An existing style sheet
         * with the specified name will be removed before.
         *
         * @param {String} name
         *  The user-defined name of of the new style sheet.
         *
         * @param {String} parent
         *  The name of of the parent style sheet the new style sheet will
         *  derive undefined attributes from.
         *
         * @param {Object} attributes
         *  The formatting attributes contained in the new style sheet.
         */
        this.addStyleSheet = function (name, parent, attributes) {
            this.removeStyleSheet(name);
            styleSheets[name] = { parent: styleSheets[parent], attributes: attributes };
        };

        /**
         * Removes an existing style sheet from this container.
         *
         * @param {String} name
         *  The user-defined name of of the style sheet to be removed.
         */
        this.removeStyleSheet = function (name) {

            var // the style sheet to be removed
                styleSheet = styleSheets[name];

            if (styleSheet) {
                // update parent of all style sheets referring to the removed style sheet
                _(styleSheets).each(function (childSheet) {
                    if (childSheet.parent === styleSheet) {
                        childSheet.parent = styleSheet.parent;
                    }
                });
                // remove style sheet from map
                delete styleSheets[name];
            }
        };

        /**
         * Returns the values of all formatting attributes in the specified DOM
         * ranges supported by the CSS formatter of this container.
         *
         * @param {DOM.Range[]} ranges
         *  (in/out) The DOM ranges to be visited. The array will be validated
         *  and sorted before iteration starts (see method
         *  DOM.iterateNodesInRanges() for details).
         *
         * @returns {Object}
         *  A map of attribute name/value pairs.
         */
        this.getAttributes = function (ranges) {

            var // the attribute values, mapped by name
                attributes = {};

            // get merged attributes from all covered elements
            iterateReadOnly(ranges, function (element) {

                var // merge the existing attributes with the attributes of the new node
                    hasNonNull = formatter.mergeElementAttributes(attributes, element);

                // exit iteration loop if there are no unambiguous attributes left
                if (!hasNonNull) { return Utils.BREAK; }
            });

            return attributes;
        };

        /**
         * Changes specific formatting attributes in the specified DOM ranges.
         *
         * @param {DOM.Range[]} ranges
         *  (in/out) The DOM ranges to be formatted. The array will be
         *  validated and sorted before iteration starts (see method
         *  DOM.iterateNodesInRanges() for details).
         *
         * @param {Object} attributes
         *  A map of attribute name/value pairs.
         */
        this.setAttributes = function (ranges, attributes) {

            // iterate all covered elements and change their formatting
            iterateReadWrite(ranges, function (element) {
                formatter.setElementAttributes(element, attributes);
            });
        };

    } // class StyleSheets

    // exports ================================================================

    return _.makeExtendable(StyleSheets);

});
