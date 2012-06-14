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
     * Creates and returns a new 'button' element.
     */
    function createButton(options, callback) {

        // create the button element
        var button = $('<button>').addClass('btn');

        // shift parameters, if 'options' is missing
        if ((callback === undefined) && (_.isFunction(options))) {
            callback = options;
            options = {};
        } else {
            options = options || {};
        }

        // handle options
        if (typeof options.icon === 'string') {
            button.append($('<i>').addClass('icon-' + options.icon));
        }
        if (typeof options.label === 'string') {
            var prefix = button.has('i') ? ' ' : '';
            button.append($('<span>').text(prefix + options.label));
        }
        if (options.iconlike === true) {
            button.addClass('btn-iconlike');
        }
        if (options.toggle === true) {
            button.click(function () { $(this).toggleClass('btn-primary'); });
        }

        // handle callback, pass the button as context
        if (_.isFunction(callback)) {
            callback.call(button);
        }

        return button;
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

        this.addButton = function (options, callback) {
            // create the new button
            var button = createButton(options, callback).appendTo(node);

            // add radio group behavior
            if (groupOptions.radio === true) {
                button.click(function () {
                    var self = $(this);
                    // do nothing, if clicked button is already active
                    if (!self.hasClass('btn-primary')) {
                        self.siblings().removeClass('btn-primary').end().addClass('btn-primary');
                    }
                });
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
         * Creates a new button and appends it to this tool bar.
         *
         * @param options
         *  (optional) A map of options to control the properties of the button.
         *  - icon: The name of the Bootstrap icon class, without the 'icon-' prefix.
         *  - label: The text label of the button. Will follow an icon.
         *  - iconlike: If set to true, the button gets a fixed width as if it is
         *      a single Bootstrap icon without text.
         *
         * @returns
         *  A reference to this tool bar.
         */
        this.addButton = function (options, callback) {
            node.append(createButton(options, callback));
            return this;
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

    } // end of ToolBar class

    return ToolBar;
});
