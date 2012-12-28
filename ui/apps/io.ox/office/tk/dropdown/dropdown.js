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
     'io.ox/office/tk/view/component',
     'io.ox/office/tk/control/group'
    ], function (Utils, Component, Group) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // width and height of system scroll bars, in pixels
        SCROLLBAR_WIDTH = 0,
        SCROLLBAR_HEIGHT = 0,

        // padding of drop-down menu to browser window borders, in pixels
        WINDOW_BORDER_PADDING = 6,

        // padding of drop-down menu to parent group node, in pixels
        GROUP_BORDER_PADDING = 1;

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
     *  @param {Boolean} [options.plainCaret=false]
     *      If set to true, the drop-down button will not contain a caption or
     *      any other formatting, regardless of the other settings in the
     *      options object. Can be used to mix-in the drop-down button into a
     *      complex control group where the options object contains the
     *      formatting for the main group contents.
     *  @param {Boolean} [options.autoLayout=false]
     *      If set to true, the drop-down menu will be positioned and sized
     *      automatically. If the available space is not sufficient for the
     *      contents of the drop-down menu, scroll bars will be displayed. If
     *      set to false (or omitted), the drop-down menu will appear below the
     *      group node and will be sized according to the drop-down menu
     *      contents even if the menu exceeds the browser window.
     */
    function DropDown(options) {

        var // self reference (the Group instance)
            self = this,

            // the root node of the group object
            groupNode = this.getNode(),

            // plain caret button, or button with caption and formatting
            plainCaret = Utils.getBooleanOption(options, 'plainCaret', false),

            // automatic position and size of the drop-down menu
            autoLayout = Utils.getBooleanOption(options, 'autoLayout', false),

            // the icon for the drop-down caret
            caretIcon = Utils.createIcon('caret-icon', Utils.getBooleanOption(options, 'whiteIcon')).addClass('down'),

            // the drop-down caret
            caretSpan = $('<span>').addClass('dropdown-caret').append(caretIcon),

            // the drop-down button
            menuButton = Utils.createButton(plainCaret ? {} : options).addClass('dropdown-button').append(caretSpan),

            // the view component embedded in the drop-down menu
            menuComponent = new Component(),

            // the content node of the menu view component
            contentNode = menuComponent.getNode(),

            // the drop-down menu element containing the menu view component
            menuNode = $('<div>').addClass('io-ox-office-dropdown-container').append(contentNode),

            // additional controls that toggle the drop-down menu
            menuToggleControls = $();

        // private methods ----------------------------------------------------

        /**
         * Returns the absolute position of the group node in the browser
         * window.
         *
         * @returns {Object}
         *  An object with 'left', 'top', 'width', and 'height' attributes.
         */
        function getGroupDimensions() {

            var // get position of the group
                groupDim = groupNode.offset();

            // add group size
            groupDim.width = groupNode.outerWidth();
            groupDim.height = groupNode.outerHeight();

            return groupDim;
        }

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
                show = (state === true) || ((state !== false) && !self.isMenuVisible()),
                // position and size of the group node
                groupDim = getGroupDimensions();

            if (show && !self.isMenuVisible()) {
                $('body').append(menuNode);
                menuNode.css({
                    top: groupDim.top + groupDim.height + GROUP_BORDER_PADDING,
                    left: groupDim.left
                });
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
                self.trigger('menuclose');
                $(document).off('mousedown click', globalClickHandler);
                menuNode.detach();
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

        /**
         * Initializes the size and position of the drop-down menu.
         */
        function windowResizeHandler() {

            var // position and size of the parent group node
                groupDim = getGroupDimensions(),
                // available width for contents of the drop-down menu
                availableWidth = window.innerWidth - 2 * WINDOW_BORDER_PADDING,
                // available height for contents of the drop-down menu
                availableHeight = 0,
                // vertical space above the group node
                availableAbove = groupDim.top - WINDOW_BORDER_PADDING - GROUP_BORDER_PADDING,
                // vertical space above the group node
                availableBelow = window.innerHeight - groupDim.top - groupDim.height - WINDOW_BORDER_PADDING - GROUP_BORDER_PADDING,
                // new CSS properties of the menu node
                menuNodeProps = { top: '', bottom: '', left: '', right: '', minWidth: menuNode.css('min-width'), minHeight: menuNode.css('min-height') };

            // set size of menu node to 'auto' to be able to obtain the effective size
            contentNode.css('width', 'auto');
            menuNode.css({ width: 'auto', minWidth: '', height: 'auto', minHeight: '', top: 0, bottom: '', left: 0, right: '' });

            // decide whether to position the drop-down menu above or below the group node
            if ((menuNode.height() <= availableBelow) || (availableAbove <= availableBelow)) {
                menuNodeProps.top = groupDim.top + groupDim.height + GROUP_BORDER_PADDING;
                availableHeight = availableBelow;
            } else {
                menuNodeProps.bottom = window.innerHeight - groupDim.top + GROUP_BORDER_PADDING;
                availableHeight = availableAbove;
            }

            // add space for scroll bars if available width or height is not sufficient
            menuNodeProps.width = Math.min(availableWidth, menuNode.width() + ((menuNode.height() > availableHeight) ? SCROLLBAR_WIDTH : 0));
            menuNodeProps.height = Math.min(availableHeight, menuNode.height() + ((menuNode.width() > availableWidth) ? SCROLLBAR_HEIGHT : 0));

            // horizontal position: prefer left-aligned, but do not exceed right border of browser window
            menuNodeProps.left = Math.min(groupDim.left, window.innerWidth - WINDOW_BORDER_PADDING - menuNodeProps.width);

            // apply final CSS formatting
            menuNode.css(menuNodeProps);
            contentNode.css('width', '100%');
        }

        function menuOpenHandler() {
            $(window).on('resize', windowResizeHandler);
            windowResizeHandler();
            menuNode.scrollTop(0).scrollLeft(0);
        }

        function menuCloseHandler() {
            $(window).off('resize', windowResizeHandler);
        }

        // methods ------------------------------------------------------------

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
         * Returns the view component embedded in the drop-down menu.
         */
        this.getMenuComponent = function () {
            return menuComponent;
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
            toggleMenu(true);
            return this;
        };

        /**
         * Shows the drop-down menu.
         *
         * @returns {DropDown}
         *  A reference to this instance.
         */
        this.hideMenu = function () {
            toggleMenu(false);
            return this;
        };

        /**
         * Sets the focus into the first control element of the drop-down menu
         * element.
         *
         * @returns {DropDown}
         *  A reference to this instance.
         */
        this.grabMenuFocus = function () {
            menuComponent.grabFocus();
            return this;
        };

        /**
         * Adds a private group into the view component of the drop-down menu.
         * The events of this group will be forwarded to the listeners of this
         * group instance. Listeners of the view component embedded in the
         * drop-down menu will not be notified.
         *
         * @param {Group} group
         *  The group that will be inserted into the drop-down menu.
         *
         * @returns {DropDown}
         *  A reference to this instance.
         */
        this.addPrivateMenuGroup = function (group) {

            // insert the passed group into the view component of the drop-down menu
            menuComponent.addPrivateGroup(group);

            // forward events of the embedded group to listeners of this group
            group.on('change cancel', function (event, value) {
                self.trigger(event.type, value);
            });

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

        // append menu button and menu to the group container
        this.addFocusableControl(menuButton);

        // register event handlers
        this.on('change cancel', function () { toggleMenu(false); });
        groupNode
            .on('keydown keypress keyup', groupKeyHandler)
            .on('blur:key', Group.FOCUSABLE_SELECTOR, function () { toggleMenu(false); });
        menuButton
            .on('click', menuButtonClickHandler)
            .on('keydown keypress keyup', menuButtonKeyHandler);
        menuNode.on('keydown keypress keyup', menuKeyHandler);

        if (autoLayout) {
            this.on('menuopen', menuOpenHandler).on('menuclose', menuCloseHandler);
        }

    } // class DropDown

    // global initialization ==================================================

    // calculate size of system scroll bars
    (function () {

        var // dummy containers used to calculate the scroll bar sizes
            innerDiv = $('<div>').css({ width: '100%', height: '100%' }),
            outerDiv = $('<div>').css({ width: '100px', height: '100px', overflow: 'scroll' }).append(innerDiv);

        $('body').append(outerDiv);
        SCROLLBAR_WIDTH = 100 - innerDiv.width();
        SCROLLBAR_HEIGHT = 100 - innerDiv.height();
        outerDiv.remove();
    }());

    // exports ================================================================

    return _.makeExtendable(DropDown);

});
