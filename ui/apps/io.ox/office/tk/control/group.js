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

define('io.ox/office/tk/control/group',
    ['io.ox/core/event',
     'io.ox/office/tk/utils'
    ], function (Events, Utils) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // CSS class for hidden groups
        HIDDEN_CLASS = 'hidden',

        // CSS class for disabled groups
        DISABLED_CLASS = 'disabled';

    // class Group ============================================================

    /**
     * Creates a container element used to hold a control. All controls shown
     * in view components must be inserted into such group containers. This is
     * the base class for specialized groups and does not add any specific
     * functionality to the inserted controls.
     *
     * Instances of this class trigger the following events:
     * - 'change': If the control has been activated in a special way depending
     *  on the type of the control group. The event handler receives the value
     *  of the activated control.
     * - 'cancel': When the focus needs to be returned to the application (e.g.
     *  when the Escape key is pressed, or when a click on a drop-down button
     *  closes the opened drop-down menu).
     *
     * @constructor
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new group. The
     *  following options are supported:
     *  @param {String} [options.tooltip]
     *      Tool tip text shown when the mouse hovers the control. If omitted,
     *      the control will not show a tool tip.
     *  @param {Boolean} [options.white]
     *      If set to true, the group has a white background instead of being
     *      transparent.
     *  @param {String} [options.classes]
     *      Additional CSS classes that will be set at the root DOM node of
     *      this instance.
     */
    function Group(options) {

        var // self reference
            self = this,

            // create the group container element
            groupNode = $('<div>').addClass('group'),

            // update handler functions
            updateHandlers = [];

        // private methods ----------------------------------------------------

        /**
         * Shows or hides this group.
         */
        function showGroup(visible) {
            groupNode.toggleClass(HIDDEN_CLASS, !visible);
            self.trigger('show', visible);
        }

        /**
         * Keyboard handler for the entire group.
         */
        function keyHandler(event) {

            var // distinguish between event types
                keyup = event.type === 'keyup';

            if (event.keyCode === KeyCodes.ESCAPE) {
                if (keyup) { self.trigger('cancel'); }
                return false;
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the DOM container element for this group as jQuery object.
         */
        this.getNode = function () {
            return groupNode;
        };

        /**
         * Returns the absolute position and size of the group node in the
         * browser window.
         *
         * @returns {Object}
         *  An object with numeric 'left', 'top', 'right', 'bottom', 'width',
         *  and 'height' attributes representing the position and size of the
         *  group node in pixels. The attributes 'right' and 'bottom' represent
         *  the distance of the right/bottom corner of the group node to the
         *  right/bottom border of the browser window.
         */
        this.getDimensions = function () {

            var // get position of the group
                groupDim = groupNode.offset();

            // add group size
            groupDim.width = groupNode.outerWidth();
            groupDim.height = groupNode.outerHeight();

            // add right/bottom distance
            groupDim.right = window.innerWidth - groupDim.left - groupDim.width;
            groupDim.bottom = window.innerHeight - groupDim.top - groupDim.height;

            return groupDim;
        };

        /**
         * Registers the passed update handler function. These handlers will be
         * called from the method Group.update() in order of their
         * registration.
         *
         * @param {Function} updateHandler
         *  The update handler function. Will be called in the context of this
         *  group. Receives the value passed to the method Group.update().
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.registerUpdateHandler = function (updateHandler) {
            updateHandlers.push(updateHandler);
            return this;
        };

        /**
         * Registers the passed action handler for a specific control. Action
         * handlers will be executed, when the control has been activated in
         * the user interface. Will trigger a 'change' event, passing its
         * current value as returned by the passed action handler.
         *
         * @param {jQuery} [node]
         *  The DOM node that catches the jQuery action events. May be a single
         *  control, or a parent element of several controls. If omitted, uses
         *  the root node of this group. In case a container element is used,
         *  the parameter 'selector' must be specified.
         *
         * @param {String} type
         *  The type of the action event, e.g. 'click' or 'change'.
         *
         * @param {String} [selector]
         *  If specified, selects the ancestor elements of the specified node,
         *  which are actually triggering the events.
         *
         * @param {Function} actionHandler
         *  The action handler function. Will be called in the context of this
         *  group. Receives the control that triggered the action event. Must
         *  return the current value of the control (e.g. the boolean state of
         *  a toggle button, the value of a list item, or the current text in a
         *  text input field). May return null to indicate that a 'cancel'
         *  event should be triggered instead of a 'change' event.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.registerActionHandler = function (node, type, selector, actionHandler) {

            function actionEventHandler(event) {
                var value =  self.isEnabled() ? actionHandler.call(self, $(this)) : null;
                if (_.isNull(value)) {
                    self.trigger('cancel');
                } else {
                    self.trigger('change', value);
                }
            }

            // normalize passed parameters, if node parameter is missing
            if (_.isString(node)) {
                // push all parameters to the right, and update node parameter
                actionHandler = selector;
                selector = type;
                type = node;
                node = groupNode;
            }

            // normalize passed parameters, if selector parameter is missing
            if (_.isFunction(selector)) {
                actionHandler = selector;
                selector = undefined;
            }

            // attach event handler to the node
            if (selector) {
                node.on(type, selector, actionEventHandler);
            } else {
                node.on(type, actionEventHandler);
            }

            return this;
        };

        /**
         * Inserts the passed DOM elements into this group.
         *
         * @param {jQuery} nodes
         *  The nodes to be inserted into this group, as jQuery object.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.addChildNodes = function (nodes) {
            groupNode.append(nodes);
            return this;
        };

        /**
         * Inserts the passed control into this group, and marks it to be
         * included into keyboard focus navigation.
         *
         * @param {jQuery} control
         *  The control to be inserted into this group, as jQuery object.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.addFocusableControl = function (control) {
            groupNode.append(control.addClass(Group.FOCUSABLE_CLASS));
            return this;
        };

        /**
         * Returns whether this group contains any focusable controls.
         */
        this.hasFocusableControls = function () {
            return groupNode.find(Group.FOCUSABLE_SELECTOR).length > 0;
        };

        /**
         * Returns all controls from this group that need to be included into
         * keyboard focus navigation.
         */
        this.getFocusableControls = function () {
            return groupNode.find(Group.FOCUSABLE_SELECTOR);
        };

        /**
         * Returns whether this group contains the control that is currently
         * focused. Searches in all ancestor elements of this group.
         */
        this.hasFocus = function () {
            return Utils.containsFocusedControl(groupNode);
        };

        /**
         * Sets the focus to the first control in this group, unless it is
         * already focused.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.grabFocus = function () {
            if (!this.hasFocus()) {
                this.getFocusableControls().first().focus();
            }
            return this;
        };

        /**
         * Returns whether this control group is visible.
         */
        this.isVisible = function () {
            return !groupNode.hasClass(HIDDEN_CLASS);
        };

        /**
         * Displays this control group, if it is currently hidden.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.show = function () {
            showGroup(true);
            return this;
        };

        /**
         * Hides this control group, if it is currently visible.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.hide = function () {
            showGroup(false);
            return this;
        };

        /**
         * Toggles the visibility of this control group.
         *
         * @param {Boolean} [state]
         *  If specified, shows or hides the groups depending on the boolean
         *  value. If omitted, switches the group from visible to hidden and
         *  vice versa.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.toggle = function (state) {
            showGroup((state === true) || ((state !== false) && this.isVisible()));
            return this;
        };

        /**
         * Returns whether this control group is enabled.
         */
        this.isEnabled = function () {
            return Utils.isControlEnabled(groupNode);
        };

        /**
         * Enables or disables this control group.
         *
         * @param {Boolean} [state=true]
         *  If omitted or set to true, the group will be enabled. Otherwise,
         *  the group will be disabled.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.enable = function (state) {

            var // enable/disable the entire group node with all its descendants
                enabled = Utils.enableControls(groupNode, state);

            // trigger an 'enable' event so that derived classes can react
            return this.trigger('enable', enabled);
        };

        /**
         * Updates the controls in this group with the specified value, by
         * calling the registered update handlers.
         *
         * @param value
         *  The new value to be displayed in the controls of this group.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.update = function (value) {
            if (!_.isUndefined(value)) {
                _(updateHandlers).each(function (updateHandler) {
                    updateHandler.call(this, value);
                }, this);
            }
            return this;
        };

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

        // formatting and tool tip
        groupNode
            .addClass(Utils.getBooleanOption(options, 'white') ? 'white' : '')
            .addClass(Utils.getStringOption(options, 'classes', ''));
        Utils.setControlTooltip(groupNode, Utils.getStringOption(options, 'tooltip'));

        // add event handlers
        groupNode
            .on('keydown keypress keyup', keyHandler)
            // suppress events for disabled controls
            .on('mousedown dragover drop contextmenu', function (event) {
                if (!self.isEnabled()) {
                    event.preventDefault();
                    self.trigger('cancel');
                }
            });

    } // class Group

    // constants --------------------------------------------------------------

    /**
     * CSS class for focusable control elements in this group.
     *
     * @constant
     */
    Group.FOCUSABLE_CLASS = 'focusable';

    /**
     * CSS selector for focusable control elements in this group.
     *
     * @constant
     */
    Group.FOCUSABLE_SELECTOR = '.' + Group.FOCUSABLE_CLASS;

    // exports ================================================================

    return _.makeExtendable(Group);

});
