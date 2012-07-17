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
     'gettext!io.ox/office/main'
    ], function (Utils, ListChooser, gt) {

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
     *  Supports all options of the ListChooser() base class constructor.
     */
    function FontChooser(key, options) {

        // base constructor ---------------------------------------------------

        ListChooser.call(this, key, options);

        // methods ------------------------------------------------------------

        this.addFont = function (family, label) {
            return this.addItem(family, { label: label, css: { fontFamily: family, textAlign: 'left' } });
        };

        // initialization -----------------------------------------------------

        // add known fonts
        this.addFont('arial,sans-serif', gt('Arial'))
            .addFont('"courier new",monospace', gt('Courier New'))
            .addFont('"times new roman",times,serif', gt('Times New Roman'));

    } // class FontChooser

    // exports ================================================================

    // derive this class from class ListChooser
    return ListChooser.extend({ constructor: FontChooser });

});
