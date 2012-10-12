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
        definitions = {

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
                    var value = options.labelCss.textDecoration;
                    options.labelCss.textDecoration = Utils.toggleToken(value, 'underline', state, 'none');
                }
            },

            highlight: {
                def: false,
                set: function (element, state) {
                    element.toggleClass('highlight', state);
                },
                special: true
            },

            color: {
                def: '000000',
                set: function (element, value) {
                    var rgbColor;
                    if (value.type)
                        rgbColor = Color.getRGBColor(value, this.getDocumentStyles().getThemes());
                    element.css('color', '#' + rgbColor);
                }
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
     *
     * @param {DocumentStyles} documentStyles
     *  Collection with the style containers of all style families.
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
        function iterateTextSpans(ranges, iterator, context, readWrite) {

            var // options for DOM.iterateTextPortionsInRanges() depending on read/write mode
                options = readWrite ? { split: true, merge: hasEqualAttributes } : undefined;

            return DOM.iterateTextPortionsInRanges(ranges, function (textNode) {
                return iterator.call(context, textNode.parentNode);
            }, context, options);
        }

        /**
         * Will be called for every text span whose attributes have been
         * changed.
         *
         * @param {jQuery} span
         *  The <span> element whose character attributes have been changed, as
         *  jQuery object.
         *
         * @param {Object} attributes
         *  A map of all attributes (name/value pairs), containing the
         *  effective attribute values merged from style sheets and explicit
         *  attributes.
         */
        function updateSpanFormatting(span, attributes) {
            // update calculated line height due to changed font settings
            LineHeight.updateElementLineHeight(span);
        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, 'character', definitions, documentStyles, {
            globalSetHandler: updateSpanFormatting,
            ancestorStyleFamily: 'paragraph',
            ancestorElementResolver: function (span) { return span.parentNode; }
        });

        // methods ------------------------------------------------------------

        this.getDocumentStyles = function () {
            return documentStyles;
        };
        
        /**
         * Iterates over all text nodes covered by the passed DOM ranges and
         * calls the passed iterator function for their parent <span> elements.
         */
        this.iterateReadOnly = function (ranges, iterator, context) {
            return iterateTextSpans(ranges, iterator, context, false);
        };

        /**
         * Iterates over all text nodes covered by the passed DOM ranges and
         * calls the passed iterator function for their parent <span> elements.
         * Splits the text nodes that are covered partly before calling the
         * iterator, and tries to merge sibling text nodes with equal character
         * formatting after calling the iterator.
         */
        this.iterateReadWrite = function (ranges, iterator, context) {
            return iterateTextSpans(ranges, iterator, context, true);
        };

    } // class CharacterStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: CharacterStyles });

});
