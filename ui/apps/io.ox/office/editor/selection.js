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
 * @author Ingo Schmidt-Rosbiegal <ingo.schmidt-rosbiegal@open-xchange.com>
 */
define('io.ox/office/editor/selection',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/position'
    ], function (Utils, Position) {

    'use strict';

    // class Selection ========================================================

    /**
     * An instance of this class represents a selection in the edited document,
     * consisting of a logical start and end position representing a half-open
     * text range, or a rectangular table cell range (FireFox only).
     *
     * @constructor
     *
     * @param {Number[]} startPosition
     *  The logical position of the first component in the selected range.
     *
     * @param {Number[]} endPosition
     *  The logical position following the last component in the selected range
     *  (half-open range).
     */
    function Selection(startPosition, endPosition) {

        this.startPaM = new Position(_.isArray(startPosition) ? startPosition : [0, 0]);
        this.endPaM = new Position(_.isArray(endPosition) ? endPosition : this.startPaM.oxoPosition);

        // methods ------------------------------------------------------------

        this.isTextCursor = function () {
            return !this.isCellSelection() && _.isEqual(this.startPaM.oxoPosition, this.endPaM.oxoPosition);
        };

        this.hasRange = function () {
            return !_.isEqual(this.startPaM.oxoPosition, this.endPaM.oxoPosition);
        };

        /**
         * Returns whether this selection object represents a rectangular cell
         * selection (FireFox only).
         */
        this.isCellSelection = function () {
            return (this.startPaM.selectedNodeName === 'TR') && (this.endPaM.selectedNodeName === 'TR');
        };

        /**
         * Returns whether the start and end position of this selection are
         * located in the same parent component (all array elements but the
         * last are equal).
         *
         * @param {Number} [parentLevel=1]
         *  The number of parent levels. If omitted, the direct parents of the
         *  start and end position will be checked (only the last element of
         *  each array will be ignored). Otherwise, the specified number of
         *  trailing array elements will be ignored (for example, a value of 2
         *  checks the grand parents).
         *
         * @returns {Boolean}
         *  Whether the start and end position are located in the same parent
         *  component.
         */
        this.hasSameParentComponent = function (parentLevel) {

            // TODO: use implementation in Position (not yet, to prevent cyclic module dependency)

            var index = 0, length = this.startPaM.oxoPosition.length;

            // length of both positions must be equal
            parentLevel = parentLevel || 1;
            if ((length < parentLevel) || (length !== this.endPaM.oxoPosition.length)) { return false; }

            // compare all array elements but the last ones
            for (index = length - parentLevel - 1; index >= 0; index -= 1) {
                if (this.startPaM.oxoPosition[index] !== this.endPaM.oxoPosition[index]) {
                    return false;
                }
            }

            return true;
        };

        /**
         * Returns whether this selection covers exactly one component.
         *
         * @returns {Boolean}
         *  Returns whether the selection is covering a single component. The
         *  start and end position must refer to the same parent component, and
         *  the last array element of the end position must be the last array
         *  element of the start position increased by the value 1.
         */
        this.isSingleComponentSelection = function () {
            return this.hasSameParentComponent() && (_.last(this.startPaM.oxoPosition) === _.last(this.endPaM.oxoPosition) - 1);
        };

        this.adjust = function () {
            if (Utils.compareNumberArrays(this.startPaM.oxoPosition, this.endPaM.oxoPosition) > 0) {
                var tmp = this.startPaM;
                this.startPaM = this.endPaM;
                this.endPaM = tmp;
            }
        };

    } // class Selection

    // export =================================================================

    return Selection;

});
