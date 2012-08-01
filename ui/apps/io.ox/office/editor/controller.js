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

define('io.ox/office/editor/controller', ['io.ox/office/tk/controller'], function (BaseController) {

    'use strict';

    // class Controller =======================================================

    function Controller(app) {

        var // self reference
            self = this,
            // current editor
            editor = app.getEditor(),

            // all the little controller items
            items = {
                'action/undo': {
                    enable: function () { return editor.hasUndo(); },
                    set: function () { editor.undo(); }
                },
                'action/redo': {
                    enable: function () { return editor.hasRedo(); },
                    set: function () { editor.redo(); }
                },
                'action/search': {
                    set: function (query) { editor.search(query); }
                },

                'insert/table': {
                    set: function (size) { editor.insertTable(size); },
                    done: function () { this.change('view/toolbars/show', 'table'); }
                },

                'format/character/font/family': {
                    get: function () { return editor.getAttribute('fontname'); }
                },
                'format/character/font/height': {
                    get: function () { return editor.getAttribute('fontsize'); }
                },
                'format/character/font/bold': {
                    get: function () { return editor.getAttribute('bold'); },
                    set: function (state) { editor.setAttribute('bold', state); }
                },
                'format/character/font/italic': {
                    get: function () { return editor.getAttribute('italic'); },
                    set: function (state) { editor.setAttribute('italic', state); }
                },
                'format/character/font/underline': {
                    get: function () { return editor.getAttribute('underline'); },
                    set: function (state) { editor.setAttribute('underline', state); }
                },

                'format/paragraph/alignment': {
                },

                'table/insert/row': {
                    enable: function () { return editor.isPositionInTable(); },
                    set: function () { editor.insertTableRow(); }
                },
                'table/insert/column': {
                    enable: function () { return editor.isPositionInTable(); },
                    set: function () { editor.insertTableColumn(); }
                },
                'table/delete/row': {
                    enable: function () { return editor.isPositionInTable(); },
                    set: function () { editor.deleteTableRow(); }
                },
                'table/delete/column': {
                    enable: function () { return editor.isPositionInTable(); },
                    set: function () { editor.deleteTableColumn(); }
                },

                'debug/toggle': {
                    get: function () { return app.isDebugMode(); },
                    set: function (state) { app.setDebugMode(state); },
                    done: function (state) { app.getEditor().grabFocus(); }
                }
            };

        // private methods ----------------------------------------------------

        /**
         * The controller done handler that will be executed after an item
         * setter function (of items without own done handler), and after a
         * view component triggers a 'cancel' event.
         */
        function doneHandler() {
            editor.grabFocus();
        }

        // base constructor ---------------------------------------------------

        BaseController.call(this, items, doneHandler);

        // methods ------------------------------------------------------------

        /**
         * Registers a new editor instance. If the editor has the browser
         * focus, this controller will use it as target for item actions
         * triggered by any registered view component.
         */
        this.registerEditor = function (newEditor, supportedItems) {
            newEditor
                .on('focus', function (event, focused) {
                    if (focused && (editor !== newEditor)) {
                        editor = newEditor;
                        self.enableAndDisable(supportedItems).update();
                    }
                })
                .on('operation', function () {
                    self.update(/^(action|format|table)\//);
                })
                .on('selectionChanged', function () {
                    self.update(/^(format|table)\//);
                });
            return this;
        };

    } // class Controller

    // exports ================================================================

    // derive this class from class BaseController
    return BaseController.extend({ constructor: Controller });

});
