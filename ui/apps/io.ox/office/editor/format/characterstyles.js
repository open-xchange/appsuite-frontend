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
     'io.ox/office/editor/format/stylesheets'
    ], function (Utils, Fonts, DOM, LineHeight, StyleSheets) {

    'use strict';

    var // definitions for character attributes
        definitions = {

            fontname: {
                value: 'serif',
                set: function (element, fontName) {
                    element.css('font-family', Fonts.getCssFontFamily(fontName));
                    LineHeight.updateElementLineHeight(element);
                }
            },

            fontsize: {
                value: 12,
                set: function (element, fontSize) {
                    element.css('font-size', fontSize + 'pt');
                    LineHeight.updateElementLineHeight(element);
                }
            },

            bold: {
                value: false,
                set: function (element, state) {
                    element.css('font-weight', state ? 'bold' : 'normal');
                    LineHeight.updateElementLineHeight(element);
                }
            },

            italic: {
                value: false,
                set: function (element, state) {
                    element.css('font-style', state ? 'italic' : 'normal');
                    LineHeight.updateElementLineHeight(element);
                }
            },

            underline: {
                value: false,
                set: function (element, state) {
                    var value = element.css('text-decoration');
                    value = Utils.toggleToken(value, 'underline', state, 'none');
                    element.css('text-decoration', value);
                }
            },

            highlight: {
                value: false,
                set: function (element, state) {
                    element.toggleClass('highlight', state);
                },
                special: true
            }

        };

    // class CharacterStyles ==================================================

    /**
     * Contains the style sheets for character formatting attributes. The CSS
     * formatting will be read from and written to <span> elements contained in
     * paragraph <p> elements.
     *
     * @constructor
     *
     * @extends StyleSheets
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing all elements formatted by the style sheets of
     *  this container. If this object is a jQuery collection, uses the first
     *  node it contains.
     */
    function CharacterStyles(rootNode) {

        // private methods ----------------------------------------------------

        /**
         * Returns whether the passed text nodes contain equal character
         * formatting attributes.
         */
        function hasEqualAttributes(textNode1, textNode2) {
            return StyleSheets.hasEqualAttributes(textNode1.parentNode, textNode2.parentNode);
        }

        /**
         * Iterates over all text nodes covered by the passed DOM ranges and
         * calls the passed iterator function for their parent <span> elements.
         */
        function iterateReadOnly(ranges, iterator, context) {
            return DOM.iterateTextPortionsInRanges(ranges, function (textNode) {
                return iterator.call(context, textNode.parentNode);
            }, context);
        }

        /**
         * Iterates over all text nodes covered by the passed DOM ranges and
         * calls the passed iterator function for their parent <span> elements.
         * Splits the text nodes that are covered partly before calling the
         * iterator, and tries to merge sibling text nodes with equal character
         * formatting after calling the iterator.
         */
        function iterateReadWrite(ranges, iterator, context) {
            return DOM.iterateTextPortionsInRanges(ranges, function (textNode, start, end, range) {
                if (!range.isCollapsed()) {
                    return iterator.call(context, textNode.parentNode);
                }
            }, context, { split: true, merge: hasEqualAttributes });
        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, definitions, iterateReadOnly, iterateReadWrite, 'charstyle');

    } // class CharacterStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: CharacterStyles });

});
