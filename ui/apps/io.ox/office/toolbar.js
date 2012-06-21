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

    // generic static helper functions for form controls ======================

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

    // static helper functions for push buttons ===============================

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

        return button;
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

    function ToolBar() {

        var // create the DOM container element
            node = $('<div>').addClass('btn-toolbar io-ox-office-toolbar'),

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
         *  The key of the control.
         *
         * @returns {jQuery}
         *  The controls matching the specified key, as jQuery collection.
         */
        function selectControl(key) {
            return $('[data-key="' + key + '"]', node);
        }

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

        // listen to 'update' events and update the associated control
        this.on('update', _.bind(function (event, key, value) {
            if (key in updateHandlers) {
                updateHandlers[key].call(this, value);
            }
        }, this));

        // class ButtonGroupProxy ---------------------------------------------

        /**
         * Proxy class returned as inserter for buttons into a button group.
         *
         * @param buttonGeneratorFunc {Function}
         *  The generator function that has to return a new button that will
         *  be inserted into this button group. Will be called from the own
         *  addButton() method, and may implement different behavior depending
         *  on the type of this button group. Receives all parameters passed
         *  to the addButton() method.
         *
         * @param buttonClickFunc {Function}
         *  The click handler that will be called if the button is currently
         *  enabled has been clicked in the user interface. Receives the
         *  clicked button as jQuery object. Must return the current value
         *  represented by the button (e.g. state of a toggle
         *  button, or value of a radio group button).
         */
        function ButtonGroupProxy(buttonGeneratorFunc, buttonClickFunc) {

            var // create a new button group container
                buttonGroup = $('<div>').addClass('btn-group').appendTo(node);

            /**
             * Adds a new button to this button group. The parameters expected
             * by this function depend on the type of this button group.
             */
            this.addButton = function () {

                var // create the button
                    button = buttonGeneratorFunc.apply(this, arguments).appendTo(buttonGroup);

                // register click handler (checks disabled state, triggers tool bar event)
                button.click(_.bind(function () {
                    if (Controls.isControlEnabled(button)) {
                        var value = buttonClickFunc.call(this, button);
                        getToolBar().trigger('change', button.attr('data-key'), value);
                    }
                }, this));

                // return reference to this proxy
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
         *  A proxy object that implements the methods addButton() and end().
         *  The addButton() method expects the parameters 'key' containing the
         *  unique key for the button, and an optional 'options' map containing
         *  formatting information for the button.
         */
        this.createButtonGroup = function () {

            // create a proxy and pass a button generator function
            return new ButtonGroupProxy(

                // button generator
                function (key, options) {
                    var button = Buttons.createButton(key, options);
                    // special preparation for toggle buttons
                    if (options && (options.toggle === true)) {
                        button.attr('data-toggle', 'toggle');
                        updateHandlers[key] = function (state) {
                            // translate undefined (no value) to false (prevent toggle)
                            Buttons.toggleButtons(button, _.isUndefined(state) ? false : state);
                        };
                    }
                    return button;
                },

                // click handler
                function (button) {
                    if (button.attr('data-toggle') === 'toggle') {
                        Buttons.toggleButtons(button);
                        return Buttons.isButtonActive(button);
                    }
                    // else: stateless push button, return undefined
                }
            );
        };

        /**
         * Creates a radio button group, and appends it to this tool bar.
         *
         * @param key {String}
         *  The unique key of the group.
         *
         * @returns {ButtonGroupProxy}
         *  A proxy object that implements the methods addButton() and end().
         *  The addButton() method expects the parameters 'value' representing
         *  the string (!) value associated to the button, and an optional
         *  'options' map containing formatting information for the button.
         */
        this.createRadioGroup = function (key) {

            // create a single update handler for the entire radio group
            updateHandlers[key] = function (value) {
                var buttons = selectControl(key);
                Buttons.toggleButtons(buttons, false);
                // ambiguous state indicated by null value
                if (!_.isUndefined(value) && !_.isNull(value)) {
                    Buttons.toggleButtons(buttons.find('[data-value="' + value + '"]'), true);
                }
            };

            // create a proxy and pass a radio button generator function
            return new ButtonGroupProxy(

                // button generator function
                function (value, options) {
                    return Buttons.createButton(key, options).attr('data-value', value);
                },

                // click handler (returns value associated to the radio button)
                function (button) {
                    // deactivate all buttons matching the own key
                    Buttons.toggleButtons(selectControl(key), false);
                    Buttons.toggleButtons(button, true);
                    return button.attr('data-value');
                }
            );
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
         *
         * @returns {ToolBar}
         *  A reference to this tool bar.
         */
        this.createButton = function (key, options) {
            return this.createButtonGroup().addButton(key, options).end();
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
