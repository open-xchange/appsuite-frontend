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
     'less!io.ox/office/tk/style.css'
    ], function (Events, Utils) {

    'use strict';

    var // CSS class for hidden groups
        HIDDEN_CLASS = 'hidden',

        // CSS class for focusable controls
        FOCUSABLE_CLASS = 'focusable',

        // CSS selector for focusable controls
        FOCUSABLE_SELECTOR = '.' + FOCUSABLE_CLASS;

    // class Group ============================================================

    /**
     * Creates a container element used to hold a control. All controls shown
     * in view components must be inserted into such group containers. This is
     * the base class for specialized groups and does not add any specific
     * functionality to the inserted controls.
     *
     * @constructor
     */
    function Group() {

        var // self reference
            self = this,

            // create the group container element
            groupNode = $('<div>').addClass('group'),

            // update handler functions
            updateHandlers = [];

        // methods ------------------------------------------------------------

        /**
         * Returns the DOM container element for this group as jQuery object.
         */
        this.getNode = function () {
            return groupNode;
        };

        /**
         * Registers the passed update handler function. These handlers will be
         * called from the method Group.update().
         *
         * @param {Function} updateHandler
         *  The update handler function. Will be called in the context of this
         *  group. Receives the value passed to the 'update' event.
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
         *  group. Receives the control that triggered the event. Must return
         *  the current value of the control (e.g. the boolean state of a
         *  toggle button, the value of a list item, or the current text in a
         *  text input field).
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.registerActionHandler = function (node, type, selector, actionHandler) {

            function actionEventHandler(event) {
                var control = $(this), value;
                if (Utils.isControlEnabled(control)) {
                    value = actionHandler.call(self, control);
                    self.trigger('change', value);
                } else {
                    self.trigger('cancel');
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
         * Inserts the passed control into this group.
         *
         * @param {jQuery} control
         *  The control to be inserted into this group, as jQuery object.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.addControl = function (control) {
            groupNode.append(control);
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
            groupNode.append(control.addClass(FOCUSABLE_CLASS));
            return this;
        };

        /**
         * Returns all controls from this group that need to be included into
         * keyboard focus navigation.
         */
        this.getFocusableControls = function () {
            return groupNode.find(FOCUSABLE_SELECTOR + Utils.ENABLED_SELECTOR);
        };

        /**
         * Returns whether this group contains the control that is currently
         * focused. Searches in all ancestor elements of this group.
         */
        this.hasFocus = function () {
            return Utils.containsFocusedControl(groupNode);
        };

        /**
         * Sets the focus to the first enabled control in this group.
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
            groupNode.removeClass(HIDDEN_CLASS);
            return this;
        };

        /**
         * Hides this control group, if it is currently visible.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.hide = function () {
            groupNode.addClass(HIDDEN_CLASS);
            return this;
        };

        /**
         * Toggles the visibility of this control group.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.toggle = function () {
            groupNode.toggleClass(HIDDEN_CLASS);
            return this;
        };

        /**
         * Enables or disables the controls in this group.
         *
         * @param {Boolean} [state=true]
         *  If omitted or set to true, all controls in the group will be
         *  enabled. Otherwise, the controls will be disabled.
         *
         * @returns {Group}
         *  A reference to this group.
         */
        this.enable = function (state) {
            Utils.enableControls(groupNode.children(), state);
            return this;
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

    } // class Group

    // exports ================================================================

    return _.makeExtendable(Group);

});
