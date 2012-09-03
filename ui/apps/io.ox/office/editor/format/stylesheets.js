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

define('io.ox/office/editor/format/stylesheets',
    ['io.ox/core/event',
     'io.ox/office/tk/utils'
    ], function (Events, Utils) {

    'use strict';

    // private static functions ===============================================

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
    function StyleSheets(definitions, iterateReadOnly, iterateReadWrite, styleAttrName, options) {

        var // style sheets, mapped by identifier
            styleSheets = {},
            // identifier of the default style sheet
            defaultStyleId = '',
            // default values for all supported attributes
            defaultAttributes = {},
            // collector for style attributes from ancestor elements
            collectAncestorStyleAttributesHandler = Utils.getFunctionOption(options, 'collectAncestorStyleAttributes'),
            // collector for style attributes from ancestor elements
            updateDescendantStyleAttributesHandler = Utils.getFunctionOption(options, 'updateDescendantStyleAttributes');

        // private methods ----------------------------------------------------

        /**
         * Returns whether the passed style sheet is a descendant of the other
         * passed style sheet.
         */
        function isDescendant(styleSheet, ancestorStyleSheet) {
            while (styleSheet) {
                if (styleSheet === ancestorStyleSheet) { return true; }
                styleSheet = styleSheets[styleSheet.parentId];
            }
            return false;
        }

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
        function isRegisteredAttribute(name, special) {
            return (name in definitions) && (special || (definitions[name].special !== true));
        }

        /**
         * Returns the merged attributes of the specified style sheet and all
         * of its ancestors.
         *
         * @param {HTMLElement} element
         *  The DOM element used to resolve ancestor style attributes.
         *
         * @param {String} styleId
         *  The unique identifier of the style sheet.
         *
         * @returns {Object}
         *  The formatting attributes contained in the style sheet and its
         *  ancestor style sheets up to the map of default attributes, as map
         *  of name/value pairs.
         */
        function getStyleAttributes(element, styleId) {

            var // the attributes of the style sheet and its ancestors
                attributes = {};

            function collectAttributes(styleSheet) {
                if (styleSheet) {
                    // call recursively to get the attributes of the ancestor style sheets
                    collectAttributes(styleSheets[styleSheet.parentId]);
                    // add own attributes
                    _(attributes).extend(styleSheet.attributes);
                } else {
                    // no more parent style sheets: start with default values from definitions
                    attributes = _.clone(defaultAttributes);
                    // collect styles from ancestor elements if specified
                    if (_.isFunction(collectAncestorStyleAttributesHandler)) {
                        _(attributes).extend(collectAncestorStyleAttributesHandler(element));
                    }
                }
            }

            // validate style identifier (fall-back to default style sheet)
            if (!(styleId in styleSheets)) {
                styleId = defaultStyleId;
            }

            // collect attributes from the style sheet and its ancestors
            collectAttributes(styleSheets[styleId]);

            // add style sheet identifier to attributes
            attributes[styleAttrName] = styleId;
            return attributes;
        }

        // methods ------------------------------------------------------------

        /**
         * Adds a new style sheet to this container. An existing style sheet
         * with the specified identifier will be replaced.
         *
         * @param {String} id
         *  The unique identifier of of the new style sheet.
         *
         * @param {String} name
         *  The user-defined name of of the new style sheet.
         *
         * @param {String|Null} parentId
         *  The identifier of of the parent style sheet the new style sheet
         *  will derive undefined attributes from.
         *
         * @param {Object} attributes
         *  The formatting attributes contained in the new style sheet, as map
         *  of name/value pairs.
         *
         * @param {Boolean} [isDefault]
         *  If set to true, the style sheet will be set as default style sheet
         *  used when an element does not contain an explicit style name.
         *
         * @returns {StyleSheets}
         *  A reference to this instance.
         */
        this.addStyleSheet = function (id, name, parentId, attributes, isDefault) {

            var // get or create a style sheet object
                styleSheet = styleSheets[id] || (styleSheets[id] = {});

            // set user-defined name of the style sheet
            styleSheet.name = name;

            // set parent of the style sheet, check for cyclic references
            styleSheet.parentId = parentId;
            if (isDescendant(styleSheets[styleSheet.parentId], styleSheet)) {
                Utils.warn('StyleSheets.addStyleSheet(): cyclic reference, cannot set style sheet parent');
                styleSheet.parentId = null;
            }

            // set attributes (allow any attribute names, do not restrict to definitions)
            styleSheet.attributes = _.isObject(attributes) ? _.clone(attributes) : {};

            // default style sheet
            if (isDefault) {
                defaultStyleId = id;
            }

            // notify listeners
            this.trigger('change');

            return this;
        };

        /**
         * Removes an existing style sheet from this container.
         *
         * @param {String} id
         *  The unique identifier of of the style sheet to be removed.
         *
         * @returns {StyleSheets}
         *  A reference to this instance.
         */
        this.removeStyleSheet = function (id) {

            var // the style sheet to be removed
                styleSheet = styleSheets[id];

            if (styleSheet) {
                // update parent of all style sheets referring to the removed style sheet
                _(styleSheets).each(function (childSheet) {
                    if (id === childSheet.parentId) {
                        childSheet.parentId = styleSheet.parentId;
                    }
                });

                // remove style sheet from map
                delete styleSheets[id];

                // remove default style sheet
                if (id === defaultStyleId) {
                    defaultStyleId = '';
                }

                // notify listeners
                this.trigger('change');
            }
            return this;
        };

        /**
         * Returns the names of all style sheets, mapped by the unique
         * identifier of each style sheet.
         */
        this.getStyleSheetNames = function () {
            var names = {};
            _(styleSheets).each(function (styleSheet, id) { names[id] = styleSheet.name; });
            return names;
        };

        /**
         * Returns the formatting attributes from the current style sheet of
         * the specified DOM element.
         *
         * @param {HTMLElement|jQuery} element
         *  The element referring to a style sheet whose attributes will be
         *  returned. If this object is a jQuery collection, uses the first DOM
         *  node it contains.
         *
         * @returns {Object}
         *  A map of name/value pairs containing the attributes of the style
         *  sheet referred by the passed element.
         */
        this.getElementStyleAttributes = function (element) {
            element = Utils.getDomNode(element);
            return getStyleAttributes(element, getElementAttributes($(element))[styleAttrName]);
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
         * @param {Object} [options]
         *  A map of options controlling the operation. Supports the following
         *  options:
         *  @param {Boolean} [options.special=false]
         *      If set to true, includes special attributes (attributes that
         *      are marked with the 'special' flag in the attribute definitions
         *      passed to the constructor) to the result map.
         *
         * @returns {Object}
         *  A map of attribute name/value pairs.
         */
        this.getAttributesInRanges = function (ranges, options) {

            var // the resulting attribute values, mapped by name
                attributes = {},
                // allow special attributes
                special = Utils.getBooleanOption(options, 'special', false);

            // get merged attributes from all covered elements
            iterateReadOnly(ranges, function (element) {

                var // the current element, as jQuery object
                    $element = $(element),
                    // get the element attributes
                    elementAttributes = getElementAttributes($element),
                    // get attributes of the style sheets
                    styleAttributes = getStyleAttributes(element, elementAttributes[styleAttrName]),
                    // whether any attribute is still unambiguous
                    hasNonNull = false;

                // overwrite style sheet attributes with existing element attributes
                _(styleAttributes).extend(elementAttributes);

                // filter by supported attributes (styles may contain other attributes)
                _(styleAttributes).each(function (value, name)  {
                    if ((name !== styleAttrName) && !isRegisteredAttribute(name, special)) {
                        delete styleAttributes[name];
                    }
                });

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
         *      If set to true, explicit element attributes that are equal to
         *      the attributes of the current style sheet will be removed from
         *      the elements.
         *  @param {Boolean} [options.special=false]
         *      If set to true, allows to change special attributes (attributes
         *      that are marked with the 'special' flag in the attribute
         *      definitions passed to the constructor).
         */
        this.setAttributesInRanges = function (ranges, attributes, options) {

            var // the style sheet identifier
                styleId = Utils.getStringOption(attributes, styleAttrName),
                // whether to remove element attributes equal to style attributes
                clear = Utils.getBooleanOption(options, 'clear', false),
                // allow special attributes
                special = Utils.getBooleanOption(options, 'special', false);

            // iterate all covered elements and change their formatting
            iterateReadWrite(ranges, function (element) {

                var // the element, as jQuery object
                    $element = $(element),
                    // explicit element attributes
                    elementAttributes = null,
                    // attributes of the current or new style sheet
                    styleAttributes = null,
                    // the attributes whose CSS needs to be changed
                    cssAttributes = null;

                if (styleId) {
                    // change style sheet of the element: remove existing
                    // element attributes, set CSS formatting of all attributes
                    // according to the new style sheet
                    elementAttributes = Utils.makeSimpleObject(styleAttrName, styleId);
                    styleAttributes = getStyleAttributes(element, styleId);
                    cssAttributes = _.clone(styleAttributes);
                } else {
                    // clone the attributes coming from the element, there may
                    // be multiple elements pointing to the same data object,
                    // e.g. after using the $.clone() method.
                    elementAttributes = getElementAttributes($element, true);
                    styleAttributes = getStyleAttributes(element, elementAttributes[styleAttrName]);
                    cssAttributes = {};
                }

                // add passed attributes
                _(attributes).each(function (value, name) {
                    if (isRegisteredAttribute(name, special)) {
                        if (clear && (styleAttributes[name] === value)) {
                            delete elementAttributes[name];
                        } else {
                            elementAttributes[name] = value;
                        }
                        cssAttributes[name] = value;
                    }
                });

                // write back element attributes to the element
                setElementAttributes($element, elementAttributes);

                // change CSS formatting of the element
                _(cssAttributes).each(function (value, name) {
                    if (name in definitions) {
                        definitions[name].set($element, value);
                    }
                });

                // update CSS formatting of descendant elements, if style sheet has changed
                if (styleId && _.isFunction(updateDescendantStyleAttributesHandler)) {
                    updateDescendantStyleAttributesHandler(element);
                }

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
         *  explicit element formatting attributes.
         *
         * @param {Object} [options]
         *  A map of options controlling the operation. Supports the following
         *  options:
         *  @param {Boolean} [options.special=false]
         *      If set to true, allows to clear special attributes (attributes
         *      that are marked with the 'special' flag in the attribute
         *      definitions passed to the constructor).
         */
        this.clearAttributesInRanges = function (ranges, attributeNames, options) {

            var // allow special attributes
                special = Utils.getBooleanOption(options, 'special', false);

            // validate passed array of attribute names
            attributeNames = _.chain(attributeNames).getArray().filter(function (name) {
                return _.isString(name) && (name !== styleAttrName);
            }).value();

            // iterate all covered elements and change their formatting
            iterateReadWrite(ranges, function (element) {

                var // the element, as jQuery object
                    $element = $(element),
                    // explicit element attributes
                    elementAttributes = getElementAttributes($element, true),
                    // get attributes of the style sheet
                    styleAttributes = getStyleAttributes(element, elementAttributes[styleAttrName]),
                    // the resulting attributes to be changed at each element
                    cssAttributes = {};

                if (attributeNames.length) {
                    // remove specified attributes
                    _(attributeNames).each(function (name) {
                        if (isRegisteredAttribute(name, special) && (name in elementAttributes)) {
                            delete elementAttributes[name];
                            cssAttributes[name] = styleAttributes[name];
                        }
                    });
                } else {
                    // remove all attributes except style name
                    _(elementAttributes).each(function (value, name) {
                        if (isRegisteredAttribute(name, special)) {
                            delete elementAttributes[name];
                            cssAttributes[name] = styleAttributes[name];
                        }
                    });
                }

                // write back element attributes to the element
                setElementAttributes($element, elementAttributes);

                // change CSS formatting of the element
                _(cssAttributes).each(function (value, name) {
                    if (name in definitions) {
                        definitions[name].set($element, value);
                    }
                });

            }, this);
        };

        this.updateFormattingInRanges = function (ranges) {

            // iterate all covered elements and change their formatting
            iterateReadWrite(ranges, function (element) {

                var // the element, as jQuery object
                    $element = $(element),
                    // explicit element attributes
                    elementAttributes = getElementAttributes($element),
                    // get attributes of the style sheet
                    styleAttributes = getStyleAttributes(element, elementAttributes[styleAttrName]),
                    // the resulting attributes to be updated at each element
                    cssAttributes = _({}).extend(styleAttributes, elementAttributes);

                // change CSS formatting of the element
                _(cssAttributes).each(function (value, name) {
                    if (name in definitions) {
                        definitions[name].set($element, value);
                    }
                });

            }, this);
        };

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

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
