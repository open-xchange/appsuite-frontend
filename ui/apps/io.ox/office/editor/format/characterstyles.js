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
                def: 'sans-serif',
                set: function (element, fontName) {
                    element.css('font-family', Fonts.getCssFontFamily(fontName));
                    LineHeight.updateElementLineHeight(element);
                }
            },

            fontsize: {
                def: 12,
                set: function (element, fontSize) {
                    element.css('font-size', fontSize + 'pt');
                    LineHeight.updateElementLineHeight(element);
                }
            },

            bold: {
                def: false,
                set: function (element, state) {
                    element.css('font-weight', state ? 'bold' : 'normal');
                    LineHeight.updateElementLineHeight(element);
                }
            },

            italic: {
                def: false,
                set: function (element, state) {
                    element.css('font-style', state ? 'italic' : 'normal');
                    LineHeight.updateElementLineHeight(element);
                }
            },

            underline: {
                def: false,
                set: function (element, state) {
                    var value = element.css('text-decoration');
                    value = Utils.toggleToken(value, 'underline', state, 'none');
                    element.css('text-decoration', value);
                }
            },

            highlight: {
                def: false,
                set: function (element, state) {
                    element.toggleClass('highlight', state);
                },
                special: true
            }

        },

        // TODO: remove this workaround name mapping (makes German DOCX files work)
        alternativeStyleNames = {
            schwachehervorhebung: 'Subtle Emphasis',
            hervorhebung: 'Emphasis',
            intensivehervorhebung: 'Intense Emphasis',
            fett: 'Bold'
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
    function CharacterStyles(rootNode, documentStyles) {

        // private methods ----------------------------------------------------

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

        /**
         * Collects character styles specified in the paragraph style sheet of
         * the parent paragraph element of the passed text span.
         */
        function collectAncestorStyleAttributes(span) {
            var paragraphStyles = documentStyles.getStyleSheets('paragraph');
            return paragraphStyles.getElementStyleAttributes(span.parentNode);
        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, definitions, iterateReadOnly, iterateReadWrite, 'charstyle', {
            alternativeStyleNames: alternativeStyleNames,
            collectAncestorStyleAttributes: collectAncestorStyleAttributes
        });

        // initialization -----------------------------------------------------

        // TODO: move these default styles to a 'newDocument' operation
        this.addStyleSheet('Standard', null, null, true)
            .addStyleSheet('Emphasis', 'Standard', { italic: true })
            .addStyleSheet('Subtle Emphasis', 'Emphasis', null)
            .addStyleSheet('Intense Emphasis', 'Emphasis', { bold: true })
            .addStyleSheet('Bold', 'Standard', { bold: true });

    } // class CharacterStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: CharacterStyles });

});
