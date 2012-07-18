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
     *  Supports all options of the ListChooser() base class constructor. The
     *  default values are changed as following: options.icon will be set to a
     *  font icon, options.label will be set to the localized text 'Font name',
     *  and options.sorted will be set to true.
     */
    function FontChooser(key, options) {

        // base constructor ---------------------------------------------------

        ListChooser.call(this, key, Utils.extendOptions({ icon: 'icon-font', tooltip: gt('Font name'), sorted: true }, options));

        // methods ------------------------------------------------------------

        this.addFont = function (family, label) {
            return this.addItem(family, { label: label, css: { fontFamily: family, textAlign: 'left' } });
        };

        // initialization -----------------------------------------------------

        // add known fonts
        this.addFont('"andale mono",times,serif', 'Andale Mono')
            .addFont('andalus,times,serif', 'Andalus')
            .addFont('arial,helvetica,sans-serif', 'Arial')
            .addFont('"book antiqua",palatino,serif', 'Book Antiqua')
            .addFont('calibri,arial,sans-serif', 'Calibri')
            .addFont('cambria,"times new roman",times,serif', 'Cambria')
            .addFont('chicago,"arial black","avant garde",sans-serif', 'Chicago')
            .addFont('consolas,"courier new",courier,monospace', 'Consolas')
            .addFont('courier,monospace', 'Courier')
            .addFont('"courier new",courier,monospace', 'Courier New')
            .addFont('geneva,sans-serif', 'Geneva')
            .addFont('georgia,palatino,serif', 'Georgia')
            .addFont('helvetica,sans-serif', 'Helvetica')
            .addFont('impact,chicago,"arial black","avant garde",sans-serif', 'Impact')
            .addFont('monaco,courier,monospace', 'Monaco')
            .addFont('palatino,serif', 'Palatino')
            .addFont('"palatino linotype",palatino,serif', 'Palatino Linotype')
            .addFont('symbol', 'Symbol')
            .addFont('tahoma,arial,helvetica,sans-serif', 'Tahoma')
            .addFont('terminal,monaco,courier,monospace', 'Terminal')
            .addFont('times,serif', 'Times')
            .addFont('"times new roman",times,serif', 'Times New Roman')
            .addFont('verdana,geneva,sans-serif', 'Verdana');

    } // class FontChooser

    // exports ================================================================

    // derive this class from class ListChooser
    return ListChooser.extend({ constructor: FontChooser });

});
