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

define('io.ox/office/tk/dropdown/scrollable',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/dropdown/dropdown'
    ], function (Utils, DropDown) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class Scrollable =======================================================

    /**
     * Extends a Group object with a drop-down button and a drop-down menu that
     * can scroll its content node vertically.
     *
     * Note: This is a mix-in class supposed to extend an existing instance of
     * the class Group or one of its derived classes. Expects the symbol 'this'
     * to be bound to an instance of Group.
     *
     * @constructor
     *
     * @extends DropDown
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the drop-down button and
     *  menu. Supports all options of the DropDown base class.
     */
    function Scrollable(contentNode, options) {

        var // self reference (the Group instance)
            self = this;

        // private methods ----------------------------------------------------

        /**
         * Handles 'menuopen' events and initializes the drop-down menu.
         */
        function menuOpenHandler() {

            var // the outer menu node containing the list element
                menuNode = self.getMenuNode(),
                // width of the drop-down group buttons (used as min-width of the menu)
                minWidth = self.getNode().width(),
                // width of the scroll bar in pixels
                scrollBarWidth = 0,
                // maximum left offset of the menu node to not leave browser window
                maxOffsetLeft = 0;

            // set maximum height of the drop-down menu, depending on window height
            menuNode
                .css('max-height', (window.innerHeight - menuNode.offset().top - 10) + 'px')
                .scrollTop(0);

            // Calculate the width of the drop-down menu. Work around a Firefox
            // bug which displays the menu too narrow (it restricts the width
            // of the drop-down menu to the width of the group element, if the
            // width of the children in the content node is set to '100%' to
            // give them the same width). If this is not a bug but a CSS
            // feature, it needs to be worked around anyway.

            // 1) Set width of menu node and content node to 'auto' to let the
            // containers shrink together (needed if a scroll bar has been
            // shown the last time, which is hidden now due to a larger browser
            // window). Here, Firefox shrinks too much.
            menuNode.css('width', 'auto');
            contentNode.css('width', 'auto');
            // 2) Calculate the width of the scroll bar, if existing.
            scrollBarWidth = menuNode.innerWidth() - contentNode.outerWidth();
            // 3) Expand the width of the outer menu node, this gives the
            // content node enough space. Then, set it to the calculated width
            // of the content node. Take the width of the top-level buttons as
            // minimum width into account.
            menuNode.width(99999).width(Math.max(minWidth, contentNode.outerWidth() + scrollBarWidth));
            // 4) Expand width of the content node to the menu width (needed in
            // case minimum width is active).
            contentNode.css('width', '100%');

            // refresh left offset to keep menu node inside browser window
            maxOffsetLeft = window.innerWidth - menuNode.outerWidth() - 10;
            menuNode.css('left', 0).css('left', Math.min(maxOffsetLeft - menuNode.offset().left, 0) + 'px');
        }

        // base constructor ---------------------------------------------------

        DropDown.call(this, contentNode, options);

        // initialization -----------------------------------------------------

        // initialize the drop-down element
        this.getMenuNode().addClass('scrollable');

        // register event handlers
        this.on('menuopen', menuOpenHandler);

    } // class Scrollable

    // exports ================================================================

    // derive this class from class DropDown
    return DropDown.extend({ constructor: Scrollable });

});
