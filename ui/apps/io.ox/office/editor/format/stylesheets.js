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
     * @extends Container
     *
     * @param {DocumentStyles} documentStyles
     *  Global collection with all style and formatting containers used in a
     *  document.
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
     *  - 'format': An optional function that applies the passed attribute
     *      value to a DOM element (usually its CSS formatting). Will be called
     *      in the context of the style sheet container instance. The function
     *      receives the DOM element as jQuery object in the first parameter,
     *      and the attribute value in the second parameter. An alternative way
     *      to update the element formatting using a complete map of all
     *      attribute values is to specify a global update handler (see options
     *      below).
     *  - 'merge': An optional function that will be called while resolving
     *      attribute maps from different style sheets and explicit element
     *      formatting. Will be called to merge two existing values of this
     *      attributes, where the second value has to overwrite the first value
     *      in some way. Will be called in the context of the style sheet
     *      container instance. The function receives the 'old' attribute value
     *      in the first parameter, and the 'new' attribute value in the second
     *      parameter. By default, the new value wins and the first value will
     *      be overwritten completely.
     *  - 'preview': An optional function that initializes an options map that
     *      will be used to create a list item in a GUI style sheet chooser
     *      control. Will be called in the context of the style sheet container
     *      instance. The function receives the options map to be extended in
     *      the first parameter, and the attribute value in the second
     *      parameter.
     *
     * @param {Object} [options]
     *  A map of options to control the behavior of the style sheet container.
     *  The following options are supported:
     *  @param {Function} [options.styleAttributesResolver]
     *      If specified, a function that returns the attributes of a specific
     *      attribute family from the complete 'attributes' object of a style
     *      sheet. The map of attributes returned by this function may depend
     *      on a source element (e.g. on the position of this source element in
     *      its parents). The function receives the desired attribute family as
     *      first parameter, the complete 'attributes' object of the style
     *      sheet as second parameter, and the source node (as jQuery object)
     *      as third parameter. Will be called in the context of this style
     *      sheet container instance.
     */
    function StyleSheets(documentStyles, styleFamily, definitions, options) {

        var // self reference
            self = this,

            // style sheets, mapped by identifier
            styleSheets = {},

            // default values for all supported attributes of the own style family
            defaultAttributes = {},

            // identifier of the default style sheet
            defaultStyleId = null,

            // update handlers, called after attributes have been changed
            updateHandlers = [],

            // families of parent style sheets, mapping the parent element resolver functions
            parentStyleFamilies = {},

            // custom resolver for style attributes depending on a context element
            styleAttributesResolver = Utils.getFunctionOption(options, 'styleAttributesResolver');

        // private methods ----------------------------------------------------

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
         * Calculates the default attributes from the attribute definitions and
         * overrides the values of all attributes specified in the passed
         * attribute map.
         *
         * @param {Object} [attributes]
         *  The default values for some or all attributes of the main style
         *  family, as name/value pairs. Attributes not specified in this map
         *  will use the default values from the attribute definitions.
         */
        function initializeAttributeDefaults(attributes) {

            // get default attribute values from definitions
            defaultAttributes = {};
            _(definitions).each(function (definition, name) {
                defaultAttributes[name] = definition.def;
            });

            // override with passed values
            if (_.isObject(attributes)) {
                _(attributes).each(function (value, name) {
                    if ((name in defaultAttributes) && !_.isNull(value) && !_.isUndefined(value)) {
                        defaultAttributes[name] = value;
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
         * Returns the merged attributes of a specific attribute family from
         * the specified style sheet, its parent style sheets, and all style
         * sheets from other containers referred by ancestor elements.
         *
         * @param {String} id
         *  The unique identifier of the style sheet.
         *
         * @param {String} family
         *  The attribute family whose attributes will be returned.
         *
         * @param {HTMLElement|jQuery} [element]
         *  An element referring to a style sheet in this container whose
         *  attributes will be extracted. If this object is a jQuery
         *  collection, uses the first DOM node it contains.
         *
         * @param {HTMLElement|jQuery} [sourceNode]
         *  The source DOM node corresponding to the specified attribute family
         *  that has initiated the call to this method. Will be used to receive
         *  attributes from style sheets in other containers, referred by the
         *  ancestors of this node. Will be passed to a custom style attributes
         *  resolver (see the 'options.styleAttributesResolver' option passed
         *  to the constructor).
         *
         * @returns {Object}
         *  The formatting attributes contained in the style sheet and its
         *  ancestor style sheets, including the style sheets from other
         *  containers referred by ancestor elements, up to the map of default
         *  attributes, as map of name/value pairs.
         */
        function getStyleSheetAttributes(id, family, element, sourceNode) {

            var // the attributes of the style sheet and its ancestors
                attributes = null,
                // the style sheet container associated to the passed family
                familyStyleSheets = documentStyles.getStyleSheets(family),
                // passed element, as jQuery object
                $element = $(element),
                // passed source node, as jQuery object
                $sourceNode = $(sourceNode);

            // collects style sheet attributes recursively through parents
            function collectStyleAttributes(styleSheet) {

                // exit recursive call chain if no more parent styles are available
                if (!styleSheet) { return; }

                // call recursively to get the attributes of the parent style sheets
                collectStyleAttributes(styleSheets[styleSheet.parentId]);

                // add own attributes of the specified attribute family
                if (_.isObject(styleSheet.attributes[family])) {
                    // attributes directly mapped by family name in 'attributes' member of the style sheet
                    familyStyleSheets.extendAttributes(attributes, styleSheet.attributes[family]);
                }

                // try user-defined resolver for style attributes mapped in non-standard structures
                if (_.isFunction(styleAttributesResolver) && ($element.length > 0)) {
                    familyStyleSheets.extendAttributes(attributes, styleAttributesResolver.call(self, family, styleSheet.attributes, $element, $sourceNode));
                }
            }

            // start with default attribute values (only if in own style family)
            attributes = (family === styleFamily) ? _.clone(defaultAttributes) : {};

            // collect styles from ancestor elements if specified
            if ($element.length > 0) {
                _(parentStyleFamilies).each(function (elementResolver, parentFamily) {

                    var // a parent element of the passed element
                        $parentElement = $(elementResolver.call(self, $element)),
                        // parent style sheet container from the document styles collection
                        parentStyleSheets = documentStyles.getStyleSheets(parentFamily),
                        // attributes of parent element, resolved by parent style container
                        parentAttributes = null;

                    // try to get a parent element for the current parent style family
                    if ($parentElement.length > 0) {
                        // ask the container of the parent style family for style attributes of the passed family
                        parentAttributes = parentStyleSheets.extractStyleAttributes($parentElement, family, $element);
                        familyStyleSheets.extendAttributes(attributes, parentAttributes);
                    }
                });
            }

            // fall-back to default style sheet if passed identifier is invalid
            if (!(id in styleSheets) && (defaultStyleId in styleSheets)) {
                id = defaultStyleId;
            }

            // collect attributes from the style sheet and its parents
            collectStyleAttributes(styleSheets[id]);

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

            // updates a single attribute, if it has a registered formatter in its definition
            function updateSingleAttribute(name, value) {
                if ((name in definitions) && _.isFunction(definitions[name].format)) {
                    definitions[name].format.call(self, element, value);
                }
            }

            // update attributes via formatter functions from definitions
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

            // call update handlers taking all attributes at once
            _(updateHandlers).each(function (updateHandler) {
                updateHandler.call(self, element, mergedAttributes);
            });
        }

        // base constructor ---------------------------------------------------

        Container.call(this, documentStyles);

        // methods ------------------------------------------------------------

        /**
         * Registers an update handler that will be called for every DOM
         * element whose attributes have been changed. In difference to the
         * individual formatter functions specified in the definitions for
         * single attributes, this handler will be called once for a DOM
         * element regardless of the number of changed attributes.
         *
         * @internal
         *  Called from the constructor functions of derived classes.
         *
         * @param {Function} updateHandler
         *  The update handler function. Receives the element whose attributes
         *  have been changed (as jQuery object) as first parameter, and a map
         *  of all attributes (name/value pairs, effective values merged from
         *  style sheets and explicit attributes) of the element as second
         *  parameter. Only attributes of the main style family will be passed.
         *  Will be called in the context of this style sheet container
         *  instance.
         *
         * @returns {StyleSheets}
         *  A reference to this instance.
         */
        this.registerUpdateHandler = function (updateHandler) {
            updateHandlers.push(updateHandler);
            return this;
        };

        /**
         * Registers a parent style family whose associated style sheets can
         * contain attributes of the family supported by this style sheet
         * container. The DOM elements referring to the style sheets of the
         * specified style family must be ancestors of the DOM elements
         * referring to the style sheets of this container.
         *
         * @internal
         *  Called from the constructor functions of derived classes.
         *
         * @param {String} parentFamily
         *  The attribute family of the style sheets assigned to parent
         *  elements (or other ancestors). Used to resolve attributes from the
         *  style sheet or explicit formatting of an ancestor of the current
         *  element.
         *
         * @param {Function} parentElementResolver
         *  A function that returns the ancestor element of a DOM element which
         *  is associated to the passed parent style family. Receives the
         *  descendant DOM element as jQuery object in the first parameter.
         *  Will be called in the context of this style sheet container.
         *
         * @returns {StyleSheets}
         *  A reference to this instance.
         */
        this.registerParentStyleFamily = function (parentFamily, parentElementResolver) {
            parentStyleFamilies[parentFamily] = parentElementResolver;
            return this;
        };

        /**
         * Returns the definition of the specified formatting attribute.
         *
         * @param {String} name
         *  The name of the attribute.
         *
         * @param {Object} [options]
         *  A map of options controlling the operation. Supports the following
         *  options:
         *  @param {Boolean} [options.special=false]
         *      If set to true, the definitions of special attributes
         *      (attributes that are marked with the 'special' flag in the
         *      attribute definitions passed to the constructor) will be
         *      returned too.
         *
         * @return {Object}
         *  The definition of the specified attribute, or null, if the
         *  attribute does not exist.
         */
        this.getAttributeDefinition = function (name, options) {
            return isRegisteredAttribute(name, Utils.getBooleanOption(options, 'special', false)) ? definitions[name] : null;
        };

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
         * @return {String|Null}
         *  The identifier of the default style sheet.
         */
        this.getDefaultStyleSheetId = function () {
            return defaultStyleId;
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
        this.setAttributeDefaults = function (attributes) {

            // reinitialize the default attribute values
            initializeAttributeDefaults(attributes);

            // notify listeners
            this.triggerChangeEvent();

            return this;
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
            styleSheet.dirty = Utils.getBooleanOption(options, 'dirty', false);

            // set default style sheet
            if (Utils.getBooleanOption(options, 'defStyle', false)) {
                if (_.isNull(defaultStyleId)) {
                    defaultStyleId = id;
                } else if (defaultStyleId !== id) {
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
                this.triggerChangeEvent();
            }
            return this;
        };

        /**
         * Returns the merged attributes of the own style family from the
         * specified style sheet and its parent style sheets.
         *
         * @param {String} id
         *  The unique identifier of the style sheet.
         *
         * @returns {Object}
         *  The formatting attributes contained in the style sheet and its
         *  parent style sheets in this container up to the map of default
         *  attributes, as map of name/value pairs.
         */
        this.getStyleSheetAttributes = function (id) {
            return getStyleSheetAttributes(id, styleFamily);
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
         * Returns the parent id for the specified style sheet.
         * @param {String} id
         *
         * @returns {String}
         *  The parent id of the style sheet or null if no parent exists.
         */
        this.getParentId = function (id) {
            return (id in styleSheets) ? styleSheets[id].parentId : null;
        };

        /**
         * Returns the user defined name for the specified style sheet.
         *
         * @param {String} id
         *  The unique identifier of the style sheet.
         *
         * @returns
         *  The user defined name of the style sheet or null
         */
        this.getName = function (id) {
            return (id in styleSheets) ? styleSheets[id].name : null;
        };

        /**
         * Return if the specified style sheet is dirty or not.
         *
         * @param {String} id
         *  The unique identifier of the style sheet.
         *
         * @returns {Boolean}
         *  The dirty state of the style sheet.
         */
        this.isDirty = function (id) {
            return (id in styleSheets) ? styleSheets[id].dirty : false;
        };

        /**
         * Change dirty state of the specified style sheet
         *
         * @param {String} id
         * @param {Boolean} dirty
         */
        this.setDirty = function (id, dirty) {
            if (id in styleSheets) {
                styleSheets[id].dirty = dirty;
            }
        };

        /**
         * Returns the complete 'attributes' object of the specified style
         * sheet as-is, without resolving the parent style sheets, or
         * converting to the attributes of a specific attribute family.
         *
         * @param {String} id
         *  The unique identifier of the style sheet.
         *
         * @returns {Object}
         *  The complete 'attributes' object contained in the style sheet, as a
         *  deep clone.
         */
        this.getStyleSheetAttributeMap = function (id) {
            return (id in styleSheets) ? _.copy(styleSheets[id].attributes, true) : {};
        };

        /**
         * Extends the passed first attribute set with the attribute values of
         * the second attribute set. If the definitions of a specific attribute
         * contain a merger function, and both sets contain an attribute value,
         * uses that merger function to merge the values from both attribute
         * sets, otherwise the value of the second attribute set will be copied
         * to the first attribute set.
         *
         * @param {Object} attributes1
         *  (in/out) The first attribute set that will be extended in-place.
         *
         * @param {Object} attributes2
         *  The second attribute set, whose attribute values will be inserted
         *  into the first attribute set.
         *
         * @returns {StyleSheets}
         *  A reference to this style sheets container.
         */
        this.extendAttributes = function (attributes1, attributes2) {

            _(attributes2).each(function (value, name) {

                var // the merger function from the attribute definition
                    merger = null;

                // copy style sheet identifier directly
                if (name === 'style') {
                    attributes1.style = value;
                } else if (isRegisteredAttribute(name)) {
                    // try to find merger function from attribute definition
                    merger = definitions[name].merge;
                    // either set return value from merger, or copy the attribute directly
                    if ((name in attributes1) && _.isFunction(merger)) {
                        attributes1[name] = merger.call(this, attributes1[name], value);
                    } else {
                        attributes1[name] = value;
                    }
                }

            }, this);

            return this;
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
         * @param {String|String[]} [families]
         *  The attribute families used to add options to the options map. If
         *  omitted, only attributes of the own style family will be processed.
         *
         * @returns {Object}
         *  A map of options passed to the creator function of the preview
         *  button element.
         */
        this.getPreviewButtonOptions = function (id, families) {

            var // the result options
                options = { css: {}, labelCss: {} };

            // get families to be visited
            if (_.isString(families)) {
                families = [families];
            } else if (!_.isArray(families)) {
                families = [styleFamily];
            }

            // iterate through all families and add options for all the
            // attributes contained in the *own* style sheet
            _(families).each(function (family) {

                var // style sheet container for current family
                    styleSheets = documentStyles.getStyleSheets(family),
                    // formatting attributes of the own style sheet
                    styleAttributes = getStyleSheetAttributes(id, family);

                // generate options for the attributes
                _(styleAttributes).each(function (value, name) {

                    var // attribute definition from container corresponding to the current family
                        definition = styleSheets.getAttributeDefinition(name);

                    // call the preview handler of the attribute definition
                    if (definition && _.isFunction(definition.preview)) {
                        definition.preview.call(this, options, value);
                    }
                }, this);

            }, this);

            return options;
        };

        /**
         * Returns the formatting attributes of a specific attribute family
         * from the style sheet referred by the passed element.
         *
         * @internal
         *  Called from internal code of other style container instances to
         *  resolve style attributes across multiple style families.
         *
         * @param {HTMLElement|jQuery} element
         *  An element referring to a style sheet in this container whose
         *  attributes will be extracted. If this object is a jQuery
         *  collection, uses the first DOM node it contains.
         *
         * @param {String} family
         *  The family of the attributes to be returned from the style sheet.
         *
         * @param {HTMLElement|jQuery} sourceNode
         *  A descendant node embedded in the passed element which may be
         *  required to resolve the correct attribute values of the element or
         *  the style sheet it refers to. If this object is a jQuery
         *  collection, uses the first DOM node it contains.
         *
         * @returns {Object}
         *  A map of name/value pairs containing the attributes of the style
         *  sheet referred by the correct ancestor element of the passed node.
         */
        this.extractStyleAttributes = function (element, family, sourceNode) {

            var // the passed element, as jQuery object
                $element = $(element),
                // the explicit attributes of the ancestor element
                attributes = null;

            // get the explicit element attributes (containing the style sheet reference)
            attributes = ($element.length > 0) ? getElementAttributes($element) : {};

            // return the attributes of the style sheet referred by the element
            return getStyleSheetAttributes(attributes.style, family, $element, sourceNode);
        };

        /**
         * Returns the values of all formatting attributes in the specified DOM
         * element.
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
                mergedAttributes = getStyleSheetAttributes(elementAttributes.style, styleFamily, $element);

            // add explicit attributes to merged attribute map
            this.extendAttributes(mergedAttributes, elementAttributes);

            // filter by supported attributes
            _(mergedAttributes).each(function (value, name)  {
                if ((name !== 'style') && !isRegisteredAttribute(name, special)) {
                    delete mergedAttributes[name];
                }
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
         *
         * @returns {StyleSheets}
         *  A reference to this style sheets container.
         */
        this.setElementAttributes = function (element, attributes, options) {

            var // the style sheet identifier
                styleId = Utils.getOption(attributes, 'style'),
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
                // new explicit element attributes (clone, there may be multiple elements pointing to the same data object)
                elementAttributes = _.clone(oldElementAttributes),
                // attributes of the current or new style sheet
                styleAttributes = null,
                // names of all attributes needed to update the current element
                updateAttributeNames = [];

            // set or clear new style sheet identifier
            if (_.isString(styleId) || _.isNull(styleId)) {
                if (_.isNull(styleId)) {
                    delete elementAttributes.style;
                } else {
                    elementAttributes.style = styleId;
                }
                // the formatting of all attributes must be updated
                updateAttributeNames = null;
            }

            // get the merged style sheet attributes
            styleAttributes = getStyleSheetAttributes(elementAttributes.style, styleFamily, $element);

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

                // merge explicit attributes into style attributes, and update element formatting
                this.extendAttributes(styleAttributes, elementAttributes);
                updateElementFormatting($element, styleAttributes, updateAttributeNames);

                // call the passed change listener
                if (_.isFunction(changeListener)) {
                    changeListener.call(this, element, oldElementAttributes, elementAttributes);
                }
            }

            return this;
        };

        /**
         * Clears specific formatting attributes in the specified DOM element.
         *
         * @param {HTMLElement|jQuery} element
         *  The element whose attributes will be removed. If this object is a
         *  jQuery collection, uses the first DOM node it contains.
         *
         * @param {String|String[]} [attributeNames]
         *  A single attribute name, or an an array of attribute names. If
         *  omitted, clears all explicit element formatting attributes.
         *
         * @param {Object} [options]
         *  A map of options controlling the operation. Supports the following
         *  options:
         *  @param {Boolean} [options.special=false]
         *      If set to true, allows to clear special attributes (attributes
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
        this.clearElementAttributes = function (element, attributeNames, options) {

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
                attributes.style = null;
                _(definitions).each(function (definition, name) {
                    attributes[name] = null;
                });
            }

            // use method setElementAttributes() to do the real work
            return this.setElementAttributes(element, attributes, options);
        };

        /**
         * Updates the CSS formatting in the specified DOM element, according
         * to its current attribute and style settings.
         *
         * @param {HTMLElement|jQuery} element
         *  The element to be updated. If this object is a jQuery collection,
         *  uses the first DOM node it contains.
         *
         * @returns {StyleSheets}
         *  A reference to this style sheets container.
         */
        this.updateElementFormatting = function (element) {

            var // the element, as jQuery object
                $element = $(element),
                // explicit element attributes
                elementAttributes = getElementAttributes($element),
                // get attributes of the style sheet
                mergedAttributes = getStyleSheetAttributes(elementAttributes.style, styleFamily, $element, $element);

            // the resulting attributes to be updated at each element
            this.extendAttributes(mergedAttributes, elementAttributes);
            // update element formatting according to current attribute values
            updateElementFormatting($element, mergedAttributes);

            return this;
        };

        // initialization -----------------------------------------------------

        // build map with default attributes from definitions
        initializeAttributeDefaults();

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

    // derive this class from class Container
    return Container.extend({ constructor: StyleSheets });

});
