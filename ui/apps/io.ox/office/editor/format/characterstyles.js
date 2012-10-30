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

define('io.ox/office/editor/format/characterstyles',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/fonts',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/format/lineheight',
     'io.ox/office/editor/format/stylesheets',
     'io.ox/office/editor/format/color'
    ], function (Utils, Fonts, DOM, LineHeight, StyleSheets, Color) {

    'use strict';

    var // definitions for character attributes
        DEFINITIONS = {

            fontname: {
                def: 'sans-serif',
                set: function (element, fontName) {
                    element.css('font-family', Fonts.getCssFontFamily(fontName));
                },
                preview: function (options, fontName) {
                    options.labelCss.fontFamily = Fonts.getCssFontFamily(fontName);
                }
            },

            fontsize: {
                def: 12,
                set: function (element, fontSize) {
                    element.css('font-size', fontSize + 'pt');
                },
                preview: function (options, fontSize) {
                    options.labelCss.fontSize = Utils.minMax(fontSize, 8, 24) + 'pt';
                }
            },

            bold: {
                def: false,
                set: function (element, state) {
                    element.css('font-weight', state ? 'bold' : 'normal');
                },
                preview: function (options, state) {
                    options.labelCss.fontWeight = state ? 'bold' : 'normal';
                }
            },

            italic: {
                def: false,
                set: function (element, state) {
                    element.css('font-style', state ? 'italic' : 'normal');
                },
                preview: function (options, state) {
                    options.labelCss.fontStyle = state ? 'italic' : 'normal';
                }
            },

            underline: {
                def: false,
                set: function (element, state) {
                    var value = element.css('text-decoration');
                    element.css('text-decoration', Utils.toggleToken(value, 'underline', state, 'none'));
                },
                preview: function (options, state) {
                    var value = options.labelCss.textDecoration || '';
                    options.labelCss.textDecoration = Utils.toggleToken(value, 'underline', state, 'none');
                }
            },

            color: {
                def: Color.AUTO,
                // color will be set in update handler, depending on fill colors
                preview: function (options, color) {
                    options.labelCss.color = this.getCssColor(color, 'text');
                }
            },

            fillcolor: {
                def: Color.AUTO,
                set: function (element, color) {
                    element.css('background-color', this.getCssColor(color, 'fill'));
                }
            },

            // special attributes

            highlight: {
                def: false,
                set: function (element, state) {
                    element.toggleClass('highlight', state);
                },
                special: true
            }

        };

    // private global functions ===============================================

    /**
     * Will be called for every element whose character attributes have been
     * changed.
     *
     * @param {jQuery} node
     *  The paragraph child node whose character attributes have been changed,
     *  as jQuery object. May be a text field or a list label node, in that
     *  case the text span contained in the node will be iterated. Other child
     *  nodes of the paragraph (e.g. objects, helper nodes) will be ignored
     *  silently.
     *
     * @param {Object} attributes
     *  A map of all attributes (name/value pairs), containing the
     *  effective attribute values merged from style sheets and explicit
     *  attributes.
     */
    function updateCharacterFormatting(node, attributes) {

        var // the parent paragraph of the node (may be a grandparent)
            paragraph = $(node).closest(DOM.PARAGRAPH_NODE_SELECTOR),
            // the current theme
            theme = this.getDocumentStyles().getCurrentTheme(),
            // the paragraph style container
            paragraphStyles = this.getDocumentStyles().getStyleSheets('paragraph'),
            // the merged attributes of the paragraph
            paragraphAttributes = paragraphStyles.getElementAttributes(paragraph);

        // calculate text color (automatic color depends on fill colors)
        Color.setElementTextColor(node, theme, attributes, paragraphAttributes);

        // update calculated line height due to changed font settings
        LineHeight.updateElementLineHeight(node, paragraphAttributes.lineheight);

        // try to merge with the preceding text span
        CharacterStyles.mergeSiblingTextSpans(node, false);
    }

    /**
     * Returns whether the passed text nodes contain equal character
     * formatting attributes.
     */
    function hasEqualAttributes(textNode1, textNode2) {
        return StyleSheets.hasEqualElementAttributes(textNode1.parentNode, textNode2.parentNode);
    }

    /**
     * Iterates over all text nodes covered by the passed DOM ranges and
     * calls the passed iterator function for their parent <span> elements.
     */
    function iterateTextSpans(ranges, iterator, context) {
        return DOM.iterateTextPortionsInRanges(ranges, function (textNode) {
            return iterator.call(context, textNode.parentNode);
        }, context);
    }

    // class CharacterStyles ==================================================

    /**
     * Contains the style sheets for character formatting attributes. The CSS
     * formatting will be written to text span elements contained somewhere in
     * the paragraph elements.
     *
     * @constructor
     *
     * @extends StyleSheets
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing all elements formatted by the style sheets of
     *  this container. If this object is a jQuery collection, uses the first
     *  node it contains.
     *
     * @param {DocumentStyles} documentStyles
     *  Collection with the style containers of all style families.
     */
    function CharacterStyles(rootNode, documentStyles) {

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, 'character', undefined, DEFINITIONS, {
            parentStyleFamily: 'paragraph'
        });

        // methods ------------------------------------------------------------

        /**
         * Iterates over all text nodes covered by the passed DOM ranges and
         * calls the passed iterator function for their parent <span> elements.
         */
        this.iterateReadOnly = function (ranges, iterator, context) {
            return iterateTextSpans(ranges, iterator, context);
        };

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateCharacterFormatting);

    } // class CharacterStyles

    // static methods ---------------------------------------------------------

    /**
     * Tries to merge the passed text span with its next or previous sibling
     * text span. To be able to merge two text spans, they must contain equal
     * formatting attributes. If merging was successful, the sibling span will
     * be removed from the DOM.
     *
     * @param {HTMLElement|jQuery} node
     *  The DOM node to be merged with its sibling text span. If this object is
     *  a jQuery object, uses the first DOM node it contains.
     *
     * @param {Boolean} next
     *  If set to true, will try to merge with the next span, otherwise with
     *  the previous text span.
     */
    CharacterStyles.mergeSiblingTextSpans = function (node, next) {

        var // the sibling text span, depending on the passed direction
            sibling = null,
            // text in the passed and in the sibling node
            text = null, siblingText = null;

        // passed node and sibling node, as DOM nodes
        node = Utils.getDomNode(node);
        sibling = node[next ? 'nextSibling' : 'previousSibling'];

        // both nodes must be text spans with the same attributes
        if (DOM.isTextSpan(node) && DOM.isTextSpan(sibling) && StyleSheets.hasEqualElementAttributes(node, sibling)) {

            // add text of the sibling text node to the passed text node
            text = node.firstChild.nodeValue;
            siblingText = sibling.firstChild.nodeValue;
            node.firstChild.nodeValue = next ? (text + siblingText) : (siblingText + text);

            // remove the entire sibling span element
            $(sibling).remove();
        }
    };

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: CharacterStyles });

});
