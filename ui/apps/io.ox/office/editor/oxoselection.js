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
define('io.ox/office/editor/oxoselection',
            ['io.ox/office/tk/utils',
             'io.ox/office/editor/oxopam'], function (Utils, OXOPaM) {

    'use strict';

    // class Selection ========================================================

    /**
     * An instance of this class represents a cursor selection with the two
     * member variables startPaM and endPaM (Point and Mark). These two members
     * contain the logical position as an array of integers.
     */
    function Selection(start, end) {

        this.startPaM = start ? _.copy(start, true) : new OXOPaM([0, 0]);
        this.endPaM = end ? _.copy(end, true) : _.copy(this.startPaM, true);

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
