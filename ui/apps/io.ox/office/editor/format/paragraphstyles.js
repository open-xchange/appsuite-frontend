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

    function initBorder(border) {
        if (!border.style) {
            border.width = border.color = border.space = undefined;
        } else {
            if (!border.width)
                border.width = 0;
            if (!border.space)
                border.space = 0;
            if (!border.color)
                border.color = 'auto';
        }
    }
    var // definitions for paragraph attributes
        DEFINITIONS = {

            alignment: {
                def: 'left',
                format: function (element, value) {
                    element.css('text-align', value);
                },
                preview: function (options, value) {
                    options.css.textAlign = value;
                }
            },

            fillcolor: {
                def: Color.AUTO, // auto for paragraph fill resolves to 'transparent'
                format: function (element, color) {
                    element.css('background-color', this.getCssColor(color, 'fill'));
                }
            },

            /**
             * Line height relative to font settings. The CSS attribute
             * 'line-height' must be set separately at every descendant text
             * span because a relative line height (e.g. 200%) would not be
             * derived from the paragraph relatively to the spans, but
             * absolutely according to the paragraph's font size. Example: The
             * paragraph has a font size of 12pt and a line-height of 200%,
             * resulting in 24pt. This value will be derived absolutely to a
             * span with a font size of 6pt, resulting in a relative line
             * height of 24pt/6pt = 400% instead of the expected 200%.
             */
            lineheight: { def: LineHeight.SINGLE },

            ilvl: { def: -1 },

            numId: { def: -1 },

            outlinelvl: { def: 9 },

            tabstops: {
                def: [],
                merge: function (tabstops1, tabstops2) {
                    // Merge tabstops2 into array tabstop1
                    // Support to clear tab stops defined in tabstops1
                    var clearedTabstops = _.filter(tabstops2, function (tabstop) {
                            return tabstop.value === 'clear';
                        }),
                        additionalTabstops = _.filter(tabstops2, function (tabstop) {
                            return tabstop.value !== 'clear';
                        }),
                        newTabstops = _.union(tabstops1, additionalTabstops);

                    // Filter out cleared tabstops
                    if (clearedTabstops.length > 0) {
                        newTabstops = _.filter(newTabstops, function (tabstop) {
                            return _.find(clearedTabstops, function (cleared) {
                                return cleared.pos !== tabstop.pos;
                            });
                        });
                    }

                    // Sort tabstops by position
                    return _.sortBy(newTabstops, function (tabstop) {
                        return tabstop.pos;
                    });
                }
            },
            borderleft: {
                def: {},
                format: function (element, border) {
                    initBorder(border);
                }
            },
            borderright: {
                def: {},
                format: function (element, border) {
                    initBorder(border);
                }
            },
            bordertop: {
                def: {},
                format: function (element, border) {
                    initBorder(border);
                }
            },
            borderbottom: {
                def: {},
                format: function (element, border) {
                    initBorder(border);
                }
            },
            borderinside: {
                def: {},
                format: function (element, border) {
                    initBorder(border);
                }
            }
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
     *
     * @param {DocumentStyles} documentStyles
     *  Collection with the style containers of all style families.
     */
    function ParagraphStyles(rootNode, documentStyles) {

        var // self reference
            self = this;

        // private methods ----------------------------------------------------

        /**
         * Will be called for every paragraph whose character attributes have
         * been changed.
         *
         * @param {jQuery} paragraph
         *  The paragraph node whose attributes have been changed, as jQuery
         *  object.
         *
         * @param {Object} attributes
         *  A map of all attributes (name/value pairs), containing the
         *  effective attribute values merged from style sheets and explicit
         *  attributes.
         */
        function updateParagraphFormatting(paragraph, attributes) {

            var // the character styles/formatter
                characterStyles = self.getDocumentStyles().getStyleSheets('character');

            // Always update character formatting of all child nodes which may
            // depend on paragraph settings, e.g. automatic text color which
            // depends on the paragraph fill color. Also visit all helper nodes
            // containing text spans, e.g. numbering labels.
            Utils.iterateDescendantNodes(paragraph, function (node) {
                DOM.iterateTextSpans(node, function (span) {
                    characterStyles.updateElementFormatting(span);
                });
            }, undefined, { children: true });
            var leftMargin = 0,
                rightMargin = 0;
            // update borders
            var prevParagraph = $(paragraph).prev(),
                prevAttributes = prevParagraph ? self.getElementAttributes(prevParagraph) : {};
            var nextParagraph = $(paragraph).next(),
                nextAttributes = nextParagraph ? self.getElementAttributes(nextParagraph) : {};

            function isBorderEqual(attributes1, attributes2) {
                var ret = _.isEqual(attributes1.borderleft, attributes2.borderleft) &&
                _.isEqual(attributes1.borderright, attributes2.borderright) &&
                _.isEqual(attributes1.bordertop, attributes2.bordertop) &&
                _.isEqual(attributes1.borderbottom, attributes2.borderbottom) &&
                _.isEqual(attributes1.borderinside, attributes2.borderinside);
                return ret;
            }
            function setBorder(border, position) {
                var space = border && border.space ? border.space : 0;
                paragraph.css('padding-' + position, space ? (space / 100 + 'mm') : '');
                paragraph.css('border-' + position, border ? self.getCssBorder(border) : '');
                return -space;
            }
            leftMargin += setBorder(attributes.borderleft, 'left');
            rightMargin += setBorder(attributes.borderright, 'right');
            //top border is not set if previous paragraph uses the same border settings
            var equalToPrevBorder = isBorderEqual(attributes, prevAttributes);
            if (equalToPrevBorder) {
                setBorder(undefined, 'top');
                prevParagraph.css("padding-bottom", this.getCssBorder(attributes.borderinside.space));
                prevParagraph.css("border-bottom", this.getCssBorder(attributes.borderinside));
            } else {
                setBorder(attributes.bordertop, 'top');
            }
            var equalToNextBorder = isBorderEqual(attributes, nextAttributes);
            //bottom border is replaced by inner border next paragraph uses the same border settings
            setBorder(equalToNextBorder ? attributes.borderinside : attributes.borderbottom, 'bottom');

            //calculate list indents
            var numId = attributes.numId;
            if (numId  !== -1) {
                var ilvl = attributes.ilvl,
                     lists = documentStyles.getLists();
                if (ilvl < 0) {
                    // is a numbering level assigned to the current paragraph style?
                    ilvl = lists.findIlvl(numId, attributes.style);
                }
                if (ilvl !== -1 && ilvl < 9) {
                    var listItemCounter = [0, 0, 0, 0, 0, 0, 0, 0, 0];
                    //updateParaTabstops = true;
                    var listObject = lists.formatNumber(attributes.numId, ilvl, listItemCounter);

                    if (listObject.indent > 0) {
                        leftMargin += listObject.indent;
                    }
                }
            }
            //now set left/right margins
            paragraph.css('margin-left', leftMargin / 100 + 'mm');
            paragraph.css('margin-right', rightMargin / 100  + 'mm');

        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, 'paragraph', DEFINITIONS);

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateParagraphFormatting);
        this.registerParentStyleFamily('cell', function (paragraph) { return paragraph.parent().filter('td'); });

    } // class ParagraphStyles

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: ParagraphStyles });

});
