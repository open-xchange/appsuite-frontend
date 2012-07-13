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

define('io.ox/office/tk/buttongroup',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/group'
    ], function (Utils, Group) {

    'use strict';

    // class ButtonGroup ======================================================

    /**
     * Creates a container element used to hold push buttons and toggle
     * buttons.
     *
     * @constructor
     *
     * @extends Group
     */
    function ButtonGroup() {

        // private methods ----------------------------------------------------

        /**
         * Returns whether the first button control in the passed jQuery
         * collection is a toggle button.
         *
         * @param {jQuery} button
         *  A jQuery collection containing a button element.
         *
         * @returns {Boolean}
         *  True, if the button is a toggle button.
         */
        function isToggleButton(button) {
            return button.first().attr('data-toggle') === 'toggle';
        }

        /**
         * A generic update handler for push buttons and toggle buttons.
         */
        function updateHandler(button, value) {
            if (!_.isUndefined(value) && isToggleButton(button)) {
                // Translate null (special 'ambiguous' state) to false to
                // prevent toggling the button as implemented by the static
                // method Utils.toggleButtons().
                // TODO: Support for null as tristate?
                Utils.toggleButtons(button, _.isNull(value) ? false : value);
            }
        }

        /**
         * A generic action handler for push buttons and toggle buttons.
         */
        function clickHandler(button) {
            if (isToggleButton(button)) {
                Utils.toggleButtons(button);
                return Utils.isButtonSelected(button);
            } // else: push button, return undefined
        }

        // base constructor ---------------------------------------------------

        Group.call(this);

        // methods ------------------------------------------------------------

        /**
         * Adds a new push button or toggle button to this button group.
         *
         * @param {String} key
         *  The unique key of the button.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new button.
         *  Supports all generic formatting options (see method
         *  Utils.createButton() for details). Additionally, the following
         *  options are supported:
         *  @param {Boolean} [option.toggle=false]
         *      If set to true, the button represents a boolean value and
         *      toggles its state when clicked.
         *
         * @returns {jQuery}
         *  The new button, as jQuery collection.
         */
        this.addButton = function (key, options) {

            var // create the button
                button = Utils.createButton(key, options).addClass(Group.FOCUSABLE_CLASS).appendTo(this.getNode());

            // add toggle button marker
            if (Utils.getBooleanOption(options, 'toggle')) {
                button.attr('data-toggle', 'toggle');
            }

            // register update handler (use the generic update handler)
            this.registerUpdateHandler(key, function (value) {
                updateHandler.call(this, button, value);
            });

            return button;
        };

        // initialization -----------------------------------------------------

        // add action handlers for buttons
        this.registerActionHandler('click', 'button', clickHandler);

    } // class ButtonGroup

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: ButtonGroup });

});
