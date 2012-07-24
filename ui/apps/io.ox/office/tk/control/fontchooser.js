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

define('io.ox/office/tk/control/fontchooser',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/fonts',
     'io.ox/office/tk/control/combofield',
     'gettext!io.ox/office/main'
    ], function (Utils, Fonts, ComboField, gt) {

    'use strict';

    // class FontChooser ======================================================

    /**
     * Creates a font-chooser control.
     *
     * @constructor
     *
     * @extends ComboField
     *
     * @param {Object} options
     *  A map of options to control the properties of the font chooser control.
     *  Supports all options of the ComboField base class. The default settings
     *  are changed as following: 'options.icon' will be set to a font icon,
     *  'options.tooltip' will be set to the localized text 'Font name', and
     *  'options.sorted' will be set to true.
     */
    function FontChooser(options) {

        // base constructor ---------------------------------------------------

        ComboField.call(this, Utils.extendOptions({ icon: 'icon-font', tooltip: gt('Font name'), sorted: true }, options));

        // initialization -----------------------------------------------------

        // add all known fonts
        _(Fonts.getFontNames()).each(function (fontName) {
            this.addListEntry(fontName, { labelCss: { fontFamily: Fonts.getFontFamily(fontName), fontSize: '115%' } });
        }, this);

    } // class FontChooser

    // exports ================================================================

    // derive this class from class ComboField
    return ComboField.extend({ constructor: FontChooser });

});
