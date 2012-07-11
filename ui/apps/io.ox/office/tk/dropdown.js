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

define('io.ox/office/tk/dropdown',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/group'
    ], function (Utils, Group) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // CSS class for the group node, if drop-down menu is opened
        OPEN_CLASS = 'open';

    // class DropDown =========================================================

    /**
     * Creates a container element with a drop-down button shown on top.
     * Implements keyboard event handling for the drop-down button (open,
     * close, automatic close of the drop-down menu on focus navigation).
     *
     * @constructor
     *
     * @extends Group
     *
     * @param {String} key
     *  The unique key of the group. This key is shared by all buttons
     *  inserted into this group.
     *
     * @param {Object} options
     *  A map of options to control the properties of the drop-down button.
     *  Supports all generic formatting options for the drop-down button (see
     *  method Utils.createButton() for details. Additionally, the following
     *  options are supported:
     *  @param {Boolean} [options.split]
     *      If set to true, will separate the drop-down button and the
     *      drop-down caret, allowing to trigger a default action with the
     *      button, and to optionally show the drop-down menu. If set to false,
     *      the entire drop-down button will toggle the drop-down menu.
     *  @param {String} [options.caretTooltip]
     *      If specified, will set a different tool tip to the drop-down caret
     *      button. Will be used in split mode (options.split set to true)
     *      only. If omitted, the standard tool tip (options.tooltip) will be
     *      used for both buttons.
     *  @param {Any} [options.defaultValue]
     *      If specified, the click handler of the action button will return
     *      this value. Will be used in split mode (options.split set to true)
     *      only.
     *
     * @param {jQuery} dropDownMenu
     *  The drop-down menu container element, as jQuery collection.
     */
    function DropDown(key, options, menuNode) {

        var // self reference to be used in event handlers
            self = this,

            // split button mode, or simple drop-down mode
            split = Utils.getBooleanOption(options, 'split'),

            // split button mode, or simple drop-down mode
            defaultValue = Utils.getOption(options, 'defaultValue'),

            // the action button (either triggering a default action, or toggling the drop-down menu)
            actionButton = Utils.createButton(key, options).addClass(Group.FOCUSABLE_CLASS),

            // the drop-down button in split mode (pass 'options' for formatting, but drop any contents)
            caretTooltip = Utils.getStringOption(options, 'caretTooltip'),
            caretOptions = caretTooltip ? Utils.extendOptions(options, { tooltip: caretTooltip }) : options,
            caretButton = split ? Utils.createButton(key, caretOptions).addClass(Group.FOCUSABLE_CLASS + ' caret-button').empty() : $(),

            // reference to the button that triggers the drop-down menu
            menuButton = split ? caretButton : actionButton;

        // private methods ----------------------------------------------------

        /**
         * Returns whether the drop-down menu is currently visible.
         */
        function isMenuVisible() {
            return self.getNode().hasClass(OPEN_CLASS);
        }

        /**
         * Changes the visibility of the drop-down menu.
         *
         * @param {Boolean} [state]
         *  If set to true, the drop-down menu will be displayed. If set to
         *  false, the drop-down menu will be hidden. If omitted (or set to
         *  undefined or null), the drop-down menu will be toggled according to
         *  its current visibility.
         *
         * @param {Boolean} [fromKeyEvent]
         *  If set to true, the call originates from a keyboard event.
         */
        function toggleMenu(state, fromKeyEvent) {

            var // the source type passed to the 'menuopen'/'menuclose' event handlers
                from = fromKeyEvent ? 'key' : 'click',
                // whether to show or hide the menu
                show = (state === true) || ((state !== false) && !isMenuVisible());

            if (show) {
                self.getNode().addClass(OPEN_CLASS);
                self.trigger('menuopen', from);
                window.setTimeout(function () { $('html').on('click', globalClickHandler); }, 0);
            } else {
                // move focus to drop-down button, if control in drop-down menu is focused
                if (Utils.containsFocusedControl(menuNode)) {
                    menuButton.focus();
                }
                self.getNode().removeClass(OPEN_CLASS);
                self.trigger('menuclose', from);
                $('html').off('click', globalClickHandler);
            }
        }

        /**
         * Handles click events from the drop-down button that opens the
         * drop-down menu. In split mode, this is the separated caret button.
         */
        function menuButtonClickHandler() {

            // WebKit does not set focus to clicked button, which is needed to
            // get keyboard control in the drop-down menu
            if (!Utils.isControlFocused(menuButton)) {
                menuButton.focus();
            }

            // toggle the menu, this triggers the 'menuopen'/'menuclose' listeners
            toggleMenu(null, false);

            // trigger 'cancel' event, if menu has been closed with mouse click
            if (!isMenuVisible()) {
                self.trigger('cancel');
            }
        }

        /**
         * Handles mouse clicks everywhere on the page. Closes the drop-down
         * menu automatically.
         */
        function globalClickHandler() {
            toggleMenu(false);
        }

        /**
         * Handles keyboard events in one of the focused buttons. In split
         * mode, the handler will be executed for both buttons. Adds special
         * handling for opening the drop-down menu via keyboard.
         */
        function buttonKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown';

            switch (event.keyCode) {
            case KeyCodes.DOWN_ARROW:
                if (keydown) { toggleMenu(true, true); }
                return false;
            case KeyCodes.UP_ARROW:
                if (keydown) { toggleMenu(false, true); }
                return false;
            case KeyCodes.ESCAPE:
                if (keydown) { toggleMenu(false, true); }
                break; // let ESCAPE key bubble up
            }
        }

        /**
         * Handles keyboard events in the focused drop-down button.
         */
        function menuButtonKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keyup = event.type === 'keyup';

            switch (event.keyCode) {
            case KeyCodes.SPACE:
            case KeyCodes.ENTER:
                if (keyup) { toggleMenu(null, true); }
                return false;
            }

            // suppress 'keypress' event for SPACE bar (event.keyCode may be zero in Firefox)
            if ((event.type === 'keypress') && (event.charCode === KeyCodes.SPACE)) {
                return false;
            }
        }

        /**
         * Handles keyboard events inside the open drop-down menu.
         */
        function menuKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown';

            switch (event.keyCode) {
            case KeyCodes.TAB:
                if (!event.ctrlKey && !event.altKey && !event.metaKey) {
                    // move focus to drop-down button, needed for correct
                    // keyboard focus navigation (find next/previous button)
                    if (keydown) { menuButton.focus(); }
                }
                // let the TAB key event bubble up to the tool bar
                break;
            case KeyCodes.ESCAPE:
                if (keydown) { toggleMenu(false, true); }
                // let ESCAPE key bubble up
                break;
            }
        }

        // base constructor ---------------------------------------------------

        // pass the drop-down menu node as action root node
        Group.call(this, menuNode);

        // methods ------------------------------------------------------------

        /**
         * Replaces the contents of the drop-down button with the passed
         * elements, and appends a caret sign (unless this group is in split
         * mode).
         */
        this.replaceButtonContents = function (nodes) {
            actionButton.empty().append(nodes).appendCaret();
            return this;
        };

        /**
         * Displays the drop-down menu.
         */
        this.showMenu = function (fromKeyEvent) {
            toggleMenu(true, fromKeyEvent);
            return this;
        };

        /**
         * Hides the drop-down menu.
         */
        this.hideMenu = function (fromKeyEvent) {
            toggleMenu(false, fromKeyEvent);
            return this;
        };

        // initialization -----------------------------------------------------

        // helper function appending a caret sign to the contents of the drop-down button
        actionButton.appendCaret = function () { return this; };
        menuButton.appendCaret = function () {
            if (this.contents().length) {
                this.append($('<span>').addClass('whitespace'));
            }
            return this.append($('<i>').addClass('icon-io-ox-caret'));
        };

        // in split mode, register a action handler for the action button
        if (split) {
            this.registerActionHandler(actionButton, 'click', function () { return defaultValue; });
        }

        // register event handlers for both buttons
        actionButton.add(caretButton)
            .on('keydown keypress keyup', buttonKeyHandler);

        // prepare drop-down button, and register event handlers
        menuButton
            .appendCaret()
            .on('click', menuButtonClickHandler)
            .on('keydown keypress keyup', menuButtonKeyHandler)
            .on('blur:key', function () { self.hideMenu(); });

        // prepare drop-down menu, and register event handlers
        menuNode
            .addClass('dropdown-menu')
            .on('keydown keypress keyup', menuKeyHandler);

        // append buttons and menu to the group container
        this.getNode().append(actionButton, caretButton, menuNode);

    } // class DropDown

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: DropDown });

});
