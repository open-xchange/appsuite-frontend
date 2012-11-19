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
            },
            firstlineindent: {
                def: 0
            },

            leftindent: {
                def: 0
            },

            rightindent: {
                def: 0
            },

            topmargin: {
                def: 0
            },

            bottommargin: {
                def: 0
            }
        };

    // private static functions ===============================================

    function isMergeBorders(attributes1, attributes2) {
        return Utils.hasEqualAttributes(attributes1, attributes2, ['borderleft', 'borderright', 'bordertop', 'borderbottom', 'borderinside',
                                                                   'numId', 'leftindent', 'rightindent', 'firstlineindent']);
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
         * @param {Object} attributes
         *  A map of all attributes (name/value pairs), containing the
         *  effective attribute values merged from style sheets and explicit
         *  attributes.
         */
        function updateParagraphFormatting(paragraph, attributes) {

            var // the character styles/formatter
                characterStyles = self.getDocumentStyles().getStyleSheets('character'),

                leftMargin = 0,
                rightMargin = 0,

                prevParagraph = paragraph.prev(),
                prevAttributes = (prevParagraph.length > 0) ? self.getElementAttributes(prevParagraph) : {},

                nextParagraph = paragraph.next(),
                nextAttributes = (nextParagraph.length > 0) ? self.getElementAttributes(nextParagraph) : {};

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
            var leftPadding = attributes.borderleft && attributes.borderleft.space ? attributes.borderleft.space : 0;
            leftMargin += setBorder(attributes.borderleft, 'left', 0);
            rightMargin += setBorder(attributes.borderright, 'right', 0);

            var topMargin = attributes.topmargin;
            var bottomMargin = attributes.bottommargin;

            // top border is not set if previous paragraph uses the same border settings
            if (isMergeBorders(attributes, prevAttributes)) {
                setBorder({ style: 'none' }, 'top', topMargin);
                prevParagraph.css("padding-bottom", this.getCssBorder(attributes.borderinside.space + bottomMargin));
                prevParagraph.css("border-bottom", this.getCssBorder(attributes.borderinside));
                topMargin = 0;
            } else {
                setBorder(attributes.bordertop, 'top', 0);
            }

            // bottom border is replaced by inner border next paragraph uses the same border settings
            if (isMergeBorders(attributes, nextAttributes)) {
                setBorder(attributes.borderinside, 'bottom');
                prevParagraph.css("padding-bottom", this.getCssBorder(bottomMargin));
                bottomMargin = 0;
            } else {
                setBorder(attributes.borderbottom, 'bottom', 0);
            }

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
                        leftPadding += listObject.firstLine;
                        leftMargin += listObject.indent - listObject.firstLine;
                    }
                }
            }

            // paragraph margin attributes - not applied if paragraph is in a list
            var textIndent = 0;
            if (numId < 0) {
                leftMargin += attributes.leftindent;
                rightMargin += attributes.rightindent;
                textIndent = attributes.firstlineindent ? attributes.firstlineindent : 0;
                paragraph.css('text-indent', textIndent / 100 + 'mm');
            }

            if (textIndent < 0) {
                leftPadding -= textIndent;
                leftMargin += textIndent;
            }
            paragraph.css('padding-left', leftPadding / 100 + 'mm');
            // now set left/right margins
            paragraph.css('margin-left', leftMargin / 100 + 'mm');
            paragraph.css('margin-right', rightMargin / 100  + 'mm');

            paragraph.css('margin-top', topMargin / 100 + 'mm');
            paragraph.css('margin-bottom', bottomMargin / 100  + 'mm');
        }

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, 'paragraph', DEFINITIONS);

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateParagraphFormatting);
        this.registerParentStyleFamily('cell', function (paragraph) { return paragraph.parent().filter('td'); });

    } // class ParagraphStyles

    // static methods ---------------------------------------------------------

    ParagraphStyles.getBorderModeFromAttributes = function (attributes) {

        var ret = 'none',
            value = 0;

        // return null, if any of the border attributes is null
        if (!attributes.borderleft || !attributes.borderright || !attributes.bordertop || !attributes.borderbottom || !attributes.borderinside) {
            return null;
        }

        value += (attributes.borderleft.style !== 'none') ? 1 : 0;
        value += (attributes.borderright.style !== 'none') ? 2 : 0;
        value += (attributes.bordertop.style !== 'none') ? 4 : 0;
        value += (attributes.borderbottom.style !== 'none') ? 8 : 0;
        value += (attributes.borderinside.style !== 'none') ? 16: 0;

        switch (value) {
        case 0:
            ret = 'none';
            break;
        case 1:
            ret = 'left';
            break;
        case 2:
            ret = 'right';
            break;
        case 4:
            ret = 'top';
            break;
        case 8:
            ret = 'bottom';
            break;
        case 16:
            ret = 'inside';
            break;
        case 3:
            ret = 'leftright';
            break;
        case 12:
            ret = 'topbottom';
            break;
        case 15:
            ret = 'outside';
            break;
        case 31:
            ret = 'full';
            break;
        }
        return ret;
    };

    ParagraphStyles.getAttributesBorderMode = function (borderMode) {
        var value = borderMode === 'none' ? 0 :
                borderMode === 'left' ? 1 :
                borderMode === 'right' ? 2 :
                borderMode === 'top' ? 4 :
                borderMode === 'bottom' ? 8 :
                borderMode === 'inside' ? 16 :
                borderMode === 'leftright' ? 3 :
                borderMode === 'topbottom' ? 12  :
                borderMode === 'outside' ? 15 :
                borderMode === 'full' ? 31 : -1,
            ret = {},
            defBorder = { style: 'single', width: 17, space: 140, color: Color.AUTO };

        ret.borderleft = value & 1 ? defBorder : {};
        ret.borderright = value & 2 ? defBorder : {};
        ret.bordertop = value & 4 ? defBorder : {};
        ret.borderbottom = value & 8 ? defBorder : {};
        ret.borderinside = value & 16 ? defBorder : {};
        return ret;
    };

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: ParagraphStyles });

});
