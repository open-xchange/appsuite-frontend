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

define('io.ox/office/controller', ['io.ox/office/tk/controller'], function (BaseController) {

    'use strict';

    // class Controller =======================================================

    function Controller(app) {

        var // current editor
            editor = app.getEditor(),

            // all the little controller items
            items = {
                'action/undo': {
                    enable: function () { return editor.hasUndo(); },
                    set: function () { editor.undo(); editor.grabFocus(); }
                },
                'action/redo': {
                    enable: function () { return editor.hasRedo(); },
                    set: function () { editor.redo(); editor.grabFocus(); }
                },

                'insert/table': {
                    set: function (size) { editor.insertTable(size); editor.grabFocus(); }
                },

                'character/font/bold': {
                    get: function () { return editor.getAttribute('bold'); },
                    set: function (state) { editor.setAttribute('bold', state); editor.grabFocus(); }
                },
                'character/font/italic': {
                    get: function () { return editor.getAttribute('italic'); },
                    set: function (state) { editor.setAttribute('italic', state); editor.grabFocus(); }
                },
                'character/font/underline': {
                    get: function () { return editor.getAttribute('underline'); },
                    set: function (state) { editor.setAttribute('underline', state); editor.grabFocus(); }
                },

                'paragraph/alignment': {
                    set: function (value) { editor.grabFocus(); }
                },

                'debug/toggle': {
                    get: function () { return app.isDebugMode(); },
                    set: function (state) { app.setDebugMode(state); app.getEditor().grabFocus(); }
                }
            };

        // private methods ----------------------------------------------------

        function cancelAction() {
            editor.grabFocus();
        }

        // base constructor ---------------------------------------------------

        BaseController.call(this, items, cancelAction);

        // methods ------------------------------------------------------------

        /**
         * Registers a new editor instance. If the editor has the browser
         * focus, this controller will use it as target for item actions
         * triggered by any registered view component.
         */
        this.registerEditor = function (newEditor, supportedItems) {
            newEditor
                .on('focus', _.bind(function (event, focused) {
                    if (focused && (editor !== newEditor)) {
                        editor = newEditor;
                        this.enableAndDisable(supportedItems).update();
                    }
                }, this))
                .on('operation', _.bind(function () {
                    this.update([/^action\//, /^character\//, /^paragraph\//]);
                }, this))
                .on('selectionChanged', _.bind(function () {
                    this.update([/^character\//, /^paragraph\//]);
                }, this));
            return this;
        };

    } // class Controller

    // exports ================================================================

    // derive this class from class BaseController
    return BaseController.extend({ constructor: Controller });

});
