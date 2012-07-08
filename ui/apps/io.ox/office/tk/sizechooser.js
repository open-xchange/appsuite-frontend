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

define('io.ox/office/tk/sizechooser',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/dropdowngroup'
    ], function (Utils, DropDownGroup) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class SizeChooser ======================================================

    /**
     * Creates a size-chooser control with a drop-down button shown on top, and
     * a drop-down grid area used to select a specific size.
     *
     * @constructor
     *
     * @param {String} key
     *  The unique key of the size chooser.
     *
     * @param {Object} options
     *  A map of options to control the properties of the drop-down button.
     *  Supports all options of the base class (see DropDownGroup() for
     *  details). Additionally, the following options are supported:
     *  @param {Number} [options.minWidth=1]
     *      Minimum number of columns allowed to choose. Must be a positive
     *      integer. If omitted, will be set to 1.
     *  @param {Number} [options.maxWidth]
     *      Maximum number of columns allowed to choose. Must be a positive
     *      integer, must be greater than or equal to options.minWidth. If
     *      omitted, the maximum is only limited by available screen space.
     *  @param {Number} [options.minHeight=1]
     *      Minimum number of rows allowed to choose. Must be a positive
     *      integer. If omitted, will be set to 1.
     *  @param {Number} [options.maxHeight]
     *      Maximum number of rows allowed to choose. Must be a positive
     *      integer, must be greater than or equal to options.minHeight. If
     *      omitted, the maximum is only limited by available screen space.
     */
    function SizeChooser(key, options) {

        var // self reference to be used in event handlers
            self = this,

            // the table embedded in the drop-down button used to show the grid
            menuTable = $('<table>').append('<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>'),

            // the drop-down button filling up the entire drop-down menu
            menuButton = Utils.createButton(key).append(menuTable),

            // the drop-down menu element
            menuNode = $('<div>').addClass('io-ox-size-chooser').append(menuButton),

            // size limits
            minWidth = (options && _.isNumber(options.minWidth) && (options.minWidth >= 1)) ? options.minWidth : 1,
            maxWidth = (options && _.isNumber(options.maxWidth) && (options.maxWidth >= minWidth)) ? options.maxWidth : undefined,
            minHeight = (options && _.isNumber(options.minHeight) && (options.minHeight >= 1)) ? options.minHeight : 1,
            maxHeight = (options && _.isNumber(options.maxHeight) && (options.maxHeight >= minHeight)) ? options.maxHeight : undefined;

        // private methods ----------------------------------------------------

        /**
         * Handles key events in the open drop-down menu element.
         */
        function menuKeyHandler(event) {
/*
            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown',
                // all buttons in the drop-down grid
                buttons = self.getGridButtons(),
                // index of the focused button
                index = buttons.index(event.target),
                // row index of the focused button
                row = (index >= 0) ? Math.floor(index / columns) : -1,
                // column index of the focused button
                column = (index >= 0) ? (index % columns) : -1;

            function focus(newIndex) {
                newIndex = Math.min(buttonCount - 1, newIndex);
                if ((newIndex >= 0) && (newIndex !== index)) {
                    buttons.eq(newIndex).focus();
                }
            }

            switch (event.keyCode) {
            case KeyCodes.LEFT_ARROW:
                if (keydown && (column > 0)) { focus(index - 1); }
                return false;
            case KeyCodes.UP_ARROW:
                if (keydown) {
                    if (row > 0) { focus(index - columns); } else { self.hideMenu(); }
                }
                return false;
            case KeyCodes.RIGHT_ARROW:
                if (keydown && (column + 1 < columns)) { focus(index + 1); }
                return false;
            case KeyCodes.DOWN_ARROW:
                if (keydown && (row + 1 < rows)) { focus(index + columns); }
                return false;
            }
*/
        }

        // base constructor ---------------------------------------------------

        DropDownGroup.call(this, key, options, menuNode);

        // methods ------------------------------------------------------------

        // initialization -----------------------------------------------------

        menuTable.css('width', '60px');

        // register event handlers
        this.registerActionHandler(menuButton, 'click', $.noop)
            .on('menu:enter', function () { menuButton.focus(); });
        menuButton.on('keydown keypress keyup', menuKeyHandler);

    } // class SizeChooser

    // exports ================================================================

    // derive this class from class DropDownGroup
    return DropDownGroup.extend({ constructor: SizeChooser });

});
