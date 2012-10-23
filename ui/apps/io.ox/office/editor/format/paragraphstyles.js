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
     'io.ox/office/editor/format/stylesheets',
     'io.ox/office/editor/format/color'
    ], function (Utils, DOM, LineHeight, StyleSheets, Color) {

    'use strict';

    var // definitions for paragraph attributes
        definitions = {

            alignment: {
                def: 'left',
                set: function (element, value) {
                    element.css('text-align', value);
                },
                preview: function (options, value) {
                    options.css.textAlign = value;
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
                    // use the iterator go get all child nodes that need to be formatted
                    iterateChildNodes(element, function (node) {
                        LineHeight.setElementLineHeight($(node), lineHeight);
                    });
                }
            },

            fillcolor: {
                def: Color.AUTO, // auto for paragraph fill resolves to 'transparent'
                set: function (element, color) {
                    element.css('background-color', this.getCssColor(color, 'fill'));
                }
            },

            ilvl: {
                def: -1,
                set: function (element, value) {
                }
            },

            numId: {
                def: -1,
                set: function (element, value) {
                }
            }

        };

    // global private functions ===============================================

    /**
     * Visits all child nodes of the passed paragraph.
     */
    function iterateChildNodes(paragraph, iterator, context) {
        return Utils.iterateSelectedDescendantNodes(paragraph, 'span, ' + DOM.LIST_LABEL_NODE_SELECTOR, iterator, context, { children: true });
    }

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
     *
     * @param {DocumentStyles} documentStyles
     *  Collection with the style containers of all style families.
     */
    function ParagraphStyles(rootNode, documentStyles) {

        var // self reference
            self = this;

        // private methods ----------------------------------------------------

        /**
         * Will be called for every paragraph whose attributes have been
         * changed.
         *
         * @param {jQuery} para
         *  The <p> element whose character attributes have been changed, as
         *  jQuery object.
         *
         * @param {Object} attributes
         *  A map of all attributes (name/value pairs), containing the
         *  effective attribute values merged from style sheets and explicit
         *  attributes.
         */
        function updateParagraphFormatting(para, attributes) {
            // take care of numberings
            // always remove an existing label
            // TODO: it might make more sense to change the label appropriately
            $(para).children(DOM.LIST_LABEL_NODE_SELECTOR).remove();
            $(para).css('margin-left', '');
            if (attributes.ilvl !== -1 && attributes.numId !== -1) {
//                var allNumberingElementsInDoc = $(rootNode).find('div.list-label');
//                var numNodeIndex = 0;
//                for (; numNodeIndex < allNumberingElementsInDoc.length; numNodeIndex++) {
//                    var numPara = $(allNumberingElementsInDoc[numNodeIndex]).parent();
//
//                }

                var listObject = self.getDocumentStyles().getLists().formatNumber(attributes.numId, attributes.ilvl, [0]);
                var numberingElement = DOM.createListLabelNode(listObject.text);
                if (listObject.indent > 0) {
                    para.css('margin-left', Utils.convertHmmToLength(listObject.indent, 'pt'));
                }
                if (listObject.labelWidth > 0) {
                    numberingElement.css('width', Utils.convertHmmToLength(listObject.labelWidth, 'pt'));
                }
                $(para).prepend(numberingElement);
            }
        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, 'paragraph', DOM.PARAGRAPH_NODE_SELECTOR, definitions, {
            updateHandler: updateParagraphFormatting,
            childStyleFamily: 'character',
            childNodeIterator: iterateChildNodes
        });

        // methods ------------------------------------------------------------

        /**
         * Iterates over all paragraph elements covered by the passed DOM
         * ranges for read-only access and calls the passed iterator function.
         */
        this.iterateReadOnly = function (ranges, iterator, context) {
            // DOM.iterateAncestorNodesInRanges() passes the current element to
            // the passed iterator function exactly as expected
            return DOM.iterateAncestorNodesInRanges(ranges, rootNode, DOM.PARAGRAPH_NODE_SELECTOR, iterator, context);
        };

        /**
         * Iterates over all paragraph elements covered by the passed DOM
         * ranges for read/write access and calls the passed iterator function.
         */
        this.iterateReadWrite = this.iterateReadOnly;

    } // class ParagraphStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: ParagraphStyles });

});
