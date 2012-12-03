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
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/format/container'
    ], function (Utils, DOM, Container) {

    'use strict';

    var // global attribute definitions registry (maps by attribute family)
        REGISTRY = {};

    // private static functions ===============================================

    /**
     * Returns an existing entry in the global attribute definition registry,
     * or creates and initializes a new entry.
     */
    function getOrCreateRegistryEntry(styleFamily) {

        // create a new entry if missing
        if (!(styleFamily in REGISTRY)) {
            REGISTRY[styleFamily] = { definitions: {}, parentFamilies: {}, supportedFamilies: [styleFamily] };
        }

        return REGISTRY[styleFamily];
    }

    /**
     * Returns the static definitions map of all attributes registered for the
     * specified style family.
     *
     * @returns {Object|Null}
     *  A reference to the static attribute definitions map, or null if the
     *  passed style family is invalid.
     */
    function getAttributeDefinitions(styleFamily) {
        return (styleFamily in REGISTRY) ? REGISTRY[styleFamily].definitions : null;
    }

    /**
     * Returns the supported attribute families of the style sheet container
     * class associated to the specified style family.
     *
     * @returns {String[]|Null}
     *  A string array containing the supported attribute families, or null
     *  if the passed style family is invalid.
     */
    function getSupportedFamilies(styleFamily) {
        return (styleFamily in REGISTRY) ? REGISTRY[styleFamily].supportedFamilies : null;
    }

    /**
     * Returns whether the passed string is the name of a attribute that is
     * registered in the passed attribute definition map.
     *
     * @param {Object} definitions
     *  The attribute definitions map.
     *
     * @param {String} name
     *  The attribute name to be checked.
     *
     * @param {Object} [options]
     *  A map of options controlling the operation. Supports the following
     *  options:
     *  @param {Boolean} [options.special=false]
     *      If set to true, returns true for special attributes (attributes
     *      that are marked with the 'special' flag in the attribute
     *      definitions). Otherwise, special attributes will not be recognized
     *      by this function.
     *
     * @returns {Boolean}
     *  Whether the attribute is registered in the attribute definitions map.
     */
    function isRegisteredAttribute(definitions, name, options) {

        var // whether to include special attributes
            special = Utils.getBooleanOption(options, 'special', false);

        return (name in definitions) && (special || (definitions[name].special !== true));
    }

    /**
     * Returns the attribute map stored in the passed DOM element.
     *
     * @param {jQuery} element
     *  The DOM element, as jQuery object.
     *
     * @param {Object} [options]
     * A map with additional options controlling the behavior of this method.
     * the following options are supported:
     *  @param {String} [options.family]
     *      If specified, extracts the attributes of a specific attribute
     *      family from the attribute map. Otherwise, returns the complete map
     *      object with all attributes mapped by their family.
     *  @param {Boolean} [options.clone=false]
     *      If set to true, the returned attribute map will be a clone of the
     *      original map.
     *
     * @returns {Object}
     *  The attribute map if existing, otherwise an empty object.
     */
    function getElementAttributes(element, options) {

        var // the original and complete attribute map
            attributes = element.data('attributes'),
            // the attribute family to be extracted from the complete map
            family = Utils.getStringOption(options, 'family'),
            // whether to clone the resulting object
            clone = Utils.getBooleanOption(options, 'clone', false);

        // reduce to selected family
        if (_.isObject(attributes) && _.isString(family)) {
            attributes = (family in attributes) ? attributes[family] : undefined;
        }

        // return attributes directly or as a deep clone
        return _.isObject(attributes) ? ((clone === true) ? _.copy(attributes, true) : attributes) : {};
    }

    // class StyleSheets ======================================================

    /**
     * Container for hierarchical style sheets of a specific attribute family.
     * Implements indirect element formatting via style sheets and direct
     * element formatting via explicit attribute maps.
     *
     * @constructor
     *
     * @extends Container
     *
     * @param {DocumentStyles} documentStyles
     *  Global collection with all style and formatting containers used in a
     *  document.
     *
     * @param {Object} [options]
     *  A map of options to control the behavior of the style sheet container.
     *  All callback functions will be called in the context of this style
     *  sheet container instance. The following options are supported:
     *  @param {Function} [options.updateHandler]
     *      An update handler that will be called for every DOM element whose
     *      attributes have been changed. In difference to the individual
     *      formatter functions specified in the definitions for single
     *      attributes, this handler will be called once for a DOM element
     *      regardless of the number of changed attributes. Receives the
     *      following parameters:
     *      (1) {jQuery} element
     *          The element whose attributes have been changed.
     *      (2) {Object} mergedAttributes
     *          The effective attribute values merged from style sheets and
     *          explicit attributes, as map of attribute maps (name/value
     *          pairs), keyed by attribute family.
     *  @param {Function} [options.styleAttributesResolver]
     *      A function that extracts and returns specific attributes from the
     *      complete 'attributes' object of a style sheet. The attributes
     *      returned by this function may depend on a source element (e.g. on
     *      the position of this source element in its parents). The function
     *      receives the following parameters:
     *      (1) {Object} styleAttributes
     *          The complete original 'attributes' object of the style sheet.
     *          MUST NOT be changed by the callback function!
     *      (2) {jQuery} element
     *          The element referring to the style sheet.
     *      (3) {jQuery} [sourceNode]
     *          The descendant source node.
     *  @param {Function} [options.elementAttributesResolver]
     *      A function that extracts and returns specific attributes from the
     *      explicit attribute map of an element. The attributes returned by
     *      this function may depend on a source element (e.g. on the position
     *      of this source element in its parents). The function receives the
     *      following parameters:
     *      (1) {Object} elementAttributes
     *          The original explicit element attributes of the style sheet, as
     *          map of attribute maps (name/value pairs), keyed by attribute
     *          family. MUST NOT be changed by the callback function!
     *      (2) {jQuery} element
     *          The element whose attributes have been passed in the first
     *          parameter.
     *      (3) {jQuery} [sourceNode]
     *          The descendant source node.
     */
    function StyleSheets(documentStyles, options) {

        var // self reference
            self = this,

            // the style attribute family of the derived class
            styleFamily = this.constructor.STYLE_FAMILY,

            // style sheets, mapped by identifier
            styleSheets = {},

            // default values for all supported attributes of the own style family
            defaultAttributeValues = {},

            // identifier of the default style sheet
            defaultStyleId = null,

            // update handler, called after attributes have been changed
            updateHandler = Utils.getFunctionOption(options, 'updateHandler'),

            // custom resolver for style attributes depending on a context element
            styleAttributesResolver = Utils.getFunctionOption(options, 'styleAttributesResolver'),

            // custom resolver for explicit element attributes depending on a context element
            elementAttributesResolver = Utils.getFunctionOption(options, 'elementAttributesResolver');

        // private methods ----------------------------------------------------

        /**
         * Calculates the default attributes from the attribute definitions and
         * overrides the values of all attributes specified in the passed
         * attribute map.
         *
         * @param {Object} [attributeValues]
         *  The default values for some or all attributes of the main style
         *  family, as name/value pairs. Attributes not specified in this map
         *  will use the base default values from the attribute definitions.
         */
        function initializeAttributeDefaultValues(attributeValues) {

            var // the own attribute definitions
                definitions = getAttributeDefinitions(styleFamily);

            // get default attribute values from definitions
            defaultAttributeValues = {};
            _(definitions).each(function (definition, name) {
                defaultAttributeValues[name] = definition.def;
            });

            // override with passed values
            if (_.isObject(attributeValues)) {
                _(attributeValues).each(function (value, name) {
                    if ((name in defaultAttributeValues) && !_.isNull(value) && !_.isUndefined(value)) {
                        defaultAttributeValues[name] = value;
                    }
                });
            }
        }

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
         * Restricts the passed attribute set to the attribute families
         * supported by the style sheet container.
         *
         * @param {Object} mergedAttributes
         *  The attribute set whose member field not representing a supported
         *  attribute map will be removed.
         */
        function restrictToSupportedFamilies(mergedAttributes) {

            var // array with all supported attribute families
                supportedFamilies = getSupportedFamilies(styleFamily);

            // remove attribute maps of unsupported families
            _(mergedAttributes).each(function (unused, family) {
                if (!_(supportedFamilies).contains(family)) {
                    delete mergedAttributes[family];
                }
            });
        }

        /**
         * Returns the identifier of the style sheet referred by the passed
         * element.
         *
         * @param {HTMLElement|jQuery} element
         *  The element whose style sheet identifier will be returned.
         */
        function getElementStyleId(element) {
            return getElementAttributes($(element), { family: styleFamily }).style;
        }

        /**
         * Returns the complete attributes of an ancestor of the passed
         * element, if a parent style family has been registered and its
         * element resolver function returns a valid ancestor element, and
         * extends missing attributes by their current default values.
         *
         * @param {HTMLElement|jQuery} [element]
         *  An element whose ancestor will be searched and queried for its
         *  attributes. If this object is a jQuery collection, uses the first
         *  DOM node it contains. If missing, returns just the current default
         *  values of all supported attribute families.
         *
         * @returns {Object}
         *  The formatting attributes of an ancestor of the passed element, as
         *  map of attribute value maps (name/value pairs), keyed by attribute
         *  family. If no ancestor element has been found, returns the current
         *  default values for all supported attribute families.
         */
        function resolveBaseAttributes(element) {

            var // passed element, as jQuery object
                $element = $(element),
                // the matching parent element, its style family, the style sheet container, and the attributes
                parentElement = null, parentFamily = null, parentStyleSheets = null, parentAttributes = null,
                // the resulting merged attributes of the ancestor element
                mergedAttributes = {};

            // collect attributes from ancestor element if specified (only one parent style family must match at a time)
            if ($element.length > 0) {

                // find a matching ancestor element and its style family (only one parent must match at a time)
                _(REGISTRY[styleFamily].parentFamilies).each(function (elementResolver, family) {
                    if ($(parentElement).length === 0) {
                        parentElement = elementResolver.call(self, $element);
                        parentFamily = family;
                    }
                });

                // add the element attributes of the ancestor element (only the supported attribute families)
                if ($(parentElement).length > 0) {
                    parentStyleSheets = documentStyles.getStyleSheets(parentFamily);
                    parentAttributes = parentStyleSheets.getElementAttributes(parentElement, { sourceNode: $element });
                    StyleSheets.extendAttributes(mergedAttributes, parentAttributes);
                }
            }

            // remove attribute maps of unsupported families
            restrictToSupportedFamilies(mergedAttributes);

            // add missing default attribute values of supported families not found in the parent element
            _(getSupportedFamilies(styleFamily)).each(function (family) {
                if (!(family in mergedAttributes)) {
                    mergedAttributes[family] = documentStyles.getStyleSheets(family).getDefaultAttributeValues();
                }
            });

            return mergedAttributes;
        }

        /**
         * Returns the attributes from the specified style sheet and its parent
         * style sheets. Does not add default attribute values, or attributes
         * from ancestors of the passed element.
         *
         * @param {String} styleId
         *  The unique identifier of the style sheet.
         *
         * @param {HTMLElement|jQuery} [element]
         *  An element referring to a style sheet in this container whose
         *  attributes will be extracted. Will be passed to a custom style
         *  attributes resolver (see the 'options.styleAttributesResolver'
         *  option passed to the constructor). If this object is a jQuery
         *  collection, uses the first DOM node it contains.
         *
         * @param {HTMLElement|jQuery} [sourceNode]
         *  The source DOM node corresponding to a child attribute family that
         *  has initiated the call to this method. Will be passed to a custom
         *  style attributes resolver (see the 'options.styleAttributesResolver'
         *  option passed to the constructor). If this object is a jQuery
         *  collection, uses the first DOM node it contains.
         *
         * @returns {Object}
         *  The formatting attributes contained in the style sheet and its
         *  ancestor style sheets, as map of attribute value maps (name/value
         *  pairs), keyed by attribute family.
         */
        function resolveStyleSheetAttributes(styleId, element, sourceNode) {

            var // passed element, as jQuery object
                $element = $(element),
                // passed source node, as jQuery object
                $sourceNode = $(sourceNode),
                // the resulting merged attributes of the style sheet and its ancestors
                mergedAttributes = {};

            // collects style sheet attributes recursively through parents
            function collectStyleAttributes(styleSheet) {

                // exit recursive call chain if no more parent styles are available
                if (!styleSheet) { return; }

                // call recursively to get the attributes of the parent style sheets
                collectStyleAttributes(styleSheets[styleSheet.parentId]);

                // add all attributes of the current style sheet, mapped directly by attribute family
                StyleSheets.extendAttributes(mergedAttributes, styleSheet.attributes);

                // try user-defined resolver for style attributes mapped in non-standard structures
                if (_.isFunction(styleAttributesResolver) && ($element.length > 0)) {
                    StyleSheets.extendAttributes(mergedAttributes, styleAttributesResolver.call(self, styleSheet.attributes, $element, $sourceNode));
                }
            }

            // fall-back to default style sheet if passed identifier is invalid
            if (!(styleId in styleSheets) && (defaultStyleId in styleSheets)) {
                styleId = defaultStyleId;
            }

            // collect attributes from the style sheet and its parents
            collectStyleAttributes(styleSheets[styleId]);

            // add style sheet identifier to the attributes
            (mergedAttributes[styleFamily] || (mergedAttributes[styleFamily] = {})).style = styleId;

            // remove attribute maps of unsupported families
            restrictToSupportedFamilies(mergedAttributes);

            return mergedAttributes;
        }

        /**
         * Returns the explicit attributes from the specified element. Does not
         * add default attribute values. Uses a custom element attributes
         * resolver function if specified in the constructor of this style
         * sheet container.
         *
         * @param {HTMLElement|jQuery} [element]
         *  The element whose explicit attributes will be extracted. Will be
         *  passed to a custom attributes resolver (see the option
         *  'options.elementAttributesResolver' passed to the constructor). If
         *  this object is a jQuery collection, uses the first DOM node it
         *  contains.
         *
         * @param {HTMLElement|jQuery} [sourceNode]
         *  The source DOM node corresponding to a child attribute family that
         *  has initiated the call to this method. Will be passed to a custom
         *  element attributes resolver (see the option
         *  'options.elementAttributesResolver' passed to the constructor). If
         *  this object is a jQuery collection, uses the first DOM node it
         *  contains.
         *
         * @returns {Object}
         *  The explicit formatting attributes contained in the element, as map
         *  of attribute value maps (name/value pairs), keyed by attribute
         *  family.
         */
        function resolveElementAttributes(element, sourceNode) {

            var // passed element, as jQuery object
                $element = $(element),
                // the resulting merged attributes of the element
                mergedAttributes = getElementAttributes($element);

            // call custom element attribute resolver
            if (_.isFunction(elementAttributesResolver)) {
                mergedAttributes = elementAttributesResolver.call(self, mergedAttributes, $element, $(sourceNode));
            }

            return mergedAttributes;
        }

        /**
         * Updates the element formatting according to the passed attributes.
         *
         * @param {jQuery} element
         *  The element whose formatting will be updated, as jQuery object.
         *
         * @param {Object} mergedAttributes
         *  A map of attribute value maps (name/value pairs) with all attribute
         *  values merged from style sheet and explicit attributes, keyed by
         *  attribute family.
         */
        function updateElementFormatting(element, mergedAttributes) {

            var // definitions of own attributes
                definitions = getAttributeDefinitions(styleFamily);

            self.DBG_COUNT = (self.DBG_COUNT || 0) + 1;

            // call single format handlers for all attributes of the own style family
            _(mergedAttributes[styleFamily]).each(function (value, name) {
                if ((name in definitions) && _.isFunction(definitions[name].format)) {
                    definitions[name].format.call(self, element, value);
                }
            });

            // call update handlers taking all attributes at once
            if (_.isFunction(updateHandler)) {
                updateHandler.call(self, element, mergedAttributes);
            }
        }

        // base constructor ---------------------------------------------------

        Container.call(this, documentStyles);

        // methods ------------------------------------------------------------

        /**
         * Returns the names of all style sheets in a map, keyed by their
         * unique identifiers.
         *
         * @returns {Object}
         *  A map with all style sheet names, keyed by style sheet identifiers.
         */
        this.getStyleSheetNames = function () {
            var names = {};
            _(styleSheets).each(function (styleSheet, id) {
                if (!styleSheet.hidden) {
                    names[id] = styleSheet.name;
                }
            });
            return names;
        };

        /**
         * Returns the identifier of the default style sheet.
         *
         * @returns {String|Null}
         *  The identifier of the default style sheet.
         */
        this.getDefaultStyleSheetId = function () {
            return defaultStyleId;
        };

        /**
         * Returns the default attribute values of the own style family, as map
         * of name/value pairs.
         *
         * @returns {Object}
         *  A deep clone of the default attribute values registered at this
         *  style sheet container.
         */
        this.getDefaultAttributeValues = function () {
            return _.copy(defaultAttributeValues, true);
        };

        /**
         * Sets default values for the attributes of the main style family.
         * These values override the defaults of the attribute definitions
         * passed in the constructor, and will be used before the values of any
         * style sheet attributes and explicit element attributes.
         *
         * @param {Object} attributes
         *  The default values for some or all attributes of the main style
         *  family, as name/value pairs. Attributes not specified in this map
         *  will use the default values from the attribute definitions.
         *
         * @returns {StyleSheets}
         *  A reference to this instance.
         */
        this.setAttributeDefaultValues = function (defaultValues) {

            // reinitialize the default attribute values
            initializeAttributeDefaultValues(defaultValues);

            // notify listeners
            this.triggerChangeEvent();

            return this;
        };

        /**
         * Adds a new style sheet to this container. An existing style sheet
         * with the specified identifier will be replaced.
         *
         * @param {String} styleId
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
         *  The formatting attributes contained in the new style sheet. The
         *  structure of this object is dependent on the style family of this
         *  container.
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
         *  @param {Boolean} [options.defStyle=false]
         *      True, if the new style sheet is the default style sheet of this
         *      style sheet container. The default style will be used for all
         *      elements without explicit style sheet. Only the first style
         *      sheet that will be inserted with this flag will be permanently
         *      registered as default style sheet.
         *  @param {Boolean} [options.dirty=false]
         *      True, if the new style sheet has been added manually and not
         *      by loading a document. Therefore this style sheet needs to be
         *      saved as soon as it will be used.
         *
         * @returns {StyleSheets}
         *  A reference to this instance.
         */
        this.addStyleSheet = function (styleId, name, parentId, attributes, options) {

            var // get or create a style sheet object
                styleSheet = _.isString(styleId) ? (styleSheets[styleId] || (styleSheets[styleId] = {})) : null;

            if (!styleSheet) {
                Utils.warn('StyleSheets.addStyleSheet(): missing style sheet identifier');
                return;
            }

            // set user-defined name of the style sheet
            styleSheet.name = name || styleId;

            // set parent of the style sheet, check for cyclic references
            styleSheet.parentId = parentId;
            if (isDescendantStyleSheet(styleSheets[styleSheet.parentId], styleSheet)) {
                Utils.warn('StyleSheets.addStyleSheet(): cyclic reference, cannot set style sheet parent "' + parentId + '"');
                styleSheet.parentId = null;
            }

            // set style sheet options
            styleSheet.hidden = Utils.getBooleanOption(options, 'hidden', false);
            styleSheet.priority = Utils.getIntegerOption(options, 'priority', 0);
            styleSheet.dirty = Utils.getBooleanOption(options, 'dirty', false);

            // set default style sheet
            if (Utils.getBooleanOption(options, 'defStyle', false)) {
                if (_.isNull(defaultStyleId)) {
                    defaultStyleId = styleId;
                } else if (defaultStyleId !== styleId) {
                    Utils.warn('StyleSheets.addStyleSheet(): multiple default style sheets');
                }
            }

            // store a deep clone of the passed attributes
            styleSheet.attributes = _.isObject(attributes) ? _.copy(attributes, true) : {};

            // notify listeners
            this.triggerChangeEvent();

            return this;
        };

        /**
         * Removes an existing style sheet from this container.
         *
         * @param {String} styleId
         *  The unique identifier of of the style sheet to be removed.
         *
         * @returns {StyleSheets}
         *  A reference to this instance.
         */
        this.removeStyleSheet = function (styleId) {

            var // the style sheet to be removed
                styleSheet = styleSheets[styleId];

            if (styleId === defaultStyleId) {
                Utils.warn('StyleSheets.removeStyleSheet(): cannot remove default style sheet');
                styleSheet = null;
            }

            if (styleSheet) {
                // update parent of all style sheets referring to the removed style sheet
                _(styleSheets).each(function (childSheet) {
                    if (styleId === childSheet.parentId) {
                        childSheet.parentId = styleSheet.parentId;
                    }
                });

                // remove style sheet from map
                delete styleSheets[styleId];

                // notify listeners
                this.triggerChangeEvent();
            }
            return this;
        };

        /**
         * Returns the merged attributes of the own style family from the
         * specified style sheet and its parent style sheets.
         *
         * @param {String} styleId
         *  The unique identifier of the style sheet.
         *
         * @returns {Object}
         *  The formatting attributes contained in the style sheet and its
         *  parent style sheets in this container up to the map of default
         *  attributes, as map of name/value pairs.
         */
        this.getStyleSheetAttributes = function (styleId) {

            var // start with attribute default values
                mergedAttributes = resolveBaseAttributes();

            // extend with attributes of specified style sheet
            return StyleSheets.extendAttributes(mergedAttributes, resolveStyleSheetAttributes(styleId));
        };

        /**
         * Returns the UI priority for the specified style sheet.
         *
         * @param {String} styleId
         *  The unique identifier of the style sheet.
         *
         * @returns {Number}
         *  The UI priority.
         */
        this.getUIPriority = function (styleId) {
            return (styleId in styleSheets) ? styleSheets[styleId].priority : 0;
        };

        /**
         * Returns the identifier of the parent style sheet for the specified
         * style sheet.
         *
         * @param {String} styleId
         *  The unique identifier of the style sheet.
         *
         * @returns {String}
         *  The parent id of the style sheet or null if no parent exists.
         */
        this.getParentId = function (styleId) {
            return (styleId in styleSheets) ? styleSheets[styleId].parentId : null;
        };

        /**
         * Returns the user defined name for the specified style sheet.
         *
         * @param {String} styleId
         *  The unique identifier of the style sheet.
         *
         * @returns
         *  The user defined name of the style sheet or null
         */
        this.getName = function (styleId) {
            return (styleId in styleSheets) ? styleSheets[styleId].name : null;
        };

        /**
         * Return whether the specified style sheet is dirty.
         *
         * @param {String} styleId
         *  The unique identifier of the style sheet.
         *
         * @returns {Boolean}
         *  The dirty state of the style sheet.
         */
        this.isDirty = function (styleId) {
            return (styleId in styleSheets) ? styleSheets[styleId].dirty : false;
        };

        /**
         * Changes the dirty state of the specified style sheet.
         *
         * @param {String} styleId
         *  The unique identifier of the style sheet.
         *
         * @param {Boolean} dirty
         */
        this.setDirty = function (styleId, dirty) {
            if (styleId in styleSheets) {
                styleSheets[styleId].dirty = dirty;
            }
        };

        /**
         * Returns true if style sheet contains the given id.
         *
         * @param {String} id
         *  The unique identifier of the style sheet.
         *
         * @returns {Boolean}
         *  Returns true if style sheet contains the given id, otherwise false
         */
        this.containsStyleSheet = function (id) {
            return !!(id in styleSheets);
        };

        /**
         * Returns the complete 'attributes' object of the specified style
         * sheet as-is, without resolving the parent style sheets, or
         * converting to the attributes of a specific attribute family.
         *
         * @param {String} styleId
         *  The unique identifier of the style sheet.
         *
         * @returns {Object}
         *  The complete 'attributes' object contained in the style sheet, as a
         *  deep clone.
         */
        this.getStyleSheetAttributeMap = function (styleId) {
            return (styleId in styleSheets) ? _.copy(styleSheets[styleId].attributes, true) : {};
        };

        /**
         * Returns the options map used to create the preview list item in a
         * style chooser control. Uses the 'preview' entry of all attribute
         * definitions to build the options map.
         *
         * @param {String} styleId
         *  The unique identifier of of the style sheet whose preview will be
         *  created.
         *
         * @returns {Object}
         *  A map of options passed to the creator function of the preview
         *  button element.
         */
        this.getPreviewButtonOptions = function (styleId) {

            var // the result options
                options = { css: {}, labelCss: {} },
                // formatting attributes of the own style sheet (with default values)
                styleAttributes = this.getStyleSheetAttributes(styleId);

            // iterate through all supported attribute families and add options
            // for all the attributes contained in the *own* style sheet
            _(styleAttributes).each(function (attributeValues, family) {

                var // style sheet container for current family
                    definitions = getAttributeDefinitions(family);

                // generate options for the attributes
                _(attributeValues).each(function (value, name) {

                    var // attribute definition from container corresponding to the current family
                        definition = definitions[name];

                    // call the preview handler of the attribute definition
                    if (definition && _.isFunction(definition.preview)) {
                        definition.preview.call(this, options, value);
                    }
                }, this);

            }, this);

            return options;
        };

        /**
         * Returns the values of the formatting attributes in the specified DOM
         * element.
         *
         * @param {HTMLElement|jQuery} element
         *  The element whose attributes will be returned. If this object is a
         *  jQuery collection, uses the first DOM node it contains.
         *
         * @param {Object} [options]
         *  A map of options controlling the operation. Supports the following
         *  options:
         *  @param {HTMLElement|jQuery} [options.sourcNode]
         *      A descendant of the passed element associated to a child
         *      attribute family. Will be passed to a style attribute resolver
         *      callback function where it might be needed to resolve the
         *      correct attributes according to the position of this source
         *      node.
         *  @param {Boolean} [options.special=false]
         *      If set to true, includes special attributes (attributes that
         *      are marked with the 'special' flag in the attribute definitions
         *      passed to the constructor) to the result map.
         *
         * @returns {Object}
         *  A map of attribute maps (name/value pairs), keyed by the attribute
         *  families.
         */
        this.getElementAttributes = function (element, options) {

            var // the descendant source node
                sourceNode = Utils.getOption(options, 'sourceNode'),
                // the identifier of the style sheet referred by the element
                styleId = getElementStyleId(element),
                // resulting merged attributes (start with defaults, parent element, and style sheet attributes)
                mergedAttributes = resolveBaseAttributes(element);

            // add attributes of the style sheet and its parents, and the explicit attributes of the element
            StyleSheets.extendAttributes(mergedAttributes, resolveStyleSheetAttributes(styleId, element, sourceNode));
            StyleSheets.extendAttributes(mergedAttributes, resolveElementAttributes(element, sourceNode));

            // filter by supported attributes
            _(mergedAttributes).each(function (attributeValues, family) {

                var // attribute definitions of the current family
                    definitions = getAttributeDefinitions(family);

                _(attributeValues).each(function (value, name)  {
                    if ((name !== 'style') && !isRegisteredAttribute(definitions, name, options)) {
                        delete attributeValues[name];
                    }
                });
            });

            return mergedAttributes;
        };

        /**
         * Changes specific formatting attributes in the specified DOM element.
         *
         * @param {HTMLElement|jQuery} element
         *  The element whose attributes will be changed. If this object is a
         *  jQuery collection, uses the first DOM node it contains.
         *
         * @param {Object} attributes
         *  A map of attribute maps (name/value pairs), keyed by the attribute
         *  families. To clear an explicit attribute value from the element
         *  (thus defaulting to the current style sheet), the respective value
         *  in this map can be set to null. Missing attributes, or entire
         *  attribute maps will not be modified at the element.
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
         *
         * @returns {StyleSheets}
         *  A reference to this style sheets container.
         */
        this.setElementAttributes = function (element, attributes, options) {

            var // whether to remove element attributes equal to style attributes
                clear = Utils.getBooleanOption(options, 'clear', false),
                // change listener notified for changed attributes
                changeListener = Utils.getFunctionOption(options, 'changeListener'),
                // new style sheet identifier
                styleId = _.isObject(attributes[styleFamily]) ? attributes[styleFamily].style : undefined,

                // the element, as jQuery object
                $element = $(element),
                // the existing explicit element attributes
                oldElementAttributes = getElementAttributes($element),
                // new explicit element attributes (clone, there may be multiple elements pointing to the same data object)
                newElementAttributes = _.copy(oldElementAttributes, true),
                // merged attribute values from style sheets and explicit attributes
                mergedAttributes = resolveBaseAttributes(element);

            // add or remove a new style sheet identifier (only supported for the main style family)
            if (_.isString(styleId)) {
                (newElementAttributes[styleFamily] || (newElementAttributes[styleFamily] = {})).style = styleId;
            } else if (_.isNull(styleId)) {
                if (styleFamily in newElementAttributes) { delete newElementAttributes[styleFamily].style; }
            } else {
                styleId = getElementStyleId(element);
            }

            // collect all attributes of the new or current style sheet, and its parents
            StyleSheets.extendAttributes(mergedAttributes, resolveStyleSheetAttributes(styleId, element));

            // add or remove the passed explicit attributes
            restrictToSupportedFamilies(attributes);
            _(attributes).each(function (attributeValues, family) {

                var // definitions of own attributes
                    definitions = getAttributeDefinitions(family),
                    // passed attribute values
                    attributeValues = attributes[family],
                    // add an attribute map for the current family
                    elementAttributeValues = null;

                if (_.isObject(attributeValues)) {

                    // add an attribute map for the current family
                    elementAttributeValues = newElementAttributes[family] || (newElementAttributes[family] = {});

                    // update the attribute map with the passed attributes
                    _(attributeValues).each(function (value, name) {
                        if (isRegisteredAttribute(definitions, name, options)) {
                            // check whether to clear the attribute
                            if (_.isNull(value) || (clear && _.isEqual(mergedAttributes[family][name], value))) {
                                delete elementAttributeValues[name];
                            } else {
                                elementAttributeValues[name] = value;
                            }
                        }
                    });

                    // remove empty attribute value maps completely
                    if (_.isEmpty(elementAttributeValues)) {
                        delete newElementAttributes[family];
                    }
                }
            });

            // check if any attributes have been changed
            if (!_.isEqual(oldElementAttributes, newElementAttributes)) {

                // write back new explicit attributes to the element
                $element.data('attributes', newElementAttributes);

                // merge explicit attributes into style attributes, and update element formatting
                StyleSheets.extendAttributes(mergedAttributes, resolveElementAttributes(element));
                updateElementFormatting($element, mergedAttributes);

                // call the passed change listener
                if (_.isFunction(changeListener)) {
                    changeListener.call(this, element, oldElementAttributes, newElementAttributes);
                }
            }

            return this;
        };

        /**
         * Updates the CSS formatting in the specified DOM element, according
         * to its current attribute and style settings.
         *
         * @param {HTMLElement|jQuery} element
         *  The element to be updated. If this object is a jQuery collection,
         *  uses the first DOM node it contains.
         *
         * @param {Object} [baseAttributes]
         *  A map of attribute value maps (name/value pairs) with all attribute
         *  values of the ancestor of the passed element, merged from style
         *  sheet and explicit attributes, keyed by attribute family. Used
         *  internally while updating the formatting of all child elements of a
         *  node.
         *
         * @returns {StyleSheets}
         *  A reference to this style sheets container.
         */
        this.updateElementFormatting = function (element, baseAttributes) {

            var // the identifier of the style sheet referred by the element
                styleId = getElementStyleId(element),
                // the merged attributes of the passed element
                mergedAttributes = null;

            if (_.isObject(baseAttributes)) {
                mergedAttributes = Utils.makeSimpleObject(styleFamily, this.getDefaultAttributeValues());
                StyleSheets.extendAttributes(mergedAttributes, baseAttributes);
            } else {
                mergedAttributes = resolveBaseAttributes(element);
            }

            // add attributes of the style sheet and its parents, and the explicit attributes of the element
            StyleSheets.extendAttributes(mergedAttributes, resolveStyleSheetAttributes(styleId, element));
            StyleSheets.extendAttributes(mergedAttributes, resolveElementAttributes(element));

            // update the formatting of the element
            updateElementFormatting($(element), mergedAttributes);

            return this;
        };

        // initialization -----------------------------------------------------

        // build map with default attributes from definitions
        initializeAttributeDefaultValues();

    } // class StyleSheets

    // static methods ---------------------------------------------------------

    /**
     * Builds an attribute map containing all formatting attributes
     * registered for the specified attribute families, set to the null value.
     *
     * @param {String} styleFamily
     *  The main style family of the attributes to be inserted into the
     *  returned attribute map. The attributes of all attribute families
     *  supported by style sheets of the passed style family will be included.
     *
     * @returns {Object}
     *  An attribute set with null values for all attributes registered for the
     *  supported attribute families.
     */
    StyleSheets.buildNullAttributes = function (styleFamily) {

        var // the supported attribute families
            supportedFamilies = getSupportedFamilies(styleFamily),
            // the resulting attribute map
            attributes = {};

        if (_.isArray(supportedFamilies)) {

            // add null value for style sheet identifier
            attributes = Utils.makeSimpleObject(styleFamily, { style: null });

            // process all supported attribute families
            _(supportedFamilies).each(function (family) {

                var // the attribute definitions of the current family
                    definitions = getAttributeDefinitions(family),
                    // attribute values of the current family
                    attributeValues = attributes[family] = {};

                // add null values for all registered attributes
                _(definitions).each(function (definition, name) {
                    if (!definition.special) {
                        attributeValues[name] = null;
                    }
                });
            });
        }

        return attributes;
    };

    /**
     * Extends the passed attribute set with the existing values of the second
     * attribute set. If the definitions of a specific attribute contain a
     * merger function, and both attribute sets contain an attribute value,
     * uses that merger function to merge the values from both attribute sets,
     * otherwise the value of the second attribute set will be copied to the
     * first attribute set.
     *
     * @param {Object} attributes1
     *  (in/out) The first attribute set that will be extended in-place, as map
     *  of attribute value maps (name/value pairs), keyed by attribute family.
     *
     * @param {Object} attributes2
     *  The second attribute set, as map of attribute value maps (name/value
     *  pairs), keyed by attribute family, whose attribute values will be
     *  inserted into the first attribute set.
     *
     * @returns {Object}
     *  A reference to the first passed and extended attribute set.
     */
    StyleSheets.extendAttributes = function (attributes1, attributes2) {

        // add attributes existing in attributes2 to attributes1
        _(attributes2).each(function (attributeValues, family) {

            var // the attribute definitions of the current family
                definitions = getAttributeDefinitions(family);

            // restrict to valid attribute families
            if (!definitions || !_.isObject(attributeValues)) { return; }

            // insert attribute values of attributes2
            attributes1[family] = attributes1[family] || {};
            _(attributeValues).each(function (value, name) {

                var // the merger function from the attribute definition
                    merger = null;

                // copy style sheet identifier directly
                if (name === 'style') {
                    attributes1[family].style = value;
                } else if (isRegisteredAttribute(definitions, name)) {
                    // try to find merger function from attribute definition
                    merger = definitions[name].merge;
                    // either set return value from merger, or copy the attribute directly
                    if ((name in attributes1[family]) && _.isFunction(merger)) {
                        attributes1[family][name] = merger.call(this, attributes1[family][name], value);
                    } else {
                        attributes1[family][name] = value;
                    }
                }
            });
        });

        return attributes1;
    };

    /**
     * Returns the explicit attributes stored in the passed element node.
     *
     * @param {HTMLElement|jQuery} element
     *  The element whose attributes will be returned. If this object is a
     *  jQuery collection, uses the first DOM node it contains.
     *
     * @param {String} [family]
     *  If specified, extracts the attributes of a specific attribute family
     *  from the attribute map. Otherwise, returns the complete map object with
     *  all attributes mapped by their family.
     *
     * @returns {Object}
     *  The explicit attributes contained in the passed element, as a deep
     *  clone of the original attribute map.
     */
    StyleSheets.getExplicitAttributes = function (element, family) {
        return getElementAttributes($(element), { family: family, clone: true });
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

    var // derive this class from class Container
        StyleSheetsClass = Container.extend({ constructor: StyleSheets }),
        // the original extend() method used to create a derived class
        extendMethod = StyleSheetsClass.extend;

    /**
     * Derives the class represented by the specified constructor with this
     * StyleSheets base class. Adds the passed attribute definitions to a
     * global registry to make the information for all supported style families
     * available in this base class.
     *
     * @param {Function} constructor
     *  The constructor function of the derived class.
     *
     * @param {String} styleFamily
     *  The main attribute family represented by the style sheets contained by
     *  instances of the derived container class. The style sheets and the DOM
     *  elements referring to the style sheets must support all attributes of
     *  this attribute family.
     *
     * @param {Object} definitions
     *  The attribute definitions map. Contains attribute definition objects
     *  for all attributes supported by the specified style family, mapped by
     *  the names of the attributes. Each definition object contains the
     *  following entries:
     *  - def
     *      Specifies the default value of the attribute which will be used if
     *      neither the style sheet of an element nor its explicit attributes
     *      collection specify a value for the attribute.
     *  - {Function} [format]
     *      A function that applies the passed attribute value to a DOM element
     *      (usually its CSS formatting). Will be called in the context of the
     *      style sheet container instance. The function receives the DOM
     *      element as jQuery object in the first parameter, and the attribute
     *      value in the second parameter. An alternative way to update the
     *      element formatting using a complete map of all attribute values is
     *      to specify a global update handler (see options below).
     *  - {Function} [merge]
     *      A function that will be called while resolving attribute maps from
     *      different style sheets and explicit element formatting. Will be
     *      called to merge two existing values of this attributes, where the
     *      second value has to overwrite the first value in some way. Will be
     *      called in the context of the style sheet container instance. The
     *      function receives the 'old' attribute value in the first parameter,
     *      and the 'new' attribute value in the second parameter. By default,
     *      the new value wins and the first value will be overwritten
     *      completely.
     *  - {Function} [preview]
     *      A function that initializes an options map that will be used to
     *      create a list item in a GUI style sheet chooser control. Will be
     *      called in the context of the style sheet container instance. The
     *      function receives the options map to be extended in the first
     *      parameter, and the attribute value in the second parameter.
     *
     * @param {Object} [options]
     *  A map with additional options for the derived class. Supports the
     *  following options:
     *  @param {Object} [options.parentFamilies]
     *      The parent style families whose associated style sheets can contain
     *      attributes of the family supported by this style sheet container
     *      class. The DOM elements referring to the style sheets of the
     *      specified style families must be ancestors of the DOM elements
     *      referring to the style sheets of this container. The passed object
     *      maps the attribute family to an ancestor element resolver function.
     *      The function receives the descendant DOM element as jQuery object
     *      in the first parameter, and returns the ancestor element of that
     *      DOM element which is associated to the parent style family used as
     *      map key.
     *
     * @returns {Function}
     *  The constructor function of the derived class.
     */
    StyleSheetsClass.extend = function (constructor, styleFamily, definitions, options) {

        var // get existing or create a new entry in the global registry
            registryEntry = getOrCreateRegistryEntry(styleFamily);

        // insert information for the new style family
        registryEntry.definitions = definitions;
        registryEntry.parentFamilies = Utils.getObjectOption(options, 'parentFamilies', {});

        // store references back to this style families in specified parent families
        _(registryEntry.parentFamilies).each(function (entry, parentFamily) {
            var parentEntry = getOrCreateRegistryEntry(parentFamily);
            parentEntry.supportedFamilies = _.unique(parentEntry.supportedFamilies.concat(registryEntry.supportedFamilies));
        });

        // create the derived class constructor
        return extendMethod.call(this, { constructor: constructor }, { STYLE_FAMILY: styleFamily });
    };

    return StyleSheetsClass;

});
