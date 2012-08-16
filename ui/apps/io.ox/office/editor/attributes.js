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

define('io.ox/office/editor/attributes',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/fonts',
     'io.ox/office/editor/dom',
     'gettext!io.ox/office/main'
    ], function (Utils, Fonts, DOM, gt) {

    'use strict';

    // class AttributeConverter ===============================================

    /**
     * Converts between formatting attributes of an element's CSS and the
     * 'setAttribute' operation of the editor's Operations API. Used as base
     * class for specialized attribute converters.
     *
     * @constructor
     *
     * @param {Object} definitions
     *  A map that defines formatting attributes supported by this converter.
     *  Each attribute is mapped by its name used in the Operations API, and
     *  maps an object that contains a getter and setter method. The get()
     *  method of a definition object receives the DOM element object, and
     *  returns the value of the formatting attribute from the element's CSS
     *  formatting. The set() method of a definition object receives the DOM
     *  element object and the value of the formatting attribute, and modifies
     *  the element's CSS formatting.
     *
     * @param {Object} styleSheetPool
     *  Predefined style sheets, mapped by style sheet identifier, referred to
     *  by the style sheet name attribute.
     *
     * @param {String} styleSheetAttribute
     *  The name of the attribute containing the style sheet name.
     */
    function AttributeConverter(definitions, styleSheetPool, styleSheetAttribute) {

        // methods ------------------------------------------------------------

        /**
         * Returns the static style sheet pool containing the defaults for all
         * built-in style sheets.
         */
        this.getStyleSheetPool = function () {
            return styleSheetPool;
        };

        /**
         * Returns whether this converter contains a definition for the
         * specified formatting attribute.
         *
         * @param {String} name
         *  The name of the formatting attribute.
         *
         * @returns {Boolean}
         *  Whether the specified attribute is supported by this converter.
         */
        this.hasAttribute = function (name) {
            return name in definitions;
        };

        /**
         * Returns whether this converter contains a definition for at least
         * one of the specified formatting attributes.
         *
         * @param {Object} attributes
         *  A map with formatting attribute values, mapped by the attribute
         *  names.
         *
         * @returns {Boolean}
         *  Whether at least one of the specified attributes is supported by
         *  this converter.
         */
        this.hasAnyAttribute = function (attributes) {
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
            _(definitions).each(function (converter, name) {
                attributes[name] = converter.get(element);
            });
            return attributes;
        };

        /**
         * Merges the current values of all supported formatting attributes in
         * the passed DOM element into an existing map of attribute values.
         *
         * @param {Object} attributes
         *  (in/out) A map with formatting attribute values, mapped by the
         *  attribute names. If a formatting attribute of the passed element
         *  differs from the existing value in this map, the attribute value
         *  in this map will be set to null, otherwise the attribute value of
         *  the element will be inserted into this map or remains unchanged.
         *
         * @param {HTMLElement} element
         *  The DOM element object containing CSS formatting.
         *
         * @returns {Boolean}
         *  Whether the attributes map contains any unambiguous attribute
         *  values (different from the value null) after executing this method.
         */
        this.mergeElementAttributes = function (attributes, element) {

            var // whether any attribute is still unambiguous
                hasNonNull = false;

            // update all attributes
            _(this.getElementAttributes(element)).each(function (value, name) {
                if (!(name in attributes)) {
                    // initial iteration: store value
                    attributes[name] = value;
                } else if (!_.isEqual(value, attributes[name])) {
                    // value differs from previous value: ambiguous state
                    attributes[name] = null;
                }
                hasNonNull = hasNonNull || !_.isNull(attributes[name]);
            });

            return hasNonNull;
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

        // initialization -----------------------------------------------------

        // add a definition for the style sheet name
        definitions[styleSheetAttribute] = {
            get: function (element) {
                var value = $(element).data(styleSheetAttribute);
                return _.isString(value) ? value : 'std';
            },
            set: function (element, style) {
                $(element).data(styleSheetAttribute, style);
            }
        };

    } // class AttributeConverter

    // namespace Attributes ===================================================

    var Attributes = {};

    // singleton Attributes.Paragraph =========================================

    var // predefined values for the 'lineheight' attribute for paragraphs
        LineHeight = {
            SINGLE: { type: 'percent', value: 100 },
            ONE_HALF: { type: 'percent', value: 150 },
            DOUBLE: { type: 'percent', value: 200 }
        },

        // definitions for all paragraph attributes, mapped by name
        ParagraphAttributeDefinitions = {

            alignment: {
                get: function (element) {
                    var value = $(element).css('text-align');
                    // TODO: map 'start'/'end' to 'left'/'right' according to bidi state
                    return (value === 'start') ? 'left' : (value === 'end') ? 'right' : value;
                },
                set: function (element, value) {
                    $(element).css('text-align', value);
                }
            },

            // Logically, the line height is a paragraph attribute. But technically
            // in CSS, the line height must be set separately at every span element
            // because a relative CSS line-height attribute at the paragraph (e.g.
            // 200%) will not be derived relatively to the spans, but absolutely
            // according to the paragraph's font size. Example: The paragraph has a
            // font size of 12pt and a line-height of 200%, resulting in 24pt. This
            // value will be derived absolutely to a span with a font size of 6pt,
            // resulting in a relative line height of 24pt/6pt = 400% instead of
            // the expected 200%.
            lineheight: {
                get: function (element) {
                    var lineHeight = $(element).data('lineheight');
                    return _.isObject(lineHeight) ? lineHeight : LineHeight.SINGLE;
                },
                validate: function (lineHeight) {
                    var type = Utils.getStringOption(lineHeight, 'type'),
                        value = 0;
                    switch (type) {
                    case 'fixed':
                    case 'leading':
                    case 'atleast':
                        value = Utils.getNumberOption(lineHeight, 'value', 1.0, 1.0, 999.9, 1);
                        break;
                    case 'percent':
                        value = Utils.getIntegerOption(lineHeight, 'value', 100, 20, 500);
                        break;
                    default:
                        return LineHeight.SINGLE;
                    }
                    return { type: type, value: value };
                },
                set: function (element, lineHeight) {
                    lineHeight = this.validate(lineHeight);
                    $(element).data('lineheight', lineHeight).children('span').each(function () {
                        updateElementLineHeight(this, lineHeight);
                    });
                }
            }

        },

        // defaults for the paragraph style sheets
        ParagraphStyleSheetPool = {

            std: {
                name: gt('Standard'),
                parent: null,
                attributes: {
                    alignment: 'left',
                    lineheight: LineHeight.SINGLE,
                    fontname: 'Times New Roman',
                    fontsize: 12,
                    bold: false,
                    italic: false,
                    underline: false
                }
            },

            title: {
                name: gt('Title'),
                parent: 'std',
                attributes: {
                    alignment: 'center',
                    fontname: 'Arial',
                    fontsize: 24,
                    bold: true
                }
            },

            subtitle: {
                name: gt('Subtitle'),
                parent: 'std',
                attributes: {
                    alignment: 'center',
                    fontsize: 20,
                    italic: true
                }
            },

            h1: {
                name: gt('Heading 1'),
                parent: 'std',
                attributes: {
                    alignment: 'center',
                    fontname: 'Arial',
                    fontsize: 20,
                    bold: true
                }
            },

            h2: {
                name: gt('Heading 2'),
                parent: 'std',
                attributes: {
                    alignment: 'center',
                    fontname: 'Arial',
                    fontsize: 16,
                    bold: true
                }
            },

            h3: {
                name: gt('Heading 3'),
                parent: 'std',
                attributes: {
                    alignment: 'center',
                    fontname: 'Arial',
                    fontsize: 14,
                    bold: true
                }
            }

        },

        // caches calculated normal line heights by font family and font sizes
        lineHeightCache = {},

        // the dummy element used to calculate the 'normal' line height for a specific font
        lineHeightElement = $('<div style="line-height: normal; padding: 0; border: none;"><span>X</span></div>');

    // private methods --------------------------------------------------------

    /**
     * Calculates the 'normal' line height for the font settings in the passed
     * DOM element in points.
     *
     * @param {HTMLElement} element
     *  The DOM element containing the font settings needed for the line height
     *  calculation.
     *
     * @returns {Number}
     *  The 'normal' line height for the font settings in the passed element,
     *  in points.
     */
    function calculateNormalLineHeight(element) {

        var // the passed element, as jQuery object
            $element = $(element),

            // element font size, exactly and as integer
            fontSize = Utils.convertCssLength($element.css('font-size'), 'pt'),
            intFontSize = Math.max(Math.floor(fontSize), 1),

            // relevant font attributes of the element, used as cache key
            attributes = {
                fontFamily: $element.css('font-family'),
                fontWeight: $element.css('font-weight'),
                fontStyle: $element.css('font-style'),
                fontSize: intFontSize + 'pt'
            },
            cacheKey = JSON.stringify(attributes),

            // the resulting line height from the cache
            lineHeight = lineHeightCache[cacheKey];

        // calculate line height if not yet cached
        if (_.isUndefined(lineHeight)) {
            $('body').append(lineHeightElement);
            lineHeightElement.css(attributes);
            lineHeight = lineHeightCache[cacheKey] = Utils.convertLength(lineHeightElement.height(), 'px', 'pt');
            lineHeightElement.detach();
        }

        // interpolate fractional part of the font size
        return Utils.roundDigits(lineHeight * fontSize / intFontSize, 1);
    }

    /**
     * Sets or updates the text line height of the specified element.
     *
     * @param {HTMLElement} element
     *  The DOM element whose line height will be changed.
     *
     * @param {Object} [lineHeight]
     *  The new line height. If specified, MUST contain the attributes 'type'
     *  and 'value', and these attributes MUST contain valid values. If
     *  omitted, reads the current line height from the passed element and
     *  updates the CSS line height according to the current font settings of
     *  the element. If the element does not contain a line height, defaults to
     *  LineHeight.SINGLE.
     */
    function updateElementLineHeight(element, lineHeight) {

        var // effective line height in points
            height = 1;

        // read from element if omitted
        lineHeight = lineHeight || $(element).data('lineheight') || LineHeight.SINGLE;

        // set the CSS formatting
        switch (lineHeight.type) {
        case 'fixed':
            height = lineHeight.value;
            break;
        case 'leading':
            height = lineHeight.value + calculateNormalLineHeight(element);
            break;
        case 'atleast':
            height = Math.max(lineHeight.value, calculateNormalLineHeight(element));
            break;
        case 'percent':
            height = Utils.roundDigits(calculateNormalLineHeight(element) * lineHeight.value / 100, 1);
            break;
        default:
            Utils.error('setElementLineHeight(): invalid line height type');
        }
        $(element).data('lineheight', lineHeight).css('line-height', height + 'pt');
    }

    // singleton instance -----------------------------------------------------

    /**
     * A converter for paragraph formatting attributes. The CSS formatting will
     * be read from and written to <p> elements.
     */
    Attributes.Paragraph = new AttributeConverter(ParagraphAttributeDefinitions, ParagraphStyleSheetPool, 'parastyle');

    /**
     * Predefined values for the 'lineheight' attribute for paragraphs.
     */
    Attributes.Paragraph.LineHeight = LineHeight;

    Attributes.Paragraph.StyleSheetPool = ParagraphStyleSheetPool;

    // methods ----------------------------------------------------------------

    /**
     * Returns the values of all paragraph formatting attributes in the
     * specified DOM ranges.
     *
     * @param {DOM.Range[]} ranges
     *  (in/out) The DOM ranges to be visited. The array will be validated and
     *  sorted before iteration starts (see method DOM.iterateNodesInRanges()
     *  for details).
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing the text ranges. If this object is a jQuery
     *  collection, uses the first node it contains.
     *
     * @returns {Object}
     *  A map of paragraph attribute name/value pairs.
     */
    Attributes.Paragraph.getAttributes = function (ranges, rootNode) {

        var // the attribute values, mapped by name
            attributes = {};

        // get attributes from all paragraph elements
        DOM.iterateAncestorNodesInRanges(ranges, rootNode, 'p', function (node) {

            var // merge the existing attributes with the attributes of the new paragraph
                hasNonNull = this.mergeElementAttributes(attributes, node);

            // exit iteration loop if there are no unambiguous attributes left
            if (!hasNonNull) { return Utils.BREAK; }

        }, this);

        return attributes;
    };

    /**
     * Changes specific paragraph formatting attributes in the specified DOM
     * ranges.
     *
     * @param {DOM.Range[]} ranges
     *  (in/out) The DOM ranges to be formatted. The array will be validated
     *  and sorted before iteration starts (see method
     *  DOM.iterateNodesInRanges() for details).
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing the text ranges. If this object is a jQuery
     *  collection, uses the first node it contains.
     *
     * @param {Object} attributes
     *  A map of paragraph attribute name/value pairs.
     */
    Attributes.Paragraph.setAttributes = function (ranges, rootNode, attributes) {

        // iterate all paragraph elements and change their formatting
        DOM.iterateAncestorNodesInRanges(ranges, rootNode, 'p', function (node) {
            this.setElementAttributes(node, attributes);
        }, this);
    };

    // singleton Attributes.Character =========================================

    var // definitions for all paragraph attributes, mapped by name
        CharacterAttributeDefinitions = {

            fontname: {
                get: function (element) {
                    var value = $(element).css('font-family');
                    return Fonts.getFontName(value);
                },
                set: function (element, fontName) {
                    $(element).css('font-family', Fonts.getCssFontFamily(fontName));
                    updateElementLineHeight(element);
                }
            },

            fontsize: {
                get: function (element) {
                    var value = $(element).css('font-size');
                    return Utils.convertCssLength(value, 'pt');
                },
                set: function (element, fontSize) {
                    $(element).css('font-size', fontSize + 'pt');
                    updateElementLineHeight(element);
                }
            },

            bold: {
                get: function (element) {
                    var value = $(element).css('font-weight');
                    return (value === 'bold') || (value === 'bolder') || (parseInt(value, 10) >= 700);
                },
                set: function (element, state) {
                    $(element).css('font-weight', state ? 'bold' : 'normal');
                    updateElementLineHeight(element);
                }
            },

            italic: {
                get: function (element) {
                    var value = $(element).css('font-style');
                    return (value === 'italic') || (value === 'oblique');
                },
                set: function (element, state) {
                    $(element).css('font-style', state ? 'italic' : 'normal');
                    updateElementLineHeight(element);
                }
            },

            underline: {
                get: function (element) {
                    return Utils.containsToken($(element).css('text-decoration'), 'underline');
                },
                set: function (element, state) {
                    var value = $(element).css('text-decoration');
                    value = Utils.toggleToken(value, 'underline', state, 'none');
                    $(element).css('text-decoration', value);
                }
            },

            highlight: {
                get: function (element) {
                    return $(element).hasClass('highlight');
                },
                set: function (element, state) {
                    $(element).toggleClass('highlight', state);
                }
            }

        },

        // defaults for the character style sheets
        CharacterStyleSheetPool = {

            std: {
                name: gt('Standard'),
                parent: null,
                attributes: {} // use settings from current paragraph styles by default
            }

        };

    // singleton instance -----------------------------------------------------

    /**
     * A converter for character formatting attributes. The CSS formatting will
     * be read from and written to <span> elements contained in paragraph <p>
     * elements.
     */
    Attributes.Character = new AttributeConverter(CharacterAttributeDefinitions, CharacterStyleSheetPool, 'charstyle');

    // methods ----------------------------------------------------------------

    /**
     * Returns the values of all character formatting attributes in the
     * specified DOM ranges.
     *
     * @param {DOM.Range[]} ranges
     *  (in/out) The DOM ranges to be visited. The array will be validated and
     *  sorted before iteration starts (see method DOM.iterateNodesInRanges()
     *  for details).
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing the text ranges. If this object is a jQuery
     *  collection, uses the first node it contains.
     *
     * @returns {Object}
     *  A map of character attribute name/value pairs.
     */
    Attributes.Character.getAttributes = function (ranges, rootNode) {

        var // the attribute values, mapped by name
            attributes = {};

        // process all text nodes, get attributes from their parent element
        DOM.iterateTextPortionsInRanges(ranges, function (textNode) {

            var // merge the existing attributes with the attributes of the new text node
                hasNonNull = this.mergeElementAttributes(attributes, textNode.parentNode);

            // exit iteration loop if there are no unambiguous attributes left
            if (!hasNonNull) { return Utils.BREAK; }

        }, this);

        return attributes;
    };

    /**
     * Changes specific character formatting attributes in the specified DOM
     * ranges. The formatting attributes will be applied to the text node's
     * parent <span> elements which will be created as needed. Sibling <span>
     * elements containing the same formatting will be merged.
     *
     * @param {DOM.Range[]} ranges
     *  (in/out) The DOM ranges to be formatted. The array will be validated
     *  and sorted before iteration starts (see method
     *  DOM.iterateNodesInRanges() for details).
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing the text ranges. If this object is a jQuery
     *  collection, uses the first node it contains.
     *
     * @param {Object} attributes
     *  A map of character attribute name/value pairs.
     */
    Attributes.Character.setAttributes = function (ranges, rootNode, attributes) {

        var // self reference for local functions
            self = this;

        // Returns whether the passed text nodes contain equal character formatting.
        function hasEqualAttributes(textNode1, textNode2) {
            return self.hasEqualElementAttributes(textNode1.parentNode, textNode2.parentNode);
        }

        // iterate all text nodes and change their formatting (passing the
        // option 'split' causes to split partly covered text nodes, passing
        // the option 'merge' will merge text spans with equal formatting)
        DOM.iterateTextPortionsInRanges(ranges, function (textNode) {

            // set the new formatting attributes at the parent span element
            this.setElementAttributes(textNode.parentNode, attributes);

        }, this, { split: true, merge: hasEqualAttributes });
    };

    // exports ================================================================

    return Attributes;

});
