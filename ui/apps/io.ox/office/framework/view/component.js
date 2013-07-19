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

define('io.ox/office/framework/view/component',
    ['io.ox/core/event',
     'io.ox/office/tk/utils',
     'io.ox/office/tk/keycodes'
    ], function (Events, Utils, KeyCodes) {

    'use strict';

    var // CSS class for hidden components
        HIDDEN_CLASS = 'hidden';

    // class Component ========================================================

    /**
     * Base class for view components containing instances of Group objects
     * (controls or groups of controls).
     *
     * Instances of this class trigger the following events:
     * - 'component:show': After the view component has been shown or hidden.
     *      The event handler receives the new visibility state.
     * - 'component:layout': After the size of the view component has been
     *      changed, by manipulating (showing, hiding, changing) the control
     *      groups it contains.
     * - 'group:change': If a control group has been activated. The event
     *      handler receives the key and value of the activated control group.
     *      The value depends on the type of the activated control.
     * - 'group:cancel': When the focus needs to be returned to the application
     *      (e.g. when the Escape key is pressed, or when a click on a
     *      drop-down button closes the opened drop-down menu).
     * - 'group:focus': After a control group has been focused, by initially
     *      focusing any of its focusable child nodes.
     * - 'group:blur': After the control group has lost the browser focus,
     *      after focusing any other DOM node outside the group.
     *
     * @constructor
     *
     * @extends Events
     *
     * @param {BaseApplication} app
     *  The application containing this view component instance.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new view component.
     *  The following options are supported:
     *  @param {String} [options.classes]
     *      Additional CSS classes that will be set at the root DOM node of
     *      this view component.
     *  @param {Object} [options.css]
     *      Additional CSS formatting that will be set at the root DOM node of
     *      this view component.
     *  @param {Boolean} [options.focusable=true]
     *      If set to true or omitted, the view component will be inserted into
     *      the chain of focusable nodes reachable with specific global
     *      keyboard shortcuts (usually the F6 key with platform dependent
     *      modifier keys).
     *  @param {Boolean} [options.hoverEffect=false]
     *      If set to true, all control groups in this view component will be
     *      displayed half-transparent as long as the mouse does not hover the
     *      view component. Has no effect, if the current device is a touch
     *      device.
     *  @param {Function} [options.groupInserter]
     *      A function that will implement inserting the root DOM node of a new
     *      group into this view component. The function receives the reference
     *      to the new group instance as first parameter. Will be called in the
     *      context of this view component instance. If omitted, groups will be
     *      appended to the root node of this view component.
     */
    function Component(app, options) {

        var // self reference
            self = this,

            // create the DOM root element representing the view component
            node = Utils.createContainerNode('view-component', options),

            // the last cached size of the root node, used to detect layout changes
            nodeSize = null,

            // all control groups, as plain array
            groups = [],

            // all control groups, mapped by key
            groupsByKey = {},

            // whether the pane will be focusable with keyboard
            focusable = Utils.getBooleanOption(options, 'focusable', true),

            // handler called to insert a new group into this view component
            groupInserter = Utils.getFunctionOption(options, 'groupInserter');

        // base constructor ---------------------------------------------------

        // add event hub
        Events.extend(this);

        // private methods ----------------------------------------------------

        /**
         * Returns the current outer size of the root node of this view
         * component. If the node is currently invisible, returns the last
         * cached size.
         */
        function getNodeSize() {
            return self.isReallyVisible() ? { width: node.outerWidth(), height: node.outerHeight() } : nodeSize;
        }

        /**
         * Handles 'group:show', 'group:enable', and 'group:layout' events.
         * Updates the CSS marker class controlling whether this view component
         * is focusable with special keyboard shortcuts, and triggers a
         * 'component:layout' event to all listeners, if the size of this view
         * component has been changed due to the changed control group.
         */
        function groupLayoutHandler() {
            var newNodeSize = getNodeSize();
            updateFocusable();
            if (!_.isEqual(nodeSize, newNodeSize)) {
                nodeSize = newNodeSize;
                self.trigger('component:layout');
            }
        }

        /**
         * Handles 'group:focus' and 'group:blur' events from all registered
         * group instances. Updates the CSS marker class at the root node of
         * this view component, and forwards the event to all listeners.
         */
        function groupFocusHandler(event) {
            node.toggleClass(Utils.FOCUSED_CLASS, event.type === 'group:focus');
            self.trigger(event.type);
        }

        /**
         * Inserts the passed control group into this view component, either by
         * calling the handler function passed to the constructor, or by
         * appending the root node of the group to the children of the own root
         * node.
         *
         * @param {Group} group
         *  The group instance to be inserted into this view component.
         */
        function insertGroup(group) {

            // remember the group object
            groups.push(group);

            // insert the group into this view component
            if (_.isFunction(groupInserter)) {
                groupInserter.call(self, group);
            } else {
                node.append(group.getNode());
            }

            // forward various group events, update focusability depending on
            // the group's state, forward other layout events
            group.on({
                'group:cancel': function (event, options) { self.trigger('group:cancel', options); },
                'group:show group:enable group:layout': groupLayoutHandler,
                'group:focus group:blur': groupFocusHandler
            });

            // make this view component focusable, if it contains any groups
            groupLayoutHandler();
        }

        /**
         * Returns all visible group objects that contain focusable controls as
         * array.
         */
        function getFocusableGroups() {
            return _(groups).filter(function (group) {
                return group.isVisible() && group.hasFocusableControls();
            });
        }

        /**
         * Updates the CSS marker class controlling whether this view component
         * is focusable with special keyboard shortcuts.
         */
        function updateFocusable() {
            node.toggleClass('f6-target', focusable && (getFocusableGroups().length > 0));
        }

        /**
         * Moves the focus to the previous or next enabled control in the view
         * component. Triggers a 'blur:key' event at the currently focused
         * control, and a 'focus:key' event at the new focused control.
         *
         * @param {Boolean} forward
         *  If set to true, moves focus forward, otherwise backward.
         */
        function moveFocus(forward) {

            var // all visible group objects with focusable controls
                focusableGroups = getFocusableGroups(),
                // extract all focusable controls from the groups
                controls = _(focusableGroups).reduce(function (controls, group) { return controls.add(group.getFocusableControls()); }, $()),
                // focused control
                control = Utils.getFocusedControl(controls),
                // index of focused control in all enabled controls
                index = controls.index(control);

            // move focus to next/previous control
            if ((controls.length > 1) && (0 <= index) && (index < controls.length)) {
                control.trigger('blur:key');
                if (forward) {
                    index = (index + 1) % controls.length;
                } else {
                    index = (index === 0) ? (controls.length - 1) : (index - 1);
                }
                controls.eq(index).focus().trigger('focus:key');
            }
        }

        /**
         * Keyboard handler for the entire view component.
         *
         * @param {jQuery.Event} event
         *  The jQuery keyboard event object.
         *
         * @returns {Boolean}
         *  True, if the event has been handled and needs to stop propagating.
         */
        function keyHandler(event) {
            if (KeyCodes.matchKeyCode(event, 'TAB', { shift: null })) {
                if (event.type === 'keydown') {
                    moveFocus(!event.shiftKey);
                }
                return false;
            }
        }

        /**
         * Handler for application controller 'update' events.
         */
        function controllerUpdateHandler(event, itemStates) {
            _(itemStates).each(function (itemState, key) {
                if (key in groupsByKey) {
                    _.chain(groupsByKey[key])
                        .invoke('enable', itemState.enable)
                        .invoke('setValue', itemState.value, itemState.options);
                }
            });
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the root element containing this view component as jQuery
         * object.
         */
        this.getNode = function () {
            return node;
        };

        /**
         * Returns the options map that has been passed to the constructor.
         */
        this.getOptions = function () {
            return options;
        };

        /**
         * Adds the passed control group as a 'private group' to this view
         * component. The 'group:change' events triggered by the group will not
         * be forwarded to the listeners of this view component. Instead, the
         * caller has to register a change listener at the group by itself.
         *
         * @param {Group} group
         *  The control group object to be inserted.
         *
         * @returns {Component}
         *  A reference to this view component.
         */
        this.addPrivateGroup = function (group) {
            insertGroup(group);
            return this;
        };

        /**
         * Adds the passed control group to this view component. The component
         * listens to 'update' events of the application controller and
         * forwards changed values to all registered control groups.
         *
         * @param {String} key
         *  The unique key of this group.
         *
         * @param {Group} group
         *  The control group object to be inserted.
         *
         * @returns {Component}
         *  A reference to this view component.
         */
        this.addGroup = function (key, group) {

            // insert the group object into this view component
            insertGroup(group);

            // forward 'group:change' events to listeners of this view component
            (groupsByKey[key] || (groupsByKey[key] = [])).push(group);
            group.on('group:change', function (event, value, options) {
                self.trigger('group:change', key, value, options);
            });

            // set the key as data attribute
            group.getNode().attr('data-key', key);

            return this;
        };

        /**
         * Returns whether this view component is visible.
         */
        this.isVisible = function () {
            return !node.hasClass(HIDDEN_CLASS);
        };

        /**
         * Returns whether this view component is effectively visible (it must
         * not be hidden by itself, it must be inside the DOM tree, and all its
         * parent nodes must be visible too).
         */
        this.isReallyVisible = function () {
            return node.is(Utils.VISIBLE_SELECTOR);
        };

        /**
         * Displays this view component, if it is currently hidden.
         *
         * @returns {Component}
         *  A reference to this view component.
         */
        this.show = function () {
            return this.toggle(true);
        };

        /**
         * Hides this view component, if it is currently visible.
         *
         * @returns {Component}
         *  A reference to this view component.
         */
        this.hide = function () {
            return this.toggle(false);
        };

        /**
         * Toggles the visibility of this view component.
         *
         * @param {Boolean} [state]
         *  If specified, shows or hides the view component depending on the
         *  boolean value. If omitted, toggles the current visibility of the
         *  view component.
         *
         * @returns {Component}
         *  A reference to this view component.
         */
        this.toggle = function (state) {
            var visible = (state === true) || ((state !== false) && !this.isVisible());
            if (this.isVisible() !== visible) {
                node.toggleClass(HIDDEN_CLASS, !visible);
                this.trigger('component:show', visible);
                nodeSize = getNodeSize();
            }
            return this;
        };

        /**
         * Returns whether this view component contains the control that is
         * currently focused. Searches in all registered group objects.
         */
        this.hasFocus = function () {
            return _(groups).any(function (group) { return group.hasFocus(); });
        };

        /**
         * Sets the focus to the first enabled group object in this view
         * component, unless it already contains a focused group.
         *
         * @returns {Component}
         *  A reference to this view component.
         */
        this.grabFocus = function () {

            var // all visible group objects with focusable controls
                focusableGroups = this.hasFocus() ? [] : getFocusableGroups();

            // set focus to first focusable group
            if (focusableGroups.length > 0) {
                focusableGroups[0].grabFocus();
            }

            return this;
        };

        /**
         * Calls the destroy methods of all child objects, and removes this
         * view component from the page.
         */
        this.destroy = function () {
            node.remove();
            this.events.destroy();
            _(groups).invoke('destroy');
            self = node = groups = groupsByKey = null;
        };

        // initialization -----------------------------------------------------

        // marker for touch devices
        node.toggleClass('touch', Modernizr.touch);

        // hover effect for groups embedded in the view component
        node.toggleClass('hover-effect', Utils.getBooleanOption(options, 'hoverEffect', false));

        // listen to key events for keyboard focus navigation
        node.on('keydown keypress keyup', keyHandler);

        // register this view component at the application controller, and listen to its update events
        app.getController()
            .registerViewComponent(this)
            .on('update', controllerUpdateHandler);

    } // class Component

    // exports ================================================================

    return _.makeExtendable(Component);

});
