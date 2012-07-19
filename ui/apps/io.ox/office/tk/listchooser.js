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
     *  Additionally, supports the following options:
     *  @param {Boolean} [options.sorted]
     *      if set to true, the list items will be inserted sorted by their
     *      label text. Otherwise, list items will be appended to the list.
     */
    function ListChooser(key, options) {

        var // self reference to be used in event handlers
            self = this,

            // the container element for all list items
            listNode = $('<ul>'),

            // sorted list items
            sorted = Utils.getBooleanOption(options, 'sorted', false),

            // number of items to skip for page up/down keys
            itemsPerPage = 1;

        // private methods ----------------------------------------------------

        /**
         * Returns all button elements representing the list items.
         */
        function getListItems() {
            return listNode.find('button');
        }

        /**
         * Handles 'menuopen' events and initializes the drop-down menu.
         */
        function menuOpenHandler(event, from) {

            var // the outer menu node containing the list element
                menuNode = self.getMenuNode(),
                // all list items (button elements)
                buttons = getListItems(),
                // width of the drop-down group buttons (used as min-width of the menu)
                minWidth = self.getNode().width(),
                // width of the scrollbar in pixels
                scrollBarWidth = 0;

            // set maximum height of the drop-down menu, depending on window height
            menuNode.css('max-height', (window.innerHeight - menuNode.offset().top - 10) + 'px');
            itemsPerPage = buttons.length ? Math.max(1, Math.floor(menuNode.innerHeight() / buttons.first().outerHeight()) - 1) : 1;
            menuNode.scrollTop(0);

            // Calculate the width of the drop-down menu. Work around a Firefox
            // bug which displays the menu too narrow (it restricts the width
            // of the drop-down menu to the width of the group element, if the
            // width of the list items is set to '100%' to give them the same
            // width). If this is not a bug but a CSS feature, it needs to be
            // worked around anyway.

            // 1) Set width of menu node and list node to 'auto' to let the
            // containers shrink together (needed if a scroll bar has been
            // shown the last time, which is hidden now due to a larger browser
            // window). Here, Firefox shrinks too much.
            menuNode.css('width', 'auto');
            listNode.css('width', 'auto');
            // 2) Calculate the width of the scroll bar, if existing.
            scrollBarWidth = menuNode.innerWidth() - listNode.outerWidth();
            // 3) Expand the width of the outer menu node, this gives the list
            // node enough space. Then, set it to the calculated width of the
            // list node. Take the width of the top-level buttons as minimum
            // width into account.
            menuNode.width(99999).width(Math.max(minWidth - 2, listNode.outerWidth() + scrollBarWidth));
            // 4) Expand width of the list node to the menu width (needed in
            // case minimum width is active).
            listNode.css('width', '100%');

            // move focus to first list item, if opened by keyboard
            if ((from === 'key') && !Utils.containsFocusedControl(listNode)) {
                getListItems().first().focus();
            }
        }

        /**
         * Handles key events in the open list menu element.
         */
        function listKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown',
                // all list items (button elements)
                buttons = getListItems(),
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
            case KeyCodes.PAGE_UP:
                if (keydown) { buttons.eq(Math.max(0, index - itemsPerPage)).focus(); }
                return false;
            case KeyCodes.PAGE_DOWN:
                if (keydown) { buttons.eq(Math.min(buttons.length - 1, index + itemsPerPage)).focus(); }
                return false;
            case KeyCodes.HOME:
                if (keydown) { buttons.first().focus(); }
                return false;
            case KeyCodes.END:
                if (keydown) { buttons.last().focus(); }
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

            var // all list items (button elements)
                buttons = getListItems(),
                // activate the button with the specified value
                button = Utils.selectRadioButton(buttons, value),
                // label of the active button (undefined if no button is active)
                label = Utils.getControlLabel(button),
                // options used to update the drop-down button (use group label if no button is active)
                buttonOptions = _.isUndefined(label) ? options : Utils.extendOptions(options, { label: label });

            // update the label of the drop-down button
            Utils.setControlCaption(self.getActionButton(), buttonOptions);
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
            var value = Utils.getButtonValue(button);
            updateHandler(value);
            return value;
        }

        // base constructor ---------------------------------------------------

        DropDown.call(this, key, options);

        // methods ------------------------------------------------------------

        /**
         * Adds a new item to this list. If the list items are sorted (see the
         * options passed to the constructor), the item will be inserted
         * according to its text label. If the item does not have a text label,
         * it will be appended.
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

            var // create the button element representing the list item
                button = Utils.createButton(key, Utils.extendOptions(options, { value: value })),
                // embed it into a list item element
                listItem = $('<li>').append(button),
                // the text label of the new list item
                label = Utils.getControlLabel(button),
                // insertion index for sorted lists
                index = -1;

            // find insertion index for sorted lists
            if (sorted && _.isString(label)) {
                index = _.chain(listNode.find('button').get())
                    // convert array of button elements to array of label texts
                    .map(function (button) { return Utils.getControlLabel($(button)); })
                    // filter trailing undefined values of buttons without labels
                    .filter(_.isString)
                    // calculate the insertion index of the new list item (ignoring case)
                    .sortedIndex(label, function (label) { return label.toLowerCase(); })
                    // exit the call chain, returns result of sortedIndex()
                    .value();
            }

            // insert the new list item element
            if ((0 <= index) && (index < listNode.children().length)) {
                listNode.children().eq(index).before(listItem);
            } else {
                listNode.append(listItem);
            }

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
