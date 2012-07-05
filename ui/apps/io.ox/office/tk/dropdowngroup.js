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

define('io.ox/office/tk/dropdowngroup',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/controlgroup'
    ], function (Utils, ControlGroup) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class DropDownGroup ====================================================

    /**
     * Creates a container element with a single drop-down button shown on top.
     * Implements keyboard event handling for the drop-down button (open,
     * close, automatic close of the drop-down menu on focus navigation).
     *
     * @constructor
     *
     * @param {String} key
     *  The unique key of the group. This key is shared by all buttons
     *  inserted into this group.
     *
     * @param {Object} options
     *  A map of options to control the properties of the drop-down button.
     *  Supports all generic formatting options for the drop-down button (see
     *  method Utils.createButton() for details).
     *
     * @param {Boolean} split
     *  If set to true, will separate the drop-down button and the drop-down
     *  caret, allowing to trigger a default action with the button, and to
     *  optionally show the drop-down menu. If set to false, the entire
     *  drop-down button will toggle the drop-down menu.
     *
     * @param {jQuery} dropDownMenu
     *  The drop-down menu container element, as jQuery collection.
     */
    function DropDownGroup(key, options, split, menuNode) {

        var // self reference to be used in event handlers
            self = this,

            // the action button (either triggering a default action, or toggling the drop-down menu)
            actionButton = Utils.createButton(key, options),

            // the drop-down button in split mode (pass 'options' for formatting, but drop any contents)
            caretButton = split ? Utils.createButton(key, options).empty() : $(),

            // reference to the button that triggers the drop-down menu
            menuButton = split ? caretButton : actionButton,

            // if set to true, toggling the drop-down menu was done with keyboard
            menuWithKeyboard = false;

        // private methods ----------------------------------------------------

        function triggerMenuButton(fromKeyEvent) {
            // remember parameter in local variable, will be reset in click handler
            menuWithKeyboard = fromKeyEvent === true;
            // click drop-down button, this triggers the click listeners
            menuButton.click();
        }

        function toggleMenu(state, fromKeyEvent) {
            if (self.isMenuVisible()) {
                if (state !== true) {
                    // move focus to drop-down button, if control in drop-down menu is focused
                    if (Utils.containsFocusedControl(menuNode)) {
                        menuButton.focus();
                    }
                    triggerMenuButton(fromKeyEvent);
                } else if (fromKeyEvent) {
                    // menu already open, trigger 'menu:focus' event manually
                    self.trigger('menu:focus');
                }
            } else if (state !== false) {
                triggerMenuButton(fromKeyEvent);
            }
        }

        function menuButtonClickHandler() {
            if (!self.isMenuVisible()) {
                // After a click on the drop-down button with hidden drop-down
                // menu, wait for Bootstrap to open the menu, and trigger the
                // 'menu:open' event afterwards. This ensures that listeners
                // will be executed with a visible drop-down menu.
                window.setTimeout(function () {
                    self.trigger('menu:open');
                    // if menu has been opened by keyboard, trigger a
                    // 'menu:focus' event requesting clients to move the focus
                    // into the drop-down menu
                    if (menuWithKeyboard) {
                        self.trigger('menu:focus');
                    }
                }, 0);
            } else if (!menuWithKeyboard) {
                // if menu has been closed with a mouse click, trigger a
                // 'menu:cancel' event allowing clients to handle this event
                self.trigger('menu:cancel');
            }
            menuWithKeyboard = false;
        }

        /**
         * Handles key events in the focused drop-down button. Adds special
         * handling for opening the drop-down menu via keyboard.
         */
        function menuButtonKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown',
                keyup = event.type === 'keyup';

            switch (event.keyCode) {
            case KeyCodes.SPACE:
            case KeyCodes.ENTER:
                if (keyup) { toggleMenu(null, true); }
                return false;
            case KeyCodes.DOWN_ARROW:
                if (keydown) { toggleMenu(true, true); }
                return false;
            case KeyCodes.UP_ARROW:
                if (keyup) { toggleMenu(false, true); }
                return false;
            case KeyCodes.ESCAPE:
                // let ESCAPE key bubble up, if drop-down menu is already closed
                if (self.isMenuVisible()) {
                    if (keyup) { toggleMenu(false, true); }
                    return false;
                }
                break;
            }

            // suppress 'keypress' event for SPACE bar (event.keyCode may be zero in Firefox)
            if ((event.type === 'keypress') && (event.charCode === KeyCodes.SPACE)) {
                return false;
            }
        }

        /**
         * Handles key events inside the open drop-down menu.
         */
        function menuKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown';

            switch (event.keyCode) {
            case KeyCodes.ESCAPE:
                if (keydown) { toggleMenu(false, true); }
                return false;
            case KeyCodes.TAB:
                if (!event.ctrlKey && !event.altKey && !event.metaKey) {
                    // move focus to drop-down button, needed for correct
                    // keyboard focus navigation (find next/previous button)
                    if (keydown) { menuButton.focus(); }
                }
                // let the TAB key event bubble up to the tool bar
                break;
            }
        }

        // base constructor ---------------------------------------------------

        ControlGroup.call(this);

        // methods ------------------------------------------------------------

        /**
         * Focuses the drop-down button that toggles the drop-down menu, unless
         * this group already contains the control that is currently focused.
         */
        this.grabFocus = function () {
            if (!this.hasFocus()) {
                menuButton.focus();
            }
            return this;
        };

        /**
         * Returns the button element triggering the default action (in split
         * mode).
         */
        this.getActionButton = function () {
            return actionButton;
        };

        /**
         * Replaces the contents of the drop-down button with the passed
         * elements, and appends a caret sign.
         */
        this.replaceButtonContents = function (nodes) {
            actionButton.empty().append(nodes).appendCaret();
            return this;
        };

        /**
         * Returns whether the drop-down menu is currently visible.
         */
        this.isMenuVisible = function () {
            return menuNode.css('display') !== 'none';
        };

        /**
         * Shows the drop-down menu unless it is already visible.
         */
        this.showMenu = function () {
            toggleMenu(true);
            return this;
        };

        /**
         * Hides the drop-down menu unless it is already hidden.
         */
        this.hideMenu = function () {
            toggleMenu(false);
            return this;
        };

        /**
         * Toggles the visibility of the drop-down menu.
         */
        this.toggleMenu = function () {
            toggleMenu();
            return this;
        };

        // overwrite the hide() method; add hiding the drop-down menu
        (function () {
            var baseMethod = self.hide;
            self.hide = function () {
                this.hideMenu();
                return baseMethod.call(this);
            };
        }());

        // initialization -----------------------------------------------------

        // helper function appending a caret sign to the contents of the drop-down button
        actionButton.appendCaret = function () { return this; };
        menuButton.appendCaret = function () {
            if (this.contents().length) {
                this.append($('<span>').addClass('whitespace'));
            }
            return this.append($('<span>').addClass('caret'));
        };

        // prepare drop-down button, and register event handlers
        menuButton
            .appendCaret()
            .addClass('dropdown-toggle')
            .attr('data-toggle', 'dropdown')
            .on('click', menuButtonClickHandler)
            .on('keydown keypress keyup', menuButtonKeyHandler)
            .on('blur:key', _.bind(this.hideMenu, this));

        // prepare drop-down menu, and register event handlers
        menuNode
            .addClass('dropdown-menu ' + ControlGroup.HIDDEN_CLASS)
            .on('keydown keypress keyup', menuKeyHandler);

        // append buttons and menu to the group container
        this.getNode().append(actionButton, caretButton, menuNode);

    } // class DropDownGroup

    // exports ================================================================

    // derive this class from class ControlGroup
    return ControlGroup.extend({ constructor: DropDownGroup });

});
