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
     'io.ox/office/tk/keycodes',
     'io.ox/office/tk/control/group',
     'io.ox/office/tk/dropdown/dropdown'
    ], function (Utils, KeyCodes, Group, DropDown) {

    'use strict';

    var // CSS marker class for control groups with menu items
        ITEM_GROUP_CLASS = 'item-group';

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
     *      The design mode of the menu items. The value 'default' shows items
     *      in a simple drop-down list style, highlighted items will be drawn
     *      with a changed background color. The value 'framed' shows the
     *      highlighted items with a thick border and leaves the background
     *      untouched.
     *  @param {Function} [options.itemInserter]
     *      A function that will implement inserting an item element at a
     *      specific position. The function receives the following parameters:
     *      (1) {jQuery} sectionNode
     *          The section root node the new item will be inserted into,
     *      (2) {jQuery} button
     *          The button control representing the new item,
     *      (3) {Number} index
     *          The insertion index according to the sort options.
     *      Will be called in the context of this group instance. If omitted,
     *      item elements will be appended as direct children of the last
     *      section node.
     *  @param {Function} [options.itemCreateHandler]
     *      A function that will be called after a new menu item has been added
     *      to the drop-down menu. The function receives the button control
     *      representing the new item (jQuery object) as first parameter, and
     *      the options map passed to the method Items.createItem() as second
     *      parameter. Will be called in the context of this group instance.
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

            // the groups in the drop-down menu containing the menu items, mapped by section identifier
            sectionItemGroups = {},

            // handler called to insert a new item element into the item group
            itemInserter = Utils.getFunctionOption(options, 'itemInserter'),

            // handler called after a new item has been created
            itemCreateHandler = Utils.getFunctionOption(options, 'itemCreateHandler', $.noop),

            // sorted list items
            sorted = Utils.getBooleanOption(options, 'sorted', false),

            // functor used to sort the items
            sortFunctor = Utils.getFunctionOption(options, 'sortFunctor');

        // base constructor ---------------------------------------------------

        DropDown.call(this, Utils.extendOptions(options, { autoLayout: true, getFocusableHandler: getFocusableHandler }));

        // private methods ----------------------------------------------------

        /**
         * Gets or creates the section node with the passed identifier.
         *
         * @returns {jQuery}
         *  The section node with the passed identifier.
         */
        function getOrCreateSectionNode(sectionId, options) {

            var menuNode = self.getMenuNode(),
                sectionNode = menuNode.children('.section-container[data-section="' + sectionId + '"]'),
                label = Utils.getStringOption(options, 'label', ''),
                separator = Utils.getBooleanOption(options, 'separator', false);

            if (sectionNode.length === 0) {
                if (separator && (menuNode.children().length > 0)) {
                    menuNode.append($('<div>').addClass('section-separator'));
                }
                if (label.length > 0) {
                    menuNode.append(Utils.createLabel({ label: label }).addClass('section-heading'));
                }
                sectionNode = Utils.createContainerNode('section-container').attr('data-section', sectionId).appendTo(menuNode);
            }
            return sectionNode;
        }

        /**
         * Gets or creates an item group for the specified section.
         *
         * @returns {Group}
         *  The existing or new item group.
         */
        function getOrCreateItemGroup(sectionId) {

            var // existing item group
                itemGroup = sectionItemGroups[sectionId];

            if (!itemGroup) {

                // create and insert a new item group
                itemGroup = sectionItemGroups[sectionId] = new Group({ classes: 'item-group' });
                self.addSectionGroup(sectionId, itemGroup);

                // register click handler for all item buttons
                itemGroup.registerChangeHandler('click', {
                    selector: Utils.BUTTON_SELECTOR,
                    valueResolver: Utils.getFunctionOption(options, 'itemValueResolver')
                });
            }

            return itemGroup;
        }

        /**
         * Handles key events in the drop-down menu.
         */
        function menuKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown',
                keyup = event.type === 'keyup';

            if (keydown && KeyCodes.matchKeyCode(event, 'TAB', { shift: null })) {
                self.triggerChange(event.target, { preserveFocus: true });
                return; // let TAB key bubble up
            }

            // ignore all other key events in input fields
            if ($(event.target).is('input, textarea')) { return; }

            // handle generic keys
            switch (event.keyCode) {
            case KeyCodes.SPACE:
                if (keyup && $(event.target).is(Utils.BUTTON_SELECTOR)) {
                    self.triggerChange(event.target, { preserveFocus: true });
                }
                return false;
            case KeyCodes.HOME:
                if (keydown) {
                    self.getFocusableMenuControls().first().focus();
                }
                return false;
            case KeyCodes.END:
                if (keydown) {
                    self.getFocusableMenuControls().last().focus();
                }
                return false;
            }
        }

        /**
         * Filters the passed collection of focusable drop-down menu controls
         * to the controls currently selected.
         */
        function getFocusableHandler(focusableNodes) {
            return Utils.getSelectedButtons(focusableNodes);
        }

        // methods ------------------------------------------------------------

        /**
         * Removes all list items and their section nodes from the drop-down
         * menu.
         *
         * @returns {Items}
         *  A reference to this instance.
         */
        this.clearMenuSections = function () {
            sectionItemGroups = {};
            this.getMenuNode().empty();
            this.refresh();
            return this;
        };

        /**
         * Adds a new section to the drop-down menu.
         *
         * @param {String} sectionId
         *  The unique identifier of the section.
         *
         * @param {Object} [options]
         *  A map of options to control the appearance of the section. The
         *  following options are supported:
         *  @param {String} [options.label]
         *      If specified, a heading label will be created for the section.
         *  @param {Boolean} [options.separator]
         *      If true, a horizontal line will be drawn above the section.
         *
         * @returns {Items}
         *  A reference to this instance.
         */
        this.createMenuSection = function (sectionId, options) {
            getOrCreateSectionNode(sectionId, options);
            return this;
        };

        /**
         * Adds a new control group to the drop-down menu.
         *
         * @param {String} sectionId
         *  The unique identifier of the section. Missing sections will be
         *  created automatically.
         *
         * @param {Group} group
         *  The control group to be inserted into the section.
         *
         * @returns {Items}
         *  A reference to this instance.
         */
        this.addSectionGroup = function (sectionId, group) {
            this.registerMenuGroup(group);
            getOrCreateSectionNode(sectionId).append(group.getNode());
            this.refresh();
            return this;
        };

        /**
         * Returns all button elements representing the menu items.
         */
        this.getItems = function () {
            return this.getMenuNode().find('.' + ITEM_GROUP_CLASS + ' ' + Utils.BUTTON_SELECTOR);
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
         *  @param {String} [options.sectionId]
         *      The unique identifier of the section the new item will be
         *      inserted into. If a section with the specified identifier does
         *      not exist yet, it will be created without header label. If
         *      omitted, a default section without header label will be created
         *      and used.
         *  @param {String} [options.tooltip]
         *      Tool tip text shown when the mouse hovers the button.
         *
         * @returns {jQuery}
         *  The button element representing the new item, as jQuery object.
         */
        this.createItem = function (options) {

            var // the section identifier
                sectionId = Utils.getStringOption(options, 'sectionId', ''),
                // the item group of the section
                itemGroup = getOrCreateItemGroup(sectionId),
                // all existing item buttons in the current section
                groupButtons = itemGroup.getNode().find(Utils.BUTTON_SELECTOR),
                // create the button element representing the item
                button = Utils.createButton(options).addClass(Utils.FOCUSABLE_CLASS),
                // insertion index for sorted items
                index = -1;

            // add tool tip
            Utils.setControlTooltip(button, Utils.getStringOption(options, 'tooltip'), 'bottom');

            // find insertion index for sorted items
            if (sorted) {
                index = _.chain(groupButtons.get())
                    // convert array of button elements to strings returned by sort functor
                    .map(function (button) { return sortFunctor.call(self, $(button)); })
                    // calculate the insertion index of the new list item
                    .sortedIndex(sortFunctor.call(this, button))
                    // exit the call chain, returns result of sortedIndex()
                    .value();
            } else {
                // else: append to existing items
                index = groupButtons.length;
            }

            // insert the new item element
            if (_.isFunction(itemInserter)) {
                itemInserter.call(this, itemGroup.getNode(), button, index);
            } else if ((0 <= index) && (index < groupButtons.length)) {
                button.insertBefore(groupButtons[index]);
            } else {
                itemGroup.getNode().append(button);
            }

            // call external handler
            itemCreateHandler.call(this, button, options);

            this.refresh();
            return button;
        };

        // initialization -----------------------------------------------------

        // add the design marker class
        this.getMenuNode().addClass('design-' + Utils.getStringOption(options, 'itemDesign', 'default'));

        // register event handlers
        this.getMenuNode().on('keydown keypress keyup', menuKeyHandler);

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
