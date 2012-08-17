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
     'io.ox/office/editor/format/formatter',
     'io.ox/office/editor/format/stylesheets'
    ], function (Utils, Fonts, DOM, LineHeight, Formatter, StyleSheets) {

    'use strict';

    // private static functions ===============================================

    /**
     * Updates the text line height of the specified element according to its
     * current font settings.
     *
     * @param {HTMLElement} element
     *  The DOM element whose line height will be updated.
     */
    function updateElementLineHeight(element) {

        var // read line height from element
            lineHeight = $(element).data('lineheight') || LineHeight.SINGLE;

        LineHeight.setElementLineHeight(element, lineHeight);
    }

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
         * formatting.
         */
        function hasEqualAttributes(textNode1, textNode2) {
            return CharacterStyles.Formatter.hasEqualElementAttributes(textNode1.parentNode, textNode2.parentNode);
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
            return DOM.iterateTextPortionsInRanges(ranges, function (textNode) {
                return iterator.call(context, textNode.parentNode);
            }, context, { split: true, merge: hasEqualAttributes });
        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, CharacterStyles.StyleSheetPool, CharacterStyles.Formatter, iterateReadOnly, iterateReadWrite);

    } // class CharacterStyles

    // static fields ----------------------------------------------------------

    /**
     * Default attributes for character style sheets.
     */
    CharacterStyles.StyleSheetPool = {
        fontname: 'Times New Roman',
        fontsize: 12,
        bold: false,
        italic: false,
        underline: false
    };

    /**
     * The CSS formatter for character attributes.
     */
    CharacterStyles.Formatter = new Formatter({

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

    });

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: CharacterStyles });

});
