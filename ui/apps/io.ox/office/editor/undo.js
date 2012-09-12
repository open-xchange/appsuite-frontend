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

define('io.ox/office/editor/undo', ['io.ox/office/tk/utils'], function (Utils) {

    'use strict';

    // static class Undo =======================================================

    /**
     * Provides classes for redo/undo operations in editor. This includes the
     * Undo.OXOUndoAction an the Undo.OXOUndoManager.
     */
    var Undo = {};

    // class Undo.OXOUndoAction ===============================================

    /**
     * A OXOUndoAction is used from the undo-manager (Undo.OXOUndoManager) to
     * undo and to redo an operation in the editor.
     *
     * @constructor
     *
     * @param {Object} _undoOperation
     *  An operation object, that is used to undo an already executed operation.
     *
     * @param {Object} _redoOperation
     *  An operation object, that is used to undo the undo operation.
     */
    Undo.OXOUndoAction = function (_undoOperation, _redoOperation) {

        // Need to store as member, because of the feature to merge undos afterwards...
        this.undoOperation = _undoOperation;
        this.redoOperation = _redoOperation;

        this.undo = function (editor) {
            editor.publicApplyOperation(this.undoOperation, true, true);  // Doc is being modified, so we need to notify/transfer/merge this operation. Is there a better way for undo?
        };

        this.redo = function (editor) {
            editor.publicApplyOperation(this.redoOperation, true, true);
        };

    };

    // class Undo.OXOUndoManager ===============================================

    /**
     * The OXOUndoManager is used by the editor to administer the operation
     * handling concerning undo and redo. Also the grouping and merging of
     * operations is a task of the undo-manager.
     *
     * @constructor
     */
    Undo.OXOUndoManager = function () {

        var actions = [],
            // maxActions = 1000,   // not clear if really wanted/needed...
            currentAction = 0,
            groupLevel = 0,
            currentGroupActions = [],
            enabled = true,
            processingUndoRedo = false;

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
            if (!enabled)
                this.clear();
        };

        this.startGroup = function () {
            // I don't think we really need complex structure with nested arrays here.
            // Once we start a group, undo will always undo everything within
            // Just using ++/-- so other code don't needs to take care whether or not grouping is already active...
            groupLevel++;
        };

        this.endGroup = function () {

            if (!groupLevel) {
                Utils.error('OXOUndoManager.endGroup(): not in undo group!');
                return;
            }

            groupLevel--;

            if (groupLevel === 0) {
                actions.push(currentGroupActions);
                currentAction = actions.length;
                currentGroupActions = [];
            }
        };

        this.isInUndo = function () {
            return processingUndoRedo;
        };

        this.addUndo = function (oxoUndoAction) {

            if (this.isInUndo()) {
                Utils.error('OXOUndoManager.addUndo(): creating undo while processing undo!');
                return;
            }

            var tryToMerge = true;

            // remove undone actions
            if (currentAction < actions.length) {
                actions.splice(currentAction);
                tryToMerge = false;
            }

            if (groupLevel) {
                currentGroupActions.push(oxoUndoAction);
            }
            else {
                var bDone = false;
                if (tryToMerge && currentAction && oxoUndoAction.allowMerge) {
                    var prevUndo = actions[currentAction - 1];
                    if (prevUndo.allowMerge && (prevUndo.redoOperation.name === oxoUndoAction.redoOperation.name)) {
                        if (oxoUndoAction.redoOperation.name === 'insertText') {
                            if (isSameParagraph(oxoUndoAction.redoOperation.start, prevUndo.redoOperation.start, false)) {
                                var nCharPosInArray = prevUndo.redoOperation.start.length - 1;
                                var prevCharEnd = prevUndo.redoOperation.start[nCharPosInArray] + prevUndo.redoOperation.text.length;
                                if (prevCharEnd === oxoUndoAction.redoOperation.start[nCharPosInArray]) {
                                    var lastChar = prevUndo.redoOperation.text[prevUndo.redoOperation.text.length - 1];     // text len can't be 0 in undo action...
                                    if (lastChar !== ' ') {
                                        // Merge Undo...
                                        prevUndo.redoOperation.text +=  oxoUndoAction.redoOperation.text;
                                        prevUndo.undoOperation.end[nCharPosInArray] += oxoUndoAction.redoOperation.text.length;
                                        bDone = true;
                                    }
                                }
                            }
                        }
                    }
                }
                if (!bDone)
                    actions.push(oxoUndoAction);
                currentAction = actions.length;
            }
        };

        this.hasUndo = function () {
            return currentAction > 0 ? true : false;
        };

        this.undo = function (editor) {

            if (!this.hasUndo())
                return;

            processingUndoRedo = true;
            var action = actions[--currentAction];
            if (_.isArray(action)) {
                for (var i = action.length; i;) {
                    action[--i].undo(editor);
                }
            }
            else {
                action.undo(editor);
            }
            processingUndoRedo = false;
        };

        this.hasRedo = function () {
            return currentAction < actions.length ? true : false;
        };

        this.redo = function (editor) {

            if (!this.hasRedo())
                return;

            processingUndoRedo = true;
            var action = actions[currentAction++];
            if (_.isArray(action)) {
                _.invoke(action, "redo", editor);
            }
            else {
                action.redo(editor);
            }
            processingUndoRedo = false;
        };

    };

   // exports ================================================================

    return Undo;

});
