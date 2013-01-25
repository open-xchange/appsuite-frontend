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
     *      on the type of the control group. The event handler receives the
     *      value of the activated control as second parameter.
     * - 'cancel': When the focus needs to be returned to the application (e.g.
     *      when the Escape key is pressed, or when a click on a drop-down
     *      button closes the opened drop-down menu).
     * - 'show': After the control has been shown or hidden. The event handler
     *      receives the new visibility state as second parameter.
     * - 'enable': After the control has been enabled or disabled. The event
     *      handler receives the new state as second parameter.
     *
     * @constructor
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new group. The
     *  following options are supported:
     *  @param {String} [options.tooltip]
     *      Tool tip text shown when the mouse hovers the control. If omitted,
     *      the control will not show a tool tip.
     *  @param {String} [options.design='default']
     *      Changes the appearance of the control elements and the group.
     *      Supported values are:
     *      'default': transparent background; active state and mouse hover
     *      effect with fill colors; keyboard focus effect with border lines
     *      (the default design). Exception: *focused* text fields behave as
     *      described in the 'white' design (white background, glow effect).
     *      'white': White background with shadow; mouse hover effect with
     *      darker shadow; keyboard focus effect and drop-down effect with
     *      glowing shadow.
     *      'framed': transparent background; active state, mouse hover effect,
     *      and keyboard focus effect with colored border lines.
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
         * Returns the position and size of the group node in the browser
         * window.
         *
         * @returns {Object}
         *  An object with numeric 'left', 'top', 'right', 'bottom', 'width',
         *  and 'height' attributes representing the position and size of the
         *  group node in pixels. The attributes 'right' and 'bottom' represent
         *  the distance of the right/bottom corner of the group node to the
         *  right/bottom border of the browser window.
         */
        this.getNodePosition = function () {
            return Utils.getNodePositionInWindow(groupNode);
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
         * Registers an event handler for specific DOM control nodes, that will
         * trigger a 'change' event for this group instance. The value of the
         * 'change' event will be determined by the passed value resolver
         * function.
         *
         * @param {String} type
         *  The type of the event handler that will be bound to the selected
         *  DOM node(s), e.g. 'click' or 'change'.
         *
         * @param {Object} [options]
         *  A map of options to control the behavior of this method. The
         *  following options are supported:
         *  @param {jQuery} [options.node]
         *      The DOM node that catches the jQuery action events. May be a
         *      single DOM control node, or a parent element of several
         *      controls selected by a jQuery selector string, if specified in
         *      the options parameter. If omitted, defaults to the root node of
         *      this group.
         *  @param {String} [options.selector]
         *      If specified, selects the ancestor elements of the specified
         *      node, which are actually triggering the events. If omitted, the
         *      event handler will be bound directly to the node passed to this
         *      method.
         *  @param {Function} [options.valueResolver]
         *      The function that returns the current value of this group
         *      instance. Will be called in the context of this group. Receives
         *      the control node that has triggered the event, as jQuery
         *      object. Must return the current value of the control (e.g. the
         *      boolean state of a toggle button, the value of a list item, or
         *      the current text in a text input field). May return null to
         *      indicate that a 'cancel' event should be triggered instead of a
         *      'change' event. If omitted, defaults to the static method
         *      Utils.getControlValue().
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.registerChangeHandler = function (type, options) {

            var // the node to attach the event handler to
                node = Utils.getOption(options, 'node', groupNode),
                // the jQuery selector for ancestor nodes
                selector = Utils.getStringOption(options, 'selector', ''),
                // the resolver function for the control value
                valueResolver = Utils.getFunctionOption(options, 'valueResolver', Utils.getControlValue);

            function eventHandler(event) {
                var value =  self.isEnabled() ? valueResolver.call(self, $(this)) : null;
                if (_.isNull(value)) {
                    self.trigger('cancel');
                } else {
                    self.update(value);
                    self.trigger('change', value);
                }
                return false;
            }

            // attach event handler to the node
            if (selector) {
                node.on(type, selector, eventHandler);
            } else {
                node.on(type, eventHandler);
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
            // #TODO: remove black/white icon hack, when icons are fonts instead of bitmaps
            if (groupNode.hasClass('white-icons')) {
                groupNode.find('i').addClass('icon-white');
            }
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
            return this.addChildNodes(control.addClass(Group.FOCUSABLE_CLASS));
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

        this.destroy = function () {
            this.events.destroy();
        };

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

        // formatting and tool tip
        groupNode
            .addClass('design-' + Utils.getStringOption(options, 'design', 'default'))
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
