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
     'io.ox/office/tk/dropdown',
     'gettext!io.ox/office/tk/main'
    ], function (Utils, DropDown, gt) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // static function ========================================================

    function getSizeOption(options, name, def, min, max) {
        var value = Utils.getObjectOption(options, name, {});
        value.width = Utils.getIntegerOption(value, 'width', def && def.width, min && min.width, max && max.width);
        value.height = Utils.getIntegerOption(value, 'height', def && def.height, min && min.height, max && max.height);
        return value;
    }

    // class SizeChooser ======================================================

    /**
     * Creates a size-chooser control with a drop-down button shown on top, and
     * a drop-down grid area used to select a specific size.
     *
     * @constructor
     *
     * @extends DropDown
     *
     * @param {String} key
     *  The unique key of the size chooser.
     *
     * @param {Object} options
     *  A map of options to control the properties of the size chooser.
     *  Supports all options of the DropDown() base class constructor.
     *  Additionally, the following options are supported:
     *  @param {Object} [options.minSize={width: 1, height: 1}]
     *      Minimum size allowed to choose. Either width or height may be
     *      omitted. Values but must be positive integers if specified.
     *  @param {Object} [options.maxSize={width: undefined, height: undefined}]
     *      Maximum size allowed to choose. Either width or height may be
     *      omitted. Values must be positive integers if specified, and must be
     *      greater than or equal to the values in options.minSize. If omitted,
     *      the maximum width and/or height is only limited by available screen
     *      space.
     *  @param {Object} [options.defaultValue]
     *      Default size that will be returned, if the action button is
     *      clicked, and that will be shown initially, when the drop-down grid
     *      will be opened. Must be positive integers if specified. Omitted
     *      values will be set to the minimum width and/or height.
     */
    function SizeChooser(key, options) {

        var // self reference to be used in event handlers
            self = this,

            // build a table of embedded div elements used to show the grid
            // (do not use a table element because grid flickers in different browsers...)
            gridNode = $('<div>').append($('<div>').append($('<div>'))),

            // the badge label showing the current grid size
            sizeLabel = $('<span>'),

            // the drop-down button filling up the entire drop-down menu
            gridButton = Utils.createButton(key).append(gridNode, sizeLabel),

            // the drop-down menu element
            menuNode = $('<div>').addClass('io-ox-size-chooser').append(gridButton),

            // grid size limits
            minSize = getSizeOption(options, 'minSize', { width: 1, height: 1 }, { width: 1, height: 1 }),
            maxSize = getSizeOption(options, 'maxSize', undefined, minSize),
            defSize = getSizeOption(options, 'defaultValue', minSize, minSize, maxSize);

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
        function setGridSize(size) {

            var // current size of the grid
                currSize = getGridSize(),
                // all row elements in the grid
                rows = gridNode.children();

            // validate passed size
            if (size.width < minSize.width) {
                size.width = minSize.width;
            } else if (maxSize.width && (size.width > maxSize.width)) {
                size.width = maxSize.width;
            }
            if (size.height < minSize.height) {
                size.height = minSize.height;
            } else if (maxSize.height && (size.height > maxSize.height)) {
                size.height = maxSize.height;
            }

            // add/remove columns
            if (size.width < currSize.width) {
                // remove cell elements from all rows
                rows.each(function () {
                    $(this).children().slice(size.width).remove();
                });
            } else if (size.width > currSize.width) {
                // add cell elements to all rows
                rows.each(function () {
                    var row = $(this);
                    _(size.width - currSize.width).times(function () {
                        row.append($('<div>'));
                    });
                });
            }

            // add/remove rows
            if (size.height < currSize.height) {
                // remove row elements
                rows.slice(size.height).remove();
            } else if (size.height > currSize.height) {
                // add row elements (clone the entire row instead of single cells)
                _(size.height - currSize.height).times(function () {
                    gridNode.append(rows.first().clone());
                });
            }

            // update badge label
            sizeLabel.text(gt.format(
                //#. %1$d is the number of columns in the drop-down grid of a size-chooser control (table size selector)
                //#, c-format
                gt.ngettext('%1$d column', '%1$d columns', size.width),
                gt.noI18n(size.width)
            ) + ' \xd7 ' + gt.format(
                //#. %1$d is the number of rows in the drop-down grid of a size-chooser control (table size selector)
                //#, c-format
                gt.ngettext('%1$d row', '%1$d rows', size.height),
                gt.noI18n(size.height)
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
            setGridSize(defSize);
            gridButton.off('mouseenter').one('mouseenter', function () {
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
                mouseX = event.pageX - gridNode.offset().left,
                mouseY = event.pageY - gridNode.offset().top;

            // unbind ourselves, if the drop-down menu has been closed
            if (!self.isMenuVisible()) {
                enableGridMouseMoveHandling(false);
                return;
            }

            // Calculate new grid size. Enlarge width/height of the grid area, if
            // the last column/row is covered more than 80% of its width/height.
            setGridSize({
                width: (cellWidth > 0) ? Math.floor(mouseX / cellWidth + 1.2) : 1,
                height: (cellHeight > 0) ? Math.floor(mouseY / cellHeight + 1.2) : 1
            });
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
                if (keydown) { gridSize.width -= 1; setGridSize(gridSize); }
                return false;
            case KeyCodes.UP_ARROW:
                if (keydown) {
                    if (gridSize.height > 1) { gridSize.height -= 1; setGridSize(gridSize); } else { self.hideMenu(true); }
                }
                return false;
            case KeyCodes.RIGHT_ARROW:
                if (keydown) { gridSize.width += 1; setGridSize(gridSize); }
                return false;
            case KeyCodes.DOWN_ARROW:
                if (keydown) { gridSize.height += 1; setGridSize(gridSize); }
                return false;
            }
        }

        // base constructor ---------------------------------------------------

        // insert validated default size for action button into the options
        DropDown.call(this, key, Utils.extendOptions(options, { defaultValue: defSize }), menuNode);

        // initialization -----------------------------------------------------

        // register event handlers
        this.registerActionHandler(gridButton, 'click', getGridSize)
            .on('menu:open', menuOpenHandler)
            .on('menu:enter', function () { gridButton.focus(); });
        gridButton.on('keydown keypress keyup', gridKeyHandler);

    } // class SizeChooser

    // exports ================================================================

    // derive this class from class DropDown
    return DropDown.extend({ constructor: SizeChooser });

});
