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

    // private static functions ===============================================

    function isCircularReference(styleSheet) {
        var parentStyleSheet = styleSheet.parent;
        while (parentStyleSheet) {
            if (parentStyleSheet === styleSheet) { return true; }
            parentStyleSheet = parentStyleSheet.parent;
        }
        return false;
    }

    function getElementAttributes(element) {
        return element.data('attributes') || {};
    }

    function setElementAttributes(element, attributes) {
        element.data('attributes', attributes);
    }

    // class StyleSheets ======================================================

    /**
     * Container for hierarchical style sheets of a specific attribute family.
     * Implements indirect element formatting via style sheets and direct
     * element formatting via explicit attribute maps.
     *
     * @constructor
     *
     * @param {Object} definitions
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
    function StyleSheets(definitions, iterateReadOnly, iterateReadWrite) {

        var // style sheets, mapped by identifier
            styleSheets = {},
            // default values for all supported attributes
            defaultAttributes = {};

        // private methods ----------------------------------------------------

        function getStyleSheetAttributes(styleSheet) {

            var // the resulting attributes
                attributes = null;

            if (styleSheet) {
                // call recursively to get the attributes of the ancestor style sheets
                attributes = getStyleSheetAttributes(styleSheet.parent);
                // add own attributes
                _(attributes).extend(styleSheet.attributes);
            } else {
                // start with a clone of all default attribute values
                attributes = _.clone(defaultAttributes);
            }

            return attributes;
        }

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
            styleSheet.parent = styleSheets[parent];
            if (isCircularReference(styleSheet)) {
                styleSheet.parent = null;
            }

            // set attributes (filter by existing non-special attributes)
            styleSheet.attributes = {};
            _(attributes).each(function (value, name) {
                var definition = definitions[name];
                if (definition && !definition.special) {
                    styleSheet.attributes[name] = value;
                }
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
         *  ancestor style sheet up to the map of default attributes, as map of
         *  name/value pairs.
         */
        this.getStyleSheetAttributes = function (name) {
            return getStyleSheetAttributes(styleSheets[name]);
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
            return (name === 'style') || ((name in definitions) && !definitions[name].special);
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
            return ('style' in attributes) || _(attributes).any(function (value, name) { return (name in definitions) && !definitions[name].special; });
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

            var // the resulting attribute values, mapped by name
                attributes = {};

            // get merged attributes from all covered elements
            iterateReadOnly(ranges, function (element) {

                var // get the hard formatting attributes
                    hardAttributes = getElementAttributes($(element)),
                    // get attributes of the style sheet (invalid style name results in default values)
                    styleAttributes = getStyleSheetAttributes(hardAttributes ? styleSheets[hardAttributes.style] : null),
                    // whether any attribute is still unambiguous
                    hasNonNull = false;

                // overwrite style sheet attributes with existing hard attributes
                styleAttributes.style = '';
                _(styleAttributes).extend(hardAttributes);

                // update all attributes in the result set
                _(styleAttributes).each(function (value, name) {
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
         *
         * @param {Object} [options]
         *  A map of options controlling the operation. Supports the following
         *  options:
         *  @param {Boolean} [options.smartClear=false]
         *      If set to true, hard attributes that are equal to the
         *      attributes of the current style sheet will be removed from the
         *      elements.
         *  @param {Boolean} [options.special=false]
         *      If set to true, allows to change special attributes (attributes
         *      that are marked with the 'special' flag in the attribute
         *      definitions passed to the constructor).
         */
        this.setRangeAttributes = function (ranges, attributes, options) {

            var // the style sheet name
                styleName = Utils.getStringOption(attributes, 'style'),
                // get attributes of the style sheet (missing name results in default values)
                styleAttributes = getStyleSheetAttributes(styleSheets[styleName]),
                // whether to remove hard attributes equal to style attributes
                smartClear = Utils.getBooleanOption(options, 'smartClear', false),
                // allow special attributes
                special = Utils.getBooleanOption(options, 'special', false);

            // iterate all covered elements and change their formatting
            iterateReadWrite(ranges, function (element) {

                var // the element, as jQuery object
                    $element = $(element),
                    // hard attributes stored at the element
                    hardAttributes = null,
                    // the resulting attributes to be set at each element
                    cssAttributes = null;

                // change style sheet of the element (remove existing hard attributes)
                if (styleName) {
                    hardAttributes = { style: styleName };
                    cssAttributes = _.clone(styleAttributes);
                } else {
                    hardAttributes = getElementAttributes($element);
                    // clone the attributes coming from the element, there may
                    // be multiple elements pointing to the same data object,
                    // e.g. after using the $.clone() method.
                    hardAttributes = hardAttributes ? _.clone(hardAttributes) : {};
                    cssAttributes = {};
                }

                // add passed attributes
                _(attributes).each(function (value, name) {
                    var definition = definitions[name];
                    if (definition && (special || !definition.special)) {
                        if (smartClear && (styleAttributes[name] === value)) {
                            delete hardAttributes[name];
                        } else {
                            hardAttributes[name] = value;
                        }
                        cssAttributes[name] = value;
                    }
                });

                // write back hard attributes to the element
                setElementAttributes($element, hardAttributes);

                // change CSS formatting of the element
                _(cssAttributes).each(function (value, name) {
                    // cssAttributes contains valid attribute names only
                    definitions[name].set($element, value);
                });
            });
        };

        // initialization -----------------------------------------------------

        // build map with default attributes
        _(definitions).each(function (definition, name) {
            defaultAttributes[name] = definition.value;
        });

    } // class StyleSheets

    // static methods ---------------------------------------------------------

    /**
     * Returns whether the passed elements contain equal formatting attributes.
     *
     * @param {HTMLElement} element1
     *  The first DOM element whose formatting attributes will be compared with
     *  the attributes of the other passed element.
     *
     * @param {HTMLElement} element2
     *  The second DOM element whose formatting attributes will be compared
     *  with the attributes of the other passed element.
     *
     * @returns {Boolean}
     *  Whether both elements contain equal formatting attributes.
     */
    StyleSheets.hasEqualAttributes = function (element1, element2) {
        return _.isEqual(getElementAttributes($(element1)), getElementAttributes($(element2)));
    };

    // exports ================================================================

    return _.makeExtendable(StyleSheets);

});
