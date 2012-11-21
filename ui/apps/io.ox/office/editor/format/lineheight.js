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

define('io.ox/office/editor/format/lineheight', ['io.ox/office/tk/utils'], function (Utils) {

    'use strict';

    var // caches calculated normal line heights by font family and font sizes
        lineHeightCache = {},

        // the dummy element used to calculate the 'normal' line height for a specific font
        lineHeightElement = $('<div style="display: block; line-height: normal; padding: 0; border: none;">X</div>');

    // private static functions ===============================================

    /**
     * Calculates the 'normal' line height for the font settings in the passed
     * DOM element in points.
     *
     * @param {jQuery} element
     *  The element containing the font settings needed for the line height
     *  calculation, as jQuery object.
     *
     * @returns {Number}
     *  The 'normal' line height for the font settings in the passed element,
     *  in points.
     */
    function calculateNormalLineHeight(element) {

        var // element font size, exactly and as integer
            fontSize = Math.max(Utils.convertCssLength(element.css('font-size'), 'pt'), 1.0),
            intFontSize = Math.floor(fontSize),

            // relevant font attributes of the element, used as cache key
            attributes = {
                fontFamily: element.css('font-family'),
                fontWeight: element.css('font-weight'),
                fontStyle: element.css('font-style'),
                fontSize: intFontSize + 'pt'
            },
            cacheKey = JSON.stringify(attributes),

            // the resulting line height from the cache
            lineHeight = lineHeightCache[cacheKey];

        // calculate line height if not yet cached
        if (_.isUndefined(lineHeight)) {
            $('body').append(lineHeightElement);
            lineHeightElement.css(attributes);
            lineHeight = lineHeightCache[cacheKey] = Utils.convertLength(lineHeightElement.height(), 'px', 'pt');
            lineHeightElement.detach();
        }

        // interpolate fractional part of the font size
        return lineHeight * fontSize / intFontSize;
    }

    // static class LineHeight ================================================

    /**
     * Predefined values for the 'lineHeight' attribute for paragraphs.
     */
    var LineHeight = {
            SINGLE: { type: 'percent', value: 100 },
            ONE_HALF: { type: 'percent', value: 150 },
            DOUBLE: { type: 'percent', value: 200 }
        };

    /**
     * Sets the text line height of the specified element.
     *
     * @param {HTMLElement|jQuery} element
     *  The element whose line height will be changed. If this object is a
     *  jQuery collection, uses the first DOM node it contains.
     *
     * @param {Object} lineHeight
     *  The new line height. Must contain the attributes 'type' and 'value'.
     */
    LineHeight.updateElementLineHeight = function (element, lineHeight) {

        var // the passed element, as jQuery object
            $element = $(element).first(),
            // effective line height in points (start with passed value, converted from 1/100mm to points)
            height = Utils.convertHmmToLength(lineHeight.value, 'pt');

        // calculate effective line height
        switch (lineHeight.type) {
        case 'fixed':
            // line height as passed
            break;
        case 'leading':
            height += calculateNormalLineHeight($element);
            break;
        case 'atLeast':
            height = Math.max(height, calculateNormalLineHeight($element));
            break;
        case 'percent':
            height = calculateNormalLineHeight($element) * lineHeight.value / 100;
            break;
        default:
            Utils.error('LineHeight.updateElementLineHeight(): invalid line height type');
        }

        // set the CSS formatting
        $element.css('line-height', Utils.roundDigits(height, 1) + 'pt');
    };

    // exports ================================================================

    return LineHeight;

});
