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

define('io.ox/office/editor/format/paragraphstyles',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/format/lineheight',
     'io.ox/office/editor/format/formatter',
     'io.ox/office/editor/format/stylesheets',
     'io.ox/office/editor/format/characterstyles'
    ], function (Utils, DOM, LineHeight, Formatter, StyleSheets, CharacterStyles) {

    'use strict';

    var // default attributes for paragraph style sheets (contains all character pool attributes)
        pool = _.extend(CharacterStyles.StyleSheetPool, {
            alignment: 'left',
            lineheight: LineHeight.SINGLE
        }),

        // the CSS formatter for paragraph attributes
        formatter = new Formatter({

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
                    return LineHeight.validateLineHeight(lineHeight);
                },
                set: function (element, lineHeight) {
                    lineHeight = LineHeight.validateLineHeight(lineHeight);
                    $(element).data('lineheight', lineHeight).children('span').each(function () {
                        $(this).data('lineheight', lineHeight);
                        LineHeight.setElementLineHeight(this, lineHeight);
                    });
                }
            }

        });

    // class ParagraphStyles ==================================================

    /**
     * Contains the style sheets for paragraph formatting attributes. The CSS
     * formatting will be read from and written to paragraph <p> elements.
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
    function ParagraphStyles(rootNode) {

        // private methods ----------------------------------------------------

        /**
         * Iterates over all paragraph elements covered by the passed DOM
         * ranges and calls the passed iterator function.
         */
        function iterate(ranges, iterator, context) {
            return DOM.iterateAncestorNodesInRanges(ranges, rootNode, 'p', iterator, context);
        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, pool, 'parastyle', formatter, iterate, iterate);

    } // class ParagraphStyles

    // static fields ----------------------------------------------------------

    /**
     * Default attributes for paragraph style sheets. Contains all default
     * attributes for characters.
     */
    ParagraphStyles.StyleSheetPool = pool;

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: ParagraphStyles });

});
