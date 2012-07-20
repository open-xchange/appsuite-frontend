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
     'io.ox/office/tk/dropdown/menu'
    ], function (Utils, Menu) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class List =============================================================

    /**
     * Extends a Group object with a drop-down button and a drop-down menu
     * containing a list of items. Extends the Menu mix-in class with
     * functionality specific to the list drop-down element.
     *
     * Note: This is a mix-in class supposed to extend an existing instance of
     * the class Group or one of its derived classes.
     *
     * @extends Menu
     *
     * @param {Group} group
     *  The group object to be extended with a drop-down menu.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the list. Supports all
     *  options of the Menu base class. Additionally, the following options are
     *  supported:
     *  @param {Boolean} [options.sorted]
     *      if set to true, the list items will be inserted sorted by their
     *      label text. Otherwise, list items will be appended to the list.
     */
    function extend(group, options) {

        var // the container element for all list items
            listNode = $('<ul>'),

            // sorted list items
            sorted = Utils.getBooleanOption(options, 'sorted', false),

            // number of items to skip for page up/down keys
            itemsPerPage = 1;

        // private methods ----------------------------------------------------

        /**
         * Handles 'menuopen' events and initializes the drop-down menu.
         */
        function menuOpenHandler(event, from) {

            var // the outer menu node containing the list element
                menuNode = group.getMenuNode(),
                // all list items (button elements)
                buttons = group.getListItems(),
                // width of the drop-down group buttons (used as min-width of the menu)
                minWidth = group.getNode().width(),
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
                group.getListItems().first().focus();
            }
        }

        /**
         * Handles key events in the open list menu element.
         */
        function listKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown',
                // all list items (button elements)
                buttons = group.getListItems(),
                // index of the focused list item
                index = buttons.index(event.target);

            switch (event.keyCode) {
            case KeyCodes.UP_ARROW:
                if (keydown) {
                    if (index > 0) { buttons.eq(index - 1).focus(); } else { group.hideMenu('key'); }
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

        // base constructor ---------------------------------------------------

        Menu.extend(group, options);

        // methods ------------------------------------------------------------

        /**
         * Returns all button elements representing the list items.
         */
        group.getListItems = function () {
            return listNode.find('button');
        };

        /**
         * Adds a new item to this list. If the list items are sorted (see the
         * options passed to the constructor), the item will be inserted
         * according to its text label. If the item does not have a text label,
         * it will be appended.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new button
         *  representing the item. See method Utils.createButton() for details.
         *
         * @returns {jQuery}
         *  The button element representing the new list item, as jQuery
         *  collection.
         */
        group.createListItem = function (options) {

            var // create the button element representing the list item
                button = Utils.createButton(options),
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

            return button;
        };

        // initialization -----------------------------------------------------

        // initialize the drop-down element
        group.getMenuNode().addClass('list').append(listNode);

        // register event handlers
        group.on('menuopen', menuOpenHandler);
        listNode.on('keydown keypress keyup', listKeyHandler);

    } // class List

    // exports ================================================================

    return { extend: extend };

});
