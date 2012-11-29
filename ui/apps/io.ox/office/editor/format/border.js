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

define('io.ox/office/editor/format/border',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/format/color'
    ], function (Utils, Color) {

    'use strict';

    var // map operation line styles to CSS line styles (anything else maps to 'solid')
        CSS_LINE_STYLES = {
            none: 'none',
            double: 'double',
            triple: 'double',
            dashed: 'dashed',
            dashSmallGap: 'dashed',
            dotted: 'dotted',
            dotDash: 'dotted',
            dotDotDash: 'dotted',
            dashDotStroked: 'dotted'
        };

    // static class Border ====================================================

    /**
     * Predefined border objects.
     */
    var Border = {
            NONE: { style: 'none' },
            SINGLE: { style: 'single', width: 17, space: 140, color: Color.AUTO }
        };

    /**
     * Converts the passed border attribute object to a CSS border value.
     *
     * @param {Object} border
     *  The border object as used in operations.
     *
     * @param {Theme} theme
     *  The theme object used to map scheme color names to color values.
     *
     * @returns {String}
     *  The CSS border value converted from the passed border object.
     */
    Border.getCssBorder = function (border, theme) {

        var style = Utils.getStringOption(border, 'style', 'none'),
            width = Utils.getIntegerOption(border, 'width', 0),
            color = Utils.getObjectOption(border, 'color', Color.AUTO);

        // convert operation line styles to CSS styles
        style = CSS_LINE_STYLES[style] || 'solid';

        // convert 1/100mm to pixels (at least one pixel)
        width = Utils.convertHmmToLength(width, 'px', 1);
        if (width > 0) {
            width = Math.max(width, 1) + 'px';
        }

        // convert color object to CSS color
        color = this.getCssColor(color, 'line');

        // combine the values to a single string
        return [style, width, color].join(' ');
    };

    /**
     * Returns whether the passed border object is a valid and visible border
     * style (line style different to 'none', and line width greater than 0).
     *
     * @param {Object} border
     *  The border object as used in operations.
     */
    Border.isVisibleBorder = function (border) {
        return _.isObject(border) && _.isString(border.style) && (border.style !== 'none') && _.isNumber(border.width) && (border.width > 0);
    };

    // exports ================================================================

    return Border;

});
