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
     'io.ox/office/tk/utils',
     'io.ox/office/tk/keycodes'
    ], function (Events, Utils, KeyCodes) {

    'use strict';

    var // DOM event that will cause a 'group:change' event from a group
        INTERNAL_TRIGGER_EVENT = 'private:trigger',

        // the group instances currently focused (as array, groups may be embedded)
        focusStack = [];

    // class Group ============================================================

    /**
     * Creates a container element used to hold a control. All controls shown
     * in view components must be inserted into such group containers. This is
     * the base class for specialized groups and does not add any specific
     * functionality to the inserted controls.
     *
     * Instances of this class trigger the following events:
     * - 'group:change': If the control has been activated in a special way
     *      depending on the type of the control group. The event handler
     *      receives the new value of the activated control.
     * - 'group:cancel': When the focus needs to be returned to the application
     *      (e.g. when the ESCAPE key is pressed, or when a click on a
     *      drop-down button closes the opened drop-down menu).
     * - 'group:show': After the control has been shown or hidden. The event
     *      handler receives the new visibility state.
     * - 'group:enable': After the control has been enabled or disabled. The
     *      event handler receives the new state.
     * - 'group:layout': After child nodes have been inserted into this group
     *      using the method Group.addChildNodes().
     * - 'group:focus': After the group has been focused, by initially focusing
     *      any of its focusable child nodes. As long as the focus remains
     *      inside the group (even if the focus moves to another DOM node in
     *      the group), no further 'group:focus' event will be triggered.
     * - 'group:blur': After the group has lost the browser focus, after
     *      focusing any other DOM node outside the group. As long as the focus
     *      remains inside the group (even if the focus moves to another DOM
     *      node in the group), the 'group:blur' event will not be triggered.
     *
     * @constructor
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new group. The
     *  following options are supported:
     *  @param {String} [options.tooltip]
     *      Tool tip text shown when the mouse hovers the control. If omitted,
     *      the control will not show a tool tip.
     *  @param {String} [options.classes]
     *      Additional CSS classes that will be set at the root DOM node of
     *      this instance.
     */
    function Group(options) {

        var // self reference
            self = this,

            // create the group container element
            groupNode = $('<div>').addClass('group'),

            // the current value of this control group
            groupValue = null,

            // the current value options of this control group
            groupOptions = null,

            // update handler functions
            updateHandlers = [],

            // all container nodes that are part of this group instance, for focus handling
            focusableNodes = groupNode;

        // base constructor ---------------------------------------------------

        // add event hub
        Events.extend(this);

        // private methods ----------------------------------------------------

        /**
         * Keyboard handler for the entire group.
         */
        function keyHandler(event) {
            if (event.keyCode === KeyCodes.ESCAPE) {
                if ((event.type === 'keydown') && !event.isDefaultPrevented()) {
                    self.triggerCancel();
                }
                return false;
            }
        }

        /**
         * Triggers a 'group:cancel' event and suppresses the default action of
         * the passed event, if this group is disabled.
         */
        function disabledHandler(event) {
            if (!self.isEnabled()) {
                event.preventDefault();
                self.triggerCancel();
            }
        }

        /**
         * Updates the focused state of this group, according to the passed
         * 'focusin' and 'focusout' events. The order of focusin/focusout
         * events is not reliable, therefore, a simple check whether the focus
         * is inside the group is performed.
         */
        function focusHandler(event) {

            // update CSS focus class, trigger event (check that group is not destroyed yet)
            function changeFocusState(group, focused) {
                if (_.isFunction(group.trigger)) {
                    group.getNode().toggleClass(Utils.FOCUSED_CLASS, focused);
                    group.trigger(focused ? 'group:focus' : 'group:blur');
                }
            }

            function processEvent(focusNode) {

                var // the top entry of the focus stack
                    stackEntry = null;

                // Returns whether the focus node is one of the focusable
                // container nodes, or if it is contained in one of these nodes.
                function isFocusable(focusableNodes) {
                    return (focusableNodes.filter(focusNode).length > 0) || (focusableNodes.has(focusNode).length > 0);
                }

                // trigger a 'group:blur' event at all cached focus groups that
                // do not contain the passed focus node anymore
                while ((focusStack.length > 0) && !isFocusable(_.last(focusStack).nodes)) {
                    stackEntry = focusStack.pop();
                    changeFocusState(stackEntry.group, false);
                }

                // trigger a 'group:focus' event at this group, if it is not already focused
                if (!groupNode.hasClass(Utils.FOCUSED_CLASS) && isFocusable(focusableNodes)) {
                    focusStack.push({ group: self, nodes: focusableNodes });
                    changeFocusState(self, true);
                }
            }

            switch (event.type) {
            // focus received: process event synchronously, use target node of
            // event to be sure to generate the 'group:focus' event (using
            // document.activeElement and jQuery.find(':focus') is not reliable
            // before the event has been processed by the browser)
            case 'focusin':
                processEvent(event.target);
                break;
            // focus lost: order of focus events is not reliable, process event
            // asynchronously, check directly whether the group is still focused
            case 'focusout':
                _.defer(function () { processEvent(document.activeElement); });
                break;
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
         * Returns the options that have been passed to the constructor.
         */
        this.getOptions = function () {
            return options;
        };

        /**
         * Registers the passed update handler function. These handlers will be
         * called from the method Group.setValue() in order of their
         * registration.
         *
         * @param {Function} updateHandler
         *  The update handler function. Will be called in the context of this
         *  group. Receives the following parameters:
         *  (1) {Any} value
         *      The value passed to the method Group.setValue().
         *  (2) {Object|Undefined} options
         *      The options map passed to the method Group.setValue().
         *  (3) {Any} oldValue
         *      The old value of the group.
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
         * trigger a 'group:change' event for this group instance. The value of
         * the 'group:change' event will be determined by the passed value
         * resolver function.
         *
         * @param {String} [type]
         *  The type of the event handler that will be bound to the selected
         *  DOM node(s), e.g. 'click' or 'change'. If omitted, the
         *  'group:change' event can only be triggered manually with the method
         *  'Group.triggerChange()'.
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
         *      indicate that a 'group:cancel' event should be triggered
         *      instead of a 'group:change' event. If omitted, defaults to the
         *      static method Utils.getControlValue().
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

            function eventHandler(event, options) {
                var value = self.isEnabled() ? valueResolver.call(self, $(this)) : null;
                if (_.isNull(value)) {
                    self.triggerCancel(options);
                } else {
                    self.setValue(value, options);
                    self.trigger('group:change', value, options);
                }
                return false;
            }

            // the resulting event type names
            type = _.isString(type) ? (type + ' ' + INTERNAL_TRIGGER_EVENT) : INTERNAL_TRIGGER_EVENT;

            // attach event handler to the node
            if (selector) {
                node.on(type, selector, eventHandler);
            } else {
                node.on(type, eventHandler);
            }

            return this;
        };

        /**
         * Registers a container DOM node located outside the root node of this
         * group instance, that contains control nodes that will be included
         * into the focus handling and generation of 'group:focus' and
         * 'group:blur' events.
         *
         * @param {HTMLElement|jQuery} node
         *  The DOM node(s) to be added to the internal focus handling.
         *
         * @returns {Group}
         *  A reference to this instance.
         */
        this.registerFocusableContainerNode = function (node) {
            focusableNodes = focusableNodes.add(node);
            node.on('focus focusin focusout blur', focusHandler);
            return this;
        };

        /**
         * Inserts the passed HTML mark-up into this group (all existing child
         * nodes will be removed). Triggers a 'group:layout' event notifying
         * all listeners about the changed layout of this group.
         *
         * @param {String} markup
         *  The HTML mark-up to be inserted into this group, as string.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.setChildMarkup = function (markup) {
            groupNode.html(markup);
            return this.trigger('group:layout');
        };

        /**
         * Inserts the passed DOM elements into this group, and triggers a
         * 'group:layout' event notifying all listeners about the changed
         * layout of this group.
         *
         * @param {jQuery} nodes
         *  The nodes to be inserted into this group, as jQuery object.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.addChildNodes = function (nodes) {
            groupNode.append(nodes);
            return this.trigger('group:layout');
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
            return this.addChildNodes(control.addClass(Utils.FOCUSABLE_CLASS));
        };

        /**
         * Returns whether this group contains any focusable controls.
         */
        this.hasFocusableControls = function () {
            return groupNode.find(Utils.FOCUSABLE_SELECTOR).length > 0;
        };

        /**
         * Returns all control nodes contained in this group that need to be
         * included into keyboard focus navigation.
         */
        this.getFocusableControls = function () {
            return groupNode.find(Utils.FOCUSABLE_SELECTOR);
        };

        /**
         * Returns whether this group contains the control that is currently
         * focused. Searches in all ancestor elements of this group, and in all
         * other focusable container nodes that have been registered with the
         * method 'Group.registerFocusableContainerNode()'.
         */
        this.hasFocus = function () {
            return Utils.containsFocusedControl(focusableNodes);
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
         * Returns whether this control group is configured to be visible (via
         * the methods Group.show(), Group.hide(), or Group.toggle()). Does not
         * check the effective visibility depending on the visibility of all
         * parent DOM nodes (see method Group.isReallyVisible() to do that).
         */
        this.isVisible = function () {
            return !groupNode.hasClass(Utils.HIDDEN_CLASS);
        };

        /**
         * Returns whether this control group is effectively visible (it must
         * not be hidden by itself, it must be inside the DOM tree, and all its
         * parent nodes must be visible too).
         */
        this.isReallyVisible = function () {
            return groupNode.is(Utils.REALLY_VISIBLE_SELECTOR);
        };

        /**
         * Displays this control group, if it is currently hidden.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.show = function () {
            return this.toggle(true);
        };

        /**
         * Hides this control group, if it is currently visible.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.hide = function () {
            return this.toggle(false);
        };

        /**
         * Toggles the visibility of this control group.
         *
         * @param {Boolean} [state]
         *  If specified, shows or hides the groups depending on the boolean
         *  value. If omitted, toggles the current visibility of the group.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.toggle = function (state) {

            var // whether to show the group instance
                visible = (state === true) || ((state !== false) && this.isVisible());

            if (this.isVisible() !== visible) {
                groupNode.toggleClass(Utils.HIDDEN_CLASS, !visible);
                this.trigger('group:show', visible);
            }
            return this;
        };

        /**
         * Returns whether this control group is enabled.
         */
        this.isEnabled = function () {
            return groupNode.is(Utils.ENABLED_SELECTOR);
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

            var // whether to enable the group instance
                enabled = _.isUndefined(state) || (state === true);

            // enable/disable the entire group node with all its descendants
            if (this.isEnabled() !== enabled) {
                groupNode.toggleClass(Utils.DISABLED_CLASS, !enabled);
                this.trigger('group:enable', enabled);
            }
            return this;
        };

        /**
         * Returns the current value of this control group.
         *
         * @returns {Any}
         *  The current value of this control group.
         */
        this.getValue = function () {
            return groupValue;
        };

        /**
         * Updates the controls in this group with the specified value, by
         * calling the registered update handlers.
         *
         * @param {Any} value
         *  The new value to be displayed in the controls of this group.
         *
         * @param {Object} [options]
         *  A map with options that will be passed as second parameter to all
         *  registered update handlers.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.setValue = function (value, options) {
            var oldValue = groupValue;
            if (!_.isUndefined(value)) {
                groupValue = value;
                groupOptions = options;
                _(updateHandlers).each(function (updateHandler) {
                    updateHandler.call(this, value, options, oldValue);
                }, this);
            }
            return this;
        };

        /**
         * Debounced call of the Group.setValue() method with the current value
         * of this group. Can be used to refresh the appearance of the group
         * after changing its content.
         */
        this.refresh = _.debounce(function () {
            self.setValue(groupValue, groupOptions);
        });

        /**
         * Triggers a special event at the passed DOM control node contained in
         * this Group instance. The group will catch the event, and will
         * trigger a 'group:change' event by itself with the value associated
         * to the DOM control node.
         *
         * @param {HTMLElement|jQuery}
         *  A DOM control node of this group that must have been configured as
         *  source of change events with the Group.registerChangeHandler()
         *  method. If this object is a jQuery collection, uses the first DOM
         *  node it contains.
         *
         * @param {Object} [options]
         *  A map with additional options that will be passed to the
         *  'group:change' event listeners of this class.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.triggerChange = function (control, options) {
            $(control).first().trigger(INTERNAL_TRIGGER_EVENT, options);
            return this;
        };

        /**
         * Triggers a 'group:cancel' event at this Group instance.
         *
         * @param {Object} [options]
         *  A map with additional options that will be passed to the
         *  'group:cancel' event listeners of this class.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.triggerCancel = function (options) {
            return this.trigger('group:cancel', options);
        };

        this.destroy = function () {
            this.events.destroy();
        };

        // initialization -----------------------------------------------------

        // formatting and tool tip
        groupNode.addClass(Utils.getStringOption(options, 'classes', ''));
        Utils.setControlTooltip(groupNode, Utils.getStringOption(options, 'tooltip'));

        // add event handlers
        groupNode.on({
            'keydown keypress keyup': keyHandler,
            'mousedown touchstart dragover drop contextmenu': disabledHandler,
            'focus focusin focusout blur': focusHandler
        });

    } // class Group

    // exports ================================================================

    return _.makeExtendable(Group);

});
