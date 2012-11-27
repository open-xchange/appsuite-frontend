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
     * Converts a hex based rgb color value to a
     * number.
     *
     * @param {String} rgbColor
     * A hex based rgb color value (RRGGBB).
     *
     * @returns {Number}
     * The integer based value of the hex string.
     */
    function convertRgbColorToNumber(rgbColor) {
        return parseInt(rgbColor, 16);
    }

    /**
     * Converts a number to a hex based rgb color string.
     *
     * @param {Number} colorValue
     * A rgb color value.
     *
     * @returns {String}
     * Hex based color string (RRGGBB).
     */
    function convertNumberToRgbColor(colorValue) {
        var color = colorValue.toString(16);
        // MUST be 6-digits with leading zeros, otherwise, CSS *appends* zeros instead of prepending them
        while (color.length < 6) { color = '0' + color; }
        return color;
    }

    /**
     * Converts a RGB color value to a HSL color object
     * which contains the attributes h (hue),
     * s (saturation) and l (luminance).
     *
     * @param {Number} rgbValue
     * The rgb color value to be converted to the HSL
     * color model.
     *
     * @returns {Object}
     * The HSL color object which contains h,s,l attributes
     * based on the provided rgb color value.
     */
    function convertRgbToHsl(rgbValue) {
        var r, g, b, min, max, h, s, l;

        r = ((rgbValue & 16711680) >> 16) / 255;
        g = ((rgbValue & 65280) >> 8) / 255;
        b = (rgbValue & 255) / 255;

        min = Math.min(r, g, b);
        max = Math.max(r, g, b);

        l = (min + max) / 2;
        s = (min === max) ? 0 : (l < 0.5) ? (max - min) / (max + min) : (max - min) / (2.0 - max - min);
        h = 0;
        if (s !== 0) {
            h = ((max === r) ? (g - b) / (max - min) : (max === g) ? 2.0 + (b - r) / (max - min) : 4.0 + (r - g) / (max - min)) * 60;
            h = ((h < 0) ? h + 360 : h) / 360;
        }

        return { h: h, s: s, l: l };
    }

    /**
     * Converts a HSL color object to a rgb color value.
     *
     * @param {Object} hsl
     * The HSL color object which contains the color
     * attributes h, s, l
     *
     * @returns {Number}
     * The rgb color value calculated from the hsl color object.
     */
    function convertHslToRgb(hsl) {
        var r, g, b;

        if (hsl.s === 0) {
            r = g = b = Math.round(hsl.l * 255);
        }
        else {
            var t1, t2, tr, tg, tb;

            t1 = (hsl.l < 0.5) ? hsl.l * (1.0 + hsl.s) : hsl.l + hsl.s - hsl.l * hsl.s;
            t2 = 2 * hsl.l - t1;

            tr = hsl.h + (1 / 3);
            tg = hsl.h;
            tb = hsl.h - (1 / 3);

            tr = (tr < 0) ? tr + 1 : (tr > 1) ? tr - 1 : tr;
            tg = (tg < 0) ? tg + 1 : (tg > 1) ? tg - 1 : tg;
            tb = (tb < 0) ? tb + 1 : (tb > 1) ? tb - 1 : tb;

            var convChannel = function conv(ch) {
                if ((6 * ch) < 1)
                    return t2 + (t1 - t2) * 6 * ch;
                else if ((2 * ch) < 1)
                    return t1;
                else if ((3 * ch) < 2)
                    return t2 + (t1 - t2) * ((2 / 3) - ch) * 6;
                else
                    return t2;
            };

            r = Math.round(convChannel(tr) * 255);
            g = Math.round(convChannel(tg) * 255);
            b = Math.round(convChannel(tb) * 255);
        }

        return ((r << 16) + (g << 8) + b);
    }

    /**
     * Tints the rgb color value with the provided tint value
     * according to ooxml documentation.
     *
     * @param {Number} rgbValue
     *  The rgb color value.
     *
     * @param {Number} shade
     *  A value 0 - 100000 (0 - 100%) to tint the provided color.
     *  Fixed floating point number.
     *
     * @returns {Number}
     *  tint rgb color value
     */
    function tintColor(rgbValue, tint) {
        var hsl = convertRgbToHsl(rgbValue);
        var tintValue = tint / 100000;
        hsl.l = hsl.l * tintValue + (1 - tintValue);
        return convertHslToRgb(hsl);
    }

    /**
     * Shades the rgb color value with the provided shade value
     * according to ooxml documentation.
     *
     * @param {Number} rgbValue
     *  The rgb color value.
     *
     * @param {String} shade
     *  A value 0 - 100000 (0 - 100%) to shade the provided color
     *
     * @returns {Number}
     *  shaded rgb color value
     */
    function shadeColor(rgbValue, shade) {
        var hsl = convertRgbToHsl(rgbValue);
        var shadeValue = shade / 100000;
        hsl.l = hsl.l * shadeValue;
        return convertHslToRgb(hsl);
    }

    /**
     * Calculates the resulting RGB color from a source RGB color value
     * and a transformation array defining the transformation rules.
     *
     * @param {String} rgbColor
     *  The source color as a hexadecimal string (RRGGBB).
     *
     * @param {Array} transformations
     *  An array with transformation objects describing the
     *  transformation rules to be applied to the provided rgbColor.
     *
     * @returns {String}
     *  The resulting RGB color as a HEX string.
     */
    function transformRGBColor(rgbColor, transformations) {
        var color = rgbColor;

        if (transformations && (transformations.length > 0)) {
            color = convertRgbColorToNumber(rgbColor);
            _(transformations).each(function (transformation) {
                switch (transformation.type) {
                case 'shade':
                    color = shadeColor(color, transformation.value);
                    break;
                case 'tint':
                    color = tintColor(color, transformation.value);
                    break;
                default:
                    Utils.warn('Color.transformRGBColor(): unknown color transformation: ' + transformation.type);
                }
            });
            color = convertNumberToRgbColor(color);
        }
        return color;
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

        var type = Utils.getStringOption(color, 'type', 'auto'),
            transformations = Utils.getArrayOption(color, 'transformations', []),
            rgbColor = null;

        switch (type) {
        case 'rgb':
            rgbColor = transformRGBColor(color.value, transformations);
            break;
        case 'scheme':
            rgbColor = transformRGBColor(theme && theme.getSchemeColor(color.value), transformations);
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

    /**
     * Determine if provided color has theme based color value
     *
     * @param color
     * A color object
     *
     * @returns {Boolean}
     * true if color is theme based otherwise false
     */
    Color.isThemeColor = function (color) {
        var type = Utils.getStringOption(color, 'type', 'none');
        return (type === 'scheme');
    };

    /**
     * Determine if provided color has type auto
     *
     * @param color
     * A color object
     *
     * @returns {Boolean}
     * true if color has type auto otherwise false
     */
    Color.isAutoColor = function (color) {
        var type = Utils.getStringOption(color, 'type', 'auto');
        return (type === 'auto');
    };

    /**
     * Returns whether the passed color resolves to full transparency.
     *
     * @param {Object} color
     *  The color object.
     *
     * @param {String} context
     *  The context needed to resolve the color type 'auto'.
     *
     * @returns {Boolean}
     *  Whether the passed color represents full transparency.
     */
    Color.isTransparentColor = function (color, context) {
        return Color.getCssColor(color, context) === 'transparent';
    };

    /**
     * Determine if the provided color is dark or light
     *
     * @param {String} rgbColor
     * The rgb color as hex value string (RRGGBB) with/without trailing #
     *
     * @returns {Boolean}
     * True if the color is dark otherwise false.
     */
    Color.isDark = function (rgbColor) {
        if (rgbColor && (6 <= rgbColor.length) && (rgbColor.length <= 7)) {
            var hexString = rgbColor.length === 6 ? rgbColor : rgbColor.substring(1);
            var rgbColorValue = convertRgbColorToNumber(hexString);
            var luminance = ((((rgbColorValue & 0x00ff0000) >> 16) * 5036060) +
                             (((rgbColorValue & 0x0000ff00) >> 8) * 9886846) +
                              ((rgbColorValue & 0x000000ff) * 1920103)) / (1 << 24);
            if (luminance <= 60)
                return true;
            else
                return false;
        }

        return false;
    };

    /**
     * Sets the text color of the passed element. If the text color is set to
     * automatic, calculates the effective color depending on the character
     * fill color, and paragraph fill color.
     *
     * @param {HTMLElement|jQuery} element
     *  The element whose text color will be set. If this object is a jQuery
     *  collection, uses the first DOM node it contains.
     *
     * @param {Theme} theme
     *  The theme object currently used by the document.
     *
     * @param {Object} attrs
     *  The current character attributes (text color and character fill color).
     *
     * @param {Object} paraAttrs
     *  The paragraph attributes containing the fill color.
     */
    Color.setElementTextColor = function (element, theme, attrs, paraAttrs) {
        var $element = $(element).first(),
            textColor = attrs.color,
            backColor = attrs.fillColor,
            rgbBackColor = null;

        if (Color.isAutoColor(textColor)) {
            if (Color.isAutoColor(backColor)) {
                if (Color.isAutoColor(paraAttrs.fillColor))
                    rgbBackColor = Color.WHITE.value;
                else
                    rgbBackColor = Color.getCssColor(paraAttrs.fillColor, 'fill', theme);
            }
            else
                rgbBackColor = Color.getCssColor(backColor, 'fill', theme);

            if (Color.isDark(rgbBackColor))
                $element.css('color', '#' + Color.WHITE.value);
            else
                $element.css('color', '#' + Color.BLACK.value);
        } else {
            $element.css('color', Color.getCssColor(textColor, 'text', theme));
        }
    };

    // exports ================================================================

    return Color;

});
