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

define('io.ox/office/tk/dropdown/gridsizer',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/dropdown/dropdown',
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

    // class GridSizer ========================================================

    /**
     * Extends a Group object with a drop-down button and a drop-down menu
     * containing a resizeable grid allowing to select a specific size. Extends
     * the DropDown mix-in class with functionality specific to the sizer drop-down
     * element.
     *
     * Note: This is a mix-in class supposed to extend an existing instance of
     * the class Group or one of its derived classes. Expects the symbol 'this'
     * to be bound to an instance of Group.
     *
     * @constructor
     *
     * @extends DropDown
     *
     * @param {Object} options
     *  A map of options to control the properties of the sizer. Supports all
     *  options of the DropDown base class. Additionally, the following options
     *  are supported:
     *  @param {Object} [options.minSize={width: 1, height: 1}]
     *      Minimum size allowed to choose. Either width or height may be
     *      omitted. Values but must be positive integers if specified.
     *  @param {Object} [options.maxSize={width: undefined, height: undefined}]
     *      Maximum size allowed to choose. Either width or height may be
     *      omitted. Values must be positive integers if specified, and must be
     *      greater than or equal to the values in options.minSize. If omitted,
     *      the maximum width and/or height is only limited by available screen
     *      space.
     *  @param {Object} [options.defaultSize]
     *      Default size that will be shown initially, when the drop-down grid
     *      will be opened. Must be positive integers if specified. Omitted
     *      values will be set to the minimum width and/or height.
     */
    function GridSizer(options) {

        var // build a table of embedded div elements used to show the grid
            // (do not use a table element because grid flickers in different browsers...)
            gridButton = Utils.createButton().append($('<div>').append($('<div>'))),

            // the badge label showing the current grid size
            sizeLabel = $('<span>'),

            // the top-level filling up the entire drop-down menu (the size label
            // must be outside the button element, because IE *always* clips the
            // button contents and thus would make the label invisible)
            gridNode = $('<div>').append(gridButton, sizeLabel),

            // grid size limits
            minSize = getSizeOption(options, 'minSize', { width: 1, height: 1 }, { width: 1, height: 1 }),
            maxSize = getSizeOption(options, 'maxSize', undefined, minSize),
            defSize = getSizeOption(options, 'defaultSize', minSize, minSize, maxSize);

        // private methods ----------------------------------------------------

        /**
         * Returns the current size of the grid, as object with 'width' and
         * 'height' attributes.
         */
        function getGridSize() {
            var rows = gridButton.children();
            return { width: rows.first().children().length, height: rows.length };
        }

        /**
         * Changes the current size of the grid, and updates the badge labels.
         */
        function setGridSize(size) {

            var // current size of the grid
                currSize = getGridSize(),
                // all row elements in the grid
                rows = gridButton.children();

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
                    gridButton.append(rows.first().clone(true));
                });
            }

            // update badge label
            sizeLabel.text(gt.format(
                //#. %1$d is the number of columns in the drop-down grid of a size-chooser control (table size selector)
                //#, c-format
                gt.ngettext('%1$d column', '%1$d columns', size.width),
                size.width
            ) + ' \xd7 ' + gt.format(
                //#. %1$d is the number of rows in the drop-down grid of a size-chooser control (table size selector)
                //#, c-format
                gt.ngettext('%1$d row', '%1$d rows', size.height),
                size.height
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
         * Handles 'menuopen' events and initializes the drop-down grid.
         * Registers a 'mouseenter' handler at the drop-down menu that starts
         * a 'mousemove' listener when the mouse first hovers the grid element.
         */
        function menuOpenHandler(event) {

            // stop running mousemove handler
            enableGridMouseMoveHandling(false);

            // initialize grid size to default size
            setGridSize(defSize);

            // wait for mouse to enter the grid before listening to mousemove events
            gridNode.off('mouseenter').one('mouseenter', function () {
                enableGridMouseMoveHandling(true);
            });
        }

        /**
         * Handles 'menuclose' events.
         */
        function menuCloseHandler(event, from) {
            // unbind the 'mousemove' listener
            enableGridMouseMoveHandling(false);
        }

        /**
         * Handles 'mousemove' events in the open drop-down menu element.
         */
        function gridMouseMoveHandler(event) {

            var // current and new size of the grid
                gridSize = getGridSize(),
                // width and height of one cell
                cellWidth = gridButton.outerWidth() / gridSize.width,
                cellHeight = gridButton.outerHeight() / gridSize.height,
                // mouse position relative to grid
                mouseX = event.pageX - gridButton.offset().left,
                mouseY = event.pageY - gridButton.offset().top;

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
                if (gridSize.height <= 1) { break; } // let key bubble up to hide the menu
                if (keydown) { gridSize.height -= 1; setGridSize(gridSize); }
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

        DropDown.call(this, gridNode, options);

        // methods ------------------------------------------------------------

        /**
         * Sets the focus to the button element in the sizer drop-down menu.
         */
        this.grabMenuFocus = function () {
            gridButton.focus();
            return this;
        };

        // initialization -----------------------------------------------------

        // initialize the drop-down element
        this.getMenuNode().addClass('grid-sizer');

        // register event handlers
        this.registerActionHandler(gridButton, 'click', getGridSize)
            .on('menuopen', menuOpenHandler)
            .on('menuclose', menuCloseHandler);
        gridButton.on('keydown keypress keyup', gridKeyHandler);

    } // class GridSizer

    // exports ================================================================

    // derive this class from class DropDown
    return DropDown.extend({ constructor: GridSizer });

});
