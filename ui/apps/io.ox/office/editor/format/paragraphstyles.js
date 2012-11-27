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

            fillColor: {
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
            lineHeight: { def: LineHeight.SINGLE },

            indentLevel: { def: -1 },

            numId: { def: -1 },

            outlineLevel: { def: 9 },

            tabStops: {
                def: [],
                merge: function (tabStops1, tabStops2) {
                    // Merge tabStops2 into array tabstop1
                    // Support to clear tab stops defined in tabStops1
                    var clearedTabstops = _.filter(tabStops2, function (tabstop) {
                            return tabstop.value === 'clear';
                        }),
                        additionalTabstops = _.filter(tabStops2, function (tabstop) {
                            return tabstop.value !== 'clear';
                        }),
                        newTabstops = _.union(tabStops1, additionalTabstops);

                    // Filter out cleared tabStops
                    if (clearedTabstops.length > 0) {
                        newTabstops = _.filter(newTabstops, function (tabstop) {
                            return _.find(clearedTabstops, function (cleared) {
                                return cleared.pos !== tabstop.pos;
                            });
                        });
                    }

                    // Sort tabStops by position
                    return _.sortBy(newTabstops, function (tabstop) {
                        return tabstop.pos;
                    });
                }
            },

            borderLeft: {
                def: {},
                format: function (element, border) {
                    initBorder(border);
                }
            },

            borderRight: {
                def: {},
                format: function (element, border) {
                    initBorder(border);
                }
            },

            borderTop: {
                def: {},
                format: function (element, border) {
                    initBorder(border);
                }
            },

            borderBottom: {
                def: {},
                format: function (element, border) {
                    initBorder(border);
                }
            },

            borderInside: {
                def: {},
                format: function (element, border) {
                    initBorder(border);
                }
            },
            indentFirstLine: {
                def: 0
            },

            indentLeft: {
                def: 0
            },

            indentRight: {
                def: 0
            },

            marginTop: {
                def: 0
            },

            marginBottom: {
                def: 0
            },

            contextualSpacing: {
                def: false
            }
        },

        // parent families with parent element resolver functions
        PARENT_FAMILIES = {
            cell: function (paragraph) { return DOM.isCellContentNode(paragraph.parent()) ? paragraph.closest('td') : null; }
        };

    // private static functions ===============================================

    function isMergeBorders(attributes1, attributes2) {
        return (attributes1.borderLeft.style !== 'none' ||
                attributes1.borderRight.style !== 'none' ||
                attributes1.borderTop.style  !== 'none' ||
                attributes1.borderBottom.style  !== 'none' ||
                attributes1.borderInside.style !== 'none') &&
                Utils.hasEqualAttributes(attributes1, attributes2, ['borderLeft', 'borderRight', 'borderTop', 'borderBottom', 'borderInside',
                                                                    'numId', 'indentLeft', 'indentRight', 'indentFirstLine']);
    }

    function initBorder(border) {
        if (!border.style) {
            border.style = 'none';
        }
        if (border.style === 'none') {
            delete border.width;
            delete border.color;
            delete border.space;
        } else {
            if (!border.width)
                border.width = 0;
            if (!border.space)
                border.space = 0;
            if (!border.color)
                border.color = 'auto';
        }
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
         * Will be called for every paragraph whose character attributes have
         * been changed.
         *
         * @param {jQuery} paragraph
         *  The paragraph node whose attributes have been changed, as jQuery
         *  object.
         *
         * @param {Object} mergedAttributes
         *  A map of attribute maps (name/value pairs), keyed by attribute
         *  family, containing the effective attribute values merged from style
         *  sheets and explicit attributes.
         */
        function updateParagraphFormatting(paragraph, mergedAttributes) {

            var // the paragraph attributes of the passed attribute map
                paragraphAttributes = mergedAttributes.paragraph,
                // the character styles/formatter
                characterStyles = documentStyles.getStyleSheets('character'),

                leftMargin = 0,
                rightMargin = 0,

                prevParagraph = paragraph.prev(),
                prevAttributes = (prevParagraph.length > 0) ? self.getElementAttributes(prevParagraph).paragraph : {},

                nextParagraph = paragraph.next(),
                nextAttributes = (nextParagraph.length > 0) ? self.getElementAttributes(nextParagraph).paragraph : {};

            function setBorder(border, position, addSpace) {
                var space = addSpace + ((border && border.space) ? border.space : 0);
                paragraph.css('padding-' + position, Utils.convertHmmToCssLength(space, 'px'));
                paragraph.css('border-' + position, self.getCssBorder(border));
                return -space;
            }

            // Always update character formatting of all child nodes which may
            // depend on paragraph settings, e.g. automatic text color which
            // depends on the paragraph fill color. Also visit all helper nodes
            // containing text spans, e.g. numbering labels.
            Utils.iterateDescendantNodes(paragraph, function (node) {
                DOM.iterateTextSpans(node, function (span) {
                    characterStyles.updateElementFormatting(span);
                });
            }, undefined, { children: true });

            // update borders
            var leftPadding = paragraphAttributes.borderLeft && paragraphAttributes.borderLeft.space ? paragraphAttributes.borderLeft.space : 0;
            leftMargin += setBorder(paragraphAttributes.borderLeft, 'left', 0);
            rightMargin += setBorder(paragraphAttributes.borderRight, 'right', 0);

            var topMargin = paragraphAttributes.marginTop;
            var bottomMargin = paragraphAttributes.marginBottom;

            // top border is not set if previous paragraph uses the same border settings
            if (isMergeBorders(paragraphAttributes, prevAttributes)) {
                setBorder({ style: 'none' }, 'top', topMargin);
                prevParagraph.css("padding-bottom", this.getCssBorder(paragraphAttributes.borderInside.space + bottomMargin));
                prevParagraph.css("border-bottom", this.getCssBorder(paragraphAttributes.borderInside));
                prevParagraph.css('margin-bottom', 0);
                topMargin = 0;
            } else {
                setBorder(paragraphAttributes.borderTop, 'top', 0);
            }

            // bottom border is replaced by inner border if next paragraph uses the same border settings
            if (isMergeBorders(paragraphAttributes, nextAttributes)) {
                setBorder(paragraphAttributes.borderInside, 'bottom');
                prevParagraph.css("padding-bottom", this.getCssBorder(bottomMargin));
                bottomMargin = 0;
            } else {
                setBorder(paragraphAttributes.borderBottom, 'bottom', 0);
            }

            //calculate list indents
            var numId = paragraphAttributes.numId;
            if (numId  !== -1) {
                var indentLevel = paragraphAttributes.indentLevel,
                     lists = documentStyles.getLists();
                if (indentLevel < 0) {
                    // is a numbering level assigned to the current paragraph style?
                    indentLevel = lists.findIlvl(numId, paragraphAttributes.style);
                }
                if (indentLevel !== -1 && indentLevel < 9) {
                    var listItemCounter = [0, 0, 0, 0, 0, 0, 0, 0, 0];
                    //updateParaTabstops = true;
                    var listObject = lists.formatNumber(paragraphAttributes.numId, indentLevel, listItemCounter);

                    if (listObject.indent > 0) {
                        leftPadding += listObject.firstLine;
                        leftMargin += listObject.indent - listObject.firstLine;
                    }
                    var listLabel = $(paragraph).children(DOM.LIST_LABEL_NODE_SELECTOR);
                    if (listLabel.length) {
                        var listSpan = listLabel.children('span');
                        if (listObject.fontSize)
                            listSpan.css('font-size', listObject.fontSize + 'pt');
                        if (listObject.color)
                            Color.setElementTextColor(listSpan, documentStyles.getCurrentTheme(),  listObject, paragraphAttributes);
                    }
                }
            }

            // paragraph margin attributes - not applied if paragraph is in a list
            var textIndent = 0;
            if (numId < 0) {
                leftMargin += paragraphAttributes.indentLeft;
                rightMargin += paragraphAttributes.indentRight;
                textIndent = paragraphAttributes.indentFirstLine ? paragraphAttributes.indentFirstLine : 0;
                paragraph.css('text-indent', textIndent / 100 + 'mm');
            }

            if (textIndent < 0) {
                leftPadding -= textIndent;
                leftMargin += textIndent;
            }
            paragraph.css({
                paddingLeft: (leftPadding / 100) + 'mm',
                // now set left/right margins
                marginLeft: (leftMargin / 100) + 'mm',
                marginRight: (rightMargin / 100) + 'mm'
            });

            //no distance between paragraph using the same style if contextualSpacing is set
            var noDistanceToPrev = prevAttributes.contextualSpacing && (paragraphAttributes.style === prevAttributes.style),
                noDistanceToNext = paragraphAttributes.contextualSpacing && (paragraphAttributes.style === nextAttributes.style);
            if (noDistanceToPrev) {
                //remove bottom margin from previous paragraph
                prevParagraph.css('margin-bottom', 0 + 'mm');
                paragraph.css('padding-top', 0 + 'mm');
                topMargin = 0;
            }
            if (noDistanceToNext) {
                paragraph.css('padding-bottom', 0 + 'mm');
                bottomMargin = 0;
            }

            paragraph.css({
                marginTop: (topMargin / 100) + 'mm',
                marginBottom: (bottomMargin / 100) + 'mm'
            });
        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, { updateHandler: updateParagraphFormatting });

    } // class ParagraphStyles

    // static methods ---------------------------------------------------------

    ParagraphStyles.getBorderModeFromAttributes = function (attributes) {

        var modeMap = { 0: 'none', 1: 'left', 2: 'right', 4: 'top', 8: 'bottom', 16: 'inside', 3: 'leftright', 12: 'topbottom', 15: 'outside', 31: 'full' },
            value = 0;

        // return null, if any of the border attributes is null (ambiguous)
        if (!attributes.borderLeft || !attributes.borderRight || !attributes.borderTop || !attributes.borderBottom || !attributes.borderInside) {
            return null;
        }

        value += (attributes.borderLeft.style !== 'none') ? 1 : 0;
        value += (attributes.borderRight.style !== 'none') ? 2 : 0;
        value += (attributes.borderTop.style !== 'none') ? 4 : 0;
        value += (attributes.borderBottom.style !== 'none') ? 8 : 0;
        value += (attributes.borderInside.style !== 'none') ? 16: 0;
        return (value in modeMap) ? modeMap[value] : 'none';
    };

    ParagraphStyles.getAttributesFromBorderMode = function (borderMode) {

        var flagsMap = { none: 0, left: 1, right: 2, top: 4, bottom: 8, inside: 16, leftright: 3, topbottom: 12, outside: 15, full: 31 },
            flags = (borderMode in flagsMap) ? flagsMap[borderMode] : 0,
            DEF_BORDER = { style: 'single', width: 17, space: 140, color: Color.AUTO },
            NO_BORDER = { style: 'none' };

        return {
            borderLeft:   (flags & 1) ? DEF_BORDER : NO_BORDER,
            borderRight:  (flags & 2) ? DEF_BORDER : NO_BORDER,
            borderTop:    (flags & 4) ? DEF_BORDER : NO_BORDER,
            borderBottom: (flags & 8) ? DEF_BORDER : NO_BORDER,
            borderInside: (flags & 16) ? DEF_BORDER : NO_BORDER
        };
    };

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend(ParagraphStyles, 'paragraph', DEFINITIONS, { parentFamilies: PARENT_FAMILIES });

});
