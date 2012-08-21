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

    /**
     * Returns whether the passed style sheet refers to itself in its chain of
     * ancestors.
     */
    function isCircularReference(styleSheet) {
        var parentStyleSheet = styleSheet.parent;
        while (parentStyleSheet) {
            if (parentStyleSheet === styleSheet) { return true; }
            parentStyleSheet = parentStyleSheet.parent;
        }
        return false;
    }

    /**
     * Returns the attribute map stored in the passed DOM element.
     *
     * @param {jQuery} element
     *  The DOM element, as jQuery object.
     *
     * @param {Boolean} [clone]
     *  If set to true, the returned attribute map will be a clone of the
     *  attribute map stored in the element.
     *
     * @returns {Object}
     *  The attribute map if existing, otherwise an empty object.
     */
    function getElementAttributes(element, clone) {
        var attributes = element.data('attributes');
        return _.isObject(attributes) ? (clone ? _.clone(attributes) : attributes) : {};
    }

    /**
     * Stores the passed attribute map in the specified DOM element.
     *
     * @param {jQuery} element
     *  The DOM element, as jQuery object.
     *
     * @param {Object} attributes
     *  The attribute map to be stored in the element.
     */
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
    function StyleSheets(definitions, iterateReadOnly, iterateReadWrite, styleAttrName, altStyleNames) {

        var // style sheets, mapped by name
            styleSheets = {},
            // name of the default style sheet
            defaultStyleSheetName = '',
            // default values for all supported attributes
            defaultAttributes = {},
            // collector for ancestor style attributes
            collectAncestorStyleAttributes = function () { return _.clone(defaultAttributes); };

        // private methods ----------------------------------------------------

        /**
         * Returns whether the passed string is the name of a supported
         * attribute.
         *
         * @param {String} name
         *  The attribute name to be checked.
         *
         * @param {Boolean} [special]
         *  If set to true, returns true for special attributes (attributes
         *  that are marked with the 'special' flag in the attribute
         *  definitions passed to the constructor). Otherwise, special
         *  attributes will not be recognized by this function.
         *
         * @returns {Boolean}
         *  Whether the attribute is supported.
         */
        function isAttribute(name, special) {
            return (name in definitions) && (special || (definitions[name].special !== true));
        }

        /**
         * Returns the merged attributes of the specified style sheet and all
         * of its ancestors.
         *
         * @param {HTMLElement} element
         *  The DOM element used to resolve ancestor style attributes.
         *
         * @param {String} styleName
         *  The name of the style sheet.
         *
         * @returns {Object}
         *  The formatting attributes contained in the style sheet and its
         *  ancestor style sheet up to the map of default attributes, as map of
         *  name/value pairs.
         */
        function getStyleAttributes(element, styleName) {

            var // the attributes of the style sheet and its ancestors
                attributes = {};

            function collectAttributes(styleSheet) {
                if (styleSheet) {
                    // call recursively to get the attributes of the ancestor style sheets
                    collectAttributes(styleSheet.parent);
                    // add own attributes
                    _(attributes).extend(styleSheet.attributes);
                } else {
                    // no more parent style sheets, try styles from ancestor elements
                    attributes = collectAncestorStyleAttributes(element);
                }
            }

            // validate style name (fall-back to default style sheet)
            if (!(styleName in styleSheets)) {
                styleName = defaultStyleSheetName;
            }

            // collect attributes from style sheet and its ancestors
            collectAttributes(styleSheets[styleName]);

            // add style sheet name to attributes
            attributes[styleAttrName] = styleName;
            return attributes;
        }

        // methods ------------------------------------------------------------

        this.registerAncestorStyleSheets = function (ancestorStyleSheets, getAncestorElementFunctor) {
            collectAncestorStyleAttributes = function (element) {
                return ancestorStyleSheets.getElementStyleAttributes(getAncestorElementFunctor(element));
            };
        };

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
         * @param {Boolean} [isDefault]
         *  If set to true, the style sheet will be set as default style sheet
         *  used when an element does not contain an explicit style name.
         *
         * @returns {StyleSheets}
         *  A reference to this instance.
         */
        this.addStyleSheet = function (name, parent, attributes, isDefault) {

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
                if (isAttribute(name)) {
                    styleSheet.attributes[name] = value;
                }
            });

            // default style sheet
            if (isDefault) {
                defaultStyleSheetName = name;
            }

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

                // remove default style sheet
                if (name === defaultStyleSheetName) {
                    defaultStyleSheetName = '';
                }
            }
            return this;
        };

        /**
         * Returns the names of all style sheets in a string array.
         */
        this.getStyleSheetNames = function () {
            return _.keys(styleSheets);
        };

        this.getElementStyleAttributes = function (element) {
            var styleName = getElementAttributes($(element))[styleAttrName];
            return getStyleAttributes(element, styleName);
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

                var // the current element, as jQuery object
                    $element = $(element),
                    // get the hard formatting attributes
                    hardAttributes = getElementAttributes($element),
                    // get attributes of the style sheet
                    styleAttributes = getStyleAttributes(element, hardAttributes[styleAttrName]),
                    // whether any attribute is still unambiguous
                    hasNonNull = false;

                // overwrite style sheet attributes with existing hard attributes
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

            }, this);

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
         *  @param {Boolean} [options.clear=false]
         *      If set to true, hard formatting attributes that are equal to
         *      the attributes of the current style sheet will be removed from
         *      the elements.
         *  @param {Boolean} [options.special=false]
         *      If set to true, allows to change special attributes (attributes
         *      that are marked with the 'special' flag in the attribute
         *      definitions passed to the constructor).
         */
        this.setRangeAttributes = function (ranges, attributes, options) {

            var // the style sheet name
                styleName = Utils.getStringOption(attributes, styleAttrName),
                // whether to remove hard attributes equal to style attributes
                clear = Utils.getBooleanOption(options, 'clear', false),
                // allow special attributes
                special = Utils.getBooleanOption(options, 'special', false),
                // style sheet attributes
                styleAttributes = null;

            // re-map to alternative style name
            if (altStyleNames && (styleName in altStyleNames)) {
                styleName = altStyleNames[styleName];
            }

            // iterate all covered elements and change their formatting
            iterateReadWrite(ranges, function (element) {

                var // the element, as jQuery object
                    $element = $(element),
                    // hard attributes stored at the element
                    hardAttributes = null,
                    // attributes of the current or new style sheet
                    styleAttributes = null,
                    // the attributes whose CSS needs to be changed
                    cssAttributes = null;

                if (styleName) {
                    // change style sheet of the element: remove existing hard
                    // attributes, set CSS formatting of all attributes
                    // according to the new style sheet
                    hardAttributes = Utils.makeSimpleObject(styleAttrName, styleName);
                    styleAttributes = getStyleAttributes(element, styleName);
                    cssAttributes = _.clone(styleAttributes);
                    delete cssAttributes[styleAttrName];
                } else {
                    // clone the attributes coming from the element, there may
                    // be multiple elements pointing to the same data object,
                    // e.g. after using the $.clone() method.
                    hardAttributes = getElementAttributes($element, true);
                    styleAttributes = getStyleAttributes(element, hardAttributes[styleAttrName]);
                    cssAttributes = {};
                }

                // add passed attributes
                _(attributes).each(function (value, name) {
                    if (isAttribute(name, special)) {
                        if (clear && (styleAttributes[name] === value)) {
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

            }, this);
        };

        /**
         * Clears specific formatting attributes in the specified DOM ranges.
         *
         * @param {DOM.Range[]} ranges
         *  (in/out) The DOM ranges to be formatted. The array will b
         *  validated and sorted before iteration starts (see method
         *  DOM.iterateNodesInRanges() for details).
         *
         * @param {String|String[]} [attributeNames]
         *  A single attribute name, or an an array of attribute names. It is
         *  not possible to clear the style sheet name. If omitted, clears all
         *  hard formatting attributes.
         *
         * @param {Object} [options]
         *  A map of options controlling the operation. Supports the following
         *  options:
         *  @param {Boolean} [options.special=false]
         *      If set to true, allows to clear special attributes (attributes
         *      that are marked with the 'special' flag in the attribute
         *      definitions passed to the constructor).
         */
        this.clearRangeAttributes = function (ranges, attributes, options) {

            var // allow special attributes
                special = Utils.getBooleanOption(options, 'special', false);

            // validate passed array of attribute names
            attributes = _.chain(attributes).getArray().filter(function (name) {
                return _.isString(name) && (name !== styleAttrName);
            }).value();

            // iterate all covered elements and change their formatting
            iterateReadWrite(ranges, function (element) {

                var // the element, as jQuery object
                    $element = $(element),
                    // hard attributes stored at the element
                    hardAttributes = getElementAttributes($element, true),
                    // get attributes of the style sheet
                    styleAttributes = getStyleAttributes(element, hardAttributes[styleAttrName]),
                    // the resulting attributes to be changed at each element
                    cssAttributes = {};

                // remove all or specified attributes from map of element attributes
                if (attributes.length) {
                    _(attributes).each(function (name) {
                        if (isAttribute(name, special) && (name in hardAttributes)) {
                            delete hardAttributes[name];
                            cssAttributes[name] = styleAttributes[name];
                        }
                    });
                } else {
                    _(hardAttributes).each(function (value, name) {
                        if (isAttribute(name, special) && (name !== styleAttrName)) {
                            delete hardAttributes[name];
                            cssAttributes[name] = styleAttributes[name];
                        }
                    });
                }

                // write back hard attributes to the element
                setElementAttributes($element, hardAttributes);

                // change CSS formatting of the element
                _(cssAttributes).each(function (value, name) {
                    // cssAttributes contains valid attribute names only
                    definitions[name].set($element, value);
                });

            }, this);
        };

        // initialization -----------------------------------------------------

        // build map with default attributes
        _(definitions).each(function (definition, name) {
            defaultAttributes[name] = definition.def;
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
    StyleSheets.hasEqualElementAttributes = function (element1, element2) {
        return _.isEqual(getElementAttributes($(element1)), getElementAttributes($(element2)));
    };

    // exports ================================================================

    return _.makeExtendable(StyleSheets);

});
