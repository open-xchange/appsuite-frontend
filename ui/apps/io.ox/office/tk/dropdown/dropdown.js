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

define('io.ox/office/tk/dropdown/dropdown',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/group'
    ], function (Utils, Group) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // CSS class for the group node, if drop-down menu is opened
        MENUOPEN_CLASS = 'menu-open';

    // class DropDown =========================================================

    /**
     * Extends a Group object with a drop-down menu. Creates a new drop-down
     * button in the group and extends it with a caret sign. Implements mouse
     * and keyboard event handling for the drop-down button (open, close,
     * automatic close of the drop-down menu on focus navigation). Adds new
     * methods to the group to control the drop-down button and menu.
     *
     * Note: This is a mix-in class supposed to extend an existing instance of
     * the class Group or one of its derived classes. Expects the symbol 'this'
     * to be bound to an instance of Group.
     *
     * @constructor
     *
     * @param {HTMLElement|jQuery} contentNode
     *  The contents of the drop down menu.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the drop-down button.
     *  Supports all generic button formatting options (see method
     *  Utils.createButton() for details). Additionally, the following options
     *  are supported:
     *  @param {Boolean} [options.plainCaret]
     *      If set to true, the drop-down button will not contain a caption or
     *      any other formatting, regardless of the other settings in the
     *      options object.
     */
    function DropDown(contentNode, options) {

        var // self reference (the Group instance)
            self = this,

            // the root node of the group object
            groupNode = this.getNode(),

            // the icon for the drop-down caret
            caretIcon = Utils.createIcon('caret-icon', Utils.getBooleanOption(options, 'whiteIcon')).addClass('down'),

            // the drop-down caret
            caretSpan = $('<span>').addClass('dropdown-caret').append(caretIcon),

            // plain caret button, or button with caption and formatting
            plainCaret = Utils.getBooleanOption(options, 'plainCaret', false),

            // the drop-down button
            menuButton = Utils.createButton(plainCaret ? {} : options).addClass('dropdown-button').append(caretSpan),

            // the drop-down menu element
            menuNode = $('<div>').addClass('dropdown-menu').append(contentNode),

            // additional controls that toggle the drop-down menu
            menuToggleControls = $();

        // private methods ----------------------------------------------------

        /**
         * Changes the visibility of the drop-down menu. Triggers a 'menuopen'
         * or 'menuclose' event at the group.
         *
         * @param {Boolean|Null} state
         *  If set to true, the drop-down menu will be displayed. If set to
         *  false, the drop-down menu will be hidden. If set to null, the
         *  drop-down menu will be toggled according to its current visibility.
         */
        function toggleMenu(state) {

            var // whether to show or hide the menu
                show = (state === true) || ((state !== false) && !self.isMenuVisible());

            if (show && !self.isMenuVisible()) {
                groupNode.addClass(MENUOPEN_CLASS);
                self.trigger('menuopen');
                // Add a global click handler to close the menu automatically
                // when clicking somewhere in the page. Listening to the
                // 'mousedown' event will catch all real mouse clicks and close
                // the menu immediately ('click' events will not be generated
                // by the browser when selecting a text range over several text
                // spans or paragraphs). It is still needed to listen to real
                // 'click' events which may be triggered indirectly, e.g. after
                // pressing a button with the keyboard. The event handler will
                // be attached in a timeout handler, otherwise it would close
                // the drop-down menu immediately after it has been opened with
                // a mouse click on the drop-down button while the event
                // bubbles up to the document root.
                window.setTimeout(function () {
                    $(document).on('mousedown click', globalClickHandler);
                }, 0);
            } else if (!show && self.isMenuVisible()) {
                // move focus to drop-down button, if drop-down menu is focused
                if (Utils.containsFocusedControl(menuNode)) {
                    menuButton.focus();
                }
                groupNode.removeClass(MENUOPEN_CLASS);
                self.trigger('menuclose');
                $(document).off('mousedown click', globalClickHandler);
            }
        }

        /**
         * Handles click events from the drop-down button, toggles the
         * drop-down menu.
         */
        function menuButtonClickHandler() {

            // do nothing (but the 'cancel' event) if the group is disabled
            if (self.isEnabled()) {

                // WebKit does not focus the clicked button, which is needed to
                // get keyboard control in the drop-down menu
                if (!Utils.isControlFocused(menuButton)) {
                    menuButton.focus();
                }

                // toggle the menu, this triggers the 'menuopen'/'menuclose' listeners
                toggleMenu(null);
            }

            // trigger 'cancel' event, if menu has been closed with mouse click
            if (!self.isMenuVisible()) {
                self.trigger('cancel');
            }
        }

        /**
         * Handles mouse clicks everywhere on the page. Closes the drop-down
         * menu automatically.
         */
        function globalClickHandler(event) {

            // Returns whether one of the specified nodes contains the DOM
            // element in event.target, or if it is the event.target by itself.
            function isTargetIn(nodes) {
                return nodes.filter(event.target).length || nodes.has(event.target).length;
            }

            // Close the menu unless a 'mousedown' event occurred inside the
            // menu node or on the drop-down button.
            if ((event.type !== 'mousedown') || !isTargetIn(menuButton.add(menuNode).add(menuToggleControls))) {
                toggleMenu(false);
            }
        }

        /**
         * Handles keyboard events from any control in the group object.
         */
        function groupKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown';

            switch (event.keyCode) {
            case KeyCodes.DOWN_ARROW:
                if (keydown) { toggleMenu(true); self.grabMenuFocus(); }
                return false;
            case KeyCodes.UP_ARROW:
                if (keydown) { toggleMenu(false); }
                return false;
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
                if (keyup) {
                    toggleMenu(null);
                    if (self.isMenuVisible()) {
                        self.grabMenuFocus();
                    }
                }
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
            if ((event.type === 'keydown') && (event.keyCode === KeyCodes.TAB) && !event.ctrlKey && !event.altKey && !event.metaKey) {
                // move focus to drop-down button, needed for correct
                // keyboard focus navigation (find next/previous control)
                menuButton.focus();
                // always let the TAB key event bubble up to the view component
            }
        }

        // methods ------------------------------------------------------------

        /**
         * A simple boolean marker to test whether the group contains a
         * drop-down menu.
         */
        this.hasDropDown = true;

        /**
         * Returns the drop-down button added to the group.
         */
        this.getMenuButton = function () {
            return menuButton;
        };

        /**
         * Returns the drop-down menu element added to the group.
         */
        this.getMenuNode = function () {
            return menuNode;
        };

        /**
         * Returns whether the drop-down menu is currently visible.
         */
        this.isMenuVisible = function () {
            return groupNode.hasClass(MENUOPEN_CLASS);
        };

        /**
         * Shows the drop-down menu.
         */
        this.showMenu = function () {
            toggleMenu(true);
        };

        /**
         * Shows the drop-down menu.
         */
        this.hideMenu = function () {
            toggleMenu(false);
        };

        /**
         * Sets the focus into the first control element of the drop-down menu
         * element. Intended to be overwritten by derived classes.
         */
        this.grabMenuFocus = function () {
        };

        /**
         * Registers additional controls that will toggle the drop-down menu on
         * 'click' events.
         *
         * @param {jQuery} controls
         *  The controls to be registered as menu toggle controls.
         */
        this.addMenuToggleControls = function (controls) {
            controls
                .on('click', menuButtonClickHandler)
                .on('keydown keypress keyup', menuButtonKeyHandler);
            menuToggleControls = menuToggleControls.add(controls);
        };

        /**
         * Unregisters additional controls that have been registered to toggle
         * the drop-down menu on 'click' events.
         *
         * @param {jQuery} controls
         *  The controls to be unregistered as menu toggle controls.
         */
        this.removeMenuToggleControls = function (controls) {
            controls
                .off('click', menuButtonClickHandler)
                .off('keydown keypress keyup', menuButtonKeyHandler);
            menuToggleControls = menuToggleControls.not(controls);
        };

        // initialization -----------------------------------------------------

        // marker class for extended formatting
        groupNode.addClass('dropdown-group');

        // append menu button and menu to the group container
        this.addFocusableControl(menuButton).addChildNodes(menuNode);

        // register event handlers, prepare drop-down button
        this.on('change cancel', function () { toggleMenu(false); });
        groupNode
            .on('keydown keypress keyup', groupKeyHandler)
            .on('blur:key', Group.FOCUSABLE_SELECTOR, function () { toggleMenu(false); });
        menuButton
            .on('click', menuButtonClickHandler)
            .on('keydown keypress keyup', menuButtonKeyHandler);
        menuNode.on('keydown keypress keyup', menuKeyHandler);

    } // class DropDown

    // exports ================================================================

    return _.makeExtendable(DropDown);

});
