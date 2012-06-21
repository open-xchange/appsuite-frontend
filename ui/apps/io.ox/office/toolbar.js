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
     * Static helper functions for push buttons.
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
    Buttons.createButton = function (key, options) {

        var // create the DOM button element
            button = $('<button>').addClass('btn').attr('data-key', key);

        // button formatting
        options = options || {};
        if (typeof options.icon === 'string') {
            button.append($('<i>').addClass('icon-' + options.icon));
        }
        if (typeof options.label === 'string') {
            var prefix = button.has('> i') ? ' ' : '';
            button.append($('<span>').text(prefix + options.label));
        }
        if (typeof options['class'] === 'string') {
            button.addClass(options['class']);
        }
        if (typeof options.css === 'object') {
            button.css(options.css);
        }
        if (typeof options.tooltip === 'string') {
            button.attr('title', options.tooltip);
        }
        if (options.toggle === true) {
            button.attr('data-toggle', 'toggle');
        }
        if ('disableOn' in options) {
            button.attr('data-disable-on', JSON.stringify(options.disableOn));
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

        // add a white space separator before the drop-down arrow
        if (button.text().length) {
            button.text(button.text() + ' ');
        } else if (button.has('> i')) {
            button.append($('<span>').text(' '));
        }

        // add the drop-down arrow
        button.append($('<span>').addClass('caret'));

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

        // listen to 'update' events and update the associated control(s)
        this.on('update', _.bind(function (event, key, value) {
            if (key in updateHandlers) {
                updateHandlers[key].call(this, selectControl(key), value);
            }
        }, this));

        // class RadioDropDownProxy -------------------------------------------

        /**
         * Proxy class returned as inserter for buttons into a button radio
         * drop-down control.
         */
        function RadioDropDownProxy(node, key, options) {

            var // the drop-down button
                dropDownButton,
                // the button container
                groupNode;

            // create a single update handler for the entire radio group
            registerUpdateHandler(key, RadioGroupProxy.updateHandler);

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
                    button = Buttons.createButton(key, options).attr('data-value', value);

                // create drop-down button and button container on first call
                if (!dropDownButton) {
                    dropDownButton = Buttons.createDropDownButton(key, options).appendTo(node);
                    groupNode = $('<table>').addClass('dropdown-menu').appendTo(node);
                }

                return this;
            };

            /**
             * Returns a reference to the parent button group containing this
             * drop-down button. Useful for method chaining.
             */
            this.end = function () { return node; };
        }

        RadioDropDownProxy.updateHandler = function (buttons, value) {
        };

        RadioDropDownProxy.clickHandler = function (button) {
        };

        // class ButtonGroupProxy ---------------------------------------------

        /**
         * Proxy class returned as inserter for buttons into a button group.
         */
        function ButtonGroupProxy() {

            var // create a new button group container
                groupNode = $('<div>').addClass('btn-group').appendTo(node);

            /**
             * Adds a new button to this button group.
             *
             * @param key {String}
             *  The unique key of this button.
             *
             * @param options {Object}
             *  (optional) A map of options to control the properties of the
             *  new button. See method ToolBar.createButton() for details.
             */
            this.addButton = function (key, options) {

                var // create the button
                    button = Buttons.createButton(key, options).appendTo(groupNode);

                // add handlers
                registerUpdateHandler(key, ButtonGroupProxy.updateHandler);
                registerActionHandler(button, 'click', ButtonGroupProxy.clickHandler);

                return this;
            };

            this.addRadioDropDown = function (key, options) {
                return new RadioDropDownProxy(groupNode, key, options);
            };

            /**
             * Returns a reference to the tool bar containing this button
             * group. Useful for method chaining.
             */
            this.end = getToolBar;
        }

        ButtonGroupProxy.updateHandler = function (button, state) {
            // check if the button disables itself on a specific value
            var disableOn = button.attr('data-disable-on'),
                enabled = !disableOn || (JSON.parse(disableOn) !== state);
            Controls.enableControls(button, enabled);
            if (enabled && Buttons.isToggleButton(button)) {
                // translate undefined (no value) to false (prevent toggle)
                Buttons.toggleButtons(button, _.isUndefined(state) ? false : state);
            }
        };

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

            // create a single update handler for the entire radio group
            registerUpdateHandler(key, RadioGroupProxy.updateHandler);

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
                registerActionHandler(button, 'click', RadioGroupProxy.clickHandler);

                return this;
            };

            /**
             * Returns a reference to the tool bar containing this button
             * group. Useful for method chaining.
             */
            this.end = getToolBar;
        }

        RadioGroupProxy.updateHandler = function (buttons, value) {
            Buttons.toggleButtons(buttons, false);
            // ambiguous state indicated by null value
            if (!_.isUndefined(value) && !_.isNull(value)) {
                Buttons.toggleButtons(buttons.find('[data-value="' + value + '"]'), true);
            }
        };

        RadioGroupProxy.clickHandler = function (button) {
            var key = button.attr('data-key');
            // deactivate all buttons matching the own key
            Buttons.toggleButtons(selectControl(key), false);
            Buttons.toggleButtons(button, true);
            return button.attr('data-value');
        };

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
         *  The unique key of the group.
         *
         * @returns {RadioGroupProxy}
         *  A proxy object that implements methods to add controls to the
         *  group.
         */
        this.createRadioGroup = function (key) {
            return new RadioGroupProxy(key);
        };

        /**
         * Creates a new push button in its own button group, and appends it to
         * this tool bar.
         *
         * @param key {String}
         *  The unique key of this button.
         *
         * @param options {Object}
         *  (optional) A map of options to control the properties of the new
         *  button.
         *  - icon: (optional) The name of the Bootstrap icon class, without
         *      the 'icon-' prefix.
         *  - label: (optional) The text label of the button. Will follow an
         *      icon.
         *  - tooltip: (optional) Tool tip text.
         *  - class: (optional) Additional CSS classes to be set at the button
         *      (space-separated string).
         *  - css: (optional) Additional CSS formatting (key/value map).
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

        this.createRadioDropDown = function (key, options) {
            // create a drop-down proxy whose end() method returns this tool bar
            // instead of the dummy button group
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
            this.trigger('update', key, value);
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
