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

define('io.ox/office/tk/dropdown/list',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/group',
     'io.ox/office/tk/dropdown/items'
    ], function (Utils, Group, Items) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class List =============================================================

    /**
     * Extends a Group object with a drop-down button and a drop-down menu
     * containing a vertical list of items. Extends the DropDown mix-in class
     * with functionality specific to the list drop-down element.
     *
     * Note: This is a mix-in class supposed to extend an existing instance of
     * the class Group or one of its derived classes. Expects the symbol 'this'
     * to be bound to an instance of Group.
     *
     * @constructor
     *
     * @extends Items
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the list. Supports all
     *  options of the Items base class.
     */
    function List(options) {

        var // self reference (the Group instance)
            self = this;

        // base constructor ---------------------------------------------------

        Items.call(this, options);

        // private methods ----------------------------------------------------

        /**
         * Handles 'menuopen' events.
         */
        function menuOpenHandler() {
            this.getMenuNode().css('min-width', this.getNode().outerWidth() + 'px');
        }

        /**
         * Handles key events in the open drop-down list menu element.
         */
        function listKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown',
                // all list items (button elements)
                buttons = self.getItems(),
                // index of the focused list item
                index = buttons.index(event.target);

            switch (event.keyCode) {
            case KeyCodes.UP_ARROW:
                if (index <= 0) { break; } // let key bubble up to hide the menu
                if (keydown) { buttons.eq(index - 1).focus(); }
                return false;
            case KeyCodes.DOWN_ARROW:
                if (keydown && (index >= 0) && (index + 1 < buttons.length)) { buttons.eq(index + 1).focus(); }
                return false;
            case KeyCodes.PAGE_UP:
                if (keydown) { buttons.eq(Math.max(0, index - List.PAGE_SIZE)).focus(); }
                return false;
            case KeyCodes.PAGE_DOWN:
                if (keydown) { buttons.eq(Math.min(buttons.length - 1, index + List.PAGE_SIZE)).focus(); }
                return false;
            case KeyCodes.HOME:
                if (keydown) { buttons.first().focus(); }
                return false;
            case KeyCodes.END:
                if (keydown) { buttons.last().focus(); }
                return false;
            }
        }

        // initialization -----------------------------------------------------

        // additional formatting for vertical list items
        this.getItemGroup().getNode().addClass('button-list');

        // register event handlers
        this.on('menuopen', menuOpenHandler);
        this.getItemGroup().getNode().on('keydown keypress keyup', listKeyHandler);

    } // class List

    // static fields ----------------------------------------------------------

    /**
     * Number of list items that will be skipped when using the PAGE_UP or
     * PAGE_DOWN key.
     */
    List.PAGE_SIZE = 5;

    // exports ================================================================

    // derive this class from class Items
    return Items.extend({ constructor: List });

});
