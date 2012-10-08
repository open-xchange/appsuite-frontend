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

define('io.ox/office/tk/component/appwindowtoolbar',
    ['io.ox/core/event',
     'io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/office/tk/utils'
     ], function (Events, Extensions, Links, Utils) {

    'use strict';

    // class AppWindowToolBar =================================================

    /**
     * A special class that acts like a view component and updates the controls
     * in the header tool bar of the specified application window.
     *
     * @constructor
     *
     * @param {ox.ui.Window} appWindow
     *  The application window object.
     */
    function AppWindowToolBar(appWindow) {

        // private methods ----------------------------------------------------

        /**
         * Returns a control element from the window header tool bar. Note that
         * the returned control MUST NOT be cached, as it changes every time
         * the application window has been hidden and shown.
         *
         * @param {String} key
         *  The unique controller key of the tool bar control.
         *
         * @returns {jQuery}
         *  The control node associated to the specified key, as jQuery object.
         */
        function getControlNode(key) {

            var // the window header tool bar
                toolBar = appWindow.nodes.toolbar,
                // try to find the control by key
                control = toolBar.find('[data-action="' + key + '"]');

            // TODO: find container node of radio groups
            return control;
        }

        // methods ------------------------------------------------------------

        /**
         * Enables or disables the specified control in the window header tool
         * bar.
         *
         * @param {String} key
         *  The key of the control group to be enabled or disabled.
         *
         * @param {Boolean} [state=true]
         *  If omitted or set to true, the control group will be enabled.
         *  Otherwise, it will be disabled.
         *
         * @returns {WindowToolBarComponent}
         *  A reference to this view component.
         */
        this.enable = function (key, state) {
            var enabled = _.isUndefined(state) || (state === true);
            getControlNode(key).toggleClass('disabled', !enabled);
            return this;
        };

        /**
         * Disables the specified group of the the window header tool bar. Has
         * the same effect as calling WindowToolBarComponent.enable(key, false).
         *
         * @param {String} key
         *  The key of the control group to be disabled.
         *
         * @returns {WindowToolBarComponent}
         *  A reference to this view component.
         */
        this.disable = function (key) {
            return this.enable(key, false);
        };

        /**
         * Updates the specified control group with the specified value.
         *
         * @param {String} key
         *  The key of the control group to be updated.
         *
         * @param value
         *  The new value to be displayed in the control.
         *
         * @returns {WindowToolBarComponent}
         *  A reference to this view component.
         */
        this.update = function (key, value) {
            if (_.isString(value)) {
                getControlNode(key).text(value);
            }
            return this;
        };

        /**
         * Calls the destroy methods of all child objects.
         */
        this.destroy = function () {
            this.events.destroy();
        };

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

    } // class AppWindowToolBar

    // exports ================================================================

    return AppWindowToolBar;

});
