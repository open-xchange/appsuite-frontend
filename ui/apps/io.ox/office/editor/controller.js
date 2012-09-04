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
                'action/export': {
                    set: function () { app.save(); }
                },
                'action/flush': {
                    set: function () { app.flush(); }
                },
                'action/download': {
                    set: function () { app.download(); }
                },
                'action/print': {
                    set: function () { app.print(); }
                },
                'action/rename': {
                    get: function () {
                        var fileDesc = app.getFileDescriptor();
                        return (fileDesc && fileDesc.filename) ? fileDesc.filename : null;
                    },
                    set: function (fileName) { app.rename(fileName); }
                },

                'action/undo': {
                    enable: function () { return editor.hasUndo(); },
                    set: function () { editor.undo(); }
                },
                'action/redo': {
                    enable: function () { return editor.hasRedo(); },
                    set: function () { editor.redo(); }
                },
                'action/search/quick': {
                    // highlighting goes always to the rich editor
                    get: function () { return app.getEditor().hasHighlighting(); },
                    set: function (query) { app.getEditor().quickSearch(query); },
                    done: $.noop // do not focus editor
                },

                'chain/format/paragraph': {
                    get: function () { return editor.getAttributes('paragraph'); }
                },
                'format/paragraph/stylesheet': {
                    chain: 'chain/format/paragraph',
                    get: function (attributes) { return attributes.style; },
                    set: function (styleId) { editor.setAttribute('paragraph', 'style', styleId); }
                },
                'format/paragraph/alignment': {
                    chain: 'chain/format/paragraph',
                    get: function (attributes) { return attributes.alignment; },
                    set: function (alignment) { editor.setAttribute('paragraph', 'alignment', alignment); }
                },
                'format/paragraph/lineheight': {
                    chain: 'chain/format/paragraph',
                    get: function (attributes) { return attributes.lineheight; },
                    set: function (lineHeight) { editor.setAttribute('paragraph', 'lineheight', lineHeight); }
                },

                'chain/format/character': {
                    get: function () { return editor.getAttributes('character'); }
                },
                'format/character/stylesheet': {
                    chain: 'chain/format/character',
                    get: function (attributes) { return attributes.style; },
                    set: function (styleId) { editor.setAttribute('character', 'style', styleId); }
                },
                'format/character/font/family': {
                    chain: 'chain/format/character',
                    get: function (attributes) { return attributes.fontname; },
                    set: function (fontName) { editor.setAttribute('character', 'fontname', fontName); }
                },
                'format/character/font/height': {
                    chain: 'chain/format/character',
                    get: function (attributes) { return attributes.fontsize; },
                    set: function (fontSize) { editor.setAttribute('character', 'fontsize', fontSize); }
                },
                'format/character/font/bold': {
                    chain: 'chain/format/character',
                    get: function (attributes) { return attributes.bold; },
                    set: function (state) { editor.setAttribute('character', 'bold', state); }
                },
                'format/character/font/italic': {
                    chain: 'chain/format/character',
                    get: function (attributes) { return attributes.italic; },
                    set: function (state) { editor.setAttribute('character', 'italic', state); }
                },
                'format/character/font/underline': {
                    chain: 'chain/format/character',
                    get: function (attributes) { return attributes.underline; },
                    set: function (state) { editor.setAttribute('character', 'underline', state); }
                },

                'chain/table': {
                    enable: function () { return editor.isPositionInTable(); }
                },
                'table/insert': {
                    set: function (size) { editor.insertTable(size); }
                },
                'table/insert/row': {
                    chain: 'chain/table',
                    set: function () { editor.copyRow(); }
                },
                'table/insert/column': {
                    chain: 'chain/table',
                    set: function () { editor.copyColumn(); }
                },
                'table/delete/row': {
                    chain: 'chain/table',
                    set: function () { editor.deleteRows(); }
                },
                'table/delete/column': {
                    chain: 'chain/table',
                    set: function () { editor.deleteColumns(); }
                },

                'chain/image': {
                    enable: function () { return editor.isImagePosition(); }
                },
                'image/delete': {
                    chain: 'chain/image',
                    enable: function (enabled) { return enabled && editor.isFloatedImagePosition(); },
                    set: function () { editor.deleteImage(); }
                },
                'image/alignment': {
                    chain: 'chain/image',
                    get: function () { return editor.getImageFloatMode(); },
                    set: function (alignment) { editor.setImageFloatMode(alignment); }
                },

                'debug/toggle': {
                    get: function () { return app.isDebugMode(); },
                    set: function (state) { app.setDebugMode(state); },
                    done: function (state) { app.getEditor().grabFocus(); }
                },
                'debug/sync': {
                    get: function () { return app.isSynchronizedMode(); },
                    set: function (state) { app.setSynchronizedMode(state); }
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
        this.registerEditor = function (newEditor, disabledItems) {
            newEditor
                .on('focus', function (event, focused) {
                    if (focused && (editor !== newEditor)) {
                        editor = newEditor;
                        self.enable().disable(disabledItems).update();
                    }
                })
                .on('operation selectionChanged', function () {
                    self.update();
                });
            return this;
        };

    } // class Controller

    // exports ================================================================

    // derive this class from class BaseController
    return BaseController.extend({ constructor: Controller });

});
