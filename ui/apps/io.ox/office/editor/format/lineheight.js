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

    /**
     * Sets the text line height of the specified element.
     *
     * @param {jQuery} element
     *  The element whose line height will be changed, as jQuery object.
     *
     * @param {Object} lineHeight
     *  The new line height. Must contain the attributes 'type' and 'value'.
     *  See method LineHeight.validateLineHeight() for details how to get a
     *  valid line height value for this parameter.
     */
    function setElementLineHeight(element, lineHeight) {

        var // effective line height in points (start with passed value, converted from 1/100mm to points)
            height = Utils.convertLength(lineHeight.value / 100, 'mm', 'pt');

        // set the CSS formatting
        switch (lineHeight.type) {
        case 'fixed':
            // line height as passed
            break;
        case 'leading':
            height += calculateNormalLineHeight(element);
            break;
        case 'atleast':
            height = Math.max(height, calculateNormalLineHeight(element));
            break;
        case 'percent':
            height = calculateNormalLineHeight(element) * lineHeight.value / 100;
            break;
        default:
            Utils.error('LineHeight.setElementLineHeight(): invalid line height type');
        }
        element.css('line-height', Utils.roundDigits(height, 1) + 'pt');
    }

    // static class LineHeight ================================================

    /**
     * Predefined values for the 'lineheight' attribute for paragraphs.
     */
    var LineHeight = {
            SINGLE: { type: 'percent', value: 100 },
            ONE_HALF: { type: 'percent', value: 150 },
            DOUBLE: { type: 'percent', value: 200 }
        };

    /**
     * Converts the passed value to a valid value for the 'lineheight'
     * attribute.
     */
    LineHeight.validateLineHeight = function (lineHeight) {

        var type = Utils.getStringOption(lineHeight, 'type');

        switch (type) {
        case 'fixed':
        case 'leading':
        case 'atleast':
            // passed value is in 1/100mm in the range [0cm,10cm]
            return { type: type, value: Utils.getNumberOption(lineHeight, 'value', 0, 0, 10000) };
        case 'percent':
            // passed value is percentage in the range [20%,500%]
            return { type: type, value: Utils.getIntegerOption(lineHeight, 'value', 100, 20, 500) };
        }
        return LineHeight.SINGLE;
    };

    /**
     * Sets the text line height of the specified element.
     *
     * @param {jQuery} element
     *  The element whose line height will be changed, as jQuery object.
     *
     * @param {Object} lineHeight
     *  The new line height. Must contain the attributes 'type' and 'value'.
     *  See method LineHeight.validateLineHeight() for details how to get a
     *  valid line height value for this parameter.
     */
    LineHeight.setElementLineHeight = function (element, lineHeight) {
        setElementLineHeight(element, lineHeight);
        // store value for updateElementLineHeight()
        element.data('line-height', lineHeight);
    };

    /**
     * Updates the text line height of the specified element according to its
     * current font settings.
     *
     * @param {jQuery} element
     *  The element whose line height will be updated, as jQuery object.
     */
    LineHeight.updateElementLineHeight = function (element) {
        // read line height from element, stored in setElementLineHeight()
        setElementLineHeight(element, element.data('line-height') || LineHeight.SINGLE);
    };

    // exports ================================================================

    return LineHeight;

});
