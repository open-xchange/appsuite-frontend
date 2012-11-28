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
     'io.ox/office/editor/position',
     'io.ox/office/editor/operations'
    ], function (Utils, Position, Operations) {

    'use strict';

    // class Action ===========================================================

    /**
     * An instance of Action is used by the undo manager to store undo and redo
     * operations and to apply them in the editor.
     *
     * @constructor
     *
     * @param {Object|Object[]} [undoOperations]
     *  One ore more operations that form a logical undo action. When the undo
     *  action is executed, the operations will be applied in the exact order
     *  as passed in this parameter; they will NOT be applied in reversed order
     *  as it would be the case if the operations have been added in multiple
     *  undo actions. The parameter may be a single operation object, an array
     *  of operation objects, or omitted.
     *
     * @param {Object|Object[]} [redoOperations]
     *  One ore more operations that form a logical redo action. When the redo
     *  action is executed, the operations will be applied in the exact order
     *  as passed in this parameter. The parameter may be a single operation
     *  object, an array of operation objects, or omitted.
     */
    function Action(undoOperations, redoOperations) {
        this.undoOperations = [];
        this.redoOperations = [];
        this.appendOperations(undoOperations, redoOperations);
    }

    /**
     * Appends the passed undo and redo operations to the own operations
     * arrays. Undo operations will be inserted at the beginning of the undo
     * operations array, and redo operations will be appended to the redo
     * operations array.
     */
    Action.prototype.appendOperations = function (undoOperations, redoOperations) {

        // add the undo operations at the beginning of the array
        if (_.isArray(undoOperations)) {
            this.undoOperations = _.copy(undoOperations, true).concat(this.undoOperations);
        } else if (_.isObject(undoOperations)) {
            this.undoOperations.unshift(_.copy(undoOperations, true));
        }

        // add the redo operations at the end of the array
        if (_.isArray(redoOperations)) {
            this.redoOperations = this.redoOperations.concat(_.copy(redoOperations, true));
        } else if (_.isObject(redoOperations)) {
            this.redoOperations.push(_.copy(redoOperations, true));
        }
    };

    /**
     * Returns whether this action is an 'insertText' action (an action with a
     * 'insertText' redo operation and a 'deleteText' undo operation).
     *
     * @param {Boolean} single
     *  If true, the action must contain exactly one 'deleteText' undo
     *  operation and exactly one 'insertText' redo operation. Otherwise, the
     *  last operations of the arrays are checked, and the arrays may contain
     *  other operations.
     */
    Action.prototype.isInsertTextAction = function (single) {
        return (single ? (this.undoOperations.length === 1) : (this.undoOperations.length >= 1)) && (_.first(this.undoOperations).name === Operations.TEXT_DELETE) &&
            (single ? (this.redoOperations.length === 1) : (this.redoOperations.length >= 1)) && (_.last(this.redoOperations).name === Operations.TEXT_INSERT);
    };

    /**
     * Tries to merge this action with the passed action. Merging works only
     * if both actions represent a single 'insertText' operation, and the
     * passed action appends a single character directly after the text of this
     * action.
     *
     * @param {Operation} nextAction
     *  The action that will be tried to merge into this action.
     *
     * @returns {Boolean}
     *  Whether the passed action has been merged successfully into this
     *  action.
     */
    Action.prototype.tryMergeInsertCharacter = function (nextAction) {

        var // check if this and the passed action is an 'insertText' action
            validActions = this.isInsertTextAction(false) && nextAction.isInsertTextAction(true),

            // the redo operation of this action and the passed action
            thisRedo = _.last(this.redoOperations),
            nextRedo = nextAction.redoOperations[0];

        // check that the operations are valid for merging the actions
        if (validActions && (nextRedo.text.length === 1) && Position.hasSameParentComponent(thisRedo.start, nextRedo.start)) {

            // check that the new action adds the character directly after the text of this action and does not change the attributes
            if ((_.last(thisRedo.start) + thisRedo.text.length === _.last(nextRedo.start)) && !('attrs' in nextRedo)) {

                // check that the last character of this action is not a space character (merge actions word by word)
                if (thisRedo.text.substr(-1) !== ' ') {

                    // merge undo operation (delete one more character)
                    this.undoOperations[0].end[this.undoOperations[0].end.length - 1] += 1;
                    // merge redo operation (add the character)
                    thisRedo.text += nextRedo.text;
                    return true;
                }
            }
        }
        return false;
    };

    /**
     * Applies the undo operations of this action at the passed editor.
     */
    Action.prototype.undo = function (editor) {
        // Doc is being modified, so we need to notify/transfer/merge this operation. Is there a better way for undo?
        editor.applyOperations(this.undoOperations);
    };

    /**
     * Applies the redo operations of this action at the passed editor.
     */
    Action.prototype.redo = function (editor) {
        editor.applyOperations(this.redoOperations);
    };

    // class UndoManager ======================================================

    /**
     * The undo manager is used by the editor to administer the operation
     * handling concerning undo and redo. Also the grouping and merging of
     * operations is a task of the undo manager.
     *
     * @constructor
     *
     * @param {Editor} editor
     *  The editor instance where undo and redo operations will be applied.
     */
    function UndoManager(editor) {

        var // all undo actions
            actions = [],

            // maxActions = 1000,   // not clear if really wanted/needed...

            // index of the next redo action in the 'actions' array
            currentAction = 0,

            // number of nested action groups
            groupLevel = 0,

            // current undo action in grouped mode
            groupAction = null,

            // whether undo manager is currently enabled
            enabled = true,

            // whether undo or redo operations are currently processed
            processing = false;

        // private methods ----------------------------------------------------

        function pushAction(action) {

            var // last action on action stack
                lastAction = null;

            // truncate main undo stack and push the new action
            if (currentAction < actions.length) {

                // remove undone actions, push new action without merging
                actions.splice(currentAction);

            } else {

                // try to merge with last action, if stack has not been truncated
                lastAction = _.last(actions);

                // try to merge an 'insertText' operation for a single character with the last action on stack
                if (_.isObject(lastAction) && _.isFunction(lastAction.tryMergeInsertCharacter) && lastAction.tryMergeInsertCharacter(action)) {
                    return;
                }
            }

            actions.push(action);
            currentAction = actions.length;
        }

        function startActionGroup() {
            groupLevel += 1;
        }

        function endActionGroup() {
            groupLevel -= 1;
            // push existing group action to action stack on last group level
            if ((groupLevel === 0) && groupAction) {
                pushAction(groupAction);
                groupAction = null;
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Clears the entire undo stack.
         *
         * @returns {UndoManager}
         *  A reference to this instance.
         */
        this.clear = function () {
            actions = [];
            currentAction = 0;
            return this;
        };

        /**
         * Returns whether the undo manager is enabled and currently not
         * processing undo or redo operations.
         *
         * @returns {Boolean}
         *  Whether the undo manager is enabled.
         */
        this.isEnabled = function () {
            return enabled && !processing;
        };

        /**
         * Enables or disables the undo manager.
         *
         * @param {Boolean} state
         *  Whether to enable or disable the undo manager.
         *
         * @returns {UndoManager}
         *  A reference to this instance.
         */
        this.enable = function (state) {
            enabled = state;
            if (!enabled) {
                this.clear();
            }
            return this;
        };

        /**
         * Opens an undo group. All undo operations added while an undo group
         * is open will be collected and act like a single undo action. Can be
         * called repeatedly. Every call of this method must be followed by a
         * matching call of the method UndoManager.endGroup().
         *
         * @deprecated
         *  Use method UndoManager.enterGroup() instead.
         */
        this.startGroup = function () {
            startActionGroup();
        };

        /**
         * Closes an undo group that has been opened with the method
         * UndoManager.startGroup() before.
         *
         * @deprecated
         *  Use method UndoManager.enterGroup() instead.
         */
        this.endGroup = function () {
            if (groupLevel > 0) {
                endActionGroup();
            } else {
                Utils.error('UndoManager.endGroup(): not in undo group!');
            }
        };

        /**
         * Opens an undo action group and executes the specified callback
         * function. All undo operations added by the callback function will be
         * collected in the action group and act like a single undo action.
         * Nested calls are supported.
         *
         * @param {Function} callback
         *  The callback function that will be executed while the undo action
         *  group is open.
         *
         * @param {Object} [context]
         *  The context the callback function will be bound to.
         */
        this.enterGroup = function (callback, context) {
            startActionGroup();
            try {
                callback.call(context);
            } finally {
                endActionGroup();
            }
        };

        /**
         * Creates a new undo action that will apply the passed undo and redo
         * operations in the editor.
         *
         * @constructor
         *
         * @param {Object|Object[]} [undoOperations]
         *  One ore more operations that form a logical undo action. When the
         *  undo action is executed, the operations will be applied in the
         *  exact order as passed in this parameter; they will NOT be applied
         *  in reversed order as would be the case if the operations had been
         *  added in multiple undo actions. The parameter may be a single
         *  operation object, an array of operation objects, or omitted.
         *
         * @param {Object|Object[]} [redoOperations]
         *  One ore more operations that form a logical redo action. When the
         *  redo action is executed, the operations will be applied in the
         *  exact order as passed in this parameter. The parameter may be a
         *  single operation object, an array of operation objects, or omitted.
         *
         * @returns {UndoManager}
         *  A reference to this instance.
         */
        this.addUndo = function (undoOperations, redoOperations) {

            // check that undo manager is valid and either undo or redo operations have been passed
            if (this.isEnabled() && (_.isObject(undoOperations) || _.isObject(redoOperations))) {

                if (groupLevel > 0) {
                    // active group action: insert operations into its operation arrays
                    if (groupAction) {
                        groupAction.appendOperations(undoOperations, redoOperations);
                    } else {
                        groupAction = new Action(undoOperations, redoOperations);
                    }
                } else {
                    // create and insert a new action
                    pushAction(new Action(undoOperations, redoOperations));
                }
            }

            return this;
        };

        /**
         * Returns the number of undo actions available on the undo stack.
         */
        this.undoAvailable = function () {
            return currentAction;
        };

        /**
         * Executes the specified number of undo actions.
         *
         * @param {Number} [count=1]
         *  The number of undo actions to be executed.
         */
        this.undo = function (count) {
            processing = true;
            try {
                count = _.isNumber(count) ? count : 1;
                while ((currentAction > 0) && (count > 0)) {
                    currentAction -= 1;
                    actions[currentAction].undo(editor);
                    count -= 1;
                }
            } finally {
                processing = false;
            }
        };

        /**
         * Returns the number of redo actions available on the redo stack.
         */
        this.redoAvailable = function () {
            return actions.length - currentAction;
        };

        /**
         * Executes the specified number of redo actions.
         *
         * @param {Number} [count=1]
         *  The number of redo actions to be executed.
         */
        this.redo = function (count) {
            processing = true;
            try {
                count = _.isNumber(count) ? count : 1;
                while ((currentAction < actions.length) && (count > 0)) {
                    actions[currentAction].redo(editor);
                    currentAction += 1;
                    count -= 1;
                }
            } finally {
                processing = false;
            }
        };

    } // class UndoManager

   // exports =================================================================

    return UndoManager;

});
