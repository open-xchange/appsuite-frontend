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
 * @author Carsten Driesner <carsten.driesner@open-xchange.com>
 */

define('io.ox/office/editor/format/color', ['io.ox/office/tk/utils'], function (Utils) {

    'use strict';

    // private static functions ===============================================

    /**
     * Calculates the resulting RGB color from a source RGB color value
     * and a transform object describing the transformation rule.
     *
     * @param {String} rgbColor
     *  The source color as a hexadecimal string (RRGGBB).
     *
     *  @param {Object} transform
     *  The transformation object describing the transformation rule
     *  to be applied to the provided rgbColor.
     *
     * @returns {String}
     *  The resulting RGB color as a HEX string.
     */
    function transformRGBColor(rgbColor, transform) {
        return rgbColor; // TODO: support transformations
    }

    // static class Color =====================================================

    /**
     * Predefined color objects.
     */
    var Color = {
            BLACK: { type: 'rgb', value: '000000' },
            WHITE: { type: 'rgb', value: 'FFFFFF' },
            AUTO: { type: 'auto' }
        };

    /**
     * Converts the passed attribute color object to a CSS color value.
     *
     * @param {Object} color
     *  The color object as used in operations.
     *
     * @param {String} context
     *  The context needed to resolve the color type 'auto'. Supported contexts
     *  are 'text' for text colors (mapped to to black), 'line' for line
     *  colors (e.g. table borders, maps to black), and 'fill' for fill colors
     *  (e.g. paragraph background and table cells, maps to transparent).
     *
     * @param {Themes} theme
     *  The theme object used to map scheme color names to color values.
     *
     * @returns {String}
     *  The CSS color value converted from the passed color object.
     */
    Color.getCssColor = function (color, context, theme) {

        var type = Utils.getStringOption(color, 'type', 'none'),
            rgbColor = null;

        switch (type) {
        case 'rgb':
            rgbColor = color.value;
            break;
        case 'scheme':
            rgbColor = theme && theme.getSchemeColor(color.value);
            break;
        case 'auto':
            switch (context) {
            case 'text':
            case 'line':
                rgbColor = Color.BLACK.value;
                break;
            case 'fill':
                // transparent: keep rgbColor empty
                break;
            default:
                Utils.warn('Color.getCssColor(): unknown color context: ' + context);
                rgbColor = Color.BLACK.value;
            }
            break;
        default:
            Utils.warn('Color.getCssColor(): unknown color type: ' + type);
        }

        return _.isString(rgbColor) ? ('#' + rgbColor) : 'transparent';
    };

    // exports ================================================================

    return Color;

});
