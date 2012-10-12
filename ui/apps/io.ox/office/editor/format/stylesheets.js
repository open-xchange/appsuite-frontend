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
     *  original map.
     *
     * @returns {Object}
     *  The attribute map if existing, otherwise an empty object.
     */
    function getElementAttributes(element, clone) {
        var attributes = element.data('attributes');
        return _.isObject(attributes) ? ((clone === true) ? _.copy(attributes, true) : attributes) : {};
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
     *  A map of attribute definitions for all attributes supported by the
     *  specified style family, mapped by attribute names. Each definition
     *  object contains the following entries:
     *  - 'def': Specifies the default value of the attribute which will be
     *      used if neither the style sheet of an element nor its explicit
     *      attributes collection specify a value for the attribute.
     *  - 'set': An optional setter function that applies the passed attribute
     *      value to a DOM element. Will be called in the context of the style
     *      sheet container instance. The function receives the DOM element as
     *      jQuery object in the first parameter, and the attribute value in
     *      the second parameter. An alternative way to update the element
     *      formatting using a complete map of all attribute values is to
     *      specify a global setter handler (see options below).
     *  - 'preview': An optional function that initializes an options map that
     *      will be used to create a list item in a GUI style sheet selector
     *      control. Will be called in the context of the style sheet container
     *      instance. The function receives the options map to be extended in
     *      the first parameter, and the attribute value in the second
     *      parameter.
     *
     * @param {DocumentStyles} documentStyles
     *  Collection with the style containers of all style families.
     *
     * @param {Object} [options]
     *  A map of options to control the behavior of the style sheet container.
     *  The following options are supported:
     *  @param {Function} [options.globalSetHandler]
     *      If specified, this function will be called for every DOM element
     *      whose attributes have been changed. In difference to the individual
     *      setter functions defined for each single attribute (see parameter
     *      definitions above), this handler will be called once for an element
     *      regardless of the number of changed attributes. The function
     *      receives the element whose attributes have been changed as jQuery
     *      object as first parameter, and a map of all attributes (name/value
     *      pairs, effective values merged from style sheets and explicit
     *      attributes) of the element as second parameter. Will be called in
     *      the context of this style sheet container instance.
     *  @param {String} [options.descendantStyleFamilies]
     *      Space-separated list of additional attribute families whose
     *      attributes may be inserted into the attribute map of a style sheet.
     *  @param {String} [options.ancestorStyleFamily]
     *      The attribute family of the style sheets assigned to ancestor
     *      elements. Used to resolve attributes from the style sheet of an
     *      ancestor of the current element.
     *  @param {Function} [options.ancestorElementResolver]
     *      A function used to receive the ancestor element containing a style
     *      sheet of the family passed in the 'ancestorStyleFamily' option.
     *      Receives a DOM element node as first parameter, and must return the
     *      ancestor DOM element node. Will be called in the context of this
     *      style sheet container instance.
     */
    function StyleSheets(styleFamily, definitions, documentStyles, options) {

        var // self reference
            self = this,

            // style sheets, mapped by identifier
            styleSheets = {},

            // default values for all supported attributes of the own style family
            defaultAttributes = {},

            // identifier of the default style sheet
            defaultStyleId = null,

            // global element setter
            globalSetHandler = Utils.getFunctionOption(options, 'globalSetHandler'),

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
         * @param {jQuery} [element]
         *  The DOM element used to resolve ancestor style attributes, as
         *  jQuery object.
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
                ancestorElement = (element && _.isFunction(ancestorElementResolver)) ? ancestorElementResolver.call(self, Utils.getDomNode(element)) : null;

            function collectAttributes(styleSheet) {
                if (styleSheet) {
                    // call recursively to get the attributes of the ancestor style sheets
                    collectAttributes(styleSheets[styleSheet.parentId]);
                    // add own attributes of the specified attribute family
                    if (family in styleSheet.attributes) {
                        attributes = Utils.extendOptions(attributes, styleSheet.attributes[family]);
                    }
                } else {
                    // no more parent style sheets: start with default values from definitions
                    attributes = (family === styleFamily) ? _.clone(defaultAttributes) : {};
                    // collect styles from ancestor elements if specified
                    if (ancestorStyleSheets && ancestorElement) {
                        attributes = Utils.extendOptions(attributes, ancestorStyleSheets.getElementStyleAttributes(ancestorElement, family));
                    }
                }
            }

            // add style sheet identifier to attributes
            if (!(id in styleSheets) && (defaultStyleId in styleSheets)) {
                id = defaultStyleId;
            }

            // collect attributes from the style sheet and its ancestors
            if ((family === styleFamily) || _(descendantStyleFamilies).contains(family)) {
                collectAttributes(styleSheets[id]);
            }

            // add style sheet identifier to attributes
            attributes.style = id;

            return attributes;
        }

        /**
         * Updates the element formatting according to the passed attributes.
         *
         * @param {jQuery} element
         *  The element whose formatting will be updated, as jQuery object.
         *
         * @param {Object} mergedAttributes
         *  A map with all attribute values merged from style sheet and
         *  explicit attributes, as name/value pairs.
         *
         * @param {String[]} [updateAttributeNames]
         *  If specified, restricts the set of attributes updated at the passed
         *  element. If omitted, updates all attributes passed in the parameter
         *  mergedAttributes.
         */
        function updateElementFormatting(element, mergedAttributes, updateAttributeNames) {

            // updates a single attribute, if it has a registered setter in its definition
            function updateSingleAttribute(name, value) {
                if ((name in definitions) && _.isFunction(definitions[name].set)) {
                    definitions[name].set.call(self, element, value);
                }
            }

            // update attributes via setter functions from definitions
            if (_.isArray(updateAttributeNames)) {
                _(updateAttributeNames).each(function (name) {
                    if (name in mergedAttributes) {
                        updateSingleAttribute(name, mergedAttributes[name]);
                    }
                });
            } else {
                _(mergedAttributes).each(function (value, name) {
                    updateSingleAttribute(name, value);
                });
            }

            // call global setter handler taking all attributes at once
            if (_.isFunction(globalSetHandler)) {
                globalSetHandler.call(self, element, mergedAttributes);
            }
        }

        // abstract interface -------------------------------------------------

        /**
         * Subclasses MUST overwrite this method and implement iterating the
         * DOM elements covered by the passed array of DOM ranges for read-only
         * access. Usually the iterator functions defined in the DOM module can
         * be used to implement the iteration process.
         *
         * @param {DOM.Range[]} ranges
         *  (in/out) The DOM ranges to be visited.
         *
         * @param {Function} iterator
         *  The iterator function to be called for each found DOM element. This
         *  function receives the current DOM element as first parameter.
         *
         * @param {Object} [context]
         *  If specified, the iterator will be called with this context (the
         *  symbol 'this' will be bound to the context inside the iterator
         *  function).
         */
        this.iterateReadOnly = function (ranges, iterator, context) {
            Utils.error('StyleSheets.iterateReadOnly(): MUST be implemented in the subclass!');
        };

        /**
         * Subclasses MUST overwrite this method and implement iterating the
         * DOM elements covered by the passed array of DOM ranges for
         * read/write access. Usually the iterator functions defined in the DOM
         * module can be used to implement the iteration process.
         *
         * @param {DOM.Range[]} ranges
         *  (in/out) The DOM ranges to be visited.
         *
         * @param {Function} iterator
         *  The iterator function to be called for each found DOM element. This
         *  function receives the current DOM element as first parameter.
         *
         * @param {Object} [context]
         *  If specified, the iterator will be called with this context (the
         *  symbol 'this' will be bound to the context inside the iterator
         *  function).
         */
        this.iterateReadWrite = function (ranges, iterator, context) {
            Utils.error('StyleSheets.iterateReadWrite(): MUST be implemented in the subclass!');
        };

        // methods ------------------------------------------------------------

        /**
         * Returns the names of all style sheets in a map, keyed by their
         * unique identifiers.
         *
         * @param {Boolean} [includeHidden=false]
         *  Specifies whether style sheets with the 'hidden' flag will be
         *  included in the returned list.
         *
         * @returns {Object}
         *  A map with all style sheet names, keyed by style sheet identifiers.
         */
        this.getStyleSheetNames = function (includeHidden) {
            var names = {};
            _(styleSheets).each(function (styleSheet, id) {
                if ((includeHidden === true) || !styleSheet.hidden) {
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
         *  Supports the main attribute family passed in the styleFamily
         *  parameter to the constructor, and all additional attribute families
         *  registered via the 'descendantStyleFamilies' constructor option.
         *
         * @param {Object} [options]
         *  A map of options to control the behavior of the new style sheet.
         *  The following options are supported:
         *  @param {Boolean} [options.hidden=false]
         *      Determines if the style should be displayed in the user
         *      interface.
         *  @param {Number} [options.priority=0]
         *      The sorting priority of the style (the lower the value the
         *      higher the priority).
         *  @param {Boolean} [defStyle=false]
         *      True, if the new style sheet is the default style sheet of this
         *      style sheet container. The default style will be used for all
         *      elements without explicit style sheet.
         *
         * @returns {StyleSheets}
         *  A reference to this instance.
         */
        this.addStyleSheet = function (id, name, parentId, attributes, options) {

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

            // set style sheet options
            styleSheet.hidden = Utils.getBooleanOption(options, 'hidden', false);
            styleSheet.priority = Utils.getIntegerOption(options, 'priority', 0);

            // set new default style sheet
            if (Utils.getIntegerOption(options, 'defStyle', false)) {

            }

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

            if (id === defaultStyleId) {
                Utils.warn('StyleSheets.removeStyleSheet(): cannot remove default style sheet');
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

        /**
         * Returns the UI priority for the specified style sheet.
         *
         * @param {String} id
         *  The unique identifier of the style sheet.
         *
         * @returns {Number}
         *  The UI priority.
         */
        this.getUIPriority = function (id) {
            return (id in styleSheets) ? styleSheets[id].priority : 0;
        };

        /**
         * Returns the options map used to create the preview list item in a
         * style chooser control. Uses the 'preview' entry of all attribute
         * definitions to build the options map.
         *
         * @param {String} id
         *  The unique identifier of of the style sheet whose preview will be
         *  created.
         *
         * @returns {Object}
         *  A map of options passed to the creator function of the preview
         *  button element.
         */
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
            var $element = $(element),
                attributes = getElementAttributes($element);
            return getStyleAttributes(attributes.style, family, $element);
        };

        /**
         * Returns the merged values of all formatting attributes in the
         * specified DOM element. If an attribute value is not unique in the specified
         * ranges, the respective value in the returned attribute map be set to
         * null.
         *
         * @param {HTMLElement|jQuery} element
         *  The element whose attributes will be returned. If this object is a
         *  jQuery collection, uses the first DOM node it contains.
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
        this.getElementAttributes = function (element, options) {

            var // whether to allow special attributes
                special = Utils.getBooleanOption(options, 'special', false),

                // the current element, as jQuery object
                $element = $(element),
                // get the element attributes
                elementAttributes = getElementAttributes($element),
                // get attributes of the style sheets
                styleAttributes = getStyleAttributes(elementAttributes.style, styleFamily, $element),
                // the resulting attributes according to style sheet and explicit formatting
                mergedAttributes = Utils.extendOptions(styleAttributes, elementAttributes);

            // filter by supported attributes
            _(mergedAttributes).each(function (value, name)  {
                if ((name !== 'style') && !isRegisteredAttribute(name, special)) {
                    delete mergedAttributes[name];
                }
            });

            return mergedAttributes;
        };

        /**
         * Returns the merged values of all formatting attributes in the
         * specified DOM ranges. If an attribute value is not unique in the
         * specified ranges, the respective value in the returned attribute map
         * be set to null.
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
                attributes = {};

            // get merged attributes from all covered elements
            this.iterateReadOnly(ranges, function (element) {

                var // get attributes of the current element
                    elementAttributes = this.getElementAttributes(element, options),
                    // whether any attribute is still unambiguous
                    hasNonNull = false;

                // update all attributes in the result set
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

            }, this);

            return attributes;
        };

        /**
         * Changes specific formatting attributes in the specified DOM element.
         *
         * @param {HTMLElement|jQuery} element
         *  The element whose attributes will be changed. If this object is a
         *  jQuery collection, uses the first DOM node it contains.
         *
         * @param {Object} attributes
         *  A map of attribute name/value pairs. To clear an explicit attribute
         *  value from the element (thus defaulting to the current style
         *  sheet), the value in this map can be set to null.
         *
         * @param {Object} [options]
         *  A map of options controlling the operation. Supports the following
         *  options:
         *  @param {Boolean} [options.clear=false]
         *      If set to true, explicit element attributes that are equal to
         *      the attributes of the current style sheet will be removed from
         *      the element.
         *  @param {Boolean} [options.special=false]
         *      If set to true, allows to change special attributes (attributes
         *      that are marked with the 'special' flag in the attribute
         *      definitions passed to the constructor).
         *  @param {Function} [options.changeListener]
         *      If specified, will be called if the attributes of the element
         *      have been changed. Will be called in the context of this style
         *      sheet container instance. Receives the passed element as first
         *      parameter, the old explicit attributes (name/value map) as
         *      second parameter, and the new explicit attributes (name/value
         *      map) as third parameter.
         */
        this.setElementAttributes = function (element, attributes, options) {

            var // the style sheet identifier
                styleId = Utils.getStringOption(attributes, 'style'),
                // whether to remove element attributes equal to style attributes
                clear = Utils.getBooleanOption(options, 'clear', false),
                // allow special attributes
                special = Utils.getBooleanOption(options, 'special', false),
                // change listener notified for changed attributes
                changeListener = Utils.getFunctionOption(options, 'changeListener'),

                // the element, as jQuery object
                $element = $(element),
                // the existing explicit element attributes
                oldElementAttributes = getElementAttributes($element),
                // new explicit element attributes
                elementAttributes = null,
                // attributes of the current or new style sheet
                styleAttributes = null,
                // the resulting attributes according to style sheet and explicit formatting
                mergedAttributes = null,
                // names of all attributes needed to update the current element
                updateAttributeNames = null;

            if (styleId) {
                // style sheet of the element will be changed: remove all
                // existing element attributes
                styleAttributes = getStyleAttributes(styleId, styleFamily, $element);
                elementAttributes = { style: styleAttributes.style };
            } else {
                // clone the attributes coming from the element, there may
                // be multiple elements pointing to the same data object,
                // e.g. after using the $.clone() method.
                elementAttributes = _.clone(oldElementAttributes);
                styleAttributes = getStyleAttributes(elementAttributes.style, styleFamily, $element);
                // collect every single changed attribute
                updateAttributeNames = [];
            }

            // add (or remove/clear) the passed explicit attributes
            _(attributes).each(function (value, name) {
                if (isRegisteredAttribute(name, special)) {
                    // check whether to clear the attribute
                    if (_.isNull(value) || (clear && _.isEqual(styleAttributes[name], value))) {
                        delete elementAttributes[name];
                    } else {
                        elementAttributes[name] = value;
                    }
                    // collect changed attribute names if required
                    if (updateAttributeNames) {
                        updateAttributeNames.push(name);
                    }
                }
            });

            // check if any attributes have been changed
            if (!_.isEqual(oldElementAttributes, elementAttributes)) {

                // write back new explicit attributes to the element
                setElementAttributes($element, elementAttributes);

                // update element formatting
                mergedAttributes = Utils.extendOptions(styleAttributes, elementAttributes);
                updateElementFormatting($element, mergedAttributes, updateAttributeNames);

                // update CSS formatting of descendant elements, if another
                // style sheet has been set at the element
                if (descendantStyleFamilies.length && (styleId in styleSheets)) {
                    var ranges = [DOM.Range.createRangeForNode(element)];
                    _(descendantStyleFamilies).each(function (family) {
                        documentStyles.getStyleSheets(family).updateFormattingInRanges(ranges);
                    });
                }

                // call the passed change listener
                if (_.isFunction(changeListener)) {
                    changeListener.call(this, element, oldElementAttributes, elementAttributes);
                }
            }

            return this;
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
         *  A map of attribute name/value pairs. To clear an explicit attribute
         *  value from the elements (thus defaulting to the current style
         *  sheet), the value in this map can be set to null.
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
         *  @param {Function} [options.changeListener]
         *      If specified, will be called for each DOM element covered by
         *      the passed ranges whose attributes have been changed.
         */
        this.setAttributesInRanges = function (ranges, attributes, options) {

            // iterate all covered elements and change their formatting
            this.iterateReadWrite(ranges, function (element) {
                this.setElementAttributes(element, attributes, options);
            }, this);

            return this;
        };

        /**
         * Clears specific formatting attributes in the specified DOM ranges.
         *
         * @param {DOM.Range[]} ranges
         *  (in/out) The DOM ranges to be formatted. The array will be
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
         *
         * @returns {StyleSheets}
         *  A reference to this style sheets container.
         */
        this.clearAttributesInRanges = function (ranges, attributeNames, options) {

            var // build a map with null values from passed name list
                attributes = {};

            // fill attribute map from passed array of attribute names
            if (_.isString(attributeNames)) {
                // string passed: clear single attribute
                attributes[attributeNames] = null;
            } else if (_.isArray(attributeNames)) {
                // array passed: clear all specified attributes
                _(attributeNames).each(function (name) {
                    attributes[name] = null;
                });
            } else {
                // no valid attribute names passed: clear all attributes
                _(definitions).each(function (definition, name) {
                    attributes[name] = null;
                });
            }

            // use method setAttributesInRanges() to do the real work
            return this.setAttributesInRanges(ranges, attributes, options);
        };

        /**
         * Updates the CSS formatting in the specified DOM ranges, according to
         * the current attribute and style settings.
         *
         * @param {DOM.Range[]} ranges
         *  (in/out) The DOM ranges to be updated. The array will be validated
         *  and sorted before iteration starts (see method
         *  DOM.iterateNodesInRanges() for details).
         *
         * @returns {StyleSheets}
         *  A reference to this style sheets container.
         */
        this.updateFormattingInRanges = function (ranges) {

            // iterate all covered elements and update their CSS formatting
            this.iterateReadWrite(ranges, function (element) {

                var // the element, as jQuery object
                    $element = $(element),
                    // explicit element attributes
                    elementAttributes = getElementAttributes($element),
                    // get attributes of the style sheet
                    styleAttributes = getStyleAttributes(elementAttributes.style, styleFamily, $element),
                    // the resulting attributes to be updated at each element
                    mergedAttributes = utils.extendOptions(styleAttributes, elementAttributes);

                // update element formatting according to current attribute values
                updateElementFormatting($element, mergedAttributes);

            }, this);

            // update CSS formatting of descendant elements
            _(descendantStyleFamilies).each(function (family) {
                documentStyles.getStyleSheets(family).updateFormattingInRanges(ranges);
            });

            return this;
        };

        this.updatePreviewButtonOptions = function (options, attributes) {
            _(attributes).each(function (value, name) {
                var definition = definitions[name];
                if (definition && _.isFunction(definition.preview)) {
                    definition.preview.call(self, options, value);
                }
            });

            return this;
        };

        this.destroy = function () {
            this.events.destroy();
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
     * Returns the explicit attributes stored in the passed element node.
     *
     * @param {HTMLElement|jQuery} element
     *  The element whose attributes will be returned. If this object is a
     *  jQuery collection, uses the first DOM node it contains.
     *
     * @returns {Object}
     *  The explicit attributes contained in the passed element, as a deep
     *  clone of the original attribute map.
     */
    StyleSheets.getExplicitAttributes = function (element) {
        return getElementAttributes($(element), true);
    };

    /**
     * Returns whether the passed elements contain equal formatting attributes.
     *
     * @param {HTMLElement|jQuery} element1
     *  The first element whose formatting attributes will be compared with the
     *  attributes of the other passed element. If this object is a jQuery
     *  collection, uses the first DOM node it contains.
     *
     * @param {HTMLElement|jQuery} element2
     *  The second element whose formatting attributes will be compared with
     *  the attributes of the other passed element. If this object is a jQuery
     *  collection, uses the first DOM node it contains.
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
