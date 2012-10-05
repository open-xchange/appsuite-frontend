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
 * @author Malte Timmermann <malte.timmermann@open-xchange.com>
 * @author Ingo Schmidt-Rosbiegal <ingo.schmidt-rosbiegal@open-xchange.com>
 */

define('io.ox/office/editor/undo',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/operations'
    ], function (Utils, Operations) {

    'use strict';

    // class UndoManager ======================================================

    /**
     * The undo manager is used by the editor to administer the operation
     * handling concerning undo and redo. Also the grouping and merging of
     * operations is a task of the undo-manager.
     *
     * @constructor
     *
     * @param {Editor} editor
     *  The editor instance where undo and redo operations will be applied.
     */
    function UndoManager(editor) {

        var actions = [],
            // maxActions = 1000,   // not clear if really wanted/needed...
            currentAction = 0,
            groupLevel = 0,
            currentGroupActions = [],
            enabled = true,
            processingUndoRedo = false;

        // class Action -------------------------------------------------------

        /**
         * An instance of Action is used by the undo manager to undo and redo an
         * operation in the editor.
         *
         * @constructor
         *
         * @param {Object} undoOperation
         *  An operation object, that is used to undo an already executed operation.
         *
         * @param {Object} redoOperation
         *  An operation object, that is used to undo the undo operation.
         */
        function Action(undoOperation, redoOperation, allowMerge) {

            // Need to store as member, because of the feature to merge undo actions afterwards...
            this.undoOperation = undoOperation;
            this.redoOperation = redoOperation;
            this.allowMerge = allowMerge === true;

            this.undo = function () {
                // Doc is being modified, so we need to notify/transfer/merge this operation. Is there a better way for undo?
                if (this.undoOperation) {
                    editor.applyOperation(this.undoOperation, true, true);
                }
            };

            this.redo = function () {
                if (this.redoOperation) {
                    editor.applyOperation(this.redoOperation, true, true);
                }
            };

        } // class Action

        // private methods ----------------------------------------------------

        function isSameParagraph(pos1, pos2, includeLastPos) {
            if (pos1.length !== pos2.length)
                return false;
            if (pos1.length < (includeLastPos ? 1 : 2))
                return false;
            var n = pos1.length - (includeLastPos ? 1 : 2);
            for (var i = 0; i <= n; i++)
                if (pos1[n] !== pos2[n])
                    return false;
            return true;
        }

        this.clear = function () {
            actions = [];
            currentAction = 0;
        };

        this.isEnabled = function () {
            return enabled;
        };

        this.enable = function (b) {
            enabled = b;
            if (!enabled) {
                this.clear();
            }
        };

        /**
         * Opens an undo group. All undo operations added while an undo group
         * is open will be collected and act like a single undo action. Can be
         * called repeatedly. Every call of this method must be followed by a
         * matching call of the method UndoManager.endGroup().
         */
        this.startGroup = function () {
            // I don't think we really need complex structure with nested arrays here.
            // Once we start a group, undo will always undo everything within
            // Just using ++/-- so other code don't need to take care whether or
            // not grouping is already active...
            groupLevel++;
        };

        /**
         * Closes an undo group that has been opened with the method
         * UndoManager.startGroup() before.
         */
        this.endGroup = function () {

            if (!groupLevel) {
                Utils.error('UndoManager.endGroup(): not in undo group!');
                return;
            }

            groupLevel--;

            if ((groupLevel === 0) && (currentGroupActions.length > 0)) {
                actions.push(currentGroupActions);
                currentAction = actions.length;
                currentGroupActions = [];
            }
        };

        this.isInUndo = function () {
            return processingUndoRedo;
        };

        this.addUndo = function (undoOperation, redoOperation, allowMerge) {

            if (this.isInUndo()) {
                Utils.error('UndoManager.addUndo(): creating undo while processing undo!');
                return;
            }

            var action = new Action(_.copy(undoOperation, true), _.copy(redoOperation, true), allowMerge),
                tryToMerge = true;

            // remove undone actions
            if (currentAction < actions.length) {
                actions.splice(currentAction);
                tryToMerge = false;
            }

            if (groupLevel) {
                currentGroupActions.push(action);
            }
            else {
                var bDone = false;
                if (tryToMerge && currentAction && action.allowMerge) {
                    var prevUndo = actions[currentAction - 1];
                    if (prevUndo.allowMerge && (prevUndo.redoOperation.name === action.redoOperation.name)) {
                        if (action.redoOperation.name === Operations.OP_TEXT_INSERT) {
                            if (isSameParagraph(action.redoOperation.start, prevUndo.redoOperation.start, false)) {
                                var nCharPosInArray = prevUndo.redoOperation.start.length - 1;
                                var prevCharEnd = prevUndo.redoOperation.start[nCharPosInArray] + prevUndo.redoOperation.text.length;
                                if (prevCharEnd === action.redoOperation.start[nCharPosInArray]) {
                                    var lastChar = prevUndo.redoOperation.text[prevUndo.redoOperation.text.length - 1];     // text len can't be 0 in undo action...
                                    if (lastChar !== ' ') {
                                        // Merge Undo...
                                        prevUndo.redoOperation.text +=  action.redoOperation.text;
                                        prevUndo.undoOperation.end[nCharPosInArray] += action.redoOperation.text.length;
                                        bDone = true;
                                    }
                                }
                            }
                        }
                    }
                }
                if (!bDone)
                    actions.push(action);
                currentAction = actions.length;
            }
        };

        this.hasUndo = function () {
            return currentAction > 0;
        };

        this.undo = function () {

            if (!this.hasUndo())
                return;

            processingUndoRedo = true;
            var action = actions[--currentAction];
            if (_.isArray(action)) {
                for (var i = action.length; i;) {
                    action[--i].undo();
                }
            }
            else {
                action.undo();
            }
            processingUndoRedo = false;
        };

        this.hasRedo = function () {
            return currentAction < actions.length;
        };

        this.redo = function () {

            if (!this.hasRedo())
                return;

            processingUndoRedo = true;
            var action = actions[currentAction++];
            if (_.isArray(action)) {
                _.invoke(action, 'redo');
            }
            else {
                action.redo();
            }
            processingUndoRedo = false;
        };

    } // class UndoManager

   // exports ================================================================

    return UndoManager;

});
