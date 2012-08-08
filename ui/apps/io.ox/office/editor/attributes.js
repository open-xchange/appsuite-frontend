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
     'io.ox/office/editor/selection'
    ], function (Utils, Fonts, Selection) {

    'use strict';

    var // maps all attribute converters to a unique attribute type
        converters = {};

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
         * Merges the current values of all supported formatting attribute in
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
                } else if (value !== attributes[name]) {
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
        }

    });

    // methods ----------------------------------------------------------------

    /**
     * Returns the values of all paragraph formatting attributes in the
     * specified DOM text ranges.
     *
     * @param {Object[]|Object} ranges
     *  The DOM text ranges. May be an array of DOM text range objects, or a
     *  single DOM text range object.
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
        Selection.iterateAncestorNodesInTextRanges(ranges, rootNode, 'p', function (node) {

            var // merge the existing attributes with the attributes of the new paragraph
                hasNonNull = this.mergeElementAttributes(attributes, node);

            // exit iteration loop if there are no unambiguous attributes left
            if (!hasNonNull) {
                return false;
            }
        }, this);

        return attributes;
    };

    /**
     * Changes specific paragraph formatting attributes in the specified DOM
     * text ranges.
     *
     * @param {Object[]|Object} ranges
     *  The DOM text ranges to be formatted. May be an array of DOM text range
     *  objects, or a single DOM text range object.
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
        Selection.iterateAncestorNodesInTextRanges(ranges, rootNode, 'p', function (node) {
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
            }
        },

        fontsize: {
            get: function (element) {
                var value = $(element).css('font-size');
                return Utils.convertCssLength(value, 'pt');
            },
            set: function (element, fontSize) {
                $(element).css('font-size', fontSize + 'pt');
            }
        },

        // Logically, the line height is a paragraph attribute. But technically
        // in CSS, the line height must be set separately at every span element
        // because a relative CSS line-height attribute at the paragraph (e.g.
        // 200%) will not be derived relatively to the spans, but absolutely
        // according to the paragraph's font size. Example: The paragraph has a
        // font size of 12pt and a line-height of 200%, resulting in 24pt. This
        // value will be derived to a span with a font size of 6pt, resulting
        // in a relative line height of 400%.
        lineheight: {
            get: function () {
                return 'normal';
            },
            set: function (element) {
                $(element).css('line-height', 'normal');
            }
        }

    }); // converters.character

    // methods ----------------------------------------------------------------

    /**
     * Returns the values of all character formatting attributes in the
     * specified DOM text ranges.
     *
     * @param {Object[]|Object} ranges
     *  The DOM text ranges. May be an array of DOM text range objects, or a
     *  single DOM text range object.
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
        Selection.iterateTextPortionsInTextRanges(ranges, function (textNode) {

            var // merge the existing attributes with the attributes of the new text node
                hasNonNull = this.mergeElementAttributes(attributes, textNode.parentNode);

            // exit iteration loop if there are no unambiguous attributes left
            if (!hasNonNull) {
                return false;
            }
        }, this);

        return attributes;
    };

    /**
     * Changes specific character formatting attributes in the specified DOM
     * text ranges. The formatting attributes will be applied to the tex
     * node's parent <span> elements which will be created as needed. Sibling
     * <span> elements containing the same formatting will be merged.
     *
     * @param {Object[]|Object} ranges
     *  The DOM text ranges to be formatted. May be an array of DOM text range
     *  objects, or a single DOM text range object.
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing the text ranges. If this object is a jQuery
     *  collection, uses the first node it contains.
     *
     * @param {Object} attributes
     *  A map of character attribute name/value pairs.
     */
    converters.character.setAttributes = function (ranges, rootNode, attributes) {

        var // last text node visited while iteration
            lastTextNode = null,
            // parent span element of next sibling text node
            nextSpan = null;

        // iterate all text nodes and change their formatting
        Selection.iterateTextPortionsInTextRanges(ranges, function (textNode, start, end) {

            var // text of the node
                text = textNode.nodeValue,
                // parent element of the text node
                parent = textNode.parentNode;

            // put text node into a span element, if not existing
            if (Utils.getNodeName(parent) !== 'span') {
                $(textNode).wrap('<span>');
                parent = textNode.parentNode;
                // Copy the paragraph's font-size to the span, and reset the
                // font-size of the paragraph, otherwise CSS defines a lower
                // limit for the line-height of all spans according to the
                // parent paragraph's font-size.
                $(parent).css('font-size', $(parent.parentNode).css('font-size'));
                $(parent.parentNode).css('font-size', '0');
            }

            // if manipulating a part of the text node, split it
            if (start > 0) {
                // prepend a new text node to this text node
                $(parent).clone().text(text.substr(0, start)).insertBefore(parent);
                // shorten text of this text node
                textNode.nodeValue = text.substr(start);
            }
            if (end < text.length) {
                // append a new text node to this text node
                $(parent).clone().text(text.substr(end)).insertAfter(parent);
                // shorten text of this text node
                textNode.nodeValue = text.substr(start, end - start);
            }

            // set the new formatting attributes at the span element
            this.setElementAttributes(parent, attributes);

            // try to merge with previous span
            if (parent.previousSibling && this.hasEqualElementAttributes(parent, parent.previousSibling)) {
                textNode.nodeValue = $(parent.previousSibling).text() + textNode.nodeValue;
                $(parent.previousSibling).remove();
            }

            lastTextNode = textNode;
        }, this);

        // try to merge last text node with next span
        nextSpan = lastTextNode ? lastTextNode.parentNode.nextSibling : null;
        if (nextSpan && (Utils.getNodeName(nextSpan) === 'span')) {
            if (this.hasEqualElementAttributes(lastTextNode.parentNode, nextSpan)) {
                lastTextNode.nodeValue = lastTextNode.nodeValue + $(nextSpan).text();
                $(nextSpan).remove();
            }
        }
    };

    // static class Attributes ================================================

    var Attributes = {};

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
     * the specified DOM text ranges.
     *
     * @param {String} type
     *  The type of the attribute converter.
     *
     * @param {Object[]|Object} ranges
     *  The DOM text ranges. May be an array of DOM text range objects, or a
     *  single DOM text range object.
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
     * Changes specific formatting attributes in the specified DOM text ranges.
     *
     * @param {String} type
     *  The type of the attribute converter.
     *
     * @param {Object[]|Object} ranges
     *  The DOM text ranges to be formatted. May be an array of DOM text range
     *  objects, or a single DOM text range object.
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
