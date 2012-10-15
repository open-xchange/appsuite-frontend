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
     *  The source RGB color as a HEX string without trailing #
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
            TRANSPARENT: {},
            BLACK: { type: 'rgb', value: '000000' },
            WHITE: { type: 'rgb', value: 'FFFFFF' }
        };

    /**
     * Converts the passed attribute color object to a CSS color value.
     *
     * @param {Object} color
     *  The color object as used in operations.
     *
     * @param {Themes} themes
     *  The themes container used to map theme color names to color values.
     *
     * @returns {String}
     *  The CSS color value converted from the passed color object.
     */
    Color.getCssColor = function (color, themes) {

        var type = Utils.getStringOption(color, 'type'),
            theme,
            rgbColor = null;

        switch (type) {
        case 'rgb':
            rgbColor = color.value;
            break;
        case 'scheme':
            theme = themes ? themes.getTheme() : null;
            if (theme) {
                rgbColor = theme.colorscheme[color.value] || rgbColor;
            }
            break;
        case 'auto':
            rgbColor = Color.BLACK.value;
            break;
        }

        return _.isString(rgbColor) ? ('#' + rgbColor) : 'transparent';
    };

    // exports ================================================================

    return Color;

});
