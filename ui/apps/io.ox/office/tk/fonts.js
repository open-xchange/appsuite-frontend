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

define('io.ox/office/tk/fonts', function () {

    'use strict';

    var // all known fonts, mapped by font name, mapping the replacement font
        fonts = {
            // sans-serif
            'Helvetica':            'sans-serif',
            'Arial':                'Helvetica',
            'Verdana':              'Arial',
            'Tahoma':               'Arial',
            'Calibri':              'Arial',
            'Impact':               'Arial',
            'Open Sans':            'Arial',

            // serif
            'Times':                'serif',
            'Times New Roman':      'Times',
            'Georgia':              'Times New Roman',
            'Palatino':             'Times New Roman',
            'Cambria':              'Times New Roman',
            'Book Antiqua':         'Palatino',

            // monospace
            'Courier':              'monospace',
            'Courier New':          'Courier',
            'Andale Mono':          'Courier New',
            'Consolas':             'Courier New'
        };

    // static class Fonts =====================================================

    var Fonts = {};

    /**
     * Returns an array with the names of all registered fonts. The array is
     * not sorted.
     */
    Fonts.getRegisteredFontNames = function () {
        return _.keys(fonts);
    };

    /**
     * Returns the name of the replacement font registered for the specified
     * font.
     *
     * @param {String} fontName
     *  The name of a font (case does not matter).
     *
     * @returns {String}
     *  The name of the replacement font, if the specified font is known,
     *  otherwise undefined.
     */
    Fonts.getReplacementFont = function (fontName) {
        return _(fonts).find(function (value, key) {
            return key.toLowerCase() === fontName.toLowerCase();
        });
    };

    /**
     * Returns the font family to be used in CSS. Chains the passed font name
     * with all known replacement font names, and returns a string suitable for
     * the CSS 'font-family' attribute.
     *
     * @param {String} fontName
     *  The name of a font (case does not matter).
     *
     * @returns {String}
     *  The CSS font family string, if the specified font is known, otherwise
     *  the fontName parameter. All font names inserted into the return value
     *  will be enclosed in a pair of quote characters if they contain
     *  whitespace characters.
     */
    Fonts.getCssFontFamily = function (fontName) {

        var // array with the passed font and all replacement font names
            fontNames = [];

        function appendFont(fontName) {
            fontNames.push((fontName.indexOf(' ') >= 0) ? ('"' + fontName + '"') : fontName);
        }

        // collect all replacement fonts
        if (_.isString(fontName)) {
            appendFont(fontName);
            while (_.isString(fontName = Fonts.getReplacementFont(fontName))) {
                appendFont(fontName);
            }
        }

        // return a comma-separated string
        return fontNames.join(',');
    };

    /**
     * Returns the first font name specified in the passed font family string
     * received from a CSS font-family attribute. The CSS font family may
     * consist of a comma separated list of font names, where the font names
     * may be enclosed in quote characters.
     *
     * @param {String} cssFontFamily
     *  The value of a CSS font-family attribute.
     *
     * @returns {String}
     *  The first font name from the passed string, without quote characters.
     */
    Fonts.getFontName = function (cssFontFamily) {

        var // extract first font name from comma separated list
            fontName = $.trim(cssFontFamily.split(',')[0]);

        // Remove leading and trailing quote characters (be tolerant and allow
        // mixed quotes such as "Font' or even a missing quote character on one
        // side of the string). After that, trim again and return.
        return $.trim(fontName.match(/^["']?(.*?)["']?$/)[1]);
    };

    // exports ================================================================

    return Fonts;

});
