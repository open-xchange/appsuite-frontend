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

define('io.ox/office/toolbar', function () {

    'use strict';

    // static helper functions ================================================

    function Util() {
        throw new Error('do not instantiate this class');
    }

    /**
     * CSS class for active toggle buttons.
     */
    Util.ACTIVE_CLASS = 'btn-primary';

    /**
     * CSS class for toggle buttons in undefined state.
     */
    Util.TRISTATE_CLASS = 'btn-info';

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
        buttons.toggleClass(Util.ACTIVE_CLASS, state).find('> i').toggleClass('icon-white', state);
    };

    /**
     * Deactivates all siblings of the passed button, and activates the button.
     */
    Util.activateRadioButton = function (button) {
        Util.toggleButtons(button.siblings(), false);
        Util.toggleButtons(button, true);
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
     */
    function ToolBarButtonGroup(toolbar, type, groupId) {

        var // create the DOM container element
            node = $('<div>').addClass('btn-group').appendTo(toolbar.getNode()),

            // buttons mapped by identifier
            buttons = {};

        // listen to controller updates for radio groups
        if (type === 'radio') {
            toolbar.getController().on('update:' + groupId, function (event, id) {
                if (id in buttons) {
                    Util.activateRadioButton(buttons[id]);
                }
            });
        }

        /**
         * Creates a new button and appends it to this button group.
         *
         * @param id
         *  The identifier of this button. Must be unique inside the button
         *  group.
         *
         * @param options
         *  (optional) A map of options to control the properties of the new
         *  button. See method ToolBar.createButton() for details.
         *
         * @returns {ToolBarButtonGroup}
         *  A reference back to this button group.
         */
        this.addButton = function (id, options) {

            var // create the button element
                button = buttons[id] = $('<button>').addClass('btn').attr('data-id', id).appendTo(node),

                // updates toggle/radio buttons after a click, returns new state
                clickUpdater = $.noop,

                // controller item key
                key = ((type === 'single') || (type === 'radio')) ? groupId : (groupId + '.' + id);

            // validate button options
            options = options || {};
            options.toggle = options.toggle && (type !== 'radio');

            // button formatting
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

            // prepare update handler
            if (type === 'radio') {
                // radio handler: activate clicked button, then trigger
                clickUpdater = function () {
                    Util.activateRadioButton(button);
                    // button identifier is the state of the radio group
                    return id;
                };
            } else if (options.toggle === true) {
                // toggle handler: first change the button state, then trigger
                clickUpdater = function () {
                    var state = !button.hasClass(Util.ACTIVE_CLASS);
                    Util.toggleButtons(button, state);
                    // button state is the state of the toggle button
                    return state;
                };
            }
            // else: stateless push button

            // add handling for disabled state to the button click handler
            button.click(function () {
                if (!button.is(':disabled')) {
                    var state = clickUpdater();
                    toolbar.getController().set(key, state);
                }
            });

            // listen to controller updates for toggle buttons
            if (options.toggle === true) {
                toolbar.getController().on('update:' + key, function (event, state) {
                    Util.toggleButtons(button, state);
                });
            }

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
            var enabled = (state === true) || (state === undefined);
            _(buttons).each(function (button) {
                if (enabled) {
                    button.removeAttr('disabled');
                } else {
                    button.attr('disabled', 'disabled');
                }
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

        /**
         * Destructor. Detaches all event listeners, and removes this button
         * group with all its buttons from the tool bar.
         */
        this.destroy = function () {
            node.remove();
            node = buttons = null;
        };

    }

    // public class ToolBar ===================================================

    function ToolBar(controller) {

        var // create the DOM container element
            node = $('<div>').addClass('btn-toolbar io-ox-office-toolbar'),

            // child objects mapped by identifier
            objects = {};

        /**
         * Returns the controller this tool bar is connected to.
         */
        this.getController = function () {
            return controller;
        };

        /**
         * Returns the root DOM element containing this tool bar as jQuery
         * object.
         */
        this.getNode = function () {
            return node;
        };

        /**
         * Creates a new single push button and appends it to this tool bar.
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
         *  - tooltip: Textual tool tip.
         *  - toggle: If set to true, the button works as toggle button
         *      (similar to a check box), i.e. it maintains its state
         *      internally.
         *
         * @returns {ToolBar}
         *  A reference to this tool bar.
         */
        this.createButton = function (id, options) {
            // create a dummy button group that will host the new button
            objects[id] = new ToolBarButtonGroup(this, 'single', id).addButton(id, options);
            return this;
        };

        /**
         * Creates a new button group, and appends it to this tool bar.
         *
         * @param id
         *  The identifier of the button group. Must be unique inside the tool
         *  bar.
         *
         * @returns {ToolBarButtonGroup}
         *  The new button group instance.
         */
        this.createButtonGroup = function (id) {
            return objects[id] = new ToolBarButtonGroup(this, 'button', id);
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
         * @returns {ToolBarButtonGroup}
         *  The new button group instance.
         */
        this.createRadioGroup = function (id) {
            return objects[id] = new ToolBarButtonGroup(this, 'radio', id);
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
         *
         * @returns {ToolBar}
         *  A reference to this tool bar.
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
         *
         * @returns {ToolBar}
         *  A reference to this tool bar.
         */
        this.disable = function (ids) {
            return this.enable(ids, false);
        };

        /**
         * Destructor. Calls the destructor function of all child objects, and
         * removes this tool bar from the page.
         */
        this.destroy = function () {
            _(objects).invoke('destroy');
            node.remove();
            node = objects = null;
        };

    }

    // exports ================================================================

    return ToolBar;
});
