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

define('io.ox/office/tk/dropdown/grid',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/group',
     'io.ox/office/tk/dropdown/dropdown'
    ], function (Utils, Group, DropDown) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class Grid =============================================================

    /**
     * Extends a Group object with a drop-down button and a drop-down menu
     * containing one grid or multiple grids of items. Extends the DropDown
     * mix-in class with functionality specific to the grid drop-down element.
     *
     * Note: This is a mix-in class supposed to extend an existing instance of
     * the class Group or one of its derived classes. Expects the symbol 'this'
     * to be bound to an instance of Group.
     *
     * @constructor
     *
     * @extends DropDown
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the grid. Supports all
     *  options of the DropDown base class. Additionally, the following options
     *  are supported:
     *  @param {Number} [options.columns=10]
     *      The number of columns in the grid layout.
     *  @param {Function} [options.itemValueResolver]
     *      The function that returns the current value of a clicked list item.
     *      Will be passed to the method Group.registerChangeHandler() called
     *      at the internal button group that contains the list items in the
     *      drop-down menu. If omitted, defaults to the static method
     *      Utils.getControlValue().
     *  @param {String} [options.itemDesign='framed']
     *      The design mode of the list items. See the option 'options.design'
     *      supported by the Group class constructor for details.
     *  @param {Function} [options.itemCreateHandler]
     *      A function that will be called after a new item has been added to
     *      the current grid. The function receives the button control
     *      representing the new item (jQuery object) as first parameter.
     */
    function Grid(options) {

        var // self reference (the Group instance)
            self = this,

            // the group in the drop-down menu representing the list items
            gridItemGroup = new Group({ design: Utils.getStringOption(options, 'itemDesign', 'framed') }),

            // number of items per row
            columns = Utils.getIntegerOption(options, 'columns', 10, 1),

            // handler called after a new item has been created
            itemCreateHandler = Utils.getFunctionOption(options, 'itemCreateHandler', $.noop);

        // base constructor ---------------------------------------------------

        DropDown.call(this, Utils.extendOptions(options, { autoLayout: true }));

        // private methods ----------------------------------------------------

        /**
         * Handles 'menuopen' events.
         */
        function menuOpenHandler() {
            this.getMenuNode().css('min-width', this.getNode().outerWidth() + 'px');
        }

        /**
         * Handles key events in the open list menu element.
         */
        function listKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown',
                // all list items (button elements)
                buttons = self.getListItems(),
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
            case KeyCodes.HOME:
                if (keydown) { buttons.first().focus(); }
                return false;
            case KeyCodes.END:
                if (keydown) { buttons.last().focus(); }
                return false;
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the group instance containing all list items.
         */
        this.getListItemGroup = function () {
            return gridItemGroup;
        };

        /**
         * Returns all button elements representing the list items.
         */
        this.getListItems = function () {
            return gridItemGroup.getNode().children(Utils.BUTTON_SELECTOR);
        };

        /**
         * Removes all list items from the drop-down menu.
         */
        this.clearListItems = function () {
            gridItemGroup.getNode().empty();
            return this;
        };

        /**
         * Adds a new item to this list. If the list items are sorted (see the
         * options passed to the constructor), the item will be inserted
         * according to these settings.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new button
         *  representing the item. See method Utils.createButton() for details.
         *  Additionally, the following options are supported:
         *  @param {String} [options.tooltip]
         *      Tool tip text shown when the mouse hovers the button.
         *
         * @returns {jQuery}
         *  The button element representing the new list item, as jQuery
         *  collection.
         */
        this.createListItem = function (options) {

            var // create the button element representing the list item
                button = Utils.createButton(options).addClass(Group.FOCUSABLE_CLASS);

            // add tool tip
            Utils.setControlTooltip(button, Utils.getStringOption(options, 'tooltip'), 'bottom');

            // insert the new list item element
            gridItemGroup.getNode().append(button);

            // call external handler
            itemCreateHandler.call(this, button);
            return button;
        };

        // initialization -----------------------------------------------------

        // add the button group control to the drop-down view component
        this.addPrivateMenuGroup(gridItemGroup);

        // register event handlers
        this.on('menuopen', menuOpenHandler);
        gridItemGroup
            .registerChangeHandler('click', { selector: Utils.BUTTON_SELECTOR, valueResolver: Utils.getFunctionOption(options, 'itemValueResolver') })
            .getNode().on('keydown keypress keyup', listKeyHandler);

    } // class Grid

    // exports ================================================================

    // derive this class from class DropDown
    return DropDown.extend({ constructor: Grid });

});
