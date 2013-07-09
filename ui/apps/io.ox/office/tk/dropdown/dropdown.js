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

        // marker CSS class for groups with opened drop-down menu
        OPEN_CLASS = 'dropdown-open';

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
     * @param {Object} [options]
     *  A map of options to control the properties of the drop-down button.
     *  Supports all generic button formatting options (see method
     *  Utils.createButton() for details). Additionally, the following options
     *  are supported:
     *  @param {String} [options.caret='add']
     *      Specifies the appearance of the drop-down caret icon at the right
     *      border of the drop-down menu button. If set to 'add' or omitted,
     *      the caret icon will be added to the caption as specified in this
     *      options map. If set to 'none', the caret will not appear. If set to
     *      'only', the caret icon will be the only contents of the drop-down
     *      button, regardless of the other settings in the options map.
     *  @param {Boolean} [options.autoLayout=false]
     *      If set to true, the drop-down menu will be positioned and sized
     *      automatically. If the available space is not sufficient for the
     *      contents of the drop-down menu, scroll bars will be displayed. If
     *      set to false (or omitted), the drop-down menu will appear below the
     *      group node and will be sized according to the drop-down menu
     *      contents even if the menu exceeds the browser window.
     *  @param {String} [options.menuAlign='left']
     *      In automatic layout mode (see option 'options.autoLayout' above),
     *      specifies the preferred horizontal position of the drop-down menu.
     *      The value 'left' tries to align the left borders of the drop-down
     *      menu and the group node, the value 'right' tries to align the right
     *      borders, and the value 'center' tries to place the drop-down menu
     *      centered to the group node.
     */
    function DropDown(options) {

        var // self reference (the Group instance)
            self = this,

            // the root node of the group object
            groupNode = this.getNode(),

            // appearance of the caret icon
            caretMode = Utils.getStringOption(options, 'caret', 'add'),

            // automatic position and size of the drop-down menu
            autoLayout = Utils.getBooleanOption(options, 'autoLayout', false),

            // horizontal alignment of the drop-down menu
            menuAlign = Utils.getStringOption(options, 'menuAlign', 'left'),

            // the drop-down button
            menuButton = Utils.createButton((caretMode === 'only') ? {} : options).addClass('dropdown-button'),

            // the drop-down menu element containing the menu view component
            menuNode = $('<div>').addClass('io-ox-office-main dropdown-container'),

            // additional controls that toggle the drop-down menu
            menuToggleControls = $(),

            // current size of the drop-down menu (calculated when opening the menu)
            menuNodeSize = null;

        // private methods ----------------------------------------------------

        /**
         * Initializes the size and position of the drop-down menu.
         */
        function windowResizeHandler() {

            var // position and size of the parent group node
                groupPosition = self.getNodePosition(),
                // the sizes available at every side of the group node
                availableSizes = self.getAvailableMenuSizes(),
                // resulting width and height available for the menu node
                availableWidth = 0, availableHeight = 0,
                // new CSS properties of the menu node
                menuNodeProps = { top: '', bottom: '', left: '', right: '' },
                // the side of the group node preferred for the drop-down menu
                preferredSide = null, maxRatio = 0;

            // returns the left offset of the drop-down menu according to the preferred alignment
            function getLeftOffset(width) {

                var offset = 0;

                switch (menuAlign) {
                case 'right':
                    offset = groupPosition.left + groupPosition.width - width;
                    break;
                case 'center':
                    offset = groupPosition.left + Math.floor((groupPosition.width - width) / 2);
                    break;
                default:
                    offset = groupPosition.left;
                }

                return Utils.minMax(offset, DropDown.WINDOW_BORDER_PADDING, window.innerWidth - DropDown.WINDOW_BORDER_PADDING - width);
            }

            // calculate the ratio of the menu node being visible at every side of the group
            _(availableSizes).each(function (size) {
                size.ratio = Math.min(size.width / menuNodeSize.width, 1) * Math.min(size.height / menuNodeSize.height, 1);
            });

            // prefer the best side that can take the menu node, in the given order
            _(['bottom', 'top', 'right', 'left']).find(function (side) {
                var ratio = availableSizes[side].ratio;
                if (ratio >= 1) {
                    preferredSide = side;
                    return true;
                } else if (ratio > maxRatio) {
                    preferredSide = side;
                    maxRatio = ratio;
                }
            });

            // extract available width and height
            availableWidth = availableSizes[preferredSide].width;
            availableHeight = availableSizes[preferredSide].height;

            // first part of the position of the drop-down menu
            switch (preferredSide) {
            case 'top':
                menuNodeProps.bottom = window.innerHeight - groupPosition.top + DropDown.GROUP_BORDER_PADDING;
                break;
            case 'bottom':
                menuNodeProps.top = groupPosition.top + groupPosition.height + DropDown.GROUP_BORDER_PADDING;
                break;
            case 'left':
                menuNodeProps.right = window.innerWidth - groupPosition.left + DropDown.GROUP_BORDER_PADDING;
                break;
            case 'right':
                menuNodeProps.left = groupPosition.left + groupPosition.width + DropDown.GROUP_BORDER_PADDING;
                break;
            }

            // add space for scroll bars if available width or height is not sufficient
            menuNodeProps.width = Math.min(availableWidth, menuNodeSize.width + ((menuNodeSize.height > availableHeight) ? Utils.SCROLLBAR_WIDTH : 0));
            menuNodeProps.height = Math.min(availableHeight, menuNodeSize.height + ((menuNodeSize.width > availableWidth) ? Utils.SCROLLBAR_HEIGHT : 0));

            // second part of the position of the drop-down menu (do not exceed bottom or right border of browser window)
            switch (preferredSide) {
            case 'top':
            case 'bottom':
                menuNodeProps.left = getLeftOffset(menuNodeProps.width);
                break;
            case 'left':
            case 'right':
                menuNodeProps.top = Math.min(groupPosition.top, window.innerHeight - DropDown.WINDOW_BORDER_PADDING - menuNodeProps.height);
                break;
            }

            // apply final CSS formatting
            menuNode.css(menuNodeProps);
        }

        /**
         * Shows the drop-down menu, if it is not visible yet. Triggers a
         * 'menuopen' event at the group.
         */
        function showMenu() {

            var // position and size of the group node
                groupPosition = self.getNodePosition(),
                // original min-width and min-height attributes of the menu node
                menuMinSize = null;


            // do nothing if the menu is already open
            if (self.isMenuVisible()) { return; }

            // initialize DOM
            $('body').append(menuNode);
            groupNode.addClass(OPEN_CLASS);
            menuNode.css({
                top: groupPosition.top + groupPosition.height + DropDown.GROUP_BORDER_PADDING,
                left: groupPosition.left
            });

            // calculate position and size of the menu node
            if (autoLayout) {
                // store original min-width and min-height attributes
                menuMinSize = { minWidth: menuNode.css('min-width'), minHeight: menuNode.css('min-height') };

                // set size of menu node to 'auto' to be able to obtain the effective size
                menuNode.css({ width: 'auto', minWidth: '', height: 'auto', minHeight: '', top: 0, bottom: '', left: 0, right: '' });
                // Bug 26537: IE9 does not get the correct width, have to set children to inline-block mode...
                if (Utils.IE9) { menuNode.children().css('display', 'inline-block'); }
                menuNodeSize = { width: menuNode.outerWidth(), height: menuNode.outerHeight() };
                if (Utils.IE9) { menuNode.children().css('display', ''); }

                // restore min-width and min-height of the menu node, and other CSS properties
                menuNode.css(menuMinSize);

                // enable window resize handler which recalculates position and size of the menu node
                $(window).on('resize', windowResizeHandler);
                windowResizeHandler();
            }

            // notify all listeners
            self.trigger('menuopen');

            // Add a global click handler to close the menu automatically when
            // clicking somewhere in the page. Listening to the 'mousedown'
            // event will catch all real mouse clicks and close the menu
            // immediately ('click' events will not be generated by the browser
            // when selecting a text range over several text spans or
            // paragraphs). It is still needed to listen to real 'click' events
            // which may be triggered indirectly, e.g. after pressing a button
            // with the keyboard. The event handler will be attached in a
            // timeout handler, otherwise it would close the drop-down menu
            // immediately after it has been opened with a mouse click on the
            // drop-down button while the event bubbles up to the document root.
            window.setTimeout(function () {
                $(document).on('mousedown click', globalClickHandler);
            }, 0);
        }

        /**
         * Hides the drop-down menu, if it is currently open. Triggers a
         * 'menuclose' event at the group.
         */
        function hideMenu() {

            // do nothing if the menu is not visible
            if (!self.isMenuVisible()) { return; }

            // move focus to drop-down button, if drop-down menu is focused
            if (Utils.containsFocusedControl(menuNode)) {
                menuButton.focus();
            }

            // notify all listeners
            self.trigger('menuclose');

            // initialize DOM
            $(document).off('mousedown click', globalClickHandler);
            groupNode.removeClass(OPEN_CLASS);
            menuNode.detach();
            $(window).off('resize', windowResizeHandler);
        }

        /**
         * Changes the visibility of the drop-down menu. Triggers a 'menuopen'
         * or 'menuclose' event at the group.
         */
        function toggleMenu() {
            if (self.isMenuVisible()) {
                hideMenu();
            } else {
                showMenu();
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
                return (nodes.filter(event.target).length > 0) || (nodes.has(event.target).length > 0);
            }

            // close the menu unless a 'mousedown' event occurred on the drop-down button
            // (this would lead to reopening the menu immediately with the following click)
            if (!isTargetIn(menuNode) && !((event.type === 'mousedown') && isTargetIn(menuButton.add(menuToggleControls)))) {
                hideMenu();
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
                if (keydown) { showMenu(); self.grabMenuFocus(); }
                return false;
            case KeyCodes.UP_ARROW:
                if (keydown) { hideMenu(); }
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
                    showMenu();
                    self.grabMenuFocus();
                }
                return false;
            }
        }

        /**
         * Handles keyboard events inside the open drop-down menu.
         */
        function menuKeyHandler(event) {

            var // MacOS is handled differently
                macos = _.device('macos'),
                // distinguish between event types
                keydown = event.type === 'keydown';

            switch (event.keyCode) {
            case KeyCodes.TAB:
                if (keydown && !event.ctrlKey && !event.altKey && !event.metaKey) {
                    hideMenu();
                }
                break;
            case KeyCodes.F6:
                if (keydown && (macos || event.ctrlKey)) {
                    hideMenu();
                }
                break;
            case KeyCodes.ESCAPE:
                if (keydown) {
                    hideMenu();
                    return false;
                }
                break;
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the available sizes for the drop-down menu node at every
         * side of the group node.
         *
         * @returns {Object}
         *  The sizes (objects with 'width' and 'height' attributes) available
         *  for the menu node, mapped by the side names 'top', 'bottom',
         *  'left', and 'right'.
         */
        this.getAvailableMenuSizes = function () {

            var // position and size of the parent group node
                groupPosition = self.getNodePosition(),

                // available total width and height
                availableWidth = Math.max(window.innerWidth - 2 * DropDown.WINDOW_BORDER_PADDING, 0),
                availableHeight = Math.max(window.innerHeight - 2 * DropDown.WINDOW_BORDER_PADDING, 0),

                // vertical space above, below, left of, and right of the group node
                totalPadding = DropDown.WINDOW_BORDER_PADDING + DropDown.GROUP_BORDER_PADDING,
                availableAbove = Math.max(groupPosition.top - totalPadding, 0),
                availableBelow = Math.max(groupPosition.bottom - totalPadding, 0),
                availableLeft = Math.max(groupPosition.left - totalPadding, 0),
                availableRight = Math.max(groupPosition.right - totalPadding, 0);

            return {
                top: { width: availableWidth, height: availableAbove },
                bottom: { width: availableWidth, height: availableBelow },
                left: { width: availableLeft, height: availableHeight },
                right: { width: availableRight, height: availableHeight }
            };
        };

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
            return menuNode.parent('body').length > 0;
        };

        /**
         * Shows the drop-down menu.
         *
         * @returns {DropDown}
         *  A reference to this instance.
         */
        this.showMenu = function () {
            showMenu();
            return this;
        };

        /**
         * Shows the drop-down menu.
         *
         * @returns {DropDown}
         *  A reference to this instance.
         */
        this.hideMenu = function () {
            hideMenu();
            return this;
        };

        /**
         * Returns the collection of all control nodes in the drop-down menu
         * that are focusable.
         *
         * @returns {jQuery}
         *  A collection with all focusable (visible and enabled) controls.
         */
        this.getFocusableMenuControls = function () {
            return menuNode.find(Utils.ENABLED_SELECTOR + Utils.VISIBLE_SELECTOR + Group.FOCUSABLE_SELECTOR);
        };

        /**
         * Sets the focus into the first focusable control element of the
         * drop-down menu element. May be overwritten by derived classes to add
         * more sophisticated focus behavior.
         *
         * @returns {DropDown}
         *  A reference to this instance.
         */
        this.grabMenuFocus = function () {
            this.getFocusableMenuControls().first().focus();
            return this;
        };

        /**
         * Registers additional controls that will toggle the drop-down menu on
         * 'click' events.
         *
         * @param {jQuery} controls
         *  The controls to be registered as menu toggle controls.
         *
         * @returns {DropDown}
         *  A reference to this instance.
         */
        this.addMenuToggleControls = function (controls) {
            controls
                .on('click', menuButtonClickHandler)
                .on('keydown keypress keyup', menuButtonKeyHandler);
            menuToggleControls = menuToggleControls.add(controls);
            return this;
        };

        /**
         * Unregisters additional controls that have been registered to toggle
         * the drop-down menu on 'click' events.
         *
         * @param {jQuery} controls
         *  The controls to be unregistered as menu toggle controls.
         *
         * @returns {DropDown}
         *  A reference to this instance.
         */
        this.removeMenuToggleControls = function (controls) {
            controls
                .off('click', menuButtonClickHandler)
                .off('keydown keypress keyup', menuButtonKeyHandler);
            menuToggleControls = menuToggleControls.not(controls);
            return this;
        };

        // initialization -----------------------------------------------------

        // initialize the caret icon
        if (caretMode !== 'none') {
            menuButton.addClass('caret-visible').append($('<span>').addClass('dropdown-caret').append(Utils.createIcon('docs-caret down')));
        }

        // append menu button and menu to the group container
        this.addFocusableControl(menuButton);

        // register event handlers
        this.on('change cancel private:cancel', hideMenu)
            .on('show enable', function (event, state) { if (!state) { hideMenu(); } });
        groupNode
            .on('keydown keypress keyup', groupKeyHandler)
            .on('blur:key', Group.FOCUSABLE_SELECTOR, hideMenu);
        menuButton
            .on('click', menuButtonClickHandler)
            .on('keydown keypress keyup', menuButtonKeyHandler);
        menuNode
            .on('keydown keypress keyup', menuKeyHandler);

        if (autoLayout) {
            menuNode.css('overflow', 'auto');
        }

    } // class DropDown

    // static fields ----------------------------------------------------------

    /**
     * Padding of drop-down menu to browser window borders, in pixels.
     */
    DropDown.WINDOW_BORDER_PADDING = 6;

    /**
     * Padding of drop-down menu to parent group node, in pixels.
     */
    DropDown.GROUP_BORDER_PADDING = 1;

    // exports ================================================================

    return _.makeExtendable(DropDown);

});
