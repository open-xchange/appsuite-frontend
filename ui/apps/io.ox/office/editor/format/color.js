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
     * Predefined values for the 'color' attribute.
     */
    var Color = {
            BLACK: { type: 'rgb', value: '000000', transform: [] },
            WHITE: { type: 'rgb', value: 'FFFFFF', transform: [] }
        };

    /**
     * Tries to map the 'color' attribute to a real RGB color value.
     *
     * @param {jQuery} color
     * The 'color' attribute used to map to the real RGB value
     *
     * @param {Themes} themeContainer
     * The themes container to be used to map possible theme
     * colors to real RGB values.
     */
    Color.getRGBColor = function (color, themeContainer) {

        var type = Utils.getStringOption(color, 'type');
        var theme, themeColor,
            rgbColor = Color.BLACK.value; // fallback color is BLACK

        switch (type) {
        case 'rgb':
            rgbColor = color.value;
            break;
        case 'scheme':
            if (themeContainer) {
                var themes = themeContainer.getThemes();
                if (Array.isArray(themes) && themes.length > 0) {
                    theme = themes[0];
                    if (theme) {
                        themeColor = theme[color.value];
                        rgbColor = themeColor ? themeColor : rgbColor;
                    }
                }
            }
            break;
        case 'auto':
            rgbColor = Color.BLACK.value;
            break;
        }

        return rgbColor;
    };

    // exports ================================================================

    return Color;

});
