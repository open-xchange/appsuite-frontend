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
     'io.ox/office/tk/label',
     'io.ox/office/tk/buttongroup',
     'io.ox/office/tk/radiogroup',
     'io.ox/office/tk/radiochooser'
    ], function (Events, Utils, Label, ButtonGroup, RadioGroup, RadioChooser) {

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
     */
    function ToolBar() {

        var // reference to this tool bar
            toolBar = this,

            // create the DOM root element representing the tool bar
            node = $('<div>').addClass('io-ox-toolbar'),

            // DOM child element measuring the total width of the controls
            containerNode = $('<span>').appendTo(node),

            // all control groups
            groups = [],

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

            var // all visible group objects
                visibleGroups = _(groups).filter(function (group) { return group.isVisible(); }),
                // extract all focusable controls from all visible groups
                controls = _(visibleGroups).reduce(function (controls, group) { return controls.add(group.getFocusableControls()); }, $()),
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
         * Listens to size events of the browser window, and tries to expand or
         * shrink resizeable button groups according to the available space in
         * the tool bar.
         */
        function updateGroupSizes() {

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
            // add window resize listener on first call
            if (!resizeHandlers.length) {
                $(window).on('resize', updateGroupSizes);
            }
            // store the resize handler object
            resizeHandlers.push(resizeHandler);
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
                keydown = event.type === 'keydown',
                keyup = event.type === 'keyup';

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
            case KeyCodes.ESCAPE:
                if (keyup) { toolBar.trigger('cancel'); }
                return false;
            }
        }

        // class RadioGroupProxy ----------------------------------------------

        /**
         * Proxy class returned as inserter for buttons into a radio group. The
         * radio group may be visualized as button group (all buttons are
         * visible in the tool bar), or as drop-down group (a single button
         * shows a drop-down menu when clicked).
         *
         * @constructor
         *
         * @param {String} key
         *  The unique key of the radio group. This key is shared by all
         *  buttons inserted into this group.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the drop-down group.
         *  See method ToolBar.addRadioGroup() for details.
         */
        function RadioGroupProxy(key, options) {

            var // type of the group
                type = Utils.getStringOption(options, 'type', 'buttons'),

                // create a new group container for the button group
                radioGroup = new RadioGroup(key),

                // create a new group container for the drop-down group
                radioChooser = new RadioChooser(key, options);

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

                var hideGroup = null, showGroup = null, hasFocus = false;

                // decide which group to hide and to show
                if (enlarge && radioChooser.isVisible()) {
                    hideGroup = radioChooser;
                    showGroup = radioGroup;
                } else if (!enlarge && radioGroup.isVisible()) {
                    hideGroup = radioGroup;
                    showGroup = radioChooser;
                }

                // hide and show the groups
                if (hideGroup && showGroup) {
                    hasFocus = hideGroup.hasFocus();
                    hideGroup.hide();
                    showGroup.show();
                    if (hasFocus) {
                        showGroup.grabFocus();
                    }
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
                radioChooser.addButton(value, options);
                return this;
            };

            /**
             * Returns a reference to the tool bar containing this button
             * group. Useful for method chaining.
             */
            this.end = function () { return toolBar; };

            // initialization -------------------------------------------------

            // register the group objects at this tool bar
            toolBar.addGroup(radioGroup).addGroup(radioChooser);

            // configure according to group type
            switch (type) {
            case 'buttons':
                radioChooser.hide();
                break;

            case 'auto':
                registerResizeHandler(resizeHandler);
                break;

            default: // 'dropdown'
                radioGroup.hide();
                break;
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
         * @param {Group} group
         *  The control group object. Will be appended to the contents of this
         *  tool bar.
         */
        this.addGroup = function (group) {
            // remember the group object
            groups.push(group);
            // append its root node to this tool bar
            containerNode.append(group.getNode());

            // forward 'change' and 'cancel' events to the tool bar
            group.on('change cancel', function (event, key, value) {
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
            return this.addGroup(new Label(key, options));
        };

        /**
         * Creates a new push button or toggle button in its own button group,
         * and appends it to this tool bar.
         *
         * @param {String} key
         *  The unique key of the button.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new button.
         *  Supports all generic formatting options (see method
         *  Utils.createButton() for details). Additionally, the following
         *  options are supported:
         *  @param {Boolean} [option.toggle=false]
         *      If set to true, the button toggles its state and passes a
         *      boolean value to change listeners. Otherwise, the button is a
         *      simple push button and passes undefined to its change
         *      listeners.
         *
         * @returns {ToolBar}
         *  A reference to this tool bar.
         */
        this.addButton = function (key, options) {
            return this.addGroup(new ButtonGroup().addButton(key, options));
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
         *  A map of options to control the properties of the drop-down group.
         *  Supports all generic formatting options for the drop-down button
         *  (see method Utils.createButton() for details). Additionally, the
         *  following options are supported:
         *  @param {String} [options.type='dropdown']
         *      If set to 'buttons', a button group will be created. If omitted
         *      or set to 'dropdown', a drop-down group will be created. If set
         *      to 'auto', the type will change between 'buttons' and
         *      'dropdown' according to the horizontal space available for the
         *      tool bar.
         *  @param {Number} [options.columns=3]
         *      Number of columns used to build the drop-down menu. Defaults
         *      to the value 3. Not used if the button group is shown instead
         *      of a drop-down button.
         *
         * @returns {RadioGroupProxy}
         *  A proxy object that implements methods to add option buttons to the
         *  radio group.
         */
        this.addRadioGroup = function (key, options) {
            return new RadioGroupProxy(key, options);
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
            _(groups).invoke('enable', key, state);
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
            _(groups).invoke('update', key, value);
            return this;
        };

        /**
         * Destructor. Calls the destructor function of all child objects, and
         * removes this tool bar from the page.
         */
        this.destroy = function () {
            this.events.destroy();
            $(window).off('resize', updateGroupSizes);
            node.off().remove();
            toolBar = node = containerNode = groups = resizeHandlers = null;
        };

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

        // listen to key events
        node.on('keydown keypress keyup', keyHandler);

    } // class ToolBar

    // exports ================================================================

    return _.makeExtendable(ToolBar);

});
