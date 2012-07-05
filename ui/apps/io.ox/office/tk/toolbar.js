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
     'io.ox/office/tk/controlgroup',
     'io.ox/office/tk/dropdowngroup',
     'less!io.ox/office/tk/toolbar.css'
    ], function (Events, Utils, ControlGroup, DropDownGroup) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // CSS class for visible controls in the tool bar (used for keyboard focus navigation)
        CONTROL_CLASS = 'io-ox-toolbar-control',

        // CSS selector for focusable controls in the tool bar
        CONTROL_SELECTOR = '.' + CONTROL_CLASS;

    // class ToolBar ==========================================================

    /**
     * A tool bar is a container of form controls which are organized and
     * displayed as a horizontal bar.
     *
     * Internally, the tool bar uses a strict hierarchy of elements with
     * specific attributes and classes:
     * 1) The tool bar root node contains another container that serves as
     * parent for the actual tool bar controls, and is used to measure the
     * width of the space used by all visible controls.
     * 2) Direct children of this container node are always div elements with
     * the Bootstrap class 'btn-group', called 'button groups'.
     * 3) Button groups will be hidden with the special class 'io-ox-hidden'.
     * 4) Ancestors of button groups are control elements with the special
     * class 'io-ox-toolbar-control', which is used for keyboard focus
     * navigation. There may be other control elements which do not have this
     * class, e.g. controls in a drop-down menu.
     * 5) Tool bar controls are disabled with the 'disabled' attribute.
     *
     * @constructor
     */
    function ToolBar() {

        var // reference to this tool bar
            toolbar = this,

            // create the DOM root element representing the tool bar
            node = $('<div>').addClass('btn-toolbar io-ox-toolbar'),

            // DOM child element measuring the total width of the controls
            containerNode = $('<span>').appendTo(node),

            // control update handlers, mapped by key
            updateHandlers = {},

            // resize handler functions supporting flexible tool bar sizing
            resizeHandlers = [];

        // private methods ----------------------------------------------------

        /**
         * Returns the control with the specified key as jQuery collection. The
         * returned object may contain multiple elements, e.g. for radio button
         * groups.
         *
         * @param {String} key
         *  The unique key of the control.
         *
         * @returns {jQuery}
         *  The controls matching the specified key, as jQuery collection.
         */
        function selectControl(key) {
            return $('[data-key="' + key + '"]', node);
        }

        /**
         * Moves the focus to the previous or next enabled control in the tool
         * bar. Triggers a 'keyblur' event at the currently focused control,
         * and a 'keyfocus' event at the new focused control.
         *
         * @param {Boolean} forward
         *  If set to true, moves focus forward, otherwise backward.
         */
        function moveFocus(forward) {

            var // all enabled controls in all visible button groups
                controls = containerNode.find('> div' + ControlGroup.VISIBLE_SELECTOR + ' ' + CONTROL_SELECTOR + Utils.ENABLED_SELECTOR),
                // focused control
                control = Utils.getFocusedControl(controls),
                // index of focused control in all enabled controls
                index = controls.index(control);

            // move focus to next/previous control
            if ((controls.length > 1) && (0 <= index) && (index < controls.length)) {
                control.trigger('keyblur');
                if (forward) {
                    index = (index + 1) % controls.length;
                } else {
                    index = (index + controls.length - 1) % controls.length;
                }
                controls.eq(index).focus().trigger('keyfocus');
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
                if (containerNode.width() < width) { resizeHandler.call(toolbar, true); }
            });

            // try to shrink one or more controls, until tool bar does not overflow
            _(resizeHandlers).each(function (resizeHandler) {
                if (containerNode.width() > width) { resizeHandler.call(toolbar, false); }
            });
        }

        /**
         * Registers the passed update handler for a specific control. Update
         * handlers will be executed, when the tool bar receives 'update'
         * events.
         *
         * @param {String} key
         *  The unique key of the control.
         *
         * @param {Function} updateHandler
         *  The update handler function. Will be called in the context of this
         *  tool bar. Receives the control associated to the passed key, and
         *  the value passed to the 'update' event.
         */
        function registerUpdateHandler(key, updateHandler) {
            updateHandlers[key] = updateHandler;
        }

        /**
         * Registers the passed action handler for a specific control. Action
         * handlers will be executed, when the control has been activated in
         * the user interface. Will trigger a 'change' event at the tool bar,
         * passing the key of the source control, and its current value as
         * returned by the passed action handler.
         *
         * @param {jQuery} node
         *  The DOM node that catches the jQuery action events. May be a single
         *  control, or a parent element of several controls, e.g. the group
         *  node. In the latter case, the parameter 'selector' must be
         *  specified.
         *
         * @param {String} action
         *  The name of the action event, e.g. 'click' or 'change'.
         *
         * @param {String} [selector]
         *  If specified, selects the ancestor elements of the specified node,
         *  which are actually triggering the events.
         *
         * @param {Function} actionHandler
         *  The action handler function. Will be called in the context of this
         *  tool bar. Receives the control passed to this function. Must return
         *  the current value of the control (e.g. the boolean state of a
         *  toggle button, or the text of a text field).
         */
        function registerActionHandler(node, action, selector, actionHandler) {

            function actionEventHandler(event) {
                var control = $(event.target), key, value;
                if (Utils.isControlEnabled(control)) {
                    key = control.attr('data-key');
                    value = actionHandler.call(toolbar, control);
                    toolbar.trigger('change', key, value);
                }
            }

            // normalize passed parameters (missing selector)
            if (actionHandler === undefined) {
                actionHandler = selector;
                selector = undefined;
            }

            // attach event handler to the node
            if (selector === undefined) {
                node.on(action, actionEventHandler);
            } else {
                node.on(action, selector, actionEventHandler);
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
            case KeyCodes.ESCAPE:
                // TODO: focus back to application
                return false;
            }
        }

        // class ButtonGroupProxy ---------------------------------------------

        /**
         * Proxy class returned as inserter for buttons into a button group.
         *
         * @constructor
         */
        function ButtonGroupProxy() {

            var // create a new control group
                group = new ControlGroup();

            // methods --------------------------------------------------------

            /**
             * Adds a new push button or toggle button to this button group.
             *
             * @param {String} key
             *  The unique key of the button.
             *
             * @param {Object} [options]
             *  A map of options to control the properties of the new button.
             *  See method ToolBar.addButton() for details.
             */
            this.addButton = function (key, options) {

                var // create the button
                    button = group.addButton(key, _({ classes: CONTROL_CLASS }).extend(options));

                // add toggle button marker
                if (options && (options.toggle === true)) {
                    button.attr('data-toggle', 'toggle');
                }

                // add update handler (use the generic update handler)
                registerUpdateHandler(key, function (value) { return ButtonGroupProxy.buttonUpdateHandler(button, value); });

                return this;
            };

            /**
             * Returns a reference to the tool bar containing this button
             * group. Useful for method chaining.
             */
            this.end = function () {
                return toolbar;
            };

            // initialization -------------------------------------------------

            // insert the group into the tool bar
            containerNode.append(group.getNode());

            // add an action handler at the group node that handles all button clicks
            registerActionHandler(group.getNode(), 'click', 'button', ButtonGroupProxy.buttonClickHandler);

        } // class ButtonGroupProxy

        /**
         * Returns whether the first button control in the passed jQuery
         * collection is a toggle button.
         *
         * @param {jQuery} button
         *  A jQuery collection containing a button element.
         *
         * @returns {Boolean}
         *  True, if the button is a toggle button.
         */
        ButtonGroupProxy.isToggleButton = function (button) {
            return button.first().attr('data-toggle') === 'toggle';
        };

        /**
         * A generic update handler for push buttons and toggle buttons.
         */
        ButtonGroupProxy.buttonUpdateHandler = function (button, value) {
            if (ButtonGroupProxy.isToggleButton(button)) {
                // Translate undefined (special 'no value' state) or null (special
                // 'ambiguous' state) to false to prevent toggling the button as
                // implemented by the static method toggleButtons().
                // TODO: Support for null (tristate). (?)
                Utils.toggleButtons(button, (_.isUndefined(value) || _.isNull(value)) ? false : value);
            }
        };

        /**
         * A generic action handler for push buttons and toggle buttons.
         */
        ButtonGroupProxy.buttonClickHandler = function (button) {
            if (ButtonGroupProxy.isToggleButton(button)) {
                Utils.toggleButtons(button);
                return Utils.isButtonActive(button);
            } // else: push button, return undefined
        };

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
                type = (options && _.isString(options.type)) ? options.type : 'buttons',

                // create a new group container for the button group
                buttonGroup = new ControlGroup(),

                // drop-down menu area
                menuNode = $('<table>'),

                // create a new group container for the drop-down group
                dropDownGroup = new DropDownGroup(key, _({ classes: CONTROL_CLASS }).extend(options), false, menuNode),

                // prototype for dummy buttons in unused table cells (must contain something to get its correct height)
                buttonPrototype = Utils.createButton(undefined, { label: '\xa0' }),

                // number of rows in the drop-down menu
                rows = 0,

                // number of columns in the drop-down menu
                columns = (options && _.isNumber(options.columns) && (options.columns >= 1)) ? options.columns : 3,

                // number of buttons inserted into the group
                buttonCount = 0;

            // private methods ------------------------------------------------

            /**
             * Activates a button in this radio group.
             *
             * @param {String|Null} [value]
             *  The unique value associated to the button to be activated. If
             *  omitted or set to null, does not activate any button (ambiguous
             *  state).
             */
            function updateHandler(value) {

                var // find all option buttons (in button group and drop-down menu)
                    buttons = buttonGroup.getNode().add(menuNode).find('button'),
                    // ambiguous state indicated by null value
                    inactive = _.isUndefined(value) || _.isNull(value),
                    // find the button to activate
                    button = inactive ? $() : buttons.filter('[data-value="' + value + '"]');

                // remove highlighting from all buttons
                Utils.toggleButtons(buttons, false);

                // update the contents of the drop-down button (use first button in group if no button is active)
                dropDownGroup.replaceButtonContents((button.length ? button : buttons).first().contents().clone());

                // highlight active button
                Utils.toggleButtons(button, true);
            }

            /**
             * Click handler for an option button in this radio group. Will
             * activate the clicked button, and return its value.
             *
             * @param {jQuery} button
             *  The clicked button, as jQuery object.
             *
             * @returns {String}
             *  The button value that has been passed to the addButton()
             *  method.
             */
            function clickHandler(button) {
                var value = button.attr('data-value');
                updateHandler(value);
                return value;
            }

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
                if (enlarge && dropDownGroup.isVisible()) {
                    hideGroup = dropDownGroup;
                    showGroup = buttonGroup;
                } else if (!enlarge && buttonGroup.isVisible()) {
                    hideGroup = buttonGroup;
                    showGroup = dropDownGroup;
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

            /**
             * Handles key events in the open drop-down menu.
             */
            function menuNodeKeyHandler(event) {

                var // distinguish between event types (ignore keypress events)
                    keydown = event.type === 'keydown',
                    // all buttons in the drop-down menu
                    buttons = menuNode.find('button'),
                    // index of the focused button
                    index = buttons.index(event.target),
                    // row index of the focused button
                    row = (index >= 0) ? Math.floor(index / columns) : -1,
                    // column index of the focused button
                    column = (index >= 0) ? (index % columns) : -1;

                function focus(newIndex) {
                    newIndex = Math.min(buttonCount - 1, newIndex);
                    if ((newIndex >= 0) && (newIndex !== index)) {
                        buttons.eq(newIndex).focus();
                    }
                }

                switch (event.keyCode) {
                case KeyCodes.LEFT_ARROW:
                    if (keydown && (column > 0)) { focus(index - 1); }
                    return false;
                case KeyCodes.UP_ARROW:
                    if (keydown) {
                        if (row > 0) { focus(index - columns); } else { dropDownGroup.hideMenu(); }
                    }
                    return false;
                case KeyCodes.RIGHT_ARROW:
                    if (keydown && (column + 1 < columns)) { focus(index + 1); }
                    return false;
                case KeyCodes.DOWN_ARROW:
                    if (keydown && (row + 1 < rows)) { focus(index + columns); }
                    return false;
                case KeyCodes.HOME:
                    if (keydown) { focus(0); }
                    return false;
                case KeyCodes.END:
                    if (keydown) { focus(buttonCount - 1); }
                    return false;
                }
            }

            /**
             * Recalculates the width of the drop-down menu table element. The
             * width of the drop-down menu is restricted to the parent button
             * group element, thus the table shrinks its buttons way too much.
             * The only way (?) to expand the table to the correct width is to
             * set its CSS 'min-width' property to the calculated width of the
             * tbody element. To do this, it is required to expand the
             * 'min-width' of the table to a large value to give the tbody
             * enough space, and then query its calculated width.
             */
            function recalcDropDownMenuWidthHandler() {
                menuNode
                    .css('min-width', '10000px')
                    .css('min-width', menuNode.find('tbody').outerWidth() + 'px');
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
             *  See method ToolBar.addButton() for details.
             */
            this.addButton = function (value, options) {

                var // table row taking the new button
                    tableRow = null,
                    // column index for the new button
                    column = buttonCount % columns;

                // append a new button to the button group
                buttonGroup.getNode().append(
                    Utils.createButton(key, options).addClass(CONTROL_CLASS).attr('data-value', value)
                );

                // get/create table row with empty cell from drop-down menu
                if (column === 0) {
                    // create a new row in the table, and fill it with dummy buttons
                    tableRow = $('<tr>').appendTo(menuNode);
                    _(columns).times(function () {
                        tableRow.append($('<td>').append(buttonPrototype.clone()));
                    });
                    rows += 1;
                } else {
                    // select last table row
                    tableRow = menuNode.find('tr:last-child');
                }

                // select table cell and replace the dummy button with a new real button
                tableRow.children().eq(column).empty().append(
                    Utils.createButton(key, options).attr('data-value', value)
                );

                // copy formatting of first inserted button to drop-down button
                if (buttonCount === 0) {
                    updateHandler();    // pass undefined (do not activate the button)
                }

                // wait for next drop-down click and update drop-down menu width
                dropDownGroup
                    .off('menu:open', recalcDropDownMenuWidthHandler)   // remove pending handler
                    .one('menu:open', recalcDropDownMenuWidthHandler);

                buttonCount += 1;
                return this;
            };

            /**
             * Returns a reference to the tool bar containing this button
             * group. Useful for method chaining.
             */
            this.end = function () { return toolbar; };

            // initialization -------------------------------------------------

            // insert the groups into the tool bar
            containerNode.append(buttonGroup.getNode(), dropDownGroup.getNode());

            // disable the dummy button
            Utils.enableControls(buttonPrototype, false);

            // configure according to group type
            switch (type) {
            case 'buttons':
                dropDownGroup.hide();
                break;

            case 'auto':
                registerResizeHandler(resizeHandler);
                break;

            default: // 'dropdown'
                buttonGroup.hide();
                break;
            }

            // register event handlers
            registerActionHandler(buttonGroup.getNode().add(menuNode), 'click', 'button', clickHandler);
            registerUpdateHandler(key, updateHandler);
            menuNode.on('keydown keypress keyup', menuNodeKeyHandler);

            // listen to 'menu:focus' events, and move focus to first control
            dropDownGroup.on('menu:focus', function () {
                menuNode.find('button').first().focus();
            });

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
            return this.addButtonGroup().addButton(key, options).end();
        };

        /**
         * Creates a new button group, and appends it to this tool bar. Button
         * groups contain several independent buttons (push buttons, and/or
         * toggle buttons).
         *
         * @returns {ButtonGroupProxy}
         *  A proxy object that implements methods to add controls to the
         *  group.
         */
        this.addButtonGroup = function () {
            return new ButtonGroupProxy();
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

        this.addSizeChooser = function (key, options) {

            var // options for the drop-down button
                dropDownButtonOptions = _({ classes: CONTROL_CLASS }).extend(options),
                // drop-down menu area
                menuNode = $('<table>').append($('<tr>').append($('<td>').text('test'))),
                // create a new group container for the drop-down group
                group = new DropDownGroup(key, dropDownButtonOptions, true, menuNode);

            // insert the group into the tool bar
            containerNode.append(group.getNode());

            return this;
        };

        /**
         * Enables or disables the specified control of this tool bar.
         *
         * @param {String} key
         *  The keys of the control to be enabled or disabled.
         *
         * @param {Boolean} [state=true]
         *  If omitted or set to true, all controls will be enabled. Otherwise,
         *  all controls will be disabled.
         *
         * @returns {ToolBar}
         *  A reference to this tool bar.
         */
        this.enable = function (key, state) {
            Utils.enableControls(selectControl(key), state);
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
            if (key in updateHandlers) {
                updateHandlers[key].call(this, value);
            }
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
            toolbar = node = containerNode = updateHandlers = resizeHandlers = null;
        };

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

        // listen to key events
        node.on('keydown keypress keyup', keyHandler);

    } // class ToolBar

    // exports ================================================================

    _.makeExtendable(ToolBar);

    return ToolBar;

});
