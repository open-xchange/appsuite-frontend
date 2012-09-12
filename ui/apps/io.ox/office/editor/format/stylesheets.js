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
     'io.ox/office/tk/utils',
     'io.ox/office/editor/dom'
    ], function (Events, Utils, DOM) {

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
     * @param {String} styleFamily
     *  The main attribute family represented by the style sheets in this
     *  container. The style sheets MUST support all attributes of this family.
     *  Additionally, the style sheets MAY support the attributes of other
     *  attribute families.
     *
     * @param {Object} definitions
     *
     * @param {DocumentStyles} documentStyles
     *  Collection with the style containers of all style families.
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
    function StyleSheets(styleFamily, definitions, documentStyles, iterateReadOnly, iterateReadWrite, options) {

        var // style sheets, mapped by identifier
            styleSheets = {},
            // default values for all supported attributes of the own style family
            defaultAttributes = {},
            // additional attribute families supported by the style sheets
            descendantStyleFamilies = _(Utils.getStringOption(options, 'descendantStyleFamilies', '').split(/\s+/)).without(''),
            // style family of ancestor style sheets
            ancestorStyleFamily = Utils.getStringOption(options, 'ancestorStyleFamily'),
            // element resolver for style sheets referred by ancestor DOM elements
            ancestorElementResolver = Utils.getFunctionOption(options, 'ancestorElementResolver');

        // private methods ----------------------------------------------------

        /**
         * Returns whether the passed style sheet is a descendant of the other
         * passed style sheet.
         */
        function isDescendantStyleSheet(styleSheet, ancestorStyleSheet) {
            while (styleSheet) {
                if (styleSheet === ancestorStyleSheet) { return true; }
                styleSheet = styleSheets[styleSheet.parentId];
            }
            return false;
        }

        /**
         * Returns whether the passed string is the name of a attribute
         * registered in the definitions passed to the constructor.
         *
         * @param {String} name
         *  The attribute name to be checked.
         *
         * @param {Boolean} [special]
         *  If set to true, returns true for special attributes (attributes
         *  that are marked with the 'special' flag in the attribute
         *  definitions). Otherwise, special attributes will not be recognized
         *  by this function.
         *
         * @returns {Boolean}
         *  Whether the attribute is supported.
         */
        function isRegisteredAttribute(name, special) {
            return (name in definitions) && (special || (definitions[name].special !== true));
        }

        /**
         * Returns the merged attributes of a specific attribute family from
         * the specified style sheet and all of its ancestors.
         *
         * @param {String} id
         *  The unique identifier of the style sheet.
         *
         * @param {String} family
         *  The attribute family whose attributes will be returned.
         *
         * @param {HTMLElement} [element]
         *  The DOM element used to resolve ancestor style attributes.
         *
         * @returns {Object}
         *  The formatting attributes contained in the style sheet and its
         *  ancestor style sheets up to the map of default attributes, as map
         *  of name/value pairs.
         */
        function getStyleAttributes(id, family, element) {

            var // the attributes of the style sheet and its ancestors
                attributes = {},
                // ancestor style sheet container from the document styles collection
                ancestorStyleSheets = _.isString(ancestorStyleFamily) ? documentStyles.getStyleSheets(ancestorStyleFamily) : null,
                // ancestor element of the passed element
                ancestorElement = (element && _.isFunction(ancestorElementResolver)) ? ancestorElementResolver(element) : null;

            function collectAttributes(styleSheet) {
                if (styleSheet) {
                    // call recursively to get the attributes of the ancestor style sheets
                    collectAttributes(styleSheets[styleSheet.parentId]);
                    // add own attributes of the specified attribute family
                    if (family in styleSheet.attributes) {
                        _(attributes).extend(styleSheet.attributes[family]);
                    }
                } else {
                    // no more parent style sheets: start with default values from definitions
                    attributes = (family === styleFamily) ? _.clone(defaultAttributes) : {};
                    // collect styles from ancestor elements if specified
                    if (ancestorStyleSheets && ancestorElement) {
                        _(attributes).extend(ancestorStyleSheets.getElementStyleAttributes(ancestorElement, family));
                    }
                }
            }

            // add style sheet identifier to attributes
            if (!(id in styleSheets)) {
                id = 'standard';
            }

            // collect attributes from the style sheet and its ancestors
            if ((family === styleFamily) || _(descendantStyleFamilies).contains(family)) {
                collectAttributes(styleSheets[id]);
            }

            // add style sheet identifier to attributes
            attributes.style = id;

            return attributes;
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the names of all style sheets in a map, keyed by their
         * unique identifiers.
         *
         * @param {Boolean=} skipHidden
         *  Optional parameter, if true style sheets with hidden flag will not be included
         */
        this.getStyleSheetNames = function (skipHidden) {
            var names = {};
            _(styleSheets).each(function (styleSheet, id) {
                if (!skipHidden || skipHidden && !styleSheet.hidden) {
                    names[id] = styleSheet.name;
                }
            });
            return names;
        };

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
         *  of attribute maps (name/value pairs), keyed by attribute family.
         *
         * @param {Boolean=} hidden
         *  Optional property that determines if the style should be displayed in the UI (default is false)
         *
         * @param {Number=} uiPriority
         *  Optional property that describes the priority of the style (0 is default, the lower the value the higher the priority)
         *
         * @returns {StyleSheets}
         *  A reference to this instance.
         */
        this.addStyleSheet = function (id, name, parentId, attributes, hidden, uiPriority) {

            var // get or create a style sheet object
                styleSheet = styleSheets[id] || (styleSheets[id] = {});

            // set user-defined name of the style sheet
            styleSheet.name = name;

            // set parent of the style sheet, check for cyclic references
            styleSheet.parentId = parentId;
            if (isDescendantStyleSheet(styleSheets[styleSheet.parentId], styleSheet)) {
                Utils.warn('StyleSheets.addStyleSheet(): cyclic reference, cannot set style sheet parent');
                styleSheet.parentId = null;
            }

            // set if style sheet should be displayed in the UI
            styleSheet.hidden = hidden || false;

            // set the UI display priority of the style sheet
            styleSheet.uiPriority = uiPriority || 0;

            // prepare attribute map (empty attributes for all supported families)
            styleSheet.attributes = Utils.makeSimpleObject(styleFamily, {});
            _(descendantStyleFamilies).each(function (family) {
                styleSheet.attributes[family] = {};
            });

            // set clones of passed attributes for all supported attribute families
            if (_.isObject(attributes)) {
                _(attributes).each(function (attributes, family) {
                    if (family in styleSheet.attributes) {
                        styleSheet.attributes[family] = _.clone(attributes);
                    }
                });
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

            if (id === 'standard') {
                Utils.warn('StyleSheets.removeStyleSheet(): cannot remove standard style sheet');
                styleSheet = null;
            }

            if (styleSheet) {
                // update parent of all style sheets referring to the removed style sheet
                _(styleSheets).each(function (childSheet) {
                    if (id === childSheet.parentId) {
                        childSheet.parentId = styleSheet.parentId;
                    }
                });

                // remove style sheet from map
                delete styleSheets[id];

                // notify listeners
                this.trigger('change');
            }
            return this;
        };

        this.getPreviewButtonOptions = function (id) {

            var // the result options
                options = { css: {}, labelCss: {} },
                // formatting attributes of the specified style sheet
                styleAttributes = getStyleAttributes(id, styleFamily);

            // add options for the own style family
            this.updatePreviewButtonOptions(options, styleAttributes);

            // add options for descendant style sheet families
            _(descendantStyleFamilies).each(function (family) {
                var styleSheets = documentStyles.getStyleSheets(family),
                    styleAttributes = getStyleAttributes(id, family);
                styleSheets.updatePreviewButtonOptions(options, styleAttributes);
            });

            return options;
        };

        /**
         * Returns the formatting attributes of a specific attribute family
         * from the current style sheet of the specified DOM element.
         *
         * @param {HTMLElement|jQuery} element
         *  The element referring to a style sheet whose attributes will be
         *  returned. If this object is a jQuery collection, uses the first DOM
         *  node it contains.
         *
         * @param {String} family
         *  The attribute family whose attributes will be returned.
         *
         * @returns {Object}
         *  A map of name/value pairs containing the attributes of the style
         *  sheet referred by the passed element.
         */
        this.getElementStyleAttributes = function (element, family) {
            element = Utils.getDomNode(element);
            return getStyleAttributes(getElementAttributes($(element)).style, family, element);
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
                    styleAttributes = getStyleAttributes(elementAttributes.style, styleFamily, element),
                    // whether any attribute is still unambiguous
                    hasNonNull = false;

                // overwrite style sheet attributes with existing element attributes
                _(styleAttributes).extend(elementAttributes);

                // filter by supported attributes (styles may contain other attributes)
                _(styleAttributes).each(function (value, name)  {
                    if ((name !== 'style') && !isRegisteredAttribute(name, special)) {
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
                styleId = Utils.getStringOption(attributes, 'style'),
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
                    styleAttributes = getStyleAttributes(styleId, styleFamily, element);
                    elementAttributes = { style: styleAttributes.style };
                    cssAttributes = _.clone(styleAttributes);
                } else {
                    // clone the attributes coming from the element, there may
                    // be multiple elements pointing to the same data object,
                    // e.g. after using the $.clone() method.
                    elementAttributes = getElementAttributes($element, true);
                    styleAttributes = getStyleAttributes(elementAttributes.style, styleFamily, element);
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

                // update CSS formatting of descendant elements, if another
                // style sheet has been set at the element
                if (descendantStyleFamilies.length && (styleId in styleSheets)) {
                    var ranges = [DOM.Range.createRangeForNode(element)];
                    _(descendantStyleFamilies).each(function (family) {
                        documentStyles.getStyleSheets(family).updateFormattingInRanges(ranges);
                    });
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
                return _.isString(name) && (name !== 'style');
            }).value();

            // iterate all covered elements and change their formatting
            iterateReadWrite(ranges, function (element) {

                var // the element, as jQuery object
                    $element = $(element),
                    // explicit element attributes
                    elementAttributes = getElementAttributes($element, true),
                    // get attributes of the style sheet (only of the style family)
                    styleAttributes = getStyleAttributes(elementAttributes.style, styleFamily, element),
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
                    styleAttributes = getStyleAttributes(elementAttributes.style, styleFamily, element),
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

        this.updatePreviewButtonOptions = function (options, attributes) {
            _(attributes).each(function (value, name) {
                var definition = definitions[name];
                if (definition && _.isFunction(definition.preview)) {
                    definition.preview(options, value);
                }
            });
        };

        /**
         * Returns the UI priority for the style sheet (0 is default, the lower the value the higher the priority)
         *
         * @param {String} id
         *  The unique identifier of the style sheet.
         *
         * @returns {Number}
         *  The priority
         */
        this.getUIPriority = function (id) {
            if (id && styleSheets[id] && _.isNumber(styleSheets[id].uiPriority)) {
                return styleSheets[id].uiPriority;
            }
            return 0;
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
