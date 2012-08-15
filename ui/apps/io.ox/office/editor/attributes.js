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
     'io.ox/office/editor/dom'
    ], function (Utils, Fonts, DOM) {

    'use strict';

    var // maps all attribute converters to a unique attribute type
        converters = {},

        // define static class Attributes here to prevent compiler warnings
        Attributes = {};

    // class AttributeConverter ===============================================

    /**
     * Converts between formatting attributes of an element's CSS and the
     * 'setAttribute' operation of the editor's Operations API.
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
     */
    function AttributeConverter(definitions) {

        // methods ------------------------------------------------------------

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

    } // class AttributeConverter

    // paragraph attributes ===================================================

    /**
     * Predefined values for the 'lineheight' attribute for paragraphs.
     */
    Attributes.LineHeight = {
        SINGLE: { type: 'percent', value: 100 },
        ONE_HALF: { type: 'percent', value: 150 },
        DOUBLE: { type: 'percent', value: 200 }
    };

    /**
     * Returns a valid value for the 'lineheight' attribute.
     *
     * @param {Object} lineHeight
     *  The line height to be validated.
     *
     * @returns {Object}
     *  The valid line height object, containing 'type' and 'value' attributes.
     */
    function getValidLineHeight(lineHeight) {

        if (_.isObject(lineHeight)) {
            switch (lineHeight.type) {
            case 'fixed':
                lineHeight.value = Utils.getNumberOption(lineHeight, 'value', 1.0, 1.0, 999.9, 1);
                break;
            case 'leading':
                lineHeight.value = Utils.getNumberOption(lineHeight, 'value', 1.0, 1.0, 999.9, 1);
                break;
            case 'atleast':
                lineHeight.value = Utils.getNumberOption(lineHeight, 'value', 1.0, 1.0, 999.9, 1);
                break;
            default: // percent
                lineHeight.type = 'percent';
                lineHeight.value = Utils.getIntegerOption(lineHeight, 'value', 100, 20, 500);
            }
        } else {
            lineHeight = Attributes.LineHeight.SINGLE;
        }

        return lineHeight;
    }

    /**
     * Sets the text line height of the specified text span.
     *
     * @param {HTMLElement|jQuery} span
     *  The <span> element whose line height will be changed. If this object is
     *  a jQuery collection, uses the first DOM node it contains.
     *
     * @param {Object} lineHeight
     *  The new line height. MUST contain the attributes 'type' and 'value',
     *  and these attributes MUST contain valid values.
     */
    function setLineHeight(span, lineHeight) {

        var // the passed span as jQuery object
            $span = $(span).first(),
            // effective line height in points
            height = 1;

        // Returns the 'normal' line height for the passed span in points.
        function getNormalLineHeight() {

            var // current font size of the element
                fontSize = Utils.convertCssLength($span.css('font-size'), 'pt');

            // TODO: This formula simulates the browser's line height 'normal'
            // for regular fonts quite good, but we need to get the exact line
            // height, also for exotic fonts with large ascent and descent,
            // e.g. by inserting a dummy paragraph/span to the document body
            // with the current font name and size, and reading the calculated
            // height.
            return fontSize * (1.0 / fontSize + 1.15);
        }

        // set the CSS formatting
        switch (lineHeight.type) {
        case 'fixed':
            height = lineHeight.value;
            break;
        case 'leading':
            height = lineHeight.value + getNormalLineHeight();
            break;
        case 'atleast':
            height = Math.max(lineHeight.value, getNormalLineHeight());
            break;
        case 'percent':
            height = Utils.roundDigits(getNormalLineHeight() * lineHeight.value / 100, 1);
            break;
        default:
            Utils.error('setLineHeight(): invalid line height type');
        }
        $span.css('line-height', height + 'pt');
    }

    /**
     * Updates the text line height of the specified text span according to its
     * current font settings.
     *
     * @param {HTMLElement|jQuery} span
     *  The <span> element whose line height will be updated. If this object is
     *  a jQuery collection, uses the first DOM node it contains.
     */
    function updateLineHeight(span) {

        var // the passed span as jQuery object
            $span = $(span).first(),
            // the current line height in the span
            lineHeight = getValidLineHeight($span.data('lineheight'));

        // write the effective/corrected line height back to element, and set the CSS line height
        $span.data('lineheight', lineHeight);
        setLineHeight(span, lineHeight);
    }

    /**
     * A converter for paragraph formatting attributes. The CSS formatting will
     * be read from and written to <p> elements.
     */
    converters.paragraph = new AttributeConverter({

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
                return _.isObject(lineHeight) ? lineHeight : Attributes.LineHeight.SINGLE;
            },
            set: function (element, lineHeight) {
                lineHeight = getValidLineHeight(lineHeight);
                $(element).data('lineheight', lineHeight);
                Utils.iterateSelectedDescendantNodes(element, 'span', function (span) {
                    setLineHeight(span, lineHeight);
                });
            }
        }

    });

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
    converters.paragraph.getAttributes = function (ranges, rootNode) {

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
    converters.paragraph.setAttributes = function (ranges, rootNode, attributes) {

        // iterate all paragraph elements and change their formatting
        DOM.iterateAncestorNodesInRanges(ranges, rootNode, 'p', function (node) {
            this.setElementAttributes(node, attributes);
        }, this);
    };

    // character attributes ===================================================

    /**
     * A converter for character formatting attributes. The CSS formatting will
     * be read from and written to <span> elements contained in paragraph <p>
     * elements.
     */
    converters.character = new AttributeConverter({

        bold: {
            get: function (element) {
                var value = $(element).css('font-weight');
                return (value === 'bold') || (value === 'bolder') || (parseInt(value, 10) >= 700);
            },
            set: function (element, state) {
                $(element).css('font-weight', state ? 'bold' : 'normal');
            }
        },

        italic: {
            get: function (element) {
                var value = $(element).css('font-style');
                return (value === 'italic') || (value === 'oblique');
            },
            set: function (element, state) {
                $(element).css('font-style', state ? 'italic' : 'normal');
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

        fontname: {
            get: function (element) {
                var value = $(element).css('font-family');
                return Fonts.getFontName(value);
            },
            set: function (element, fontName) {
                $(element).css('font-family', Fonts.getCssFontFamily(fontName));
                updateLineHeight(element);
            }
        },

        fontsize: {
            get: function (element) {
                var value = $(element).css('font-size');
                return Utils.convertCssLength(value, 'pt');
            },
            set: function (element, fontSize) {
                $(element).css('font-size', fontSize + 'pt');
                updateLineHeight(element);
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

    }); // converters.character

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
    converters.character.getAttributes = function (ranges, rootNode) {

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
    converters.character.setAttributes = function (ranges, rootNode, attributes) {

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

    // static class Attributes ================================================

    /**
     * Returns whether the specified attribute converter contains a definition
     * for the passed formatting attribute.
     *
     * @param {String} type
     *  The type of the attribute converter.
     *
     * @param {String} name
     *  The name of the formatting attribute.
     *
     * @returns {Boolean}
     *  Whether the specified attribute is supported by the converter.
     */
    Attributes.isAttribute = function (type, name) {
        return (type in converters) && converters[type].hasAttribute(name);
    };

    /**
     * Returns whether the specified attribute converter contains a definition
     * for at least one of the passed formatting attributes.
     *
     * @param {String} type
     *  The type of the attribute converter.
     *
     * @param {Object} attributes
     *  A map with formatting attribute values, mapped by the attribute names.
     *
     * @returns {Boolean}
     *  Whether at least one of the specified attributes is supported by the
     *  converter.
     */
    Attributes.isAnyAttribute = function (type, attributes) {
        return (type in converters) && converters[type].hasAnyAttribute(attributes);
    };

    /**
     * Returns the values of all formatting attributes of a specific type in
     * the specified DOM ranges.
     *
     * @param {String} type
     *  The type of the attribute converter.
     *
     * @param {DOM.Range[]|DOM.Range} ranges
     *  The DOM ranges. May be an array of DOM range objects, or a single DOM
     *  range object.
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing the text ranges. If this object is a jQuery
     *  collection, uses the first node it contains.
     *
     * @returns {Object}
     *  A map of attribute name/value pairs.
     */
    Attributes.getAttributes = function (type, ranges, rootNode) {
        return (type in converters) ? converters[type].getAttributes(ranges, rootNode) : null;
    };

    /**
     * Changes specific formatting attributes in the specified DOM ranges.
     *
     * @param {String} type
     *  The type of the attribute converter.
     *
     * @param {DOM.Range[]|DOM.Range} ranges
     *  The DOM ranges to be formatted. May be an array of DOM range objects,
     *  or a single DOM range object.
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing the text ranges. If this object is a jQuery
     *  collection, uses the first node it contains.
     *
     * @param {Object} attributes
     *  A map of paragraph attribute name/value pairs.
     */
    Attributes.setAttributes = function (type, ranges, rootNode, attributes) {

        var // the converter object
            converter = converters[type];

        // do not iterate over the passed ranges, if no attribute is supported
        if (converter && converter.hasAnyAttribute(attributes)) {
            converter.setAttributes(ranges, rootNode, attributes);
        }
    };

    // exports ================================================================

    return Attributes;

});
