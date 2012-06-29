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

define('io.ox/office/toolbar', ['io.ox/core/event', 'less!io.ox/office/toolbar.css'], function (Events) {

    'use strict';

    /**
     * CSS class for active toggle buttons.
     *
     * @constant
     */
    var ACTIVE_CLASS = 'btn-primary';

    // static functions =======================================================

    /**
     * Returns whether the first form control in the passed jQuery collection
     * is enabled.
     *
     * @param {jQuery} control
     *  A jQuery collection containing a form control supporting the 'disabled'
     *  attribute.
     *
     * @returns {Boolean}
     *  True, if the form control is enabled (its 'disabled' attribute is not
     *  set).
     */
    function isControlEnabled(control) {
        return !control.is(':disabled');
    }

    /**
     * Enables or disables all form controls in the passed jQuery collection by
     * changing their 'disabled' attributes.
     *
     * @param {jQuery} controls
     *  A jQuery collection containing one or more form controls supporting the
     *  'disabled' attribute.
     *
     * @param {Boolean} [state]
     *  If omitted or set to true, all form controls in the passed collection
     *  will be enabled. Otherwise, all controls will be disabled.
     */
    function enableControls(controls, state) {
        var enabled = (state === true) || (state === undefined);
        if (enabled) {
            controls.removeAttr('disabled');
        } else {
            controls.attr('disabled', 'disabled');
        }
    }

    /**
     * Creates and returns a new push button element.
     *
     * @param {String} key
     *  The key associated to this button element. Will be stored in the
     *  'data-key' attribute of the button.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new button. See
     *  method ToolBar.addButton() for details.
     *
     * @returns {jQuery}
     *  A jQuery object containing the new button element.
     */
    function createButton(key, options) {

        var // create the DOM button element
            button = $('<button>').addClass('btn');

        // add the key as data attribute
        if (_.isString(key)) {
            button.attr('data-key', key);
        }

        // button attributes
        if (_.isObject(options)) {
            // add icon in an i element
            if (_.isString(options.icon)) {
                button.append($('<i>').addClass(options.icon));
            }
            // add text label, separate it from the icon
            if (_.isString(options.label)) {
                if (button.find('> i').length) {
                    button.append($('<span>').addClass('whitespace'));
                }
                button.append($('<span>').text(options.label));
            }
            // add tool tip text
            if (_.isString(options.tooltip)) {
                button.attr('title', options.tooltip);
            }
            // add toggle button marker
            if (options.toggle === true) {
                button.attr('data-toggle', 'toggle');
            }
        }

        return button;
    }

    /**
     * Returns whether the first button control in the passed jQuery collection
     * is a toggle button.
     *
     * @param {jQuery} button
     *  A jQuery collection containing a button element.
     *
     * @returns {Boolean}
     *  True, if the button is a toggle button.
     */
    function isToggleButton(button) {
        return button.first().attr('data-toggle') === 'toggle';
    }

    /**
     * Returns whether the first button control in the passed jQuery collection
     * is active.
     *
     * @param {jQuery} button
     *  A jQuery collection containing a button element.
     *
     * @returns {Boolean}
     *  True, if the button is active.
     */
    function isButtonActive(button) {
        return button.first().hasClass(ACTIVE_CLASS);
    }

    /**
     * Activates, deactivates, or toggles the passed button or collection of
     * buttons.
     *
     * @param {jQuery} buttons
     *  A jQuery collection containing one or more button elements.
     *
     * @param {Boolean} [state]
     *  If omitted, toggles the state of all buttons. Otherwise, activates or
     *  deactivates all buttons.
     */
    function toggleButtons(buttons, state) {
        buttons.toggleClass(ACTIVE_CLASS, state).find('> i').toggleClass('icon-white', state);
    }

    // public class ToolBar ===================================================

    /**
     * A tool bar is a container of form controls which are organized and
     * displayed as a horizontal bar.
     *
     * @constructor
     */
    function ToolBar() {

        var // create the DOM container element
            node = $('<div>').addClass('btn-toolbar io-ox-toolbar'),

            // DOM child element measuring the total width of the controls
            sizeSpan = $('<span>').appendTo(node),

            // control update handlers, mapped by key
            updateHandlers = {},

            // objects supporting flexible sizing
            resizeables = [],

            // helper function returning a reference to this tool bar
            getToolBar = _.bind(function () { return this; }, this);

        // private methods ----------------------------------------------------

        /**
         * Creates and returns a container element used to hold single
         * controls. All controls must be inserted into group containers. The
         * returned object contains show() and hide() methods that replace the
         * original version of the jQuery object, and control a special CSS
         * class instead of modifying the CSS 'display' attribute.
         * Additionally, the object contains a isVisible() method returning a
         * boolean value.
         *
         * @returns {jQuery}
         *  A new control container, already inserted into this tool bar.
         */
        function createGroupNode() {
            var groupNode = $('<div>').addClass('btn-group').appendTo(sizeSpan);
            // overwrite the show() and hide() methods
            groupNode.show = function () { return this.removeClass('hidden'); };
            groupNode.hide = function () { return this.addClass('hidden'); };
            groupNode.isVisible = function () { return !this.hasClass('hidden'); };
            return groupNode;
        }

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
         * @param {jQuery} control
         *  The control which triggers an action event.
         *
         * @param {String} action
         *  The name of the action event, e.g. 'click' or 'change'.
         *
         * @param {Function} actionHandler
         *  The action handler function. Will be called in the context of this
         *  tool bar. Receives the control passed to this function. Must return
         *  the current value of the control (e.g. the boolean state of a
         *  toggle button, or the text of a text field).
         */
        function registerActionHandler(control, action, actionHandler) {
            control.on(action, function () {
                var toolbar, key, value;
                if (isControlEnabled(control)) {
                    toolbar = getToolBar();
                    key = control.attr('data-key');
                    value = actionHandler.call(toolbar, control);
                    toolbar.trigger('change', key, value);
                }
            });
        }

        /**
         * Listens to size events of the browser window, and tries to expand or
         * shrink resizeable controls according to the available space in the
         * tool bar.
         */
        function resizeHandler() {

            var // available space (width() returns content width without padding)
                width = node.width();

            // try to enlarge one or more controls, until tool bar overflows
            _(resizeables).each(function (resizeable) {
                if (sizeSpan.width() < width) { resizeable.enlarge(); }
            });

            // try to shrink one or more controls, until tool bar does not overflow
            _(resizeables).each(function (resizeable) {
                if (sizeSpan.width() > width) { resizeable.shrink(); }
            });
        }

        /**
         * Registers a resizeable button group object.
         *
         * @param {Object} resizeable
         *  The resizeable button group object. Must implement the following
         *  methods:
         *  @param {Function} resizeable.shrink
         *      Decrease the width of the group, if possible.
         *  @param {Function} resizeable.enlarge
         *      Increase the width of the group, if possible.
         */
        function registerResizeable(resizeable) {
            // add window resize listener on first call
            if (!resizeables.length) {
                $(window).on('resize', resizeHandler);
            }
            // store the resizeable object
            resizeables.push(resizeable);
        }

        // class ButtonGroupProxy ---------------------------------------------

        /**
         * Proxy class returned as inserter for buttons into a button group.
         *
         * @constructor
         */
        function ButtonGroupProxy() {

            var // create a new button group container
                groupNode = createGroupNode();

            // private methods ------------------------------------------------

            function clickHandler(button) {
                if (isToggleButton(button)) {
                    toggleButtons(button);
                    return isButtonActive(button);
                } // else: push button, return undefined
            }

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
                    button = createButton(key, options).appendTo(groupNode);

                // add handlers
                registerUpdateHandler(key, function (value) {
                    if (isToggleButton(button)) {
                        // Translate undefined (special 'no value' state) or null (special
                        // 'ambiguous' state) to false to prevent toggling the button as
                        // implemented by the static method toggleButtons().
                        // TODO: Support for null (tristate).
                        toggleButtons(button, (_.isUndefined(value) || _.isNull(value)) ? false : value);
                    }
                });
                registerActionHandler(button, 'click', clickHandler);

                return this;
            };

            /**
             * Returns a reference to the tool bar containing this button
             * group. Useful for method chaining.
             */
            this.end = getToolBar;

        } // class ButtonGroupProxy

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
                buttonGroupNode = createGroupNode(),

                // create a new group container for the drop-down group
                dropDownGroupNode = createGroupNode(),

                // number of columns in the drop-down menu
                columns = (options && _.isNumber(options.columns) && (options.columns >= 1)) ? options.columns : 3,

                // options for the drop-down button
                dropDownOptions = (options && _.isString(options.tooltip)) ? { tooltip: options.tooltip } : undefined,

                // drop-down button
                dropDownButton = createButton(key, dropDownOptions).addClass('dropdown-toggle').attr('data-toggle', 'dropdown').appendTo(dropDownGroupNode),

                // drop-down menu area
                dropDownMenu = $('<table>').addClass('dropdown-menu').appendTo(dropDownGroupNode),

                // prototype for dummy buttons in unused table cells (must contain something to get its correct height)
                dummyButton = createButton(undefined, { label: '\xa0' }),

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
                    buttons = buttonGroupNode.add(dropDownMenu).find('button'),
                    // ambiguous state indicated by null value
                    inactive = _.isUndefined(value) || _.isNull(value),
                    // find the button to activate
                    button = inactive ? $() : buttons.filter('[data-value="' + value + '"]');

                // remove highlighting from all buttons
                toggleButtons(buttons, false);

                // update the contents of the drop-down button (use first button in group if no button is active)
                dropDownButton.empty().append(
                    (button.length ? button : buttons).first().contents().clone(),
                    $('<span>').addClass('whitespace'),
                    $('<span>').addClass('caret')
                );

                // highlight active button
                toggleButtons(button, true);
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
             * Inserts a new option button into the passed container element,
             * and registers the click handler function for the new button.
             *
             * @param {jQuery} node
             *  The parent container element for the new button.
             *
             * @param {String} value
             *  The unique value for the option button.
             *
             * @param {Object} [options]
             *  A map of options to control the properties of the new button.
             */
            function insertButton(node, value, options) {
                var // create the new button element
                    button = createButton(key, options).attr('data-value', value).appendTo(node);
                // add click handler
                registerActionHandler(button, 'click', clickHandler);
            }

            /**
             * Recalculates the width of the drop-down menu table element. The
             * width of the drop-down menu is restricted to the parent button
             * group element, thus the table shrinks its buttons way too much.
             * The only way (?) to expand the table to the correct width is to
             * set its CSS 'min-width' property to the calculated width of the
             * tbody element. To do this, it is required to expand the
             * 'min-width' to a large value to give the tbody enough space, and
             * then query its calculated width.
             */
            function recalcDropDownMenuWidthHandler() {
                // wait for the button to really become visible (done by Bootstrap)
                window.setTimeout(function timer() {
                    if (dropDownMenu.css('display') !== 'none') {
                        dropDownMenu
                            .css('min-width', '10000px')
                            .css('min-width', dropDownMenu.find('tbody').outerWidth() + 'px');
                    } else {
                        window.setTimeout(timer, 25);
                    }
                });
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
                    // table cell taking the new button
                    tableCell = null,
                    // column index for the new button
                    column = buttonCount % columns;

                // append a button to the button group
                insertButton(buttonGroupNode, value, options);

                // get/create table row with empty cell from drop-down menu
                if (column === 0) {
                    // create a new row in the table, and fill it with dummy buttons
                    tableRow = $('<tr>').appendTo(dropDownMenu);
                    _(columns).times(function () {
                        tableRow.append($('<td>').append(dummyButton.clone()));
                    });
                } else {
                    // select last table row
                    tableRow = dropDownMenu.find('tr:last-child');
                }

                // select table cell (the :nth-child selector is 1-based), and
                // replace the dummy button with a new real button
                tableCell = tableRow.find('td:nth-child(' + (column + 1) + ')').empty();
                insertButton(tableCell, value, options);

                // copy formatting of first inserted button to drop-down button
                if (buttonCount === 0) {
                    updateHandler();    // pass undefined (do not activate the button)
                }

                // wait for next drop-down click and update drop-down menu width
                dropDownButton
                    .off('click', recalcDropDownMenuWidthHandler)   // remove pending handler
                    .one('click', recalcDropDownMenuWidthHandler);

                buttonCount += 1;
                return this;
            };

            /**
             * Returns a reference to the tool bar containing this button
             * group. Useful for method chaining.
             */
            this.end = getToolBar;

            // initialization -------------------------------------------------

            enableControls(dummyButton, false);

            // configure according to group type
            switch (type) {
            case 'buttons':
                dropDownGroupNode.hide();
                break;

            case 'auto':
                registerResizeable({
                    enlarge: function () {
                        dropDownGroupNode.hide();
                        buttonGroupNode.show();
                    },
                    shrink: function () {
                        buttonGroupNode.hide();
                        dropDownGroupNode.show();
                    }
                });
                break;

            default: // 'dropdown'
                buttonGroupNode.hide();
                break;
            }

            // single update handler for the entire radio group
            registerUpdateHandler(key, updateHandler);

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
         *  A map of options to control the properties of the new button. The
         *  following options are supported:
         *  @param {String} [options.icon]
         *      The full name of the Bootstrap or OX icon class. If omitted, no
         *      icon will be shown.
         *  @param {String} [options.label]
         *      The text label of the button. Will follow an icon. If omitted,
         *      no label will be shown.
         *  @param {String} [options.tooltip]
         *      Tool tip text shown when the mouse hovers the button. If
         *      omitted, the button will not show a tool tip.
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
         *  Note that there are no options to specify the contents of the
         *  drop-down button itself, because these contents will be cloned
         *  dynamically from the embedded option button that is currently
         *  active. The following options are supported:
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
         *  @param {String} [options.tooltip]
         *      Tool tip text shown when the mouse hovers the drop-down button.
         *      If omitted, the button will not show a tool tip. Not used if
         *      the button group is shown instead of a drop-down button.
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
         *  If omitted or set to true, all controls will be enabled. Otherwise,
         *  all controls will be disabled.
         *
         * @returns {ToolBar}
         *  A reference to this tool bar.
         */
        this.enable = function (key, state) {
            enableControls(selectControl(key), state);
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
            $(window).off('resize', resizeHandler);
            node.remove();
            node = getToolBar = null;
        };

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

    } // class ToolBar

    // exports ================================================================

    _.makeExtendable(ToolBar);

    return ToolBar;
});
