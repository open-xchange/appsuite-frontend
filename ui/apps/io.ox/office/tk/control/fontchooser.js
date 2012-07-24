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
     'io.ox/office/tk/control/textfield',
     'io.ox/office/tk/dropdown/list',
     'gettext!io.ox/office/main'
    ], function (Utils, Fonts, TextField, List, gt) {

    'use strict';

    // class FontChooser ======================================================

    /**
     * Creates a font-chooser control.
     *
     * @constructor
     *
     * @extends TextField
     *
     * @param {Object} options
     *  A map of options to control the properties of the font chooser control.
     *  Supports all options of the TextField base class, and the List mix-in
     *  class. The default settings are changed as following: options.icon will
     *  be set to a font icon, options.tooltip will be set to the localized
     *  text 'Font name', and options.sorted will be set to true.
     */
    function FontChooser(options) {

        var // self reference
            self = this,

            // options for the text field
            fieldOptions = Utils.extendOptions({
                    icon: 'icon-font',
                    tooltip: gt('Font name')
                }, options),

            // options for the drop-down list
            listOptions = Utils.extendOptions(
                Utils.extendOptions({
                    tooltip: gt('Font name'),
                    sorted: true
                }, options), { icon: undefined, label: undefined });

        // private methods ----------------------------------------------------

        /**
         * Activates a font in this font chooser control.
         *
         * @param {String|Null} value
         *  The name of the font to be activated. If set to null, does not
         *  activate any font (ambiguous state).
         */
        function updateHandler(value) {

            var // the font name
                fontName = _.isString(value) ? value.toLowerCase() : value,

                // activate a list item
                button = Utils.selectRadioButton(self.getListItems(), fontName);
        }

        /**
         * Click handler for an option button in this radio group. Will
         * activate the clicked button, and return its value.
         *
         * @param {jQuery} button
         *  The clicked button, as jQuery object.
         *
         * @returns {String}
         *  The button value that has been passed to the addButton() method.
         */
        function clickHandler(button) {
            var value = Utils.getControlValue(button);
            updateHandler(value);
            return value;
        }

        // base constructor ---------------------------------------------------

        TextField.call(this, fieldOptions);
        List.extend(this, listOptions);

        // initialization -----------------------------------------------------

        // add all known fonts
        _(Fonts.getFontNames()).each(function (fontName) {
            this.createListItem({
                value: fontName,
                label: fontName,
                labelCss: {
                    fontFamily: Fonts.getFontFamily(fontName),
                    fontSize: '115%'
                }
            });
        }, this);

        // register event handlers
        this.registerUpdateHandler(updateHandler)
            .registerActionHandler(this.getMenuNode(), 'click', 'button', clickHandler);

    } // class FontChooser

    // exports ================================================================

    // derive this class from class TextField
    return TextField.extend({ constructor: FontChooser });

});
