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

    // class AttributeConverter ===============================================

    function AttributeConverter(definitions) {

        // methods ------------------------------------------------------------

        this.hasAttribute = function (name) {
            return name in definitions;
        };

        this.getAttribute = function (element, name) {
            if (name in definitions) {
                return definitions[name].get(element);
            }
        };

        this.getAttributes = function (element) {
            var attributes = {};
            _(definitions).each(function (converter, name) {
                attributes[name] = converter.get(element);
            });
            return attributes;
        };

        this.mergeAttributes = function (attributes, element) {

            var // whether any attribute is still unambiguous
                hasNonNull = false;

            // update all attributes
            _(this.getAttributes(element)).each(function (value, name) {
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

        this.hasEqualAttributes = function (element1, element2) {
            return _.isEqual(this.getAttributes(element1), this.getAttributes(element2));
        };

        this.setAttribute = function (element, name, value) {
            if (name in definitions) {
                definitions[name].set(element, value);
            }
        };

        this.setAttributes = function (element, attributes) {
            _(attributes).each(function (value, name) {
                this.setAttribute(element, name, value);
            }, this);
        };

    } // class AttributeConverter

    // class ParagraphAttributes ==============================================

    /**
     * Maps paragraph formatting attribute names used in the operations API to
     * getter and setter functions that manipulate the CSS formatting of DOM
     * elements.
     */
    var ParagraphAttributes = new AttributeConverter({

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

    }); // class ParagraphAttributes

    // class CharacterAttributes ==============================================

    /**
     * Maps character formatting attribute names used in the operations API to
     * getter and setter functions that manipulate the CSS formatting of DOM
     * elements.
     */
    var CharacterAttributes = new AttributeConverter({

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
                value = Utils[state ? 'addToken' : 'removeToken'](value, 'underline', 'none');
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
        }

    }); // class CharacterAttributes

    // static class Attributes ================================================

    var Attributes = {};

    // paragraph formatting ---------------------------------------------------

    /**
     * Returns whether the passed name is a paragraph attribute.
     *
     * @param {String} name
     *  Attribute name to be checked.
     */
    Attributes.isParagraphAttribute = function (name) {
        return ParagraphAttributes.hasAttribute(name);
    };

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
    Attributes.getParagraphAttributes = function (ranges, rootNode) {

        var // the attribute values, mapped by name
            attributes = {};

        // get attributes from all paragraph elements
        Selection.iterateAncestorNodesInTextRanges(ranges, rootNode, 'p', function (node) {

            var // merge the existing attributes with the attributes of the new paragraph
                hasNonNull = ParagraphAttributes.mergeAttributes(attributes, node);

            // exit iteration loop if there are no unambiguous attributes left
            if (!hasNonNull) {
                return false;
            }
        });

        return attributes;
    };

    /**
     * Changes specific paragraph formatting attributes in the specified DOM
     * text ranges. The formatting attributes will be applied to all <p>
     * elements containing the text nodes covered by the passed ranges.
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
    Attributes.setParagraphAttributes = function (ranges, rootNode, attributes) {

        // iterate all paragraph elements and change their formatting
        Selection.iterateAncestorNodesInTextRanges(ranges, rootNode, 'p', function (node) {
            ParagraphAttributes.setAttributes(node, attributes);
        });
    };

    // character formatting ---------------------------------------------------

    /**
     * Returns whether the passed name is a character attribute.
     *
     * @param {String} name
     *  Attribute name to be checked.
     */
    Attributes.isCharacterAttribute = function (name) {
        return CharacterAttributes.hasAttribute(name);
    };

    /**
     * Returns the values of all character formatting attributes in the
     * specified DOM text ranges.
     *
     * @param {Object[]|Object} ranges
     *  The DOM text ranges. May be an array of DOM text range objects, or a
     *  single DOM text range object.
     *
     * @returns {Object}
     *  A map of character attribute name/value pairs.
     */
    Attributes.getCharacterAttributes = function (ranges) {

        var // the attribute values, mapped by name
            attributes = {};

        // process all text nodes, get attributes from their parent element
        Selection.iterateTextPortionsInTextRanges(ranges, function (textNode) {

            var // merge the existing attributes with the attributes of the new text node
                hasNonNull = CharacterAttributes.mergeAttributes(attributes, textNode.parentNode);

            // exit iteration loop if there are no unambiguous attributes left
            if (!hasNonNull) {
                return false;
            }
        });

        return attributes;
    };

    /**
     * Changes specific character formatting attributes in the specified DOM
     * text ranges. The formatting attributes will be applied to the text
     * node's parent <span> elements which will be created as needed. Sibling
     * <span> elements containing the same formatting will be merged.
     *
     * @param {Object[]|Object} ranges
     *  The DOM text ranges to be formatted. May be an array of DOM text range
     *  objects, or a single DOM text range object.
     *
     * @param {Object} attributes
     *  A map of character attribute name/value pairs.
     */
    Attributes.setCharacterAttributes = function (ranges, attributes) {

        var // last text node visited while iteration
            lastTextNode = null,
            // parent span element of next sibling text node
            nextSpan = null;

        // ranges must be iterated in reversed order, otherwise the last span
        // in a text may be merged away but is used in the following text range
        ranges = _.copy(ranges);
        ranges.reverse();

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
            CharacterAttributes.setAttributes(parent, attributes);

            // try to merge with previous span
            if (parent.previousSibling && CharacterAttributes.hasEqualAttributes(parent, parent.previousSibling)) {
                textNode.nodeValue = $(parent.previousSibling).text() + textNode.nodeValue;
                $(parent.previousSibling).remove();
            }

            lastTextNode = textNode;
        });

        // try to merge last text node with next span
        nextSpan = lastTextNode ? lastTextNode.parentNode.nextSibling : null;
        if (nextSpan && (Utils.getNodeName(nextSpan) === 'span')) {
            if (CharacterAttributes.hasEqualAttributes(lastTextNode.parentNode, nextSpan)) {
                lastTextNode.nodeValue = lastTextNode.nodeValue + $(nextSpan).text();
                $(nextSpan).remove();
            }
        }
    };

    // exports ================================================================

    return Attributes;

});
