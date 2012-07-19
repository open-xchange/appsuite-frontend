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

define('io.ox/office/tk/dropdown/menu', ['io.ox/office/tk/utils'], function (Utils) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // CSS class for the group node, if drop-down menu is opened
        MENUOPEN_CLASS = 'menu-open';

    // class Menu =============================================================

    /**
     * Extends a Group object with a drop-down button and menu. Implements
     * mouse and keyboard event handling for the drop-down button (open, close,
     * automatic close of the drop-down menu on focus navigation). Adds new
     * methods to the group.
     *
     * @param {Group} group
     *  The group object to be extended with a drop-down menu.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the drop-down button.
     *  Supports all generic formatting options for buttons (see method
     *  Utils.createButton() for details).
     */
    function extend(group, options) {

        var // the root node of the group object
            groupNode = group.getNode(),

            // the drop-down button
            menuButton = Utils.createButton(options),

            // the drop-down menu element
            menuNode = $('<div>').addClass('dropdown-menu');

        // private methods ----------------------------------------------------

        /**
         * Returns whether the drop-down menu is currently visible.
         */
        function isMenuVisible() {
            return groupNode.hasClass(MENUOPEN_CLASS);
        }

        /**
         * Changes the visibility of the drop-down menu. Triggers a 'menuopen'
         * or 'menuclose' event at the group, passing the value of the
         * parameter from.
         *
         * @param {Boolean|Null} state
         *  If set to true, the drop-down menu will be displayed. If set to
         *  false, the drop-down menu will be hidden. If set to null, the
         *  drop-down menu will be toggled according to its current visibility.
         *
         * @param {String} [from]
         *  Specifies the origin of the method call. May be set to 'key' if the
         *  method has been called from a keyboard event handler, or to
         *  'mouse', if the method has been called from a mouse click handler.
         */
        function toggleMenu(state, from) {

            var // whether to show or hide the menu
                show = (state === true) || ((state !== false) && !isMenuVisible());

            if (show) {
                groupNode.addClass(MENUOPEN_CLASS);
                group.trigger('menuopen', from);
                // Add a global click handler to close the menu automatically
                // when clicking somewhere in the page. Listeining to the
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
            } else {
                // move focus to drop-down button, if drop-down menu is focused
                if (Utils.containsFocusedControl(menuNode)) {
                    menuButton.focus();
                }
                groupNode.removeClass(MENUOPEN_CLASS);
                group.trigger('menuclose', from);
                $(document).off('mousedown click', globalClickHandler);
            }
        }

        /**
         * Handles click events from the drop-down button, triggering the
         * drop-down menu.
         */
        function menuButtonClickHandler() {

            // do nothing (but the 'cancel' event) if the drop-down control is disabled
            if (Utils.isControlEnabled(menuButton)) {

                // WebKit does not focus the clicked button, which is needed to
                // get keyboard control in the drop-down menu
                if (!Utils.isControlFocused(menuButton)) {
                    menuButton.focus();
                }

                // toggle the menu, this triggers the 'menuopen'/'menuclose' listeners
                toggleMenu(null, 'mouse');
            }

            // trigger 'cancel' event, if menu has been closed with mouse click
            if (!isMenuVisible()) {
                group.trigger('cancel');
            }
        }

        /**
         * Handles mouse clicks everywhere on the page. Closes the drop-down
         * menu automatically.
         */
        function globalClickHandler(event) {

            var // clicked inside the drop-down menu or on the drop-down button
                innerClick = (event.target === menuButton.get(0)) || (event.target === menuNode.get(0)) || menuNode.has(event.target).length;

            // do not close the menu in a 'mousedown' event, if clicked inside
            // the menu or on the drop-down button
            if (!innerClick || (event.type !== 'mousedown')) {
                toggleMenu(false, 'mouse');
            }
        }

        /**
         * Handles keyboard events in the focused drop-down button.
         */
        function menuButtonKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown',
                keyup = event.type === 'keyup';

            switch (event.keyCode) {
            case KeyCodes.SPACE:
            case KeyCodes.ENTER:
                if (keyup) { toggleMenu(null, 'key'); }
                return false;
            case KeyCodes.DOWN_ARROW:
                if (keydown) { toggleMenu(true, 'key'); }
                return false;
            case KeyCodes.UP_ARROW:
                if (keydown) { toggleMenu(false, 'key'); }
                return false;
            case KeyCodes.ESCAPE:
                if (keydown) { toggleMenu(false, 'key'); }
                break; // let ESCAPE key bubble up
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
                    // keyboard focus navigation (find next/previous control)
                    if (keydown) { menuButton.focus(); }
                }
                // let the TAB key event bubble up to the tool bar
                break;
            case KeyCodes.ESCAPE:
                if (keydown) { toggleMenu(false, 'key'); }
                // let ESCAPE key bubble up
                break;
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the drop-down button added to the group.
         */
        group.getMenuButton = function () {
            return menuButton;
        };

        /**
         * Returns the drop-down menu element added to the group.
         */
        group.getMenuNode = function () {
            return menuNode;
        };

        /**
         * Displays the drop-down menu.
         *
         * @param {String} [from]
         *  Specifies the origin of the method call. May be set to 'key' if the
         *  method has been called from a keyboard event handler, or to
         *  'mouse', if the method has been called from a mouse click handler.
         *
         * @returns {Group}
         *  A reference to the group.
         */
        group.showMenu = function (from) {
            toggleMenu(true, from);
            return group;
        };

        /**
         * Hides the drop-down menu.
         *
         * @param {String} [from]
         *  Specifies the origin of the method call. May be set to 'key' if the
         *  method has been called from a keyboard event handler, or to
         *  'mouse', if the method has been called from a mouse click handler.
         *
         * @returns {Group}
         *  A reference to the group.
         */
        group.hideMenu = function (from) {
            toggleMenu(false, from);
            return group;
        };

        // initialization -----------------------------------------------------

        // marker class for extended formatting
        groupNode.addClass('dropdown-group');

        // append button and menu to the group container
        group.addFocusableControl(menuButton).addControl(menuNode);

        // prepare drop-down button, and register event handlers
        menuButton
            .append($('<span>').append($('<i>').addClass('icon-io-ox-caret')))
            .on('click', menuButtonClickHandler)
            .on('keydown keypress keyup', menuButtonKeyHandler)
            .on('blur:key', function () { group.hideMenu(); });
        menuNode.on('keydown keypress keyup', menuKeyHandler);

    } // class Menu

    // exports ================================================================

    return { extend: extend };

});
