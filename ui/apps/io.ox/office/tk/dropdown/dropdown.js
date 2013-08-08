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
     'io.ox/office/tk/keycodes'
    ], function (Utils, KeyCodes) {

    'use strict';

    var // marker CSS class for elements containing an opened drop-down menu
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
     * Instances of this class trigger the following events:
     * - 'menu:open': After the drop-down menu has been opened.
     * - 'menu:close': After the drop-down menu has been closed.
     * - 'menu:layout': If the absolute position of the group or the browser
     *      window size has changed, and the position and size of the drop-down
     *      menu node needs to be adjusted.
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
     *  @param {Function} [options.getFocusableHandler]
     *      A function that returns all controls contained in the drop-down
     *      menu that are currently focusable, as jQuery collection. Used by
     *      the method 'DropDown.grabMenuFocus()' to decide which embedded
     *      control to focus. Receives the jQuery collection of all focusable
     *      controls currently available in the first parameter. If omitted,
     *      or if the function returns an empty jQuery collection, uses all
     *      available focusable form controls.
     *
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

            // callback function to filter the focusable controls in the drop-down menu
            getFocusableHandler = Utils.getFunctionOption(options, 'getFocusableHandler', _.identity),

            // the drop-down button
            menuButton = Utils.createButton((caretMode === 'only') ? {} : options).addClass('dropdown-button'),

            // the drop-down menu element containing the menu view component
            menuNode = $('<div>').addClass('io-ox-office-main dropdown-container').attr('tabindex', -1),

            // current size of the drop-down menu (calculated when opening the menu)
            menuNodeSize = null,

            // an interval timer to refresh the the menu node while it is open
            refreshTimer = null,

            // the DOM element that was last focused
            lastActiveElement = null,

            // the width and height of the virtual keyboard on touch devices
            keyboardWidth = 0,
            keyboardHeight = 0,

            // last position and size of the group node
            lastGroupPosition = null;

        // private methods ----------------------------------------------------

        /**
         * Returns the position and size of the visible area in the browser
         * window, relative to the entire document page.
         *
         * @param {Number} [padding=0]
         *  Additional padding size that will be removed from the resulting
         *  visible area.
         */
        function getVisibleWindowArea(padding) {

            var // the visible area of the browser window
                visibleArea = { left: window.pageXOffset, top: window.pageYOffset };

            padding = _.isNumber(padding) ? Math.max(padding, 0) : 0;
            visibleArea.left += padding;
            visibleArea.top += padding;

            // The properties window.inner(Width|Height) for their own are not
            // reliable when virtual keyboard on touch devices is visible. This
            // 'hack' works for applications with fixed page size.
            visibleArea.width = Math.max(Math.min(window.innerWidth, document.body.clientWidth - keyboardWidth) - 2 * padding, 0);
            visibleArea.height = Math.max(Math.min(window.innerHeight, document.body.clientHeight - keyboardHeight) - 2 * padding, 0);

            // add right/bottom distance to the result
            visibleArea.right = document.body.clientWidth - visibleArea.width - visibleArea.left;
            visibleArea.bottom = document.body.clientHeight - visibleArea.height - visibleArea.top;

            return visibleArea;
        }

        /**
         * Returns the position of the root node of this group, relative to the
         * visible area of the browser window.
         */
        function getGroupPositionInWindow() {

            var // the node position, relative to the document page
                nodePosition = Utils.getNodePositionInPage(self.getNode()),
                // the visible area of the browser window
                visibleArea = getVisibleWindowArea();

            // adjust to visible area of the browser window
            _(['left', 'top', 'right', 'bottom']).each(function (border) {
                nodePosition[border] -= visibleArea[border];
            });

            return nodePosition;
        }

        /**
         * Initializes the size and position of the drop-down menu.
         */
        function refreshMenuNodePosition() {

            var // position and size of the parent group node in the page
                groupPosition = Utils.getNodePositionInPage(self.getNode()),
                // the sizes available at every side of the group node
                availableSizes = self.getAvailableMenuSizes(),
                // resulting width and height available for the menu node
                availableWidth = 0, availableHeight = 0,
                // new CSS properties of the menu node
                menuNodeProps = {},
                // the side of the group node preferred for the drop-down menu
                preferredSide = null, maxRatio = 0;

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

            // first part of the position of the drop-down menu (keep in visible area of browser window)
            switch (preferredSide) {
            case 'top':
                menuNodeProps.bottom = document.body.clientHeight - groupPosition.top + DropDown.GROUP_BORDER_PADDING;
                break;
            case 'bottom':
                menuNodeProps.top = groupPosition.top + groupPosition.height + DropDown.GROUP_BORDER_PADDING;
                break;
            case 'left':
                menuNodeProps.right = document.body.clientWidth - groupPosition.left + DropDown.GROUP_BORDER_PADDING;
                break;
            case 'right':
                menuNodeProps.left = groupPosition.left + groupPosition.width + DropDown.GROUP_BORDER_PADDING;
                break;
            }

            // add space for scroll bars if available width or height is not sufficient
            menuNodeProps.width = Math.min(availableWidth, menuNodeSize.width + ((menuNodeSize.height > availableHeight) ? Utils.SCROLLBAR_WIDTH : 0));
            menuNodeProps.height = Math.min(availableHeight, menuNodeSize.height + ((menuNodeSize.width > availableWidth) ? Utils.SCROLLBAR_HEIGHT : 0));

            // second part of the position of the drop-down menu (keep in visible area of browser window)
            if (Utils.isVerticalPosition(preferredSide)) {
                switch (menuAlign) {
                case 'right':
                    menuNodeProps.left = groupPosition.left + groupPosition.width - menuNodeProps.width;
                    break;
                case 'center':
                    menuNodeProps.left = groupPosition.left + Math.floor((groupPosition.width - menuNodeProps.width) / 2);
                    break;
                default:
                    menuNodeProps.left = groupPosition.left;
                }
            } else {
                menuNodeProps.top = groupPosition.top;
            }

//            Utils.info('refreshMenuNodePosition');
//            Utils.log('group: ' + JSON.stringify(groupPosition).replace(/"/g, '').replace(/,/g, ', '));
//            Utils.log('window: ' + JSON.stringify(getVisibleWindowArea()).replace(/"/g, '').replace(/,/g, ', '));
//            Utils.log('g-in-w: ' + JSON.stringify(getGroupPositionInWindow()).replace(/"/g, '').replace(/,/g, ', '));
//            Utils.log('avail: ' + JSON.stringify(availableSizes).replace(/"/g, '').replace(/,/g, ', '));
//            Utils.log('preferred: ' + preferredSide);

            // apply final CSS formatting
            self.setMenuNodePosition(menuNodeProps);
        }

        /**
         * Checks and updates the position of the menu node, according to the
         * current position of the menu button (a scrollable parent node may
         * have been scrolled). Additionally, hides the menu automatically when
         * the drop-down button becomes inaccessible (also indirectly, e.g.
         * when hiding any parent nodes).
         */
        function refreshMenuNode() {

            var // whether to update the position of the drop-down menu
                refreshPosition = false,
                // the position of the group node in the visible area of the window
                groupPosition = null;

            if (self.isReallyVisible()) {

                // on touch devices, try to detect the size of the virtual keyboard
                if (Modernizr.touch && (lastActiveElement !== document.activeElement)) {
                    lastActiveElement = document.activeElement;
                    refreshPosition = true;
                    // if a text field is focused, try to scroll the browser window
                    // right/down to get the size of the virtual keyboard
                    if ($(lastActiveElement).is('input, textarea')) {
                        var pageX = window.pageXOffset, pageY = window.pageYOffset;
                        window.scrollTo(10000, 10000);
                        keyboardWidth = window.pageXOffset;
                        keyboardHeight = window.pageYOffset;
                        window.scrollTo(pageX, pageY);
                    } else {
                        keyboardWidth = keyboardHeight = 0;
                    }
                }

                // check whether the position of the group node has changed
                // (for example, by scrolling a parent node of the group)
                if (!refreshPosition) {
                    groupPosition = getGroupPositionInWindow();
                    refreshPosition = !_.isEqual(lastGroupPosition, groupPosition);
                    lastGroupPosition = groupPosition;
                }

                // refresh the position of the menu node, notify all listeners
                if (refreshPosition) {
                    if (autoLayout) { refreshMenuNodePosition(); }
                    self.trigger('menu:refresh');
                }
            } else {
                // group is not visible anymore: hide the menu
                hideMenu();
            }
        }

        /**
         * Shows the drop-down menu, if it is not visible yet. Triggers a
         * 'menu:open' event at the group.
         */
        function showMenu() {

            var // position and size of the group node
                groupPosition = Utils.getNodePositionInPage(self.getNode()),
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
                menuNodeSize = { width: menuNode.outerWidth(), height: menuNode.outerHeight() };

                // restore min-width and min-height of the menu node, and other CSS properties
                menuNode.css(menuMinSize);

                // enable window resize handler which recalculates position and size of the menu node
                $(window).on('resize', refreshMenuNodePosition);
                refreshMenuNodePosition();
            }

            // notify all listeners
            self.trigger('menu:open');

            // start a timer that regularly checks the position of the menu node, and
            // hide the menu automatically when the drop-down button becomes inaccessible
            lastActiveElement = null;
            lastGroupPosition = getGroupPositionInWindow();
            refreshTimer = window.setInterval(refreshMenuNode, Modernizr.touch ? 200 : 50);

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
         * 'menu:close' event at the group.
         */
        function hideMenu() {

            // do nothing if the menu is not visible
            if (!self.isMenuVisible()) { return; }

            // stop the automatic refresh timer
            window.clearInterval(refreshTimer);

            // move focus to drop-down button, if drop-down menu is focused
            if (Utils.containsFocusedControl(menuNode)) {
                menuButton.focus();
            }

            // notify all listeners
            self.trigger('menu:close');

            // initialize DOM
            $(document).off('mousedown click', globalClickHandler);
            groupNode.removeClass(OPEN_CLASS);
            menuNode.detach();
            $(window).off('resize', refreshMenuNodePosition);
        }

        /**
         * Handles click events from the drop-down button, toggles the
         * drop-down menu.
         */
        function menuButtonClickHandler() {

            // do nothing (but trigger the 'group:cancel' event) if the group is disabled
            if (self.isEnabled()) {

                // WebKit does not focus the clicked button, which is needed to
                // get keyboard control in the drop-down menu
                menuButton.focus();

                // toggle the menu, this triggers the 'menu:open'/'menu:close' event
                if (self.isMenuVisible()) {
                    hideMenu();
                } else {
                    showMenu();
                }
            }

            // trigger 'group:cancel' event, if menu has been closed with mouse click
            if (!self.isMenuVisible()) {
                self.triggerCancel();
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
            if (!isTargetIn(menuNode) && !((event.type === 'mousedown') && isTargetIn(menuButton))) {
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
            case KeyCodes.PAGE_DOWN:
                if (keydown && self.isEnabled()) {
                    showMenu();
                    self.grabMenuFocus();
                }
                return false;
            case KeyCodes.UP_ARROW:
            case KeyCodes.PAGE_UP:
                if (keydown && self.isEnabled()) {
                    showMenu();
                    self.grabMenuFocus({ bottom: true });
                }
                return false;
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
                if (keyup) {
                    if (self.isEnabled()) {
                        showMenu();
                        self.grabMenuFocus();
                    } else if (event.keyCode === KeyCodes.ENTER) {
                        self.triggerCancel();
                    }
                }
                return false;
            case KeyCodes.ESCAPE:
                if (keydown && self.isMenuVisible()) {
                    hideMenu();
                    // let the Group base class not trigger the 'group:cancel' event
                    event.preventDefault();
                }
                break;
            }
        }

        /**
         * Handles keyboard events inside the open drop-down menu.
         */
        function menuKeyHandler(event) {

            var // distinguish between event types
                keydown = event.type === 'keydown';

            switch (event.keyCode) {
            case KeyCodes.TAB:
                if (keydown && KeyCodes.matchModifierKeys(event, { shift: null })) {
                    hideMenu();
                    // To prevent problems with event bubbling (Firefox continues
                    // to bubble to the parent of the menu node, while Chrome
                    // always bubbles from the focused DOM node, in this case
                    // from the menu *button*), stop propagation of the original
                    // event, and simulate a TAB key event from the menu button
                    // to move the focus to the next control.
                    menuButton.trigger(event);
                    return false;
                }
                break;
            case KeyCodes.ESCAPE:
                if (keydown) { hideMenu(); }
                return false;
            case KeyCodes.F6:
                // Hide drop-down menu on global F6 focus traveling. This will set
                // the focus back to the drop-down button, so that F6 will jump to
                // the next view component. Jumping directly from the drop-down menu
                // (which is located near the body element in the DOM) would select
                // the wrong element. Ignore all modifier keys here, even on
                // non-MacOS systems where F6 traveling is triggered by Ctrl+F6
                // (browsers will move the focus away anyway).
                if (keydown) { hideMenu(); }
                break;
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the available sizes for the drop-down menu node at every
         * side of the group node.
         *
         * @internal
         *  Used by sub classes of this DropDown class for custom rendering of
         *  the drop-down menu.
         *
         * @returns {Object}
         *  The sizes (objects with 'width' and 'height' attributes) available
         *  for the menu node, mapped by the side names 'top', 'bottom',
         *  'left', and 'right'.
         */
        this.getAvailableMenuSizes = function () {

            var // position and size of the group node in the visible area of the browser window
                groupPosition = getGroupPositionInWindow(),
                // visible area of the browser window, reduced by border padding
                availableArea = getVisibleWindowArea(DropDown.WINDOW_BORDER_PADDING),

                // vertical space above, below, left of, and right of the group node
                totalPadding = DropDown.WINDOW_BORDER_PADDING + DropDown.GROUP_BORDER_PADDING,
                availableAbove = Utils.minMax(groupPosition.top - totalPadding, 0, availableArea.height),
                availableBelow = Utils.minMax(groupPosition.bottom - totalPadding, 0, availableArea.height),
                availableLeft = Utils.minMax(groupPosition.left - totalPadding, 0, availableArea.width),
                availableRight = Utils.minMax(groupPosition.right - totalPadding, 0, availableArea.width);

            return {
                top: { width: availableArea.width, height: availableAbove },
                bottom: { width: availableArea.width, height: availableBelow },
                left: { width: availableLeft, height: availableArea.height },
                right: { width: availableRight, height: availableArea.height }
            };
        };

        /**
         * Sets the position of the drop-down menu according to the passed CSS
         * positioning attributes. The resulting position of the menu node will
         * be adjusted according to the current visible area of the browser
         * window.
         *
         * @internal
         *  Used by sub classes of this DropDown class for custom rendering of
         *  the drop-down menu.
         *
         * @param {Object} menuNodeProps
         *  The CSS positioning properties for the menu node, relative to the
         *  document page. Must contain one horizontal offset (either 'left' or
         *  'right'), and one vertical offset (either 'top' or 'bottom').
         *  Optionally, may contain the new size ('width' and/or 'height') of
         *  the menu node.
         *
         * @returns {DropDown}
         *  A reference to this instance.
         */
        this.setMenuNodePosition = function (menuNodeProps) {

            var // visible area of the browser window, reduced by border padding
                availableArea = getVisibleWindowArea(DropDown.WINDOW_BORDER_PADDING),
                // the width and height of the menu node (may be missing in passed properties)
                menuWidth = _.isNumber(menuNodeProps.width) ? menuNodeProps.width : menuNode.outerWidth(),
                menuHeight = _.isNumber(menuNodeProps.height) ? menuNodeProps.height : menuNode.outerHeight();

            // restrict all existing positioning attributes to the visible area
            menuNodeProps.left = _.isNumber(menuNodeProps.left) ? Utils.minMax(menuNodeProps.left, availableArea.left, availableArea.left + availableArea.width - menuWidth) : '';
            menuNodeProps.right = _.isNumber(menuNodeProps.right) ? Utils.minMax(menuNodeProps.right, availableArea.right, availableArea.right + availableArea.width - menuWidth) : '';
            menuNodeProps.top = _.isNumber(menuNodeProps.top) ? Utils.minMax(menuNodeProps.top, availableArea.top, availableArea.top + availableArea.height - menuHeight) : '';
            menuNodeProps.bottom = _.isNumber(menuNodeProps.bottom) ? Utils.minMax(menuNodeProps.bottom, availableArea.bottom, availableArea.bottom + availableArea.height - menuHeight) : '';

            menuNode.css(menuNodeProps);
            return this;
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
         *  A collection with all focusable controls.
         */
        this.getFocusableMenuControls = function () {
            return menuNode.find(Utils.REALLY_VISIBLE_SELECTOR + Utils.FOCUSABLE_SELECTOR);
        };

        /**
         * Sets the focus into the first focusable control element of the
         * drop-down menu element.
         *
         * @param {Object} [options]
         *  A map with options controlling the behavior of this method. The
         *  following options are supported:
         *  @param {Boolean} [options.bottom=false]
         *      If set to true, the bottom entry of the drop-down menu should
         *      be focused instead of the first.
         *
         * @returns {DropDown}
         *  A reference to this instance.
         */
        this.grabMenuFocus = function (options) {

            var // all focusable controls
                focusableNodes = this.getFocusableMenuControls(),
                // the preferred controls returned by the callback function
                preferredNodes = getFocusableHandler.call(this, focusableNodes),
                // whether to select the last control
                bottom = Utils.getBooleanOption(options, 'bottom', false);

            // fall back to all focusable controls if no preferred controls are available
            if (preferredNodes.length === 0) { preferredNodes = focusableNodes; }
            preferredNodes[bottom ? 'last' : 'first']().focus();

            return this;
        };

        /**
         * Registers a private group instance that will be inserted into the
         * menu node. The 'group:change' events triggered by that group will be
         * forwarded to the listeners of this group instance, and updates of
         * this group instance (calls to the own 'Group.setValue()' method)
         * will be forwarded to the specified private group. The 'group:cancel'
         * events of the private group will be caught and used to hide the
         * drop-down menu, but will NOT be forwarded to listeners of this
         * group. The DOM root node of the group will not be inserted anywhere!
         *
         * @param {Group} group
         *  The group instance to be be registered.
         *
         * @returns {DropDown}
         *  A reference to this instance.
         */
        this.registerMenuGroup = function (group) {

            // forward 'group:change' events of the group to listeners of this
            // group, and updates of this drop-down group to the inserted group
            group.on('group:change', function (event, value, options) {
                self.trigger('group:change', value, options);
            });
            this.registerUpdateHandler(function (value, options) {
                group.setValue(value, options);
            });

            // do not forward 'group:cancel' events of the private group to
            // listeners of this group, but simply hide the drop-down menu
            group.on('group:cancel', hideMenu);

            return this;
        };

        // initialization -----------------------------------------------------

        // initialize the caret icon
        if (caretMode !== 'none') {
            menuButton.addClass('caret-visible').append($('<span>').addClass('dropdown-caret').append(Utils.createIcon('docs-caret down')));
        }

        // append menu button to the group container, register menu node for focus handling
        this.addFocusableControl(menuButton);
        this.registerFocusableContainerNode(menuNode);

        // register event handlers
        this.on({
            'group:blur': hideMenu,
            'group:show group:enable': function (event, state) { if (!state) { hideMenu(); } }
        });
        groupNode.on('keydown keypress keyup', groupKeyHandler);
        menuButton.on({
            click: menuButtonClickHandler,
            'keydown keypress keyup': menuButtonKeyHandler
        });
        menuNode.on('keydown keypress keyup', menuKeyHandler);

        if (autoLayout) {
            menuNode.css('overflow', 'auto');
        }

        // disable dragging of controls (otherwise, it is possible to drag buttons and other controls around)
        menuNode.on('dragstart', Utils.BUTTON_SELECTOR + ',input,textarea,label', false);

    } // class DropDown

    // static fields ----------------------------------------------------------

    /**
     * Padding of drop-down menu to browser window borders, in pixels.
     *
     * @constant
     */
    DropDown.WINDOW_BORDER_PADDING = 6;

    /**
     * Padding of drop-down menu to parent group node, in pixels.
     *
     * @constant
     */
    DropDown.GROUP_BORDER_PADDING = 1;

    // exports ================================================================

    return _.makeExtendable(DropDown);

});
