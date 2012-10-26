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

define('io.ox/office/tk/control/colorchooser',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/group',
     'io.ox/office/tk/dropdown/colortable'
    ], function (Utils, Group, ColorTable) {

    'use strict';

    // class ColorChooser =====================================================

    /**
     * Creates a control with a drop-down menu used to choose an RGB color from
     * a set of color items.
     *
     * @constructor
     *
     * @extends Group
     * @extends ColorTable
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the drop-down button and
     *  menu. Supports all options of the Group base class, and of the
     *  ColorTable mix-in class. Additionally, the following options are
     *  supported:
     *  @param {Function} [options.updateCaptionHandler]
     *      A function that will be called after a color item has been
     *      activated, or if the control will be updated via its update
     *      handler. Receives the button element of the activated color item
     *      (as jQuery object) in the first parameter (empty jQuery object, if
     *      no color item is active), and the value of the selected/activated
     *      color item in the second parameter (also if this value originates
     *      from the update handler but does not correspond to any existing
     *      color item). Will be called in the context of this color chooser
     *      instance.
     */
    function ColorChooser(options) {

        var // self reference
            self = this,

            // custom update handler for the caption of the menu button
            updateCaptionHandler = Utils.getFunctionOption(options, 'updateCaptionHandler');

        // private methods ----------------------------------------------------

        /**
         * Activates a color item in the color table of this control.
         *
         * @param value
         *  The value associated to the color item to be activated. If set to
         *  null, does not activate any color item (ambiguous state).
         */
        function updateHandler(value) {

            var // activate a color item
                button = Utils.selectOptionButton(self.getColorItems(), value);

            // call custom update handler
            if (_.isFunction(updateCaptionHandler)) {
                updateCaptionHandler.call(self, button, value);
            }
        }

        /**
         * Click handler for a color item in this control. Will activate the
         * clicked color item, and return its associated value.
         *
         * @param {jQuery} button
         *  The clicked button, as jQuery object.
         *
         * @returns
         *  The button value that has been passed to the method
         *  ColorTable.createColorItem().
         */
        function clickHandler(button) {
            var value = Utils.getControlValue(button);
            updateHandler(value);
            return value;
        }

        // base constructor ---------------------------------------------------

        Group.call(this, options);
        ColorTable.call(this, options);

        // initialization -----------------------------------------------------

        // register event handlers
        this.registerUpdateHandler(updateHandler)
            .registerActionHandler(this.getMenuNode(), 'click', 'button', clickHandler);

    } // class ColorChooser

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: ColorChooser });

});
