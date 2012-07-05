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

define('io.ox/office/tk/controlgroup',
    ['io.ox/core/event',
     'io.ox/office/tk/utils'
    ], function (Events, Utils) {

    'use strict';

    // class ControlGroup =====================================================

    /**
     * Creates a container element used to hold single controls. All controls
     * shown in a tool bar must be inserted into such group containers.
     *
     * @constructor
     */
    function ControlGroup() {

        // private fields -----------------------------------------------------

        var // create the group container element
            groupNode = $('<div>').addClass('btn-group');

        // methods ------------------------------------------------------------

        /**
         * Returns the DOM container element for this control group as jQuery
         * object.
         */
        this.getNode = function () {
            return groupNode;
        };

        /**
         * Creates a new button element and appends it to this control group.
         */
        this.addButton = function (key, options) {
            return Utils.createButton(key, options).appendTo(groupNode);
        };

        /**
         * Returns whether this group contains the control that is currently
         * focused.
         */
        this.hasFocus = function () {
            return Utils.containsFocusedControl(groupNode);
        };

        /**
         * Sets the focus to the first enabled control in this group.
         */
        this.grabFocus = function () {
            if (!this.hasFocus()) {
                groupNode.children(Utils.ENABLED_SELECTOR).first().focus();
            }
            return this;
        };

        this.isVisible = function () {
            return !groupNode.hasClass(ControlGroup.HIDDEN_CLASS);
        };

        this.show = function () {
            groupNode.removeClass(ControlGroup.HIDDEN_CLASS);
            return this;
        };

        this.hide = function () {
            groupNode.addClass(ControlGroup.HIDDEN_CLASS);
            return this;
        };

        this.toggle = function () {
            groupNode.toggleClass(ControlGroup.HIDDEN_CLASS);
            return this;
        };

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

    } // class ControlGroup

    // constants --------------------------------------------------------------

    /**
     * CSS class for hidden button groups.
     *
     * @constant
     */
    ControlGroup.HIDDEN_CLASS = 'io-ox-hidden';

    /**
     * CSS selector for visible button groups and drop-down menus.
     *
     * @constant
     */
    ControlGroup.VISIBLE_SELECTOR = ':not(.' + ControlGroup.HIDDEN_CLASS + ')';

    // exports ================================================================

    _.makeExtendable(ControlGroup);

    return ControlGroup;

});
