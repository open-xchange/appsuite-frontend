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

define('io.ox/office/tk/radiogroup',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/group'
    ], function (Utils, Group) {

    'use strict';

    // class RadioGroup =======================================================

    /**
     * Creates a container element used to hold a set of radio buttons.
     *
     * @constructor
     *
     * @extends Group
     *
     * @param {String} key
     *  The unique key of the radio group. This key is shared by all buttons
     *  inserted into this group.
     */
    function RadioGroup(key) {

        var // self reference
            self = this;

        // private methods ----------------------------------------------------

        /**
         * Activates an option button in this radio group.
         *
         * @param {String|Null} [value]
         *  The unique value associated to the button to be activated. If
         *  omitted or set to null, does not activate any button (ambiguous
         *  state).
         */
        function updateHandler(value) {

            var // find all option buttons
                buttons = self.getNode().children('button');

            // remove highlighting from all buttons, highlight active button
            Utils.toggleButtons(buttons, false);
            // ambiguous state indicated by null value
            if (!_.isUndefined(value) && !_.isNull(value)) {
                Utils.toggleButtons(buttons.filter('[data-value="' + value + '"]'), true);
            }
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
            var value = button.attr('data-value');
            updateHandler(value);
            return value;
        }

        // base constructor ---------------------------------------------------

        Group.call(this);

        // methods ------------------------------------------------------------

        /**
         * Adds a new option button to this radio group.
         *
         * @param {String} value
         *  The unique value associated to the button.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new button. See
         *  method Utils.createButton() for details.
         *
         * @returns {jQuery}
         *  The new button, as jQuery collection.
         */
        this.addButton = function (value, options) {
            return Utils.createButton(key, options)
                .addClass(Group.FOCUSABLE_CLASS)
                .attr('data-value', value)
                .appendTo(this.getNode());
        };

        // initialization -----------------------------------------------------

        // register event handlers
        this.registerUpdateHandler(key, updateHandler)
            .registerActionHandler('click', 'button', clickHandler);

    } // class RadioGroup

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: RadioGroup });

});
