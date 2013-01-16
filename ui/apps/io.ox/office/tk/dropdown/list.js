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
     'io.ox/office/tk/dropdown/dropdown'
    ], function (Utils, Group, DropDown) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class List =============================================================

    /**
     * Extends a Group object with a drop-down button and a drop-down menu
     * containing a list of items. Extends the DropDown mix-in class with
     * functionality specific to the list drop-down element.
     *
     * Instances of this class trigger the following events:
     * - 'item:create': After a new list item has been added to this list. The
     *      event handler receives the button control representing the new list
     *      item (jQuery object) as second parameter.
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
     *  A map of options to control the properties of the list. Supports all
     *  options of the DropDown base class. Additionally, the following options
     *  are supported:
     *  @param {Boolean} [options.sorted=false]
     *      If set to true, the list items will be inserted ordered according
     *      to the registered sort functor (see 'option.sortFunctor').
     *      Otherwise, list items will be appended to the list.
     *  @param {Function} [options.sortFunctor]
     *      A function that returns a value for each list item. The list items
     *      will be sorted according to these values, either by number or
     *      lexicographically by strings. Will be called in the context of the
     *      group object. The function receives the button object representing
     *      the list item, as jQuery object. If omitted, the list items will be
     *      ordered by their label texts, ignoring case; items without text
     *      label will be prepended in no special order. This option has no
     *      effect, if sorting is not enabled.
     *  @param {Function} [options.itemValueResolver]
     *      The function that returns the current value of a clicked list item.
     *      Will be passed to the method Group.registerChangeHandler() called
     *      at the internal button group that contains the list items in the
     *      drop-down menu.
     *  @param {String} [options.itemDesign='default']
     *      The design mode of the list items. See the option 'options.design'
     *      supported by the Group class constructor for details.
     */
    function List(options) {

        var // self reference (the Group instance)
            self = this,

            // sorted list items
            sorted = Utils.getBooleanOption(options, 'sorted', false),

            // functor used to sort the items
            sortFunctor = Utils.getFunctionOption(options, 'sortFunctor'),

            // the group in the drop-down menu representing the list items
            listItemGroup = new Group({ classes: 'button-list', design: Utils.getStringOption(options, 'itemDesign', 'default') });

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

        // base constructor ---------------------------------------------------

        DropDown.call(this, Utils.extendOptions(options, { autoLayout: true }));

        // methods ------------------------------------------------------------

        /**
         * Returns the group instance containing all list items.
         */
        this.getListItemGroup = function () {
            return listItemGroup;
        };

        /**
         * Returns all button elements representing the list items.
         */
        this.getListItems = function () {
            return listItemGroup.getNode().children(Utils.BUTTON_SELECTOR);
        };

        /**
         * Removes all list items from the drop-down menu.
         */
        this.clearListItems = function () {
            listItemGroup.getNode().empty();
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

            var // all existing list items
                buttons = self.getListItems(),
                // create the button element representing the list item
                button = Utils.createButton(options).addClass(Group.FOCUSABLE_CLASS),
                // insertion index for sorted lists
                index = -1;

            // add tool tip
            Utils.setControlTooltip(button, Utils.getStringOption(options, 'tooltip'), 'bottom');

            // find insertion index for sorted lists
            if (sorted) {
                index = _.chain(buttons.get())
                    // convert array of button elements to strings returned by sort functor
                    .map(function (button) { return sortFunctor.call(self, $(button)); })
                    // calculate the insertion index of the new list item
                    .sortedIndex(sortFunctor.call(this, button))
                    // exit the call chain, returns result of sortedIndex()
                    .value();
            }

            // insert the new list item element
            if ((0 <= index) && (index < buttons.length)) {
                buttons.eq(index).before(button);
            } else {
                listItemGroup.getNode().append(button);
            }

            // notify listeners
            this.trigger('item:create', button);
            return button;
        };

        // initialization -----------------------------------------------------

        // add the button group control to the drop-down view component
        this.addPrivateMenuGroup(listItemGroup);

        // default sort functor: sort by button label text, case insensitive
        sortFunctor = _.isFunction(sortFunctor) ? sortFunctor : function (button) {
            var label = Utils.getControlLabel(button);
            return _.isString(label) ? label.toLowerCase() : '';
        };

        // register event handlers
        this.on('menuopen', menuOpenHandler);
        listItemGroup
            .registerChangeHandler('click', { selector: Utils.BUTTON_SELECTOR, valueResolver: Utils.getFunctionOption(options, 'itemValueResolver') })
            .getNode().on('keydown keypress keyup', listKeyHandler);

    } // class List

    // static fields ----------------------------------------------------------

    /**
     * Number of list items that will be skipped when using the PAGE_UP or
     * PAGE_DOWN key.
     */
    List.PAGE_SIZE = 5;

    // exports ================================================================

    // derive this class from class DropDown
    return DropDown.extend({ constructor: List });

});
