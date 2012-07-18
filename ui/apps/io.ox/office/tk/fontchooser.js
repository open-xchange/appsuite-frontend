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

define('io.ox/office/tk/fontchooser',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/listchooser',
     'io.ox/office/tk/fonts',
     'gettext!io.ox/office/main'
    ], function (Utils, ListChooser, Fonts, gt) {

    'use strict';

    // class FontChooser ======================================================

    /**
     * Creates a font-chooser control.
     *
     * @constructor
     *
     * @extends ListChooser
     *
     * @param {String} key
     *  The unique key of the font chooser.
     *
     * @param {Object} options
     *  A map of options to control the properties of the font chooser control.
     *  Supports all options of the ListChooser() base class constructor. The
     *  default values are changed as following: options.icon will be set to a
     *  font icon, options.label will be set to the localized text 'Font name',
     *  and options.sorted will be set to true.
     */
    function FontChooser(key, options) {

        // base constructor ---------------------------------------------------

        ListChooser.call(this, key, Utils.extendOptions({
            icon: 'icon-font',
            label: gt('Font name'),
            tooltip: gt('Font name'),
            sorted: true
        }, options));

        // initialization -----------------------------------------------------

        // add all known fonts
        _(Fonts.getFontNames()).each(function (fontName) {
            var fontFamily = Fonts.getFontFamily(fontName);
            this.addItem(fontFamily, { label: fontName, css: { fontFamily: fontFamily, textAlign: 'left' } });
        }, this);

    } // class FontChooser

    // exports ================================================================

    // derive this class from class ListChooser
    return ListChooser.extend({ constructor: FontChooser });

});
