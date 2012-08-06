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

define('io.ox/office/tk/toolbar',
    ['io.ox/core/event',
     'io.ox/office/tk/utils',
     'io.ox/office/tk/control/label',
     'io.ox/office/tk/control/button',
     'io.ox/office/tk/control/radiogroup'
    ], function (Events, Utils, Label, Button, RadioGroup) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class ToolBar ==========================================================

    /**
     * A tool bar is a container of form controls which are organized and
     * displayed as a horizontal bar.
     *
     * Instances of this class trigger various events:
     * * 'change': If a control has been activated. The event handler receives
     *  the key and value of the activated control. The value depends on the
     *  type of the activated control.
     * * 'cancel': When the focus needs to be returned to the application (e.g.
     *  when the Escape key is pressed, or when a click on a drop-down button
     *  closes the opened drop-down menu).
     *
     * @constructor
     *
     * @param {ox.ui.Window} win
     *  The window containing this tool bar. Will be used to listen to 'show'
     *  and 'hide' events.
     */
    function ToolBar(win) {

        var // reference to this tool bar
            toolBar = this,

            // create the DOM root element representing the tool bar
            node = $('<div>').addClass('io-ox-toolbar'),

            // DOM child element measuring the total width of the controls
            containerNode = $('<span>').appendTo(node),

            // if set to true, inserted groups will have no spacing between previous group
            collapsedGroupsNode = null,

            // all control groups, as plain array
            groups = [],

            // all control groups, mapped by key
            groupsByKey = {},

            // group initializer waiting for the first window 'show' event
            deferredInit = $.Deferred(),

            // resize handler functions supporting flexible tool bar sizing
            resizeHandlers = [];

        // private methods ----------------------------------------------------

        /**
         * Moves the focus to the previous or next enabled control in the tool
         * bar. Triggers a 'blur:key' event at the currently focused control,
         * and a 'focus:key' event at the new focused control.
         *
         * @param {Boolean} forward
         *  If set to true, moves focus forward, otherwise backward.
         */
        function moveFocus(forward) {

            var // all visible and enabled group objects
                enabledGroups = _(groups).filter(function (group) { return group.isVisible() && group.isEnabled(); }),
                // extract all focusable controls from all visible and enabled groups
                controls = _(enabledGroups).reduce(function (controls, group) { return controls.add(group.getFocusableControls()); }, $()),
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
         * Registers a resize handler function provided by a button group
         * object.
         *
         * @param {Function} resizeHandler
         *  The resize handler. Will be called in the context of this tool bar.
         *  Receives a boolean parameter 'enlarge'. If set to true, the handler
         *  must try to increase the width of the button group. If set to
         *  false, the handler must try to decrease the width of the button
         *  group.
         */
        function registerResizeHandler(resizeHandler) {
            // store the resize handler object
            resizeHandlers.push(resizeHandler);
        }

        /**
         * Listens to size events of the browser window, and tries to expand or
         * shrink resizeable button groups according to the available space in
         * the tool bar.
         */
        function windowResizeHandler() {

            var // available space (width() returns content width without padding)
                width = node.width();

            // try to enlarge one or more controls, until tool bar overflows
            _(resizeHandlers).each(function (resizeHandler) {
                if (containerNode.width() < width) { resizeHandler.call(toolBar, true); }
            });

            // try to shrink one or more controls, until tool bar does not overflow
            _(resizeHandlers).each(function (resizeHandler) {
                if (containerNode.width() > width) { resizeHandler.call(toolBar, false); }
            });
        }

        /**
         * Keyboard handler for the entire tool bar.
         *
         * @param {jQuery.Event} event
         *  The jQuery keyboard event object.
         *
         * @returns {Boolean}
         *  True, if the event has been handled and needs to stop propagating.
         */
        function keyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown';

            switch (event.keyCode) {
            case KeyCodes.TAB:
                if (!event.ctrlKey && !event.altKey && !event.metaKey) {
                    if (keydown) { moveFocus(!event.shiftKey); }
                    return false;
                }
                break;
            case KeyCodes.LEFT_ARROW:
                if (keydown) { moveFocus(false); }
                return false;
            case KeyCodes.RIGHT_ARROW:
                if (keydown) { moveFocus(true); }
                return false;
            }
        }

        // class RadioGroupProxy ----------------------------------------------

        /**
         * Proxy class returned as inserter for buttons into a radio group. The
         * radio group may be visualized as button group (all buttons are
         * visible in the tool bar), as drop-down group (a single button shows
         * a drop-down button menu when clicked), or as list group (a single
         * button shows a drop-down list when clicked).
         *
         * @constructor
         *
         * @param {String} key
         *  The unique key of the radio group.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the radio group. See
         *  method ToolBar.addRadioGroup() for details.
         */
        function RadioGroupProxy(key, options) {

            var // the group object containing the option buttons
                radioGroup = new RadioGroup(options),

                // automatic expansion (disable, if group is not in drop-down mode)
                autoExpand = radioGroup.hasMenu && Utils.getBooleanOption(options, 'autoExpand', false),

                // expanded group, if autoExpand is enabled
                expandGroup = autoExpand ? new RadioGroup(Utils.extendOptions(options, { type: 'buttons' })) : null;

            // private methods ------------------------------------------------

            /**
             * Tries to show the button group or the drop-down button according
             * to the specified size mode.
             *
             * @param {Boolean} enlarge
             *  If set to true, shows the button group, otherwise shows the
             *  drop-down button.
             */
            function resizeHandler(enlarge) {

                var hideGroup = null, showGroup = null;

                // decide which group to hide and to show
                if (enlarge && radioGroup.isVisible()) {
                    hideGroup = radioGroup;
                    showGroup = expandGroup;
                } else if (!enlarge && expandGroup.isVisible()) {
                    hideGroup = expandGroup;
                    showGroup = radioGroup;
                }

                // hide and show the groups
                if (hideGroup && showGroup) {
                    showGroup.show();
                    if (hideGroup.hasFocus()) {
                        showGroup.grabFocus();
                    }
                    hideGroup.hide();
                }
            }

            // methods --------------------------------------------------------

            /**
             * Adds a new button to this radio group.
             *
             * @param {String} value
             *  The unique value associated to this button.
             *
             * @param {Object} [options]
             *  A map of options to control the properties of the new button.
             *  See method Utils.createButton() for details.
             */
            this.addButton = function (value, options) {
                radioGroup.addButton(value, options);
                if (expandGroup) {
                    expandGroup.addButton(value, options);
                }
                return this;
            };

            /**
             * Returns a reference to the tool bar containing this button
             * group. Useful for method chaining.
             */
            this.end = function () { return toolBar; };

            // initialization -------------------------------------------------

            toolBar.addGroup(key, radioGroup);
            if (expandGroup) {
                toolBar.addGroup(key, expandGroup);
                registerResizeHandler(resizeHandler);
            }

        } // class RadioGroupProxy

        // methods ------------------------------------------------------------

        /**
         * Returns the root DOM element containing this tool bar as jQuery
         * object.
         */
        this.getNode = function () {
            return node;
        };

        /**
         * Adds the passed control group to this tool bar. Calls to the method
         * ToolBar.update() will be forwarded to all registered groups.
         *
         * @param {String} key
         *  The unique key of this group.
         *
         * @param {Group} group
         *  The control group object. Will be appended to the contents of this
         *  tool bar.
         */
        this.addGroup = function (key, group) {

            // remember the group object
            groups.push(group);
            (groupsByKey[key] || (groupsByKey[key] = [])).push(group);

            // append its root node to this tool bar
            if (collapsedGroupsNode) {
                if (!collapsedGroupsNode.children().length) {
                    containerNode.append(collapsedGroupsNode);
                }
                collapsedGroupsNode.append(group.getNode());
            } else {
                containerNode.append(group.getNode());
            }

            // Trigger an 'init' event at the group when the container window
            // becomes visible the first time. The 'deferredInit' object will
            // be resolved on the first window 'show' event and will execute
            // all done handlers attached here. If the window is already
            // visible when calling this method, the deferred is resolved and
            // will execute the new done handler immediately.
            deferredInit.done(function () { group.trigger('init'); });

            // forward group events to listeners of this tool bar
            group.on('change cancel', function (event, value) {
                toolBar.trigger(event.type, key, value);
            });

            return this;
        };

        /**
         * Creates a new dynamic label element in its own group, and appends it
         * to this tool bar. The label text will be updated according to calls
         * of the method ToolBar.update().
         *
         * @param {String} key
         *  The unique key of the label.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new label
         *  element. Supports all generic formatting options (see method
         *  Utils.createLabel() for details.
         *
         * @returns {ToolBar}
         *  A reference to this tool bar.
         */
        this.addLabel = function (key, options) {
            return this.addGroup(key, new Label(options));
        };

        /**
         * Creates a new push button or toggle button, and appends it to this
         * tool bar.
         *
         * @param {String} key
         *  The unique key of the button.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new button.
         *  Supports all options of the Button class constructor.
         *
         * @returns {ToolBar}
         *  A reference to this tool bar.
         */
        this.addButton = function (key, options) {
            return this.addGroup(key, new Button(options));
        };

        /**
         * Creates a radio button group, and appends it to this tool bar. The
         * radio group may be visualized as button group (all buttons are
         * visible in the tool bar), or as drop-down group (a single button
         * shows a drop-down menu when clicked).
         *
         * @param {String} key
         *  The unique key of the group. This key is shared by all buttons
         *  inserted into this group.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the radio group.
         *  Supports all generic formatting options of the RadioGroup class
         *  constructor. Additionally, the following options are supported:
         *  @param {Boolean} [options.autoExpand=false]
         *      If set to true, the type of this group will be changed to
         *      'buttons' automatically, if there is enough horizontal space
         *      available in the tool bar. Does not have any effect, if
         *      options.type is already set to 'buttons'.
         *
         * @returns {RadioGroupProxy}
         *  A proxy object that implements methods to add option buttons to the
         *  radio group.
         */
        this.addRadioGroup = function (key, options) {
            return new RadioGroupProxy(key, options);
        };

        this.startCollapseGroups = function () {
            collapsedGroupsNode = $('<div>').addClass('collapsed-groups');
            return this;
        };

        this.endCollapseGroups = function () {
            collapsedGroupsNode = null;
            return this;
        };

        /**
         * Enables or disables the specified control of this tool bar.
         *
         * @param {String} key
         *  The keys of the control to be enabled or disabled.
         *
         * @param {Boolean} [state=true]
         *  If omitted or set to true, the control will be enabled. Otherwise,
         *  the control will be disabled.
         *
         * @returns {ToolBar}
         *  A reference to this tool bar.
         */
        this.enable = function (key, state) {
            if (key in groupsByKey) {
                _(groupsByKey[key]).invoke('enable', state);
            }
            return this;
        };

        /**
         * Disables the specified control of this tool bar. Has the same effect
         * as calling ToolBar.enable(key, false).
         *
         * @param {String} key
         *  The key of the control to be disabled.
         *
         * @returns {ToolBar}
         *  A reference to this tool bar.
         */
        this.disable = function (key) {
            return this.enable(key, false);
        };

        /**
         * Updates the specified control with the specified value.
         *
         * @param {String} key
         *  The key of the control to be updated.
         *
         * @param value
         *  The new value to be displayed in the control.
         *
         * @returns {ToolBar}
         *  A reference to this tool bar.
         */
        this.update = function (key, value) {
            if (key in groupsByKey) {
                _(groupsByKey[key]).invoke('update', value);
                // update may have changed control size, recalculate sizes
                windowResizeHandler();
            }
            return this;
        };

        /**
         * Destructor. Calls the destructor function of all child objects, and
         * removes this tool bar from the page.
         */
        this.destroy = function () {
            this.events.destroy();
            $(window).off('resize', windowResizeHandler);
            node.off().remove();
            toolBar = node = containerNode = collapsedGroupsNode = groups = groupsByKey = deferredInit = resizeHandlers = null;
        };

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

        // wait for the first window 'show' event and trigger an 'init' event at all groups
        win.one('show', function () { deferredInit.resolve(); })
            .on('show', function () { windowResizeHandler(); $(window).on('resize', windowResizeHandler); })
            .on('hide', function () { $(window).off('resize', windowResizeHandler); });

        // listen to key events for keyboard focus navigation
        node.on('keydown keypress keyup', keyHandler);

    } // class ToolBar

    // exports ================================================================

    return _.makeExtendable(ToolBar);

});
