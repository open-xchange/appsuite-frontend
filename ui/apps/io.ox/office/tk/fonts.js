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

    var // all known fonts, mapped by font name, mapping the fall-back font
        fonts = {
            // sans-serif
            'Helvetica':            'sans-serif',
            'Arial':                'Helvetica',
            'Verdana':              'Arial',
            'Tahoma':               'Arial',
            'Calibri':              'Arial',
            'Impact':               'Arial',

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
    Fonts.getFontNames = function () {
        return _.keys(fonts);
    };

    /**
     * Returns the name of the fall-back font registered for the specified
     * font.
     *
     * @param {String} fontName
     *  The name of a font (case does not matter).
     *
     * @returns {String}
     *  The name of the fall-back font, if the specified font is known,
     *  otherwise undefined.
     */
    Fonts.getFallBackFont = function (fontName) {
        return _(fonts).find(function (value, key) {
            return key.toLowerCase() === fontName.toLowerCase();
        });
    };

    /**
     * Returns the font family to be used in CSS. Chains the passed font name
     * with all known fall-back font names, and returns a string suitable for
     * the CSS 'font-family' attribute.
     *
     * @param {String} fontName
     *  The name of a font (case does not matter).
     *
     * @returns {String}
     *  The CSS font family string, if the specified font is known, otherwise
     *  the unchanged fontName parameter.
     */
    Fonts.getFontFamily = function (fontName) {

        var // array with the passed font and all fall-back font names
            fontNames = [];

        function appendFont(fontName) {
            fontNames.push((fontName.indexOf(' ') >= 0) ? ('"' + fontName + '"') : fontName);
        }

        // collect all fall-back fonts
        if (_.isString(fontName)) {
            appendFont(fontName);
            while (_.isString(fontName = Fonts.getFallBackFont(fontName))) {
                appendFont(fontName);
            }
        }

        // return a comma-separated string
        return fontNames.join(',');
    };

    // exports ================================================================

    return Fonts;

});
