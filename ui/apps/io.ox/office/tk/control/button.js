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

define('io.ox/office/tk/control/button',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/group'
    ], function (Utils, Group) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class Button ===========================================================

    /**
     * Creates a container element used to hold a push button or a toggle
     * button.
     *
     * @constructor
     *
     * @extends Group
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the button. Supports all
     *  options of the Group base class and all generic formatting options for
     *  buttons (see method Utils.createButton() for details). Additionally,
     *  the following options are supported:
     *  @param {Boolean} [option.toggle=false]
     *      If set to true, the button represents a boolean value and
     *      toggles its state when clicked.
     */
    function Button(options) {

        var // create the button
            button = Utils.createButton(options),

            // toggle button or push button
            toggle = Utils.getBooleanOption(options, 'toggle', false);

        // private methods ----------------------------------------------------

        /**
         * The update handler for this button.
         */
        function updateHandler(value) {
            if (toggle) {
                // Translate null (special 'ambiguous' state) to false to
                // prevent toggling the button as implemented by the static
                // method Utils.toggleButtons().
                // TODO: Support for null as tristate?
                Utils.toggleButtons(button, _.isBoolean(value) && value);
            } else {
                // change the 'data-value' attribute of push buttons
                Utils.setControlValue(button, value);
            }
        }

        /**
         * The action handler for this button.
         */
        function clickHandler() {
            if (toggle) {
                Utils.toggleButtons(button);
                return Utils.isButtonSelected(button);
            }
            // push button: return the 'data-value' attribute
            return Utils.getControlValue(button);
        }

        /**
         * Handles keyboard events in the focused drop-down button.
         */
        function keyHandler(event) {

            var // distinguish between event types
                keyup = event.type === 'keyup';

            switch (event.keyCode) {
            case KeyCodes.SPACE:
            case KeyCodes.ENTER:
                if (keyup) { button.click(); }
                return false;
            }
        }

        // base constructor ---------------------------------------------------

        Group.call(this, options);

        // methods ------------------------------------------------------------

        /**
         * Returns the DOM button control node, as jQuery object.
         */
        this.getButtonNode = function () {
            return button;
        };

        /**
         * Changes the icon of this button control.
         *
         * @param {String} [icon]
         *  The CSS class name of the new icon. If omitted, the current icon
         *  will be removed from the button.
         *
         * @returns {Button}
         *  A reference to this instance.
         */
        this.setIcon = function (icon) {
            Utils.setControlCaption(button, Utils.extendOptions(options, { icon: icon }));
            return this;
        };

        /**
         * Changes the label text of this button control.
         *
         * @param {String} [labelText]
         *  The new label text. If omitted, the current label text will be
         *  removed from the button control.
         *
         * @returns {Button}
         *  A reference to this instance.
         */
        this.setLabelText = function (labelText) {
            Utils.setControlCaption(button, Utils.extendOptions(options, { label: labelText }));
            return this;
        };

        // initialization -----------------------------------------------------

        // insert the button into this group, and register event handlers
        this.addFocusableControl(button)
            .registerUpdateHandler(updateHandler)
            .registerActionHandler(button, 'click', clickHandler);
        button.on('keydown keypress keyup', keyHandler);

    } // class Button

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: Button });

});
