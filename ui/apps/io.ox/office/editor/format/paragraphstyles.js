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
     'io.ox/office/editor/format/stylesheets'
    ], function (Utils, DOM, LineHeight, StyleSheets) {

    'use strict';

    var // definitions for paragraph attributes
        definitions = {

            alignment: {
                def: 'left',
                set: function (element, value) {
                    element.css('text-align', value);
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
                def: LineHeight.SINGLE,
                set: function (element, lineHeight) {
                    lineHeight = LineHeight.validateLineHeight(lineHeight);
                    element.children('span').each(function () {
                        LineHeight.setElementLineHeight($(this), lineHeight);
                    });
                }
            }

        },

        // TODO: remove this workaround name mapping (makes German DOCX files work)
        alternativeStyleNames = {
            titel: 'Title',
            untertitel: 'Subtitle',
            berschrift1: 'Heading 1',
            berschrift2: 'Heading 2',
            berschrift3: 'Heading 3',
            berschrift4: 'Heading 4',
            berschrift5: 'Heading 5',
            berschrift6: 'Heading 6',
            zitat: 'Quote',
            intensiveszitat: 'Intense Quote'
        };

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
    function ParagraphStyles(rootNode, documentStyles) {

        // private methods ----------------------------------------------------

        /**
         * Iterates over all paragraph elements covered by the passed DOM
         * ranges and calls the passed iterator function.
         */
        function iterate(ranges, iterator, context) {
            return DOM.iterateAncestorNodesInRanges(ranges, rootNode, 'p', iterator, context);
        }

        /**
         * Updates the CSS formatting of the text spans in a paragraph when the
         * paragraph style sheet has been changed.
         */
        function updateDescendantStyleAttributes(paragraph) {
            var characterStyles = documentStyles.getStyleSheets('character'),
                ranges = [DOM.Range.createRangeForNode(paragraph)];
            characterStyles.updateFormattingInRanges(ranges);
        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, definitions, iterate, iterate, 'parastyle', {
            alternativeStyleNames: alternativeStyleNames,
            updateDescendantStyleAttributes: updateDescendantStyleAttributes
        });

        // initialization -----------------------------------------------------

        // TODO: move these default styles to a 'newDocument' operation
        this.addStyleSheet('Standard', null, { fontname: 'Open Sans', fontsize: 11 }, true)
            .addStyleSheet('Title', 'Standard', { alignment: 'center', fontname: 'Georgia', fontsize: 26, bold: true })
            .addStyleSheet('Subtitle', 'Standard', { alignment: 'center', fontname: 'Georgia', fontsize: 12, italic: true })
            .addStyleSheet('Heading 1', 'Standard', { fontname: 'Georgia', fontsize: 16, bold: true })
            .addStyleSheet('Heading 2', 'Standard', { fontname: 'Georgia', fontsize: 14, bold: true })
            .addStyleSheet('Heading 3', 'Standard', { fontname: 'Georgia', fontsize: 13, bold: true })
            .addStyleSheet('Heading 4', 'Standard', { fontname: 'Georgia', fontsize: 13, bold: true, italic: true })
            .addStyleSheet('Heading 5', 'Standard', { fontname: 'Georgia', fontsize: 12, bold: true })
            .addStyleSheet('Heading 6', 'Standard', { fontname: 'Georgia', fontsize: 12, bold: true, italic: true })
            .addStyleSheet('Quote', 'Standard', { italic: true })
            .addStyleSheet('Intense Quote', 'Quote', { bold: true });

    } // class ParagraphStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: ParagraphStyles });

});
