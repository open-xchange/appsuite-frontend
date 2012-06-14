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

    /**
     * Returns whether the passed button is active.
     */
    function getButtonState(button) {
        return button.hasClass('btn-primary');
    }

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
    function toggleButtonState(buttons, state) {
        buttons.toggleClass('btn-primary', state).find('> i').toggleClass('icon-white', state);
    }

    /**
     * Represents a group of buttons. A button group will be drawn by Bootstrap
     * as a composite component (no spacing between the buttons).
     */
    function ButtonGroup(parent, options) {

        var // create the group element
            node = $('<div>').addClass('btn-group').appendTo(parent),
            // the options
            groupOptions = options || {};

        /**
         * Creates a new button and appends it to this button group.
         *
         * @param options
         *  (optional) A map of options to control the properties of the button.
         *  - icon: The name of the Bootstrap icon class, without the 'icon-'
         *      prefix.
         *  - label: The text label of the button. Will follow an icon.
         *  - class: Additional CSS classes to be set at the button (string).
         *  - css: Additional CSS formatting (key/value map).
         *  - toggle: If set to true, the button works as toggle button
         *      (similar to a check box). Do not use in radio groups!
         *
         * @returns
         *  A reference to this button group.
         */
        this.addButton = function (options) {

            // create the button element
            var button = $('<button>').addClass('btn').appendTo(node);

            // handle display options
            options = options || {};
            if (typeof options.icon === 'string') {
                button.append($('<i>').addClass('icon-' + options.icon));
            }
            if (typeof options.label === 'string') {
                var prefix = button.has('i') ? ' ' : '';
                button.append($('<span>').text(prefix + options.label));
            }
            if (typeof options['class'] === 'string') {
                button.addClass(options['class']);
            }
            if (typeof options.css === 'object') {
                button.css(options.css);
            }

            // add radio group or toggle behavior
            if (groupOptions.radio === true) {
                button.click(function () {
                    var self = $(this);
                    // do nothing, if clicked button is already active
                    if (!getButtonState(self)) {
                        toggleButtonState(self.siblings(), false);
                        toggleButtonState(self, true);
                    }
                });
            } else if (options.toggle === true) {
                button.click(function () { toggleButtonState($(this)); });
            }

            return this;
        };
    }

    function ToolBar() {

        var node = $('<div>').addClass('btn-toolbar io-ox-office-toolbar');

        /**
         * Returns the root element representing this tool bar.
         */
        this.getNode = function () {
            return node;
        };

        /**
         * Creates a new button group, and appends it to this tool bar.
         *
         * @param options
         *  (optional) An option map that controls global behavior of the
         *  entire button group.
         *  - radio: If set to true, the button group behaves like a group of
         *      radio buttons, i. e. one of the buttons is in 'active' state at
         *      any time. If another button is clicked, the active button will
         *      be deactivated, and the clicked button become the active button
         *      and triggers its associated action.
         *
         * @returns
         *  The new ButtonGroup instance.
         */
        this.createButtonGroup = function (options) {
            return new ButtonGroup(node, options);
        };

        /**
         * Creates a new single button in its own button group and appends it
         * to this tool bar.
         *
         * @param options
         *  (optional) A map of options to control the properties of the
         *  button. See method ButtonGroup.addButton() for details.
         *
         * @returns
         *  A reference to this tool bar.
         */
        this.addButton = function (options) {
            this.createButtonGroup().addButton(options);
            return this;
        };

    } // end of ToolBar class

    return ToolBar;
});
