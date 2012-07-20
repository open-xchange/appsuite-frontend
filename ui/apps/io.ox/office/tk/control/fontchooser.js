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
     'io.ox/office/tk/control/radiogroup',
     'gettext!io.ox/office/main'
    ], function (Utils, Fonts, RadioGroup, gt) {

    'use strict';

    // class FontChooser ======================================================

    /**
     * Creates a font-chooser control.
     *
     * @constructor
     *
     * @extends Group
     *
     * @param {Object} options
     *  A map of options to control the properties of the font chooser control.
     *  Supports all options of the RadioChooser base class. The default values
     *  are changed as following: options.icon will be set to a font icon,
     *  options.label will be set to the localized text 'Font name', and
     *  options.sorted will be set to true. The control will always be
     *  displayed as a list drop-down (the value of options.type does not have
     *  any effect).
     */
    function FontChooser(options) {

        var // extend default values with passed options, but fix the 'type' option to 'list'
            finalOptions = Utils.extendOptions(
                Utils.extendOptions({
                    icon: 'icon-font',
                    label: gt('Font name'),
                    tooltip: gt('Font name'),
                    sorted: true
                }, options), { type: 'list' });

        // base constructor ---------------------------------------------------

        RadioGroup.call(this, finalOptions);

        // initialization -----------------------------------------------------

        // add all known fonts
        _(Fonts.getFontNames()).each(function (fontName) {
            this.addButton(fontName.toLowerCase(), {
                icon: finalOptions.icon,
                label: fontName,
                labelCss: {
                    fontFamily: Fonts.getFontFamily(fontName),
                    fontSize: '115%'
                }
            });
        }, this);

    } // class FontChooser

    // exports ================================================================

    // derive this class from class RadioGroup
    return RadioGroup.extend({ constructor: FontChooser });

});
