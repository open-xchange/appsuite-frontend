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

define('io.ox/office/toolbar', ['io.ox/core/event'], function (Events) {

    'use strict';

    // static helper functions ================================================

    function Util() {
        throw new Error('do not instantiate this class');
    }

    /**
     * Returns whether the passed button is active.
     */
    Util.isButtonActive = function (button) {
        return button.hasClass('btn-primary');
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
    Util.toggleButtons = function (buttons, state) {
        buttons.toggleClass('btn-primary', state).find('> i').toggleClass('icon-white', state);
    };

    /**
     * Deactivates all siblings of the passed button, and activates the button.
     */
    Util.activateRadioButton = function (button) {
        Util.toggleButtons(button.siblings(), false);
        Util.toggleButtons(button, true);
    };

    Util.isButtonEnabled = function (button) {
        return !button.hasClass('disabled');
    };

    Util.enableButtons = function (buttons, state) {
        var enabled =  (state === true) || (state === undefined);
        buttons.toggleClass('disabled', !enabled);
    };

    // class ToolBarButtonGroup ===============================================

    /**
     * Represents a group of buttons. A button group will be drawn by Bootstrap
     * as a composite component (no spacing between the buttons).
     *
     * @param toolbar
     *  The parent tool bar that will contain this button group.
     *
     * @param groupId
     *  The identifier of this button group.
     *
     * @param buttonOptions
     *  (optional) Default options for all buttons that will be added to this
     *  button group. See method ToolBar.createButton() for details.
     */
    function ToolBarButtonGroup(toolbar, type, groupId, buttonOptions) {

        var // create the DOM container element
            node = $('<div>').addClass('btn-group').appendTo(toolbar.getNode()),

            // buttons mapped by identifier
            buttons = {},

            // event handler container
            events = new Events();

        // the default options for new buttons
        buttonOptions = buttonOptions || {};

        /**
         * Creates a new button and appends it to this button group.
         *
         * @param id
         *  The identifier of this button. Must be unique inside the button
         *  group.
         *
         * @param options
         *  (optional) A map of options to control the properties of the new
         *  button. These options extend the default options passed to the
         *  constructor of this button group. See method ToolBar.createButton()
         *  for details.
         *
         * @returns {ToolBarButtonGroup}
         *  A reference back to this button group.
         */
        this.addButton = function (id, options) {

            var // create the button element
                button = buttons[id] = $('<div>').addClass('btn').appendTo(node),

                // update handler, updates toggle/radio buttons after a click
                updater = $.noop;

            // button formatting
            options = _.extend(buttonOptions, options);
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

            // prepare update handler
            if (type === 'radio') {
                // radio handler: activate clicked button, then trigger
                updater = function () { Util.activateRadioButton(button); };
            } else if (options.toggle === true) {
                // toggle handler: first change the button state, then trigger
                updater = function () { Util.toggleButtons(button); };
            }

            // add handling for disabled state to the button click handler
            button.click(function () {
                if (Util.isButtonEnabled(button)) {
                    updater();
                    events.trigger('click', id, Util.isButtonActive(button));
                }
            });

            return this;
        };

        /**
         * Adds a click handler to this button group.
         *
         * @param handler
         *  The handler function that will be called when a button in this
         *  group has been clicked. The handler receives the button identifier
         *  and the current state of the button (useful for toggle buttons).
         *
         * @returns {ToolBarButtonGroup}
         *  A reference back to this button group.
         */
        this.click = function (handler) {
            // attach a custom function that filters the jQuery event object
            events.on('click', function (event, id, state) {
                handler(id, state);
            });
            return this;
        };

        this.pollState = function (handler, millis) {
            window.setTimeout(function timer() {
                if (type === 'radio') {
                    // in radio groups, poll state for entire group, handler
                    // must return button identifier
                    var id = handler(groupId);
                    if (id in buttons) {
                        Util.activateRadioButton(buttons[id]);
                    }
                } else {
                    // in button groups, poll state for each button, handler
                    // must return button state
                    _(buttons).each(function (button, id) {
                        var state = handler(id);
                        Util.toggleButtons(button, state);
                    });
                }
                // restart timer
                window.setTimeout(timer, millis);
            }, millis);
            return this;
        };

        /**
         * Enables or disables all buttons contained in this button group.
         *
         * @param state
         *  (optional) If omitted or set to true, all buttons will be
         *  enabled. Otherwise, all buttons will be disabled.
         */
        this.enable = function (state) {
            _(buttons).each(function (button) {
                Util.enableButtons(button, state);
            });
            return this;
        };

        /**
         * Disables all buttons contained in this button group. Has same effect
         * as calling ToolBarButtonGroup.enable(false).
         */
        this.disable = function () {
            return this.enable(false);
        };

        /**
         * Returns the parent tool bar. Can be used for method chaining.
         */
        this.end = function () {
            return toolbar;
        };

    }

    // class ToolBarButton ====================================================

    /**
     * Represents a single button in a tool bar. Behaves like an instance of
     * class ToolBarButtonGroup with a single child button, and inherits its
     * functionality from that class (except the method addButton()).
     *
     * @param toolbar
     *  The parent tool bar that will contain this button.
     *
     * @param id
     *  The identifier of this button.
     *
     * @param options
     *  (optional) A map of options to control the properties of the new
     *  button. See method ToolBar.createButton() for details.
     */
    function ToolBarButton(toolbar, id, options) {

        var // a dummy button group that will host the new button
            buttonGroup = new ToolBarButtonGroup(toolbar, 'button', id).addButton(id, options);

        // implement all chainable methods by delegating them to the button group,
        // but return a reference to this ToolBarButton instance
        _(['click', 'pollState', 'enable', 'disable']).each(function (method) {
            this[method] = function () {
                buttonGroup[method].apply(buttonGroup, arguments);
                return this;
            };
        }, this);

        // implement other methods that return a result by delegating them to the button group
        _(['end']).each(function (method) {
            this[method] = buttonGroup[method];
        }, this);

    }

    // public class ToolBar ===================================================

    function ToolBar() {

        var // create the DOM container element
            node = $('<div>').addClass('btn-toolbar io-ox-office-toolbar'),

            // child objects mapped by identifier
            objects = {};

        /**
         * Returns the root DOM element containing this tool bar.
         */
        this.getNode = function () {
            return node;
        };

        /**
         * Creates a new button and appends it to this tool bar.
         *
         * @param id
         *  The identifier of this button. Must be unique inside the tool bar.
         *
         * @param options
         *  (optional) A map of options to control the properties of the new
         *  button.
         *  - icon: The name of the Bootstrap icon class, without the 'icon-'
         *      prefix.
         *  - label: The text label of the button. Will follow an icon.
         *  - class: Additional CSS classes to be set at the button (string).
         *  - css: Additional CSS formatting (key/value map).
         *  - toggle: If set to true, the button works as toggle button
         *      (similar to a check box), i.e. it maintains its state
         *      internally.
         *
         * @returns {ToolBarButton}
         *  The new button instance.
         */
        this.createButton = function (id, options) {
            return objects[id] = new ToolBarButton(this, id, options);
        };

        /**
         * Creates a new button group, and appends it to this tool bar.
         *
         * @param id
         *  The identifier of the button group. Must be unique inside the tool
         *  bar.
         *
         * @param options
         *  (optional) Default options for all buttons that will be added to
         *  this button group. See ToolBarButtonGroup.addButton() for details.
         *
         * @returns {ToolBarButtonGroup}
         *  The new button group instance.
         */
        this.createButtonGroup = function (id, options) {
            return objects[id] = new ToolBarButtonGroup(this, 'button', id, options);
        };

        /**
         * Creates a new button group, and appends it to this tool bar. The
         * button group behaves like a group of radio buttons, i. e. one of the
         * buttons is in 'active' state at any time. If another button is
         * clicked, the active button will be deactivated, and the clicked
         * button becomes the active button and triggers its associated action.
         *
         * @param id
         *  The identifier of the button group. Must be unique inside the tool
         *  bar.
         *
         * @param options
         *  (optional) Default options for all buttons that will be added to
         *  this button group. See ToolBarButtonGroup.addButton() for details.
         *
         * @returns {ToolBarButtonGroup}
         *  The new button group instance.
         */
        this.createRadioGroup = function (id, options) {
            return objects[id] = new ToolBarButtonGroup(this, 'radio', id, options);
        };

        /**
         * Enables or disables the specified children of this tool bar.
         *
         * @param ids
         *  The identifiers of the child objects to enable or disable, as
         *  space-separated string.
         *
         * @param state
         *  (optional) If omitted or set to true, all child objects will be
         *  enabled. Otherwise, all objects will be disabled.
         */
        this.enable = function (ids, state) {
            _(ids.split(/\s+/)).each(function (id) {
                if (id in objects) {
                    objects[id].enable(state);
                }
            });
            return this;
        };

        /**
         * Disables the specified children of this tool bar. Has same effect
         * as calling ToolBar.enable(ids, false).
         *
         * @param ids
         *  The identifiers of the child objects to enable or disable, as
         *  space-separated string.
         */
        this.disable = function (ids) {
            return this.enable(ids, false);
        };

    }

    // exports ================================================================

    return ToolBar;
});
