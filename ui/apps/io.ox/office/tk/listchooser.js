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

define('io.ox/office/tk/listchooser',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/dropdown'
    ], function (Utils, DropDown) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class ListChooser ======================================================

    /**
     * Creates a container element with a drop-down button shown on top, and a
     * drop-down menu containing a list of items.
     *
     * @constructor
     *
     * @extends DropDown
     *
     * @param {String} key
     *  The unique key of the list chooser.
     *
     * @param {Object} options
     *  A map of options to control the properties of the list chooser control.
     *  Supports all options of the DropDown() base class constructor.
     */
    function ListChooser(key, options) {

        var // self reference to be used in event handlers
            self = this,

            // the container element for all list items
            listNode = $('<ul>');

        // private methods ----------------------------------------------------

        /**
         * Returns all button elements representing the list items.
         */
        function getButtons() {
            return listNode.find('button');
        }

        /**
         * Handles 'menuopen' events and initializes the drop-down menu.
         */
        function menuOpenHandler(event, from) {

            // Work around a Firefox bug which displays the menu too narrow (it
            // restricts the table width to the width of the group element). If
            // this is not a bug but a CSS feature, it needs to be worked
            // around anyway.
            self.getMenuNode()
                .css('min-width', '99999px')
                .css('min-width', listNode.outerWidth() + 'px');

            // move focus to first list item, if opened by keyboard
            if ((from === 'key') && !Utils.containsFocusedControl(listNode)) {
                getButtons().first().focus();
            }
        }

        /**
         * Handles key events in the open list menu element.
         */
        function listKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown',
                // all list items
                buttons = getButtons(),
                // index of the focused list item
                index = buttons.index(event.target);

            switch (event.keyCode) {
            case KeyCodes.UP_ARROW:
                if (keydown) {
                    if (index > 0) { buttons.eq(index - 1).focus(); } else { self.hideMenu('key'); }
                }
                return false;
            case KeyCodes.DOWN_ARROW:
                if (keydown && (index >= 0) && (index + 1 < buttons.length)) { buttons.eq(index + 1).focus(); }
                return false;
            }
        }

        /**
         * Activates a list item in this list control.
         *
         * @param {String|Null} value
         *  The unique value associated to the list item to be activated. If
         *  set to null, does not activate any list item (ambiguous state).
         */
        function updateHandler(value) {

            var // find all list items
                buttons = getButtons();

            if (!_.isUndefined(value)) {
                // remove highlighting from all buttons, highlight active button
                Utils.toggleButtons(buttons, false);
                // ambiguous state indicated by null value
                if (!_.isNull(value)) {
                    Utils.toggleButtons(buttons.filter('[data-value="' + value + '"]'), true);
                }
            }
        }

        /**
         * Click handler for a list item in this list control. Will activate
         * the clicked list item, and return its value.
         *
         * @param {jQuery} button
         *  The clicked button, as jQuery object.
         *
         * @returns {String}
         *  The item value that has been passed to the addItem() method.
         */
        function clickHandler(button) {
            var value = button.attr('data-value');
            updateHandler(value);
            return value;
        }

        // base constructor ---------------------------------------------------

        DropDown.call(this, key, options);

        // methods ------------------------------------------------------------

        /**
         * Adds a new item to this list.
         *
         * @param {String} value
         *  The unique value associated to the list item.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new button
         *  representing the item. See method Utils.createButton() for details.
         *
         * @returns {ListChooser}
         *  A reference to this list control.
         */
        this.addItem = function (value, options) {
            listNode.append($('<li>').append(Utils.createButton(key, options).attr('data-value', value)));
            return this;
        };

        // initialization -----------------------------------------------------

        // initialize the drop-down element
        this.getMenuNode().addClass('list-chooser').append(listNode);

        // register event handlers
        this.on('menuopen', menuOpenHandler)
            .registerUpdateHandler(key, updateHandler)
            .registerActionHandler('click', 'button', clickHandler);
        listNode.on('keydown keypress keyup', listKeyHandler);

    } // class ListChooser

    // exports ================================================================

    // derive this class from class DropDown
    return DropDown.extend({ constructor: ListChooser });

});
