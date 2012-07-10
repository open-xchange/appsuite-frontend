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
     'io.ox/office/tk/dropdowngroup',
     'gettext!io.ox/office/tk/main'
    ], function (Utils, DropDownGroup, gt) {

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
     *  @param {Number} [options.minHeight=1]
     *      Minimum number of rows allowed to choose. Must be a positive
     *      integer. If omitted, will be set to 1.
     *  @param {Number} [options.maxWidth]
     *      Maximum number of columns allowed to choose. Must be a positive
     *      integer, must be greater than or equal to options.minWidth. If
     *      omitted, the maximum is only limited by available screen space.
     *  @param {Number} [options.maxHeight]
     *      Maximum number of rows allowed to choose. Must be a positive
     *      integer, must be greater than or equal to options.minHeight. If
     *      omitted, the maximum is only limited by available screen space.
     *  @param {Number} [options.initialWidth]
     *      Number of rows that will be shown initially, when the drop-down
     *      grid will be opened. Must be a positive integer. If omitted, will
     *      be set to options.minWidth.
     *  @param {Number} [options.initialHeight]
     *      Number of columns that will be shown initially, when the drop-down
     *      grid will be opened. Must be a positive integer. If omitted, will
     *      be set to options.minHeight.
     */
    function SizeChooser(key, options) {

        var // self reference to be used in event handlers
            self = this,

            // build a table of embedded div elements used to show the grid
            // (do not use a table element because grid flickers in different browsers...)
            gridNode = $('<div>').append($('<div>').append($('<div>'))),

            // the badge labels showing the current grid size
            widthLabel = $('<span>').addClass('width-label'),
            heightLabel = $('<span>').addClass('height-label'),

            // the drop-down button filling up the entire drop-down menu
            gridButton = Utils.createButton(key).append(gridNode, widthLabel, heightLabel),

            // the drop-down menu element
            menuNode = $('<div>').addClass('io-ox-size-chooser').append(gridButton),

            // grid size limits
            minWidth = (options && _.isNumber(options.minWidth) && (options.minWidth >= 1)) ? options.minWidth : 1,
            minHeight = (options && _.isNumber(options.minHeight) && (options.minHeight >= 1)) ? options.minHeight : 1,
            maxWidth = (options && _.isNumber(options.maxWidth) && (options.maxWidth >= minWidth)) ? options.maxWidth : undefined,
            maxHeight = (options && _.isNumber(options.maxHeight) && (options.maxHeight >= minHeight)) ? options.maxHeight : undefined,
            initWidth = (options && _.isNumber(options.initialWidth) && (options.initialWidth >= minWidth)) ? options.initialWidth : minWidth,
            initHeight = (options && _.isNumber(options.initialHeight) && (options.initialHeight >= minHeight)) ? options.initialHeight : minHeight;

        // private methods ----------------------------------------------------

        /**
         * Returns the current size of the grid, as object with 'width' and
         * 'height' attributes.
         */
        function getGridSize() {
            var rows = gridNode.children();
            return { width: rows.first().children().length, height: rows.length };
        }

        /**
         * Changes the current size of the grid, and updates the badge labels.
         */
        function setGridSize(width, height) {

            var // current size of the grid
                gridSize = getGridSize(),
                // all row elements in the grid
                rows = gridNode.children();

            if (width < minWidth) { width = minWidth; } else if (_.isNumber(maxWidth) && (width > maxWidth)) { width = maxWidth; }
            if (height < minHeight) { height = minHeight; } else if (_.isNumber(maxHeight) && (height > maxHeight)) { height = maxHeight; }

            // add/remove columns
            if (width < gridSize.width) {
                // remove cell elements from all rows
                rows.each(function () {
                    $(this).children().slice(width).remove();
                });
            } else if (width > gridSize.width) {
                // add cell elements to all rows
                rows.each(function () {
                    var row = $(this);
                    _(width - gridSize.width).times(function () {
                        row.append($('<div>'));
                    });
                });
            }

            // add/remove rows
            if (height < gridSize.height) {
                // remove row elements
                rows.slice(height).remove();
            } else if (height > gridSize.height) {
                // add row elements (clone the entire row instead of single cells)
                _(height - gridSize.height).times(function () {
                    gridNode.append(rows.first().clone());
                });
            }

            // update badge labels
            widthLabel.toggle(width > 1).text(gt.format(
                //#. %1$d is the number of columns in the drop-down grid of a size-chooser control (table size selector)
                //#, c-format
                gt.ngettext('%1$d column', '%1$d columns', width),
                gt.noI18n(width)
            ));
            heightLabel.toggle(height > 1).text(gt.format(
                //#. %1$d is the number of rows in the drop-down grid of a size-chooser control (table size selector)
                //#, c-format
                gt.ngettext('%1$d row', '%1$d rows', height),
                gt.noI18n(height)
            ));
        }

        /**
         * Enables or disables the global 'mousemove' handler that updates the
         * grid size according to the position of the mouse pointer.
         *
         * @param {Boolean} state
         *  Specifies whether to enable or disable the 'mousemove' handler.
         */
        function enableGridMouseMoveHandling(state) {
            $('body')[state ? 'on' : 'off']('mousemove', gridMouseMoveHandler);
        }

        /**
         * Handles 'menu:open' events and initializes the drop-down grid.
         * Registers a 'mouseenter' handler at the drop-down menu that starts
         * a 'mousemove' listener when the mouse first hovers the grid element.
         */
        function menuOpenHandler() {
            enableGridMouseMoveHandling(false);
            setGridSize(initWidth, initHeight);
            menuNode.off('mouseenter').one('mouseenter', function () {
                enableGridMouseMoveHandling(true);
            });
        }

        /**
         * Handles 'mousemove' events in the open drop-down menu element.
         */
        function gridMouseMoveHandler(event) {

            var // current and new size of the grid
                gridSize = getGridSize(),
                // width and height of one cell
                cellWidth = gridNode.outerWidth() / gridSize.width,
                cellHeight = gridNode.outerHeight() / gridSize.height,
                // mouse position relative to grid
                mouseX = event.pageX - menuNode.offset().left,
                mouseY = event.pageY - menuNode.offset().top;

            // unbind ourselves, if the drop-down menu has been closed
            if (!self.isMenuVisible()) {
                enableGridMouseMoveHandling(false);
                return;
            }

            // Calculate new grid size. Enlarge width/height of the grid area, if
            // the last column/row is covered more than 75% of its width/height.
            setGridSize(
                (cellWidth > 0) ? Math.floor(mouseX / cellWidth + 1.25) : 1,
                (cellHeight > 0) ? Math.floor(mouseY / cellHeight + 1.25) : 1
            );
        }

        /**
         * Handles keyboard events in the open drop-down menu element.
         */
        function gridKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown',
                // current and new size of the grid
                gridSize = getGridSize();

            switch (event.keyCode) {
            case KeyCodes.LEFT_ARROW:
                if (keydown) { setGridSize(gridSize.width - 1, gridSize.height); }
                return false;
            case KeyCodes.UP_ARROW:
                if (keydown) {
                    if (gridSize.height > 1) { setGridSize(gridSize.width, gridSize.height - 1); } else { self.hideMenu(true); }
                }
                return false;
            case KeyCodes.RIGHT_ARROW:
                if (keydown) { setGridSize(gridSize.width + 1, gridSize.height); }
                return false;
            case KeyCodes.DOWN_ARROW:
                if (keydown) { setGridSize(gridSize.width, gridSize.height + 1); }
                return false;
            }
        }

        // base constructor ---------------------------------------------------

        DropDownGroup.call(this, key, options, menuNode);

        // methods ------------------------------------------------------------

        // initialization -----------------------------------------------------

        // register event handlers
        this.registerActionHandler(gridButton, 'click', getGridSize)
            .on('menu:open', menuOpenHandler)
            .on('menu:enter', function () { gridButton.focus(); });
        gridButton.on('keydown keypress keyup', gridKeyHandler);

    } // class SizeChooser

    // exports ================================================================

    // derive this class from class DropDownGroup
    return DropDownGroup.extend({ constructor: SizeChooser });

});
