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

    // static class Controls ==================================================

    /**
     * Generic static helper functions for form controls.
     */
    function Controls() {
        throw new Error('do not instantiate this class');
    }

    /**
     * Returns whether the first form control in the passed jQuery collection
     * is enabled.
     *
     * @param control {jQuery}
     *  A jQuery collection containing a form control supporting the 'disabled'
     *  attribute.
     *
     * @returns {Boolean}
     *  True, if the form control is enabled (its 'disabled' attribute is not
     *  set).
     */
    Controls.isControlEnabled = function (control) {
        return !control.is(':disabled');
    };

    /**
     * Enables or disables all form controls in the passed jQuery collection by
     * changing their 'disabled' attributes.
     *
     * @param controls {jQuery}
     *  A jQuery collection containing one or more form controls supporting the
     *  'disabled' attribute.
     *
     * @param state {Boolean}
     *  (optional) If omitted or set to true, all form controls in the passed
     *  collection will be enabled. Otherwise, all controls will be disabled.
     */
    Controls.enableControls = function (controls, state) {
        var enabled = (state === true) || (state === undefined);
        if (enabled) {
            controls.removeAttr('disabled');
        } else {
            controls.attr('disabled', 'disabled');
        }
    };

    // static class Buttons ===================================================

    /**
     * Static helper functions for any button elements.
     */
    function Buttons() {
        throw new Error('do not instantiate this class');
    }

    /**
     * CSS class for active toggle buttons.
     */
    Buttons.ACTIVE_CLASS = 'btn-primary';

    /**
     * CSS class for toggle buttons in undefined state.
     */
    Buttons.TRISTATE_CLASS = 'btn-info';

    /**
     * Creates and returns a new push button element.
     *
     * @param key {String}
     *  (optional) The key associated to this button element. Will be stored in
     *  the 'data-key' attribute of the button.
     *
     * @param options {Object}
     *  (optional) A map of options to control the properties of the new
     *  button. See method ToolBar.createButton() for details.
     *
     * @returns {jQuery}
     *  A jQuery object containing the new button element.
     */
    Buttons.createButton = function (key, options) {

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
                if (button.has('> i')) {
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
    };

    /**
     * Creates and returns a new drop-down button element.
     *
     * @param key {String}
     *  The key associated to this button element. Will be stored in the
     *  'data-key' attribute of the button.
     *
     * @param options {Object}
     *  (optional) A map of options to control the properties of the new
     *  button. See method ToolBar.createButton() for details.
     *
     * @returns {jQuery}
     *  A jQuery object containing the new button element.
     */
    Buttons.createDropDownButton = function (key, options) {

        var // create a simple button
            button = Buttons.createButton(key, options).addClass('dropdown-toggle').attr('data-toggle', 'dropdown');

        // add a white space separator and the drop-down arrow
        button.append($('<span>').addClass('whitespace'), $('<span>').addClass('caret'));

        return button;
    };

    /**
     * Returns whether the first button control in the passed jQuery collection
     * is a toggle button.
     *
     * @param button {jQuery}
     *  A jQuery collection containing a button element.
     *
     * @returns {Boolean}
     *  True, if the button is a toggle button.
     */
    Buttons.isToggleButton = function (button) {
        return button.first().attr('data-toggle') === 'toggle';
    };

    /**
     * Returns whether the first button control in the passed jQuery collection
     * is active.
     *
     * @param button {jQuery}
     *  A jQuery collection containing a button element.
     *
     * @returns {Boolean}
     *  True, if the button is active.
     */
    Buttons.isButtonActive = function (button) {
        return button.first().hasClass(Buttons.ACTIVE_CLASS);
    };

    /**
     * Activates, deactivates, or toggles the passed button or collection of
     * buttons.
     *
     * @param buttons {jQuery}
     *  A jQuery collection containing one or more button elements.
     *
     * @param state {Boolean}
     *  (optional) If omitted, toggles the state of all buttons. Otherwise,
     *  activates or deactivates all buttons.
     */
    Buttons.toggleButtons = function (buttons, state) {
        buttons.toggleClass(Buttons.ACTIVE_CLASS, state).find('> i').toggleClass('icon-white', state);
    };

    Buttons.activateToggleButton = function (button, value) {
        if (Buttons.isToggleButton(button)) {
            // Translate undefined (special 'no value' state) or null (special
            // 'ambiguous' state) to false to prevent toggling the button as
            // implemented by the method Buttons.toggleButtons().
            // TODO: Support for null (tristate).
            Buttons.toggleButtons(button, (_.isUndefined(value) || _.isNull(value)) ? false : value);
        }
    };

    Buttons.activateRadioButton = function (buttons, value) {
        Buttons.toggleButtons(buttons, false);
        // ambiguous state indicated by null value
        if (!_.isUndefined(value) && !_.isNull(value)) {
            Buttons.toggleButtons(buttons.filter('[data-value="' + value + '"]'), true);
        }
    };

    // public class ToolBar ===================================================

    /**
     * A tool bar is a container of form controls which are organized and
     * displayed as a horizontal bar.
     */
    function ToolBar() {

        var // create the DOM container element
            node = $('<div>').addClass('btn-toolbar io-ox-toolbar'),

            // control update handlers, mapped by key
            updateHandlers = {},

            // function returning a reference to this tool bar
            getToolBar = _.bind(function () { return this; }, this);

        /**
         * Returns the control with the specified key as jQuery collection. The
         * returned object may contain multiple elements, e.g. for radio button
         * groups.
         *
         * @param key {String}
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
         * @param key
         *  The unique key of the control.
         *
         * @param updateHandler
         *  The update handler function. Will be called in the context of this
         *  tool bar. Receives the control associated to the passed key, and
         *  the value passed to the 'update' event.
         */
        function registerUpdateHandler(key, updateHandler) {
            updateHandlers[key] = updateHandler;
        }

        function registerActionHandler(control, action, actionHandler) {
            control.on(action, function () {
                var toolbar, key, value;
                if (Controls.isControlEnabled(control)) {
                    toolbar = getToolBar();
                    key = control.attr('data-key');
                    value = actionHandler.call(toolbar, control);
                    toolbar.trigger('change', key, value);
                }
            });
        }

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

        // class RadioDropDownProxy -------------------------------------------

        /**
         * Proxy class returned as inserter for buttons into a radio drop-down
         * control.
         *
         * @param node {jQuery}
         *  The parent DOM element used to insert the drop-down button and the
         *  table area containing the radio buttons.
         *
         * @param key {String}
         *  The unique key of this drop-down button.
         *
         * @param options {Object}
         *  (optional) A map of options to control the properties of the
         *  drop-down button or the table area. See method
         *  ToolBar.createRadioDropDown() for details.
         */
        function RadioDropDownProxy(node, key, options) {

            var // create the drop-down button
                dropDownButton = Buttons.createDropDownButton(key).appendTo(node),

                // create the table area
                tableNode = $('<table>').addClass('dropdown-menu').appendTo(node),

                // number of columns in the table
                columns = (options && _.isNumber(options.columns) && (options.columns >= 1)) ? options.columns : 3,

                // number of inserted buttons
                buttonCount = 0;

            function updateHandler(buttons, value) {
                var button = buttons.filter('[data-value="' + value + '"]:first');
                if (!button.length) {
                    button = tableNode.find('button:first');
                }
                Buttons.activateRadioButton(buttons, value);
                // update the contents of the drop-down button
                dropDownButton.empty().append(
                    button.contents().clone(),
                    $('<span>').addClass('whitespace'),
                    $('<span>').addClass('caret'));
            }

            function clickHandler(button) {
                var value = button.attr('data-value');
                updateHandler(selectControl(key), value);
                return value;
            }

            // create a single update handler for the entire radio group
            registerUpdateHandler(key, updateHandler);

            /*
             * The width of the table is restricted to the parent button group
             * element, thus the table shrinks its buttons way too much. The
             * only way (?) to expand the table to the correct width is to set
             * its min-width property to the calculated width of the tbody. To
             * do this, it is required to expand the min-width to a large value
             * to give the tbody enough space, and then query its calculated
             * width.
             */
            dropDownButton.on('click.io-ox-click-once', function () {
                // calculate the width only on very first click
                dropDownButton.off('click.io-ox-click-once');
                // wait for the button to really become visible
                window.setTimeout(function timer() {
                    if (tableNode.css('display') !== 'none') {
                        tableNode
                            .css('min-width', '10000px')
                            .css('min-width', tableNode.find('tbody').outerWidth() + 'px');
                    } else {
                        window.setTimeout(timer, 25);
                    }
                });
            });

            /**
             * Adds a new button to this radio group.
             *
             * @param value {String}
             *  The unique value associated to this button.
             *
             * @param options {Object}
             *  (optional) A map of options to control the properties of the
             *  new button. See method ToolBar.createButton() for details.
             */
            this.addButton = function (value, options) {

                var // create the button
                    button = Buttons.createButton(key, options).attr('data-value', value),
                    // table row taking the new button
                    tableRow = null,
                    // column index for the new button
                    column = buttonCount % columns;

                // create a new row in the table, and fill it with dummy buttons
                if (column === 0) {
                    tableRow = $('<tr>').appendTo(tableNode);
                    _(columns).times(function () {
                        // dummy button must contain something to get its correct height
                        var dummy = Buttons.createButton(undefined, { label: ' ' });
                        Controls.enableControls(dummy, false);
                        tableRow.append($('<td>').append(dummy));
                    });
                } else {
                    tableRow = tableNode.find('tr:last-child');
                }

                // select table cell (the :nth-child selector is 1-based), and
                // replace the dummy button with the real button
                tableRow.find('td:nth-child(' + (column + 1) + ')').empty().append(button);

                // add click handler
                registerActionHandler(button, 'click', clickHandler);

                ++buttonCount;
                return this;
            };

            /**
             * Returns a reference to the parent button group containing this
             * drop-down button. Useful for method chaining.
             */
            this.end = function () { return node; };
        }

        // class ButtonGroupProxy ---------------------------------------------

        /**
         * Proxy class returned as inserter for buttons into a button group.
         */
        function ButtonGroupProxy() {

            var // create a new button group container
                groupNode = $('<div>').addClass('btn-group').appendTo(node);

            /**
             * Adds a new push button or toggle button to this button group.
             *
             * @param key {String}
             *  The unique key of the button.
             *
             * @param options {Object}
             *  (optional) A map of options to control the properties of the
             *  new button. See method ToolBar.createButton() for details.
             */
            this.addButton = function (key, options) {

                var // create the button
                    button = Buttons.createButton(key, options).appendTo(groupNode);

                // add handlers
                registerUpdateHandler(key, Buttons.activateToggleButton);
                registerActionHandler(button, 'click', ButtonGroupProxy.clickHandler);

                return this;
            };

            /**
             * Adds a new drop-down button to this button group. When clicked,
             * a table of buttons representing different values/options will be
             * opened. One button is activated at a time (similar to a radio
             * button group, see below).
             *
             * @param key {String}
             *  The unique key of the radio drop-down button. This key is
             *  shared by all buttons embedded in the drop-down table.
             *
             * @param options {Object}
             *  (optional) A map of options to control the properties of the
             *  drop-down group. See method ToolBar.createRadioDropDown() for
             *  details.
             *
             * @returns {RadioDropDownPropxy}
             *  A proxy object that implements the method addButton() to add
             *  option buttons to the radio group.
             */
            this.addRadioDropDown = function (key, options) {
                return new RadioDropDownProxy(groupNode, key, options);
            };

            /**
             * Returns a reference to the tool bar containing this button
             * group. Useful for method chaining.
             */
            this.end = getToolBar;
        }

        ButtonGroupProxy.clickHandler = function (button) {
            if (Buttons.isToggleButton(button)) {
                Buttons.toggleButtons(button);
                return Buttons.isButtonActive(button);
            } // else: push button, return undefined
        };

        // class RadioGroupProxy ----------------------------------------------

        /**
         * Proxy class returned as inserter for buttons into a button radio
         * group.
         */
        function RadioGroupProxy(key) {

            var // create a new button group container
                groupNode = $('<div>').addClass('btn-group').appendTo(node);

            function clickHandler(button) {
                var value = button.attr('data-value');
                Buttons.activateRadioButton(selectControl(key), value);
                return value;
            }

            // create a single update handler for the entire radio group
            registerUpdateHandler(key, Buttons.activateRadioButton);

            /**
             * Adds a new button to this radio group.
             *
             * @param value {String}
             *  The unique value associated to this button.
             *
             * @param options {Object}
             *  (optional) A map of options to control the properties of the
             *  new button. See method ToolBar.createButton() for details.
             */
            this.addButton = function (value, options) {

                var // create the button
                    button = Buttons.createButton(key, options).attr('data-value', value).appendTo(groupNode);

                // add click handler
                registerActionHandler(button, 'click', clickHandler);

                return this;
            };

            /**
             * Returns a reference to the tool bar containing this button
             * group. Useful for method chaining.
             */
            this.end = getToolBar;
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the root DOM element containing this tool bar as jQuery
         * object.
         */
        this.getNode = function () {
            return node;
        };

        /**
         * Creates a new button group, and appends it to this tool bar. Button
         * groups contain several independent buttons.
         *
         * @returns {ButtonGroupProxy}
         *  A proxy object that implements methods to add controls to the
         *  group.
         */
        this.createButtonGroup = function () {
            return new ButtonGroupProxy();
        };

        /**
         * Creates a radio button group, and appends it to this tool bar.
         *
         * @param key {String}
         *  The unique key of the group. This key is shared by all buttons
         *  inserted into this group.
         *
         * @returns {RadioGroupProxy}
         *  A proxy object that implements methods to add option buttons to the
         *  radio group.
         */
        this.createRadioGroup = function (key) {
            return new RadioGroupProxy(key);
        };

        /**
         * Creates a new push button or toggle button in its own button group,
         * and appends it to this tool bar.
         *
         * @param key {String}
         *  The unique key of the button.
         *
         * @param options {Object}
         *  (optional) A map of options to control the properties of the new
         *  button. The following options are supported:
         *  - icon: (optional) The full name of the Bootstrap or OX icon class.
         *  - label: (optional) The text label of the button. Will follow an
         *      icon.
         *  - tooltip: (optional) Tool tip text shown when the mouse hovers the
         *      button.
         *  - toggle: (optional) If set to true, the button toggles its state
         *      and passes a boolean value to change listeners. Otherwise, the
         *      button is a simple push button and passes undefined to its
         *      change listeners.
         *
         * @returns {ToolBar}
         *  A reference to this tool bar.
         */
        this.createButton = function (key, options) {
            return this.createButtonGroup().addButton(key, options).end();
        };

        /**
         * Creates a new drop-down button in its own button group, and appends
         * it to this tool bar. When clicked, a table of buttons representing
         * different values/options will be opened. One button is activated at
         * a time (similar to a radio button group, see above).
         *
         * @param key {String}
         *  The unique key of the radio drop-down button. This key is shared by
         *  all buttons embedded in the drop-down table.
         *
         * @param options {Object}
         *  (optional) A map of options to control the properties of the
         *  drop-down group. Note that there are no options to specify the
         *  contents of the drop-down button itself, because these contents
         *  will be cloned dynamically from the embedded option button that is
         *  currently active. The following options are supported:
         *  - columns: (optional) Number of columns used to build the drop-down
         *      button table. Defaults to the value 3.
         *
         * @returns {RadioDropDownPropxy}
         *  A proxy object that implements the method addButton() to add option
         *  buttons to the radio group.
         */
        this.createRadioDropDown = function (key, options) {
            // create a drop-down proxy whose end() method returns this tool
            // bar instead of the dummy button group holding the drop-down
            var proxy = this.createButtonGroup().addRadioDropDown(key, options);
            proxy.end = getToolBar;
            return proxy;
        };

        /**
         * Enables or disables the specified control of this tool bar.
         *
         * @param key {String}
         *  The keys of the control to be enabled or disabled.
         *
         * @param state {Boolean}
         *  (optional) If omitted or set to true, all controls will be enabled.
         *  Otherwise, all controls will be disabled.
         *
         * @returns {ToolBar}
         *  A reference to this tool bar.
         */
        this.enable = function (key, state) {
            Controls.enableControls(selectControl(key), state);
            return this;
        };

        /**
         * Disables the specified control of this tool bar. Has the same effect
         * as calling ToolBar.enable(key, false).
         *
         * @param key {String}
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
         * @param key {String}
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
                updateHandlers[key].call(this, selectControl(key), value);
            }
            return this;
        };

        /**
         * Destructor. Calls the destructor function of all child objects, and
         * removes this tool bar from the page.
         */
        this.destroy = function () {
            this.events.destroy();
            node.remove();
            node = getToolBar = null;
        };

    }

    // exports ================================================================

    _.makeExtendable(ToolBar);

    return ToolBar;
});
