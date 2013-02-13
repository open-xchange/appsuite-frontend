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

define('io.ox/office/tk/dropdown/items',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/group',
     'io.ox/office/tk/dropdown/dropdown'
    ], function (Utils, Group, DropDown) {

    'use strict';

    // class Items ============================================================

    /**
     * Helper class that provides methods for managing items in drop-down menu
     * elements, represented by button elements.
     *
     * Note: This is a mix-in class supposed to extend an existing instance of
     * the class Group or one of its derived classes. Expects the symbol 'this'
     * to be bound to an instance of Group. Only used as base class for other
     * mix-in classes providing drop-down functionality.
     *
     * @constructor
     *
     * @extends DropDown
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the drop-down menu. The
     *  following options are supported:
     *  @param {String} [options.itemDesign='default']
     *      The design mode of the menu items. See the option 'options.design'
     *      supported by the Group class constructor for details.
     *  @param {Function} [options.itemInserter]
     *      A function that will implement inserting an item element at a
     *      specific position. The function receives the button control
     *      representing the new item (jQuery object) as first parameter, and
     *      the insertion index as second parameter. Will be called in the
     *      context of this group instance. If omitted, item elements will be
     *      inserted as direct children of the group in the drop-down menu.
     *  @param {Function} [options.itemCreateHandler]
     *      A function that will be called after a new menu item has been added
     *      to the drop-down menu. The function receives the button control
     *      representing the new item (jQuery object) as first parameter. Will
     *      be called in the context of this group instance.
     *  @param {Boolean} [options.sorted=false]
     *      If set to true, the drop-down menu items will be sorted according
     *      to the registered sort functor (see 'options.sortFunctor').
     *      Otherwise, the menu items will be appended on insertion.
     *  @param {Function} [options.sortFunctor]
     *      A function that returns a value for each drop-down menu item. The
     *      menu items will be sorted according to these values, either by
     *      number or lexicographically by strings. Will be called in the
     *      context of the group object. The function receives the button
     *      object representing the drop-down menu item, as jQuery object. If
     *      omitted, the menu items will be sorted by their label texts,
     *      ignoring case; items without text label will be inserted in no
     *      special order. This option has no effect, if sorting (option
     *      'options.sorted') is not enabled.
     */
    function Items(options) {

        var // self reference (the Group instance)
            self = this,

            // the group in the drop-down menu containing the menu items
            itemGroup = new Group({ classes: 'item-buttons', design: Utils.getStringOption(options, 'itemDesign', 'default') }),

            // handler called to insert a new item element into the item group
            itemInserter = Utils.getFunctionOption(options, 'itemInserter'),

            // handler called after a new item has been created
            itemCreateHandler = Utils.getFunctionOption(options, 'itemCreateHandler', $.noop),

            // sorted list items
            sorted = Utils.getBooleanOption(options, 'sorted', false),

            // functor used to sort the items
            sortFunctor = Utils.getFunctionOption(options, 'sortFunctor');

        // base constructor ---------------------------------------------------

        DropDown.call(this, Utils.extendOptions(options, { autoLayout: true }));

        // methods ------------------------------------------------------------

        /**
         * Returns the group instance containing all items in the drop-down
         * menu.
         */
        this.getItemGroup = function () {
            return itemGroup;
        };

        /**
         * Returns all button elements representing the menu items.
         */
        this.getItems = function () {
            return itemGroup.getNode().find(Utils.BUTTON_SELECTOR);
        };

        /**
         * Removes all list items from the drop-down menu.
         */
        this.clearItems = function () {
            itemGroup.getNode().empty();
            return this;
        };

        /**
         * Adds a new item to this drop-down menu. If the items are sorted (see
         * the options passed to the constructor), the item will be inserted
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
         *  The button element representing the new item, as jQuery object.
         */
        this.createItem = function (options) {

            var // all existing list items
                buttons = self.getItems(),
                // create the button element representing the item
                button = Utils.createButton(options).addClass(Group.FOCUSABLE_CLASS),
                // insertion index for sorted items
                index = -1;

            // add tool tip
            Utils.setControlTooltip(button, Utils.getStringOption(options, 'tooltip'), 'bottom');

            // find insertion index for sorted items
            if (sorted) {
                index = _.chain(buttons.get())
                    // convert array of button elements to strings returned by sort functor
                    .map(function (button) { return sortFunctor.call(self, $(button)); })
                    // calculate the insertion index of the new list item
                    .sortedIndex(sortFunctor.call(this, button))
                    // exit the call chain, returns result of sortedIndex()
                    .value();
            } else {
                // else: append to existing items
                index = buttons.length;
            }

            // insert the new item element
            if (_.isFunction(itemInserter)) {
                itemInserter.call(this, button, index);
            } else if ((0 <= index) && (index < buttons.length)) {
                button.insertBefore(buttons[index]);
            } else {
                itemGroup.getNode().append(button);
            }

            // call external handler
            itemCreateHandler.call(this, button);
            return button;
        };

        // initialization -----------------------------------------------------

        // add the button group control to the drop-down view component
        this.addPrivateMenuGroup(itemGroup);

        // register event handlers
        itemGroup.registerChangeHandler('click', {
            selector: Utils.BUTTON_SELECTOR,
            valueResolver: Utils.getFunctionOption(options, 'itemValueResolver')
        });

        // default sort functor: sort by button label text, case insensitive
        sortFunctor = _.isFunction(sortFunctor) ? sortFunctor : function (button) {
            var label = Utils.getControlLabel(button);
            return _.isString(label) ? label.toLowerCase() : '';
        };

    } // class Items

    // exports ================================================================

    // derive this class from class DropDown
    return DropDown.extend({ constructor: Items });

});
