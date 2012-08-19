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
     * @param {String} styleAttrName
     *  The name of the attribute that contains the style sheet name for a DOM
     *  element.
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
    function StyleSheets(pool, styleAttrName, formatter, iterateReadOnly, iterateReadWrite) {

        var // style sheets, mapped by identifier
            styleSheets = {};

        // private methods ----------------------------------------------------


        // methods ------------------------------------------------------------

        /**
         * Adds a new style sheet to this container. An existing style sheet
         * with the specified name will be removed before.
         *
         * @param {String} name
         *  The user-defined name of of the new style sheet.
         *
         * @param {String|Null} parent
         *  The name of of the parent style sheet the new style sheet will
         *  derive undefined attributes from.
         *
         * @param {Object} attributes
         *  The formatting attributes contained in the new style sheet, as
         *  map of name/value pairs.
         *
         * @returns {StyleSheets}
         *  A reference to this instance.
         */
        this.addStyleSheet = function (name, parent, attributes) {

            var // get or create a style sheet object
                styleSheet = styleSheets[name] || (styleSheets[name] = {});

            // set parent of the style sheet
            // TODO: check circular references
            styleSheet.parent = styleSheets[parent];

            // set attributes (filter by attributes contained in the pool)
            styleSheet.attributes = {};
            _(attributes).each(function (value, name) {
                if (name in pool) { styleSheet.attributes[name] = value; }
            });

            return this;
        };

        /**
         * Removes an existing style sheet from this container.
         *
         * @param {String} name
         *  The user-defined name of of the style sheet to be removed.
         *
         * @returns {StyleSheets}
         *  A reference to this instance.
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
            return this;
        };

        /**
         * Returns the names of all style sheets in a string array.
         */
        this.getStyleSheetNames = function () {
            return _.keys(styleSheets);
        };

        /**
         * Returns the merged attributes of the specified style sheet and all
         * of its ancestors.
         *
         * @param {String} name
         *  The name of of the style sheet.
         *
         * @returns {Object}
         *  The formatting attributes contained in the style sheet and its
         *  ancestor style sheet up to the pool defaults, as map of name/value
         *  pairs.
         */
        this.getStyleSheetAttributes = function (name) {

            var // the initial style sheet
                styleSheet = styleSheets[name],
                // the resulting attributes
                attributes = {};

            // add attributes of the entire ancestor chain
            while (styleSheet) {
                attributes = _(styleSheet.attributes).extend(attributes);
                styleSheet = styleSheet.parent;
            }

            // add pool attributes
            return _(pool).extend(attributes);
        };

        /**
         * Returns whether this style sheet container supports the specified
         * formatting attribute.
         *
         * @param {String} name
         *  The name of the formatting attribute.
         *
         * @returns {Boolean}
         *  Whether the specified attribute is supported by this instance.
         */
        this.supportsAttribute = function (name) {
            return (name === styleAttrName) || formatter.supportsAttribute(name);
        };

        /**
         * Returns whether this style sheet container supports at least one of
         * the specified formatting attributes.
         *
         * @param {Object} attributes
         *  A map with formatting attribute values, mapped by the attribute
         *  names.
         *
         * @returns {Boolean}
         *  Whether at least one of the specified attributes is supported by
         *  this instance.
         */
        this.supportsAnyAttribute = function (attributes) {
            return (styleAttrName in attributes) || formatter.supportsAnyAttribute(attributes);
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
        this.getRangeAttributes = function (ranges) {

            var // the attribute values, mapped by name
                attributes = {};

            // get merged attributes from all covered elements
            iterateReadOnly(ranges, function (element) {

                var // get the formatting attributes
                    elementAttributes = formatter.getElementAttributes(element),
                    // whether any attribute is still unambiguous
                    hasNonNull = false;

                // add the style sheet name
                // TODO: get the real name of the standard style
                elementAttributes[styleAttrName] = $(element).data('style') || 'Standard';

                // update all attributes
                _(elementAttributes).each(function (value, name) {
                    if (!(name in attributes)) {
                        // initial iteration: store value
                        attributes[name] = value;
                    } else if (!_.isEqual(value, attributes[name])) {
                        // value differs from previous value: ambiguous state
                        attributes[name] = null;
                    }
                    hasNonNull = hasNonNull || !_.isNull(attributes[name]);
                });

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
        this.setRangeAttributes = function (ranges, attributes) {

            var // the style sheet name
                style = Utils.getStringOption(attributes, styleAttrName),
                // get attributes of the style sheet, if specified
                styleAttributes = style ? this.getStyleSheetAttributes(style) : null;

            // iterate all covered elements and change their formatting
            iterateReadWrite(ranges, function (element) {
                if (style) {
                    $(element).data('style', style);
                    formatter.setElementAttributes(element, styleAttributes);
                }
                formatter.setElementAttributes(element, attributes);
            });
        };

    } // class StyleSheets

    // exports ================================================================

    return _.makeExtendable(StyleSheets);

});
